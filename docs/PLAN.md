# 24-Hour Tactical Implementation Plan: Sentinel Command Deck

> **Platform:** Next-Generation Crime Intelligence & Tactical Operations System  
> **Execution Strategy:** Staged Phase / Task / Sub-Task Model  
> **Timeline:** 24-Hour Hackathon with an **Aggressive 6-Hour Demoable Checkpoint**  
> **Architecture Principle:** Strict Separation of Concerns & Anti-Contention Contract Lock

---

## 1. Executive Summary & Strategy

In a 24-hour hackathon, projects typically fail at two junctures:
1. **Hour 6 Panic**: Too much time spent configuring databases, auth, or boilerplate without anything tangible to put on screen.
2. **Hour 16 Merge Hell**: Frontend and backend teams diverge in data shapes, resulting in broken integrations, endless debugging, and non-functional demos.

### The Sentinel Counter-Strategy: The "Zero-Contention" Pipeline

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 0 (Hour 0 - 1): CONTRACT & FIXTURE LOCK                                          │
│ • packages/shared/types (Canonical TypeScript Schemas)                                 │
│ • packages/shared/fixtures/bengaluru_crime_dataset.json (60+ Cases with GPS & Links)   │
└───────────────────────────────────┬────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ FRONTEND PARALLEL TRACK              │  │ BACKEND PARALLEL TRACK               │
│ (Hours 1 - 13)                       │  │ (Hours 1 - 13)                       │
│ • In-Memory Mock API Provider        │  │ • PostgreSQL + PostGIS + pgvector    │
│ • Leaflet Map + ReactFlow + TanStack │  │ • Drizzle ORM + Fastify/Express REST │
│ • Ambient Copilot UI Shell           │  │ • Groq Cloud Llama-3.3-70B Pipeline  │
│ • ZERO dependency on running backend │  │ • ZERO dependency on frontend state  │
└──────────────────┬───────────────────┘  └──────────────────┬───────────────────┘
                   │                                         │
                   │ ★ HOUR 6: DEMOABLE CHECKPOINT           │
                   │   Frontend fully presents mock data;    │
                   │   Backend validates REST responses.     │
                   │                                         │
                   └────────────────────┬────────────────────┘
                                        │
┌───────────────────────────────────────▼────────────────────────────────────────────────┐
│ PHASE 3 (Hour 13 - 16): ZERO-FRICTION INTEGRATION                                      │
│ • Flip `VITE_API_SOURCE=live` (Proxy to Node API)                                      │
│ • Verify PostGIS live queries & real-time Groq LLM SSE stream                          │
│ • Instant Fallback switch: `VITE_OFFLINE_MODE=true` (Zero-Risk Stage Resilience)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 24-Hour Master Implementation Gantt Chart

```mermaid
gantt
    title Sentinel Command Deck - 24-Hour Execution Schedule
    dateFormat X
    axisFormat %s

    section Phase 0: Contract Lock
    Repo Setup & Shared Contracts          :0, 1

    section Phase 1: Sprint to Checkpoint
    FE: Command Deck Shell & 3 Lenses      :1, 6
    BE: PostGIS Setup, Drizzle & REST API  :1, 6
    ★ 6-HOUR CHECKPOINT: All Core Demoable :milestone, 6, 6

    section Phase 2: Deep Engines
    FE: Spatial Lasso, Graph Clust, Voice  :6, 13
    BE: PostGIS ST_DWithin, Hybrid RAG     :6, 13

    section Phase 3: Integration
    Wire FE to Live API & Streaming Hookup :13, 16

    section Phase 4: Polish & Secondary
    Dark SOC Aesthetics, ECharts & Audio   :16, 20

    section Phase 5: Hardening & Rehearsal
    Offline Fail-Safe, Deploy & Pitch Run  :20, 24
    ★ 24-HOUR FINAL PRESENTATION           :milestone, 24, 24
```

---

## 3. Phase-by-Phase Task & Sub-Task Blueprint

---

### Phase 0: Foundation, Architecture & Contract Lock (Hours 0.0 – 1.0)
*Priority: Critical | Team: Joint Cross-Cutting*  
*Goal: Formulate single source of truth. Prevent schema divergence before writing logic.*

