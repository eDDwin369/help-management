import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHmsStore, type ContentType } from "@/components/hms/hmsStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search,
  Plus,
  X,
  MoreVertical,
  FileText,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Video,
  Eye,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Filter,
  ChevronRight,
  ChevronDown,
  Info,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface HelpAdminNode {
  id: string;
  name: string;
  kind: "folder" | "subfolder" | "pdf" | "video" | "image" | "text";
  parentId?: string | null;
  owner: string;
  size?: string;
  modified: string;
  contentUrl?: string;
  description?: string;
  approvalStatus: "draft" | "pending" | "approved";
  children?: HelpAdminNode[];
}

// Default media previews for newly created items
const SAMPLE_MEDIA: Record<string, string> = {
  pdf: "/help/site-recordings-table-guide.pdf",
  image: "/help/pin-location-map.jpg",
  video: "/help/my-drawings-tour.mp4",
  text: "This document contains step-by-step instructions for managing drawings and site plans in HMS.",
};

export function HelpAdminRightClickModal() {
  const { user } = useAuth();
  const { context, contextKey, addArticle, openPanel } = useHmsStore();

  const isHelpAdmin = user?.role === "sub_admin" || user?.role === "admin";

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");

  // Tree nodes starting empty as requested!
  const [nodes, setNodes] = useState<HelpAdminNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Add Item Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [addKind, setAddKind] = useState<"folder" | "subfolder" | "pdf" | "image" | "video" | "text">("folder");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [customFileUrl, setCustomFileUrl] = useState<string>("");

  // Preview Dialog State
  const [previewNode, setPreviewNode] = useState<HelpAdminNode | null>(null);

  // Folder Right-Click Context Menu State
  const [folderContextMenu, setFolderContextMenu] = useState<{
    x: number;
    y: number;
    folderNode: HelpAdminNode;
  } | null>(null);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // Handle global right click to position and show modal
  useEffect(() => {
    if (!isHelpAdmin) {
      setVisible(false);
      return;
    }

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();

      const modalW = 350;
      const modalH = 440;
      const x = Math.max(12, Math.min(e.clientX, window.innerWidth - modalW - 16));
      const y = Math.max(12, Math.min(e.clientY, window.innerHeight - modalH - 16));

      setPos({ x, y });
      setSearch("");
      setFolderContextMenu(null);
      setVisible(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isDragging) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if ((e.target as HTMLElement).closest('[role="dialog"]')) return;
        setVisible(false);
        setFolderContextMenu(null);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHelpAdmin, isDragging]);

  // Handle header dragging
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, a")) return;
    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const modalW = 350;
      const modalH = 440;
      const nextX = Math.max(0, Math.min(window.innerWidth - modalW, dragStartRef.current.posX + dx));
      const nextY = Math.max(0, Math.min(window.innerHeight - modalH, dragStartRef.current.posY + dy));
      setPos({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Toggle folder expansion
  const toggleFolder = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open dialog to add root item or sub-folder/file
  const openAddModal = (parentId: string | null = null, defaultKind: "folder" | "subfolder" | "pdf" = "folder") => {
    setTargetParentId(parentId);
    setAddKind(defaultKind);
    setItemName("");
    setItemDescription("");
    setCustomFileUrl("");
    setAddDialogOpen(true);
    setFolderContextMenu(null);
  };

  // Create new folder or file item
  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const newNode: HelpAdminNode = {
      id: `node-${Date.now()}`,
      name: itemName.trim(),
      kind: addKind,
      parentId: targetParentId,
      owner: user?.name || "Help Admin",
      modified: "Just now",
      description: itemDescription.trim(),
      contentUrl: customFileUrl.trim() || SAMPLE_MEDIA[addKind] || "",
      approvalStatus: "draft",
      children: addKind === "folder" || addKind === "subfolder" ? [] : undefined,
    };

    if (!targetParentId) {
      // Root level node
      setNodes((prev) => [newNode, ...prev]);
    } else {
      // Add inside parent folder
      setNodes((prev) => {
        const updateRecursive = (list: HelpAdminNode[]): HelpAdminNode[] => {
          return list.map((node) => {
            if (node.id === targetParentId) {
              return {
                ...node,
                children: [...(node.children || []), newNode],
              };
            }
            if (node.children && node.children.length > 0) {
              return { ...node, children: updateRecursive(node.children) };
            }
            return node;
          });
        };
        return updateRecursive(prev);
      });
      // Expand parent folder automatically
      setExpandedIds((prev) => new Set(prev).add(targetParentId));
    }

    toast.success(`Created ${addKind === "folder" || addKind === "subfolder" ? "folder" : "file"} "${newNode.name}"`);
    setAddDialogOpen(false);
  };

  // Handle right click on a folder node inside the list
  const handleFolderRightClick = (e: React.MouseEvent, node: HelpAdminNode) => {
    if (node.kind !== "folder" && node.kind !== "subfolder") return;
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({
      x: e.clientX,
      y: e.clientY,
      folderNode: node,
    });
  };

  // Send approval to Superadmin
  const handleSendApproval = (node: HelpAdminNode) => {
    // Update node status to pending locally
    const updateStatus = (list: HelpAdminNode[]): HelpAdminNode[] => {
      return list.map((n) => {
        if (n.id === node.id) {
          return { ...n, approvalStatus: "pending" };
        }
        if (n.children) return { ...n, children: updateStatus(n.children) };
        return n;
      });
    };
    setNodes(updateStatus);

    // Sync to hmsStore so Superadmin receives notification & item in Approvals tab
    const mappedType: ContentType =
      node.kind === "pdf" ? "pdf" : node.kind === "video" ? "video" : node.kind === "image" ? "image" : "text";

    addArticle({
      id: `art-${node.id}`,
      title: node.name,
      description: node.description || `Help resource submitted by ${node.owner} for context ${context || "My Drawings"}`,
      contentType: mappedType,
      contentUrl: node.contentUrl || null,
      relatedContext: context || "My Drawings",
      contexts: [contextKey || "my-drawings-table"],
      approvalStatus: "pending",
      archiveStatus: "active",
      authorId: user?.id || "sub_admin",
      authorName: node.owner,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["help-admin", node.kind],
      priority: "medium",
    });

    toast.success(`Sent "${node.name}" for approval to Superadmin (Jordan Admin)!`);
  };

  // Filter nodes recursively by search query
  const filterTree = (list: HelpAdminNode[], q: string): HelpAdminNode[] => {
    if (!q) return list;
    return list
      .map((node) => {
        const matchesSelf = node.name.toLowerCase().includes(q) || node.owner.toLowerCase().includes(q);
        const filteredChildren = node.children ? filterTree(node.children, q) : [];
        if (matchesSelf || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as HelpAdminNode[];
  };

  const filteredNodes = useMemo(() => filterTree(nodes, search.trim().toLowerCase()), [nodes, search]);

  if (!visible || !isHelpAdmin) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={modalRef}
        style={{ top: `${pos.y}px`, left: `${pos.x}px` }}
        className="fixed z-50 w-[350px] max-w-[92vw] rounded-xl bg-card border border-border/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-card-foreground select-none flex flex-col font-sans"
      >
        {/* Header Bar - Draggable */}
        <div
          onMouseDown={handleHeaderMouseDown}
          className={`h-11 bg-[#0F172A] px-3.5 flex items-center justify-between shrink-0 text-white border-b border-slate-800 ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Animated 3D Character Avatar Image */}
            <div className="h-7 w-7 rounded-md bg-amber-400 shrink-0 flex items-center justify-center overflow-hidden border border-amber-300 shadow-xs">
              <img
                src="/help/admin-avatar.jpg"
                alt="Help Admin Avatar"
                className="h-full w-full object-cover rounded-md"
              />
            </div>

            <span className="font-bold text-sm tracking-tight truncate text-slate-100">
              {context && context !== "Workspace" ? context : "My Drawings"}
            </span>

            {/* Info Icon 'i' Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="h-5 w-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  title="Information"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-medium max-w-[240px]">
                Add a new help resource or organized folder to this section.
              </TooltipContent>
            </Tooltip>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="h-6 w-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls Row */}
        <div className="p-2.5 bg-white dark:bg-card border-b border-border/60 flex items-center gap-2 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full pl-8 pr-2 bg-muted/30 border border-border/70 rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Options Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-7 rounded-md hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuLabel>Help Admin Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openAddModal(null, "folder")}>
                <FolderPlus className="mr-2 h-3.5 w-3.5 text-amber-500" />
                Create Main Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddModal(null, "pdf")}>
                <Plus className="mr-2 h-3.5 w-3.5 text-blue-600" />
                Add Help File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { openPanel(); setVisible(false); }}>
                <Sparkles className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                Open Full HMS Panel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* + Button with Hover Info Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => openAddModal(null, "folder")}
                className="h-8 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs flex items-center justify-center gap-1 shadow-xs transition-all shrink-0"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-semibold">
              Click + to add help
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Tree Container / Main List Area */}
        <div className="min-h-[220px] max-h-[280px] overflow-y-auto bg-white dark:bg-card divide-y divide-border/30 custom-scrollbar shrink-0">
          {nodes.length === 0 ? (
            /* Requirement 1 & 3: Initially Empty with Info & Hover Tooltip */
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => openAddModal(null, "folder")}
                  className="py-12 px-4 text-center cursor-pointer group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                >
                  <div className="h-10 w-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Info className="h-5 w-5" />
                  </div>
                  <h5 className="text-xs font-bold text-foreground">No Help Folders or Items</h5>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] mx-auto">
                    Initially empty. Click the <span className="font-semibold text-blue-600">+</span> button to add a folder or help file.
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-bold">
                Click + to add help
              </TooltipContent>
            </Tooltip>
          ) : filteredNodes.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No matching folders or items found.
            </div>
          ) : (
            <div className="p-1 space-y-0.5">
              {filteredNodes.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  level={0}
                  expandedIds={expandedIds}
                  onToggleFolder={toggleFolder}
                  onFolderRightClick={handleFolderRightClick}
                  onPreview={(n) => setPreviewNode(n)}
                  onSendApproval={handleSendApproval}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="h-7 bg-slate-50 dark:bg-muted/30 px-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <span className="font-medium text-slate-600 dark:text-slate-400">
            {nodes.length} folder{nodes.length === 1 ? "" : "s"} / item{nodes.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => {
              openPanel();
              setVisible(false);
            }}
            className="hover:text-blue-600 hover:underline font-semibold flex items-center gap-1"
          >
            <span>HMS Panel</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        {/* Folder Right-Click Context Menu Floating Overlay */}
        {folderContextMenu && (
          <div
            style={{
              top: `${folderContextMenu.y - pos.y}px`,
              left: `${folderContextMenu.x - pos.x}px`,
            }}
            className="absolute z-50 w-44 rounded-lg bg-card border border-border shadow-xl p-1 text-xs animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-2 py-1 font-bold text-[10px] text-muted-foreground border-b border-border/50 truncate">
              📁 {folderContextMenu.folderNode.name}
            </div>
            <button
              onClick={() => openAddModal(folderContextMenu.folderNode.id, "subfolder")}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-foreground font-medium"
            >
              <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
              Add Sub-folder
            </button>
            <button
              onClick={() => openAddModal(folderContextMenu.folderNode.id, "pdf")}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-foreground font-medium"
            >
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              Add File
            </button>
            <button
              onClick={() => {
                toast.info(`Deleted "${folderContextMenu.folderNode.name}"`);
                setNodes((prev) => prev.filter((n) => n.id !== folderContextMenu.folderNode.id));
                setFolderContextMenu(null);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-red-50 text-red-600 font-medium flex items-center gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Folder
            </button>
          </div>
        )}
      </div>

      {/* Add Folder / File Modal */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                {targetParentId ? "Add Sub-folder or File" : "Create Folder or Help File"}
              </span>

              {/* Info Icon 'i' */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="h-5 w-5 rounded-full bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
                    title="Information"
                  >
                    <Info className="h-3.5 w-3.5 text-blue-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-medium max-w-[240px]">
                  Add a new help resource or organized folder to this section.
                </TooltipContent>
              </Tooltip>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNode} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs">Item Type</Label>
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={addKind === "folder" || addKind === "subfolder" ? "default" : "outline"}
                  className="h-8 text-xs gap-1"
                  onClick={() => setAddKind(targetParentId ? "subfolder" : "folder")}
                >
                  <Folder className="h-3.5 w-3.5 text-amber-400" /> Folder
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addKind === "pdf" ? "default" : "outline"}
                  className="h-8 text-xs gap-1"
                  onClick={() => setAddKind("pdf")}
                >
                  <FileText className="h-3.5 w-3.5 text-blue-500" /> PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addKind === "image" ? "default" : "outline"}
                  className="h-8 text-xs gap-1"
                  onClick={() => setAddKind("image")}
                >
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Image
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addKind === "video" ? "default" : "outline"}
                  className="h-8 text-xs gap-1"
                  onClick={() => setAddKind("video")}
                >
                  <Video className="h-3.5 w-3.5 text-rose-500" /> Video
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addKind === "text" ? "default" : "outline"}
                  className="h-8 text-xs gap-1 col-span-2"
                  onClick={() => setAddKind("text")}
                >
                  <FileText className="h-3.5 w-3.5 text-purple-500" /> Text Guide
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder={
                  addKind === "folder" || addKind === "subfolder"
                    ? "e.g. Site Recordings Manual"
                    : "e.g. Foundation Plan Guide"
                }
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="h-8 text-xs"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description (Optional)</Label>
              <Textarea
                placeholder="Brief summary for users..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="h-16 text-xs resize-none"
              />
            </div>

            {addKind !== "folder" && addKind !== "subfolder" && (
              <div className="space-y-1">
                <Label className="text-xs">File Asset URL / Path</Label>
                <Input
                  placeholder="e.g. /help/site-recordings-table-guide.pdf"
                  value={customFileUrl}
                  onChange={(e) => setCustomFileUrl(e.target.value)}
                  className="h-8 text-xs font-mono text-[11px]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                Create Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      {previewNode && (
        <Dialog open={!!previewNode} onOpenChange={(open) => !open && setPreviewNode(null)}>
          <DialogContent className="max-w-xl rounded-xl">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    {previewNode.kind === "pdf" && <FileText className="h-4 w-4 text-blue-600" />}
                    {previewNode.kind === "image" && <ImageIcon className="h-4 w-4 text-emerald-600" />}
                    {previewNode.kind === "video" && <Video className="h-4 w-4 text-rose-600" />}
                    {previewNode.kind === "text" && <FileText className="h-4 w-4 text-purple-600" />}
                    {previewNode.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Added by {previewNode.owner} • {previewNode.modified}
                  </DialogDescription>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize ${
                    previewNode.approvalStatus === "approved"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                      : previewNode.approvalStatus === "pending"
                      ? "bg-amber-50 text-amber-600 border-amber-300"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                >
                  {previewNode.approvalStatus}
                </Badge>
              </div>
            </DialogHeader>

            {/* Media Content Preview */}
            <div className="py-3">
              {previewNode.kind === "image" && (
                <div className="rounded-lg overflow-hidden border border-border bg-slate-900/5 flex items-center justify-center max-h-[300px]">
                  <img
                    src={previewNode.contentUrl || SAMPLE_MEDIA.image}
                    alt={previewNode.name}
                    className="max-h-[300px] w-auto object-contain"
                  />
                </div>
              )}

              {previewNode.kind === "video" && (
                <div className="rounded-lg overflow-hidden border border-border bg-black max-h-[300px]">
                  <video
                    src={previewNode.contentUrl || SAMPLE_MEDIA.video}
                    controls
                    autoPlay
                    className="w-full max-h-[300px]"
                  />
                </div>
              )}

              {previewNode.kind === "pdf" && (
                <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600 shrink-0" />
                    <div>
                      <h6 className="text-xs font-bold">{previewNode.name}</h6>
                      <p className="text-[11px] text-muted-foreground">PDF Document • 3.2 MB</p>
                    </div>
                  </div>
                  <iframe
                    src={previewNode.contentUrl || SAMPLE_MEDIA.pdf}
                    className="w-full h-48 rounded border border-border"
                    title={previewNode.name}
                  />
                </div>
              )}

              {previewNode.kind === "text" && (
                <div className="rounded-lg border border-border p-4 bg-white dark:bg-card text-xs space-y-2 leading-relaxed">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {previewNode.description || previewNode.name}
                  </p>
                  <p className="text-muted-foreground">{SAMPLE_MEDIA.text}</p>
                </div>
              )}
            </div>

            {/* Footer Action: Send Approval to Superadmin */}
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-xs text-muted-foreground">
                Status: <span className="font-semibold capitalize text-foreground">{previewNode.approvalStatus}</span>
              </span>

              {previewNode.approvalStatus !== "approved" && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleSendApproval(previewNode);
                    setPreviewNode(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Approval to Superadmin
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}

// Tree Item Component for rendering folders & sub-folders & files recursively
function TreeNodeItem({
  node,
  level,
  expandedIds,
  onToggleFolder,
  onFolderRightClick,
  onPreview,
  onSendApproval,
}: {
  node: HelpAdminNode;
  level: number;
  expandedIds: Set<string>;
  onToggleFolder: (id: string) => void;
  onFolderRightClick: (e: React.MouseEvent, n: HelpAdminNode) => void;
  onPreview: (n: HelpAdminNode) => void;
  onSendApproval: (n: HelpAdminNode) => void;
}) {
  const isFolder = node.kind === "folder" || node.kind === "subfolder";
  const isExpanded = expandedIds.has(node.id);

  return (
    <div>
      <div
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onContextMenu={(e) => isFolder && onFolderRightClick(e, node)}
        className="group px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-muted/50 flex items-center justify-between gap-1.5 text-xs transition-colors cursor-pointer"
      >
        <div
          onClick={() => (isFolder ? onToggleFolder(node.id) : onPreview(node))}
          className="flex items-center gap-2 min-w-0 flex-1"
        >
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!isFolder && (
            <button
              onClick={() => onPreview(node)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
              title="Preview File"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}

          {node.approvalStatus === "pending" ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px] bg-amber-50 text-amber-600 border-amber-300">
              <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
            </Badge>
          ) : node.approvalStatus === "approved" ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px] bg-emerald-50 text-emerald-600 border-emerald-300">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Approved
            </Badge>
          ) : (
            <button
              onClick={() => onSendApproval(node)}
              className="h-5 px-1.5 rounded text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 flex items-center gap-0.5 transition-colors"
              title="Send Approval to Superadmin"
            >
              <Send className="h-2.5 w-2.5" /> Approve
            </button>
          )}
        </div>
      </div>

      {/* Render Nested Children if Folder is Expanded */}
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggleFolder={onToggleFolder}
              onFolderRightClick={onFolderRightClick}
              onPreview={onPreview}
              onSendApproval={onSendApproval}
            />
          ))}
        </div>
      )}
    </div>
  );
}
