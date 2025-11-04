import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Install lightweight fetch and console guards to neutralize noisy dev logs
(() => {
  if (typeof window === 'undefined') return;

  // Neutralize specific analytics and ping endpoints that fail in preview/dev
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: any, init?: RequestInit) => {
    try {
      const raw = typeof input === 'string' ? input : (input?.url || input?.href || '');
      const url = new URL(raw, window.location.origin);
      const host = url.host;
      const path = url.pathname;

      // Coinbase analytics (cca-lite) and metrics
      if (host.includes('cca-lite.coinbase.com')) {
        return Promise.resolve(new Response('', { status: 204, statusText: 'No Content' }));
      }

      // Vite client ping to prevent ERR_NETWORK_IO_SUSPENDED noise
      if (path.startsWith('/__vite_ping')) {
        return Promise.resolve(new Response('pong', { status: 200 }));
      }

      // Vercel user meta check (SDKs may probe this in preview/local)
      if (path.startsWith('/.well-known/vercel-user-meta')) {
        return Promise.resolve(new Response('', { status: 204 }));
      }

      // COOP/COEP probe: many SDKs issue HEAD request to '/'
      if (path === '/' && (init?.method || 'GET').toUpperCase() === 'HEAD') {
        return Promise.resolve(new Response('', { status: 204 }));
      }

      // Additional analytics / ping / user-meta filters
      if (url.href.includes('analytics') || url.href.includes('ping') || url.href.includes('user-meta')) {
        return Promise.resolve(new Response('', { status: 204 }));
      }
      // Suppress Vite hot-reload fetch errors
      if (raw.includes('@vite/client') || raw.includes('?t=') || raw.includes('.tsx?t=')) {
        return Promise.resolve(new Response('', { status: 204 }));
      }
    } catch {
      // fall through to original fetch
    }
    return originalFetch(input as any, init as any);
  };
})();

createRoot(document.getElementById("root")!).render(<App />);
