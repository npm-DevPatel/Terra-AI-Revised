"""
lens/routes.py — POST /api/lens/analyze

Terra Lens: vision-first land intelligence.
1. Accepts a site photo (base64) + optional lat/lng for geospatial enrichment
2. Sends photo to Google Vision API
3. Runs geospatial analysis (7 parallel calls) if coordinates provided
4. Synthesizes with Gemini
5. Saves result to Supabase `analyses` table (Gemini runs async)
6. Returns score + risk data immediately; Gemini narrative arrives via Realtime
"""
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from flask import Blueprint, jsonify, request

from core.auth import require_auth
from core.vision import analyze_site_photo
from core.gemini import synthesize_lens_report
from core.supabase import get_service_client
from runtime_cache import TTLCache

from spatial.soil import fetch_soil_data
from spatial.elevation import fetch_elevation_data, fetch_gee_landcover
from spatial.groundwater import query_groundwater
from spatial.maps import fetch_maps_data
from spatial.overpass import fetch_overpass_data
from spatial.shapely_engine import compute_risks
from spatial.zones import compute_zone_risks

bp = Blueprint("lens", __name__)

KENYA_LAT_MIN, KENYA_LAT_MAX = -5.0, 5.0
KENYA_LNG_MIN, KENYA_LNG_MAX = 33.9, 41.9

_CACHE = TTLCache[dict](ttl_seconds=21_600, max_entries=256)


def _cache_key(lat: float, lng: float) -> str:
    return f"{round(lat, 4):.4f}:{round(lng, 4):.4f}"


def _risk_label(score: int) -> str:
    if score >= 80:
        return "SAFE"
    if score >= 50:
        return "MODERATE WARNINGS"
    return "CRITICAL / HIGH RISK"


def _compute_deterministic_score(geo: dict) -> tuple[int, list[dict]]:
    """Score 0-100 from hard geospatial data. Deduct only for genuine build blockers."""
    score = 100
    deductions = []

    def deduct(reason: str, pts: int):
        nonlocal score
        score -= pts
        deductions.append({"reason": reason, "points": pts})

    if geo.get("flood_history"):
        deduct("Flood history (JRC)", 20)
    if geo.get("riparian_breach"):
        deduct("Riparian breach — 30m NEMA buffer", 20)
    if geo.get("demolition_risk"):
        deduct("Demolition risk — KeNHA/SGR buffer", 25)
    if geo.get("protected_land_risk"):
        deduct("Protected land", 20)
    if geo.get("aviation_height_restriction"):
        deduct("KCAA aviation height cap", 10)
    if geo.get("is_topographical_sinkhole"):
        deduct("Topographical sinkhole", 8)
    if geo.get("seasonal_water"):
        deduct("Seasonal water risk", 8)
    if geo.get("road_reserve_risk"):
        deduct("Road reserve encroachment", 10)
    if (geo.get("groundwater") or {}).get("water_scarcity_risk"):
        deduct("Groundwater scarcity", 5)

    score = max(0, score)
    return score, deductions


def _save_to_supabase(analysis_id: str, project_id: str, user_id: str,
                      payload: dict, score: int, label: str, address: str,
                      lat: float, lng: float, title: str):
    """Save geospatial result immediately; Gemini narrative added asynchronously."""
    sb = get_service_client()
    if not sb:
        return
    try:
        sb.table("analyses").insert({
            "id": analysis_id,
            "project_id": project_id,
            "created_by": user_id,
            "lat": lat,
            "lng": lng,
            "address": address,
            "raw_result": payload,
            "score": score,
            "label": label,
            "title": title or address or f"Analysis {analysis_id[:8]}",
            "gemini_done": False,
        }).execute()
    except Exception as exc:
        print(f"[Lens] DB save failed (non-fatal): {exc}")


def _async_gemini_and_update(analysis_id: str, payload: dict):
    """Run Gemini synthesis in background thread, then update the analyses row."""
    try:
        report = synthesize_lens_report(payload)
        sb = get_service_client()
        if not sb or report.get("gemini_failed"):
            return
        merged = {**payload, "gemini_report": report}
        sb.table("analyses").update({
            "raw_result": merged,
            "gemini_done": True,
        }).eq("id", analysis_id).execute()
    except Exception as exc:
        print(f"[Lens] Async Gemini update failed (non-fatal): {exc}")


