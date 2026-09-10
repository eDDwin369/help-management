import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { useHmsStore, type HmsArticle } from "@/components/hms/hmsStore";
import { CONTEXT_ARTICLE_MAP, CONTEXT_LABELS, SECTION_LABELS } from "@/lib/hms-context-registry";
import { SCREEN_IMAGES } from "@/lib/screen-assets";
import {
  clearHmsEvents,
  getHmsEvents,
  subscribeHmsEvents,
  summarizeHmsEvents,
  type HmsAnalyticsEvent,
} from "@/lib/hms-analytics";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SectionToolbar,
  FilterGroup,
  FilterChip,
  EmptyRow,
} from "@/components/dashboard/SectionToolbar";
import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Ticket as TicketIcon,
  Trash2,
  X,
  Users,
  Video,
  BarChart3,
  Plus,
  Eye,
  Pencil,
  Info,
} from "lucide-react";
import { ApprovalsManager } from "@/components/admin/ApprovalsManager";
import { CeoViewToggleBar } from "@/components/admin/CeoViewToggleBar";
import { ModernUserDashboard } from "@/components/admin/ModernUserDashboard";
import { GradientUserDashboard } from "@/components/admin/GradientUserDashboard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ADMIN_URL = "https://help-management-flows.lovable.app/admin";
const ADMIN_TITLE = "Help Administration · OomniEye";
const ADMIN_DESC =
  "Review help coverage, manage the content library and monitor support tickets across the OomniEye workspace.";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: AdminPage,
  head: () => ({
    meta: [
      { title: ADMIN_TITLE },
      { name: "description", content: ADMIN_DESC },
      { property: "og:title", content: ADMIN_TITLE },
      { property: "og:description", content: ADMIN_DESC },
      { property: "og:url", content: ADMIN_URL },
      { name: "twitter:title", content: ADMIN_TITLE },
      { name: "twitter:description", content: ADMIN_DESC },
    ],
    links: [{ rel: "canonical", href: ADMIN_URL }],
  }),
});

const TAB_SECTION: Record<string, string> = {
  overview: "section-admin-overview",
  content: "section-admin-content",
  coverage: "section-admin-coverage",
  usage: "section-admin-usage",
};

function AdminPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { setSection, role } = useHmsStore();
  const { tab: tabParam } = Route.useSearch();
  const [tab, setTab] = useState(tabParam ?? "overview");
  const [viewMode, setViewMode] = useState<"old" | "new" | "gradient">("gradient");

  // Keep the visible tab in sync with deep links (e.g. from the help panel).
  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (!isLoading && !user)
      navigate({ to: "/login", search: { redirect: "/admin" }, replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    setSection(TAB_SECTION[tab] ?? "section-admin-overview");
  }, [tab, setSection]);

  if (isLoading || !user) return null;

  return (
    <AppShell darkTheme={viewMode === "gradient"}>
      <div className={`p-6 max-w-[1600px] mx-auto relative ${viewMode === "gradient" ? "h-full bg-[#050814]" : ""} ${tab === "content" ? "h-full flex flex-col min-h-0 overflow-hidden" : ""}`}>
        <h1 className="sr-only">Help Administration</h1>

        {viewMode === "old" && (
          <>
            <div className="flex items-center justify-between mb-1.5 pl-0.5 shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground/80 font-medium">
                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                <span>{user?.role === "admin" ? "SuperAdmin" : "User Role View"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                  Classic Old UI
                </Badge>
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab} className={tab === "content" ? "shrink-0" : ""}>
              <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 rounded-none gap-1">
                {[
                  { v: "overview", label: "Dashboard", icon: LayoutDashboard, context: "admin-overview-tab" },
                  { v: "content", label: "Approvals", icon: CheckCircle2, context: "admin-content-library-tab" },
                  { v: "coverage", label: "Areas Without Help", icon: AlertTriangle, context: "admin-coverage-tab" },
                  { v: "usage", label: "Usage Analytics", icon: BarChart3, context: "admin-usage-tab" },
                ].map((t) => (
                  <TabsTrigger
                    key={t.v}
                    value={t.v}
                    data-hms-context={t.context}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-3 gap-2"
                  >
                    <t.icon className="size-4" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </>
        )}

        <div className={`${viewMode === "old" ? "mt-4" : ""} ${tab === "content" ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
          {viewMode === "gradient" ? (
            <GradientUserDashboard />
          ) : viewMode === "new" ? (
            <ModernUserDashboard />
          ) : (
            <>
              {tab === "overview" && <OverviewTab />}
              {tab === "content" && <ApprovalsManager canApprove={user?.role === "admin"} />}
              {tab === "coverage" && <CoverageTab />}
              {tab === "usage" && <UsageTab />}
            </>
          )}
        </div>
      </div>

      {/* Floating CEO Control & Old/New UI Toggle Bar */}
      <CeoViewToggleBar viewMode={viewMode} onViewModeChange={setViewMode} />
    </AppShell>
  );
}

/* ---------------------------------- Overview --------------------------------- */

import {
  ALL_WIDGETS,
  getAvailableWidgetsForRole,
  loadUserDashboardState,
  saveUserDashboardState,
  resetUserDashboardState,
  type UserWidgetState,
  type WidgetWidth,
} from "@/lib/widget-registry";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { AddWidgetModal } from "@/components/dashboard/AddWidgetModal";
import { RotateCcw } from "lucide-react";

/* ---------------------------------- Overview --------------------------------- */

function OverviewTab() {
  const { user } = useAuth();
  const { state } = useHmsStore();

  const [userWidgets, setUserWidgets] = useState<UserWidgetState[]>(() => {
    if (!user) return [];
    return loadUserDashboardState(user.id, user.role);
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setUserWidgets(loadUserDashboardState(user.id, user.role));
    }
  }, [user]);

  // Persist state when userWidgets changes
  const updateWidgets = (newState: UserWidgetState[]) => {
    setUserWidgets(newState);
    if (user) {
      saveUserDashboardState(user.id, newState);
    }
  };

  const handleWidthChange = (id: string, width: WidgetWidth) => {
    const updated = userWidgets.map((w) => (w.id === id ? { ...w, width } : w));
    updateWidgets(updated);
    toast.success("Widget size updated");
  };

  const handleRemoveWidget = (id: string) => {
    const updated = userWidgets.filter((w) => w.id !== id);
    updateWidgets(updated);
    toast.success("Widget hidden from dashboard");
  };

  const handleAddWidget = (id: string) => {
    const config = ALL_WIDGETS.find((w) => w.id === id);
    const newWidget: UserWidgetState = {
      id,
      width: config?.defaultWidth ?? "half",
      order: userWidgets.length,
    };
    const updated = [...userWidgets, newWidget];
    updateWidgets(updated);
    toast.success("Widget added to dashboard");
  };

  const handleResetDashboard = () => {
    if (user) {
      resetUserDashboardState(user.id);
      const defaults = loadUserDashboardState(user.id, user.role);
      setUserWidgets(defaults);
      toast.success("Dashboard reset to default layout");
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = userWidgets.findIndex((w) => w.id === draggedId);
    const toIndex = userWidgets.findIndex((w) => w.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...userWidgets];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const reindexed = reordered.map((item, index) => ({ ...item, order: index }));
    updateWidgets(reindexed);
    setDraggedId(null);
  };

  // Data calculations for cards
  const articles = state.articles;
  const approved = articles.filter((a) => a.approvalStatus === "approved" && a.archiveStatus === "active");
  const pending = articles.filter((a) => a.approvalStatus !== "approved");
  const archived = articles.filter((a) => a.archiveStatus === "archived");
  const coverage = useCoverageSummary();

  const openTickets = state.tickets.filter((t) => t.status === "pending");
  const review = state.tickets.filter((t) => t.status === "under-review");
  const resolved = state.tickets.filter((t) => t.status === "resolved" || t.status === "closed");
  const slaRisk = state.tickets.filter(
    (t) =>
      (t.status === "pending" || t.status === "under-review") &&
      (t.priority === "high" || t.priority === "urgent"),
  );

  const activity = useActivitySeries(articles.length, state.tickets.length);
  const availableWidgets = user ? getAvailableWidgetsForRole(user.role) : [];
  const activeWidgetIds = userWidgets.map((w) => w.id);

  // Widget content renderers
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case "help_management":
        return (
          <div className="grid sm:grid-cols-2 gap-3" data-hms-context="admin-help-mgmt-card">
            <StatCard tone="neutral" label="Total help" value={articles.length} hint="All articles" />
            <StatCard tone="green" label="Approved" value={approved.length} hint="Live for customers" />
            <StatCard
              tone={pending.length > 3 ? "red" : pending.length > 0 ? "amber" : "green"}
              label="Pending approval"
              value={pending.length}
              hint="Waiting for review"
            />
            <StatCard tone="neutral" label="Archived" value={archived.length} hint="Hidden from customers" />
          </div>
        );
      case "ticket_management":
        return (
          <div className="grid sm:grid-cols-2 gap-3" data-hms-context="admin-ticket-mgmt-card">
            <StatCard
              tone={openTickets.length > 3 ? "red" : openTickets.length > 0 ? "amber" : "green"}
              label="Open"
              value={openTickets.length}
              hint="Not yet picked up"
            />
            <StatCard tone="amber" label="Waiting reply" value={review.length} hint="Under review" />
            <StatCard
              tone={slaRisk.length > 0 ? "red" : "green"}
              label="SLA risk"
              value={slaRisk.length}
              hint="High / urgent open"
            />
            <StatCard tone="neutral" label="Total" value={state.tickets.length} hint={`${resolved.length} resolved`} />
          </div>
        );
      case "activity_graph":
        return (
          <div className="h-[220px] -ml-2" data-hms-context="admin-graph-view">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gHelp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis tickLine={false} axisLine={false} fontSize={10} width={28} />
                <RTooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="help"
                  name="Help activity"
                  stroke="hsl(var(--primary))"
                  fill="url(#gHelp)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="tickets"
                  name="Ticket activity"
                  stroke="hsl(38 92% 50%)"
                  fill="url(#gTickets)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case "coverage_metrics":
        return (
          <div data-hms-context="admin-coverage-card">
            <div className="grid sm:grid-cols-2 gap-3">
              <StatCard tone="green" label="Areas covered" value={coverage.covered} hint="At least one resource" />
              <StatCard
                tone={coverage.missing > 0 ? "red" : "green"}
                label="Areas missing"
                value={coverage.missing}
                hint="No published resource"
              />
              <StatCard tone="neutral" label="Registered areas" value={coverage.total} hint="Tracked components" />
              <StatCard
                tone={coverage.ratio >= 80 ? "green" : coverage.ratio >= 50 ? "amber" : "red"}
                label="Coverage ratio"
                value={coverage.ratio}
                hint="percent covered"
              />
            </div>
            <div className="mt-4" data-hms-context="admin-content-mix">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Content mix
              </div>
              <div className="grid grid-cols-4 gap-3">
                {(["video", "pdf", "image", "text"] as const).map((t) => (
                  <StatCard
                    key={t}
                    tone="neutral"
                    label={t.toUpperCase()}
                    value={articles.filter((a) => a.contentType === t).length}
                    hint="resources"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case "user_management":
        return (
          <div className="grid sm:grid-cols-3 gap-3" data-hms-context="admin-user-mgmt-card">
            <StatCard tone="neutral" label="Customers" value={1} hint="Standard access" />
            <StatCard tone="neutral" label="Help admins" value={1} hint="Author content" />
            <StatCard tone="neutral" label="Admins" value={1} hint="Approve & publish" />
          </div>
        );
      case "missing_areas":
        return (
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>{coverage.missing} areas currently have zero published help articles.</span>
            </div>
            <Badge variant="outline" className="text-rose-500 border-rose-500/30">
              High Priority
            </Badge>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Customization Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            Widget Dashboard
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none shrink-0"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-xs font-normal">
              Drag handles to reorder • Customize widget sizes & visibility
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetDashboard}
            className="h-8 text-xs gap-1.5"
            title="Reset layout to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Layout</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      {userWidgets.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-border bg-card">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">Your Dashboard is Empty</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You have hidden all widgets from your view. Click Add Widget below to customize your dashboard layout.
          </p>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="mt-4 text-xs bg-primary text-primary-foreground gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Widget
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-6 lg:grid-cols-12">
          {userWidgets.map((userState) => {
            const config = ALL_WIDGETS.find((w) => w.id === userState.id);
            if (!config) return null;

            return (
              <WidgetCard
                key={config.id}
                widget={config}
                userState={userState}
                onWidthChange={handleWidthChange}
                onRemove={handleRemoveWidget}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedId === config.id}
              >
                {renderWidgetContent(config.id)}
              </WidgetCard>
            );
          })}
        </div>
      )}

      {/* Add Widget Modal */}
      <AddWidgetModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        availableWidgets={availableWidgets}
        activeWidgetIds={activeWidgetIds}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
}

/** Deterministic 12-week activity series derived from current library volume. */
function useActivitySeries(articleCount: number, ticketCount: number) {
  return useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const wave = Math.sin((i + 1) / 2) * 0.5 + 0.5;
        return {
          week: `W${i + 1}`,
          help: Math.round(6 + wave * (articleCount + 8) * 0.8 + i * 0.9),
          tickets: Math.round(1 + (1 - wave) * (ticketCount + 4) * 0.6 + i * 0.3),
        };
      }),
    [articleCount, ticketCount],
  );
}

/** Coverage across every registered context key, including live articles. */
function useCoverageSummary() {
  const { state } = useHmsStore();
  return useMemo(() => {
    const keys = Object.keys(CONTEXT_ARTICLE_MAP);
    const covered = keys.filter(
      (k) =>
        (CONTEXT_ARTICLE_MAP[k] ?? []).length > 0 ||
        state.articles.some((a) => a.contexts?.includes(k) && a.approvalStatus === "approved"),
    ).length;
    const total = keys.length;
    return {
      covered,
      missing: total - covered,
      total,
      ratio: total ? Math.round((covered / total) * 100) : 0,
    };
  }, [state.articles]);
}

const TONES: Record<string, string> = {
  green: "border-emerald-500/50 before:bg-emerald-500",
  amber: "border-amber-500/50 before:bg-amber-500",
  red: "border-destructive/50 before:bg-destructive",
  neutral: "border-border before:bg-muted-foreground/40",
};

function StatCard({
  tone,
  label,
  value,
  hint,
}: {
  tone: keyof typeof TONES;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 bg-card p-4 before:absolute before:inset-x-0 before:top-0 before:h-1 before:content-[''] ${TONES[tone]}`}
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  context,
  children,
}: {
  title: string;
  description: string;
  icon: typeof LifeBuoy;
  context: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5" data-hms-context={context}>
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Icon className="size-4 text-primary shrink-0" />
          <span>{title}</span>
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none shrink-0 ml-0.5"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs font-normal">
                {description}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

/* ------------------------------ Usage Analytics ------------------------------ */

const EVENT_LABELS: Record<string, string> = {
  panel_open: "Help panel opened",
  panel_close: "Help panel closed",
  article_view: "Article viewed",
  article_media_error: "Media failed to load",
  search: "Search performed",
  filter_change: "Filter applied",
  ticket_created: "Support request raised",
  article_created: "Help article created",
  upload_dropped: "File dropped for upload",
};

function useHmsAnalytics(): HmsAnalyticsEvent[] {
  const [events, setEvents] = useState<HmsAnalyticsEvent[]>([]);
  useEffect(() => {
    setEvents(getHmsEvents());
    return subscribeHmsEvents(setEvents);
  }, []);
  return events;
}

function UsageTab() {
  const events = useHmsAnalytics();
  const summary = useMemo(() => summarizeHmsEvents(events), [events]);

  return (
    <div className="space-y-5" data-hms-context="admin-usage-tab">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard tone="ok" label="Panel opens" value={summary.panelOpens} hint="Help launched" />
        <StatCard tone="ok" label="Article views" value={summary.articleViews} hint="Content consumed" />
        <StatCard tone="warn" label="Searches" value={summary.searches} hint="Queries run" />
        <StatCard tone="warn" label="Requests raised" value={summary.ticketsCreated} hint="Support tickets" />
        <StatCard
          tone={summary.mediaErrors > 0 ? "critical" : "ok"}
          label="Media errors"
          value={summary.mediaErrors}
          hint="Failed video / PDF loads"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="Most viewed articles"
          description="Help content customers open the most."
          icon={FileText}
          context="admin-usage-top-articles"
        >
          <RankList rows={summary.topArticles} empty="No article views recorded yet." />
        </SectionCard>
        <SectionCard
          title="Top searches"
          description="What users look for inside the help panel."
          icon={Library}
          context="admin-usage-top-searches"
        >
          <RankList rows={summary.topSearches} empty="No searches recorded yet." />
        </SectionCard>
        <SectionCard
          title="Busiest screens"
          description="Application areas generating the most help activity."
          icon={LayoutDashboard}
          context="admin-usage-top-contexts"
        >
          <RankList
            rows={summary.topContexts.map((r) => ({
              label: CONTEXT_LABELS[r.label] ?? r.label,
              count: r.count,
            }))}
            empty="No activity recorded yet."
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Recent activity"
        description="Latest help interactions captured across the workspace."
        icon={BarChart3}
        context="admin-usage-activity"
      >
        {summary.recent.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No help activity recorded yet.
          </p>
        ) : (
          <ul className="divide-y">
            {summary.recent.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-medium">{EVENT_LABELS[e.type] ?? e.type}</span>
                {e.label && (
                  <span className="truncate text-muted-foreground text-xs flex-1">{e.label}</span>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                  {new Date(e.at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearHmsEvents();
              toast.success("Usage analytics cleared");
            }}
            disabled={summary.totalEvents === 0}
          >
            Clear analytics
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function RankList({ rows, empty }: { rows: { label: string; count: number }[]; empty: string }) {
  if (rows.length === 0)
    return <p className="text-xs text-muted-foreground py-4 text-center">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">{r.label}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{r.count}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round((r.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Content Library ------------------------------ */

const TYPE_ICON = { video: Video, pdf: FileText, image: ImageIcon, text: FileText } as const;

const PAGE_SIZE = 8;

function ContentLibraryTab({ canApprove }: { canApprove: boolean }) {
  const { user } = useAuth();
  const {
    state,
    approveArticle,
    unapproveArticle,
    archiveArticle,
    deleteArticle,
    requestPanelView,
  } = useHmsStore();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | HmsArticle["contentType"]>("all");
  const [approval, setApproval] = useState<"all" | "approved" | "pending">("all");
  const [archive, setArchive] = useState<"all" | "active" | "archived">("all");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.articles.filter((a) => {
      if (q && !`${a.title} ${a.description} ${a.tags.join(" ")}`.toLowerCase().includes(q))
        return false;
      if (type !== "all" && a.contentType !== type) return false;
      if (approval === "approved" && a.approvalStatus !== "approved") return false;
      if (approval === "pending" && a.approvalStatus === "approved") return false;
      if (archive !== "all" && a.archiveStatus !== archive) return false;
      return true;
    });
  }, [state.articles, query, type, approval, archive]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, type, approval, archive]);

  const filterActive = type !== "all" || approval !== "all" || archive !== "all";


  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div>
          <div className="font-semibold text-sm">{user?.role === "sub_admin" ? "My Approvals" : "Approvals"}</div>
          <p className="text-xs text-muted-foreground">Every help article across the system</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => requestPanelView({ type: "add" })}>
          <Plus className="size-3.5" /> Add help
        </Button>
      </div>
      <SectionToolbar
        searchContext="admin-content-search"
        filterContext="admin-content-filter"
        placeholder="Search approvals…"
        query={query}
        onQueryChange={setQuery}
        filterActive={filterActive}
        filterContent={
          <>
            <FilterGroup label="Content type">
              {(["all", "video", "pdf", "image", "text"] as const).map((t) => (
                <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                  {t === "all" ? "All" : t.toUpperCase()}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Approval status">
              {(["all", "approved", "pending"] as const).map((a) => (
                <FilterChip key={a} active={approval === a} onClick={() => setApproval(a)}>
                  {a === "all" ? "All" : a === "approved" ? "Approved" : "Unapproved"}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Archive status">
              {(["all", "active", "archived"] as const).map((a) => (
                <FilterChip key={a} active={archive === a} onClick={() => setArchive(a)}>
                  {a === "all" ? "All" : a === "active" ? "Active" : "Archived"}
                </FilterChip>
              ))}
            </FilterGroup>
          </>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-hms-context="admin-content-table">
          <thead className="bg-muted/30 text-primary text-xs uppercase tracking-wider">
            <tr className="text-left">
              {["Title", "Type", "Area", "Status", "Author", "Actions"].map((c) => (
                <th key={c} className="px-4 py-3 font-semibold whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageRows.length === 0 && (
              <EmptyRow colSpan={6} message="No content matches your filters." />
            )}
            {pageRows.map((a) => {
              const Icon = TYPE_ICON[a.contentType];
              return (
                <tr key={a.id} className="hover:bg-muted/20" data-hms-context="admin-content-row">
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Icon className="size-3" /> {a.contentType.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.relatedContext}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        a.archiveStatus === "archived"
                          ? "bg-muted text-muted-foreground hover:bg-muted"
                          : a.approvalStatus === "approved"
                            ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
                            : a.approvalStatus === "unapproved"
                              ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15"
                              : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15"
                      }
                    >
                      {a.archiveStatus === "archived"
                        ? "Archived"
                        : a.approvalStatus === "approved"
                          ? "Approved"
                          : a.approvalStatus === "unapproved"
                            ? "Rejected"
                            : "Pending Approval"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.authorName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label="Preview"
                        onClick={() => requestPanelView({ type: "article", id: a.id })}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label="Edit"
                        onClick={() => requestPanelView({ type: "add", editId: a.id })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {canApprove && (
                        <>
                          {a.approvalStatus !== "approved" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                              onClick={() => {
                                approveArticle(a.id);
                                toast.success("Approved — live for customers");
                              }}
                            >
                              <Check className="size-3" /> Approve
                            </Button>
                          )}
                          {a.approvalStatus !== "unapproved" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                              onClick={() => {
                                unapproveArticle(a.id);
                                toast.success("Rejected — hidden from customers");
                              }}
                            >
                              <X className="size-3" /> Reject
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label="Archive"
                        onClick={() => {
                          archiveArticle(a.id);
                          toast.success(a.archiveStatus === "active" ? "Archived" : "Unarchived");
                        }}
                      >
                        <Archive className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive"
                        aria-label="Delete"
                        onClick={() => {
                          deleteArticle(a.id);
                          toast.success("Deleted");
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t text-xs text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-semibold text-foreground">{pageRows.length}</span> of{" "}
          <span className="font-semibold text-foreground">{rows.length}</span> results
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span aria-live="polite" className="tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Coverage ---------------------------------- */

/** Screenshot used on each coverage card, keyed by section label. */
const SECTION_IMAGE: Record<string, string> = {
  "My Drawings": SCREEN_IMAGES["My Drawings"],
  "Drawing-Videos": SCREEN_IMAGES["Drawing - Videos"],
  "My Site Patrol": SCREEN_IMAGES["My Site Patrol"],
  "Site Recordings": SCREEN_IMAGES["Site Recordings"],
  Workspace: SCREEN_IMAGES.Header,
  "My Tickets": SCREEN_IMAGES["Global Settings"],
  Dashboard: SCREEN_IMAGES["Global Settings"],
  "Content Library": SCREEN_IMAGES["Global Settings"],
  "Areas Without Help": SCREEN_IMAGES["Global Settings"],
  "Help Library": SCREEN_IMAGES["Global Settings"],
};

function CoverageTab() {
  const { state, setContext, requestPanelView } = useHmsStore();

  const groups = useMemo(() => {
    const bySection: Record<string, { key: string; label: string; count: number }[]> = {};
    for (const key of Object.keys(CONTEXT_ARTICLE_MAP)) {
      const label = CONTEXT_LABELS[key] ?? key;
      const sectionLabel = label.split(" › ")[0];
      const count =
        (CONTEXT_ARTICLE_MAP[key] ?? []).length +
        state.articles.filter((a) => a.contexts?.includes(key)).length;
      (bySection[sectionLabel] ??= []).push({ key, label, count });
    }
    return Object.entries(bySection).sort((a, b) => a[0].localeCompare(b[0]));
  }, [state.articles]);

  const totalGaps = groups.reduce(
    (n, [, items]) => n + items.filter((i) => i.count === 0).length,
    0,
  );

  return (
    <div className="space-y-4" data-hms-context="admin-coverage-list">
      <div className="rounded-2xl border-2 border-destructive/50 bg-card p-4">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          Areas without help
        </div>
        <div className="text-2xl font-semibold tabular-nums">{totalGaps}</div>
        <p className="text-xs text-muted-foreground">
          Registered components with no published resource. Pick an area below to author help for
          the components that are still uncovered.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map(([section, items]) => {
          const missing = items.filter((i) => i.count === 0);
          const covered = items.length - missing.length;
          const critical = missing.length >= Math.max(2, Math.ceil(items.length / 2));
          const image = SECTION_IMAGE[section];
          return (
            <section
              key={section}
              className={`rounded-2xl border-2 bg-card overflow-hidden ${
                missing.length === 0
                  ? "border-emerald-500/40"
                  : critical
                    ? "border-destructive/50"
                    : "border-amber-500/50"
              }`}
            >
              <div className="relative h-28 bg-muted">
                {image ? (
                  <img
                    src={image}
                    alt={`${SECTION_LABELS[section] ?? section} screen preview`}
                    loading="lazy"
                    className="size-full object-cover object-top"
                  />
                ) : null}
                <Badge
                  className={`absolute top-2 right-2 text-[10px] ${
                    missing.length === 0
                      ? "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
                      : critical
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive"
                        : "bg-amber-500 text-white hover:bg-amber-500"
                  }`}
                >
                  {missing.length === 0 ? "Covered" : critical ? "Critical" : "Acceptable"}
                </Badge>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm">{SECTION_LABELS[section] ?? section}</div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {covered}/{items.length} covered
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {missing.length} component{missing.length === 1 ? "" : "s"} without help
                </p>

                <ul className="mt-3 space-y-1.5 max-h-32 overflow-auto pr-1">
                  {items.map((i) => (
                    <li key={i.key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-muted-foreground">
                        {i.label.split(" › ")[1] ?? i.label}
                      </span>
                      {i.count === 0 ? (
                        <button
                          className="shrink-0 text-destructive underline"
                          onClick={() => {
                            setContext(i.key);
                            requestPanelView({ type: "add" });
                          }}
                        >
                          Add help
                        </button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {i.count}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
