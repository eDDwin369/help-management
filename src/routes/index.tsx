import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const URL = "https://help-management-flows.lovable.app/";
const TITLE = "OomniEye Workspace · Contextual Help Management";
const DESC =
  "Enter the OomniEye workspace for contextual in-app help, support ticketing, and enterprise knowledge content across every screen.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "OomniEye",
          url: URL,
          description: DESC,
        }),
      },
    ],
  }),
});

function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading) navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [isLoading, user, navigate]);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background">
      <h1 className="text-lg font-semibold text-foreground">OomniEye Workspace</h1>
      <p className="text-sm text-muted-foreground">Loading…</p>
    </main>
  );
}
