"""
core/vision.py — Google Cloud Vision API integration for Terra Lens.

Takes a base64 photo of a site and extracts structured land intelligence:
  - Labels (vegetation, structures, terrain features)
  - Object detection (buildings, fences, water, construction)
  - Land cover classification
  - Text/signage detected on site (plot numbers, warnings)
  - Safe search (not used for moderation — used to detect active construction)

This replaces YOLO entirely. No local model file needed.
"""
import os
import json
from http_client import get_http_session

_VISION_KEY = (
    os.getenv("GOOGLE_CLOUD_VISION_API_KEY") or   # dedicated Vision key (preferred)
    os.getenv("GOOGLE_MAPS_API_KEY") or            # fallback: same GCP project key
    ""
)
_VISION_URL = "https://vision.googleapis.com/v1/images:annotate"

# Features we request from Vision API
_FEATURES = [
    {"type": "LABEL_DETECTION", "maxResults": 20},
    {"type": "OBJECT_LOCALIZATION", "maxResults": 15},
    {"type": "TEXT_DETECTION", "maxResults": 10},
    {"type": "IMAGE_PROPERTIES"},
    {"type": "SAFE_SEARCH_DETECTION"},
]

# Labels that indicate construction activity
_CONSTRUCTION_LABELS = {
    "scaffolding", "crane", "construction", "excavation", "concrete",
    "rebar", "foundation", "building material", "demolition", "brick",
    "cement", "sand", "gravel", "pipe", "steel", "timber", "roof",
}

# Labels that indicate vegetation / land cover type
_VEGETATION_LABELS = {
    "tree", "forest", "vegetation", "grass", "shrub", "bush",
    "crop", "farmland", "garden", "wetland", "swamp",
}

# Labels that indicate water / flood risk signals
_WATER_LABELS = {
    "water", "river", "stream", "pond", "lake", "flood", "drainage",
    "ditch", "channel", "wetland", "swamp",
}


def analyze_site_photo(image_base64: str) -> dict:
    """
    Send a base64-encoded site photo to Google Vision API.
    Returns structured intelligence for Terra Lens.

    Args:
        image_base64: Base64 string of the image (no data: prefix needed).

    Returns:
        {
          "labels": [...],
          "objects": [...],
          "text_on_site": [...],
          "dominant_colors": [...],
          "construction_detected": bool,
          "vegetation_type": str | None,
          "water_signals": bool,
          "raw_vision": {...}   ← full Vision response for Gemini context
        }
    """
    if not _VISION_KEY:
        print("[Vision] GOOGLE_CLOUD_VISION_API_KEY / GOOGLE_MAPS_API_KEY not set — skipping Vision API.")
        return {"error": "Vision API key not configured.", "vision_available": False, "labels": [], "objects": []}

    payload = {
        "requests": [{
            "image": {"content": image_base64},
            "features": _FEATURES,
        }]
    }

    try:
        session = get_http_session()
        resp = session.post(
            f"{_VISION_URL}?key={_VISION_KEY}",
            json=payload,
            timeout=15,
        )
        if resp.status_code == 403:
            print(f"[Vision] 403 Forbidden — Cloud Vision API not enabled on this key or quota exceeded.")
            return {"error": "Vision API not enabled on this key (403).", "vision_available": False, "labels": [], "objects": []}
        if resp.status_code == 400:
            print(f"[Vision] 400 Bad Request — {resp.text[:200]}")
            return {"error": "Vision API bad request.", "vision_available": False, "labels": [], "objects": []}
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"[Vision] Request failed: {exc}")
        return {"error": str(exc), "vision_available": False, "labels": [], "objects": []}

    # Check for Vision API error in response body
    api_error = data.get("responses", [{}])[0].get("error")
    if api_error:
        print(f"[Vision] API error in response: {api_error}")
        return {"error": api_error.get("message", "Unknown Vision error"), "vision_available": False, "labels": [], "objects": []}

    result_data = data.get("responses", [{}])[0]

    # Extract labels
    labels = [
        {"description": a["description"].lower(), "confidence": round(a["score"], 3)}
        for a in result_data.get("labelAnnotations", [])
    ]
    label_set = {l["description"] for l in labels}

    # Extract detected objects with normalized bounding boxes (for frontend overlay)
    objects = []
    for o in result_data.get("localizedObjectAnnotations", []):
        verts = o.get("boundingPoly", {}).get("normalizedVertices", [])
        # Normalised vertices are fractions 0-1; some may be missing x or y (default 0)
        bbox = [{"x": v.get("x", 0), "y": v.get("y", 0)} for v in verts]
        objects.append({
            "name": o["name"].lower(),
            "confidence": round(o["score"], 3),
            "bbox": bbox,  # 4 normalised vertices (top-left, top-right, bot-right, bot-left)
        })

    # Extract any text visible on site (plot numbers, signage, warnings)
    text_annotations = result_data.get("textAnnotations", [])
    text_on_site = []
    if text_annotations:
        full_text = text_annotations[0].get("description", "").strip()
        if full_text:
            text_on_site = [line.strip() for line in full_text.split("\n") if line.strip()][:10]

    # Dominant colours
    image_props = result_data.get("imagePropertiesAnnotation", {})
    dominant_colors = []
    for c in image_props.get("dominantColors", {}).get("colors", [])[:5]:
        color = c.get("color", {})
        dominant_colors.append({
            "rgb": f"rgb({color.get('red',0)},{color.get('green',0)},{color.get('blue',0)})",
            "score": round(c.get("score", 0), 3),
            "pixel_fraction": round(c.get("pixelFraction", 0), 3),
        })

    # Derived signals
    construction_detected = bool(label_set & _CONSTRUCTION_LABELS or
                                  {o["name"] for o in objects} & _CONSTRUCTION_LABELS)

    vegetation_labels_found = label_set & _VEGETATION_LABELS
    vegetation_type = next(iter(vegetation_labels_found), None)

    water_signals = bool(label_set & _WATER_LABELS)

    print(f"[Vision] OK — {len(labels)} labels, {len(objects)} objects detected.")
    return {
        "vision_available": True,
        "labels": labels,
        "objects": objects,
        "text_on_site": text_on_site,
        "dominant_colors": dominant_colors,
        "construction_detected": construction_detected,
        "vegetation_type": vegetation_type,
        "water_signals": water_signals,
        "raw_vision": result_data,
    }
