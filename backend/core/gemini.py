"""
core/gemini.py — All Gemini AI interactions for Terra AI.

Four functions, each purpose-built:
  1. synthesize_lens_report()  — land analysis from geospatial + vision data
  2. answer_copilot()          — cross-project Q&A with @project context
  3. recommend_sim_layout()    — site layout scenarios from saved Lens data
  4. generate_flow_report()    — audience-calibrated professional report
"""
import json
import logging
import os
import warnings

logger = logging.getLogger(__name__)

with warnings.catch_warnings():
    warnings.filterwarnings("ignore", category=FutureWarning)
    import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

_FLASH = "gemini-2.5-flash"
_PRO   = "gemini-2.5-flash"  # use Flash for both to stay on free tier; swap to pro later

KENYA_LAND_SYSTEM_PROMPT = """You are Terra AI — a trusted, objective land intelligence advisor for Kenya, specialising in sustainable construction and real estate development.

CORE PURPOSE: Provide accurate, neutral, actionable intelligence. Never fabricate data.

SCORING RULE: The land_feasibility_score is pre-computed server-side and in the payload as "_deterministic_score". Copy it verbatim. Do not adjust it.

COST NEUTRALITY: Present all development costs as neutral budget line items with KES figures. Never frame costs as "dangerous" unless they represent genuine legal risk (riparian breach, demolition buffer, protected land).

KENYA LAW: Apply the Physical and Land Use Planning Act (2019), Water Act (2016) riparian rules, Kenya Civil Aviation Authority height restrictions. Use KES, KPLC, NCA, Ardhisasa, Title Deed terminology.

RULE — SOIL: clay_pct > 45 → Black Cotton (raft foundation, KES 800k–1.5M premium). clay_pct 30–45 → moderate clay (strip with investigation, KES 200k–500k). clay_pct < 30 → stable, standard strip.

RULE — RIPARIAN: 30m NEMA buffer breach → FATAL. Government repossession, zero compensation.

RULE — DEMOLITION: KeNHA/SGR buffer → demolition risk under Kenya Roads Act. Obtain written clearance.

RULE — VISION DATA: If vision_analysis is present in the payload, extract and incorporate:
  - What structures/vegetation/terrain features are visually confirmed on site
  - Any text detected (plot numbers, warning signs, survey beacons)
  - Construction activity signals
  - Water / drainage signals visible in photo
  Treat vision data as ground-truth visual confirmation to complement geospatial data.

Respond ONLY with valid JSON. No markdown fences."""


# ── 1. Terra Lens — full site analysis ───────────────────────────────────────

LENS_SCHEMA = """{
  "land_feasibility_score": <integer 0-100, COPY from _deterministic_score>,
  "land_feasibility_label": "<SAFE | MODERATE WARNINGS | CRITICAL / HIGH RISK, COPY from _deterministic_label>",
  "investment_verdict": "<DO NOT BUY — FATAL LEGAL FLAW | PROCEED WITH CAUTION | CLEAR FOR DUE DILIGENCE>",
  "executive_summary": "<2 sentences max. Single biggest risk or all-clear.>",
  "visual_site_summary": "<What Terra AI can visually confirm from the photo: structures, terrain, vegetation, any text/signage on site. Only if vision data provided.>",
  "risk_flags": [
    {"flag_name": "string", "severity": "<FATAL|CAUTION|ADVISORY>", "explanation": "string", "estimated_kes_impact": "number or string"}
  ],
  "cost_summary": {
    "estimated_foundation_premium_kes": "number",
    "estimated_infrastructure_budget_kes": "number",
    "total_development_cost_estimate_kes": "number"
  },
  "sections": [
    {"id": "legal_risks", "title": "Legal & Regulatory", "risk_level": "<low|medium|high|critical>", "body": "string"},
    {"id": "foundation", "title": "Foundation & Geotechnical", "risk_level": "<low|medium|high>", "body": "string"},
    {"id": "infrastructure", "title": "Infrastructure Budget", "risk_level": "info", "body": "string"},
    {"id": "sustainability", "title": "Sustainable Building Considerations", "risk_level": "info", "body": "string"}
  ]
}"""


