import { useMemo, useState } from "react";
import { Video, ChevronRight, Folder, Settings2, CalendarDays, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RECORDING_ROWS, type RecordingRow } from "@/lib/dashboard-data";
import {
  SectionToolbar,
  FilterGroup,
  FilterChip,
  EmptyRow,
  type ViewMode,
} from "./SectionToolbar";

const COLUMN_CONTEXT: Record<string, string> = {
  Session: "site-recordings-col-session",
  "Pin Location": "site-recordings-col-pin",
  "Pin Label": "site-recordings-col-pin",
  "Recording Name": "site-recordings-col-recording",
  Resolution: "site-recordings-col-resolution",
  "Date & Time": "site-recordings-col-date",
  "Session Started At": "site-recordings-col-session-start",
  "Session Closed At": "site-recordings-col-session-close",
  Duration: "site-recordings-col-duration",
  Size: "site-recordings-col-size",
};

const COLUMNS = Object.keys(COLUMN_CONTEXT);

const DATE_RANGES = [
  { id: "all", label: "All time" },
  { id: "may", label: "May 2026" },
  { id: "apr", label: "Apr 2026" },
] as const;

export function SiteRecordingsView() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [pin, setPin] = useState<string | "all">("all");
  const [session, setSession] = useState<number | "all">("all");
  const [range, setRange] = useState<(typeof DATE_RANGES)[number]["id"]>("all");
  const [active, setActive] = useState<RecordingRow | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RECORDING_ROWS.filter((r) => {
      if (q && !`${r.name} ${r.pinLabel} ${r.pin}`.toLowerCase().includes(q)) return false;
      if (pin !== "all" && r.pin !== pin) return false;
      if (session !== "all" && r.session !== session) return false;
      if (range === "may" && !r.date.startsWith("2026-05")) return false;
      if (range === "apr" && !r.date.startsWith("2026-04")) return false;
      return true;
    });
  }, [query, pin, session, range]);

  const filterActive = pin !== "all" || session !== "all" || range !== "all";

  return (
    <>
      <div className="px-6 py-4 border-b flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm" data-hms-context="site-recordings-breadcrumb">
          <span className="font-semibold text-base">Recordings</span>
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">KI Test Folder</span>
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 gap-1 border-0">
            <Folder className="size-3" /> KL-Architecture-plan.pdf
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{rows.length}</span> of{" "}
          <span className="font-semibold text-foreground">{RECORDING_ROWS.length}</span> recordings
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="Column settings"
            data-hms-context="site-recordings-settings"
          >
            <Settings2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <SectionToolbar
        searchContext="site-recordings-search"
        toggleContext="site-recordings-view-toggle"
        filterContext="site-recordings-filter"
        placeholder="Search recordings…"
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        filterActive={filterActive}
        filterContent={
          <>
            <FilterGroup label="Pin location">
              <FilterChip active={pin === "all"} onClick={() => setPin("all")}>
                All
              </FilterChip>
              {["L1", "L2"].map((p) => (
                <FilterChip key={p} active={pin === p} onClick={() => setPin(p)}>
                  {p}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Session">
              <FilterChip active={session === "all"} onClick={() => setSession("all")}>
                All
              </FilterChip>
              {[1, 2].map((s) => (
                <FilterChip key={s} active={session === s} onClick={() => setSession(s)}>
                  Session {s}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Date range">
              {DATE_RANGES.map((d) => (
                <FilterChip key={d.id} active={range === d.id} onClick={() => setRange(d.id)}>
                  {d.label}
                </FilterChip>
              ))}
            </FilterGroup>
            {filterActive && (
              <button
                onClick={() => {
                  setPin("all");
                  setSession("all");
                  setRange("all");
                }}
                className="text-xs text-primary inline-flex items-center gap-1"
              >
                <X className="size-3" /> Clear all filters
              </button>
            )}
          </>
        }
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          data-hms-context="site-recordings-date-filter"
          onClick={() => setRange(range === "all" ? "may" : "all")}
        >
          <CalendarDays className="size-3.5" />
          {range === "all" ? "Last 30 Days" : DATE_RANGES.find((d) => d.id === range)!.label}
        </Button>
      </SectionToolbar>

      {view === "list" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-hms-context="site-recordings-table">
            <thead className="bg-muted/30 text-primary text-xs uppercase tracking-wider">
              <tr className="text-left">
                {COLUMNS.map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3 font-semibold whitespace-nowrap"
                    data-hms-context={COLUMN_CONTEXT[c]}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <EmptyRow colSpan={COLUMNS.length} message="No recordings match your search." />
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-muted/20 cursor-pointer"
                  data-hms-context="site-recordings-row"
                  onClick={() => setActive(r)}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${r.sessionTint}`}>
                      {r.session}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2.5 py-0.5 rounded border text-xs">{r.pin}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.pinLabel}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Video className="size-4 text-muted-foreground" />
                      <span>{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.res}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.dt}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.startedTint || "text-muted-foreground"}`}>
                      {r.started}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.closedTint || "text-muted-foreground"}`}>
                      {r.closed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.dur}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" data-hms-context="site-recordings-table">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">
              No recordings match your search.
            </p>
          )}
          {rows.map((r) => (
            <button
              key={r.id}
              data-hms-context="site-recordings-row"
              onClick={() => setActive(r)}
              className="text-left border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-card"
            >
              <div className="h-28 bg-muted flex items-center justify-center">
                <Video className="size-7 text-muted-foreground" />
              </div>
              <div className="p-3 space-y-1">
                <div className="text-xs font-medium truncate">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.pinLabel} · {r.dt}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Session {r.session}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base break-all">{active?.name}</DialogTitle>
            <DialogDescription>
              Session {active?.session} · {active?.pinLabel} · {active?.res}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted h-44 flex items-center justify-center">
            <Video className="size-8 text-muted-foreground" />
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Detail label="Captured" value={active?.dt} />
            <Detail label="Duration" value={active?.dur} />
            <Detail label="Session started" value={active?.started} />
            <Detail label="Session closed" value={active?.closed} />
            <Detail label="Size" value={`${active?.size} MB`} />
            <Detail label="Resolution" value={active?.res} />
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
