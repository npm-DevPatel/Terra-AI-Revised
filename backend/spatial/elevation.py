"""
Elevation, Sinkhole, Slope, Rainfall & Land-Cover fetchers — Terra AI

Implements:
  Step 1.2A — GEE Terrain.slope (USGS/SRTMGL1_003) replaces 5-point elevation math
  Step 1.2B — 3x3 sinkhole grid: 9 Google Maps Elevation points in 100 m bounding box
  Step 1.5  — CHIRPS long-term max rainfall (UCSB-CHG/CHIRPS/DAILY) via GEE;
               combined with is_topographical_sinkhole → Flash Flood Susceptibility metric

GEE datasets used:
  - USGS/SRTMGL1_003   Terrain.slope pixel value
  - JRC/GSW1_4/GlobalSurfaceWater  flood occurrence + seasonality
  - MODIS/061/MOD13A1  NDVI vegetation health
  - ESA/WorldCover/v200 10 m land cover classification
  - UCSB-CHG/CHIRPS/DAILY  historical daily rainfall (1981–present)
"""

import os
import requests

MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
GEE_KEY = (
    os.getenv("GOOGLE_EARTH_ENGINE_API_KEY")
    or os.getenv("GOOGLE_EARTH_ENGINE_API")
    or MAPS_KEY
    or ""
)

GEE_URL = "https://earthengine.googleapis.com/v1alpha/projects/earthengine-public:computeValue"

# ~100 m bounding box half-width (for 3×3 sinkhole grid)
_SINKHOLE_OFFSET_DEG = 0.00090   # ≈ 100 m

# ESA WorldCover class labels
_ESA_LABELS = {
    10: "Tree cover",
    20: "Shrubland",
    30: "Grassland",
    40: "Cropland",
    50: "Built-up",
    60: "Bare / sparse vegetation",
    70: "Snow and ice",
    80: "Permanent water bodies",
    90: "Herbaceous wetland",
    95: "Mangroves",
    100: "Moss and lichen",
}

# Flash Flood Susceptibility thresholds
_CHIRPS_HIGH_THRESHOLD_MM  = 60.0   # daily max > 60 mm → High intensity
_CHIRPS_MOD_THRESHOLD_MM   = 30.0   # 30–60 mm → Moderate


def _chirps_label(max_mm: float | None) -> str:
    if max_mm is None:
        return "Unknown"
    if max_mm > _CHIRPS_HIGH_THRESHOLD_MM:
        return "High"
    if max_mm > _CHIRPS_MOD_THRESHOLD_MM:
        return "Moderate"
    return "Low"


def _flood_susceptibility(chirps_label: str, is_sinkhole: bool) -> str:
    """
    Combine CHIRPS rainfall intensity + sinkhole flag into a
    Flash Flood Susceptibility level: Critical / High / Moderate / Low.
    """
    if is_sinkhole and chirps_label == "High":
        return "Critical"
    if is_sinkhole or chirps_label == "High":
        return "High"
    if chirps_label == "Moderate":
        return "Moderate"
    return "Low"


# ---------------------------------------------------------------------------
# Step 1.2 — fetch_elevation_data
# ---------------------------------------------------------------------------

