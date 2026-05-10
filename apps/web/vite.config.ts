import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Vite's default behavior: when an upstream server is unreachable
// (ECONNREFUSED, ECONNRESET, ETIMEDOUT) the proxy returns HTTP 500 with no
// body, which leaks an ambiguous "HTTP 500" into the loader and surfaces
// "Feature Store unavailable · Reason: HTTP 500" — useless to the demo
// runner. We translate every connection-level failure to a 502 with a
// JSON envelope identifying the upstream so the web loader can render
// "catalog-api not reachable on :3001" and the operator knows exactly
// which process to restart.
function proxyUnreachable(targetLabel: string) {
  return (proxy: import('http-proxy').Server) => {
    proxy.on('error', (err: NodeJS.ErrnoException, _req: IncomingMessage, res: ServerResponse) => {
      const code = err.code ?? '';
      const transient = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(code);
      if (!transient) return; // let Vite surface the real error
      if (res.headersSent || res.writableEnded) return;
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        code: 'UPSTREAM_UNREACHABLE',
        target: targetLabel,
        reason: code,
        message: `${targetLabel} not reachable · run \`pnpm --filter @hermes/${targetLabel} dev\``,
      }));
    });
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // query-svc routes (audience-count, trino-explorer, metric-materializer)
      // — checked first because /api/v1/audience prefix-matches before /api.
      '/api/v1/audience': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: false,
        configure: proxyUnreachable('query-svc'),
      },
      // catalog-api everything else
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: false,
        configure: proxyUnreachable('catalog-api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
