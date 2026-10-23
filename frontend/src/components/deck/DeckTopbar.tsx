import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  ChevronDown,
  Search,
  Wifi,
  WifiOff,
  Loader2,
  MapPin,
  User,
} from 'lucide-react';
import type { OfficerWithWorkload } from '@kestrel/shared';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { useIntelClient } from '@/services/api/useIntelClient';
import type { CommandAltitude } from '@kestrel/shared';

// ── Officer persona definitions ───────────────────────────────────────────────
const ALTITUDE_FOR_ROLE: Record<string, CommandAltitude> = {
  Investigator:   'field_io',
  StationInCharge:'field_io',
  Superintendent: 'commander',
};

interface DeckTopbarProps {
  language: 'en' | 'kn';
  onLanguageToggle: () => void;
  onSearchTrigger: () => void;
}

// ── Kestrel Brand Crest SVG ───────────────────────────────────────────────────
function KestrelCrest({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
        fill="rgba(6,182,212,0.15)"
        stroke="#06b6d4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#06b6d4"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="1.5" fill="#06b6d4" opacity="0.6" />
    </svg>
  );
}

// ── Altitude badge ────────────────────────────────────────────────────────────
function AltitudeBadge({ altitude }: { altitude: CommandAltitude }) {
  return altitude === 'field_io' ? (
    <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-widest rounded border border-intel-cyan/30 text-intel-cyan bg-intel-cyan/10">
      IO
    </span>
  ) : (
    <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-widest rounded border border-intel-amber/30 text-intel-amber bg-intel-amber/10">
      CMD
    </span>
  );
}