@bp.route("/api/lens/analyze", methods=["POST"])
def analyze():
    user_id, raw_jwt, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    photo_b64 = body.get("photo_base64")
    lat = body.get("lat")
    lng = body.get("lng")
    project_id = body.get("project_id")
    title = body.get("title", "")

    if not photo_b64:
        return jsonify({"error": "photo_base64 is required."}), 400

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400

    # ── Vision analysis (always runs) ────────────────────────────────────────
    vision_result = analyze_site_photo(photo_b64)

    # ── Geospatial analysis (only if coordinates provided) ───────────────────
    geo = {}
    if lat is not None and lng is not None:
        lat, lng = float(lat), float(lng)

        if not (KENYA_LAT_MIN <= lat <= KENYA_LAT_MAX and KENYA_LNG_MIN <= lng <= KENYA_LNG_MAX):
            return jsonify({"error": "Coordinates outside Kenya bounding box."}), 400

        cache_key = _cache_key(lat, lng)
        cached = _CACHE.get(cache_key)
        if cached:
            geo = cached
        else:
            tasks = {
                "soil":       lambda: fetch_soil_data(lat, lng),
                "elevation":  lambda: fetch_elevation_data(lat, lng),
                "landcover":  lambda: fetch_gee_landcover(lat, lng),
                "groundwater": lambda: query_groundwater(lat, lng),
                "maps":       lambda: fetch_maps_data(lat, lng),
                "overpass":   lambda: fetch_overpass_data(lat, lng),
                "zones":      lambda: compute_zone_risks(lat, lng),
            }

            results: dict = {}
            with ThreadPoolExecutor(max_workers=7) as ex:
                futures = {ex.submit(fn): name for name, fn in tasks.items()}
                for fut in as_completed(futures):
                    name = futures[fut]
                    try:
                        results[name] = fut.result()
                    except Exception as exc:
                        print(f"[Lens] {name} failed (non-fatal): {exc}")
                        results[name] = {}

            geo = {
                **results.get("soil", {}),
                **results.get("elevation", {}),
                **results.get("landcover", {}),
                **results.get("maps", {}),
                **results.get("overpass", {}),
                **results.get("zones", {}),
                "groundwater": results.get("groundwater", {}),
                "coordinates": {"lat": lat, "lng": lng},
            }

            # Shapely riparian check (synchronous — uses local shapefile)
            try:
                geo.update(compute_risks(lat, lng))
            except Exception as exc:
                print(f"[Lens] Shapely compute_risks failed (non-fatal): {exc}")

            _CACHE.set(cache_key, geo)

    # ── Deterministic scoring ────────────────────────────────────────────────
    score, deductions = _compute_deterministic_score(geo)
    label = _risk_label(score)

    address = geo.get("address") or geo.get("place_name") or ""

    # ── Assemble full payload for Gemini ────────────────────────────────────
    payload = {
        **geo,
        "vision_analysis": vision_result,
        "_deterministic_score": score,
        "_deterministic_label": label,
        "_score_deductions": deductions,
    }

    # ── Persist to DB immediately ────────────────────────────────────────────
    import uuid
    analysis_id = str(uuid.uuid4())
    _save_to_supabase(analysis_id, project_id, user_id, payload, score, label, address,
                      lat or 0.0, lng or 0.0, title)

    # ── Fire Gemini async (non-blocking) ─────────────────────────────────────
    t = threading.Thread(target=_async_gemini_and_update, args=(analysis_id, payload), daemon=True)
    t.start()

    # ── Return immediately ───────────────────────────────────────────────────
    return jsonify({
        "analysis_id": analysis_id,
        "score": score,
        "label": label,
        "address": address,
        "risk_flags_count": sum(1 for d in deductions),
        "key_risks": [d["reason"] for d in deductions],
        "vision": {
            "construction_detected": vision_result.get("construction_detected", False),
            "vegetation_type": vision_result.get("vegetation_type"),
            "water_signals": vision_result.get("water_signals", False),
            "labels": [l["description"] for l in vision_result.get("labels", [])[:5]],
            "text_on_site": vision_result.get("text_on_site", []),
        },
        "geospatial_available": bool(lat is not None),
        "gemini_done": False,
        "message": "Analysis saved. Gemini narrative will arrive in ~10s via Supabase Realtime.",
    })
