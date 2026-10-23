import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeckShell } from './components/deck/DeckShell';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DeckShell />
    </QueryClientProvider>
  );
}

export default App;
