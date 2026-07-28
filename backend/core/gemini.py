"""
core/gemini.py - Presentation-mode Terra responses.

This module intentionally does not call Groq, Gemini, or any external model.
The route layer still imports the same function names, but every function
returns deterministic demo content suitable for the presentation_mode flow.
"""
from datetime import date
import html


LENS_DEMO_RESPONSES = {
    "land": (
        "These two marked pieces of land read differently. The lower parcel looks more open and buildable, "
        "with clearer room for access, drainage control, and a compact footprint. The upper parcel feels more "
        "exposed to slope movement and runoff from the surrounding terrain, so I would treat it as the parcel "
        "that needs more geotechnical caution before committing design capital."
    ),
    "hillside": (
        "Well, how you build aesthetically depends on both your preferences as a person and what exactly you "
        "are building. For a tourism estate, facing the hills is a strong design move because the view becomes "
        "part of the product: decks, glazing, arrival sequence, and outdoor rooms can all borrow from that "
        "landscape. For an ordinary residential home, I would still face key living spaces toward the hills, "
        "but balance that with privacy, wind exposure, morning light, and the cost of managing slope, drainage, "
        "and access."
    ),
    "sky": (
        "Yes, in Tigoni - it gets really cold, and dark cloud cover like this often points to moisture-heavy "
        "weather. I would assume the site is prone to rain and plan early for roof drainage, water harvesting, "
        "erosion control, covered walkways, and construction scheduling that respects the wet season."
    ),
    "comparison": (
        "Beautiful catch. The two circled areas are spaced apart, but they are not equal from a planning point "
        "of view. One appears more open, visually calmer, and easier to organize around access and a building "
        "footprint. The other sits closer to stronger terrain changes and visual interruptions, which means it "
        "may need more drainage thinking, slope checks, and careful orientation."
    ),
}


def _score(analysis_data: dict | None, default: int = 84) -> int:
    if not analysis_data:
        return default
    value = analysis_data.get("_deterministic_score") or analysis_data.get("score") or default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _label(score: int) -> str:
    if score >= 80:
        return "SAFE"
    if score >= 55:
        return "MODERATE WARNINGS"
    return "CRITICAL / HIGH RISK"


def _risk_flags(data: dict | None) -> list[dict]:
    data = data or {}
    flags = []
    if data.get("flood_history") or data.get("chirps_rainfall_index") == "high":
        flags.append({
            "flag_name": "Rain and drainage sensitivity",
            "severity": "CAUTION",
            "explanation": "The site should be planned with roof drainage, water harvesting, and erosion control from day one.",
            "estimated_kes_impact": "Site-specific drainage allowance required",
        })
    if data.get("riparian_breach"):
        flags.append({
            "flag_name": "Riparian buffer check",
            "severity": "FATAL",
            "explanation": "Any structure inside a protected water buffer can face enforcement action. Confirm the official boundary before design.",
            "estimated_kes_impact": "Potential redesign or no-build zone",
        })
    if data.get("soil_clay_pct", 0) and data.get("soil_clay_pct", 0) >= 30:
        flags.append({
            "flag_name": "Clay soil foundation allowance",
            "severity": "CAUTION",
            "explanation": "Clay-rich soil can require stronger foundation design and earlier geotechnical confirmation.",
            "estimated_kes_impact": data.get("soil_foundation_premium_kes", "Geotechnical allowance required"),
        })
    return flags or [{
        "flag_name": "Demo site review",
        "severity": "ADVISORY",
        "explanation": "No fatal constraint is shown in the presentation context. Proceed with survey, title, drainage, and geotechnical checks.",
        "estimated_kes_impact": "Normal due-diligence budget",
    }]


