import React from 'react';
import { Calendar, UserRound, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import type { FIRCase, AccusedSuspect } from '@kestrel/shared';

interface DocketCaseCardProps {
  firCase: FIRCase;
  primeAccused?: AccusedSuspect | null;
  onOpenCase: (caseId: string) => void;
  highlightStatutory?: boolean;
}

export function DocketCaseCard({
  firCase,
  primeAccused,
  onOpenCase,
  highlightStatutory = false,
}: DocketCaseCardProps) {
  // Statutory clock calculation
  // Offenses >= 10 yrs or Critical (Murder, Robbery, Arms) get 90 days, else 60 days
  const acts = firCase.applicableActs || (firCase as unknown as { actsApplicable?: string[] }).actsApplicable || [];
  const isHeinous =
    firCase.priority === 'Critical' ||
    acts.some(
      (act) =>
        act.includes('302') ||
        act.includes('392') ||
        act.includes('397') ||
        act.includes('376') ||
        act.includes('Arms')
    );
  const totalStatutoryDays = isHeinous ? 90 : 60;

  const incidentDate = new Date(firCase.incidentDate || firCase.createdAt || Date.now());
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - incidentDate.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalStatutoryDays - daysElapsed);

  let clockColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30';
  let clockBadge = 'text-emerald-400';
  if (daysRemaining <= 15) {
    clockColor = 'text-red-400 border-red-500/40 bg-red-950/40 animate-pulse';
    clockBadge = 'text-red-400';
  } else if (daysRemaining <= 30) {
    clockColor = 'text-amber-400 border-amber-500/30 bg-amber-950/30';
    clockBadge = 'text-amber-400';
  }

  // Priority accents
  const priorityTheme =
    firCase.priority === 'Critical'
      ? {
          border: 'border-l-4 border-l-red-500 border-t-white/5 border-r-white/5 border-b-white/5',
          tag: 'bg-red-500/20 text-red-400 border-red-500/40',
        }
      : firCase.priority === 'High'
      ? {
          border: 'border-l-4 border-l-amber-500 border-t-white/5 border-r-white/5 border-b-white/5',
          tag: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        }
      : {
          border: 'border-l-4 border-l-cyan-500 border-t-white/5 border-r-white/5 border-b-white/5',
          tag: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        };

  return (
    <div
      onClick={() => onOpenCase(firCase.id)}
      className={`group relative rounded-lg bg-[#0b121e]/85 backdrop-blur-md border ${priorityTheme.border} p-3.5 transition-all duration-200 hover:bg-[#101b2d] hover:border-r-cyan-500/30 hover:shadow-lg hover:shadow-cyan-950/20 cursor-pointer flex flex-col justify-between`}
    >
      <div>
        {/* Top Header: Badge + Category */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs font-bold text-white tracking-wide truncate group-hover:text-cyan-400 transition-colors">
              {firCase.firNumber}
            </span>
          </div>
          <span
            className={`text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded border ${priorityTheme.tag}`}
          >
            {firCase.priority}
          </span>
        </div>

        {/* Crime Title & Category */}
        <h4 className="text-sm font-semibold text-slate-100 line-clamp-1 group-hover:text-cyan-200 transition-colors mb-1">
          {firCase.crimeCategory}
        </h4>

        {firCase.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {firCase.description}
          </p>
        )}

        {/* Station and Date */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2.5">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {new Date(firCase.incidentDate || firCase.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="truncate">· {firCase.policeStation}</span>
        </div>

        {/* Prime Accused / Suspects info */}
        {primeAccused ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/60 rounded px-2 py-1 mb-2.5 border border-white/5">
            <UserRound className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="truncate font-medium">
              {primeAccused.fullName}
              {primeAccused.aliases && primeAccused.aliases.length > 0 && (
                <span className="text-slate-400 italic"> '{primeAccused.aliases[0]}'</span>
              )}
            </span>
            {(firCase.accusedIds?.length || 0) > 1 && (
              <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                +{firCase.accusedIds.length - 1} more
              </span>
            )}
          </div>
        ) : (
          firCase.accusedIds &&
          firCase.accusedIds.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/40 rounded px-2 py-1 mb-2.5 border border-white/5">
              <UserRound className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>{firCase.accusedIds.length} suspect(s) identified</span>
            </div>
          )
        )}

        {/* Acts Applicability tags */}
        {acts && acts.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {acts.slice(0, 3).map((act, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
              >
                {act}
              </span>
            ))}
            {acts.length > 3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/40 text-slate-500">
                +{acts.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Statutory countdown clock + Drill-down Action */}
      <div className={`pt-2.5 border-t border-white/5 flex items-center justify-between gap-2 mt-auto ${highlightStatutory ? 'bg-amber-500/5 -mx-3.5 -mb-3.5 p-3.5 rounded-b-lg' : ''}`}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono border ${clockColor}`}
          title={`Charge-sheet timeline: ${daysElapsed} of ${totalStatutoryDays} days elapsed`}
        >
          <Clock className={`w-3 h-3 ${clockBadge}`} />
          <span>
            {daysRemaining > 0 ? (
              <>
                <strong className="font-semibold">{daysRemaining}d</strong> to charge-sheet
              </>
            ) : (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                EXPIRED
              </span>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCase(firCase.id);
          }}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Nexus</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
