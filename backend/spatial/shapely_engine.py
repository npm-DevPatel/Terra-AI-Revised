"""
Shapely spatial risk engine — Terra AI

Step 1.3 upgrade: HydroSHEDS Africa HydroRIVERS shapefile replaces OSM waterway
proximity for riparian setback calculation.

Shapefile location: datasets/HydroRIVERS_v10_af.shp  (project root)
Shapefile location: datasets/HydroRIVERS_v10_af.shp  (project root)
Loaded dynamically on each coordinate drop via pyogrio bounding box filtering.
This prevents OOM crashes while providing country-wide (and continent-wide) coverage.
On each coordinate drop: precise distance to nearest HydroSHEDS river line.
Flag: riparian_breach = True if distance < 30 m
Label: "CRITICAL Statutory NEMA Riparian Breach"

All other spatial checks (road reserve, grid, aviation, amenities, etc.) remain as before.
"""

import math
import os
from functools import lru_cache
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import nearest_points

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

METERS_PER_DEG = 111_320.0

# Riparian setback per EMCA Cap 387 & NEMA guidelines
RIPARIAN_SETBACK_M = 30.0

# Major Kenyan airports (Aviation Authority restrictions)
_KENYA_MAJOR_AIRPORTS = [
    {"lat": -1.3192, "lng": 36.9275, "restrict_km": 5.0},   # JKIA (Nairobi)
    {"lat": -1.3217, "lng": 36.8155, "restrict_km": 3.0},   # Wilson (Nairobi)
    {"lat": -4.0348, "lng": 39.5936, "restrict_km": 5.0},   # Moi International (Mombasa)
    {"lat": -0.0558, "lng": 34.7261, "restrict_km": 4.0},   # Kisumu International
    {"lat": 0.5333,  "lng": 35.2378, "restrict_km": 4.0},   # Eldoret International
    {"lat": -3.2294, "lng": 40.1114, "restrict_km": 3.0},   # Malindi
    {"lat": -1.2583, "lng": 36.9856, "restrict_km": 2.0},   # Moi Air Base (Eastleigh)
]


# Path to HydroRIVERS shapefile (relative to project root)
_REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
_HYDRO_SHP = os.path.join(_REPO_ROOT, "datasets", "HydroRIVERS_v10_af.shp")


# ---------------------------------------------------------------------------
# HydroSHEDS loader (Dynamic Pyogrio Bbox)
# ---------------------------------------------------------------------------

def _load_hydro_rivers(lat: float, lng: float) -> list[LineString]:
    """
    Load HydroRIVERS shapefile dynamically filtered to a ~5.5km bounding box
    around the requested coordinates. This uses pyogrio's spatial index to load
    in < 50ms without consuming heavy RAM, scaling to all of Kenya.
    """
    if not os.path.exists(_HYDRO_SHP):
        print(
            f"[Terra AI] HydroSHEDS shapefile not found at {_HYDRO_SHP}. "
            "Riparian check will fall back to OSM waterways."
        )
        return []

    try:
        import geopandas as gpd
        from shapely.geometry import box

        # 0.05 degrees is roughly 5.5 km.
        bbox = box(lng - 0.05, lat - 0.05, lng + 0.05, lat + 0.05)

        gdf = gpd.read_file(_HYDRO_SHP, bbox=bbox, engine="pyogrio")

        lines: list[LineString] = []
        for geom in gdf.geometry:
            if geom is None:
                continue
            if geom.geom_type == "LineString":
                lines.append(geom)
            elif geom.geom_type == "MultiLineString":
                lines.extend(geom.geoms)

        return lines

    except Exception as exc:
        print(f"[Terra AI] HydroSHEDS load failed (non-fatal): {exc}. Falling back to OSM.")
        return []


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in metres between two WGS-84 points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _way_coords(way: dict) -> list[tuple[float, float]] | None:
    """Extract [(lon, lat), ...] from an Overpass 'way' element."""
    geom = way.get("geometry")
    if not geom or len(geom) < 2:
        return None
    return [(node["lon"], node["lat"]) for node in geom]


# ---------------------------------------------------------------------------
# Riparian check — HydroSHEDS preferred, OSM fallback
# ---------------------------------------------------------------------------

