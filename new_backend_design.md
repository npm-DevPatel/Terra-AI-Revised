# Terra AI — New Backend Design

> **Positioning:** Terra is the operating system for the entire construction lifecycle.
> - **Lens** → *What is this land?*
> - **Sim** → *What should we build here?*
> - **Flow** → *How do we execute and manage it?*

---

## The Problem With The Current Backend

The current backend works but it was built as a single-endpoint analysis engine. It does one thing — `POST /api/spatial/analyze` — and tries to do everything inside that one call. The cost:

- **11+ parallel external API calls** on every single request (GEE, ISRIC, HydroSHEDS, Overpass, Google Maps, Google Solar, Open-Meteo, Nominatim, NO2, CHIRPS, Gemini)
- Cold starts on Render free tier make the first request take 30–90 seconds
- Shapefiles (HydroRIVERS, Kenya_HG) are loaded at startup and eat RAM on cold boot
- There is no concept of a user, a project, or collaboration — it's stateless and anonymous
- Gemini is called inline, synchronously, blocking the entire response

The new backend strips this back to a **clean service architecture** where:

1. Heavy geospatial computation is split into lazy, cacheable micro-tasks
2. Every user action belongs to a **Project Workspace**
3. Collaboration (chat, comments, invites, notifications) is handled by **Supabase** — not the Python server
4. The Python server only runs when it genuinely needs to: spatial analysis and AI synthesis

---

## Architecture Overview

```
Frontend (React/Vite)
        │
        ├──── Supabase (Auth, Realtime, DB, Storage, Edge Functions)
        │           ├── profiles
        │           ├── projects (workspaces)
        │           ├── project_members
        │           ├── project_invites
        │           ├── analyses          ← Terra Lens results
        │           ├── sim_plans         ← Terra Sim layouts
        │           ├── flow_reports      ← Terra Flow reports
        │           ├── monitoring_snapshots
        │           ├── channels
        │           ├── messages
        │           ├── notifications
        │           └── files (Supabase Storage)
        │
        └──── Python API (Flask — Render)
                    ├── POST /api/lens/analyze        ← spatial analysis
                    ├── POST /api/lens/ask            ← Gemini Copilot Q&A
                    ├── POST /api/sim/recommend       ← layout intelligence
                    ├── POST /api/flow/report         ← AI report generation
                    └── POST /api/flow/monitor        ← construction photo diff
```

**Key principle:** Anything that involves users, persistence, realtime, or file storage goes through **Supabase directly from the frontend**. The Python API only handles computation that genuinely requires Python: GEE, Shapely, GeoPandas, ISRIC, YOLO, and Gemini.

---

## Database Schema (Supabase / Postgres)

### Core Tables

```sql
-- Extends auth.users with app-level fields.
profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users,
  username      text UNIQUE NOT NULL,  -- e.g. @nixon — used for @mentions and invites
  display_name  text,
  avatar_url    text,
  created_at    timestamptz DEFAULT now()
)

-- A workspace. One workspace = one construction project / site.
projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  owner_id      uuid REFERENCES profiles(id),
  product       text CHECK (product IN ('lens', 'sim', 'flow', 'full')),
  created_at    timestamptz DEFAULT now(),
  archived      boolean DEFAULT false
)

-- Members of a workspace.
-- RLS: SELECT only if user_id = auth.uid() OR project has a member row for auth.uid().
project_members (
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role          text CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by    uuid REFERENCES profiles(id),
  joined_at     timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
)

-- Pending invites — by @username (existing Terra user) or email (new user).
project_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  invited_by    uuid REFERENCES profiles(id),
  email         text,    -- for non-Terra users
  username      text,    -- for existing Terra users (@handle)
  role          text DEFAULT 'editor',
  token         text UNIQUE DEFAULT gen_random_uuid()::text,
  accepted      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
)
```

### Product Tables

