"""
sim/routes.py — POST /api/sim/recommend

Terra Sim: AI-powered site layout planning.
Reads saved Lens analysis from Supabase, generates 3 layout scenarios with Gemini.
"""
from flask import Blueprint, jsonify, request
from core.auth import require_auth
from core.gemini import recommend_sim_layout
from core.supabase import get_service_client

bp = Blueprint("sim", __name__)


@bp.route("/api/sim/recommend", methods=["POST"])
def recommend():
    user_id, raw_jwt, err = require_auth()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    project_id = body.get("project_id")
    analysis_id = body.get("analysis_id")  # optional
    user_inputs = {
        "plot_area_sqm": body.get("plot_area_sqm"),
        "use_class": body.get("use_class", "residential"),
        "floors": body.get("floors", 4),
        "priorities": body.get("priorities", []),
        "budget_kes": body.get("budget_kes"),
    }

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400

    sb = get_service_client()
    analysis_data = {}

    # Fetch the most recent Lens analysis for this project (or specific one)
    if sb:
        try:
            if analysis_id:
                res = sb.table("analyses").select("raw_result").eq("id", analysis_id).single().execute()
            else:
                res = sb.table("analyses").select("raw_result").eq("project_id", project_id).order("created_at", desc=True).limit(1).single().execute()
            analysis_data = (res.data or {}).get("raw_result", {})
        except Exception as exc:
            print(f"[Sim] Could not fetch analysis (non-fatal): {exc}")

    result = recommend_sim_layout(analysis_data, user_inputs)

    if result.get("gemini_failed"):
        return jsonify({"error": "AI layout generation temporarily unavailable."}), 503

    # Save to sim_plans
    if sb:
        try:
            import uuid
            plan_id = str(uuid.uuid4())
            sb.table("sim_plans").insert({
                "id": plan_id,
                "project_id": project_id,
                "analysis_id": analysis_id,
                "created_by": user_id,
                "title": f"Sim Plan — {user_inputs.get('use_class','').replace('_',' ').title()}",
                "scenario": "custom",
                "inputs": user_inputs,
                "result": result,
            }).execute()
            result["sim_plan_id"] = plan_id
        except Exception as exc:
            print(f"[Sim] DB save failed (non-fatal): {exc}")

    return jsonify(result)
