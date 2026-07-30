// vite.spa.config.ts — Pure SPA build → outputs dist/ for Netlify
// Run: npm run build:spa

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

const STUB = path.resolve(__dirname, "src/stubs/start-storage-context.ts");

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // All server-only TanStack Start packages → single browser-safe stub
      "@tanstack/start-storage-context": STUB,
      "@tanstack/start-fn-stubs":        STUB,
      "@tanstack/start-server-core":     STUB,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // Any remaining node: built-ins become empty externals (no error)
      external: (id) => id.startsWith("node:"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@tanstack/start-storage-context",
      "@tanstack/start-server-core",
      "@tanstack/start-fn-stubs",
    ],
  },
});