def synthesize_lens_report(payload: dict) -> dict:
    """
    Generate a full Terra Lens land intelligence report.
    Combines geospatial data + Google Vision photo analysis.
    """
    _require_key()

    vision = payload.get("vision_analysis", {})
    vision_summary = ""
    if vision and not vision.get("error"):
        labels = [l["description"] for l in vision.get("labels", [])[:8]]
        objects = [o["name"] for o in vision.get("objects", [])[:6]]
        text = vision.get("text_on_site", [])[:5]
        vision_summary = f"""
VISUAL ANALYSIS (Google Vision API):
  Labels detected: {', '.join(labels) or 'None'}
  Objects detected: {', '.join(objects) or 'None'}
  Text on site: {', '.join(text) or 'None'}
  Construction activity: {'YES' if vision.get('construction_detected') else 'Not detected'}
  Water/drainage signals: {'YES' if vision.get('water_signals') else 'Not detected'}
  Vegetation type: {vision.get('vegetation_type') or 'Not classified'}"""

    gw = payload.get("groundwater", {})
    coords = payload.get("coordinates", {})

    user_msg = f"""Analyse this site as a ruthless financial auditor for sustainable Kenyan real estate development.

LOCATION: {payload.get('ward','')} ward, {payload.get('county','')} County ({coords.get('lat',0):.5f}, {coords.get('lng',0):.5f})
ADDRESS: {payload.get('address', 'Unknown')}
ELEVATION: {payload.get('elevation_m','N/A')} m ASL
SLOPE: {payload.get('slope_percent','N/A')}%
{vision_summary}

SOIL (ISRIC SoilGrids):
  Type: {payload.get('soil_type','Unknown')}
  Clay %: {payload.get('soil_clay_pct','N/A')}
  CEC: {payload.get('soil_cec_cmolc_kg','N/A')} cmol/kg
  Foundation premium: KES {payload.get('soil_foundation_premium_kes', 0):,}

HYDROLOGY:
  Flood history (JRC): {'YES' if payload.get('flood_history') else 'No'}
  Riparian breach (30m): {'YES - FATAL' if payload.get('riparian_breach') else 'No'}
  Seasonal water: {'YES' if payload.get('seasonal_water') else 'No'}
  Topographical sinkhole: {'YES' if payload.get('is_topographical_sinkhole') else 'No'}
  CHIRPS rainfall: {payload.get('chirps_rainfall_index','Unknown')} ({payload.get('chirps_max_rainfall_mm','N/A')} mm/day max)

GROUNDWATER (BGS Kenya_HG):
  Scarcity risk: {'YES — KES 2,000,000+ borehole MANDATORY' if gw.get('water_scarcity_risk') else 'No'}
  Depth: {gw.get('depth_to_groundwater_m','N/A')} m
  Aquifer: {gw.get('aquifer_productivity','Unknown')}

LEGAL / REGULATORY:
  Demolition risk (KeNHA/SGR): {'YES - FATAL' if payload.get('demolition_risk') else 'No'}
  Aviation height cap (KCAA): {'YES' if payload.get('aviation_height_restriction') else 'No'}
  Road reserve risk: {'YES' if payload.get('road_reserve_risk') else 'No'}
  Protected land: {'YES - FATAL' if payload.get('protected_land_risk') else 'No'}

INFRASTRUCTURE:
  Power grid: {payload.get('distance_to_grid_m','N/A')} m
  Water connection: {'Yes' if payload.get('water_connection_nearby') else 'Not detected'}
  Nearest road: {payload.get('nearest_road_m','N/A')} m
  Zone tier: {payload.get('_zone_tier','N/A')}

AMENITIES: Police {payload.get('nearest_police_km','N/A')}km · Hospital {payload.get('nearest_hospital_km','N/A')}km

DETERMINISTIC SCORE (COPY VERBATIM — DO NOT MODIFY):
  land_feasibility_score = {payload.get('_deterministic_score', 0)}
  land_feasibility_label = "{payload.get('_deterministic_label','UNKNOWN')}"

Full context: {json.dumps(payload, ensure_ascii=False)[:8000]}

Output the JSON report now. Include a sustainability section with passive cooling, water harvesting, and green building recommendations relevant to this specific site."""

    return _call_gemini(_FLASH, KENYA_LAND_SYSTEM_PROMPT + "\n\nSchema:\n" + LENS_SCHEMA, user_msg)


# ── 2. Terra Copilot — cross-project Q&A ─────────────────────────────────────

