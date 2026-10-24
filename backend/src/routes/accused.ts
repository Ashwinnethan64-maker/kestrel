import { Router } from 'express';
import { db } from '../db';
import { entitiesAccused, caseAccusedJunction, casesFir } from '../db/schema';
import { eq, and, or, ilike, sql } from 'drizzle-orm';
import type { ApiResponse, AccusedSuspect } from '@kestrel/shared';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const curatedFixtures = _require('../../../packages/shared/src/fixtures/bengaluru_crime_curated.json') as Record<string, any>;

export const accusedRouter = Router();

// GET /api/accused - Filtered & paginated suspect list
accusedRouter.get('/', async (req, res) => {
  try {
    const {
      searchQuery,
      search,
      riskLevel,
      gangAffiliation,
      isRepeatOffender,
      page = '1',
      limit = '100'
    } = req.query;

    const effectiveSearch = searchQuery || search;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(1000, Math.max(1, parseInt(String(limit), 10) || 100));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (riskLevel) {
      conditions.push(eq(entitiesAccused.riskLevel, String(riskLevel)));
    }
    if (gangAffiliation) {
      conditions.push(ilike(entitiesAccused.gangAffiliation, `%${String(gangAffiliation)}%`));
    }
    if (isRepeatOffender !== undefined) {
      conditions.push(eq(entitiesAccused.isRepeatOffender, String(isRepeatOffender) === 'true'));
    }
    if (effectiveSearch) {
      const q = `%${String(effectiveSearch)}%`;
      conditions.push(
        or(
          ilike(entitiesAccused.fullName, q),
          ilike(entitiesAccused.gangAffiliation, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(entitiesAccused)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const rows = await db
      .select()
      .from(entitiesAccused)
      .where(whereClause)
      .limit(limitNum)
      .offset(offset);

    const formatted: AccusedSuspect[] = rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      aliases: (r.aliases as string[]) || [],
      isRepeatOffender: Boolean(r.isRepeatOffender),
      riskLevel: (r.riskLevel || 'Medium') as any,
      gangAffiliation: r.gangAffiliation || undefined,
      phoneNumbers: (r.phoneNumbers as string[]) || [],
      knownAddresses: (r.knownAddresses as string[]) || [],
      vehiclePlates: (r.vehiclePlates as string[]) || [],
      totalPriorArrests: parseInt(r.totalPriorArrests || '0', 10),
      bailStatus: (r.bailStatus || 'None') as any,
      activeCaseIds: [],
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
    }));

    const response: ApiResponse<AccusedSuspect[]> = {
      success: true,
      data: formatted,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error: any) {
    console.warn('[Accused Route DB Warning]: Using curated intelligence fixtures (database offline).');
    const suspects = (curatedFixtures as any).suspects || [];
    res.json({
      success: true,
      data: suspects,
      meta: {
        total: suspects.length,
        page: 1,
        limit: suspects.length,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET /api/accused/:id - Detailed suspect profile with linked cases
accusedRouter.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const found = await db
      .select()
      .from(entitiesAccused)
      .where(eq(entitiesAccused.id, id))
      .limit(1);

    if (found.length === 0) {
      return res.status(404).json({ success: false, error: 'Suspect not found' });
    }

    const suspect = found[0];

    // Query all cases this suspect is linked to
    const linkedCases = await db
      .select({
        junction: caseAccusedJunction,
        caseItem: casesFir
      })
      .from(caseAccusedJunction)
      .innerJoin(casesFir, eq(caseAccusedJunction.caseId, casesFir.id))
      .where(eq(caseAccusedJunction.accusedId, suspect.id));

    const response = {
      ...suspect,
      totalPriorArrests: parseInt(suspect.totalPriorArrests || '0', 10),
      createdAt: suspect.createdAt?.toISOString(),
      linkedCases: linkedCases.map((lc) => ({
        ...lc.caseItem,
        roleInCase: lc.junction.role,
        statusInCase: lc.junction.status,
        incidentDate: lc.caseItem.incidentDate?.toISOString()
      }))
    };

    res.json({
      success: true,
      data: response,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Accused Detail Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});
