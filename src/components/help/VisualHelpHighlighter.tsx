import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useHelpInspector } from "@/lib/inspector-context";
import { useHmsStore, type HmsArticle } from "@/components/hms/hmsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  Video,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { buildApprovedTree, type ApprovedTreeItem } from "@/lib/help-nodes";

export function VisualHelpHighlighter() {
  const { isEnabled, mode, locations } = useHelpInspector();
  const {
    state: hmsState,
    setContext,
    openPanel,
    requestPanelView,
    archiveArticle,
    deleteArticle,
  } = useHmsStore();

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<HmsArticle | null>(null);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => new Set());

  // Direct DOM style mutation on rAF to bypass React render cycle latency & track 60fps synchronously
  useEffect(() => {
    let rAfId: number | null = null;
    let running = true;

    const updateDirectDOM = () => {
      locations.forEach((loc) => {
        if (!loc.element || !loc.element.isConnected) return;
        const overlayEl = document.querySelector<HTMLElement>(`[data-help-popover="${loc.contextKey}"]`);
        if (!overlayEl) return;

        const rect = loc.element.getBoundingClientRect();
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 50 &&
          rect.top < (typeof window !== "undefined" ? window.innerHeight - 36 : 1000) &&
          rect.right > 0 &&
          rect.left < (typeof window !== "undefined" ? window.innerWidth : 1000);

        if (!isVisible) {
          overlayEl.style.display = "none";
        } else {
          overlayEl.style.display = "block";
          overlayEl.style.top = `${rect.top}px`;
          overlayEl.style.left = `${rect.left}px`;
          overlayEl.style.width = `${rect.width}px`;
          overlayEl.style.height = `${rect.height}px`;
        }
      });
    };

    const loop = () => {
      if (!running) return;
      updateDirectDOM();
      rAfId = requestAnimationFrame(loop);
    };

    const triggerUpdate = () => {
      if (rAfId !== null) cancelAnimationFrame(rAfId);
      rAfId = requestAnimationFrame(loop);
    };

    // 1. Scroll, resize, and animation/transition event listeners
    window.addEventListener("scroll", triggerUpdate, { capture: true, passive: true });
    window.addEventListener("resize", triggerUpdate, { passive: true });
    window.addEventListener("transitionend", triggerUpdate, { capture: true, passive: true });
    window.addEventListener("animationend", triggerUpdate, { capture: true, passive: true });

    // 2. ResizeObserver to catch sidebar expand/collapse & layout changes on body/main
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      resizeObserver = new ResizeObserver(() => {
        triggerUpdate();
      });
      resizeObserver.observe(document.body);
      const mainEl = document.querySelector("main");
      if (mainEl) resizeObserver.observe(mainEl);
    }

    // 3. MutationObserver to catch sidebar class/attribute toggles
    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined" && document.body) {
      mutationObserver = new MutationObserver(() => {
        triggerUpdate();
      });
      mutationObserver.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ["class", "style", "data-state", "data-collapsed"],
      });
    }

    rAfId = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (rAfId !== null) cancelAnimationFrame(rAfId);
      window.removeEventListener("scroll", triggerUpdate, { capture: true } as any);
      window.removeEventListener("resize", triggerUpdate);
      window.removeEventListener("transitionend", triggerUpdate, { capture: true } as any);
      window.removeEventListener("animationend", triggerUpdate, { capture: true } as any);
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, [locations]);

  // Close active popover when clicking outside
  useEffect(() => {
    if (!activeKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-help-popover="${activeKey}"]`)) {
        setActiveKey(null);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [activeKey]);

  const renderApprovedItem = (
    item: ApprovedTreeItem,
    contextKey: string,
    label: string,
    depth = 0
  ): React.ReactNode => {
    const isFolder = item.kind === "folder" || item.kind === "subfolder";
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = !collapsedFolderIds.has(item.id);
    const isHidden = item.archiveStatus === "archived";

    const toggleFolder = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCollapsedFolderIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });
    };

    const handleRowClick = () => {
      if (isFolder) {
        setCollapsedFolderIds((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
      } else {
        setContext(contextKey, label);
        requestPanelView({ type: "article", id: item.articleId });
        openPanel();
        setActiveKey(null);
      }
    };

    const artForDetail: HmsArticle = item.article || {
      id: item.articleId,
      title: item.name,
      description: item.node?.description || `Approved ${item.kind}`,
      contentType: (item.kind === "subfolder" ? "folder" : item.kind) as any,
      contentUrl: item.node?.contentUrl || null,
      relatedContext: label,
      contexts: [contextKey],
      approvalStatus: (item.approvalStatus || "approved") as any,
      archiveStatus: item.archiveStatus || "active",
      authorId: "admin",
      authorName: item.node?.owner || "Superadmin",
      approvedBy: "Superadmin",
      approvedAt: new Date().toISOString(),
      createdAt: item.node?.modified || new Date().toISOString(),
      updatedAt: item.node?.modified || new Date().toISOString(),
      tags: [item.kind],
      priority: "medium",
    };

    return (
      <div key={item.id} className="space-y-1">
        <div
          className={`group/item flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-500/25 transition-colors border border-transparent hover:border-indigo-500/30 ${
            depth > 0 ? "ml-3 border-l-2 border-indigo-500/40 pl-2" : ""
          }`}
          onClick={handleRowClick}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
            {isFolder ? (
              <button
                type="button"
                onClick={toggleFolder}
                className="p-0.5 -ml-0.5 rounded hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                title={isExpanded ? "Collapse folder" : "Expand folder"}
              >
                {isExpanded ? (
                  <ChevronDown className="size-3.5 text-slate-300" />
                ) : (
                  <ChevronRight className="size-3.5 text-slate-400" />
                )}
              </button>
            ) : depth > 0 ? (
              <span className="w-1.5 shrink-0" />
            ) : null}

            {isFolder && <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
            {item.kind === "video" && <Video className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
            {item.kind === "pdf" && <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
            {item.kind === "image" && <ImageIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
            {item.kind === "text" && <FileText className="h-3.5 w-3.5 text-sky-400 shrink-0" />}

            <span className="text-xs truncate font-medium text-slate-200 group-hover/item:text-indigo-300 transition-colors">
              {item.name}
            </span>

            {isFolder && hasChildren && (
              <span className="text-[10px] text-slate-400 font-normal shrink-0">
                ({item.children.length})
              </span>
            )}

            {isHidden && (
              <Badge className="text-[9px] px-1 py-0 h-4 bg-amber-500/20 text-amber-300 border-amber-500/40 shrink-0">
                Hidden
              </Badge>
            )}
          </div>

          {/* Superadmin Actions: View Details, Hide, Delete */}
          <div
            className="flex items-center gap-0.5 shrink-0 ml-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded cursor-pointer"
              title="View details"
              onClick={() => setDetailItem(artForDetail)}
            >
              <Eye className="size-3.5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className={`size-6 rounded cursor-pointer ${
                isHidden
                  ? "text-amber-400 hover:text-amber-300 hover:bg-amber-950/50"
                  : "text-slate-400 hover:text-amber-300 hover:bg-slate-700/80"
              }`}
              title={isHidden ? "Unhide for customers" : "Hide from customers"}
              onClick={() => {
                archiveArticle(item.articleId);
                toast.success(
                  isHidden ? "Unhidden — live for customers" : "Hidden from customers"
                );
              }}
            >
              {isHidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded cursor-pointer"
              title="Delete content"
              onClick={() => {
                deleteArticle(item.articleId);
                toast.success(`Deleted "${item.name}"`);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>

            <ExternalLink className="h-3 w-3 opacity-40 group-hover/item:opacity-100 text-indigo-400 shrink-0 transition-opacity ml-0.5" />
          </div>
        </div>

        {/* Nested Folder Children (Folder -> Subfolder -> Content) */}
        {isFolder && isExpanded && hasChildren && (
          <div className="space-y-1 mt-1">
            {item.children.map((child) =>
              renderApprovedItem(child, contextKey, label, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isEnabled || mode !== "visual") return null;

  const locationsWithHelp = locations.filter(
    (l) => l.hasHelp && !l.element.closest("aside, .sidebar, [data-sidebar]")
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {locationsWithHelp.map((loc) => {
        const { contextKey, label, element, articles } = loc;
        if (!element || !element.isConnected) return null;

        // Dynamically compute exact bounding rect on current frame
        const rect = element.getBoundingClientRect();

        // Viewport visibility checks - hide highlight if target scrolled off screen or under header/footer
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 50 &&
          rect.top < (typeof window !== "undefined" ? window.innerHeight - 36 : 1000) &&
          rect.right > 0 &&
          rect.left < (typeof window !== "undefined" ? window.innerWidth : 1000);

        if (!isVisible) {
          if (activeKey === contextKey) setActiveKey(null);
          return null;
        }

        const isActive = activeKey === contextKey;
        const isHovered = hoveredKey === contextKey;

        // Viewport boundary checks
        const popoverShowBelow = rect.top < 220;
        const isNearRight = typeof window !== "undefined" && rect.right > window.innerWidth - 340;
        const isNearLeft = rect.left < 160;

        const horizontalPositionClass = isNearRight
          ? "right-0 translate-x-0"
          : isNearLeft
          ? "left-0 translate-x-0"
          : "left-1/2 -translate-x-1/2";

        // Query all approved articles associated with this location
        const approvedItems = hmsState.articles.filter(
          (a) =>
            a.approvalStatus === "approved" &&
            (a.contexts?.includes(contextKey) ||
              articles.some((orig) => orig.id === a.id) ||
              a.hierarchy?.cardName?.toLowerCase() === label.toLowerCase())
        );

        const displayItems = approvedItems.length > 0 ? approvedItems : articles;
        const treeItems = buildApprovedTree(displayItems);

        return (
          <div
            key={contextKey}
            data-help-popover={contextKey}
            style={{
              position: "fixed",
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              // Stacking context elevation: Active location is elevated far above all other badges
              zIndex: isActive ? 9999 : isHovered ? 30 : 20,
            }}
            className="pointer-events-auto group transition-none"
            onMouseEnter={() => setHoveredKey(contextKey)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            {/* Glowing border around target element */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveKey((prev) => (prev === contextKey ? null : contextKey));
              }}
              className={`absolute inset-0 rounded-lg border-2 border-indigo-500 bg-indigo-500/10 cursor-pointer transition-all duration-200 ${
                isActive
                  ? "border-indigo-400 bg-indigo-500/25 shadow-[0_0_25px_rgba(99,102,241,0.8)] scale-[1.01]"
                  : isHovered
                  ? "border-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  : "opacity-60 hover:opacity-100"
              }`}
            />

            {/* Micro Badge Counter Tag */}
            <div
              className={`absolute -top-3.5 -right-3.5 z-10 transition-transform duration-200 ${
                isActive ? "scale-110" : "hover:scale-105"
              }`}
            >
              <Button
                size="sm"
                className="h-6 px-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-[11px] shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-200 border border-white/30 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveKey((prev) => (prev === contextKey ? null : contextKey));
                }}
              >
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {displayItems.length}
                </span>
              </Button>
            </div>

            {/* Click Micro-Card Tooltip (Elevated to z-[10000]) */}
            {isActive && (
              <div
                className={`absolute w-96 min-w-[340px] max-w-[95vw] rounded-xl bg-slate-950/95 backdrop-blur-xl p-3 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-indigo-500/50 z-[10000] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto ${horizontalPositionClass} ${
                  popoverShowBelow ? "top-full mt-2" : "bottom-full mb-2"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-800 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-xs truncate text-white">{label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300 bg-indigo-500/10 shrink-0 whitespace-nowrap">
                    {displayItems.length} Attached
                  </Badge>
                </div>

                {/* Approved Content Section Header */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 pb-1.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>Approved Content</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {displayItems.filter((a) => a.archiveStatus === "active").length} live to customers
                  </span>
                </div>

                {/* Approved Items List (Folder -> Subfolder -> Content Hierarchy) */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {treeItems.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No approved content in this section.
                    </div>
                  ) : (
                    treeItems.map((item) =>
                      renderApprovedItem(item, contextKey, label, 0)
                    )
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 cursor-pointer"
                    onClick={() => {
                      setContext(contextKey, label);
                      openPanel();
                      setActiveKey(null);
                    }}
                  >
                    Open in HMS Panel →
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Superadmin View Details Modal */}
      <Dialog open={Boolean(detailItem)} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="max-w-lg bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize text-[10px] text-indigo-300 border-indigo-500/40 bg-indigo-500/10">
                {detailItem?.contentType}
              </Badge>
              <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                Approved
              </Badge>
              {detailItem?.archiveStatus === "archived" && (
                <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/40">
                  Hidden
                </Badge>
              )}
            </div>
            <DialogTitle className="text-base font-semibold text-white pt-1">
              {detailItem?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {detailItem?.description || "Help content resource"}
            </DialogDescription>
          </DialogHeader>

          {/* Media / Content Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
            {detailItem?.contentType === "image" && detailItem.contentUrl && (
              <div className="rounded-lg overflow-hidden max-h-56 flex items-center justify-center bg-black/40">
                <img src={detailItem.contentUrl} alt={detailItem.title} className="max-h-56 object-contain" />
              </div>
            )}
            {detailItem?.contentType === "video" && detailItem.contentUrl && (
              <video src={detailItem.contentUrl} controls className="w-full rounded-lg max-h-56 object-contain" />
            )}
            {detailItem?.contentType === "pdf" && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                <FileText className="size-5 text-amber-400" />
                <span>PDF Document attached: {detailItem.title}</span>
              </div>
            )}
            {detailItem?.contentType === "folder" && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Folder className="size-4 text-amber-400" />
                  <span>Approved Folder</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  This folder and its approved contents are active and visible in the customer help tree.
                </p>
              </div>
            )}
            {detailItem?.contentType === "text" && (
              <div className="p-2 text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {detailItem.contentUrl || detailItem.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div><span className="text-slate-200 font-medium">Author:</span> {detailItem?.authorName}</div>
              <div><span className="text-slate-200 font-medium">Updated:</span> {detailItem?.updatedAt ? new Date(detailItem.updatedAt).toLocaleDateString() : "Recently"}</div>
              <div><span className="text-slate-200 font-medium">Page:</span> {detailItem?.hierarchy?.pageName || "Site Recordings"}</div>
              <div><span className="text-slate-200 font-medium">Card:</span> {detailItem?.hierarchy?.cardName || "Drawings"}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <Button
              size="sm"
              variant="destructive"
              className="h-8 gap-1.5 text-xs cursor-pointer"
              onClick={() => {
                if (detailItem) {
                  deleteArticle(detailItem.id);
                  toast.success(`Deleted "${detailItem.title}"`);
                  setDetailItem(null);
                }
              }}
            >
              <Trash2 className="size-3.5" /> Delete Content
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer"
                onClick={() => {
                  if (detailItem) {
                    archiveArticle(detailItem.id);
                    const nowHidden = detailItem.archiveStatus === "active";
                    toast.success(nowHidden ? "Hidden from customers" : "Unhidden — live for customers");
                    setDetailItem((prev) =>
                      prev ? { ...prev, archiveStatus: nowHidden ? "archived" : "active" } : null
                    );
                  }
                }}
              >
                {detailItem?.archiveStatus === "archived" ? (
                  <>
                    <Eye className="size-3.5 text-emerald-400" /> Unhide
                  </>
                ) : (
                  <>
                    <EyeOff className="size-3.5 text-amber-400" /> Hide from Customers
                  </>
                )}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                onClick={() => setDetailItem(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
