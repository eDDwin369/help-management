import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useHmsStore, type HmsArticle } from "@/components/hms/hmsStore";
import { labelForContext, CONTEXT_ARTICLE_MAP } from "@/lib/hms-context-registry";
import { getSectionFromContext } from "@/lib/help-nodes";

export type InspectorMode = "visual" | "right-click" | "report";

export interface PageHelpLocation {
  contextKey: string;
  label: string;
  element: HTMLElement;
  rect: DOMRect;
  articles: HmsArticle[];
  hasHelp: boolean;
}

interface InspectorContextValue {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  mode: InspectorMode;
  setMode: (mode: InspectorMode) => void;
  reportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;
  locations: PageHelpLocation[];
  refreshLocations: () => void;
  totalLocationsWithHelp: number;
  totalArticlesOnPage: number;
  highlightedContextKey: string | null;
  setHighlightedContextKey: (key: string | null) => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

export function HelpInspectorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state: hmsState } = useHmsStore();

  const [isEnabled, setIsEnabled] = useState(true);
  const [mode, setMode] = useState<InspectorMode>("visual");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [locations, setLocations] = useState<PageHelpLocation[]>([]);
  const [highlightedContextKey, setHighlightedContextKey] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  // Sync active inspector mode to DOM attribute so right-click handler in hmsStore knows when Option 2 is active
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isAdmin && isEnabled) {
        document.documentElement.setAttribute("data-inspector-mode", mode);
      } else {
        document.documentElement.removeAttribute("data-inspector-mode");
      }
    }
  }, [isAdmin, isEnabled, mode]);

  const scanPage = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // Find all DOM elements with data-hms-context attribute
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-hms-context]")
    );

    const map = new Map<string, { element: HTMLElement; rect: DOMRect; label: string }>();

    elements.forEach((el) => {
      const key = el.getAttribute("data-hms-context");
      if (!key) return;

      // Exclude sidebar elements and massive outer tab panel wrappers from cluttering highlighter
      if (el.closest("aside, .sidebar, [data-sidebar]")) return;
      if (el.hasAttribute("data-dashboard-tab")) return;

      // Ensure element is visible
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const label = el.getAttribute("data-hms-label") ?? labelForContext(key);

      // Only store the first matching element per key
      if (!map.has(key)) {
        map.set(key, { element: el, rect, label });
      }
    });

    const parsedLocations: PageHelpLocation[] = [];

    map.forEach(({ element, rect, label }, contextKey) => {
      // Find all articles attached to this contextKey
      const articleIds = CONTEXT_ARTICLE_MAP[contextKey] ?? [];

      const sec = getSectionFromContext(contextKey, label);
      const isTabOrSection =
        contextKey.startsWith("app-tab-") ||
        contextKey.startsWith("section-") ||
        contextKey.startsWith("app-nav-");

      // Filter state.articles for matching articles
      const matchingArticles = hmsState.articles.filter((a) => {
        if (a.archiveStatus !== "active" || a.approvalStatus !== "approved") {
          return false;
        }

        // 1. Direct context match
        if (a.contexts && a.contexts.includes(contextKey)) return true;

        // 2. Static registry match
        if (articleIds.includes(a.id)) return true;

        // 3. Section/Tab matching: if location is a tab or section, match any approved article in this section
        if (isTabOrSection) {
          const artPage = (a.hierarchy?.pageName || "").toLowerCase().trim();
          const secLabel = sec.sectionLabel.toLowerCase().trim();
          if (artPage && artPage === secLabel) return true;

          // Check if relatedContext starts with section label
          if (a.relatedContext && a.relatedContext.toLowerCase().startsWith(secLabel)) return true;

          // Check if article contexts contain the section key or tab key
          if (
            a.contexts &&
            (a.contexts.includes(sec.sectionKey) ||
              a.contexts.some((c) => c.includes(sec.sectionKey.replace("section-", ""))))
          ) {
            return true;
          }
        }

        return false;
      });

      parsedLocations.push({
        contextKey,
        label,
        element,
        rect,
        articles: matchingArticles,
        hasHelp: matchingArticles.length > 0,
      });
    });

    setLocations(parsedLocations);
  }, [hmsState.articles]);

  // Rescan whenever route, store articles, or window resizes
  useEffect(() => {
    if (!isAdmin) return;

    // Initial scan with delay for DOM render
    const timer = setTimeout(scanPage, 300);

    const handleResize = () => scanPage();
    const handleScroll = () => scanPage();

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, { capture: true } as any);
    };
  }, [isAdmin, pathname, scanPage]);

  // Periodically check DOM bounds when enabled
  useEffect(() => {
    if (!isAdmin || !isEnabled) return;
    const interval = setInterval(scanPage, 1500);
    return () => clearInterval(interval);
  }, [isAdmin, isEnabled, scanPage]);

  const totalLocationsWithHelp = locations.filter((l) => l.hasHelp).length;
  
  // Collect unique articles across all page locations
  const pageArticleIds = new Set<string>();
  locations.forEach((loc) => loc.articles.forEach((a) => pageArticleIds.add(a.id)));
  const totalArticlesOnPage = pageArticleIds.size;

  return (
    <InspectorContext.Provider
      value={{
        isEnabled,
        setIsEnabled,
        mode,
        setMode,
        reportModalOpen,
        setReportModalOpen,
        locations,
        refreshLocations: scanPage,
        totalLocationsWithHelp,
        totalArticlesOnPage,
        highlightedContextKey,
        setHighlightedContextKey,
      }}
    >
      {children}
    </InspectorContext.Provider>
  );
}

export function useHelpInspector() {
  const ctx = useContext(InspectorContext);
  if (!ctx) {
    throw new Error("useHelpInspector must be used within HelpInspectorProvider");
  }
  return ctx;
}
