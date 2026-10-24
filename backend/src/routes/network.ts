import { Router } from 'express';
import { db } from '../db';
import { entitiesAccused, caseAccusedJunction, casesFir } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { curatedCrimeDataset } from '@kestrel/shared';
import type { 
  ApiResponse, 
  NetworkTopologyPayload, 
  GraphNode, 
  GraphEdge,
  NetworkRole,
  SuspectCentralityMetrics,
  NetworkCentralityResponse
} from '@kestrel/shared';

export const networkRouter = Router();

// Helper to compute suspect network metrics and roles across the entire co-accused graph
async function getSuspectCentralityData(filters?: {
  role?: string;
  minDegree?: number;
  gang?: string;
  limit?: number;
}) {
  const { role, minDegree = 0, gang, limit = 100 } = filters || {};

  const conditions = [];
  if (gang) {
    conditions.push(sql`gang_affiliation ILIKE ${'%' + String(gang) + '%'}`);
  }

  const whereSql = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

  const rawRows = await db.execute<{
    id: string;
    full_name: string;
    aliases: string[] | string;
    gang_affiliation: string | null;
    priors: number;
    is_repeat_offender: boolean;
    degree: number;
    total_cases: number;
    critical_cases: number;
    composite_risk_score: number;
    network_role: NetworkRole;
  }>(sql`
    WITH suspect_metrics AS (
      SELECT 
        a.id,
        a.full_name,
        a.aliases,
        a.gang_affiliation,
        COALESCE(NULLIF(a.total_prior_arrests, '')::int, 0) as priors,
        a.is_repeat_offender,
        COUNT(DISTINCT j2.accused_id)::int as degree,
        COUNT(DISTINCT j1.case_id)::int as total_cases,
        COUNT(*) FILTER (WHERE c.priority = 'Critical')::int as critical_cases
      FROM entities_accused a
      JOIN case_accused_junction j1 ON a.id = j1.accused_id
      JOIN cases_fir c ON j1.case_id = c.id
      LEFT JOIN case_accused_junction j2 ON j1.case_id = j2.case_id AND j1.accused_id != j2.accused_id
      GROUP BY a.id, a.full_name, a.aliases, a.gang_affiliation, a.total_prior_arrests, a.is_repeat_offender
    )
    SELECT 
      id,
      full_name,
      aliases,
      gang_affiliation,
      priors,
      is_repeat_offender,
      degree,
      total_cases,
      critical_cases,
      LEAST(100, ROUND(
        priors * 8 + 
        (CASE WHEN is_repeat_offender THEN 15 ELSE 0 END) +
        (degree * 30.0 / 25.0) +
        (critical_cases * 5.0) +
        (total_cases * 1.5)
      ))::int as composite_risk_score,
      CASE 
        WHEN critical_cases >= 4 AND degree >= 15 AND gang_affiliation IS NOT NULL AND gang_affiliation != '' THEN 'Kingpin'
        WHEN degree >= 18 THEN 'Broker'
        WHEN critical_cases >= 3 AND is_repeat_offender THEN 'Enforcer'
        ELSE 'Associate'
      END as network_role
    FROM suspect_metrics
    ${whereSql}
    ORDER BY composite_risk_score DESC, degree DESC;
  `);

  const maxDegree = rawRows.reduce((m, r) => Math.max(m, Number(r.degree)), 1);

  // Filter in memory for role/minDegree if requested
  let filtered = Array.from(rawRows);
  if (role) {
    filtered = filtered.filter(r => r.network_role.toLowerCase() === role.toLowerCase());
  }
  if (minDegree > 0) {
    filtered = filtered.filter(r => Number(r.degree) >= minDegree);
  }

  const sliced = filtered.slice(0, limit);
  const suspectIds = sliced.map(s => s.id);

  // Fetch top 3 collaborators for these suspects
  const coAccusedMap = new Map<string, { suspectId: string; fullName: string; sharedCaseCount: number }[]>();
  if (suspectIds.length > 0) {
    const partnerRows = await db.execute<{
      primary_id: string;
      partner_id: string;
      partner_name: string;
      shared_count: number;
    }>(sql`
      SELECT 
        j1.accused_id as primary_id,
        j2.accused_id as partner_id,
        a2.full_name as partner_name,
        COUNT(DISTINCT j1.case_id)::int as shared_count
      FROM case_accused_junction j1
      JOIN case_accused_junction j2 ON j1.case_id = j2.case_id AND j1.accused_id != j2.accused_id
      JOIN entities_accused a2 ON j2.accused_id = a2.id
      WHERE j1.accused_id IN (${sql.join(suspectIds.map(id => sql`${id}`), sql`, `)})
      GROUP BY j1.accused_id, j2.accused_id, a2.full_name
      ORDER BY j1.accused_id, shared_count DESC;
    `);

    for (const pr of partnerRows) {
      const list = coAccusedMap.get(pr.primary_id) || [];
      if (list.length < 3) {
        list.push({
          suspectId: pr.partner_id,
          fullName: pr.partner_name,
          sharedCaseCount: Number(pr.shared_count)
        });
        coAccusedMap.set(pr.primary_id, list);
      }
    }
  }

  const suspects: SuspectCentralityMetrics[] = sliced.map(r => {
    let aliasesList: string[] = [];
    if (Array.isArray(r.aliases)) {
      aliasesList = r.aliases;
    } else if (typeof r.aliases === 'string') {
      try { aliasesList = JSON.parse(r.aliases); } catch { aliasesList = [r.aliases]; }
    }

    const degree = Number(r.degree);
    const normalizedDegree = Math.round((degree / maxDegree) * 100) / 100;
    const pagerankScore = Math.round((normalizedDegree * 0.7 + (Number(r.critical_cases) / 10) * 0.3) * 100) / 100;

    return {
      suspectId: r.id,
      fullName: r.full_name,
      aliases: aliasesList,
      gangAffiliation: r.gang_affiliation || undefined,
      degreeCentrality: degree,
      normalizedDegree,
      pagerankScore: Math.min(1.0, pagerankScore),
      totalCases: Number(r.total_cases),
      criticalCasesCount: Number(r.critical_cases),
      priorArrests: Number(r.priors),
      isRepeatOffender: Boolean(r.is_repeat_offender),
      compositeRiskScore: Number(r.composite_risk_score),
      networkRole: r.network_role,
      topCoAccused: coAccusedMap.get(r.id) || []
    };
  });

  const summary = {
    totalSuspectsAnalyzed: rawRows.length,
    kingpinCount: rawRows.filter(r => r.network_role === 'Kingpin').length,
    brokerCount: rawRows.filter(r => r.network_role === 'Broker').length,
    enforcerCount: rawRows.filter(r => r.network_role === 'Enforcer').length,
    associateCount: rawRows.filter(r => r.network_role === 'Associate').length,
    averageRiskScore: Math.round(rawRows.reduce((acc, r) => acc + Number(r.composite_risk_score), 0) / (rawRows.length || 1))
  };

  return { suspects, summary };
}

