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

// ── Global Error Boundary ─────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Kestrel ErrorBoundary]:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: '#050b14',
          color: '#ef4444',
          fontFamily: 'monospace',
          padding: '2rem',
          minHeight: '100vh',
          whiteSpace: 'pre-wrap',
          overflowY: 'auto'
        }}>
          <div style={{ color: '#06b6d4', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            ⚠ KESTREL RUNTIME FAULT — ErrorBoundary Caught
          </div>
          <div style={{ color: '#f97316', marginBottom: '0.5rem' }}>
            {this.state.error.name}: {this.state.error.message}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {this.state.error.stack}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1.25rem',
              background: '#06b6d4',
              color: '#050b14',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DeckShell />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