#### Task 0.1: Monorepo Scaffolding & Directory Isolation
- [x] **Sub-task 0.1.1**: Initialize monorepo workspace structure:
  ```
  kestrel/
  ├── frontend/             # React 18 + Vite + Tailwind + TypeScript
  ├── backend/              # Node.js 20+ + Express + Drizzle ORM
  ├── packages/
  │   └── shared/           # Shared types, constants, schemas, and test fixtures
  ├── docs/                 # Architecture, Design, and Plan docs
  └── package.json          # Root workspace scripts
  ```
- [x] **Sub-task 0.1.2**: Configure root scripts: `npm run dev` (concurrent FE+BE), `npm run dev:frontend`, `npm run dev:backend`.
- [x] **Sub-task 0.1.3**: Configure TypeScript path aliases (`@shared/*` and `@kestrel/shared`) in both frontend and backend `tsconfig.json`.

#### Task 0.2: Shared Type Contracts & Schema Specification
- [x] **Sub-task 0.2.1**: Define master entity interfaces in `packages/shared/src/types/entities.ts`:
  - `FIRCase`: ID, FIR number, category, severity, status, incident date, police station, district, lat, long, description, statutory acts.
  - `AccusedSuspect`: ID, full name, aliases, repeat offender flag, risk score, gang affiliation, contact markers.
  - `CaseEvidence`: ID, case ID, evidence type (CCTV, weapon, digital), description, chain of custody.
- [x] **Sub-task 0.2.2**: Define spatial & graph topology models in `packages/shared/src/types/spatial.ts` and `network.ts`:
  - GeoJSON Feature Collections, Bounding Box tuple `[[south, west], [north, east]]`.
  - Graph Nodes (`SuspectNode`, `FirNode`, `LocationNode`) and Graph Edges (`CO_ACCUSED_WITH`, `OPERATES_IN`).
- [x] **Sub-task 0.2.3**: Define REST API contracts and Copilot envelopes in `packages/shared/src/types/api.ts`:
  - `ApiResponse<T>`, `CaseFilterParams`, `CopilotPromptEnvelope`, `CopilotResponseChunk`.

