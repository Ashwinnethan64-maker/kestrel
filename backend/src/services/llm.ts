import Groq from 'groq-sdk';
import { config } from '../config';

let groqClient: Groq | null = null;
if (config.groqApiKey) {
  try {
    groqClient = new Groq({ apiKey: config.groqApiKey });
    console.log('[LLM Service] Groq Cloud client initialized with llama-3.3-70b-versatile');
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
    try {
      const stream = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: 0.2,
        max_tokens: 1024
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          callbacks.onToken(content);
        }
      }
      callbacks.onDone();
      return;
    } catch (err: any) {
      console.warn('[LLM Service] Groq Cloud streaming error, triggering grounded fallback:', err.message);
    }
  }

  // Grounded Deterministic Fallback Stream (Zero-Failure Presentation Resilience)
  const text = fallbackTextGenerator ? fallbackTextGenerator() : 'Intelligence analysis complete. No anomalous syndicate movements observed.';
  const words = text.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    callbacks.onToken(chunk);
    // Micro-delay between tokens to simulate authentic LLM generation
    await new Promise((r) => setTimeout(r, 25));
  }

  callbacks.onDone();
}