def _check_riparian(
    lat: float,
    lng: float,
    pin: Point,
    osm_waterways: list[dict],
) -> tuple[bool, float | None]:
    """
    Returns (riparian_breach, nearest_waterway_m).

    Priority:
      1. HydroSHEDS shapefile (precise geospatial dataset)
      2. OSM waterways from Overpass (fallback if shapefile missing/failed)
    """
    hydro_lines = _load_hydro_rivers(lat, lng)

    # ── HydroSHEDS path ──────────────────────────────────────────────────
    if hydro_lines:
        min_dist_m: float = float("inf")
        breach = False
        for line in hydro_lines:
            try:
                near_pt, _ = nearest_points(line, pin)
                dist_m = _haversine_m(lat, lng, near_pt.y, near_pt.x)
                if dist_m < min_dist_m:
                    min_dist_m = dist_m
                if dist_m < RIPARIAN_SETBACK_M:
                    breach = True
            except Exception:
                continue
        nearest = round(min_dist_m) if min_dist_m < float("inf") else None
        return breach, nearest

    # ── OSM fallback ─────────────────────────────────────────────────────
    if not osm_waterways:
        return False, None

    min_dist_m = float("inf")
    breach = False
    for way in osm_waterways:
        coords = _way_coords(way)
        if not coords:
            continue
        try:
            line = LineString(coords)
            near_pt, _ = nearest_points(line, pin)
            dist_m = _haversine_m(lat, lng, near_pt.y, near_pt.x)
            if dist_m < min_dist_m:
                min_dist_m = dist_m
            buf_deg = RIPARIAN_SETBACK_M / METERS_PER_DEG
            if pin.within(line.buffer(buf_deg)):
                breach = True
        except Exception as exc:
            print(f"[Shapely] OSM waterway fallback error: {exc}")
    nearest = round(min_dist_m) if min_dist_m < float("inf") else None
    return breach, nearest


# ---------------------------------------------------------------------------
# Main compute_risks entry point
# ---------------------------------------------------------------------------

