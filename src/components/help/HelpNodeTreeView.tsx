import { useState, useMemo, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Eye,
  Search,
  Maximize2,
  Minimize2,
  Info,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type HelpAdminNode,
  loadSavedNodes,
  getAllFolderIds,
  filterNodes,
} from "@/lib/help-nodes";
import { HelpNodePreviewDialog } from "./HelpNodePreviewDialog";

interface HelpNodeTreeViewProps {
  initialNodes?: HelpAdminNode[];
  onSelectNode?: (node: HelpAdminNode) => void;
  compact?: boolean;
  className?: string;
  showSearch?: boolean;
  onlyApproved?: boolean;
}

export function HelpNodeTreeView({
  initialNodes,
  onSelectNode,
  compact = false,
  className = "",
  showSearch = true,
  onlyApproved = true,
}: HelpNodeTreeViewProps) {
  const [nodes, setNodes] = useState<HelpAdminNode[]>(() => initialNodes || loadSavedNodes());
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Default to expanding all top approved folders so user can immediately see contents
    const active = filterNodes(initialNodes || loadSavedNodes(), "", true);
    const all = getAllFolderIds(active);
    return new Set(all);
  });
  const [previewNode, setPreviewNode] = useState<HelpAdminNode | null>(null);

  // Sync with localStorage or window events when Help Admin saves new nodes
  useEffect(() => {
    if (initialNodes) {
      setNodes(initialNodes);
      return;
    }

    const handleUpdate = () => {
      setNodes(loadSavedNodes());
    };

    window.addEventListener("hms_nodes_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("hms_nodes_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [initialNodes]);

  const filteredNodes = useMemo(() => {
    return filterNodes(nodes, search, onlyApproved);
  }, [nodes, search, onlyApproved]);

  const allFolderIds = useMemo(() => getAllFolderIds(filteredNodes), [filteredNodes]);
  const isAllExpanded = allFolderIds.length > 0 && allFolderIds.every((id) => expandedIds.has(id));

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(allFolderIds));
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleOpenPreview = (node: HelpAdminNode) => {
    setPreviewNode(node);
    onSelectNode?.(node);
  };

  return (
    <TooltipProvider>
      <div className={`flex flex-col bg-white dark:bg-card rounded-xl border border-slate-200/80 dark:border-border/70 overflow-hidden shadow-xs ${className}`}>
        {/* Header Bar with Search & Explode / Collapse All button */}
        <div className="p-2.5 bg-slate-50/90 dark:bg-muted/40 border-b border-slate-200/80 dark:border-border/60 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Layers className="size-3 text-amber-500 shrink-0" />
              <span>
                {filteredNodes.length} Approved Folder{filteredNodes.length === 1 ? "" : "s"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleExpandAll}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              title={isAllExpanded ? "Collapse all folders" : "Expand all folders"}
            >
              {isAllExpanded ? (
                <>
                  <Minimize2 className="size-2.5 text-slate-500" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <Maximize2 className="size-2.5 text-slate-500" />
                  <span>Expand All</span>
                </>
              )}
            </button>
          </div>

          {showSearch && (
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter folders & files..."
                className="h-7 text-xs pl-7 pr-2 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-1"
              />
            </div>
          )}
        </div>

        {/* Tree Container */}
        <div className="p-1 space-y-0.5 overflow-y-auto max-h-[380px] custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/40">
          {filteredNodes.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching folders or files found.
            </div>
          ) : (
            filteredNodes.map((node) => (
              <TreeRowItem
                key={node.id}
                node={node}
                level={0}
                expandedIds={expandedIds}
                onToggleFolder={toggleFolder}
                onPreview={handleOpenPreview}
                compact={compact}
              />
            ))
          )}
        </div>

        {/* Preview Dialog */}
        <HelpNodePreviewDialog
          node={previewNode}
          open={!!previewNode}
          onOpenChange={(open) => !open && setPreviewNode(null)}
        />
      </div>
    </TooltipProvider>
  );
}

// Recursive Tree Row Item matching Help Admin TreeNodeItem
function TreeRowItem({
  node,
  level,
  expandedIds,
  onToggleFolder,
  onPreview,
  compact,
}: {
  node: HelpAdminNode;
  level: number;
  expandedIds: Set<string>;
  onToggleFolder: (id: string) => void;
  onPreview: (node: HelpAdminNode) => void;
  compact?: boolean;
}) {
  const isFolder = node.kind === "folder" || node.kind === "subfolder";
  const isExpanded = expandedIds.has(node.id);

  return (
    <div className="transition-all select-none">
      <div
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        className="group px-2 py-1.5 rounded-md flex items-center justify-between gap-1.5 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-muted/50"
      >
        {/* Left click area */}
        <div
          onClick={() => {
            if (isFolder) {
              onToggleFolder(node.id);
            } else {
              onPreview(node);
            }
          }}
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
        >
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              )}
              <Folder className="h-4 w-4 text-amber-500 fill-amber-400/20 shrink-0" />
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              {node.kind === "pdf" && <FileText className="h-4 w-4 text-blue-500 shrink-0" />}
              {node.kind === "image" && <ImageIcon className="h-4 w-4 text-emerald-500 shrink-0" />}
              {node.kind === "video" && <Video className="h-4 w-4 text-rose-500 shrink-0" />}
              {node.kind === "text" && <FileText className="h-4 w-4 text-purple-500 shrink-0" />}
            </>
          )}

          <span className="font-semibold truncate text-slate-800 dark:text-slate-200">
            {node.name}
          </span>

          {node.description && node.description.trim().length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-500 flex items-center justify-center transition-colors shrink-0 ml-0.5"
                >
                  <Info className="h-2.5 w-2.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-medium max-w-[220px]">
                {node.description}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Right side status badge & action */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isFolder && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(node);
                  }}
                  className="h-5 px-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="h-3 w-3" />
                  <span className="text-[10px] font-medium hidden sm:inline">View</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-semibold">
                View content
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Render children recursively when expanded */}
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TreeRowItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggleFolder={onToggleFolder}
              onPreview={onPreview}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
