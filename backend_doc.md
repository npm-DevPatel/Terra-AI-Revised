# Terra AI Backend — Full Technical Documentation

## Overview

The Terra AI backend is a **Flask-based geospatial intelligence API** purpose-built for Kenyan real estate pre-purchase due diligence. Given a GPS coordinate (lat/lng) anywhere within Kenya, the engine fans out to 11+ external data sources in parallel, runs deterministic spatial risk scoring, and synthesises a structured land feasibility report using Gemini 2.5 Flash AI.

It is deployed on **Render** (free tier) and communicates with a **React/Vite frontend** hosted on Vercel.

---

## Directory Structure

```
backend/
├── app.py                  # Flask application factory & entry point
├── bootstrap.py            # Background warmup thread (groundwater shapefile)
├── http_client.py          # Shared requests.Session singleton with retry logic
├── runtime_cache.py        # Generic TTLCache[T] used across all fetchers
├── requirements.txt        # Production Python dependencies
├── Procfile                # Gunicorn entrypoint for Render
├── .python-version         # Python 3.11.9
├── db/
│   ├── __init__.py
│   └── supabase_client.py  # Supabase singleton client (anon key)
├── spatial/
│   ├── __init__.py
│   ├── routes.py           # Flask Blueprint — all API endpoints + orchestrator
│   ├── elevation.py        # GEE terrain, sinkhole grid, JRC flood, NDVI, CHIRPS rainfall
│   ├── gemini_synth.py     # Gemini 2.5 Flash report synthesiser
│   ├── groundwater.py      # BGS Africa Groundwater Atlas (Kenya_HG.shp)
│   ├── maps.py             # Google Maps — reverse geocode, amenity proximity
│   ├── overpass.py         # OpenStreetMap Overpass API — OSM features query
│   ├── shapely_engine.py   # HydroSHEDS riparian check + all Shapely spatial ops
│   ├── soil.py             # ISRIC SoilGrids API — clay %, CEC, foundation risk
│   └── zones.py            # KeNHA/SGR demolition buffers + KCAA aviation polygons
└── land/                   # Python virtual environment (venv name: land)
```

---

## Entry Point: `app.py`

The Flask application is created here and configured with:

