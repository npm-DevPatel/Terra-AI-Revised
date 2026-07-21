"""
core/gemini.py — All AI interactions for Terra AI (powered by Groq / llama-3.1-8b-instant).

Functions:
  1. synthesize_lens_report()     — land analysis from geospatial + vision data
  2. answer_copilot()             — cross-project Q&A with @project context
  3. recommend_sim_layout()       — site layout scenarios from saved Lens data
  4. generate_flow_report()       — audience-calibrated professional report (JSON)
  5. generate_tap_answer()        — Terra Tap: answer about a tapped image point
  6. generate_planner_roadmap()   — AI phase roadmap for Terra Planner
  7. explain_planner_task()       — explain why a specific task is in the plan
  8. get_planner_priorities()     — surface today's top 3 actions
  9. update_planner_from_event()  — dynamic plan evolution on new data
 10. generate_flow_html()         — beautiful 12-page branded HTML report
"""
import json
import logging
import os

from groq import Groq

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
_groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

_FLASH = "llama-3.1-8b-instant"
_PRO   = "llama-3.1-8b-instant"

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
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set.")


def _call_gemini(model_name: str, system_prompt: str, user_message: str, json_mode: bool = True) -> dict | str:
    """
    Call Groq (llama-3.1-8b-instant) with the given system prompt and user message.
    Signature kept as _call_gemini so all callers remain unchanged.
    """
    import re

    if not _groq_client:
        err = "GROQ_API_KEY not set."
        logger.error(err)
        if json_mode:
            return {"error": err, "gemini_failed": True}
        return f"Terra AI is temporarily unavailable: {err}"

    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ]
        kwargs = {"model": model_name, "messages": messages, "temperature": 0.2, "max_tokens": 8192}
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = _groq_client.chat.completions.create(**kwargs)
        raw = response.choices[0].message.content

        if not json_mode:
            return raw

        clean = re.sub(r"```(?:json)?\s*|\s*```", "", raw, flags=re.IGNORECASE).strip()
        return json.loads(clean)

    except Exception as exc:
        logger.error(f"[Groq] {model_name} failed: {exc}")
        if json_mode:
            return {"error": f"Groq unavailable: {str(exc)}", "gemini_failed": True}
        return f"Terra AI is temporarily unavailable: {str(exc)}"


# ══════════════════════════════════════════════════════════════════════════════
# ── 5. Terra Tap — point-on-image Q&A ────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

_TAP_SYSTEM = """You are Terra AI. A user tapped on a specific point in a site photograph and asked a question about it.
Using the image analysis data provided, answer the question about the area near that point.
Be concise (2-4 sentences). Be specific — reference what was visually detected.
Respond as plain text (no JSON, no markdown)."""


def generate_tap_answer(analysis_context: dict, tap_x_pct: float, tap_y_pct: float, question: str) -> str:
    """
    Answer a Terra Tap question about a specific point in a site image.

    Args:
        analysis_context: The raw_result from the analyses table (vision + geo data).
        tap_x_pct: Horizontal tap position as a fraction 0–1 (left to right).
        tap_y_pct: Vertical tap position as a fraction 0–1 (top to bottom).
        question: The user's question about that point.
    """
    _require_key()

    vision = analysis_context.get("vision_analysis", {})
    objects = vision.get("objects", [])
    labels = [l["description"] for l in vision.get("labels", [])[:8]]

    # Find the object(s) whose bounding box contains or is nearest to the tap point
    nearby = []
    for obj in objects:
        bbox = obj.get("bbox", [])
        if len(bbox) == 4:
            xs = [v.get("x", 0) for v in bbox]
            ys = [v.get("y", 0) for v in bbox]
            x_min, x_max = min(xs), max(xs)
            y_min, y_max = min(ys), max(ys)
            if x_min <= tap_x_pct <= x_max and y_min <= tap_y_pct <= y_max:
                nearby.append(obj["name"])

    user_msg = f"""The user tapped at position ({tap_x_pct:.2f}, {tap_y_pct:.2f}) in a site photograph where:
  x=0 is left, x=1 is right, y=0 is top, y=1 is bottom.

Objects detected in the image: {', '.join(o['name'] for o in objects[:8]) or 'None'}
Objects at or near tap point: {', '.join(nearby) or 'None clearly at that point'}
Scene labels: {', '.join(labels) or 'None'}
Construction detected: {vision.get('construction_detected', False)}
Water/drainage signals: {vision.get('water_signals', False)}
Vegetation type: {vision.get('vegetation_type') or 'None classified'}
Text on site: {', '.join(vision.get('text_on_site', [])[:3]) or 'None'}

Site context (geospatial):
  Score: {analysis_context.get('_deterministic_score', 'N/A')} / 100
  Soil type: {analysis_context.get('soil_type', 'Unknown')}
  Flood history: {analysis_context.get('flood_history', False)}
  Riparian breach: {analysis_context.get('riparian_breach', False)}

User's question about the tapped point: {question}"""

    return _call_gemini(_FLASH, _TAP_SYSTEM, user_msg, json_mode=False)


