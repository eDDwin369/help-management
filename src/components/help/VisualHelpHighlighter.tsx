import { useState } from "react";
import { useHelpInspector } from "@/lib/inspector-context";
import { useHmsStore } from "@/components/hms/hmsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, Video, FileText, Image as ImageIcon, Sparkles, ExternalLink } from "lucide-react";

export function VisualHelpHighlighter() {
  const { isEnabled, mode, locations } = useHelpInspector();
  const { setContext, openPanel, requestPanelView } = useHmsStore();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (!isEnabled || mode !== "visual") return null;

  const locationsWithHelp = locations.filter((l) => l.hasHelp);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {locationsWithHelp.map((loc) => {
        const { contextKey, label, rect, articles } = loc;
        const isHovered = hoveredKey === contextKey;

        // Viewport boundary checks
        const isNearTop = rect.top < 50;
        const popoverShowBelow = rect.top < 220;

        return (
          <div
            key={contextKey}
            style={{
              position: "fixed",
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              // Stacking context elevation: Hovered location is elevated far above all other badges
              zIndex: isHovered ? 9999 : 20,
            }}
            className="pointer-events-auto group transition-all duration-150"
            onMouseEnter={() => setHoveredKey(contextKey)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            {/* Glowing border around target element */}
            <div
              className={`absolute inset-0 rounded-lg border-2 border-indigo-500 bg-indigo-500/10 transition-all duration-200 ${
                isHovered
                  ? "border-indigo-400 bg-indigo-500/20 shadow-[0_0_22px_rgba(99,102,241,0.7)] scale-[1.01]"
                  : "shadow-[0_0_12px_rgba(99,102,241,0.35)] animate-pulse opacity-90"
              }`}
            />

            {/* Smart Corner Badge */}
            <div
              className={`absolute flex items-center transition-all duration-150 ${
                isHovered ? "z-[9999]" : "z-20"
              } ${isNearTop ? "top-1 right-1" : "-top-2.5 -right-2.5"}`}
            >
              <Button
                size="sm"
                className="h-6 px-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-[11px] shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-200 gap-1 border border-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setContext(contextKey, label);
                  openPanel();
                }}
              >
                <Sparkles className="h-3 w-3 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
                <span>Help</span>
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {articles.length}
                </span>
              </Button>
            </div>

            {/* Hover Micro-Card Tooltip (Elevated to z-[10000]) */}
            {isHovered && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-72 rounded-xl bg-slate-950/95 backdrop-blur-xl p-3 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-indigo-500/50 z-[10000] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto ${
                  popoverShowBelow ? "top-full mt-2" : "bottom-full mb-2"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-indigo-400" />
                    <span className="font-semibold text-xs truncate max-w-[170px] text-white">{label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300 bg-indigo-500/10">
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
