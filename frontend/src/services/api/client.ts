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
  CrimeSurgeResponse,
  CopilotPromptEnvelope,
  CopilotResponseChunk
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

export interface CopilotStreamCallbacks {
  onToken: (token: string) => void;
  onCitation?: (firs: string[]) => void;
  onAction?: (action: { actionType: string; payload: Record<string, unknown> }) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
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

  streamCopilotQuery(
    envelope: CopilotPromptEnvelope,
    callbacks: CopilotStreamCallbacks
  ): () => void {
    const controller = new AbortController();
    const { signal } = controller;

    const runLiveStream = async () => {
      try {
        const res = await fetch('/api/copilot/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
          signal
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const chunk: CopilotResponseChunk = JSON.parse(jsonStr);
              if (chunk.type === 'token' && chunk.content) {
                callbacks.onToken(chunk.content);
              } else if (chunk.type === 'citation' && chunk.citedFirNumbers) {
                callbacks.onCitation?.(chunk.citedFirNumbers);
              } else if (chunk.type === 'action' && chunk.suggestedAction) {
                callbacks.onAction?.(chunk.suggestedAction as any);
              } else if (chunk.type === 'done') {
                callbacks.onDone();
                return;
              }
            } catch (e) {
              console.warn('[Copilot SSE Parse Warning]:', e);
            }
          }
        }
        callbacks.onDone();
      } catch (err: any) {
        if (signal.aborted) {
          callbacks.onDone();
          return;
        }
        console.warn(`[Copilot Live Stream Failed: ${err.message}] Running fallback simulation.`);
        this.runFallbackStream(envelope, callbacks, signal);
      }
    };

    if (this.isLive) {
      runLiveStream();
    } else {
      this.runFallbackStream(envelope, callbacks, signal);
    }

    return () => controller.abort();
  }

  private runFallbackStream(
    envelope: CopilotPromptEnvelope,
    callbacks: CopilotStreamCallbacks,
    signal: AbortSignal
  ) {
    const q = envelope.query.toLowerCase();
    let text = "";
    let citations: string[] = [];

    if (q.includes("indiranagar") || q.includes("burglary") || q.includes("robbery")) {
      text = envelope.language === 'kn'
        ? "ಇಂದಿರಾನಗರ ವಲಯದ ಪರಿಶೀಲನೆಯಲ್ಲಿ 3 ಸಶಸ್ತ್ರ ದರೋಡೆ ಮತ್ತು ಕನ್ನಗಳವು ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ. ಆರೋಪಿಗಳು KA-04-E-1234 ಕಪ್ಪು ಕಾರನ್ನು ಬಳಸಿದ್ದಾರೆ. ರಾಜು ನಾಯಕ್ ಗ್ಯಾಂಗ್ ಈ ಅಪರಾಧಗಳಲ್ಲಿ ಭಾಗಿಯಾಗಿರುವ ಶಂಕೆಯಿದೆ."
        : "Analysis of the Indiranagar jurisdictional sector correlates multiple commercial burglaries and armed robberies within the past 48 hours. Primary modus operandi: nighttime retail entrance forced with hydraulic cutters and getaway sedan KA-04-E-1234. Associated repeat offender Raju Nayak ('Snake') bailed 4 days prior.";
      citations = ["FIR-2024-INDR-0102", "FIR-2024-INDR-0105"];
    } else if (q.includes("vehicle") || q.includes("ka-04") || q.includes("car")) {
      text = envelope.language === 'kn'
        ? "ವಾಹನ ನೋಂದಣಿ KA-04-E-1234 (ಕಪ್ಪು ವರ್ನಾ) ಕೆ.ಆರ್. ಪುರಂನಲ್ಲಿ ಕಳವು ಮಾಡಲಾಗಿದ್ದು, ನಂತರ ಇಂದಿರಾನಗರ ದರೋಡೆಗೆ ಬಳಸಲಾಗಿದೆ ಎಂದು ತನಿಖೆಯಲ್ಲಿ ದೃಢಪಟ್ಟಿದೆ."
        : "Cross-referencing vehicle telemetry: Black sedan KA-04-E-1234 was stolen via electronic CAN-bus key bypass in K.R. Puram residential parking lot (FIR-2024-KRP-0215) and subsequently deployed as the tactical getaway vehicle in the Indiranagar Armed Robbery.";
      citations = ["FIR-2024-KRP-0215", "FIR-2024-INDR-0102"];
    } else if (q.includes("whitefield") || q.includes("cyber") || q.includes("fraud")) {
      text = envelope.language === 'kn'
        ? "ವೈಟ್‌ಫೀಲ್ಡ್ ಸೈಬರ್ ಅಪರಾಧ ತನಿಖೆಯಲ್ಲಿ 24 ಲಕ್ಷ ರೂ. ಬ್ಯಾಂಕಿಂಗ್ ವರ್ಗಾವಣೆ ಪತ್ತೆಯಾಗಿದೆ. ಅಪರಾಧ ಸಂಬಂಧಿ APK ಬೈನರಿ 'ApexCrypto' ಪತ್ತೆಯಾಗಿದೆ."
        : "Financial intelligence audit confirms Whitefield Cyber Banking Ring routes illicit extortion capital through 6 layered bank mule accounts. Seized mobile devices verify malicious Android binary 'ApexCrypto' communicating with C2 infrastructure.";
      citations = ["FIR-2024-WFD-0301", "FIR-2024-WFD-0305"];
    } else {
      text = envelope.language === 'kn'
        ? `ರಾಜ್ಯ ಅಪರಾಧ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ: ${envelope.query} ಕುರಿತಂತೆ ಸಂಬಂಧಿತ ಎಫ್‌ಐಆರ್ ಪ್ರಕರಣಗಳು ಮತ್ತು ಪ್ರಮುಖ ಆರೋಪಿಗಳ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಕಾನೂನು ಸೆಕ್ಷನ್‌ಗಳು: IPC 379, IPC 392, ಮತ್ತು IPC 420.`
        : `Grounded Intelligence Synthesis: Query "${envelope.query}" cross-matched across active FIR cases and linked syndicate networks. Current clearance rate stands at 74.6% with high-priority statutory acts registered under IPC 392, IPC 379, and IPC 120B.`;
      citations = ["FIR-2024-INDR-0102"];
    }

    if (citations.length > 0) {
      callbacks.onCitation?.(citations);
    }

    const words = text.split(/(\s+)/);
    let index = 0;

    const interval = setInterval(() => {
      if (signal.aborted || index >= words.length) {
        clearInterval(interval);
        if (!signal.aborted) callbacks.onDone();
        return;
      }
      callbacks.onToken(words[index]);
      index++;
    }, 25);
  }
}

export const apiClient = new LiveOrMockClient();
export function setApiMode(mode: 'mock' | 'live') {
  apiClient.setMode(mode);
}

