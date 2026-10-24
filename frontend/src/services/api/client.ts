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
  CopilotResponseChunk,
  NetworkAIAnalysisRequest,
  NetworkAIAnalysisResponse,
  MapAIAnalysisRequest,
  MapAIAnalysisResponse,
  AnalyticsAIAnalysisRequest,
  AnalyticsAIAnalysisResponse
} from '@kestrel/shared';

import { useInvestigationContext } from '../../store/useInvestigationContext';

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
  status?: string;
  policeStation?: string;
  district?: string;
  searchQuery?: string;
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
  private _isLive: boolean = isLiveMode && !isOfflineMode;
  public onStatusChange?: (status: 'connected' | 'offline_manual' | 'offline_fallback', reason?: string) => void;

  get isLive(): boolean {
    if (typeof window !== 'undefined') {
      const isManualOffline = localStorage.getItem('kestrel_offline_mode') === 'true';
      if (isManualOffline) return false;
    }
    return this._isLive;
  }

  getMode(): 'mock' | 'live' {
    return this.isLive ? 'live' : 'mock';
  }

  setMode(mode: 'mock' | 'live') {
    this._isLive = mode === 'live';
    console.log(`[API Client] Active source mode switched to: ${mode}`);
  }

  private notifyDegraded(reason: string) {
    if (this.onStatusChange) {
      this.onStatusChange('offline_fallback', reason);
    }
    try {
      const store = useInvestigationContext?.getState?.();
      if (store && !store.isOfflineMode && store.backendStatus !== 'offline_fallback') {
        store.setBackendStatus('offline_fallback');
      }
    } catch (_) {}
  }

  private notifyConnected() {
    if (this.onStatusChange) {
      this.onStatusChange('connected');
    }
    try {
      const store = useInvestigationContext?.getState?.();
      if (store && !store.isOfflineMode && store.backendStatus === 'offline_fallback') {
        store.setBackendStatus('connected');
      }
    } catch (_) {}
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
        this.notifyDegraded(`Live HTTP ${res.status}`);
        return fallbackFn();
      }
      this.notifyConnected();
      const data = await res.json();
      return data as ApiResponse<T>;
    } catch (err: any) {
      console.warn(`[API Client] Live connection failed on ${endpoint}: ${err.message}. Seamlessly falling back to mock.`);
      this.notifyDegraded(`Connection failed: ${err.message}`);
      return fallbackFn();
    }
  }

  async createCase(
    newCase: Omit<FIRCase, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<FIRCase, 'id'>>
  ): Promise<ApiResponse<FIRCase>> {
    return this.safeFetch<FIRCase>(
      '/api/cases',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCase)
      },
      () => mockClient.createCase(newCase)
    );
  }

  async getEvidenceByCaseId(caseId: string): Promise<ApiResponse<any[]>> {
    return this.safeFetch<any[]>(
      `/api/cases/${encodeURIComponent(caseId)}`,
      { method: 'GET' },
      () => mockClient.getEvidenceByCaseId(caseId)
    ).then((res) => {
      if (res.data && (res.data as any).evidence) {
        return {
          ...res,
          data: (res.data as any).evidence
        };
      }
      return res as any;
    });
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
    query.set('limit', filters?.limit ? String(filters.limit) : '250');

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
    if (options?.status) query.set('status', options.status);
    if (options?.policeStation) query.set('policeStation', options.policeStation);
    if (options?.district) query.set('district', options.district);
    if (options?.searchQuery) query.set('searchQuery', options.searchQuery);
    query.set('limit', options?.limit ? String(options.limit) : '250');

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

  async explainNetwork(payload: NetworkAIAnalysisRequest): Promise<ApiResponse<NetworkAIAnalysisResponse>> {
    return this.safeFetch<NetworkAIAnalysisResponse>(
      '/api/network/ai-explain',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      () => Promise.resolve({
        success: true,
        data: {
          executiveSummary: payload.language === 'kn'
            ? `ಸಕ್ರಿಯ ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲಿ ${payload.nodesCount} ನೋಡ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಆರೋಪಿಗಳ ನಡುವೆ ಪ್ರಮುಖ ಸಂಪರ್ಕಗಳು ಪತ್ತೆಯಾಗಿವೆ.`
            : `Network analysis of ${payload.nodesCount} entities and ${payload.edgesCount} relational links across active graph scope.`,
          networkTopology: payload.language === 'kn'
            ? 'ಕೇಂದ್ರೀಯ ಬ್ರೋಕರ್ ನೋಡ್‌ಗಳು ಪ್ರಕರಣಗಳನ್ನು ಸಂಪರ್ಕಿಸುತ್ತವೆ.'
            : 'Central broker nodes bridge property crimes with common vehicular conduits.',
          keyEntities: (payload.sampleNodes || []).slice(0, 3).map((n) => ({
            id: n.id,
            name: n.label,
            role: n.type === 'suspect' ? 'Key Accused' : 'Case Anchor',
            rationale: `Associated with ${n.connectionsCount || 1} network links.`
          })),
          detectedSyndicates: [
            {
              name: 'East-Central Coordinated Network',
              members: (payload.sampleNodes || []).filter((n) => n.type === 'suspect').slice(0, 2).map((n) => n.label),
              modusOperandi: 'Cross-jurisdictional forced entry and rapid vehicle getaway.'
            }
          ],
          investigativeLeads: [
            'Correlate toll surveillance timestamps against registered getaway vehicles.',
            'Issue statutory witness summons for linked repeat offenders.'
          ],
          dataLimitations: [
            'Analysis constrained to actively rendered nodes in current graph viewport.'
          ],
          disclaimer: payload.language === 'kn'
            ? 'ಎಐ-ರಚಿತ ಗುಪ್ತಚರ ವಿಶ್ಲೇಷಣೆ. ತನಿಖಾ ದೃಢೀಕರಣ ಅಗತ್ಯವಿದೆ.'
            : 'AI-generated network synthesis based on supplied graph scope. Requires evidentiary corroboration.'
        },
        meta: { timestamp: new Date().toISOString() }
      })
    );
  }

  async analyzeMapArea(payload: MapAIAnalysisRequest): Promise<ApiResponse<MapAIAnalysisResponse>> {
    return this.safeFetch<MapAIAnalysisResponse>(
      '/api/spatial/ai-analyse-area',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      () => Promise.resolve({
        success: true,
        data: {
          summary: payload.language === 'kn'
            ? `${payload.selectedRegion || 'ಆಯ್ದ ವಲಯ'}ದಲ್ಲಿ ${payload.totalIncidents} ಘಟನೆಗಳು ದಾಖಲಾಗಿವೆ.`
            : `Geospatial analysis across ${payload.selectedRegion || 'selected region'} encompassing ${payload.totalIncidents} incidents.`,
          hotspotClusters: Object.entries(payload.stationBreakdown || {}).slice(0, 3).map(([area, count]) => ({
            area,
            dominantCategory: Object.keys(payload.categoryBreakdown || {})[0] || 'Property Crime',
            incidentCount: count,
            tacticalAssessment: 'High incidence cluster along arterial transit routes.'
          })),
          temporalPatterns: payload.language === 'kn'
            ? 'ರಾತ್ರಿ ವೇಳೆಯಲ್ಲಿ ಘಟನೆಗಳ ಸಂಖ್ಯೆ ಹೆಚ್ಚಿದೆ.'
            : 'Incident distribution demonstrates peak clustering during late nocturnal hours.',
          investigativeDirectives: [
            'Reinforce dynamic motorcycle patrol beats at major transit choke points.',
            'Audit ANPR coverage across high-risk jurisdictional perimeters.'
          ],
          dataLimitations: [
            'Based on geocoded incidents within the currently filtered map boundary.'
          ],
          disclaimer: payload.language === 'kn'
            ? 'ಎಐ-ರಚಿತ ಪ್ರಾದೇಶಿಕ ವಿಶ್ಲೇಷಣೆ. ಅಧಿಕೃತ ಪೊಲೀಸ್ ಅನುಮೋದನೆ ಅಗತ್ಯವಿದೆ.'
            : 'AI-generated spatial assessment. Deployments subject to jurisdictional command verification.'
        },
        meta: { timestamp: new Date().toISOString() }
      })
    );
  }

  async analyzeAnalytics(payload: AnalyticsAIAnalysisRequest): Promise<ApiResponse<AnalyticsAIAnalysisResponse>> {
    return this.safeFetch<AnalyticsAIAnalysisResponse>(
      '/api/analytics/ai-insights',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      () => Promise.resolve({
        success: true,
        data: {
          executiveSummary: payload.language === 'kn'
            ? `ಒಟ್ಟು ${payload.metrics.totalFIRs} ಪ್ರಕರಣಗಳಲ್ಲಿ ${payload.metrics.criticalCount} ತೀವ್ರ ಸ್ವರೂಪದ ಅಪರಾಧಗಳು ದಾಖಲಾಗಿವೆ. ಇತ್ಯರ್ಥ ದರ ಶೇ. ${payload.metrics.clearanceRatePercent} ರಷ್ಟಿದೆ.`
            : `Strategic audit of ${payload.metrics.totalFIRs} FIR records (${payload.metrics.criticalCount} critical) with ${payload.metrics.clearanceRatePercent}% overall clearance rate.`,
          keyObservedTrends: [
            `Dominant incident categories include ${Object.keys(payload.metrics.categoryDistribution || {}).slice(0, 2).join(' and ')}.`,
            `Station caseload distribution is highest in ${Object.keys(payload.metrics.stationDistribution || {}).slice(0, 2).join(' and ')}.`
          ],
          categoryJurisdictionComparisons: [
            'Significant caseload disparity observed between commercial urban centers and perimeter stations.'
          ],
          potentialExplanations: [
            'Elevated commercial density and transit nodes correlate with property and cyber fraud concentration.'
          ],
          investigativeQuestions: [
            'Are patrol shift schedules aligned with nocturnal high-incident periods?',
            'Can inter-station evidence exchange accelerate chargesheeting for repeat offenders?'
          ],
          dataLimitations: [
            'Observations reflect strictly the filtered analytics scope parameters.'
          ],
          disclaimer: payload.language === 'kn'
            ? 'ಎಐ-ರಚಿತ ಅಂಕಿಅಂಶ ವಿಶ್ಲೇಷಣೆ. ರಾಜ್ಯ ಅಪರಾಧ ದಾಖಲೆಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.'
            : 'AI-generated analytical assessment. Every quantitative assertion is derived from the supplied dataset scope.'
        },
        meta: { timestamp: new Date().toISOString() }
      })
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

        this.notifyConnected();
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
        this.notifyDegraded(`Live stream error: ${err.message}`);
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

