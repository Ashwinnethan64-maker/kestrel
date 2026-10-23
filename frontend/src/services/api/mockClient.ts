/**
 * mockClient.ts — 100% in-memory API failover for zero-network resilience.
 * Implements the same IntelClient interface as client.ts.
 * Pre-loaded with the full curated Bengaluru crime dataset.
 */

import { curatedCrimeDataset } from '@kestrel/shared';
import type {
  FIRCase,
  AccusedSuspect,
  CaseEvidence,
  InvestigativeTask,
  OfficerWithWorkload,
  CopilotPromptEnvelope,
  TaskStatus,
  TaskType,
  TaskPriority,
  CaseFilterParams
} from '@kestrel/shared';
import type { TaskFilterParams, SSEHandlers } from './client';

// ── In-memory officers roster ─────────────────────────────────────────────────
const MOCK_OFFICERS: OfficerWithWorkload[] = [
  {
    id: 'OFF-01', badgeNumber: 'KA-BLR-0552', name: 'Inspector Patil',
    email: 'patil.blr@ksp.gov.in', role: 'Investigator',
    station: 'Indiranagar', district: 'Bengaluru East',
    activeCaseCount: 4, pendingTaskCount: 3
  },
  {
    id: 'OFF-02', badgeNumber: 'KA-BLR-0331', name: 'Sub-Inspector Ramesh',
    email: 'ramesh.krp@ksp.gov.in', role: 'Investigator',
    station: 'K.R. Puram', district: 'Bengaluru East',
    activeCaseCount: 2, pendingTaskCount: 2
  },
  {
    id: 'OFF-03', badgeNumber: 'KA-BLR-0219', name: 'Inspector Ananya Sharma',
    email: 'ananya.cyber@ksp.gov.in', role: 'Investigator',
    station: 'Whitefield', district: 'Bengaluru East',
    activeCaseCount: 3, pendingTaskCount: 1
  },
  {
    id: 'OFF-04', badgeNumber: 'KA-BLR-0891', name: 'Inspector Raghavendra',
    email: 'raghavendra.cub@ksp.gov.in', role: 'Investigator',
    station: 'Cubbon Park', district: 'Bengaluru Central',
    activeCaseCount: 2, pendingTaskCount: 2
  },
  {
    id: 'OFF-05', badgeNumber: 'KA-BLR-0100', name: 'ACP Vikramaditya',
    email: 'acp.blr@ksp.gov.in', role: 'Superintendent',
    station: 'HQ Command', district: 'Bengaluru',
    activeCaseCount: 11, pendingTaskCount: 8
  }
];

// ── Officer name → ID mapping (for case joins) ────────────────────────────────
const OFFICER_NAME_TO_ID: Record<string, string> = {
  'Inspector Patil': 'OFF-01',
  'Sub-Inspector Ramesh': 'OFF-02',
  'Inspector Ananya Sharma': 'OFF-03',
  'Inspector Raghavendra': 'OFF-04',
  'ACP Vikramaditya': 'OFF-05'
};

// ── Build FIRCase list from curated fixture ───────────────────────────────────
const raw = curatedCrimeDataset as any;

const MOCK_CASES: FIRCase[] = (raw.cases || []).map((c: any): FIRCase => ({
  id: c.id,
  firNumber: c.firNumber,
  crimeCategory: c.crimeCategory,
  priority: c.priority,
  status: c.status,
  incidentDate: c.incidentDate,
  reportedDate: c.reportedDate || c.incidentDate,
  district: c.district,
  policeStation: c.policeStation,
  investigatingOfficerId: OFFICER_NAME_TO_ID[c.investigatingOfficerName] ?? 'OFF-01',
  investigatingOfficerName: c.investigatingOfficerName,
  description: c.description,
  descriptionKannada: c.descriptionKannada,
  applicableActs: c.applicableActs || [],
  latitude: c.latitude,
  longitude: c.longitude,
  accusedIds: c.accusedIds || [],
  evidenceIds: c.evidenceIds || [],
  modusOperandi: c.modusOperandi,
  tags: c.tags,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt
}));

