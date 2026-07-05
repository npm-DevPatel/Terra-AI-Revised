"""
Groundwater Risk Analyser — Terra AI

Phase 1: BGS Africa Groundwater Atlas (Kenya_HG.shp)

Loads the BGS hydrogeology shapefile for Kenya at module boot (singleton).
On each request, performs a point-in-polygon query to retrieve aquifer data
for the dropped pin coordinate.

Dataset: datasets/Kenya_HG.shp
Key attributes:
  AqProd      — Aquifer productivity (verbose text)
  SimAqProd   — Simplified productivity class (e.g., "Low", "Moderate", "High")
  AqDepth     — Depth to groundwater (text range, e.g., "100-150", ">150")
  AqYield     — Aquifer yield description
  HG_AMM      — Hydrogeology classification code
  DetailHG2   — Detailed hydrogeology description

Flag logic:
  water_scarcity_risk = True  if depth > 150 m  OR  SimAqProd contains "Low"
  borehole_premium_kes = 2_000_000  when water_scarcity_risk is True
"""

import os
import re
import threading

# ---------------------------------------------------------------------------
# Lazy singleton — shapefile is loaded once on first query, not on import.
# This avoids blocking server startup for a ~600 KB shapefile.
# ---------------------------------------------------------------------------
_gdf = None           # GeoDataFrame holding the Kenya_HG polygons
_gdf_lock = threading.Lock()
_load_error: str | None = None   # Set if shapefile failed to load

_DATASETS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "datasets")
)
_SHP_PATH = os.path.join(_DATASETS_DIR, "Kenya_HG.shp")

# Borehole depth threshold for scarcity flag (metres)
_DEPTH_SCARCITY_THRESHOLD_M = 150.0

# Premium in KES for deep rotary borehole drilling when scarcity flag is set
_BOREHOLE_PREMIUM_KES = 2_000_000


def _load_shapefile() -> None:
    """Load Kenya_HG.shp into the module-level GeoDataFrame (thread-safe)."""
    global _gdf, _load_error
    try:
        import geopandas as gpd  # imported lazily to avoid hard dependency at startup
        gdf = gpd.read_file(_SHP_PATH)
        # Ensure CRS is WGS-84 (EPSG:4326) — the shapefile metadata confirms D_WGS_1984
        if gdf.crs is None:
            gdf = gdf.set_crs("EPSG:4326")
        elif gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs("EPSG:4326")
        _gdf = gdf
        print(f"[Terra AI] Groundwater shapefile loaded: {len(_gdf)} polygons from {_SHP_PATH}")
    except ImportError:
        _load_error = "geopandas not installed — groundwater query disabled"
        print(f"[Terra AI] WARNING: {_load_error}")
    except FileNotFoundError:
        _load_error = f"Kenya_HG.shp not found at {_SHP_PATH}"
        print(f"[Terra AI] WARNING: {_load_error}")
    except Exception as exc:
        _load_error = f"Shapefile load failed: {exc}"
        print(f"[Terra AI] WARNING: {_load_error}")


def _ensure_loaded() -> None:
    """Trigger lazy load with double-checked locking."""
    global _gdf
    if _gdf is None and _load_error is None:
        with _gdf_lock:
            if _gdf is None and _load_error is None:
                _load_shapefile()


def warm_groundwater_data() -> None:
    _ensure_loaded()


def groundwater_status() -> dict:
    return {
        "ready": _gdf is not None and _load_error is None,
        "loaded": _gdf is not None,
        "error": _load_error,
    }


# ---------------------------------------------------------------------------
# Depth parser
# ---------------------------------------------------------------------------

def _parse_depth_m(raw: str | None) -> float | None:
    """
    Parse the AqDepth text field into a numeric depth estimate (metres).

    Examples of raw values seen in the BGS shapefile:
      "50-100"  → 100.0   (take the upper bound as worst-case)
      ">150"    → 160.0   (flag as exceeding threshold)
      "100-150" → 150.0
      "<30"     → 30.0
      "0-30"    → 30.0
      "unknown" → None

    Strategy: take the larger number in any range; for ">N" return N + 10.
    """
    if not raw or not isinstance(raw, str):
        return None
    raw = raw.strip()
    if not raw or raw.lower() in ("unknown", "n/a", "", "not applicable"):
        return None

    # ">N" pattern — depth exceeds N
    match_gt = re.match(r">\s*(\d+(?:\.\d+)?)", raw)
    if match_gt:
        return float(match_gt.group(1)) + 10.0

    # "<N" pattern — depth is less than N
    match_lt = re.match(r"<\s*(\d+(?:\.\d+)?)", raw)
    if match_lt:
        return float(match_lt.group(1))

    # "N-M" range — take the upper bound (worst-case for borehole cost)
    match_range = re.match(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)", raw)
    if match_range:
        return max(float(match_range.group(1)), float(match_range.group(2)))

    # Single number
    match_single = re.match(r"(\d+(?:\.\d+)?)", raw)
    if match_single:
        return float(match_single.group(1))

    return None


