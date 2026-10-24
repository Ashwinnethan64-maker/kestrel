import { create } from 'zustand';
import { TacticalLensMode, CaseFilterParams, BoundingBox } from '@kestrel/shared';

interface InvestigationContextState {
  // Lens Projection Mode
  lensMode: TacticalLensMode;
  setLensMode: (mode: TacticalLensMode) => void;

  // Active Filter Scope
  filters: CaseFilterParams;
  setFilters: (filters: Partial<CaseFilterParams>) => void;
  resetFilters: () => void;

  // Temporal Playback
  timeline: {
    currentTime: string;
    windowStart: string;
    windowEnd: string;
    isPlaying: boolean;
    playbackSpeed: number; // 1, 2, 5
  };
  setTimelineTime: (timeIso: string) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;

  // Focused Entities (Persisted across morphing modes)
  activeCaseId: string | null;
  activeSuspectId: string | null;
  activeBoundingBox: BoundingBox | null;

  setActiveCase: (caseId: string | null) => void;
  setActiveSuspect: (suspectId: string | null) => void;
  setActiveBoundingBox: (bounds: BoundingBox | null) => void;

  // Active Caseboard (Pinned Evidence & Clues)
  pinnedItemIds: string[];
  pinItem: (itemId: string) => void;
  unpinItem: (itemId: string) => void;
  clearPins: () => void;

  // Dataset Mode (curated vs large)
  datasetScale: 'curated' | 'large';
  setDatasetScale: (scale: 'curated' | 'large') => void;

  // Offline Mode & Connectivity State
  isOfflineMode: boolean;
  backendStatus: 'connected' | 'offline_manual' | 'offline_fallback';
  dataVersion: number;
  setOfflineMode: (offline: boolean) => void;
  setBackendStatus: (status: 'connected' | 'offline_manual' | 'offline_fallback') => void;
  triggerDataRefresh: () => void;

  // Copilot Context Envelope Generator
  getPromptContextEnvelope: () => {
    activeLens: TacticalLensMode;
    focusedCaseId: string | null;
    focusedSuspectId: string | null;
    activeBoundingBox: BoundingBox | null;
    activeFilters: CaseFilterParams;
    temporalWindow: [string, string];
  };
}

const DEFAULT_FILTERS: CaseFilterParams = {
  district: undefined,
  policeStation: undefined,
  crimeCategory: undefined,
  priority: undefined,
  status: undefined,
  searchQuery: ''
};

const initialOffline = typeof window !== 'undefined' && localStorage.getItem('kestrel_offline_mode') === 'true';

export const useInvestigationContext = create<InvestigationContextState>((set, get) => ({
  lensMode: 'geo',
  setLensMode: (mode) => set({ lensMode: mode }),

  filters: DEFAULT_FILTERS,
  setFilters: (updated) => set((state) => ({ filters: { ...state.filters, ...updated } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  timeline: {
    currentTime: new Date().toISOString(),
    windowStart: new Date(Date.now() - 30 * 86400000).toISOString(),
    windowEnd: new Date().toISOString(),
    isPlaying: false,
    playbackSpeed: 1
  },
  setTimelineTime: (timeIso) => set((state) => ({ timeline: { ...state.timeline, currentTime: timeIso } })),
  togglePlayback: () => set((state) => ({ timeline: { ...state.timeline, isPlaying: !state.timeline.isPlaying } })),
  setPlaybackSpeed: (speed) => set((state) => ({ timeline: { ...state.timeline, playbackSpeed: speed } })),

  activeCaseId: null,
  activeSuspectId: null,
  activeBoundingBox: null,

  setActiveCase: (caseId) => set({ activeCaseId: caseId }),
  setActiveSuspect: (suspectId) => set({ activeSuspectId: suspectId }),
  setActiveBoundingBox: (bounds) => set({ activeBoundingBox: bounds }),

  pinnedItemIds: [],
  pinItem: (id) => set((state) => ({ pinnedItemIds: state.pinnedItemIds.includes(id) ? state.pinnedItemIds : [...state.pinnedItemIds, id] })),
  unpinItem: (id) => set((state) => ({ pinnedItemIds: state.pinnedItemIds.filter((item) => item !== id) })),
  clearPins: () => set({ pinnedItemIds: [] }),

  datasetScale: 'curated',
  setDatasetScale: (scale) => set({ datasetScale: scale }),

  isOfflineMode: initialOffline,
  backendStatus: initialOffline ? 'offline_manual' : 'connected',
  dataVersion: 0,
  setOfflineMode: (offline) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kestrel_offline_mode', String(offline));
    }
    set((state) => ({
      isOfflineMode: offline,
      backendStatus: offline ? 'offline_manual' : 'connected',
      dataVersion: state.dataVersion + 1,
    }));
  },
  setBackendStatus: (status) => set({ backendStatus: status }),
  triggerDataRefresh: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),

  getPromptContextEnvelope: () => {
    const s = get();
    return {
      activeLens: s.lensMode,
      focusedCaseId: s.activeCaseId,
      focusedSuspectId: s.activeSuspectId,
      activeBoundingBox: s.activeBoundingBox,
      activeFilters: s.filters,
      temporalWindow: [s.timeline.windowStart, s.timeline.currentTime]
    };
  }
}));
