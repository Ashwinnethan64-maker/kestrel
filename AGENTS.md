# KESTREL // AI AGENT INSTRUCTIONS

> **Project:** Kestrel — Single-Surface Police Intelligence & Tactical Command System  
> **Jurisdiction:** Karnataka State Police (Bengaluru)

---

## 1. Absolute Invariants

1. **NO MULTI-PAGE ROUTES**: 
   * Never create separate routes like `/cases`, `/gis`, `/network`, or `/copilot`.
   * The app is a **single-surface war room** (`DeckShell.tsx`):
     * **Tactical Lens (65%)**: Switches between **Morning Docket**, **360° Case Nexus** (Dossier + Scene GIS + Syndicate Graph sub-lenses), and **Zonal Radar**.
     * **Ambient Copilot (35%)**: Persistent right-hand AI streaming rail.
     * **Temporal Scrubber (Bottom)**: Chronological timeline playback.

2. **DUAL COMMAND ALTITUDES**:
   * **Field IO (Insp. Patil)**: Assigned FIRs, daily task checklist, 360° Case Nexus.
   * **Commander (DCP Ramesh)**: City-wide PostGIS heatmap, cross-station syndicates, station clearance matrix.
   * Switched instantly via `DeckTopbar.tsx` role dropdown.

3. **CONTRACT LOCK & SHARED TYPES**:
   * Canonical interfaces live in `packages/shared/src/types/`.
   * Never diverge frontend and backend shapes. Update `@kestrel/shared` first.

4. **100% OFFLINE RESILIENCE**:
   * Every feature must function in-memory with zero network using `frontend/src/services/api/mockClient.ts` when offline mode is toggled.

5. **THEME & VERIFICATION**:
   * Follow "Tactical Midnight" tokens (`#050b14` bg, `#06b6d4` cyan, `#ef4444` crimson).
   * Always run `npm run typecheck --workspace=frontend` before concluding any turn.

---

## 2. Key File Pointers

* **Master Plan**: `docs/NEW_FRONTEND_PLAN.md` (Phased checkboxes)
* **Design Spec**: `docs/DESIGN.md` (Tokens, layout, wireframes)
* **Architecture**: `docs/ARCHITECTURE.md` (PostGIS schemas & pipelines)
* **Frontend Entry**: `frontend/src/App.tsx` $\rightarrow$ `frontend/src/components/deck/DeckShell.tsx`
* **State Store**: `frontend/src/store/useCommandDeckStore.ts`
* **Legacy Code**: `frontend.legacy/` (Reference for Leaflet markers & React Flow nodes)
* **Database**: `backend/src/db/schema.ts`

---

## 3. Essential Commands

```bash
npm run dev                          # Run FE + BE concurrently
npm run typecheck --workspace=frontend # Verify frontend TypeScript
cd backend && npx drizzle-kit push   # Push DB migrations
```
