import curatedDataset from '@shared/fixtures/bengaluru_crime_curated.json';
import {
  FIRCase,
  AccusedSuspect,
  CaseFilterParams,
  BoundingBox,
  NetworkTopologyPayload,
  TacticalAnalyticsSummary,
  ApiResponse
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
}

export const mockClient = new MockIntelClient();
