import { Router } from 'express';
import { db } from '../db';
import { entitiesAccused, caseAccusedJunction, casesFir } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { curatedCrimeDataset } from '@kestrel/shared';
import type { ApiResponse, NetworkTopologyPayload, GraphNode, GraphEdge } from '@kestrel/shared';

export const networkRouter = Router();

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

    const nodes: GraphNode[] = suspects.map((s) => ({
      id: s.id,
      type: 'suspect',
      label: s.fullName,
      subLabel: (s.aliases as string[])?.[0] || s.gangAffiliation || undefined,
      severity: (s.riskLevel || 'Medium') as any,
      riskScore: Math.min(100, parseInt(s.totalPriorArrests || '0', 10) * 15 + (s.isRepeatOffender ? 20 : 0)),
      data: {
        ...s,
        totalPriorArrests: parseInt(s.totalPriorArrests || '0', 10)
      }
    }));

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
