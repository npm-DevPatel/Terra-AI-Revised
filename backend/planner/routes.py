"""
planner/routes.py — Terra Planner API

Four endpoints (all independent, all share project context via project_id):
  POST  /api/planner/generate    — AI phase roadmap from Lens analysis
  POST  /api/planner/explain     — explain why a specific task exists
  POST  /api/planner/priorities  — surface today's top 3 critical actions
  PATCH /api/planner/update      — dynamically evolve plan on new data/events

Plans are stored in `sim_plans` with scenario='planner' to avoid a new DB table.
"""
import uuid
from flask import Blueprint, jsonify, request

from core.auth import require_auth
from core.supabase import get_service_client
from core.gemini import (
    generate_planner_roadmap,
    explain_planner_task,
    get_planner_priorities,
    update_planner_from_event,
)

bp = Blueprint("planner", __name__)


def _fetch_latest_analysis(project_id: str, analysis_id: str | None = None) -> dict:
    sb = get_service_client()
    if not sb:
        return {}
    try:
        if analysis_id:
            res = sb.table("analyses").select("raw_result").eq("id", analysis_id).single().execute()
        else:
            res = (sb.table("analyses").select("raw_result")
                   .eq("project_id", project_id)
                   .order("created_at", desc=True).limit(1).single().execute())
        return (res.data or {}).get("raw_result", {})
    except Exception as exc:
        print(f"[Planner] fetch analysis failed (non-fatal): {exc}")
        return {}


def _fetch_latest_plan(project_id: str) -> dict:
    sb = get_service_client()
    if not sb:
        return {}
    try:
        res = (sb.table("sim_plans").select("id,result,inputs")
               .eq("project_id", project_id)
               .eq("scenario", "planner")
               .order("created_at", desc=True).limit(1).single().execute())
        return res.data or {}
    except Exception:
        return {}


# ── POST /api/planner/generate ────────────────────────────────────────────────

@bp.route("/api/planner/generate", methods=["POST"])
def generate():
    """
    Generate (or regenerate) an AI project roadmap.
    Body: {project_id, analysis_id?, use_class?, floors?, budget_kes?}
    Returns: {plan_id, roadmap_title, ai_intro, phases[], ...}
    """
    user_id, _, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id   = body.get("project_id")
    analysis_id  = body.get("analysis_id")

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400

    # Fetch project info for context
    project_info = {"name": project_id}
    sb = get_service_client()
    if sb:
        try:
            p = sb.table("projects").select("name,description").eq("id", project_id).single().execute()
            project_info = {**(p.data or {}), **body}
        except Exception:
            project_info = {**body, "name": project_id}

    analysis_data = _fetch_latest_analysis(project_id, analysis_id)

    result = generate_planner_roadmap(project_info, analysis_data)
    if result.get("gemini_failed"):
        return jsonify({"error": "Planner generation temporarily unavailable."}), 503

    # Persist to sim_plans with scenario='planner'
    plan_id = str(uuid.uuid4())
    if sb:
        try:
            sb.table("sim_plans").insert({
                "id": plan_id,
                "project_id": project_id,
                "created_by": user_id,
                "title": result.get("roadmap_title", "Project Plan"),
                "scenario": "planner",
                "inputs": {"use_class": body.get("use_class"), "floors": body.get("floors"), "budget_kes": body.get("budget_kes")},
                "result": result,
            }).execute()
        except Exception as exc:
            print(f"[Planner] DB save failed (non-fatal): {exc}")

    result["plan_id"] = plan_id
    return jsonify(result)


# ── POST /api/planner/explain ─────────────────────────────────────────────────

@bp.route("/api/planner/explain", methods=["POST"])
def explain():
    """
    Explain why a specific task is in the plan.
    Body: {project_id, task_name, phase_name, analysis_id?}
    Returns: {explanation: str}
    """
    user_id, _, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id = body.get("project_id")
    task_name  = (body.get("task_name") or "").strip()
    phase_name = (body.get("phase_name") or "").strip()

    if not project_id or not task_name:
        return jsonify({"error": "project_id and task_name are required."}), 400

    # Project info
    project_info = {"name": project_id}
    sb = get_service_client()
    if sb:
        try:
            p = sb.table("projects").select("name,description").eq("id", project_id).single().execute()
            project_info = p.data or {"name": project_id}
        except Exception:
            pass

    analysis_data = _fetch_latest_analysis(project_id, body.get("analysis_id"))
    explanation   = explain_planner_task(task_name, phase_name, project_info, analysis_data)
    return jsonify({"explanation": explanation})


# ── POST /api/planner/priorities ──────────────────────────────────────────────

@bp.route("/api/planner/priorities", methods=["POST"])
def priorities():
    """
    Return today's top 3 critical actions.
    Body: {project_id, plan_id?}
    Returns: {priorities: [{rank, task_name, phase, reason}]}
    """
    user_id, _, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id = body.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id is required."}), 400

    # Fetch plan phases
    plan_record = _fetch_latest_plan(project_id)
    phases      = (plan_record.get("result") or {}).get("phases", [])

    analysis_data = _fetch_latest_analysis(project_id)
    result = get_planner_priorities(phases, analysis_data)
    if result.get("gemini_failed"):
        return jsonify({"error": "Priorities generation temporarily unavailable."}), 503

    return jsonify(result)


# ── PATCH /api/planner/update ─────────────────────────────────────────────────

@bp.route("/api/planner/update", methods=["PATCH"])
def update():
    """
    Dynamically evolve the plan when new information arrives.
    Body: {project_id, event_type, event_data, plan_id?}
    event_type examples: 'soil_report_uploaded', 'permit_approved', 'contractor_selected'
    Returns: {changes[], updated_phases[], plan_id}
    """
    user_id, _, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id  = body.get("project_id")
    event_type  = body.get("event_type", "manual_update")
    event_data  = body.get("event_data", {})

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400

    # Fetch current plan
    plan_record   = _fetch_latest_plan(project_id)
    current_phases = (plan_record.get("result") or {}).get("phases", [])
    analysis_data  = _fetch_latest_analysis(project_id)

    result = update_planner_from_event(current_phases, event_type, event_data, analysis_data)
    if result.get("gemini_failed"):
        return jsonify({"error": "Plan update temporarily unavailable."}), 503

    # Persist updated plan
    sb = get_service_client()
    plan_id = plan_record.get("id") or str(uuid.uuid4())
    if sb:
        try:
            updated_result = {**(plan_record.get("result") or {}), "phases": result.get("updated_phases", current_phases)}
            sb.table("sim_plans").upsert({
                "id": plan_id,
                "project_id": project_id,
                "created_by": user_id,
                "title": "Project Plan",
                "scenario": "planner",
                "inputs": {},
                "result": updated_result,
            }).execute()
        except Exception as exc:
            print(f"[Planner] Update save failed (non-fatal): {exc}")

    result["plan_id"] = plan_id
    return jsonify(result)