```sql
-- Terra Lens: saved analyses.
analyses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES profiles(id),
  lat           float NOT NULL,
  lng           float NOT NULL,
  address       text,
  raw_result    jsonb,    -- full API response from /api/lens/analyze
  score         int,      -- land feasibility score 0–100
  label         text,     -- SAFE / CAUTION / RISKY
  title         text,     -- user-assigned e.g. "Ruiru plot 3"
  pinned        boolean DEFAULT false,
  gemini_done   boolean DEFAULT false,  -- async synthesis complete?
  created_at    timestamptz DEFAULT now()
)

-- Terra Sim: site layout plans built on top of a Lens result.
sim_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  analysis_id   uuid REFERENCES analyses(id),
  created_by    uuid REFERENCES profiles(id),
  title         text,
  scenario      text CHECK (scenario IN ('maximize_parking','maximize_green','maximize_far','custom')),
  inputs        jsonb,   -- user constraints: plot_area_sqm, use_class, floors, priorities
  result        jsonb,   -- AI recommendations: footprint, parking, setbacks, green space
  version       int DEFAULT 1,
  created_at    timestamptz DEFAULT now()
)

-- Terra Flow: professional reports.
flow_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  sim_plan_id   uuid REFERENCES sim_plans(id),
  created_by    uuid REFERENCES profiles(id),
  report_type   text CHECK (report_type IN ('due_diligence','planning','progress','executive','lender')),
  audience      text CHECK (audience IN ('client','bank','government','internal')),
  title         text,
  content       jsonb,   -- structured AI-generated report sections
  pdf_url       text,    -- Supabase Storage path
  created_at    timestamptz DEFAULT now()
)

-- Terra Flow: construction progress photo snapshots.
monitoring_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES profiles(id),
  photo_url     text NOT NULL,   -- Supabase Storage
  captured_at   timestamptz DEFAULT now(),
  analysis      jsonb,           -- YOLO detection + Gemini diff narrative
  notes         text
)
```

### Collaboration Tables

```sql
-- Channels: every project gets #general, #site-updates, #reports on creation.
channels (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  name          text NOT NULL,
  created_by    uuid REFERENCES profiles(id),
  created_at    timestamptz DEFAULT now()
)

-- Messages: delivered in realtime via Supabase Realtime postgres_changes.
messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    uuid REFERENCES channels(id) ON DELETE CASCADE,
  sender_id     uuid REFERENCES profiles(id),
  body          text NOT NULL,
  attachments   jsonb,    -- [{url, name, type, size}]
  mentions      uuid[],   -- resolved user IDs from @username tokens in body
  reply_to      uuid REFERENCES messages(id),
  created_at    timestamptz DEFAULT now(),
  edited_at     timestamptz
)

-- In-app notifications. A Supabase Edge Function also fires emails on INSERT.
notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id),
  project_id    uuid REFERENCES projects(id),
  type          text,    -- 'invite' | 'mention' | 'analysis_done' | 'report_ready' | 'progress_update'
  payload       jsonb,   -- {message_id?, analysis_id?, report_id?, inviter_name?, ...}
  read          boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
)
```

---

## Python API — 4 Focused Routes

### `POST /api/lens/analyze`

The current `spatial/analyze` route, refactored and trimmed.

**APIs kept (all already in current backend):**
| Module | What it provides |
|---|---|
| `spatial/soil.py` | ISRIC SoilGrids — clay %, CEC, foundation risk |
| `spatial/shapely_engine.py` | HydroSHEDS riparian breach (30 m buffer) |
| `spatial/groundwater.py` | BGS Kenya_HG shapefile — borehole depth + KES cost |
| `spatial/overpass.py` | OSM waterways, roads, power, aviation, protected land |
| `spatial/elevation.py` | GEE: SRTM slope, JRC flood, CHIRPS rainfall, ESA WorldCover, NDVI |
| `spatial/zones.py` | KeNHA / SGR / KCAA hardcoded buffer polygons |
| `spatial/maps.py` | Google Maps reverse geocode + nearest police / hospital |
| `spatial/gemini_synth.py` | Deterministic scoring + Gemini narrative |

**Removed (4 slow calls that add noise, not signal):**
- Google Solar API — not relevant to land purchase decisions
- Open-Meteo weather — CHIRPS already covers historical rainfall
- Nominatim admin context — Maps reverse geocode duplicates this
- GEE NO₂ air pollution — edge-case, slow, rarely actionable

**New behaviour:**
- Result is saved to `analyses` table immediately with geospatial data
- Gemini synthesis runs **async** after the response returns — `gemini_done` flips to `true` when complete
- Frontend polls or subscribes to `analyses` row for the narrative update

```
Request:  { lat, lng, project_id, title? }
Response: { analysis_id, score, label, risks, costs, geospatial_data }
          → Gemini narrative streamed/appended within ~10s via Supabase Realtime
```

### `POST /api/lens/ask`

Copilot Q&A on a saved analysis. Already exists as `answer_questions_with_gemini_safe()` in `gemini_synth.py` — just needs its own route.

```
Request:  { analysis_id, question }
Response: { answer }
```

### `POST /api/sim/recommend`

Takes a Lens `analysis_id` + user planning constraints. No new external APIs — all data comes from the already-computed Lens result in Supabase.

```json
Request: {
  "analysis_id": "uuid",
  "plot_area_sqm": 450,
  "use_class": "residential_apartment",
  "floors": 4,
  "priorities": ["maximize_far", "preserve_trees"]
}
```

