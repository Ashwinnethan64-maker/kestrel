import React, { useCallback, useState } from 'react';
import {
  ClipboardList,
  Crosshair,
  Globe,
  FileText,
  Map,
  Network,
  Clock,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from 'lucide-react';
import type { DeckLensMode, CaseSubLens, CommandAltitude } from '@kestrel/shared';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { DeckTopbar } from './DeckTopbar';
import { CommandPalette } from './CommandPalette';
import { useKeyboardBus } from '@/hooks/useKeyboardBus';
import { DocketLens } from '../docket/DocketLens';
import { CaseNexusLens } from '../lenses/CaseNexusLens';
import { ZonalStrategicLens } from '../zonal/ZonalStrategicLens';
import { AmbientCopilot } from '../copilot/AmbientCopilot';
import { TemporalScrubber } from './TemporalScrubber';

// ── Lens mode tab definitions ─────────────────────────────────────────────────
const LENS_TABS: { mode: DeckLensMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { mode: 'morning_docket', label: 'DOCKET',      icon: <ClipboardList size={13} />, shortcut: '1' },
  { mode: 'case_nexus',     label: 'CASE NEXUS',   icon: <Crosshair size={13} />,     shortcut: '2' },
  { mode: 'zonal_radar',    label: 'ZONAL RADAR',  icon: <Globe size={13} />,          shortcut: '3' },
];

const SUB_LENS_TABS: { sub: CaseSubLens; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { sub: 'dossier',          label: 'DOSSIER',          icon: <FileText size={11} />,  shortcut: 'Alt+1' },
  { sub: 'scene_gis',        label: 'SCENE GIS',        icon: <Map size={11} />,       shortcut: 'Alt+2' },
  { sub: 'syndicate_graph',  label: 'SYNDICATE GRAPH',  icon: <Network size={11} />,   shortcut: 'Alt+3' },
];

// ── Lens placeholder panels ───────────────────────────────────────────────────
function LensPlaceholder({
  title,
  description,
  icon,
  accentColor,
  phase,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  phase: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Scan-line decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-intel-cyan/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-intel-cyan/20 to-transparent" />
        {/* Animated scan line */}
        <div
          className="absolute left-0 right-0 h-px opacity-30 animate-pulse-slow"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
            top: '33%',
          }}
        />
        <div
          className="absolute left-0 right-0 h-px opacity-20 animate-pulse-slow"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
            top: '66%',
            animationDelay: '1s',
          }}
        />
        {/* Corner brackets */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l border-t" style={{ borderColor: `${accentColor}30` }} />
        <div className="absolute top-4 right-4 w-6 h-6 border-r border-t" style={{ borderColor: `${accentColor}30` }} />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-l border-b" style={{ borderColor: `${accentColor}30` }} />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-r border-b" style={{ borderColor: `${accentColor}30` }} />
      </div>

      <div className="text-center z-10">
        <div className="flex justify-center mb-4" style={{ color: accentColor }}>
          {icon}
        </div>
        <h2 className="text-lg font-bold font-mono tracking-wider mb-2" style={{ color: accentColor }}>
          {title}
        </h2>
        <p className="text-sm text-tx-secondary max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono"
          style={{ borderColor: `${accentColor}30`, color: `${accentColor}cc`, background: `${accentColor}08` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-beacon-ping" style={{ background: accentColor }} />
          Implementation in {phase}
        </div>
      </div>
    </div>
  );
}

function DocketPlaceholder({ altitude }: { altitude: CommandAltitude }) {
  return (
    <LensPlaceholder
      title="MORNING DOCKET"
      description={
        altitude === 'field_io'
          ? 'Your daily shift launchpad — assigned FIRs, urgent tasks, and statutory custody deadlines at a glance.'
          : 'Station-level case overview and IO assignment dashboard.'
      }
      icon={<ClipboardList size={36} />}
      accentColor="#06b6d4"
      phase="Phase 2"
    />
  );
}

function CaseNexusPlaceholder({ caseId, subLens }: { caseId: string | null; subLens: CaseSubLens }) {
  const subLensLabels: Record<CaseSubLens, { title: string; desc: string; color: string }> = {
    dossier: {
      title: 'EVIDENTIARY DOSSIER',
      desc: 'Case registration, witness statements, seizure vault, and in-case action checklist.',
      color: '#06b6d4',
    },
    scene_gis: {
      title: 'CRIME SCENE GIS',
      desc: 'Leaflet tactical map with pulsing radar beacon, 500m/1km surveillance radius, and nearby offender markers.',
      color: '#10b981',
    },
    syndicate_graph: {
      title: 'SYNDICATE GRAPH',
      desc: 'Ego-network visualization of co-accused, shared vehicles, and stolen property receivers.',
      color: '#8b5cf6',
    },
  };
  const info = subLensLabels[subLens];
  return (
    <LensPlaceholder
      title={info.title}
      description={`${info.desc}${caseId ? ` Active case: ${caseId}` : ''}`}
      icon={subLens === 'dossier' ? <FileText size={36} /> : subLens === 'scene_gis' ? <Map size={36} /> : <Network size={36} />}
      accentColor={info.color}
      phase={subLens === 'dossier' ? 'Phase 2' : 'Phase 3'}
    />
  );
}

function ZonalRadarPlaceholder() {
  return (
    <LensPlaceholder
      title="ZONAL STRATEGIC RADAR"
      description="City-wide PostGIS incident density heatmap, cross-station syndicate topology, and station clearance matrix."
      icon={<Globe size={36} />}
      accentColor="#f59e0b"
      phase="Phase 3"
    />
  );
}

// ── Copilot Placeholder ───────────────────────────────────────────────────────
function CopilotRailPlaceholder() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-intel-cyan animate-beacon-ping" />
        <span className="text-[11px] font-mono font-bold text-intel-cyan tracking-widest">AMBIENT COPILOT</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full border border-intel-cyan/20 flex items-center justify-center">
            <Crosshair size={18} className="text-intel-cyan/50" />
          </div>
          <p className="text-xs text-tx-secondary font-medium">Tactical AI Copilot</p>
          <p className="text-[10px] text-tx-muted mt-1 max-w-48 mx-auto">
            Context-aware intelligence streaming, FIR citations, and bilingual analysis.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded border border-intel-cyan/15 text-[9px] font-mono text-intel-cyan/60 bg-intel-cyan/5">
            <span className="w-1 h-1 rounded-full bg-intel-cyan animate-beacon-ping" />
            Phase 3
          </div>
        </div>
      </div>

      {/* Input placeholder */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-white/8 bg-deck-deep/60">
          <span className="text-[11px] text-tx-muted font-mono">Query or command…</span>
        </div>
      </div>
    </div>
  );
}



