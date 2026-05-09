import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
      },
      // catalog-api everything else
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
