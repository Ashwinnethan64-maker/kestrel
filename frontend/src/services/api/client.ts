import { mockClient } from './mockClient';
import type { 
  ApiResponse, 
  FIRCase, 
  AccusedSuspect, 
  CaseFilterParams, 
  BoundingBox, 
  NetworkTopologyPayload, 
  TacticalAnalyticsSummary,
  GangTerritory,
  SpatioTemporalDensityResponse,
  NetworkCentralityResponse,
  SuspectCentralityMetrics,
  QueryIntentClassification,
  SemanticCaseSearchResult
} from '@kestrel/shared';

const isLiveMode = import.meta.env.VITE_API_SOURCE === 'live';

class LiveOrMockClient {
  private isLive: boolean = isLiveMode;

  setMode(mode: 'mock' | 'live') {
    this.isLive = mode === 'live';
    console.log(`[API Client] Active source mode: ${mode}`);
  }

  async getCases(filters?: CaseFilterParams): Promise<ApiResponse<FIRCase[]>> {
    if (!this.isLive) return mockClient.getCases(filters);
    const query = new URLSearchParams();
    if (filters?.policeStation) query.set('policeStation', filters.policeStation);
    if (filters?.crimeCategory) query.set('crimeCategory', filters.crimeCategory);
    if (filters?.priority) query.set('priority', filters.priority);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.searchQuery) query.set('searchQuery', filters.searchQuery);
    const res = await fetch(`/api/cases?${query.toString()}`);
    return res.json();
  }

  async getCaseById(id: string): Promise<ApiResponse<FIRCase | null>> {
    if (!this.isLive) return mockClient.getCaseById(id);
    const res = await fetch(`/api/cases/${encodeURIComponent(id)}`);
    return res.json();
  }

  async getAccused(searchQuery?: string): Promise<ApiResponse<AccusedSuspect[]>> {
    if (!this.isLive) return mockClient.getAccused(searchQuery);
    const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    const res = await fetch(`/api/accused${query}`);
    return res.json();
  }

  async getSpatialIncidents(bounds?: BoundingBox | null): Promise<ApiResponse<FIRCase[]>> {
    if (!this.isLive) return mockClient.getSpatialIncidents(bounds);
    let query = '';
    if (bounds) {
      const [[south, west], [north, east]] = bounds;
      query = `?south=${south}&west=${west}&north=${north}&east=${east}`;
    }
    const res = await fetch(`/api/spatial/incidents${query}`);
    return res.json();
  }

  async getNetworkTopology(focusedSuspectId?: string | null): Promise<ApiResponse<NetworkTopologyPayload>> {
    if (!this.isLive) return mockClient.getNetworkTopology(focusedSuspectId);
    const query = focusedSuspectId ? `?focusedSuspectId=${encodeURIComponent(focusedSuspectId)}` : '';
    const res = await fetch(`/api/network/topology${query}`);
    return res.json();
  }

  async getTacticalAnalytics(): Promise<ApiResponse<TacticalAnalyticsSummary>> {
    if (!this.isLive) return mockClient.getTacticalAnalytics();
    const res = await fetch('/api/analytics/summary');
    return res.json();
  }

  async getGangTerritories(gang?: string): Promise<ApiResponse<GangTerritory[]>> {
    if (!this.isLive) return mockClient.getGangTerritories(gang);
    const query = gang ? `?gang=${encodeURIComponent(gang)}` : '';
    const res = await fetch(`/api/spatial/territories${query}`);
    return res.json();
  }

  async getSpatialDensity(params?: { crimeCategory?: string; step?: number }): Promise<ApiResponse<SpatioTemporalDensityResponse>> {
    if (!this.isLive) return mockClient.getSpatialDensity();
    const query = new URLSearchParams();
    if (params?.crimeCategory) query.set('crimeCategory', params.crimeCategory);
    if (params?.step) query.set('step', String(params.step));
    const res = await fetch(`/api/spatial/density?${query.toString()}`);
    return res.json();
  }

  async getNetworkCentrality(filters?: { role?: string; minDegree?: number; limit?: number }): Promise<ApiResponse<NetworkCentralityResponse>> {
    if (!this.isLive) return mockClient.getNetworkCentrality(filters);
    const query = new URLSearchParams();
    if (filters?.role) query.set('role', filters.role);
    if (filters?.minDegree) query.set('minDegree', String(filters.minDegree));
    if (filters?.limit) query.set('limit', String(filters.limit));
    const res = await fetch(`/api/network/centrality?${query.toString()}`);
    return res.json();
  }

  async getSuspectCentralityMetrics(suspectId: string): Promise<ApiResponse<SuspectCentralityMetrics & { networkRank: number }>> {
    if (!this.isLive) return mockClient.getSuspectCentralityMetrics(suspectId);
    const res = await fetch(`/api/network/accused/${encodeURIComponent(suspectId)}/metrics`);
    return res.json();
  }

  async classifyIntent(query: string, context?: Record<string, unknown>): Promise<ApiResponse<QueryIntentClassification>> {
    if (!this.isLive) return mockClient.classifyIntent(query, context);
    const res = await fetch('/api/copilot/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...context })
    });
    return res.json();
  }

  async searchCasesBySemanticMO(query: string, limit: number = 5): Promise<ApiResponse<SemanticCaseSearchResult[]>> {
    if (!this.isLive) return mockClient.searchCasesBySemanticMO(query, limit);
    const res = await fetch('/api/copilot/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });
    return res.json();
  }
}

export const apiClient = new LiveOrMockClient();
export function setApiMode(mode: 'mock' | 'live') {
  apiClient.setMode(mode);
}

