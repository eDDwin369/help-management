import { useState, useEffect } from "react";
import { useHelpInspector } from "@/lib/inspector-context";
import { Target } from "lucide-react";

export function HoverFocusHighlight() {
  const { highlightedContextKey, locations } = useHelpInspector();
  const [, setTick] = useState(0);

  useEffect(() => {
    let rAfId: number | null = null;
    let running = true;

    const updateDirectDOM = () => {
      if (!highlightedContextKey) return;
      const target = locations.find((l) => l.contextKey === highlightedContextKey);
      if (!target?.element || !target.element.isConnected) return;

      const overlayEl = document.querySelector<HTMLElement>(`[data-hover-focus-overlay="true"]`);
      if (!overlayEl) return;

      const rect = target.element.getBoundingClientRect();
      const isVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 50 &&
        rect.top < (typeof window !== "undefined" ? window.innerHeight - 36 : 1000) &&
        rect.right > 0 &&
        rect.left < (typeof window !== "undefined" ? window.innerWidth : 1000);

      if (!isVisible) {
        overlayEl.style.display = "none";
      } else {
        overlayEl.style.display = "block";
        overlayEl.style.top = `${rect.top}px`;
        overlayEl.style.left = `${rect.left}px`;
        overlayEl.style.width = `${rect.width}px`;
        overlayEl.style.height = `${rect.height}px`;
      }
    };

    const loop = () => {
      if (!running) return;
      updateDirectDOM();
      rAfId = requestAnimationFrame(loop);
    };

    const triggerUpdate = () => {
      if (rAfId !== null) cancelAnimationFrame(rAfId);
      rAfId = requestAnimationFrame(loop);
    };

    // 1. Event listeners for scroll, resize, transition, animation
    window.addEventListener("scroll", triggerUpdate, { capture: true, passive: true });
    window.addEventListener("resize", triggerUpdate, { passive: true });
    window.addEventListener("transitionend", triggerUpdate, { capture: true, passive: true });
    window.addEventListener("animationend", triggerUpdate, { capture: true, passive: true });

    // 2. ResizeObserver on document.body & main to catch sidebar expand/collapse
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      resizeObserver = new ResizeObserver(() => {
        triggerUpdate();
      });
      resizeObserver.observe(document.body);
      const mainEl = document.querySelector("main");
      if (mainEl) resizeObserver.observe(mainEl);
    }

    // 3. MutationObserver to catch sidebar attribute/class changes
    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined" && document.body) {
      mutationObserver = new MutationObserver(() => {
        triggerUpdate();
      });
      mutationObserver.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ["class", "style", "data-state", "data-collapsed"],
      });
    }

    rAfId = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (rAfId !== null) cancelAnimationFrame(rAfId);
      window.removeEventListener("scroll", triggerUpdate, { capture: true } as any);
      window.removeEventListener("resize", triggerUpdate);
      window.removeEventListener("transitionend", triggerUpdate, { capture: true } as any);
      window.removeEventListener("animationend", triggerUpdate, { capture: true } as any);
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, [highlightedContextKey, locations]);

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
        data-hover-focus-overlay="true"
        style={{
          position: "fixed",
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }}
        className="z-50 transition-none"
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
