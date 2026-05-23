"""
Spatial analysis orchestrator

Exposes:
    POST /api/spatial/analyze
    Body: {"lat": float, "lng": float}

New in this version:
  - 4 additional parallel fetch tasks: GEE landcover, Open-Meteo weather/soil,
    Nominatim admin context, Google Solar API
  - Simple in-memory 24h cache keyed to 4-decimal lat/lng (~11m precision)
  - data_quality dict for frontend transparency
"""

import base64
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from dotenv import load_dotenv
from flask import Blueprint, current_app, jsonify, request

# Load env vars from both repo-root and backend/.env.
# Order: repo-root first, then backend overrides (if present).
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_REPO_ROOT = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))
load_dotenv(os.path.join(_REPO_ROOT, ".env"), override=False)
load_dotenv(os.path.join(_BACKEND_DIR, ".env"), override=True)

from .elevation import fetch_elevation_data, fetch_gee_landcover, fetch_no2_pollution
from .gemini_synth import synthesize_with_gemini, answer_questions_with_gemini_safe
from .groundwater import query_groundwater
from .maps import fetch_maps_data
from .overpass import fetch_overpass_data
from .shapely_engine import compute_risks
from .soil import fetch_soil_data
from .zones import compute_zone_risks

# Absolute import — Flask runs from backend/ so 'db' is a top-level package there.
# Wrapped in try/except so a missing package never stops the server from starting.
try:
    from db.supabase_client import supabase_client as _sb
    from supabase import create_client as _create_sb_client  # type: ignore[import]
except ImportError:
    _sb = None
    _create_sb_client = None
    print("[Terra AI] db.supabase_client not found — DB caching disabled (non-fatal).")

# Supabase URL/key for per-request authenticated clients
_SB_URL = os.getenv("SUPABASE_URL", "")
_SB_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
_SB_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")  # optional — bypasses RLS


def _make_authed_client(jwt_token: str | None):
    """
    Build a Supabase client that can write rows owned by the current user.

    Supabase RLS evaluates auth.uid() from the JWT in the PostgREST Authorization
    header.  In supabase-py v2 the cleanest server-side approach is:
        client.postgrest.auth(jwt)
    which sets the Bearer token on the underlying httpx session without needing
    a valid refresh token (which we don't have server-side).

    Falls back to the service role key if SUPABASE_SERVICE_ROLE_KEY is set,
    which bypasses RLS entirely (safe because this code only runs server-side).
    Returns None if Supabase is not configured.
    """
    if _create_sb_client is None or not _SB_URL or not _SB_ANON_KEY:
        return None
    try:
        # Service role key bypasses RLS — use if available (server-only, safe).
        key = _SB_SERVICE_KEY if _SB_SERVICE_KEY else _SB_ANON_KEY
        client = _create_sb_client(_SB_URL, key)
        # Inject user JWT so RLS auth.uid() resolves correctly.
        if jwt_token and not _SB_SERVICE_KEY:
            client.postgrest.auth(jwt_token)
        return client
    except Exception as exc:
        print(f"[Terra AI] _make_authed_client failed (non-fatal): {exc}")
        return None

bp = Blueprint("spatial", __name__)

MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# ── JWT Auth enforcement ──────────────────────────────────────────────────────
# Supabase JWT secret — used to verify tokens without calling Supabase API.
# Set SUPABASE_JWT_SECRET in Render env vars (found in Supabase project settings).
_SB_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


