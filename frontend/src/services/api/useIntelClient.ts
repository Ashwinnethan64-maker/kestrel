import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { liveClient } from './client';
import { mockClient } from './mockClient';
import type {
  FIRCase,
  AccusedSuspect,
  CaseEvidence,
  InvestigativeTask,
  OfficerWithWorkload,
  CaseFilterParams,
  TaskStatus,
  CopilotPromptEnvelope
} from '@kestrel/shared';
import type { TaskFilterParams, SSEHandlers } from './client';

export interface IntelClient {
  getCases: (params?: CaseFilterParams) => Promise<FIRCase[]>;
  getCaseById: (id: string) => Promise<FIRCase | null>;
  getOfficers: () => Promise<OfficerWithWorkload[]>;
  getTasks: (params?: TaskFilterParams) => Promise<InvestigativeTask[]>;
  updateTaskStatus: (id: string, status: TaskStatus, notes?: string) => Promise<InvestigativeTask>;
  createTask: (task: Omit<InvestigativeTask, 'id' | 'createdAt'>) => Promise<InvestigativeTask>;
  getAccused: (id: string) => Promise<AccusedSuspect | null>;
  getSuspects: () => Promise<AccusedSuspect[]>;
  getEvidence: (caseId: string) => Promise<CaseEvidence[]>;
  getSyndicates: () => Promise<any[]>;
  streamCopilotQuery: (envelope: CopilotPromptEnvelope, handlers: SSEHandlers) => AbortController;
}

/**
 * useIntelClient — returns the active API client with automatic offline failover.
 * If backend is unreachable or throws a network error, it automatically falls back
 * to the mockClient dataset and notifies the store so the user sees a transparent
 * offline fail-safe badge.
 */
export function useIntelClient(): IntelClient {
  const isOfflineMode = useCommandDeckStore((s) => s.isOfflineMode);
  const setOfflineMode = useCommandDeckStore((s) => s.setOfflineMode);
  const setBackendStatus = useCommandDeckStore((s) => s.setBackendStatus);

  if (isOfflineMode) {
    return mockClient;
  }

  // Create a resilient client wrapper that catches network/500 faults and fails over to mockClient
  const createFallbackMethod = <T>(
    liveCall: () => Promise<T>,
    mockCall: () => Promise<T>
  ): Promise<T> => {
    return liveCall().catch((err) => {
      console.warn('[Kestrel IntelClient] Live call failed, switching to failsafe mock dataset:', err?.message || err);
      setBackendStatus('offline');
      setOfflineMode(true);
      return mockCall();
    });
  };

  return {
    getCases: (params) => createFallbackMethod(() => liveClient.getCases(params), () => mockClient.getCases(params)),
    getCaseById: (id) => createFallbackMethod(() => liveClient.getCaseById(id), () => mockClient.getCaseById(id)),
    getOfficers: () => createFallbackMethod(() => liveClient.getOfficers(), () => mockClient.getOfficers()),
    getTasks: (params) => createFallbackMethod(() => liveClient.getTasks(params), () => mockClient.getTasks(params)),
    updateTaskStatus: (id, status, notes) =>
      createFallbackMethod(
        () => liveClient.updateTaskStatus(id, status, notes),
        () => mockClient.updateTaskStatus(id, status, notes)
      ),
    createTask: (task) =>
      createFallbackMethod(
        () => liveClient.createTask(task),
        () => mockClient.createTask(task)
      ),
    getAccused: (id) => createFallbackMethod(() => liveClient.getAccused(id), () => mockClient.getAccused(id)),
    getSuspects: () => createFallbackMethod(() => liveClient.getSuspects(), () => mockClient.getSuspects()),
    getEvidence: (caseId) => createFallbackMethod(() => liveClient.getEvidence(caseId), () => mockClient.getEvidence(caseId)),
    getSyndicates: () => createFallbackMethod(() => liveClient.getSyndicates(), () => mockClient.getSyndicates()),
    streamCopilotQuery: (envelope, handlers) => {
      try {
        return liveClient.streamCopilotQuery(envelope, {
          ...handlers,
          onError: (err) => {
            console.warn('[Kestrel Copilot] Live SSE failed, falling back to mock stream:', err);
            setBackendStatus('offline');
            setOfflineMode(true);
            mockClient.streamCopilotQuery(envelope, handlers);
          }
        });
      } catch (err) {
        setBackendStatus('offline');
        setOfflineMode(true);
        return mockClient.streamCopilotQuery(envelope, handlers);
      }
    }
  };
}

