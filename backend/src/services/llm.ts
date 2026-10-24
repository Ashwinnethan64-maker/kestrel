import Groq from 'groq-sdk';
import { config } from '../config';

export let groqClient: Groq | null = null;

// Multi-Model Quota Pool: Automatically fails over across models if one encounters rate limits
export const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  'llama3-8b-8192',
  'gemma2-9b-it'
];

if (config.groqApiKey) {
  try {
    groqClient = new Groq({ apiKey: config.groqApiKey });
    console.log(`[LLM Service] Groq Cloud client initialized with candidate pool: [${CANDIDATE_MODELS.join(', ')}]`);
  } catch (err) {
    console.warn('[LLM Service] Failed to initialize Groq client:', err);
  }
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: any) => void;
}

export async function streamLLMCompletion(
  systemPrompt: string,
  userPrompt: string,
  callbacks: StreamCallbacks,
  fallbackTextGenerator?: () => string
): Promise<void> {
  if (groqClient && config.groqApiKey) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const stream = await groqClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: true,
          temperature: 0.2,
          max_tokens: 768
        });

        let receivedAnyTokens = false;
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            receivedAnyTokens = true;
            callbacks.onToken(content);
          }
        }

        if (receivedAnyTokens) {
          callbacks.onDone();
          return;
        }
      } catch (err: any) {
        console.warn(`[LLM Service] Groq streaming error on model ${model}:`, err.message);
        // Continue to the next candidate model in the pool
      }
    }
    console.warn('[LLM Service] All Groq candidates exhausted. Transitioning to grounded fallback simulator.');
  }

  // Grounded Deterministic Fallback Stream (Zero-Failure Presentation Resilience)
  const text = fallbackTextGenerator ? fallbackTextGenerator() : 'Intelligence analysis complete. No anomalous syndicate movements observed.';
  const words = text.split(' ');

  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    callbacks.onToken(chunk);
    await new Promise((r) => setTimeout(r, 20));
  }

  callbacks.onDone();
}

/**
 * Generate structured JSON completion via Groq with candidate model failover
 */
export async function generateStructuredJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  fallbackGenerator: () => T
): Promise<T> {
  if (!config.groqApiKey) {
    console.warn('[LLM Service] GROQ_API_KEY missing. Using grounded fallback.');
    return fallbackGenerator();
  }

  if (groqClient) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested schema. Do not output markdown codeblocks, do not add introductory or trailing commentary.`
            },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 1536
        });

        const raw = response.choices[0]?.message?.content || '{}';
        const cleaned = raw.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned) as T;
        return parsed;
      } catch (err: any) {
        console.warn(`[LLM Service] Groq structured JSON error on model ${model}:`, err.message);
      }
    }
    console.warn('[LLM Service] All Groq candidates failed for structured completion. Using fallback generator.');
  }

  return fallbackGenerator();
}

/**
 * Tactical audio transcription using Whisper on Groq Cloud
 */
export async function transcribeAudio(audioFile: File | Blob): Promise<string | null> {
  if (!groqClient || !config.groqApiKey) return null;
  try {
    const transcription = await groqClient.audio.transcriptions.create({
      file: audioFile as any,
      model: 'whisper-large-v3-turbo',
      temperature: 0.0,
      language: 'en'
    });
    return transcription.text;
  } catch (err: any) {
    console.error('[Whisper Audio Error]:', err.message);
    return null;
  }
}

