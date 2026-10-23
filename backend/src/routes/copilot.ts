import { Router } from 'express';
import { db } from '../db';
import { casesFir, entitiesAccused, caseAccusedJunction, caseEvidence } from '../db/schema';
import { eq, or, ilike, inArray, desc, and, gte, sql } from 'drizzle-orm';
import { streamLLMCompletion } from '../services/llm';
import { generateEmbedding } from '../services/embedding';
import { classifyOfficerIntent } from '../services/intentClassifier';
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

    const results: SemanticCaseSearchResult[] = rawList.map((r) => ({
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
    focusedSuspectId
  } = envelope;

  // Set Server-Sent Events (SSE) streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const citedFirNumbers: string[] = [];
  let contextSnippet = '';
  let fallbackText = '';
  let suggestedActionType: 'FILTER_MAP' | 'FOCUS_SUSPECT' = 'FILTER_MAP';
  let suggestedPayload: Record<string, unknown> = {};

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

        const suspectNames = accusedRows.map((a) => a.suspect.fullName).join(', ') || 'Unidentified suspects';
        const evidenceSummary = evidenceRows.map((e) => e.title).join('; ') || 'No cataloged evidence items';

        fallbackText = language === 'kn'
          ? `ಪ್ರಕರಣ ${c.firNumber} (${c.crimeCategory}) ${c.policeStation} ಠಾಣಾ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ದಾಖಲಾಗಿದೆ. ಪ್ರಮುಖ ಆರೋಪಿಗಳು: ${suspectNames}. ಜಪ್ತಿ ಮಾಡಲಾದ ಸಾಕ್ಷ್ಯಗಳು: ${evidenceSummary}. ತನಿಖಾಧಿಕಾರಿಗಳು ಆರೋಪಿಗಳ ಚಲನವಲನವನ್ನು ಕಣ್ಗಾವಲಿನಲ್ಲಿ ಇರಿಸಿದ್ದಾರೆ.`
          : `Analysis of ${c.firNumber} (${c.crimeCategory}): Registered at ${c.policeStation} station under ${((c.applicableActs as string[]) || []).join(', ')}. Key accused individuals: ${suspectNames}. Forensic evidence items: ${evidenceSummary}. Recommended action: Maintain surveillance on registered getaway vehicles and inspect co-accused communication markers.`;
      }
    }

    // ------------------------------------------------------------------------
    // Branch 2: Focused Suspect Context
    // ------------------------------------------------------------------------
    else if (focusedSuspectId) {
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

        fallbackText = language === 'kn'
          ? `ಆರೋಪಿ ${s.fullName} (${s.riskLevel} ಅಪಾಯಕಾರಿ ಮಟ್ಟ) ಅವರ ಮೇಲೆ ${s.totalPriorArrests} ಹಿಂದಿನ ಬಂಧನ ದಾಖಲೆಗಳಿವೆ. ಇವರು ${linkedCases.map((lc) => lc.caseItem.firNumber).join(', ')} ಪ್ರಕರಣಗಳಲ್ಲಿ ಭಾಗಿಯಾಗಿದ್ದಾರೆ. ಸಿಂಡಿಕೇಟ್: ${s.gangAffiliation || 'ಸ್ವತಂತ್ರ'}.`
          : `Suspect Dossier for ${s.fullName}: Categorized as ${s.riskLevel} threat with ${s.totalPriorArrests} prior arrests (Bail status: ${s.bailStatus}). Linked across ${linkedCases.length} active FIR cases (${linkedCases.map((lc) => lc.caseItem.firNumber).join(', ')}). Primary syndicate affiliation: ${s.gangAffiliation || 'Independent actor'}.`;
      }
    }

    // ------------------------------------------------------------------------
    // Branch 3: Hybrid RAG Pipeline (Deterministic SQL + Semantic Search)
    // ------------------------------------------------------------------------
    else {
      // 1. Intent Classification
      const classification = await classifyOfficerIntent(query, { activeLens });
      const { intent, entities, semanticSearchText } = classification;

      contextSnippet += `[RETRIEVAL PIPELINE: ${intent}]\n`;
      contextSnippet += `Classification Rationale: ${classification.reasoning}\n\n`;

      let matchedCases: any[] = [];

      // A. Pure Structured SQL Retrieval
      if (intent === 'STRUCTURED_SQL') {
        const conditions: any[] = [];
        if (entities.policeStation) {
          conditions.push(ilike(casesFir.policeStation, `%${entities.policeStation}%`));
          suggestedPayload.policeStation = entities.policeStation;
        }
        if (entities.crimeCategory) {
          conditions.push(ilike(casesFir.crimeCategory, `%${entities.crimeCategory}%`));
        }
        if (entities.priority) {
          conditions.push(eq(casesFir.priority, entities.priority));
        }
        if (entities.status) {
          conditions.push(eq(casesFir.status, entities.status));
        }
        if (entities.daysAgo) {
          const cutOffDate = new Date(Date.now() - entities.daysAgo * 86400000);
          conditions.push(gte(casesFir.incidentDate, cutOffDate));
        }

        matchedCases = await db
          .select()
          .from(casesFir)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(casesFir.incidentDate))
          .limit(5);
      }

      // B. Hybrid Retrieval (SQL Pre-filter + pgvector Cosine Re-ranking)
      else if (intent === 'HYBRID') {
        const queryVector = generateEmbedding(semanticSearchText || query);
        const vectorString = '[' + queryVector.join(',') + ']';

        let stationFilterSql = sql`1=1`;
        if (entities.policeStation) {
          stationFilterSql = sql`c.police_station ILIKE ${'%' + entities.policeStation + '%'}`;
          suggestedPayload.policeStation = entities.policeStation;
        }

        let categoryFilterSql = sql`1=1`;
        if (entities.crimeCategory) {
          categoryFilterSql = sql`c.crime_category ILIKE ${'%' + entities.crimeCategory + '%'}`;
        }

        const hybridRows = await db.execute(sql`
          SELECT 
            c.id, c.fir_number as "firNumber", c.crime_category as "crimeCategory",
            c.police_station as "policeStation", c.district, c.priority, c.status,
            c.incident_date as "incidentDate", c.description, c.description_kannada as "descriptionKannada",
            ROUND((1 - (c.embedding <=> ${vectorString}::vector))::numeric, 4) as "similarityScore"
          FROM cases_fir c
          WHERE c.embedding IS NOT NULL 
            AND ${stationFilterSql}
            AND ${categoryFilterSql}
          ORDER BY c.embedding <=> ${vectorString}::vector ASC
          LIMIT 5;
        `);

        matchedCases = Array.from(hybridRows) as any[];

        // Fallback: If station filter returned 0 results, expand to general semantic search
        if (matchedCases.length === 0) {
          const fallbackRows = await db.execute(sql`
            SELECT 
              c.id, c.fir_number as "firNumber", c.crime_category as "crimeCategory",
              c.police_station as "policeStation", c.district, c.priority, c.status,
              c.incident_date as "incidentDate", c.description, c.description_kannada as "descriptionKannada",
              ROUND((1 - (c.embedding <=> ${vectorString}::vector))::numeric, 4) as "similarityScore"
            FROM cases_fir c
            WHERE c.embedding IS NOT NULL
            ORDER BY c.embedding <=> ${vectorString}::vector ASC
            LIMIT 5;
          `);
          matchedCases = Array.from(fallbackRows) as any[];
        }
      }

      // C. Pure Semantic Vector Retrieval (pgvector Cosine Distance)
      else {
        const queryVector = generateEmbedding(semanticSearchText || query);
        const vectorString = '[' + queryVector.join(',') + ']';

        const semanticRows = await db.execute(sql`
          SELECT 
            c.id, c.fir_number as "firNumber", c.crime_category as "crimeCategory",
            c.police_station as "policeStation", c.district, c.priority, c.status,
            c.incident_date as "incidentDate", c.description, c.description_kannada as "descriptionKannada",
            ROUND((1 - (c.embedding <=> ${vectorString}::vector))::numeric, 4) as "similarityScore"
          FROM cases_fir c
          WHERE c.embedding IS NOT NULL
          ORDER BY c.embedding <=> ${vectorString}::vector ASC
          LIMIT 5;
        `);

        matchedCases = Array.from(semanticRows) as any[];
      }

      // If still empty, fall back to recent incidents
      if (matchedCases.length === 0) {
        matchedCases = await db
          .select()
          .from(casesFir)
          .orderBy(desc(casesFir.incidentDate))
          .limit(3);
      }

      // Fetch linked accused for retrieved cases
      const matchedCaseIds = matchedCases.map((m) => m.id);
      const accusedByCaseId = new Map<string, string[]>();

      if (matchedCaseIds.length > 0) {
        const accusedLinks = await db
          .select({
            caseId: caseAccusedJunction.caseId,
            fullName: entitiesAccused.fullName
          })
          .from(caseAccusedJunction)
          .innerJoin(entitiesAccused, eq(caseAccusedJunction.accusedId, entitiesAccused.id))
          .where(inArray(caseAccusedJunction.caseId, matchedCaseIds));

        for (const al of accusedLinks) {
          const list = accusedByCaseId.get(al.caseId) || [];
          list.push(al.fullName);
          accusedByCaseId.set(al.caseId, list);
        }
      }

      // Build context and citations
      for (const mc of matchedCases) {
        const firNum = mc.firNumber || mc.fir_number;
        citedFirNumbers.push(firNum);

        const category = mc.crimeCategory || mc.crime_category;
        const station = mc.policeStation || mc.police_station;
        const priority = mc.priority;
        const simScore = mc.similarityScore ? ` (Cosine Match: ${(Number(mc.similarityScore) * 100).toFixed(1)}%)` : '';
        const suspects = accusedByCaseId.get(mc.id)?.join(', ') || 'Unidentified';

        contextSnippet += `• ${firNum} [${category}] @ ${station} (Severity: ${priority})${simScore}\n`;
        contextSnippet += `  Modus Operandi: ${mc.description}\n`;
        if (mc.descriptionKannada) {
          contextSnippet += `  ವಿವರಣೆ: ${mc.descriptionKannada}\n`;
        }
        contextSnippet += `  Suspects: ${suspects}\n\n`;
      }

      const topCase = matchedCases[0];
      const topFir = topCase?.firNumber || topCase?.fir_number || 'None';
      const topStation = topCase?.policeStation || topCase?.police_station || 'Bengaluru';
      const topCategory = topCase?.crimeCategory || topCase?.crime_category || 'Crime';

      suggestedPayload = {
        citedFirNumbers,
        matchedCaseCount: matchedCases.length,
        primaryStation: topStation
      };

      fallbackText = language === 'kn'
        ? `ಗುಪ್ತಚರ ಶೋಧನೆ ಪೂರ್ಣಗೊಂಡಿದೆ (${intent} ವಿಧಾನ): ${matchedCases.length} ಸಂಬಂಧಿತ ಪ್ರಕರಣಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ. ಪ್ರಮುಖ ಪ್ರಕರಣ ${topFir} (${topCategory}) ${topStation} ವ್ಯಾಪ್ತಿಯಲ್ಲಿದೆ. ಇತರೆ ದಾಖಲೆಗಳು: ${citedFirNumbers.join(', ')}.`
        : `Kestrel Tactical RAG Analysis (${intent} Mode): Identified ${matchedCases.length} correlated cases matching operational criteria. Primary lead is ${topFir} (${topCategory} at ${topStation} jurisdiction). Additional correlated files: ${citedFirNumbers.join(', ')}. Recommend updating patrol sector boundaries.`;
    }

    // ------------------------------------------------------------------------
    // Construct System & User Prompts (Zero-Hallucination Enforced)
    // ------------------------------------------------------------------------
    const systemPrompt = `You are KESTREL Tactical Ambient Intelligence Copilot, an AI crime intelligence analyst supporting Karnataka State Police (KSP) officers in Bengaluru.
Your objective is to provide precise, actionable, grounded intelligence based strictly on the provided police files.
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
