import { useState, useEffect, useMemo } from "react";
import { type HmsArticle, type ContentType, type ApprovalStatus, getArticleHierarchy, useHmsStore } from "@/components/hms/hmsStore";
import { getFolderContents } from "@/lib/help-nodes";
import { SCREEN_IMAGES, COMPONENT_HOTSPOTS, defaultHotspot } from "@/lib/screen-assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  ShieldAlert,
  User,
  Video,
  X,
  Sparkles,
  Folder,
  FolderOpen,
} from "lucide-react";

const TYPE_ICON = { video: Video, pdf: FileText, image: ImageIcon, text: FileText, folder: Folder } as const;

interface SnapshotViewerProps {
  article: HmsArticle | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExpandFullscreen?: (article: HmsArticle) => void;
  onClose?: () => void;
  canApprove?: boolean;
  onSelectArticle?: (id: string) => void;
}

export function SnapshotViewer({
  article,
  onApprove,
  onReject,
  onExpandFullscreen,
  onClose,
  canApprove = true,
  onSelectArticle,
}: SnapshotViewerProps) {
  const isFolder = article?.contentType === "folder";
  const [activeTab, setActiveTab] = useState<"snapshot" | "content">("content");
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const { state: hmsState } = useHmsStore();

  const folderItems = useMemo(() => {
    if (!article || article.contentType !== "folder") return [];

    // 1. Get real nodes from help-nodes storage
    const nodeChildren = getFolderContents(article.id);
    if (nodeChildren.length > 0) {
      return nodeChildren.map((nc) => {
        // Match against current articles in hmsState
        const matched = hmsState.articles.find(
          (a) =>
            a.id === nc.id ||
            a.id === `art-${nc.id}` ||
            a.title.toLowerCase() === nc.name.toLowerCase()
        );
        return {
          id: matched ? matched.id : `art-${nc.id}`,
          nodeId: nc.id,
          name: nc.name,
          type: (nc.kind === "subfolder" ? "folder" : nc.kind) as ContentType,
          size: nc.size,
          approvalStatus: (matched?.approvalStatus || nc.approvalStatus) as ApprovalStatus,
          rejectionReason: matched?.rejectionReason || nc.rejectionReason,
        };
      });
    }

    // 2. Lookup articles in hmsState belonging to this folder card
    const related = hmsState.articles.filter(
      (a) =>
        a.id !== article.id &&
        a.hierarchy?.cardName?.toLowerCase() === article.title.toLowerCase()
    );
    if (related.length > 0) {
      return related.map((r) => ({
        id: r.id,
        nodeId: r.id.replace(/^art-/, ""),
        name: r.title,
        type: r.contentType,
        size: undefined,
        approvalStatus: r.approvalStatus,
        rejectionReason: r.rejectionReason,
      }));
    }

    if (article.folderChildren && article.folderChildren.length > 0) {
      return article.folderChildren.map((c) => ({
        id: c.id,
        nodeId: c.id,
        name: c.name,
        type: c.type,
        size: c.size,
        approvalStatus: c.approvalStatus,
        rejectionReason: undefined,
      }));
    }

    return [];
  }, [article, hmsState.articles]);

  useEffect(() => {
    if (article?.contentType === "folder") {
      setActiveTab("content");
      return;
    }
    if (article?.contentUrl) {
      setActiveTab("content");
    } else {
      setActiveTab("snapshot");
    }
  }, [article?.id, article?.contentUrl, article?.contentType]);

  if (!article) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-dashed border-border/70 text-muted-foreground min-h-[400px]">
        <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
          <Eye className="size-6 text-muted-foreground/60" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">No Help Entry Selected</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          Select any Help record from the hierarchical report on the left to inspect its screen snapshot, target control, associated media, and approval status.
        </p>
      </div>
    );
  }

  const hierarchy = getArticleHierarchy(article);
  const Icon = TYPE_ICON[article.contentType];

  // Pick screen screenshot based on pageName
  let screenImage = SCREEN_IMAGES[hierarchy.pageName] || SCREEN_IMAGES["Header"];
  if (hierarchy.pageName.includes("Recordings")) screenImage = SCREEN_IMAGES["Site Recordings"];
  if (hierarchy.pageName.includes("Drawings") && !hierarchy.pageName.includes("Video")) screenImage = SCREEN_IMAGES["My Drawings"];
  if (hierarchy.pageName.includes("Video")) screenImage = SCREEN_IMAGES["Drawing - Videos"];
  if (hierarchy.pageName.includes("Patrol")) screenImage = SCREEN_IMAGES["My Site Patrol"];
  if (hierarchy.pageName.includes("Help") || hierarchy.pageName.includes("Approval")) screenImage = SCREEN_IMAGES["Global Settings"];

  // Compute hotspot overlay rectangle
  const hotspotKey = article.contexts?.[0] ?? "";
  const hotspot = COMPONENT_HOTSPOTS[hotspotKey] || defaultHotspot(0);

  return (
    <div className="h-full flex flex-col bg-card border rounded-2xl overflow-hidden shadow-sm">
      {/* Viewer Header */}
      <div className="p-4 border-b bg-muted/20 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Hierarchy Breadcrumb */}
          <div className="flex items-center gap-1 flex-wrap text-[11px] font-medium text-muted-foreground">
            <span className="text-foreground font-semibold px-1.5 py-0.5 rounded bg-muted/60">
              {hierarchy.pageName}
            </span>
            {hierarchy.menuName && (
              <>
                <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
                <span>{hierarchy.menuName}</span>
              </>
            )}
            <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
            <span>{hierarchy.cardName}</span>
            <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
            <span className="text-primary font-semibold truncate max-w-[150px]">
              {hierarchy.controlName}
            </span>
          </div>

          {/* Action Header Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {!isFolder && onExpandFullscreen && (
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                title="Full screen view"
                onClick={() => onExpandFullscreen(article)}
              >
                <Maximize2 className="size-3.5" />
              </Button>
            )}
            {onClose && (
              <Button size="icon" variant="ghost" className="size-7" title="Close viewer" onClick={onClose}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Title & Badges */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <h2 className="font-semibold text-base text-foreground leading-tight">{article.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{article.description}</p>
          </div>
          <Badge
            className={`shrink-0 text-xs px-2.5 py-0.5 ${
              article.archiveStatus === "archived"
                ? "bg-muted text-muted-foreground"
                : article.approvalStatus === "approved"
                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/30"
                : article.approvalStatus === "unapproved" || article.approvalStatus === "rejected"
                ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 border-rose-500/30"
                : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15 border-amber-500/30"
            }`}
          >
            {article.archiveStatus === "archived"
              ? "Archived"
              : article.approvalStatus === "approved"
              ? "Approved"
              : article.approvalStatus === "unapproved" || article.approvalStatus === "rejected"
              ? "Rejected"
              : "Pending Review"}
          </Badge>
        </div>

        {/* View Mode Tabs or Folder Header */}
        {!isFolder ? (
          <div className="pt-2 flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
              <TabsList className="h-7 bg-muted/60 p-0.5 rounded-lg text-xs">
                <TabsTrigger value="snapshot" className="text-[11px] h-6 px-2.5 gap-1.5 data-[state=active]:bg-background">
                  <Eye className="size-3" /> Snapshot & Control
                </TabsTrigger>
                <TabsTrigger value="content" className="text-[11px] h-6 px-2.5 gap-1.5 data-[state=active]:bg-background">
                  <Icon className="size-3" /> Media / Content
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="size-3" /> {article.authorName}
              </span>
              <Badge variant="outline" className="text-[10px] gap-1 uppercase tracking-wider">
                <Icon className="size-3" /> {article.contentType}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Folder className="size-3.5 text-amber-500" />
              <span>Folder Directory & Contents</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="size-3" /> {article.authorName}
              </span>
              <Badge variant="outline" className="text-[10px] gap-1 uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                <Folder className="size-3" /> Folder
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Main Viewer Body Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Rejection Audit Box if Rejected */}
        {(article.approvalStatus === "unapproved" || article.approvalStatus === "rejected") && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-900 p-3.5 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-center justify-between gap-2 font-semibold mb-1">
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <ShieldAlert className="size-4" /> Rejection Audit Record
              </div>
              {article.rejectedAt && (
                <span className="text-[11px] font-normal text-rose-600/80 dark:text-rose-400/80">
                  {new Date(article.rejectedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
            <p className="text-rose-800 dark:text-rose-300 pl-5 leading-relaxed">
              "{article.rejectionReason || "Does not follow quality guidelines or contains outdated information."}"
            </p>
            {article.rejectedBy && (
              <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 pl-5 mt-1.5">
                Rejected by: <span className="font-medium">{article.rejectedBy}</span>
              </div>
            )}
          </div>
        )}

        {isFolder ? (
          /* FOLDER VIEW: Strictly NO screenshot, target overlay, or media preview */
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Folder className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{article.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {folderItems.length} content item{folderItems.length === 1 ? "" : "s"} inside folder
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                  Folder
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {article.description || "Folder containing documentation and operational media."}
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                    Folder Contents ({folderItems.length})
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Approve/reject individual contents or the entire folder
                  </span>
                </div>

                {folderItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-xl bg-muted/10">
                    No files or media found inside this folder.
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 border rounded-xl overflow-hidden bg-muted/20">
                    {folderItems.map((child) => {
                      const ChildIcon = TYPE_ICON[child.type as ContentType] || FileText;
                      const isChildApproved = child.approvalStatus === "approved";
                      const isChildRejected =
                        child.approvalStatus === "unapproved" || child.approvalStatus === "rejected";

                      return (
                        <div
                          key={child.id}
                          onClick={() => {
                            if (onSelectArticle) {
                              onSelectArticle(child.id);
                            }
                          }}
                          className={`p-2.5 px-3 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors ${
                            onSelectArticle ? "cursor-pointer" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ChildIcon className="size-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground truncate">{child.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {child.size && (
                              <span className="text-[10px] text-muted-foreground">{child.size}</span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                isChildApproved
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                                  : isChildRejected
                                  ? "bg-rose-50 text-rose-600 border-rose-300"
                                  : "bg-amber-50 text-amber-600 border-amber-300"
                              }`}
                            >
                              {isChildApproved
                                ? "Approved"
                                : isChildRejected
                                ? "Rejected"
                                : "Pending Review"}
                            </Badge>

                            {canApprove && (
                              <div className="flex items-center gap-1 pl-1">
                                {!isChildApproved && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-1.5 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1 cursor-pointer"
                                    title="Approve this content"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onApprove(child.id);
                                    }}
                                  >
                                    <Check className="size-3" /> Approve
                                  </Button>
                                )}
                                {!isChildRejected && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-1.5 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1 cursor-pointer"
                                    title="Reject this content"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onReject(child.id);
                                    }}
                                  >
                                    <X className="size-3" /> Reject
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Folder Hierarchy Location Mapping (Textual metadata only - NO screenshot image) */}
            <div className="rounded-xl border bg-muted/30 p-3.5 text-xs space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Folder className="size-3.5 text-amber-500" />
                Folder Hierarchy Location
              </div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                <div><span className="font-medium text-foreground">Page:</span> {hierarchy.pageName}</div>
                <div><span className="font-medium text-foreground">Section:</span> {hierarchy.menuName || "Default Section"}</div>
                <div><span className="font-medium text-foreground">Card / Group:</span> {hierarchy.cardName}</div>
                <div><span className="font-medium text-foreground">Folder Name:</span> {article.title}</div>
              </div>
            </div>
          </div>
        ) : (
          /* REGULAR CONTENT PREVIEW (Non-Folder) */
          <>
            {/* Tab 1: Screen Snapshot + Target Highlight */}
            {activeTab === "snapshot" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                    Screen Snapshot Target
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Target: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-[10px]">{hierarchy.controlName}</code>
                  </span>
                </div>

                <div className="relative rounded-xl border overflow-hidden bg-slate-900 group shadow-inner">
                  <img
                    src={screenImage}
                    alt={`${hierarchy.pageName} snapshot`}
                    className="w-full h-auto object-cover max-h-[380px] opacity-90 transition-opacity group-hover:opacity-100"
                  />

                  {/* Highlighted Bounding Box Overlay */}
                  <div
                    className="absolute border-2 border-purple-500 bg-purple-500/20 rounded shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all animate-pulse"
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.w}%`,
                      height: `${hotspot.h}%`,
                    }}
                  >
                    <div className="absolute -top-7 left-0 bg-purple-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1 whitespace-nowrap z-10">
                      <span className="size-1.5 rounded-full bg-white animate-ping" />
                      {hierarchy.controlName}
                    </div>
                  </div>
                </div>

                {/* Target Context Details Card */}
                <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1.5">
                  <div className="font-medium text-foreground">Hierarchy Location Mapping</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                    <div><span className="font-medium text-foreground">Page:</span> {hierarchy.pageName}</div>
                    <div><span className="font-medium text-foreground">Section:</span> {hierarchy.menuName || "Default Section"}</div>
                    <div><span className="font-medium text-foreground">Card:</span> {hierarchy.cardName}</div>
                    <div><span className="font-medium text-foreground">Control:</span> {hierarchy.controlName}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Media / Document Content */}
            {activeTab === "content" && (
              <div className="space-y-3">
                {article.contentType === "video" && (
                  <div className="rounded-xl border overflow-hidden bg-slate-950 text-white">
                    {article.contentUrl ? (
                      <video
                        src={article.contentUrl}
                        controls
                        autoPlay
                        className="w-full max-h-[380px] object-contain"
                      />
                    ) : (
                      <div className="relative aspect-video flex items-center justify-center bg-black/60">
                        {!isPlayingVideo ? (
                          <div className="text-center space-y-3 p-4">
                            <button
                              type="button"
                              onClick={() => setIsPlayingVideo(true)}
                              className="size-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center mx-auto transition-transform hover:scale-105 shadow-lg"
                            >
                              <Play className="size-6 fill-current translate-x-0.5" />
                            </button>
                            <div>
                              <div className="font-medium text-sm text-white">{article.title}</div>
                              <div className="text-xs text-white/70 mt-0.5">Click to play video demonstration</div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full p-4 flex flex-col justify-between bg-slate-900">
                            <div className="flex items-center justify-between text-xs text-white/80">
                              <span>Previewing Video Recording</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-white/80 hover:text-white"
                                onClick={() => setIsPlayingVideo(false)}
                              >
                                <RotateCcw className="size-3 mr-1" /> Replay
                              </Button>
                            </div>
                            <div className="text-center py-8">
                              <Video className="size-10 text-purple-400 mx-auto mb-2 animate-bounce" />
                              <p className="text-xs text-white/70">Video media stream active</p>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 w-3/4 animate-pulse" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {article.contentType === "pdf" && (
                  <div className="rounded-xl border overflow-hidden bg-white">
                    {article.contentUrl ? (
                      <iframe
                        src={article.contentUrl}
                        title={article.title}
                        className="w-full h-[380px] rounded-lg border-0"
                      />
                    ) : (
                      <div className="p-4 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="size-5 text-rose-500" />
                            <div>
                              <div className="font-semibold text-xs text-foreground">{article.title}</div>
                              <div className="text-[11px] text-muted-foreground">{article.pages ?? 3} Pages • PDF Document</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">PDF Document</Badge>
                        </div>
                        <div className="p-3 bg-card border rounded-lg text-xs space-y-2">
                          <div className="font-medium text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">Excerpt Preview</div>
                          <p className="text-muted-foreground leading-relaxed">
                            This PDF documentation provides step-by-step instructions for managing and configuring the {hierarchy.controlName} within the {hierarchy.pageName} module.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {article.contentType === "image" && (
                  <div className="rounded-xl border overflow-hidden bg-slate-950 p-2 flex items-center justify-center min-h-[260px]">
                    <img
                      src={article.contentUrl || screenImage}
                      alt={article.title}
                      className="w-full h-auto rounded-lg object-contain max-h-[380px]"
                    />
                  </div>
                )}

                {article.contentType === "text" && (
                  <div className="rounded-xl border p-4 bg-card space-y-3 text-xs">
                    <div className="font-semibold text-sm text-foreground border-b pb-2">{article.title}</div>
                    {article.body && article.body.length > 0 ? (
                      article.body.map((sec, idx) => (
                        <div key={idx} className="space-y-1">
                          <h4 className="font-medium text-foreground">{sec.heading}</h4>
                          {sec.paragraphs?.map((p, i) => (
                            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
                          ))}
                          {sec.bullets && (
                            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                              {sec.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground leading-relaxed">{article.description}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Tags & Metadata */}
        <div className="pt-2 border-t flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-1">Tags:</span>
          {article.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] font-normal">
              #{t}
            </Badge>
          ))}
        </div>
      </div>

      {/* Viewer Footer Action Buttons */}
      <div className="p-3 border-t bg-muted/30 flex items-center justify-between gap-2 shrink-0">
        <div className="text-xs text-muted-foreground">
          {canApprove
            ? article.approvalStatus === "approved"
              ? "This item is approved and visible to users."
              : article.approvalStatus === "unapproved" || article.approvalStatus === "rejected"
              ? "This item was rejected and hidden from users."
              : "Review this pending submission and choose an action."
            : "Help Admin View — Approvals and rejections are managed by Superadmin."}
        </div>

        {canApprove && (
          <div className="flex items-center gap-2">
            {(article.approvalStatus === "pending" || article.approvalStatus === "approved") && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-950 dark:hover:bg-rose-950/50 gap-1.5 cursor-pointer"
                onClick={() => onReject(article.id)}
              >
                <X className="size-3.5" /> Reject
              </Button>
            )}

            {(article.approvalStatus === "pending" || article.approvalStatus === "unapproved" || article.approvalStatus === "rejected") && (
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                onClick={() => onApprove(article.id)}
              >
                <Check className="size-3.5" /> Approve
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
