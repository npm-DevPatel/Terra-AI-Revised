"""
ISRIC SoilGrids API integration — Terra AI Phase 1, Step 1.1

Provides `fetch_soil_data(lat, lng)` which queries the public SoilGrids REST API
for clay content and CEC at 30-60 cm depth, then classifies foundation risk according
to the blueprint classification table.

API endpoint (no auth required):
  GET https://rest.isric.org/soilgrids/v2.0/properties/query
    ?lon={lng}&lat={lat}
    &property=clay&property=silt&property=bdod&property=cec
    &depth=0-5cm&depth=30-60cm
    &value=mean

Response notes:
  - Values are returned in *mapped* units.  Divide by `unit_measure.d_factor` to
    convert to human-readable target units (e.g. g/kg ÷ 10 = %).
  - Clay target unit: % (d_factor 10 → mapped value / 10 = %)
  - CEC target unit: cmol(c)/kg (d_factor 10 → mapped value / 10 = cmol(c)/kg)
  - Values can be null when the queried pixel falls outside the SoilGrids raster
    extent (dense urban areas are sometimes masked).

Classification logic uses the 30-60 cm depth tier per blueprint spec:

  Clay %  | CEC (cmol/kg) | Type                          | Foundation premium
  --------|---------------|-------------------------------|--------------------
  > 45    | > 30          | High Density Black Cotton Clay | KES 800k–1.5M
  30–45   | any           | Moderate Clay/Loam             | Moderate warning
  < 30    | any           | Stable/Red Laterite            | No premium
"""

import math

from http_client import get_http_session
from runtime_cache import TTLCache

# ---------------------------------------------------------------------------
# Public constants
# ---------------------------------------------------------------------------

ISRIC_API_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
ISRIC_TIMEOUT_S = 15  # generous; SoilGrids can be slow under load

# Maximum nearest-neighbour search radius: 500m.
# Beyond 500m soil profiles are geotechnically unrelated to the pin.
# If no data is found within 500m, return an Urban Mask payload instead.
_NN_MAX_DEG = 0.0045   # ~500m at equator

# Specific payload returned when the pin falls inside an urban mask zone
# and no ISRIC pixel exists within 500m.
_URBAN_MASK: dict = {
    "soil_type": "Urban/Built-Up",
    "clay_pct": None,
    "cec_cmolc_kg": None,
    "silt_pct": None,
    "bulk_density_kg_dm3": None,
    "foundation_warning": (
        "This plot is situated in a dense urban core. Satellite soil mapping is "
        "masked by existing infrastructure. You are legally required to conduct a "
        "physical geotechnical soil test before structural engineering can estimate "
        "your foundation CapEx."
    ),
    "foundation_premium_kes": 0,
    "data_source": "urban_mask",
    "status": "Requires Physical Geotech Test",
}

# Graceful fallback returned when the API is unreachable or returns null data.
_FALLBACK: dict = {
    "soil_type": "Unknown",
    "clay_pct": None,
    "cec_cmolc_kg": None,
    "silt_pct": None,
    "bulk_density_kg_dm3": None,
    "foundation_warning": (
        "ISRIC SoilGrids data unavailable for this location. "
        "A physical soil investigation (NCA report) is MANDATORY before "
        "foundation design — statutory requirement. Budget KES 30,000–80,000."
    ),
    "foundation_premium_kes": 0,
    "data_source": "fallback",
}

_SOIL_CACHE = TTLCache[dict](ttl_seconds=86_400, max_entries=256)


def _cache_key(lat: float, lng: float) -> str:
    return f"{round(lat, 4):.4f}:{round(lng, 4):.4f}"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract_layer_value(layers: list, name: str, depth_label: str) -> float | None:
    """
    Pull the `mean` value for a named layer at a given depth label, then
    divide by the layer's d_factor to produce the human-readable target unit.

    Returns None when the layer/depth is absent or the mapped value is null.
    """
    for layer in layers:
        if layer.get("name") != name:
            continue
        d_factor = layer.get("unit_measure", {}).get("d_factor", 1) or 1
        for depth in layer.get("depths", []):
            if depth.get("label") == depth_label:
                raw = depth.get("values", {}).get("mean")
                if raw is not None:
                    return round(raw / d_factor, 2)
    return None


