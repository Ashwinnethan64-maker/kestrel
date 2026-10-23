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
  SemanticCaseSearchResult,
  CrimeSurgeResponse
} from '@kestrel/shared';

const isLiveMode = import.meta.env.VITE_API_SOURCE === 'live';
const isOfflineMode = import.meta.env.VITE_OFFLINE_MODE === 'true';

export interface AccusedFilterParams {
  searchQuery?: string;
  riskLevel?: string;
  gangAffiliation?: string;
  isRepeatOffender?: boolean;
  page?: number;
  limit?: number;
}

export interface SpatialIncidentOptions {
  crimeCategory?: string;
  priority?: string;
  limit?: number;
}

export interface NetworkTopologyOptions {
  minWeight?: number;
  limit?: number;
}

class LiveOrMockClient {
  private isLive: boolean = isLiveMode && !isOfflineMode;

  getMode(): 'mock' | 'live' {
    return this.isLive ? 'live' : 'mock';
  }

  setMode(mode: 'mock' | 'live') {
    this.isLive = mode === 'live';
    console.log(`[API Client] Active source mode switched to: ${mode}`);
  }

  private async safeFetch<T>(
    endpoint: string, 
    init: RequestInit, 
    fallbackFn: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    if (!this.isLive) {
      return fallbackFn();
    }
    try {
      const res = await fetch(endpoint, init);
      if (!res.ok) {
        console.warn(`[API Client] Live endpoint ${endpoint} returned HTTP ${res.status}. Falling back to mock.`);
        return fallbackFn();
      }
      const data = await res.json();
      return data as ApiResponse<T>;
    } catch (err: any) {
      console.warn(`[API Client] Live connection failed on ${endpoint}: ${err.message}. Seamlessly falling back to mock.`);
      return fallbackFn();
    }
  }

  async getCases(filters?: CaseFilterParams): Promise<ApiResponse<FIRCase[]>> {
    const query = new URLSearchParams();
    if (filters?.policeStation) query.set('policeStation', filters.policeStation);
    if (filters?.district) query.set('district', filters.district);
    if (filters?.crimeCategory) query.set('crimeCategory', filters.crimeCategory);
    if (filters?.priority) query.set('priority', filters.priority);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.searchQuery) query.set('searchQuery', filters.searchQuery);
    if (filters?.startDate) query.set('startDate', filters.startDate);
    if (filters?.endDate) query.set('endDate', filters.endDate);
    if (filters?.page) query.set('page', String(filters.page));
    query.set('limit', filters?.limit ? String(filters.limit) : '1500');