def fetch_elevation_data(lat: float, lng: float) -> dict:
    """
    Fetch:
      - Elevation at pin via Google Maps Elevation API (single point)
      - 3×3 grid (9 points) in a 100 m bounding box → sinkhole detection
      - Flood history via JRC GSW

    Slope is now sourced from GEE Terrain.slope inside fetch_gee_landcover()
    so this function no longer computes slope from multi-point math.

    Returns:
        {elevation_m, slope_percent, flood_history, is_topographical_sinkhole,
         sinkhole_center_elev, sinkhole_surrounding_avg}
    """
    if not MAPS_KEY:
        print("[Terra AI] GOOGLE_MAPS_API_KEY not set — skipping elevation.")
        return {
            "elevation_m": None,
            "slope_percent": None,
            "flood_history": False,
            "is_topographical_sinkhole": False,
            "sinkhole_center_elev": None,
            "sinkhole_surrounding_avg": None,
        }

    # ------------------------------------------------------------------
    # Build 3×3 grid within 100 m bounding box
    # Grid layout (index):
    #   0  1  2
    #   3  4  5   ← index 4 is the centre pin
    #   6  7  8
    # ------------------------------------------------------------------
    half = _SINKHOLE_OFFSET_DEG / 2   # 50 m offset for inner ring
    full = _SINKHOLE_OFFSET_DEG       # 100 m offset for outer ring

    grid_offsets = [
        (-full,  full), (0,  full), ( full,  full),   # top row
        (-full,  0   ), (0,  0   ), ( full,  0   ),   # middle row (index 4 = centre)
        (-full, -full), (0, -full), ( full, -full),   # bottom row
    ]

    locations_str = "|".join(
        f"{lat + dlat},{lng + dlng}" for dlat, dlng in grid_offsets
    )

    url = (
        "https://maps.googleapis.com/maps/api/elevation/json"
        f"?locations={locations_str}&key={MAPS_KEY}"
    )

    elevation_result = {
        "elevation_m": None,
        "slope_percent": None,         # will be filled by GEE in fetch_gee_landcover
        "flood_history": False,
        "is_topographical_sinkhole": False,
        "sinkhole_center_elev": None,
        "sinkhole_surrounding_avg": None,
    }

    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        results = resp.json().get("results", [])

        if len(results) < 9:
            print(f"[Terra AI] Expected 9 elevation points, got {len(results)}")
        else:
            elevations = [r["elevation"] for r in results]
            center_elev   = elevations[4]               # index 4 = pin
            surrounding   = [elevations[i] for i in range(9) if i != 4]
            surr_avg      = sum(surrounding) / len(surrounding)

            elevation_result["elevation_m"] = round(center_elev, 1)
            elevation_result["sinkhole_center_elev"] = round(center_elev, 2)
            elevation_result["sinkhole_surrounding_avg"] = round(surr_avg, 2)

            # Sinkhole: centre lower than 80% of the 8 surrounding points
            lower_count = sum(1 for e in surrounding if center_elev < e)
            elevation_result["is_topographical_sinkhole"] = lower_count >= 7  # 7 of 8

        # ------------------------------------------------------------------
        # Flood history check (non-fatal inner try)
        # ------------------------------------------------------------------
        try:
            elevation_result["flood_history"] = _check_flood_history(lat, lng)
        except Exception as flood_err:
            print(f"[Terra AI] Flood check failed (non-fatal): {flood_err}")

    except Exception as err:
        print(f"[Terra AI] Elevation/sinkhole fetch error: {err}")

    return elevation_result


# ---------------------------------------------------------------------------
# Step 1.2A helper — JRC flood history (unchanged)
# ---------------------------------------------------------------------------

def _check_flood_history(lat: float, lng: float) -> bool:
    """JRC GSW GlobalSurfaceWater occurrence check via GEE."""
    if not GEE_KEY:
        return False
    payload = {
        "expression": {
            "functionInvocationValue": {
                "functionName": "Image.reduceRegion",
                "arguments": {
                    "input": {
                        "functionInvocationValue": {
                            "functionName": "Image.select",
                            "arguments": {
                                "input": {
                                    "functionInvocationValue": {
                                        "functionName": "ImageCollection.first",
                                        "arguments": {
                                            "collection": {
                                                "functionInvocationValue": {
                                                    "functionName": "ImageCollection.load",
                                                    "arguments": {
                                                        "id": {
                                                            "constantValue": "JRC/GSW1_4/GlobalSurfaceWater"
                                                        }
                                                    },
                                                }
                                            }
                                        },
                                    }
                                },
                                "bandSelectors": {"constantValue": ["occurrence"]},
                            },
                        }
                    },
                    "reducer": {"functionInvocationValue": {"functionName": "Reducer.mean", "arguments": {}}},
                    "region": {
                        "functionInvocationValue": {
                            "functionName": "Geometry.Point",
                            "arguments": {
                                "coordinates": {"constantValue": [lng, lat]}
                            },
                        }
                    },
                    "scale": {"constantValue": 30},
                },
            }
        }
    }

    resp = requests.post(
        GEE_URL,
        json=payload,
        params={"key": GEE_KEY},
        timeout=15,
    )
    resp.raise_for_status()
    occurrence = resp.json().get("result", {}).get("occurrence", 0)
    return int(occurrence or 0) > 0