// ── Build AccusedSuspect list from curated fixture ────────────────────────────
const MOCK_ACCUSED: AccusedSuspect[] = (raw.suspects || []).map((s: any): AccusedSuspect => ({
  id: s.id,
  fullName: s.fullName,
  aliases: s.aliases || [],
  isRepeatOffender: Boolean(s.isRepeatOffender),
  riskLevel: s.riskLevel || 'Medium',
  gangAffiliation: s.gangAffiliation,
  phoneNumbers: s.phoneNumbers || [],
  knownAddresses: s.knownAddresses || [],
  vehiclePlates: s.vehiclePlates || [],
  primaryStation: s.primaryStation,
  totalPriorArrests: Number(s.totalPriorArrests ?? 0),
  bailStatus: s.bailStatus || 'None',
  photoUrl: s.photoUrl,
  activeCaseIds: s.activeCaseIds || [],
  createdAt: s.createdAt || new Date().toISOString()
}));

// ── Build CaseEvidence list from curated fixture ──────────────────────────────
const MOCK_EVIDENCE: CaseEvidence[] = (raw.evidence || []).map((e: any): CaseEvidence => ({
  id: e.id,
  caseId: e.caseId,
  evidenceType: e.evidenceType,
  title: e.title,
  description: e.description,
  fileUrl: e.fileUrl,
  collectedDate: e.collectedDate,
  chainOfCustody: e.chainOfCustody || []
}));

