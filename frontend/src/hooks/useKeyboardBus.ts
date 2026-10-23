import { useEffect } from 'react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import type { CaseSubLens } from '@kestrel/shared';

/**
 * useKeyboardBus — Global keyboard shortcut handler for the Command Deck.
 *
 * Hotkeys (from DESIGN.md § 4):
 *   1         → Switch to Morning Docket
 *   2         → Switch to Case Nexus (if a case is active)
 *   3         → Switch to Zonal Radar
 *   Alt+1/2/3 → Switch Case Sub-Lens (Dossier / Scene GIS / Syndicate Graph)
 *   Cmd+K     → Open Command Palette
 *   Esc       → Close Case Nexus / palette / modals
 *   Shift+P   → Pin active case to caseboard
 *
 * All shortcuts are suppressed when focus is inside an input/textarea/contenteditable.
 */
export function useKeyboardBus({
  onSearchTrigger,
  onEscape,
}: {
  onSearchTrigger: () => void;
  onEscape: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack when typing in form fields
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K always fires (even in input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchTrigger();
        return;
      }

      // Escape always fires
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }

      // All remaining shortcuts require non-editable context
      if (isEditable) return;

      const store = useCommandDeckStore.getState();

      // Alt + 1/2/3 → Case Sub-Lens switcher (only in case_nexus)
      if (e.altKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        if (store.lensMode === 'case_nexus') {
          const subLensMap: Record<string, CaseSubLens> = {
            '1': 'dossier',
            '2': 'scene_gis',
            '3': 'syndicate_graph',
          };
          store.setCaseSubLens(subLensMap[e.key]);
        }
        return;
      }

      // Shift+P → Pin active case
      if (e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (store.activeCaseId) {
          store.pinItem(store.activeCaseId);
        }
        return;
      }

      // 1/2/3 → Lens mode switcher
      if (e.key === '1') {
        e.preventDefault();
        store.setLensMode('morning_docket');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        if (store.activeCaseId) {
          store.setLensMode('case_nexus');
        }
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        store.setLensMode('zonal_radar');
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearchTrigger, onEscape]);
}
