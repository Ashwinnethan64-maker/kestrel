# KESTREL // AI AGENT INSTRUCTIONS

> **Project:** Kestrel — Police Intelligence & Tactical Command System  
> **Jurisdiction:** Karnataka State Police (Bengaluru)

---

## 1. Absolute Invariants

1. **PRIMARY FRONTEND ARCHITECTURE (`frontend/`)**: 
   * The primary active application is the **Tactical Intelligence Portal** (`frontend/src/App.tsx` $\rightarrow$ `AppLayout.tsx`).
   * **Layout**: Fixed tactical icon rail (`Sidebar.tsx`), command topbar with language/profile/alerts (`Topbar.tsx`), and routed viewports (`<Outlet />`).
   * **Core Routes**:
     * `/overview`: Command SOC dashboard, KPI cards, crime activity trends, recent records.
     * `/cases`: Statutory FIR registry, column customizer, multi-field sorting, accused cards, and evidentiary details.
     * `/gis`: Spatio-temporal Leaflet incident map with spatial radius & patrol beat visualization.
     * `/network`: Accused syndicate topology with React Flow graph and node inspection.
     * `/copilot`: AI Investigator copilot with contextual retrieval, citations, and prompt templates.
     * `/analytics`: Hotspot clustering, clearance rate bars, and recidivism risk metrics.
     * `/reports`: Case auditing, situation briefs (SITREPs), and export dossier tools.
     * `/profile`: Officer credentials, badge number, station unit, and photo management.
     * `/settings`: Theme studio and tactical system preferences.
     * `/login`: Tactical KSP badge login with protected route authentication guard (`RequireAuth`).

2. **BILINGUAL LOCALIZATION (ENGLISH & KANNADA)**:
   * All pages and components must support English (`en`) and Kannada (`kn`) via `frontend/src/lib/i18n.ts` and `frontend/src/store/useLanguageStore.ts`.
   * Never hardcode user-facing strings without providing corresponding keys in `i18n.ts`.

3. **AUTHENTICATION & ROLE CONTEXT**:
   * Session state is managed by `frontend/src/store/useAuthStore.ts` with local session persistence.
   * Officer profile details are managed by `frontend/src/store/useProfileStore.ts`.

4. **CONTRACT LOCK & SHARED TYPES**:
   * Canonical interfaces live in `packages/shared/src/types/`.
   * Never diverge frontend and backend shapes. Update `@kestrel/shared` first.

5. **100% OFFLINE RESILIENCE**:
   * Every feature must function with zero network using `frontend/src/services/api/mockClient.ts` when offline demo mode is toggled.

6. **THEME & VERIFICATION**:
   * Follow "Tactical Midnight" tokens (`#050b14` bg, `#06b6d4` cyan, `#ef4444` crimson).
   * Always run `npm run typecheck --workspace=frontend` before concluding any turn.

7. **PARKED SINGLE-SURFACE PROTOTYPE (`frontend.deck/`)**:
   * The single-surface war room prototype (`DeckShell.tsx`, Morning Docket, 360° Case Nexus, Zonal Radar) is parked in `frontend.deck/` for future refinement.

---

## 2. Key File Pointers

* **Master Plan**: `docs/PLAN.md` & `docs/NEW_FRONTEND_PLAN.md` (Deck prototype reference)
* **Design Spec**: `docs/DESIGN.md`
* **Architecture**: `docs/ARCHITECTURE.md` (PostGIS schemas & pipelines)
* **Primary Frontend Entry**: `frontend/src/App.tsx` $\rightarrow$ `frontend/src/components/layout/AppLayout.tsx`
* **Parked Deck Entry**: `frontend.deck/src/App.tsx` $\rightarrow$ `frontend.deck/src/components/deck/DeckShell.tsx`
* **State Stores**:
  * Auth: `frontend/src/store/useAuthStore.ts`
  * Localization: `frontend/src/store/useLanguageStore.ts` (`i18n.ts`)
  * Profile: `frontend/src/store/useProfileStore.ts`
  * Tour: `frontend/src/store/useTourStore.ts`
  * Context: `frontend/src/store/useInvestigationContext.ts`
* **Database**: `backend/src/db/schema.ts`

---

## 3. Essential Commands

```bash
npm run dev                          # Run primary FE + BE concurrently
npm run typecheck --workspace=frontend # Verify primary frontend TypeScript
npm run typecheck --workspace=frontend-deck # Verify parked deck TypeScript
cd backend && npx drizzle-kit push   # Push DB migrations
```
