"""
Gemini 2.5 Flash synthesis — Terra AI land risk report generator

Uses google.generativeai (v0.8.x) with a precise Kenya-expert system prompt
and an expanded JSON schema covering investment verdict, cost summary, fraud
checklist, solar potential, and zoning guidance.
"""

import json
import os
import re
import warnings
from typing import Optional

with warnings.catch_warnings():
    warnings.filterwarnings("ignore", category=FutureWarning)
    import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def _is_credit_depleted_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    # Only break completely for actual prepayment credit exhaustion —
    # NOT for regular per-minute/per-day quota exceeded (those should try next model)
    return "prepayment credits" in msg or (
        "429" in msg and ("prepayment" in msg or "billing_disabled" in msg)
    )


def _gemini_unavailable_message(exc: Exception) -> str:
    if _is_credit_depleted_error(exc):
        return (
            "Gemini is currently unavailable because your Gemini API project has depleted its prepayment credits. "
            "Top up/enable billing in AI Studio, then retry."
        )
    return f"Gemini is currently unavailable: {str(exc)}"

SYSTEM_PROMPT = """You are a Pragmatic Legal & Financial Advisor specializing in Kenyan real estate and development. You have 25 years of active conveyancing, geotechnical, and development finance practice in Nairobi and peri-urban Kenya.

CRITICAL OPERATING RULES — VIOLATING ANY RULE IS UNACCEPTABLE

RULE 0 — ADVISORY PERSONA:
Present risks calmly and objectively. Do NOT use all-caps to shout at the user (e.g., never say "DO NOT BUY THIS"). Instead, state the legal/financial reality and provide clear mitigation steps (e.g., "Seek official government clearance from KeNHA"). Translate raw geospatial data (Clay %, Sinkhole boolean, Demolition flags, Rainfall index) into practical financial realities and exact KES costs to protect the buyer from hidden capital expenditure traps.

RULE 1 — RISK vs. MANDATORY PROCESS:
Standard legal due diligence steps are MANDATORY PROCESSES, not risks.
NEVER flag these as risks: Ardhisasa title search (KES 500), NCA soil investigation (KES 30,000-80,000), NEMA EIA, Land rates clearance, ISK surveyor beacon verification.
Raise soil/foundation to RISK only if: Clay > 30% OR slope > 15% OR flood_history=true OR is_topographical_sinkhole=true OR wetland indicator.

RULE 2 — ISRIC SOIL DATA IS GROUND TRUTH:
If soil_clay_pct is in the payload, USE IT. Do not fall back to neighbourhood-name inference.
  clay_pct > 45 AND cec > 30 → Black Cotton Clay → Raft foundation MANDATORY → KES 800,000-1,500,000 premium
  clay_pct 30-45 → Moderate Clay → Strip foundation with investigation → KES 200,000-500,000 premium
  clay_pct < 30 → Stable/Laterite → Standard strip foundation — no premium

RULE 2B — URBAN MASK (soil_type = "Urban/Built-Up"):
If soil_type is "Urban/Built-Up", you MUST output this verbatim in the soil_geotech section body:
"This plot is situated in a dense urban core. Satellite soil mapping is masked by existing infrastructure. You are legally required to conduct a physical geotechnical soil test before structural engineering can estimate your foundation CapEx."
Set estimated_foundation_premium_kes to 0. Do NOT invent a clay % or soil classification. Set foundation risk_level to "medium" (unknown, not confirmed high).

RULE 3 — SINKHOLE AND RAINFALL FLAGS:
If is_topographical_sinkhole=true: "This plot sits in a topographical depression. Perimeter drainage MANDATORY (KES 150,000-400,000). Flash flood risk compounded."
If chirps_rainfall_index = "High": "Long-term historical rainfall intensity is HIGH. Drainage infrastructure is a non-negotiable capital cost."

RULE 4 — DEMOLITION FLAGS ARE ABSOLUTE STOPS:
If demolition_risk=true: "High risk of uncompensated demolition by KeNHA/Kenya Railways. Mitigation: Seek official written clearance from the relevant authority before proceeding."
If aviation_height_restriction=true: "Building height is capped by KCAA. High-rise development is not permissible. Mitigation: Apply for a KCAA height clearance certificate."

RULE 5 — MANDATORY KENYAN TERMINOLOGY:
KES (not Kshs), KPLC, NCWSC, NCA, Ardhisasa, Title Deed, Murram road, Change of User, ISK-registered surveyor.

RULE 6 — VERIFIED vs UNVERIFIED DATA:
Your JSON MUST separate verified_data (API-confirmed) from unverified_pending_data (requiring survey/title search).

RULE 7 — TOTAL DUE DILIGENCE MATH:
total_pre_purchase_due_diligence_kes MUST equal: title_search_cost_kes + recommended_survey_cost_kes + legal_fees_kes + valuation_report_kes. Compute the arithmetic sum.

RULE 8 — ZONE-AWARE COSTS:
If zone_tier is Commercial or Urban, or if soil_type is "Urban/Built-Up" (Urban Mask): Assume KPLC grid is present. KPLC extension premium MUST be KES 0.
_zone_tier 1 (hyper-urban): Standard KPLC connection KES 70,000-120,000 only.
_zone_tier 2 (peri-urban): Apply distance penalty. Plan for extensions.
_zone_tier 3 (rural): Apply distance penalty. Full off-grid. High-end estimates.

Respond ONLY with a valid JSON object. No preamble, no markdown fences."""

