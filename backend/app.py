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

# ── CORS CONFIGURATION ────────────────────────────────────────────────────────
# NOTE: flask-cors does NOT evaluate plain strings as regex.
# We use compiled regex patterns so matching actually works at runtime.
_ORIGIN_PATTERNS = [
    re.compile(r"^https?://localhost:\d+$"),                         # Local dev
    re.compile(r"^https://terra-ai-revised(-[\w\d]+)*\.onrender\.com$"),  # All Render deploys
]

# Exact URL set from env (optional hard-coded fallback)
_EXTRA_ORIGINS: set[str] = set()
_frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if _frontend_url:
    _EXTRA_ORIGINS.add(_frontend_url)


def _is_allowed_origin(origin: str) -> bool:
    if origin in _EXTRA_ORIGINS:
        return True
    return any(pat.match(origin) for pat in _ORIGIN_PATTERNS)


CORS(
    app,
    origins=_is_allowed_origin,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Type"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    max_age=600,
)


@app.before_request
def handle_preflight():
    """Explicitly handle OPTIONS preflight so CORS headers are always present,
    even when gunicorn/flask-cors miss them on cold starts."""
    if request.method != "OPTIONS":
        return None
    origin = request.headers.get("Origin", "")
    if not _is_allowed_origin(origin):
        return None  # Let Flask return 403 naturally
    from flask import make_response
    resp = make_response("", 204)
    resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    resp.headers["Access-Control-Max-Age"] = "600"
    return resp

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