import type { QueryIntentClassification, QueryIntentType, ExtractedQueryEntities } from '@kestrel/shared';
import { groqClient, CANDIDATE_MODELS } from './llm';
import { config } from '../config';

const BENGALURU_STATIONS = [
  'Indiranagar',
  'Koramangala',
  'Whitefield',
  'Peenya',
  'Jayanagar',
  'Shivajinagar',
  'Cubbon Park',
  'Yelahanka',
  'Electronic City',
  'Commercial Street',
  'Ashok Nagar',
  'Halasuru',
  'Ulsoor',
  'Yeshwanthpur',
  'Rajajinagar',
  'Banashankari',
  'HSR Layout',
  'K.R. Puram',
  'Madiwala',
  'Hebbal',
  'Malleshwaram'
];

const CRIME_CATEGORIES: Record<string, string> = {
  robbery: 'Armed Robbery',
  'armed robbery': 'Armed Robbery',
  dacoity: 'Armed Robbery',
  burglary: 'Burglary',
  breakin: 'Burglary',
  'break in': 'Burglary',
  theft: 'Vehicle Theft',
  'vehicle theft': 'Vehicle Theft',
  'two wheeler': 'Vehicle Theft',
  bike: 'Vehicle Theft',
  'chain snatching': 'Chain Snatching',
  snatching: 'Chain Snatching',
  cyber: 'Cyber Crime',
  fraud: 'Cyber Crime',
  phishing: 'Cyber Crime',
  scam: 'Cyber Crime',
  extortion: 'Extortion',
  blackmail: 'Extortion',
  narcotics: 'Narcotics',
  drugs: 'Narcotics',
  ganja: 'Narcotics',
  assault: 'Assault',
  murder: 'Homicide',
  homicide: 'Homicide'
};

const SEMANTIC_KEYWORDS = [
  'crowbar',
  'shutter',
  'shutter break',
  'helmet',
  'face mask',
  'bandana',
  'pulsar',
  'ktm',
  'two wheeler',
  'motorcycle',
  'machete',
  'knife',
  'pistol',
  'firearm',
  'weapon',
  'modus operandi',
  'pattern',
  'similar',
  'technique',
  'entry method',
  'rooftop',
  'lockpick',
  'impersonat',
  'meter reader',
  'delivery boy',
  'witness',
  'cctv footage',
  'getaway',
  'morning walk',
  'midnight',
  'dossier'
];

/**
 * Fast Rule-Based Deterministic NLP Intent Classifier
 * Used as primary fallback guaranteeing 100% offline uptime and zero-latency inference
 */