REPORT_SCHEMA = """{
  "land_feasibility_score": <integer 0-100 (100 = Ideal/Safe, 0 = Unbuildable)>,
  "land_feasibility_label": <"SAFE" | "MODERATE WARNINGS" | "CRITICAL / HIGH RISK">,
  "executive_summary": <2-sentence pragmatic financial reality check — state total hidden CapEx upfront>,
  "investment_verdict": <"SAFE TO PROCEED TO DUE DILIGENCE" | "PROCEED WITH CAUTION" | "HIGH RISK — DUE DILIGENCE MANDATORY" | "CRITICAL FLAGS — EXTREME CAUTION">,
  "verified_data": {
    "soil_classification": <soil_type from ISRIC>,
    "clay_pct": <clay_pct from payload or null>,
    "cec_cmolc_kg": <cec from payload or null>,
    "gee_slope_pct": <slope_percent from GEE or null>,
    "is_topographical_sinkhole": <boolean from payload>,
    "chirps_rainfall_index": <"Low" | "Moderate" | "High" | "Unknown">,
    "flash_flood_susceptibility": <"Low" | "Moderate" | "High" | "Critical">,
    "riparian_breach": <boolean>,
    "riparian_distance_m": <nearest_waterway_m or null>,
    "riparian_data_source": <"hydrosheds" | "osm" | "none">,
    "demolition_risk": <boolean>,
    "aviation_height_restriction": <boolean>,
    "foundation_premium_kes": <integer from ISRIC classification>,
    "drainage_premium_kes": <integer — 0 if no sinkhole/high rainfall, else 150000-400000>
  },
  "unverified_pending_data": {
    "title_search": "Pending — conduct Ardhisasa search (ardhisasa.go.ke, KES 500) to confirm no caution, charge, or injunction.",
    "physical_survey": "Pending — ISK-registered surveyor must verify beacon positions match title dimensions.",
    "nema_assessment": <"Required — riparian zone" if riparian_breach else "Not required at exploratory stage">,
    "kenha_wayleave": <"Required — within 60m of highway" if demolition_risk else "Not required">,
    "kcaa_height_certificate": <"Required — KCAA zone detected" if aviation_height_restriction else "Not required">
  },
  "sections": [
    {"id": "soil_geotech", "title": "Soil & Foundation Analysis (ISRIC SoilGrids)", "risk_level": <"low"|"medium"|"high"|"critical">, "body": <state exact clay%, CEC, soil type, mandatory foundation type, exact KES premium>},
    {"id": "drainage_flood", "title": "Drainage, Sinkhole & Flash Flood Risk", "risk_level": <"low"|"medium"|"high"|"critical">, "body": <sinkhole status, CHIRPS rainfall index, flash flood susceptibility, mandatory drainage cost in KES>},
    {"id": "legal", "title": "Legal & Regulatory Risk", "risk_level": <"low"|"medium"|"high"|"critical">, "body": <riparian breach with exact distance and statute EMCA Cap 387, demolition risk with Kenya Roads Act, KCAA status>},
    {"id": "topography", "title": "Topography & Terrain", "risk_level": <"low"|"medium"|"high">, "body": <GEE slope%, aspect, elevation, slope tier classification>},
    {"id": "environmental", "title": "Environmental & Flood Risk", "risk_level": <"low"|"medium"|"high">, "body": <JRC flood history, seasonal water, wetland risk, NDVI, land cover>},
    {"id": "infrastructure", "title": "Infrastructure & Development Cost", "risk_level": "medium", "body": <grid distance, water, road access with exact KES costs per zone tier>, "estimated_grid_connection_cost_kes": <integer>},
    {"id": "zoning", "title": "Zoning & Development Rights", "risk_level": <"low"|"medium"|"high">, "body": <OSM land use, county zoning, Change of User requirement>},
    {"id": "solar", "title": "Solar & Sustainability Potential", "risk_level": "info", "body": <annual_sunshine_hours from payload, Kenya 5.5-6.0 peak sun hours/day, 5kWp off-grid KES 400,000-600,000>},
    {"id": "fraud_checklist", "title": "Fraud & Title Risk Checklist", "risk_level": <"low"|"medium"|"high">, "body": <5 numbered steps: Ardhisasa search, Title Deed verification, beacon survey, rates clearance, caveat search>},
    {"id": "recommendation", "title": "Next Steps", "risk_level": "info", "body": <3 sequenced actions with institution, cost, timeframe>}
  ],
  "key_flags": [<3-5 strings prefixed "VERIFIED: " or "PENDING: ". E.g. "VERIFIED: Black Cotton Clay 44.5% — raft foundation mandatory KES 1,200,000", "VERIFIED: Riparian breach 18m — NEMA EMCA Cap 387">],
  "cost_summary": {
    "estimated_foundation_premium_kes": <integer from ISRIC — NEVER null>,
    "estimated_drainage_premium_kes": <integer — 0 if no sinkhole/high rainfall, else 150000-400000>,
    "estimated_grid_connection_kes": <integer>,
    "title_search_cost_kes": 500,
    "recommended_survey_cost_kes": <integer 15000-45000>,
    "legal_fees_kes": <integer minimum 10000>,
    "valuation_report_kes": <integer 5000 if financing likely else 0>,
    "total_pre_purchase_due_diligence_kes": <MUST equal: title_search + survey + legal + valuation. Compute the arithmetic sum.>
  },
  "disclaimer": "Geospatial data derived from ISRIC SoilGrids, HydroSHEDS, and Google Earth Engine. This exploratory report does not replace an official Ministry of Lands physical survey or NEMA assessment."
}"""


