import React from 'react';
import { FIRCase, AccusedSuspect, CaseEvidence } from '@kestrel/shared';
import { Printer, X, Shield, Scale, FileText, CheckCircle2 } from 'lucide-react';

interface CourtBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase?: FIRCase | null;
  pinnedSuspects: AccusedSuspect[];
  pinnedEvidence: CaseEvidence[];
}

export const CourtBriefModal: React.FC<CourtBriefModalProps> = ({
  isOpen,
  onClose,
  activeCase,
  pinnedSuspects,
  pinnedEvidence,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-300 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full">
        {/* Modal Controls (Hidden in Print) */}
        <div className="print:hidden bg-[#0a1322] text-slate-100 px-6 py-3 border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">
              COURT BRIEFING DOSSIER GENERATOR — KARNATAKA STATE POLICE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs font-bold transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Government Legal Document Body */}
        <div className="p-8 font-serif leading-relaxed text-slate-900 print:p-6 print:text-black">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-slate-800" />
              <span className="font-mono font-bold tracking-widest text-xs uppercase text-slate-600">
                GOVERNMENT OF KARNATAKA // POLICE DEPARTMENT
              </span>
            </div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-950 font-sans">
              INVESTIGATION SUMMARY & OPPOSITION TO BAIL
            </h1>
            <p className="text-xs font-mono uppercase text-slate-700 mt-1">
              IN THE COURT OF THE PRINCIPAL CITY CIVIL & SESSIONS JUDGE, BENGALURU
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 bg-red-100 text-red-900 border border-red-300 font-mono text-[10px] font-bold uppercase">
              CONFIDENTIAL // SUBMITTED UNDER BNSS SECTION 187 / CRPC SECTION 167
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 font-mono text-xs mb-6 border-b border-slate-300 pb-4">
            <div>
              <div><strong>FIR Number:</strong> {activeCase?.firNumber || 'FIR-2024-INDR-0102'}</div>
              <div><strong>Police Station:</strong> {activeCase?.policeStation || 'Indiranagar PS'}</div>
              <div><strong>Crime Category:</strong> {activeCase?.crimeCategory || 'Armed Robbery'}</div>
              <div><strong>Date of Occurrence:</strong> {activeCase?.incidentDate ? new Date(activeCase.incidentDate).toLocaleDateString('en-IN') : '14 March 2024'}</div>
            </div>
            <div>
              <div><strong>Statutory Acts:</strong> {(activeCase?.applicableActs || ['BNS 311', 'BNS 109']).join(', ')}</div>
              <div><strong>Investigating Officer:</strong> {activeCase?.investigatingOfficerName || 'Insp. Vikram Patil'}</div>
              <div><strong>District:</strong> {activeCase?.district || 'Bengaluru East'}</div>
              <div><strong>Date of Report:</strong> {todayStr}</div>
            </div>
          </div>

          {/* 1. Case Synopsis */}
          <div className="mb-6">
            <h2 className="font-sans font-bold text-sm uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
              1. Brief Facts of the Case
            </h2>
            <p className="text-xs text-justify font-sans text-slate-800">
              {activeCase?.description ||
                'On 14-03-2024 at approximately 22:15 hours, two unidentified male assailants riding a black Bajaj Pulsar motorcycle intercepted the complainant near 12th Main Indiranagar, threatened with a 7.65mm country-made firearm, and forcibly looted gold ornaments valued at ₹4,50,000. Accused were identified during investigation and subsequent weapon recovery memo executed under Section 23 of the Indian Evidence Act.'}
            </p>
          </div>

          {/* 2. Accused Profile & Conviction Record */}
          <div className="mb-6">
            <h2 className="font-sans font-bold text-sm uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
              2. Accused Suspect Particulars & Recidivism
            </h2>
            {pinnedSuspects.length > 0 ? (
              <table className="w-full text-left font-mono text-xs border border-slate-300 divide-y divide-slate-300">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2">Name & Alias</th>
                    <th className="p-2">Risk Rating</th>
                    <th className="p-2">Syndicate / Gang</th>
                    <th className="p-2">Prior Arrests</th>
                    <th className="p-2">Bail Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans text-xs">
                  {pinnedSuspects.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 font-bold">{s.fullName} {s.aliases.length > 0 && `("${s.aliases[0]}")`}</td>
                      <td className="p-2 font-mono">{s.riskLevel}</td>
                      <td className="p-2">{s.gangAffiliation || 'Independent'}</td>
                      <td className="p-2 font-mono">{s.totalPriorArrests} prior FIRs</td>
                      <td className="p-2 font-bold text-red-700">{s.bailStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
                Primary Accused: <strong>Raju Nayak @ Snake Raju</strong> — Habitual offender with 6 prior arrests. Currently Remanded to Parappana Agrahara Central Prison.
              </div>
            )}
          </div>

          {/* 3. Seized Evidence & FSL Chain of Custody */}
          <div className="mb-6">
            <h2 className="font-sans font-bold text-sm uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
              3. Seized Property & Physical Clues
            </h2>
            {pinnedEvidence.length > 0 ? (
              <ul className="list-disc pl-5 text-xs font-sans space-y-1">
                {pinnedEvidence.map((e) => (
                  <li key={e.id}>
                    <strong>[{e.evidenceType}] {e.title}:</strong> {e.description} (Collected on {new Date(e.collectedDate).toLocaleDateString('en-IN')})
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="list-disc pl-5 text-xs font-sans space-y-1">
                <li><strong>[Weapon] 7.65mm Shell Casings:</strong> Dispatched to Madiwala FSL Ballistics Division (Property Form No. 42/2024).</li>
                <li><strong>[Vehicle] Bajaj Pulsar (KA-04-E-1234):</strong> Impounded under PF 44/2024 from B.Channasandra chop shop.</li>
                <li><strong>[CCTV] Axis Bank ATM Surveillance:</strong> DVR footage tagged and sealed in evidence envelope EV-001.</li>
              </ul>
            )}
          </div>

          {/* 4. Grounds to Oppose Bail */}
          <div className="mb-8">
            <h2 className="font-sans font-bold text-sm uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
              4. Specific Grounds for Opposing Regular Bail
            </h2>
            <ol className="list-decimal pl-5 text-xs font-sans space-y-1.5 text-slate-800">
              <li>The offence is grievous and heinous, punishable with life imprisonment under relevant sections of the Bharatiya Nyaya Sanhita.</li>
              <li>The accused is the active ringleader of the organized <em>East Ring Vehicle & Heist Syndicate</em> operating across Indiranagar, Koramangala, and K.R. Puram.</li>
              <li>High probability of threatening and intimidating prime eyewitnesses including the complainant who resides in the same locality.</li>
              <li>Charge-sheet preparation is at an advanced stage and statutory custody period under Section 187 BNSS is actively running.</li>
            </ol>
          </div>

          {/* Officer Sign-off Block */}
          <div className="flex justify-between items-end pt-8 border-t border-slate-400 font-mono text-xs">
            <div>
              <div>Place: Bengaluru</div>
              <div>Date: {todayStr}</div>
            </div>
            <div className="text-right">
              <div className="font-bold">Inspector Vikram Patil</div>
              <div>Station House Officer</div>
              <div>Indiranagar Police Station, Bengaluru</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
