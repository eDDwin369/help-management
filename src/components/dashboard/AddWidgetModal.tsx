import { useState } from "react";
import { type WidgetConfig } from "@/lib/widget-registry";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, Plus, Check, LayoutGrid, Info } from "lucide-react";

interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableWidgets: WidgetConfig[];
  activeWidgetIds: string[];
  onAddWidget: (widgetId: string) => void;
}

export function AddWidgetModal({
  open,
  onOpenChange,
  availableWidgets,
  activeWidgetIds,
  onAddWidget,
}: AddWidgetModalProps) {
  const [search, setSearch] = useState("");

  const activeSet = new Set(activeWidgetIds);

  const filtered = availableWidgets.filter(
    (w) =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-2xl bg-card border-border shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                Add Widgets to Dashboard
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Customizable Layout
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select from widgets available for your workspace permission level.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative my-3 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search widgets by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs pl-9 bg-muted/40"
          />
        </div>

        {/* Available Widgets List */}
        <div className="flex-1 overflow-auto pr-1 space-y-3 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No matching widgets found for your search term.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((widget) => {
                const Icon = widget.icon;
                const isAdded = activeSet.has(widget.id);

                return (
                  <div
                    key={widget.id}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      isAdded
                        ? "bg-muted/30 border-border/40 opacity-75"
                        : "bg-card border-border hover:border-primary/50 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {widget.title}
                            </h4>
                            {widget.description && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none shrink-0"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs font-normal">
                                  {widget.description}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 h-4 text-muted-foreground uppercase shrink-0"
                          >
                            {widget.defaultWidth === "full" ? "Full" : "Half"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {isAdded ? "Currently on Dashboard" : "Available to Add"}
                      </span>

                      {isAdded ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] gap-1 px-2">
                          <Check className="h-3 w-3" />
                          Added
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90 gap-1 rounded-lg"
                          onClick={() => onAddWidget(widget.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Widget
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between shrink-0 text-xs text-muted-foreground">
          <span>{activeWidgetIds.length} widgets currently visible on your dashboard</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
