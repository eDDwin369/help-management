import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useHmsStore, type HmsArticle, getArticleHierarchy } from "@/components/hms/hmsStore";
import { SnapshotViewer } from "@/components/admin/SnapshotViewer";
import { RejectHelpModal } from "@/components/admin/RejectHelpModal";
import {
  SectionToolbar,
  FilterGroup,
  FilterChip,
  EmptyRow,
} from "@/components/dashboard/SectionToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
  Sparkles,
  ArrowLeft,
  Clock,
} from "lucide-react";

const TYPE_ICON = {
  video: Video,
  pdf: FileText,
  image: ImageIcon,
  text: FileText,
  folder: Folder,
} as const;

interface TreeItem {
  article: HmsArticle;
  hierarchy: ReturnType<typeof getArticleHierarchy>;
}

interface CardGroup {
  cardName: string;
  items: TreeItem[];
}

interface MenuGroup {
  menuName: string;
  cardGroups: CardGroup[];
  items: TreeItem[];
}

interface PageGroup {
  pageName: string;
  menuGroups: MenuGroup[];
  items: TreeItem[];
}

export function ApprovalsManager({
  canApprove = false,
  initialSelectedId = null,
  onBack,
}: {
  canApprove?: boolean;
  initialSelectedId?: string | null;
  onBack?: () => void;
}) {
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
  const [approval, setApproval] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [viewLayout, setViewLayout] = useState<"queue" | "hierarchy">("queue");

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Expanded state for tree nodes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modals state
  const [rejectingArticle, setRejectingArticle] = useState<HmsArticle | null>(null);
  const [fullscreenArticle, setFullscreenArticle] = useState<HmsArticle | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    article: HmsArticle;
  } | null>(null);

  // Close context menu on window click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  // Filter articles based on controls
  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.articles.filter((a) => {
      const hierarchy = getArticleHierarchy(a);

      if (q) {
        const textToSearch = `${a.title} ${a.description} ${a.authorName} ${a.tags.join(" ")} ${
          hierarchy.pageName
        } ${hierarchy.menuName || ""} ${hierarchy.cardName} ${hierarchy.controlName}`.toLowerCase();
        if (!textToSearch.includes(q)) return false;
      }

      if (type !== "all" && a.contentType !== type) return false;

      if (approval === "approved" && a.approvalStatus !== "approved") return false;
      if (approval === "pending" && a.approvalStatus !== "pending") return false;
      if (
        approval === "rejected" &&
        a.approvalStatus !== "unapproved" &&
        a.approvalStatus !== "rejected"
      )
        return false;

      if (pageFilter !== "all" && hierarchy.pageName !== pageFilter) return false;

      return true;
    });
  }, [state.articles, query, type, approval, pageFilter]);

  // Group filtered articles into Page -> Menu -> Card hierarchy
  const hierarchyGroups = useMemo(() => {
    const pageMap = new Map<string, Map<string, Map<string, TreeItem[]>>>();

    for (const article of filteredArticles) {
      const hierarchy = getArticleHierarchy(article);
      const pageKey = hierarchy.pageName;
      const menuKey = hierarchy.menuName || "__NO_MENU__";
      const cardKey = hierarchy.cardName;

      if (!pageMap.has(pageKey)) pageMap.set(pageKey, new Map());
      const menuMap = pageMap.get(pageKey)!;

      if (!menuMap.has(menuKey)) menuMap.set(menuKey, new Map());
      const cardMap = menuMap.get(menuKey)!;

      if (!cardMap.has(cardKey)) cardMap.set(cardKey, []);
      cardMap.get(cardKey)!.push({ article, hierarchy });
    }

    const pages: PageGroup[] = [];

    pageMap.forEach((menuMap, pageName) => {
      const menuGroups: MenuGroup[] = [];
      let pageItemsCount = 0;

      menuMap.forEach((cardMap, menuName) => {
        const cardGroups: CardGroup[] = [];
        let menuItemsCount = 0;

        cardMap.forEach((items, cardName) => {
          cardGroups.push({ cardName, items });
          menuItemsCount += items.length;
        });

        const allMenuItems = cardGroups.flatMap((cg) => cg.items);
        menuGroups.push({
          menuName: menuName === "__NO_MENU__" ? "" : menuName,
          cardGroups,
          items: allMenuItems,
        });
        pageItemsCount += menuItemsCount;
      });

      const allPageItems = menuGroups.flatMap((mg) => mg.items);
      pages.push({
        pageName,
        menuGroups,
        items: allPageItems,
      });
    });

    return pages.sort((a, b) => a.pageName.localeCompare(b.pageName));
  }, [filteredArticles]);

  // Auto-select first article if current selection is invalid
  useEffect(() => {
    if (filteredArticles.length > 0) {
      if (!selectedId || !filteredArticles.some((a) => a.id === selectedId)) {
        setSelectedId(filteredArticles[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredArticles, selectedId]);

  const selectedArticle = useMemo(
    () => state.articles.find((a) => a.id === selectedId) || null,
    [state.articles, selectedId],
  );

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId] === undefined ? false : !prev[nodeId],
    }));
  };

  const isNodeExpanded = (nodeId: string, defaultExpanded = true) => {
    return expandedNodes[nodeId] !== undefined ? expandedNodes[nodeId] : defaultExpanded;
  };

  // Action handlers
  const handleApprove = (id: string) => {
    approveArticle(id);
    toast.success("Approved — live for customers");
  };

  const handleRejectConfirm = (reason: string) => {
    if (rejectingArticle) {
      unapproveArticle(rejectingArticle.id, reason);
      toast.success("Rejected — item marked as rejected with audit feedback");
      setRejectingArticle(null);
    }
  };

  const handleCopyLink = (article: HmsArticle) => {
    const hierarchy = getArticleHierarchy(article);
    const text = `${hierarchy.pageName} -> ${hierarchy.menuName ? hierarchy.menuName + " -> " : ""}${hierarchy.cardName} -> ${hierarchy.controlName}`;
    navigator.clipboard.writeText(text);
    toast.success("Hierarchy reference copied to clipboard");
  };

  // List of distinct page names for page filter dropdown
  const pageNamesList = useMemo(() => {
    const set = new Set<string>();
    for (const a of state.articles) {
      set.add(getArticleHierarchy(a).pageName);
    }
    return Array.from(set).sort();
  }, [state.articles]);

  const filterActive =
    type !== "all" || approval !== "pending" || pageFilter !== "all" || query.trim().length > 0;

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3 overflow-hidden">
      {/* Top Card Wrapper */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-1">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 rounded-xl text-xs font-medium border-border/80 hover:bg-muted"
                onClick={onBack}
              >
                <ArrowLeft className="size-3.5" /> Back to Dashboard
              </Button>
            )}
            <div className="flex items-center gap-1.5 font-semibold text-base text-foreground">
              <span>{user?.role === "sub_admin" ? "My Approvals" : "Approvals & Review"}</span>
              <InfoHint text="Review help articles and folders. Superadmins can inspect previews, approve to make live, or reject with feedback." />
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
            onClick={() => requestPanelView({ type: "add" })}
          >
            <Plus className="size-3.5" /> Add help
          </Button>
        </div>

        {/* Search & Filter Toolbar */}
        <SectionToolbar
          searchContext="admin-content-search"
          filterContext="admin-content-filter"
          placeholder="Search approvals by title, author, folder, or page..."
          query={query}
          onQueryChange={setQuery}
          filterActive={filterActive}
          filterContent={
            <>
              <FilterGroup label="Approval status">
                {(["all", "pending", "approved", "rejected"] as const).map((a) => (
                  <FilterChip key={a} active={approval === a} onClick={() => setApproval(a)}>
                    {a === "all"
                      ? "All Statuses"
                      : a === "pending"
                      ? "Pending Review"
                      : a === "approved"
                      ? "Approved"
                      : "Rejected"}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Content type">
                {(["all", "folder", "video", "pdf", "image", "text"] as const).map((t) => (
                  <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                    {t === "all" ? "All Types" : t.toUpperCase()}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Application Page">
                <FilterChip active={pageFilter === "all"} onClick={() => setPageFilter("all")}>
                  All Pages
                </FilterChip>
                {pageNamesList.map((p) => (
                  <FilterChip key={p} active={pageFilter === p} onClick={() => setPageFilter(p)}>
                    {p}
                  </FilterChip>
                ))}
              </FilterGroup>
            </>
          }
        />
      </div>

      {/* Main 2-Panel Experience */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* LEFT PANEL: Approvals Queue / Report (~58% width on large screens) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3.5 px-4 bg-muted/20 border-b flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              {viewLayout === "queue" ? (
                <ListFilter className="size-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <Layers className="size-4 text-purple-600 dark:text-purple-400" />
              )}
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
                {viewLayout === "queue" ? "Pending Approval Requests" : "UI Hierarchy Report"}
              </span>
              <Badge variant="secondary" className="text-[11px] font-normal ml-1">
                {filteredArticles.length} item{filteredArticles.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/50">
              <button
                type="button"
                onClick={() => setViewLayout("queue")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewLayout === "queue"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListFilter className="size-3.5" />
                <span>Queue View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout("hierarchy")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewLayout === "hierarchy"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="size-3.5" />
                <span>Hierarchy View</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-auto">
            {viewLayout === "queue" ? (
              /* Flat Queue View matching User Specification: Folder/Content Name, Submitted By, Date, Content Type, Pending Status */
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] border-b sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Folder / Content Name</th>
                    <th className="px-3 py-2.5 font-semibold w-24">Type</th>
                    <th className="px-3 py-2.5 font-semibold w-28">Submitted By</th>
                    <th className="px-3 py-2.5 font-semibold w-24">Date</th>
                    <th className="px-3 py-2.5 font-semibold w-28">Status</th>
                    <th className="px-3 py-2.5 font-semibold w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredArticles.length === 0 ? (
                    <EmptyRow
                      colSpan={6}
                      message="No pending approval requests match the current search or filters."
                    />
                  ) : (
                    filteredArticles.map((article) => {
                      const isSelected = article.id === selectedId;
                      const Icon = TYPE_ICON[article.contentType] || FileText;
                      const hierarchy = getArticleHierarchy(article);
                      const displayDate = article.updatedAt
                        ? new Date(article.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Recently";

                      return (
                        <tr
                          key={article.id}
                          className={`transition-colors cursor-pointer select-none ${
                            isSelected
                              ? "bg-purple-500/10 dark:bg-purple-500/20 border-l-4 border-l-purple-600 font-medium"
                              : "hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedId(article.id)}
                          onDoubleClick={() => setFullscreenArticle(article)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedId(article.id);
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              article,
                            });
                          }}
                        >
                          {/* Column 1: Folder / Content Name */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  article.contentType === "folder"
                                    ? "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                                    : article.contentType === "video"
                                    ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                                    : article.contentType === "pdf"
                                    ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                                    : article.contentType === "image"
                                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                                    : "bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
                                }`}
                              >
                                <Icon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate max-w-[200px]">
                                  {article.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                  {hierarchy.pageName} › {hierarchy.cardName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Content Type */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <Badge variant="outline" className="gap-1 text-[10px] font-normal capitalize">
                              <Icon className="size-3" />
                              {article.contentType}
                            </Badge>
                          </td>

                          {/* Column 3: Submitted By */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="text-muted-foreground truncate block max-w-[110px]">
                              {article.authorName}
                            </span>
                          </td>

                          {/* Column 4: Date */}
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-[11px]">
                            {displayDate}
                          </td>

                          {/* Column 5: Status */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <Badge
                              className={`text-[10px] font-normal px-2 py-0.5 ${
                                article.archiveStatus === "archived"
                                  ? "bg-muted text-muted-foreground"
                                  : article.approvalStatus === "approved"
                                  ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
                                  : article.approvalStatus === "unapproved" ||
                                    article.approvalStatus === "rejected"
                                  ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15"
                                  : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15"
                              }`}
                            >
                              {article.archiveStatus === "archived"
                                ? "Archived"
                                : article.approvalStatus === "approved"
                                ? "Approved"
                                : article.approvalStatus === "unapproved" ||
                                  article.approvalStatus === "rejected"
                                ? "Rejected"
                                : "Pending Review"}
                            </Badge>
                          </td>

                          {/* Column 6: Actions */}
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {canApprove && (
                                <>
                                  {article.approvalStatus !== "approved" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1"
                                      title="Approve help entry"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprove(article.id);
                                      }}
                                    >
                                      <Check className="size-3" /> Approve
                                    </Button>
                                  )}

                                  {article.approvalStatus !== "unapproved" &&
                                    article.approvalStatus !== "rejected" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1"
                                        title="Reject help entry"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRejectingArticle(article);
                                        }}
                                      >
                                        <X className="size-3" /> Reject
                                      </Button>
                                    )}
                                </>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-7"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuItem onClick={() => setSelectedId(article.id)}>
                                    <Eye className="size-3.5 mr-2" /> View Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setFullscreenArticle(article)}>
                                    <Sparkles className="size-3.5 mr-2 text-purple-500" /> Full Screen
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyLink(article)}>
                                    <Copy className="size-3.5 mr-2" /> Copy Hierarchy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      requestPanelView({ type: "add", editId: article.id })
                                    }
                                  >
                                    <Pencil className="size-3.5 mr-2" /> Edit Entry
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* Tree Hierarchy Report */
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] border-b">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Hierarchy / Control & Title</th>
                    <th className="px-3 py-2.5 font-semibold w-20">Type</th>
                    <th className="px-3 py-2.5 font-semibold w-28">Status</th>
                    <th className="px-3 py-2.5 font-semibold w-28">Author</th>
                    <th className="px-3 py-2.5 font-semibold w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                {hierarchyGroups.length === 0 ? (
                  <EmptyRow colSpan={5} message="No help items match the current search or filters." />
                ) : (
                  hierarchyGroups.flatMap((pageGroup) => {
                    const pageNodeId = `page-${pageGroup.pageName}`;
                    const isPageExpanded = isNodeExpanded(pageNodeId, true);

                    const pageRow = (
                      <tr
                        key={pageNodeId}
                        className="bg-muted/30 hover:bg-muted/50 cursor-pointer font-medium select-none"
                        onClick={() => toggleNode(pageNodeId)}
                      >
                        <td colSpan={5} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isPageExpanded ? (
                                <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="size-5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                {isPageExpanded ? (
                                  <FolderOpen className="size-3.5" />
                                ) : (
                                  <Folder className="size-3.5" />
                                )}
                              </div>
                              <span className="font-semibold text-sm text-foreground">
                                {pageGroup.pageName}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {pageGroup.items.length} item{pageGroup.items.length === 1 ? "" : "s"}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    );

                    if (!isPageExpanded) return [pageRow];

                    const children = pageGroup.menuGroups.flatMap((menuGroup) => {
                      const hasMenu = Boolean(menuGroup.menuName);
                      const menuNodeId = `menu-${pageGroup.pageName}-${menuGroup.menuName}`;
                      const isMenuExpanded = isNodeExpanded(menuNodeId, true);

                      const menuRow = hasMenu ? (
                        <tr
                          key={menuNodeId}
                          className="bg-muted/10 hover:bg-muted/30 cursor-pointer select-none"
                          onClick={() => toggleNode(menuNodeId)}
                        >
                          <td colSpan={5} className="pl-8 pr-4 py-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isMenuExpanded ? (
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="size-3.5 text-muted-foreground" />
                                )}
                                <span className="font-semibold text-xs text-foreground/90">
                                  {menuGroup.menuName}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {menuGroup.items.length} item{menuGroup.items.length === 1 ? "" : "s"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : null;

                      if (hasMenu && !isMenuExpanded) return menuRow ? [menuRow] : [];

                      const cardRows = menuGroup.cardGroups.flatMap((cardGroup) => {
                        const cardNodeId = `card-${pageGroup.pageName}-${menuGroup.menuName}-${cardGroup.cardName}`;
                        const isCardExpanded = isNodeExpanded(cardNodeId, true);

                        const cardHeaderRow = (
                          <tr
                            key={cardNodeId}
                            className="hover:bg-muted/20 cursor-pointer select-none border-t border-border/30"
                            onClick={() => toggleNode(cardNodeId)}
                          >
                            <td
                              colSpan={5}
                              className={`${hasMenu ? "pl-12" : "pl-8"} pr-4 py-1.5`}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                  {isCardExpanded ? (
                                    <ChevronDown className="size-3 text-muted-foreground/70" />
                                  ) : (
                                    <ChevronRight className="size-3 text-muted-foreground/70" />
                                  )}
                                  <span className="text-foreground/80 font-medium">
                                    Card: {cardGroup.cardName}
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/80">
                                  {cardGroup.items.length}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );

                        if (!isCardExpanded) return [cardHeaderRow];

                        const leafRows = cardGroup.items.map(({ article, hierarchy }) => {
                          const isSelected = article.id === selectedId;
                          const Icon = TYPE_ICON[article.contentType];

                          return (
                            <tr
                              key={article.id}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-purple-500/10 dark:bg-purple-500/20 border-l-4 border-l-purple-600 font-medium"
                                  : "hover:bg-muted/30"
                              }`}
                              onClick={() => setSelectedId(article.id)}
                              onDoubleClick={() => setFullscreenArticle(article)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setSelectedId(article.id);
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  article,
                                });
                              }}
                            >
                              {/* Column 1: Hierarchy / Control Name & Title */}
                              <td className={`${hasMenu ? "pl-16" : "pl-12"} pr-3 py-2.5`}>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-xs text-foreground truncate">
                                      {hierarchy.controlName}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 h-4 gap-0.5 text-muted-foreground font-mono shrink-0"
                                      title="Click to view screen snapshot"
                                    >
                                      <Sparkles className="size-2.5 text-purple-500" />
                                      Snapshot
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                                    {article.title}
                                  </div>
                                </div>
                              </td>

                              {/* Column 2: Type */}
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <Badge variant="outline" className="gap-1 text-[10px] font-normal">
                                  <Icon className="size-3" />
                                  {article.contentType.toUpperCase()}
                                </Badge>
                              </td>

                              {/* Column 3: Status */}
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <Badge
                                  className={`text-[10px] font-normal px-2 py-0.5 ${
                                    article.archiveStatus === "archived"
                                      ? "bg-muted text-muted-foreground"
                                      : article.approvalStatus === "approved"
                                      ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
                                      : article.approvalStatus === "unapproved"
                                      ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15"
                                      : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15"
                                  }`}
                                >
                                  {article.archiveStatus === "archived"
                                    ? "Archived"
                                    : article.approvalStatus === "approved"
                                    ? "Approved"
                                    : article.approvalStatus === "unapproved"
                                    ? "Rejected"
                                    : "Pending Approval"}
                                </Badge>
                              </td>

                              {/* Column 4: Author */}
                              <td className="px-3 py-2.5 text-muted-foreground text-xs truncate max-w-[120px]">
                                {article.authorName}
                              </td>

                              {/* Column 5: Actions */}
                              <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  {canApprove && (
                                    <>
                                      {article.approvalStatus !== "approved" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1"
                                          title="Approve help entry"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApprove(article.id);
                                          }}
                                        >
                                          <Check className="size-3" /> Approve
                                        </Button>
                                      )}

                                      {article.approvalStatus !== "unapproved" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1"
                                          title="Reject help entry"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRejectingArticle(article);
                                          }}
                                        >
                                          <X className="size-3" /> Reject
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {/* Three-Dot Dropdown Menu */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="size-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44 text-xs">
                                      <DropdownMenuItem onClick={() => setSelectedId(article.id)}>
                                        <Eye className="size-3.5 mr-2" /> View Snapshot
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setFullscreenArticle(article)}>
                                        <Sparkles className="size-3.5 mr-2 text-purple-500" /> Full Screen
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCopyLink(article)}>
                                        <Copy className="size-3.5 mr-2" /> Copy Hierarchy Link
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          requestPanelView({ type: "add", editId: article.id })
                                        }
                                      >
                                        <Pencil className="size-3.5 mr-2" /> Edit Entry
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          archiveArticle(article.id);
                                          toast.success(
                                            article.archiveStatus === "active"
                                              ? "Archived"
                                              : "Unarchived",
                                          );
                                        }}
                                      >
                                        <Archive className="size-3.5 mr-2" /> Archive
                                      </DropdownMenuItem>

                                      {user?.role === "admin" && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-rose-600 dark:text-rose-400 focus:bg-rose-50"
                                            onClick={() => {
                                              deleteArticle(article.id);
                                              toast.success("Deleted from audit history");
                                            }}
                                          >
                                            <Trash2 className="size-3.5 mr-2" /> Delete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          );
                        });

                        return [cardHeaderRow, ...leafRows];
                      });

                      return menuRow ? [menuRow, ...cardRows] : cardRows;
                    });

                    return [pageRow, ...children];
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

        {/* RIGHT PANEL: Interactive Snapshot & Media Viewer (~48% width) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
          <SnapshotViewer
            article={selectedArticle}
            onApprove={handleApprove}
            onReject={(id) => {
              const a = state.articles.find((item) => item.id === id);
              if (a) setRejectingArticle(a);
            }}
            onExpandFullscreen={(a) => setFullscreenArticle(a)}
            canApprove={canApprove}
          />
        </div>
      </div>

      {/* Reject Modal */}
      <RejectHelpModal
        isOpen={Boolean(rejectingArticle)}
        articleTitle={rejectingArticle?.title}
        onClose={() => setRejectingArticle(null)}
        onConfirm={handleRejectConfirm}
      />

      {/* Double Click Full Screen Preview Dialog */}
      <Dialog
        open={Boolean(fullscreenArticle)}
        onOpenChange={(open) => !open && setFullscreenArticle(null)}
      >
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b bg-muted/30 shrink-0">
            <DialogTitle className="text-base font-semibold">Full Screen Inspection Viewer</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-2">
            <SnapshotViewer
              article={fullscreenArticle}
              onApprove={(id) => {
                handleApprove(id);
                setFullscreenArticle(null);
              }}
              onReject={(id) => {
                const a = state.articles.find((item) => item.id === id);
                setFullscreenArticle(null);
                if (a) setRejectingArticle(a);
              }}
              canApprove={canApprove}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Context Menu (Right Click) */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground border rounded-xl shadow-lg p-1 w-52 text-xs space-y-0.5 animate-in fade-in-50 zoom-in-95"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b mb-1">
            Hierarchy Actions
          </div>
          <button
            type="button"
            className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2"
            onClick={() => {
              setSelectedId(contextMenu.article.id);
              setContextMenu(null);
            }}
          >
            <Eye className="size-3.5 text-purple-600" /> View Snapshot
          </button>
          <button
            type="button"
            className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2"
            onClick={() => {
              setFullscreenArticle(contextMenu.article);
              setContextMenu(null);
            }}
          >
            <Sparkles className="size-3.5 text-purple-500" /> Full Screen Preview
          </button>
          <button
            type="button"
            className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2"
            onClick={() => {
              handleCopyLink(contextMenu.article);
              setContextMenu(null);
            }}
          >
            <Copy className="size-3.5" /> Copy Hierarchy Link
          </button>

          {canApprove && (
            <>
              <div className="border-t my-1" />
              {contextMenu.article.approvalStatus !== "approved" && (
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-emerald-50 text-emerald-600 flex items-center gap-2"
                  onClick={() => {
                    handleApprove(contextMenu.article.id);
                    setContextMenu(null);
                  }}
                >
                  <Check className="size-3.5" /> Approve Help
                </button>
              )}
              {contextMenu.article.approvalStatus !== "unapproved" && (
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                  onClick={() => {
                    setRejectingArticle(contextMenu.article);
                    setContextMenu(null);
                  }}
                >
                  <X className="size-3.5" /> Reject Help...
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