// ── In-memory tasks (mutable for updateTaskStatus) ────────────────────────────
let MOCK_TASKS: InvestigativeTask[] = [
  { id: 'TASK-001', caseId: 'CASE-2024-INDR-0102', assignedOfficerId: 'OFF-01', title: 'Obtain 12th Main Indiranagar CCTV footage from Axis Bank ATM', taskType: 'CCTV', priority: 'Critical', status: 'Completed', dueDate: '2024-03-16T12:00:00Z', completedAt: '2024-03-16T10:45:00Z', notes: 'Footage collected on USB drive and tagged as evidence EV-001.', createdAt: new Date().toISOString() },
  { id: 'TASK-002', caseId: 'CASE-2024-INDR-0102', assignedOfficerId: 'OFF-01', title: 'Dispatch seized 7.65mm shell casings to Madiwala FSL Ballistics Division', taskType: 'Forensic', priority: 'Critical', status: 'In Progress', dueDate: '2024-03-18T18:00:00Z', notes: 'Awaiting ballistic comparison with country pistol seized in Whitefield case.', createdAt: new Date().toISOString() },
  { id: 'TASK-003', caseId: 'CASE-2024-INDR-0102', assignedOfficerId: 'OFF-01', title: 'Record Section 180 BNSS statement of eyewitness Smt. Jayalakshmi', taskType: 'Documentation', priority: 'High', status: 'Pending', dueDate: '2024-03-19T14:00:00Z', notes: 'Witness scheduled at Indiranagar PS at 11:00 AM.', createdAt: new Date().toISOString() },
  { id: 'TASK-004', caseId: 'CASE-2024-INDR-0102', assignedOfficerId: 'OFF-01', title: 'Execute formal seizure memo for black Bajaj Pulsar (KA-04-E-1234)', taskType: 'Seizure', priority: 'High', status: 'Completed', dueDate: '2024-03-16T16:00:00Z', completedAt: '2024-03-16T15:30:00Z', notes: 'Vehicle impounded under PF 44/2024.', createdAt: new Date().toISOString() },
  { id: 'TASK-005', caseId: 'CASE-2024-INDR-0102', assignedOfficerId: 'OFF-01', title: 'Interrogate co-accused Deepak Kumar @ Bullet Deepu regarding firearm source', taskType: 'Interrogation', priority: 'High', status: 'Pending', dueDate: '2024-03-20T17:00:00Z', notes: 'Focus on supply trail to Kalasipalya workshop.', createdAt: new Date().toISOString() },
  { id: 'TASK-006', caseId: 'CASE-2024-KRP-0215', assignedOfficerId: 'OFF-02', title: 'Request tower CDR dump for Old Madras Road junction during midnight heist', taskType: 'Forensic', priority: 'Critical', status: 'In Progress', dueDate: '2024-03-21T18:00:00Z', notes: 'Awaiting nodal officer response for Airtel and Jio cell IDs.', createdAt: new Date().toISOString() },
  { id: 'TASK-007', caseId: 'CASE-2024-KRP-0215', assignedOfficerId: 'OFF-02', title: 'Raid suspected chop shop in B.Channasandra (Syed Imran residence)', taskType: 'Seizure', priority: 'High', status: 'Pending', dueDate: '2024-03-22T06:00:00Z', notes: 'Search warrant approved by ACMM court.', createdAt: new Date().toISOString() },
  { id: 'TASK-008', caseId: 'CASE-2024-KORM-0088', assignedOfficerId: 'OFF-01', title: 'Inspect Ejipura Main Road jewellery store safe for tool-mark forensics', taskType: 'Forensic', priority: 'High', status: 'Completed', dueDate: '2024-03-14T15:00:00Z', completedAt: '2024-03-14T14:10:00Z', notes: 'Gas cutter marks matched industrial acetylene torches.', createdAt: new Date().toISOString() },
  { id: 'TASK-009', caseId: 'CASE-2024-KORM-0088', assignedOfficerId: 'OFF-01', title: 'File proclamation warrant under Sec 84 BNSS against Manjunath @ Blade Manja', taskType: 'Documentation', priority: 'Medium', status: 'In Progress', dueDate: '2024-03-23T11:00:00Z', notes: 'Accused absconding from known Ejipura address.', createdAt: new Date().toISOString() },
  { id: 'TASK-010', caseId: 'CASE-2024-WFD-0301', assignedOfficerId: 'OFF-03', title: 'Trace cryptocurrency wallet transactions to mule bank accounts', taskType: 'Forensic', priority: 'Critical', status: 'In Progress', dueDate: '2024-03-22T19:00:00Z', notes: 'Tether USDT outbound transfers traced to overseas exchanges.', createdAt: new Date().toISOString() },
  { id: 'TASK-011', caseId: 'CASE-2024-WFD-0301', assignedOfficerId: 'OFF-03', title: 'Summon bank branch manager under 94 BNSS for KYC documents', taskType: 'Documentation', priority: 'High', status: 'Completed', dueDate: '2024-03-17T16:00:00Z', completedAt: '2024-03-17T15:00:00Z', notes: 'KYC verified fraudulent identities with forged Aadhaar cards.', createdAt: new Date().toISOString() },
  { id: 'TASK-012', caseId: 'CASE-2024-WFD-0301', assignedOfficerId: 'OFF-03', title: 'Execute freeze order under Sec 106 BNSS on 4 mule ICICI accounts', taskType: 'Seizure', priority: 'Critical', status: 'Completed', dueDate: '2024-03-18T10:00:00Z', completedAt: '2024-03-18T09:30:00Z', notes: 'INR 18,50,000 successfully lien-marked.', createdAt: new Date().toISOString() },
  { id: 'TASK-013', caseId: 'CASE-2024-CUB-0044', assignedOfficerId: 'OFF-04', title: 'Retrieve Lavelle Road traffic junction PTZ camera recordings', taskType: 'CCTV', priority: 'High', status: 'Completed', dueDate: '2024-03-15T18:00:00Z', completedAt: '2024-03-15T17:20:00Z', notes: 'Getaway vehicle Honda City (KA-03-Z-8899) identified.', createdAt: new Date().toISOString() },
  { id: 'TASK-014', caseId: 'CASE-2024-CUB-0044', assignedOfficerId: 'OFF-04', title: 'Conduct interrogation of Kiran Gowda @ Shadow at Central Prison Parappana Agrahara', taskType: 'Interrogation', priority: 'Critical', status: 'In Progress', dueDate: '2024-03-21T15:00:00Z', notes: 'Body warrant obtained from 1st ACMM Court.', createdAt: new Date().toISOString() },
  { id: 'TASK-015', caseId: 'CASE-2024-CUB-0044', assignedOfficerId: 'OFF-04', title: 'Draft statutory charge-sheet for Section 305 / 331(4) BNS violations', taskType: 'Documentation', priority: 'Medium', status: 'Pending', dueDate: '2024-03-25T17:00:00Z', notes: 'Review draft with Assistant Public Prosecutor.', createdAt: new Date().toISOString() }
];

