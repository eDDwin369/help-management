import { useMemo, useState } from "react";
import { Folder, FileText, Star, Plus, ChevronRight, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DRAWING_ITEMS, type DrawingItem } from "@/lib/dashboard-data";
import {
  SectionToolbar,
  FilterGroup,
  FilterChip,
  EmptyRow,
  type ViewMode,
} from "./SectionToolbar";

type KindFilter = "all" | "folder" | "pdf";

export function MyDrawingsView() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [kind, setKind] = useState<KindFilter>("all");
  const [owner, setOwner] = useState<string>("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [active, setActive] = useState<DrawingItem | null>(null);

  const owners = useMemo(
    () => Array.from(new Set(DRAWING_ITEMS.map((d) => d.owner))),
    [],
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DRAWING_ITEMS.filter((d) => {
      if (q && !`${d.name} ${d.owner}`.toLowerCase().includes(q)) return false;
      if (kind !== "all" && d.kind !== kind) return false;
      if (owner !== "all" && d.owner !== owner) return false;
      if (starredOnly && !d.starred) return false;
      return true;
    });
  }, [query, kind, owner, starredOnly]);

  const filterActive = kind !== "all" || owner !== "all" || starredOnly;

  return (
    <>
      <div className="px-6 py-4 border-b flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm" data-hms-context="my-drawings-breadcrumb">
          <span className="font-semibold text-base">My Drawings</span>
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">All files</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{items.length}</span> of{" "}
          <span className="font-semibold text-foreground">{DRAWING_ITEMS.length}</span> items
        </div>
      </div>

      <SectionToolbar
        searchContext="my-drawings-search"
        toggleContext={view === "grid" ? "my-drawings-grid-view" : "my-drawings-list-view"}
        filterContext="my-drawings-filter"
        placeholder="Search drawings…"
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        filterActive={filterActive}
        filterContent={
          <>
            <FilterGroup label="Type">
              {(["all", "folder", "pdf"] as KindFilter[]).map((k) => (
                <FilterChip key={k} active={kind === k} onClick={() => setKind(k)}>
                  {k === "all" ? "All" : k === "folder" ? "Folders" : "Drawings"}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Owner">
              <FilterChip active={owner === "all"} onClick={() => setOwner("all")}>
                Anyone
              </FilterChip>
              {owners.map((o) => (
                <FilterChip key={o} active={owner === o} onClick={() => setOwner(o)}>
                  {o.split(" ")[0]}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Favourites">
              <FilterChip active={starredOnly} onClick={() => setStarredOnly(!starredOnly)}>
                Starred only
              </FilterChip>
            </FilterGroup>
          </>
        }
      >
        <Button
          size="sm"
          className="gap-1.5"
          data-hms-context="my-drawings-new-button"
          onClick={() => toast.success("New folder created in My Drawings")}
        >
          <Plus className="size-3.5" /> New
        </Button>
      </SectionToolbar>

      {view === "list" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-hms-context="my-drawings-table">
            <thead className="bg-muted/30 text-primary text-xs uppercase tracking-wider">
              <tr className="text-left">
                {["Name", "Owner", "Last modified", "Pins", "Size"].map((c) => (
                  <th key={c} className="px-4 py-3 font-semibold whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 && <EmptyRow colSpan={5} message="No drawings match your search." />}
              {items.map((d) => (
                <tr
                  key={d.id}
                  data-hms-context="my-drawings-row"
                  onClick={() => setActive(d)}
                  className="hover:bg-muted/20 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {d.kind === "folder" ? (
                        <Folder className="size-4 text-amber-500" />
                      ) : (
                        <FileText className="size-4 text-primary" />
                      )}
                      <span>{d.name}</span>
                      {d.starred && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.owner}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.modified}</td>
                  <td className="px-4 py-3">
                    {d.kind === "pdf" ? (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Pin className="size-3" /> {d.pins}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{d.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4" data-hms-context="my-drawings-table">
          {items.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
              No drawings match your search.
            </p>
          )}
          {items.map((d) => (
            <button
              key={d.id}
              data-hms-context="my-drawings-row"
              onClick={() => setActive(d)}
              className="border rounded-xl p-4 text-left hover:shadow-md transition-shadow bg-card"
            >
              {d.kind === "folder" ? (
                <Folder className="size-8 text-amber-500 mb-3" />
              ) : (
                <FileText className="size-8 text-primary mb-3" />
              )}
              <div className="text-xs font-medium truncate">{d.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{d.modified}</div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base break-all">{active?.name}</DialogTitle>
            <DialogDescription>
              {active?.kind === "folder" ? "Folder" : "Drawing"} · owned by {active?.owner}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Last modified</dt>
            <dd>{active?.modified}</dd>
            <dt className="text-muted-foreground">Size</dt>
            <dd>{active?.size}</dd>
            <dt className="text-muted-foreground">Pins</dt>
            <dd>{active?.kind === "pdf" ? active?.pins : "—"}</dd>
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