What it does:
1. Reads `analyses.raw_result` from Supabase
2. Extracts: slope, flood zones, riparian buffers, road setbacks, solar bearing (from GEE elevation compass), utility corridor distances
3. Builds a Gemini prompt: "Given these site constraints, generate three development scenarios"
4. Returns structured JSON: Scenario A (parking), B (green space), C (FAR)
5. Saves to `sim_plans`

### `POST /api/flow/report`

Generates a formatted, audience-calibrated report from saved workspace data.

```json
Request: {
  "sim_plan_id": "uuid",
  "report_type": "due_diligence | planning | lender | progress | executive",
  "audience": "client | bank | government | internal"
}
```

What it does:
1. Reads both `analyses.raw_result` and `sim_plans.result` from Supabase
2. Feeds into a Gemini prompt calibrated for the audience (already done for due diligence in `gemini_synth.py` — extend for planning and lender variants)
3. Returns structured JSON sections (the frontend already renders this in `Report.jsx`)
4. Saves to `flow_reports` + uploads PDF to Supabase Storage

### `POST /api/flow/monitor`

Detects construction progress between two site photos.

```json
Request: {
  "project_id": "uuid",
  "photo_base64": "...",
  "previous_snapshot_id": "uuid | null"
}
```

What it does:
1. Runs YOLO-v8 detection on the new photo (`yolov8n-seg.pt` already in backend)
2. If `previous_snapshot_id` provided: fetches previous YOLO result from `monitoring_snapshots`
3. Computes class diff (what objects appeared / disappeared / moved)
4. Asks Gemini: "Describe construction progress between these two site observations"
5. Saves snapshot to `monitoring_snapshots`

---

## Collaboration Layer (Zero Python)

Everything below runs entirely through the Supabase client in the frontend. No Python server involvement.

### Project Creation

When a user creates a project, the frontend:
1. Inserts a `projects` row
2. Inserts the creator into `project_members` as `owner`
3. Inserts three default channels: `#general`, `#site-updates`, `#reports`

### Inviting Team Members

**By @username (existing Terra user):**
```
User types @kamau → frontend resolves username to user_id
→ inserts project_invites row
→ Supabase trigger inserts notification row for @kamau
→ @kamau sees badge in notification panel
→ Clicks "Accept" → inserted into project_members
```

**By email (non-Terra user or external stakeholder like a bank):**
```
User types bank@stanchart.co.ke
→ inserts project_invites row
→ Supabase Edge Function fires → sends invite email via Resend
→ Email contains: terra.ai/join?token=xxx
→ New user signs up → accepted=true → inserted into project_members
```

### Messaging (Slack-style, per project)

Supabase Realtime delivers messages to all channel subscribers instantly — no WebSocket server needed on the Python side.

```js
// Subscribe to a channel
supabase
  .channel(`messages:${channelId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `channel_id=eq.${channelId}`
  }, handleNewMessage)
  .subscribe()
```

**@mentions:** When a message body contains `@username`, the frontend resolves it to a `user_id` and includes it in the `mentions[]` array. A Supabase database trigger inserts a `notifications` row for each mentioned user.

**Sending texts to Terra usernames or emails:** Both invitation paths above cover this. A user with a Terra account receives in-app notifications + email. A user without a Terra account receives only an email with a magic link to join.

### File Attachments

Photos, PDFs, CAD files — uploaded directly from the frontend to Supabase Storage:

```js
const { data } = await supabase.storage
  .from('project-files')
  .upload(`${projectId}/${filename}`, file)

// Then store the URL in the message
supabase.from('messages').insert({
  channel_id,
  body,
  attachments: [{ url: data.path, name: filename, type: file.type }]
})
```

### Email Notifications (One Edge Function)

One Supabase Edge Function (~60 lines of TypeScript) listens to `notifications` INSERT and fires Resend emails for:
- Project invite
- @mention in a message
- Analysis completed (`gemini_done` = true)
- Report ready for download
- Construction progress update

---

## How The Three Products Fit Together In A Workspace

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PROJECT WORKSPACE                              │
│   "Ruiru Residential — Phase 1"                                      │
│   Team: @nixon (owner)  @kamau (editor)  bank@stanchart.co.ke        │
│                                                                      │
│   Channels: #general  #site-updates  #reports                        │
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌───────────────────────────┐ │
│  │ TERRA LENS  │───▶│  TERRA SIM  │───▶│       TERRA FLOW          │ │
│  │             │    │             │    │                           │ │
│  │ Drop a pin  │    │ Takes Lens  │    │ Takes Sim plan as input   │ │
│  │ 6 datasets  │    │ result as   │    │                           │ │
│  │ Risk score  │    │ input       │    │ · Due diligence report    │ │
│  │ Gemini      │    │             │    │ · Lender report           │ │
│  │ narrative   │    │ · 3 layout  │    │ · Planning report         │ │
│  │             │    │   scenarios │    │ · Client dashboard        │ │
│  │ Saved to    │    │ · Setbacks  │    │ · Construction monitoring │ │
│  │ workspace   │    │ · Solar     │    │ · Progress photo diffs    │ │
│  │             │    │ · Parking   │    │ · Executive summaries     │ │
│  │ Copilot:    │    │ · Green     │    │                           │ │
│  │ "Summarise" │    │   space     │    │ Copilot: "Summarise this  │ │
│  │ "Any risks?"│    │ · Copilot   │    │  week's progress"         │ │
│  └─────────────┘    └─────────────┘    └───────────────────────────┘ │
│                                                                      │
│  All three products share: chat channels · file store · team list    │
│  · notification feed · @mention system · email delivery              │
└─────────────────────────────────────────────────────────────────────┘
```