// ── Copilot simulated streaming responses ─────────────────────────────────────
const MOCK_COPILOT_RESPONSES: Record<string, string[]> = {
  default_en: [
    'Based on the ', 'operational intelligence ', 'available in the Kestrel ', 'database, here is my ', 'tactical assessment:\n\n',
    'The **East Ring Vehicle & Heist Syndicate** ', 'remains the highest-priority ', 'threat in Bengaluru East. ', 'FIR-2024-INDR-0102 (Armed Robbery) ', 'is the lead case.\n\n',
    'Recommended immediate actions:\n', '1. **Ballistics FSL** — dispatch ', 'shell casings to Madiwala lab.\n', '2. **CDR Analysis** — ', 'tower dump for Old Madras Road.\n', '3. **Witness Statement** — ', 'Sec 180 BNSS recording for Smt. Jayalakshmi.\n\n',
    'Stay tactical. ', '— KESTREL Copilot'
  ],
  default_kn: [
    'ಕೆಸ್ಟ್ರೆಲ್ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿರುವ ', 'ಗುಪ್ತಚರ ಮಾಹಿತಿ ', 'ಆಧಾರದ ಮೇಲೆ:\n\n',
    'FIR-2024-INDR-0102 ', '(ಸಶಸ್ತ್ರ ದರೋಡೆ) ', 'ಅತ್ಯಂತ ಮಹತ್ವದ ', 'ಪ್ರಕರಣವಾಗಿದೆ. ', 'ರಾಜು \'ಸ್ನೇಕ್\' ನಾಯಕ್ ', 'ಮುಖ್ಯ ಆರೋಪಿ.\n\n',
    'ತ್ವರಿತ ಕ್ರಮಗಳು:\n', '1. FSL ಬ್ಯಾಲಿಸ್ಟಿಕ್ಸ್\n', '2. CDR ಟವರ್ ಡಂಪ್\n', '3. ಸಾಕ್ಷಿ ಹೇಳಿಕೆ\n\n',
    '— KESTREL ಸಹಾಯಕ'
  ]
};

// ── Simulated SSE stream ──────────────────────────────────────────────────────
function simulateStream(
  envelope: CopilotPromptEnvelope,
  handlers: SSEHandlers
): AbortController {
  const controller = new AbortController();
  const tokens = MOCK_COPILOT_RESPONSES[
    envelope.language === 'kn' ? 'default_kn' : 'default_en'
  ];

  let idx = 0;
  const interval = setInterval(() => {
    if (controller.signal.aborted || idx >= tokens.length) {
      clearInterval(interval);
      if (!controller.signal.aborted) {
        // Send citations based on focused case or defaults
        const firs = envelope.focusedCaseId
          ? [envelope.focusedCaseId]
          : ['FIR-2024-INDR-0102', 'FIR-2024-KRP-0215', 'FIR-2024-KORM-0088'];
        handlers.onCitation(firs);
        handlers.onDone();
      }
      return;
    }
    handlers.onToken(tokens[idx++]);
  }, 40);

  return controller;
}

