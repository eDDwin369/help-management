import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  Maximize2,
  Minimize2,
  Camera,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { type HelpAdminNode, SAMPLE_MEDIA } from "@/lib/help-nodes";

interface HelpNodePreviewDialogProps {
  node: HelpAdminNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpNodePreviewDialog({ node, open, onOpenChange }: HelpNodePreviewDialogProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanActive, setIsPanActive] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Reset viewport controls whenever a new node is opened
  useEffect(() => {
    if (node) {
      setZoomLevel(1.0);
      setPanOffset({ x: 0, y: 0 });
      setIsPanActive(false);
      setIsPanning(false);
      setIsFullscreen(false);
    }
  }, [node]);

  // Fullscreen event listeners
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

  if (!node) return null;

  const mediaUrl =
    node.contentUrl && node.contentUrl.length > 30 && !node.contentUrl.includes("\n")
      ? node.contentUrl
      : SAMPLE_MEDIA[node.kind] || SAMPLE_MEDIA.image;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3.0, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };
  const togglePanMode = () => setIsPanActive((prev) => !prev);

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
    } catch (e) {
      console.error("Fullscreen toggle failed:", e);
    }
  };

  const handleTakeScreenshot = () => {
    const a = document.createElement("a");
    a.href = mediaUrl;
    a.download = `${node.name.toLowerCase().replace(/\s+/g, "_")}_asset.${
      node.kind === "pdf" ? "pdf" : node.kind === "video" ? "mp4" : "png"
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Asset downloaded for "${node.name}"!`);
  };

  return (
    <TooltipProvider>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIsFullscreen(false);
            if (document.fullscreenElement && document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
          }
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent
          ref={previewContainerRef}
          data-help-preview-dialog="true"
          overlayClassName="z-[100001] hms-preview-overlay"
          overlayStyle={{ zIndex: 100001 }}
          onPointerDown={(e) => e.stopPropagation()}
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
                  zIndex: 1000000,
                }
              : {
                  zIndex: 100002,
                }
          }
          className={
            isFullscreen
              ? "!fixed !inset-0 !left-0 !top-0 !right-0 !bottom-0 !w-screen !h-screen !max-w-none !max-h-none !translate-x-0 !translate-y-0 !m-0 !rounded-none !p-4 !bg-slate-950 text-white flex flex-col justify-between !border-0 z-[1000000] hms-preview-dialog"
              : "rounded-2xl transition-all z-[100002] p-5 bg-card text-card-foreground border border-border/80 shadow-2xl w-[90vw] max-w-xl hms-preview-dialog"
          }
        >
          {/* Sleek Floating Control Bar */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 z-[100003] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181B] dark:bg-slate-950/95 backdrop-blur-xl border border-white/20 shadow-2xl text-white text-xs select-none animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              isFullscreen ? "top-4" : "-top-12"
            }`}
            style={{ zIndex: 100003 }}
          >
            {/* Zoom In */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3.0}
                  className="p-1 rounded-full hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                Zoom In
              </TooltipContent>
            </Tooltip>

            {/* Zoom Out */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="p-1 rounded-full hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                Zoom Out
              </TooltipContent>
            </Tooltip>

            {/* Zoom % / Reset */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-slate-100 min-w-[38px] text-center transition-all flex items-center gap-1"
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

            {/* Pan Mode */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={togglePanMode}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                    isPanActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                      : "hover:bg-white/20 text-slate-200"
                  }`}
                >
                  <Hand className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                {isPanActive ? "Pan Active (Drag to Pan)" : "Enable Pan Mode"}
              </TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-white/20 mx-0.5" />

            {/* Fullscreen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
                >
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </TooltipContent>
            </Tooltip>

            {/* Snapshot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleTakeScreenshot}
                  className="p-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-blue-400 hover:text-blue-300"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-950 text-white border border-white/10 font-semibold">
                Download / Save Asset
              </TooltipContent>
            </Tooltip>
          </div>

          <DialogHeader className="border-b pb-3 shrink-0">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                {node.kind === "pdf" && <FileText className="h-4 w-4 text-blue-600" />}
                {node.kind === "image" && <ImageIcon className="h-4 w-4 text-emerald-600" />}
                {node.kind === "video" && <Video className="h-4 w-4 text-rose-600" />}
                {node.kind === "text" && <FileText className="h-4 w-4 text-purple-600" />}
                <span className="truncate max-w-[340px]">{node.name}</span>
              </DialogTitle>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize font-medium ${
                  node.approvalStatus === "approved"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                {node.approvalStatus}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Added by {node.owner} • {node.modified}
              {node.size && ` • ${node.size}`}
            </DialogDescription>
          </DialogHeader>

          {/* Interactive Viewport Area */}
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
                {node.kind === "image" && (
                  <img
                    src={mediaUrl}
                    alt={node.name}
                    className="max-h-full max-w-full w-full h-full object-contain pointer-events-none select-none"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== SAMPLE_MEDIA.image) {
                        target.src = SAMPLE_MEDIA.image;
                      }
                    }}
                  />
                )}

                {node.kind === "video" && (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    className="max-h-full max-w-full w-full h-full object-contain"
                  />
                )}

                {node.kind === "pdf" && (
                  <iframe
                    src={mediaUrl}
                    className="w-full h-full rounded border border-border bg-white"
                    title={node.name}
                  />
                )}

                {node.kind === "text" && (
                  <div className="p-4 bg-white dark:bg-card text-xs space-y-2 leading-relaxed w-full h-full overflow-y-auto">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {node.description || node.name}
                    </p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {node.contentUrl || SAMPLE_MEDIA.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t text-xs shrink-0">
            <span className="text-muted-foreground">
              Type: <span className="font-semibold text-foreground uppercase">{node.kind}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs flex items-center gap-1"
                onClick={handleTakeScreenshot}
              >
                <Download className="size-3" /> Download
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
