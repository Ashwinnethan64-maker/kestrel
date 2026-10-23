import curatedDataset from '@shared/fixtures/bengaluru_crime_curated.json';
import {
  FIRCase,
  AccusedSuspect,
  CaseFilterParams,
  BoundingBox,
  NetworkTopologyPayload,
  TacticalAnalyticsSummary,
  ApiResponse,
  GangTerritory,
  SpatioTemporalDensityResponse,
  NetworkRole,
  SuspectCentralityMetrics,
  NetworkCentralityResponse
} from '@kestrel/shared';

export class MockIntelClient {
  private cases: FIRCase[] = (curatedDataset.cases || []) as FIRCase[];
  private suspects: AccusedSuspect[] = (curatedDataset.suspects || []) as AccusedSuspect[];
  private syndicates = curatedDataset.syndicates || [];

  async getCases(filters?: CaseFilterParams): Promise<ApiResponse<FIRCase[]>> {
    let result = [...this.cases];

    if (filters?.policeStation) {
      result = result.filter((c) => c.policeStation.toLowerCase() === filters.policeStation?.toLowerCase());
    }
    if (filters?.crimeCategory) {
      result = result.filter((c) => c.crimeCategory.toLowerCase().includes(filters.crimeCategory!.toLowerCase()));
    }
    if (filters?.priority) {
      result = result.filter((c) => c.priority === filters.priority);
    }
    if (filters?.status) {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.firNumber.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.applicableActs.some((a) => a.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      data: result,
      meta: {
        total: result.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  async getCaseById(id: string): Promise<ApiResponse<FIRCase | null>> {
    const found = this.cases.find((c) => c.id === id || c.firNumber === id) || null;
    return {
      success: !!found,
      data: found,
      meta: { timestamp: new Date().toISOString() }
    };
  }

  async getAccused(searchQuery?: string): Promise<ApiResponse<AccusedSuspect[]>> {
    let result = [...this.suspects];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.aliases.some((a) => a.toLowerCase().includes(q)) ||
          s.gangAffiliation?.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      data: result,
      meta: { total: result.length, timestamp: new Date().toISOString() }
    };
  }

  async getSpatialIncidents(bounds?: BoundingBox | null): Promise<ApiResponse<FIRCase[]>> {
    let result = [...this.cases];
    if (bounds) {
      const [[south, west], [north, east]] = bounds;
      result = result.filter(
        (c) => c.latitude >= south && c.latitude <= north && c.longitude >= west && c.longitude <= east
      );
    }
    return {
      success: true,
      data: result,
      meta: { total: result.length, timestamp: new Date().toISOString() }
    };
  }

  async getNetworkTopology(focusedSuspectId?: string | null): Promise<ApiResponse<NetworkTopologyPayload>> {
    const nodes = this.suspects.map((s) => ({
      id: s.id,
      type: 'suspect' as const,
      label: s.fullName,
      subLabel: s.aliases[0] || s.gangAffiliation,
      severity: s.riskLevel,
      riskScore: s.totalPriorArrests * 15,
      data: { ...s }
    }));

    const edges = [
      { id: 'E-01', source: 'SUSP-001', target: 'SUSP-002', relation: 'CO_ACCUSED_WITH' as const, weight: 3, animated: true },
      { id: 'E-02', source: 'SUSP-001', target: 'SUSP-003', relation: 'CO_ACCUSED_WITH' as const, weight: 2, animated: true },
      { id: 'E-03', source: 'SUSP-001', target: 'SUSP-004', relation: 'CO_ACCUSED_WITH' as const, weight: 1, animated: false },
      { id: 'E-04', source: 'SUSP-005', target: 'SUSP-006', relation: 'CO_ACCUSED_WITH' as const, weight: 2, animated: true },
      { id: 'E-05', source: 'SUSP-005', target: 'SUSP-007', relation: 'CO_ACCUSED_WITH' as const, weight: 2, animated: true },
      { id: 'E-06', source: 'SUSP-008', target: 'SUSP-009', relation: 'CO_ACCUSED_WITH' as const, weight: 3, animated: true },
      { id: 'E-07', source: 'SUSP-008', target: 'SUSP-010', relation: 'CO_ACCUSED_WITH' as const, weight: 1, animated: false }
    ];

    return {
      success: true,
      data: {
        nodes,
        edges,
        syndicates: this.syndicates as any
      },
      meta: { timestamp: new Date().toISOString() }
    };
  }

  async getTacticalAnalytics(): Promise<ApiResponse<TacticalAnalyticsSummary>> {
    return {
      success: true,
      data: {
        incidentVelocity30DayChangePercent: -14.2,
        recidivismIndexPercent: 38.5,
        openCriticalCases: 3,
        activeSyndicatesCount: this.syndicates.length,
        stationClearanceRates: [
          { station: 'Indiranagar', total: 18, cleared: 14, ratePercent: 77.7 },
          { station: 'K.R. Puram', total: 24, cleared: 16, ratePercent: 66.6 },
          { station: 'Whitefield', total: 31, cleared: 22, ratePercent: 70.9 },
          { station: 'Cubbon Park', total: 12, cleared: 10, ratePercent: 83.3 }
        ]
      },
      meta: { timestamp: new Date().toISOString() }
    };
  }

  async getGangTerritories(gang?: string): Promise<ApiResponse<GangTerritory[]>> {
    const syndicates = this.syndicates || [];
    const territories: GangTerritory[] = syndicates.map((s: any) => {
      const center = s.operatingZones?.[0]?.center || { latitude: 12.9716, longitude: 77.5946 };
      const d = 0.015;
      return {
        gangAffiliation: s.name,
        caseCount: s.linkedCaseFirs?.length || 5,
        suspectCount: s.suspectIds?.length || 3,
        areaSqKm: Math.round((Math.PI * Math.pow(s.operatingZones?.[0]?.radiusMeters || 3000, 2) / 1000000) * 100) / 100,
        centroid: center,
        dominantCategory: s.primaryCrime || 'Organized Burglary',
        threatLevel: (s.threatLevel || 'High') as any,
        geojson: {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [center.longitude - d, center.latitude - d],
              [center.longitude + d, center.latitude - d],
              [center.longitude + d, center.latitude + d],
              [center.longitude - d, center.latitude + d],
              [center.longitude - d, center.latitude - d]
            ]]
          },
          properties: {
            gangAffiliation: s.name,
            threatLevel: s.threatLevel
          }
        }
      };
    });

    const filtered = gang 
      ? territories.filter((t) => t.gangAffiliation.toLowerCase().includes(gang.toLowerCase()))
      : territories;

    return {
      success: true,
      data: filtered,
      meta: { total: filtered.length, timestamp: new Date().toISOString() }
    };
  }