# ---------------------------------------------------------------------------
# Step 1.2A + 1.5 — fetch_gee_landcover
# ---------------------------------------------------------------------------

def fetch_gee_landcover(lat: float, lng: float) -> dict:
    """
    Fetch GEE datasets:
      - MODIS MOD13A1       → NDVI (vegetation health)
      - JRC GSW seasonality → seasonal water risk
      - ESA WorldCover v200 → 10 m land cover
      - USGS/SRTMGL1_003 Terrain.slope → actual slope % (Step 1.2A)
      - UCSB-CHG/CHIRPS/DAILY → long-term max daily rainfall (Step 1.5)

    Returns:
        {
            ndvi_score, ndvi_interpretation,
            seasonal_water, land_cover_class, land_cover_label,
            wetland_risk, tree_cover_flag, aspect_degrees,
            slope_percent,            ← new (GEE Terrain.slope)
            chirps_max_rainfall_mm,   ← new (CHIRPS)
            chirps_rainfall_index,    ← new  "Low" | "Moderate" | "High"
            flash_flood_susceptibility ← new (requires is_topographical_sinkhole from routes)
        }

    Note: flash_flood_susceptibility is set to None here; routes.py computes
    the final value after merging with the sinkhole flag from elevation data.
    """
    result = {
        "ndvi_score": None,
        "ndvi_interpretation": "unknown",
        "seasonal_water": False,
        "land_cover_class": None,
        "land_cover_label": "Unknown",
        "wetland_risk": False,
        "tree_cover_flag": False,
        "aspect_degrees": None,
        "slope_percent": None,
        "chirps_max_rainfall_mm": None,
        "chirps_rainfall_index": "Unknown",
        "flash_flood_susceptibility": None,
    }

    if not GEE_KEY:
        print("[Terra AI] GEE key not set — skipping landcover fetch.")
        return result

    # ------------------------------------------------------------------
    # NDVI via MODIS MOD13A1
    # ------------------------------------------------------------------
    try:
        ndvi_payload = {
            "expression": {
                "functionInvocationValue": {
                    "functionName": "Image.reduceRegion",
                    "arguments": {
                        "input": {
                            "functionInvocationValue": {
                                "functionName": "ImageCollection.mean",
                                "arguments": {
                                    "collection": {
                                        "functionInvocationValue": {
                                            "functionName": "ImageCollection.select",
                                            "arguments": {
                                                "input": {
                                                    "functionInvocationValue": {
                                                        "functionName": "ImageCollection.filterDate",
                                                        "arguments": {
                                                            "collection": {
                                                                "functionInvocationValue": {
                                                                    "functionName": "ImageCollection.load",
                                                                    "arguments": {
                                                                        "id": {"constantValue": "MODIS/061/MOD13A1"}
                                                                    }
                                                                }
                                                            },
                                                            "start": {"constantValue": "2023-01-01"},
                                                            "end": {"constantValue": "2024-01-01"}
                                                        }
                                                    }
                                                },
                                                "bandSelectors": {"constantValue": ["NDVI"]}
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "reducer": {"functionInvocationValue": {"functionName": "Reducer.mean", "arguments": {}}},
                        "geometry": {
                            "functionInvocationValue": {
                                "functionName": "Geometry.Point",
                                "arguments": {"coordinates": {"constantValue": [lng, lat]}}
                            }
                        },
                        "scale": {"constantValue": 500}
                    }
                }
            }
        }
        resp = requests.post(GEE_URL, json=ndvi_payload, params={"key": GEE_KEY}, timeout=15)
        resp.raise_for_status()
        raw_ndvi = resp.json().get("result", {}).get("NDVI")
        if raw_ndvi is not None:
            ndvi_val = float(raw_ndvi) / 10000.0
            result["ndvi_score"] = round(ndvi_val, 3)
            if ndvi_val < 0.1:
                result["ndvi_interpretation"] = "bare / possibly degraded"
            elif ndvi_val < 0.3:
                result["ndvi_interpretation"] = "sparse vegetation"
            elif ndvi_val < 0.6:
                result["ndvi_interpretation"] = "moderate vegetation"
            else:
                result["ndvi_interpretation"] = "dense vegetation"
    except Exception as exc:
        print(f"[Terra AI] NDVI fetch failed (non-fatal): {exc}")

    # ------------------------------------------------------------------
    # JRC Seasonality band
    # ------------------------------------------------------------------
    try:
        season_payload = {
            "expression": {
                "functionInvocationValue": {
                    "functionName": "Image.sample",
                    "arguments": {
                        "input": {
                            "functionInvocationValue": {
                                "functionName": "Image.select",
                                "arguments": {
                                    "input": {
                                        "functionInvocationValue": {
                                            "functionName": "ImageCollection.first",
                                            "arguments": {
                                                "collection": {
                                                    "functionInvocationValue": {
                                                        "functionName": "ImageCollection.load",
                                                        "arguments": {"id": {"constantValue": "JRC/GSW1_4/GlobalSurfaceWater"}}
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "bandSelectors": {"constantValue": ["seasonality"]}
                                }
                            }
                        },
                        "region": {
                            "functionInvocationValue": {
                                "functionName": "Geometry.Point",
                                "arguments": {"coordinates": {"constantValue": [lng, lat]}}
                            }
                        },
                        "scale": {"constantValue": 30}
                    }
                }
            }
        }
        resp = requests.post(GEE_URL, json=season_payload, params={"key": GEE_KEY}, timeout=15)
        resp.raise_for_status()
        seasonality = (
            resp.json()
            .get("result", {})
            .get("features", [{}])[0]
            .get("properties", {})
            .get("seasonality", 0)
        )
        result["seasonal_water"] = int(seasonality or 0) > 3
    except Exception as exc:
        print(f"[Terra AI] Seasonality fetch failed (non-fatal): {exc}")

    # ------------------------------------------------------------------
    # ESA WorldCover 10 m land cover
    # ------------------------------------------------------------------
    try:
        esa_payload = {
            "expression": {
                "functionInvocationValue": {
                    "functionName": "Image.sample",
                    "arguments": {
                        "input": {
                            "functionInvocationValue": {
                                "functionName": "ImageCollection.first",
                                "arguments": {
                                    "collection": {
                                        "functionInvocationValue": {
                                            "functionName": "ImageCollection.load",
                                            "arguments": {"id": {"constantValue": "ESA/WorldCover/v200"}}
                                        }
                                    }
                                }
                            }
                        },
                        "region": {
                            "functionInvocationValue": {
                                "functionName": "Geometry.Point",
                                "arguments": {"coordinates": {"constantValue": [lng, lat]}}
                            }
                        },
                        "scale": {"constantValue": 10}
                    }
                }
            }
        }
        resp = requests.post(GEE_URL, json=esa_payload, params={"key": GEE_KEY}, timeout=15)
        resp.raise_for_status()
        lc_class = (
            resp.json()
            .get("result", {})
            .get("features", [{}])[0]
            .get("properties", {})
            .get("Map")
        )
        if lc_class is not None:
            lc_int = int(lc_class)
            result["land_cover_class"] = lc_int
            result["land_cover_label"] = _ESA_LABELS.get(lc_int, f"Class {lc_int}")
            result["wetland_risk"] = lc_int in (90, 80)
            result["tree_cover_flag"] = lc_int == 10
    except Exception as exc:
        print(f"[Terra AI] ESA WorldCover fetch failed (non-fatal): {exc}")

    # ------------------------------------------------------------------
    # Step 1.2A — GEE Terrain.slope from USGS/SRTMGL1_003
    # Replaces the old 5-point Google Maps elevation slope math.
    # ------------------------------------------------------------------
    try:
        slope_payload = {
            "expression": {
                "functionInvocationValue": {
                    "functionName": "Image.reduceRegion",
                    "arguments": {
                        "input": {
                            "functionInvocationValue": {
                                "functionName": "Terrain.slope",
                                "arguments": {
                                    "input": {
                                        "functionInvocationValue": {
                                            "functionName": "Image.load",
                                            "arguments": {"id": {"constantValue": "USGS/SRTMGL1_003"}}
                                        }
                                    }
                                }
                            }
                        },
                        "reducer": {"functionInvocationValue": {"functionName": "Reducer.mean", "arguments": {}}},
                        "geometry": {
                            "functionInvocationValue": {
                                "functionName": "Geometry.Point",
                                "arguments": {"coordinates": {"constantValue": [lng, lat]}}
                            }
                        },
                        "scale": {"constantValue": 30}
                    }
                }
            }
        }
        resp = requests.post(GEE_URL, json=slope_payload, params={"key": GEE_KEY}, timeout=15)
        resp.raise_for_status()
        slope_val = resp.json().get("result", {}).get("slope")
        if slope_val is not None:
            result["slope_percent"] = round(float(slope_val), 1)
    except Exception as exc:
        print(f"[Terra AI] GEE Terrain.slope fetch failed (non-fatal): {exc}")

    # ------------------------------------------------------------------
    # Step 1.5 — CHIRPS long-term max daily rainfall
    # Dataset: UCSB-CHG/CHIRPS/DAILY  (1981–2023)
    # We query max pixel value over a long historical window.
    # ------------------------------------------------------------------
    try:
        chirps_payload = {
            "expression": {
                "functionInvocationValue": {
                    "functionName": "Image.reduceRegion",
                    "arguments": {
                        "input": {
                            "functionInvocationValue": {
                                "functionName": "ImageCollection.max",
                                "arguments": {
                                    "collection": {
                                        "functionInvocationValue": {
                                            "functionName": "ImageCollection.filterDate",
                                            "arguments": {
                                                "collection": {
                                                    "functionInvocationValue": {
                                                        "functionName": "ImageCollection.load",
                                                        "arguments": {
                                                            "id": {"constantValue": "UCSB-CHG/CHIRPS/DAILY"}
                                                        }
                                                    }
                                                },
                                                "start": {"constantValue": "1981-01-01"},
                                                "end":   {"constantValue": "2023-12-31"}
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "reducer": {"functionInvocationValue": {"functionName": "Reducer.mean", "arguments": {}}},
                        "geometry": {
                            "functionInvocationValue": {
                                "functionName": "Geometry.Point",
                                "arguments": {"coordinates": {"constantValue": [lng, lat]}}
                            }
                        },
                        "scale": {"constantValue": 5566}   # CHIRPS native resolution ~0.05°
                    }
                }
            }
        }
        resp = requests.post(GEE_URL, json=chirps_payload, params={"key": GEE_KEY}, timeout=20)
        resp.raise_for_status()
        precipitation = resp.json().get("result", {}).get("precipitation")
        if precipitation is not None:
            max_mm = round(float(precipitation), 1)
            result["chirps_max_rainfall_mm"] = max_mm
            result["chirps_rainfall_index"]  = _chirps_label(max_mm)
    except Exception as exc:
        print(f"[Terra AI] CHIRPS rainfall fetch failed (non-fatal): {exc}")

    # SRTM aspect (unchanged from previous version)
    try:
        aspect_payload = {
            "expression": {
                "functionInvocationValue": {
                    "functionName": "Image.reduceRegion",
                    "arguments": {
                        "input": {
                            "functionInvocationValue": {
                                "functionName": "Terrain.aspect",
                                "arguments": {
                                    "input": {
                                        "functionInvocationValue": {
                                            "functionName": "Image.load",
                                            "arguments": {"id": {"constantValue": "USGS/SRTMGL1_003"}}
                                        }
                                    }
                                }
                            }
                        },
                        "reducer": {"functionInvocationValue": {"functionName": "Reducer.mean", "arguments": {}}},
                        "geometry": {
                            "functionInvocationValue": {
                                "functionName": "Geometry.Point",
                                "arguments": {"coordinates": {"constantValue": [lng, lat]}}
                            }
                        },
                        "scale": {"constantValue": 30}
                    }
                }
            }
        }
        resp = requests.post(GEE_URL, json=aspect_payload, params={"key": GEE_KEY}, timeout=15)
        resp.raise_for_status()
        aspect = resp.json().get("result", {}).get("aspect")
        if aspect is not None:
            result["aspect_degrees"] = round(float(aspect), 1)
    except Exception as exc:
        print(f"[Terra AI] Aspect fetch failed (non-fatal): {exc}")

    return result
