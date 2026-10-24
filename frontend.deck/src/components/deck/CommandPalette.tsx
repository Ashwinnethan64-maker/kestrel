import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, UserRound, Crosshair, X, ArrowRight } from 'lucide-react';
import type { FIRCase, AccusedSuspect } from '@kestrel/shared';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { useIntelClient } from '@/services/api/useIntelClient';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Result item types ─────────────────────────────────────────────────────────
type ResultItem =
  | { kind: 'case'; data: FIRCase }
  | { kind: 'suspect'; data: AccusedSuspect }
  | { kind: 'action'; label: string; action: () => void };

// ── Priority badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-intel-crimson/15 text-intel-crimson border-intel-crimson/30',
    High:     'bg-intel-amber/15 text-intel-amber border-intel-amber/30',
    Medium:   'bg-intel-purple/15 text-intel-purple border-intel-purple/30',
    Low:      'bg-intel-emerald/15 text-intel-emerald border-intel-emerald/30',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[8px] font-bold font-mono uppercase rounded border ${colors[priority] ?? colors.Low}`}>
      {priority}
    </span>
  );
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const api = useIntelClient();
  const openCaseNexus = useCommandDeckStore(s => s.openCaseNexus);
  const setLensMode = useCommandDeckStore(s => s.setLensMode);

  // Fetch all data once for searching
  const { data: cases = [] } = useQuery<FIRCase[]>({
    queryKey: ['cases-palette'],
    queryFn: () => api.getCases(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  const { data: accused = [] } = useQuery<AccusedSuspect[]>({
    queryKey: ['accused-palette'],
    queryFn: async () => {
      // Gather unique accused IDs from cases
      const ids = new Set<string>();
      cases.forEach(c => c.accusedIds.forEach(id => ids.add(id)));
      const results: AccusedSuspect[] = [];
      for (const id of ids) {
        const a = await api.getAccused(id);
        if (a) results.push(a);
      }
      return results;
    },
    staleTime: 5 * 60 * 1000,
    enabled: isOpen && cases.length > 0,
  });

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build filtered results
  const results: ResultItem[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show top-level quick actions when no query
      const actions: ResultItem[] = [
        { kind: 'action', label: 'Switch to Morning Docket', action: () => { setLensMode('morning_docket'); onClose(); } },
        { kind: 'action', label: 'Switch to Zonal Radar', action: () => { setLensMode('zonal_radar'); onClose(); } },
      ];
      // Show first 5 cases as quick picks
      const topCases: ResultItem[] = cases.slice(0, 5).map(c => ({ kind: 'case' as const, data: c }));
      return [...actions, ...topCases];
    }

    const matchedCases: ResultItem[] = cases
      .filter(c =>
        c.firNumber.toLowerCase().includes(q) ||
        c.crimeCategory.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.policeStation.toLowerCase().includes(q) ||
        (c.investigatingOfficerName ?? '').toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map(c => ({ kind: 'case' as const, data: c }));

    const matchedSuspects: ResultItem[] = accused
      .filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.aliases.some(a => a.toLowerCase().includes(q)) ||
        (s.gangAffiliation ?? '').toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map(s => ({ kind: 'suspect' as const, data: s }));

    return [...matchedCases, ...matchedSuspects];
  }, [query, cases, accused, setLensMode, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  // Keyboard navigation within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      selectItem(results[selectedIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const selectItem = (item: ResultItem) => {
    if (item.kind === 'case') {
      openCaseNexus(item.data.id);
      onClose();
    } else if (item.kind === 'suspect') {
      // Open the first case this suspect is involved in
      const caseId = item.data.activeCaseIds[0];
      if (caseId) openCaseNexus(caseId, item.data.id);
      onClose();
    } else if (item.kind === 'action') {
      item.action();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIdx] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl mx-4 rounded-lg glass-panel border border-intel-cyan/20 shadow-deck-glow-lg animate-slide-down overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={16} className="text-intel-cyan shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search FIR number, suspect name, station…"
            className="flex-1 bg-transparent text-sm text-tx-primary placeholder:text-tx-muted outline-none font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <button onClick={onClose} className="text-tx-muted hover:text-tx-primary transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1" role="listbox">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-tx-muted">No results found for "{query}"</p>
              <p className="text-[10px] text-tx-muted/60 mt-1">Try an FIR number, crime category, or suspect name</p>
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={item.kind === 'action' ? item.label : item.data.id}
                role="option"
                aria-selected={idx === selectedIdx}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75
                  ${idx === selectedIdx
                    ? 'bg-intel-cyan/10 text-tx-primary'
                    : 'text-tx-secondary hover:bg-deck-elevated/50 hover:text-tx-primary'
                  }
                `}
                onClick={() => selectItem(item)}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                {item.kind === 'case' && (
                  <>
                    <FileText size={14} className="text-intel-cyan shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold text-intel-cyan truncate">
                          {item.data.firNumber}
                        </span>
                        <span className="text-[11px] truncate">{item.data.crimeCategory}</span>
                      </div>
                      <p className="text-[9px] text-tx-muted font-mono truncate mt-0.5">
                        {item.data.policeStation} · {item.data.investigatingOfficerName ?? 'Unassigned'}
                      </p>
                    </div>
                    <PriorityBadge priority={item.data.priority} />
                    <ArrowRight size={10} className="text-tx-muted shrink-0" />
                  </>
                )}
                {item.kind === 'suspect' && (
                  <>
                    <UserRound size={14} className="text-intel-crimson shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold truncate">{item.data.fullName}</span>
                        {item.data.aliases.length > 0 && (
                          <span className="text-[9px] text-tx-muted italic truncate">
                            @ {item.data.aliases[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-tx-muted font-mono truncate mt-0.5">
                        {item.data.gangAffiliation ?? 'Independent'} · {item.data.activeCaseIds.length} active case(s)
                      </p>
                    </div>
                    <PriorityBadge priority={item.data.riskLevel} />
                  </>
                )}
                {item.kind === 'action' && (
                  <>
                    <Crosshair size={14} className="text-intel-amber shrink-0" />
                    <span className="text-[11px] flex-1">{item.label}</span>
                    <ArrowRight size={10} className="text-tx-muted shrink-0" />
                  </>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 text-[9px] font-mono text-tx-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