# ══════════════════════════════════════════════════════════════════════════════
# ── 6–9. Terra Planner ───────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

_PLANNER_SYSTEM = """You are Terra Planner — an expert construction project intelligence engine for Kenya.
You generate AI-driven project roadmaps grounded in real site data.
Every phase and task must be justified by the site analysis data.
Reference soil type, flood risk, slope, legal constraints, infrastructure gaps explicitly.
Respond ONLY with valid JSON. No markdown fences."""

_PLANNER_SCHEMA = """{
  "roadmap_title": "string",
  "ai_intro": "string — 2-3 sentences explaining the plan rationale",
  "total_estimated_weeks": "integer",
  "site_context_summary": "string — key site facts that shaped this plan",
  "phases": [
    {
      "id": "phase_1",
      "number": 1,
      "name": "string — e.g. Site Validation",
      "status": "in_progress",
      "ai_note": "string — why this phase comes at this position",
      "estimated_weeks": "integer",
      "tasks": [
        {
          "id": "string — short slug e.g. geotech_survey",
          "name": "string",
          "status": "pending",
          "priority": "high|medium|low",
          "estimated_days": "integer",
          "auto_completed": "boolean — true if Lens already provides this data"
        }
      ]
    }
  ]
}"""


def generate_planner_roadmap(project_info: dict, analysis_data: dict) -> dict:
    """
    Generate a full 6-phase AI project roadmap for Terra Planner.

    Args:
        project_info: {name, description, use_class, budget_kes, floors}
        analysis_data: raw_result from analyses table
    """
    _require_key()

    score = analysis_data.get("_deterministic_score", 100)
    deductions = analysis_data.get("_score_deductions", [])
    risks = [d["reason"] for d in deductions]

    user_msg = f"""Generate a detailed construction project roadmap for this Kenyan project.

PROJECT:
  Name: {project_info.get('name', 'Unnamed Project')}
  Description: {project_info.get('description', 'Not specified')}
  Use class: {project_info.get('use_class', 'residential')}
  Target floors: {project_info.get('floors', 4)}
  Budget: {project_info.get('budget_kes', 'Not specified')} KES

TERRA LENS SITE ANALYSIS:
  Feasibility score: {score}/100
  Key risks detected: {', '.join(risks) or 'None'}
  Soil type: {analysis_data.get('soil_type', 'Unknown')}
  Clay %: {analysis_data.get('soil_clay_pct', 'N/A')}
  Flood history: {analysis_data.get('flood_history', False)}
  Riparian breach: {analysis_data.get('riparian_breach', False)}
  Demolition risk: {analysis_data.get('demolition_risk', False)}
  Slope %: {analysis_data.get('slope_percent', 'N/A')}
  Distance to grid: {analysis_data.get('distance_to_grid_m', 'N/A')} m
  Groundwater scarcity: {(analysis_data.get('groundwater') or {}).get('water_scarcity_risk', False)}

Generate exactly 6 phases: Site Validation, Design, Approvals, Procurement, Construction, Completion.
For each phase, generate realistic tasks. Mark tasks as auto_completed=true if Terra Lens already provides the data (e.g. terrain analysis = done if we have site analysis).
The first phase should always have at least one auto_completed task to show immediate value."""

    return _call_gemini(_FLASH, _PLANNER_SYSTEM + "\n\nSchema:\n" + _PLANNER_SCHEMA, user_msg)


