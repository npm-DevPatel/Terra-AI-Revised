"""
Gemini 2.5 Flash synthesis — Terra AI land risk report generator

Uses google.generativeai (v0.8.x) with a ruthless Kenya pre-purchase screener
system prompt focused on fatal legal flaws, financial burdens, and actionable
due diligence — NOT solar potential or soil moisture fluff.
"""

import json
import logging
import os
import re
import warnings
from typing import Optional

logger = logging.getLogger(__name__)

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

SYSTEM_PROMPT = """You are Terra AI — a trusted, objective land intelligence advisor specialising in Kenyan real estate and development. You have 25 years of active conveyancing, geotechnical, and development finance practice spanning the entirety of Kenya (from Nairobi and Mombasa to rural counties).

YOUR CORE PURPOSE: Provide the user with accurate, neutral, and actionable intelligence so they can make an informed decision. You are NOT here to scare them, and you are NOT here to give false hope. Your job is to INFORM — nothing more, nothing less.

SCORING PHILOSOPHY — ABSOLUTE NON-NEGOTIABLE RULE:
The land_feasibility_score has ALREADY BEEN COMPUTED SERVER-SIDE from hard geospatial data.
You will find it in the payload as "_deterministic_score" and "_deterministic_label".
YOU MUST USE THESE EXACT VALUES VERBATIM. Do not adjust them. Do not recalculate them.
Do not round them. Do not "improve" them. Copy them exactly as-is into your JSON output.

The deductions that produced the score are in "_score_deductions" — use these to inform
your narrative but DO NOT change the final score number.

If _deterministic_score is not present in the payload, use this fallback logic:
Start at 100. Deduct ONLY for: flood_history (-20), riparian_breach (-20),
demolition_risk (-25), protected_land (-20), aviation_restriction (-10),
severe_air_pollution (-10), sinkhole (-8), seasonal_water (-8), road_reserve_risk (-10).
DO NOT deduct for infrastructure costs.

COST NEUTRALITY RULE:
Present ALL development costs (foundation premium, grid connection, borehole, road access, drainage) as neutral budget line items with exact KES figures. Do NOT frame costs as "dangerous" or "prohibitive" — frame them as "budget for X". The user already knows development costs money. They need to know HOW MUCH.

CRITICAL OPERATING RULES — VIOLATING ANY RULE IS UNACCEPTABLE

RULE 0 — TONE:
State facts calmly and objectively. Do NOT use all-caps alarm language (e.g., never write "DO NOT BUY THIS"). For genuine legal hazards, state the regulation and the mitigation step clearly. Translate geospatial data into practical financial realities and exact KES costs.

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
If is_topographical_sinkhole=true: "This plot sits in a topographical depression. Perimeter drainage is required (budget KES 150,000-400,000). This compounds flash flood risk — verify drainage channels before committing."
If chirps_rainfall_index = "High": "Long-term historical rainfall is HIGH. Budget for drainage infrastructure as a non-negotiable development cost."

RULE 4 — DEMOLITION FLAGS ARE GENUINE LEGAL HAZARDS:
If demolition_risk=true: "This plot is within a KeNHA/Kenya Railways buffer zone. There is a risk of uncompensated demolition under the Kenya Roads Act/Railways Act. Mitigation: obtain official written clearance from the relevant authority before proceeding."
If aviation_height_restriction=true: "KCAA restricts building height at this coordinate. High-rise development is not permitted. Obtain a KCAA height clearance certificate before architectural design."

RULE 5 — MANDATORY KENYAN TERMINOLOGY:
KES (not Kshs), KPLC, NCWSC, NCA, Ardhisasa, Title Deed, Murram road, Change of User, ISK-registered surveyor.

RULE 6 — VERIFIED vs UNVERIFIED DATA:
Your JSON MUST separate verified_data (API-confirmed) from unverified_pending_data (requiring survey/title search).

RULE 7 — TOTAL DUE DILIGENCE MATH:
total_pre_purchase_due_diligence_kes MUST equal: title_search_cost_kes + recommended_survey_cost_kes + legal_fees_kes + valuation_report_kes. Compute the arithmetic sum.

RULE 8 — ZONE-AWARE INFRASTRUCTURE COSTS (neutral, not alarming):
_zone_tier 1 (hyper-urban): KPLC grid is present. Standard connection KES 70,000-120,000 only. Do NOT flag as a risk.
_zone_tier 2 (peri-urban): Budget for KPLC LV extension. Typical cost KES 240,000-1,080,000 depending on distance. State as a budget item.
_zone_tier 3 (rural): Budget for off-grid solar (KES 400,000-800,000 for 3BR) or KPLC extension. State as a budget item, not a red flag.
If soil_type is "Urban/Built-Up" OR zone_tier is 1: KPLC grid connection premium MUST be KES 0.

RULE 9 — WATER SCARCITY (BGS Groundwater Atlas):
If groundwater.water_scarcity_risk = true: Add borehole premium of KES 2,000,000 to cost_summary. State clearly: "This plot sits on a low-productivity aquifer. Budget KES 2,000,000+ for deep rotary borehole drilling."
If groundwater.water_scarcity_risk = false but depth data is available: mention standard borehole costs as a budget option (KES 150,000–350,000 for Tier 2, KES 200,000–500,000 for Tier 3).

RULE 10 — CHRONIC AIR POLLUTION (Sentinel-5P):
If environment.severe_air_pollution = true: State clearly: "Sentinel-5P satellite data indicates elevated NO₂ at this coordinate, consistent with adjacent industrial zoning. This is a health consideration and may affect residential tenant demand. A NEMA air quality assessment is recommended."
If environment.severe_air_pollution = false: Briefly confirm clean air status.

RULE 11 — NO FLUFF: You MUST NOT mention sunshine hours, solar potential, NDVI, or soil moisture unless it directly triggers a massive mandatory cost (e.g. black cotton soil requiring special foundation). Focus ONLY on fatal legal flaws (Demolitions, Riparian, Road Reserves) and massive financial burdens (foundation clay, aviation height caps).

RULE 12 — RUTHLESS SCREENER TONE: Act as a ruthless pre-purchase screener. Your only job is to tell the user whether they should RUN AWAY, PROCEED WITH CAUTION, or if the land is CLEAR FOR DUE DILIGENCE based on geospatial data alone.

RULE 13 — COST QUANTIFICATION: Every risk you flag MUST come with an estimated KES cost or consequence. Do not mention a risk without attaching money to it. Example: "Riparian breach: land within 30m of river — government can repossess with zero compensation."

RULE 14 — KENYA-SPECIFIC LEGAL CONTEXT: Apply Kenyan law only. Reference the Physical and Land Use Planning Act (2019), Water Act (2016) riparian rules, and Kenya Civil Aviation Authority height restrictions where relevant.

Respond ONLY with a valid JSON object. No preamble, no markdown fences."""