    return this.safeFetch<FIRCase[]>(
      `/api/cases?${query.toString()}`,
      { method: 'GET' },
      () => mockClient.getCases(filters)
    );
  }

  async getCaseById(id: string): Promise<ApiResponse<FIRCase | null>> {
    return this.safeFetch<FIRCase | null>(
      `/api/cases/${encodeURIComponent(id)}`,
      { method: 'GET' },
      () => mockClient.getCaseById(id)
    );
  }

  async getAccused(paramsOrSearch?: string | AccusedFilterParams): Promise<ApiResponse<AccusedSuspect[]>> {
    const query = new URLSearchParams();
    if (typeof paramsOrSearch === 'string') {
      if (paramsOrSearch.trim()) {
        query.set('searchQuery', paramsOrSearch.trim());
      }
      query.set('limit', '500');
    } else if (paramsOrSearch) {
      if (paramsOrSearch.searchQuery) query.set('searchQuery', paramsOrSearch.searchQuery);
      if (paramsOrSearch.riskLevel) query.set('riskLevel', paramsOrSearch.riskLevel);
      if (paramsOrSearch.gangAffiliation) query.set('gangAffiliation', paramsOrSearch.gangAffiliation);
      if (paramsOrSearch.isRepeatOffender !== undefined) {
        query.set('isRepeatOffender', String(paramsOrSearch.isRepeatOffender));
      }
      if (paramsOrSearch.page) query.set('page', String(paramsOrSearch.page));
      query.set('limit', paramsOrSearch.limit ? String(paramsOrSearch.limit) : '500');
    } else {
      query.set('limit', '500');
    }

    const searchStr = typeof paramsOrSearch === 'string' ? paramsOrSearch : paramsOrSearch?.searchQuery;
    return this.safeFetch<AccusedSuspect[]>(
      `/api/accused?${query.toString()}`,
      { method: 'GET' },
      () => mockClient.getAccused(searchStr)
    );
  }

  async getSpatialIncidents(
    bounds?: BoundingBox | null,
    options?: SpatialIncidentOptions
  ): Promise<ApiResponse<FIRCase[]>> {
    const query = new URLSearchParams();
    if (bounds) {
      const [[south, west], [north, east]] = bounds;
      query.set('south', String(south));
      query.set('west', String(west));
      query.set('north', String(north));
      query.set('east', String(east));
    }
    if (options?.crimeCategory) query.set('crimeCategory', options.crimeCategory);
    if (options?.priority) query.set('priority', options.priority);
    query.set('limit', options?.limit ? String(options.limit) : '1000');

    return this.safeFetch<FIRCase[]>(
      `/api/spatial/incidents?${query.toString()}`,
      { method: 'GET' },
      () => mockClient.getSpatialIncidents(bounds)
    );
  }

  async getNetworkTopology(
    focusedSuspectId?: string | null,
    options?: NetworkTopologyOptions
  ): Promise<ApiResponse<NetworkTopologyPayload>> {
    const query = new URLSearchParams();
    if (focusedSuspectId) query.set('focusedSuspectId', focusedSuspectId);
    if (options?.minWeight) query.set('minWeight', String(options.minWeight));
    query.set('limit', options?.limit ? String(options.limit) : '200');

    return this.safeFetch<NetworkTopologyPayload>(
      `/api/network/topology?${query.toString()}`,
      { method: 'GET' },
      () => mockClient.getNetworkTopology(focusedSuspectId)
    );
  }

  async getTacticalAnalytics(): Promise<ApiResponse<TacticalAnalyticsSummary>> {
    return this.safeFetch<TacticalAnalyticsSummary>(
      '/api/analytics/summary',
      { method: 'GET' },
      () => mockClient.getTacticalAnalytics()
    );
  }

  async getGangTerritories(gang?: string): Promise<ApiResponse<GangTerritory[]>> {
    const query = gang ? `?gang=${encodeURIComponent(gang)}` : '';
    return this.safeFetch<GangTerritory[]>(
      `/api/spatial/territories${query}`,
      { method: 'GET' },
      () => mockClient.getGangTerritories(gang)
    );
  }

  async getSpatialDensity(params?: { crimeCategory?: string; step?: number }): Promise<ApiResponse<SpatioTemporalDensityResponse>> {
    const query = new URLSearchParams();
    if (params?.crimeCategory) query.set('crimeCategory', params.crimeCategory);
    if (params?.step) query.set('step', String(params.step));

    return this.safeFetch<SpatioTemporalDensityResponse>(
      `/api/spatial/density?${query.toString()}`,
      { method: 'GET' },
      () => mockClient.getSpatialDensity()
    );
  }

  async getNetworkCentrality(filters?: { role?: string; minDegree?: number; limit?: number }): Promise<ApiResponse<NetworkCentralityResponse>> {
    const query = new URLSearchParams();
    if (filters?.role) query.set('role', filters.role);
    if (filters?.minDegree) query.set('minDegree', String(filters.minDegree));
    if (filters?.limit) query.set('limit', String(filters.limit));

    return this.safeFetch<NetworkCentralityResponse>(
      `/api/network/centrality?${query.toString()}`,
      { method: 'GET' },
      () => mockClient.getNetworkCentrality(filters)
    );
  }

  async getSuspectCentralityMetrics(suspectId: string): Promise<ApiResponse<SuspectCentralityMetrics & { networkRank: number }>> {
    return this.safeFetch<SuspectCentralityMetrics & { networkRank: number }>(
      `/api/network/accused/${encodeURIComponent(suspectId)}/metrics`,
      { method: 'GET' },
      () => mockClient.getSuspectCentralityMetrics(suspectId)
    );
  }

  async classifyIntent(query: string, context?: Record<string, unknown>): Promise<ApiResponse<QueryIntentClassification>> {
    return this.safeFetch<QueryIntentClassification>(
      '/api/copilot/intent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, ...context })
      },
      () => mockClient.classifyIntent(query, context)
    );
  }

  async searchCasesBySemanticMO(query: string, limit: number = 5): Promise<ApiResponse<SemanticCaseSearchResult[]>> {
    return this.safeFetch<SemanticCaseSearchResult[]>(
      '/api/copilot/semantic-search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit })
      },
      () => mockClient.searchCasesBySemanticMO(query, limit)
    );
  }

  async getCrimeSurges(threshold?: number, windowDays?: number): Promise<ApiResponse<CrimeSurgeResponse>> {
    const query = new URLSearchParams();
    if (threshold !== undefined) query.set('threshold', String(threshold));
    if (windowDays !== undefined) query.set('windowDays', String(windowDays));

    return this.safeFetch<CrimeSurgeResponse>(
      `/api/analytics/surges?${query.toString()}`,
      { method: 'GET' },
      () => mockClient.getCrimeSurges(threshold, windowDays)
    );
  }
}

export const apiClient = new LiveOrMockClient();
export function setApiMode(mode: 'mock' | 'live') {
  apiClient.setMode(mode);
}

