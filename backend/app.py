import os
from flask import Flask, jsonify
from flask_cors import CORS

from lens.routes import bp as lens_bp
from sim.routes import bp as sim_bp
from flow.routes import bp as flow_bp
from copilot.routes import bp as copilot_bp
from planner.routes import bp as planner_bp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB (photos)

# ── CORS CONFIGURATION ────────────────────────────────────────────────────────
allowed_origins = [
    r"^https?://localhost:\d+$",                # Localhost development
    r"^https://terra-ai-revised-.*\.onrender\.com$",  # Render PR previews / branch deploys
    r"^https://terra-ai-revised-\d+\.onrender\.com$",  # Production frontend
]

frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_url:
    allowed_origins.append(frontend_url)

CORS(
    app,
    origins=allowed_origins,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Type"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    max_age=600,
)

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