import { useState } from "react";
import { type WidgetConfig, type WidgetCategory } from "@/lib/widget-registry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  categoryFilter?: WidgetCategory;
  categoryLabel?: string;
}

export function AddWidgetModal({
  open,
  onOpenChange,
  availableWidgets,
  activeWidgetIds,
  onAddWidget,
  categoryFilter,
  categoryLabel,
}: AddWidgetModalProps) {
  const [search, setSearch] = useState("");

  const activeSet = new Set(activeWidgetIds);

  const categoryFiltered = categoryFilter
    ? availableWidgets.filter((w) => w.category === categoryFilter)
    : availableWidgets;

  const filtered = categoryFiltered.filter(
    (w) =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl font-sans">
        {/* Modal Header */}
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
                {categoryLabel ? `Add Widgets to ${categoryLabel}` : "Add Widgets to Dashboard"}
              </DialogTitle>
              {categoryLabel && (
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  Available widgets for {categoryLabel} category
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative my-3 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search widgets by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 text-sm pl-10 bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 rounded-xl placeholder:text-slate-400 focus-visible:ring-blue-500"
          />
        </div>

        {/* Available Widgets List */}
        <div className="flex-1 overflow-auto pr-1 space-y-3 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
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
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                      isAdded
                        ? "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {widget.title}
                        </h4>
                        {widget.description && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none shrink-0"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs font-normal">
                              {widget.description}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {isAdded ? (
                      <span className="w-10 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        style={{ background: "linear-gradient(90deg, #0029FF 0%, #00144B 100%)" }}
                        className="w-10 h-8 rounded-full text-white flex items-center justify-center shadow-sm hover:opacity-90 transition-all shrink-0 border-0"
                        onClick={() => onAddWidget(widget.id)}
                        title="Add widget"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400 font-normal">
          <span>{activeWidgetIds.length} widgets currently visible on your dashboard</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 text-xs text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
