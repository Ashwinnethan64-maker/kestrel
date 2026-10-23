import { mockClient } from './mockClient';

const isLiveMode = import.meta.env.VITE_API_SOURCE === 'live';

export const apiClient = mockClient; // By default routes to mock client during Phase 0 & 1

export function setApiMode(mode: 'mock' | 'live') {
  console.log(`[API Client] Active source mode: ${mode}`);
}
