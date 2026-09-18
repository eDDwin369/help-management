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
  FileText,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Video,
  Eye,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Info,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
  Hand,
  Camera,
  Maximize2,
  Minimize2,
  RotateCcw,
  List,
  LayoutGrid,
  ChevronsDown,
  ChevronsUp,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
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
  approvalStatus: "draft" | "pending" | "approved" | "rejected" | "unapproved";
  rejectionReason?: string;
  children?: HelpAdminNode[];
}

// Default media previews for newly created items
const SAMPLE_MEDIA: Record<string, string> = {
  pdf: "/help/site-recordings-table-guide.pdf",
  image: "/help/pin-location-map.jpg",
  video: "/help/my-drawings-tour.mp4",
  text: "This document contains step-by-step instructions for managing drawings and site plans in HMS.",
};

const LOCAL_STORAGE_NODES_KEY = "hms_help_admin_nodes_v2";

function deduplicateNodes(list: HelpAdminNode[]): HelpAdminNode[] {
  const seenIds = new Set<string>();
  const cleanList: HelpAdminNode[] = [];

  for (const node of list) {
    if (seenIds.has(node.id)) continue;
    seenIds.add(node.id);

    if (node.children && node.children.length > 0) {
      cleanList.push({
        ...node,
        children: deduplicateNodes(node.children),
      });
    } else {
      cleanList.push({
        ...node,
        children: node.children ? [] : undefined,
      });
    }
  }

  return cleanList;
}

function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return resolve("");
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
          resolve(canvas.toDataURL(mimeType, quality));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function repairNodeContent(node: HelpAdminNode): HelpAdminNode {
  let contentUrl = node.contentUrl;
  if (node.kind === "image") {
    if (
      !contentUrl ||
      (contentUrl.startsWith("data:") && (contentUrl.length <= 600 || !contentUrl.includes(";base64,")))
    ) {
      contentUrl = SAMPLE_MEDIA.image;
    }
  } else if (node.kind === "video") {
    if (!contentUrl || (contentUrl.startsWith("data:") && contentUrl.length <= 600)) {
      contentUrl = SAMPLE_MEDIA.video;
    }
  } else if (node.kind === "pdf") {
    if (!contentUrl || (contentUrl.startsWith("data:") && contentUrl.length <= 600)) {
      contentUrl = SAMPLE_MEDIA.pdf;
    }
  }
  const updated = { ...node, contentUrl };
  if (updated.children && updated.children.length > 0) {
    updated.children = updated.children.map(repairNodeContent);
  }
  return updated;
}

function loadSavedNodes(): HelpAdminNode[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_NODES_KEY);
    const parsed: HelpAdminNode[] = saved ? JSON.parse(saved) : [];
    return deduplicateNodes(parsed.map(repairNodeContent));
  } catch (e) {
    console.error("Failed to load saved help admin nodes:", e);
    return [];
  }
}

function getArticleContextAndHierarchy(
  node: HelpAdminNode,
  context: string,
  contextKey: string,
  nodesList: HelpAdminNode[]
) {
  let parentFolderName = "";
  if (node.parentId) {
    const findParent = (list: HelpAdminNode[]): string | null => {
      for (const item of list) {
        if (item.id === node.parentId) return item.name;
        if (item.children) {
          const res = findParent(item.children);
          if (res) return res;
        }
      }
      return null;
    };
    parentFolderName = findParent(nodesList) || "";
  }

  let pageName = "Site Recordings";
  if (context && context !== "Workspace") {
    pageName = context.split(" › ")[0].trim() || "Site Recordings";
  }

  const cardName = parentFolderName || "Drawings";
  const controlName = node.name;

  return {
    pageName,
    cardName,
    controlName,
    relatedContext: `${pageName} › ${cardName} › ${controlName}`,
    contextKey: contextKey && contextKey !== "workspace" ? contextKey : "site-recordings-table",
    hierarchy: {
      pageName,
      cardName,
      controlName,
    },
  };
}

