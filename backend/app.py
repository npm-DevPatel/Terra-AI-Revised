import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import Any, Callable, cast

from spatial.routes import bp as spatial_bp
from bootstrap import start_background_warmup, warmup_status

try:
    from flask_limiter import Limiter  # type: ignore
    from flask_limiter.util import get_remote_address  # type: ignore
    _HAS_LIMITER = True
except ImportError:
    Limiter = None
    get_remote_address = None
    _HAS_LIMITER = False


app = Flask(__name__)
start_background_warmup(wait=os.getenv("TERRA_WARMUP_SYNC", "1") == "1")

# ── Request size cap ──────────────────────────────────────────────────────────
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow requests from the Vercel frontend (set FRONTEND_URL in Render env vars).
# Falls back to localhost for local development.
_frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if _frontend_url:
    CORS(app, origins=[_frontend_url, "http://localhost:5173", "http://localhost:5174"])
else:
    CORS(app)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
# Protects Gemini, Google Maps and GEE API quotas from abuse.
# Uses in-memory storage (resets on restart — sufficient for Render free tier).
# Gracefully disabled if flask-limiter is not installed.
if _HAS_LIMITER:
    assert get_remote_address is not None
    key_func = cast(Callable[[], str], get_remote_address)
    LimiterClass = cast(Any, Limiter)
    limiter = LimiterClass(
        key_func=key_func,
        app=app,
        # Global fallback: 300 requests per hour per IP across all endpoints
        default_limits=["300 per hour", "60 per minute"],
        # Use in-memory storage — no Redis needed on free tier
        storage_uri="memory://",
    )
    _LIMITER_ENABLED = True
    print("[Terra AI] Rate limiter enabled.")
else:
    limiter = None
    _LIMITER_ENABLED = False
    print("[Terra AI] flask-limiter not installed — rate limiting disabled.")


# ── Security headers ──────────────────────────────────────────────────────────
# Added to every response to harden the API surface.
@app.after_request
def add_security_headers(response):
    # Prevent browsers from MIME-sniffing content
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Minimal referrer info leakage
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Disable client-side caching for API responses
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    return response


# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(spatial_bp)

# ── Per-endpoint rate limits (applied via decorator in route files) ───────────
# These are exposed so routes.py can import and use them.
# spatial/scan: 10/hour — Gemini is expensive; abuse = direct quota cost
if _LIMITER_ENABLED:
    app.config["LIMITER"] = limiter


# ── Error handlers ────────────────────────────────────────────────────────────
@app.errorhandler(413)
def handle_413(error):
    return jsonify({"error": "Request too large. Maximum upload size is 10 MB."}), 413


@app.errorhandler(429)
def handle_429(error):
    return jsonify({
        "error": "Too many requests. Please wait a moment before trying again.",
        "retry_after": "60 seconds"
    }), 429


@app.errorhandler(500)
def handle_500(error):
    print(f"[Terra AI] Unhandled 500 error: {error}")
    return jsonify({"error": "Internal server error", "details": str(error)}), 500


@app.errorhandler(404)
def handle_404(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(400)
def handle_400(error):
    return jsonify({"error": "Bad request"}), 400


# ── Root & health ─────────────────────────────────────────────────────────────
@app.get("/")
def index():
    return jsonify({
        "ok": True,
        "service": "terra-ai-backend",
        "endpoints": {
            "health":        "/health",
            "spatial_scan":  "/api/spatial/scan",
        },
    })


@app.get("/favicon.ico")
def favicon():
    return ("", 204)


@app.get("/health")
def health():
    """
    Health check — intentionally has no rate limit so the frontend
    keep-alive ping and Render's own health checks always get through.
    """
    return jsonify({"ok": True})


@app.get("/ready")
def ready():
    status = warmup_status()
    code = 200 if status.get("ready") else 503
    return jsonify(status), code


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
