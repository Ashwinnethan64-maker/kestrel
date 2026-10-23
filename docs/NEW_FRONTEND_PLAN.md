# KESTREL // NEW FRONTEND MASTER IMPLEMENTATION PLAN
## Next-Generation Officer Command Deck & Intelligence Operating System

> **Platform:** Kestrel — Police Intelligence & Tactical Command System  
> **Target UX:** Unified, Zero-Friction Officer War Room (Field IO Docket + 360° Case Nexus + High-Level Zonal Command Deck)  
> **Philosophy:** High-contrast tactical military SOC aesthetics, zero disjointed page navigation, optimized for a killer live demo.

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

## 2. The Command Deck UI Anatomy

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

## 3. Core Component Architecture (`frontend/src/`)

```
frontend/src/
├── components/
│   ├── deck/
│   │   ├── DeckShell.tsx                # Master responsive container
│   │   ├── DeckTopbar.tsx               # Persona/Role dropdown, status indicators, offline switch
│   │   ├── CommandPalette.tsx           # Quick navigation and search (Cmd+K)
│   │   ├── AmbientCopilot.tsx           # Persistent streaming AI sidecar + prompt suggestions
│   │   ├── ActiveCaseboard.tsx          # Pinned clues & court dossier export dock
│   │   └── TemporalScrubber.tsx         # Bottom-rail timeline playback controls
│   ├── lenses/
│   │   ├── TacticalLensContainer.tsx    # Controller morphing between Docket, Case Nexus, & Zonal Deck
│   │   ├── DocketLens.tsx               # Morning launchpad: assigned FIRs, priority alerts, tasks
│   │   ├── CaseNexusLens.tsx            # 360° Case Workbench with sub-lens navigation
│   │   │   ├── CaseDossierSubLens.tsx   # Detailed FIR view, statutory acts, evidence list, action tasks
│   │   │   ├── CaseGisSubLens.tsx       # Embedded Leaflet crime scene radius & CCTV layer
│   │   │   └── CaseNetworkSubLens.tsx   # Embedded React Flow ego-network of suspect & co-accused
│   │   └── ZonalStrategicLens.tsx       # DCP view: city-wide heatmap, syndicate graph, station workload
│   └── ui/                              # Reusable primitives (Badge, Button, Card, Modal, Tooltip, etc.)
├── store/
│   └── useCommandDeckStore.ts           # Central Zustand store (altitude, activeCase, lens, timeline, pins)
├── services/
│   └── api/
│       ├── client.ts                    # Live API client with SSE stream parser
│       └── mockClient.ts                # In-memory zero-network failover provider
├── theme/
│   └── themes.ts                        # Tactical Midnight palette & tokens
└── App.tsx                              # Root mount for DeckShell
```

---

## 4. State Management Contract (`useCommandDeckStore.ts`)

```typescript
export type CommandAltitude = 'investigator' | 'supervisor' | 'commander'; // IO vs SHO vs DCP
export type DeckLensMode = 'docket' | 'case_nexus' | 'zonal_radar';
export type CaseSubLens = 'dossier' | 'spatial_scene' | 'syndicate_network';

interface CommandDeckState {
  // Operational Persona
  altitude: CommandAltitude;
  activeOfficerId: string;
  setAltitude: (altitude: CommandAltitude, officerId?: string) => void;

  // Tactical Lens Navigation
  lensMode: DeckLensMode;
  caseSubLens: CaseSubLens;
  setLensMode: (mode: DeckLensMode) => void;
  setCaseSubLens: (subLens: CaseSubLens) => void;

  // Active Focus
  activeCaseId: string | null;
  activeSuspectId: string | null;
  openCaseNexus: (caseId: string, initialSubLens?: CaseSubLens) => void;
  closeCaseNexus: () => void;

  // Temporal Playback
  timeline: {
    currentTime: string;
    windowStart: string;
    windowEnd: string;
    isPlaying: boolean;
    playbackSpeed: number;
  };
  setTimelineTime: (iso: string) => void;
  togglePlayback: () => void;

  // Pinned Caseboard
  pinnedItemIds: string[];
  pinItem: (id: string) => void;
  unpinItem: (id: string) => void;

  // Offline / Connectivity State
  isOfflineMode: boolean;
  backendStatus: 'connected' | 'offline_manual' | 'offline_fallback';
  setOfflineMode: (offline: boolean) => void;
}
```

---

## 5. Backend Additions Required

The existing backend is already 85% ready with PostGIS, Drizzle, and Groq LLM pipelines. We only need minor targeted enhancements:

1. **Officer Roster Endpoint (`backend/src/routes/officers.ts`)**:
   * `GET /api/officers` — Returns the 5 seeded officers with their active case counts.
2. **Case Filtering by Officer (`backend/src/routes/cases.ts`)**:
   * Add query param `investigatingOfficerId` to `GET /api/cases`.
3. **Investigative Tasks Roster (`backend/src/routes/tasks.ts`)**:
   * Lightweight tasks endpoint: `GET /api/tasks?caseId=...` and `PATCH /api/tasks/:id` to check off action checklist items.
4. **Copilot Envelope Enrichment**:
   * Ensure `POST /api/copilot/query` receives the active officer name, rank, and station to customize the AI persona.

---

## 6. Implementation Phasing & Milestones

### Phase 1: Backend Micro-Adjustments & Shared Types
* [ ] Add `GET /api/officers` and `GET /api/tasks` in `backend/src/routes/`.
* [ ] Update shared types in `packages/shared/src/types/`.

### Phase 2: Deck Shell, Zustand Store & Design System
* [ ] Implement `frontend/src/store/useCommandDeckStore.ts`.
* [ ] Build `DeckTopbar.tsx` with role switcher, jurisdiction badge, offline pill, and search.
* [ ] Re-wire `client.ts` and `mockClient.ts` to support officer-scoped queries.

### Phase 3: The Morning Officer Docket Lens
* [ ] Implement `DocketLens.tsx`:
  * Priority Assigned Cases cards.
  * Today's Action Checklist.
  * Station General Diary (GD) live event ticker.

### Phase 4: The 360° Case Nexus Workbench
* [ ] Implement `CaseNexusLens.tsx` with seamless sub-lens switching:
  * **Dossier Sub-Lens**: Narrative, victim, accused profiles, evidence vault, checklist.
  * **Spatial Scene Sub-Lens**: Leaflet canvas auto-centered on the crime scene with 500m radius and CCTV pins.
  * **Syndicate Network Sub-Lens**: React Flow ego-network showing suspect and co-accused links.

### Phase 5: High-Level Zonal Strategic Command Deck
* [ ] Implement `ZonalStrategicLens.tsx` (DCP Altitude):
  * City-wide PostGIS heatmap.
  * Inter-station syndicate clustering.
  * Station workload and clearance matrix.

### Phase 6: Ambient Copilot, Temporal Scrubber & Export
* [ ] Build persistent `AmbientCopilot.tsx` with live SSE streaming from Groq.
* [ ] Build bottom-rail `TemporalScrubber.tsx` with play/pause animations.
* [ ] Implement `ActiveCaseboard.tsx` with 1-click Court Briefing PDF generation.

### Phase 7: Verification & Golden Path Demo Rehearsal
* [ ] Test end-to-end flow: DCP Zonal View $\rightarrow$ Drill into Indiranagar $\rightarrow$ Switch to IO Patil $\rightarrow$ Inspect Case #102/24 $\rightarrow$ AI Bail Brief in Kannada $\rightarrow$ 1-Click PDF.
* [ ] Validate complete offline resilience mode.