def synthesize_lens_report(payload: dict) -> dict:
    score = _score(payload)
    label = payload.get("_deterministic_label") or _label(score)
    flags = _risk_flags(payload)
    return {
        "land_feasibility_score": score,
        "land_feasibility_label": label,
        "investment_verdict": "CLEAR FOR DUE DILIGENCE" if score >= 75 else "PROCEED WITH CAUTION",
        "executive_summary": (
            "Terra Lens presentation mode has reviewed the site context and highlighted the practical planning checks. "
            "The next best step is to confirm drainage, title, survey, and geotechnical conditions before design spend."
        ),
        "visual_site_summary": "The demo view emphasizes terrain, sky exposure, buildable parcels, and design orientation.",
        "risk_flags": flags,
        "cost_summary": {
            "estimated_foundation_premium_kes": payload.get("soil_foundation_premium_kes", 0),
            "estimated_infrastructure_budget_kes": payload.get("estimated_infrastructure_budget_kes", 750000),
            "total_development_cost_estimate_kes": payload.get("total_development_cost_estimate_kes", 0),
        },
        "sections": [
            {
                "id": "legal_risks",
                "title": "Legal & Regulatory",
                "risk_level": "low" if score >= 75 else "medium",
                "body": "Confirm title, road reserve, riparian buffers, county planning status, and any protected-land constraints before commitment.",
            },
            {
                "id": "foundation",
                "title": "Foundation & Geotechnical",
                "risk_level": "medium",
                "body": "Use the presentation analysis as an early signal, then commission geotechnical confirmation before structural design.",
            },
            {
                "id": "infrastructure",
                "title": "Infrastructure Budget",
                "risk_level": "info",
                "body": "Budget for access, drainage, water, and power as named workstreams rather than treating them as late surprises.",
            },
            {
                "id": "sustainability",
                "title": "Sustainable Building Considerations",
                "risk_level": "info",
                "body": "Prioritize rainwater harvesting, passive cooling, erosion control, and landscape buffers that work with the land.",
            },
        ],
    }


def answer_copilot(message: str, project_contexts: list[dict]) -> str:
    clean = (message or "").lower()
    if any(word in clean for word in ("cloud", "rain", "prone", "weather")):
        return LENS_DEMO_RESPONSES["sky"]
    if any(word in clean for word in ("hill", "design perspective", "facing")):
        return LENS_DEMO_RESPONSES["hillside"]
    if any(word in clean for word in ("two", "spaced", "different", "pieces of land")):
        return LENS_DEMO_RESPONSES["comparison"]
    if any(word in clean for word in ("plan", "planner", "generate")):
        return "Your plan is generated. Open Terra Planner to review the roadmap, site checks, build stages, resources, budget, and reports."
    if project_contexts:
        name = project_contexts[0].get("name", "this project")
        return f"For {name}, I would focus first on drainage, geotechnical confirmation, access, and the design orientation shown in the presentation flow."
    return "I am in presentation mode, so I can walk through the prepared Terra demo responses and planner flow without calling an external model."


