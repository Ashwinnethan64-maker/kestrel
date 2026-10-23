import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  BookOpen,
  Fingerprint,
  FlaskConical,
  Lock,
  RefreshCw,
  RotateCcw,
  Siren,
  Truck,
  Unlock,
  UserX,
} from 'lucide-react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { ThreatAnomalyCard } from './ThreatAnomalyCard';
import type { AccusedSuspect, FIRCase } from '@kestrel/shared';
import type { StationCrimeSurgeAnomaly } from '@kestrel/shared';

// ── Local GD Event schema ────────────────────────────────────────────────────
type GdEventType =
  | 'FIR_REGISTERED'
  | 'ARREST_MADE'
  | 'BAIL_GRANTED'
  | 'SUSPECT_ABSCONDING'
  | 'PATROL_DISPATCH'
  | 'SHIFT_HANDOVER'
  | 'EVIDENCE_SUBMITTED';

interface GdEvent {
  id: string;
  timestamp: string;
  eventType: GdEventType;
  title: string;
  detail?: string;
  relatedFirNumber?: string;
  relatedCaseId?: string;
  severity: 'Critical' | 'High' | 'Normal';
}

// ── Static mock surge anomalies (derived from curated fixture) ────────────────
const MOCK_ANOMALIES: StationCrimeSurgeAnomaly[] = [
  {
    station: 'Indiranagar',
    district: 'Bengaluru East',
    current7DayCount: 6,
    prior7DayCount: 2,
    surgePercent: 200,
    dominantCategory: 'Armed Robbery',
    dominantCategoryCount: 4,
    severity: 'Critical',
    tacticalRecommendation:
      'Activate armed QRT checkpoints and night perimeter patrols around high-risk commercial avenues in 100 Feet Road corridor, Indiranagar.',
    detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    station: 'Whitefield',
    district: 'Bengaluru East',
    current7DayCount: 9,
    prior7DayCount: 4,
    surgePercent: 125,
    dominantCategory: 'Cyber Fraud',
    dominantCategoryCount: 6,
    severity: 'High',
    tacticalRecommendation:
      'Coordinate with CCB Cyber Crime Wing to track mule account beneficiary transfers and flag compromised banking KYC nodes in Whitefield.',
    detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Event icon map ─────────────────────────────────────────────────────────────
function getEventIcon(type: GdEventType): React.ReactNode {
  const cls = 'w-3.5 h-3.5 flex-shrink-0';
  switch (type) {
    case 'FIR_REGISTERED':   return <BookOpen className={`${cls} text-cyan-400`} />;
    case 'ARREST_MADE':      return <Lock className={`${cls} text-emerald-400`} />;
    case 'BAIL_GRANTED':     return <Unlock className={`${cls} text-amber-400`} />;
    case 'SUSPECT_ABSCONDING': return <UserX className={`${cls} text-red-400`} />;
    case 'PATROL_DISPATCH':  return <Truck className={`${cls} text-blue-400`} />;
    case 'SHIFT_HANDOVER':   return <RotateCcw className={`${cls} text-slate-400`} />;
    case 'EVIDENCE_SUBMITTED': return <FlaskConical className={`${cls} text-purple-400`} />;
    default:                 return <Activity className={`${cls} text-slate-400`} />;
  }
}

// ── Severity badge ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: GdEvent['severity'] }) {
  if (severity === 'Normal') return null;
  const cls =
    severity === 'Critical'
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return (
    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${cls}`}>
      {severity}
    </span>
  );
}

// ── Relative time formatter ─────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Derive GD events from fixture cases / suspects ──────────────────────────
function deriveGdEvents(cases: FIRCase[], suspects: AccusedSuspect[]): GdEvent[] {
  const events: GdEvent[] = [];

  cases.forEach((c) => {
    // FIR registration event
    events.push({
      id: `gd-fir-${c.id}`,
      timestamp: c.reportedDate || c.createdAt,
      eventType: 'FIR_REGISTERED',
      title: `FIR Registered — ${c.crimeCategory}`,
      detail: `${c.policeStation} PS · ${c.firNumber}`,
      relatedFirNumber: c.firNumber,
      relatedCaseId: c.id,
      severity: c.priority === 'Critical' ? 'Critical' : c.priority === 'High' ? 'High' : 'Normal',
    });
  });

  // Suspect-based events
  suspects.forEach((s) => {
    if (s.bailStatus === 'Bailed' && s.activeCaseIds.length > 0) {
      events.push({
        id: `gd-bail-${s.id}`,
        timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
        eventType: 'BAIL_GRANTED',
        title: `Bail Granted — ${s.fullName}`,
        detail: s.aliases.length > 0 ? `alias "${s.aliases[0]}" · ${s.primaryStation ?? ''} PS` : undefined,
        relatedCaseId: s.activeCaseIds[0],
        severity: s.riskLevel === 'Critical' ? 'Critical' : s.riskLevel === 'High' ? 'High' : 'Normal',
      });
    }

    if (s.bailStatus === 'Arrested') {
      events.push({
        id: `gd-arrest-${s.id}`,
        timestamp: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000).toISOString(),
        eventType: 'ARREST_MADE',
        title: `Arrested — ${s.fullName}`,
        detail: s.gangAffiliation ? `Gang: ${s.gangAffiliation}` : undefined,
        severity: s.riskLevel === 'Critical' ? 'Critical' : 'High',
      });
    }

    if (s.bailStatus === 'Absconding') {
      events.push({
        id: `gd-abs-${s.id}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        eventType: 'SUSPECT_ABSCONDING',
        title: `Suspect Absconding — ${s.fullName}`,
        detail: s.aliases.length > 0 ? `alias "${s.aliases[0]}"` : undefined,
        severity: 'Critical',
      });
    }
  });

  // Static enrichment events
  events.push(
    {
      id: 'gd-shift-am',
      timestamp: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
      eventType: 'SHIFT_HANDOVER',
      title: 'AM Shift Handover — Indiranagar PS',
      detail: 'SI Kumar handed charge to Inspector Patil. 4 active FIRs pending.',
      severity: 'Normal',
    },
    {
      id: 'gd-patrol-1',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      eventType: 'PATROL_DISPATCH',
      title: 'Night Patrol Deployed — 100 Feet Road',
      detail: 'PCR Van KA-01-G-3389 dispatched to 100 Feet Road beat per SI order.',
      severity: 'Normal',
    },
    {
      id: 'gd-evid-1',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      eventType: 'EVIDENCE_SUBMITTED',
      title: 'FSL Dispatch — Ballistics (Shell Casings)',
      detail: 'CASE-2024-INDR-0102 · 7.65mm shell casings submitted to Madiwala FSL.',
      relatedCaseId: 'CASE-2024-INDR-0102',
      severity: 'High',
    }
  );

  // Sort newest first
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