def compute_risks(lat: float, lng: float, overpass_data: dict) -> dict:
    """
    Run all spatial risk checks for the given pin coordinates.

    Returns dict with keys:
        riparian_breach, nearest_waterway_m,
        riparian_data_source,           ← "hydrosheds" or "osm"
        road_reserve_risk, nearest_road_m,
        distance_to_grid_m,
        aviation_risk, nearest_airport_km,
        protected_land_risk, landuse_zone,
        nearest_school_km, nearest_market_km,
        water_connection_nearby, nearest_cliff_m
    """
    pin = Point(lng, lat)

    result = {
        "riparian_breach": False,
        "nearest_waterway_m": None,
        "riparian_data_source": "none",
        "road_reserve_risk": False,
        "nearest_road_m": None,
        "distance_to_grid_m": None,
        "aviation_risk": False,
        "nearest_airport_km": None,
        "protected_land_risk": False,
        "landuse_zone": "Not mapped",
        "nearest_school_km": None,
        "nearest_market_km": None,
        "water_connection_nearby": False,
        "nearest_cliff_m": None,
    }

    # ── 1. RIPARIAN (HydroSHEDS → OSM fallback) ──────────────────────────
    try:
        osm_waterways = overpass_data.get("waterways", [])
        breach, nearest_m = _check_riparian(lat, lng, pin, osm_waterways)
        result["riparian_breach"] = breach
        result["nearest_waterway_m"] = nearest_m

        hydro_available = bool(hydro_lines) if 'hydro_lines' in locals() else os.path.exists(_HYDRO_SHP)
        result["riparian_data_source"] = "hydrosheds" if hydro_available else "osm"

        if breach:
            print(
                f"[Terra AI] CRITICAL: Riparian breach detected — "
                f"{nearest_m} m from nearest HydroSHEDS river "
                f"(setback: {RIPARIAN_SETBACK_M} m)"
            )
    except Exception as exc:
        print(f"[Shapely] Riparian check error: {exc}")

    # ── 2. ROAD RESERVE CHECK (15 m per Kenya Roads Act) ────────────────
    highways = overpass_data.get("highways", [])
    if highways:
        min_dist_m = float("inf")
        for way in highways:
            coords = _way_coords(way)
            if not coords:
                continue
            try:
                line = LineString(coords)
                near_pt, _ = nearest_points(line, pin)
                dist_m = _haversine_m(lat, lng, near_pt.y, near_pt.x)
                if dist_m < min_dist_m:
                    min_dist_m = dist_m
                buf_deg = 15 / METERS_PER_DEG
                if pin.within(line.buffer(buf_deg)):
                    result["road_reserve_risk"] = True
            except Exception as exc:
                print(f"[Shapely] Highway error: {exc}")
        if min_dist_m < float("inf"):
            result["nearest_road_m"] = round(min_dist_m)

    # ── 3. POWER GRID DISTANCE ───────────────────────────────────────────
    grid_features = (
        overpass_data.get("power_lines", [])
        + overpass_data.get("substations", [])
        + overpass_data.get("power_poles", [])
    )
    if grid_features:
        min_dist_m = float("inf")
        for feat in grid_features:
            try:
                if feat.get("type") == "node":
                    d = _haversine_m(lat, lng, feat["lat"], feat["lon"])
                    if d < min_dist_m:
                        min_dist_m = d
                else:
                    coords = _way_coords(feat)
                    if not coords:
                        continue
                    line = LineString(coords)
                    near_pt, _ = nearest_points(line, pin)
                    d = _haversine_m(lat, lng, near_pt.y, near_pt.x)
                    if d < min_dist_m:
                        min_dist_m = d
            except Exception as exc:
                print(f"[Shapely] Grid error: {exc}")
        if min_dist_m < float("inf"):
            result["distance_to_grid_m"] = round(min_dist_m)

    # ── 4. AVIATION / KCAA CHECK ─────────────────────────────────────────
    for airport in _KENYA_MAJOR_AIRPORTS:
        dist_km = _haversine_m(lat, lng, airport["lat"], airport["lng"]) / 1000
        prev = result["nearest_airport_km"]
        if prev is None or dist_km < prev:
            result["nearest_airport_km"] = round(dist_km, 2)
        if dist_km <= airport["restrict_km"]:
            result["aviation_risk"] = True

    for aerodrome in overpass_data.get("aerodromes", []):
        try:
            if aerodrome.get("type") == "node":
                a_lat, a_lng = aerodrome["lat"], aerodrome["lon"]
            elif aerodrome.get("center"):
                a_lat = aerodrome["center"]["lat"]
                a_lng = aerodrome["center"]["lon"]
            else:
                continue
            dist_km = _haversine_m(lat, lng, a_lat, a_lng) / 1000
            prev = result["nearest_airport_km"]
            if prev is None or dist_km < prev:
                result["nearest_airport_km"] = round(dist_km, 2)
            if dist_km <= 5.0:
                result["aviation_risk"] = True
        except Exception as exc:
            print(f"[Shapely] Aerodrome error: {exc}")

    # ── 5. PROTECTED LAND CHECK ──────────────────────────────────────────
    raw_elements = overpass_data.get("raw_elements", [])
    protected_areas = [
        e for e in raw_elements
        if e.get("tags", {}).get("boundary") in ("protected_area", "national_park", "forest_reserve")
        or e.get("tags", {}).get("leisure") in ("nature_reserve",)
    ]
    for area in protected_areas:
        coords = _way_coords(area)
        if not coords:
            continue
        try:
            if len(coords) >= 3:
                poly = Polygon(coords)
                if pin.within(poly) or pin.distance(poly) < (100 / METERS_PER_DEG):
                    result["protected_land_risk"] = True
                    break
        except Exception:
            pass

    # ── 6. LAND USE ZONE DETECTION ───────────────────────────────────────
    landuse_elements = [e for e in raw_elements if "landuse" in e.get("tags", {})]
    landuse_zone = "Not mapped"
    if landuse_elements:
        for el in landuse_elements:
            coords = _way_coords(el)
            if coords and len(coords) >= 3:
                try:
                    poly = Polygon(coords)
                    if pin.within(poly):
                        landuse_zone = el["tags"]["landuse"]
                        break
                except Exception:
                    pass
        if landuse_zone == "Not mapped" and landuse_elements:
            landuse_zone = landuse_elements[0].get("tags", {}).get("landuse", "Not mapped")
    result["landuse_zone"] = landuse_zone

    # ── 7. AMENITY DISTANCES ─────────────────────────────────────────────
    for amenity_type, result_key in [
        ("school", "nearest_school_km"),
        ("marketplace", "nearest_market_km"),
        ("market", "nearest_market_km"),
    ]:
        amenity_nodes = [
            e for e in raw_elements
            if e.get("tags", {}).get("amenity") == amenity_type and e.get("type") == "node"
        ]
        if amenity_nodes and result[result_key] is None:
            min_d = min(_haversine_m(lat, lng, n["lat"], n["lon"]) for n in amenity_nodes)
            result[result_key] = round(min_d / 1000, 2)

    # ── 8. WATER CONNECTION NEARBY ───────────────────────────────────────
    water_infra = [
        e for e in raw_elements
        if e.get("tags", {}).get("amenity") == "water_point"
        or "pipeline" in e.get("tags", {}).get("man_made", "")
        or e.get("tags", {}).get("man_made") == "water_tower"
    ]
    for node in water_infra:
        if node.get("type") == "node":
            d = _haversine_m(lat, lng, node["lat"], node["lon"])
            if d < 200:
                result["water_connection_nearby"] = True
                break

    # ── 9. CLIFF / ESCARPMENT CHECK ──────────────────────────────────────
    cliff_elements = [
        e for e in raw_elements
        if e.get("tags", {}).get("natural") in ("cliff", "escarpment")
    ]
    for el in cliff_elements:
        coords = _way_coords(el)
        if not coords:
            continue
        try:
            line = LineString(coords)
            near_pt, _ = nearest_points(line, pin)
            d = _haversine_m(lat, lng, near_pt.y, near_pt.x)
            if result["nearest_cliff_m"] is None or d < result["nearest_cliff_m"]:
                result["nearest_cliff_m"] = round(d)
        except Exception:
            pass

    return result