def explain_planner_task(task_name: str, phase_name: str, project_info: dict, analysis_data: dict) -> str:
    """Return a 2-4 sentence plain-text explanation of why a task is in the plan."""
    _require_key()

    risks = [d["reason"] for d in analysis_data.get("_score_deductions", [])]
    user_msg = f"""Task: "{task_name}" in phase "{phase_name}".
Project: {project_info.get('name','')}, {project_info.get('use_class','residential')}, {project_info.get('floors',4)} floors.
Site risks: {', '.join(risks) or 'None detected'}.
Soil: {analysis_data.get('soil_type','Unknown')}, clay {analysis_data.get('soil_clay_pct','N/A')}%.
Why is this task in the plan and why at this stage? Answer in 2-4 plain sentences."""

    return _call_gemini(
        _FLASH,
        "You are Terra Planner. Explain a project task in 2-4 plain sentences grounded in site data. No JSON.",
        user_msg, json_mode=False
    )


def get_planner_priorities(phases: list, analysis_data: dict) -> dict:
    """
    Surface the 3 most critical actions to take right now.
    Returns {"priorities": [{"rank": 1, "task_name": str, "phase": str, "reason": str}]}
    """
    _require_key()

    # Collect all pending tasks
    pending = []
    for ph in phases:
        for t in ph.get("tasks", []):
            if t.get("status") != "done" and not t.get("auto_completed"):
                pending.append({"task": t["name"], "phase": ph["name"], "priority": t.get("priority", "medium")})

    user_msg = f"""From these pending tasks, select the top 3 most critical to start today.
Site score: {analysis_data.get('_deterministic_score', 100)}/100
Flood risk: {analysis_data.get('flood_history', False)}
Soil: {analysis_data.get('soil_type', 'Unknown')}
Pending tasks: {json.dumps(pending[:20])}

Return JSON: {{"priorities": [{{"rank": 1, "task_name": "str", "phase": "str", "reason": "str — 1 sentence"}}]}}"""

    return _call_gemini(_FLASH, _PLANNER_SYSTEM, user_msg)


def update_planner_from_event(phases: list, event_type: str, event_data: dict, analysis_data: dict) -> dict:
    """
    React to a new event (e.g. soil report uploaded) and update the plan.
    Returns {"changes": [...], "updated_phases": [...same as roadmap phases...]}
    """
    _require_key()

    user_msg = f"""The following event occurred on a Terra Planner project:
Event type: {event_type}
Event data: {json.dumps(event_data)[:1000]}

Current phase summary: {json.dumps([{"phase": p['name'], "pending": sum(1 for t in p['tasks'] if t.get('status') != 'done')} for p in phases])}
Site: soil={analysis_data.get('soil_type','Unknown')}, score={analysis_data.get('_deterministic_score',100)}

Based on this event, what tasks can now be unlocked, reprioritised, or completed?
Return JSON:
{{
  "changes": [{{"change_type": "task_unlocked|priority_raised|task_completed|timeline_reduced", "description": "string"}}],
  "updated_phases": <same structure as planner schema phases[]>
}}"""

    return _call_gemini(_FLASH, _PLANNER_SYSTEM, user_msg)


# ══════════════════════════════════════════════════════════════════════════════
# ── 10. Terra Report — beautiful HTML document ───────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

_HTML_SYSTEM = """You are Terra AI's report engine. Generate a beautiful, professional 12-page HTML report.
OUTPUT: a single self-contained HTML string with ALL CSS inline in a <style> tag.
No external fonts (use system fonts). No external images.
The report must have:
  - A cover page with the Terra AI name ("Terra AI"), the project name, report type, date, and a large inspiring quote
  - A table of contents
  - 10+ content sections with real data, professional tables, and key figures
  - Footer on every page with "Terra AI — Where Building Begins..." and page info
  - Terra AI branding in emerald green (#10b981) and dark slate (#0f172a)
  - Inspiring Terra AI quotes spread through the document (pick from: "Every Building Tells a Story, We Help You Read It", "Every Project Deserves a Smarter Beginning", "AI That Sees Beyond the Surface", "Design Starts With Understanding")
  - Data tables with proper borders and alternating row colours
  - KES cost figures where available
  - Professional typography, generous white space, print-ready layout using @media print
Do NOT output anything except the HTML. Start with <!DOCTYPE html>."""