  async getSpatialDensity(): Promise<ApiResponse<SpatioTemporalDensityResponse>> {
    const grid = [
      { cellId: 'CELL-1', latitude: 12.9784, longitude: 77.6408, totalIncidents: 28, criticalCount: 6, dominantCategory: 'Armed Robbery', densityWeight: 1.0 },
      { cellId: 'CELL-2', latitude: 12.9352, longitude: 77.6245, totalIncidents: 24, criticalCount: 4, dominantCategory: 'House Burglary', densityWeight: 0.85 },
      { cellId: 'CELL-3', latitude: 12.9698, longitude: 77.7500, totalIncidents: 21, criticalCount: 8, dominantCategory: 'Cyber Fraud', densityWeight: 0.75 },
      { cellId: 'CELL-4', latitude: 13.0075, longitude: 77.6959, totalIncidents: 16, criticalCount: 3, dominantCategory: 'Vehicle Theft', densityWeight: 0.57 }
    ];

    const temporalMatrix = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        temporalMatrix.push({
          dayOfWeek: d,
          hourOfDay: h,
          incidentCount: (h >= 1 && h <= 4) || (h >= 20 && h <= 23) ? 12 : 3
        });
      }
    }

    return {
      success: true,
      data: {
        grid,
        temporalMatrix,
        peakWindow: {
          dayOfWeek: 6,
          hourOfDay: 21,
          incidentCount: 29,
          description: 'Saturday around 21:00 hrs (29 active cases)'
        },
        hotspots: [
          {
            id: 'HOTSPOT-1',
            stationName: 'Indiranagar Sector 1',
            district: 'Bengaluru East',
            center: { latitude: 12.9784, longitude: 77.6408 },
            radiusMeters: 600,
            incidentCount: 28,
            dominantCrime: 'Armed Robbery',
            riskScore: 100
          }
        ]
      },
      meta: { timestamp: new Date().toISOString() }
    };
  }

  async getNetworkCentrality(filters?: { role?: string; minDegree?: number; limit?: number }): Promise<ApiResponse<NetworkCentralityResponse>> {
    const list: SuspectCentralityMetrics[] = this.suspects.map((s, idx) => {
      const priors = parseInt(String(s.totalPriorArrests || '0'), 10);
      const isRepeat = Boolean(s.isRepeatOffender);
      const degree = (idx % 5) * 4 + 3;
      const criticalCases = (idx % 3) * 2;
      const totalCases = 4 + degree;
      const risk = Math.min(100, priors * 8 + (isRepeat ? 15 : 0) + Math.round(degree * 1.2) + criticalCases * 5);
      
      let role: NetworkRole = 'Associate';
      if (criticalCases >= 4 && degree >= 15) role = 'Kingpin';
      else if (degree >= 16) role = 'Broker';
      else if (criticalCases >= 3 && isRepeat) role = 'Enforcer';

      return {
        suspectId: s.id,
        fullName: s.fullName,
        aliases: s.aliases || [],
        gangAffiliation: s.gangAffiliation,
        degreeCentrality: degree,
        normalizedDegree: Math.round((degree / 25) * 100) / 100,
        pagerankScore: Math.round((degree / 25 * 0.7 + (criticalCases / 10) * 0.3) * 100) / 100,
        totalCases,
        criticalCasesCount: criticalCases,
        priorArrests: priors,
        isRepeatOffender: isRepeat,
        compositeRiskScore: risk,
        networkRole: role,
        topCoAccused: []
      };
    });

    list.sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);

    let filtered = list;
    if (filters?.role) {
      filtered = filtered.filter(s => s.networkRole.toLowerCase() === filters.role?.toLowerCase());
    }
    if (filters?.minDegree) {
      filtered = filtered.filter(s => s.degreeCentrality >= filters.minDegree!);
    }
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return {
      success: true,
      data: {
        suspects: filtered,
        summary: {
          totalSuspectsAnalyzed: list.length,
          kingpinCount: list.filter(s => s.networkRole === 'Kingpin').length,
          brokerCount: list.filter(s => s.networkRole === 'Broker').length,
          enforcerCount: list.filter(s => s.networkRole === 'Enforcer').length,
          associateCount: list.filter(s => s.networkRole === 'Associate').length,
          averageRiskScore: 68
        }
      },
      meta: { total: filtered.length, timestamp: new Date().toISOString() }
    };
  }

  async getSuspectCentralityMetrics(suspectId: string): Promise<ApiResponse<SuspectCentralityMetrics & { networkRank: number }>> {
    const all = await this.getNetworkCentrality();
    const index = all.data.suspects.findIndex(s => s.suspectId === suspectId);
    const found = all.data.suspects[index] || all.data.suspects[0];
    return {
      success: !!found,
      data: { ...found, networkRank: index >= 0 ? index + 1 : 1 },
      meta: { timestamp: new Date().toISOString() }
    };
  }
}

export const mockClient = new MockIntelClient();


