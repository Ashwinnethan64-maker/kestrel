import type { BoundingBox } from './spatial';

export type TacticalLensMode = 'geo' | 'network' | 'dossier';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export interface CaseFilterParams {
  district?: string;
  policeStation?: string;
  crimeCategory?: string;
  priority?: string;
  status?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CopilotPromptEnvelope {
  query: string;
  language: 'en' | 'kn'; // English or Kannada
  activeLens: TacticalLensMode;
  focusedCaseId?: string | null;
  focusedSuspectId?: string | null;
  activeBoundingBox?: BoundingBox | null;
  activeFilters?: CaseFilterParams;
  temporalWindow?: [string, string]; // ISO dates
}

export interface CopilotResponseChunk {
  type: 'token' | 'thought' | 'citation' | 'action' | 'done';
  content?: string;
  citedFirNumbers?: string[];
  suggestedAction?: {
    actionType: 'FILTER_MAP' | 'FOCUS_SUSPECT' | 'SET_TIMELINE';
    payload: Record<string, unknown>;
  };
}

export interface TacticalAnalyticsSummary {
  incidentVelocity30DayChangePercent: number;
  recidivismIndexPercent: number;
  openCriticalCases: number;
  activeSyndicatesCount: number;
  stationClearanceRates: {
    station: string;
    total: number;
    cleared: number;
    ratePercent: number;
  }[];
}

// Hybrid RAG & Intent Classification Types
export type QueryIntentType = 'STRUCTURED_SQL' | 'SEMANTIC_VECTOR' | 'HYBRID' | 'CONTEXTUAL_FOCUS';

export interface ExtractedQueryEntities {
  policeStation?: string;
  crimeCategory?: string;
  priority?: string;
  status?: string;
  suspectName?: string;
  gangAffiliation?: string;
  daysAgo?: number;
}

export interface QueryIntentClassification {
  intent: QueryIntentType;
  confidence: number;
  entities: ExtractedQueryEntities;
  semanticSearchText: string;
  reasoning: string;
}

export interface SemanticCaseSearchResult {
  id: string;
  firNumber: string;
  crimeCategory: string;
  policeStation: string;
  district: string;
  priority: string;
  status: string;
  incidentDate: string;
  description: string;
  descriptionKannada?: string | null;
  similarityScore: number; // 0.0 - 1.0 (cosine similarity)
  accusedNames: string[];
}