_HTML_REPORT_SECTIONS = {
    "site_suitability": [
        "Executive Summary", "Site Overview & Coordinates",
        "Land Feasibility Score", "Geotechnical Assessment",
        "Hydrology & Flood Risk", "Legal & Regulatory Compliance",
        "Infrastructure Assessment", "Environmental & Vegetation Analysis",
        "Development Cost Estimates", "Risk Register", "Recommendations", "Appendix"
    ],
    "investor": [
        "Executive Summary", "Investment Opportunity Overview",
        "Site Risk Profile", "Market Context & Location Value",
        "Development Feasibility", "Cost & Revenue Projections",
        "Legal Status & Title", "Infrastructure & Utilities",
        "Environmental Risk", "Risk-Adjusted Returns", "Recommendation", "Due Diligence Checklist"
    ],
    "architect": [
        "Executive Summary", "Site Analysis Brief",
        "Topography & Terrain", "Soil & Geotechnical Data",
        "Solar Orientation & Passive Cooling", "Drainage & Hydrology",
        "Zoning & Regulatory Constraints", "Infrastructure Connections",
        "Vegetation & Site Cover", "Development Scenarios", "Sustainability Notes", "Appendix"
    ],
    "due_diligence": [
        "Executive Summary", "Site Overview", "Legal & Title Status",
        "Geotechnical Assessment", "Infrastructure Assessment",
        "Risk Summary", "Cost Estimates", "Recommendation"
    ],
    "lender": [
        "Executive Summary", "Property Overview", "Site Risk Assessment",
        "Development Viability", "Cost & Revenue Analysis",
        "Loan Security Assessment", "Conditions Precedent"
    ],
}


def generate_flow_html(
    analysis_data: dict,
    sim_data: dict,
    planner_data: dict,
    report_type: str,
    audience: str,
    project_name: str = "Terra AI Project",
) -> str:
    """
    Generate a beautiful 12-page branded HTML report.

    Returns a raw HTML string ready to render in a browser and print as PDF.
    """
    _require_key()

    sections = _HTML_REPORT_SECTIONS.get(report_type, _HTML_REPORT_SECTIONS["site_suitability"])
    audience_note = _AUDIENCE_INSTRUCTIONS.get(audience, _AUDIENCE_INSTRUCTIONS["client"])
    today = __import__("datetime").date.today().strftime("%B %d, %Y")

    geo_summary = f"""
Feasibility score: {analysis_data.get('_deterministic_score', 'N/A')}/100
Label: {analysis_data.get('_deterministic_label', 'N/A')}
Soil type: {analysis_data.get('soil_type', 'Unknown')} (clay {analysis_data.get('soil_clay_pct', 'N/A')}%)
Slope: {analysis_data.get('slope_percent', 'N/A')}%
Flood history: {analysis_data.get('flood_history', False)}
Riparian breach: {analysis_data.get('riparian_breach', False)}
Demolition risk: {analysis_data.get('demolition_risk', False)}
Distance to grid: {analysis_data.get('distance_to_grid_m', 'N/A')} m
Foundation premium estimate: KES {analysis_data.get('soil_foundation_premium_kes', 0):,}
Groundwater scarcity: {(analysis_data.get('groundwater') or {}).get('water_scarcity_risk', False)}
NDVI: {analysis_data.get('ndvi_score', 'N/A')} ({analysis_data.get('ndvi_interpretation', '')})
Land cover: {analysis_data.get('land_cover_label', 'Unknown')}
Address: {analysis_data.get('address', 'Not specified')}""" if analysis_data else "No Lens analysis available."

    user_msg = f"""Generate a complete, professional {report_type.replace('_',' ').upper()} report as a full HTML document.

Project name: {project_name}
Report type: {report_type}
Audience: {audience} — {audience_note}
Date: {today}
Required sections: {', '.join(sections)}

TERRA LENS DATA:
{geo_summary}

TERRA SIM DATA:
{json.dumps(sim_data, ensure_ascii=False)[:2000] if sim_data else 'No layout scenario available.'}

TERRA PLANNER DATA:
{json.dumps(planner_data, ensure_ascii=False)[:2000] if planner_data else 'No planner data available.'}

Generate the full 12-page HTML now. Make every table data-driven using the figures above.
Use emerald (#10b981) as the primary brand colour throughout.
Include a professional risk register table, cost breakdown table, and timeline table.
Spread the four Terra AI quotes across chapter dividers."""

    result = _call_gemini(_PRO, _HTML_SYSTEM, user_msg, json_mode=False)
    if isinstance(result, dict):
        return f"<html><body><p>Report generation failed: {result.get('error','Unknown error')}</p></body></html>"
    return result