// ── Connectivity Status Pill ──────────────────────────────────────────────────
function StatusPill({
  backendStatus,
  isOfflineMode,
  onToggle,
}: {
  backendStatus: 'online' | 'offline' | 'checking';
  isOfflineMode: boolean;
  onToggle: () => void;
}) {
  const isLive = backendStatus === 'online' && !isOfflineMode;
  const isChecking = backendStatus === 'checking';

  return (
    <button
      id="kestrel-connectivity-pill"
      onClick={onToggle}
      title={isOfflineMode ? 'Click to attempt live backend connection' : 'Click to switch to offline failsafe mode'}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold font-mono tracking-wider
        transition-all duration-200 cursor-pointer select-none
        ${isChecking
          ? 'status-check animate-status-blink'
          : isLive
            ? 'status-live'
            : 'status-offline'
        }
        hover:brightness-125 active:scale-95
      `}
      aria-label={isLive ? 'Live backend connected' : isChecking ? 'Connecting…' : 'Offline fail-safe active'}
    >
      {isChecking ? (
        <Loader2 size={8} className="animate-spin" />
      ) : isLive ? (
        <span className="w-1.5 h-1.5 rounded-full bg-intel-emerald animate-beacon-ping" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-intel-crimson opacity-70" />
      )}
      {isChecking ? 'CONNECTING' : isLive ? 'LIVE' : 'OFFLINE'}
    </button>
  );
}

// ── Officer Dropdown ──────────────────────────────────────────────────────────
function OfficerDropdown({
  officers,
  activeOfficerId,
  altitude,
  onSelect,
}: {
  officers: OfficerWithWorkload[];
  activeOfficerId: string;
  altitude: CommandAltitude;
  onSelect: (officer: OfficerWithWorkload) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeOfficer = officers.find(o => o.id === activeOfficerId) ?? officers[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        id="kestrel-officer-switcher"
        onClick={() => setOpen(v => !v)}
        className="
          flex items-center gap-2 px-3 py-1.5 rounded
          border border-white/8 hover:border-intel-cyan/30
          bg-deck-panel/60 hover:bg-deck-panel
          text-tx-primary transition-all duration-150
          group
        "
      >
        <User size={13} className="text-intel-cyan shrink-0" />
        <div className="flex flex-col items-start leading-none">
          <span className="text-[11px] font-semibold text-tx-primary">
            {activeOfficer?.name ?? 'Select Officer'}
          </span>
          <span className="text-[9px] text-tx-muted font-mono">
            {activeOfficer?.station ?? '—'}
          </span>
        </div>
        <AltitudeBadge altitude={altitude} />
        <ChevronDown
          size={12}
          className={`text-tx-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="
            absolute top-full left-0 mt-1 w-72 z-50 rounded
            glass-panel border border-intel-cyan/15
            animate-slide-down shadow-deck-glow-lg overflow-hidden
          "
        >
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-[9px] font-mono uppercase tracking-widest text-tx-muted">
              Select Officer Persona
            </p>
          </div>
          <ul className="py-1" role="listbox">
            {officers.map(officer => {
              const isActive = officer.id === activeOfficerId;
              const offAltitude = ALTITUDE_FOR_ROLE[officer.role] ?? 'field_io';
              return (
                <li key={officer.id} role="option" aria-selected={isActive}>
                  <button
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5
                      text-left transition-colors duration-100
                      ${isActive
                        ? 'bg-intel-cyan/10 text-intel-cyan'
                        : 'hover:bg-deck-elevated text-tx-secondary hover:text-tx-primary'
                      }
                    `}
                    onClick={() => { onSelect(officer); setOpen(false); }}
                  >
                    {/* Avatar */}
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                      ${isActive ? 'bg-intel-cyan/20 text-intel-cyan' : 'bg-deck-panel text-tx-muted'}
                    `}>
                      {officer.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>

                    {/* Name + station */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{officer.name}</p>
                      <p className="text-[9px] font-mono text-tx-muted truncate">
                        {officer.station} · {officer.activeCaseCount} active
                      </p>
                    </div>

                    <AltitudeBadge altitude={offAltitude} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main DeckTopbar ───────────────────────────────────────────────────────────
export function DeckTopbar({ language, onLanguageToggle, onSearchTrigger }: DeckTopbarProps) {
  const {
    altitude,
    activeOfficerId,
    activeStation,
    isOfflineMode,
    backendStatus,
    setAltitude,
    setOfflineMode,
    setBackendStatus,
  } = useCommandDeckStore();

  const api = useIntelClient();

  // Load officer roster (5-min stale, works offline via mockClient)
  const { data: officers = [] } = useQuery<OfficerWithWorkload[]>({
    queryKey: ['officers', isOfflineMode],
    queryFn: () => api.getOfficers(),
    staleTime: 5 * 60 * 1000,
  });

  // One-time backend health check on mount
  useEffect(() => {
    setBackendStatus('checking');
    fetch('/api/analytics/summary', { signal: AbortSignal.timeout(4000) })
      .then(() => setBackendStatus('online'))
      .catch(() => {
        setBackendStatus('offline');
        // Auto-engage offline mode if backend unreachable
        setOfflineMode(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOfficerSelect = (officer: OfficerWithWorkload) => {
    const newAltitude = ALTITUDE_FOR_ROLE[officer.role] ?? 'field_io';
    // Update store — setAltitude also switches lensMode automatically
    setAltitude(newAltitude);
    // Patch activeOfficerId directly (store action available via immer-style set)
    useCommandDeckStore.setState({ activeOfficerId: officer.id, activeStation: officer.station });
  };

  const handleConnectivityToggle = () => {
    if (isOfflineMode) {
      // Re-attempt connection
      setBackendStatus('checking');
      fetch('/api/analytics/summary', { signal: AbortSignal.timeout(4000) })
        .then(() => { setBackendStatus('online'); setOfflineMode(false); })
        .catch(() => { setBackendStatus('offline'); });
    } else {
      setOfflineMode(true);
    }
  };

  return (
    <header
      id="kestrel-deck-topbar"
      className="hud-bar h-12 flex items-center px-4 gap-4 shrink-0 z-40 relative"
      role="banner"
    >
      {/* ── Brand Crest ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0 select-none">
        <KestrelCrest size={22} />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold font-mono tracking-widest text-tx-cyan">
            KESTREL
          </span>
          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border border-intel-cyan/20 text-tx-muted tracking-wider">
            CIOS
          </span>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="h-5 w-px bg-white/8 shrink-0" />

      {/* ── Officer Switcher ──────────────────────────────────────────────── */}
      <OfficerDropdown
        officers={officers}
        activeOfficerId={activeOfficerId}
        altitude={altitude}
        onSelect={handleOfficerSelect}
      />

      {/* ── Station Breadcrumb ────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-1.5 shrink-0">
        <MapPin size={11} className="text-intel-cyan/60" />
        <span className="text-[10px] font-mono text-tx-muted tracking-wide">
          {activeStation} PS
        </span>
      </div>

      {/* ── Spacer ────────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Search Trigger ────────────────────────────────────────────────── */}
      <button
        id="kestrel-search-trigger"
        onClick={onSearchTrigger}
        title="Global Search (Cmd+K)"
        className="
          hidden sm:flex items-center gap-2 px-3 py-1.5 rounded
          border border-white/8 hover:border-intel-cyan/30
          bg-deck-panel/40 hover:bg-deck-panel
          text-tx-muted hover:text-tx-secondary
          text-[11px] font-mono transition-all duration-150
          group
        "
      >
        <Search size={12} className="group-hover:text-intel-cyan transition-colors" />
        <span className="hidden lg:inline">Search FIR, suspect…</span>
        <kbd className="hidden lg:inline px-1 py-0.5 text-[9px] rounded border border-white/8 text-tx-muted bg-deck-deep/60">
          ⌘K
        </kbd>
      </button>

      {/* ── Language Toggle ───────────────────────────────────────────────── */}
      <button
        id="kestrel-language-toggle"
        onClick={onLanguageToggle}
        title={language === 'en' ? 'Switch to Kannada' : 'Switch to English'}
        className="
          flex items-center px-2.5 py-1.5 rounded
          border border-white/8 hover:border-intel-cyan/30
          bg-deck-panel/40 hover:bg-deck-panel
          text-[10px] font-bold font-mono text-tx-muted hover:text-intel-cyan
          transition-all duration-150 shrink-0
        "
      >
        {language === 'en' ? 'ಕನ್ನಡ' : 'EN'}
      </button>

      {/* ── Connectivity Status Pill ──────────────────────────────────────── */}
      <StatusPill
        backendStatus={backendStatus}
        isOfflineMode={isOfflineMode}
        onToggle={handleConnectivityToggle}
      />

      {/* ── Backend Icon (small screen) ───────────────────────────────────── */}
      <div className="sm:hidden shrink-0">
        {isOfflineMode
          ? <WifiOff size={14} className="text-intel-crimson" />
          : <Wifi size={14} className="text-intel-emerald" />
        }
      </div>
    </header>
  );
}

export default DeckTopbar;
