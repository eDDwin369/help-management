import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// All envs exposed to the client must be prefixed with VITE_ — Vite's
// security default. The centralized config module reads only those.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Bind to 0.0.0.0 so the dev server is reachable from outside the
    // container when running under Docker. Has no negative effect locally.
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
  },
});
