import { create } from 'zustand';
import type {
  CommandAltitude,
  DeckLensMode,
  CaseSubLens,
  BoundingBox,
  CopilotPromptEnvelope,
  TacticalLensMode
} from '@kestrel/shared';

// ── State ────────────────────────────────────────────────────────────────────

interface TimelineState {
  startDate: string;        // ISO date string e.g. '2024-01-01'
  endDate: string;          // ISO date string e.g. '2024-03-31'
  playbackSpeed: 1 | 2 | 5;
  isPlaying: boolean;
}

interface CommandDeckState {
  // Persona & Role
  altitude: CommandAltitude;
  activeOfficerId: string;
  activeStation: string;

  // Lens navigation
  lensMode: DeckLensMode;
  caseSubLens: CaseSubLens;

  // Focus context
  activeCaseId: string | null;
  activeSuspectId: string | null;
  activeBoundingBox: BoundingBox | null;

  // Temporal scrubber
  timeline: TimelineState;

  // Caseboard pins
  pinnedItemIds: string[];

  // Infrastructure
  isOfflineMode: boolean;
  backendStatus: 'online' | 'offline' | 'checking';
}

// ── Actions ───────────────────────────────────────────────────────────────────

interface CommandDeckActions {
  /** Select a case and open the 360° Case Nexus lens. */
  openCaseNexus: (caseId: string, suspectId?: string) => void;
  /** Close Case Nexus and return to Morning Docket. */
  closeCaseNexus: () => void;
  /** Switch operational altitude (IO ↔ Commander). */
  setAltitude: (altitude: CommandAltitude) => void;
  /** Directly switch the Tactical Canvas lens. */
  setLensMode: (mode: DeckLensMode) => void;
  /** Switch sub-pane within Case Nexus. */
  setCaseSubLens: (sub: CaseSubLens) => void;
  /** Pin an item (FIR ID or suspect ID) to the Copilot caseboard. */
  pinItem: (id: string) => void;
  /** Unpin an item from the caseboard. */
  unpinItem: (id: string) => void;
  /** Toggle offline mode (routes API calls to mockClient). */
  setOfflineMode: (offline: boolean) => void;
  /** Update backend health indicator. */
  setBackendStatus: (status: 'online' | 'offline' | 'checking') => void;
  /** Patch temporal scrubber state. */
  setTimeline: (patch: Partial<TimelineState>) => void;
  /**
   * Derive a fully-typed CopilotPromptEnvelope from current store state.
   * Called by the Ambient Copilot rail before every query submission.
   * The caller fills in `query` and `language`; everything else is derived here.
   */
  getPromptContextEnvelope: () => Omit<CopilotPromptEnvelope, 'query' | 'language'>;
}

// ── Default Initial State ─────────────────────────────────────────────────────

const now = new Date();
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

const initialState: CommandDeckState = {
  altitude: 'field_io',
  activeOfficerId: 'OFF-01',
  activeStation: 'Indiranagar',

  lensMode: 'morning_docket',
  caseSubLens: 'dossier',

  activeCaseId: null,
  activeSuspectId: null,
  activeBoundingBox: null,

  timeline: {
    startDate: thirtyDaysAgo.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
    playbackSpeed: 1,
    isPlaying: false
  },

  pinnedItemIds: [],
  isOfflineMode: false,
  backendStatus: 'checking'
};

// ── Lens mode → TacticalLensMode mapping (for Copilot envelope) ──────────────

function resolveTacticalLens(
  lensMode: DeckLensMode,
  caseSubLens: CaseSubLens
): TacticalLensMode {
  if (lensMode === 'zonal_radar') return 'geo';
  if (lensMode === 'case_nexus') {
    if (caseSubLens === 'scene_gis') return 'geo';
    if (caseSubLens === 'syndicate_graph') return 'network';
    return 'dossier';
  }
  // morning_docket
  return 'dossier';
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCommandDeckStore = create<CommandDeckState & CommandDeckActions>()(
  (set, get) => ({
    ...initialState,

    openCaseNexus: (caseId, suspectId) =>
      set({
        lensMode: 'case_nexus',
        caseSubLens: 'dossier',
        activeCaseId: caseId,
        activeSuspectId: suspectId ?? null
      }),

    closeCaseNexus: () =>
      set({
        lensMode: 'morning_docket',
        activeCaseId: null,
        activeSuspectId: null
      }),

    setAltitude: (altitude) =>
      set({
        altitude,
        lensMode: altitude === 'commander' ? 'zonal_radar' : 'morning_docket',
        activeCaseId: null,
        activeSuspectId: null
      }),

    setLensMode: (mode) => set({ lensMode: mode }),

    setCaseSubLens: (sub) => set({ caseSubLens: sub }),

    pinItem: (id) =>
      set((state) => ({
        pinnedItemIds: state.pinnedItemIds.includes(id)
          ? state.pinnedItemIds
          : [...state.pinnedItemIds, id].slice(-10) // max 10 pins
      })),

    unpinItem: (id) =>
      set((state) => ({
        pinnedItemIds: state.pinnedItemIds.filter((p) => p !== id)
      })),

    setOfflineMode: (offline) => set({ isOfflineMode: offline }),

    setBackendStatus: (status) => set({ backendStatus: status }),

    setTimeline: (patch) =>
      set((state) => ({ timeline: { ...state.timeline, ...patch } })),

    getPromptContextEnvelope: () => {
      const s = get();
      return {
        activeLens: resolveTacticalLens(s.lensMode, s.caseSubLens),
        focusedCaseId: s.activeCaseId,
        focusedSuspectId: s.activeSuspectId,
        activeOfficerId: s.activeOfficerId,
        // activeOfficerName / activeOfficerRole resolved by Copilot component
        // from the officers list loaded via API
        activeOfficerName: null,
        activeOfficerRole: null,
        activeBoundingBox: s.activeBoundingBox,
        temporalWindow: [s.timeline.startDate, s.timeline.endDate]
      };
    }
  })
);

// ── Selector helpers (memoization-friendly, stable references) ────────────────

export const selectAltitude = (s: CommandDeckState) => s.altitude;
export const selectLensMode = (s: CommandDeckState) => s.lensMode;
export const selectCaseSubLens = (s: CommandDeckState) => s.caseSubLens;
export const selectActiveCaseId = (s: CommandDeckState) => s.activeCaseId;
export const selectActiveSuspectId = (s: CommandDeckState) => s.activeSuspectId;
export const selectActiveOfficerId = (s: CommandDeckState) => s.activeOfficerId;
export const selectPinnedItemIds = (s: CommandDeckState) => s.pinnedItemIds;
export const selectIsOfflineMode = (s: CommandDeckState) => s.isOfflineMode;
export const selectBackendStatus = (s: CommandDeckState) => s.backendStatus;
export const selectTimeline = (s: CommandDeckState) => s.timeline;
