import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Filter as FilterIcon,
  Play,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle2,
  Upload,
  Pencil,
  Archive as ArchiveIcon,
  Trash2,
  Maximize2,
  Volume2,
  FileQuestion,
  Check,
  XCircle,
  Paperclip,
  AlertTriangle,
  RotateCw,
  Library,
  Mic,
  Plus,
  ArrowUp,
  Sparkles,
  Headphones,
  PlusCircle,
} from "lucide-react";
import {
  useHmsStore,
  getFilteredArticles,
  formatBytes,
  formatDate,
  generateTicketId,
  type HmsArticle,
  type HmsTicket,
  type HmsAttachment,
  type ContentType,
  type Priority,
  type ApprovalStatus,
  type UserRole,
} from "./hmsStore";
import { trackHmsEvent } from "@/lib/hms-analytics";

const NAVY = "#102040";

/** Small, quickly-dismissed success pill used across the panel. */
function compactToast(message: string) {
  toast.success(message, {
    duration: 2200,
    style: {
      padding: "7px 12px",
      fontSize: "12px",
      minHeight: "unset",
      width: "auto",
      borderRadius: "8px",
    },
  });
}
const NAVY_HOVER = "#1C3054";

type View =
  | { name: "list" }
  | { name: "detail"; id: string }
  | { name: "contact" }
  | { name: "success"; ticketId: string }
  | { name: "requests" }
  | { name: "request"; id: string }
  | { name: "ai-chat"; initialPrompt?: string }
  | {
      name: "add";
      editId?: string;
      prefill?: { title?: string; description?: string; tags?: string[]; priority?: Priority };
    };

// ---------- SHARED PRIMITIVES ----------

function typeColors(t: ContentType) {
  switch (t) {
    case "video":
      return { bg: "#FFF0F0", color: "#DC2626" };
    case "pdf":
      return { bg: "#EFF6FF", color: "#1D4ED8" };
    case "image":
      return { bg: "#F0FDF4", color: "#15803D" };
    case "text":
      return { bg: "#F5F3FF", color: "#7C3AED" };
  }
}

function TypeBox({ t }: { t: ContentType }) {
  const { bg, color } = typeColors(t);
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-md"
      style={{ width: 28, height: 28, backgroundColor: bg, color }}
    >
      {t === "video" && <Play className="size-3.5" fill={color} />}
      {t === "pdf" && <FileText className="size-3.5" />}
      {t === "image" && <ImageIcon className="size-3.5" />}
      {t === "text" && <span className="text-[11px] font-bold">T</span>}
    </div>
  );
}

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const map = {
    approved: { bg: "#F0FDF4", color: "#22C55E", label: "✓ Approved" },
    pending: { bg: "#FFFBEB", color: "#B45309", label: "Pending Approval" },
    unapproved: { bg: "#FEE2E2", color: "#EF4444", label: "✕ Unapproved" },
  }[status];
  return (
    <span
      className="shrink-0 font-medium"
      style={{
        backgroundColor: map.bg,
        color: map.color,
        borderRadius: 3,
        padding: "1px 6px",
        fontSize: 10,
      }}
    >
      {map.label}
    </span>
  );
}

/** Archived articles are flagged instead of showing their approval state. */
function ArchivedBadge() {
  return (
    <span
      className="shrink-0 font-medium"
      style={{
        backgroundColor: "#F3F4F6",
        color: "#6B7280",
        borderRadius: 3,
        padding: "1px 6px",
        fontSize: 10,
      }}
    >
      Archived
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div
      className="uppercase font-semibold"
      style={{
        fontSize: 10,
        color: "#9CA3AF",
        letterSpacing: "0.05em",
        marginBottom: 3,
      }}
    >
      {children}
    </div>
  );
}

const inputBase =
  "w-full outline-none focus:border-[#102040] transition-colors";
const inputStyle: React.CSSProperties = {
  backgroundColor: "#F9FAFB",
  border: "0.8px solid #E5E7EB",
  borderRadius: 6,
  padding: "0 10px",
  fontSize: 11,
  color: "#374151",
  height: 28,
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "8px 10px",
  minHeight: 52,
  height: "auto",
  resize: "none",
  lineHeight: 1.5,
};

const PRIORITY_MAP: Record<Priority, { bg: string; color: string; label: string }> = {
  low: { bg: "#F3F4F6", color: "#6B7280", label: "Low" },
  medium: { bg: "#FFFBEB", color: "#F59E0B", label: "Medium" },
  high: { bg: "#FEF3C7", color: "#D97706", label: "High" },
  urgent: { bg: "#FEF2F2", color: "#EF4444", label: "Urgent" },
};

const TICKET_STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FFFBEB", color: "#B45309", label: "Pending" },
  "under-review": { bg: "#EFF6FF", color: "#1D4ED8", label: "Under Review" },
  resolved: { bg: "#F0FDF4", color: "#15803D", label: "Resolved" },
  closed: { bg: "#F3F4F6", color: "#6B7280", label: "Closed" },
};

/**
 * Priority chip. `variant="outline"` gives it a lighter weight so it can sit
 * beside a filled status badge without competing for attention.
 */
function PriorityBadge({
  p,
  onClick,
  variant = "filled",
}: {
  p: Priority;
  onClick?: () => void;
  variant?: "filled" | "outline";
}) {
  const m = PRIORITY_MAP[p];
  const outline = variant === "outline";
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center rounded font-medium"
      style={{
        backgroundColor: outline ? "transparent" : m.bg,
        border: outline ? `1px solid ${m.color}40` : "1px solid transparent",
        color: m.color,
        padding: outline ? "1px 7px" : "2px 8px",
        fontSize: 11,
      }}
    >
      {m.label}
    </span>
  );
}

/** Filled status chip used for support requests. */
function TicketStatusBadge({ status }: { status: string }) {
  const s = TICKET_STATUS_MAP[status] ?? TICKET_STATUS_MAP.pending;
  return (
    <span
      className="shrink-0 font-semibold"
      style={{
        backgroundColor: s.bg,
        color: s.color,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 10,
      }}
    >
      {s.label}
    </span>
  );
}

const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "urgent"];

