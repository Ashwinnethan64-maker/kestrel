# KESTREL // NEW FRONTEND MASTER IMPLEMENTATION PLAN
## Next-Generation Officer Command Deck & Intelligence Operating System

> **Platform:** Kestrel — Police Intelligence & Tactical Command System  
> **Target UX:** Unified, Zero-Friction Officer War Room (Field IO Docket + 360° Case Nexus + High-Level Zonal Command Deck)  
> **Philosophy:** High-contrast tactical military SOC aesthetics, zero disjointed page navigation, optimized for a killer live demo.  
> **Execution Model:** Phased Task & Sub-Task Blueprint with strict contracts, verification gates, and interactive checkboxes.

---

## 1. Executive Summary & Design Pivot

The prior frontend implementation suffered from **context fragmentation** by dividing functionality into separate traditional pages (`/cases`, `/network`, `/gis`, `/copilot`, `/analytics`).

The new frontend rebuild unifies the platform into a **Single-Surface Tactical Command Deck** built around the actual mental model of police operations:
1. **Investigating Officer (IO) Altitude**:
   * **The Morning Docket**: Assigned FIRs, urgent investigative tasks, and station alerts.
   * **The 360° Case Nexus**: Selecting any case instantly opens a rich, integrated workspace with:
     * **Evidentiary Dossier**: Statutory sections, victim statement, physical evidence items.
     * **Scene GIS Lens**: Leaflet map centered on the crime scene with a 500m surveillance radius, CCTV cameras, and suspect residences.
     * **Syndicate Relational Lens**: React Flow network graph showing the suspect's immediate co-accused ego-network.
     * **Ambient AI Copilot**: Persistent sidecar pre-loaded with the case context, drafting Kannada/English bail opposition briefs and spotting witness contradictions.
2. **High-Level Command (DCP / Commissioner) Altitude**:
   * **Zonal Crime Radar**: City-wide PostGIS heatmap and incident density fields.
   * **Inter-Station Syndicate Topology**: Cross-jurisdiction gang networks spanning multiple police stations.
   * **Station Workload & Clearance Matrix**: Real-time station accountability and overdue charge-sheet warnings.
3. **Zero Jitter, Zero Full-Page Reloads**:
   * Mode transitions and altitude changes happen on one continuous canvas via animated state morphing.

---

## 2. Command Deck UI Anatomy

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [🛡️ KESTREL CIOS]  [Role: 👮 Insp. Patil (IO) ▾]  [Station: Indiranagar PS]  [Cmd+K Search]  [Mode: LIVE ●]  │
├─────────────────────────────────────────────────────────────────────────────────────────────┬──────────────────────────┤
│                                                                                             │                          │
│                                  THE TACTICAL LENS                                          │     AMBIENT COPILOT      │
│                                (Continuous Morphing Canvas)                                 │     (Live AI Stream)     │
│                                                                                             │                          │
│  [MODE: 📋 OFFICER DOCKET | 🔍 360° CASE NEXUS | 🌐 ZONAL STRATEGIC RADAR]                  │  • Proactive MO Flashes  │
│                                                                                             │  • Witness Analysis      │
│  WHEN CASE NEXUS ACTIVE:                                                                    │  • Bilingual (KN / EN)   │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │  • One-Click Bail Pet.   │
│  │ SUB-LENS: [ 📄 DOSSIER & EVIDENCE ]  [ 🗺️ CRIME SCENE GIS ]  [ 🕸️ SYNDICATE GRAPH ]  │  │                          │
│  ├───────────────────────────────────────────────────────────────────────────────────────┤  │  ┌────────────────────┐  │
│  │                                                                                       │  │  │ Query or Command... │  │
│  │  • Active FIR: #102/24 (Armed Robbery - 12th Main Indiranagar)                        │  │  └────────────────────┘  │
│  │  • Primary Accused: Raju alias Snake (4 Priors, Bailed)                               │  ├──────────────────────────┤
│  │  • Action Checklist: [x] Seizure memo  [ ] Ballistics FSL  [ ] Interrogate Accomplice │  │ 📌 ACTIVE CASEBOARD   │
│  │  • Integrated Scene Map / Network visualizers embedded seamlessly                     │  │ (3 Pinned Clues)      │
│  │                                                                                       │  │ [Export PDF Briefing] │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┴──────────────────────────┤
│ BOTTOM RAIL: Temporal Incident Scrubber [ ⏪ ◀ PLAY ▶ ⏩ ]  ──●────────────────────────────── [ 1x / 2x / 5x Speed ]   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Master Phase, Task & Sub-Task Blueprint (With Tracking Checkboxes)

