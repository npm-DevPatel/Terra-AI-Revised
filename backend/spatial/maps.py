"""
Google Maps data fetcher — port of terra_ai_demo1/server/services/googleMaps.js

Provides:
  - Reverse geocoding → neighbourhood name
  - Nearest police station distance (km)
  - Nearest hospital distance (km)
"""

import math
import os

from http_client import get_http_session
from runtime_cache import TTLCache

MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
_MAPS_CACHE = TTLCache[dict](ttl_seconds=int(os.getenv("TERRA_MAPS_CACHE_TTL", "86400")), max_entries=256)


def _cache_key(lat: float, lng: float) -> str:
    return f"{round(lat, 4):.4f}:{round(lng, 4):.4f}"


def fetch_maps_data(lat: float, lng: float) -> dict:
    """
    Parallel fetch of neighbourhood name and nearest amenities.

    Returns:
        {neighborhood, nearest_police_km, nearest_hospital_km}
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def _fetch() -> dict:
        results = {"neighborhood": "Unknown Area", "nearest_police_km": None, "nearest_hospital_km": None}

        if not MAPS_KEY:
            print("[Terra AI] GOOGLE_MAPS_API_KEY not set — skipping Maps data.")
            return results

        tasks = {
            "geo": lambda: _reverse_geocode(lat, lng),
            "police": lambda: _nearest_place(lat, lng, "police"),
            "hospital": lambda: _nearest_place(lat, lng, "hospital"),
        }

        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {pool.submit(fn): key for key, fn in tasks.items()}
            for fut in as_completed(futures):
                key = futures[fut]
                try:
                    value = fut.result()
                    if key == "geo":
                        results["neighborhood"] = value
                    elif key == "police":
                        results["nearest_police_km"] = value
                    elif key == "hospital":
                        results["nearest_hospital_km"] = value
                except Exception as exc:
                    print(f"[Terra AI] Maps data error ({key}): {exc}")

        return results

    return _MAPS_CACHE.get_or_set(_cache_key(lat, lng), _fetch)


def _reverse_geocode(lat: float, lng: float) -> str:
    session = get_http_session()
    url = (
        "https://maps.googleapis.com/maps/api/geocode/json"
        f"?latlng={lat},{lng}&key={MAPS_KEY}"
    )
    resp = session.get(url, timeout=6)
    resp.raise_for_status()
    results_list = resp.json().get("results", [])
    if not results_list:
        return "Unknown Area"

    # Prefer sub-locality or neighbourhood
    for result in results_list:
        for component in result.get("address_components", []):
            if "sublocality" in component["types"] or "neighborhood" in component["types"]:
                return component["long_name"]
    # Fallback to locality
    for result in results_list:
        for component in result.get("address_components", []):
            if "locality" in component["types"]:
                return component["long_name"]
    # Last resort: first formatted address segment
    first_addr = results_list[0].get("formatted_address", "") if results_list else ""
    return first_addr.split(",")[0] if first_addr else "Kenya"


def _nearest_place(lat: float, lng: float, place_type: str) -> float | None:
    session = get_http_session()
    url = (
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={lat},{lng}&rankby=distance&type={place_type}&key={MAPS_KEY}"
    )
    resp = session.get(url, timeout=6)
    resp.raise_for_status()
    places = resp.json().get("results", [])
    if not places:
        return None
    nearest = places[0]["geometry"]["location"]
    return round(_haversine_km(lat, lng, nearest["lat"], nearest["lng"]), 2)


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
