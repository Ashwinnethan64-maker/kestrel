import React from 'react';
import { AlertTriangle, TrendingUp, Zap, Shield } from 'lucide-react';
import type { StationCrimeSurgeAnomaly } from '@kestrel/shared';

interface ThreatAnomalyCardProps {
  anomaly: StationCrimeSurgeAnomaly;
}

export function ThreatAnomalyCard({ anomaly }: ThreatAnomalyCardProps) {
  const isHigh = anomaly.severity === 'Critical';

  const borderColor = isHigh
    ? 'border-l-4 border-l-red-500 border-t-red-500/20 border-r-red-500/10 border-b-red-500/10'
    : 'border-l-4 border-l-amber-500 border-t-amber-500/20 border-r-amber-500/10 border-b-amber-500/10';

  const bgColor = isHigh ? 'bg-red-950/30' : 'bg-amber-950/20';
  const textColor = isHigh ? 'text-red-400' : 'text-amber-400';
  const badgeBg = isHigh ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300';

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-3.5 flex items-start gap-3`}>
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${textColor}`}>
        {isHigh ? (
          <Zap className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${badgeBg}`}>
            {anomaly.severity} SURGE
          </span>
          <span className="font-mono text-xs font-bold text-white">
            {anomaly.station} PS
          </span>
          <span className={`text-xs font-mono font-semibold ${textColor} flex items-center gap-1`}>
            <TrendingUp className="w-3.5 h-3.5" />
            +{anomaly.surgePercent.toFixed(0)}% in 7 days
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-1.5 leading-relaxed">
          <span className="font-semibold text-white">{anomaly.dominantCategory}</span>
          {' '}incidents surged from{' '}
          <span className={textColor}>{anomaly.prior7DayCount}</span> → <span className={textColor}>{anomaly.current7DayCount}</span> cases this week.
        </p>

        <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-2">
          <span className={`${textColor} not-italic font-semibold`}>Recommended: </span>
          {anomaly.tacticalRecommendation}
        </p>

        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {anomaly.district}
          </span>
          <span>·</span>
          <span>Detected {new Date(anomaly.detectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </div>
  );
}
