import { create } from 'zustand';

export interface TourStep {
  targetId: string; // CSS ID or data-tour attribute
  titleKey: string;
  descriptionKey: string;
  route?: string; // Optional route navigation
  position?: 'right' | 'left' | 'bottom' | 'top';
}

interface TourState {
  hasCompletedTour: boolean;
  isTourActive: boolean;
  currentStepIndex: number;
  showWelcomeDialog: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  dontShowAgain: () => void;
  openWelcomeDialog: () => void;
  closeWelcomeDialog: () => void;
  replayTour: () => void;
}

const TOUR_STORAGE_KEY = 'kestrel_tour_preferences';

const getInitialPreferences = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(TOUR_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tour preferences', e);
      }
    }
  }
  return { hasCompletedTour: false, dismissedPermanently: false };
};

export const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-nav-dashboard',
    titleKey: 'tour.step1Title',
    descriptionKey: 'tour.step1Desc',
    route: '/overview',
    position: 'right',
  },
  {
    targetId: 'tour-nav-copilot',
    titleKey: 'tour.step2Title',
    descriptionKey: 'tour.step2Desc',
    route: '/copilot',
    position: 'right',
  },
  {
    targetId: 'tour-nav-cases',
    titleKey: 'tour.step3Title',
    descriptionKey: 'tour.step3Desc',
    route: '/cases',
    position: 'right',
  },
  {
    targetId: 'tour-nav-network',
    titleKey: 'tour.step4Title',
    descriptionKey: 'tour.step4Desc',
    route: '/network',
    position: 'right',
  },
  {
    targetId: 'tour-nav-gis',
    titleKey: 'tour.step5Title',
    descriptionKey: 'tour.step5Desc',
    route: '/gis',
    position: 'right',
  },
  {
    targetId: 'tour-nav-analytics',
    titleKey: 'tour.step6Title',
    descriptionKey: 'tour.step6Desc',
    route: '/analytics',
    position: 'right',
  },
  {
    targetId: 'tour-user-menu',
    titleKey: 'tour.step7Title',
    descriptionKey: 'tour.step7Desc',
    route: '/profile',
    position: 'bottom',
  },
];

const initialPrefs = getInitialPreferences();

export const useTourStore = create<TourState>((set, get) => ({
  hasCompletedTour: initialPrefs.hasCompletedTour || false,
  isTourActive: false,
  currentStepIndex: 0,
  showWelcomeDialog: !initialPrefs.hasCompletedTour && !initialPrefs.dismissedPermanently,

  startTour: () => {
    set({
      isTourActive: true,
      currentStepIndex: 0,
      showWelcomeDialog: false,
    });
  },

  nextStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      get().completeTour();
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  skipTour: () => {
    set({ isTourActive: false, showWelcomeDialog: false });
  },

  completeTour: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ hasCompletedTour: true, dismissedPermanently: true }));
    }
    set({
      hasCompletedTour: true,
      isTourActive: false,
      showWelcomeDialog: false,
      currentStepIndex: 0,
    });
  },

  dontShowAgain: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ hasCompletedTour: true, dismissedPermanently: true }));
    }
    set({
      hasCompletedTour: true,
      showWelcomeDialog: false,
      isTourActive: false,
    });
  },

  openWelcomeDialog: () => set({ showWelcomeDialog: true }),
  closeWelcomeDialog: () => set({ showWelcomeDialog: false }),

  replayTour: () => {
    set({
      isTourActive: true,
      currentStepIndex: 0,
      showWelcomeDialog: false,
    });
  },
}));