def synthesize_with_gemini(payload: dict) -> dict:
    """
    Call Gemini 2.5 Flash with the analysis payload and return parsed JSON report.

    Args:
        payload: The merged analysis dict from the orchestrator.

    Returns:
        Parsed JSON report dict matching the schema above.

    Raises:
        RuntimeError: If GEMINI_API_KEY is not set.
        ValueError: If Gemini returns invalid JSON after extraction attempts.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set. "
            "Add it to backend/.env or your environment."
        )

    coords = payload.get("coordinates", {})
    lat = coords.get("lat", 0)
    lng = coords.get("lng", 0)

    # Build rich user message with all available data fields
    seasonal_water_str = "YES — seasonally inundated" if payload.get("seasonal_water") else "None detected"
    protected_str = "YES — WITHIN OR NEAR PROTECTED AREA — CRITICAL FLAG" if payload.get("protected_land_risk") else "None detected"
    tree_cover_str = "YES — possible forest reserve boundary nearby" if payload.get("tree_cover_flag") else "No"
    riparian_str = "YES — WITHIN BUFFER" if payload.get("riparian_breach") else "No — clear"
    road_str = "YES — encroachment" if payload.get("road_reserve_risk") else "No — clear"
    aviation_str = "YES — KCAA restricted zone" if payload.get("aviation_risk") else "No"
    water_conn_str = "Yes — within 200m" if payload.get("water_connection_nearby") else "Not detected"
    cliff_str = f"{payload.get('nearest_cliff_m')}m" if payload.get("nearest_cliff_m") else "None detected"
    grid_str = f"{payload.get('distance_to_grid_m')}m to nearest line/pole" if payload.get("distance_to_grid_m") else "None within 1km"
    moisture_flag = " (HIGH — drainage concern)" if payload.get("high_moisture_risk") else ""
    seasonal_water_str = "YES - seasonally inundated" if payload.get("seasonal_water") else "None detected"
    protected_str = "YES - WITHIN OR NEAR PROTECTED AREA - CRITICAL FLAG" if payload.get("protected_land_risk") else "None detected"
    tree_cover_str = "YES - possible forest reserve boundary nearby" if payload.get("tree_cover_flag") else "No"
    riparian_str = "YES - WITHIN BUFFER" if payload.get("riparian_breach") else "No - clear"
    road_str = "YES - encroachment" if payload.get("road_reserve_risk") else "No - clear"
    aviation_str = "YES - KCAA restricted zone" if payload.get("aviation_risk") else "No"
    water_conn_str = "Yes - within 200m" if payload.get("water_connection_nearby") else "Not detected"
    cliff_str = f"{payload.get('nearest_cliff_m')}m" if payload.get("nearest_cliff_m") else "None detected"
    grid_str = f"{payload.get('distance_to_grid_m')}m to nearest line/pole" if payload.get("distance_to_grid_m") else "None within 1km"
    moisture_flag = " (HIGH - drainage concern)" if payload.get("high_moisture_risk") else ""
    solar_str = str(payload.get("annual_sunshine_hours")) if payload.get("annual_sunshine_hours") else "Kenya standard 5.5-6.0 peak sun hours"

    # New Step 2.2 financial auditor variables
    isric_soil    = payload.get("soil_type") or "Unknown (ISRIC data unavailable)"
    clay_val      = payload.get("soil_clay_pct")
    clay_str      = f"{clay_val:.1f}%" if clay_val is not None else "N/A"
    cec_val       = payload.get("soil_cec_cmolc_kg")
    cec_str       = f"{cec_val:.1f} cmol/kg" if cec_val is not None else "N/A"
    fnd_kes       = payload.get("soil_foundation_premium_kes") or 0
    sinkhole_str  = "YES - topographical depression detected" if payload.get("is_topographical_sinkhole") else "No"
    chirps_idx    = payload.get("chirps_rainfall_index") or "Unknown"
    chirps_mm_val = payload.get("chirps_max_rainfall_mm")
    chirps_mm_str = f"{chirps_mm_val:.1f} mm/day (historical max)" if chirps_mm_val else "N/A"
    demolish_str  = "YES - 100% DEMOLITION RISK" if payload.get("demolition_risk") else "No"
    kcaa_str      = "YES - BUILDING HEIGHT CAPPED" if payload.get("aviation_height_restriction") else "No"
    riparian_src  = (payload.get("riparian_data_source") or "osm").upper()
    fnd_warn      = payload.get("soil_foundation_warning") or ""

    # Urban Mask flag: when ISRIC pixel is masked by urban infrastructure
    is_urban_mask = isric_soil == "Urban/Built-Up"
    if is_urban_mask:
        urban_mask_note = (
            "URBAN MASK ACTIVE — RULE 2B APPLIES: "
            "This plot is in a dense urban core. ISRIC SoilGrids pixel is masked by "
            "existing infrastructure. No satellite soil classification is possible. "
            "Apply Rule 2B verbatim in the soil_geotech section."
        )
    else:
        urban_mask_note = "Not applicable (ISRIC data available)"

    payload_json = json.dumps(payload or {}, ensure_ascii=False)[:12000]

    user_message = f"""Analyse this plot as a ruthless financial auditor. State every hidden cost in KES.

