import re

with open('backend/spatial/elevation.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_body = """    if not GEE_KEY:
        print("[Terra AI] GEE key not set — skipping landcover fetch.")
        return result

    from concurrent.futures import ThreadPoolExecutor

    def do_ndvi():
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

    def do_seasonality():
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

    def do_esa():
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

    def do_slope():
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

    def do_chirps():
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
                            "scale": {"constantValue": 5566}
                        }
                    }
                }
            }
            resp = requests.post(GEE_URL, json=chirps_payload, params={"key": GEE_KEY}, timeout=15)
            resp.raise_for_status()
            precipitation = resp.json().get("result", {}).get("precipitation")
            if precipitation is not None:
                max_mm = round(float(precipitation), 1)
                result["chirps_max_rainfall_mm"] = max_mm
                result["chirps_rainfall_index"]  = _chirps_label(max_mm)
        except Exception as exc:
            print(f"[Terra AI] CHIRPS rainfall fetch failed (non-fatal): {exc}")

    def do_aspect():
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

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [
            executor.submit(do_ndvi),
            executor.submit(do_seasonality),
            executor.submit(do_esa),
            executor.submit(do_slope),
            executor.submit(do_chirps),
            executor.submit(do_aspect),
        ]
        for fut in futures:
            fut.result()

    return result"""

start_str = "    if not GEE_KEY:\n        print(\"[Terra AI] GEE key not set — skipping landcover fetch.\")\n        return result"
end_str = "    return result"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_body + content[end_idx:]
    with open('backend/spatial/elevation.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Successfully updated elevation.py')
else:
    print('Failed to find replace bounds')