def _is_low_productivity(row: dict) -> bool:
    """
    Return True if the polygon's simplified or detailed productivity indicates
    a low-yield aquifer (high borehole drilling risk).

    Checks SimAqProd first (most reliable summary field), then falls back
    to a keyword scan of AqProd and DetailHG2.
    """
    low_keywords = {"low", "minor", "negligible", "poor", "unproductive", "nil",
                    "impermeable", "no significant", "crystalline", "basement"}

    sim = str(row.get("SimAqProd") or "").lower()
    if sim and any(kw in sim for kw in low_keywords):
        return True

    aq_prod = str(row.get("AqProd") or "").lower()
    if aq_prod and any(kw in aq_prod for kw in low_keywords):
        return True

    detail = str(row.get("DetailHG2") or "").lower()
    if detail and any(kw in detail for kw in {"crystalline basement", "impermeable"}):
        return True

    return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_FALLBACK = {
    "water_scarcity_risk": False,
    "aquifer_productivity": None,
    "depth_to_groundwater_m": None,
    "borehole_premium_kes": 0,
    "hydrogeology_description": None,
    "data_source": "fallback",
}


def query_groundwater(lat: float, lng: float) -> dict:
    """
    Query the BGS Kenya groundwater atlas for the given coordinate.

    Returns a dict with:
      water_scarcity_risk     bool  — True if depth > 150m or productivity is low
      aquifer_productivity    str   — Human-readable productivity description
      depth_to_groundwater_m  float — Parsed depth estimate in metres (or None)
      borehole_premium_kes    int   — 2_000_000 if scarcity risk, else 0
      hydrogeology_description str  — Detailed BGS description text
      data_source             str   — "bgs_kenya_hg" or "fallback"
    """
    try:
        _ensure_loaded()

        if _load_error:
            return {**_FALLBACK, "data_source": f"fallback:{_load_error}"}

        if _gdf is None:
            return {**_FALLBACK, "data_source": "fallback:shapefile_not_loaded"}

        from shapely.geometry import Point
        point = Point(lng, lat)   # Shapely uses (x=lng, y=lat)

        # Spatial query: find which polygon(s) contain the point
        matches = _gdf[_gdf.geometry.contains(point)]

        if matches.empty:
            # Point not covered (outside Kenya or gap in coverage)
            return {**_FALLBACK, "data_source": "bgs_kenya_hg:no_polygon_match"}

        # Take the first (and usually only) matching row
        row = matches.iloc[0].to_dict()

        # Extract key fields
        aq_prod_raw = str(row.get("AqProd") or row.get("SimAqProd") or "")
        sim_prod    = str(row.get("SimAqProd") or "")
        depth_raw   = str(row.get("AqDepth") or "")
        detail      = str(row.get("DetailHG2") or row.get("HG_AMM") or "")

        depth_m      = _parse_depth_m(depth_raw)
        low_prod     = _is_low_productivity(row)

        # Flag: depth > 150m OR low productivity
        depth_exceeds = (depth_m is not None and depth_m > _DEPTH_SCARCITY_THRESHOLD_M)
        water_scarcity_risk = depth_exceeds or low_prod

        borehole_premium = _BOREHOLE_PREMIUM_KES if water_scarcity_risk else 0

        # Build a concise productivity label
        if sim_prod:
            productivity_label = sim_prod
        elif aq_prod_raw:
            productivity_label = aq_prod_raw[:120]   # cap length for payload
        else:
            productivity_label = "Unknown"

        print(
            f"[Terra AI] Groundwater query: depth_raw='{depth_raw}' → {depth_m}m | "
            f"SimAqProd='{sim_prod}' | scarcity_risk={water_scarcity_risk}"
        )

        return {
            "water_scarcity_risk": water_scarcity_risk,
            "aquifer_productivity": productivity_label,
            "depth_to_groundwater_m": round(depth_m, 1) if depth_m is not None else None,
            "borehole_premium_kes": borehole_premium,
            "hydrogeology_description": detail[:300] if detail else None,
            "data_source": "bgs_kenya_hg",
        }

    except Exception as exc:
        print(f"[Terra AI] Groundwater query failed (non-fatal): {exc}")
        return {**_FALLBACK, "data_source": f"fallback:{exc}"}
