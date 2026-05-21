"""
Demolition & Aviation Risk Zones — Terra AI Phase 1, Step 1.4

Provides `compute_zone_risks(lat, lng)` which tests the pin against:

  A) KeNHA/Railway demolition buffers
     - Major highway corridors  → 60 m Shapely buffer
     - SGR / MGR railway lines  → 30 m Shapely buffer
     Flag: demolition_risk = True
     Warning: "100% risk of uncompensated demolition by KeNHA/Kenya Railways."

  B) KCAA Aviation Zones (hardcoded bounding-box polygons)
     - JKIA approach funnels  (Eastlands / Syokimau)
     - Wilson Airport approach funnels (Lang'ata / South C)
     Flag: aviation_height_restriction = True
     Warning: "Building height strictly capped by KCAA. High-rise apartment
               development is not permissible."

All geometry uses WGS-84 decimal degrees. Buffer distances are converted
from metres to degrees via the 111,320 m/degree approximation (accurate
to < 0.5 % at the latitudes and scales involved).

Never raises — all exceptions are caught and safe defaults are returned.
"""

import math

from shapely.geometry import LineString, Point, Polygon

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

METERS_PER_DEG = 111_320.0   # 1° latitude ≈ 111,320 m (equatorial approx)

# Buffer radii converted to degrees once at module load
_HIGHWAY_BUF_DEG  = 60  / METERS_PER_DEG   # 60 m  → KeNHA major roads
_RAILWAY_BUF_DEG  = 30  / METERS_PER_DEG   # 30 m  → SGR / MGR

# ---------------------------------------------------------------------------
# Hardcoded infrastructure geometries (Nairobi-centric, WGS-84)
# Coordinates: (longitude, latitude) — Shapely convention
# ---------------------------------------------------------------------------

# KeNHA major highway corridors
# Each entry is a list of (lon, lat) nodes defining the centreline.
# These approximate the main sealed highways in/around Nairobi.
_HIGHWAY_CORRIDORS: list[list[tuple[float, float]]] = [
    # Thika Superhighway (A2) — CBD → Thika
    [
        (36.8219, -1.2921),   # Nairobi CBD / Globe Roundabout
        (36.8400, -1.2700),   # Pangani / Ngara
        (36.8600, -1.2500),   # Muthaiga / Kasarani junction
        (36.8900, -1.2200),   # Roysambu
        (36.9200, -1.1900),   # Kahawa
        (36.9500, -1.1400),   # Juja Road junction
        (37.0800, -1.0300),   # Thika
    ],
    # Mombasa Road (A109) — CBD → JKIA → Mlolongo
    [
        (36.8219, -1.2921),
        (36.8350, -1.3100),   # Industrial Area
        (36.8520, -1.3200),   # JKIA approach
        (36.9000, -1.3400),   # Syokimau
        (36.9500, -1.3700),   # Mlolongo
    ],
    # Ngong Road (C58) — CBD → Karen
    [
        (36.8070, -1.2921),
        (36.7900, -1.3000),   # Kilimani
        (36.7750, -1.3100),   # Dagoretti Corner
        (36.7550, -1.3250),   # Karen
    ],
    # Waiyaki Way (A104) — CBD → Westlands → Kikuyu
    [
        (36.8219, -1.2921),
        (36.8000, -1.2750),   # Westlands
        (36.7750, -1.2650),   # Kabete
        (36.7500, -1.2500),   # Lower Kabete
        (36.7200, -1.2350),   # Kikuyu
    ],
    # Langata Road (C59) — Wilson → Karen → Rongai
    [
        (36.8155, -1.3217),   # Wilson Airport
        (36.7900, -1.3350),   # Lang'ata
        (36.7650, -1.3500),   # Karen C
        (36.7400, -1.3700),   # Rongai junction
    ],
    # Eastern Bypass (B8)
    [
        (36.9200, -1.2700),   # Ruiru junction
        (36.9500, -1.3000),
        (36.9700, -1.3300),   # Utawala
        (36.9500, -1.3700),   # Mlolongo
    ],
]

# SGR / MGR railway corridors
_RAILWAY_CORRIDORS: list[list[tuple[float, float]]] = [
    # SGR (Standard Gauge Railway): Nairobi SGR → Mlolongo
    [
        (36.8219, -1.3000),   # Nairobi SGR terminus
        (36.8500, -1.3100),
        (36.8900, -1.3300),   # JKIA area
        (36.9200, -1.3500),
        (36.9600, -1.3800),   # Athi River
    ],
    # MGR (Metre Gauge Railway): Nairobi → Thika line
    [
        (36.8219, -1.2850),   # Nairobi Station
        (36.8400, -1.2700),
        (36.8700, -1.2400),
        (36.9100, -1.1900),   # Ruiru
    ],
]

# ---------------------------------------------------------------------------
# KCAA Aviation Zones — bounding box polygons (lon, lat)
# These represent simplified approach funnel footprints at ground level.
# They flag zones where KCAA imposes height caps.
# ---------------------------------------------------------------------------

def _bbox_poly(lon_min, lat_min, lon_max, lat_max) -> Polygon:
    """Create a Shapely Polygon from a bounding box (lon_min, lat_min, lon_max, lat_max)."""
    return Polygon([
        (lon_min, lat_min),
        (lon_max, lat_min),
        (lon_max, lat_max),
        (lon_min, lat_max),
        (lon_min, lat_min),
    ])

