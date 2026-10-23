import React from 'react';
import {
  ArrowLeft,
  Pin,
  FileText,
  MapPin,
  Network,
  BookOpen,
} from 'lucide-react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import type { FIRCase, CaseSubLens } from '@kestrel/shared';

interface CaseNexusHeaderProps {
  firCase: FIRCase;
}

const SUB_LENS_TABS: { id: CaseSubLens; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'dossier',         label: 'Dossier & Evidence', icon: <BookOpen size={13} />,  shortcut: 'Alt+1' },
  { id: 'scene_gis',       label: 'Crime Scene GIS',    icon: <MapPin size={13} />,    shortcut: 'Alt+2' },
  { id: 'syndicate_graph', label: 'Syndicate Network',  icon: <Network size={13} />,   shortcut: 'Alt+3' },
];

export function CaseNexusHeader({ firCase }: CaseNexusHeaderProps) {
  const closeCaseNexus  = useCommandDeckStore((s) => s.closeCaseNexus);
  const setCaseSubLens  = useCommandDeckStore((s) => s.setCaseSubLens);
  const caseSubLens     = useCommandDeckStore((s) => s.caseSubLens);
  const pinItem         = useCommandDeckStore((s) => s.pinItem);
  const pinnedItemIds   = useCommandDeckStore((s) => s.pinnedItemIds);

  const isPinned = pinnedItemIds.includes(firCase.id);

  const priorityTheme =
    firCase.priority === 'Critical'
      ? 'bg-red-500/20 text-red-400 border-red-500/40'
      : firCase.priority === 'High'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';

  return (
    <header className="flex-shrink-0 border-b border-white/10 bg-gradient-to-r from-[#071325] via-[#090e1b] to-[#050b14]">
      {/* Top row: back + FIR + priority + acts + IO + pin + brief */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-wrap">
        {/* Back */}
        <button
          onClick={closeCaseNexus}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Docket</span>
        </button>

        <div className="h-4 w-px bg-white/10" />

        {/* FIR Badge */}
        <span className="font-mono text-sm font-bold text-white tracking-wide">
          {firCase.firNumber}
        </span>

        {/* Crime Category */}
        <span className="text-sm text-slate-300 font-semibold truncate max-w-[200px]">
          {firCase.crimeCategory}
        </span>

        {/* Priority */}
        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border font-bold ${priorityTheme}`}>
          {firCase.priority}
        </span>

        {/* Applicable Acts */}
        <div className="flex items-center gap-1 flex-wrap">
          {(firCase.applicableActs || []).slice(0, 3).map((act, i) => (
            <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
              {act}
            </span>
          ))}
          {(firCase.applicableActs || []).length > 3 && (
            <span className="text-[10px] font-mono text-slate-500">+{firCase.applicableActs.length - 3}</span>
          )}
        </div>

        {/* IO Name */}
        {firCase.investigatingOfficerName && (
          <>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs text-slate-400 flex-shrink-0">
              IO: <span className="text-slate-200 font-medium">{firCase.investigatingOfficerName}</span>
            </span>
          </>
        )}

        {/* Station */}
        <span className="text-xs text-slate-500 flex-shrink-0">
          {firCase.policeStation} PS
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pin Button */}
        <button
          onClick={() => pinItem(firCase.id)}
          title={isPinned ? 'Pinned to Caseboard' : 'Pin to Caseboard'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
            isPinned
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
              : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          <span>{isPinned ? 'Pinned' : 'Pin'}</span>
        </button>

        {/* Court Brief (Phase 5) */}
        <button
          onClick={() => alert('Court Dossier PDF generation will be available in Phase 5.')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border bg-slate-800/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Court Brief</span>
        </button>
      </div>

      {/* Sub-Lens Tabs */}
      <nav className="flex items-center gap-1 px-4 py-2" role="tablist">
        {SUB_LENS_TABS.map((tab) => {
          const isActive = caseSubLens === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setCaseSubLens(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono tracking-wider transition-all duration-150 ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10'
              }`}
              title={`${tab.label} (${tab.shortcut})`}
            >
              {tab.icon}
              {tab.label}
              <kbd className="ml-1 text-[8px] opacity-50">{tab.shortcut}</kbd>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-px bg-cyan-400" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
