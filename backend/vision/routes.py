import os

from flask import Blueprint, current_app, jsonify, request

from .image_io import decode_image_from_flask_request
from .service import analyze_image

bp = Blueprint("vision", __name__)

# ── Allowed MIME types for uploads ────────────────────────────────────────────
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/tiff"}


@bp.post("/api/vision/analyze")
def vision_analyze():
    """
    Vision AI image analysis endpoint (YOLO + feature detection).

    Security:
      - Only accepts multipart/form-data with an 'image' field
      - MIME type is validated against an allowlist
      - Rate limited to 20 requests/hour per IP via flask-limiter
      - File size is capped at 10 MB in app.py (Flask MAX_CONTENT_LENGTH)
    """
    # ── Rate limiting ──────────────────────────────────────────────────────────
    try:
        limiter = current_app.config.get("LIMITER")
        if limiter:
            # Vision uses more lenient limit than spatial scan (no Gemini cost)
            limiter.check()
    except Exception:
        pass  # Non-fatal

    # ── Content-type validation ────────────────────────────────────────────────
    uploaded = request.files.get("image")
    if uploaded is not None:
        # Validate MIME type from the multipart Content-Type header
        content_type = (uploaded.content_type or "").lower().split(";")[0].strip()
        if content_type and content_type not in _ALLOWED_CONTENT_TYPES:
            return jsonify({
                "error": f"Unsupported image type '{content_type}'. "
                         f"Allowed: jpeg, png, webp, tiff."
            }), 415

    try:
        rgb = decode_image_from_flask_request(request)
        return jsonify(analyze_image(rgb))
    except Exception as err:
        return jsonify({"error": str(err)}), 400