---

### Phase 0: Backend Micro-Adjustments, Tasks Schema & Shared Contracts
*Priority: Blocker for State & Services | Team: Cross-Cutting*  
*Goal: Provide typed officer and task endpoints while preserving 100% of the existing PostGIS and LLM routes.*

- [x] **Task 0.1: Database Schema Expansion for Investigative Tasks**
  - [x] **Sub-task 0.1.1**: Define `investigative_tasks` table in `backend/src/db/schema.ts` (with `id`, `caseId`, `assignedOfficerId`, `title`, `taskType`, `priority`, `status`, `dueDate`, `completedAt`, `notes`, `createdAt`).
  - [x] **Sub-task 0.1.2**: Update `backend/src/db/seed.ts` with seeded tasks (15 realistic tasks across curated cases including FIR #102/24 CCTV recovery, ballistics FSL, and 180 BNSS statement).
  - [x] **Sub-task 0.1.3**: Push schema to PostgreSQL with `npx drizzle-kit push` and verify database tables.

- [x] **Task 0.2: Backend REST & SSE Endpoints Expansion**
  - [x] **Sub-task 0.2.1**: Implement `GET /api/officers` in `backend/src/routes/officers.ts` returning the 5 seeded officers joined with active case counts and pending task counts.
  - [x] **Sub-task 0.2.2**: Upgrade `GET /api/cases` in `backend/src/routes/cases.ts` to support `investigatingOfficerId` query parameter filtering.
  - [x] **Sub-task 0.2.3**: Implement `backend/src/routes/tasks.ts` supporting `GET /api/tasks?caseId=...&officerId=...` and `PATCH /api/tasks/:id` status updates.
  - [x] **Sub-task 0.2.4**: Mount `/api/officers` and `/api/tasks` in `backend/src/index.ts`.
  - [x] **Sub-task 0.2.5**: Enrich `POST /api/copilot/query` in `backend/src/routes/copilot.ts` to accept `activeOfficerId`, `activeOfficerName`, and `activeOfficerRole` inside `CopilotPromptEnvelope`.

- [x] **Task 0.3: Canonical TypeScript Shared Contracts**
  - [x] **Sub-task 0.3.1**: Define models in `packages/shared/src/types/entities.ts` (`Officer`, `InvestigativeTask`, `CommandAltitude`, `DeckLensMode`, `CaseSubLens`).
  - [x] **Sub-task 0.3.2**: Export updated types in `packages/shared/src/index.ts` and compile shared workspace package (`npm run build`).

---

### Phase 1: Tactical Command Deck Core Shell & Central State Engine
*Priority: Critical | Goal: High-contrast military SOC application frame with seamless persona switching.*

- [ ] **Task 1.1: Master Command Deck Zustand Store (`useCommandDeckStore.ts`)**
  - [ ] **Sub-task 1.1.1**: Create `frontend/src/store/useCommandDeckStore.ts` with typed state (`altitude`, `activeOfficerId`, `activeStation`, `lensMode`, `caseSubLens`, `activeCaseId`, `activeSuspectId`, `activeBoundingBox`, `timeline`, `pinnedItemIds`, `isOfflineMode`, `backendStatus`).
  - [ ] **Sub-task 1.1.2**: Implement store transition actions (`openCaseNexus`, `closeCaseNexus`, `setAltitude`, `setCaseSubLens`, `pinItem`, `unpinItem`, `setOfflineMode`, `getPromptContextEnvelope`).

- [ ] **Task 1.2: Dual-Mode API Services Layer**
  - [ ] **Sub-task 1.2.1**: Implement `frontend/src/services/api/client.ts` with typed REST client and streaming fetch reader for Groq Server-Sent Events (`POST /api/copilot/query`).
  - [ ] **Sub-task 1.2.2**: Implement `frontend/src/services/api/mockClient.ts` with 100% in-memory failover pre-loaded with curated cases, officers, tasks, and accused graph relations for zero-network resilience.

- [ ] **Task 1.3: Top HUD Navigation Bar (`DeckTopbar.tsx`)**
  - [ ] **Sub-task 1.3.1**: Create `frontend/src/components/deck/DeckTopbar.tsx` featuring tactical brand crest, station breadcrumb, search trigger, and language toggle (`EN`/`KN`).
  - [ ] **Sub-task 1.3.2**: Implement Persona/Role Switcher dropdown (`Insp. Vikram Patil [IO]`, `SI Ramesh [IO]`, `Dr. B. Ramesh, IPS [DCP]`).
  - [ ] **Sub-task 1.3.3**: Implement Connectivity Status Pill with live click toggle between `LIVE BACKEND [●]` and `OFFLINE FAIL-SAFE [○]`.

- [ ] **Task 1.4: Command Deck Shell Container (`DeckShell.tsx` & Keyboard Bus)**
  - [ ] **Sub-task 1.4.1**: Create `frontend/src/components/deck/DeckShell.tsx` with high-contrast dark SOC 3-pane split layout (Left/Center 65% Tactical Lens, Right 35% Ambient Copilot & Caseboard, Bottom 48px Scrubber).
  - [ ] **Sub-task 1.4.2**: Implement global keyboard hotkeys (`1` Docket, `2` Case Nexus, `3` Zonal Radar, `Cmd+K` Search, `Esc` Back).
  - [ ] **Sub-task 1.4.3**: Create `frontend/src/components/deck/CommandPalette.tsx` for instant omni-search across FIR numbers, suspects, and tactical actions.

---

### Phase 2: Investigating Officer (IO) Morning Docket Lens
*Priority: High | Goal: Low-friction morning launchpad showing assigned cases, statutory clocks, and tasks.*

- [ ] **Task 2.1: Priority Assigned Cases Docket (`DocketLens.tsx`)**
  - [ ] **Sub-task 2.1.1**: Create `frontend/src/components/docket/DocketLens.tsx` with officer greeting banner and 3-column tactical docket grid (Critical Violent, In-Progress, Statutory Remand Deadlines).
  - [ ] **Sub-task 2.1.2**: Build `DocketCaseCard.tsx` with FIR badge, incident date, category strip, prime accused details, statutory clock indicator (`"⏳ 42 days to charge-sheet"`), and 1-click `openCaseNexus(case.id)`.

- [ ] **Task 2.2: Shift Task Checklist & Statutory Deadlines**
  - [ ] **Sub-task 2.2.1**: Implement `ShiftTaskList.tsx` inside the docket rendering today's actionable investigative tasks (CCTV, FSL Ballistics, Witness 180 BNSS, Interrogations).
  - [ ] **Sub-task 2.2.2**: Wire interactive 1-click completion checkboxes sending `PATCH /api/tasks/:id` with instant visual state feedback.
  - [ ] **Sub-task 2.2.3**: Implement inline "Quick Add Task" action.

- [ ] **Task 2.3: Station General Diary (GD) Live Event Ticker**
  - [ ] **Sub-task 2.3.1**: Build `StationGdTicker.tsx` rendering live chronological station log events.
  - [ ] **Sub-task 2.3.2**: Build Threat Anomaly Callout Card highlighting urgent regional alerts (e.g. repeat offender bailed near an active crime scene).

---

### Phase 3: The 360° Case Nexus Workbench
*Priority: Critical (The Core Demo Centerpiece) | Goal: All case intelligence on one surface without page reloads.*

- [ ] **Task 3.1: Case Nexus Header & Sub-Lens Navigation (`CaseNexusLens.tsx`)**
  - [ ] **Sub-task 3.1.1**: Create `frontend/src/components/lenses/CaseNexusLens.tsx` with sticky action header (Back button, FIR badge, statutory acts, priority badge, IO name, Pin button, Court Brief button).
  - [ ] **Sub-task 3.1.2**: Implement seamless Sub-Lens Navigation Tabs (`[ 📄 Dossier & Evidence ]`, `[ 🗺️ Crime Scene GIS ]`, `[ 🕸️ Syndicate Network ]`) with `Alt+1`, `Alt+2`, `Alt+3` shortcuts.

- [ ] **Task 3.2: Sub-Lens 1 — Dossier & Evidence Vault (`CaseDossierSubLens.tsx`)**
  - [ ] **Sub-task 3.2.1**: Create `CaseDossierSubLens.tsx` rendering case synopsis, complainant details, and applicable IPC/BNS statutory acts.
  - [ ] **Sub-task 3.2.2**: Build Accused Suspect Profile Cards with aliases, prior arrest counters, and bail status tags.
  - [ ] **Sub-task 3.2.3**: Build Evidence Vault Grid with seized weapon cards, CCTV timestamp logs, and chain-of-custody status.
  - [ ] **Sub-task 3.2.4**: Embed Case Action Checklist with interactive checkboxes linked to this FIR's tasks.

- [ ] **Task 3.3: Sub-Lens 2 — Crime Scene Spatial GIS (`CaseGisSubLens.tsx`)**
  - [ ] **Sub-task 3.3.1**: Create `CaseGisSubLens.tsx` wrapping Leaflet with dark CartoDB basemap auto-centering smoothly on the FIR crime scene coordinates.
  - [ ] **Sub-task 3.3.2**: Render custom radar pulse beacon marking the exact scene of offence.
  - [ ] **Sub-task 3.3.3**: Render 500m & 1km tactical radius circles showing geo-tagged residences of known local suspects, station CCTV cameras, and patrol beat routes.
  - [ ] **Sub-task 3.3.4**: Implement interactive POI popup cards displaying distance from crime scene (`"Resides 850m away"`).

- [ ] **Task 3.4: Sub-Lens 3 — Syndicate Relational Graph (`CaseNetworkSubLens.tsx`)**
  - [ ] **Sub-task 3.4.1**: Create `CaseNetworkSubLens.tsx` wrapping `@xyflow/react` auto-generating an Ego-Network centered on the case's accused.
  - [ ] **Sub-task 3.4.2**: Render custom tactical nodes (Prime Suspect with crimson risk glow, Co-Accused with prior conviction badges, Receiver / Pawnbroker).
  - [ ] **Sub-task 3.4.3**: Render visual relationship edges with weight tags (`CO_ACCUSED_WITH`, `CALL_LOG_CONTACT`).
  - [ ] **Sub-task 3.4.4**: Implement node click inspection loading the suspect's criminal record into Ambient Copilot.

---

### Phase 4: High-Level Zonal Strategic Command Deck (DCP Altitude)
*Priority: High | Goal: Macro command view showing city-wide patterns, cross-station syndicates, and station accountability.*

- [ ] **Task 4.1: Zonal Crime Heatmap & Spatial Density (`ZonalStrategicLens.tsx`)**
  - [ ] **Sub-task 4.1.1**: Create `ZonalStrategicLens.tsx` with macro Leaflet map of Bengaluru East Division and PostGIS spatial density heatmap layer.
  - [ ] **Sub-task 4.1.2**: Render Police Station Centroid markers displaying live incident volume callouts and severity flags.
  - [ ] **Sub-task 4.1.3**: Build Night Patrol Hotspot Recommendation Banner with 1-click *"Deploy Hoysala Patrol Checkpoints"*.

- [ ] **Task 4.2: Inter-Station Syndicate Topology Canvas**
  - [ ] **Sub-task 4.2.1**: Build macro React Flow syndicate graph visualizing organized crime rings spanning multiple stations (Whitefield Cyber Mule Ring, East Ring Syndicate).
  - [ ] **Sub-task 4.2.2**: Wire syndicate node selection to filter the map to cases linked to that syndicate.

- [ ] **Task 4.3: Station Accountability & Clearance Matrix**
  - [ ] **Sub-task 4.3.1**: Build Station Workload & Performance Table (Station, Total FIRs, Open Cases, Clearance Rate %, Average Days to Charge-Sheet, Overdue Warrants).
  - [ ] **Sub-task 4.3.2**: Build Statutory Default Bail Warning Strip flagging cases approaching Section 187 BNSS (167 CrPC) 60/90-day custody limits.

---

### Phase 5: Ambient AI Copilot & Pinned Active Caseboard
*Priority: Critical | Goal: Real-time intelligence stream, bilingual capability, and 1-click court brief generation.*

- [ ] **Task 5.1: Persistent Ambient Copilot (`AmbientCopilot.tsx`)**
  - [ ] **Sub-task 5.1.1**: Create `frontend/src/components/deck/AmbientCopilot.tsx` occupying persistent 35% right-hand rail with dynamic prompt envelope from store.
  - [ ] **Sub-task 5.1.2**: Implement Live SSE Streaming Reader connecting to `POST /api/copilot/query` and rendering token-by-token streaming markdown.
  - [ ] **Sub-task 5.1.3**: Surface Proactive Threat Flash Banners when viewing cases or suspects (e.g. MO matching with Indiranagar burglary).
  - [ ] **Sub-task 5.1.4**: Render contextual action chips (`[ ⚡ Draft Bail Opposition Brief ]`, `[ 🔎 Spot Witness Inconsistencies ]`, `[ 🗣️ ಕನ್ನಡದಲ್ಲಿ ಸಾರಾಂಶ ]`).
  - [ ] **Sub-task 5.1.5**: Render clickable FIR citation pills linking directly into the 360° Case Nexus.

- [ ] **Task 5.2: Active Caseboard & 1-Click Court Briefing PDF (`ActiveCaseboard.tsx`)**
  - [ ] **Sub-task 5.2.1**: Create `frontend/src/components/deck/ActiveCaseboard.tsx` as a collapsible tray holding pinned clues, suspect profiles, and evidence cards.
  - [ ] **Sub-task 5.2.2**: Implement client-side Classified PDF Dossier Generator with Karnataka State Police crest, watermark, and court-ready layout in < 2 seconds.

---

### Phase 6: Temporal Incident Scrubber & Time-Travel Playback
*Priority: High | Goal: Tactile timeline scrubber at bottom edge demonstrating chronological crime expansion.*

- [ ] **Task 6.1: Bottom-Rail Temporal Scrubber (`TemporalScrubber.tsx`)**
  - [ ] **Sub-task 6.1.1**: Create `frontend/src/components/deck/TemporalScrubber.tsx` with fixed 48px tactile bottom bar spanning the Tactical Lens width with `[⏮]`, `[ ⏵ PLAY / ⏸ PAUSE ]`, `[⏭]`, and speed toggles (`1x`, `2x`, `5x`).
  - [ ] **Sub-task 6.1.2**: Implement interactive playhead scrubbing between 90 days ago and today with presets (`24 Hours`, `7 Days`, `30 Days`, `Full Quarter`).
  - [ ] **Sub-task 6.1.3**: Wire dynamic canvas synchronization revealing incident pins and graph nodes chronologically with smooth opacity fade-ins.

---

### Phase 7: End-to-End Verification & Golden Path Demo Hardening
*Priority: Critical | Goal: Flawless live execution with zero errors and bulletproof offline resilience.*

- [ ] **Task 7.1: Golden Path Live Walkthrough Verification**
  - [ ] **Sub-task 7.1.1**: **Scene 1 (High Command Altitude)**: Select `Dr. B. Ramesh, IPS (DCP, East)` -> Verify Zonal Heatmap loads -> Click Whitefield Cyber Mule Ring -> Verify cross-station link rendering.
  - [ ] **Sub-task 7.1.2**: **Scene 2 (Drill to Field IO)**: Click Indiranagar Armed Robbery pin -> Switch to `Insp. Vikram Patil (IO)` -> Verify Morning Docket loads with assigned cases and action checklist.
  - [ ] **Sub-task 7.1.3**: **Scene 3 (360° Case Nexus)**: Click `FIR #102/24` -> Verify smooth morph into Case Nexus -> Inspect Dossier & Seized Pistol -> Toggle Crime Scene GIS (500m radius) -> Toggle Syndicate Graph (Raju @ Snake ego-network).
  - [ ] **Sub-task 7.1.4**: **Scene 4 (Ambient AI & Kannada Brief)**: Click *"Draft Bail Opposition in Kannada"* -> Verify streaming Kannada response with cited FIRs -> Pin suspect and evidence to Caseboard.
  - [ ] **Sub-task 7.1.5**: **Scene 5 (1-Click Court PDF Export)**: Click *"Export Court Dossier"* -> Verify instant generated court briefing layout.

- [ ] **Task 7.2: Offline Resilience & Zero-Network Test**
  - [ ] **Sub-task 7.2.1**: Toggle Top Bar switch to `OFFLINE FAIL-SAFE`.
  - [ ] **Sub-task 7.2.2**: Verify that all 5 golden path scenes execute identically using `mockClient.ts` with zero console errors or network dependencies.