interface StationGdTickerProps {
  cases: FIRCase[];
  suspects: AccusedSuspect[];
  station?: string;
}

export function StationGdTicker({ cases, suspects, station }: StationGdTickerProps) {
  const openCaseNexus = useCommandDeckStore((s) => s.openCaseNexus);

  const [lastSynced, setLastSynced] = useState(new Date());
  const [extraEvents, setExtraEvents] = useState<GdEvent[]>([]);
  const [ticker, setTicker] = useState(0); // force re-render for relative timestamps

  // Auto-refresh: inject a patrol dispatch event every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent: GdEvent = {
        id: `gd-patrol-live-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'PATROL_DISPATCH',
        title: `Beat Update — ${station ?? 'Indiranagar'} PS`,
        detail: `Routine beat check-in received from PCR unit at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`,
        severity: 'Normal',
      };
      setExtraEvents((prev) => [newEvent, ...prev].slice(0, 3));
      setLastSynced(new Date());
    }, 30000);

    // Ticker for relative timestamps
    const tickInterval = setInterval(() => setTicker((t) => t + 1), 60000);

    return () => {
      clearInterval(interval);
      clearInterval(tickInterval);
    };
  }, [station]);

  const baseEvents = useMemo(() => deriveGdEvents(cases, suspects), [cases, suspects]);
  const allEvents = useMemo(
    () => [...extraEvents, ...baseEvents].slice(0, 15),
    [extraEvents, baseEvents, ticker] // ticker dep forces time refresh
  );

  return (
    <div className="bg-[#080f1a]/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#071325] to-[#080f1a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
            Station General Diary
            <span className="text-slate-400 font-normal ml-2">
              · {station ?? 'Indiranagar'} PS
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <RefreshCw className="w-3 h-3" />
          <span>Last synced: {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Threat Anomaly Callouts */}
      {MOCK_ANOMALIES.length > 0 && (
        <div className="px-4 pt-3 pb-2 space-y-2 border-b border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-2">
            <AlertOctagon className="w-3 h-3" />
            <span>Active Threat Anomalies ({MOCK_ANOMALIES.length})</span>
          </div>
          {MOCK_ANOMALIES.map((a, i) => (
            <ThreatAnomalyCard key={i} anomaly={a} />
          ))}
        </div>
      )}

      {/* GD Event Feed */}
      <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto">
        {allEvents.length === 0 ? (
          <div className="px-4 py-8 text-center font-mono text-xs text-slate-500">
            No GD events for today.
          </div>
        ) : (
          allEvents.map((event) => (
            <div
              key={event.id}
              className="px-4 py-2.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
            >
              {/* Event type icon */}
              <div className="mt-0.5">{getEventIcon(event.eventType)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs text-slate-100 font-medium">{event.title}</span>
                  <SeverityBadge severity={event.severity} />
                  {event.relatedFirNumber && event.relatedCaseId && (
                    <button
                      type="button"
                      onClick={() => openCaseNexus(event.relatedCaseId!)}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-0.5"
                    >
                      {event.relatedFirNumber}
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                {event.detail && (
                  <p className="text-[11px] text-slate-400 truncate">{event.detail}</p>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 mt-0.5">
                {relativeTime(event.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
