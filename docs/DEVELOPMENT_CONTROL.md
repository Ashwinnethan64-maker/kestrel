# Kestrel — Stage-Based Frontend Development Control

## 1. Project Identity & Reference

- **Official Project & Platform Name:** **Kestrel** (formerly referred to as AI-CIOS).
- **Branding & UI Rule:** Always use **Kestrel** consistently across documentation, UI text, page headers, navigation items, page titles, and user-facing communications.
- **Technical Integrity Rule:** Preserve existing backend integrations, API contracts, database schemas, and technical identifiers unless changes are verified as necessary.
- **Repository:** [https://github.com/Ashwinnethan64-maker/kestrel](https://github.com/Ashwinnethan64-maker/kestrel)
- **Reference Application (In-Development Staging):** `https://ai-cios-60073452908.development.catalystserverless.in/` (Note: Staging site is not yet completed; use verified repository code and architectural specifications as primary ground truth).

---

## 2. Stage-Based Development Workflow

Development of the Kestrel frontend must strictly follow these sequential stages:

- **Stage 0 — Repository & Reference Audit**  
  *Objective:* Inspect the existing repository, package dependencies, monorepo packages, frontend source code, backend API contracts, and design documentation (`ARCHITECTURE.md`, `DESIGN.md`, `PLAN.md`). Identify verified pages, modules, routes, and data models. Document findings and propose an exact implementation plan.

- **Stage 1 — Project Architecture & Foundation**  
  *Objective:* Establish the modular folder structure (`src/app`, `src/layouts`, `src/components/layout`, `src/components/ui`, `src/features`, `src/services`, `src/styles`, `src/hooks`, `src/types`, `src/utils`). Configure routing, provider hierarchy, design tokens, typography, and reusable core UI primitives (Button, Input, Select, Modal, Tabs, Badge, DataTable, Pagination, State indicators).

- **Stage 2 — Global Layout & Navigation**  
  *Objective:* Implement the complete application shell, including the tactical topbar, collapsible responsive navigation sidebar, active route indicators, breadcrumbs, command bar (`Cmd+K`), quick status indicators, and notification drawer.

- **Stage 3 — Dashboard Implementation**  
  *Objective:* Rebuild the main command deck dashboard with verified operational widgets: real-time incident counters, priority alert banners, incident velocity indicators, map/graph summary cards, and recent activity feeds.

- **Stage 4 — Feature Pages & Workflows**  
  *Objective:* Implement all verified feature views:
  - *Case / FIR Explorer:* Filterable data table, multi-parameter search, incident status lifecycle, and suspect dossiers.
  - *Criminal Network Graph:* Entity topology (`@xyflow/react`), suspect clustering, and syndicate relationship views.
  - *Tactical GIS Map:* Interactive geospatial layers (Leaflet), incident heatmaps, and spatial lasso query controls.
  - *Ambient Intelligence Copilot:* Persistent conversational investigative assistant, prompt shortcuts, and bilingual (KN/EN) context.
  - *Tactical Analytics & Reports:* Incident metrics, trend charts, and dossier export generation.

- **Stage 5 — Data Integration & State Management**  
  *Objective:* Connect features to the Unified Investigation Context Bus (`useInvestigationContext` Zustand store) and React Query data hooks. Ensure robust separation between the API client layer (`client.ts`), mock fallback dataset (`mockClient.ts`), and UI components.

- **Stage 6 — UI Polish, Styling & Animations**  
  *Objective:* Refine visual design with cyber-tactical command aesthetics: dark slate/navy palette, neon status accents, glassmorphic HUD overlays, micro-interactions, modal transitions, and reduced-motion accessibility.

- **Stage 7 — Testing, Bug Fixes & Final Verification**  
  *Objective:* Run linting, TypeScript type-checks (`npm run typecheck`), build validation (`npm run build:frontend`), end-to-end route testing, responsive layout checks, and final polish.

---

## 3. Mandatory Governance Rules

1. **Explicit Authorization Required:** Execute only the stage explicitly requested and authorized by the user.
2. **No Automatic Progression:** Never automatically proceed to the next stage upon completing the current one.
3. **Inspect Before Modifying:** Thoroughly inspect existing source code, dependencies, documentation, and reference assets before modifying or creating files.
4. **Zero Fabrication:** Implement verified features only. Never invent fake routes, mock endpoints without contracts, fabricated test results, or non-existent repository findings.
5. **Modular Architecture:** Maintain strict separation of concerns:
   - Each component has its own file.
   - Business and data logic remain decoupled from presentation components.
   - Centralize design tokens and animations in dedicated shared style files.
   - Keep API services and mock fixtures isolated in `src/services/api/`.
6. **Preserve Buildability:** Keep the repository buildable and functional at all times. Do not break previously completed stages or introduce syntax/import errors.
7. **Living Documentation Maintenance:**
   - Record progress, stage completions, decisions, changed files, and test results in `docs/DEVELOPMENT_PROGRESS.md`.
   - Keep architectural documentation updated in `docs/ARCHITECTURE.md`.
   - Update both documents at the conclusion of every stage.
8. **Structured Stage Closure Reports:** At the end of each stage, provide:
   - Summary of completed work.
   - List of files created or modified.
   - Verification and testing results.
   - Known blockers or unresolved dependencies.
   - The exact name and objective of the proposed next stage.
9. **Substage Decomposition for Large Tasks:** If an authorized stage is extensive (e.g., Stage 4), decompose it into clear substages (e.g., Stage 4A, Stage 4B, Stage 4C), present the breakdown, and request authorization before proceeding.
10. **Graceful Blocker Handling:** If an unexpected obstacle arises, complete all safe and independent tasks within the authorized scope, report the blocker honestly, and request guidance.

---

## 4. Starting Instruction

- The first development task must be **Stage 0 — Repository & Reference Audit only**.
- The agent must inspect the Kestrel repository, existing documentation in `docs/`, frontend and backend architecture, dependencies, routes, and API models before writing or changing any application code.
- **Do not begin Stage 1 until explicit user approval is granted.**
