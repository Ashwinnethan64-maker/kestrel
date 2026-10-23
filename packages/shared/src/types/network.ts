export type NodeType = 'suspect' | 'case' | 'gang' | 'asset' | 'location';
export type EdgeRelation = 'CO_ACCUSED_WITH' | 'INVOLVED_IN' | 'LEADER_OF' | 'OPERATES_IN' | 'OWNS_ASSET' | 'SHARED_PHONE';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  subLabel?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore?: number;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: EdgeRelation;
  weight: number; // e.g., shared case count
  label?: string;
  animated?: boolean;
}

export interface SyndicateProfile {
  id: string;
  name: string; // e.g. "The Whitefield Cyber Ring"
  knownLeaderId?: string;
  knownLeaderName?: string;
  memberSuspectIds: string[];
  primaryCrimeCategory: string;
  territoryStations: string[];
  estimatedTotalHeistInr: number;
  threatLevel: 'Medium' | 'High' | 'Critical';
  activeCaseCount: number;
}

export interface NetworkTopologyPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  syndicates: SyndicateProfile[];
}

export type NetworkRole = 'Kingpin' | 'Broker' | 'Enforcer' | 'Associate';

export interface SuspectCentralityMetrics {
  suspectId: string;
  fullName: string;
  aliases: string[];
  gangAffiliation?: string;
  degreeCentrality: number;     // Number of distinct co-accused partners
  normalizedDegree: number;     // 0.0 - 1.0 (relative to max in network)
  pagerankScore: number;        // 0.0 - 1.0 (iterative centrality score)
  totalCases: number;
  criticalCasesCount: number;
  priorArrests: number;
  isRepeatOffender: boolean;
  compositeRiskScore: number;   // 0 - 100
  networkRole: NetworkRole;
  topCoAccused: {
    suspectId: string;
    fullName: string;
    sharedCaseCount: number;
  }[];
}

export interface NetworkCentralityResponse {
  suspects: SuspectCentralityMetrics[];
  summary: {
    totalSuspectsAnalyzed: number;
    kingpinCount: number;
    brokerCount: number;
    enforcerCount: number;
    associateCount: number;
    averageRiskScore: number;
  };
}