def _classify_soil(clay_pct: float | None, cec: float | None) -> dict:
    """
    Blueprint classification table (30-60 cm depth tier).
    Returns soil_type string, foundation warning text, and KES premium.
    """
    if clay_pct is None:
        return {
            "soil_type": "Unknown — data unavailable",
            "foundation_warning": (
                "ISRIC clay data null for this pixel (urban masking or raster gap). "
                "Physical soil investigation MANDATORY. Budget KES 30,000–80,000."
            ),
            "foundation_premium_kes": 0,
        }

    if clay_pct > 45 and cec is not None and cec > 30:
        return {
            "soil_type": "High Density Black Cotton Clay",
            "foundation_warning": (
                f"BLACK COTTON SOIL DETECTED: Clay {clay_pct:.1f}%, CEC {cec:.1f} cmol/kg. "
                "EXTREME shrink-swell potential. Raft or piled foundation MANDATORY. "
                "Do NOT buy this plot unless you have an extra KES 800,000–1,500,000 "
                "for a raft foundation and perimeter drainage."
            ),
            "foundation_premium_kes": 1_200_000,
        }
    elif clay_pct > 45:
        # High clay but CEC data missing — still flag as high risk
        cec_note = f"CEC {cec:.1f} cmol/kg" if cec is not None else "CEC data unavailable"
        return {
            "soil_type": "High Clay (Black Cotton suspected)",
            "foundation_warning": (
                f"HIGH CLAY CONTENT: Clay {clay_pct:.1f}% ({cec_note}). "
                "Significant shrink-swell risk. Raft foundation strongly recommended. "
                "Budget KES 800,000–1,500,000 foundation premium."
            ),
            "foundation_premium_kes": 1_000_000,
        }
    elif clay_pct >= 30:
        cec_note = f", CEC {cec:.1f} cmol/kg" if cec is not None else ""
        return {
            "soil_type": "Moderate Clay/Loam",
            "foundation_warning": (
                f"MODERATE CLAY: Clay {clay_pct:.1f}%{cec_note}. "
                "Strip or pad foundation may be adequate but soil investigation "
                "is STRONGLY recommended. Budget a potential premium of "
                "KES 200,000–500,000 depending on site-specific conditions."
            ),
            "foundation_premium_kes": 350_000,
        }
    else:
        cec_note = f", CEC {cec:.1f} cmol/kg" if cec is not None else ""
        return {
            "soil_type": "Stable/Red Laterite",
            "foundation_warning": (
                f"STABLE SOIL: Clay {clay_pct:.1f}%{cec_note}. "
                "Standard strip foundation adequate. "
                "Routine NCA soil investigation still recommended (KES 30,000–80,000)."
            ),
            "foundation_premium_kes": 0,
        }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def fetch_soil_data(lat: float, lng: float) -> dict:
    """
    Query the ISRIC SoilGrids v2.0 REST API for soil properties at (lat, lng).

    Properties queried: clay, silt, bdod (bulk density), cec
    Depths queried:     0-5cm, 30-60cm
    Classification uses the 30-60 cm depth tier (per blueprint spec).

    Returns a dict with keys:
        soil_type             (str)  — human-readable classification
        clay_pct              (float|None)  — clay % at 30-60 cm
        cec_cmolc_kg          (float|None)  — CEC cmol(c)/kg at 30-60 cm
        silt_pct              (float|None)  — silt % at 30-60 cm
        bulk_density_kg_dm3   (float|None)  — bulk density kg/dm³ at 30-60 cm
        foundation_warning    (str)  — plain-English risk statement
        foundation_premium_kes (int) — estimated extra foundation cost in KES
        data_source           (str)  — "isric_soilgrids" or "fallback"

    Never raises — all exceptions are caught and the fallback dict is returned.
    """
    return _SOIL_CACHE.get_or_set(
        _cache_key(lat, lng),
        lambda: _fetch_isric_point(lat, lng, allow_nn_fallback=True),
    )


