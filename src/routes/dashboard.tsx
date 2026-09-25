import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHmsStore } from "@/components/hms/hmsStore";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Folder, Pin, Map, PlayCircle } from "lucide-react";
import { SiteRecordingsView } from "@/components/dashboard/SiteRecordingsView";
import { MyDrawingsView } from "@/components/dashboard/MyDrawingsView";
import { DrawingVideosView } from "@/components/dashboard/DrawingVideosView";
import { SitePatrolView } from "@/components/dashboard/SitePatrolView";

const DASH_URL = "https://help-management-flows.lovable.app/dashboard";
const DASH_TITLE = "Site Recordings Dashboard · OomniEye";
const DASH_DESC =
  "Browse site recordings, drawings, and site patrol sessions in the OomniEye digital twin dashboard with contextual help on every control.";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: DASH_TITLE },
      { name: "description", content: DASH_DESC },
      { property: "og:title", content: DASH_TITLE },
      { property: "og:description", content: DASH_DESC },
      { property: "og:url", content: DASH_URL },
      { name: "twitter:title", content: DASH_TITLE },
      { name: "twitter:description", content: DASH_DESC },
    ],
    links: [{ rel: "canonical", href: DASH_URL }],
  }),
});

const TAB_SECTION: Record<string, string> = {
  drawings: "section-my-drawings",
  videos: "section-drawing-videos",
  patrol: "section-site-patrol",
  "site-recordings": "section-site-recordings",
};

const TABS = [
  { v: "drawings", label: "My Drawings", icon: Folder, context: "app-tab-my-drawings" },
  { v: "videos", label: "Drawing - Videos", icon: Pin, context: "app-tab-drawing-videos" },
  { v: "patrol", label: "My Site Patrol", icon: Map, context: "app-tab-site-patrol" },
  { v: "site-recordings", label: "Site Recordings", icon: PlayCircle, context: "app-tab-site-recordings" },
];

function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { setSection } = useHmsStore();
  const [tab, setTab] = useState("site-recordings");

  useEffect(() => {
    if (!isLoading && !user)
      navigate({ to: "/login", search: { redirect: "/dashboard" }, replace: true });
  }, [isLoading, user, navigate]);

  // Keep the help panel breadcrumb aligned with the visible section and active tab label.
  useEffect(() => {
    const sectionKey = TAB_SECTION[tab] ?? "section-site-recordings";
    const tabLabel = TABS.find((t) => t.v === tab)?.label ?? "Site Recordings";
    setSection(sectionKey, tabLabel);
  }, [tab, setSection]);

  if (isLoading) return <PageLoader />;
  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 max-w-[1600px] mx-auto">
        <h1 className="sr-only">Site Recordings Dashboard</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 rounded-none gap-1">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                data-hms-context={t.context}
                data-hms-label={t.label}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3 gap-2"
              >
                <t.icon className="size-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div
          data-hms-context={TAB_SECTION[tab] ?? "section-site-recordings"}
          data-hms-label={TABS.find((t) => t.v === tab)?.label ?? "Site Recordings"}
          data-dashboard-tab={tab}
          className="mt-6 bg-card border rounded-2xl shadow-sm overflow-hidden"
        >
          {tab === "site-recordings" && <SiteRecordingsView />}
          {tab === "drawings" && <MyDrawingsView />}
          {tab === "videos" && <DrawingVideosView />}
          {tab === "patrol" && <SitePatrolView />}
        </div>
      </div>
    </AppShell>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Loading dashboard…</div>
    </div>
  );
}

