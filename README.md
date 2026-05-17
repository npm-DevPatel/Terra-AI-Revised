# 🏗️ Terra AI: Enterprise Land Pre-Purchase Risk Assessment Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Backend-Flask%20%2B%20Python-38ef7d?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06b6d4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![YOLOv8](https://img.shields.io/badge/Computer%20Vision-YOLOv8--seg-FF2F2F?style=for-the-badge&logo=ultralytics)](https://ultralytics.com/)
[![Gemini](https://img.shields.io/badge/AI%20Synthesis-Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=googlegemini)](https://deepmind.google/technologies/gemini/)

Terra AI is an enterprise-grade, land pre-purchase due diligence and risk assessment platform designed specifically for the Kenyan real estate market (with a high-fidelity focus on the Nairobi Metropolitan Area). 

By fusing computer vision (**YOLOv8 Image Segmentation**) with advanced geospatial intelligence (**Shapely, OpenStreetMap, Google Maps, Google Earth Engine, Open-Meteo**), Terra AI detects physical, environmental, infrastructure, and legal risks *before* a buyer commits to a purchase. The platform evaluates riparian buffer zones, road reserves, terrain slope, soil type foundations, grid connectivity, solar potential, and administrative zoning, synthesizing a professional architectural-grade **PDF Dossier** with estimated financial premiums.

---

## 📖 Table of Contents
1. [Core Features & User Flow](#-core-features--user-flow)
2. [Technical Architecture](#-technical-architecture)
3. [System Dependencies & Tech Stack](#-system-dependencies--tech-stack)
4. [Strict Folder Structure](#-strict-folder-structure)
5. [Environment Variables Config](#%EF%B8%8F-environment-variables-config)
6. [Step-by-Step Installation & Run Guide](#-step-by-step-installation--run-guide)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Nairobi-Focused Spatial Heuristics & Rules](#%EF%B8%8F-nairobi-focused-spatial-heuristics--rules)
9. [Verification & Development Commands](#-verification--development-commands)
10. [Legal Disclaimer](#-legal-disclaimer)

---

## 🌟 Core Features & User Flow

### 1. The Landing Experience (`/`)
- A light-mode, Google Gemini-inspired layout with clean typography, heavy whitespace, and isometric visuals.
- High-converting hero section explaining the core value proposition: *“Understand land constraints and sustainable building before you buy.”*

### 2. Dual-Channel Analysis Split (`/analyze`)
- Sleek, glassmorphic column controls routing users into two distinct analysis pipelines:
  - **Option A (Vision Flow)**: Scan drone or site photography.
  - **Option B (Deep Map Flow)**: Drop a pin on a 3D satellite canvas.

### 3. Cinematic Site Scanning (Vision Pipeline)
- **Cinematic Uploader & Scanner**: `CinematicScanner.jsx` uses `framer-motion` to run a glowing green scan line across uploaded images.
- **YOLOv8 Segmentation**: Auto-detects structures, roads, vegetation, water bodies, and rocky terrains.
- **Interactive Annotations**: Elegantly rendered floating tooltips pointing to segmented elements on the canvas.
- **Upsell Gateway**: Sticky callouts prompting users to attach spatial coordinates to transition from visual analysis into full GIS zoning reports.

### 4. Full-Bleed Map Stage & 7-Task Parallel Engine (Map Pipeline)
- **Interactive satellite mapping**: Drop a pin on the precise plot boundaries.
- **Progressive Loader**: An overlay cycling through diagnostic metrics as tasks are executed in the background:
  - *“Querying Nairobi infrastructure data...”*
  - *“Calculating Riparian buffers and slope terrain...”*
  - *“Cross-referencing zoning records...”*
  - *“Synthesizing final risk report via Gemini...”*
- **7-Task Parallel GIS Fetcher**: Utilizes a Python `ThreadPoolExecutor` to query independent data APIs concurrently in **< 3 seconds**:
  1. **Overpass (OpenStreetMap)**: Computes distance to grid lines, nearest roadways, waterways, airports, cliffs, markets, and hospitals.
  2. **Google Maps Elevation API**: Fetches elevation data and computes exact terrain slope percentage.
  3. **Google Maps Places/Details**: Discovers local neighborhood context, administrative subdivisions, police stations, and medical services.
  4. **Google Earth Engine (GEE)**: Analyzes JRC surface water history, vegetation index (NDVI), and tree cover flags.
  5. **Open-Meteo API**: Queries real-time and historical soil moisture values to evaluate drainage constraints.
  6. **Nominatim (OSM Reverse Geocoding)**: Maps precise coordinates to administrative hierarchies (County, Subcounty, Ward, Place Name).
  7. **Google Maps Solar API**: Establishes maximum roof solar panels, annual sunshine hours, and carbon offset factors.

### 5. Smart 24h GIS Cache
- Restricts redundant API costs via a 24-hour backend in-memory cache. 
- Coordinates are rounded to **4 decimal places** (~11-meter precision) to cluster immediate neighboring queries.

### 6. Land-Zone Inferences & Sanitization
- Evaluates data quality scores (0 to 7 checklist) for total transparency.
- Runs location-aware data sanitization. If OSM is missing infrastructure data in a hyper-urban area, the platform auto-infers that grid lines/piped water are present, avoiding hallucinated risks.

### 7. Gemini AI Synthesis & Interactive QA Chat
- **Gemini 2.5 Flash** synthesizes raw GIS metrics into a detailed report containing:
  - An overall risk score (0-100) and risk labels (**LOW**, **MEDIUM**, **HIGH**, **CRITICAL**).
  - A definitive investment verdict.
  - Development constraints and estimated KES capital expenditure premiums.
- **Interactive Report Chatbot**: Contextual chat box (`ChatAssistant.jsx`) letting users ask natural-language questions about their land report (e.g., *"Can I build a 4-story apartment block here?"*).
- **Graceful On-Server Fallback**: Should Gemini hit API limits or quotas, a deterministic Python fallback engine builds a high-fidelity risk report based on hard-coded spatial rules.

### 8. $5,000 Architectural-Grade PDF Dossier
- Custom, client-side PDF document generation using `@react-pdf/renderer` inside `TerraReportDocument.jsx`.
- **Page 1: Executive Summary**: Features project metadata, static map visuals, risk verdicts, and the core AI synthesis.
- **Page 2: Environmental & Topography Grid**: 2-column flex layout presenting slope percentages, elevation, flood risk, and interactive SVG progress bars/meters.
- **Page 3: Legal & Infrastructure Economics**: Outlines warning flags (riparian breaches, road reserves) and KES financial estimates (grid extensions, foundation premiums, due diligence fees).

---

## ⚙️ Technical Architecture

The platform operates on a decoupled client-server architecture:

```mermaid
graph TD
    A[React 18 / Vite Frontend] -->|1. Image Upload| B[Flask Backend /api/vision/analyze]
    A -->|2. Coordinates Drop| C[Flask Backend /api/spatial/analyze]
    
    B -->|Image Processing| D[YOLOv8-seg Engine]
    D -->|Feature Segments| A
    
    C -->|ThreadPoolExecutor| E[Parallel Data Harvester]
    E -->|1. Overpass API| F[OSM Infrastructure Data]
    E -->|2. Elevation API| G[Google Terrain / Slope]
    E -->|3. Maps API| H[Neighborhood Amenities]
    E -->|4. Earth Engine| I[GEE Flood & NDVI]
    E -->|5. Open-Meteo| J[Soil Moisture]
    E -->|6. Nominatim| K[Administrative Subdivisions]
    E -->|7. Solar API| L[Google Solar Insights]
    
    F & G & H & I & J & K & L --> M[Sanitization & Zone Classification]
    M --> N{Cache Check}
    N -->|Cache Hit| O[Return Response]
    N -->|Cache Miss| P[Gemini 2.5 Flash Synthesis]
    P -->|Synthesized JSON Report| Q[24h In-Memory Cache]
    Q --> O
    O -->|Payload & AI Report| A
    
    A -->|3. Document Export| R[@react-pdf/renderer]
    R -->|Offline-Safe Helvetica PDF| S[Downloadable PDF Dossier]
    
    A -->|4. Interactive Q&A| T[Flask Backend /api/spatial/chat]
    T -->|Contextual Response| A
```

---

## 📦 System Dependencies & Tech Stack

### Frontend Dependencies (`package.json`)
- **Core Framework**: React 18, Vite (Fast HMR)
- **Routing**: `react-router-dom` (BrowserRouter v7)
- **Global State**: `zustand` (sessionStorage-backed persistent engine for tab isolation)
- **Animations**: `framer-motion` (for cinematic scanner and UI transitions)
- **Styling**: Tailwind CSS (Tailwind Merge + CLSX for class combinations)
- **Icons**: `lucide-react` (SVG-based vector assets)
- **PDF Core**: `@react-pdf/renderer` (Declarative PDF rendering)

### Backend Dependencies (`requirements.txt`)
- **API Engine**: Flask 3.1, Flask-CORS 6.0
- **Computer Vision**: Ultralytics (YOLOv8 segmentation model `yolov8n-seg.pt`), OpenCV-Python, Pillow
- **GIS Engine**: Shapely (geometric intersections), Requests (API integration)
- **AI Orchestration**: Google GenAI SDK (`google-genai`), Python-Dotenv
- **Concurrency**: Python Standard `concurrent.futures.ThreadPoolExecutor`

---

## 📂 Strict Folder Structure

```text
terra_ai_3/
├── backend/                       # Flask GIS & Vision Engine
│   ├── spatial/                   # Spatial API module
│   │   ├── routes.py              # Spatial, reverse-geocode, chat, & export endpoints
│   │   ├── shapely_engine.py      # Riparian reserve & Road setback math
│   │   ├── elevation.py           # Slope & GEE landcover fetchers
│   │   ├── maps.py                # Google Maps Geocoding & Places queries
│   │   ├── overpass.py            # OpenStreetMap API fetcher
│   │   └── gemini_synth.py        # Gemini 2.5 Flash integration & Chat prompt engineering
│   ├── vision/                    # YOLOv8 Image Segmentation module
│   │   ├── routes.py              # Photo analysis endpoints
│   │   ├── service.py             # YOLOv8 segmentation pipeline
│   │   └── image_io.py            # Base64 & byte-stream decoders
│   ├── yolov8n-seg.pt             # YOLOv8 nano segmentation weights
│   ├── app.py                     # Main server entrypoint (Port 5000)
│   └── requirements.txt           # Python dependency manifest
├── src/                           # React Frontend Application
│   ├── assets/                    # Static vectors & brand imagery
│   ├── store/
│   │   └── useTerraStore.js       # Zustand persistent global state (sessionStorage)
│   ├── components/
│   │   ├── layout/                # Sidebar.jsx, TopBar.jsx, MainLayout.jsx
│   │   ├── ui/                    # Button.jsx, Card.jsx, Tooltip.jsx, Loader.jsx
│   │   ├── vision/                # Uploader.jsx, CinematicScanner.jsx, AnnotationPins.jsx
│   │   ├── map/                   # InteractiveMap.jsx, LocationSearch.jsx
│   │   ├── results/               # RiskSummaryCard.jsx, ChatAssistant.jsx, ProgressiveLoader.jsx
│   │   └── pdf/                   # TerraReportDocument.jsx (Pages 1-3 PDF structure)
│   ├── pages/
│   │   ├── Home.jsx               # Floating isometric landing page
│   │   ├── Analyze.jsx            # Vision vs. Map split choice
│   │   ├── Pricing.jsx            # SaaS pricing tiers
│   │   └── Report.jsx             # Final visual workspace before PDF print
│   ├── utils/                     # Local helpers
│   ├── App.jsx                    # Router config & Page transitions
│   └── main.jsx                   # React DOM render hook
├── .env                           # Global environment secrets
├── .env.example                   # Shared template for local secrets
├── tailwind.config.js             # Strict design system tokens
└── start_backend.ps1              # Automation startup script for Windows PowerShell
```

---

## 🔑 Environment Variables Config

Create a `.env` file in the root of the project. The Flask backend loads variables directly from the project root.

```ini
# ==============================================================================
# Terra AI Environment Configuration
# ==============================================================================

# 1. Gemini 2.5 API Key (Used by backend/spatial/gemini_synth.py for report synthesis)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Google Maps API Keys
# Backend key (used for Elevation API, Solar API, and Geocoding APIs)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Frontend key (prefixed with VITE_ to be exposed to the browser for satellite mapping)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# 3. Google Earth Engine Key (Optional; fallback values are injected if missing)
GOOGLE_EARTH_ENGINE_API_KEY=your_gee_api_key_here

# 4. Port Configuration
PORT=5000
```

---

## 🚀 Step-by-Step Installation & Run Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.8.0 up to v3.12.0 (Required for YOLO/PyTorch modules)
- **Git**

---

### 2. Running the Flask Backend

#### Option A: Quick-Start (Windows PowerShell)
From the project root, run the pre-configured automation script. It automatically builds a virtual environment, installs dependencies, loads environmental flags, and starts the server:

```powershell
.\start_backend.ps1
```

#### Option B: Manual Setup (All Operating Systems)
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the Flask Server:
   ```bash
   python app.py
   ```
   *The backend should boot successfully on `http://localhost:5000`.*

---

### 3. Running the React Frontend

1. Navigate to the project root directory (if not already there):
   ```bash
   cd ..
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite Development Server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## ⚡ API Endpoints Reference

### 1. Visual Object Detection & Segmentation
- **Endpoint**: `POST /api/vision/analyze`
- **Request Type**: `JSON` or `Multipart Form`
- **Expected Payload**:
  ```json
  {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
  ```
- **Response**:
  ```json
  {
    "annotations": [
      {
        "class_id": 0,
        "class_name": "vegetation",
        "box": [110, 45, 320, 480],
        "confidence": 0.89,
        "polygon": [[110, 45], [115, 60], [320, 480]]
      }
    ],
    "image_width": 1024,
    "image_height": 768
  }
  ```

---

### 2. Multi-API Spatial Analysis
- **Endpoint**: `POST /api/spatial/analyze`
- **Request Type**: `JSON`
- **Expected Payload**:
  ```json
  {
    "lat": -1.286389,
    "lng": 36.817223,
    "clientContext": {
      "plannedUse": "Residential Apartment"
    },
    "visionContext": null
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "payload": {
      "coordinates": { "lat": -1.286389, "lng": 36.817223 },
      "county": "Nairobi",
      "subcounty": "Westlands",
      "ward": "Kilimani",
      "elevation_m": 1680.5,
      "slope_percent": 3.2,
      "riparian_breach": false,
      "nearest_waterway_m": 120.4,
      "road_reserve_risk": false,
      "nearest_road_m": 12.5,
      "distance_to_grid_m": 45.0,
      "aviation_risk": false,
      "solar_available": true,
      "annual_sunshine_hours": 2007.0,
      "max_panels": 18,
      "data_quality": {
        "overpass_success": true,
        "elevation_success": true,
        "gee_success": true,
        "maps_success": true,
        "solar_success": true,
        "admin_success": true,
        "weather_success": true
      }
    },
    "report": {
      "overall_risk_score": 15,
      "overall_risk_label": "LOW",
      "executive_summary": "This site in Kilimani, Nairobi exhibits excellent building feasibility. Slope angles are gentle (3.2%) requiring standard strip foundations. The plot is safely outside the statutory 30m riparian buffer zone, with immediate proximity to standard municipal infrastructure.",
      "investment_verdict": "SAFE TO PROCEED TO DUE DILIGENCE",
      "sections": [
        {
          "id": "legal",
          "title": "Legal & Regulatory Risk",
          "risk_level": "low",
          "body": "No active overlaps with public road or railway reserves detected. Confirmed outside riparian buffer boundaries."
        }
      ],
      "cost_summary": {
        "estimated_foundation_premium_kes": 0,
        "estimated_grid_connection_kes": 0,
        "title_search_cost_kes": 500,
        "recommended_survey_cost_kes": 25000,
        "total_pre_purchase_due_diligence_kes": 25500
      }
    },
    "report_source": "gemini",
    "model_used": "gemini-2.5-flash"
  }
  ```

---

### 3. Interactive Report Q&A
- **Endpoint**: `POST /api/spatial/chat`
- **Request Type**: `JSON`
- **Expected Payload**:
  ```json
  {
    "question": "What kind of foundation do I need if the soil has black cotton?",
    "payload": { ... },
    "report": { ... },
    "history": []
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "answer": "Since this site is located in a zone known for High-Density Black Cotton Clay (Kasarani/Ruiru belt), standard strip foundations will fail due to soil expansion. You are statutory required by the NCA to run a soil investigation (KES 30,000-80,000) and design a reinforced concrete raft foundation or piled system. Expect a foundation premium KES 800,000-1,500,000 above standard build costs."
  }
  ```

---

## 🏛️ Nairobi-Focused Spatial Heuristics & Rules

To ensure industry relevance and high precision, the backend embeds local Kenyan regulations and geological characteristics:

### 1. Statutory Riparian Reserves (NEMA / Water Act 2016)
- **Rule**: Minimum **30-meter** buffer distance from the high-water mark of any river, stream, or water body.
- **Action**: Any coordinates dropped within 30 meters of a waterway detected via Shapely intersecting OpenStreetMap vectors will trigger a **CRITICAL** riparian warning, as NEMA prohibits permanent building on these plots.

### 2. Road Reserve Encroachment (KeNHA / KURA / KeRRA)
- **Rule**: Minimum setback requirements from major transport networks.
- **Action**: Intersects the dropped pin coordinates with county highway easements. A proximity of less than **15 meters** from primary local trunk roads flags an immediate road reserve setback warning.

### 3. Foundation Economics (NCA Heuristics)
The engine automatically classifies foundations and CapEx premiums based on slope percentage from the Google Elevation API:

| Slope Percentage | Classification | Structural Foundation Requirement | Est. Foundation Premium (KES) |
| :--- | :--- | :--- | :--- |
| **< 5%** | Flat | Standard Strip / Pad foundation | KES 0 |
| **5% - 12%** | Gentle | Minor leveling & stepped foundations | KES 200,000 - 500,000 |
| **12% - 20%** | Moderate | Retaining walls, mandatory soil test | KES 800,000 - 1,500,000 |
| **> 20%** | Steep | Reinforced Raft or Piled foundation | KES 1,500,000 - 3,000,000+ |

### 4. Local Geotechnical Classifications
The engine parses geocoded sub-county and ward labels to inject known regional geological issues:
- **Kasarani, Ruiru, Juja, Thika Road**: Flags high-density **Black Cotton Soil** (vertisols) which have strong shrink-swell behaviors. Sets the foundation premium warning to KES 800k-1.5M.
- **Karen, Lang'ata, Lavington, Ngong**: Identifies stable **Red Laterite (Murram)**, signaling moderate-to-good load-bearing capacities and standard structural foundation bills.
- **Athi River, Syokimau, Kitengela**: Injects warning about **Alluvial Deposits** and variable load capacities with a high risk of differential settlement, mandating local soil testing.

---

## 🛠️ Verification & Development Commands

### Running ESLint Checks
Validate code styling, hook setups, and syntax requirements:
```bash
npm run lint
```

### Building for Production
Pre-compile and bundle the React application into optimal, lightweight static assets in the `/dist` directory:
```bash
npm run build
```

---

## ⚠️ Legal Disclaimer

> [!WARNING]
> **Terra AI** is a decision-support platform designed to assist land buyers with preliminary digital due diligence. The reports, zoning analysis, slope percentages, riparian borders, and financial evaluations synthesized by our AI engine and GIS sources represent heuristic estimations.
> 
> This software **does not** replace an official physical site survey conducted by a licensed surveyor under the **Ministry of Lands and Physical Planning**, nor does it substitute statutory geotechnical testing or official **NEMA (National Environment Management Authority)** environmental impact assessments. Always verify beacons, titles, and county zoning rules on the ground before completing real estate purchases.
