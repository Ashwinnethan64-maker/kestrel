import { Router } from 'express';
import { db } from '../db';
import { casesFir, entitiesAccused, caseAccusedJunction, caseEvidence } from '../db/schema';
import { eq, or, ilike, inArray, desc, and, gte, sql } from 'drizzle-orm';
import { streamLLMCompletion } from '../services/llm';
import { generateEmbedding } from '../services/embedding';
import { classifyOfficerIntent } from '../services/intentClassifier';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const curatedFixtures = _require('../../../packages/shared/src/fixtures/bengaluru_crime_curated.json') as Record<string, any>;
import type {
  CopilotPromptEnvelope,
  CopilotResponseChunk,
  ApiResponse,
  QueryIntentClassification,
  SemanticCaseSearchResult
} from '@kestrel/shared';

export const copilotRouter = Router();

// ============================================================================
// 1. POST /api/copilot/intent - Direct Intent Classification Inspection
// ============================================================================
copilotRouter.post('/intent', async (req, res) => {
  try {
    const { query, focusedCaseId, focusedSuspectId } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'Query string is required' });
      return;
    }

    const classification = await classifyOfficerIntent(query, {
      focusedCaseId,
      focusedSuspectId
    });

    const response: ApiResponse<QueryIntentClassification> = {
      success: true,
      data: classification,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Copilot Intent Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 2. POST /api/copilot/semantic-search - Direct Modus Operandi Vector Search
// ============================================================================
copilotRouter.post('/semantic-search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    const searchLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
    let results: SemanticCaseSearchResult[] = [];

    try {
      const queryVector = generateEmbedding(query);
      const vectorString = '[' + queryVector.join(',') + ']';

      // Execute pgvector cosine similarity query
      const rows = await db.execute(sql`
        SELECT 
          c.id,
          c.fir_number as "firNumber",
          c.crime_category as "crimeCategory",
          c.police_station as "policeStation",
          c.district,
          c.priority,
          c.status,
          c.incident_date as "incidentDate",
          c.description,
          c.description_kannada as "descriptionKannada",
          ROUND((1 - (c.embedding <=> ${vectorString}::vector))::numeric, 4) as "similarityScore"
        FROM cases_fir c
        WHERE c.embedding IS NOT NULL
        ORDER BY c.embedding <=> ${vectorString}::vector ASC
        LIMIT ${searchLimit};
      `);

      const rawList = Array.from(rows) as any[];
      const caseIds = rawList.map((r) => r.id);

      // Fetch linked accused suspects for matched cases
      const accusedByCaseId = new Map<string, string[]>();
      if (caseIds.length > 0) {
        const accusedLinks = await db
          .select({
            caseId: caseAccusedJunction.caseId,
            fullName: entitiesAccused.fullName
          })
          .from(caseAccusedJunction)
          .innerJoin(entitiesAccused, eq(caseAccusedJunction.accusedId, entitiesAccused.id))
          .where(inArray(caseAccusedJunction.caseId, caseIds));

        for (const al of accusedLinks) {
          const list = accusedByCaseId.get(al.caseId) || [];
          list.push(al.fullName);
          accusedByCaseId.set(al.caseId, list);
        }
      }

      results = rawList.map((r) => ({
        id: r.id,
        firNumber: r.firNumber,
        crimeCategory: r.crimeCategory,
        policeStation: r.policeStation,
        district: r.district,
        priority: r.priority,
        status: r.status,
        incidentDate: r.incidentDate ? new Date(r.incidentDate).toISOString() : new Date().toISOString(),
        description: r.description,
        descriptionKannada: r.descriptionKannada || null,
        similarityScore: Number(r.similarityScore) || 0,
        accusedNames: accusedByCaseId.get(r.id) || []
      }));
    } catch (dbErr) {
      console.warn('[Semantic Search DB Fallback] Using curated fixtures:', dbErr);
      const curated: any[] = (curatedFixtures as any).cases || [];
      const qLower = query.toLowerCase();
      const matched = curated
        .filter((c: any) =>
          (c.description || '').toLowerCase().includes(qLower) ||
          (c.crimeCategory || '').toLowerCase().includes(qLower) ||
          (c.policeStation || '').toLowerCase().includes(qLower) ||
          (c.modusOperandi || '').toLowerCase().includes(qLower)
        )
        .slice(0, searchLimit);
      const pool = matched.length > 0 ? matched : curated.slice(0, searchLimit);
      results = pool.map((c: any, i: number) => ({
        id: c.id || `fixture-${i}`,
        firNumber: c.firNumber || c.fir_number || `FIR-FIXTURE-${i}`,
        crimeCategory: c.crimeCategory || c.crime_category || 'Unknown',
        policeStation: c.policeStation || c.police_station || 'Unknown',
        district: c.district || 'Bengaluru Urban',
        priority: c.priority || 'medium',
        status: c.status || 'active',
        incidentDate: c.incidentDate || new Date().toISOString(),
        description: c.description || c.modusOperandi || '',
        descriptionKannada: c.descriptionKannada || null,
        similarityScore: 0.75 - (i * 0.05),
        accusedNames: (c.accused || []).map((a: any) => a.fullName || a.name || '').filter(Boolean)
      }));
    }

    const response: ApiResponse<SemanticCaseSearchResult[]> = {
      success: true,
      data: results,
      meta: {
        total: results.length,
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Copilot Semantic Search Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 3. POST /api/copilot/query - Hybrid RAG Streaming Investigation Copilot
// ============================================================================
copilotRouter.post('/query', async (req, res) => {
  const envelope = req.body as CopilotPromptEnvelope;
  const {
    query,
    language = 'en',
    activeLens = 'dossier',
    focusedCaseId,
    focusedSuspectId,
    activeOfficerId,
    activeOfficerName,
    activeOfficerRole
  } = envelope;

  // Set Server-Sent Events (SSE) streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const citedFirNumbers: string[] = [];
  let contextSnippet = '';
  if (activeOfficerName || activeOfficerId) {
    contextSnippet += `[ACTIVE OFFICER / COMMAND PROFILE]\n`;
    contextSnippet += `Officer: ${activeOfficerName || 'Officer'} (Role: ${activeOfficerRole || 'Investigator'}, ID: ${activeOfficerId || 'OFF-01'})\n\n`;
  }
  let fallbackText = '';
  let suggestedActionType: 'FILTER_MAP' | 'FOCUS_SUSPECT' = 'FILTER_MAP';
  let suggestedPayload: Record<string, unknown> = {};

  try {
    let matchedCases: any[] = [];
    const accusedByCaseId = new Map<string, string[]>();

    try {
      // ------------------------------------------------------------------------
      // Branch 1: Focused Case Context
      // ------------------------------------------------------------------------
      if (focusedCaseId) {
        const caseRows = await db
          .select()
          .from(casesFir)
          .where(or(eq(casesFir.id, focusedCaseId), eq(casesFir.firNumber, focusedCaseId)))
          .limit(1);

        if (caseRows.length > 0) {
          const c = caseRows[0];
          citedFirNumbers.push(c.firNumber);
          suggestedPayload = { focusedCaseId: c.id };

          const accusedRows = await db
            .select({
              role: caseAccusedJunction.role,
              status: caseAccusedJunction.status,
              suspect: entitiesAccused
            })
            .from(caseAccusedJunction)
            .innerJoin(entitiesAccused, eq(caseAccusedJunction.accusedId, entitiesAccused.id))
            .where(eq(caseAccusedJunction.caseId, c.id));

          const evidenceRows = await db
            .select()
            .from(caseEvidence)
            .where(eq(caseEvidence.caseId, c.id));

          contextSnippet += `\n[FOCUSED CASE FILE]\n`;
          contextSnippet += `FIR Number: ${c.firNumber}\n`;
          contextSnippet += `Category: ${c.crimeCategory} (Priority: ${c.priority}, Status: ${c.status})\n`;
          contextSnippet += `Police Station: ${c.policeStation}, District: ${c.district}\n`;
          contextSnippet += `Incident Date: ${c.incidentDate?.toISOString()}\n`;
          contextSnippet += `Statutory Sections: ${((c.applicableActs as string[]) || []).join(', ')}\n`;
          contextSnippet += `Description (EN): ${c.description}\n`;
          if (c.descriptionKannada) {
            contextSnippet += `Description (KN): ${c.descriptionKannada}\n`;
          }

          if (accusedRows.length > 0) {
            contextSnippet += `Accused Suspects:\n`;
            for (const a of accusedRows) {
              contextSnippet += `  - ${a.suspect.fullName} (${a.role}, Status: ${a.status}, Gang: ${a.suspect.gangAffiliation || 'None'}, Risk: ${a.suspect.riskLevel})\n`;
            }
          }

          if (evidenceRows.length > 0) {
            contextSnippet += `Forensic Evidence:\n`;
            for (const ev of evidenceRows) {
              contextSnippet += `  - [${ev.evidenceType}] ${ev.title}: ${ev.description}\n`;
            }
          }
        }
      } else if (focusedSuspectId) {
        const suspectRows = await db
          .select()
          .from(entitiesAccused)
          .where(eq(entitiesAccused.id, focusedSuspectId))
          .limit(1);

        if (suspectRows.length > 0) {
          const s = suspectRows[0];
          suggestedActionType = 'FOCUS_SUSPECT';
          suggestedPayload = { focusedSuspectId: s.id };

          const linkedCases = await db
            .select({
              caseItem: casesFir,
              role: caseAccusedJunction.role
            })
            .from(caseAccusedJunction)
            .innerJoin(casesFir, eq(caseAccusedJunction.caseId, casesFir.id))
            .where(eq(caseAccusedJunction.accusedId, s.id));

          for (const lc of linkedCases) {
            citedFirNumbers.push(lc.caseItem.firNumber);
          }

          contextSnippet += `\n[FOCUSED ACCUSED DOSSIER]\n`;
          contextSnippet += `Full Name: ${s.fullName} (Aliases: ${((s.aliases as string[]) || []).join(', ')})\n`;
          contextSnippet += `Risk Level: ${s.riskLevel}, Repeat Offender: ${s.isRepeatOffender ? 'Yes' : 'No'}\n`;
          contextSnippet += `Gang Affiliation: ${s.gangAffiliation || 'Independent'}\n`;
          contextSnippet += `Total Prior Arrests: ${s.totalPriorArrests}, Bail Status: ${s.bailStatus}\n`;
          contextSnippet += `Known Plates: ${((s.vehiclePlates as string[]) || []).join(', ')}\n`;
          contextSnippet += `Linked FIR Cases: ${linkedCases.map((lc) => lc.caseItem.firNumber).join(', ')}\n`;
        }
      } else {
        const classification = await classifyOfficerIntent(query, { activeLens });
        const { intent, entities, semanticSearchText } = classification;
        contextSnippet += `[RETRIEVAL PIPELINE: ${intent}]\n`;

        if (intent === 'STRUCTURED_SQL') {
          const conditions: any[] = [];
          if (entities.policeStation) {
            conditions.push(ilike(casesFir.policeStation, `%${entities.policeStation}%`));
          }
          if (entities.crimeCategory) {
            conditions.push(ilike(casesFir.crimeCategory, `%${entities.crimeCategory}%`));
          }
          matchedCases = await db
            .select()
            .from(casesFir)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(casesFir.incidentDate))
            .limit(5);
        } else {
          matchedCases = await db
            .select()
            .from(casesFir)
            .orderBy(desc(casesFir.incidentDate))
            .limit(5);
        }
      }
    } catch (dbErr) {
      console.warn('[Copilot DB Fallback] Using high-fidelity curated intelligence fixtures:', dbErr);
      const curated = (curatedFixtures as any).cases || [];
      const qLower = query.toLowerCase();
      matchedCases = curated.filter((c: any) =>
        c.description.toLowerCase().includes(qLower) ||
        c.crimeCategory.toLowerCase().includes(qLower) ||
        c.policeStation.toLowerCase().includes(qLower) ||
        (c.modusOperandi && c.modusOperandi.toLowerCase().includes(qLower))
      );
      if (matchedCases.length === 0) {
        matchedCases = curated.slice(0, 4);
      }
    }

    // Build context & citations from retrieved cases
    for (const mc of matchedCases) {
      const firNum = mc.firNumber || mc.fir_number;
      if (firNum) citedFirNumbers.push(firNum);

      const category = mc.crimeCategory || mc.crime_category;
      const station = mc.policeStation || mc.police_station;
      const priority = mc.priority;

      contextSnippet += `• ${firNum} [${category}] @ ${station} (Priority: ${priority})\n`;
      contextSnippet += `  Modus Operandi: ${mc.description || mc.modusOperandi}\n`;
      if (mc.descriptionKannada) {
        contextSnippet += `  ವಿವರಣೆ: ${mc.descriptionKannada}\n`;
      }
      contextSnippet += `\n`;
    }

    const topCase = matchedCases[0];
    const topFir = topCase?.firNumber || topCase?.fir_number || 'FIR-2024-INDR-0102';
    const topStation = topCase?.policeStation || topCase?.police_station || 'Indiranagar';
    const topCategory = topCase?.crimeCategory || topCase?.crime_category || 'Armed Robbery';

    suggestedPayload = {
      citedFirNumbers,
      matchedCaseCount: matchedCases.length,
      primaryStation: topStation
    };

    fallbackText = language === 'kn'
      ? `ಗುಪ್ತಚರ ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ: ${matchedCases.length} ಪ್ರಕರಣಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಪ್ರಮುಖ ಪ್ರಕರಣ ${topFir} (${topCategory}) ${topStation} ಠಾಣಾ ವ್ಯಾಪ್ತಿಯಲ್ಲಿದೆ. ಸಂಬಂಧಿತ ಎಫ್.ಐ.ಆರ್ ಗಳು: ${citedFirNumbers.join(', ')}.`
      : `Kestrel Tactical Intelligence Analysis: Examined ${matchedCases.length} correlated cases. Primary file: ${topFir} (${topCategory} at ${topStation}). Correlated FIR records: ${citedFirNumbers.join(', ')}.`;

    // ------------------------------------------------------------------------
    // Construct System & User Prompts (Zero-Hallucination Enforced)
    // ------------------------------------------------------------------------
    const roleGuidance = (() => {
      const role = (activeOfficerRole || 'Investigator').toLowerCase();
      if (role.includes('superintendent') || role.includes('acp') || role.includes('dcp') || role.includes('commissioner')) {
        return 'You are advising a SENIOR COMMAND officer. Provide strategic-level summaries: inter-station syndicate patterns, clearance rates, resource allocation, and city-wide threat assessments. Avoid granular evidence-level minutiae.';
      }
      return 'You are advising a FIELD INVESTIGATING OFFICER. Provide actionable case-specific guidance: evidence collection checklists, statutory sections under BNS/BNSS, witness interview priorities, forensic referrals (FSL), and next investigative steps.';
    })();
    const systemPrompt = `You are KESTREL Tactical Ambient Intelligence Copilot, an AI crime intelligence analyst supporting Karnataka State Police (KSP) officers in Bengaluru.
Your objective is to provide precise, actionable, grounded intelligence based strictly on the provided police files.
${roleGuidance}
Language Instruction:
${language === 'kn' ? 'Respond in fluent, operational Kannada using standard police terminology (ದರೋಡೆ, ಆರೋಪಿ, ಸಾಕ್ಷ್ಯ, ಎಫ್.ಐ.ಆರ್).' : 'Respond in crisp, professional tactical English.'}
Strict Citation Rule: Always cite the exact FIR numbers (e.g. ${citedFirNumbers.slice(0, 3).join(', ') || 'FIR-2024-INDR-0102'}) whenever referencing incidents.
Zero Hallucination: Do not invent suspect names, fictitious FIRs, or legal sections not present in the operational context.`;

    const userPrompt = `Operational Context (Active Lens: ${activeLens.toUpperCase()}):\n${contextSnippet}\n\nInvestigating Officer Query:\n${query}`;

    // ------------------------------------------------------------------------
    // Stream Completion via Server-Sent Events (SSE)
    // ------------------------------------------------------------------------
    await streamLLMCompletion(
      systemPrompt,
      userPrompt,
      {
        onToken: (token: string) => {
          const chunk: CopilotResponseChunk = { type: 'token', content: token };
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        },
        onDone: () => {
          // Send citation envelope
          if (citedFirNumbers.length > 0) {
            const citationChunk: CopilotResponseChunk = {
              type: 'citation',
              citedFirNumbers: Array.from(new Set(citedFirNumbers))
            };
            res.write(`data: ${JSON.stringify(citationChunk)}\n\n`);
          }

          // Send suggested action
          const actionChunk: CopilotResponseChunk = {
            type: 'action',
            suggestedAction: {
              actionType: suggestedActionType,
              payload: suggestedPayload
            }
          };
          res.write(`data: ${JSON.stringify(actionChunk)}\n\n`);

          // Send terminal done chunk
          const doneChunk: CopilotResponseChunk = { type: 'done' };
          res.write(`data: ${JSON.stringify(doneChunk)}\n\n`);
          res.end();
        },
        onError: (err: any) => {
          console.error('[Copilot Stream Error]:', err);
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        }
      },
      () => fallbackText
    );
  } catch (error: any) {
    console.error('[Copilot Handler Error]:', error);
    res.write(`data: ${JSON.stringify({ type: 'token', content: 'An intelligence retrieval error occurred.' })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }
});
