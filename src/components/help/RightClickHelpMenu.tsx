import { useEffect, useState, useRef } from "react";
import { useHelpInspector } from "@/lib/inspector-context";
import { useHmsStore } from "@/components/hms/hmsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  FileText,
  Image as ImageIcon,
  Search,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export function RightClickHelpMenu() {
  const { isEnabled, mode, locations, setHighlightedContextKey } = useHelpInspector();
  const { setContext, openPanel, requestPanelView } = useHmsStore();

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEnabled || mode !== "right-click") {
      setVisible(false);
      setHighlightedContextKey(null);
      return;
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // Precision viewport boundary clamping so menu is never cropped
      const menuW = 390;
      const menuH = 460;
      const x = Math.max(12, Math.min(e.clientX, window.innerWidth - menuW - 16));
      const y = Math.max(12, Math.min(e.clientY, window.innerHeight - menuH - 16));

      setPos({ x, y });
      setSearch("");
      setVisible(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
        setHighlightedContextKey(null);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEnabled, mode, setHighlightedContextKey]);

  const closeMenu = () => {
    setVisible(false);
    setHighlightedContextKey(null);
  };

  if (!visible || !isEnabled || mode !== "right-click") return null;

  // Filter locations with help
  const locationsWithHelp = locations.filter((l) => l.hasHelp);

  // Filter items based on search term
  const filtered = locationsWithHelp
    .map((loc) => ({
      ...loc,
      articles: loc.articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          loc.label.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((loc) => loc.articles.length > 0);

  const totalPageArticles = locationsWithHelp.reduce(
    (acc, l) => acc + l.articles.length,
    0
  );

  return (
    <div
      ref={menuRef}
      style={{ top: `${pos.y}px`, left: `${pos.x}px` }}
      className="fixed z-50 w-[390px] max-w-[92vw] rounded-2xl bg-card/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/40 p-4 animate-in fade-in zoom-in-95 duration-150 text-card-foreground flex flex-col"
    >
      {/* Menu Header */}
      <div className="flex items-center justify-between border-b pb-3 mb-3 border-border/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight flex items-center gap-2">
              Page Help Inspector
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {locationsWithHelp.length} Locations • {totalPageArticles} Active Help Items
            </p>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full hover:bg-muted"
          onClick={closeMenu}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search page help items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs pl-8 bg-muted/40 border-border/60 focus-visible:ring-indigo-500 rounded-lg"
        />
      </div>

      {/* Help Items List */}
      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar shrink-0">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No matching help items found on this page.
          </div>
        ) : (
          filtered.map((loc) => (
            <div
              key={loc.contextKey}
              className="space-y-1.5 rounded-xl p-2 bg-muted/20 border border-border/40 transition-colors hover:bg-indigo-500/5 hover:border-indigo-500/30"
              onMouseEnter={() => setHighlightedContextKey(loc.contextKey)}
              onMouseLeave={() => setHighlightedContextKey(null)}
            >
              {/* Location Section Header */}
              <div className="flex items-center justify-between text-xs font-bold px-1 pb-1 border-b border-border/30">
                <span className="truncate max-w-[260px] text-indigo-600 dark:text-indigo-400">
                  {loc.label}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-semibold"
                >
                  {loc.articles.length}
                </Badge>
              </div>

              {/* Articles under this location */}
              <div className="space-y-1.5 pt-1">
                {loc.articles.map((art) => (
                  <div
                    key={art.id}
                    onMouseEnter={() => setHighlightedContextKey(loc.contextKey)}
                    onMouseLeave={() => setHighlightedContextKey(null)}
                    onClick={() => {
                      setContext(loc.contextKey, loc.label);
                      requestPanelView({ type: "article", id: art.id });
                      openPanel();
                      closeMenu();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-card hover:bg-indigo-500/15 border border-border/50 hover:border-indigo-500/40 cursor-pointer transition-all duration-150 group shadow-xs hover:shadow-indigo-500/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-muted/60 shrink-0">
                        {art.contentType === "video" && (
                          <Video className="h-4 w-4 text-rose-500" />
                        )}
                        {art.contentType === "pdf" && (
                          <FileText className="h-4 w-4 text-amber-500" />
                        )}
                        {art.contentType === "image" && (
                          <ImageIcon className="h-4 w-4 text-emerald-500" />
                        )}
                        {art.contentType === "text" && (
                          <FileText className="h-4 w-4 text-sky-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                          {art.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                          {art.contentType} guide • {art.authorName}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 text-indigo-500 transition-all shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer action */}
      <div className="mt-3 pt-2.5 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground shrink-0">
        <span>Right-click anywhere for menu</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-0"
          onClick={() => {
            openPanel();
            closeMenu();
          }}
        >
          View Full HMS Panel →
        </Button>
      </div>
    </div>
  );
}
