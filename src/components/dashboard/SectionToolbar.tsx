import type { ReactNode } from "react";
import { Search, Filter, LayoutGrid, LayoutList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ViewMode = "list" | "grid";

/**
 * Standard section toolbar: search on the left, view toggle + extras in the
 * middle and a single Filter dropdown on the right. Every control registers a
 * help context so right-click opens the matching article set.
 */
export function SectionToolbar({
  searchContext,
  toggleContext,
  filterContext,
  placeholder,
  query,
  onQueryChange,
  view,
  onViewChange,
  filterContent,
  filterActive,
  children,
}: {
  searchContext: string;
  toggleContext?: string;
  filterContext: string;
  placeholder: string;
  query: string;
  onQueryChange: (v: string) => void;
  view?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
  filterContent: ReactNode;
  filterActive?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="px-6 py-3 flex items-center gap-3 border-b flex-wrap">
      <div className="relative w-64" data-hms-context={searchContext}>
        <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8 h-9"
          aria-label={placeholder}
        />
      </div>

      {view && onViewChange && (
        <div className="flex border rounded-md overflow-hidden" data-hms-context={toggleContext}>
          <button
            aria-label="List view"
            onClick={() => onViewChange("list")}
            className={`size-9 flex items-center justify-center ${
              view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            aria-label="Grid view"
            onClick={() => onViewChange("grid")}
            className={`size-9 flex items-center justify-center ${
              view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      )}

      {children}

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filterActive ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              data-hms-context={filterContext}
            >
              <Filter className="size-3.5" /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-3 space-y-3">
            {filterContent}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md border text-xs transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "hover:bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}
