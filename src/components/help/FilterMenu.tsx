import { Filter, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type FilterOption = { value: string; label: string };
export type FilterSection = {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
};

/**
 * Standardized list-popup filter button.
 *  - LEFT side of every list-style header.
 *  - One compact button; opens a dropdown with all filter sections.
 *  - Active-filter count badge on the trigger.
 */
export function FilterMenu({ sections }: { sections: FilterSection[] }) {
  const activeCount = sections.filter(
    (s) => s.value && s.value !== "all" && s.value !== s.options[0]?.value,
  ).length;
  const hasActive = activeCount > 0;

  const clearAll = () =>
    sections.forEach((s) => s.onChange(s.options[0]?.value ?? "all"));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5">
          <Filter className="size-3.5" />
          Filter
          {hasActive && (
            <Badge className="ml-0.5 h-4 min-w-4 px-1 text-[10px] tabular-nums">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <span className="text-xs font-semibold">Filters</span>
          {hasActive && (
            <button
              onClick={clearAll}
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="size-3" /> Clear
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-auto py-1">
          {sections.map((s) => (
            <div key={s.key} className="px-1 py-1.5">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              {s.options.map((opt) => {
                const active = s.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => s.onChange(opt.value)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted"
                  >
                    <span className="size-3.5 flex items-center justify-center">
                      {active && <Check className="size-3.5 text-primary" />}
                    </span>
                    <span className={active ? "font-medium" : ""}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
