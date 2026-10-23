import React, { useEffect, useState } from 'react';
import { useInvestigationContext } from './store/useInvestigationContext';
import { apiClient } from './services/api/client';
import { FIRCase } from '@kestrel/shared';
import {
  ShieldAlert,
  MapPin,
  Share2,
  FileText,
  Search,
  Radio,
  Clock,
  Mic,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react';

export function App() {
  const {
    lensMode,
    setLensMode,
    filters,
    setFilters,
    activeCaseId,
    setActiveCase,
    pinnedItemIds
  } = useInvestigationContext();

  const [cases, setCases] = useState<FIRCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getCases(filters).then((res) => {
      setCases(res.data);
      setLoading(false);
    });
  }, [filters]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050b14] text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP TACTICAL HUD */}
      <header className="h-14 border-b border-white/10 bg-[#0a1322]/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold tracking-wider text-base">
            <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-mono">
              SENTINEL // CIOS
            </span>
          </div>
          <span className="h-4 w-[1px] bg-white/20"></span>
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900/80 border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-300">JURISDICTION:</span>
            <span className="text-cyan-300 font-semibold">BENGALURU CITY POLICE</span>
          </div>
        </div>

        {/* Tactical Search Bar */}
        <div className="flex-1 max-w-md mx-6">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search FIR #, Suspect Alias, IPC Act, Vehicle Plate... (Cmd+K)"
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              className="w-full bg-slate-950/70 border border-white/10 rounded-md pl-9 pr-16 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-all"
            />
            <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 border border-white/10 rounded font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2 px-3 py-1 rounded bg-slate-900 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>MISSION: ACTIVE PATROL</span>
          </div>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded transition-colors">
            <Mic className="w-3.5 h-3.5" />
            <span>PUSH-TO-TALK [SPACE]</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN SPLIT DECK */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center Tactical Lens Surface */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#050b14] relative">
          {/* Lens Selector Mode Bar */}
          <div className="h-11 border-b border-white/10 bg-[#0a1322]/60 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1 p-0.5 bg-slate-950/80 rounded-md border border-white/10 text-xs font-mono">
              <button
                onClick={() => setLensMode('geo')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
                  lensMode === 'geo'
                    ? 'bg-cyan-500 text-black font-semibold shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>[1] GEO-MAP GIS</span>
              </button>
              <button
                onClick={() => setLensMode('network')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
                  lensMode === 'network'
                    ? 'bg-cyan-500 text-black font-semibold shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>[2] NETWORK GRAPH</span>
              </button>
              <button
                onClick={() => setLensMode('dossier')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
                  lensMode === 'dossier'
                    ? 'bg-cyan-500 text-black font-semibold shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>[3] FIR DOSSIER</span>
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
              <span>ACTIVE INCIDENTS: <b className="text-cyan-400">{cases.length}</b></span>
              <span className="text-white/20">|</span>
              <span>PINNED CLUES: <b className="text-amber-400">{pinnedItemIds.length}</b></span>
            </div>
          </div>

          {/* Tactical Canvas Viewport */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-cyan-400 font-mono text-sm animate-pulse">
                INITIALIZING TACTICAL DATA BUS...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((c) => {
                  const isSelected = activeCaseId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveCase(c.id)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0f1d33] border-cyan-400 shadow-lg shadow-cyan-500/10'
                          : 'bg-[#0a1322]/80 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-cyan-400 font-bold">{c.firNumber}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                            c.priority === 'Critical'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-slate-100 mb-1">{c.crimeCategory}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{c.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-white/5 pt-2">
                        <span>{c.policeStation}</span>
                        <span>{new Date(c.incidentDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Right Ambient Copilot Drawer */}
        <aside className="w-80 border-l border-white/10 bg-[#0a1322]/95 flex flex-col shrink-0">
          <div className="h-11 border-b border-white/10 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AMBIENT COPILOT</span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] font-mono bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded">
              <span className="text-cyan-400 font-bold">KN</span>
              <span className="text-white/20">/</span>
              <span className="text-slate-400">EN</span>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs">
            <div className="p-3 rounded bg-red-950/30 border border-red-500/30 text-slate-300">
              <div className="flex items-center space-x-1.5 text-red-400 font-bold text-[11px] mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>TACTICAL ANOMALY FLASH</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Vehicle theft cluster detected in K.R. Puram. Stolen black sedan (KA-04-E-1234) matches getaway vehicle sighted in Indiranagar Armed Robbery.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-900/80 border border-white/10 text-slate-400 text-[11px]">
              <span className="text-cyan-400 font-semibold block mb-1">PROMPT SUGGESTIONS:</span>
              <ul className="space-y-1 text-slate-400">
                <li className="hover:text-cyan-300 cursor-pointer">→ "Show all active associates of Raju Nayak"</li>
                <li className="hover:text-cyan-300 cursor-pointer">→ "Analyze burglary MO in Indiranagar sector"</li>
                <li className="hover:text-cyan-300 cursor-pointer">→ "Generate classified dossier brief"</li>
              </ul>
            </div>
          </div>

          {/* Quick Copilot Input Box */}
          <div className="p-3 border-t border-white/10 bg-slate-950">
            <div className="flex items-center bg-slate-900 border border-white/10 rounded px-2 py-1.5">
              <input
                type="text"
                placeholder="Ask intelligence copilot..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
              />
              <button className="text-cyan-400 hover:text-cyan-300">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM TEMPORAL INCIDENT SCRUBBER */}
      <footer className="h-12 border-t border-white/10 bg-[#050b14] px-4 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <button className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-white/10">
            <Play className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/10">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-400 text-[11px]">OCT 01, 2024</span>
        </div>

        {/* Scrubber Track */}
        <div className="flex-1 mx-6 flex items-center">
          <div className="w-full h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
            <div className="h-full bg-cyan-500 w-3/4 rounded-full"></div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>PLAYHEAD: <b className="text-cyan-300">LIVE HEAD (OCT 23)</b></span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-cyan-400 font-bold">
            1X
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
