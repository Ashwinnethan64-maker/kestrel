import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { useIntelClient } from '@/services/api/intelClient';
import { CaseNexusHeader } from './CaseNexusHeader';
import { CaseDossierSubLens } from './CaseDossierSubLens';
import { CaseGisSubLens } from './CaseGisSubLens';
import { CaseNetworkSubLens } from './CaseNetworkSubLens';
import type { AccusedSuspect } from '@kestrel/shared';

export function CaseNexusLens() {
  const activeCaseId   = useCommandDeckStore((s) => s.activeCaseId);
  const caseSubLens    = useCommandDeckStore((s) => s.caseSubLens);
  const client         = useIntelClient();

  // Fetch the specific case
  const {
    data: firCase,
    isLoading: caseLoading,
    error: caseError,
  } = useQuery({
    queryKey: ['case', activeCaseId],
    queryFn: () => client.getCaseById(activeCaseId!),
    enabled: !!activeCaseId,
  });

  // Fetch all suspects (needed for dossier accused cards + GIS suspect pins)
  const { data: suspects = [] } = useQuery({
    queryKey: ['suspects'],
    queryFn: () => client.getSuspects(),
  });

  // Fetch evidence for this case
  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence', activeCaseId],
    queryFn: () => client.getEvidence(activeCaseId!),
    enabled: !!activeCaseId,
  });

  // Suspects map for quick lookup
  const suspectsMap = useMemo(() => {
    const map = new Map<string, AccusedSuspect>();
    for (const s of suspects) map.set(s.id, s);
    return map;
  }, [suspects]);

  // Suspects involved in this case
  const caseSuspects = useMemo(() => {
    if (!firCase) return [];
    return (firCase.accusedIds || [])
      .map((id) => suspectsMap.get(id))
      .filter((s): s is AccusedSuspect => !!s);
  }, [firCase, suspectsMap]);

  if (caseLoading) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-400 bg-[#050b14]">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <span className="font-mono text-sm tracking-widest text-cyan-400">LOADING CASE NEXUS...</span>
      </div>
    );
  }

  if (caseError || !firCase) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-red-400 bg-[#050b14]">
        <AlertOctagon className="w-10 h-10" />
        <span className="font-mono text-sm">Case {activeCaseId} not found</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050b14]">
      <CaseNexusHeader firCase={firCase} />

      <div className="flex-1 min-h-0 overflow-hidden">
        {caseSubLens === 'dossier' && (
          <CaseDossierSubLens
            firCase={firCase}
            suspects={caseSuspects}
            evidence={evidence}
          />
        )}
        {caseSubLens === 'scene_gis' && (
          <CaseGisSubLens
            firCase={firCase}
            suspects={caseSuspects}
          />
        )}
        {caseSubLens === 'syndicate_graph' && (
          <CaseNetworkSubLens
            firCase={firCase}
            suspects={suspects}
          />
        )}
      </div>
    </div>
  );
}
