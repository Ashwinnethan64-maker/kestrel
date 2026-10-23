import { Router } from 'express';
import { db } from '../db';
import { officers, casesFir, investigativeTasks } from '../db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import type { ApiResponse, OfficerWithWorkload } from '@kestrel/shared';

export const officersRouter = Router();

// Fallback officers roster matching seed.ts
const DEFAULT_FALLBACK_OFFICERS: OfficerWithWorkload[] = [
  {
    id: 'OFF-01',
    badgeNumber: 'KA-BLR-0552',
    name: 'Inspector Patil',
    email: 'patil.blr@ksp.gov.in',
    role: 'Investigator',
    station: 'Indiranagar',
    district: 'Bengaluru East',
    activeCaseCount: 4,
    pendingTaskCount: 3
  },
  {
    id: 'OFF-02',
    badgeNumber: 'KA-BLR-0331',
    name: 'Sub-Inspector Ramesh',
    email: 'ramesh.krp@ksp.gov.in',
    role: 'Investigator',
    station: 'K.R. Puram',
    district: 'Bengaluru East',
    activeCaseCount: 2,
    pendingTaskCount: 2
  },
  {
    id: 'OFF-03',
    badgeNumber: 'KA-BLR-0219',
    name: 'Inspector Ananya Sharma',
    email: 'ananya.cyber@ksp.gov.in',
    role: 'Investigator',
    station: 'Whitefield',
    district: 'Bengaluru East',
    activeCaseCount: 3,
    pendingTaskCount: 1
  },
  {
    id: 'OFF-04',
    badgeNumber: 'KA-BLR-0891',
    name: 'Inspector Raghavendra',
    email: 'raghavendra.cub@ksp.gov.in',
    role: 'Investigator',
    station: 'Cubbon Park',
    district: 'Bengaluru Central',
    activeCaseCount: 2,
    pendingTaskCount: 2
  },
  {
    id: 'OFF-05',
    badgeNumber: 'KA-BLR-0100',
    name: 'ACP Vikramaditya',
    email: 'acp.blr@ksp.gov.in',
    role: 'Superintendent',
    station: 'HQ Command',
    district: 'Bengaluru',
    activeCaseCount: 11,
    pendingTaskCount: 8
  }
];

// GET /api/officers - Roster of officers joined with active case & pending task counts
officersRouter.get('/', async (_req, res) => {
  try {
    const officerRows = await db.select().from(officers);

    if (!officerRows || officerRows.length === 0) {
      const response: ApiResponse<OfficerWithWorkload[]> = {
        success: true,
        data: DEFAULT_FALLBACK_OFFICERS,
        meta: {
          total: DEFAULT_FALLBACK_OFFICERS.length,
          timestamp: new Date().toISOString()
        }
      };
      res.json(response);
      return;
    }

    // Query active cases per officer
    const caseCounts = await db
      .select({
        officerId: casesFir.investigatingOfficerId,
        count: sql<number>`count(${casesFir.id})`
      })
      .from(casesFir)
      .where(ne(casesFir.status, 'Closed'))
      .groupBy(casesFir.investigatingOfficerId);

    const caseCountMap = new Map<string, number>();
    for (const row of caseCounts) {
      if (row.officerId) {
        caseCountMap.set(row.officerId, Number(row.count));
      }
    }

    // Query pending tasks per officer
    const taskCounts = await db
      .select({
        officerId: investigativeTasks.assignedOfficerId,
        count: sql<number>`count(${investigativeTasks.id})`
      })
      .from(investigativeTasks)
      .where(ne(investigativeTasks.status, 'Completed'))
      .groupBy(investigativeTasks.assignedOfficerId);

    const taskCountMap = new Map<string, number>();
    for (const row of taskCounts) {
      if (row.officerId) {
        taskCountMap.set(row.officerId, Number(row.count));
      }
    }

    const payload: OfficerWithWorkload[] = officerRows.map((o) => {
      const activeCaseCount = caseCountMap.get(o.id) ?? 0;
      const pendingTaskCount = taskCountMap.get(o.id) ?? 0;
      return {
        id: o.id,
        badgeNumber: o.badgeNumber,
        name: o.name,
        email: o.email,
        role: o.role as 'Investigator' | 'StationInCharge' | 'Superintendent',
        station: o.station,
        district: o.district,
        activeCaseCount,
        pendingTaskCount
      };
    });

    const response: ApiResponse<OfficerWithWorkload[]> = {
      success: true,
      data: payload,
      meta: {
        total: payload.length,
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error: any) {
    console.warn('[Officers Route] Database query failed, serving deterministic offline roster:', error.message);
    const response: ApiResponse<OfficerWithWorkload[]> = {
      success: true,
      data: DEFAULT_FALLBACK_OFFICERS,
      meta: {
        total: DEFAULT_FALLBACK_OFFICERS.length,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  }
});
