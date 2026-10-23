import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import { liveClient } from './client';
import { mockClient } from './mockClient';

/**
 * useIntelClient — returns the active API client based on offline mode.
 *
 * Components should ALWAYS use this hook instead of importing client.ts or
 * mockClient.ts directly. The store's `isOfflineMode` flag switches between
 * the live backend and the 100% in-memory failover automatically.
 *
 * @example
 * const api = useIntelClient();
 * const cases = await api.getCases({ investigatingOfficerId: 'OFF-01' });
 */
export function useIntelClient() {
  const isOfflineMode = useCommandDeckStore((s) => s.isOfflineMode);
  return isOfflineMode ? mockClient : liveClient;
}
