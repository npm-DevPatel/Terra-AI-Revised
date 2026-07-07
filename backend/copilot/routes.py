"""
copilot/routes.py — POST /api/copilot/chat

Terra Copilot: cross-project AI assistant.
Accepts @project references, fetches all data for those projects,
and answers with full context awareness.
"""
from flask import Blueprint, jsonify, request
from core.auth import require_auth
from core.gemini import answer_copilot
from core.supabase import get_service_client

bp = Blueprint("copilot", __name__)


def _fetch_project_context(project_id: str) -> dict:
    """Fetch all data for a project from Supabase."""
    sb = get_service_client()
    if not sb:
        return {}
    try:
        project = sb.table("projects").select("id,name,description").eq("id", project_id).single().execute()
        analyses = sb.table("analyses").select("id,title,score,label,address,raw_result,created_at").eq("project_id", project_id).order("created_at", desc=True).limit(5).execute()
        sim_plans = sb.table("sim_plans").select("id,title,scenario,inputs,result,created_at").eq("project_id", project_id).order("created_at", desc=True).limit(3).execute()
        flow_reports = sb.table("flow_reports").select("id,title,report_type,audience,content,created_at").eq("project_id", project_id).order("created_at", desc=True).limit(3).execute()

        return {
            "name": (project.data or {}).get("name", project_id),
            "description": (project.data or {}).get("description", ""),
            "analyses": analyses.data or [],
            "sim_plans": sim_plans.data or [],
            "flow_reports": flow_reports.data or [],
        }
    except Exception as exc:
        print(f"[Copilot] Failed to fetch project {project_id}: {exc}")
        return {"name": project_id, "analyses": [], "sim_plans": [], "flow_reports": []}


@bp.route("/api/copilot/chat", methods=["POST"])
def chat():
    user_id, raw_jwt, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    message = body.get("message", "").strip()
    resolved_refs = body.get("resolved_refs", [])  # [{type: "project", id: "uuid", name: "..."}]

    if not message:
        return jsonify({"error": "message is required."}), 400

    # Fetch context for every @project reference
    project_contexts = []
    for ref in resolved_refs:
        if ref.get("type") == "project" and ref.get("id"):
            ctx = _fetch_project_context(ref["id"])
            project_contexts.append(ctx)

    answer = answer_copilot(message, project_contexts)

    return jsonify({"answer": answer})
