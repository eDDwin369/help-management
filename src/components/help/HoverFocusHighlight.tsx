import { useState, useEffect } from "react";
import { useHelpInspector } from "@/lib/inspector-context";
import { Target } from "lucide-react";

export function HoverFocusHighlight() {
  const { highlightedContextKey, locations } = useHelpInspector();
  const [, setTick] = useState(0);

  useEffect(() => {
    let rAfId: number | null = null;
    const update = () => setTick((t) => t + 1);

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

  if (!highlightedContextKey) return null;

  const target = locations.find((l) => l.contextKey === highlightedContextKey);

  if (!target?.element || !target.element.isConnected) return null;

  const rect = target.element.getBoundingClientRect();

  const isVisible =
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 50 &&
    rect.top < (typeof window !== "undefined" ? window.innerHeight - 36 : 1000) &&
    rect.right > 0 &&
    rect.left < (typeof window !== "undefined" ? window.innerWidth : 1000);

  if (!isVisible) return null;

  // Smart positioning to prevent viewport cropping
  const isNearTop = rect.top < 65;
  const isNearRight = rect.left + 280 > (typeof window !== "undefined" ? window.innerWidth : 1000);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Target Element Highlight Box */}
      <div
        style={{
          position: "fixed",
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }}
        className="z-50 transition-all duration-150 ease-out"
      >
        {/* Pulsing Highlight Box */}
        <div className="absolute -inset-1 rounded-xl border-2 border-indigo-500 bg-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.7)] animate-pulse" />

        {/* Corner Target Brackets */}
        <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-indigo-400 rounded-tl" />
        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-indigo-400 rounded-tr" />
        <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-indigo-400 rounded-bl" />
        <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-indigo-400 rounded-br" />

        {/* Floating Target Label Badge */}
        <div
          className={`absolute z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/95 text-white text-xs font-semibold shadow-2xl border border-indigo-500/40 backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 ${
            isNearTop ? "top-full mt-2" : "-top-9"
          } ${isNearRight ? "right-0" : "left-0"}`}
        >
          <Target className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="text-slate-400 font-normal">Focused Area:</span>
          <span className="text-indigo-300 font-bold max-w-xs truncate">{target.label}</span>
        </div>
      </div>
    </div>
  );
}