COPILOT_SYSTEM = """You are Terra Copilot — the AI assistant embedded in the Terra AI construction platform.

You have access to one or more project workspaces. Each project contains:
  - Lens analyses (geospatial + visual site data, risk scores)
  - Sim plans (layout scenarios, setbacks, FAR calculations)
  - Flow reports (professional reports for clients, banks, government)

Answer the user's question using the provided project context. Be specific — reference actual data values from the projects, not generalities.

If the user references a project with @ProjectName, use ALL data from that project to answer.
If multiple projects are referenced, compare or synthesise across them.

Respond in clear, professional English. You may use bullet points for structured data but keep prose tight.
For cost questions, always provide KES figures.
For planning questions, reference the relevant Kenyan regulations."""


def answer_copilot(message: str, project_contexts: list[dict]) -> str:
    """
    Answer a Terra Copilot question with full project data as context.

    Args:
        message: The user's question.
        project_contexts: List of project data dicts from Supabase.
                          Each contains: project name, analyses[], sim_plans[], flow_reports[]

    Returns:
        Plain text answer from Gemini.
    """
    _require_key()

    context_blocks = []
    for proj in project_contexts:
        name = proj.get("name", "Unnamed Project")
        analyses = proj.get("analyses", [])
        sim_plans = proj.get("sim_plans", [])
        flow_reports = proj.get("flow_reports", [])
        context_blocks.append(
            f"PROJECT: {name}\n"
            f"  Analyses: {json.dumps(analyses, ensure_ascii=False)[:3000]}\n"
            f"  Sim Plans: {json.dumps(sim_plans, ensure_ascii=False)[:1500]}\n"
            f"  Flow Reports: {json.dumps(flow_reports, ensure_ascii=False)[:1500]}"
        )

    context_str = "\n\n".join(context_blocks) if context_blocks else "No project data available."

    user_msg = f"""Project context:\n{context_str}\n\nUser question: {message}"""

    result = _call_gemini(_FLASH, COPILOT_SYSTEM, user_msg, json_mode=False)
    if isinstance(result, str):
        return result
    return result.get("answer", str(result))


# ── 3. Terra Sim — layout scenarios ──────────────────────────────────────────

SIM_SYSTEM = """You are a Kenyan urban planning and sustainable architecture AI. Generate three practical development layout scenarios based on the site data provided. All scenarios must comply with Kenyan planning law (Physical and Land Use Planning Act 2019) and NCA requirements."""

SIM_SCHEMA = """{
  "scenarios": [
    {
      "id": "A",
      "name": "string — e.g. Maximise Residential Units",
      "description": "string",
      "footprint_sqm": "number",
      "floors": "number",
      "far": "number",
      "parking_bays": "number",
      "green_space_sqm": "number",
      "setbacks": {"front_m": "number", "rear_m": "number", "left_m": "number", "right_m": "number"},
      "sustainability_features": ["passive cooling", "rainwater harvesting", ...],
      "estimated_build_cost_kes": "number",
      "pros": ["string"],
      "cons": ["string"]
    }
  ],
  "site_constraints_summary": "string — key constraints that shaped all scenarios",
  "recommended_scenario": "A|B|C",
  "recommendation_reason": "string"
}"""


def recommend_sim_layout(analysis_data: dict, user_inputs: dict) -> dict:
    """
    Generate three site layout scenarios for Terra Sim.

    Args:
        analysis_data: The raw_result from the analyses table.
        user_inputs: {plot_area_sqm, use_class, floors, priorities[]}
    """
    _require_key()

    user_msg = f"""Site constraints from Terra Lens analysis:
{json.dumps(analysis_data, ensure_ascii=False)[:5000]}

User development brief:
  Plot area: {user_inputs.get('plot_area_sqm','N/A')} sqm
  Use class: {user_inputs.get('use_class','residential')}
  Target floors: {user_inputs.get('floors', 4)}
  Priorities: {', '.join(user_inputs.get('priorities', []))}
  Budget ceiling: {user_inputs.get('budget_kes', 'Not specified')} KES

Generate three development scenarios. Each must be immediately actionable for a Kenyan NCA building permit application. Include solar orientation, passive cooling strategy, and rainwater harvesting recommendation for each scenario."""

    return _call_gemini(_FLASH, SIM_SYSTEM + "\n\nSchema:\n" + SIM_SCHEMA, user_msg)


# ── 4. Terra Flow — professional report generation ────────────────────────────

FLOW_SYSTEM = """You are a professional report writer for the construction and real estate industry in Kenya. Generate audience-calibrated reports from Terra AI project data. Be formal, precise, and data-driven."""