export function HelpAdminRightClickModal() {
  const { user } = useAuth();
  const { state: hmsState, context, contextKey, addArticle, openPanel } = useHmsStore();

  const isHelpAdmin = user?.role === "sub_admin" || user?.role === "admin";

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");

  const [nodes, setNodes] = useState<HelpAdminNode[]>(() => loadSavedNodes());

  // Real-time synchronization of nodes with hmsStore articles (approval/rejection status & reasons)
  useEffect(() => {
    setNodes((prev) => {
      let hasChanges = false;
      const syncList = (list: HelpAdminNode[]): HelpAdminNode[] => {
        return list.map((node) => {
          const matchedArticle = hmsState.articles.find(
            (a) =>
              a.id === node.id ||
              a.id === `art-${node.id}` ||
              a.id === `folder-${node.id}` ||
              a.title.toLowerCase() === node.name.toLowerCase(),
          );

          let updatedNode = node;
          if (matchedArticle) {
            const currentStatus =
              matchedArticle.approvalStatus === "unapproved"
                ? "rejected"
                : matchedArticle.approvalStatus;
            if (
              node.approvalStatus !== currentStatus ||
              (matchedArticle.rejectionReason &&
                node.rejectionReason !== matchedArticle.rejectionReason)
            ) {
              hasChanges = true;
              updatedNode = {
                ...node,
                approvalStatus: currentStatus as any,
                rejectionReason: matchedArticle.rejectionReason || node.rejectionReason,
              };
            }
          }

          if (updatedNode.children && updatedNode.children.length > 0) {
            const syncedChildren = syncList(updatedNode.children);
            if (syncedChildren !== updatedNode.children) {
              updatedNode = { ...updatedNode, children: syncedChildren };
            }
          }

          return updatedNode;
        });
      };

      const result = syncList(prev);
      return hasChanges ? result : prev;
    });
  }, [hmsState.articles]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Recursively collect all folder IDs for Explode All functionality
  const getAllFolderIds = (list: HelpAdminNode[]): string[] => {
    let ids: string[] = [];
    for (const node of list) {
      if (node.kind === "folder" || node.kind === "subfolder") {
        ids.push(node.id);
        if (node.children && node.children.length > 0) {
          ids = ids.concat(getAllFolderIds(node.children));
        }
      }
    }
    return ids;
  };

  const allFolderIds = useMemo(() => getAllFolderIds(nodes), [nodes]);
  const isAllExploded = allFolderIds.length > 0 && allFolderIds.every((id) => expandedIds.has(id));

  const handleExplodeAll = () => {
    if (isAllExploded) {
      setExpandedIds(new Set());
      toast.info("Collapsed all folders");
    } else {
      setExpandedIds(new Set(allFolderIds));
      toast.success("Exploded / Expanded all folders and content!");
    }
  };

  // Breadcrumb navigation state (selected active folder/item path)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Compute breadcrumb trail matching the user's attached design (Home Icon › Root Name › Subfolder › File)
  const breadcrumbs = useMemo(() => {
    const rootName = context && context !== "Workspace" ? context : "My Drawings";
    const trail: { id: string | null; name: string }[] = [{ id: null, name: rootName }];
    if (!currentFolderId) return trail;

    const findPath = (
      list: HelpAdminNode[],
      targetId: string,
      currentPath: { id: string; name: string }[]
    ): { id: string; name: string }[] | null => {
      for (const node of list) {
        const newPath = [...currentPath, { id: node.id, name: node.name }];
        if (node.id === targetId) return newPath;
        if (node.children && node.children.length > 0) {
          const res = findPath(node.children, targetId, newPath);
          if (res) return res;
        }
      }
      return null;
    };

    const path = findPath(nodes, currentFolderId, []);
    if (path) {
      return [...trail, ...path];
    }
    return trail;
  }, [nodes, currentFolderId, context]);

  // Persist nodes to localStorage whenever changed
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_NODES_KEY, JSON.stringify(nodes));
    } catch (e) {
      console.error("Failed to persist help admin nodes:", e);
    }
  }, [nodes]);

  // Add Item Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<"folder" | "file">("file");
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Dialog & Floating Pill Controls State (Zoom, Pan, Fullscreen, Snapshot)
  const [previewNode, setPreviewNode] = useState<HelpAdminNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanActive, setIsPanActive] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Open Preview Modal & Reset Viewport controls
  const handleOpenPreview = (node: HelpAdminNode) => {
    setVisible(true);
    const mediaUrl =
      node.contentUrl && node.contentUrl.length > 50
        ? node.contentUrl
        : SAMPLE_MEDIA[node.kind] || SAMPLE_MEDIA.image;

    setPreviewNode({
      ...node,
      contentUrl: mediaUrl,
    });
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setIsPanActive(false);
    setIsPanning(false);
    setIsFullscreen(false);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3.0, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };
  const togglePanMode = () => setIsPanActive((prev) => !prev);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Native HTML5 Fullscreen API Toggle (Hides browser tabs, URL bar & OS taskbar)
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const targetEl = previewContainerRef.current || document.documentElement;
        if (targetEl.requestFullscreen) {
          await targetEl.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen API fallback triggered:", err);
      setIsFullscreen((prev) => !prev);
    }
  };

  // Sync Native Fullscreen API changes & Esc Key Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isFullscreen || document.fullscreenElement)) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Take Snapshot / Save Media Function
  const handleTakeScreenshot = () => {
    if (!previewNode) return;
    const mediaUrl = previewNode.contentUrl || SAMPLE_MEDIA[previewNode.kind] || SAMPLE_MEDIA.image;

    const a = document.createElement("a");
    a.href = mediaUrl;
    a.download = `${previewNode.name.toLowerCase().replace(/\s+/g, "_")}_snapshot.${
      previewNode.kind === "pdf" ? "pdf" : previewNode.kind === "video" ? "mp4" : "png"
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success(`Snapshot saved for "${previewNode.name}"!`);
  };

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

  // Resizing State & Session Storage Persistence
  const [modalSize, setModalSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window === "undefined") return { width: 350, height: 440 };
    try {
      const saved = sessionStorage.getItem("help_admin_modal_size");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.width === "number" && typeof parsed.height === "number") {
          return {
            width: Math.max(280, Math.min(800, parsed.width)),
            height: Math.max(320, Math.min(750, parsed.height)),
          };
        }
      }
    } catch (e) {
      console.error("Failed to load modal size from sessionStorage:", e);
    }
    return { width: 350, height: 440 };
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; startW: number; startH: number }>({
    mouseX: 0,
    mouseY: 0,
    startW: 350,
    startH: 440,
  });

  // Save selected modal size to sessionStorage during the session
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("help_admin_modal_size", JSON.stringify(modalSize));
    } catch (e) {
      console.error("Failed to save modal size to sessionStorage:", e);
    }
  }, [modalSize]);

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

      const modalW = modalSize.width;
      const modalH = modalSize.height;
      const x = Math.max(12, Math.min(e.clientX, window.innerWidth - modalW - 16));
      const y = Math.max(12, Math.min(e.clientY, window.innerHeight - modalH - 16));

      setPos({ x, y });
      setSearch("");
      setFolderContextMenu(null);
      setVisible(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isDragging || isResizing || previewNode || addDialogOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('[role="dialog"]') || target.closest('[role="menu"]'))) return;
      if (modalRef.current && !modalRef.current.contains(target as Node)) {
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
  }, [isHelpAdmin, isDragging, isResizing, previewNode, addDialogOpen, modalSize]);

  // Handle header position dragging
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

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = e.clientX - dragStartRef.current.mouseX;
        const dy = e.clientY - dragStartRef.current.mouseY;
        const modalW = modalSize.width;
        const modalH = modalSize.height;
        const nextX = Math.max(0, Math.min(window.innerWidth - modalW, dragStartRef.current.posX + dx));
        const nextY = Math.max(0, Math.min(window.innerHeight - modalH, dragStartRef.current.posY + dy));
        setPos({ x: nextX, y: nextY });
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, modalSize]);

  // Handle bottom-right resize dragging
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: modalSize.width,
      startH: modalSize.height,
    };
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = e.clientX - resizeStartRef.current.mouseX;
        const dy = e.clientY - resizeStartRef.current.mouseY;

        const minW = 280;
        const maxW = Math.max(280, Math.min(800, window.innerWidth - pos.x - 12));
        const minH = 320;
        const maxH = Math.max(320, Math.min(750, window.innerHeight - pos.y - 12));

        const newW = Math.max(minW, Math.min(maxW, resizeStartRef.current.startW + dx));
        const newH = Math.max(minH, Math.min(maxH, resizeStartRef.current.startH + dy));

        setModalSize({ width: newW, height: newH });
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, pos.x, pos.y]);

  // Toggle folder expansion
  const toggleFolder = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Drag & Drop State for moving nodes
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  // Drag handlers for tree items
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedNodeId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, node: HelpAdminNode) => {
    const isFolder = node.kind === "folder" || node.kind === "subfolder";
    if (!isFolder || !draggedNodeId || draggedNodeId === node.id) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropTargetFolderId(node.id);
  };

  const handleDragLeave = (e: React.DragEvent, node: HelpAdminNode) => {
    e.stopPropagation();
    if (dropTargetFolderId === node.id) {
      setDropTargetFolderId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedNodeId || e.dataTransfer.getData("text/plain");

    setDraggedNodeId(null);
    setDropTargetFolderId(null);

    if (!sourceId || sourceId === targetFolderId) return;

    setNodes((prev) => {
      const findNode = (list: HelpAdminNode[], id: string): HelpAdminNode | null => {
        for (const n of list) {
          if (n.id === id) return n;
          if (n.children) {
            const found = findNode(n.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const sourceNode = findNode(prev, sourceId);
      if (!sourceNode) return prev;

      if (targetFolderId) {
        const isDescendant = (parent: HelpAdminNode, targetId: string): boolean => {
          if (parent.id === targetId) return true;
          if (!parent.children) return false;
          return parent.children.some((c) => isDescendant(c, targetId));
        };

        if (isDescendant(sourceNode, targetFolderId)) {
          toast.error("Cannot move a folder inside itself or its subfolder");
          return prev;
        }
      }

      let movedItem: HelpAdminNode | null = null;

      const removeRecursive = (list: HelpAdminNode[]): HelpAdminNode[] => {
        const acc: HelpAdminNode[] = [];
        for (const item of list) {
          if (item.id === sourceId) {
            movedItem = { ...item, parentId: targetFolderId };
            continue;
          }
          if (item.children && item.children.length > 0) {
            acc.push({
              ...item,
              children: removeRecursive(item.children),
            });
          } else {
            acc.push(item);
          }
        }
        return acc;
      };

      const cleaned = removeRecursive(prev);
      if (!movedItem) return prev;

      const finalMovedItem = movedItem as HelpAdminNode;

      if (!targetFolderId) {
        return deduplicateNodes([finalMovedItem, ...cleaned]);
      }

      const insertRecursive = (list: HelpAdminNode[]): HelpAdminNode[] => {
        return list.map((n) => {
          if (n.id === targetFolderId) {
            const existingChildren = (n.children || []).filter((c) => c.id !== finalMovedItem.id);
            return {
              ...n,
              children: [finalMovedItem, ...existingChildren],
            };
          }
          if (n.children && n.children.length > 0) {
            return { ...n, children: insertRecursive(n.children) };
          }
          return n;
        });
      };

      return deduplicateNodes(insertRecursive(cleaned));
    });

    if (targetFolderId) {
      setExpandedIds((prev) => new Set(prev).add(targetFolderId));
    }

    toast.success("Moved item successfully");
  };

  // Open dialog to create folder or upload file
  const openAddModal = (parentId: string | null = null, mode: "folder" | "file" = "file") => {
    setTargetParentId(parentId);
    setAddMode(mode);
    setItemName("");
    setItemDescription("");
    setAddDialogOpen(true);
    setFolderContextMenu(null);
  };

  // Trigger direct file picker upload without modal
  const triggerDirectFileUpload = (parentId: string | null = null) => {
    setTargetParentId(parentId);
    setFolderContextMenu(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Direct File Select Handler (PDF, JPEG/PNG, Video, Text, etc.)
  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let kind: "pdf" | "image" | "video" | "text" = "pdf";
    if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)) {
      kind = "image";
    } else if (file.type.startsWith("video/") || /\.(mp4|webm|mkv|mov|avi)$/i.test(file.name)) {
      kind = "video";
    } else if (file.type.includes("pdf") || /\.pdf$/i.test(file.name)) {
      kind = "pdf";
    } else {
      kind = "text";
    }

    const formatFileSize = (bytes: number): string => {
      if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
      if (bytes >= 1000) return `${(bytes / 1000).toFixed(0)} KB`;
      return `${bytes} B`;
    };

    const baseName = file.name.replace(/\.[^/.]+$/, "");

    let contentUrl = "";
    if (kind === "image") {
      try {
        contentUrl = await compressImageFile(file);
      } catch {
        contentUrl = SAMPLE_MEDIA.image;
      }
      if (!contentUrl) contentUrl = SAMPLE_MEDIA.image;
    } else {
      contentUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve((evt.target?.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });
    }

    const newNode: HelpAdminNode = {
      id: `node-${Date.now()}`,
      name: baseName,
      kind,
      parentId: targetParentId,
      owner: user?.name || (user?.role === "admin" ? "Superadmin" : "Help Admin"),
      modified: "Just now",
      size: formatFileSize(file.size),
      contentUrl: contentUrl || SAMPLE_MEDIA[kind] || SAMPLE_MEDIA.image,
      approvalStatus: user?.role === "admin" ? "approved" : "pending",
    };

    const mappedType: ContentType =
      kind === "pdf" ? "pdf" : kind === "video" ? "video" : kind === "image" ? "image" : "text";

    const meta = getArticleContextAndHierarchy(newNode, context, contextKey, nodes);

    addArticle({
      id: `art-${newNode.id}`,
      title: newNode.name,
      description: `Help resource uploaded by ${newNode.owner} for ${meta.pageName}`,
      contentType: mappedType,
      contentUrl: newNode.contentUrl || null,
      relatedContext: meta.relatedContext,
      contexts: [meta.contextKey],
      hierarchy: meta.hierarchy,
      approvalStatus: user?.role === "admin" ? "approved" : "pending",
      archiveStatus: "active",
      authorId: user?.id || (user?.role === "admin" ? "admin" : "sub_admin"),
      authorName: newNode.owner,
      approvedBy: user?.role === "admin" ? user?.name || "Jordan Admin" : null,
      approvedAt: user?.role === "admin" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["help-admin", kind],
      priority: "medium",
    });

    if (!targetParentId) {
      setNodes((prev) => [newNode, ...prev]);
    } else {
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
      if (targetParentId) {
        setExpandedIds((prev) => new Set(prev).add(targetParentId));
      }
    }

    toast.success(`Uploaded file "${file.name}" — added to Approvals`);
  };

  // Create new folder node
  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const isSuperadmin = user?.role === "admin";
    const initialStatus = isSuperadmin ? "approved" : "pending";

    const newNode: HelpAdminNode = {
      id: `node-${Date.now()}`,
      name: itemName.trim(),
      kind: targetParentId ? "subfolder" : "folder",
      parentId: targetParentId,
      owner: user?.name || (isSuperadmin ? "Superadmin" : "Help Admin"),
      modified: "Just now",
      description: itemDescription.trim(),
      approvalStatus: initialStatus,
      children: [],
    };

    const meta = getArticleContextAndHierarchy(newNode, context, contextKey, nodes);

    addArticle({
      id: `folder-${newNode.id}`,
      title: newNode.name,
      description: newNode.description || `Folder created by ${newNode.owner} for ${meta.pageName}`,
      contentType: "folder",
      contentUrl: null,
      relatedContext: meta.relatedContext,
      contexts: [meta.contextKey],
      hierarchy: meta.hierarchy,
      approvalStatus: initialStatus,
      archiveStatus: "active",
      authorId: user?.id || (isSuperadmin ? "admin" : "sub_admin"),
      authorName: newNode.owner,
      approvedBy: isSuperadmin ? user?.name || "Jordan Admin" : null,
      approvedAt: isSuperadmin ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["folder", "help-admin"],
      priority: "medium",
    });

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

    toast.success(
      isSuperadmin
        ? `Created folder "${newNode.name}" (Approved)`
        : `Created folder "${newNode.name}" — Submitted to Superadmin for review`
    );
    setItemName("");
    setItemDescription("");
    setAddDialogOpen(false);
  };

  // Handle right click on any node (folder or file) inside the list
  const handleNodeRightClick = (e: React.MouseEvent, node: HelpAdminNode) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({
      x: e.clientX,
      y: e.clientY,
      folderNode: node,
    });
  };

  // Delete node recursively (file or folder)
  const handleDeleteNode = (node: HelpAdminNode) => {
    setNodes((prev) => {
      const removeRecursive = (list: HelpAdminNode[]): HelpAdminNode[] => {
        return list
          .filter((n) => n.id !== node.id)
          .map((n) => ({
            ...n,
            children: n.children ? removeRecursive(n.children) : undefined,
          }));
      };
      return removeRecursive(prev);
    });
    toast.info(`Deleted "${node.name}"`);
    setFolderContextMenu(null);
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

    const meta = getArticleContextAndHierarchy(node, context, contextKey, nodes);

    addArticle({
      id: `art-${node.id}`,
      title: node.name,
      description: node.description || `Help resource submitted by ${node.owner} for context ${meta.pageName}`,
      contentType: mappedType,
      contentUrl: node.contentUrl || null,
      relatedContext: meta.relatedContext,
      contexts: [meta.contextKey],
      hierarchy: meta.hierarchy,
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

  // Determine nodes to display in Grid View based on currentFolderId selection
  const gridDisplayNodes = useMemo(() => {
    if (!currentFolderId) {
      return filteredNodes;
    }

    const findFolder = (list: HelpAdminNode[]): HelpAdminNode | null => {
      for (const n of list) {
        if (n.id === currentFolderId) return n;
        if (n.children && n.children.length > 0) {
          const res = findFolder(n.children);
          if (res) return res;
        }
      }
      return null;
    };

    const targetFolder = findFolder(nodes);
    if (!targetFolder || !targetFolder.children) return [];

    let children = targetFolder.children;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      children = children.filter(
        (n) => n.name.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q)
      );
    }
    return children;
  }, [nodes, filteredNodes, currentFolderId, search]);

  if ((!visible && !previewNode && !addDialogOpen) || !isHelpAdmin) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={modalRef}
        style={
          isModalExpanded
            ? {
                position: "fixed",
                top: "16px",
                left: "16px",
                right: "16px",
                bottom: "16px",
                width: "calc(100vw - 32px)",
                height: "calc(100vh - 32px)",
              }
            : {
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                top: 0,
                left: 0,
                width: `${modalSize.width}px`,
                height: `${modalSize.height}px`,
                willChange: isDragging || isResizing ? "transform, width, height" : "auto",
              }
        }
        className={`fixed z-50 rounded-xl bg-card border border-border/80 shadow-2xl overflow-hidden text-card-foreground select-none flex flex-col font-sans transition-all duration-200 ${
          isDragging || isResizing ? "transition-none" : ""
        }`}
      >
        {/* Header Bar - Draggable */}
        <div
          onMouseDown={isModalExpanded ? undefined : handleHeaderMouseDown}
          className={`h-11 bg-[#0F172A] px-3.5 flex items-center justify-between shrink-0 text-white border-b border-slate-800 ${
            isModalExpanded ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-grab"
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

          <div className="flex items-center gap-1 shrink-0">
            {/* Expand to Page / Restore Window Toggle Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalExpanded((prev) => !prev);
                  }}
                  className="h-6 w-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  title={isModalExpanded ? "Restore floating window" : "Expand to page view"}
                >
                  {isModalExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-semibold">
                {isModalExpanded ? "Restore window view" : "Expand to full page view"}
              </TooltipContent>
            </Tooltip>

            {/* Close Button */}
            <button
              onClick={() => setVisible(false)}
              className="h-6 w-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="p-2.5 bg-white dark:bg-card border-b border-border/60 flex items-center justify-between gap-2 shrink-0">
          {/* Search Input */}
          <div className={`relative min-w-0 transition-all ${isModalExpanded ? "w-72 max-w-xs" : "flex-1"}`}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full pl-8 pr-2 bg-muted/30 border border-border/70 rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isModalExpanded && (
              <>
                {/* 1. List View Icon */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-semibold">
                    List View
                  </TooltipContent>
                </Tooltip>

                {/* 2. Grid View Icon */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                        viewMode === "grid"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-semibold">
                    Grid View
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* 3. Explode / Expand All Folders Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleExplodeAll}
                  className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                    isAllExploded
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isAllExploded ? <ChevronsUp className="h-4 w-4" /> : <ChevronsDown className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-semibold">
                {isAllExploded ? "Collapse All Folders" : "Explode All Folders & Content"}
              </TooltipContent>
            </Tooltip>

            {/* + Button with Hover Info Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openAddModal(null)}
                  className="h-8 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs flex items-center justify-center gap-1 shadow-xs transition-all shrink-0"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white font-semibold">
                Click + to create folder
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Breadcrumbs Navigation Bar (Matching Reference Image) */}
        <div className="px-3.5 py-1.5 bg-slate-100/80 dark:bg-muted/30 border-b border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto custom-scrollbar shrink-0 select-none">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={item.id ?? "root"} className="flex items-center gap-1.5 shrink-0">
                {index > 0 && <span className="text-slate-400 font-medium">›</span>}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFolderId(item.id);
                    if (item.id) {
                      setExpandedIds((prev) => new Set(prev).add(item.id!));
                    }
                  }}
                  className={`flex items-center gap-1.5 transition-colors ${
                    isLast
                      ? "font-bold text-foreground cursor-default"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:underline cursor-pointer"
                  }`}
                >
                  {index === 0 && <Home className="h-3.5 w-3.5 text-slate-800 dark:text-slate-200 fill-slate-800/10 shrink-0" />}
                  <span>{item.name}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Tree Container / Main List Area */}
        <div className="flex-1 min-h-[160px] overflow-y-auto bg-white dark:bg-card divide-y divide-border/30 custom-scrollbar">
          {nodes.length === 0 ? (
            /* Requirement 1 & 3: Initially Empty with Info & Hover Tooltip */
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => openAddModal(null)}
                  className="py-12 px-4 text-center cursor-pointer group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                >
                  <div className="h-10 w-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Info className="h-5 w-5" />
                  </div>
                  <h5 className="text-xs font-bold text-foreground">No Help Folders</h5>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] mx-auto">
                    Initially empty. Click the <span className="font-semibold text-blue-600">+</span> button to create a folder.
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-bold">
                Click + to create folder
              </TooltipContent>
            </Tooltip>
          ) : filteredNodes.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No matching folders or items found.
            </div>
          ) : isModalExpanded && viewMode === "grid" ? (
            gridDisplayNodes.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Folder className="h-5 w-5 fill-amber-500/20" />
                </div>
                <span className="font-bold text-foreground">This folder is empty</span>
                <p className="text-[11px] text-muted-foreground max-w-[220px]">
                  Click the <span className="font-semibold text-blue-600">+</span> button to add a file or subfolder inside this folder.
                </p>
              </div>
            ) : (
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {gridDisplayNodes.map((node) => (
                  <GridNodeItem
                    key={node.id}
                    node={node}
                    onPreview={handleOpenPreview}
                    onSendApproval={handleSendApproval}
                    onDeleteNode={handleDeleteNode}
                    onFolderRightClick={handleNodeRightClick}
                    onSelectFolder={(id) => setCurrentFolderId(id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div
              className="p-1 space-y-0.5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, null)}
            >
              {filteredNodes.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  level={0}
                  expandedIds={expandedIds}
                  draggedNodeId={draggedNodeId}
                  dropTargetFolderId={dropTargetFolderId}
                  onToggleFolder={toggleFolder}
                  onFolderRightClick={handleNodeRightClick}
                  onPreview={handleOpenPreview}
                  onSendApproval={handleSendApproval}
                  onDeleteNode={handleDeleteNode}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onSelectFolder={(id) => setCurrentFolderId(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Bar with Drag-to-Resize Handle */}
        <div className="h-7 bg-slate-50 dark:bg-muted/30 px-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground shrink-0 relative">
          <span className="font-medium text-slate-600 dark:text-slate-400">
            {nodes.length} folder{nodes.length === 1 ? "" : "s"} / item{nodes.length === 1 ? "" : "s"}
          </span>

          <div className="flex items-center gap-3 pr-2">
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

          {/* Visible Bottom-Right Resize Handle */}
          {!isModalExpanded && (
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute right-0.5 bottom-0.5 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-20 group text-slate-400 hover:text-blue-600 active:text-blue-700 transition-colors"
              title="Drag to resize modal"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-60 group-hover:opacity-100 group-active:opacity-100 transition-opacity"
              >
                <path
                  d="M8.5 1.5L1.5 8.5M8.5 5L5 8.5M8.5 8L8 8.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Right-Click Context Menu Floating Overlay */}
        {folderContextMenu && (
          <div
            style={{
              top: `${folderContextMenu.y - pos.y}px`,
              left: `${folderContextMenu.x - pos.x}px`,
            }}
            className="absolute z-50 w-44 rounded-lg bg-card border border-border shadow-xl p-1 text-xs animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-2 py-1 font-bold text-[10px] text-muted-foreground border-b border-border/50 truncate">
              {folderContextMenu.folderNode.kind === "folder" || folderContextMenu.folderNode.kind === "subfolder"
                ? "📁"
                : "📄"}{" "}
              {folderContextMenu.folderNode.name}
            </div>

            {folderContextMenu.folderNode.kind === "folder" || folderContextMenu.folderNode.kind === "subfolder" ? (
              <>
                <button
                  onClick={() => openAddModal(folderContextMenu.folderNode.id, "folder")}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-foreground font-medium"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                  Add Sub-folder
                </button>
                <button
                  onClick={() => triggerDirectFileUpload(folderContextMenu.folderNode.id)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-foreground font-medium"
                >
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  Upload File
                </button>
              </>
            ) : (
              <>
                {folderContextMenu.folderNode.approvalStatus !== "approved" && (
                  <button
                    onClick={() => {
                      handleSendApproval(folderContextMenu.folderNode);
                      setFolderContextMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-indigo-600 font-medium"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Approval
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => handleDeleteNode(folderContextMenu.folderNode)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 font-medium flex items-center gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {folderContextMenu.folderNode.kind === "folder" || folderContextMenu.folderNode.kind === "subfolder" ? "Folder" : "Content"}
            </button>
          </div>
        )}
      </div>

      {/* Hidden native file input for direct OS file picker upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDirectFileUpload}
        className="hidden"
        accept="*/*"
      />

      {/* Add Folder / Content Modal */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 pr-8">
              <Plus className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Add Help Resource</span>
            </DialogTitle>
          </DialogHeader>

          {/* Mode Tabs */}
          <div className="flex bg-muted p-1 rounded-lg gap-1 text-xs font-semibold mt-1">
            <button
              type="button"
              onClick={() => setAddMode("file")}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                addMode === "file" ? "bg-white dark:bg-card text-blue-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Content
            </button>
            <button
              type="button"
              onClick={() => setAddMode("folder")}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                addMode === "folder" ? "bg-white dark:bg-card text-blue-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
              New Folder
            </button>
          </div>

          {addMode === "file" ? (
            <div className="space-y-3 pt-2">
              <div
                onClick={() => {
                  setAddDialogOpen(false);
                  triggerDirectFileUpload(targetParentId);
                }}
                className="border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-600 rounded-xl p-5 text-center cursor-pointer transition-all bg-blue-50/50 dark:hover:bg-blue-950/30 group"
              >
                <Upload className="h-7 w-7 mx-auto text-blue-600 group-hover:scale-110 transition-transform mb-1.5" />
                <p className="text-xs font-bold text-foreground">Click to upload file</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Images, PDFs, Videos & Docs</p>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateNode} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label className="text-xs">Folder Name</Label>
                <Input
                  placeholder="e.g. Site Recordings Manual"
                  value={itemName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemName(e.target.value)}
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
                  Create Folder
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* File Content Preview Dialog */}
      {previewNode && (
        <Dialog
          open={!!previewNode}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewNode(null);
              setIsFullscreen(false);
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
            }
          }}
        >
          <DialogContent
            ref={previewContainerRef}
            style={
              isFullscreen
                ? {
                    position: "fixed",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: "100vw",
                    height: "100vh",
                    maxWidth: "100vw",
                    maxHeight: "100vh",
                    transform: "none",
                    borderRadius: 0,
                    margin: 0,
                    padding: "16px",
                    zIndex: 999999,
                  }
                : undefined
            }
            className={
              isFullscreen
                ? "!fixed !inset-0 !left-0 !top-0 !right-0 !bottom-0 !w-screen !h-screen !max-w-none !max-h-none !translate-x-0 !translate-y-0 !m-0 !rounded-none !p-4 !bg-slate-950 text-white flex flex-col justify-between !border-0 z-[999999]"
                : "rounded-2xl transition-all z-[10000] p-5 bg-card text-card-foreground border border-border/80 shadow-2xl w-[90vw] max-w-xl"
            }
          >
            {/* Sleek Dark Floating Navigation Pill Bar */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 z-[100000] flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#18181B] dark:bg-slate-950/95 backdrop-blur-xl border border-white/20 shadow-2xl text-white text-xs select-none animate-in fade-in slide-in-from-bottom-3 duration-200 ${
                isFullscreen ? "top-4" : "-top-14"
              }`}
            >
              {/* 1. Zoom In */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3.0}
                    className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all text-white"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                  Zoom In
                </TooltipContent>
              </Tooltip>

              {/* 2. Zoom Out */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all text-white"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                  Zoom Out
                </TooltipContent>
              </Tooltip>

              {/* Zoom Percentage / Reset */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-slate-100 min-w-[42px] text-center transition-all flex items-center gap-1"
                  >
                    <span>{Math.round(zoomLevel * 100)}%</span>
                    {zoomLevel !== 1.0 && <RotateCcw className="h-3 w-3 text-slate-300" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                  Reset Zoom & Pan
                </TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-white/20 mx-0.5" />

              {/* 3. Pan Mode (Circular Blue Highlighted Button like Reference Image 1) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={togglePanMode}
                    className={`p-2 rounded-full transition-all flex items-center justify-center ${
                      isPanActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                        : "hover:bg-white/20 text-slate-200"
                    }`}
                  >
                    <Hand className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                  {isPanActive ? "Pan Active (Click & Drag Image)" : "Enable Pan Mode"}
                </TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-white/20 mx-0.5" />

              {/* 4. Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>

              {/* 5. Snapshot */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleTakeScreenshot}
                    className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-blue-400 hover:text-blue-300"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                  Snapshot / Download Asset
                </TooltipContent>
              </Tooltip>
            </div>

            <DialogHeader className="border-b pb-3 shrink-0">
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  {previewNode.kind === "pdf" && <FileText className="h-4 w-4 text-blue-600" />}
                  {previewNode.kind === "image" && <ImageIcon className="h-4 w-4 text-emerald-600" />}
                  {previewNode.kind === "video" && <Video className="h-4 w-4 text-rose-600" />}
                  {previewNode.kind === "text" && <FileText className="h-4 w-4 text-purple-600" />}
                  <span>{previewNode.name}</span>
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize font-medium ${
                    previewNode.approvalStatus === "approved"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                      : previewNode.approvalStatus === "pending"
                      ? "bg-amber-50 text-amber-600 border-amber-300"
                      : previewNode.approvalStatus === "rejected" ||
                        previewNode.approvalStatus === "unapproved"
                      ? "bg-rose-50 text-rose-600 border-rose-300"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                >
                  {previewNode.approvalStatus === "unapproved" ? "rejected" : previewNode.approvalStatus}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Added by {previewNode.owner} • {previewNode.modified}
              </DialogDescription>

              {(previewNode.approvalStatus === "rejected" ||
                previewNode.approvalStatus === "unapproved") && (
                <div className="mt-2.5 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2 text-left">
                  <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-rose-900 dark:text-rose-100">
                      Superadmin Rejection Feedback:
                    </div>
                    <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                      {previewNode.rejectionReason ||
                        "Item was rejected by Superadmin. Please revise the content or media and resubmit for approval."}
                    </div>
                  </div>
                </div>
              )}
            </DialogHeader>

            {/* Interactive Viewport Area with Zoom & Pan handlers */}
            <div className="py-2 flex-1 min-h-0 overflow-hidden flex flex-col justify-center items-center">
              <div
                className={`relative rounded-xl overflow-hidden border border-border flex items-center justify-center transition-all w-full ${
                  isFullscreen ? "h-full flex-1 bg-black/90" : "h-[340px] bg-slate-900/5"
                } ${isPanActive ? "cursor-grab active:cursor-grabbing select-none" : ""}`}
                onMouseDown={(e) => {
                  if (!isPanActive) return;
                  setIsPanning(true);
                  setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                }}
                onMouseMove={(e) => {
                  if (!isPanning || !isPanActive) return;
                  setPanOffset({
                    x: e.clientX - panStart.x,
                    y: e.clientY - panStart.y,
                  });
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
              >
                <div
                  style={{
                    transform: `scale(${zoomLevel}) translate3d(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px, 0)`,
                    transition: isPanning ? "none" : "transform 0.15s ease-out",
                  }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {previewNode.kind === "image" && (
                    <img
                      src={previewNode.contentUrl || SAMPLE_MEDIA.image}
                      alt={previewNode.name}
                      className="max-h-full max-w-full w-full h-full object-contain pointer-events-none"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== SAMPLE_MEDIA.image) {
                          target.src = SAMPLE_MEDIA.image;
                        }
                      }}
                    />
                  )}

                  {previewNode.kind === "video" && (
                    <video
                      src={previewNode.contentUrl || SAMPLE_MEDIA.video}
                      controls
                      autoPlay
                      className="max-h-full max-w-full w-full h-full object-contain"
                    />
                  )}

                  {previewNode.kind === "pdf" && (
                    <iframe
                      src={previewNode.contentUrl || SAMPLE_MEDIA.pdf}
                      className="w-full h-full rounded border border-border bg-white"
                      title={previewNode.name}
                    />
                  )}

                  {previewNode.kind === "text" && (
                    <div className="p-4 bg-white dark:bg-card text-xs space-y-2 leading-relaxed w-full h-full overflow-y-auto">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {previewNode.description || previewNode.name}
                      </p>
                      <p className="text-muted-foreground">{SAMPLE_MEDIA.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs shrink-0">
              <span className="text-muted-foreground">
                Type: <span className="font-semibold text-foreground uppercase">{previewNode.kind}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setPreviewNode(null)}
              >
                Close Preview
              </Button>
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
  draggedNodeId,
  dropTargetFolderId,
  onToggleFolder,
  onFolderRightClick,
  onPreview,
  onSendApproval,
  onDeleteNode,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectFolder,
}: {
  node: HelpAdminNode;
  level: number;
  expandedIds: Set<string>;
  draggedNodeId: string | null;
  dropTargetFolderId: string | null;
  onToggleFolder: (id: string) => void;
  onFolderRightClick: (e: React.MouseEvent, n: HelpAdminNode) => void;
  onPreview: (n: HelpAdminNode) => void;
  onSendApproval: (n: HelpAdminNode) => void;
  onDeleteNode: (n: HelpAdminNode) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, n: HelpAdminNode) => void;
  onDragLeave: (e: React.DragEvent, n: HelpAdminNode) => void;
  onDrop: (e: React.DragEvent, targetFolderId: string | null) => void;
  onSelectFolder?: (id: string) => void;
}) {
  const isFolder = node.kind === "folder" || node.kind === "subfolder";
  const isExpanded = expandedIds.has(node.id);
  const isBeingDragged = draggedNodeId === node.id;
  const isDropTarget = dropTargetFolderId === node.id;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.id)}
      onDragOver={(e) => isFolder && onDragOver(e, node)}
      onDragLeave={(e) => isFolder && onDragLeave(e, node)}
      onDrop={(e) => isFolder && onDrop(e, node.id)}
      className={`transition-all rounded-md ${
        isBeingDragged ? "opacity-35 scale-95" : ""
      }`}
    >
      <div
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onContextMenu={(e) => onFolderRightClick(e, node)}
        className={`group px-2 py-1.5 rounded-md flex items-center justify-between gap-1.5 text-xs transition-colors cursor-grab active:cursor-grabbing ${
          isDropTarget
            ? "bg-blue-100 dark:bg-blue-950/70 border-2 border-dashed border-blue-500 font-bold"
            : "hover:bg-slate-100 dark:hover:bg-muted/50"
        }`}
      >
        <div
          onClick={() => {
            onSelectFolder?.(node.id);
            if (isFolder) onToggleFolder(node.id);
            else onPreview(node);
          }}
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
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

          {node.description && node.description.trim().length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-500 flex items-center justify-center transition-colors shrink-0 ml-0.5"
                  title="Folder Description"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-medium max-w-[220px]">
                {node.description}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!isFolder && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(node);
                  }}
                  className="h-5 w-5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/60 text-slate-400 hover:text-blue-600 opacity-60 group-hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-semibold">
                Preview Content
              </TooltipContent>
            </Tooltip>
          )}

          {node.approvalStatus === "pending" ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px] bg-amber-50 text-amber-600 border-amber-300">
              <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
            </Badge>
          ) : node.approvalStatus === "approved" ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px] bg-emerald-50 text-emerald-600 border-emerald-300">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Approved
            </Badge>
          ) : node.approvalStatus === "rejected" || node.approvalStatus === "unapproved" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="h-4 px-1 text-[9px] bg-rose-50 text-rose-600 border-rose-300 cursor-help">
                  <XCircle className="h-2.5 w-2.5 mr-0.5" /> Rejected
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-medium max-w-[240px]">
                {node.rejectionReason ? `Reason: ${node.rejectionReason}` : "Rejected by Superadmin"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendApproval(node);
                  }}
                  className="h-5 w-5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-600 border border-indigo-200/80 flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-slate-900 text-white font-semibold">
                Send for Approval
              </TooltipContent>
            </Tooltip>
          )}

          {/* Delete Action Icon Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node);
                }}
                className="h-5 w-5 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 opacity-60 group-hover:opacity-100 transition-all flex items-center justify-center shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs bg-red-900 text-white font-semibold">
              Delete {isFolder ? "Folder" : "File"}
            </TooltipContent>
          </Tooltip>
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
              draggedNodeId={draggedNodeId}
              dropTargetFolderId={dropTargetFolderId}
              onToggleFolder={onToggleFolder}
              onFolderRightClick={onFolderRightClick}
              onPreview={onPreview}
              onSendApproval={onSendApproval}
              onDeleteNode={onDeleteNode}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Grid Node Item Component for Grid View rendering (Matching reference image)
function GridNodeItem({
  node,
  onPreview,
  onSendApproval,
  onDeleteNode,
  onFolderRightClick,
  onSelectFolder,
}: {
  node: HelpAdminNode;
  onPreview: (node: HelpAdminNode) => void;
  onSendApproval: (node: HelpAdminNode) => void;
  onDeleteNode: (node: HelpAdminNode) => void;
  onFolderRightClick: (e: React.MouseEvent, node: HelpAdminNode) => void;
  onSelectFolder?: (id: string) => void;
}) {
  const isFolder = node.kind === "folder" || node.kind === "subfolder";

  return (
    <div
      onClick={() => {
        if (isFolder) {
          onSelectFolder?.(node.id);
        } else {
          onPreview(node);
        }
      }}
      onContextMenu={(e) => onFolderRightClick(e, node)}
      className="group relative rounded-[16px] border border-border/80 bg-white dark:bg-card hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden select-none cursor-pointer w-full h-[225px]"
    >
      {/* Top Preview Box */}
      <div className="h-[140px] w-full bg-[#F1F5F9] dark:bg-muted/40 relative flex items-center justify-center p-2 rounded-t-[15px] border-b border-border/40 overflow-hidden group-hover:bg-[#E2E8F0] transition-colors">
        {/* Top-Left Level Badge */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-[#FFEDD5] text-[#EA580C] text-[9px] font-bold tracking-tight border border-orange-200/80 shadow-2xs z-10 flex items-center gap-0.5">
          <span className="text-[8px]">↳</span> {isFolder ? "L1" : "L2"}
        </span>

        {/* Top-Right Arrow Action Icon */}
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-white/90 text-slate-500 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
          <ChevronRight className="h-3 w-3" />
        </div>

        {/* Center Media / Folder Icon Preview */}
        {isFolder ? (
          <div className="h-16 w-20 flex items-center justify-center transform group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
              <path
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                fill="#F59E0B"
                stroke="#D97706"
                strokeWidth="1.2"
              />
            </svg>
          </div>
        ) : node.kind === "image" && node.contentUrl ? (
          <img
            src={node.contentUrl}
            alt={node.name}
            className="h-full w-full object-cover rounded-md group-hover:scale-105 transition-transform"
          />
        ) : node.kind === "video" ? (
          <div className="h-16 w-16 flex items-center justify-center transform group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-rose-500">
              <rect x="3" y="4" width="18" height="16" rx="3" fill="#EF4444" />
              <path d="M7 4V8M12 4V8M17 4V8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        ) : node.kind === "pdf" ? (
          <div className="h-14 w-14 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center transform group-hover:scale-105 transition-transform">
            <FileText className="h-8 w-8 stroke-[1.8]" />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center transform group-hover:scale-105 transition-transform">
            <FileText className="h-8 w-8 stroke-[1.8]" />
          </div>
        )}
      </div>

      {/* Bottom Details Section */}
      <div className="p-2 flex-1 flex flex-col justify-between bg-white dark:bg-card">
        <div className="text-center min-w-0">
          <h6 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate px-1" title={node.name}>
            {node.name}
          </h6>
          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
            {isFolder ? `${node.children?.length || 0} items` : node.size || "816.61 KB"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-slate-100 dark:border-border/30 px-1">
          <div className="flex items-center gap-1 min-w-0">
            <div className="h-3.5 w-3.5 rounded-full bg-blue-700 text-white font-bold text-[8px] flex items-center justify-center shrink-0">
              {node.owner.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
              {node.owner}
            </span>
          </div>

          <Badge
            variant="outline"
            className={`text-[8px] h-3.5 px-1 font-medium capitalize shrink-0 ${
              node.approvalStatus === "approved"
                ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                : node.approvalStatus === "pending"
                ? "bg-amber-50 text-amber-600 border-amber-300"
                : node.approvalStatus === "rejected" || node.approvalStatus === "unapproved"
                ? "bg-rose-50 text-rose-600 border-rose-300"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            {node.approvalStatus === "unapproved" ? "rejected" : node.approvalStatus}
          </Badge>
        </div>
      </div>
    </div>
  );
}
