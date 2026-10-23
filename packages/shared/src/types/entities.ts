export type CrimeSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type CaseStatus = 'Open' | 'Under Investigation' | 'Under Review' | 'Closed';
export type SuspectRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type SuspectRole = 'Prime Suspect' | 'Accomplice' | 'Conspirator' | 'Informant';
export type AccusedStatus = 'Wanted' | 'Arrested' | 'Bailed' | 'Acquitted';
export type EvidenceType = 'CCTV' | 'Weapon' | 'Digital / CDR' | 'Forensic' | 'Vehicle' | 'Documents';

export interface StatutoryAct {
  code: string; // e.g. "IPC 302", "BNS 103", "IPC 379"
  title: string; // e.g. "Punishment for Murder", "Theft"
  severityScore: number; // 1 - 10
}

export interface OfficerProfile {
  id: string;
  badgeNumber: string;
  name: string;
  email: string;
  role: 'Investigator' | 'StationInCharge' | 'Superintendent';
  station: string;
  district: string;
}

export interface FIRCase {
  id: string;
  firNumber: string; // e.g. "FIR-2024-INDR-0102"
  crimeCategory: string; // e.g. "Armed Robbery", "Vehicle Theft", "Cyber Fraud", "Assault"
  priority: CrimeSeverity;
  status: CaseStatus;
  incidentDate: string; // ISO 8601
  reportedDate: string; // ISO 8601
  district: string; // e.g. "Bengaluru East"
  policeStation: string; // e.g. "Indiranagar"
  investigatingOfficerId?: string;
  investigatingOfficerName?: string;
  description: string;
  descriptionKannada?: string;
  applicableActs: string[]; // ["IPC 392", "IPC 34"]
  latitude: number;
  longitude: number;
  accusedIds: string[];
  evidenceIds: string[];
  modusOperandi?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AccusedSuspect {
  id: string;
  fullName: string;
  aliases: string[];
  isRepeatOffender: boolean;
  riskLevel: SuspectRiskLevel;
  gangAffiliation?: string;
  phoneNumbers: string[];
  knownAddresses: string[];
  vehiclePlates?: string[];
  primaryStation?: string;
  totalPriorArrests: number;
  bailStatus: 'Bailed' | 'Remanded' | 'Absconding' | 'None';
  photoUrl?: string;
  activeCaseIds: string[];
  createdAt: string;
}

export interface CaseEvidence {
  id: string;
  caseId: string;
  evidenceType: EvidenceType;
  title: string;
  description: string;
  fileUrl?: string;
  collectedDate: string;
  chainOfCustody: {
    officerBadge: string;
    action: string;
    timestamp: string;
  }[];
}

export interface CaseAccusedJunction {
  caseId: string;
  accusedId: string;
  role: SuspectRole;
  status: AccusedStatus;
}

export type TaskType = 'CCTV' | 'Forensic' | 'Interrogation' | 'Seizure' | 'Documentation';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface InvestigativeTask {
  id: string;
  caseId: string;
  assignedOfficerId?: string | null;
  title: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface OfficerWithWorkload extends OfficerProfile {
  activeCaseCount: number;
  pendingTaskCount: number;
}

// Canonical alias — used throughout Phase 1+ components & store
export type Officer = OfficerProfile;

// ── Deck Shell UI State Types ────────────────────────────────────────────────

/**
 * CommandAltitude — which operational persona is active in DeckTopbar.
 * 'field_io'  → Inspector/SI: Morning Docket + 360° Case Nexus
 * 'commander' → DCP/ACP: Zonal Radar + Station Clearance Matrix
 */
export type CommandAltitude = 'field_io' | 'commander';

/**
 * DeckLensMode — which top-level lens fills the Tactical Canvas (65% left panel).
 * Matches the three mode buttons in the UI anatomy wireframe.
 */
export type DeckLensMode = 'morning_docket' | 'case_nexus' | 'zonal_radar';

/**
 * CaseSubLens — active sub-pane inside the 360° Case Nexus.
 * Only relevant when DeckLensMode === 'case_nexus'.
 */
export type CaseSubLens = 'dossier' | 'scene_gis' | 'syndicate_graph';
