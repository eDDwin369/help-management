import { useMemo, useState } from "react";
import { MapPin, Play, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PATROL_SESSIONS, type PatrolSession } from "@/lib/dashboard-data";
import { SectionToolbar, FilterGroup, FilterChip } from "./SectionToolbar";

const STATUS_META: Record<
  PatrolSession["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  completed: { label: "Completed", icon: CheckCircle2, className: "text-emerald-600" },
  "in-progress": { label: "In progress", icon: Clock, className: "text-amber-600" },
  flagged: { label: "Flagged", icon: AlertTriangle, className: "text-destructive" },
};

export function SitePatrolView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PatrolSession["status"]>("all");
  const [activeId, setActiveId] = useState(PATROL_SESSIONS[0].id);

  const sessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PATROL_SESSIONS.filter(
      (s) =>
        (!q || `${s.route} ${s.patroller} ${s.id}`.toLowerCase().includes(q)) &&
        (status === "all" || s.status === status),
    );
  }, [query, status]);

  const active = PATROL_SESSIONS.find((s) => s.id === activeId) ?? PATROL_SESSIONS[0];

  return (
    <>
      <div className="px-6 py-4 border-b flex items-center justify-between gap-3 flex-wrap">
        <span className="font-semibold text-base">My Site Patrol</span>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{sessions.length}</span> of{" "}
          <span className="font-semibold text-foreground">{PATROL_SESSIONS.length}</span> sessions
        </div>
      </div>

      <SectionToolbar
        searchContext="site-patrol-search"
        filterContext="site-patrol-filter"
        placeholder="Search patrol sessions…"
        query={query}
        onQueryChange={setQuery}
        filterActive={status !== "all"}
        filterContent={
          <FilterGroup label="Status">
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
              All
            </FilterChip>
            {(Object.keys(STATUS_META) as PatrolSession["status"][]).map((s) => (
              <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
                {STATUS_META[s].label}
              </FilterChip>
            ))}
          </FilterGroup>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] divide-x">
        <div className="p-3 space-y-2 max-h-[440px] overflow-y-auto" data-hms-context="site-patrol-list">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No patrol sessions match your search.
            </p>
          )}
          {sessions.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <button
                key={s.id}
                data-hms-context="site-patrol-session"
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left border rounded-xl p-3 transition-colors ${
                  s.id === activeId ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="size-3.5 text-primary" />
                    {s.route}
                  </div>
                  <span className={`text-[11px] inline-flex items-center gap-1 ${meta.className}`}>
                    <meta.icon className="size-3" /> {meta.label}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.patroller} · {s.date} · {s.start}–{s.end}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px]">
                    {s.clips} clips
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {s.duration}
                  </Badge>
                  {s.findings > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {s.findings} findings
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 space-y-3" data-hms-context="site-patrol-video-viewer">
          <div className="text-sm font-medium">{active.route}</div>
          <video
            key={active.id}
            controls
            className="w-full rounded-lg bg-black"
            src="/help/site-recordings-intro.mp4"
          />
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Session</dt>
            <dd className="tabular-nums">{active.id}</dd>
            <dt className="text-muted-foreground">Patroller</dt>
            <dd>{active.patroller}</dd>
            <dt className="text-muted-foreground">Window</dt>
            <dd>
              {active.start} – {active.end}
            </dd>
            <dt className="text-muted-foreground">Clips</dt>
            <dd className="inline-flex items-center gap-1">
              <Play className="size-3" /> {active.clips}
            </dd>
          </dl>
        </div>
      </div>
    </>
  );
}
