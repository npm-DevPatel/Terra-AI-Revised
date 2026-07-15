import os
import re
from flask import Flask, jsonify, make_response, request

from lens.routes import bp as lens_bp
from sim.routes import bp as sim_bp
from flow.routes import bp as flow_bp
from copilot.routes import bp as copilot_bp
from planner.routes import bp as planner_bp
from invites.routes import bp as invites_bp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB (photos)

# ── CORS — fully manual, no flask-cors dependency ────────────────────────────
# flask-cors callable-origin support is unreliable across versions.
# We own the full CORS logic here: explicit allowlist + regex fallback.

_ALLOWED_ORIGINS_EXPLICIT: set[str] = {
    # Hard-coded safe list — covers all known Render deploy URLs
    "https://terra-ai-revised-1.onrender.com",
    "https://terra-ai-revised.onrender.com",
    "https://terra-ai-revised-backend.onrender.com",
    "https://terra-ai-revised-frontend.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
}

# Also pick up FRONTEND_URL from environment (set in render.yaml)
_frontend_env = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if _frontend_env:
    _ALLOWED_ORIGINS_EXPLICIT.add(_frontend_env)

# Regex fallback — covers ANY *.onrender.com subdomain (incl. Render preview deploys)
_ORIGIN_RE = re.compile(r"^https?://(?:localhost:\d+|[\w-]+\.onrender\.com)$")


def _is_allowed(origin: str) -> bool:
    """Return True if the request Origin should receive CORS headers."""
    if not origin:
        return False
    if origin in _ALLOWED_ORIGINS_EXPLICIT:
        return True
    return bool(_ORIGIN_RE.match(origin))


_CORS_HEADERS = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods":     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":     "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age":           "600",
}


@app.before_request
def cors_preflight():
    """Handle OPTIONS preflight — must return 204 with CORS headers immediately."""
    if request.method != "OPTIONS":
        return None
    origin = request.headers.get("Origin", "")
    if not _is_allowed(origin):
        # Still return 200 so the browser doesn't get a network error, but
        # without Allow-Origin the browser will block the follow-up request.
        return make_response("", 204)
    resp = make_response("", 204)
    resp.headers["Access-Control-Allow-Origin"] = origin
    for k, v in _CORS_HEADERS.items():
        resp.headers[k] = v
    return resp


@app.after_request
def cors_headers(response):
    """Inject Access-Control-Allow-Origin on every non-OPTIONS response."""
    origin = request.headers.get("Origin", "")
    if _is_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        # Expose Content-Type so fetch() can read it
        response.headers["Access-Control-Expose-Headers"] = "Content-Type"
    return response


# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(lens_bp)
app.register_blueprint(sim_bp)
app.register_blueprint(flow_bp)
app.register_blueprint(copilot_bp)
app.register_blueprint(planner_bp)
app.register_blueprint(invites_bp)

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