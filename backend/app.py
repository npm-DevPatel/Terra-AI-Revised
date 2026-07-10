"""
Terra AI — Backend API
Flask application entry point.

Routes:
  POST  /api/lens/analyze       — Vision + geospatial land analysis
  POST  /api/lens/tap           — Terra Tap point-on-image Q&A
  POST  /api/sim/recommend      — Site layout scenarios
  POST  /api/planner/generate   — AI project phase roadmap
  POST  /api/planner/explain    — Explain a planner task
  POST  /api/planner/priorities — Today's top 3 actions
  PATCH /api/planner/update     — Evolve plan on new data
  POST  /api/flow/report        — Professional JSON report
  POST  /api/flow/html          — Beautiful 12-page HTML report
  POST  /api/copilot/chat       — Cross-project AI assistant

Collaboration (chat, notifications, invites, file storage) is handled
entirely by Supabase from the frontend — no Python routes needed.
"""
import os
import re
from flask import Flask, jsonify, request
from flask_cors import CORS

from lens.routes import bp as lens_bp
from sim.routes import bp as sim_bp
from flow.routes import bp as flow_bp
from copilot.routes import bp as copilot_bp
from planner.routes import bp as planner_bp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB (photos)

# ── CORS ──────────────────────────────────────────────────────────────────────
_frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")

# Allow any terra-ai-revised*.onrender.com subdomain (handles Render preview URLs)
# plus localhost dev servers and the explicit FRONTEND_URL env var.
_ORIGIN_RE = re.compile(
    r'^(https?://localhost:\d+|https://terra-ai-revised[^.]*\.onrender\.com)$',
    re.IGNORECASE,
)

def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return False
    if _frontend_url and origin.rstrip("/") == _frontend_url:
        return True
    return bool(_ORIGIN_RE.match(origin))

CORS(
    app,
    origins=_is_origin_allowed,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Type"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    max_age=600,
)

@app.after_request
def _add_cors_headers(response):
    """Belt-and-suspenders: ensure CORS headers on every response."""
    origin = request.headers.get("Origin", "")
    if _is_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, X-Requested-With"
        )
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        )
        response.headers["Vary"] = "Origin"
    return response

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(lens_bp)
app.register_blueprint(sim_bp)
app.register_blueprint(flow_bp)
app.register_blueprint(copilot_bp)
app.register_blueprint(planner_bp)

# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "terra-ai-api"})


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found."}), 404


@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "Request too large. Max 20 MB."}), 413


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error."}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
