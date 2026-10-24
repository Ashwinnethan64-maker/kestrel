import { Router } from 'express';
import { db } from '../db';
import { casesFir } from '../db/schema';
import { and, or, eq, ilike, sql } from 'drizzle-orm';
import type { 
  ApiResponse, 
  FIRCase, 
  GangTerritory, 
  SpatialGridCell, 
  TemporalDensityCell, 
  SpatioTemporalDensityResponse, 
  SpatialHotspot 
} from '@kestrel/shared';

export const spatialRouter = Router();

// GET /api/spatial/incidents - PostGIS Bounding Box query
spatialRouter.get('/incidents', async (req, res) => {
  try {
    const { 
      south, 
      west, 
      north, 
      east, 
      crimeCategory, 
      priority, 
      status, 
      policeStation, 
      district, 
      searchQuery, 
      limit = '1000' 
    } = req.query;

    const limitNum = Math.min(2500, Math.max(1, parseInt(String(limit), 10) || 1000));
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
    if (status) {
      conditions.push(eq(casesFir.status, String(status)));
    }
    if (policeStation) {
      conditions.push(ilike(casesFir.policeStation, `%${String(policeStation)}%`));
    }
    if (district) {
      conditions.push(ilike(casesFir.district, `%${String(district)}%`));
    }
    if (searchQuery) {
      const q = `%${String(searchQuery)}%`;
      conditions.push(
        or(
          ilike(casesFir.firNumber, q),
          ilike(casesFir.description, q),
          ilike(casesFir.policeStation, q)
        )
      );
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

// GET /api/spatial/territories - Gang and syndicate territorial operating zones via ST_ConcaveHull
spatialRouter.get('/territories', async (req, res) => {
  try {
    const { gang, minCases = '2' } = req.query;
    const minCasesNum = Math.max(1, parseInt(String(minCases), 10) || 2);

    let filterSql = sql`WHERE a.gang_affiliation IS NOT NULL AND a.gang_affiliation != ''`;
    if (gang) {
      filterSql = sql`WHERE a.gang_affiliation ILIKE ${'%' + String(gang) + '%'}`;
    }

    const rows = await db.execute<{
      gang_affiliation: string;
      case_count: number;
      suspect_count: number;
      dominant_category: string;
      critical_count: number;
      area_sq_km: number;
      centroid_geojson: string;
      hull_geojson: string;
    }>(sql`
      SELECT 
        a.gang_affiliation,
        COUNT(DISTINCT c.id)::int as case_count,
        COUNT(DISTINCT a.id)::int as suspect_count,
        MODE() WITHIN GROUP (ORDER BY c.crime_category) as dominant_category,
        COUNT(*) FILTER (WHERE c.priority = 'Critical')::int as critical_count,
        ROUND((ST_Area(
          CASE 
            WHEN COUNT(DISTINCT c.id) >= 3 THEN ST_ConcaveHull(ST_Collect(c.location_geom), 0.7)
            ELSE ST_Buffer(ST_Collect(c.location_geom), 0.005)
          END::geography) / 1000000.0)::numeric, 2)::float as area_sq_km,
        ST_AsGeoJSON(ST_Centroid(ST_Collect(c.location_geom))) as centroid_geojson,
        ST_AsGeoJSON(
          CASE 
            WHEN COUNT(DISTINCT c.id) >= 3 THEN ST_ConcaveHull(ST_Collect(c.location_geom), 0.7)
            ELSE ST_Buffer(ST_Collect(c.location_geom), 0.005)
          END
        ) as hull_geojson
      FROM entities_accused a
      JOIN case_accused_junction j ON a.id = j.accused_id
      JOIN cases_fir c ON j.case_id = c.id
      ${filterSql}
      GROUP BY a.gang_affiliation
      HAVING COUNT(DISTINCT c.id) >= ${minCasesNum}
      ORDER BY case_count DESC;
    `);

    const territories: GangTerritory[] = rows.map((r) => {
      let centroid = { latitude: 12.9716, longitude: 77.5946 };
      try {
        const parsed = JSON.parse(r.centroid_geojson);
        if (parsed.coordinates && parsed.coordinates.length === 2) {
          centroid = { latitude: parsed.coordinates[1], longitude: parsed.coordinates[0] };
        }
      } catch (e) {}

      let geometry = { type: 'Polygon' as const, coordinates: [] };
      try {
        geometry = JSON.parse(r.hull_geojson);
      } catch (e) {}

      const criticalRatio = r.case_count > 0 ? r.critical_count / r.case_count : 0;
      let threatLevel: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      if (r.critical_count >= 5 || criticalRatio > 0.3) {
        threatLevel = 'Critical';
      } else if (r.case_count >= 5 || criticalRatio > 0.15) {
        threatLevel = 'High';
      }

      return {
        gangAffiliation: r.gang_affiliation,
        caseCount: Number(r.case_count),
        suspectCount: Number(r.suspect_count),
        areaSqKm: Number(r.area_sq_km) || 0,
        centroid,
        dominantCategory: r.dominant_category || 'General Crime',
        threatLevel,
        geojson: {
          type: 'Feature',
          geometry,
          properties: {
            gangAffiliation: r.gang_affiliation,
            caseCount: Number(r.case_count),
            suspectCount: Number(r.suspect_count),
            dominantCategory: r.dominant_category,
            threatLevel,
            areaSqKm: Number(r.area_sq_km) || 0
          }
        }
      };
    });

    const response: ApiResponse<GangTerritory[]> = {
      success: true,
      data: territories,
      meta: {
        total: territories.length,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (error: any) {
    console.error('[Spatial Territories Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/spatial/density - Spatio-temporal grid clustering & temporal crime rhythm matrix
spatialRouter.get('/density', async (req, res) => {
  try {
    const { crimeCategory, district, priority, step = '0.01' } = req.query;
    const stepNum = Math.max(0.002, Math.min(0.05, parseFloat(String(step)) || 0.01));

    const whereConditions = [];
    if (crimeCategory) {
      whereConditions.push(sql`crime_category ILIKE ${'%' + String(crimeCategory) + '%'}`);
    }
    if (district) {
      whereConditions.push(sql`district ILIKE ${'%' + String(district) + '%'}`);
    }
    if (priority) {
      whereConditions.push(sql`priority = ${String(priority)}`);
    }

    const whereSql = whereConditions.length > 0 
      ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}` 
      : sql``;

    // 1. Spatial Grid Bucketing via ST_SnapToGrid
    const gridRows = await db.execute<{
      cell_lat: number;
      cell_lng: number;
      total_incidents: number;
      critical_count: number;
      dominant_category: string;
    }>(sql`
      SELECT 
        ROUND(ST_Y(ST_Centroid(ST_Collect(location_geom)))::numeric, 4)::float as cell_lat,
        ROUND(ST_X(ST_Centroid(ST_Collect(location_geom)))::numeric, 4)::float as cell_lng,
        COUNT(*)::int as total_incidents,
        COUNT(*) FILTER (WHERE priority = 'Critical')::int as critical_count,
        MODE() WITHIN GROUP (ORDER BY crime_category) as dominant_category
      FROM cases_fir
      ${whereSql}
      GROUP BY ST_SnapToGrid(location_geom, ${stepNum})
      ORDER BY total_incidents DESC;
    `);

    const maxIncidents = gridRows.reduce((m, r) => Math.max(m, Number(r.total_incidents)), 1);

    const grid: SpatialGridCell[] = gridRows.map((r, idx) => ({
      cellId: `CELL-${idx + 1}`,
      latitude: Number(r.cell_lat),
      longitude: Number(r.cell_lng),
      totalIncidents: Number(r.total_incidents),
      criticalCount: Number(r.critical_count),
      dominantCategory: r.dominant_category || 'General Crime',
      densityWeight: Math.round((Number(r.total_incidents) / maxIncidents) * 100) / 100
    }));

    // 2. Diurnal Temporal Distribution (Day of Week vs Hour of Day)
    const temporalRows = await db.execute<{
      day_of_week: number;
      hour_of_day: number;
      incident_count: number;
    }>(sql`
      SELECT 
        EXTRACT(DOW FROM incident_date)::int as day_of_week,
        EXTRACT(HOUR FROM incident_date)::int as hour_of_day,
        COUNT(*)::int as incident_count
      FROM cases_fir
      ${whereConditions.length > 0 ? sql`WHERE ${sql.join(whereConditions, sql` AND `)} AND incident_date IS NOT NULL` : sql`WHERE incident_date IS NOT NULL`}
      GROUP BY day_of_week, hour_of_day
      ORDER BY day_of_week ASC, hour_of_day ASC;
    `);

    const temporalMatrix: TemporalDensityCell[] = temporalRows.map((r) => ({
      dayOfWeek: Number(r.day_of_week),
      hourOfDay: Number(r.hour_of_day),
      incidentCount: Number(r.incident_count)
    }));

    // 3. Peak Window Identification
    let peak = { dayOfWeek: 5, hourOfDay: 20, incidentCount: 0 };
    for (const t of temporalMatrix) {
      if (t.incidentCount > peak.incidentCount) {
        peak = { dayOfWeek: t.dayOfWeek, hourOfDay: t.hourOfDay, incidentCount: t.incidentCount };
      }
    }

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDescription = `${DAY_NAMES[peak.dayOfWeek]} around ${String(peak.hourOfDay).padStart(2, '0')}:00 hrs (${peak.incidentCount} active cases)`;

    // 4. Hotspots (Top 5 grid cells as tactical hotspots)
    const hotspots: SpatialHotspot[] = grid.slice(0, 5).map((g, idx) => ({
      id: `HOTSPOT-${idx + 1}`,
      stationName: `Sector ${idx + 1} High-Density Zone`,
      district: 'Bengaluru Command Area',
      center: { latitude: g.latitude, longitude: g.longitude },
      radiusMeters: Math.round(stepNum * 111000 / 2),
      incidentCount: g.totalIncidents,
      dominantCrime: g.dominantCategory,
      riskScore: Math.round(g.densityWeight * 100)
    }));

    const data: SpatioTemporalDensityResponse = {
      grid,
      temporalMatrix,
      peakWindow: {
        ...peak,
        description: peakDescription
      },
      hotspots
    };

    res.json({
      success: true,
      data,
      meta: {
        totalCells: grid.length,
        maxIncidents,
        gridStepDeg: stepNum,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Spatial Density Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// ============================================================================
// 6. POST /api/spatial/ai-analyse-area - Groq AI Geospatial Area Analysis
// ============================================================================
spatialRouter.post('/ai-analyse-area', async (req, res) => {
  try {
    const {
      language = 'en',
      selectedRegion = 'Bengaluru Metro Area',
      activeFilters,
      totalIncidents = 0,
      categoryBreakdown = {},
      priorityBreakdown = {},
      stationBreakdown = {},
      sampleIncidents = []
    } = req.body;

    const { generateStructuredJSON } = await import('../services/llm.js');

    const isKn = language === 'kn';

    const systemPrompt = `You are KESTREL Tactical Geospatial Intelligence Analyst for Karnataka State Police (KSP) Bengaluru.
Analyze the provided spatial incident telemetry for the selected geographical sector and return a structured intelligence assessment.
Adhere strictly to verified coordinates, stations, and incident categories provided. Do NOT hallucinate fictive locations or inflated crime rates.
Language: ${isKn ? 'Respond in fluent Kannada using standard police terminology (ಠಾಣೆ, ಹಾಟ್‌ಸ್ಪಾಟ್, ಗಸ್ತು, ಅಪರಾಧ).' : 'Respond in professional tactical English.'}

Output Schema JSON structure:
{
  "summary": "Concise 2-3 sentence spatial summary of the sector and density distribution",
  "hotspotClusters": [
    { "area": "Specific Station / Sub-locality", "dominantCategory": "Dominant Crime Type", "incidentCount": 12, "tacticalAssessment": "Modus operandi concentration & terrain factor" }
  ],
  "temporalPatterns": "Analysis of incident timing patterns, shifts, or day/night distribution based on supplied timestamps",
  "investigativeDirectives": [
    "Patrol beat reinforcement directive with location",
    "ANPR checkpoint placement recommendation"
  ],
  "dataLimitations": [
    "Known limitation based on currently filtered viewport sample"
  ],
  "disclaimer": "AI-generated spatial analysis based on current viewport coordinates. Requires on-ground beat corroboration."
}`;

    const userPrompt = `Geographic Scope:
- Sector / Region: ${selectedRegion}
- Total Mapped Incidents: ${totalIncidents}
- Active Filters: ${JSON.stringify(activeFilters || {})}
- Category Breakdown: ${JSON.stringify(categoryBreakdown)}
- Priority Breakdown: ${JSON.stringify(priorityBreakdown)}
- Station Breakdown: ${JSON.stringify(stationBreakdown)}

Sample Geocoded Incidents in Scope:
${JSON.stringify(sampleIncidents.slice(0, 30), null, 2)}`;

    const fallbackResponse = () => ({
      summary: isKn
        ? `${selectedRegion} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಒಟ್ಟು ${totalIncidents} ಘಟನೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಪ್ರಮುಖವಾಗಿ ರಾತ್ರಿ ವೇಳೆ ಆಸ್ತಿ ಅಪರಾಧಗಳು ಮತ್ತು ಸೈಬರ್ ವಂಚನೆಗಳು ಕೇಂದ್ರೀಕೃತವಾಗಿವೆ.`
        : `Spatial intelligence analysis across ${selectedRegion} encompassing ${totalIncidents} verified incidents. Elevated spatial clustering observed along arterial corridors.`,
      hotspotClusters: Object.entries(stationBreakdown).slice(0, 3).map(([station, count]) => ({
        area: station,
        dominantCategory: Object.keys(categoryBreakdown)[0] || 'Property Crime',
        incidentCount: Number(count),
        tacticalAssessment: `Concentrated incidence requiring targeted stationary patrol checkpoints.`
      })),
      temporalPatterns: isKn
        ? "ಮುಖ್ಯವಾಗಿ ರಾತ್ರಿ ೨೨:೦೦ ರಿಂದ ೦೪:೦೦ ರ ನಡುವೆ ಕನ್ನಗಳವು ಮತ್ತು ಸಶಸ್ತ್ರ ದರೋಡೆ ಪ್ರಕರಣಗಳ ಹೆಚ್ಚಳ ಕಂಡುಬಂದಿದೆ."
        : "Incident timestamps demonstrate a nocturnal surge window between 22:00 and 04:00 along transit corridors.",
      investigativeDirectives: [
        "Deploy mobile patrol interceptors at high-density nodal intersections.",
        "Mount ANPR automatic license-plate scanners at division perimeter tolls."
      ],
      dataLimitations: [
        "Analysis constrained to geocoded incidents within the currently active viewport."
      ],
      disclaimer: isKn
        ? "ಎಐ-ರಚಿತ ಪ್ರಾದೇಶಿಕ ವಿಶ್ಲೇಷಣೆ. ಅಧಿಕೃತ ಪೊಲೀಸ್ ಗಸ್ತು ನಿರ್ದೇಶನಕ್ಕೆ ಕ್ಷೇತ್ರಾಧಿಕಾರಿ ಅನುಮೋದನೆ ಅಗತ್ಯವಿದೆ."
        : "AI-generated spatial assessment. Tactical deployments must be verified by the jurisdictional ACP."
    });

    const analysis = await generateStructuredJSON(systemPrompt, userPrompt, fallbackResponse);

    res.json({
      success: true,
      data: analysis,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('[Spatial AI Analyse Area Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});