LOCATION: {payload.get('ward', '')} ward, {payload.get('subcounty', '')} sub-county, {payload.get('county', '')} County ({lat:.5f}, {lng:.5f})
PLACE NAME: {payload.get('place_name', payload.get('neighborhood', 'Unknown'))}
ELEVATION: {payload.get('elevation_m') or 'N/A'} metres ASL
SLOPE (GEE Terrain.slope): {payload.get('slope_percent') or 'N/A'}% (aspect: {payload.get('aspect_degrees') or 'N/A'} deg)
SINKHOLE (3x3 grid): {sinkhole_str}
ISRIC SOIL TYPE: {isric_soil}
ISRIC URBAN MASK STATUS: {urban_mask_note}
ISRIC CLAY %: {clay_str}
ISRIC CEC: {cec_str}
ISRIC FOUNDATION WARNING: {fnd_warn}
ISRIC FOUNDATION PREMIUM: KES {fnd_kes:,}
CHIRPS HISTORICAL RAINFALL INDEX: {chirps_idx} ({chirps_mm_str})
DEMOLITION RISK (KeNHA/SGR 60m/30m buffer): {demolish_str}
KCAA AVIATION HEIGHT CAP: {kcaa_str}
RIPARIAN DATA SOURCE: {riparian_src}
FLOOD HISTORY (JRC): {'YES - surface water recorded' if payload.get('flood_history') else 'None detected'}
SEASONAL WATER RISK: {seasonal_water_str}
SOIL MOISTURE INDEX: {payload.get('soil_moisture') or 'N/A'}{moisture_flag}
NDVI VEGETATION: {payload.get('ndvi_score') or 'N/A'} - {payload.get('ndvi_interpretation') or 'unknown'}
LAND COVER CLASS: {payload.get('land_cover_label') or 'Unknown'} (ESA WorldCover)
PROTECTED LAND: {protected_str}
TREE COVER FLAG: {tree_cover_str}
RIPARIAN BREACH (30m NEMA): {riparian_str}
NEAREST WATERWAY: {payload.get('nearest_waterway_m') or 'None within 1km'} metres
ROAD RESERVE RISK (15m): {road_str}
NEAREST MAJOR ROAD: {payload.get('nearest_road_m') or 'N/A'} metres
NEAREST CLIFF/ESCARPMENT: {cliff_str}
POWER GRID: {grid_str}
WATER CONNECTION NEARBY: {water_conn_str}
AVIATION RESTRICTION (OSM/KCAA): {aviation_str}
NEAREST AIRPORT: {payload.get('nearest_airport_km') or 'N/A'} km
SURROUNDING LAND USE: {payload.get('landuse_zone') or 'Not mapped'}
SOLAR POTENTIAL: {solar_str} hours/year
NEAREST AMENITIES: Police {payload.get('nearest_police_km') or 'N/A'}km, Hospital {payload.get('nearest_hospital_km') or 'N/A'}km, School {payload.get('nearest_school_km') or 'N/A'}km, Market {payload.get('nearest_market_km') or 'N/A'}km