| Concern | Implementation |
|---|---|
| Request size cap | `MAX_CONTENT_LENGTH = 10 MB` |
| CORS | `flask-cors` — allows configured `FRONTEND_URL`, `localhost:5173/5174`, Vercel preview wildcards, and `terra-ai-revised*.onrender.com` |
| Rate limiting | `flask-limiter` — **300 req/hour, 60 req/min** global per-IP (in-memory, no Redis) |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Cache-Control: no-store` on all `/api/*` |
| Blueprint | `spatial_bp` from `spatial/routes.py` registered at root |

### Routes registered in `app.py`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Service info & endpoint listing |
| GET | `/health` | Health check (no rate limit — used by Render & frontend keep-alive) |
| GET | `/ready` | Readiness probe — returns 503 until warmup (groundwater shapefile) is complete |
| GET | `/favicon.ico` | 204 no-content stub |

### Error handlers

`413` (payload too large), `429` (rate limited), `500` (unhandled), `404`, `400` — all return structured JSON.

---

## Blueprint: `spatial/routes.py`

All analysis logic lives in the `spatial` Blueprint. This file is the orchestrator.

### Endpoint: `POST /api/spatial/scan`

The sole analysis endpoint. Accepts `{"lat": float, "lng": float}` (optionally with `clientContext` and `visionContext`).

#### Security

1. **JWT authentication** (`_require_auth()`) — extracts the Supabase Bearer token from `Authorization` header. Decodes without signature verification (MVP — structural + `sub` claim validation). Returns `401` if absent or malformed.
2. **Kenya bounding box** — rejects coordinates outside `lat ∈ [-5, 5]`, `lng ∈ [33.9, 41.9]`.
3. **Rate limiting** — enforced via `flask-limiter` (configured in `app.py`).

#### Two-Layer Caching

| Layer | Mechanism | TTL | Scope |
|---|---|---|---|
| L1 | In-memory `dict` | 24 h (resets on restart) | Per-process |
| L2 | Supabase `reports` table (`lat_rounded`, `lng_rounded` columns) | Persistent | Cross-restart / cross-instance |

On cache hit (either layer) the full response is returned immediately. L2 hits also backfill L1.

#### Parallel Data Fetch (11 tasks via `ThreadPoolExecutor`)

All external calls are fired concurrently. Each task is wrapped in `_run_timed_task()` which records wall-clock latency for optional diagnostics:

| Task Name | Module/Function | Source |
|---|---|---|
| `overpass` | `spatial.overpass.fetch_overpass_data` | OpenStreetMap Overpass API |
| `elevation` | `spatial.elevation.fetch_elevation_data` | Google Maps Elevation API + JRC GSW |
| `maps` | `spatial.maps.fetch_maps_data` | Google Maps Geocoding + Places |
| `soil` | `spatial.soil.fetch_soil_data` | ISRIC SoilGrids REST API |
| `groundwater` | `spatial.groundwater.query_groundwater` | BGS Kenya_HG.shp (local shapefile) |
| `gee_landcover` | `spatial.elevation.fetch_gee_landcover` | Google Earth Engine (ESA WorldCover, SRTM slope, MODIS NDVI) |
| `no2_pollution` | `spatial.elevation.fetch_no2_pollution` | GEE Sentinel-5P NO₂ data |
| `weather` | `routes.fetch_weather_risk` | Open-Meteo (soil moisture, free tier) |
| `admin` | `routes.fetch_admin_context` | Nominatim reverse geocoding |
| `solar` | `routes.fetch_solar_data` | Google Solar API (buildingInsights) |
| `zone_risks` | `spatial.zones.compute_zone_risks` | Hardcoded KeNHA/SGR/KCAA geometries |

#### Deterministic Risk Scoring (`_compute_deterministic_score`)

After all tasks complete, the engine computes a **server-side score (0–100)** that Gemini is instructed to use verbatim. Deductions:

| Condition | Deduction |
|---|---|
| Demolition risk (KeNHA/SGR buffer) | −25 |
| Riparian breach (<30m, NEMA EMCA Cap 387) | −20 |
| Flood history (JRC confirmed) | −20 |
| Protected land overlap | −20 |
| ISRIC Black Cotton Clay (clay >45%, CEC >30) | −12 |
| KCAA aviation height restriction | −10 |
| Severe NO₂ air pollution (Sentinel-5P) | −10 |
| Road reserve encroachment | −10 |
| ISRIC high clay >45% (no CEC data) | −8 |
| Seasonal surface water | −8 |
| Topographical sinkhole | −8 |
| Steep terrain ≥20% | −10 |
| Moderate slope 12–20% | −5 |
| ISRIC moderate clay 30–45% | −4 |
| BGS water scarcity (low aquifer productivity) | −5 |

Score labels: **SAFE** (≥80), **MODERATE WARNINGS** (60–79), **HIGH RISK** (40–59), **CRITICAL / HIGH RISK** (<40).

#### Zone Tier Classification

Classifies the location into three tiers for infrastructure cost guidance:

- **Tier 1 (hyper-urban)**: Nairobi CBD, Kilimani, Westlands, Nyali, Mombasa Island, etc.
- **Tier 2 (peri-urban)**: Ruiru, Syokimau, Kitengela, Rongai, Thika, Kasarani, etc.
- **Tier 3 (rural)**: Everything else.

Tier is used by Gemini to select the correct KPLC grid connection cost range.

#### Gemini Synthesis

The merged analysis payload is sent to `synthesize_with_gemini()`. If Gemini is unavailable (API key missing, quota exceeded, network error), `_build_fallback_report()` returns a deterministic heuristic report so the endpoint never fails completely.

#### DB Persistence (Supabase)

After a fresh analysis, the full response is written to the `reports` table with `user_id`, `lat_rounded`, `lng_rounded`, and `payload` columns via a per-request authenticated Supabase client (`_make_authed_client`). If `SUPABASE_SERVICE_ROLE_KEY` is set, it bypasses RLS; otherwise the user JWT is injected into the PostgREST client for RLS enforcement.

#### Response Shape

```json
{
  "success": true,
  "payload": { /* merged analysis payload — all raw geospatial data */ },
  "report": { /* Gemini or fallback report */ },
  "report_source": "gemini | fallback | database",
  "model_used": "gemini-2.5-flash | null"
}
```

---

## Module Reference

### `spatial/elevation.py` — Terrain, Flood & Land Cover

Uses Google Earth Engine REST API (`earthengine.googleapis.com/v1`) and Google Maps Elevation API.

| Function | What it fetches |
|---|---|
| `fetch_elevation_data(lat, lng)` | Single-point elevation (Google Maps Elevation API); 3×3 grid of 9 points in a 100m bounding box for **sinkhole detection**; JRC Global Surface Water flood occurrence + seasonality |
| `fetch_gee_landcover(lat, lng)` | GEE **SRTM slope** pixel value; **ESA WorldCover v200** land cover class (10m); **MODIS NDVI**; **CHIRPS daily rainfall** max (1981–present) for Flash Flood Susceptibility |
| `fetch_no2_pollution(lat, lng)` | GEE **Sentinel-5P NO₂** column density → `severe_air_pollution` flag |

**Flash Flood Susceptibility** combines CHIRPS rainfall label (Low/Moderate/High at 30 mm/60 mm thresholds) with the sinkhole flag to produce: Low / Moderate / High / Critical.

All results are cached in `TTLCache` instances (24 h TTL, 256 entry cap).

---

### `spatial/gemini_synth.py` — AI Report Generation

Calls **Gemini 2.5 Flash** via `google-generativeai`.

**System prompt** encodes 14 strict operating rules for Kenya-specific land analysis:
- Score neutrality (must use server-computed `_deterministic_score` verbatim)
- ISRIC soil classification thresholds (Black Cotton Clay, Moderate Clay, Stable Laterite)
- Urban soil mask handling
- Demolition and aviation flag wording
- Kenya-specific legal references (EMCA Cap 387, Physical and Land Use Planning Act 2019, Water Act 2016, KCAA)
- Mandatory KES cost quantification on every risk flag
- Zone-aware infrastructure cost ranges (Tier 1/2/3)
- BGS groundwater scarcity borehole cost (KES 2,000,000 for deep rotary)

**Report schema** includes: `investment_verdict`, `executive_summary`, `risk_flags[]` (with severity and KES impact), `cost_summary`, `sections[]` (legal, foundation, infrastructure).

`answer_questions_with_gemini_safe()` — a secondary function for follow-up Q&A on a pre-analysed site.

---

### `spatial/groundwater.py` — BGS Hydrogeology

**Data source**: `datasets/Kenya_HG.shp` — BGS Africa Groundwater Atlas Kenya polygon shapefile.

**Lazy singleton loader** (thread-safe, double-checked locking). Loaded once on first query (or eagerly by `bootstrap.py` warmup).

**Key attributes read from each matched polygon**:
- `AqProd` — aquifer productivity (verbose)
- `SimAqProd` — simplified productivity class
- `AqDepth` — depth range text (e.g. `"100-150"`, `">150"`)
- `AqYield`, `HG_AMM`, `DetailHG2`

**Flag logic**:
- `water_scarcity_risk = True` if depth >150 m OR `SimAqProd` contains "Low"
- `borehole_premium_kes = 2,000,000` when scarcity flag is set

---

### `spatial/maps.py` — Google Maps

Parallel fetch (3-worker `ThreadPoolExecutor`) per call:

| Sub-task | API | Output |
|---|---|---|
| Reverse geocode | Maps Geocoding API | `neighborhood` (sub-locality → locality fallback) |
| Nearest police | Maps Places Nearby Search | `nearest_police_km` |
| Nearest hospital | Maps Places Nearby Search | `nearest_hospital_km` |

Results cached in `TTLCache` (24 h, configurable via `TERRA_MAPS_CACHE_TTL`).

---

### `spatial/overpass.py` — OpenStreetMap Features

Sends a single batched **Overpass QL** query to extract all risk-relevant OSM features within 800 m (6 km for aerodromes). Queries:

- **Water**: rivers, streams, canals, wetlands, basins → riparian risk input
- **Roads**: trunk/primary/secondary/tertiary highways → road reserve input
- **Power**: lines, minor lines, cables, poles, towers, substations, transformers → grid distance
- **Aviation**: aerodromes → aviation risk
- **Land use**: residential, commercial, industrial, forest, cemetery, etc. → zoning context
- **Protected land**: national parks, forest reserves, protected areas → protected land flag
- **Amenities**: schools, hospitals, police, banks, markets, fuel stations → value context
- **Infrastructure**: water points, pipelines, water towers
- **Hazards**: cliffs, escarpments, geological faults

Tries 2 Overpass instances with automatic fallback on failure. Results cached 24 h.

---

### `spatial/shapely_engine.py` — Spatial Risk Computation

Combines Overpass OSM elements and local GIS data using **Shapely** geometry operations.

**HydroSHEDS Riparian Check** (primary, replaces OSM waterway proximity):
- Loads `datasets/HydroRIVERS_v10_af.shp` dynamically via **pyogrio** bbox filter (~5.5 km window) — avoids OOM on the continent-wide shapefile
- Computes precise point-to-nearest-river-line distance
- `riparian_breach = True` if distance < **30 m** (EMCA Cap 387 / NEMA statutory setback)
- Falls back to OSM waterway distance if shapefile is absent

**Other spatial checks**:
- **Road reserve risk**: nearest highway Shapely LineString distance < 15 m
- **Grid distance**: nearest power line/pole/tower distance in metres
- **Aviation risk**: haversine distance to 7 hardcoded Kenyan major airports (JKIA, Wilson, Moi International Mombasa, Kisumu, Eldoret, Malindi, Moi Air Base) with per-airport restriction radii
- **Protected land**: OSM protected area / national park / forest reserve polygon check
- **Water connection**: nearest water point / pipeline / water tower < 200 m
- **Cliff proximity**: nearest cliff / escarpment distance in metres
- **Demolition risk**: computed separately in `zones.py` (see below)

---

### `spatial/zones.py` — Demolition & Aviation Zones

Hard-coded Shapely geometry checks:

**KeNHA Highway Demolition Buffers** (60 m):
- Thika Superhighway (A2), Mombasa Road (A109), Ngong Road (C58), Waiyaki Way (A104), Langata Road (C59), Eastern Bypass (B8)

**SGR / MGR Railway Demolition Buffers** (30 m):
- Standard Gauge Railway: Nairobi SGR → Mlolongo → Mombasa
- Nairobi Commuter Rail: Nairobi → Kikuyu, Nairobi → Thika

**KCAA Aviation Zone Polygons**:
- JKIA approach funnels (Eastlands / Syokimau direction)
- Wilson Airport approach funnels (Lang'ata / South C direction)

Returns: `demolition_risk` (bool) + `aviation_height_restriction` (bool).

---

### `spatial/soil.py` — ISRIC SoilGrids

Queries the public **ISRIC SoilGrids v2.0 REST API** (no auth required) for `clay`, `silt`, `bdod` (bulk density), and `cec` at `0-5cm` and `30-60cm` depths.

**Classification** (at 30-60 cm):

| Clay % | CEC | Type | Foundation Premium |
|---|---|---|---|
| >45 | >30 | Black Cotton Clay | KES 800,000–1,500,000 |
| 30–45 | any | Moderate Clay/Loam | KES 200,000–500,000 |
| <30 | any | Stable/Red Laterite | No premium |

**Urban mask**: If no ISRIC pixel exists within ~500 m (dense urban core), returns `soil_type = "Urban/Built-Up"` with a mandatory physical geotech test requirement. Foundation premium set to KES 0.

**Fallback**: API unreachable → returns `soil_type = "Unknown"` — mandatory NCA soil investigation flagged.

Results cached 24 h.

---

## Shared Infrastructure

### `http_client.py` — Shared HTTP Session

A **thread-safe singleton** `requests.Session` with:
- Connection pool: 32 connections, 32 max size
- Retry policy: 2 total retries, backoff 0.4s, on status codes `429, 500, 502, 503, 504`
- `Connection: keep-alive` header

All spatial modules call `get_http_session()` — no per-module session creation.

### `runtime_cache.py` — TTLCache

Generic `TTLCache[T]` class (thread-safe):
- `get_or_set(key, factory)` — atomic get-or-compute pattern
- TTL eviction on read and on `set`
- Max-entries LRU eviction: prunes oldest entries when capacity is exceeded
- `status()` method for observability

Each module maintains its own `TTLCache` instance with appropriate TTLs:

| Cache | TTL |
|---|---|
| Elevation / GEE / Groundwater / Maps / Solar / Admin | 24 h |
| Overpass / Soil | 24 h |
| NO₂ pollution | 12 h |
| Weather (soil moisture) | 6 h |

### `bootstrap.py` — Startup Warmup

Runs `warm_groundwater_data()` (loads `Kenya_HG.shp`) in a daemon thread on server start. Controlled by `TERRA_WARMUP_SYNC` env var (default: synchronous on Render to ensure `/ready` passes before first request).

`warmup_status()` returns component readiness — surfaced at `GET /ready`.

### `db/supabase_client.py` — Supabase Singleton

Module-level singleton `supabase_client` using anon key. Used for L2 cache reads (`reports` table). Write operations use per-request authenticated clients built in `routes.py` via `_make_authed_client()`.

Gracefully degrades to `None` if `supabase` package is not installed or env vars are missing.

---

## External API Dependencies & Key Environment Variables

| Variable | Used By | Required |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Maps, Elevation, GEE (shared key), Solar | Yes |
| `GOOGLE_EARTH_ENGINE_API_KEY` | GEE (Terrain, Landcover, NDVI, CHIRPS, NO₂) | Fallback to Maps key |
| `GEMINI_API_KEY` | `gemini_synth.py` | Yes (fallback report if absent) |
| `SUPABASE_URL` | `db/supabase_client.py`, `routes.py` | Yes for DB caching |
| `SUPABASE_ANON_KEY` | Supabase client init | Yes for DB caching |
| `SUPABASE_SERVICE_ROLE_KEY` | `routes.py` — bypasses RLS on write | Optional |
| `SUPABASE_JWT_SECRET` | `routes.py` `_require_auth()` | Optional (structural-only if absent) |
| `FRONTEND_URL` | CORS allowlist in `app.py` | Production |
| `TERRA_WARMUP_SYNC` | `bootstrap.py` | Optional (default `"1"`) |
| `PORT` | `app.py` `__main__` | Render injects automatically |

---

## Local Datasets

| File | Used By | Description |
|---|---|---|
| `datasets/Kenya_HG.shp` (+ sidecar files) | `groundwater.py` | BGS Africa Groundwater Atlas — aquifer polygons for all of Kenya |
| `datasets/HydroRIVERS_v10_af.shp` (+ sidecar files) | `shapely_engine.py` | HydroSHEDS Africa river network — precise riparian setback checks |

Both are loaded lazily and filtered spatially at query time to avoid OOM.

---

## Deployment

| Aspect | Detail |
|---|---|
| Server | Gunicorn (configured in `Procfile`) |
| Platform | Render (free tier) |
| Python version | 3.11.9 (`.python-version`) |
| Virtual environment | `land/` (not `venv/`) |
| Port | 5000 local / `$PORT` on Render |
| Backend URL | `https://terra-ai-revised-backend.onrender.com` |

