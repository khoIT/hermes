import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Vite logs `[vite] http proxy error: <path>` on every connection-level
// failure (ECONNREFUSED / ECONNRESET / ETIMEDOUT) BEFORE our `proxy.on('error')`
// handler runs. During NestJS `--watch` reloads catalog-api drops its
// listener for ~200ms, which spams the dev console with noise that's
// harmless (the loader already retries with 1s/2s/4s backoff). Filter
// these specific lines out of the logger.
const baseLogger = createLogger();
const quietLogger = {
  ...baseLogger,
  error(msg: string, options?: Parameters<typeof baseLogger.error>[1]) {
    if (typeof msg === 'string' && msg.includes('[vite] http proxy error')) return;
    baseLogger.error(msg, options);
  },
};

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
  customLogger: quietLogger,
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
