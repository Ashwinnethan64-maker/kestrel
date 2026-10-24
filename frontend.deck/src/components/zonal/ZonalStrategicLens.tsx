import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIntelClient } from '@/services/api/intelClient';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { ZonalHeatmapSubLens } from './ZonalHeatmapSubLens';
import { ZonalSyndicateCanvas } from './ZonalSyndicateCanvas';
import { StationClearanceMatrix } from './StationClearanceMatrix';
import {
  Globe,
  Network,
  Scale,
  Shield,
  Loader2,
  AlertOctagon,
  Crosshair,
} from 'lucide-react';

type ZonalTab = 'heatmap' | 'syndicates' | 'clearance';

export const ZonalStrategicLens: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ZonalTab>('heatmap');
  const [activeSyndicateFilter, setActiveSyndicateFilter] = useState<string | null>(null);

  const client = useIntelClient();
  const openCaseNexus = useCommandDeckStore((s) => s.openCaseNexus);

  // 1. Fetch cases across the entire division
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases', 'zonal'],
    queryFn: () => client.getCases(),
  });

  // 2. Fetch suspects
  const { data: suspects = [] } = useQuery({
    queryKey: ['suspects', 'zonal'],
    queryFn: () => client.getSuspects(),
  });

  // 3. Fetch syndicates
  const { data: syndicates = [] } = useQuery({
    queryKey: ['syndicates'],
    queryFn: () => client.getSyndicates(),
  });

  if (casesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-400 bg-[#050b14] h-full">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
        <span className="font-mono text-sm tracking-widest text-amber-400">
          COMPILING ZONAL STRATEGIC RADAR...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050b14] text-slate-100 overflow-hidden">
      {/* ── High-Command Altitude Strategic Header Bar ─────────────────── */}
      <div className="relative border-b border-white/10 bg-gradient-to-r from-[#081528] via-[#091b35] to-[#050b14] px-6 py-3 flex items-center justify-between shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Globe className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold">
                DIVISIONAL COMMAND RADAR [DCP ALTITUDE]
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-mono">BENGALURU EAST DIVISION</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>Zonal Tactical Overview & Crime Syndicate Matrix</span>
            </h1>
          </div>
        </div>

        {/* Strategic Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-[#050b14]/80 p-1 rounded-lg border border-white/10 font-mono text-xs">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeTab === 'heatmap'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Heatmap & Patrol</span>
          </button>

          <button
            onClick={() => setActiveTab('syndicates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeTab === 'syndicates'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Inter-Station Syndicates</span>
          </button>

          <button
            onClick={() => setActiveTab('clearance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeTab === 'clearance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Clearance Matrix</span>
          </button>
        </div>
      </div>

      {/* ── Active Strategic Lens View ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'heatmap' && (
          <ZonalHeatmapSubLens
            cases={cases}
            activeSyndicateFilter={activeSyndicateFilter}
            onClearSyndicateFilter={() => setActiveSyndicateFilter(null)}
            onSelectCase={(caseId) => openCaseNexus(caseId)}
          />
        )}

        {activeTab === 'syndicates' && (
          <ZonalSyndicateCanvas
            syndicates={syndicates}
            suspects={suspects}
            activeSyndicateFilter={activeSyndicateFilter}
            onSelectSyndicate={(syndicateName) => {
              setActiveSyndicateFilter(syndicateName);
              // Switch to heatmap view with this syndicate applied
              setActiveTab('heatmap');
            }}
          />
        )}

        {activeTab === 'clearance' && (
          <StationClearanceMatrix
            cases={cases}
            suspects={suspects}
            onOpenCase={(caseId) => openCaseNexus(caseId)}
          />
        )}
      </div>
    </div>
  );
};
