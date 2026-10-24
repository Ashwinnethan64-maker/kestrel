import React, { useState } from 'react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { FIRCase, AccusedSuspect, CaseEvidence } from '@kestrel/shared';
import { CourtBriefModal } from './CourtBriefModal';
import {
  Pin,
  ChevronUp,
  ChevronDown,
  Printer,
  X,
  FileText,
  User,
  Shield,
  Layers,
} from 'lucide-react';

interface ActiveCaseboardProps {
  cases: FIRCase[];
  suspects: AccusedSuspect[];
  evidence: CaseEvidence[];
}

export const ActiveCaseboard: React.FC<ActiveCaseboardProps> = ({
  cases,
  suspects,
  evidence,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);

  const pinnedItemIds = useCommandDeckStore((s) => s.pinnedItemIds);
  const unpinItem = useCommandDeckStore((s) => s.unpinItem);
  const openCaseNexus = useCommandDeckStore((s) => s.openCaseNexus);
  const activeCaseId = useCommandDeckStore((s) => s.activeCaseId);

  // Match pinned items to objects
  const pinnedCases = cases.filter((c) => pinnedItemIds.includes(c.id));
  const pinnedSuspects = suspects.filter((s) => pinnedItemIds.includes(s.id));
  const pinnedEvidence = evidence.filter((e) => pinnedItemIds.includes(e.id));

  // Determine active case to populate court brief
  const currentCase = cases.find((c) => c.id === activeCaseId) || pinnedCases[0] || cases[0];

  return (
    <>
      <div className="border-t border-cyan-900/60 bg-[#071325]/95 backdrop-blur-md transition-all duration-200">
        {/* Tray Toggle Header Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Pin className="w-3.5 h-3.5 rotate-45" />
            </div>
            <span className="font-mono text-xs font-bold tracking-wider text-white uppercase">
              ACTIVE CASEBOARD
            </span>
            <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {pinnedItemIds.length} Pinned
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="text-[10px] font-mono text-slate-400">
              {isExpanded ? 'Collapse' : 'Expand Tray'}
            </span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded Slide-up Clues Tray */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 max-h-64 overflow-y-auto animate-fade-in border-t border-cyan-950/60 pt-2">
            {pinnedItemIds.length === 0 ? (
              <div className="text-center py-6 text-slate-500 font-mono text-xs">
                No clues or suspects pinned yet. Click the pin icon on any case card, accused profile, or evidence item to add to your caseboard.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {/* Pinned Cases */}
                {pinnedCases.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded bg-[#0a182d] border border-cyan-900/50 hover:border-cyan-500/50 transition-colors"
                  >
                    <div
                      onClick={() => openCaseNexus(c.id)}
                      className="cursor-pointer flex items-center gap-2 min-w-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {c.firNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">({c.crimeCategory})</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unpinItem(c.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Pinned Suspects */}
                {pinnedSuspects.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded bg-[#170a14] border border-rose-900/50 hover:border-rose-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {s.fullName}
                      </span>
                      <span className="text-[10px] text-rose-300 font-mono">[{s.riskLevel}]</span>
                    </div>
                    <button
                      onClick={() => unpinItem(s.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Pinned Evidence */}
                {pinnedEvidence.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2 rounded bg-[#0a182d] border border-emerald-900/50 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {e.title}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">[{e.evidenceType}]</span>
                    </div>
                    <button
                      onClick={() => unpinItem(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 1-Click Court Briefing PDF Export Button */}
            <button
              onClick={() => setIsCourtModalOpen(true)}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Export Court Briefing Dossier (PDF / Print)</span>
            </button>
          </div>
        )}
      </div>

      {/* Official Court Dossier Modal */}
      <CourtBriefModal
        isOpen={isCourtModalOpen}
        onClose={() => setIsCourtModalOpen(false)}
        activeCase={currentCase}
        pinnedSuspects={pinnedSuspects}
        pinnedEvidence={pinnedEvidence}
      />
    </>
  );
};