// ── DeckShell Main ────────────────────────────────────────────────────────────
export function DeckShell() {
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const {
    altitude,
    lensMode,
    caseSubLens,
    activeCaseId,
    setLensMode,
    setCaseSubLens,
    closeCaseNexus,
  } = useCommandDeckStore();

  // Keyboard bus
  const handleEscape = useCallback(() => {
    if (paletteOpen) {
      setPaletteOpen(false);
    } else if (lensMode === 'case_nexus') {
      closeCaseNexus();
    }
  }, [paletteOpen, lensMode, closeCaseNexus]);

  useKeyboardBus({
    onSearchTrigger: () => setPaletteOpen(true),
    onEscape: handleEscape,
  });

  return (
    <div
      id="kestrel-deck-shell"
      style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#050b14', color: '#f8fafc' }}
      className="flex flex-col h-screen w-screen bg-deck-deep text-tx-primary overflow-hidden bg-tactical-grid"
    >
      {/* ── Top HUD Bar ──────────────────────────────────────────────────── */}
      <DeckTopbar
        language={language}
        onLanguageToggle={() => setLanguage(l => (l === 'en' ? 'kn' : 'en'))}
        onSearchTrigger={() => setPaletteOpen(true)}
      />

      {/* ── Lens Mode Tabs ───────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 px-4 h-9 border-b border-white/5 bg-deck-surface/60 shrink-0" role="tablist">
        {LENS_TABS.map(tab => {
          const isActive = lensMode === tab.mode;
          const isDisabled = tab.mode === 'case_nexus' && !activeCaseId;

          return (
            <button
              key={tab.mode}
              role="tab"
              aria-selected={isActive}
              disabled={isDisabled}
              onClick={() => setLensMode(tab.mode)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-semibold tracking-wider
                transition-all duration-150 relative
                ${isActive
                  ? 'text-intel-cyan bg-intel-cyan/10'
                  : isDisabled
                    ? 'text-tx-muted/40 cursor-not-allowed'
                    : 'text-tx-muted hover:text-tx-secondary hover:bg-deck-panel/40'
                }
              `}
              title={isDisabled ? 'Select a case first' : `Switch to ${tab.label} (${tab.shortcut})`}
            >
              {tab.icon}
              {tab.label}
              <kbd className="ml-1 text-[8px] text-tx-muted/50">{tab.shortcut}</kbd>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-px bg-intel-cyan" />
              )}
            </button>
          );
        })}

        {/* Sub-lens tabs — visible only in Case Nexus mode */}
        {lensMode === 'case_nexus' && (
          <>
            <div className="h-4 w-px bg-white/8 mx-2" />
            {SUB_LENS_TABS.map(tab => {
              const isActive = caseSubLens === tab.sub;
              return (
                <button
                  key={tab.sub}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCaseSubLens(tab.sub)}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono tracking-wider
                    transition-all duration-150
                    ${isActive
                      ? 'text-intel-cyan bg-intel-cyan/8'
                      : 'text-tx-muted hover:text-tx-secondary hover:bg-deck-panel/30'
                    }
                  `}
                  title={`${tab.label} (${tab.shortcut})`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* ── Main Split: Tactical Lens (65%) + Copilot Rail (35%) ──────── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Tactical Lens Canvas */}
        <main className="flex-1 lg:flex-[65] flex flex-col min-w-0 border-r border-white/5 overflow-hidden" role="main">
          {lensMode === 'morning_docket' && <DocketLens />}
          {lensMode === 'case_nexus' && <CaseNexusLens />}
          {lensMode === 'zonal_radar' && <ZonalStrategicLens />}
        </main>

        {/* Ambient Copilot Rail */}
        <aside className="h-64 lg:h-full lg:flex-[35] min-w-0 bg-deck-surface/40 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 lg:shrink" role="complementary">
          <AmbientCopilot />
        </aside>
      </div>

      {/* ── Bottom Temporal Scrubber ──────────────────────────────────────── */}
      <TemporalScrubber />

      {/* ── Command Palette Modal ──────────────────────────────────────── */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default DeckShell;
