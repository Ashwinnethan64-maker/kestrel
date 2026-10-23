import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root) {
    const errBox = document.createElement('div');
    errBox.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#050b14;color:#ef4444;font-family:monospace;padding:24px;z-index:99999;overflow:auto;';
    errBox.innerHTML = `<h2 style="color:#06b6d4;">[RUNTIME INITIALIZATION FAULT]</h2>
      <p style="color:#f97316;font-size:16px;">${event.message}</p>
      <pre style="color:#94a3b8;font-size:12px;">${event.filename}:${event.lineno}:${event.colno}\n${event.error?.stack || ''}</pre>`;
    document.body.appendChild(errBox);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element with id 'root'");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