REPORT_SCHEMA = """{
  "investment_verdict": "DO NOT BUY — FATAL LEGAL FLAW | PROCEED WITH CAUTION | CLEAR FOR DUE DILIGENCE",
  "executive_summary": "MAX 2 SENTENCES. State the single biggest risk or the all-clear. No lists. No bullet points.",
  "risk_flags": [
    {
      "flag_name": "string — e.g. 'Riparian Breach'",
      "severity": "FATAL | CAUTION | ADVISORY",
      "explanation": "string — plain English, 1-2 sentences max",
      "estimated_kes_impact": "number or string — e.g. 'Full repossession, zero compensation'"
    }
  ],
  "cost_summary": {
    "estimated_foundation_premium_kes": "number",
    "estimated_legal_risk_kes": "number or string",
    "total_hidden_cost_estimate_kes": "number or string"
  },
  "sections": [
    {"id": "legal_risks", "title": "Legal & Regulatory Risks", "risk_level": "<low|medium|high|critical>", "body": "<riparian breach, demolition risk, road reserve, KCAA — attach KES cost or consequence to every flag>"},
    {"id": "foundation_costs", "title": "Foundation & Geotechnical Costs", "risk_level": "<low|medium|high>", "body": "<ISRIC clay%, required foundation type, exact KES premium — use RULE 2 thresholds>"},
    {"id": "infrastructure", "title": "Infrastructure Budget", "risk_level": "info", "body": "<KPLC connection cost, water supply, road access — neutral budget items with KES figures>"}
  ]
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

    # New Phase 1 & 2 — Groundwater (BGS) and Air Quality (Sentinel-5P)
    gw  = payload.get("groundwater") or {}
    env = payload.get("environment") or {}

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

GROUNDWATER (BGS Africa Groundwater Atlas — Kenya_HG.shp):
  Water Scarcity Risk: {'YES — BOREHOLE PREMIUM KES 2,000,000+ MANDATORY' if gw.get('water_scarcity_risk') else 'No scarcity risk detected'}
  Aquifer Productivity: {gw.get('aquifer_productivity') or 'Unknown'}
  Depth to Groundwater: {str(gw.get('depth_to_groundwater_m')) + 'm' if gw.get('depth_to_groundwater_m') is not None else 'Not determined'}
  Hydrogeology: {gw.get('hydrogeology_description') or 'N/A'}
  Data Source: {gw.get('data_source') or 'fallback'}

AIR QUALITY (Copernicus Sentinel-5P NRTI):
  Severe Air Pollution: {'YES — HIGH NO₂ DETECTED — HEALTH HAZARD & TENANT DEMAND SUPPRESSED' if env.get('severe_air_pollution') else 'No severe pollution detected'}
  NO₂ Column Density: {f"{env.get('no2_mol_per_m2'):.2e} mol/m²" if env.get('no2_mol_per_m2') is not None else 'N/A'} (threshold: 1.0e-4 mol/m²)
  Pollutant: {env.get('pollutant_type') or 'NO2'}
  Satellite: {env.get('no2_data_source') or 'Sentinel-5P NRTI'}

FULL CONTEXT JSON (ground truth — do not ignore):
{payload_json}

DETERMINISTIC SCORE (COPY EXACTLY INTO YOUR JSON — DO NOT MODIFY):
  land_feasibility_score = {payload.get('_deterministic_score', 'NOT COMPUTED')}
  land_feasibility_label = "{payload.get('_deterministic_label', 'NOT COMPUTED')}"
  Score deductions that produced this score: {json.dumps(payload.get('_score_deductions', []))}

CRITICAL INSTRUCTION: Your JSON output MUST have:
  "land_feasibility_score": {payload.get('_deterministic_score', 0)}
  "land_feasibility_label": "{payload.get('_deterministic_label', 'UNKNOWN')}"
These are server-computed from hard data. Any deviation is a system error.

Write the full financial auditor risk assessment JSON now."""


    # Try models in order using the new google.genai SDK.
    # gemini-2.5-flash is confirmed working on this key.
    MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash"]
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

    # Parse Gemini response with safe fallback — never crash on malformed JSON
    parsed = safe_gemini_parse(raw_text)
    parsed["_model_used"] = _succeeded_model

    # Merge hard boolean flags from the spatial payload — these always win over AI output
    for bool_key in ("demolition_risk", "riparian_breach", "aviation_risk",
                      "road_reserve_risk", "flood_history"):
        if bool_key in payload:
            parsed[bool_key] = payload[bool_key]

    # Validate that all required fields exist with correct types / default values
    parsed = validate_payload(parsed)

    # Deterministically override investment_verdict based on hard geospatial flags
    parsed = enforce_verdict(parsed)

    return parsed


