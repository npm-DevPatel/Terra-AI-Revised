"""
flow/routes.py — POST /api/flow/report

Terra Flow: AI-generated professional reports.
Reads Lens + Sim data from Supabase, generates audience-calibrated documents.
"""
from flask import Blueprint, jsonify, request
from core.auth import require_auth
from core.gemini import generate_flow_report
from core.supabase import get_service_client

bp = Blueprint("flow", __name__)


@bp.route("/api/flow/report", methods=["POST"])
def report():
    user_id, raw_jwt, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id = body.get("project_id")
    sim_plan_id = body.get("sim_plan_id")      # optional
    analysis_id = body.get("analysis_id")      # optional
    report_type = body.get("report_type", "due_diligence")
    audience = body.get("audience", "client")

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400

    valid_types = {"due_diligence", "planning", "progress", "executive", "lender"}
    valid_audiences = {"client", "bank", "government", "internal"}
    if report_type not in valid_types:
        return jsonify({"error": f"report_type must be one of {sorted(valid_types)}."}), 400
    if audience not in valid_audiences:
        return jsonify({"error": f"audience must be one of {sorted(valid_audiences)}."}), 400

    sb = get_service_client()
    analysis_data = {}
    sim_data = {}

    if sb:
        try:
            # Fetch analysis
            if analysis_id:
                res = sb.table("analyses").select("raw_result").eq("id", analysis_id).single().execute()
            else:
                res = sb.table("analyses").select("raw_result").eq("project_id", project_id).order("created_at", desc=True).limit(1).single().execute()
            analysis_data = (res.data or {}).get("raw_result", {})
        except Exception:
            pass

        try:
            # Fetch sim plan
            if sim_plan_id:
                res = sb.table("sim_plans").select("result,inputs").eq("id", sim_plan_id).single().execute()
            else:
                res = sb.table("sim_plans").select("result,inputs").eq("project_id", project_id).order("created_at", desc=True).limit(1).single().execute()
            sim_data = res.data or {}
        except Exception:
            pass

    result = generate_flow_report(analysis_data, sim_data, report_type, audience)

    if result.get("gemini_failed"):
        return jsonify({"error": "Report generation temporarily unavailable."}), 503

    # Save to flow_reports
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
