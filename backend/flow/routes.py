"""
flow/routes.py — Terra Flow / Terra Report API

Endpoints:
  POST /api/flow/report  — professional JSON report (existing)
  POST /api/flow/html    — beautiful 12-page branded HTML report (new)
"""
from flask import Blueprint, jsonify, request
from core.auth import require_auth
from core.gemini import generate_flow_report, generate_flow_html
from core.supabase import get_service_client

bp = Blueprint("flow", __name__)

_VALID_TYPES     = {"due_diligence", "planning", "progress", "executive", "lender",
                    "site_suitability", "investor", "architect"}
_VALID_AUDIENCES = {"client", "bank", "government", "internal"}


def _fetch_context(sb, project_id: str, analysis_id: str | None, sim_plan_id: str | None):
    analysis_data, sim_data, planner_data = {}, {}, {}
    if not sb:
        return analysis_data, sim_data, planner_data
    try:
        if analysis_id:
            res = sb.table("analyses").select("raw_result").eq("id", analysis_id).single().execute()
        else:
            res = sb.table("analyses").select("raw_result").eq("project_id", project_id).order("created_at", desc=True).limit(1).single().execute()
        analysis_data = (res.data or {}).get("raw_result", {})
    except Exception:
        pass
    try:
        if sim_plan_id:
            res = sb.table("sim_plans").select("result,inputs").eq("id", sim_plan_id).single().execute()
        else:
            res = sb.table("sim_plans").select("result,inputs").eq("project_id", project_id).neq("scenario", "planner").order("created_at", desc=True).limit(1).single().execute()
        sim_data = res.data or {}
    except Exception:
        pass
    try:
        res = sb.table("sim_plans").select("result").eq("project_id", project_id).eq("scenario", "planner").order("created_at", desc=True).limit(1).single().execute()
        planner_data = (res.data or {}).get("result", {})
    except Exception:
        pass
    return analysis_data, sim_data, planner_data


@bp.route("/api/flow/report", methods=["POST"])
def report():
    user_id, raw_jwt, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id   = body.get("project_id")
    sim_plan_id  = body.get("sim_plan_id")
    analysis_id  = body.get("analysis_id")
    report_type  = body.get("report_type", "due_diligence")
    audience     = body.get("audience", "client")

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400
    if report_type not in _VALID_TYPES:
        return jsonify({"error": f"report_type must be one of {sorted(_VALID_TYPES)}."}), 400
    if audience not in _VALID_AUDIENCES:
        return jsonify({"error": f"audience must be one of {sorted(_VALID_AUDIENCES)}."}), 400

    sb = get_service_client()
    analysis_data, sim_data, _ = _fetch_context(sb, project_id, analysis_id, sim_plan_id)

    result = generate_flow_report(analysis_data, sim_data, report_type, audience)
    if result.get("gemini_failed"):
        return jsonify({"error": "Report generation temporarily unavailable."}), 503

    if sb:
        try:
            import uuid
            report_id = str(uuid.uuid4())
            sb.table("flow_reports").insert({
                "id": report_id,
                "project_id": project_id,
                "sim_plan_id": sim_plan_id,
                "created_by": user_id,
                "report_type": report_type,
                "audience": audience,
                "title": result.get("title", f"{report_type.replace('_',' ').title()} Report"),
                "content": result,
            }).execute()
            result["flow_report_id"] = report_id
        except Exception as exc:
            print(f"[Flow] DB save failed (non-fatal): {exc}")

    return jsonify(result)


# ── POST /api/flow/html — beautiful 12-page HTML report ──────────────────────

@bp.route("/api/flow/html", methods=["POST"])
def html_report():
    """
    Generate a beautiful 12-page branded HTML report for printing / PDF.
    Body: {project_id, report_type, audience, analysis_id?, sim_plan_id?}
    Returns: {html: str, title: str, flow_report_id: str}
    """
    user_id, _, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id   = body.get("project_id")
    report_type  = body.get("report_type", "site_suitability")
    audience     = body.get("audience", "client")
    analysis_id  = body.get("analysis_id")
    sim_plan_id  = body.get("sim_plan_id")

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400
    if report_type not in _VALID_TYPES:
        return jsonify({"error": f"report_type must be one of {sorted(_VALID_TYPES)}."}), 400
    if audience not in _VALID_AUDIENCES:
        return jsonify({"error": f"audience must be one of {sorted(_VALID_AUDIENCES)}."}), 400

    sb = get_service_client()
    analysis_data, sim_data, planner_data = _fetch_context(sb, project_id, analysis_id, sim_plan_id)

    # Fetch project name
    project_name = project_id
    if sb:
        try:
            p = sb.table("projects").select("name").eq("id", project_id).single().execute()
            project_name = (p.data or {}).get("name", project_id)
        except Exception:
            pass

    html = generate_flow_html(analysis_data, sim_data, planner_data, report_type, audience, project_name)
    title = f"{report_type.replace('_',' ').title()} — {project_name}"

    # Save a reference to flow_reports so it appears in the sidebar
    flow_report_id = None
    if sb:
        try:
            import uuid
            flow_report_id = str(uuid.uuid4())
            sb.table("flow_reports").insert({
                "id": flow_report_id,
                "project_id": project_id,
                "created_by": user_id,
                "report_type": report_type,
                "audience": audience,
                "title": title,
                "content": {"html": True, "title": title},
            }).execute()
        except Exception as exc:
            print(f"[Flow HTML] DB save failed (non-fatal): {exc}")

    return jsonify({"html": html, "title": title, "flow_report_id": flow_report_id})