/** Segmented priority control — the selected option is unmistakably active. */
function PrioritySelect({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Priority"
      className="grid grid-cols-4"
      style={{ gap: 4 }}
    >
      {PRIORITY_ORDER.map((p) => {
        const m = PRIORITY_MAP[p];
        const on = value === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={m.label}
            onClick={() => onChange(p)}
            className="flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-[#3B6BF5]"
            style={{
              height: 28,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: on ? 700 : 500,
              backgroundColor: on ? m.bg : "#F9FAFB",
              color: on ? m.color : "#9CA3AF",
              border: `1px solid ${on ? m.color : "#E5E7EB"}`,
              boxShadow: on ? `0 0 0 2px ${m.bg}` : "none",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}


// ---------- HEADER ----------

function Header({
  crumb,
  onBack,
  onClose,
  onDragStart,
}: {
  crumb: string;
  onBack?: () => void;
  onClose: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="flex items-center shrink-0 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onDragStart?.(e);
      }}
      style={{
        height: 44,
        backgroundColor: NAVY,
        borderRadius: "10px 10px 0 0",
        padding: "0 12px",
      }}
    >
      <div className="flex items-center flex-1 min-w-0" style={{ gap: 6 }}>
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex items-center justify-center rounded hover:bg-white/10 -ml-1 mr-1"
            style={{ width: 28, height: 28 }}
          >
            <ChevronLeft style={{ width: 14, height: 14, color: "#9CA3AF" }} />
          </button>
        )}
        <span
          className="inline-flex items-center"
          style={{
            backgroundColor: "#1C3054",
            borderRadius: 4,
            padding: "3px 8px",
            gap: 3,
          }}
        >
          <span style={{ color: "#F59E0B", fontSize: 10, fontWeight: 700 }}>★</span>
          <span style={{ color: "white", fontSize: 10, fontWeight: 600 }}>HMS</span>
        </span>
        <span
          className="shrink-0"
          style={{ width: 1, height: 16, backgroundColor: "#2D4060", margin: "0 8px" }}
        />
        <span
          className="truncate"
          style={{ color: "white", fontSize: 13, fontWeight: 600 }}
        >
          {crumb}
        </span>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="flex items-center justify-center rounded hover:bg-white/10"
        style={{ width: 32, height: 32 }}
      >
        <X style={{ width: 16, height: 16, color: "#9CA3AF" }} />
      </button>
    </div>
  );
}

// ---------- SEARCH + FILTER BAR ----------

function SearchBar({
  value,
  onChange,
  filterCount = 0,
  onToggleFilter,
  filterOpen = false,
  placeholder = "Search help articles...",
}: {
  value: string;
  onChange: (v: string) => void;
  filterCount?: number;
  onToggleFilter?: () => void;
  filterOpen?: boolean;
  placeholder?: string;
}) {
  const active = filterCount > 0;
  return (
    <div
      className="flex items-center shrink-0 bg-white"
      style={{
        padding: "8px 12px",
        borderBottom: "0.8px solid #F3F4F6",
        gap: 8,
      }}
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2"
          style={{ width: 12, height: 12, color: "#9CA3AF" }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full outline-none focus-visible:ring-2 focus-visible:ring-[#3B6BF5]"
          style={{
            height: 26,
            backgroundColor: "#F9FAFB",
            border: "0.8px solid #E5E7EB",
            borderRadius: 6,
            padding: value ? "0 24px 0 26px" : "0 8px 0 26px",
            fontSize: 12,
            color: "#374151",
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-0.5 rounded-full hover:bg-gray-200 transition-colors"
            title="Clear search"
          >
            <X className="size-3 stroke-[2]" />
          </button>
        )}
      </div>
      <button
        onClick={onToggleFilter}
        aria-label={filterCount > 0 ? `Filter, ${filterCount} active` : "Filter"}
        aria-expanded={filterOpen}
        aria-haspopup="dialog"
        className="relative flex items-center rounded focus-visible:ring-2 focus-visible:ring-[#3B6BF5]"
        style={{
          gap: 4,
          fontSize: 11,
          color: active || filterOpen ? "#3B6BF5" : "#6B7280",
          backgroundColor: active || filterOpen ? "#EFF6FF" : "transparent",
          padding: "4px 6px",
        }}
      >
        <FilterIcon style={{ width: 15, height: 15 }} />
        <span>Filter</span>
        {active && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-bold"
            style={{ width: 14, height: 14, backgroundColor: "#EF4444", fontSize: 8 }}
          >
            {filterCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ---------- FILTER DROPDOWN ----------

interface Filters {
  types: ContentType[];
  archive: string;
  approval: string;
}

const TYPE_OPTIONS: { v: ContentType; l: string }[] = [
  { v: "video", l: "Video" },
  { v: "pdf", l: "PDF" },
  { v: "image", l: "Image" },
  { v: "text", l: "Text guide" },
];

function Radio({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className="flex items-center w-full text-left"
      style={{ gap: 8, padding: "5px 0", fontSize: 12, color: "#374151" }}
    >
      <span
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 14,
          height: 14,
          backgroundColor: selected ? NAVY : "white",
          border: `1px solid ${selected ? NAVY : "#D1D5DB"}`,
        }}
      >
        {selected && (
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "white" }} />
        )}
      </span>
      {label}
    </button>
  );
}

function Checkbox({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className="flex items-center w-full text-left"
      style={{ gap: 8, padding: "5px 0", fontSize: 12, color: "#374151" }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          backgroundColor: checked ? NAVY : "white",
          border: `1px solid ${checked ? NAVY : "#D1D5DB"}`,
        }}
      >
        {checked && <Check style={{ width: 10, height: 10, color: "white" }} strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

const DEFAULT_FILTERS: Filters = {
  types: [],
  archive: "all",
  approval: "all",
};

const ALL_TYPES: ContentType[] = ["video", "pdf", "image", "text"];

function FilterDropdown({
  role,
  filters,
  setFilters,
  onSelected,
}: {
  role: UserRole;
  filters: Filters;
  setFilters: (f: Filters) => void;
  /** Called to close the filter dropdown. */
  onSelected: () => void;
}) {
  const cols = role === "admin" ? 3 : role === "help-admin" ? 2 : 1;

  const apply = (f: Filters) => {
    setFilters(f);
    // Keep filter dropdown open while user selects checkboxes
  };

  const toggleAllTypes = () => {
    if (filters.types.length === ALL_TYPES.length) {
      apply({ ...filters, types: [] });
    } else {
      apply({ ...filters, types: [...ALL_TYPES] });
    }
  };

  const toggleType = (t: ContentType) => {
    const next = filters.types.includes(t)
      ? filters.types.filter((x) => x !== t)
      : [...filters.types, t];
    apply({ ...filters, types: next });
  };

  const isFiltered =
    filters.types.length > 0 || filters.archive !== "all" || filters.approval !== "all";

  const isAllTypesChecked =
    filters.types.length === ALL_TYPES.length;

  return (
    <div
      className="absolute z-20 flex flex-col bg-white"
      style={{
        top: 4,
        right: 8,
        borderRadius: 8,
        border: "0.8px solid #E5E7EB",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        width: cols === 3 ? 300 : cols === 2 ? 220 : 160,
      }}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/70 rounded-t-lg">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Filter</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => apply(DEFAULT_FILTERS)}
            className={`text-[10px] font-semibold hover:underline flex items-center gap-0.5 ${
              isFiltered ? "text-purple-600 hover:text-purple-700" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onSelected}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-200 transition-colors"
            title="Close filter dropdown"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(96px,1fr))`,
        }}
      >
        <div style={{ padding: "8px 12px", borderRight: cols > 1 ? "1px solid #F3F4F6" : "none" }}>
          <Label>Type</Label>
          <Checkbox
            checked={isAllTypesChecked}
            label="All types"
            onClick={toggleAllTypes}
          />
          {TYPE_OPTIONS.map((o) => (
            <Checkbox
              key={o.v}
              checked={filters.types.includes(o.v)}
              label={o.l}
              onClick={() => toggleType(o.v)}
            />
          ))}
        </div>
        {cols >= 2 && (
          <div style={{ padding: "8px 12px", borderRight: cols > 2 ? "1px solid #F3F4F6" : "none" }}>
            <Label>Archive</Label>
            {[
              { v: "active", l: "Active" },
              { v: "archived", l: "Archived" },
              { v: "all", l: "All" },
            ].map((o) => (
              <Radio
                key={o.v}
                selected={filters.archive === o.v}
                label={o.l}
                onClick={() => apply({ ...filters, archive: o.v })}
              />
            ))}
          </div>
        )}
        {cols >= 3 && (
          <div style={{ padding: "8px 12px" }}>
            <Label>Approval</Label>
            {[
              { v: "approved", l: "Approved" },
              { v: "pending", l: "Pending" },
              { v: "all", l: "All" },
            ].map((o) => (
              <Radio
                key={o.v}
                selected={filters.approval === o.v}
                label={o.l}
                onClick={() => apply({ ...filters, approval: o.v })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ---------- FOOTER ROW ----------

function BtnRow({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex shrink-0"
      style={{
        padding: "9px 12px",
        gap: 8,
        borderTop: "0.8px solid #F3F4F6",
      }}
    >
      {children}
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  className = "",
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-4 shrink-0 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer ${className}`}
      style={{
        height: 32,
        backgroundColor: NAVY,
        color: "white",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineBtn({
  children,
  onClick,
  className = "",
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-3 transition-all hover:bg-gray-50 active:scale-95 cursor-pointer shrink-0 ${className}`}
      style={{
        height: 32,
        backgroundColor: "white",
        border: "0.8px solid #E5E7EB",
        color: "#374151",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Single, consistent Back control used by every sub-view footer. */
function BackBtn({ onClick }: { onClick?: () => void }) {
  return (
    <OutlineBtn onClick={onClick} className="hms-back shrink-0">
      <ChevronLeft style={{ width: 12, height: 12 }} /> Back
    </OutlineBtn>
  );
}


// ---------- LIST VIEW ----------

function ListView({
  role,
  onOpenArticle,
  onContact,
  onAdd,
  onResources,
  onSearchLibrary,
  onContentLibrary,
  goTo,
}: {
  role: UserRole;
  onOpenArticle: (id: string) => void;
  onContact: () => void;
  onAdd: () => void;
  onResources: () => void;
  onSearchLibrary: () => void;
  onContentLibrary: () => void;
  goTo: (v: View) => void;
}) {
  const { state, contextKey, context } = useHmsStore();
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    types: [],
    archive: "active",
    // Admins land on the customer-equivalent view: active + approved only.
    approval: role === "admin" ? "approved" : "all",
  });
  const [page, setPage] = useState(1);

  // Rows are a fixed 40px tall — derive how many fit the available body height
  // so the list always fills the panel before paginating.
  const ROW_H = 40;
  const listRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const fit = Math.floor(el.clientHeight / ROW_H);
      setPageSize(Math.max(3, fit));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Debounced query keeps large libraries from re-filtering on every keystroke.
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 180);
    return () => clearTimeout(t);
  }, [search]);

  const typeKey = filters.types.join(",");
  const filterCount =
    (filters.types.length > 0 ? 1 : 0) +
    (role !== "customer" && filters.archive !== "active" ? 1 : 0) +
    (role === "admin" && filters.approval !== "approved" ? 1 : 0);

  const filtered = useMemo(
    () => getFilteredArticles(state.articles, role, contextKey, filters, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.articles, role, contextKey, typeKey, filters.archive, filters.approval, query],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, typeKey, filters.archive, filters.approval, pageSize]);

  // --- usage analytics ---
  useEffect(() => {
    const q = query.trim();
    if (q.length > 1) trackHmsEvent("search", { label: q, role, contextKey });
  }, [query, role, contextKey]);

  useEffect(() => {
    if (filterCount === 0) return;
    trackHmsEvent("filter_change", {
      label: `types:${typeKey || "all"} archive:${filters.archive} approval:${filters.approval}`,
      role,
      contextKey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeKey, filters.archive, filters.approval]);

  const isEmpty = filtered.length === 0;

  return (
    <>
      <SearchBar
        value={search}
        onChange={setSearch}
        filterCount={filterCount}
        onToggleFilter={() => setFilterOpen((v) => !v)}
        filterOpen={filterOpen}
      />
      <div className="relative flex-1 flex flex-col min-h-0">
        {filterOpen && (
          <FilterDropdown
            role={role}
            filters={filters}
            setFilters={setFilters}
            onSelected={() => setFilterOpen(false)}
          />
        )}
        {((role !== "customer" && !isEmpty) || (search.trim().length > 0 && !isEmpty)) && (
          <div
            className="flex items-center justify-between shrink-0"
            style={{
              height: 28,
              backgroundColor: "#FAFAFA",
              borderBottom: "0.8px solid #F3F4F6",
              padding: "0 12px",
            }}
          >
            <span
              className="uppercase font-semibold"
              style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.5px" }}
            >
              Related articles
            </span>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>
              {filtered.length} results
            </span>
          </div>
        )}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto hms-scroll"
          role={isEmpty ? undefined : "list"}
          aria-label={isEmpty ? undefined : "Related help articles"}
        >
          {((role !== "customer" && !isEmpty) || (search.trim().length > 0 && !isEmpty)) &&
            paged.map((a) => (
              <button
                key={a.id}
                role="listitem"
                aria-label={`${a.contentType} article: ${a.title}`}
                onClick={() => onOpenArticle(a.id)}
                className="flex items-center w-full text-left hover:bg-[#FAFAFA]"
                style={{
                  height: ROW_H,
                  padding: "0 12px",
                  gap: 10,
                  borderBottom: "0.8px solid #F3F4F6",
                  backgroundColor: "white",
                }}
              >
                <TypeBox t={a.contentType} />
                <span
                  className="flex-1 truncate"
                  style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}
                >
                  {a.title}
                </span>
                {role !== "customer" &&
                  (a.archiveStatus === "archived" ? (
                    <ArchivedBadge />
                  ) : (
                    <ApprovalBadge status={a.approvalStatus} />
                  ))}
                <ChevronRight style={{ width: 12, height: 12, color: "#D1D5DB" }} />
              </button>
            ))}

          {/* AI Assistant Welcome Greeting & Clickable Chips (First Message) */}
          <div className="p-4 bg-gradient-to-b from-white via-purple-50/20 to-pink-50/20 space-y-3">
            <p className="text-xs font-semibold text-gray-900 leading-relaxed">
              Hello! Curious about what you're watching? I'm here to help.
            </p>
            <p className="text-xs text-gray-500 font-medium">
              Not sure what to ask? Choose something:
            </p>

            <div className="flex flex-col items-end space-y-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  goTo({
                    name: "ai-chat",
                    initialPrompt: `Summarize ${context.split(" › ")[0] || "this page"}`,
                  })
                }
                className="px-3.5 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer"
              >
                Summarize {context.split(" › ")[0] || "the page"}
              </button>

              <button
                type="button"
                onClick={() =>
                  goTo({ name: "ai-chat", initialPrompt: "Recommend related content" })
                }
                className="px-3.5 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer"
              >
                Recommend related content
              </button>

              {state.articles
                .filter((a) => a.approvalStatus === "approved")
                .slice(0, 2)
                .map((art) => (
                  <button
                    key={`chip-${art.id}`}
                    type="button"
                    onClick={() => goTo({ name: "ai-chat", initialPrompt: art.title })}
                    className="px-3.5 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer truncate max-w-[240px]"
                  >
                    {art.title}
                  </button>
                ))}
            </div>
          </div>
        </div>
        {!isEmpty && filtered.length > pageSize && (
          <div
            className="flex items-center justify-between shrink-0"
            style={{
              padding: "6px 12px",
              fontSize: 11,
              color: "#6B7280",
              borderTop: "0.8px solid #F3F4F6",
              backgroundColor: "#FAFAFA",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              className="disabled:text-gray-300"
            >
              ‹ Prev
            </button>
            <span aria-live="polite">
              Page {safePage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
              className="disabled:text-gray-300"
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      <HmsBottomBar
        role={role}
        onSendAiPrompt={(prompt) => goTo({ name: "ai-chat", initialPrompt: prompt })}
        onContact={onContact}
        onAdd={onAdd}
        onMyRequests={() => goTo({ name: "requests" })}
        onContentLibrary={onContentLibrary}
      />
    </>
  );
}

function HmsBottomBar({
  role,
  onSendAiPrompt,
  onContact,
  onAdd,
  onMyRequests,
  onContentLibrary,
}: {
  role: UserRole;
  onSendAiPrompt: (prompt: string) => void;
  onContact: () => void;
  onAdd: () => void;
  onMyRequests: () => void;
  onContentLibrary: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const handleCollapse = () => {
    setExpanded(false);
    setIsRecording(false);
    setText("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const prompt = text.trim();
    setText("");
    setExpanded(false);
    setIsRecording(false);
    onSendAiPrompt(prompt);
  };

  const handleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setExpanded(true);
      toast.info("Listening... Speak your question now 🎙️");
    } else {
      setIsRecording(false);
      setText("How do I view my site recordings?");
      toast.success("Voice transcribed! Click Send to ask AI.");
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  };

  const isCustomer = role === "customer";

  return (
    <div className="shrink-0 p-3 bg-white border-t border-gray-100 flex flex-col gap-2 relative">
      <style>{`
        @keyframes hmsGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes hmsPulseGlow {
          0%, 100% { box-shadow: 0 0 14px rgba(255, 0, 127, 0.6), 0 0 28px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 22px rgba(0, 240, 255, 0.85), 0 0 40px rgba(255, 0, 255, 0.7); }
        }
        @keyframes hmsShineSweep {
          0% { transform: translateX(-150%) rotate(25deg); }
          100% { transform: translateX(250%) rotate(25deg); }
        }
      `}</style>

      <svg width="0" height="0" className="absolute invisible">
        <defs>
          <linearGradient id="hms-mic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
          <linearGradient id="hms-chat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#DB2777" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
      </svg>

      <form
        onSubmit={handleSubmit}
        className="flex items-center justify-between gap-2 min-h-[44px] w-full relative"
      >
        <button
          type="button"
          onClick={toggleExpand}
          title="Ask AI Assistant"
          className={`relative rounded-full flex items-center justify-center shrink-0 transition-all duration-400 ease-out group overflow-hidden ${
            expanded
              ? "w-0 h-0 opacity-0 scale-50 -translate-x-4 pointer-events-none p-0 border-0"
              : "size-11 opacity-100 scale-100 translate-x-0 hover:scale-110 active:scale-95 cursor-pointer shadow-md"
          }`}
          style={{
            background:
              "linear-gradient(135deg, #ff007f 0%, #ff5e00 25%, #a855f7 50%, #00f0ff 75%, #ff007f 100%)",
            backgroundSize: "300% 300%",
            animation:
              "hmsGradientShift 3.5s ease infinite, hmsPulseGlow 2.5s ease-in-out infinite",
          }}
        >
          <span
            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
            style={{ animation: "hmsShineSweep 2.2s ease-in-out infinite" }}
          />
          <span className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20 pointer-events-none" />
          <span className="size-5 rounded-[9px] rounded-bl-[2px] bg-white/35 flex items-center justify-center backdrop-blur-md text-white font-black shadow-md group-hover:bg-white/50 transition-colors z-10">
            <Plus className="size-3.5 stroke-[3]" />
          </span>
        </button>

        <div
          className={`flex-1 flex items-center gap-2 bg-gray-50 border transition-all duration-400 ease-out origin-left rounded-2xl ${
            expanded
              ? `opacity-100 max-w-full scale-100 px-3 py-2 shadow-sm ${
                  isRecording
                    ? "border-red-400 ring-2 ring-red-500/20 bg-red-50/40"
                    : "border-purple-300 ring-2 ring-purple-500/20"
                }`
              : "opacity-0 max-w-0 scale-95 -translate-x-2 border-transparent p-0 overflow-hidden pointer-events-none"
          }`}
        >
          <button
            type="button"
            onClick={handleCollapse}
            title="Close message box"
            className={`text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200/60 transition-all duration-300 shrink-0 ${
              expanded ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            <X className="size-4" />
          </button>

          {isRecording ? (
            <div
              onClick={handleVoice}
              className="flex items-center gap-2 flex-1 cursor-pointer text-xs font-semibold text-purple-700 select-none"
            >
              <span className="size-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="truncate">Listening... Click mic to stop</span>
              <div className="flex items-center gap-0.5 ml-auto shrink-0">
                <span className="w-1 h-3.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-5 bg-pink-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="w-1 h-4 bg-purple-600 rounded-full animate-bounce [animation-delay:450ms]" />
              </div>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask AI or search help..."
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 transition-all duration-300">
          {expanded && (
            <button
              type="submit"
              disabled={!text.trim()}
              title="Send message to AI"
              className={`size-9 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-md transition-all duration-300 shrink-0 ${
                !text.trim()
                  ? "disabled:opacity-40 disabled:scale-100"
                  : "hover:scale-105 active:scale-95 opacity-100 scale-100"
              }`}
            >
              <ArrowUp className="size-4 stroke-[2.8]" />
            </button>
          )}

          <button
            type="button"
            onClick={handleVoice}
            title={isRecording ? "Click to stop recording" : "Voice search"}
            className={`size-9 rounded-full flex items-center justify-center border transition-all duration-200 shadow-sm hover:shadow hover:scale-105 active:scale-95 ${
              isRecording
                ? "bg-red-100 border-red-400 ring-2 ring-red-500/30 animate-pulse text-red-600"
                : "bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 border-purple-100/80 hover:border-purple-300"
            }`}
          >
            <Mic
              className={`size-4.5 stroke-[2.2] ${isRecording ? "text-red-600" : ""}`}
              style={{ stroke: isRecording ? undefined : "url(#hms-mic-grad)" }}
            />
          </button>

          {isCustomer ? (
            <button
              type="button"
              onClick={onContact}
              title="Contact support"
              className="size-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-orange-50/80 border border-pink-100/80 hover:border-pink-300 transition-all duration-200 shadow-sm hover:shadow hover:scale-105 active:scale-95"
            >
              <Headphones
                className="size-4.5 stroke-[2.2]"
                style={{ stroke: "url(#hms-chat-grad)" }}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              title="Add Help Article"
              className="size-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-orange-50/80 border border-pink-100/80 hover:border-pink-300 transition-all duration-200 shadow-sm hover:shadow hover:scale-105 active:scale-95"
            >
              <PlusCircle
                className="size-4.5 stroke-[2.2]"
                style={{ stroke: "url(#hms-chat-grad)" }}
              />
            </button>
          )}
        </div>
      </form>

      {isCustomer ? (
        <button
          type="button"
          onClick={onMyRequests}
          className="w-full text-center text-[11px] text-gray-500 hover:text-gray-800 hover:underline pt-0.5"
        >
          My requests
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 pt-0.5 text-[11px] text-gray-500">
          <button
            type="button"
            onClick={onContentLibrary}
            className="hover:text-gray-800 hover:underline flex items-center gap-1 font-medium text-purple-700"
          >
            <Library className="size-3" />
            {role === "admin" ? "Approvals" : "My Approvals"}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onMyRequests}
            className="hover:text-gray-800 hover:underline"
          >
            My requests
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- AI CHAT VIEW ----------

function AiChatView({
  initialPrompt,
  role,
  onBack,
  onOpenArticle,
  onContact,
  onAdd,
  onMyRequests,
  onContentLibrary,
}: {
  initialPrompt?: string;
  role: UserRole;
  onBack: () => void;
  onOpenArticle: (id: string) => void;
  onContact: () => void;
  onAdd: () => void;
  onMyRequests: () => void;
  onContentLibrary: () => void;
}) {
  const { state, context } = useHmsStore();
  const [messages, setMessages] = useState<
    Array<{ id: string; sender: "user" | "ai"; text: string; articles?: typeof state.articles }>
  >([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitialRef = useRef<string | null>(null);

  const contextTitle = context.split(" › ")[0] || "OomniEye Digital Twin";
  const videoName = context.includes(" › ")
    ? context.split(" › ").slice(1).join(" › ")
    : context;
  const isVideoContext =
    context.toLowerCase().includes(".mp4") ||
    context.toLowerCase().includes("recording") ||
    context.toLowerCase().includes("site recordings");

  const handleSend = (promptText: string) => {
    if (!promptText.trim()) return;
    const userMsg = { id: `u-${Date.now()}-${Math.random()}`, sender: "user" as const, text: promptText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const query = promptText.toLowerCase();
      const matched = state.articles.filter(
        (a) =>
          a.approvalStatus === "approved" &&
          (a.title.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query) ||
            a.tags.some((t) => t.toLowerCase().includes(query))),
      );

      let aiText = "Here is what I found in OomniEye Help Articles to answer your question:";
      if (query.includes("timeline") || query.includes("events") || query.includes("timestamp")) {
        aiText = `⏱️ Timestamp Breakdown & Key Events (${videoName}):\n\n` +
          `• 0:00 - 0:01: Video stream initialized at KL-Ar-L2 zone (Session 2).\n` +
          `• 0:01 - 0:03: Motion sensor auto-detects site patrol technician entry.\n` +
          `• 0:03 - 0:05: Verification complete; session recording saved & archived.`;
      } else if (query.includes("technical") || query.includes("specs") || query.includes("resolution")) {
        aiText = `⚙️ Technical Metadata & Resolution (${videoName}):\n\n` +
          `• File Name: ${videoName}\n` +
          `• Resolution: 1920x960 (HD Wide-angle Stream)\n` +
          `• Captured Date: May 1, 2026, 07:36 PM\n` +
          `• Session Duration: 5 sec · Session #2 (KL-Ar-L2)\n` +
          `• Session Window: Started May 1, 6:05 PM — Closed May 7, 7:52 PM`;
      } else if (query.includes("summarize") || query.includes("summary")) {
        if (isVideoContext) {
          aiText = `🎥 Executive Video Summary for ${videoName}:\n\n` +
            `• Overview: High-resolution 1920x960 site recording captured at KL-Ar-L2 (Session 2).\n` +
            `• Duration & Size: 5 seconds playback duration · 0.33 MB file size.\n` +
            `• Key Highlight: Automatic motion tracking active; site patrol check-in confirmed at Level 2.\n` +
            `• Recommended Action: Review timestamp breakdown below or export raw MP4 video log.`;
        } else {
          aiText = `📊 Executive Manager Summary for ${contextTitle}:\n\n` +
            `• Context & Scope: Real-time operational surveillance, digital twin tracking, and audit logging for ${contextTitle}.\n` +
            `• Session Activity: 14 active camera logs tracked across key facility sectors with instant scrubbing.\n` +
            `• Content Status: 12 approved & archived resources live, 2 items awaiting superadmin review.\n` +
            `• Recommended Action: Review pending items in Approvals or export high-definition playback recordings below.`;
        }
      } else if (query.includes("recommend") || query.includes("content")) {
        aiText = `💡 Recommended Manager Resources for ${contextTitle}:\n\n` +
          `• Operational Workflow Guide for ${contextTitle}\n` +
          `• Video Playback & Incident Scrubbing Manual\n` +
          `• Superadmin Audit & Compliance Workflows`;
      } else if (matched.length === 0) {
        aiText = `📌 Response Summary for "${promptText}":\n\n` +
          `• Overview: ${contextTitle} provides real-time digital twin monitoring and audit logging.\n` +
          `• Help Articles: Browse related guides below or use the search bar to locate specific operational procedures.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}-${Math.random()}`,
          sender: "ai" as const,
          text: aiText,
          articles: matched.length > 0 ? matched.slice(0, 3) : state.articles.slice(0, 2),
        },
      ]);
      setIsTyping(false);
    }, 750);
  };

  useEffect(() => {
    if (initialPrompt && sentInitialRef.current !== initialPrompt) {
      sentInitialRef.current = initialPrompt;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mockup-style Welcome Section */}
        <div className="space-y-3 pb-2">
          <p className="text-xs font-semibold text-gray-900 leading-relaxed">
            Hello! Curious about what you're watching? I'm here to help.
          </p>
          <p className="text-xs text-gray-600 font-medium">
            Not sure what to ask? Choose something:
          </p>

          {/* Clickable Quick Chips stacked on the right */}
          <div className="flex flex-col items-end space-y-2 pt-1">
            {isVideoContext ? (
              <>
                <button
                  onClick={() => handleSend(`Summarize ${videoName}`)}
                  className="px-4 py-2 rounded-full border border-purple-300 bg-purple-50 hover:bg-purple-100 text-xs font-medium text-purple-900 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer"
                >
                  Summarize this video
                </button>
                <button
                  onClick={() => handleSend("Video Timeline & Key Events")}
                  className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer"
                >
                  Video Timeline & Key Events
                </button>
                <button
                  onClick={() => handleSend("Technical Specs & Metadata")}
                  className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer"
                >
                  Technical Specs & Metadata
                </button>
              </>
            ) : (
              <button
                onClick={() => handleSend(`Summarize ${contextTitle}`)}
                className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer"
              >
                Summarize {contextTitle}
              </button>
            )}

            <button
              onClick={() => handleSend("Recommend related content")}
              className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer"
            >
              Recommend related content
            </button>

            {state.articles
              .filter((a) => a.approvalStatus === "approved")
              .slice(0, 2)
              .map((art) => (
                <button
                  key={art.id}
                  onClick={() => handleSend(art.title)}
                  className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-xs font-medium text-gray-800 transition-all shadow-xs hover:shadow active:scale-95 text-right cursor-pointer truncate max-w-[240px]"
                >
                  {art.title}
                </button>
              ))}
          </div>
        </div>

        {/* Chat Messages */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                m.sender === "user"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs"
                  : "bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-xs"
              }`}
            >
              {m.sender === "ai" && (
                <div className="flex items-center gap-1.5 mb-1.5 font-semibold text-[11px] text-purple-600">
                  <Sparkles className="size-3.5 text-purple-500" />
                  <span>HMS AI Assistant</span>
                </div>
              )}
              <p className="whitespace-pre-line">{m.text}</p>

              {m.articles && m.articles.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-gray-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Recommended Articles
                  </span>
                  {m.articles.map((art) => (
                    <button
                      key={art.id}
                      onClick={() => onOpenArticle(art.id)}
                      className="w-full text-left p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 transition-colors flex items-center justify-between gap-1 group"
                    >
                      <span className="truncate font-medium text-[11px]">{art.title}</span>
                      <ChevronRight className="size-3 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-xs px-3 py-2 text-xs text-gray-500 max-w-[140px] shadow-xs">
            <Sparkles className="size-3.5 text-purple-500 animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <HmsBottomBar
        role={role}
        onSendAiPrompt={handleSend}
        onContact={onContact}
        onAdd={onAdd}
        onMyRequests={onMyRequests}
        onContentLibrary={onContentLibrary}
      />
    </div>
  );
}

function EmptyStateBody() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: "80px 24px 24px" }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{ width: 36, height: 36, backgroundColor: "#F3F4F6" }}
      >
        <FileQuestion style={{ width: 18, height: 18, color: "#9CA3AF" }} />
      </div>
      <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
        No help available yet
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          marginTop: 6,
          lineHeight: 1.5,
          maxWidth: 220,
        }}
      >
        Search the library or contact the support team.
      </div>
    </div>
  );
}

// ---------- DETAIL VIEW ----------

function DetailView({
  article,
  role,
  goTo,
  onBack,
}: {
  article: HmsArticle;
  role: UserRole;
  goTo: (v: View) => void;
  onBack: () => void;
}) {
  const { approveArticle, unapproveArticle, archiveArticle, deleteArticle } = useHmsStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaKey, setMediaKey] = useState(0);

  useEffect(() => {
    setMediaError(false);
    setMediaKey((k) => k + 1);
  }, [article.id, article.contentUrl]);

  useEffect(() => {
    trackHmsEvent("article_view", {
      target: article.id,
      label: article.title,
      role,
      contextKey: article.contexts?.[0],
    });
  }, [article.id, article.title, article.contexts, role]);

  const onMediaError = useCallback(
    (kind: string) => {
      setMediaError(true);
      trackHmsEvent("article_media_error", { target: article.id, label: kind, role });
    },
    [article.id, role],
  );

  const retryMedia = useCallback(() => {
    setMediaError(false);
    setMediaKey((k) => k + 1);
  }, []);

  const isVideo = article.contentType === "video";
  const isPdf = article.contentType === "pdf";
  const isImage = article.contentType === "image";
  const hasUrl = !!article.contentUrl;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
      {/* Independently Scrollable Media/Image Area */}
      <div className="flex-1 min-h-0 overflow-y-auto hms-scroll bg-gray-50 flex items-center justify-center p-2">
        {isVideo && mediaError && (
          <MediaError kind="video" url={article.contentUrl} onRetry={retryMedia} />
        )}
        {isVideo && !mediaError && (
          hasUrl ? (
            <video
              controls
              playsInline
              preload="metadata"
              aria-label={`Video: ${article.title}`}
              onError={() => onMediaError("video")}
              key={`${article.contentUrl!}-${mediaKey}`}
              className="max-w-full max-h-full object-contain rounded"
              style={{ width: "100%", height: "100%", minHeight: 280, background: "#1a1a1a" }}
            >
              {article.contentUrl!.endsWith(".mp4") && (
                <source src={article.contentUrl!.replace(/\.mp4$/, ".webm")} type="video/webm" />
              )}
              <source src={article.contentUrl!} />
            </video>
          ) : (
            <div className="flex flex-col w-full" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="flex items-center justify-center" style={{ height: 260, position: "relative" }}>
                <button
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}
                >
                  <Play style={{ width: 20, height: 20 }} fill="white" />
                </button>
              </div>
              <div className="flex items-center" style={{ padding: "0 12px", height: 36, gap: 8, color: "rgba(255,255,255,0.8)", fontSize: 11, background: "rgba(0,0,0,0.6)" }}>
                <Play style={{ width: 12, height: 12 }} fill="white" />
                <span>0:00</span>
                <div className="flex-1 rounded-full" style={{ height: 4, backgroundColor: "rgba(255,255,255,0.25)" }}>
                  <div className="rounded-full" style={{ width: "28%", height: 4, backgroundColor: "white" }} />
                </div>
                <span>4:28</span>
                <Volume2 style={{ width: 14, height: 14 }} />
                <Maximize2 style={{ width: 14, height: 14 }} />
              </div>
            </div>
          )
        )}

        {isImage && mediaError && (
          <MediaError kind="image" url={article.contentUrl} onRetry={retryMedia} />
        )}
        {isImage && !mediaError && (
          hasUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                key={mediaKey}
                loading="lazy"
                decoding="async"
                onError={() => onMediaError("image")}
                src={article.contentUrl!}
                alt={article.title}
                className="max-w-full max-h-full object-contain block rounded shadow-xs"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-[240px] bg-gray-100 rounded">
              <ImageIcon style={{ width: 56, height: 56, color: "#D1D5DB" }} />
            </div>
          )
        )}

        {isPdf && (
          <div className="w-full h-full">
            {hasUrl ? (
              mediaError ? (
                <MediaError kind="document" url={article.contentUrl} onRetry={retryMedia} />
              ) : (
                <iframe
                  key={mediaKey}
                  loading="lazy"
                  onError={() => onMediaError("pdf")}
                  src={`${article.contentUrl!}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                  title={article.title}
                  className="w-full h-full min-h-[340px] border-none rounded bg-gray-100 block"
                />
              )
            ) : (
              <div style={{ backgroundColor: "#F3F4F6", padding: "16px 20px 32px" }}>
                <div style={{ height: 8, width: "60%", backgroundColor: "#D1D5DB", borderRadius: 2, marginBottom: 8 }} />
                <div style={{ height: 6, width: "90%", backgroundColor: "#E5E7EB", borderRadius: 2, marginBottom: 5 }} />
                <div style={{ height: 6, width: "80%", backgroundColor: "#E5E7EB", borderRadius: 2, marginBottom: 5 }} />
                <div style={{ height: 6, width: "70%", backgroundColor: "#E5E7EB", borderRadius: 2 }} />
              </div>
            )}
          </div>
        )}

        {article.contentType === "text" && (
          <div style={{ padding: "12px 16px", fontSize: 12, color: "#374151", lineHeight: 1.7, width: "100%" }}>
            <p style={{ marginBottom: 10 }}>{article.description}</p>
            {(article.body ?? []).map((section) => (
              <div key={section.heading} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#111827",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    marginBottom: 4,
                  }}
                >
                  {section.heading}
                </div>
                {section.paragraphs?.map((p) => (
                  <p key={p} style={{ marginBottom: 6 }}>
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul style={{ listStyle: "disc", paddingLeft: 16, margin: 0 }}>
                    {section.bullets.map((b) => (
                      <li key={b} style={{ marginBottom: 3 }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Metadata Panel */}
      <div className="shrink-0 bg-white border-t border-gray-100 p-3 space-y-0.5">
        {role !== "customer" && article.approvalStatus !== "approved" && (
          <div
            className="flex items-start mb-1.5"
            style={{
              padding: "6px 8px",
              gap: 7,
              backgroundColor: "#FFFBEB",
              border: "0.8px solid #FDE68A",
              borderRadius: 6,
            }}
          >
            <AlertTriangle style={{ width: 13, height: 13, color: "#B45309", marginTop: 1 }} />
            <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.45 }}>
              <strong style={{ fontWeight: 600 }}>Awaiting admin review.</strong> This resource is
              not yet visible to customers.
            </div>
          </div>
        )}

        <MetaRow label="Title" value={article.title} />
        <MetaRow label="Description" value={article.description} />
        <MetaRow label="Tags" value={article.tags.join(" · ")} />
        <MetaRow
          label={isVideo ? "Size / Format" : "Format"}
          value={
            isVideo
              ? `${formatBytes(article.sizeBytes)} · MP4 · ${formatDate(article.createdAt)}`
              : article.contentType === "pdf"
                ? `${article.pages ? `${article.pages} pages · ` : ""}PDF · ${formatDate(article.createdAt)}`
                : article.contentType === "image"
                  ? `Image · ${formatDate(article.createdAt)}`
                  : `Article · ${formatDate(article.createdAt)}`
          }
        />

        {role !== "customer" && article.approvalStatus === "approved" && article.approvedBy && (
          <div className="flex" style={{ padding: "4px 0" }}>
            <div style={{ width: 90, fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600 }}>
              Approval
            </div>
            <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 500 }}>
              ✓ Approved by {article.approvedBy} · {formatDate(article.approvedAt!)}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer Buttons */}
      <div className="shrink-0 bg-white border-t border-gray-100 p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <BackBtn onClick={onBack} />
          {role !== "customer" && (
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {role === "admin" ? (
                <>
                  {article.approvalStatus !== "approved" && (
                    <OutlineBtn
                      onClick={() => {
                        approveArticle(article.id);
                        toast.success("✓ Approved");
                      }}
                      style={{ border: "0.8px solid #BBF7D0", color: "#22C55E" }}
                    >
                      <Check style={{ width: 12, height: 12 }} /> Approve
                    </OutlineBtn>
                  )}
                  {article.approvalStatus !== "unapproved" && (
                    <OutlineBtn
                      onClick={() => {
                        unapproveArticle(article.id);
                        toast.success("Rejected");
                      }}
                      style={{ border: "0.8px solid #FECDD3", color: "#E11D48" }}
                    >
                      <XCircle style={{ width: 12, height: 12 }} /> Reject
                    </OutlineBtn>
                  )}
                </>
              ) : (
                <OutlineBtn onClick={() => goTo({ name: "add", editId: article.id })}>
                  <Pencil style={{ width: 12, height: 12 }} /> Edit
                </OutlineBtn>
              )}
              <OutlineBtn
                onClick={() => {
                  archiveArticle(article.id);
                  toast.success(article.archiveStatus === "active" ? "Archived" : "Unarchived");
                }}
              >
                <ArchiveIcon style={{ width: 12, height: 12 }} />{" "}
                {article.archiveStatus === "active" ? "Archive" : "Unarchive"}
              </OutlineBtn>
              {role === "admin" && (
                <OutlineBtn
                  onClick={() => setConfirmDelete(true)}
                  style={{ border: "0.8px solid #FECACA", color: "#EF4444" }}
                >
                  <Trash2 style={{ width: 12, height: 12 }} /> Delete
                </OutlineBtn>
              )}
            </div>
          )}
        </div>
        {confirmDelete && (
          <div
            className="flex items-center justify-between"
            style={{
              padding: "8px 12px",
              backgroundColor: "#FEF2F2",
              borderTop: "0.8px solid #FECACA",
              fontSize: 11,
              color: "#991B1B",
              borderRadius: 6,
            }}
          >
            <span>Delete this article?</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="underline">
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteArticle(article.id);
                  toast.success("Deleted");
                  onBack();
                }}
                className="font-semibold"
                style={{ color: "#EF4444" }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Friendly fallback shown when a video / image / PDF fails to load. */
function MediaError({
  kind,
  url,
  onRetry,
}: {
  kind: "video" | "image" | "document";
  url?: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center"
      style={{ height: 164, backgroundColor: "#F9FAFB", borderBottom: "0.8px solid #F3F4F6", padding: "0 20px", gap: 6 }}
    >
      <AlertTriangle style={{ width: 18, height: 18, color: "#D97706" }} />
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
        This {kind} could not be loaded
      </div>
      <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>
        The file may be unavailable or unsupported by your browser.
      </div>
      <div className="flex items-center" style={{ gap: 10, marginTop: 2 }}>
        <button
          onClick={onRetry}
          className="inline-flex items-center"
          style={{ gap: 4, fontSize: 11, color: "#3B6BF5" }}
        >
          <RotateCw style={{ width: 11, height: 11 }} /> Retry
        </button>
        {url && (
          <a href={url} download style={{ fontSize: 11, color: "#3B6BF5" }}>
            Download instead
          </a>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex" style={{ padding: "6px 0" }}>
      <div
        style={{
          width: 90,
          fontSize: 10,
          color: "#9CA3AF",
          textTransform: "uppercase",
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#374151", flex: 1, minWidth: 0 }}>{value}</div>
    </div>
  );
}

// ---------- CONTACT FORM ----------

const MAX_TAGS = 2;
/** Read-only recipient shown on the contact form. */
const HELPDESK = { name: "Helpdesk", email: "helpdesk@oomnieye.com" };
const MAX_ATTACHMENTS = 2;

function ContactForm({ onSubmitted, onCancel }: { onSubmitted: (id: string) => void; onCancel: () => void }) {
  const { state, userName, userEmail, userId, context, submitTicket } = useHmsStore();
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");
  const [attachments, setAttachments] = useState<HmsAttachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = subject.trim().length > 0;

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.length >= MAX_TAGS) {
      setNotice(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
    setNotice("");
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0 || files.length > room) {
      setNotice(`Only ${MAX_ATTACHMENTS} attachments are permitted`);
      if (room <= 0) return;
    }
    const arr = Array.from(files).slice(0, room);
    const results = await Promise.all(
      arr.map(
        (f) =>
          new Promise<HmsAttachment>((resolve) => {
            const r = new FileReader();
            r.onload = () =>
              resolve({ name: f.name, size: f.size, type: f.type, dataUrl: r.result as string });
            r.readAsDataURL(f);
          }),
      ),
    );
    setAttachments((prev) => [...prev, ...results].slice(0, MAX_ATTACHMENTS));
  }

  function submit() {
    if (!canSubmit) return;
    const id = generateTicketId(state.tickets);
    const now = new Date().toISOString();
    submitTicket({
      id,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      tags,
      status: "pending",
      authorId: userId,
      authorName: userName,
      authorEmail: userEmail,
      context,
      attachments,
      createdAt: now,
      updatedAt: now,
    });
    trackHmsEvent("ticket_created", { target: id, label: subject.trim(), contextKey: context });
    compactToast(`Ticket ${id} submitted`);
    onSubmitted(id);
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto hms-scroll" style={{ padding: "10px 12px" }}>
        {/* To — compact read-only recipient row */}
        <div
          className="flex items-center"
          style={{
            height: 30,
            border: "0.8px solid #E5E7EB",
            borderRadius: 6,
            backgroundColor: "#F9FAFB",
            padding: "0 10px",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            className="uppercase font-semibold shrink-0"
            style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.05em" }}
          >
            To
          </span>
          <span className="truncate" style={{ fontSize: 11, color: "#374151" }}>
            <strong style={{ fontWeight: 600 }}>{HELPDESK.name}</strong>
            <span style={{ color: "#9CA3AF" }}> — {HELPDESK.email}</span>
          </span>
        </div>


        {/* Subject */}
        <div style={{ marginBottom: 8 }}>
          <Label>Subject</Label>
          <input
            className={inputBase}
            style={inputStyle}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of the issue"
          />
        </div>

        {/* Description with inline counter */}
        <div style={{ marginBottom: 8 }}>
          <div className="flex items-baseline justify-between">
            <Label>Description</Label>
            <span style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 3 }}>
              {description.length}/200
            </span>
          </div>
          <textarea
            className={inputBase}
            style={{ ...textareaStyle, minHeight: 62 }}
            maxLength={200}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened, what you expected, and how to reproduce it"
          />
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 8 }}>
          <Label>Priority</Label>
          <PrioritySelect value={priority} onChange={setPriority} />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 8 }}>
          <Label>Tags (max {MAX_TAGS})</Label>
          <input
            className={inputBase}
            style={{ ...inputStyle, height: 30 }}
            value={tagInput}
            disabled={tags.length >= MAX_TAGS}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={tags.length >= MAX_TAGS ? "Limit reached" : "type + Enter"}
          />
        </div>


        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 8 }}>
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1"
                style={{
                  backgroundColor: "#F3F4F6",
                  border: "0.8px solid #E5E7EB",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: 11,
                  color: "#374151",
                }}
              >
                {t}
                <button
                  onClick={() => {
                    setTags(tags.filter((x) => x !== t));
                    setNotice("");
                  }}
                  style={{ color: "#9CA3AF" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Attachments */}
        <div>
          <Label>Attachments (max {MAX_ATTACHMENTS})</Label>
          <button
            onClick={() => {
              if (attachments.length >= MAX_ATTACHMENTS) {
                setNotice(`Only ${MAX_ATTACHMENTS} attachments are permitted`);
                return;
              }
              fileRef.current?.click();
            }}
            aria-label="Attach files — drop files here or click to browse"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (attachments.length >= MAX_ATTACHMENTS) {
                setNotice(`Only ${MAX_ATTACHMENTS} attachments are permitted`);
                return;
              }
              void handleFiles(e.dataTransfer.files);
              trackHmsEvent("upload_dropped", { label: "ticket-attachment" });
            }}
            className="w-full flex items-center justify-center transition-colors"
            style={{
              height: 30,
              backgroundColor: dragging ? "#EFF6FF" : "#F9FAFB",
              border: `0.8px dashed ${dragging ? "#3B6BF5" : "#E5E7EB"}`,
              borderRadius: 6,
              color: dragging ? "#3B6BF5" : "#9CA3AF",
              fontSize: 11,
              gap: 6,
            }}
          >
            <Upload style={{ width: 12, height: 12 }} />
            {dragging ? "Release to attach" : "Drop files here or click to attach"}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {attachments.map((a, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{
                marginTop: 5,
                height: 26,
                padding: "0 8px",
                border: "0.8px solid #E5E7EB",
                borderRadius: 6,
                fontSize: 11,
                gap: 8,
                backgroundColor: "white",
              }}
            >
              {a.type.startsWith("image") ? (
                <ImageIcon style={{ width: 12, height: 12, color: "#15803D" }} />
              ) : (
                <FileText style={{ width: 12, height: 12, color: "#1D4ED8" }} />
              )}
              <span className="flex-1 truncate" style={{ color: "#374151" }}>
                {a.name}
              </span>
              <span style={{ color: "#9CA3AF" }}>{formatBytes(a.size)}</span>
              <button
                onClick={() => {
                  setAttachments(attachments.filter((_, j) => j !== i));
                  setNotice("");
                }}
                style={{ color: "#9CA3AF" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {notice && (
          <div style={{ fontSize: 10, color: "#D97706", marginTop: 6 }}>{notice}</div>
        )}
      </div>
      <BtnRow>
        <OutlineBtn onClick={onCancel}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} disabled={!canSubmit}>
          Submit Request
        </PrimaryBtn>
      </BtnRow>
    </>
  );
}

// ---------- SUCCESS ----------

function SuccessView({ ticketId, onView, onBack }: { ticketId: string; onView: () => void; onBack: () => void }) {
  return (
    <>
      <div
        className="flex-1 flex flex-col items-center justify-center text-center"
        style={{ padding: "24px" }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,
            backgroundColor: "#ECFDF5",
            boxShadow: "0 0 0 8px rgba(34,197,94,0.07)",
            marginBottom: 16,
          }}
        >
          <CheckCircle2 style={{ width: 34, height: 34, color: "#22C55E" }} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
          Request submitted
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6, maxWidth: 230, lineHeight: 1.5 }}>
          Our support team has received your request and will respond shortly.
        </div>
        <div
          className="inline-flex items-center"
          style={{
            marginTop: 16,
            backgroundColor: "#F9FAFB",
            border: "0.8px solid #E5E7EB",
            color: "#6B7280",
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 10,
            gap: 5,
          }}
        >
          <span className="uppercase" style={{ letterSpacing: "0.06em" }}>Reference</span>
          <span style={{ color: "#374151", fontWeight: 600 }}>#{ticketId}</span>
        </div>
      </div>
      <BtnRow>
        <PrimaryBtn onClick={onView}>View my tickets</PrimaryBtn>
        <BackBtn onClick={onBack} />
      </BtnRow>
    </>
  );
}


// ---------- REQUESTS (customer + help-admin) ----------

const TICKET_STATUS_FILTERS: { v: string; l: string }[] = [
  { v: "all", l: "All" },
  { v: "pending", l: "Pending" },
  { v: "under-review", l: "Under Review" },
  { v: "resolved", l: "Resolved" },
];

function RequestsView({
  role,
  onBack,
  onNew,
  onOpen,
}: {
  role: UserRole;
  onBack: () => void;
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const { state, userId } = useHmsStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Customers only ever see their own requests; help admins see everything.
  const scoped =
    role === "customer" ? state.tickets.filter((t) => t.authorId === userId) : state.tickets;

  const list = scoped
    .filter((t) => (status === "all" ? true : t.status === status))
    .filter((t) =>
      !search
        ? true
        : t.subject.toLowerCase().includes(search.toLowerCase()) ||
          t.id.toLowerCase().includes(search.toLowerCase()),
    );
  const open = list.filter((t) => t.status === "pending" || t.status === "under-review").length;

  return (
    <>
      <SearchBar
        value={search}
        onChange={setSearch}
        filterCount={status === "all" ? 0 : 1}
        onToggleFilter={() => setFilterOpen((v) => !v)}
        filterOpen={filterOpen}
        placeholder="Search requests..."
      />
      <div className="relative flex-1 flex flex-col min-h-0">
        {filterOpen && (
          <div
            className="absolute z-10 bg-white"
            style={{
              top: 4,
              right: 8,
              width: 150,
              borderRadius: 8,
              border: "0.8px solid #E5E7EB",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              padding: "10px 12px",
            }}
            role="radiogroup"
            aria-label="Filter by status"
          >
            <Label>Status</Label>
            {TICKET_STATUS_FILTERS.map((o) => (
              <Radio
                key={o.v}
                selected={status === o.v}
                label={o.l}
                onClick={() => {
                  setStatus(o.v);
                  setFilterOpen(false);
                }}
              />
            ))}
          </div>
        )}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            height: 28,
            backgroundColor: "#FAFAFA",
            borderBottom: "0.8px solid #F3F4F6",
            padding: "0 12px",
          }}
        >
          <span
            className="uppercase font-semibold"
            style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.5px" }}
          >
            {role === "customer" ? "My requests" : "Resources raised"}
          </span>
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{open} open</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto hms-scroll flex flex-col" role="list">
          {list.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto space-y-2">
              <div className="size-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-1">
                <FileText className="size-5 stroke-[1.8]" />
              </div>
              <p className="text-xs font-semibold text-gray-900">
                {search || status !== "all" ? "No matching requests" : "No support requests yet"}
              </p>
              <p className="text-[11px] text-gray-500 max-w-[210px] leading-relaxed">
                {search || status !== "all"
                  ? "Try clearing your search query or changing status filters."
                  : "Submit a new support request to get help from our team."}
              </p>
              {!search && status === "all" && (
                <button
                  onClick={onNew}
                  className="mt-1 text-xs font-medium text-purple-600 hover:text-purple-700 underline underline-offset-2"
                >
                  + Create your first request
                </button>
              )}
            </div>
          )}
          {list.map((t) => (
            <button
              key={t.id}
              role="listitem"
              onClick={() => onOpen(t.id)}
              aria-label={`Open request ${t.subject}`}
              className="w-full text-left hover:bg-[#FAFAFA]"
              style={{ padding: "9px 12px", borderBottom: "0.8px solid #F3F4F6" }}
            >
              <div className="flex items-center" style={{ gap: 10 }}>
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate"
                    style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}
                    title={t.subject}
                  >
                    {t.subject}
                  </div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>
                    {role === "customer" ? "" : `${t.authorName} · `}
                    {formatDate(t.createdAt)}
                  </div>
                </div>
                <div className="flex items-center shrink-0" style={{ gap: 6 }}>
                  <TicketStatusBadge status={t.status} />
                  <PriorityBadge p={t.priority} variant="outline" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="shrink-0 p-3 bg-white border-t border-gray-100 flex items-center justify-between">
        <BackBtn onClick={onBack} />
        <PrimaryBtn onClick={onNew}>+ New Request</PrimaryBtn>
      </div>
    </>
  );
}

// ---------- REQUEST DETAIL ----------

function RequestDetailView({
  ticket,
  role,
  onBack,
  onCreateHelp,
}: {
  ticket: HmsTicket;
  role: UserRole;
  onBack: () => void;
  onCreateHelp: () => void;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto hms-scroll" style={{ padding: "12px" }}>
        <div className="flex items-start" style={{ gap: 8 }}>
          <div className="flex-1 min-w-0" style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
            {ticket.subject}
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>
        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>
          #{ticket.id} · {ticket.authorName} · {formatDate(ticket.createdAt)}
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>Description</Label>
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
            {ticket.description || "—"}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>Priority</Label>
          <PriorityBadge p={ticket.priority} variant="outline" />
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>Tags</Label>
          {ticket.tags.length === 0 ? (
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>—</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    backgroundColor: "#F3F4F6",
                    border: "0.8px solid #E5E7EB",
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontSize: 11,
                    color: "#374151",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>Context</Label>
          <div style={{ fontSize: 12, color: "#374151" }}>{ticket.context || "—"}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>Attachments</Label>
          {ticket.attachments.length === 0 ? (
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>None</span>
          ) : (
            ticket.attachments.map((a, i) => (
              <a
                key={i}
                href={a.dataUrl}
                download={a.name}
                className="flex items-center hover:bg-gray-50"
                style={{
                  marginTop: 5,
                  height: 28,
                  padding: "0 8px",
                  border: "0.8px solid #E5E7EB",
                  borderRadius: 6,
                  fontSize: 11,
                  gap: 8,
                }}
              >
                <Paperclip style={{ width: 12, height: 12, color: "#6B7280" }} />
                <span className="flex-1 truncate" style={{ color: "#374151" }}>
                  {a.name}
                </span>
                <span style={{ color: "#9CA3AF" }}>{formatBytes(a.size)}</span>
              </a>
            ))
          )}
        </div>
      </div>
      <BtnRow>
        <BackBtn onClick={onBack} />
        {role !== "customer" && (
          <PrimaryBtn onClick={onCreateHelp}>
            <Upload style={{ width: 12, height: 12 }} /> Create help
          </PrimaryBtn>
        )}
      </BtnRow>
    </>
  );
}

// ---------- ADD / EDIT HELP ----------

function AddHelpView({
  editId,
  prefill,
  onDone,
  onCancel,
}: {
  editId?: string;
  /** Seed values when authoring help in response to a customer request. */
  prefill?: { title?: string; description?: string; tags?: string[]; priority?: Priority };
  onDone: () => void;
  onCancel: () => void;
}) {
  const { state, context, contextKey, userId, userName, role, addArticle, updateArticle } =
    useHmsStore();
  const existing = editId ? state.articles.find((a) => a.id === editId) : undefined;


  const [file, setFile] = useState<{ name: string; size: number; type: string; dataUrl: string | null }| null>(
    existing
      ? {
          name: `${existing.title}.${existing.contentType === "pdf" ? "pdf" : existing.contentType === "video" ? "mp4" : "png"}`,
          size: existing.sizeBytes ?? 0,
          type: existing.contentType,
          dataUrl: existing.contentUrl,
        }
      : null,
  );
  const [title, setTitle] = useState(existing?.title ?? prefill?.title ?? "");
  const [description, setDescription] = useState(
    existing?.description ?? prefill?.description ?? "",
  );
  const [priority, setPriority] = useState<Priority>(
    existing?.priority ?? prefill?.priority ?? "medium",
  );
  const [tags, setTags] = useState<string[]>(
    existing?.tags ?? (prefill?.tags ?? []).slice(0, MAX_TAGS),
  );
  const [tagInput, setTagInput] = useState("");
  /** Admins can choose to publish immediately instead of queueing for approval. */
  const [autoApprove, setAutoApprove] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function detectContentType(name: string, mime?: string): ContentType {
    if (mime?.startsWith("video")) return "video";
    if (mime === "application/pdf") return "pdf";
    if (mime?.startsWith("image")) return "image";
    const ext = name.toLowerCase().split(".").pop() ?? "";
    if (["mp4", "mov", "webm"].includes(ext)) return "video";
    if (ext === "pdf") return "pdf";
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
    return "text";
  }

  function handleFile(f: File | null) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ name: f.name, size: f.size, type: f.type, dataUrl: reader.result as string });
    };
    reader.readAsDataURL(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  const canSave = !!file && title.trim().length > 0;

  function save() {
    if (!canSave || !file) return;
    const now = new Date().toISOString();
    const ct = detectContentType(file.name, file.type);
    if (editId && existing) {
      // Edited content loses its approval: an admin must review it again.
      const resetApproval = role !== "admin" && existing.approvalStatus === "approved";
      updateArticle(editId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        tags,
        contentType: ct,
        sizeBytes: file.size,
        contentUrl: file.dataUrl,
        ...(resetApproval
          ? { approvalStatus: "pending" as const, approvedBy: null, approvedAt: null }
          : {}),
      });
      toast.success(
        resetApproval ? "Updated — pending approval again" : "Help item updated",
      );
    } else {
      addArticle({
        id: `art-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        contentType: ct,
        contentUrl: file.dataUrl,
        relatedContext: context,
        contexts: [contextKey],
        approvalStatus: role === "admin" && autoApprove ? "approved" : "pending",
        archiveStatus: "active",
        authorId: userId,
        authorName: userName,
        approvedBy: role === "admin" && autoApprove ? userName : null,
        approvedAt: role === "admin" && autoApprove ? now : null,
        createdAt: now,
        updatedAt: now,
        tags,
        priority,
        sizeBytes: file.size,
      });
      trackHmsEvent("article_created", { label: title.trim(), role, contextKey });
      toast.success(
        role === "admin" && autoApprove
          ? "Help item saved and published"
          : "Help item saved — pending approval",
      );
    }
    onDone();
  }


  return (
    <>
      <div className="flex-1 overflow-y-auto hms-scroll" style={{ padding: "10px 12px" }}>
        {/* Auto-approve — admin only */}
        {role === "admin" && !editId && (
          <button
            type="button"
            role="switch"
            aria-checked={autoApprove}
            onClick={() => setAutoApprove((v) => !v)}
            className="w-full flex items-center justify-between"
            style={{
              marginBottom: 8,
              padding: "8px 10px",
              borderRadius: 6,
              border: "0.8px solid #E5E7EB",
              backgroundColor: autoApprove ? "#ECFDF5" : "#FAFAFA",
            }}
          >
            <span className="text-left">
              <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#111827" }}>
                Auto-approve
              </span>
              <span style={{ display: "block", fontSize: 10, color: "#6B7280" }}>
                {autoApprove ? "Publishes immediately" : "Saves as pending approval"}
              </span>
            </span>
            <span
              style={{
                width: 30,
                height: 17,
                borderRadius: 999,
                backgroundColor: autoApprove ? "#10B981" : "#D1D5DB",
                position: "relative",
                flexShrink: 0,
                transition: "background-color 120ms ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: autoApprove ? 15 : 2,
                  width: 13,
                  height: 13,
                  borderRadius: 999,
                  backgroundColor: "#fff",
                  transition: "left 120ms ease",
                }}
              />
            </span>
          </button>
        )}

        {/* Title */}
        <div style={{ marginBottom: 8 }}>
          <Label>Title</Label>
          <input
            className={inputBase}
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short, descriptive name for this help item"
          />
        </div>

        {/* Description with inline counter — mirrors the support request form */}
        <div style={{ marginBottom: 8 }}>
          <div className="flex items-baseline justify-between">
            <Label>Description</Label>
            <span style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 3 }}>
              {description.length}/200
            </span>
          </div>
          <textarea
            className={inputBase}
            style={{ ...textareaStyle, minHeight: 62 }}
            maxLength={200}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this resource explains, in customer-facing language"
          />
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 8 }}>
          <Label>Priority</Label>
          <PrioritySelect value={priority} onChange={setPriority} />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 8 }}>
          <Label>Tags (max {MAX_TAGS})</Label>
          <input
            className={inputBase}
            style={{ ...inputStyle, height: 30 }}
            value={tagInput}
            disabled={tags.length >= MAX_TAGS}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const t = tagInput.trim().toLowerCase();
                if (t && !tags.includes(t) && tags.length < MAX_TAGS) setTags([...tags, t]);
                setTagInput("");
              }
            }}
            placeholder={tags.length >= MAX_TAGS ? "Limit reached" : "type + Enter"}
          />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 8 }}>
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1"
                style={{
                  backgroundColor: "#F3F4F6",
                  border: "0.8px solid #E5E7EB",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: 11,
                  color: "#374151",
                }}
              >
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} style={{ color: "#9CA3AF" }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Attachment — same compact dropzone as the support request form */}
        <div>
          <Label>Resource file</Label>
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Upload help file — drop a file here or click to browse"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0] ?? null;
              if (f) {
                handleFile(f);
                trackHmsEvent("upload_dropped", { label: f.type || f.name, role });
              }
            }}
            className="w-full flex items-center justify-center transition-colors"
            style={{
              height: 30,
              backgroundColor: dragging ? "#EFF6FF" : "#F9FAFB",
              border: `0.8px dashed ${dragging ? "#3B6BF5" : "#E5E7EB"}`,
              borderRadius: 6,
              color: dragging ? "#3B6BF5" : "#9CA3AF",
              fontSize: 11,
              gap: 6,
            }}
          >
            <Upload style={{ width: 12, height: 12 }} />
            {dragging ? "Release to upload" : "Drop a file here or click to browse"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*,application/pdf,image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <div
              className="flex items-center"
              style={{
                marginTop: 5,
                height: 26,
                padding: "0 8px",
                border: "0.8px solid #E5E7EB",
                borderRadius: 6,
                fontSize: 11,
                gap: 8,
                backgroundColor: "white",
              }}
            >
              <FileText style={{ width: 12, height: 12, color: "#6B7280" }} />
              <span className="flex-1 truncate" style={{ color: "#374151" }}>
                {file.name}
              </span>
              <span style={{ color: "#9CA3AF" }}>{formatBytes(file.size)}</span>
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="Replace uploaded file"
                style={{ color: "#3B6BF5", fontSize: 11 }}
              >
                Replace
              </button>
              <button onClick={() => setFile(null)} aria-label="Remove uploaded file" style={{ color: "#9CA3AF" }}>
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-3 bg-white border-t border-gray-100 flex items-center justify-end gap-2.5">
        <OutlineBtn onClick={onCancel}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={save} disabled={!canSave}>
          {role === "admin" && autoApprove ? "Publish" : "Send Approval"}
        </PrimaryBtn>
      </div>
    </>
  );
}

// ---------- MAIN PANEL ----------

export function HmsPanel() {
  const {
    isOpen,
    openPanel,
    closePanel,
    context,
    contextKey,
    role,
    state,
    setContext,
    clearOverride,
    panelRequest,
    consumePanelRequest,
  } = useHmsStore();
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ name: "list" });
  /** View to return to when leaving the tickets screen — keeps context continuous. */
  const [returnView, setReturnView] = useState<View>({ name: "list" });

  // Reset view when active context changes or panel closes.
  useEffect(() => {
    setView({ name: "list" });
    setReturnView({ name: "list" });
  }, [context]);

  useEffect(() => {
    if (!isOpen) {
      setView({ name: "list" });
    }
  }, [isOpen]);

  // Deep-link requests from outside the panel (e.g. the admin content library).
  useEffect(() => {
    if (!panelRequest) return;
    setView(
      panelRequest.type === "article"
        ? { name: "detail", id: panelRequest.id }
        : { name: "add", editId: panelRequest.editId },
    );
    consumePanelRequest();
  }, [panelRequest, consumePanelRequest]);

  const openRequests = (from: View) => {
    setReturnView(from.name === "success" ? { name: "list" } : from);
    setView({ name: "requests" });
  };

  const article =
    view.name === "detail" ? state.articles.find((a) => a.id === view.id) : undefined;
  const ticket =
    view.name === "request" ? state.tickets.find((t) => t.id === view.id) : undefined;

  let crumb = context;
  let onBack: (() => void) | undefined;

  if (view.name === "detail" && article) {
    crumb = `${context.split(" › ")[0]} › ${article.title.length > 12 ? article.title.slice(0, 12) : article.title}`;
    onBack = () => setView({ name: "list" });
  } else if (view.name === "contact") {
    crumb = `${context.split(" › ")[0]} › Contact`;
    onBack = () => setView({ name: "list" });
  } else if (view.name === "add") {
    crumb = `${context.split(" › ")[0]} › ${view.editId ? "Edit Help" : "Add Help"}`;
    onBack = () => setView({ name: "list" });
  } else if (view.name === "requests") {
    crumb = `${context.split(" › ")[0]} › ${role === "customer" ? "My Requests" : "Resources"}`;
    onBack = () => setView({ name: "list" });
  } else if (view.name === "request" && ticket) {
    crumb = `${role === "customer" ? "My Requests" : "Resources"} › ${ticket.id}`;
    onBack = () => setView({ name: "requests" });
  } else if (view.name === "ai-chat") {
    crumb = `${context.split(" › ")[0]} › HMS AI Chat`;
    onBack = () => setView({ name: "list" });
  } else if (view.name === "success") {
    crumb = `${context.split(" › ")[0]} › Submitted`;
  }

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ width: 320, height: 530 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const userPosRef = useRef<{ x: number; y: number } | null>(null);

  // Resize for Preview ("detail") and Add/Edit ("add") while preserving right-click location for normal views
  useEffect(() => {
    if (view.name === "detail") {
      const fixedW = Math.min(820, window.innerWidth - 32);
      const fixedH = Math.min(620, window.innerHeight - 40);
      setSize({ width: fixedW, height: fixedH });
      setPos({
        x: Math.max(10, Math.floor((window.innerWidth - fixedW) / 2)),
        y: Math.max(10, Math.floor((window.innerHeight - fixedH) / 2)),
      });
    } else if (view.name === "add") {
      const fixedW = Math.min(560, window.innerWidth - 32);
      const fixedH = Math.min(480, window.innerHeight - 40);
      setSize({ width: fixedW, height: fixedH });
      setPos({
        x: Math.max(10, Math.floor((window.innerWidth - fixedW) / 2)),
        y: Math.max(10, Math.floor((window.innerHeight - fixedH) / 2)),
      });
    } else {
      setSize({ width: 320, height: 530 });
      if (userPosRef.current) {
        const clampedX = Math.max(10, Math.min(window.innerWidth - 320 - 10, userPosRef.current.x));
        const clampedY = Math.max(10, Math.min(window.innerHeight - 530 - 10, userPosRef.current.y));
        setPos({ x: clampedX, y: clampedY });
      }
    }
  }, [view.name]);

  // Reset view and user position reference when the panel closes (delay pos reset until fade-out finishes)
  useEffect(() => {
    if (!isOpen) {
      setView({ name: "list" });
      userPosRef.current = null;
      const timer = setTimeout(() => {
        setPos(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const initialX = pos ? pos.x : Math.max(10, window.innerWidth - size.width - 24);
      const initialY = pos ? pos.y : Math.max(10, window.innerHeight - size.height - 76);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, initialX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, initialY + deltaY));
        const newPos = { x: newX, y: newY };
        userPosRef.current = newPos;
        setPos(newPos);
      };

      const onMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [pos, size],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: "e" | "s" | "se" = "se") => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = size.width;
      const startH = size.height;
      const currentY = pos ? pos.y : Math.max(10, window.innerHeight - size.height - 76);
      const currentX = pos ? pos.x : Math.max(10, window.innerWidth - size.width - 24);
      const maxH = Math.max(380, window.innerHeight - currentY);
      const maxW = Math.max(280, window.innerWidth - currentX);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const newW = direction === "s" ? startW : Math.max(280, Math.min(maxW, startW + deltaX));
        const newH = direction === "e" ? startH : Math.max(380, Math.min(maxH, startH + deltaY));
        setSize({ width: newW, height: newH });
      };

      const onMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [pos, size],
  );

  useEffect(() => {
    if (isOpen) trackHmsEvent("panel_open", { role, contextKey: context });
  }, [isOpen, role, context]);

  const panelRef = useRef<HTMLDivElement>(null);

  // Global Click-Outside Event Listener to close modal box when user clicks outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closePanel]);

  // Global Right-Click Event Listener to position and open HMS modal at right-click mouse location
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Do not block right clicks inside text inputs or textareas
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      e.preventDefault();

      let el: HTMLElement | null = target;
      let detectedContext: string | null = null;
      while (el && el !== document.body) {
        const ctx = el.getAttribute?.("data-hms-context");
        if (ctx) {
          detectedContext = ctx;
          break;
        }
        el = el.parentElement;
      }

      if (detectedContext) {
        const label = labelForContext(detectedContext);
        setContext(detectedContext, label);
      } else {
        clearOverride();
      }

      setView({ name: "list" });
      const clampedX = Math.max(10, Math.min(window.innerWidth - size.width - 10, e.clientX - 20));
      const clampedY = Math.max(10, Math.min(window.innerHeight - size.height - 10, e.clientY - 20));
      const rightClickPos = { x: clampedX, y: clampedY };
      userPosRef.current = rightClickPos;
      setPos(rightClickPos);
      openPanel();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, [openPanel, size.width, size.height, setContext, clearOverride]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={`Help Management System — ${crumb}`}
      aria-hidden={!isOpen}
      className={`fixed flex flex-col bg-white ${
        isDragging || isResizing ? "" : "transition-opacity transition-transform duration-150 ease-out"
      } ${
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
      style={{
        left: pos ? pos.x : undefined,
        right: pos ? undefined : 24,
        top: pos ? pos.y : undefined,
        bottom: pos ? undefined : 76,
        width: size.width,
        height: size.height,
        zIndex: 99999,
        pointerEvents: isOpen ? "auto" : "none",
        borderRadius: 10,
        boxShadow: "0 4px 6px rgba(0,0,0,0.06), 0 10px 28px rgba(0,0,0,0.13)",
        overflow: "hidden",
        userSelect: isDragging || isResizing ? "none" : undefined,
      }}
    >
      <Header crumb={crumb} onBack={onBack} onClose={closePanel} onDragStart={handleDragStart} />

      {view.name === "list" && (
        <ListView
          role={role}
          onOpenArticle={(id) => setView({ name: "detail", id })}
          onContact={() => setView({ name: "contact" })}
          onAdd={() => setView({ name: "add" })}
          onResources={() => openRequests({ name: "list" })}
          onSearchLibrary={() => setContext("global-search")}
          onContentLibrary={() => {
            closePanel();
            navigate({ to: "/admin", search: { tab: "content" } });
          }}
          goTo={setView}
        />
      )}

      {view.name === "detail" && article && (
        <DetailView
          article={article}
          role={role}
          goTo={setView}
          onBack={() => setView({ name: "list" })}
        />
      )}

      {view.name === "contact" && (
        <ContactForm
          onSubmitted={(id) => setView({ name: "success", ticketId: id })}
          onCancel={() => setView({ name: "list" })}
        />
      )}

      {view.name === "success" && (
        <SuccessView
          ticketId={view.ticketId}
          onView={() => openRequests({ name: "success", ticketId: view.ticketId })}
          onBack={() => setView({ name: "list" })}
        />
      )}

      {view.name === "requests" && (
        <RequestsView
          role={role}
          onBack={() => setView(returnView)}
          onNew={() => setView({ name: "contact" })}
          onOpen={(id) => setView({ name: "request", id })}
        />
      )}

      {view.name === "request" && ticket && (
        <RequestDetailView
          ticket={ticket}
          role={role}
          onBack={() => setView({ name: "requests" })}
          onCreateHelp={() =>
            setView({
              name: "add",
              prefill: {
                title: ticket.subject,
                description: ticket.description,
                tags: ticket.tags,
                priority: ticket.priority,
              },
            })
          }
        />
      )}

      {view.name === "add" && (
        <AddHelpView
          editId={view.editId}
          prefill={view.prefill}
          onDone={() => setView({ name: "list" })}
          onCancel={() => setView({ name: "list" })}
        />
      )}

      {view.name === "ai-chat" && (
        <AiChatView
          initialPrompt={view.initialPrompt}
          role={role}
          onBack={() => setView({ name: "list" })}
          onOpenArticle={(id) => setView({ name: "detail", id })}
          onContact={() => setView({ name: "contact" })}
          onAdd={() => setView({ name: "add" })}
          onMyRequests={() => setView({ name: "requests" })}
          onContentLibrary={() => {
            closePanel();
            navigate({ to: "/admin", search: { tab: "content" } });
          }}
        />
      )}

      {/* Right Edge Horizontal Resize Handle */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "e")}
        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-purple-500/10 z-40"
        title="Resize width horizontally"
      />

      {/* Bottom Edge Vertical Resize Handle */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "s")}
        className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-purple-500/10 z-40"
        title="Resize height vertically"
      />

      {/* Bottom-Right Corner Resize Handle */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "se")}
        className="absolute bottom-0 right-0 size-4 cursor-se-resize flex items-center justify-center z-50 text-gray-400 hover:text-purple-600 transition-colors select-none"
        title="Resize width & height"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
