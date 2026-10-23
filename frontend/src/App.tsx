import React from 'react';

export function App() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-deck-deep text-slate-100 font-sans">
      <div className="text-center p-8 border border-cyan-500/30 rounded-lg bg-deck-surface/80 backdrop-blur-md shadow-2xl">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400 font-mono">KESTREL COMMAND DECK</h1>
        <p className="mt-2 text-sm text-slate-400">Next-Generation Officer Operating System</p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Core Engine Ready — Implementation In Progress
        </div>
      </div>
    </div>
  );
}

export default App;