def _fetch_isric_point(lat: float, lng: float, allow_nn_fallback: bool = True) -> dict:
    """
    Internal: hit ISRIC for a single (lat, lng) pixel.
    If all values are null AND allow_nn_fallback is True, try 4 neighbour
    offsets (~500m N/S/E/W) and return the first non-null hit, labelled
    'isric_soilgrids_nearby_sample'.
    """
    params = {
        "lon": lng,
        "lat": lat,
        "property": ["clay", "silt", "bdod", "cec"],
        "depth": ["0-5cm", "30-60cm"],
        "value": "mean",
    }

    try:
        resp = get_http_session().get(
            ISRIC_API_URL,
            params=params,
            timeout=ISRIC_TIMEOUT_S,
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.Timeout:
        print(f"[Terra AI] ISRIC SoilGrids timeout for ({lat}, {lng}) — using fallback defaults.")
        return dict(_FALLBACK)
    except requests.exceptions.RequestException as exc:
        print(f"[Terra AI] ISRIC SoilGrids request error for ({lat}, {lng}): {exc} — using fallback defaults.")
        return dict(_FALLBACK)
    except Exception as exc:
        print(f"[Terra AI] ISRIC SoilGrids unexpected error for ({lat}, {lng}): {exc} — using fallback defaults.")
        return dict(_FALLBACK)

    try:
        layers: list = data.get("properties", {}).get("layers", [])

        # Extract values at the 30-60 cm depth tier (blueprint spec)
        clay_pct = _extract_layer_value(layers, "clay", "30-60cm")
        cec = _extract_layer_value(layers, "cec", "30-60cm")
        silt_pct = _extract_layer_value(layers, "silt", "30-60cm")
        bdod = _extract_layer_value(layers, "bdod", "30-60cm")

        # ── Urban pixel masking: all values null ──────────────────────────────
        # SoilGrids v2.0 masks dense urban pixels. When ALL values are null,
        # try N/S/E/W within 500m only — geotechnically valid radius.
        # Beyond 500m, soil profiles diverge; do NOT extrapolate.
        if clay_pct is None and cec is None and silt_pct is None and bdod is None:
            if allow_nn_fallback:
                print(
                    f"[Terra AI] ISRIC pixel null for ({lat:.5f}, {lng:.5f}) — "
                    "urban masking. Checking 4 cardinal points within 500m…"
                )
                candidates = [
                    (lat + _NN_MAX_DEG, lng),   # N ~500m
                    (lat - _NN_MAX_DEG, lng),   # S ~500m
                    (lat, lng + _NN_MAX_DEG),   # E ~500m
                    (lat, lng - _NN_MAX_DEG),   # W ~500m
                ]
                for nn_lat, nn_lng in candidates:
                    nn_result = _fetch_isric_point(nn_lat, nn_lng, allow_nn_fallback=False)
                    if nn_result.get("clay_pct") is not None:
                        actual_m = round(
                            math.sqrt(
                                ((nn_lat - lat) * 111_000) ** 2
                                + ((nn_lng - lng) * 111_000 * math.cos(math.radians(lat))) ** 2
                            )
                        )
                        print(
                            f"[Terra AI] ISRIC NN hit at ({nn_lat:.5f}, {nn_lng:.5f}) "
                            f"(~{actual_m}m): clay={nn_result['clay_pct']}%"
                        )
                        nn_result["data_source"] = "isric_soilgrids_nearby_sample"
                        nn_result["nn_offset_m"] = actual_m
                        return nn_result
                # Nothing within 500m — dense urban core. Return Urban Mask payload.
                print(
                    f"[Terra AI] ISRIC: urban mask confirmed for ({lat:.5f}, {lng:.5f}). "
                    "No data within 500m. Returning Urban/Built-Up mask payload."
                )
                return dict(_URBAN_MASK)

        classification = _classify_soil(clay_pct, cec)

        return {
            "soil_type": classification["soil_type"],
            "clay_pct": clay_pct,
            "cec_cmolc_kg": cec,
            "silt_pct": silt_pct,
            "bulk_density_kg_dm3": bdod,
            "foundation_warning": classification["foundation_warning"],
            "foundation_premium_kes": classification["foundation_premium_kes"],
            "data_source": "isric_soilgrids",
        }

    except Exception as exc:
        print(f"[Terra AI] ISRIC SoilGrids parse error for ({lat}, {lng}): {exc} — using fallback defaults.")
        return dict(_FALLBACK)
