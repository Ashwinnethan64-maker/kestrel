import { Router } from 'express';
import { db } from '../db';
import { casesFir, caseAccusedJunction, entitiesAccused, caseEvidence } from '../db/schema';
import { eq, and, or, ilike, gte, lte, desc, sql } from 'drizzle-orm';
import type { ApiResponse, FIRCase } from '@kestrel/shared';

export const casesRouter = Router();

// GET /api/cases - Filtered & paginated FIR listing
casesRouter.get('/', async (req, res) => {
  try {
    const {
      district,
      policeStation,
      crimeCategory,
      priority,
      status,
      searchQuery,
      startDate,
      endDate,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (district) {
      conditions.push(ilike(casesFir.district, `%${String(district)}%`));
    }
    if (policeStation) {
      conditions.push(ilike(casesFir.policeStation, `%${String(policeStation)}%`));
    }
    if (crimeCategory) {
      conditions.push(ilike(casesFir.crimeCategory, `%${String(crimeCategory)}%`));
    }
    if (priority) {
      conditions.push(eq(casesFir.priority, String(priority)));
    }
    if (status) {
      conditions.push(eq(casesFir.status, String(status)));
    }
    if (startDate) {
      conditions.push(gte(casesFir.incidentDate, new Date(String(startDate))));
    }
    if (endDate) {
      conditions.push(lte(casesFir.incidentDate, new Date(String(endDate))));
    }
    if (searchQuery) {
      const q = `%${String(searchQuery)}%`;
      conditions.push(
        or(
          ilike(casesFir.firNumber, q),
          ilike(casesFir.description, q),
          ilike(casesFir.crimeCategory, q),
          ilike(casesFir.policeStation, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch total count for pagination metadata
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(casesFir)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Fetch paginated cases
    const rows = await db
      .select()
      .from(casesFir)
      .where(whereClause)
      .orderBy(desc(casesFir.incidentDate))
      .limit(limitNum)
      .offset(offset);

    const formatted: FIRCase[] = rows.map((r) => ({
      id: r.id,
      firNumber: r.firNumber,
      crimeCategory: r.crimeCategory,
      priority: (r.priority || 'Medium') as any,
      status: (r.status || 'Open') as any,
      incidentDate: r.incidentDate ? r.incidentDate.toISOString() : new Date().toISOString(),
      reportedDate: r.reportedDate ? r.reportedDate.toISOString() : new Date().toISOString(),
      district: r.district,
      policeStation: r.policeStation,
      investigatingOfficerId: r.investigatingOfficerId || undefined,
      description: r.description,
      descriptionKannada: r.descriptionKannada || undefined,
      applicableActs: (r.applicableActs as string[]) || [],
      latitude: r.latitude,
      longitude: r.longitude,
      accusedIds: [],
      evidenceIds: [],
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString()
    }));

    const response: ApiResponse<FIRCase[]> = {
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
    console.error('[Cases Route Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/cases/:id - Detailed case dossier with joined accused & evidence
casesRouter.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const foundRows = await db
      .select()
      .from(casesFir)
      .where(or(eq(casesFir.id, id), eq(casesFir.firNumber, id)))
      .limit(1);

    if (foundRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const c = foundRows[0];

    // Joined accused suspects
    const accusedRows = await db
      .select({
        junctionId: caseAccusedJunction.id,
        role: caseAccusedJunction.role,
        status: caseAccusedJunction.status,
        suspect: entitiesAccused
      })
      .from(caseAccusedJunction)
      .innerJoin(entitiesAccused, eq(caseAccusedJunction.accusedId, entitiesAccused.id))
      .where(eq(caseAccusedJunction.caseId, c.id));

    // Joined evidence records
    const evidenceRows = await db
      .select()
      .from(caseEvidence)
      .where(eq(caseEvidence.caseId, c.id));

    const detailedCase = {
      ...c,
      incidentDate: c.incidentDate?.toISOString(),
      reportedDate: c.reportedDate?.toISOString(),
      createdAt: c.createdAt?.toISOString(),
      updatedAt: c.updatedAt?.toISOString(),
      accused: accusedRows.map((a) => ({
        ...a.suspect,
        caseRole: a.role,
        caseStatus: a.status
      })),
      evidence: evidenceRows.map((e) => ({
        ...e,
        collectedDate: e.collectedDate?.toISOString()
      }))
    };

    res.json({
      success: true,
      data: detailedCase,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Case Detail Route Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});
