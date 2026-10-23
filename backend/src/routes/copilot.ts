import { Router } from 'express';
import { db } from '../db';
import { casesFir, entitiesAccused, caseAccusedJunction, caseEvidence } from '../db/schema';
import { eq, or, ilike, inArray, desc } from 'drizzle-orm';
import { streamLLMCompletion } from '../services/llm';
import type { CopilotPromptEnvelope, CopilotResponseChunk } from '@kestrel/shared';

export const copilotRouter = Router();

// POST /api/copilot/query - Context-grounded streaming investigation copilot
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

  try {
    // 1. Context Retrieval: Focused Case
    if (focusedCaseId) {
      const caseRows = await db
        .select()
        .from(casesFir)
        .where(or(eq(casesFir.id, focusedCaseId), eq(casesFir.firNumber, focusedCaseId)))
        .limit(1);

      if (caseRows.length > 0) {
        const c = caseRows[0];
        citedFirNumbers.push(c.firNumber);

        // Fetch linked accused
        const accusedRows = await db
          .select({
            role: caseAccusedJunction.role,
            status: caseAccusedJunction.status,
            suspect: entitiesAccused
          })
          .from(caseAccusedJunction)
          .innerJoin(entitiesAccused, eq(caseAccusedJunction.accusedId, entitiesAccused.id))
          .where(eq(caseAccusedJunction.caseId, c.id));

        // Fetch evidence
        const evidenceRows = await db
          .select()
          .from(caseEvidence)
          .where(eq(caseEvidence.caseId, c.id));

        contextSnippet += `\n[FOCUSED CASE FILE]\n`;
        contextSnippet += `FIR Number: ${c.firNumber}\n`;
        contextSnippet += `Category: ${c.crimeCategory} (Priority: ${c.priority}, Status: ${c.status})\n`;
        contextSnippet += `Police Station: ${c.policeStation}, District: ${c.district}\n`;
        contextSnippet += `Incident Date: ${c.incidentDate?.toISOString()}\n`;
        contextSnippet += `Statutory Acts: ${((c.applicableActs as string[]) || []).join(', ')}\n`;
        contextSnippet += `Description (EN): ${c.description}\n`;
        if (c.descriptionKannada) {
          contextSnippet += `Description (KN): ${c.descriptionKannada}\n`;
        }
        contextSnippet += `Coordinates: Lat ${c.latitude}, Lng ${c.longitude}\n`;

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

        const suspectNames = accusedRows.map((a) => a.suspect.fullName).join(', ') || 'Unknown';
        const evidenceSummary = evidenceRows.map((e) => e.title).join('; ') || 'No physical evidence cataloged';

        fallbackText = language === 'kn'
          ? `ಪ್ರಕರಣ ${c.firNumber} (${c.crimeCategory}) ಇಂದಿರಾನಗರ/ಬೆಂಗಳೂರು ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ದಾಖಲಾಗಿದೆ. ಪ್ರಮುಖ ಆರೋಪಿಗಳು: ${suspectNames}. ಜಪ್ತಿ ಮಾಡಲಾದ ಸಾಕ್ಷ್ಯಗಳು: ${evidenceSummary}. ತನಿಖಾಧಿಕಾರಿಗಳು ಆರೋಪಿಗಳ ಚಲನವಲನವನ್ನು ಕಣ್ಗಾವಲಿನಲ್ಲಿ ಇರಿಸಿದ್ದಾರೆ.`
          : `Analysis of ${c.firNumber} (${c.crimeCategory}): The incident was reported at ${c.policeStation} station under ${((c.applicableActs as string[]) || []).join(', ')}. Key accused individuals identified in this case include ${suspectNames}. Available forensic evidence items: ${evidenceSummary}. Recommended action: Maintain surveillance on registered getaway vehicles and inspect co-accused communication markers.`;
      }
    }

    // 2. Context Retrieval: Focused Suspect
    if (focusedSuspectId && !focusedCaseId) {
      const suspectRows = await db
        .select()
        .from(entitiesAccused)
        .where(eq(entitiesAccused.id, focusedSuspectId))
        .limit(1);

      if (suspectRows.length > 0) {
        const s = suspectRows[0];
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

    // 3. Fallback General Retrieval if neither focused
    if (!focusedCaseId && !focusedSuspectId) {
      const recentCases = await db
        .select()
        .from(casesFir)
        .orderBy(desc(casesFir.incidentDate))
        .limit(3);

      for (const rc of recentCases) {
        citedFirNumbers.push(rc.firNumber);
        contextSnippet += `FIR ${rc.firNumber} | ${rc.crimeCategory} | ${rc.policeStation} | ${rc.priority} | ${rc.description}\n`;
      }

      fallbackText = language === 'kn'
        ? `ಬೆಂಗಳೂರು ಕಮಾಂಡ್ ಡೆಕ್ ಗುಪ್ತಚರ ಸಾರಾಂಶ: ಇತ್ತೀಚಿನ ಪ್ರಮುಖ ಪ್ರಕರಣಗಳು ${citedFirNumbers.join(', ')} ಪರಿಶೀಲನೆಯಲ್ಲಿವೆ. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ನಿರ್ದಿಷ್ಟ ಪ್ರಕರಣ ಅಥವಾ ಆರೋಪಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.`
        : `Kestrel Tactical Intelligence Summary: Tracking operational incidents across Bengaluru jurisdictions including ${citedFirNumbers.join(', ')}. Select an incident pin on the GIS Map or a node in the Criminal Network Graph for in-depth dossier analysis.`;
    }

    // 4. Construct System & User Prompts
    const systemPrompt = `You are KESTREL Tactical Ambient Intelligence Copilot, an AI crime intelligence analyst supporting Karnataka State Police (KSP) officers in Bengaluru.
Your objective is to provide precise, actionable, grounded intelligence based strictly on the provided police files.
Language Instruction:
${language === 'kn' ? 'Respond in fluent, operational Kannada using standard police terminology (ದರೋಡೆ, ಆರೋಪಿ, ಸಾಕ್ಷ್ಯ, ಎಫ್.ಐ.ಆರ್).' : 'Respond in crisp, professional tactical English.'}
Always cite the exact FIR numbers (e.g. FIR-2024-INDR-0102) whenever referencing incidents.
Do not hallucinate names or statutory sections not supported by the records.`;

    const userPrompt = `Operational Context (Active Lens: ${activeLens.toUpperCase()}):\n${contextSnippet}\n\nInvestigating Officer Query:\n${query}`;

    // 5. Stream Tokens via Server-Sent Events
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
              citedFirNumbers
            };
            res.write(`data: ${JSON.stringify(citationChunk)}\n\n`);
          }

          // Send suggested action
          const actionChunk: CopilotResponseChunk = {
            type: 'action',
            suggestedAction: {
              actionType: focusedSuspectId ? 'FOCUS_SUSPECT' : 'FILTER_MAP',
              payload: {
                focusedCaseId,
                focusedSuspectId
              }
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