# ─── Verdict Enforcement ─────────────────────────────────────────────────────

def enforce_verdict(payload: dict) -> dict:
    """Override AI verdict with hard geospatial rules. Never trust AI alone for fatal flags.

    Priority order:
      1. demolition_risk OR riparian_breach → FATAL
      2. aviation_risk OR foundation_premium > 500,000 → CAUTION
      3. Otherwise trust the AI verdict (CLEAR)
    """
    if payload.get("demolition_risk") or payload.get("riparian_breach"):
        payload["investment_verdict"] = "DO NOT BUY — FATAL LEGAL FLAW"
    elif payload.get("aviation_risk") or (
        payload.get("cost_summary", {}).get("estimated_foundation_premium_kes", 0) > 500000
    ):
        payload["investment_verdict"] = "PROCEED WITH CAUTION"
    # If AI returned CLEAR and no fatal/caution flags → trust it
    return payload


def validate_payload(payload: dict) -> dict:
    """Ensure all required fields are present with correct types. Fill defaults if missing."""
    defaults = {
        "demolition_risk": False,
        "riparian_breach": False,
        "aviation_risk": False,
        "road_reserve_breach": False,
        "flood_risk": False,
        "distance_to_waterway_m": 0.0,
        "grid_distance_km": 0.0,
        "ward": "",
        "place_name": "",
        "county": "",
        "cost_summary": {
            "estimated_foundation_premium_kes": 0,
            "estimated_legal_risk_kes": 0,
            "total_hidden_cost_estimate_kes": 0,
        },
        "investment_verdict": "CLEAR FOR DUE DILIGENCE",
        "executive_summary": "",
        "risk_flags": [],
    }
    for key, default in defaults.items():
        if key not in payload or payload[key] is None:
            payload[key] = default
        if isinstance(default, dict):
            for subkey, subdefault in default.items():
                if subkey not in payload[key] or payload[key][subkey] is None:
                    payload[key][subkey] = subdefault
    return payload


def safe_gemini_parse(raw_text: str) -> dict:
    """
    Attempt to parse Gemini's response as JSON.
    If Gemini returns malformed JSON or an error, return a safe minimal payload
    rather than crashing the entire report generation.
    """
    try:
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(
            f"Gemini JSON parse failure: {e}. "
            f"Raw response (first 500 chars): {raw_text[:500]}"
        )
        return {
            "investment_verdict": "CLEAR FOR DUE DILIGENCE",
            "executive_summary": (
                "Our AI analysis could not be completed for this parcel. "
                "Geospatial risk flags below were calculated independently and are reliable. "
                "Complete all due diligence steps before proceeding."
            ),
            "risk_flags": [],
            "cost_summary": {
                "estimated_foundation_premium_kes": 0,
                "estimated_legal_risk_kes": 0,
                "total_hidden_cost_estimate_kes": 0,
            },
        }


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

    context = {
        "payload": payload,
        "report": report,
        "vision_summary": vision_summary,
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

