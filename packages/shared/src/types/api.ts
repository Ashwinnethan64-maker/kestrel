import type { BoundingBox } from './spatial.js';

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
  investigatingOfficerId?: string;
  page?: number;
  limit?: number;
}

export interface CopilotPromptEnvelope {
  query: string;
  language: 'en' | 'kn'; // English or Kannada
  activeLens: TacticalLensMode;
  focusedCaseId?: string | null;
  focusedSuspectId?: string | null;
  activeOfficerId?: string | null;
  activeOfficerName?: string | null;
  activeOfficerRole?: string | null;
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
  detectedSurges?: StationCrimeSurgeAnomaly[];
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

// Crime Volume Surge & Anomaly Detection Types
export interface StationCrimeSurgeAnomaly {
  station: string;
  district: string;
  current7DayCount: number;
  prior7DayCount: number;
  surgePercent: number;
  dominantCategory: string;
  dominantCategoryCount: number;
  severity: 'Critical' | 'High' | 'Warning';
  tacticalRecommendation: string;
  detectedAt: string;
}

export interface CrimeSurgeResponse {
  anomalies: StationCrimeSurgeAnomaly[];
  analysisWindowDays: number;
  thresholdPercent: number;
  anchorDate: string;
}

// ----------------------------------------------------------------------------
// Dedicated Groq Intelligence Analysis Interfaces
// ----------------------------------------------------------------------------

export interface NetworkAIAnalysisRequest {
  language: 'en' | 'kn';
  nodesCount: number;
  edgesCount: number;
  activeFilters?: {
    entityType?: string;
    riskLevel?: string;
    searchQuery?: string;
  };
  sampleNodes: Array<{
    id: string;
    label: string;
    type: string;
    risk?: string;
    connectionsCount: number;
    connectedTo?: string[];
  }>;
  sampleEdges: Array<{
    source: string;
    target: string;
    label?: string;
    relationType?: string;
  }>;
}

export interface NetworkAIAnalysisResponse {
  executiveSummary: string;
  networkTopology: string;
  keyEntities: Array<{
    id: string;
    name: string;
    role: string;
    rationale: string;
  }>;
  detectedSyndicates: Array<{
    name: string;
    members: string[];
    modusOperandi: string;
  }>;
  investigativeLeads: string[];
  dataLimitations: string[];
  disclaimer: string;
}

export interface MapAIAnalysisRequest {
  language: 'en' | 'kn';
  selectedRegion?: string;
  activeFilters?: {
    district?: string;
    category?: string;
    priority?: string;
    status?: string;
    dateRange?: [string, string];
  };
  totalIncidents: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  stationBreakdown: Record<string, number>;
  sampleIncidents: Array<{
    firNumber: string;
    category: string;
    policeStation: string;
    priority: string;
    date: string;
    lat: number;
    lng: number;
  }>;
}

export interface MapAIAnalysisResponse {
  summary: string;
  hotspotClusters: Array<{
    area: string;
    dominantCategory: string;
    incidentCount: number;
    tacticalAssessment: string;
  }>;
  temporalPatterns: string;
  investigativeDirectives: string[];
  dataLimitations: string[];
  disclaimer: string;
}

export interface AnalyticsAIAnalysisRequest {
  language: 'en' | 'kn';
  timeframe?: string;
  activeFilters?: {
    district?: string;
    category?: string;
    priority?: string;
    status?: string;
  };
  metrics: {
    totalFIRs: number;
    criticalCount: number;
    clearanceRatePercent: number;
    categoryDistribution: Record<string, number>;
    stationDistribution: Record<string, number>;
    temporalSlots?: Record<string, number>;
  };
}

export interface AnalyticsAIAnalysisResponse {
  executiveSummary: string;
  keyObservedTrends: string[];
  categoryJurisdictionComparisons: string[];
  potentialExplanations: string[];
  investigativeQuestions: string[];
  dataLimitations: string[];
  disclaimer: string;
}



