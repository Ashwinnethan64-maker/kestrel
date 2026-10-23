import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertOctagon,
  Clock,
  Layers,
} from 'lucide-react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { useIntelClient } from '@/services/api/intelClient';
import { DocketCaseCard } from './DocketCaseCard';
import { ShiftTaskList } from './ShiftTaskList';
import type { AccusedSuspect, FIRCase } from '@kestrel/shared';

export function DocketLens() {
  const activeOfficerId = useCommandDeckStore((s) => s.activeOfficerId);
  const activeOfficer = useCommandDeckStore((s) => s.activeOfficer);
  const openCaseNexus = useCommandDeckStore((s) => s.openCaseNexus);
  const altitude = useCommandDeckStore((s) => s.altitude);

  const client = useIntelClient();

  // Load cases
  const {
    data: cases = [],
    isLoading: isCasesLoading,
    error: casesError,
  } = useQuery({
    queryKey: ['cases', activeOfficerId, altitude],
    queryFn: () => {
      // If Field IO, fetch their assigned cases. If Commander, fetch all station/city cases
      if (altitude === 'field_io' && activeOfficerId) {
        return client.getCases({ investigatingOfficerId: activeOfficerId });
      }
      return client.getCases();
    },
  });

  // Load accused suspects to resolve prime accused per case
  const { data: suspects = [] } = useQuery({
    queryKey: ['suspects'],
    queryFn: () => client.getSuspects(),
  });

  const suspectsMap = useMemo(() => {
    const map = new Map<string, AccusedSuspect>();
    for (const suspect of suspects) {
      map.set(suspect.id, suspect);
    }
    return map;
  }, [suspects]);

  // Greeting logic
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Categorize cases into columns
  const { criticalCases, inProgressCases, statutoryUrgentCases } = useMemo(() => {
    const critical: FIRCase[] = [];
    const inProgress: FIRCase[] = [];

    cases.forEach((c) => {
      if (c.priority === 'Critical') {
        critical.push(c);
      } else {
        inProgress.push(c);
      }
    });

    // Statutory urgency: sort all cases by urgency (shortest remaining statutory clock first)
    const sortedByStatutory = [...cases].sort((a, b) => {
      const actsA = a.applicableActs || (a as unknown as { actsApplicable?: string[] }).actsApplicable || [];
      const actsB = b.applicableActs || (b as unknown as { actsApplicable?: string[] }).actsApplicable || [];
      const isHeinousA =
        a.priority === 'Critical' ||
        actsA.some((act) => act.includes('302') || act.includes('392'));
      const isHeinousB =
        b.priority === 'Critical' ||
        actsB.some((act) => act.includes('302') || act.includes('392'));

      const limitA = isHeinousA ? 90 : 60;
      const limitB = isHeinousB ? 90 : 60;

      const elapsedA = Math.floor(
        (Date.now() - new Date(a.incidentDate || a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const elapsedB = Math.floor(
        (Date.now() - new Date(b.incidentDate || b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      const remA = limitA - elapsedA;
      const remB = limitB - elapsedB;

      return remA - remB;
    });

    return {
      criticalCases: critical,
      inProgressCases: inProgress,
      statutoryUrgentCases: sortedByStatutory,
    };
  }, [cases]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050b14] overflow-hidden text-slate-100">
      {/* 1. Officer Greeting & Tactical Status Banner */}
      <div className="relative border-b border-white/10 bg-gradient-to-r from-[#071325] via-[#09172c] to-[#050b14] px-6 py-4 flex-shrink-0">
        <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                TACTICAL MORNING DOCKET
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-mono">{todayStr}</span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>
                {greeting},{' '}
                <span className="text-cyan-400">
                  {activeOfficer?.name || (altitude === 'commander' ? 'DCP Ramesh' : 'Inspector Patil')}
                </span>
              </span>
            </h1>

            <p className="text-xs text-slate-400 mt-0.5">
              Station:{' '}
              <span className="text-slate-300 font-medium">
                {activeOfficer?.station || (altitude === 'commander' ? 'Bengaluru Central Command' : 'Indiranagar PS')}
              </span>
              <span className="mx-2 text-slate-600">|</span>
              Active Docket Cases: <span className="text-cyan-400 font-semibold">{cases.length}</span>
              <span className="mx-2 text-slate-600">|</span>
              Remand Watch:{' '}
              <span className="text-red-400 font-semibold">
                {cases.filter((c) => c.priority === 'Critical').length} Critical
              </span>
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-mono">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <div>
                <div className="font-bold">{criticalCases.length}</div>
                <div className="text-[10px] text-red-400/70 uppercase">Critical FIRs</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-bold">{inProgressCases.length}</div>
                <div className="text-[10px] text-cyan-400/70 uppercase">In Progress</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs font-mono">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <div className="font-bold">{statutoryUrgentCases.length}</div>
                <div className="text-[10px] text-amber-400/70 uppercase">Remand Clocks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tactical Content Area: Shift Tasks + 3-Column Docket */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Shift Tasks Checklist */}
        <ShiftTaskList cases={cases} />

        {/* 3-Column Tactical Docket Grid */}
        {isCasesLoading ? (
          <div className="py-16 flex items-center justify-center flex-col gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="font-mono text-xs tracking-wider text-cyan-400">
              SYNCHRONIZING DOCKET LEDGER...
            </span>
          </div>
        ) : casesError ? (
          <div className="py-16 flex items-center justify-center flex-col gap-2 text-red-400">
            <AlertOctagon className="w-8 h-8" />
            <span className="font-mono text-sm">Failed to load docket cases</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
            {/* Column 1: Critical & Violent */}
            <div className="flex flex-col h-full bg-[#080f1a]/70 rounded-xl border border-red-500/20 overflow-hidden">
              <div className="p-3.5 border-b border-red-500/20 bg-red-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-mono text-xs font-bold text-red-400 tracking-wider uppercase">
                    Critical & Violent
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                  {criticalCases.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {criticalCases.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No active critical cases assigned
                  </div>
                ) : (
                  criticalCases.map((c) => (
                    <DocketCaseCard
                      key={c.id}
                      firCase={c}
                      primeAccused={c.accusedIds?.[0] ? suspectsMap.get(c.accusedIds[0]) : null}
                      onOpenCase={openCaseNexus}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 2: In Progress & General Investigation */}
            <div className="flex flex-col h-full bg-[#080f1a]/70 rounded-xl border border-cyan-500/20 overflow-hidden">
              <div className="p-3.5 border-b border-cyan-500/20 bg-cyan-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h3 className="font-mono text-xs font-bold text-cyan-300 tracking-wider uppercase">
                    In Progress Investigation
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                  {inProgressCases.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {inProgressCases.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No general cases currently open
                  </div>
                ) : (
                  inProgressCases.map((c) => (
                    <DocketCaseCard
                      key={c.id}
                      firCase={c}
                      primeAccused={c.accusedIds?.[0] ? suspectsMap.get(c.accusedIds[0]) : null}
                      onOpenCase={openCaseNexus}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Statutory Remand Deadlines */}
            <div className="flex flex-col h-full bg-[#080f1a]/70 rounded-xl border border-amber-500/20 overflow-hidden">
              <div className="p-3.5 border-b border-amber-500/20 bg-amber-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="font-mono text-xs font-bold text-amber-300 tracking-wider uppercase">
                    Statutory Remand Clocks
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  {statutoryUrgentCases.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {statutoryUrgentCases.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No statutory deadlines pending
                  </div>
                ) : (
                  statutoryUrgentCases.map((c) => (
                    <DocketCaseCard
                      key={c.id}
                      firCase={c}
                      primeAccused={c.accusedIds?.[0] ? suspectsMap.get(c.accusedIds[0]) : null}
                      onOpenCase={openCaseNexus}
                      highlightStatutory
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
