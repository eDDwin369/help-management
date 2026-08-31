import { useState, useEffect } from "react";
import { useHelpInspector } from "@/lib/inspector-context";
import { useHmsStore } from "@/components/hms/hmsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, Video, FileText, Image as ImageIcon, Sparkles, ExternalLink } from "lucide-react";

export function VisualHelpHighlighter() {
  const { isEnabled, mode, locations } = useHelpInspector();
  const { setContext, openPanel, requestPanelView } = useHmsStore();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Subscribe to scroll & resize events (with capture) to update bounding rects smoothly in real-time
  useEffect(() => {
    let rAfId: number | null = null;
    const update = () => {
      setTick((t) => t + 1);
    };

    const handleScrollOrResize = () => {
      if (rAfId !== null) cancelAnimationFrame(rAfId);
      rAfId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      if (rAfId !== null) cancelAnimationFrame(rAfId);
      window.removeEventListener("scroll", handleScrollOrResize, { capture: true } as any);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

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
        const isNearTop = rect.top < 70;
        const popoverShowBelow = rect.top < 220;
        const isNearRight = typeof window !== "undefined" && rect.right > window.innerWidth - 340;
        const isNearLeft = rect.left < 160;

        const horizontalPositionClass = isNearRight
          ? "right-0 translate-x-0"
          : isNearLeft
          ? "left-0 translate-x-0"
          : "left-1/2 -translate-x-1/2";

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
            className="pointer-events-auto group transition-all duration-75"
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
                  ? "border-indigo-400 bg-indigo-500/20 shadow-[0_0_18px_rgba(99,102,241,0.6)]"
                  : "shadow-[0_0_12px_rgba(99,102,241,0.35)] animate-pulse opacity-90"
              }`}
            />

            {/* Smart Corner Badge */}
            <div
              className={`absolute flex items-center transition-all duration-150 ${
                isActive ? "z-[9999]" : "z-20"
              } ${isNearTop ? "top-1 right-1" : "-top-2.5 -right-2.5"}`}
            >
              <Button
                size="sm"
                className="h-6 px-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-[11px] shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-200 border border-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveKey((prev) => (prev === contextKey ? null : contextKey));
                }}
              >
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {articles.length}
                </span>
              </Button>
            </div>

            {/* Click Micro-Card Tooltip (Elevated to z-[10000]) */}
            {isActive && (
              <div
                className={`absolute w-84 min-w-[320px] max-w-[90vw] rounded-xl bg-slate-950/95 backdrop-blur-xl p-3 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-indigo-500/50 z-[10000] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto ${horizontalPositionClass} ${
                  popoverShowBelow ? "top-full mt-2" : "bottom-full mb-2"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-800 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-xs truncate text-white">{label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300 bg-indigo-500/10 shrink-0 whitespace-nowrap">
                    {articles.length} Attached
                  </Badge>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {articles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setContext(contextKey, label);
                        requestPanelView({ type: "article", id: art.id });
                        openPanel();
                        setActiveKey(null);
                      }}
                      className="group/item flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-500/25 cursor-pointer transition-colors border border-transparent hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {art.contentType === "video" && <Video className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                        {art.contentType === "pdf" && <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                        {art.contentType === "image" && <ImageIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        {art.contentType === "text" && <FileText className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                        <span className="text-xs truncate font-medium text-slate-200 group-hover/item:text-indigo-300 transition-colors">
                          {art.title}
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-60 group-hover/item:opacity-100 text-indigo-400 shrink-0 transition-opacity" />
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2"
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
    </div>
  );
}
