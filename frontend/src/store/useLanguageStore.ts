import { create } from 'zustand';

export type SupportedLanguage = 'en' | 'kn';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
}

const STORAGE_KEY = 'kestrel_language_preference';

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'kn' || saved === 'en') {
      return saved;
    }
  }
  return 'en';
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
    }
    set({ language });
  },
  toggleLanguage: () => {
    set((state) => {
      const next: SupportedLanguage = state.language === 'en' ? 'kn' : 'en';
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
      }
      return { language: next };
    });
  },
}));
