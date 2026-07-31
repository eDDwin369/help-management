// vite.spa.config.ts — SPA build for Netlify → outputs dist/
// Run locally: npx vite build --config vite.spa.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

const STUB = path.resolve(__dirname, "src/stubs/start-storage-context.ts");
const SRC  = path.resolve(__dirname, "src");

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],

  resolve: {
    alias: {
      "@": SRC,
      // All TanStack Start server-only packages → single browser-safe stub
      "@tanstack/start-storage-context": STUB,
      "@tanstack/start-fn-stubs":        STUB,
      "@tanstack/start-server-core":     STUB,
      "@tanstack/react-start/server":    STUB,
      // demo-auth.functions uses createServerFn — replace with SPA stub
      "@/lib/demo-auth.functions":       path.resolve(SRC, "lib/demo-auth.functions.ts"),
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Suppress the chunk-size warning (informational only, not an error)
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      // Silence remaining node: built-in references — they tree-shake out
      external: (id) => id.startsWith("node:"),
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          "vendor-react":   ["react", "react-dom"],
          "vendor-tanstack": ["@tanstack/react-router", "@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui":      ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu",
                             "@radix-ui/react-tabs", "@radix-ui/react-select",
                             "lucide-react"],
          "vendor-charts":  ["recharts"],
        },
      },
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