def recommend_sim_layout(analysis_data: dict, user_inputs: dict) -> dict:
    plot_area = user_inputs.get("plot_area_sqm") or 1200
    floors = int(user_inputs.get("floors") or 4)
    use_class = user_inputs.get("use_class") or "residential"
    return {
        "scenarios": [
            {
                "id": "A",
                "name": "View-Led Residential Cluster",
                "description": "Orient key living spaces toward the hills while keeping the footprint compact and drainage routes clear.",
                "footprint_sqm": round(float(plot_area) * 0.32),
                "floors": floors,
                "far": round(floors * 0.32, 2),
                "parking_bays": max(8, floors * 6),
                "green_space_sqm": round(float(plot_area) * 0.38),
                "setbacks": {"front_m": 6, "rear_m": 4.5, "left_m": 3, "right_m": 3},
                "sustainability_features": ["rainwater harvesting", "deep roof overhangs", "erosion-control planting"],
                "estimated_build_cost_kes": round(float(plot_area) * floors * 42000),
                "pros": ["Strong orientation", "Clear drainage strategy", "Balanced density"],
                "cons": ["Requires survey and geotechnical confirmation"],
            },
            {
                "id": "B",
                "name": "Low-Impact Estate Layout",
                "description": "Use a lighter footprint with more landscape buffer and staged access improvements.",
                "footprint_sqm": round(float(plot_area) * 0.24),
                "floors": max(2, floors - 1),
                "far": round(max(2, floors - 1) * 0.24, 2),
                "parking_bays": max(6, floors * 4),
                "green_space_sqm": round(float(plot_area) * 0.5),
                "setbacks": {"front_m": 7.5, "rear_m": 6, "left_m": 4.5, "right_m": 4.5},
                "sustainability_features": ["permeable paths", "water harvesting", "native landscape buffers"],
                "estimated_build_cost_kes": round(float(plot_area) * max(2, floors - 1) * 36000),
                "pros": ["Lower terrain disturbance", "More landscape value", "Strong tourism-estate feel"],
                "cons": ["Lower development yield"],
            },
            {
                "id": "C",
                "name": "Compact Phased Build",
                "description": "Start with the cleanest buildable zone and reserve the second parcel for later expansion.",
                "footprint_sqm": round(float(plot_area) * 0.28),
                "floors": floors,
                "far": round(floors * 0.28, 2),
                "parking_bays": max(8, floors * 5),
                "green_space_sqm": round(float(plot_area) * 0.42),
                "setbacks": {"front_m": 6, "rear_m": 6, "left_m": 3, "right_m": 3},
                "sustainability_features": ["phased drainage", "solar-ready roof", "stormwater swales"],
                "estimated_build_cost_kes": round(float(plot_area) * floors * 39000),
                "pros": ["Good for staged financing", "Keeps future options open", "Simple first phase"],
                "cons": ["Requires disciplined master planning"],
            },
        ],
        "site_constraints_summary": f"Presentation mode assumes a {use_class} brief shaped by slope, rain, access, and view orientation.",
        "recommended_scenario": "A",
        "recommendation_reason": "Scenario A best matches the demo story: use the hills as a design asset while keeping drainage and buildability under control.",
    }


def generate_flow_report(analysis_data: dict, sim_data: dict, report_type: str, audience: str) -> dict:
    score = _score(analysis_data)
    title = f"{report_type.replace('_', ' ').title()} Report"
    return {
        "title": title,
        "prepared_for": audience.title(),
        "prepared_by": "Terra AI",
        "date": date.today().isoformat(),
        "executive_summary": (
            "This presentation-mode report summarizes the site story, key risks, and next actions. "
            "It is designed for the demo workflow and does not require an external AI provider."
        ),
        "sections": [
            {"id": "site", "title": "Site Intelligence", "content": f"Current demo feasibility score: {score}/100."},
            {"id": "risks", "title": "Risk Summary", "content": "Primary checks are drainage, geotechnical confirmation, access, survey, and title due diligence."},
            {"id": "recommendation", "title": "Recommendation", "content": "Proceed with a staged feasibility workflow before detailed architectural design."},
        ],
        "appendix": {
            "data_sources": ["Terra presentation mode", "Stored project context"],
            "disclaimer": "Presentation output only. Confirm all legal, survey, and technical items with qualified professionals.",
        },
    }


def generate_tap_answer(analysis_context: dict, tap_x_pct: float, tap_y_pct: float, question: str) -> str:
    return answer_copilot(question, [{"name": "Terra Lens Demo", "analyses": [analysis_context or {}]}])


def generate_planner_roadmap(project_info: dict, analysis_data: dict) -> dict:
    name = project_info.get("name") or "Terra Presentation Project"
    score = _score(analysis_data)
    phases = [
        ("site_validation", "Site Validation", ["Review Terra Lens findings", "Confirm survey beacons", "Commission geotechnical check"]),
        ("design", "Design", ["Set view orientation", "Define drainage strategy", "Prepare concept layout"]),
        ("approvals", "Approvals", ["Confirm county planning status", "Prepare NEMA/NCA pathway", "Check utility approvals"]),
        ("procurement", "Procurement", ["Shortlist consultants", "Prepare cost plan", "Identify key suppliers"]),
        ("construction", "Construction", ["Site preparation", "Foundation works", "Drainage and access works"]),
        ("completion", "Completion", ["Final inspections", "Handover report", "Operations checklist"]),
    ]
    return {
        "roadmap_title": f"{name} Terra Planner Roadmap",
        "ai_intro": f"Presentation mode generated this roadmap from the demo site story. The site currently reads at {score}/100, so the plan prioritizes validation, drainage, and design orientation.",
        "total_estimated_weeks": 36,
        "site_context_summary": "View orientation, rain exposure, slope, access, and staged buildability shape the plan.",
        "phases": [
            {
                "id": phase_id,
                "number": index + 1,
                "name": phase_name,
                "status": "in_progress" if index == 0 else "pending",
                "ai_note": "This phase keeps the demo workflow grounded in practical construction sequence.",
                "estimated_weeks": 4 + index,
                "tasks": [
                    {
                        "id": task.lower().replace(" ", "_").replace("/", "_"),
                        "name": task,
                        "status": "done" if index == 0 and task.startswith("Review") else "pending",
                        "priority": "high" if index < 2 else "medium",
                        "estimated_days": 5,
                        "auto_completed": index == 0 and task.startswith("Review"),
                    }
                    for task in tasks
                ],
            }
            for index, (phase_id, phase_name, tasks) in enumerate(phases)
        ],
    }