**The data pipeline is strictly linear:**

```
analyses (Lens) → sim_plans (Sim) → flow_reports (Flow)
```

At no point does a user re-enter data. Each product enriches the workspace with the previous product's output.

---

## Redundancy Cut: Before vs After

| Aspect | Current | New |
|---|---|---|
| External API calls per analysis | 11 parallel | 7 (−4: Solar, Open-Meteo, Nominatim, NO₂) |
| In-memory cache | 6 TTLCaches (lost on restart) | Supabase `analyses` table (persistent forever) |
| Gemini | Inline, blocks response 15–25s | Async after response returns — 0s blocking |
| User/auth | JWT decoded per request, discarded | JWT → `analyses.created_by` persisted |
| Collaboration | None | Supabase Realtime — zero backend code |
| Email notifications | None | Supabase Edge Function + Resend |
| File storage | None | Supabase Storage |
| Websocket server | None needed | None needed (Supabase Realtime handles it) |
| Shapefile loading | At startup (cold start cost) | Lazy — loaded on first request only |
| Server startup warmup | `bootstrap.py` hits GEE at boot | Removed entirely |
| Python routes | 1 (`/api/spatial/analyze`) | 4 focused routes |
| Frontend can see past analyses | No (stateless) | Yes (persisted per workspace) |

---

## What Stays From The Current Backend (Directly Reusable)

| File | Status |
|---|---|
| `spatial/soil.py` | Keep unchanged |
| `spatial/shapely_engine.py` | Keep unchanged |
| `spatial/groundwater.py` | Keep unchanged |
| `spatial/overpass.py` | Keep unchanged |
| `spatial/zones.py` | Keep unchanged |
| `spatial/maps.py` | Keep unchanged |
| `spatial/elevation.py` | Keep — remove only the `fetch_no2_pollution()` call |
| `spatial/gemini_synth.py` | Keep synthesis + Q&A — add Sim scenario + Flow report prompts |
| `runtime_cache.py` | Keep as short-term in-process layer (TTL 6h, identical coordinates) |
| `http_client.py` | Keep unchanged |
| `yolov8n-seg.pt` | Keep — used in `/api/flow/monitor` |
| `db/supabase_client.py` | Expand with helpers for new tables |
| `bootstrap.py` | **Delete** |
| `benchmark_production.py` | **Delete** (dev tooling, not production code) |
| `verify_all.py` | **Delete** (dev tooling) |

---

## Migration Steps

1. **Schema** — Create all new Supabase tables and apply RLS policies. No Python changes yet.

2. **Lens Refactor** — Move `spatial/routes.py` → `lens/routes.py`. Remove 4 non-essential API calls. Wire response to save into `analyses`. Move Gemini to async thread.

3. **Collaboration UI** — Build workspace UI in the frontend: channel sidebar, message feed, invite modal. Pure Supabase client calls — no backend work at all.

4. **Sim Route** — New `sim/routes.py`. Read saved `analyses` row. Build Gemini layout prompt. Save to `sim_plans`.

5. **Flow Routes** — New `flow/routes.py`. Report generation from saved data. YOLO monitoring diff on photo uploads.

6. **Notifications** — Write one Supabase Edge Function that watches `notifications` INSERT and fires Resend emails.

---

## Environment Variables (Final)

```bash
# Already in use
GEMINI_API_KEY
GOOGLE_MAPS_API_KEY
GOOGLE_EARTH_ENGINE_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET

# New additions
RESEND_API_KEY      # email notifications via Supabase Edge Function
FRONTEND_URL        # CORS origin (already set on Render)
```

No new Python dependencies. The existing `requirements.txt` covers everything needed.
