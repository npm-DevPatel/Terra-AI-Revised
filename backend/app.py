"""
Terra AI — Backend API
Flask application entry point.

Routes:
  POST /api/lens/analyze     — Vision + geospatial land analysis
  POST /api/sim/recommend    — Site layout scenarios
  POST /api/flow/report      — Professional report generation
  POST /api/copilot/chat     — Cross-project AI assistant

Collaboration (chat, notifications, invites, file storage) is handled
entirely by Supabase from the frontend — no Python routes needed.
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS

from lens.routes import bp as lens_bp
from sim.routes import bp as sim_bp
from flow.routes import bp as flow_bp
from copilot.routes import bp as copilot_bp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB (photos)

# ── CORS ──────────────────────────────────────────────────────────────────────
_frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
_cors_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    r"https://.*\.vercel\.app",
    r"https://terra-ai.*\.onrender\.com",
]
if _frontend_url:
    _cors_origins.insert(0, _frontend_url)

CORS(app, resources={r"/api/*": {"origins": _cors_origins}})

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(lens_bp)
app.register_blueprint(sim_bp)
app.register_blueprint(flow_bp)
app.register_blueprint(copilot_bp)

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
