import { createFileRoute } from "@tanstack/react-router";

// Sitemap is server-only in TanStack Start SSR mode.
// In SPA/Netlify mode this route renders nothing.
// The server.handlers block is intentionally removed — it uses
// Response objects which are not available in a browser SPA build.
export const Route = createFileRoute("/sitemap.xml")({
  component: () => null,
});