// ── Mock Client ───────────────────────────────────────────────────────────────
export const mockClient = {
  getCases: (params: CaseFilterParams = {}): Promise<FIRCase[]> => {
    let results = [...MOCK_CASES];

    if (params.investigatingOfficerId) {
      results = results.filter(c => c.investigatingOfficerId === params.investigatingOfficerId);
    }
    if (params.status) {
      results = results.filter(c => c.status === params.status);
    }
    if (params.priority) {
      results = results.filter(c => c.priority === params.priority);
    }
    if (params.district) {
      results = results.filter(c => c.district.toLowerCase().includes(params.district!.toLowerCase()));
    }
    if (params.policeStation) {
      results = results.filter(c => c.policeStation.toLowerCase().includes(params.policeStation!.toLowerCase()));
    }
    if (params.crimeCategory) {
      results = results.filter(c => c.crimeCategory.toLowerCase().includes(params.crimeCategory!.toLowerCase()));
    }
    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      results = results.filter(c =>
        c.firNumber.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.crimeCategory.toLowerCase().includes(q)
      );
    }

    return Promise.resolve(results);
  },

  getCaseById: (id: string): Promise<FIRCase | null> => {
    const c = MOCK_CASES.find(x => x.id === id || x.firNumber === id) ?? null;
    return Promise.resolve(c);
  },

  getOfficers: (): Promise<OfficerWithWorkload[]> =>
    Promise.resolve([...MOCK_OFFICERS]),

  getTasks: (params: TaskFilterParams = {}): Promise<InvestigativeTask[]> => {
    let results = [...MOCK_TASKS];
    if (params.caseId) results = results.filter(t => t.caseId === params.caseId);
    if (params.officerId) results = results.filter(t => t.assignedOfficerId === params.officerId);
    if (params.status) results = results.filter(t => t.status === params.status);
    if (params.priority) results = results.filter(t => t.priority === params.priority);
    return Promise.resolve(results);
  },

  updateTaskStatus: (
    id: string,
    status: TaskStatus,
    notes?: string
  ): Promise<InvestigativeTask> => {
    const idx = MOCK_TASKS.findIndex(t => t.id === id);
    if (idx === -1) return Promise.reject(new Error(`Task ${id} not found`));

    MOCK_TASKS[idx] = {
      ...MOCK_TASKS[idx],
      status,
      notes: notes ?? MOCK_TASKS[idx].notes,
      completedAt: status === 'Completed' ? new Date().toISOString() : null
    };
    return Promise.resolve(MOCK_TASKS[idx]);
  },

  createTask: (
    task: Omit<InvestigativeTask, 'id' | 'createdAt'>
  ): Promise<InvestigativeTask> => {
    const newTask: InvestigativeTask = {
      ...task,
      id: `TASK-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    MOCK_TASKS.unshift(newTask);
    return Promise.resolve(newTask);
  },

  getAccused: (id: string): Promise<AccusedSuspect | null> => {
    const s = MOCK_ACCUSED.find(x => x.id === id) ?? null;
    return Promise.resolve(s);
  },

  getSuspects: (): Promise<AccusedSuspect[]> =>
    Promise.resolve([...MOCK_ACCUSED]),

  getEvidence: (caseId: string): Promise<CaseEvidence[]> =>
    Promise.resolve(MOCK_EVIDENCE.filter(e => e.caseId === caseId)),

  getSyndicates: (): Promise<any[]> =>
    Promise.resolve((curatedCrimeDataset as any).syndicates || []),

  streamCopilotQuery: (
    envelope: CopilotPromptEnvelope,
    handlers: SSEHandlers
  ): AbortController => simulateStream(envelope, handlers)
};

export type MockIntelClient = typeof mockClient;