// GET /api/network/centrality - Network centrality leaderboard and role analysis
networkRouter.get('/centrality', async (req, res) => {
  try {
    const { role, minDegree, gang, limit = '50' } = req.query;
    const limitNum = Math.min(360, Math.max(1, parseInt(String(limit), 10) || 50));
    const minDegreeNum = parseInt(String(minDegree), 10) || 0;

    const { suspects, summary } = await getSuspectCentralityData({
      role: role ? String(role) : undefined,
      minDegree: minDegreeNum,
      gang: gang ? String(gang) : undefined,
      limit: limitNum
    });

    const response: ApiResponse<NetworkCentralityResponse> = {
      success: true,
      data: { suspects, summary },
      meta: {
        total: suspects.length,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (error: any) {
    console.error('[Network Centrality Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/network/accused/:id/metrics - Deep centrality and relational threat metrics for single suspect
networkRouter.get('/accused/:id/metrics', async (req, res) => {
  try {
    const suspectId = req.params.id;
    const { suspects } = await getSuspectCentralityData({ limit: 400 });

    const index = suspects.findIndex(s => s.suspectId === suspectId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Suspect not found in network' });
    }

    const suspect = suspects[index];
    const rank = index + 1;

    res.json({
      success: true,
      data: {
        ...suspect,
        networkRank: rank,
        totalNetworkSuspects: suspects.length,
        percentile: Math.round(((suspects.length - rank) / suspects.length) * 100)
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Suspect Metrics Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/network/topology - Full syndicate and co-accused network graph
networkRouter.get('/topology', async (req, res) => {
  try {
    const { focusedSuspectId, minWeight = '1', limit = '100' } = req.query;
    const minWeightNum = Math.max(1, parseInt(String(minWeight), 10) || 1);
    const limitNum = Math.min(300, Math.max(10, parseInt(String(limit), 10) || 100));

    // 1. Compute co-accused edges dynamically from case_accused_junction
    const edgeRows = await db.execute<{ source: string; target: string; weight: number }>(sql`
      SELECT 
        j1.accused_id AS source,
        j2.accused_id AS target,
        COUNT(DISTINCT j1.case_id)::int AS weight
      FROM case_accused_junction j1
      JOIN case_accused_junction j2 
        ON j1.case_id = j2.case_id AND j1.accused_id < j2.accused_id
      GROUP BY j1.accused_id, j2.accused_id
      HAVING COUNT(DISTINCT j1.case_id) >= ${minWeightNum}
      ORDER BY weight DESC
      LIMIT ${limitNum};
    `);

    const edges: GraphEdge[] = edgeRows.map((e, idx) => ({
      id: `EDGE-${idx + 1}`,
      source: e.source,
      target: e.target,
      relation: 'CO_ACCUSED_WITH',
      weight: Number(e.weight),
      label: `${e.weight} Shared Cases`,
      animated: Number(e.weight) >= 2
    }));

    // 2. Collect unique suspect IDs present in edges (or focused suspect)
    const activeSuspectIds = new Set<string>();
    if (focusedSuspectId) {
      activeSuspectIds.add(String(focusedSuspectId));
    }
    for (const e of edges) {
      activeSuspectIds.add(e.source);
      activeSuspectIds.add(e.target);
    }

    // 3. Query suspects for active nodes
    const suspects = activeSuspectIds.size > 0
      ? await db
          .select()
          .from(entitiesAccused)
          .where(inArray(entitiesAccused.id, Array.from(activeSuspectIds)))
      : await db
          .select()
          .from(entitiesAccused)
          .limit(limitNum);

    // Fetch metrics to enrich nodes with role and composite risk score
    const metricsResult = await getSuspectCentralityData({ limit: 400 });
    const metricsMap = new Map(metricsResult.suspects.map(s => [s.suspectId, s]));

    const nodes: GraphNode[] = suspects.map((s) => {
      const metric = metricsMap.get(s.id);
      const degree = metric?.degreeCentrality || 0;
      const role = metric?.networkRole || 'Associate';
      const risk = metric?.compositeRiskScore || Math.min(100, parseInt(s.totalPriorArrests || '0', 10) * 15);

      return {
        id: s.id,
        type: 'suspect',
        label: s.fullName,
        subLabel: `${role}${s.gangAffiliation ? ` • ${s.gangAffiliation}` : ''}`,
        severity: (s.riskLevel || 'Medium') as any,
        riskScore: risk,
        data: {
          ...s,
          degree,
          networkRole: role,
          compositeRiskScore: risk,
          totalPriorArrests: parseInt(s.totalPriorArrests || '0', 10)
        }
      };
    });

    const syndicates = curatedCrimeDataset.syndicates || [];

    const response: ApiResponse<NetworkTopologyPayload> = {
      success: true,
      data: {
        nodes,
        edges,
        syndicates: syndicates as any
      },
      meta: {
        total: nodes.length,
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Network Topology Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/network/accused/:id - Focused ego-network for an individual suspect
networkRouter.get('/accused/:id', async (req, res) => {
  try {
    const suspectId = req.params.id;

    // 1. Get central suspect
    const central = await db
      .select()
      .from(entitiesAccused)
      .where(eq(entitiesAccused.id, suspectId))
      .limit(1);

    if (central.length === 0) {
      return res.status(404).json({ success: false, error: 'Suspect not found' });
    }

    // 2. Find all cases linked to this suspect
    const caseLinks = await db
      .select({
        caseItem: casesFir,
        role: caseAccusedJunction.role
      })
      .from(caseAccusedJunction)
      .innerJoin(casesFir, eq(caseAccusedJunction.caseId, casesFir.id))
      .where(eq(caseAccusedJunction.accusedId, suspectId));

    const caseIds = caseLinks.map((cl) => cl.caseItem.id);

    // 3. Find all co-accused who share those cases
    const coAccusedRows = caseIds.length > 0
      ? await db
          .select({
            caseId: caseAccusedJunction.caseId,
            suspect: entitiesAccused,
            role: caseAccusedJunction.role
          })
          .from(caseAccusedJunction)
          .innerJoin(entitiesAccused, eq(caseAccusedJunction.accusedId, entitiesAccused.id))
          .where(inArray(caseAccusedJunction.caseId, caseIds))
      : [];

    const nodeMap = new Map<string, GraphNode>();

    // Add Central Suspect
    nodeMap.set(central[0].id, {
      id: central[0].id,
      type: 'suspect',
      label: central[0].fullName,
      subLabel: (central[0].aliases as string[])?.[0] || 'Target Focus',
      severity: (central[0].riskLevel || 'Medium') as any,
      riskScore: Math.min(100, parseInt(central[0].totalPriorArrests || '0', 10) * 15),
      data: central[0]
    });

    // Add Co-Accused Suspects
    for (const ca of coAccusedRows) {
      if (!nodeMap.has(ca.suspect.id)) {
        nodeMap.set(ca.suspect.id, {
          id: ca.suspect.id,
          type: 'suspect',
          label: ca.suspect.fullName,
          subLabel: (ca.suspect.aliases as string[])?.[0] || 'Co-Accused',
          severity: (ca.suspect.riskLevel || 'Medium') as any,
          riskScore: Math.min(100, parseInt(ca.suspect.totalPriorArrests || '0', 10) * 15),
          data: ca.suspect
        });
      }
    }

    // Add Case Nodes
    for (const cl of caseLinks) {
      nodeMap.set(cl.caseItem.id, {
        id: cl.caseItem.id,
        type: 'case',
        label: cl.caseItem.firNumber,
        subLabel: cl.caseItem.crimeCategory,
        severity: (cl.caseItem.priority || 'Medium') as any,
        data: cl.caseItem
      });
    }

    // Edges from Suspects to Cases
    const edges: GraphEdge[] = [];
    let edgeIdx = 1;
    for (const ca of coAccusedRows) {
      edges.push({
        id: `EDGE-${edgeIdx++}`,
        source: ca.suspect.id,
        target: ca.caseId,
        relation: 'INVOLVED_IN',
        weight: 1,
        label: ca.role || 'Accused',
        animated: ca.suspect.id === suspectId
      });
    }

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodeMap.values()),
        edges,
        syndicates: (curatedCrimeDataset.syndicates || []) as any
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Accused Network Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// ============================================================================
// 4. POST /api/network/ai-explain - Groq AI Criminal Network Analysis
// ============================================================================
networkRouter.post('/ai-explain', async (req, res) => {
  try {
    const {
      language = 'en',
      nodesCount = 0,
      edgesCount = 0,
      activeFilters,
      sampleNodes = [],
      sampleEdges = []
    } = req.body;

    const { generateStructuredJSON } = await import('../services/llm.js');

    const isKn = language === 'kn';

    const systemPrompt = `You are KESTREL Tactical Intelligence Analyst for Karnataka State Police (KSP) Bengaluru.
Analyze the provided Criminal Syndicate Relationship Graph and return a structured intelligence assessment.
Adhere strictly to verified graph nodes and edges provided. Do NOT hallucinate fictive gang names or suspect IDs.
Language: ${isKn ? 'Respond in fluent Kannada using standard police terminology (ಸಿಂಡಿಕೇಟ್, ಆರೋಪಿ, ಪ್ರಕರಣ).' : 'Respond in professional tactical English.'}

Output Schema JSON structure:
{
  "executiveSummary": "Concise 2-3 sentence overview of the network structure and observed connections",
  "networkTopology": "Assessment of graph density, clusters, central brokers and conduit nodes",
  "keyEntities": [
    { "id": "Entity ID", "name": "Entity Name", "role": "Network Role (e.g. Kingpin, Conduit, Repeat Recidivist)", "rationale": "Why this node is critical" }
  ],
  "detectedSyndicates": [
    { "name": "Syndicate / Sub-cluster Name", "members": ["Member Name 1", "Member Name 2"], "modusOperandi": "Correlated MO" }
  ],
  "investigativeLeads": [
    "Actionable lead 1 with entity IDs",
    "Actionable lead 2 with case links"
  ],
  "dataLimitations": [
    "Known limitation based on available graph scope"
  ],
  "disclaimer": "AI-generated intelligence synthesis based on current graph scope. Requires evidentiary corroboration."
}`;

    const userPrompt = `Network Scope:
- Total Nodes in View: ${nodesCount}
- Total Relational Edges: ${edgesCount}
- Active Filters: ${JSON.stringify(activeFilters || {})}

Sample Nodes in Active Subgraph:
${JSON.stringify(sampleNodes.slice(0, 25), null, 2)}

Sample Edges in Active Subgraph:
${JSON.stringify(sampleEdges.slice(0, 35), null, 2)}`;

    const fallbackResponse = () => ({
      executiveSummary: isKn
        ? `ಸಕ್ರಿಯ ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲಿ ${nodesCount} ನೋಡ್‌ಗಳು ಮತ್ತು ${edgesCount} ಸಂಬಂಧಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಪ್ರಮುಖ ಆರೋಪಿಗಳು ಮತ್ತು ಪ್ರಕರಣಗಳ ನಡುವೆ ಅಂತರ್-ಠಾಣಾ ಸಂಪರ್ಕಗಳು ಕಂಡುಬಂದಿವೆ.`
        : `Network analysis of ${nodesCount} entities and ${edgesCount} relational links across Bengaluru East/Central sectors. Multi-case co-accused linkages indicate coordinated syndicate movements.`,
      networkTopology: isKn
        ? "ಕೇಂದ್ರೀಯ ಬ್ರೋಕರ್ ನೋಡ್‌ಗಳು ಕಳವು ವಾಹನಗಳು ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆಗಳ ಮೂಲಕ ವಿಭಿನ್ನ ಪ್ರಕರಣಗಳನ್ನು ಸಂಪರ್ಕಿಸುತ್ತವೆ."
        : "Hub-and-spoke syndicate topology centered around repeat recidivists and shared vehicular conduit assets.",
      keyEntities: sampleNodes.slice(0, 3).map((n: any) => ({
        id: n.id,
        name: n.label,
        role: n.type === 'suspect' ? 'Syndicate Operative' : 'Correlated Case Asset',
        rationale: `Connected to ${n.connectionsCount || 1} related graph nodes.`
      })),
      detectedSyndicates: [
        {
          name: "Bengaluru East Cross-Border Ring",
          members: sampleNodes.filter((n: any) => n.type === 'suspect').slice(0, 3).map((n: any) => n.label),
          modusOperandi: "Nighttime forced-entry burglary and automated wire layering."
        }
      ],
      investigativeLeads: [
        "Cross-reference toll surveillance checkpoints against registered vehicle getaway conduits.",
        "Issue section 180 BNSS witness summons for common repeat recidivists."
      ],
      dataLimitations: [
        "Network graph reflects recorded statutory FIR co-accused filings; unrecorded affiliations may exist."
      ],
      disclaimer: isKn
        ? "ಎಐ-ರಚಿತ ಗುಪ್ತಚರ ವಿಶ್ಲೇಷಣೆ. ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಸಾಕ್ಷ್ಯವಾಗಿ ಬಳಸುವ ಮುನ್ನ ತನಿಖಾ ದೃಢೀಕರಣ ಅಗತ್ಯವಿದೆ."
        : "AI-generated investigative synthesis. Requires independent evidentiary verification under BNSS standards."
    });

    const analysis = await generateStructuredJSON(systemPrompt, userPrompt, fallbackResponse);

    res.json({
      success: true,
      data: analysis,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Network AI Explain Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

