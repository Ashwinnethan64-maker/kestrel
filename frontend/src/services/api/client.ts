import type {
  ApiResponse,
  FIRCase,
  AccusedSuspect,
  InvestigativeTask,
  OfficerWithWorkload,
  CopilotPromptEnvelope,
  CopilotResponseChunk,
  CaseFilterParams,
  TaskStatus
} from '@kestrel/shared';

const BASE = '/api';

// ── Task filter params (local, not yet in shared) ─────────────────────────────
export interface TaskFilterParams {
  caseId?: string;
  officerId?: string;
  status?: string;
  priority?: string;
}

// ── SSE streaming handlers ────────────────────────────────────────────────────
export interface SSEHandlers {
  onToken: (token: string) => void;
  onCitation: (firNumbers: string[]) => void;
  onAction: (chunk: CopilotResponseChunk) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

// ── Generic fetch helper ──────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    throw new Error(`[KestrelAPI] ${options?.method ?? 'GET'} ${path} → HTTP ${res.status}`);
  }
  const envelope = (await res.json()) as ApiResponse<T>;
  if (!envelope.success) {
    throw new Error(`[KestrelAPI] ${path}: ${envelope.error ?? 'Unknown error'}`);
  }
  return envelope.data;
}

// ── Build query string ────────────────────────────────────────────────────────
function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ── Live Client Object ────────────────────────────────────────────────────────
export const liveClient = {
  /** GET /api/cases — filtered FIR listing */
  getCases: (params: CaseFilterParams = {}): Promise<FIRCase[]> =>
    apiFetch<FIRCase[]>(`/cases${qs(params as Record<string, string>)}`),

  /** GET /api/cases/:id */
  getCaseById: (id: string): Promise<FIRCase | null> =>
    apiFetch<FIRCase>(`/cases/${encodeURIComponent(id)}`).catch(() => null),

  /** GET /api/officers — with workload counts */
  getOfficers: (): Promise<OfficerWithWorkload[]> =>
    apiFetch<OfficerWithWorkload[]>('/officers'),

  /** GET /api/tasks — filtered task list */
  getTasks: (params: TaskFilterParams = {}): Promise<InvestigativeTask[]> =>
    apiFetch<InvestigativeTask[]>(`/tasks${qs(params as Record<string, string>)}`),

  /** PATCH /api/tasks/:id — update task status/notes */
  updateTaskStatus: (
    id: string,
    status: TaskStatus,
    notes?: string
  ): Promise<InvestigativeTask> =>
    apiFetch<InvestigativeTask>(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    }),

  /** GET /api/accused/:id */
  getAccused: (id: string): Promise<AccusedSuspect | null> =>
    apiFetch<AccusedSuspect>(`/accused/${encodeURIComponent(id)}`).catch(() => null),

  /**
   * POST /api/copilot/query — SSE streaming Copilot query.
   * Returns an AbortController; call `.abort()` to cancel mid-stream.
   */
  streamCopilotQuery: (
    envelope: CopilotPromptEnvelope,
    handlers: SSEHandlers
  ): AbortController => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${BASE}/copilot/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
          signal: controller.signal
        });

        if (!res.ok || !res.body) {
          throw new Error(`SSE connection failed: HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const chunk = JSON.parse(raw) as CopilotResponseChunk;
              if (chunk.type === 'token' && chunk.content) {
                handlers.onToken(chunk.content);
              } else if (chunk.type === 'citation' && chunk.citedFirNumbers) {
                handlers.onCitation(chunk.citedFirNumbers);
              } else if (chunk.type === 'action') {
                handlers.onAction(chunk);
              } else if (chunk.type === 'done') {
                handlers.onDone();
                return;
              }
            } catch {
              // Malformed JSON line — skip silently
            }
          }
        }

        handlers.onDone();
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handlers.onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return controller;
  }
};

export type IntelClient = typeof liveClient;