FLOW_SCHEMA = """{
  "title": "string",
  "prepared_for": "string",
  "prepared_by": "Terra AI",
  "date": "string — ISO date",
  "executive_summary": "string — 3-4 sentences",
  "sections": [
    {"id": "string", "title": "string", "content": "string — structured paragraphs"}
  ],
  "appendix": {
    "data_sources": ["string"],
    "disclaimer": "string"
  }
}"""

_AUDIENCE_INSTRUCTIONS = {
    "bank":       "Write for a lender's credit committee. Emphasise risk, security value, loan-to-cost ratio, and exit strategy. Be conservative.",
    "client":     "Write for a property developer client. Balance opportunity and risk. Be clear about costs and timelines.",
    "government": "Write for a government planning authority. Emphasise regulatory compliance, zoning, environmental impact, and public interest.",
    "internal":   "Write for internal project team use. Be technical and detailed. Include all data points.",
}

_REPORT_TYPE_SECTIONS = {
    "due_diligence": ["Site Overview", "Legal & Title Status", "Geotechnical Assessment", "Infrastructure Assessment", "Risk Summary", "Recommendation"],
    "lender":        ["Property Overview", "Site Risk Assessment", "Development Viability", "Cost & Revenue Analysis", "Loan Security Assessment", "Conditions Precedent"],
    "planning":      ["Site Context", "Zoning Compliance", "Environmental Assessment", "Infrastructure Capacity", "Development Proposal", "Planning Conditions"],
    "executive":     ["Project Summary", "Key Risks", "Financial Overview", "Recommendation"],
    "progress":      ["Project Status", "Construction Progress", "Issues & Risks", "Next Steps", "Photo Evidence Summary"],
}


def generate_flow_report(analysis_data: dict, sim_data: dict, report_type: str, audience: str) -> dict:
    """
    Generate a professional Terra Flow report.

    Args:
        analysis_data: Raw result from analyses table (may be None).
        sim_data: Result from sim_plans table (may be None).
        report_type: due_diligence | lender | planning | executive | progress
        audience: bank | client | government | internal
    """
    _require_key()

    audience_instruction = _AUDIENCE_INSTRUCTIONS.get(audience, _AUDIENCE_INSTRUCTIONS["client"])
    sections_needed = _REPORT_TYPE_SECTIONS.get(report_type, _REPORT_TYPE_SECTIONS["due_diligence"])

    user_msg = f"""Audience instruction: {audience_instruction}

Report type: {report_type.upper().replace('_', ' ')}
Required sections: {', '.join(sections_needed)}

Terra Lens site data:
{json.dumps(analysis_data, ensure_ascii=False)[:4000] if analysis_data else 'No Lens analysis available — generate report from available Sim data only.'}

Terra Sim layout data:
{json.dumps(sim_data, ensure_ascii=False)[:3000] if sim_data else 'No Sim plan available.'}

Generate the full professional report now. All cost figures in KES. Reference Kenyan law and planning standards where applicable."""

    system = FLOW_SYSTEM + "\n\nSchema:\n" + FLOW_SCHEMA
    return _call_gemini(_PRO, system, user_msg)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _require_key():
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set.")


def _call_gemini(model_name: str, system_prompt: str, user_message: str, json_mode: bool = True) -> dict | str:
    """
    Call Gemini with the given system prompt and user message.
    Falls back to gemini-2.0-flash if the primary model fails.
    """
    models_to_try = [model_name]
    if model_name != "gemini-2.0-flash":
        models_to_try.append("gemini-2.0-flash")

    last_exc = None
    for name in models_to_try:
        try:
            config = genai.GenerationConfig(
                temperature=0.2,
                max_output_tokens=8192,
            )
            if json_mode:
                config = genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                    max_output_tokens=8192,
                )
            model = genai.GenerativeModel(
                model_name=name,
                generation_config=config,
                system_instruction=system_prompt,
            )
            response = model.generate_content(user_message)
            raw = response.text

            if not json_mode:
                return raw

            # Parse JSON
            import re
            clean = re.sub(r"```(?:json)?\s*|\s*```", "", raw, flags=re.IGNORECASE).strip()
            import json as _json
            return _json.loads(clean)

        except Exception as exc:
            last_exc = exc
            logger.warning(f"[Gemini] {name} failed: {exc}")
            continue

    logger.error(f"[Gemini] All models failed. Last error: {last_exc}")
    if json_mode:
        return {"error": f"Gemini unavailable: {str(last_exc)}", "gemini_failed": True}
    return f"Terra Copilot is temporarily unavailable: {str(last_exc)}"