FULL CONTEXT JSON (ground truth — do not ignore):
{payload_json}

Write the full financial auditor risk assessment JSON now."""


    # Try models in order using the new google.genai SDK.
    # gemini-2.5-flash is confirmed working on this key.
    MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
    raw_text = None
    last_model_error = None
    _succeeded_model = None

    for model_name in MODELS_TO_TRY:
        try:
            print(f"[Terra AI] Trying Gemini model: {model_name}")
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                    max_output_tokens=8192,
                ),
                system_instruction=SYSTEM_PROMPT + "\n\nSchema:\n" + REPORT_SCHEMA,
            )
            response = model.generate_content(user_message)
            raw_text = response.text
            print(f"[Terra AI] Model {model_name} succeeded.")
            _succeeded_model = model_name
            break
        except Exception as model_err:
            print(f"[Terra AI] Model {model_name} failed: {model_err}")
            last_model_error = model_err
            raw_text = None
            if _is_credit_depleted_error(model_err):
                break
            continue

    if raw_text is None:
        raise RuntimeError(f"All Gemini models failed. Last error: {last_model_error}")

    # Clean markdown formatting if present
    cleaned_text = raw_text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    cleaned_text = cleaned_text.strip()

    # Primary: direct parse
    try:
        parsed = json.loads(cleaned_text)
        parsed["_model_used"] = _succeeded_model
        return parsed
    except json.JSONDecodeError as e:
        print(f"[Terra AI] JSON Decode Error on cleaned text: {e}")
        pass

    # Fallback: extract first JSON object from response
    match = re.search(r"\{[\s\S]*\}", cleaned_text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as e:
            print(f"[Terra AI] JSON Decode Error on regex matched text: {e}")
            pass

    raise ValueError(
        f"Gemini returned invalid JSON. First 300 chars: {cleaned_text[:300]}"
    )


def answer_questions_with_gemini(
    *,
    question: str,
    payload: dict,
    report: dict,
    vision_summary=None,
    history=None,
) -> str:
    """Answer free-form questions about a plot using the existing Gemini key.

    The model is instructed to ground answers in the supplied payload/report.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set. "
            "Add it to backend/.env or your environment."
        )

        history = history or []
    safe_history = []
    for m in history[-10:]:
        role = (m.get("role") if isinstance(m, dict) else None) or "user"
        text = (m.get("text") if isinstance(m, dict) else None) or ""
        role = "user" if role not in ("user", "assistant") else role
        if text:
            safe_history.append({"role": role, "text": str(text)[:2000]})

    response_body = {
        "success": True,
        "payload": analysis_payload,
        "report": ai_report,
        "report_source": report_source,
        "model_used": ai_report.pop("_model_used", None) if isinstance(ai_report, dict) else None,
    }

    chat_system = (
        "You are Terra AI, a Kenyan land due-diligence assistant. "
        "Answer the user's questions using ONLY the provided context (payload/report/vision_summary). "
        "If the context doesn't contain enough information, say what is missing and what the user should verify (e.g., title search, survey, county approvals). "
        "Keep answers direct and actionable. Do not invent numbers or legal outcomes."
    )

    MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash"]

    parts = [
        "CONTEXT (JSON):\n" + json.dumps(context, ensure_ascii=False)[:12000],
    ]
    if safe_history:
        parts.append(
            "\nRECENT CHAT:\n"
            + "\n".join(
                f"{m['role'].upper()}: {m['text']}" for m in safe_history
            )
        )
    parts.append("\nUSER QUESTION:\n" + question)

    prompt = "\n".join(parts)

    last_error: Optional[Exception] = None
    for model_name in MODELS_TO_TRY:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=genai.GenerationConfig(
                    response_mime_type="text/plain",
                    temperature=0.2,
                    max_output_tokens=900,
                ),
                system_instruction=chat_system,
            )
            response = model.generate_content(prompt)
            return (response.text or "").strip()
        except Exception as exc:
            last_error = exc
            if _is_credit_depleted_error(exc):
                break
            continue

    return _gemini_unavailable_message(last_error or RuntimeError("Gemini request failed"))


def answer_questions_with_gemini_safe(
    *,
    question: str,
    payload: dict,
    report: dict,
    vision_summary=None,
    history=None,
) -> str:
    """Wrapper that never raises; returns a helpful message if Gemini is unavailable."""
    try:
        return answer_questions_with_gemini(
            question=question,
            payload=payload,
            report=report,
            vision_summary=vision_summary,
            history=history,
        )
    except Exception as exc:
        return _gemini_unavailable_message(exc)

