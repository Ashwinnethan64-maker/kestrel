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