# JKIA (Jomo Kenyatta International Airport): -1.3192, 36.9275
# Approach funnels: east (Syokimau / Embakasi) and west corridor
_JKIA_EAST_FUNNEL  = _bbox_poly(36.8800, -1.3600, 37.0500, -1.2600)
_JKIA_WEST_FUNNEL  = _bbox_poly(36.7800, -1.3400, 36.8800, -1.2800)

# Wilson Airport (Lang'ata): -1.3217, 36.8155
# Approach funnels: east (South C) and west (Lang'ata / Ngong corridor)
_WILSON_EAST_FUNNEL = _bbox_poly(36.8155, -1.3500, 36.8700, -1.2950)
_WILSON_WEST_FUNNEL = _bbox_poly(36.7400, -1.3600, 36.8155, -1.2950)

_KCAA_ZONES: list[Polygon] = [
    _JKIA_EAST_FUNNEL,
    _JKIA_WEST_FUNNEL,
    _WILSON_EAST_FUNNEL,
    _WILSON_WEST_FUNNEL,
]

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_zone_risks(lat: float, lng: float) -> dict:
    """
    Test the pin (lat, lng) against:
      - KeNHA highway 60 m buffers
      - SGR/MGR railway 30 m buffers
      - KCAA aviation zone polygons

    Returns a dict with keys:
        demolition_risk              (bool)
        demolition_warning           (str)   — plain-English risk description
        nearest_highway_m            (float|None)
        nearest_railway_m            (float|None)
        aviation_height_restriction  (bool)
        aviation_warning             (str)   — plain-English risk description
        kcaa_zone_name               (str|None) — which zone triggered
    """
    result = {
        "demolition_risk": False,
        "demolition_warning": "",
        "nearest_highway_m": None,
        "nearest_railway_m": None,
        "aviation_height_restriction": False,
        "aviation_warning": "",
        "kcaa_zone_name": None,
    }

    pin = Point(lng, lat)   # Shapely convention: (x=lon, y=lat)

    # ------------------------------------------------------------------
    # A) Demolition risk — KeNHA highways
    # ------------------------------------------------------------------
    try:
        min_highway_m: float = float("inf")
        for corridor in _HIGHWAY_CORRIDORS:
            if len(corridor) < 2:
                continue
            line = LineString(corridor)
            # Distance in degrees → convert to metres
            dist_deg = pin.distance(line)
            dist_m = dist_deg * METERS_PER_DEG
            if dist_m < min_highway_m:
                min_highway_m = dist_m
            if dist_m <= 60:
                result["demolition_risk"] = True

        if min_highway_m < float("inf"):
            result["nearest_highway_m"] = round(min_highway_m)
    except Exception as exc:
        print(f"[Terra AI] zones.py highway check error (non-fatal): {exc}")

    # ------------------------------------------------------------------
    # A) Demolition risk — SGR/MGR railways
    # ------------------------------------------------------------------
    try:
        min_railway_m: float = float("inf")
        for corridor in _RAILWAY_CORRIDORS:
            if len(corridor) < 2:
                continue
            line = LineString(corridor)
            dist_deg = pin.distance(line)
            dist_m = dist_deg * METERS_PER_DEG
            if dist_m < min_railway_m:
                min_railway_m = dist_m
            if dist_m <= 30:
                result["demolition_risk"] = True

        if min_railway_m < float("inf"):
            result["nearest_railway_m"] = round(min_railway_m)
    except Exception as exc:
        print(f"[Terra AI] zones.py railway check error (non-fatal): {exc}")

    # Build demolition warning
    if result["demolition_risk"]:
        result["demolition_warning"] = (
            "100% risk of uncompensated demolition by KeNHA/Kenya Railways. "
            "This plot falls within the statutory wayleave of a major road or railway corridor. "
            "Any structure built here is subject to compulsory demolition without compensation "
            "under the Kenya Roads Act and Kenya Railways Act. Do NOT purchase."
        )
    else:
        parts = []
        if result["nearest_highway_m"] is not None:
            parts.append(f"Nearest major highway: {result['nearest_highway_m']} m")
        if result["nearest_railway_m"] is not None:
            parts.append(f"Nearest railway: {result['nearest_railway_m']} m")
        result["demolition_warning"] = (
            "No demolition setback breach detected from hardcoded KeNHA/railway corridors. "
            + ("; ".join(parts) + "." if parts else "")
            + " Note: verify with county surveyor — official road reserves may differ from OSM data."
        )

    # ------------------------------------------------------------------
    # B) KCAA Aviation Height Restriction
    # ------------------------------------------------------------------
    try:
        zone_names = [
            "JKIA East Approach Funnel (Syokimau / Embakasi)",
            "JKIA West Approach Funnel",
            "Wilson Airport East Funnel (South C / Langata)",
            "Wilson Airport West Funnel (Ngong Corridor)",
        ]
        for i, zone_poly in enumerate(_KCAA_ZONES):
            if pin.within(zone_poly):
                result["aviation_height_restriction"] = True
                result["kcaa_zone_name"] = zone_names[i]
                break
    except Exception as exc:
        print(f"[Terra AI] zones.py KCAA check error (non-fatal): {exc}")

    if result["aviation_height_restriction"]:
        result["aviation_warning"] = (
            f"Building height strictly capped by KCAA. "
            f"Zone: {result['kcaa_zone_name']}. "
            "High-rise apartment development is not permissible. "
            "Maximum permissible height must be confirmed with the Kenya Civil Aviation Authority "
            "before any multi-storey construction or planning permission is sought."
        )
    else:
        result["aviation_warning"] = (
            "No KCAA aviation height restriction detected from hardcoded approach funnel zones. "
            "Standard county building height bylaws apply. Confirm with county physical planning office."
        )

    return result
