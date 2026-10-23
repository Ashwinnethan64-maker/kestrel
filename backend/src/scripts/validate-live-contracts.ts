import type { 
  ApiResponse, 
  FIRCase, 
  AccusedSuspect, 
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

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

interface ValidationResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  details: string;
  durationMs: number;
}

const results: ValidationResult[] = [];

async function validate<T>(
  name: string,
  method: string,
  path: string,
  body?: any,
  validator?: (data: T, meta?: any) => void
) {
  const start = Date.now();
  try {
    const opts: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${BASE_URL}${path}`, opts);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const envelope = (await res.json()) as ApiResponse<T>;
    if (typeof envelope.success !== 'boolean' || !envelope.success) {
      throw new Error(`Envelope 'success' is not true: ${JSON.stringify(envelope)}`);
    }
    if (envelope.data === undefined) {
      throw new Error(`Envelope 'data' is missing`);
    }
    if (!envelope.meta?.timestamp || isNaN(Date.parse(envelope.meta.timestamp))) {
      throw new Error(`Envelope 'meta.timestamp' is invalid: ${envelope.meta?.timestamp}`);
    }

    if (validator) {
      validator(envelope.data, envelope.meta);
    }

    results.push({
      endpoint: path,
      method,
      status: 'PASS',
      details: 'Conforms to ApiResponse<T> contract',
      durationMs: Date.now() - start
    });
  } catch (err: any) {
    results.push({
      endpoint: path,
      method,
      status: 'FAIL',
      details: err.message,
      durationMs: Date.now() - start
    });
  }
}

async function runAll() {
  console.log(`\n============================================================`);
  console.log(`[CONTRACT VALIDATION] Verifying Live API against @kestrel/shared`);
  console.log(`Target Backend: ${BASE_URL}`);
  console.log(`============================================================\n`);

  // 1. Health
  try {
    const hStart = Date.now();
    const hRes = await fetch(`${BASE_URL}/api/health`);
    const hData = await hRes.json();
    if (hData.status === 'ok') {
      results.push({
        endpoint: '/api/health',
        method: 'GET',
        status: 'PASS',
        details: 'Service healthy: ' + hData.service,
        durationMs: Date.now() - hStart
      });
    } else {
      throw new Error('Health check returned non-ok status');
    }
  } catch (err: any) {
    results.push({
      endpoint: '/api/health',
      method: 'GET',
      status: 'FAIL',
      details: err.message,
      durationMs: 0
    });
  }

  // 2. Cases Listing
  let sampleCaseId = '';
  await validate<FIRCase[]>('Cases List', 'GET', '/api/cases?limit=5', undefined, (cases) => {
    if (!Array.isArray(cases) || cases.length === 0) throw new Error('Expected non-empty FIRCase array');
    const c = cases[0];
    if (!c.firNumber || !c.crimeCategory || typeof c.latitude !== 'number' || typeof c.longitude !== 'number') {
      throw new Error(`Malformed FIRCase: ${JSON.stringify(c)}`);
    }
    sampleCaseId = c.id;
  });

  // 3. Case by ID
  if (sampleCaseId) {
    await validate<FIRCase>('Case Detail', 'GET', `/api/cases/${encodeURIComponent(sampleCaseId)}`, undefined, (c) => {
      if (!c.firNumber || !c.description) throw new Error('FIRCase missing firNumber or description');
    });
  }

  // 4. Accused List
  let sampleSuspectId = '';
  await validate<AccusedSuspect[]>('Accused List', 'GET', '/api/accused?limit=5', undefined, (suspects) => {
    if (!Array.isArray(suspects) || suspects.length === 0) throw new Error('Expected non-empty AccusedSuspect array');
    const s = suspects[0];
    if (!s.fullName || !s.riskLevel) throw new Error(`Malformed AccusedSuspect: ${JSON.stringify(s)}`);
    sampleSuspectId = s.id;
  });

  // 5. Accused by ID
  if (sampleSuspectId) {
    await validate<AccusedSuspect>('Accused Detail', 'GET', `/api/accused/${encodeURIComponent(sampleSuspectId)}`, undefined, (s) => {
      if (!s.fullName) throw new Error('AccusedSuspect missing fullName');
    });
  }

  // 6. Spatial Incidents Bounding Box
  await validate<FIRCase[]>('Spatial Incidents', 'GET', '/api/spatial/incidents?south=12.9&west=77.5&north=13.1&east=77.7&limit=10', undefined, (incidents) => {
    if (!Array.isArray(incidents)) throw new Error('Expected array of spatial incidents');
    if (incidents.length > 0 && typeof incidents[0].latitude !== 'number') throw new Error('Missing coordinates');
  });

  // 7. Spatial Gang Territories (Concave Hull)
  await validate<GangTerritory[]>('Gang Territories', 'GET', '/api/spatial/territories', undefined, (territories) => {
    if (!Array.isArray(territories)) throw new Error('Expected array of gang territories');
  });

  // 8. Spatio-Temporal Density
  await validate<SpatioTemporalDensityResponse>('Spatial Density', 'GET', '/api/spatial/density', undefined, (res) => {
    if (!Array.isArray(res.grid) || !Array.isArray(res.temporalMatrix)) {
      throw new Error('Density grid or temporalMatrix missing');
    }
  });

  // 9. Network Topology
  await validate<NetworkTopologyPayload>('Network Topology', 'GET', '/api/network/topology?limit=50', undefined, (topo) => {
    if (!Array.isArray(topo.nodes) || !Array.isArray(topo.edges)) {
      throw new Error('Topology missing nodes or edges array');
    }
  });

  // 10. Network Centrality
  await validate<NetworkCentralityResponse>('Network Centrality', 'GET', '/api/network/centrality?limit=5', undefined, (cent) => {
    if (!Array.isArray(cent.suspects) || !cent.summary) {
      throw new Error('NetworkCentralityResponse missing suspects or summary');
    }
  });

  // 11. Suspect Centrality Metrics
  if (sampleSuspectId) {
    await validate<SuspectCentralityMetrics & { networkRank: number }>(
      'Suspect Centrality Metrics',
      'GET',
      `/api/network/accused/${encodeURIComponent(sampleSuspectId)}/metrics`,
      undefined,
      (metrics) => {
        if (typeof metrics.networkRank !== 'number' || typeof metrics.compositeRiskScore !== 'number') {
          throw new Error('SuspectCentralityMetrics missing networkRank or compositeRiskScore');
        }
      }
    );
  }

  // 12. Tactical Analytics Summary
  await validate<TacticalAnalyticsSummary>('Tactical Analytics', 'GET', '/api/analytics/summary', undefined, (summary) => {
    if (typeof summary.incidentVelocity30DayChangePercent !== 'number' || typeof summary.recidivismIndexPercent !== 'number') {
      throw new Error('TacticalAnalyticsSummary missing numeric metrics');
    }
  });

  // 13. Crime Surges Detection
  await validate<CrimeSurgeResponse>('Crime Surges', 'GET', '/api/analytics/surges', undefined, (surges) => {
    if (!Array.isArray(surges.anomalies)) {
      throw new Error('CrimeSurgeResponse anomalies missing or not array');
    }
  });

  // 14. Copilot Intent Classification
  await validate<QueryIntentClassification>(
    'Copilot Intent',
    'POST',
    '/api/copilot/intent',
    { query: 'night burglaries in Indiranagar' },
    (intent) => {
      if (!intent.intent || typeof intent.confidence !== 'number') {
        throw new Error('QueryIntentClassification missing intent or confidence');
      }
    }
  );

  // 15. Semantic Case Search
  await validate<SemanticCaseSearchResult[]>(
    'Semantic MO Search',
    'POST',
    '/api/copilot/semantic-search',
    { query: 'laptop stolen while victim asleep', limit: 3 },
    (results) => {
      if (!Array.isArray(results)) {
        throw new Error('SemanticCaseSearchResult not an array');
      }
    }
  );

  // Summary Table
  console.log(`\n------------------------------------------------------------`);
  console.log(`VALIDATION RESULTS SUMMARY:`);
  console.log(`------------------------------------------------------------`);
  let passedCount = 0;
  for (const r of results) {
    const mark = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | ${r.method.padEnd(4)} ${r.endpoint.padEnd(45)} (${r.durationMs}ms) - ${r.details}`);
    if (r.status === 'PASS') passedCount++;
  }
  console.log(`------------------------------------------------------------`);
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
  console.log(`============================================================\n`);

  if (passedCount < results.length) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('[Fatal Error in Test Execution]:', err);
  process.exit(1);
});
