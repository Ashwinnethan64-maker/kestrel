import { Router } from 'express';
import { db } from '../db';
import { casesFir } from '../db/schema';
import { and, eq, ilike, sql } from 'drizzle-orm';
import type { ApiResponse, FIRCase } from '@kestrel/shared';

export const spatialRouter = Router();

// GET /api/spatial/incidents - PostGIS Bounding Box query
spatialRouter.get('/incidents', async (req, res) => {
  try {
    const { south, west, north, east, crimeCategory, priority, limit = '200' } = req.query;

    const limitNum = Math.min(1000, Math.max(1, parseInt(String(limit), 10) || 200));
    const conditions = [];

    if (south && west && north && east) {
      const s = parseFloat(String(south));
      const w = parseFloat(String(west));
      const n = parseFloat(String(north));
      const e = parseFloat(String(east));

      conditions.push(
        sql`ST_Contains(ST_MakeEnvelope(${w}, ${s}, ${e}, ${n}, 4326), ${casesFir.locationGeom})`
      );
    }

    if (crimeCategory) {
      conditions.push(ilike(casesFir.crimeCategory, `%${String(crimeCategory)}%`));
    }
    if (priority) {
      conditions.push(eq(casesFir.priority, String(priority)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(casesFir)
      .where(whereClause)
      .limit(limitNum);

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
        total: formatted.length,
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Spatial Incidents Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/spatial/radius - Incidents within radius around an anchor or officer location
spatialRouter.get('/radius', async (req, res) => {
  try {
    const { lat, lng, radiusMeters = '5000', limit = '100' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng parameters are required' });
    }

    const latNum = parseFloat(String(lat));
    const lngNum = parseFloat(String(lng));
    const radiusNum = Math.max(100, parseFloat(String(radiusMeters)) || 5000);
    const limitNum = Math.min(500, Math.max(1, parseInt(String(limit), 10) || 100));

    const rows = await db
      .select({
        caseItem: casesFir,
        distanceMeters: sql<number>`round(ST_Distance(${casesFir.locationGeom}::geography, ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography)::numeric, 1)`
      })
      .from(casesFir)
      .where(
        sql`ST_DWithin(${casesFir.locationGeom}::geography, ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography, ${radiusNum})`
      )
      .orderBy(sql`ST_Distance(${casesFir.locationGeom}::geography, ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography)`)
      .limit(limitNum);

    const formatted = rows.map((r) => ({
      ...r.caseItem,
      distanceMeters: Number(r.distanceMeters),
      incidentDate: r.caseItem.incidentDate?.toISOString(),
      reportedDate: r.caseItem.reportedDate?.toISOString(),
      createdAt: r.caseItem.createdAt?.toISOString(),
      updatedAt: r.caseItem.updatedAt?.toISOString()
    }));

    res.json({
      success: true,
      data: formatted,
      meta: {
        total: formatted.length,
        radiusMeters: radiusNum,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Spatial Radius Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});
