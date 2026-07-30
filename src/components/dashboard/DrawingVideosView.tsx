import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Pin, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DRAWING_PINS } from "@/lib/dashboard-data";
import { SectionToolbar, FilterGroup, FilterChip } from "./SectionToolbar";

export function DrawingVideosView() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [pinId, setPinId] = useState(DRAWING_PINS[0].id);
  const [dateIndex, setDateIndex] = useState(0);

  const pins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DRAWING_PINS.filter(
      (p) =>
        (!q || `${p.label} ${p.level}`.toLowerCase().includes(q)) &&
        (level === "all" || p.level === level),
    );
  }, [query, level]);

  const pin = DRAWING_PINS.find((p) => p.id === pinId) ?? DRAWING_PINS[0];
  const dates = pin.dates;
  const currentDate = dates[Math.min(dateIndex, dates.length - 1)];

  const selectPin = (id: string) => {
    setPinId(id);
    setDateIndex(0);
  };

  return (
    <>
      <div className="px-6 py-4 border-b flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-base">Drawing - Videos</span>
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 gap-1 border-0">
            <FileText className="size-3" /> KL-Architecture-plan.pdf
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {pin.sessions} session{pin.sessions === 1 ? "" : "s"} on {pin.label}
        </div>
      </div>

      <SectionToolbar
        searchContext="drawing-videos-search"
        filterContext="drawing-videos-filter"
        placeholder="Search pins…"
        query={query}
        onQueryChange={setQuery}
        filterActive={level !== "all"}
        filterContent={
          <FilterGroup label="Level">
            <FilterChip active={level === "all"} onClick={() => setLevel("all")}>
              All
            </FilterChip>
            {Array.from(new Set(DRAWING_PINS.map((p) => p.level))).map((l) => (
              <FilterChip key={l} active={level === l} onClick={() => setLevel(l)}>
                {l}
              </FilterChip>
            ))}
          </FilterGroup>
        }
      />

      <div className="grid lg:grid-cols-[260px_1fr_1fr] divide-x">
        {/* Pin list */}
        <div className="p-3 space-y-1" data-hms-context="drawing-videos-pin-list">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 pb-1">
            Pins
          </div>
          {pins.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4">No pins match your search.</p>
          )}
          {pins.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPin(p.id)}
              data-hms-context="drawing-videos-pin-list"
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                p.id === pinId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
              }`}
            >
              <Pin className="size-3.5" />
              <span className="flex-1 text-left">{p.label}</span>
              <span className="text-[11px] text-muted-foreground">{p.dates.length}</span>
            </button>
          ))}
        </div>

        {/* PDF viewer */}
        <div className="p-3" data-hms-context="drawing-videos-pdf-viewer">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground pb-2">
            Drawing
          </div>
          <iframe
            title="KL-Architecture-plan"
            src="/help/site-recordings-table-guide.pdf#toolbar=0"
            className="w-full h-[320px] rounded-lg border bg-muted"
          />
        </div>

        {/* Time-lapse viewer */}
        <div className="p-3 space-y-3" data-hms-context="drawing-videos-time-lapse">
          <div className="flex items-center justify-between" data-hms-context="drawing-videos-date-navigator">
            <Button
              size="icon"
              variant="outline"
              className="size-7"
              aria-label="Previous date"
              disabled={dateIndex === 0}
              onClick={() => setDateIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="text-sm font-medium">{currentDate}</div>
            <Button
              size="icon"
              variant="outline"
              className="size-7"
              aria-label="Next date"
              disabled={dateIndex >= dates.length - 1}
              onClick={() => setDateIndex((i) => Math.min(dates.length - 1, i + 1))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
          <video
            key={`${pin.id}-${currentDate}`}
            controls
            className="w-full rounded-lg bg-black"
            src="/help/time-lapse-viewer.mp4"
          />
          <div className="flex flex-wrap gap-1.5">
            {dates.map((d, i) => (
              <button
                key={d}
                onClick={() => setDateIndex(i)}
                className={`px-2 py-1 rounded-md border text-[11px] ${
                  i === dateIndex ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Play className="size-3" /> Time-lapse for {pin.label} · {pin.level}
          </div>
        </div>
      </div>
    </>
  );
}
