import { useState, useMemo, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Film,
  FileText,
  Image as ImageIcon,
  FileType2,
  Search,
  Inbox,
  MessageSquare,
  Archive,
  ArchiveRestore,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { FilterMenu, type FilterSection } from "./FilterMenu";
import { fmt } from "@/lib/format";
import type { HelpContentType, HelpItem } from "@/lib/types";

const TYPE_META: Record<
  HelpContentType,
  { icon: React.ElementType; tint: string; label: string }
> = {
  video: { icon: Film, tint: "text-rose-500", label: "Video" },
  pdf: { icon: FileText, tint: "text-blue-500", label: "PDF" },
  image: { icon: ImageIcon, tint: "text-emerald-500", label: "Image" },
  text: { icon: FileType2, tint: "text-amber-500", label: "Guide" },
};

export interface HelpExplorerProps {
  items: HelpItem[];
  /** Admin actions per row (optional). */
  admin?: {
    onApprove?: (item: HelpItem) => void;
    onArchive?: (item: HelpItem) => void;
    onDelete?: (item: HelpItem) => void;
  };
  emptyHint?: React.ReactNode;
  /** Optional extra filter sections beyond the standard ones. */
  extraSections?: FilterSection[];
  /** Show approval filter (Help Admin / Admin contexts). */
  showApproval?: boolean;
  /** Show archive filter (Help Admin / Admin contexts). */
  showArchive?: boolean;
  /** When provided, shows a Contact Support CTA in the empty state. */
  onContactSupport?: () => void;
}

/**
 * Windows Explorer / Google Drive style:
 *  ┌──────────────┬──────────────────────────┐
 *  │ filter+search│                          │
 *  │──────────────│        Preview           │
 *  │ list (clicks)│        + Details         │
 *  └──────────────┴──────────────────────────┘
 *
 *  Single click in the left list updates the right pane instantly.
 *  Preserves all functionality (approve / archive / delete / download / preview).
 */
export function HelpExplorer({
  items,
  admin,
  emptyHint,
  extraSections = [],
  showApproval = false,
  showArchive = false,
  onContactSupport,
}: HelpExplorerProps) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | HelpContentType>("all");
  const [archive, setArchive] = useState<"active" | "archived" | "all">("active");
  const [approval, setApproval] = useState<"all" | "approved" | "unapproved">("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (type !== "all" && it.contentType !== type) return false;
      if (showArchive) {
        if (archive === "active" && it.archived) return false;
        if (archive === "archived" && !it.archived) return false;
      } else if (it.archived) {
        return false;
      }
      if (showApproval && approval !== "all" && it.status !== approval) return false;
      if (q) {
        const ql = q.toLowerCase();
        if (
          !it.title.toLowerCase().includes(ql) &&
          !it.description.toLowerCase().includes(ql) &&
          !it.tags.some((t) => t.toLowerCase().includes(ql))
        )
          return false;
      }
      return true;
    });
  }, [items, q, type, archive, approval, showArchive, showApproval]);

  // Keep active selection valid as filters change
  useEffect(() => {
    if (filtered.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !filtered.some((f) => f.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  const active = filtered.find((f) => f.id === activeId) ?? null;

  const sections: FilterSection[] = [
    {
      key: "type",
      label: "Type",
      value: type,
      onChange: (v) => setType(v as typeof type),
      options: [
        { value: "all", label: "All types" },
        { value: "video", label: "Video" },
        { value: "pdf", label: "PDF" },
        { value: "image", label: "Image" },
        { value: "text", label: "Text guide" },
      ],
    },
    ...(showArchive
      ? [
          {
            key: "archive",
            label: "Archive",
            value: archive,
            onChange: (v: string) => setArchive(v as typeof archive),
            options: [
              { value: "active", label: "Active" },
              { value: "archived", label: "Archived" },
              { value: "all", label: "All" },
            ],
          },
        ]
      : []),
    ...(showApproval
      ? [
          {
            key: "approval",
            label: "Approval",
            value: approval,
            onChange: (v: string) => setApproval(v as typeof approval),
            options: [
              { value: "all", label: "All" },
              { value: "approved", label: "Approved" },
              { value: "unapproved", label: "Unapproved" },
            ],
          },
        ]
      : []),
    ...extraSections,
  ];

  return (
    <div className="flex flex-col">
      {/* Toolbar — left: search; right: filter */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2">
        <div className="relative w-64">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="ml-auto">
          <FilterMenu sections={sections} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="min-h-[420px] flex flex-col items-center justify-center text-center px-8 py-12">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Inbox className="size-5 text-muted-foreground" />
          </div>
          <div className="text-sm text-muted-foreground max-w-xs">
            {emptyHint ?? "No items"}
          </div>
          {onContactSupport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onContactSupport}
              className="mt-5 gap-1.5"
            >
              <MessageSquare className="size-3.5" />
              Contact Support
            </Button>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-[280px_1fr] min-h-[420px] max-h-[60vh]">
        {/* LEFT — list */}
        <ScrollArea className="border-r">
          <ul className="py-1">
            {filtered.map((it) => {
              const meta = TYPE_META[it.contentType];
              const Icon = meta.icon;
              const selected = it.id === activeId;
              return (
                <li key={it.id}>
                  <button
                    onClick={() => setActiveId(it.id)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 border-l-2 transition-colors ${
                      selected
                        ? "bg-primary/5 border-primary"
                        : "border-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div className="size-8 rounded bg-muted/60 shrink-0 flex items-center justify-center overflow-hidden">
                      {it.thumbnail || (it.contentType === "image" && it.url) ? (
                        <img
                          src={it.thumbnail || it.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className={`size-4 ${meta.tint}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate leading-tight">
                        {it.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className={meta.tint}>{meta.label}</span>
                        <span>·</span>
                        <span>{fmt.date(it.updatedAt)}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>

        {/* RIGHT — preview + details */}
        <div className="flex flex-col bg-muted/10 min-w-0">
          {active ? (
            <PreviewPane item={active} admin={admin} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Select an item to preview
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function PreviewPane({
  item,
  admin,
}: {
  item: HelpItem;
  admin?: HelpExplorerProps["admin"];
}) {
  return (
    <>
      {/* Preview body */}
      <div className="flex-1 min-h-0 bg-background/40 overflow-auto">
        {item.contentType === "video" && item.url && (
          <div className="h-full flex items-center justify-center p-4">
            <video
              src={item.url}
              controls
              className="max-h-full max-w-full rounded shadow"
            />
          </div>
        )}
        {item.contentType === "image" && item.url && (
          <div className="h-full flex items-center justify-center p-4">
            <img
              src={item.url}
              alt={item.title}
              className="max-h-full max-w-full rounded shadow"
            />
          </div>
        )}
        {item.contentType === "pdf" && item.url && (
          <iframe src={item.url} className="w-full h-full" title={item.title} />
        )}
        {item.contentType === "text" && (
          <article className="prose prose-sm dark:prose-invert max-w-none p-5">
            {item.body?.split("\n").map((line, i) => {
              if (line.startsWith("## "))
                return (
                  <h2 key={i} className="text-base font-semibold mt-3">
                    {line.slice(3)}
                  </h2>
                );
              if (line.startsWith("### "))
                return (
                  <h3 key={i} className="text-sm font-semibold mt-2">
                    {line.slice(4)}
                  </h3>
                );
              if (line.startsWith("- "))
                return (
                  <li key={i} className="ml-5 list-disc text-xs">
                    {line.slice(2)}
                  </li>
                );
              if (!line.trim()) return <br key={i} />;
              return (
                <p
                  key={i}
                  className="text-xs leading-6 my-1.5"
                  dangerouslySetInnerHTML={{
                    __html: line
                      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.+?)\*/g, "<em>$1</em>"),
                  }}
                />
              );
            })}
          </article>
        )}
      </div>

      {/* Details strip */}
      <div className="border-t px-4 py-3 bg-card space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{item.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {item.description}
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {admin?.onApprove && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => admin.onApprove!(item)}
                title={item.status === "approved" ? "Unapprove" : "Approve"}
              >
                {item.status === "approved" ? (
                  <XCircle className="size-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                )}
              </Button>
            )}
            {admin?.onArchive && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => admin.onArchive!(item)}
                title={item.archived ? "Restore" : "Archive"}
              >
                {item.archived ? (
                  <ArchiveRestore className="size-4" />
                ) : (
                  <Archive className="size-4" />
                )}
              </Button>
            )}
            {admin?.onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => admin.onDelete!(item)}
                title="Delete"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground pt-1">
          <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5 capitalize">
            {item.contentType}
          </Badge>
          {item.status === "approved" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <CheckCircle2 className="size-3" /> Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
              <XCircle className="size-3" /> Unapproved
            </span>
          )}
          <span>By {item.addedBy}</span>
          <span>·</span>
          <span>Added {fmt.date(item.createdAt)}</span>
          <span>·</span>
          <span>Updated {fmt.ago(item.updatedAt)}</span>
          {item.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-1">
                {item.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-[10px] py-0 px-1.5 h-4"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
