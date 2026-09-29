import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { type HmsArticle, getArticleHierarchy } from "@/components/hms/hmsStore";
import { SCREEN_IMAGES, COMPONENT_HOTSPOTS, defaultHotspot } from "@/lib/screen-assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  Check,
  ChevronRight,
  Eye,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Play,
  RotateCcw,
  User,
  Video,
  X,
  Sparkles,
  Folder,
  ShieldAlert,
  Info,
  Download,
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
  onSelectArticle: _onSelectArticle,
}: SnapshotViewerProps) {
  const isFolder = article?.contentType === "folder";
  const [activeTab, setActiveTab] = useState<"snapshot" | "content">("content");
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!fullscreenImg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenImg(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImg]);

  if (!article || isFolder) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-dashed border-border/70 text-muted-foreground min-h-[400px]">
        <div className="size-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-3.5 text-amber-600 dark:text-amber-400 shadow-2xs">
          {isFolder ? (
            <Folder className="size-7" />
          ) : (
            <Eye className="size-7 text-muted-foreground/60" />
          )}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="font-semibold text-foreground text-sm">
            {isFolder ? `Folder: ${article.title}` : "No Content Selected"}
          </h3>
          {isFolder && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center size-5 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                    aria-label="Folder info"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="max-w-xs text-xs font-normal text-center">
                  Folders do not have a preview. Preview is only available for contents like PDF, documents, videos, and images.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {!isFolder && (
          <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
            Select any content item (PDF, DOC, video, or image) from the list to preview.
          </p>
        )}

        {isFolder && canApprove && (
          <div className="mt-5 flex items-center gap-2">
            {(article.approvalStatus === "pending" || article.approvalStatus === "approved") && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/50 gap-1.5"
                onClick={() => onReject(article.id)}
              >
                <X className="size-3.5" /> Reject Folder
              </Button>
            )}
            {(article.approvalStatus === "pending" || article.approvalStatus === "unapproved" || article.approvalStatus === "rejected") && (
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                onClick={() => onApprove(article.id)}
              >
                <Check className="size-3.5" /> Approve Folder
              </Button>
            )}
          </div>
        )}
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
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h2 className="font-semibold text-base text-foreground leading-tight">{article.title}</h2>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center size-5 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                    aria-label="Resource upload info"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-xs text-xs font-normal">
                  {article.description || `Help resource uploaded by ${article.authorName}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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

        {/* View Mode Tabs */}
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

        {/* REGULAR CONTENT PREVIEW (Non-Folder: PDF, DOC, Video, Image) */}
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

                <div
                  className="relative rounded-xl border overflow-hidden bg-slate-900 group shadow-inner cursor-zoom-in hover:border-purple-500/50 transition-colors"
                  onClick={() =>
                    setFullscreenImg({
                      url: screenImage,
                      title: `${hierarchy.pageName} - ${hierarchy.controlName}`,
                    })
                  }
                  title="Click to view snapshot full screen"
                >
                  <img
                    src={screenImage}
                    alt={`${hierarchy.pageName} snapshot`}
                    className="w-full h-auto object-cover max-h-[380px] opacity-90 transition-opacity group-hover:opacity-100"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs pointer-events-none z-20 shadow-md">
                    <Maximize2 className="size-3.5" />
                    <span className="text-[11px] font-medium">Click for full screen</span>
                  </div>

                  {/* Highlighted Bounding Box Overlay */}
                  <div
                    className="absolute border-2 border-purple-500 bg-purple-500/20 rounded shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all animate-pulse pointer-events-none"
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
                  <div
                    className="relative group rounded-xl border overflow-hidden bg-slate-950 p-2 flex items-center justify-center min-h-[260px] cursor-zoom-in hover:border-purple-500/50 transition-colors"
                    onClick={() =>
                      setFullscreenImg({
                        url: article.contentUrl || screenImage,
                        title: article.title,
                      })
                    }
                    title="Click to view image full screen"
                  >
                    <img
                      src={article.contentUrl || screenImage}
                      alt={article.title}
                      className="w-full h-auto rounded-lg object-contain max-h-[380px] transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-all backdrop-blur-xs shadow-md pointer-events-none">
                      <Maximize2 className="size-3.5" />
                      <span className="font-medium">Click for full screen</span>
                    </div>
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

      {/* Full Screen Image Lightbox */}
      {fullscreenImg &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100050] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in-0 duration-200"
            onClick={() => setFullscreenImg(null)}
          >
            {/* Top Toolbar */}
            <div
              className="w-full max-w-6xl flex items-center justify-between text-white py-2 px-4 border-b border-white/10 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ImageIcon className="size-5 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-white truncate">{fullscreenImg.title}</h3>
                  <p className="text-[11px] text-white/60 truncate">
                    {hierarchy.pageName} • {hierarchy.controlName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {fullscreenImg.url && (
                  <a
                    href={fullscreenImg.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="h-8 px-3 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-lg text-white/80 hover:text-white hover:bg-white/20 cursor-pointer"
                  onClick={() => setFullscreenImg(null)}
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Image Canvas */}
            <div
              className="flex-1 w-full flex items-center justify-center p-4 min-h-0 overflow-auto"
              onClick={() => setFullscreenImg(null)}
            >
              <img
                src={fullscreenImg.url}
                alt={fullscreenImg.title}
                className="max-w-[96vw] max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl transition-all cursor-default select-none border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Bottom Footer hint */}
            <div className="text-[11px] text-white/50 py-1 text-center shrink-0">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/80">Esc</kbd> or click outside to close full screen
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
