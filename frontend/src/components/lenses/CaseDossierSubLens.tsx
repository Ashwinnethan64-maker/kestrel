import React, { useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronRight,
  FileText,
  Fingerprint,
  FlaskConical,
  Globe2,
  Map,
  Microscope,
  Phone,
  Pin,
  Shield,
  Skull,
  UserX,
  Wifi,
  Zap,
  Lock,
  Unlock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { useIntelClient } from '@/services/api/intelClient';
import { ShiftTaskList } from '../docket/ShiftTaskList';
import type { AccusedSuspect, CaseEvidence, FIRCase } from '@kestrel/shared';

// ── Evidence type icons ───────────────────────────────────────────────────────
function EvidenceIcon({ type }: { type: string }) {
  const cls = 'w-5 h-5';
  if (type.includes('CCTV'))     return <Camera className={`${cls} text-blue-400`} />;
  if (type.includes('Weapon'))   return <Skull className={`${cls} text-red-400`} />;
  if (type.includes('Digital') || type.includes('CDR')) return <Wifi className={`${cls} text-purple-400`} />;
  if (type.includes('Forensic')) return <FlaskConical className={`${cls} text-emerald-400`} />;
  return <Microscope className={`${cls} text-slate-400`} />;
}

// ── Bail status badge ─────────────────────────────────────────────────────────
function BailBadge({ status }: { status: AccusedSuspect['bailStatus'] }) {
  const map = {
    Bailed:     { cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Unlock className="w-3 h-3" /> },
    Remanded:   { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <Lock className="w-3 h-3" /> },
    Absconding: { cls: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <UserX className="w-3 h-3" /> },
    None:       { cls: 'bg-slate-700/40 text-slate-400 border-slate-600/30', icon: <Shield className="w-3 h-3" /> },
  };
  const { cls, icon } = map[status] ?? map.None;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${cls}`}>
      {icon}{status}
    </span>
  );
}

// ── Risk glow border ──────────────────────────────────────────────────────────
function riskBorderClass(risk: string) {
  if (risk === 'Critical') return 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
  if (risk === 'High')     return 'border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.1)]';
  return 'border-white/10';
}

// ── Accused Profile Card ──────────────────────────────────────────────────────
function AccusedProfileCard({ suspect }: { suspect: AccusedSuspect }) {
  const pinItem   = useCommandDeckStore((s) => s.pinItem);
  const openNexus = useCommandDeckStore((s) => s.openCaseNexus);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border ${riskBorderClass(suspect.riskLevel)} bg-[#0a1220]/80 p-4 space-y-3`}>
      {/* Name + risk */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-bold text-white text-sm">{suspect.fullName}</h4>
          {suspect.aliases.length > 0 && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              aka <span className="italic text-slate-300">{suspect.aliases.slice(0, 2).join(', ')}</span>
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <BailBadge status={suspect.bailStatus} />
          <button
            onClick={() => pinItem(suspect.id)}
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <Fingerprint className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-400 font-bold">{suspect.totalPriorArrests}</span>
          <span className="text-slate-500">prior arrests</span>
        </div>
        {suspect.isRepeatOffender && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
            REPEAT OFFENDER
          </span>
        )}
      </div>

      {/* Gang affiliation */}
      {suspect.gangAffiliation && (
        <div className="text-[11px] flex items-center gap-1.5 text-slate-400">
          <Globe2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-purple-300">{suspect.gangAffiliation}</span>
        </div>
      )}

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {expanded ? 'Hide details' : 'Show addresses & phones'}
      </button>

      {expanded && (
        <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-white/5 pt-2">
          {suspect.knownAddresses.map((addr, i) => (
            <p key={i} className="flex items-start gap-1.5">
              <Map className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-500" />
              <span>{addr}</span>
            </p>
          ))}
          {suspect.phoneNumbers.map((ph, i) => (
            <p key={i} className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 flex-shrink-0 text-slate-500" />
              <span className="font-mono">{ph}</span>
            </p>
          ))}
          {(suspect.vehiclePlates || []).map((plate, i) => (
            <p key={i} className="flex items-center gap-1.5">
              <span className="text-[9px]">🚗</span>
              <span className="font-mono">{plate}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Evidence Vault Card ───────────────────────────────────────────────────────
function EvidenceVaultCard({ evidence }: { evidence: CaseEvidence }) {
  const [showCoc, setShowCoc] = useState(false);

  return (
    <div className="rounded-xl border border-white/8 bg-[#0a1220]/60 p-3.5 space-y-2 hover:border-white/15 transition-colors">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0">
          <EvidenceIcon type={evidence.evidenceType} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-white leading-tight">{evidence.title}</h4>
          <span className="text-[10px] font-mono text-slate-500">{evidence.evidenceType}</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">{evidence.description}</p>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Collected: {new Date(evidence.collectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <button
          onClick={() => setShowCoc(!showCoc)}
          className="text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
        >
          Chain of Custody {showCoc ? '▲' : '▼'}
        </button>
      </div>

      {showCoc && evidence.chainOfCustody.length > 0 && (
        <ol className="border-t border-white/5 pt-2 space-y-1.5">
          {evidence.chainOfCustody.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-[10px]">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[9px]">
                {i + 1}
              </span>
              <div>
                <span className="text-slate-300">{step.action}</span>
                <span className="text-slate-500 ml-1">· Badge {step.officerBadge}</span>
                <div className="text-slate-600 font-mono">
                  {new Date(step.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Main Dossier Sub-Lens ─────────────────────────────────────────────────────
interface CaseDossierSubLensProps {
  firCase: FIRCase;
  suspects: AccusedSuspect[];
  evidence: CaseEvidence[];
}

export function CaseDossierSubLens({ firCase, suspects, evidence }: CaseDossierSubLensProps) {
  const [showKannada, setShowKannada] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">

      {/* ── Section A: Case Synopsis ───────────────────────────────────── */}
      <section>
        <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          Case Synopsis
        </h2>

        <div className="bg-[#0a1220]/80 rounded-xl border border-white/8 p-4 space-y-4">
          {/* Date + Station row */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-slate-500 font-mono uppercase text-[10px] tracking-wider mb-1">Incident Date</p>
              <p className="text-white font-medium">
                {new Date(firCase.incidentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-mono uppercase text-[10px] tracking-wider mb-1">FIR Registered</p>
              <p className="text-white font-medium">
                {new Date(firCase.reportedDate || firCase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-mono uppercase text-[10px] tracking-wider mb-1">Police Station</p>
              <p className="text-white font-medium">{firCase.policeStation} PS</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 font-mono uppercase text-[10px] tracking-wider">Incident Description</p>
              {firCase.descriptionKannada && (
                <button
                  onClick={() => setShowKannada(!showKannada)}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5"
                >
                  {showKannada ? '🇬🇧 English' : '🇮🇳 ಕನ್ನಡ'}
                </button>
              )}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {showKannada ? firCase.descriptionKannada : firCase.description}
            </p>
          </div>

          {/* MO */}
          {firCase.modusOperandi && (
            <div>
              <p className="text-slate-500 font-mono uppercase text-[10px] tracking-wider mb-1">Modus Operandi</p>
              <p className="text-sm text-amber-300 italic leading-relaxed border-l-2 border-amber-500/40 pl-3">
                {firCase.modusOperandi}
              </p>
            </div>
          )}

          {/* Applicable Acts */}
          {(firCase.applicableActs || []).length > 0 && (
            <div>
              <p className="text-slate-500 font-mono uppercase text-[10px] tracking-wider mb-2">Applicable Acts & Sections</p>
              <div className="flex flex-wrap gap-2">
                {firCase.applicableActs.map((act, i) => (
                  <span key={i} className="font-mono text-[11px] px-2 py-1 bg-slate-800 border border-slate-700/60 text-slate-200 rounded">
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section B: Accused Profile Cards ─────────────────────────── */}
      {suspects.length > 0 && (
        <section>
          <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Fingerprint className="w-3.5 h-3.5" />
            Accused Suspect Profiles ({suspects.length})
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {suspects.map((s) => (
              <AccusedProfileCard key={s.id} suspect={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section C: Evidence Vault ─────────────────────────────────── */}
      {evidence.length > 0 && (
        <section>
          <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Evidence Vault ({evidence.length} items)
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {evidence.map((ev) => (
              <EvidenceVaultCard key={ev.id} evidence={ev} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section D: Case Task Checklist ───────────────────────────── */}
      <section>
        <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          Case Action Checklist
        </h2>
        <ShiftTaskList cases={[firCase]} />
      </section>

    </div>
  );
}