---

## Data Flow Summary

```
Frontend (React)
     │  POST /api/spatial/scan  { lat, lng }
     │  Authorization: Bearer <Supabase JWT>
     ▼
app.py  →  CORS check → Rate limit → Blueprint
     ▼
routes.py /api/spatial/scan
     │
     ├─ _require_auth()          JWT decode → user_id
     ├─ Bounding box validation  Kenya only
     ├─ L1 cache check           (in-memory dict)
     ├─ L2 cache check           (Supabase reports table)
     │
     └─ ThreadPoolExecutor (11 parallel tasks)
          ├─ fetch_overpass_data()   → OSM features (waterways, roads, power, land use)
          ├─ fetch_elevation_data()  → elevation, sinkhole grid, JRC flood history
          ├─ fetch_maps_data()       → neighbourhood, police/hospital proximity
          ├─ fetch_soil_data()       → ISRIC clay%, CEC, foundation classification
          ├─ query_groundwater()     → BGS shapefile aquifer data
          ├─ fetch_gee_landcover()   → SRTM slope, ESA WorldCover, NDVI, CHIRPS
          ├─ fetch_no2_pollution()   → Sentinel-5P NO₂ air quality
          ├─ fetch_weather_risk()    → Open-Meteo soil moisture
          ├─ fetch_admin_context()   → Nominatim county/ward
          ├─ fetch_solar_data()      → Google Solar API
          └─ compute_zone_risks()    → KeNHA/SGR/KCAA hardcoded geometry
               │
               └─ compute_risks()   → shapely_engine riparian + road reserve + grid distance
                    │
                    ▼
          _compute_deterministic_score()  → score 0–100 + label + deductions[]
                    │
                    ▼
          synthesize_with_gemini(merged_payload)
             │  ← JSON report (investment_verdict, sections, cost_summary …)
             │  └─ fallback: _build_fallback_report() if Gemini unavailable
                    │
                    ▼
          Write to Supabase reports table (async, non-blocking on failure)
          Populate L1 cache
                    │
                    ▼
     Response: { success, payload, report, report_source, model_used }
```
