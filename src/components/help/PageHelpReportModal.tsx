import { useState } from "react";
import { useHelpInspector } from "@/lib/inspector-context";
import { useHmsStore } from "@/components/hms/hmsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  PlusCircle,
  BarChart3,
  Layers,
  HelpCircle,
} from "lucide-react";

export function PageHelpReportModal() {
  const {
    reportModalOpen,
    setReportModalOpen,
    locations,
    totalLocationsWithHelp,
    totalArticlesOnPage,
    setMode,
  } = useHelpInspector();

  const { setContext, openPanel, requestPanelView } = useHmsStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "has_help" | "missing">("all");

  if (!reportModalOpen) return null;

  // Compute page statistics
  const totalLocations = locations.length;
  const missingLocations = totalLocations - totalLocationsWithHelp;
  const coveragePercent =
    totalLocations > 0
      ? Math.round((totalLocationsWithHelp / totalLocations) * 100)
      : 100;

  // Compute media breakdown
  let videoCount = 0;
  let pdfCount = 0;
  let imageCount = 0;
  let textCount = 0;

  locations.forEach((loc) => {
    loc.articles.forEach((a) => {
      if (a.contentType === "video") videoCount++;
      if (a.contentType === "pdf") pdfCount++;
      if (a.contentType === "image") imageCount++;
      if (a.contentType === "text") textCount++;
    });
  });

  // Filtered rows for audit table
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.label.toLowerCase().includes(search.toLowerCase()) ||
      loc.contextKey.toLowerCase().includes(search.toLowerCase()) ||
      loc.articles.some((a) => a.title.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "has_help") return loc.hasHelp;
    if (filterType === "missing") return !loc.hasHelp;
    return true;
  });

  return (
    <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-2xl bg-card border-indigo-500/20 shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  Page Help Audit & Reporting Model
                  <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/30">
                    CEO Report Mode
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Detailed inspection report of all Help items attached to current page elements.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Metric Cards Summary */}
        <div className="grid grid-cols-4 gap-3 my-4 shrink-0">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-500 text-xs font-semibold">
              <span>Places with Help</span>
              <Layers className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {totalLocationsWithHelp}
              </span>
              <span className="text-xs text-muted-foreground">/ {totalLocations} locations</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-500 text-xs font-semibold">
              <span>Total Help Items</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {totalArticlesOnPage}
              </span>
              <span className="text-xs text-muted-foreground">articles attached</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-500 text-xs font-semibold">
              <span>Page Coverage Score</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {coveragePercent}%
              </span>
              <span className="text-xs text-muted-foreground">
                {missingLocations > 0 ? `${missingLocations} gaps` : "Fully Covered"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-500 text-xs font-semibold">
              <span>Content Mix</span>
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><Video className="h-3 w-3 text-rose-500" />{videoCount}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5"><FileText className="h-3 w-3 text-amber-500" />{pdfCount}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5"><ImageIcon className="h-3 w-3 text-emerald-500" />{imageCount}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5"><FileText className="h-3 w-3 text-sky-500" />{textCount}</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search component location or article title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs pl-8 bg-muted/40"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border text-xs">
            <Button
              size="sm"
              variant={filterType === "all" ? "default" : "ghost"}
              className="h-6 text-[11px] px-2.5"
              onClick={() => setFilterType("all")}
            >
              All ({locations.length})
            </Button>
            <Button
              size="sm"
              variant={filterType === "has_help" ? "default" : "ghost"}
              className="h-6 text-[11px] px-2.5"
              onClick={() => setFilterType("has_help")}
            >
              With Help ({totalLocationsWithHelp})
            </Button>
            <Button
              size="sm"
              variant={filterType === "missing" ? "default" : "ghost"}
              className="h-6 text-[11px] px-2.5"
              onClick={() => setFilterType("missing")}
            >
              Missing ({missingLocations})
            </Button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="flex-1 overflow-auto rounded-xl border border-border/60 custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/60 sticky top-0 z-10 backdrop-blur-md">
              <TableRow>
                <TableHead className="w-[220px] text-xs">UI Location</TableHead>
                <TableHead className="w-[180px] text-xs">Context Identifier</TableHead>
                <TableHead className="w-[110px] text-xs">Help Status</TableHead>
                <TableHead className="text-xs">Attached Help Items</TableHead>
                <TableHead className="w-[120px] text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    No matching locations found for current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLocations.map((loc) => (
                  <TableRow key={loc.contextKey} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs text-foreground">
                      {loc.label}
                    </TableCell>

                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {loc.contextKey}
                    </TableCell>

                    <TableCell>
                      {loc.hasHelp ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          Help Attached ({loc.articles.length})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 gap-1 text-[10px]">
                          <AlertCircle className="h-3 w-3" />
                          No Help
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {loc.articles.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          No articles assigned to this UI element
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {loc.articles.map((art) => (
                            <div
                              key={art.id}
                              onClick={() => {
                                setContext(loc.contextKey, loc.label);
                                requestPanelView({ type: "article", id: art.id });
                                openPanel();
                                setReportModalOpen(false);
                              }}
                              className="inline-flex items-center gap-1.5 mr-2 mb-1 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-indigo-500/10 text-[11px] cursor-pointer border border-transparent hover:border-indigo-500/20 transition-colors"
                            >
                              {art.contentType === "video" && <Video className="h-3 w-3 text-rose-500" />}
                              {art.contentType === "pdf" && <FileText className="h-3 w-3 text-amber-500" />}
                              {art.contentType === "image" && <ImageIcon className="h-3 w-3 text-emerald-500" />}
                              {art.contentType === "text" && <FileText className="h-3 w-3 text-sky-500" />}
                              <span className="font-medium truncate max-w-[180px]">{art.title}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/10"
                          onClick={() => {
                            setContext(loc.contextKey, loc.label);
                            openPanel();
                            setReportModalOpen(false);
                          }}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between shrink-0 text-xs">
          <span className="text-muted-foreground">
            Report generated for CEO presentation • Super Admin Help Inspector
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMode("visual");
                setReportModalOpen(false);
              }}
            >
              Switch to Visual Highlighting
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => setReportModalOpen(false)}
            >
              Close Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
