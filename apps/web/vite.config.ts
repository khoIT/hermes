import { defineConfig, createLogger, type Logger } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Vite spams `[vite] http proxy error: <path>` + the full stack on every
// connection-level failure (ECONNREFUSED / ECONNRESET / ETIMEDOUT) during
// the brief catalog-api startup window (NestJS `--watch` compiles for a
// few seconds before binding :3001). The web loader recovers automatically
// (1s/2s/4s burst + unbounded 8s tail + visibility recovery hook), so the
// log spam is pure noise.
//
// What Vite logs internally:
//   logger.error(chalk.red('http proxy error:') + '\n' + err.stack, {error})
// The `[vite]` prefix is added by the logger's render step, NOT present in
// the msg string. So our filter matches on the raw substring `http proxy error`
// (and double-checks the LogErrorOptions.error code is a transient code).
//
// NOTE: explicit delegation (not spread) because Vite mutates the logger's
// `hasWarned` state at runtime; a spread would freeze that state at config
// load time and break duplicate-warning suppression elsewhere in Vite.
const TRANSIENT_PROXY_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']);
const baseLogger = createLogger();
const quietLogger: Logger = {
  info: (msg, options) => baseLogger.info(msg, options),
  warn: (msg, options) => baseLogger.warn(msg, options),
  warnOnce: (msg, options) => baseLogger.warnOnce(msg, options),
  error: (msg, options) => {
    const isProxyMsg = typeof msg === 'string' && msg.includes('http proxy error');
    const errCode = (options?.error as NodeJS.ErrnoException | undefined)?.code;
    const transient = !!errCode && TRANSIENT_PROXY_CODES.has(errCode);
    if (isProxyMsg && transient) return;
    baseLogger.error(msg, options);
  },
  clearScreen: (type) => baseLogger.clearScreen(type),
  hasErrorLogged: (error) => baseLogger.hasErrorLogged(error),
  get hasWarned() { return baseLogger.hasWarned; },
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