export function classifyIntentRuleBased(
  query: string,
  context?: { focusedCaseId?: string | null; focusedSuspectId?: string | null; activeLens?: string }
): QueryIntentClassification {
  const lower = query.toLowerCase();

  // 1. Contextual Focus check
  if (
    context?.focusedCaseId ||
    context?.focusedSuspectId ||
    lower.includes('this case') ||
    lower.includes('this suspect') ||
    lower.includes('this accused') ||
    lower.includes('summarize evidence') ||
    lower.includes('who is this')
  ) {
    return {
      intent: 'CONTEXTUAL_FOCUS',
      confidence: 0.95,
      entities: {},
      semanticSearchText: query,
      reasoning: 'Officer is inquiring about currently focused case or suspect dossier'
    };
  }

  const entities: ExtractedQueryEntities = {};

  // Extract Police Station
  for (const station of BENGALURU_STATIONS) {
    if (lower.includes(station.toLowerCase()) || lower.includes(station.replace(/[^a-z]/gi, '').toLowerCase())) {
      entities.policeStation = station;
      break;
    }
  }

  // Extract Crime Category
  for (const [key, category] of Object.entries(CRIME_CATEGORIES)) {
    if (lower.includes(key)) {
      entities.crimeCategory = category;
      break;
    }
  }

  // Extract Priority
  if (lower.includes('critical')) entities.priority = 'Critical';
  else if (lower.includes('high priority')) entities.priority = 'High';
  else if (lower.includes('medium')) entities.priority = 'Medium';
  else if (lower.includes('low priority')) entities.priority = 'Low';

  // Extract Status
  if (lower.includes('open')) entities.status = 'Open';
  else if (lower.includes('cleared') || lower.includes('solved')) entities.status = 'Cleared';
  else if (lower.includes('under investigation')) entities.status = 'Under Investigation';

  // Extract Date/Temporal Range
  if (lower.includes('last 7 days') || lower.includes('past week') || lower.includes('this week')) {
    entities.daysAgo = 7;
  } else if (lower.includes('last 30 days') || lower.includes('past month') || lower.includes('this month')) {
    entities.daysAgo = 30;
  } else if (lower.includes('last 90 days')) {
    entities.daysAgo = 90;
  }

  // Check for semantic modus operandi markers
  let semanticMatches = 0;
  for (const kw of SEMANTIC_KEYWORDS) {
    if (lower.includes(kw)) semanticMatches++;
  }

  // Look for descriptive phrase length (> 8 words suggests narrative search)
  const wordCount = query.trim().split(/\s+/).length;
  const hasStructuredFilters = Boolean(entities.policeStation || entities.crimeCategory || entities.priority || entities.status);
  const hasSemanticNarrative = semanticMatches > 0 || wordCount >= 7;

  let intent: QueryIntentType = 'STRUCTURED_SQL';
  let reasoning = '';

  if (hasStructuredFilters && hasSemanticNarrative) {
    intent = 'HYBRID';
    reasoning = 'Query combines jurisdictional filters with narrative modus operandi pattern';
  } else if (hasSemanticNarrative) {
    intent = 'SEMANTIC_VECTOR';
    reasoning = 'Query specifies descriptive modus operandi, witness observation, or tactical tactic';
  } else {
    intent = 'STRUCTURED_SQL';
    reasoning = 'Query specifies relational tabular filters (station, category, priority)';
  }

  return {
    intent,
    confidence: hasStructuredFilters && hasSemanticNarrative ? 0.92 : 0.88,
    entities,
    semanticSearchText: query,
    reasoning
  };
}

/**
 * Intelligent Dual-Engine Intent Classifier (Groq LPU with Rule-Based Fallback)
 */
export async function classifyOfficerIntent(
  query: string,
  context?: { focusedCaseId?: string | null; focusedSuspectId?: string | null; activeLens?: string }
): Promise<QueryIntentClassification> {
  // If focused context is active, return immediately without network overhead
  if (context?.focusedCaseId || context?.focusedSuspectId) {
    return classifyIntentRuleBased(query, context);
  }

  // Attempt Groq LLM JSON classification if client is configured
  if (groqClient && config.groqApiKey) {
    try {
      const model = CANDIDATE_MODELS[0];
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an Intent Classifier for the KESTREL Police Tactical Intelligence System in Bengaluru.
Parse the officer's natural language query into JSON with:
- "intent": "STRUCTURED_SQL" (for purely tabular queries e.g. "cases in Indiranagar"), "SEMANTIC_VECTOR" (for narrative modus operandi e.g. "two men on bike snatching chain"), "HYBRID" (for both station/category AND descriptive MO), or "CONTEXTUAL_FOCUS".
- "entities": object with optional "policeStation", "crimeCategory", "priority", "status", "suspectName", "gangAffiliation", "daysAgo".
- "semanticSearchText": normalized narrative search string without the station/category filter keywords.
- "reasoning": 1-sentence rationale.
Respond ONLY with valid JSON.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' }
      });

      const rawContent = completion.choices[0]?.message?.content;
      if (rawContent) {
        const parsed = JSON.parse(rawContent);
        if (parsed.intent && ['STRUCTURED_SQL', 'SEMANTIC_VECTOR', 'HYBRID', 'CONTEXTUAL_FOCUS'].includes(parsed.intent)) {
          return {
            intent: parsed.intent as QueryIntentType,
            confidence: parsed.confidence || 0.94,
            entities: parsed.entities || {},
            semanticSearchText: parsed.semanticSearchText || query,
            reasoning: parsed.reasoning || 'Classified via Groq Tactical Model'
          };
        }
      }
    } catch (err) {
      // Fall through to deterministic rule-based NLP on error/timeout
      console.warn('[IntentClassifier] Groq classification failed, using deterministic NLP engine:', (err as Error).message);
    }
  }

  return classifyIntentRuleBased(query, context);
}