def explain_planner_task(task_name: str, phase_name: str, project_info: dict, analysis_data: dict) -> str:
    return (
        f"{task_name} sits in {phase_name} because the presentation site needs decisions to follow the land, not guesswork. "
        "It helps confirm drainage, access, cost, and design orientation before the project moves into higher-spend stages."
    )


def get_planner_priorities(phases: list, analysis_data: dict) -> dict:
    pending = []
    for phase in phases or []:
        for task in phase.get("tasks", []):
            if task.get("status") != "done" and not task.get("auto_completed"):
                pending.append((phase.get("name", "Plan"), task.get("name", "Review task")))
    selected = pending[:3] or [
        ("Site Validation", "Confirm survey beacons"),
        ("Site Validation", "Commission geotechnical check"),
        ("Design", "Define drainage strategy"),
    ]
    return {
        "priorities": [
            {"rank": index + 1, "task_name": task, "phase": phase, "reason": "This is a high-value next step in the presentation workflow."}
            for index, (phase, task) in enumerate(selected)
        ]
    }


def update_planner_from_event(phases: list, event_type: str, event_data: dict, analysis_data: dict) -> dict:
    return {
        "changes": [{
            "change_type": "task_unlocked",
            "description": f"Presentation mode registered {event_type} and kept the roadmap moving without external AI.",
        }],
        "updated_phases": phases or generate_planner_roadmap({}, analysis_data).get("phases", []),
    }


def generate_flow_html(
    analysis_data: dict,
    sim_data: dict,
    planner_data: dict,
    report_type: str,
    audience: str,
    project_name: str = "Terra AI Project",
) -> str:
    title = f"{report_type.replace('_', ' ').title()} - {project_name}"
    safe_title = html.escape(title)
    score = _score(analysis_data)
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>{safe_title}</title>
  <style>
    body {{ font-family: Inter, Arial, sans-serif; color: #0f172a; margin: 40px; line-height: 1.6; }}
    h1, h2 {{ color: #0f172a; }}
    .brand {{ color: #10b981; font-weight: 800; }}
    .card {{ border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 16px 0; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
    th, td {{ border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }}
    th {{ background: #ecfdf5; color: #047857; }}
  </style>
</head>
<body>
  <p class="brand">Terra AI - Where Building Begins...</p>
  <h1>{safe_title}</h1>
  <div class="card">
    <h2>Executive Summary</h2>
    <p>This is a presentation-mode report. It summarizes the prepared Terra workflow without calling Groq, Gemini, or any model provider.</p>
  </div>
  <div class="card">
    <h2>Site Intelligence</h2>
    <table>
      <tr><th>Metric</th><th>Demo Value</th></tr>
      <tr><td>Feasibility Score</td><td>{score}/100</td></tr>
      <tr><td>Audience</td><td>{html.escape(audience.title())}</td></tr>
      <tr><td>Primary Checks</td><td>Drainage, survey, geotechnical, access, title due diligence</td></tr>
    </table>
  </div>
  <div class="card">
    <h2>Recommendation</h2>
    <p>Proceed with the staged Terra Planner workflow and use the presentation responses for the demo conversation.</p>
  </div>
</body>
</html>"""
