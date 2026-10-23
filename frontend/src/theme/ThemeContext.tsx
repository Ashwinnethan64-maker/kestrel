import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeDefinition, KESTREL_DEFAULT_THEME, THEMES_REGISTRY } from "./themes";

interface ThemeContextType {
  activeTheme: ThemeDefinition;
  previewTheme: ThemeDefinition | null;
  setPreview: (theme: ThemeDefinition | null) => void;
  applyTheme: (theme: ThemeDefinition) => void;
  resetToDefault: () => void;
  allThemes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: KESTREL_DEFAULT_THEME,
  previewTheme: null,
  setPreview: () => {},
  applyTheme: () => {},
  resetToDefault: () => {},
  allThemes: THEMES_REGISTRY,
});

const THEME_STORAGE_KEY = "kestrel-active-theme-id";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ThemeDefinition>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        if (stored === KESTREL_DEFAULT_THEME.id) return KESTREL_DEFAULT_THEME;
        const found = THEMES_REGISTRY.find((t) => t.id === stored);
        if (found) return found;
      }
    } catch (e) {
      // LocalStorage access guard
    }
    return KESTREL_DEFAULT_THEME;
  });

  const [previewTheme, setPreviewTheme] = useState<ThemeDefinition | null>(null);

  // Apply CSS custom properties whenever activeTheme changes (unless currently previewing)
  useEffect(() => {
    const target = previewTheme || activeTheme;
    const root = document.documentElement;

    // Apply semantic CSS color variables
    root.style.setProperty("--background", target.colors.background);
    root.style.setProperty("--foreground", target.colors.foreground);
    root.style.setProperty("--sidebar", target.colors.sidebar);
    root.style.setProperty("--sidebar-foreground", target.colors.sidebarForeground);
    root.style.setProperty("--sidebar-muted", target.colors.sidebarMuted);
    root.style.setProperty("--sidebar-border", target.colors.sidebarBorder);
    root.style.setProperty("--card", target.colors.card);
    root.style.setProperty("--card-foreground", target.colors.cardForeground);
    root.style.setProperty("--surface-elevated", target.colors.surfaceElevated);
    root.style.setProperty("--muted", target.colors.muted);
    root.style.setProperty("--muted-foreground", target.colors.mutedForeground);
    root.style.setProperty("--border", target.colors.border);
    root.style.setProperty("--input", target.colors.input);
    root.style.setProperty("--primary", target.colors.primary);
    root.style.setProperty("--primary-foreground", target.colors.primaryForeground);
    root.style.setProperty("--secondary", target.colors.secondary);
    root.style.setProperty("--secondary-foreground", target.colors.secondaryForeground);
    root.style.setProperty("--attention", target.colors.attention);
    root.style.setProperty("--destructive", target.colors.destructive);
    root.style.setProperty("--positive", target.colors.positive);
    root.style.setProperty("--ring", target.colors.ring);
    root.style.setProperty("--radius", target.radius);

    // Set data attribute for conditional custom styles
    root.setAttribute("data-theme", target.id);
  }, [activeTheme, previewTheme]);

  const applyTheme = (theme: ThemeDefinition) => {
    setActiveTheme(theme);
    setPreviewTheme(null);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    } catch (e) {
      // ignore
    }
  };

  const resetToDefault = () => {
    applyTheme(KESTREL_DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        previewTheme,
        setPreview: setPreviewTheme,
        applyTheme,
        resetToDefault,
        allThemes: THEMES_REGISTRY,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