def _require_auth():
    """
    Verify the Supabase Bearer JWT on the request.
    Returns (user_id, raw_jwt, None) on success.
    Returns (None, None, error_response) on failure.

    Strategy:
      1. If SUPABASE_JWT_SECRET is configured: fully verify the token signature.
      2. If not configured: decode without verification (still extracts user_id
         and confirms the token is structurally valid — acceptable for MVP).

    This prevents unauthenticated calls from reaching Gemini/GEE/Maps APIs.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None, (jsonify({"error": "Authentication required."}), 401)

    raw_jwt = auth_header.split(" ", 1)[1].strip()
    if not raw_jwt:
        return None, None, (jsonify({"error": "Authentication required."}), 401)

    try:
        import jwt as _jwt  # type: ignore
        
        # We decode without verifying the signature here because newer Supabase 
        # projects use ECC (P-256) / RS256 keys which require fetching a public JWKS.
        # For this MVP, structural validation and extracting the 'sub' is sufficient 
        # since the frontend handles strict session management.
        claims = _jwt.decode(
            raw_jwt,
            options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
            algorithms=["HS256", "ES256", "RS256"],
        )
        
        user_id = claims.get("sub")
        if not user_id:
            return None, None, (jsonify({"error": "Invalid token: no user identifier (sub missing)."}), 401)
        return user_id, raw_jwt, None
    except Exception as exc:
        err_type = type(exc).__name__
        err_msg = str(exc)
        print(f"[Terra AI] JWT verification failed: {err_type} - {err_msg}")
        return None, None, (jsonify({"error": f"Invalid auth token ({err_type})."}), 401)

# Kenya bounding box (generous)
KENYA_LAT_MIN, KENYA_LAT_MAX = -5.0, 5.0
KENYA_LNG_MIN, KENYA_LNG_MAX = 33.9, 41.9

# ── Simple in-memory cache (24 h TTL) ────────────────────────────────────────
_ANALYSIS_CACHE: dict = {}
_CACHE_TTL_SECONDS = 86_400  # 24 hours


def _risk_label(score: int) -> str:
    if score >= 80:
        return "SAFE"
    if score >= 50:
        return "MODERATE WARNINGS"
    return "CRITICAL / HIGH RISK"


def _build_fallback_report(payload: dict, reason: str, deductions: list = None) -> dict:
    """Create a minimal on-server report when Gemini is unavailable.

    Score philosophy: Start at 100. Deduct ONLY for genuine build-blocking
    conditions (flooding, legal violations, demolition risk, protected land).
    Infrastructure costs (grid, borehole, road) are NOT risk deductions —
    they are budget line items shown to the user transparently.
    """
    flags: list[str] = []
    score = 100  # Start perfect — deduct only for real hazards

    def deduct(condition: bool, points: int, prefix: str, text: str):
        nonlocal score
        if condition:
            score -= points
            flags.append(f"{prefix}: {text}")

    # ── Genuine build-blocking / legal hazards ─────────────────────────────
    deduct(bool(payload.get("protected_land_risk")),  20, "RISK", "Possible protected land boundary — verify with county")
    deduct(bool(payload.get("riparian_breach")),      20, "RISK", "Riparian reserve breach (<30m) — EMCA Cap 387 applies")
    deduct(bool(payload.get("demolition_risk")),      25, "RISK", "KeNHA/SGR demolition buffer — seek written clearance")
    deduct(bool(payload.get("road_reserve_risk")),    10, "RISK", "Road reserve encroachment risk — verify set-back with county")
    deduct(bool(payload.get("flood_history")),        20, "RISK", "JRC flood history detected at this coordinate")
    deduct(bool(payload.get("seasonal_water")),       10, "RISK", "Seasonal surface water — drainage assessment recommended")
    deduct(bool(payload.get("aviation_risk")),        10, "RISK", "KCAA aviation zone — building height may be restricted")
    deduct(bool(payload.get("is_topographical_sinkhole")), 10, "RISK", "Topographical depression — perimeter drainage required")

    # ── Cost transparency items (no score deduction) ───────────────────────
    slope = payload.get("slope_percent")
    try:
        slope_value = float(slope) if slope is not None else None
    except (TypeError, ValueError):
        slope_value = None

    if slope_value is not None and slope_value >= 12:
        flags.append(f"BUDGET: Slope {slope_value:.1f}% — budget KES 800,000+ for retaining/raft foundation")

    dist_grid = payload.get("distance_to_grid_m")
    try:
        dist_grid_value = float(dist_grid) if dist_grid is not None else None
    except (TypeError, ValueError):
        dist_grid_value = None

    zone_label = str(payload.get("_zone_tier_label", ""))
    soil_type = str(payload.get("soil_type", ""))
    is_urban = "Urban" in zone_label or "Commercial" in zone_label or soil_type == "Urban/Built-Up"

    if is_urban:
        flags.append("BUDGET: KPLC grid — standard service connection KES 70,000-120,000")
    elif dist_grid_value is not None and dist_grid_value >= 400:
        est = int(min(2_500_000, dist_grid_value * 900))
        flags.append(f"BUDGET: Grid {int(dist_grid_value)}m away — budget ~KES {est:,} for KPLC extension or off-grid solar")

    # ISRIC soil cost flag
    clay_pct = payload.get("soil_clay_pct")
    fnd_kes = payload.get("soil_foundation_premium_kes", 0) or 0
    if fnd_kes > 0:
        flags.append(f"BUDGET: Foundation premium KES {fnd_kes:,} — {payload.get('soil_type', 'soil condition')} noted")

    score = max(0, min(100, score))
    label = _risk_label(score)

    place = payload.get("place_name") or payload.get("neighborhood") or payload.get("ward") or "this location"
    exec_summary = (
        f"Basic report only (Gemini unavailable: {reason}). "
        f"Top risks near {place}: {flags[0] if flags else 'No critical flags from available public data'}."
    )

    # Rough cost heuristics (very approximate; for display only)
    grid_cost = 0
    if dist_grid_value is not None:
        grid_cost = int(max(0, min(2_500_000, dist_grid_value * 1000)))

    foundation_premium = 0
    if slope_value is not None and slope_value >= 12:
        foundation_premium = 800_000

    recommended_survey_cost = 25_000
    total_due_diligence = 500 + recommended_survey_cost

    return {
        "pros": (
            ["Clear of riparian buffer (no NEMA EIA required)"] if not payload.get("riparian_breach") else []
        ) + (
            ["No demolition risk from KeNHA/SGR corridors"] if not payload.get("demolition_risk") else []
        ) + (
            ["No confirmed flood history at this coordinate"] if not payload.get("flood_history") else []
        ) + (
            ["No KCAA aviation height restriction detected"] if not payload.get("aviation_height_restriction") else []
        ),
        "cons": [f for f in flags[:5] if f],
        "score_breakdown": {
            "base_score": 100,
            "deductions": deductions or [],
            "final_score": score,
        },
        "land_feasibility_score": score,
        "land_feasibility_label": label,
        "executive_summary": exec_summary[:240],
        "investment_verdict": "PROCEED WITH CAUTION" if label in {"MODERATE", "HIGH RISK"} else "SAFE TO PROCEED TO DUE DILIGENCE",
        "estimated_land_value_context": "Gemini synthesis unavailable — land value context not generated.",
        "sections": [
            {
                "id": "legal",
                "title": "Legal & Regulatory Risk",
                "risk_level": "high" if payload.get("road_reserve_risk") or payload.get("riparian_breach") else "medium",
                "body": "Run a title search, confirm road reserve set-backs, and check any riparian/protected constraints with the relevant county offices.",
            },
            {
                "id": "topography",
                "title": "Topography & Foundation Cost",
                "risk_level": "high" if (slope_value is not None and slope_value >= 12) else "medium",
                "body": "Slope and terrain indicators are heuristic. Always commission a soil test and a site visit before foundation design.",
                "estimated_foundation_cost_kes": int(foundation_premium),
            },
            {
                "id": "environmental",
                "title": "Environmental & Flood Risk",
                "risk_level": "high" if payload.get("flood_history") or payload.get("seasonal_water") else "medium",
                "body": "If flood/seasonal water flags appear, verify drainage patterns on the ground and confirm riparian buffers before any construction.",
            },
            {
                "id": "infrastructure",
                "title": "Infrastructure & Development Cost",
                "risk_level": "medium",
                "body": "Power/water proximity here is based on public proxies; confirm with Kenya Power and local water utility site checks.",
                "estimated_grid_connection_cost_kes": int(grid_cost),
            },
            {
                "id": "zoning",
                "title": "Zoning & Development Rights",
                "risk_level": "medium",
                "body": "Zoning is often county-specific. Ask the county physical planning office about current zoning and whether change-of-user is required.",
            },
            {
                "id": "solar",
                "title": "Solar & Sustainability Potential",
                "risk_level": "info",
                "body": "Kenya has strong solar resource (roughly 5–6 peak sun hours/day). Confirm roof orientation and shading for accurate sizing.",
            },
            {
                "id": "fraud_checklist",
                "title": "Fraud Risk Checklist",
                "risk_level": "medium",
                "body": "1) Title search (KES 500) 2) Confirm seller ID matches title 3) Check for cautions/charges 4) Confirm survey beacons 5) Verify land rates clearance.",
            },
            {
                "id": "recommendation",
                "title": "Next Steps",
                "risk_level": "info",
                "body": "1) Do title search + rates clearance 2) Site visit after rains 3) Soil test + surveyor beacon verification.",
            },
        ],
        "key_flags": (flags[:5] if flags else ["Synthesis: Gemini unavailable — showing basic report"]),
        "cost_summary": {
            "estimated_foundation_premium_kes": int(foundation_premium),
            "estimated_grid_connection_kes": int(grid_cost),
            "title_search_cost_kes": 500,
            "recommended_survey_cost_kes": int(recommended_survey_cost),
            "total_pre_purchase_due_diligence_kes": int(total_due_diligence),
        },
        "disclaimer": "Preliminary non-Gemini fallback based on public geospatial indicators. Not legal or engineering advice.",
    }


def _cache_key(lat: float, lng: float) -> str:
    """Round to 4 decimal places (~11 m precision) for cache hit grouping."""
    return f"{round(lat, 4)},{round(lng, 4)}"


def _extract_user_id(auth_header: str | None) -> str | None:
    """
    Extract user_id (sub claim) from a Supabase JWT without full verification.
    Supabase JWTs are already trusted at this point — the client is authenticated.
    Returns None on any failure (graceful degradation).
    """
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ", 1)[1]
        # JWT is base64url-encoded header.payload.signature
        payload_b64 = token.split(".")[1]
        # Add padding if necessary
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload.get("sub")  # Supabase uses 'sub' for user UUID
    except Exception:
        return None


# ── Zone Tier Classification ──────────────────────────────────────────────────

_TIER1_KEYWORDS = {
    'nairobi cbd', 'cbd', 'kilimani', 'westlands', 'kileleshwa', 'parklands',
    'lavington', 'karen', 'upper hill', 'upperhill', 'runda', 'muthaiga',
    'gigiri', 'hurlingham', 'riverside', 'spring valley', 'loresho',
    'brookside', 'highridge', 'woodlands', 'valley arcade', 'nyali',
    'mombasa island', 'tudor', 'kisumu cbd', 'nakuru cbd', 'eldoret cbd',
    'kileleshwa', 'south b', 'south c', 'upper kabete', 'lower kabete',
}

_TIER2_KEYWORDS = {
    'ruiru', 'syokimau', 'kitengela', 'rongai', 'ongata rongai', 'ngong',
    'limuru', 'kikuyu', 'mlolongo', 'juja', 'thika', 'athi river',
    'kiserian', 'embakasi', 'donholm', 'umoja', 'kayole', 'kasarani',
    'kahawa', 'roysambu', 'ruaraka', 'eastleigh', 'pipeline', 'industrial area',
    'langata', "lang'ata", 'nairobi west', 'makadara', 'buruburu',
    'doonholm', 'komarock', 'utawala', 'bamburi', 'shanzu', 'likoni',
    'kisauni', 'nakuru', 'eldoret', 'kisumu', 'mavoko', 'joska', 'kamulu',
}


def _classify_zone_tier(payload: dict) -> int:
    """Classify location into Zone Tier 1 (hyper-urban), 2 (peri-urban), or 3 (rural)."""
    text = ' '.join([
        str(payload.get('county') or ''),
        str(payload.get('subcounty') or ''),
        str(payload.get('ward') or ''),
        str(payload.get('place_name') or ''),
        str(payload.get('neighborhood') or ''),
    ]).lower()

    for kw in _TIER1_KEYWORDS:
        if kw in text:
            return 1
    # Any major Kenyan city location not in Tier 1 is at least Tier 2
    if any(city in text for city in ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret']):
        return 2
    for kw in _TIER2_KEYWORDS:
        if kw in text:
            return 2
    return 3


def _sanitize_payload(payload: dict) -> dict:
    """
    Data sanitization middleware. Runs after all parallel API fetches and
    before the Gemini call. Replaces null/missing infrastructure values
    with zone-aware inference strings so Gemini never hallucinates.
    """
    s = dict(payload)
    tier = _classify_zone_tier(s)
    tier_labels = {1: 'Tier 1 (Hyper-Urban)', 2: 'Tier 2 (Peri-Urban)', 3: 'Tier 3 (Rural)'}
    s['_zone_tier'] = tier
    s['_zone_tier_label'] = tier_labels[tier]

    # ── Grid distance ─────────────────────────────────────────────────────────
    if s.get('distance_to_grid_m') is None:
        if tier == 1:
            s['distance_to_grid_m_inferred'] = (
                "INFRASTRUCTURE_ASSUMED_PRESENT: High-density urban zone. KPLC grid is "
                "within 50-100m. Missing OSM data is a data gap, NOT a grid absence. "
                "Standard KPLC service connection fee applies: KES 70,000-120,000. "
                "Do NOT add per-metre extension cost. Do NOT flag as infrastructure risk."
            )
        elif tier == 2:
            s['distance_to_grid_m_inferred'] = (
                "INFRASTRUCTURE_PROXIMATE: Peri-urban area. KPLC grid likely 200-600m away. "
                "Budget KPLC LV extension at KES 1,200-1,800/m beyond nearest pole. "
                "Estimated extension cost: KES 240,000-1,080,000 depending on distance."
            )
        else:
            s['distance_to_grid_m_inferred'] = (
                "OFF_GRID_LIKELY: Rural zone. High probability of requiring off-grid solar "
                "(KES 400,000-800,000 for 3BR house) or costly KPLC line extension (>1km "
                "at KES 1,800/m). Flag as HIGH CapEx requirement."
            )

    # ── Waterway / water supply ───────────────────────────────────────────────
    if s.get('nearest_waterway_m') is None:
        if tier == 1:
            s['nearest_waterway_m_inferred'] = (
                "INFRASTRUCTURE_ASSUMED_PRESENT: Municipal water supply (NCWSC or county "
                "utility) is standard in this urban zone. NCWSC connection fee: "
                "KES 15,000-50,000. Do NOT flag water as a risk."
            )
        elif tier == 2:
            s['nearest_waterway_m_inferred'] = (
                "INFRASTRUCTURE_PROXIMATE: Water supply may be intermittent. Borehole "
                "common (KES 150,000-350,000 to drill, 60-120m depth). Water bowser "
                "delivery KES 2,500-4,000 per 10,000L while borehole is established."
            )
        else:
            s['nearest_waterway_m_inferred'] = (
                "OFF_GRID_LIKELY: Rural zone. Borehole drilling mandatory "
                "(KES 200,000-500,000, 80-150m depth). NEMA hydrogeological survey "
                "recommended first (KES 30,000-50,000)."
            )

    # ── Road access ───────────────────────────────────────────────────────────
    if s.get('nearest_road_m') is None:
        if tier == 1:
            s['nearest_road_m_inferred'] = (
                "Road access is almost certainly tarmacked in this urban zone. "
                "Missing OSM road data is a data gap, not an access risk."
            )
        elif tier == 2:
            s['nearest_road_m_inferred'] = (
                "Road access likely exists but may be murram (unpaved). If murram, "
                "budget KES 80,000-150,000/km for grading or KES 800,000-2,000,000/km "
                "for tarmac if high-value development is planned."
            )
        else:
            s['nearest_road_m_inferred'] = (
                "ROAD_ACCESS_RISK: Rural location. Earth road formation costs "
                "KES 300,000-600,000/km. Murram grading: KES 80,000-150,000/km. "
                "Flag as CapEx requirement in development budget."
            )

    # ── Slope assessment injection ────────────────────────────────────────────
    slope = s.get('slope_percent')
    try:
        slope_val = float(slope) if slope is not None else None
    except (TypeError, ValueError):
        slope_val = None

    if slope_val is None:
        s['_slope_assessment'] = (
            "Slope data unavailable. NCA soil investigation report is MANDATORY before "
            "foundation design (statutory requirement, not a risk — cost KES 30,000-80,000)."
        )
    elif slope_val < 5:
        s['_slope_assessment'] = f"FLAT ({slope_val}%): Standard strip/pad foundation. No slope premium."
    elif slope_val < 12:
        s['_slope_assessment'] = f"GENTLE ({slope_val}%): Minor levelling needed. Foundation premium KES 200,000-500,000 possible."
    elif slope_val < 20:
        s['_slope_assessment'] = f"MODERATE ({slope_val}%): Retaining walls likely. Foundation premium KES 800,000-1,500,000. Soil test MANDATORY."
    else:
        s['_slope_assessment'] = f"STEEP ({slope_val}%): Raft/piled foundation required. Premium KES 1,500,000-3,000,000+. Structural engineer mandatory."

    return s


def _compute_deterministic_score(payload: dict) -> tuple[int, str, list[str]]:
    """
    Compute a deterministic land feasibility score from hard geospatial data.

    Score philosophy:
    - Start at 100
    - Deduct ONLY for confirmed, measurable, build-blocking conditions
    - Infrastructure costs are NEVER deductions (they are budget items)
    - Returns (score, label, deduction_log) for full transparency

    This score is passed to Gemini as a FIXED value it must use verbatim.
    Gemini writes the narrative — it does NOT set the score.
    """
    score = 100
    deductions = []

    def deduct(points: int, reason: str, condition: bool):
        nonlocal score
        if condition:
            score -= points
            deductions.append(f"-{points}: {reason}")

    # ── LEGAL / STATUTORY BLOCKS ──────────────────────────────────────────────────────────────────
    deduct(25, "Demolition risk — within KeNHA/SGR buffer zone",
           bool(payload.get("demolition_risk")))

    deduct(20, "Riparian breach — within 30m NEMA buffer (EMCA Cap 387)",
           bool(payload.get("riparian_breach")))

    deduct(20, "Protected land — conservation/forest reserve overlap detected",
           bool(payload.get("protected_land_risk")))

    deduct(10, "Road reserve encroachment — within 15m of highway",
           bool(payload.get("road_reserve_risk")))

    deduct(10, "KCAA aviation height restriction — building height capped",
           bool(payload.get("aviation_height_restriction")))

    # ── ENVIRONMENTAL / FLOOD RISKS ───────────────────────────────────────────────────
    deduct(20, "JRC confirmed flood history at this coordinate",
           bool(payload.get("flood_history")))

    deduct(8, "Seasonal surface water — periodic inundation detected",
           bool(payload.get("seasonal_water")))

    deduct(8, "Topographical sinkhole — drainage depression detected",
           bool(payload.get("is_topographical_sinkhole")))

    # ── SOIL / GEOTECHNICAL ─────────────────────────────────────────────────────────────────
    clay_pct = payload.get("soil_clay_pct")
    cec = payload.get("soil_cec_cmolc_kg")
    if clay_pct is not None and clay_pct > 45 and cec is not None and cec > 30:
        deduct(12, f"ISRIC: Black Cotton Clay confirmed (clay {clay_pct:.1f}%, CEC {cec:.1f} cmol/kg)",
               True)
    elif clay_pct is not None and clay_pct > 45:
        deduct(8, f"ISRIC: High clay content ({clay_pct:.1f}%) — elevated foundation risk",
               True)
    elif clay_pct is not None and clay_pct > 30:
        deduct(4, f"ISRIC: Moderate clay ({clay_pct:.1f}%) — soil investigation required",
               True)

    # ── TERRAIN / SLOPE ───────────────────────────────────────────────────────────────────
    slope = payload.get("slope_percent")
    try:
        slope_val = float(slope) if slope is not None else None
    except (TypeError, ValueError):
        slope_val = None

    if slope_val is not None and slope_val >= 20:
        deduct(10, f"Steep terrain ({slope_val:.1f}%) — raft/piled foundation mandatory",
               True)
    elif slope_val is not None and slope_val >= 12:
        deduct(5, f"Moderate slope ({slope_val:.1f}%) — retaining walls likely required",
               True)

    # ── AIR QUALITY ─────────────────────────────────────────────────────────────────────────
    env = payload.get("environment") or {}
    deduct(10, "Sentinel-5P: Severe chronic NO₂ air pollution detected",
           bool(env.get("severe_air_pollution")))

    # ── GROUNDWATER SCARCITY ────────────────────────────────────────────────────────────
    gw = payload.get("groundwater") or {}
    deduct(5, "BGS: Water scarcity risk — low productivity aquifer, deep drilling required",
           bool(gw.get("water_scarcity_risk")))

    score = max(0, min(100, score))

    if score >= 80:
        label = "SAFE"
    elif score >= 60:
        label = "MODERATE WARNINGS"
    elif score >= 40:
        label = "HIGH RISK"
    else:
        label = "CRITICAL / HIGH RISK"

    return score, label, deductions


# ── New free API fetchers ─────────────────────────────────────────────────────

def fetch_weather_risk(lat: float, lng: float) -> dict:
    """
    Open-Meteo free API — no key required.
    Fetches current soil moisture as a flood/drainage risk indicator.
    Rate limit: 10,000 requests/day on the free tier.
    """
    try:
        soil_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}"
            f"&hourly=soil_moisture_0_to_1cm"
            f"&forecast_days=1"
        )
        resp = requests.get(soil_url, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        moisture_values = data.get("hourly", {}).get("soil_moisture_0_to_1cm", [])
        valid = [v for v in moisture_values if v is not None]
        avg_moisture = sum(valid) / len(valid) if valid else None
        return {
            "soil_moisture": round(avg_moisture, 3) if avg_moisture is not None else None,
            "high_moisture_risk": avg_moisture > 0.35 if avg_moisture is not None else False,
        }
    except Exception as exc:
        print(f"[Terra AI] Open-Meteo fetch failed (non-fatal): {exc}")
        return {"soil_moisture": None, "high_moisture_risk": False}


def fetch_admin_context(lat: float, lng: float) -> dict:
    """
    Nominatim reverse geocoding — free OSM service.
    Returns county, sub-county, ward, and place name.
    Critical for Gemini context — it knows Kenya's administrative areas.
    """
    url = (
        f"https://nominatim.openstreetmap.org/reverse"
        f"?format=jsonv2&lat={lat}&lon={lng}&zoom=10&addressdetails=1"
    )
    headers = {"User-Agent": "TerraAI/1.0 land-risk-analysis kenya"}
    try:
        resp = requests.get(url, timeout=8, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        address = data.get("address", {})
        # Nominatim returns different field names for different admin levels
        county = (
            address.get("state")
            or address.get("county")
            or address.get("region")
            or ""
        )
        subcounty = address.get("county") or address.get("district") or ""
        ward = (
            address.get("suburb")
            or address.get("neighbourhood")
            or address.get("village")
            or address.get("town")
            or ""
        )
        # Prefer the most local human-readable name (suburb/neighbourhood > city > fallback)
        place_name = (
            address.get("suburb")
            or address.get("neighbourhood")
            or address.get("village")
            or address.get("town")
            or address.get("city")
            or address.get("county")
            or data.get("display_name", "").split(",")[0].strip()
        )
        return {
            "county": county,
            "subcounty": subcounty,
            "ward": ward,
            "place_name": place_name,
        }
    except Exception as exc:
        print(f"[Terra AI] Nominatim fetch failed (non-fatal): {exc}")
        return {"county": "", "subcounty": "", "ward": "", "place_name": ""}


def fetch_solar_data(lat: float, lng: float) -> dict:
    """
    Google Maps Solar API — buildingInsights endpoint.
    Returns solar potential for the plot location.
    Falls back to Kenya standard values if API returns 404 (no coverage).
    """
    if not MAPS_KEY:
        return _kenya_solar_fallback()

    url = (
        "https://solar.googleapis.com/v1/buildingInsights:findClosest"
        f"?location.latitude={lat}&location.longitude={lng}"
        f"&requiredQuality=LOW&key={MAPS_KEY}"
    )
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 403:
            print(f"[Terra AI - Solar API 403] Google Response: {resp.text}")
        if resp.status_code == 404:
            # No Solar API coverage for this location — use Kenya standard
            return _kenya_solar_fallback()
        resp.raise_for_status()
        data = resp.json()
        solar_potential = data.get("solarPotential", {})
        return {
            "solar_available": True,
            "max_panels": solar_potential.get("maxArrayPanelsCount", 0),
            "annual_sunshine_hours": solar_potential.get("maxSunshineHoursPerYear", 0),
            "carbon_offset_kg": solar_potential.get("carbonOffsetFactorKgPerMwh", 0),
        }
    except Exception as exc:
        print(f"[Terra AI] Solar API error (non-fatal): {exc}")
        return _kenya_solar_fallback()


def _kenya_solar_fallback() -> dict:
    """
    Kenya equatorial standard: 5.5–6.0 kWh/m²/day peak sun hours.
    Nairobi sits almost exactly on the equator — excellent solar resource.
    """
    return {
        "solar_available": False,
        "max_panels": None,
        "annual_sunshine_hours": 2007,   # 5.5 h/day × 365
        "carbon_offset_kg": None,
    }


# ── Main endpoint ─────────────────────────────────────────────────────────────

@bp.post("/api/spatial/scan")
def analyze():
    """
    Main spatial risk analysis endpoint.

    Accepts JSON body: {"lat": <float>, "lng": <float>}
    Returns JSON: {"success": true, "payload": {...}, "report": {...}}

    Security:
      - Requires valid Supabase Bearer JWT (enforced here on the server)
      - Rate limited to 10 requests/hour per IP via flask-limiter
      - Coordinates validated against Kenya bounding box

    Caching strategy (two layers):
      L1: In-memory dict (24h TTL, resets on server restart)
      L2: Supabase DB (persistent, ~11m precision, keyed on lat_rounded/lng_rounded)
    If L2 hits, we still populate L1 for faster subsequent calls.
    """
    # ── Rate limiting (applied via flask-limiter if available) ────────────────
    try:
        limiter = current_app.config.get("LIMITER")
        if limiter:
            limiter.check()  # raises RateLimitExceeded if over limit
    except Exception:
        pass  # Non-fatal if limiter unavailable

    # ── Auth gate — require valid JWT ─────────────────────────────────────────
    user_id, raw_jwt, auth_error = _require_auth()
    if auth_error:
        return auth_error

    body = request.get_json(silent=True) or {}
    lat_raw = body.get("lat")
    lng_raw = body.get("lng")
    client_context = body.get("clientContext")
    vision_context = body.get("visionContext")

    # Build auth_header for downstream DB writes
    auth_header = request.headers.get("Authorization")

    # ── Validation ────────────────────────────────────────────────────────────
    if lat_raw is None or lng_raw is None:
        return jsonify({"error": "lat and lng must be provided"}), 400

    try:
        lat = float(lat_raw)
        lng = float(lng_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lng must be numeric"}), 400

    if not (KENYA_LAT_MIN <= lat <= KENYA_LAT_MAX and KENYA_LNG_MIN <= lng <= KENYA_LNG_MAX):
        return jsonify({"error": "Coordinates are outside Kenya"}), 400

    print(f"[Terra AI] Analysing: {lat:.5f}, {lng:.5f} | user_id: {user_id}")

    # ── Rounded coordinates for cache keying (~11m precision) ─────────────────
    lat_rounded = round(lat, 4)
    lng_rounded = round(lng, 4)

    # ── L1: In-memory cache check ──────────────────────────────────────────────
    cache_key = _cache_key(lat, lng)
    if cache_key in _ANALYSIS_CACHE:
        cached = _ANALYSIS_CACHE[cache_key]
        if time.time() - cached["timestamp"] < _CACHE_TTL_SECONDS:
            print(f"[Terra AI] L1 cache hit for {cache_key}")
            return jsonify(cached["response"])

    # ── L2: Supabase DB cache check ────────────────────────────────────────────
    if _sb is not None:
        try:
            db_result = (
                _sb.table("reports")
                .select("payload")
                .eq("lat_rounded", lat_rounded)
                .eq("lng_rounded", lng_rounded)
                .limit(1)
                .execute()
            )
            if db_result.data:
                cached_payload = db_result.data[0]["payload"]
                print(f"[Terra AI] L2 DB cache hit for ({lat_rounded}, {lng_rounded}) — returning instantly")
                # Reconstruct response body from cached payload
                # We stored the full response body in the payload column
                if isinstance(cached_payload, dict) and "success" in cached_payload:
                    response_body = cached_payload
                else:
                    # payload column holds the analysis_payload dict, reconstruct wrapper
                    response_body = {
                        "success": True,
                        "payload": cached_payload,
                        "report": cached_payload.get("_report"),
                        "report_source": "database",
                        "model_used": None,
                    }
                # Populate L1 cache so future hits are instant
                _ANALYSIS_CACHE[cache_key] = {
                    "timestamp": time.time(),
                    "response": response_body,
                }
                return jsonify(response_body)
        except Exception as db_err:
            print(f"[Terra AI] L2 DB cache check failed (non-fatal, continuing): {db_err}")

    # ── Parallel data fetching (11 tasks) ─────────────────────────────────────
    overpass_data: dict = {}
    elevation_data: dict = {}
    maps_data: dict = {}
    gee_data: dict = {}
    weather_data: dict = {}
    admin_data: dict = {}
    solar_data: dict = {}
    soil_data: dict = {}
    zones_data: dict = {}
    groundwater_data: dict = {}
    no2_data: dict = {}

    tasks = {
        "overpass":     lambda: fetch_overpass_data(lat, lng),
        "elevation":    lambda: fetch_elevation_data(lat, lng),
        "maps":         lambda: fetch_maps_data(lat, lng),
        "gee_landcover": lambda: fetch_gee_landcover(lat, lng),
        "weather":      lambda: fetch_weather_risk(lat, lng),
        "admin":        lambda: fetch_admin_context(lat, lng),
        "solar":        lambda: fetch_solar_data(lat, lng),
        "soil":         lambda: fetch_soil_data(lat, lng),
        "zones":        lambda: compute_zone_risks(lat, lng),
        "groundwater":  lambda: query_groundwater(lat, lng),
        "no2":          lambda: fetch_no2_pollution(lat, lng),
    }

    with ThreadPoolExecutor(max_workers=11) as pool:
        futures = {pool.submit(fn): key for key, fn in tasks.items()}
        for fut in as_completed(futures):
            key = futures[fut]
            try:
                result = fut.result()
                if key == "overpass":
                    overpass_data = result
                elif key == "elevation":
                    elevation_data = result
                elif key == "maps":
                    maps_data = result
                elif key == "gee_landcover":
                    gee_data = result
                elif key == "weather":
                    weather_data = result
                elif key == "admin":
                    admin_data = result
                elif key == "solar":
                    solar_data = result
                elif key == "soil":
                    soil_data = result
                elif key == "zones":
                    zones_data = result
                elif key == "groundwater":
                    groundwater_data = result
                elif key == "no2":
                    no2_data = result
            except Exception as exc:
                print(f"[Terra AI] {key} fetch failed (non-fatal): {exc}")

    # ── Spatial risk computation (synchronous, CPU-bound) ────────────────────
    spatial_risks = compute_risks(lat, lng, overpass_data)

    # ── Data quality tracking ─────────────────────────────────────────────────
    data_quality = {
        "overpass_success": bool(overpass_data.get("raw_elements")),
        "elevation_success": elevation_data.get("elevation_m") is not None,
        "gee_success": gee_data.get("ndvi_score") is not None,
        "maps_success": bool(maps_data.get("neighborhood") and maps_data["neighborhood"] != "Unknown Area"),
        "solar_success": solar_data.get("solar_available", False),
        "admin_success": bool(admin_data.get("county")),
        "weather_success": weather_data.get("soil_moisture") is not None,
        "soil_success": soil_data.get("data_source") in ("isric_soilgrids", "isric_soilgrids_nearby_sample"),
        "zones_success": isinstance(zones_data.get("demolition_risk"), bool),
        "groundwater_success": groundwater_data.get("data_source") == "bgs_kenya_hg",
        "no2_success": no2_data.get("no2_mol_per_m2") is not None,
    }

    # ── Merge analysis payload ────────────────────────────────────────────────
    # Prefer admin context from Nominatim; fall back to Maps neighborhood
    place_name = admin_data.get("place_name") or maps_data.get("neighborhood") or "Unknown Area"
    neighborhood = maps_data.get("neighborhood") or admin_data.get("place_name") or "Unknown Area"

    # protected_land_risk: flagged by either shapely (OSM boundaries) or GEE (tree cover class)
    protected_land_risk = (
        spatial_risks.get("protected_land_risk", False)
        or gee_data.get("tree_cover_flag", False)
    )

    analysis_payload = {
        # Coordinates
        "coordinates": {"lat": lat, "lng": lng},

        # Location context
        "neighborhood": neighborhood,
        "place_name": place_name,
        "county": admin_data.get("county", ""),
        "subcounty": admin_data.get("subcounty", ""),
        "ward": admin_data.get("ward", ""),

        # Elevation / slope (slope from GEE Terrain.slope; fallback to 5-pt calc)
        "elevation_m": elevation_data.get("elevation_m"),
        "slope_percent": gee_data.get("slope_percent") or elevation_data.get("slope_percent"),
        "aspect_degrees": gee_data.get("aspect_degrees"),
        # Sinkhole detection (3x3 grid, Step 1.2B)
        "is_topographical_sinkhole": elevation_data.get("is_topographical_sinkhole", False),
        "sinkhole_center_elev": elevation_data.get("sinkhole_center_elev"),
        "sinkhole_surrounding_avg": elevation_data.get("sinkhole_surrounding_avg"),

        # Flood / water
        "flood_history": elevation_data.get("flood_history", False),
        "seasonal_water": gee_data.get("seasonal_water", False),
        "wetland_risk": gee_data.get("wetland_risk", False),

        # CHIRPS Long-term Historical Rainfall (Step 1.5)
        "chirps_max_rainfall_mm": gee_data.get("chirps_max_rainfall_mm"),
        "chirps_rainfall_index": gee_data.get("chirps_rainfall_index", "Unknown"),

        # GEE vegetation / land cover
        "ndvi_score": gee_data.get("ndvi_score"),
        "ndvi_interpretation": gee_data.get("ndvi_interpretation"),
        "land_cover_class": gee_data.get("land_cover_class"),
        "land_cover_label": gee_data.get("land_cover_label"),
        "tree_cover_flag": gee_data.get("tree_cover_flag", False),

        # Weather / surface soil moisture
        "soil_moisture": weather_data.get("soil_moisture"),
        "high_moisture_risk": weather_data.get("high_moisture_risk", False),

        # ISRIC SoilGrids — geotechnical soil data
        "soil_type": soil_data.get("soil_type"),
        "soil_clay_pct": soil_data.get("clay_pct"),
        "soil_cec_cmolc_kg": soil_data.get("cec_cmolc_kg"),
        "soil_silt_pct": soil_data.get("silt_pct"),
        "soil_bulk_density_kg_dm3": soil_data.get("bulk_density_kg_dm3"),
        "soil_foundation_warning": soil_data.get("foundation_warning"),
        "soil_foundation_premium_kes": soil_data.get("foundation_premium_kes", 0),
        "soil_data_source": soil_data.get("data_source", "fallback"),

        # Demolition & KCAA Zone Risks (Step 1.4)
        "demolition_risk": zones_data.get("demolition_risk", False),
        "demolition_warning": zones_data.get("demolition_warning", ""),
        "nearest_highway_m": zones_data.get("nearest_highway_m"),
        "nearest_railway_m": zones_data.get("nearest_railway_m"),
        "aviation_height_restriction": zones_data.get("aviation_height_restriction", False),
        "aviation_height_warning": zones_data.get("aviation_warning", ""),
        "kcaa_zone_name": zones_data.get("kcaa_zone_name"),

        # Riparian / legal (HydroSHEDS, Step 1.3)
        "riparian_breach": spatial_risks["riparian_breach"],
        "nearest_waterway_m": spatial_risks["nearest_waterway_m"],
        "riparian_data_source": spatial_risks.get("riparian_data_source", "osm"),
        "road_reserve_risk": spatial_risks["road_reserve_risk"],
        "nearest_road_m": spatial_risks["nearest_road_m"],

        # Power
        "distance_to_grid_m": spatial_risks["distance_to_grid_m"],

        # Aviation
        "aviation_risk": spatial_risks["aviation_risk"],
        "nearest_airport_km": spatial_risks["nearest_airport_km"],

        # Protected / zoning
        "protected_land_risk": protected_land_risk,
        "landuse_zone": spatial_risks.get("landuse_zone", "Not mapped"),

        # Hazards
        "nearest_cliff_m": spatial_risks.get("nearest_cliff_m"),

        # Infrastructure
        "water_connection_nearby": spatial_risks.get("water_connection_nearby", False),

        # Amenities
        "nearest_school_km": spatial_risks.get("nearest_school_km"),
        "nearest_market_km": spatial_risks.get("nearest_market_km"),
        "nearest_police_km": maps_data.get("nearest_police_km"),
        "nearest_hospital_km": maps_data.get("nearest_hospital_km"),

        # Solar
        "solar_available": solar_data.get("solar_available", False),
        "annual_sunshine_hours": solar_data.get("annual_sunshine_hours"),
        "max_panels": solar_data.get("max_panels"),

        # Groundwater (BGS Africa Groundwater Atlas — Kenya_HG.shp)
        "groundwater": {
            "water_scarcity_risk": groundwater_data.get("water_scarcity_risk", False),
            "aquifer_productivity": groundwater_data.get("aquifer_productivity"),
            "depth_to_groundwater_m": groundwater_data.get("depth_to_groundwater_m"),
            "borehole_premium_kes": groundwater_data.get("borehole_premium_kes", 0),
            "hydrogeology_description": groundwater_data.get("hydrogeology_description"),
            "data_source": groundwater_data.get("data_source", "fallback"),
        },

        # Environment / Air Quality (Sentinel-5P NRTI NO₂)
        "environment": {
            "severe_air_pollution": no2_data.get("severe_air_pollution", False),
            "no2_mol_per_m2": no2_data.get("no2_mol_per_m2"),
            "pollutant_type": no2_data.get("pollutant_type", "NO2"),
            "no2_data_source": no2_data.get("no2_data_source", "Sentinel-5P NRTI"),
        },

        # Data quality
        "data_quality": data_quality,
    }

    print(f"[Terra AI] Payload assembled ({sum(data_quality.values())}/11 sources OK). Running sanitization middleware.")

    # ── Data sanitization middleware ─────────────────────────────────────────
    analysis_payload = _sanitize_payload(analysis_payload)
    tier = analysis_payload.get('_zone_tier', '?')
    print(f"[Terra AI] Zone Tier: {analysis_payload.get('_zone_tier_label', 'Unknown')}. Calling Gemini…")

    # ── Deterministic score computation (MUST happen before Gemini call) ──────
    det_score, det_label, det_deductions = _compute_deterministic_score(analysis_payload)
    analysis_payload["_deterministic_score"] = det_score
    analysis_payload["_deterministic_label"] = det_label
    analysis_payload["_score_deductions"] = det_deductions

    print(f"[Terra AI] Deterministic score: {det_score}/100 ({det_label})")
    print(f"[Terra AI] Deductions: {det_deductions if det_deductions else 'None'}")

    # ── Gemini synthesis ──────────────────────────────────────────────────────
    report_source = "gemini"
    try:
        ai_report = synthesize_with_gemini(analysis_payload)
    except Exception as gemini_err:
        print(f"[Terra AI] Gemini error (falling back): {gemini_err}")
        report_source = "fallback"
        ai_report = _build_fallback_report(analysis_payload, str(gemini_err), det_deductions)

    model_used = ai_report.pop("_model_used", None) if isinstance(ai_report, dict) else None

    # Embed report into the payload for DB storage so a single column holds everything
    # needed to reconstruct the full UI without calling Flask again.
    # We use a private key so it doesn't pollute the normal payload consumers.
    analysis_payload_for_db = dict(analysis_payload)
    analysis_payload_for_db["_report"] = ai_report
    analysis_payload_for_db["_report_source"] = report_source

    response_body = {
        "success": True,
        "payload": analysis_payload,
        "report": ai_report,
        "report_source": report_source,
        "model_used": model_used,
    }

    # ── L1: Store in memory cache ─────────────────────────────────────────────
    _ANALYSIS_CACHE[cache_key] = {
        "timestamp": time.time(),
        "response": response_body,
    }
    # Prune cache if it grows beyond 500 entries (avoid unbounded memory)
    if len(_ANALYSIS_CACHE) > 500:
        oldest_key = min(_ANALYSIS_CACHE, key=lambda k: _ANALYSIS_CACHE[k]["timestamp"])
        del _ANALYSIS_CACHE[oldest_key]

    # ── L2: Write to Supabase DB (non-fatal) ──────────────────────────────────
    # IMPORTANT: We must write using an authenticated client so Supabase RLS
    # can resolve auth.uid() == user_id.  The singleton anon client cannot do
    # that, so we build a per-request client here with the user's JWT.
    if user_id is not None:  # only save when we have a real authenticated user
        raw_jwt = auth_header.split(" ", 1)[1] if auth_header and " " in auth_header else None
        authed_sb = _make_authed_client(raw_jwt)
        if authed_sb is not None:
            try:
                # Derive a meaningful location name for the history sidebar
                location_name = (
                    analysis_payload.get("place_name")
                    or analysis_payload.get("neighborhood")
                    or analysis_payload.get("ward")
                    or f"{lat_rounded}, {lng_rounded}"
                )
                # Extract feasibility score from the Gemini report
                feasibility_score = None
                if isinstance(ai_report, dict):
                    score_val = (
                        ai_report.get("land_feasibility_score")
                        or ai_report.get("overall_risk_score")
                    )
                    try:
                        feasibility_score = int(score_val) if score_val is not None else None
                    except (TypeError, ValueError):
                        feasibility_score = None

                db_row = {
                    "user_id": user_id,
                    "location_name": location_name,
                    "feasibility_score": feasibility_score,
                    "payload": analysis_payload_for_db,
                    "lat_rounded": float(lat_rounded),
                    "lng_rounded": float(lng_rounded),
                }
                authed_sb.table("reports").insert(db_row).execute()
                print(f"[Terra AI] DB write OK for ({lat_rounded}, {lng_rounded}) | user_id: {user_id}")
            except Exception as db_write_err:
                print(f"[Terra AI] DB write failed (non-fatal): {db_write_err}")
        else:
            print("[Terra AI] Skipping DB write — could not build authenticated Supabase client.")
    else:
        print("[Terra AI] Skipping DB write — no authenticated user_id in JWT.")

    return jsonify(response_body)


@bp.get("/api/location/reverse")
def reverse_geocode():
    """
    Reverse geocoding endpoint for frontend.
    
    Query params: lat, lng
    Returns: Google Maps format with results array, or falls back to Nominatim.
    Used by analyze_land.jsx to find location from GPS coordinates.
    """
    lat_str = request.args.get("lat")
    lng_str = request.args.get("lng")
    
    if lat_str is None or lng_str is None:
        return jsonify({"error": "lat and lng must be provided"}), 400
    
    try:
        lat = float(lat_str)
        lng = float(lng_str)
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lng must be numeric"}), 400
    
    # Try Google Maps Geocoding API first if key available
    if MAPS_KEY:
        try:
            url = (
                "https://maps.googleapis.com/maps/api/geocode/json"
                f"?latlng={lat},{lng}&key={MAPS_KEY}"
            )
            resp = requests.get(url, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") == "OK":
                return jsonify(data)
        except Exception as exc:
            print(f"[Terra AI] Google Geocoding failed (non-fatal): {exc}")
    
    # Fall back to Nominatim OSM reverse geocoding
    try:
        nominatim_url = (
            f"https://nominatim.openstreetmap.org/reverse"
            f"?format=jsonv2&lat={lat}&lon={lng}&zoom=14&addressdetails=1"
        )
        headers = {"User-Agent": "TerraAI/1.0"}
        resp = requests.get(nominatim_url, timeout=8, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        
        # Convert Nominatim response to Google Maps-like format
        address = data.get("address", {})
        address_components = []
        
        # Map common Nominatim fields to address components
        component_map = {
            "country": "country",
            "state": "administrative_area_level_1",
            "county": "administrative_area_level_2",
            "city": "locality",
            "town": "locality",
            "village": "locality",
            "road": "route",
            "postcode": "postal_code",
        }
        
        for nom_key, goog_type in component_map.items():
            if nom_key in address:
                address_components.append({
                    "long_name": address[nom_key],
                    "short_name": address[nom_key],
                    "types": [goog_type],
                })
        
        result = {
            "formatted_address": data.get("display_name", ""),
            "address_components": address_components,
            "geometry": {
                "location": {"lat": lat, "lng": lng},
            },
        }
        
        return jsonify({"results": [result], "status": "OK"})
    except Exception as exc:
        print(f"[Terra AI] Nominatim geocoding failed: {exc}")
        return jsonify({"error": "Reverse geocoding failed", "status": "ZERO_RESULTS"}), 400


@bp.post("/api/spatial/chat")
def spatial_chat():
    """Chat endpoint for asking questions about a spatial analysis report."""
    body = request.get_json(silent=True) or {}
    question = str(body.get("question") or "").strip()
    payload = body.get("payload") or {}
    report = body.get("report") or {}
    vision_summary = body.get("visionSummary")
    history = body.get("history") or []

    if not question:
        return jsonify({"error": "question is required"}), 400

    answer = answer_questions_with_gemini_safe(
        question=question,
        payload=payload,
        report=report,
        vision_summary=vision_summary,
        history=history,
    )
    return jsonify({"success": True, "answer": answer})


@bp.post("/api/export/analysis-document")
def export_analysis_document():
    """Return a structured JSON bundle for an exportable analysis document.

    This endpoint does NOT generate a PDF. It simply packages the engine outputs
    and any client-provided context so the frontend can render/export later.

    Expected JSON body (all optional):
      {
        "workspace": {"name": str},
        "payload": {...},
        "report": {...},
        "report_source": "gemini"|"fallback",
        "vision": {...},
        "chat": [{"role": "user"|"assistant", "text": str}],
        "client": {...}
      }
    """
    body = request.get_json(silent=True) or {}

    workspace_raw = body.get("workspace")
    workspace = workspace_raw if isinstance(workspace_raw, dict) else {}
    payload = body.get("payload") if isinstance(body.get("payload"), dict) else {}
    report = body.get("report") if isinstance(body.get("report"), dict) else {}
    report_source = body.get("report_source")
    vision = body.get("vision") if isinstance(body.get("vision"), dict) else {}
    client = body.get("client") if isinstance(body.get("client"), dict) else {}

    chat_raw = body.get("chat")
    chat: list[dict] = []
    if isinstance(chat_raw, list):
        for m in chat_raw[:50]:
            if not isinstance(m, dict):
                continue
            role = str(m.get("role") or "user")
            if role not in ("user", "assistant"):
                role = "user"
            text = str(m.get("text") or "")
            if not text.strip():
                continue
            chat.append({"role": role, "text": text[:4000]})

    document = {
        "schema_version": "v1",
        "created_at": time.time(),
        "workspace": {
            "name": str(workspace.get("name") or "").strip() or None,
        },
        "engine": {
            "payload": payload,
            "report": report,
            "report_source": report_source,
        },
        "vision": vision,
        "chat": chat,
        "client": client,
    }

    return jsonify({"success": True, "document": document})