#### Task 0.3: Large-Scale Seed Data Strategy (The Dual-Tier Intelligence Model)
*A shallow 20-case dataset makes heatmaps look empty, graph topology look trivial, and analytics look fake. To wow judges, we employ a **Dual-Tier Synthetic Intelligence Engine**:*

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      DUAL-TIER SYNTHETIC INTELLIGENCE MODEL                            │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ TIER 1: GOLDEN PATH CURATED ROSTER        │ TIER 2: HIGH-DENSITY PARAMETRIC BULK       │
│ (75 Narrative Master Cases)               │ (1,500 – 2,500+ Synthesized Incidents)     │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Handcrafted for the live pitch walkthrough│ • Realistic density for Leaflet Heatmaps &   │
│ • Deterministic FIR numbers (e.g. #102/24)│   PostGIS spatial cluster calculations     │
│ • Multi-station syndicates ("Whitefield   │ • Covers 15+ Bengaluru police stations with│
│   Cyber Ring", "East Ring Syndicate")     │   realistic Gaussian coordinate jitter     │
│ • Rich evidence logs (CCTV, ballistics)   │ • 90-day temporal series with diurnal spikes│
│ • Bilingual Kannada & English narratives  │ • 400+ accused, repeat offender recidivism │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

- [x] **Sub-task 0.3.1**: Create `packages/shared/src/fixtures/bengaluru_crime_curated.json` (Tier 1):
  - 75 deep-dive cases linking suspects (e.g., Raju alias Snake, Kiran, Deepa) across Indiranagar, Koramangala, and K.R. Puram.
  - Realistic evidence records, shared vehicle plates (`KA-04-E-1234`), and bilingual witness statements.
- [x] **Sub-task 0.3.2**: Build Deterministic Bulk Generator `packages/shared/src/scripts/generate-large-dataset.ts` (Tier 2):
  - Ingests real police station polygon centroids across Bengaluru (Indiranagar, Koramangala, Whitefield, Peenya, Shivajinagar, Jayanagar, Cubbon Park, Yelahanka, Electronic City, etc.).
  - Generates 1,500–2,500 realistic FIR incidents with realistic severity distributions (15% Critical, 35% High, 35% Medium, 15% Low).
  - Models temporal patterns (nighttime burglary surges 01:00–04:00, daytime cyber fraud 10:00–17:00, weekend assault clusters).
  - Generates 400+ suspects, repeat offender linkages (30% recidivism rate), and 3,500+ co-accused graph edges.
  - Deterministic PRNG seed ensuring 100% reproducible data across frontend mock and backend DB.
- [x] **Sub-task 0.3.3**: Pre-compile static outputs:
  - `bengaluru_crime_dataset_large.json` (for frontend mock client and offline demo).
  - `bengaluru_crime_dataset_large.sql` / CSV dumps (for ultra-fast PostgreSQL `COPY` batch seeding in backend).

#### Task 0.4: Frontend Mock Service Layer Setup (Dual-Scale Support)
- [x] **Sub-task 0.4.1**: Implement `frontend/src/services/api/mockClient.ts` with toggle for `curated` vs `large` dataset.
- [x] **Sub-task 0.4.2**: Implement in-memory spatial filtering (Turf.js bounding box), multi-column search, and graph relation expansion.

---

### Phase 1: Sprint to 6-Hour Checkpoint — The Demoable Foundation (Hours 1.0 – 6.0)
*Priority: Blocker for Checkpoint Evaluation | Team: Split Independent Tracks*  
*Goal: By Hour 6, demonstrate a fully working, visually stunning Command Deck on the frontend, while the backend verifies live PostGIS & LLM pipelines.*

#### 🎨 Track A: Frontend Team (Mock-Powered Vertical Slice)

##### Task 1.1F: Tactical Command Deck UI Shell & Context Bus
- [x] **Sub-task 1.1F.1**: Implement Tailwind CSS "Tactical Midnight" theme configuration (deep slate foundations, electric cyan `#06b6d4`, tactical crimson `#ef4444`, amber warning `#f59e0b`, plus 22-style Theme Studio engine).
- [x] **Sub-task 1.1F.2**: Build Top HUD bar with Bangalore jurisdiction badge, Global Search bar (`Cmd+K` trigger), and Active Mission indicator.
- [x] **Sub-task 1.1F.3**: Implement Zustand `useInvestigationContext` store managing:
  - Lens mode (`geo` | `network` | `dossier`)
  - Active filters (district, category, date range, severity)
  - Active focused entities (`activeCaseId`, `activeSuspectId`)
  - Temporal playhead time

##### Task 1.2F: Lens 1 — Spatial Crime GIS Map
- [x] **Sub-task 1.2F.1**: Mount spatial crime GIS map with dark CartoDB theme & interactive radar projection (`GisPage.tsx` and Bento `GeoIntelPanel.tsx`).
- [x] **Sub-task 1.2F.2**: Render interactive radar marker pins color-coded by category and pulsing for critical severity.
- [x] **Sub-task 1.2F.3**: Wire pin click event to inspect case details and update active selection on the shared context bus.
- [x] **Sub-task 1.2F.4**: Implement dynamic layer toggle between Incident points and Kernel Density heatmap mode.

##### Task 1.3F: Lens 2 — Criminal Network Graph View
- [x] **Sub-task 1.3F.1**: Mount interactive dark tactical network canvas (`NetworkPage.tsx` and Bento `EntityNetworkPreview.tsx`).
- [x] **Sub-task 1.3F.2**: Create custom node visualizers with suspect avatar cards, risk score badges, and repeat offender indicators.
- [x] **Sub-task 1.3F.3**: Render connected edges showing co-accused links and syndicate connections with zoom/pan controls.
- [x] **Sub-task 1.3F.4**: Handle node clicks to focus and inspect suspect dossier cards and linked FIRs.

##### Task 1.4F: Lens 3 — FIR Case Explorer & Dossier Virtual Grid
- [x] **Sub-task 1.4F.1**: Build FIR records grid showing FIR #, Category, Station, Date, Accused, and Status (`CasesPage.tsx` and `RecentRecordsTable.tsx`).
- [x] **Sub-task 1.4F.2**: Implement quick column filters, severity tags, date ranges, and sorting.
- [x] **Sub-task 1.4F.3**: Build sliding Dossier Drawer and Modal dialog showing full FIR narrative, statutory sections, and evidence records.

##### Task 1.5F: Ambient Copilot UI Sidecar & Temporal Scrubber Shell
- [x] **Sub-task 1.5F.1**: Build Ambient Copilot conversation workspace (`CopilotPage.tsx` and `AskKestrelPanel.tsx`) with grounded citations and prompt recommendations.
- [x] **Sub-task 1.5F.2**: Build temporal incident filtering and scrubber controls managed by `useInvestigationContext.ts`.

##### Task 1.6F: Seamless Lens Morphing Controller
- [x] **Sub-task 1.6F.1**: Implement global lens navigation across Geographic GIS, Network Graph, Case Explorer, and Analytics.
- [x] **Sub-task 1.6F.2**: Ensure selecting an incident or suspect in Lens 1 persists focus when switching to Lens 2 or Lens 3 via Zustand store.

---

#### ⚙️ Track B: Backend Team (Database, PostGIS & LLM API)

##### Task 1.1B: Database Setup & Drizzle ORM Schema
- [x] **Sub-task 1.1B.1**: Provision PostgreSQL 15+ with `postgis`, `vector`, `uuid-ossp`, and `pg_trgm` extensions enabled.
- [x] **Sub-task 1.1B.2**: Define Drizzle ORM schema matching `ARCHITECTURE.md`:
  - `officers`, `cases_fir`, `entities_accused`, `case_accused_junction`, `case_evidence`, `ai_threads`.
- [x] **Sub-task 1.1B.3**: Run migrations and verify table structures and GIST/GIN indexes.

##### Task 1.2B: Database Seeding Engine
- [x] **Sub-task 1.2B.1**: Write `backend/src/db/seed.ts` script to ingest `bengaluru_crime_dataset_large.json` and curated records.
- [x] **Sub-task 1.2B.2**: Populate PostGIS `location_geom` column using `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)`.
- [x] **Sub-task 1.2B.3**: Validate record counts and relational integrity between cases and co-accused (1,507 FIRs, 360 suspects, 2,656 junctions, 8 evidence records).

##### Task 1.3B: Core REST API Gateway (Express / Fastify)
- [x] **Sub-task 1.3B.1**: Build `GET /api/cases`: Paginated FIR listing with search filter (district, status, pg_trgm full-text query).
- [x] **Sub-task 1.3B.2**: Build `GET /api/cases/:id`: Detailed case profile with accused roster and evidence items.
- [x] **Sub-task 1.3B.3**: Build `GET /api/accused/:id` & `GET /api/network/topology`: Returns dynamic node and edge graph payload with co-accused edge weights directly from PostgreSQL.
- [x] **Sub-task 1.3B.4**: Build `GET /api/spatial/incidents`: Spatial bounding box endpoint via PostGIS `ST_MakeEnvelope` and `ST_Contains`.

##### Task 1.4B: Groq Cloud LLM Service Spike
- [x] **Sub-task 1.4B.1**: Initialize Groq SDK with dynamic multi-model failover pool (`qwen/qwen3.8-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`), Whisper audio transcription, and grounded offline simulation.
- [x] **Sub-task 1.4B.2**: Build prototype streaming endpoint `POST /api/copilot/query` returning Server-Sent Events (SSE) with grounded FIR citations, suggested actions, and bilingual Kannada/English context.

---

#### 🏆 Checkpoint Evaluation (Hour 6.0 Gate)
| Verification Item | Expected Result | Status |
| :--- | :--- | :--- |
| **Command Deck UI** | Fluid dark SOC theme with zero layout breaks | **PASSED** (Bento Dashboard, 22-Style Theme Studio & Shell) |
| **Lens 1 (Map)** | CartoDB dark tiles load, Bangalore pins render & open popups | **PASSED** (`GisPage.tsx` + `GeoIntelPanel.tsx`) |
| **Lens 2 (Network)** | ReactFlow renders criminal nodes & co-accused links | **PASSED** (`NetworkPage.tsx` + `EntityNetworkPreview.tsx`) |
| **Lens 3 (Dossier)** | TanStack table browsable, drawer opens details | **PASSED** (`CasesPage.tsx` + `RecentRecordsTable.tsx` modal dossier) |
| **Unified Bus** | Selecting Suspect A on Map keeps them focused when switching to Network | **PASSED** (`useInvestigationContext.ts` active) |
| **Backend API** | `GET /api/cases` and `GET /api/spatial/incidents` return valid JSON matching contract | **PASSED** (100% verified via live curl against PostGIS) |

---

### Phase 2: Deep Feature Implementation & Intelligence Engines (Hours 6.0 – 13.0)
*Priority: High | Team: Split Independent Tracks*  
*Goal: Turn the functional UI into an elite intelligence operating system.*

#### 🎨 Track A: Frontend Team

##### Task 2.1F: Spatial Bounding Box & Turf.js Lasso Engine
- [ ] **Sub-task 2.1F.1**: Implement interactive polygon drawing tool (Lasso / Rectangle) on Leaflet map.
- [ ] **Sub-task 2.1F.2**: Integrate Turf.js `booleanPointInPolygon` to dynamically filter incidents inside drawn boundary.
- [ ] **Sub-task 2.1F.3**: Compute and display on-the-fly tactical metrics: incident count, peak crime hours, and dominant category.

##### Task 2.2F: Relational Graph D3-Force Physics & Syndicate Clustering
- [ ] **Sub-task 2.2F.1**: Implement D3-force layout calculation to automatically cluster tightly-linked syndicates.
- [ ] **Sub-task 2.2F.2**: Add syndicate threat level filters and dynamic node search/highlighting.
- [ ] **Sub-task 2.2F.3**: Implement "Explain Syndicate" button triggering Copilot profile summary.

##### Task 2.3F: Bilingual Kannada & English Voice Copilot UI
- [ ] **Sub-task 2.3F.1**: Integrate browser Web Speech API Speech-to-Text (STT) supporting Kannada (`kn-IN`) and English (`en-IN`).
- [ ] **Sub-task 2.3F.2**: Implement Push-to-Talk HUD button (hold `Space` to speak) with audio waveform pulse.
- [ ] **Sub-task 2.3F.3**: Integrate Text-to-Speech (TTS) synthesizer to read out Copilot intelligence summaries.

##### Task 2.4F: Active Briefing Caseboard & "Pin-to-Dossier"
- [ ] **Sub-task 2.4F.1**: Add quick `Pin (📌)` button to FIR cards, suspect profiles, map snapshots, and AI flashes.
- [ ] **Sub-task 2.4F.2**: Build collapsible Caseboard scratchpad docked at bottom/side with reorderable pinned cards.

##### Task 2.5F: Client-Side Classified PDF Dossier Generator
- [x] **Sub-task 2.5F.1**: Build client-side intelligence report and SITREP generator (`ReportsPage.tsx`) with instant export and printable briefing layout.
- [x] **Sub-task 2.5F.2**: Style official police dossier layout: Confidential classification markers, station metadata, crime logs, and evidence custody notes.

---

#### ⚙️ Track B: Backend Team

##### Task 2.1B: PostGIS Advanced Spatial Pipeline
- [x] **Sub-task 2.1B.1**: Implement `ST_DWithin` radius search endpoint (`GET /api/spatial/radius?lat=...&lng=...&radiusMeters=...`).
- [x] **Sub-task 2.1B.2**: Implement `ST_ConcaveHull` territorial polygon generation to compute gang operating zones (`GET /api/spatial/territories`).
- [x] **Sub-task 2.1B.3**: Implement spatio-temporal incident density aggregation (`GET /api/spatial/density`).

##### Task 2.2B: Graph Relational Topology Engine
- [x] **Sub-task 2.2B.1**: Build dynamic graph traversal queries uncovering accomplice linkages (`GET /api/network/topology` & `GET /api/network/accused/:id`).
- [x] **Sub-task 2.2B.2**: Calculate suspect centrality (degree/PageRank), network roles (Kingpin/Broker/Enforcer/Associate), and dynamic recidivism risk scores (`GET /api/network/centrality` & `GET /api/network/accused/:id/metrics`).

##### Task 2.3B: Hybrid RAG Pipeline (Deterministic SQL + Semantic Search)
- [x] **Sub-task 2.3B.1**: Build Intent Classifier parsing officer queries into structured SQL filters vs narrative searches (`POST /api/copilot/intent`).
- [x] **Sub-task 2.3B.2**: Implement pgvector cosine similarity search on modus operandi and witness statements (`POST /api/copilot/semantic-search` & `POST /api/copilot/query`).
- [x] **Sub-task 2.3B.3**: Construct zero-hallucination prompt template enforcing citation of actual FIR numbers from database context.
- [x] **Sub-task 2.3B.4**: Implement Kannada prompt translation and system persona for regional language output.

##### Task 2.4B: Proactive Threat Flash & Anomaly Engine
- [x] **Sub-task 2.4B.1**: Build analytical query detecting sudden crime volume surges (>40% increase in 7 days in any station) (`GET /api/analytics/surges`).
- [x] **Sub-task 2.4B.2**: Provide endpoint serving real-time tactical warnings and clearance statistics (`GET /api/analytics/summary`).

---

### Phase 3: Integration & Zero-Contention Marriage (Hours 13.0 – 16.0)
*Priority: Critical | Team: Joint Cross-Cutting*  
*Goal: Seamlessly connect frontend to live backend without merge conflicts or code rewrites.*

- [x] **Task 3.1: Switch Frontend API Client to Live Mode**
  - [x] Sub-task 3.1.1: Set `VITE_API_SOURCE=live` and configure Vite dev server proxy to `http://localhost:3000`.
  - [x] Sub-task 3.1.2: Validate all API response envelopes against `@shared/types`.
- [x] **Task 3.2: Wire Ambient Copilot to Streaming Backend**
  - [x] Sub-task 3.2.1: Connect EventSource / fetch stream reader in frontend to Groq SSE endpoint.
  - [x] Sub-task 3.2.2: Transmit active UI state envelope (focused suspect, map bounds, date range) in prompt payload.
- [x] **Task 3.3: PostGIS Viewport Sync**
  - [x] Sub-task 3.3.1: Debounce Leaflet map movement events to query live PostGIS bounding box incidents.
- [ ] **Task 3.4: Offline Fallback Fail-Safe Verification**
  - [ ] Sub-task 3.4.1: Add global UI toggle `Offline Mode [ON/OFF]`.
  - [ ] Sub-task 3.4.2: Ensure frontend gracefully falls back to local in-memory fixtures if the backend is unreachable.

---

### Phase 4: Tactical Polish, Secondary Features & Visual WOW (Hours 16.0 – 20.0)
*Priority: High | Team: UI/UX & Backend Polish*  
*Goal: Turn the platform into an unforgettable, high-contrast command deck that wows judges.*

- [ ] **Task 4.1: Framer Motion Morphing Transitions**
  - [ ] Sub-task 4.1.1: Animate smooth layout transitions when switching between Map and Network views.
  - [ ] Sub-task 4.1.2: Add pulsing threat rings and glowing border effects to critical risk nodes.
- [x] **Task 4.2: Tactical Analytics & Anomaly Cards (Apache ECharts / Recharts)**
  - [x] Sub-task 4.2.1: Render incident velocity and temporal breakdown charts (`AnalyticsPage.tsx` and `CrimeTrendChart.tsx`).
  - [x] Sub-task 4.2.2: Add station workload distribution and clearance rate cards.
- [ ] **Task 4.3: Temporal Time-Travel Playback Animation**
  - [ ] Sub-task 4.3.1: Implement automated playhead progression (1x, 2x, 5x speed) sequentially animating incidents on the map.
- [ ] **Task 4.4: Keyboard Shortcuts & Tactical Audio HUD**
  - [ ] Sub-task 4.4.1: Bind global hotkeys (`1` Geo, `2` Network, `3` Dossier, `L` Lasso, `Cmd+K` Search).
  - [ ] Sub-task 4.4.2: Add subtle tactical SFX for radar pings, filter clicks, and voice activation.

---

### Phase 5: Hardening, Cloud Deployment & Presentation Prep (Hours 20.0 – 24.0)
*Priority: Critical | Team: Joint Cross-Cutting*  
*Goal: Flawless live execution. Zero venue Wi-Fi vulnerability.*

- [ ] **Task 5.1: Zero-Failure Offline Demo Verification**
  - [ ] Sub-task 5.1.1: Disconnect Wi-Fi completely on the demo laptop; execute the complete pitch flow.
  - [ ] Sub-task 5.1.2: Verify zero blank screens, zero uncaught promise rejections, zero console crashes.
- [ ] **Task 5.2: Production Cloud Deployment**
  - [ ] Sub-task 5.2.1: Deploy Frontend to Vercel with production environment variables.
  - [ ] Sub-task 5.2.2: Deploy Backend to Render / Railway / Supabase Edge.
- [ ] **Task 5.3: 3-Minute Demo Choreography ("The Golden Path")**
  - [ ] Sub-task 5.3.1: **0:00 - 0:45**: Problem hook (siloed police software) → Reveal Sentinel Command Deck.
  - [ ] Sub-task 5.3.2: **0:45 - 1:30**: Draw spatial lasso in Indiranagar → Filter burglary spike → Morph to Network view.
  - [ ] Sub-task 5.3.3: **1:30 - 2:15**: Reveal syndicate kingpin → Trigger Ambient Copilot query in Kannada via Push-to-Talk.
  - [ ] Sub-task 5.3.4: **2:15 - 3:00**: Pin evidence to caseboard → Export instant Classified PDF dossier → Closing punchline.
- [ ] **Task 5.4: Backup Screen Recording & Slide Deck**
  - [ ] Sub-task 5.4.1: Record a clean 4K 60fps walkthrough of the entire golden path in case of podium hardware failure.
  - [ ] Sub-task 5.4.2: Finalize 5-slide pitch deck highlighting architecture, PostGIS/Groq tech stack, and field impact.
- [ ] **Task 5.5: Final Code Freeze (Hour 23.0)**
  - [ ] Sub-task 5.5.1: No new feature commits. Only demo rehearsal and presentation polish.

---

## 4. Anti-Contention Rules for Team Execution

To ensure zero friction between team members during the 24 hours:

1. **No Shared File Edits Before Integration**:
   - Frontend developers work exclusively within `frontend/`.
   - Backend developers work exclusively within `backend/`.
   - `packages/shared/` is locked after Hour 1.0. Any schema change requires a 2-minute verbal sync between FE and BE leads.
2. **Never Wait for an API Endpoint**:
   - If a backend endpoint is delayed, the frontend developer immediately adds a mock handler in `frontend/src/services/api/mockClient.ts` using the agreed contract types and continues building the UI.
3. **Branching Strategy**:
   - `main`: Always demoable and buildable.
   - `feat/frontend-deck`: Frontend feature branch.
   - `feat/backend-services`: Backend feature branch.
   - Merge to `main` happens at Hour 6 (Checkpoint) and Hour 14 (Integration).

---

## 5. Success Metrics & Judge Wow Factors

1. **Visual Command Center Immersion**: High-contrast military SOC aesthetic with glassmorphic cards, pulsing radar markers, and dark matter tiles.
2. **True Cross-Reactive Triad**: Not 3 separate tabs, but 1 unified context where map pins morph into network nodes with persistent suspect focus.
3. **Bilingual Ambient Voice**: Native Kannada voice input and synthesized audio output that feels purpose-built for Karnataka police officers.
4. **Zero-Latency RAG**: Ultra-fast Groq streaming with grounded FIR citations—no generic LLM waffle.
5. **Instant Classified PDF**: Court-admissible intelligence briefs generated client-side in under 2 seconds.
