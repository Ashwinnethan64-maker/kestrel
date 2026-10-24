import { create } from 'zustand';

export interface UserProfile {
  displayName: string;
  email: string;
  role: string;
  department: string;
  primaryDistrict: string;
  commandUnit: string;
  station: string;
  badgeNumber: string;
  securityClearance: string;
  authProvider: string;
  phoneNumber: string;
  photoUrl: string | null;
  mfaEnforced: boolean;
  chainOfCustodyLogging: boolean;
  sessionTimeoutMinutes: number;
}

interface ProfileState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

const STORAGE_KEY = 'kestrel_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Ashwin Nethan',
  email: 'ashwin.nethan@ksp.gov.in',
  role: 'Investigator',
  department: 'Cyber Crime & Narcotics Intelligence',
  primaryDistrict: 'Bengaluru',
  commandUnit: 'Karnataka State Police SOC',
  station: 'Bengaluru PS',
  badgeNumber: 'KSP-4491',
  securityClearance: 'Level 4 (State Tactical)',
  authProvider: 'KSP Secure SSO / GovID',
  phoneNumber: '+91 94481 99042',
  photoUrl: null,
  mfaEnforced: true,
  chainOfCustodyLogging: true,
  sessionTimeoutMinutes: 30,
};

const getInitialProfile = (): UserProfile => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse stored profile', e);
      }
    }
  }
  return DEFAULT_PROFILE;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: getInitialProfile(),
  updateProfile: (updates) => {
    set((state) => {
      const updated = { ...state.profile, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return { profile: updated };
    });
  },
  resetProfile: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ profile: DEFAULT_PROFILE });
  },
}));
