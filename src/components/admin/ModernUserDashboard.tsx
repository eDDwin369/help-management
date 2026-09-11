import { useState, useEffect, useRef } from "react";
import {
  ClipboardCheck,
  Clock,
  AlertCircle,
  Activity,
  Plus,
  ArrowRight,
  User,
  CheckCircle2,
  Trash2,
  GripVertical,
  Columns,
  RotateCcw,
  LifeBuoy,
  Ticket as TicketIcon,
  BarChart3,
  Library,
  Users as UsersIcon,
  AlertTriangle,
  Info,
  LayoutGrid,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddWidgetModal } from "@/components/dashboard/AddWidgetModal";
import {
  ALL_WIDGETS,
  getWidgetGridClass,
  getWidgetWidthLabel,
  WIDTH_STEPS,
  type WidgetWidth,
  type WidgetCategory,
  type UserWidgetState,
} from "@/lib/widget-registry";
import { useHmsStore } from "@/components/hms/hmsStore";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApprovalQueueItem {
  id: string;
  avatar: string;
  title: string;
  status: "In Review" | "Pending" | "Active";
  timeLeft: string;
}

interface LiveActivityItem {
  id: string;
  avatar: string;
  name: string;
  action: string;
  timeAgo: string;
}

const QUEUE_ITEMS: ApprovalQueueItem[] = [
  {
    id: "q-1",
    avatar: "AR",
    title: "Digital twin sync error",
    status: "In Review",
    timeLeft: "2h left",
  },
  {
    id: "q-2",
    avatar: "RM",
    title: "Sensor latency spike",
    status: "Pending",
    timeLeft: "45 min",
  },
  {
    id: "q-3",
    avatar: "PS",
    title: "Widget configuration issue",
    status: "Active",
    timeLeft: "6h left",
  },
  {
    id: "q-4",
    avatar: "VP",
    title: "GPS telemetry timeout",
    status: "Pending",
    timeLeft: "12h left",
  },
  {
    id: "q-5",
    avatar: "KA",
    title: "Access permission issue",
    status: "In Review",
    timeLeft: "1h left",
  },
];

const LIVE_ACTIVITIES: LiveActivityItem[] = [
  { id: "a-1", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "a-2", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "a-3", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "a-4", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "a-5", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
];

const CARDS: Array<{
  id: number;
  category: WidgetCategory;
  count: number;
  label: string;
  icon: typeof ClipboardCheck;
  iconBg: string;
  activeBorderColor: string;
  activeTextColor: string;
}> = [
  {
    id: 0,
    category: "for_review",
    count: 83,
    label: "For Review",
    icon: ClipboardCheck,
    iconBg: "bg-sky-100 text-sky-500",
    activeBorderColor: "border-2 border-blue-500 shadow-md shadow-blue-500/10",
    activeTextColor: "text-sky-500",
  },
  {
    id: 1,
    category: "for_follow_up",
    count: 112,
    label: "For Follow up",
    icon: Clock,
    iconBg: "bg-amber-100 text-amber-500",
    activeBorderColor: "border-2 border-amber-500 shadow-md shadow-amber-500/10",
    activeTextColor: "text-amber-500",
  },
  {
    id: 2,
    category: "for_info",
    count: 47,
    label: "For Info",
    icon: AlertCircle,
    iconBg: "bg-cyan-100 text-cyan-500",
    activeBorderColor: "border-2 border-cyan-500 shadow-md shadow-cyan-500/10",
    activeTextColor: "text-cyan-500",
  },
  {
    id: 3,
    category: "for_monitoring",
    count: 112,
    label: "For Monitoring",
    icon: Activity,
    iconBg: "bg-emerald-100 text-emerald-500",
    activeBorderColor: "border-2 border-emerald-500 shadow-md shadow-emerald-500/10",
    activeTextColor: "text-emerald-500",
  },
];

const CATEGORY_STORAGE_KEY = "modern_dashboard_category_widgets_v6";

const EMPTY_CATEGORY_LAYOUT: Record<WidgetCategory, UserWidgetState[]> = {
  for_review: [],
  for_follow_up: [],
  for_info: [],
  for_monitoring: [],
};

interface DashboardWidgetCardProps {
  id: string;
  title: string;
  width: WidgetWidth;
  headerAction?: React.ReactNode;
  onWidthChange: (id: string, width: WidgetWidth) => void;
  onDeleteRequest: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging?: boolean;
  isDraggingOver?: boolean;
  children: React.ReactNode;
  customHeader?: React.ReactNode;
}

function DashboardWidgetCard({
  id,
  title,
  width,
  headerAction,
  onWidthChange,
  onDeleteRequest,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  isDraggingOver = false,
  children,
  customHeader,
}: DashboardWidgetCardProps) {
  const gridClass = getWidgetGridClass(width);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const initialWidthIndex = useRef<number>(0);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    initialWidthIndex.current = WIDTH_STEPS.indexOf(width);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartX.current;
      const stepDelta = Math.round(deltaX / 140);
      let newIndex = initialWidthIndex.current + stepDelta;
      newIndex = Math.max(0, Math.min(WIDTH_STEPS.length - 1, newIndex));

      const newWidth = WIDTH_STEPS[newIndex];
      if (newWidth !== width) {
        onWidthChange(id, newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      draggable={!isResizing}
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between overflow-visible ${gridClass} ${
        isDragging
          ? "opacity-30 scale-[0.98] border-dashed border-blue-500 shadow-none"
          : isDraggingOver
          ? "border-2 border-dashed border-blue-500 bg-blue-50/40 dark:bg-blue-950/20"
          : "border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
      } ${isResizing ? "ring-2 ring-blue-500 shadow-lg" : ""}`}
    >
      {/* Widget Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing p-1 rounded-md text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Drag to reorder widget"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Custom Header or Default Header Title */}
          {customHeader ? (
            customHeader
          ) : (
            <h2 className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {title}
            </h2>
          )}
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {headerAction}

          {/* Width Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Change widget width"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs font-sans">
              <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Resize Widget Width
              </DropdownMenuLabel>
              {WIDTH_STEPS.map((wStep) => (
                <DropdownMenuItem
                  key={wStep}
                  onClick={() => onWidthChange(id, wStep)}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <span>{getWidgetWidthLabel(wStep)}</span>
                  {width === wStep && (
                    <span className="ml-auto text-blue-600 font-bold">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Trash Icon (subtle, visible on hover) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onDeleteRequest(id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-150"
                title="Delete widget"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Delete widget
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Widget Inner Content */}
      <div className="flex-1 flex flex-col pt-2 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* Interactive Right Edge Drag-Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 right-0 w-2.5 h-full cursor-col-resize hover:bg-blue-500/20 group-hover:bg-blue-500/10 transition-colors z-20 flex items-center justify-center rounded-r-2xl"
        title="Drag left/right to resize widget width"
      >
        <div className="w-1 h-8 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

export function ModernUserDashboard() {
  const [selectedCardId, setSelectedCardId] = useState<number>(0);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const activeCard = CARDS.find((c) => c.id === selectedCardId) || CARDS[0];

  // Category Persistence State (Starts completely empty for all cards)
  const [categoryWidgets, setCategoryWidgets] = useState<Record<WidgetCategory, UserWidgetState[]>>(() => {
    if (typeof window === "undefined") return EMPTY_CATEGORY_LAYOUT;
    try {
      const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (!raw) return EMPTY_CATEGORY_LAYOUT;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          for_review: parsed.for_review || [],
          for_follow_up: parsed.for_follow_up || [],
          for_info: parsed.for_info || [],
          for_monitoring: parsed.for_monitoring || [],
        };
      }
    } catch {}
    return EMPTY_CATEGORY_LAYOUT;
  });

  const saveCategoryLayout = (updated: Record<WidgetCategory, UserWidgetState[]>) => {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const currentWidgets = categoryWidgets[activeCard.category] || [];

  const handleWidthChange = (id: string, width: WidgetWidth) => {
    const cat = activeCard.category;
    const updatedList = (categoryWidgets[cat] || []).map((w) =>
      w.id === id ? { ...w, width } : w
    );
    const updatedCatWidgets = {
      ...categoryWidgets,
      [cat]: updatedList,
    };
    setCategoryWidgets(updatedCatWidgets);
    saveCategoryLayout(updatedCatWidgets);
  };

  const handleDeleteRequest = (id: string) => {
    setWidgetToDelete(id);
  };

  const confirmDeleteWidget = () => {
    if (!widgetToDelete) return;
    const config = ALL_WIDGETS.find((w) => w.id === widgetToDelete);
    const cat = activeCard.category;
    const updatedList = (categoryWidgets[cat] || [])
      .filter((w) => w.id !== widgetToDelete)
      .map((w, idx) => ({ ...w, order: idx }));

    const updatedCatWidgets = {
      ...categoryWidgets,
      [cat]: updatedList,
    };

    setCategoryWidgets(updatedCatWidgets);
    saveCategoryLayout(updatedCatWidgets);
    toast.success(`Removed ${config?.title || "widget"} from ${activeCard.label}`);
    setWidgetToDelete(null);
  };

  const handleAddWidget = (widgetId: string) => {
    const config = ALL_WIDGETS.find((w) => w.id === widgetId);
    const cat = activeCard.category;
    const existingInCat = categoryWidgets[cat] || [];

    if (existingInCat.some((w) => w.id === widgetId)) {
      toast.info(`${config?.title || "Widget"} is already added to ${activeCard.label}`);
      return;
    }

    const newWidget: UserWidgetState = {
      id: widgetId,
      width: config?.defaultWidth ?? "full",
      order: existingInCat.length,
    };

    const updatedCatWidgets = {
      ...categoryWidgets,
      [cat]: [...existingInCat, newWidget],
    };

    setCategoryWidgets(updatedCatWidgets);
    saveCategoryLayout(updatedCatWidgets);
    toast.success(`Added ${config?.title || "widget"} to ${activeCard.label}`);
  };

  const handleResetLayout = () => {
    setCategoryWidgets(EMPTY_CATEGORY_LAYOUT);
    saveCategoryLayout(EMPTY_CATEGORY_LAYOUT);
    toast.success("Reset dashboard widgets to empty state");
  };

  // Drag & Drop handlers (Scoped to active card category)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;

    const cat = activeCard.category;
    const list = categoryWidgets[cat] || [];
    const fromIndex = list.findIndex((w) => w.id === draggedId);
    const toIndex = list.findIndex((w) => w.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...list];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const reindexed = reordered.map((item, index) => ({ ...item, order: index }));
    const updatedCatWidgets = {
      ...categoryWidgets,
      [cat]: reindexed,
    };

    setCategoryWidgets(updatedCatWidgets);
    saveCategoryLayout(updatedCatWidgets);
    setDraggedId(null);
  };

  const getStatusBadge = (status: ApprovalQueueItem["status"]) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-1.5 w-24 py-1 rounded-full text-xs font-semibold shrink-0 text-center";
    switch (status) {
      case "In Review":
        return (
          <span className={`${baseClasses} bg-purple-100/80 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300`}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            In Review
          </span>
        );
      case "Pending":
        return (
          <span className={`${baseClasses} bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Pending
          </span>
        );
      case "Active":
        return (
          <span className={`${baseClasses} bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Active
          </span>
        );
    }
  };

  const activeWidgetIds = currentWidgets.map((w) => w.id);

  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case "help_approvals":
        return (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 flex flex-col justify-around py-1 overflow-hidden">
            {QUEUE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="py-2 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => toast.info(`Viewing details for ${item.title}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {item.avatar}
                  </div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(item.status)}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium min-w-[50px] text-right">
                    {item.timeLeft}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case "missing_areas":
        return (
          <div className="space-y-3 py-2">
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-200 truncate">
                    Digital Twin Sync Telemetry
                  </h4>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 truncate">
                    High priority area without published documentation
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/60 dark:text-rose-300 shrink-0">
                High Priority
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200 truncate">
                    GPS Telemetry Timeout Settings
                  </h4>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
                    Medium priority gap needing step-by-step guides
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 shrink-0">
                Medium Priority
              </Badge>
            </div>
          </div>
        );

      case "usage_analytics":
        return (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Panel Opens</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">1,240</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <span className="text-[10px] uppercase font-semibold text-blue-500">Article Views</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">3,840</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <span className="text-[10px] uppercase font-semibold text-amber-500">Searches</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">512</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <span className="text-[10px] uppercase font-semibold text-emerald-500">Resolved</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">94%</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">+18% increase in overall help article readership this week</span>
              </div>
              <span className="text-[11px] text-slate-400">Updated 5m ago</span>
            </div>
          </div>
        );

      case "live_activity":
        return (
          <div className="flex-1 flex flex-col justify-around py-1 overflow-hidden">
            {LIVE_ACTIVITIES.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between text-xs py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                    {activity.avatar}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {activity.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {activity.action}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {activity.timeAgo}
                </span>
              </div>
            ))}
          </div>
        );

      case "help_management":
        return (
          <div className="grid sm:grid-cols-2 gap-3 py-2">
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total Articles</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">24</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-emerald-500">Approved</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">19</div>
            </div>
          </div>
        );

      case "ticket_management":
        return (
          <div className="grid sm:grid-cols-2 gap-3 py-2">
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-amber-500">Open Tickets</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">5</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-emerald-500">Resolved</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">42</div>
            </div>
          </div>
        );

      case "coverage_metrics":
        return (
          <div className="grid sm:grid-cols-3 gap-3 py-2">
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Areas Covered</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">23</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-rose-500">Missing</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">5</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-emerald-500">Coverage Ratio</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">82%</div>
            </div>
          </div>
        );

      case "user_management":
      default:
        return (
          <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center py-6">
            Widget content overview and metrics for {activeCard.label}.
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-4 pb-12 font-sans text-slate-800 animate-in fade-in duration-200 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-normal tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <Badge variant="outline" className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
            {activeCard.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetLayout}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
            title="Reset dashboard to empty state"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Layout</span>
          </Button>

          <Button
            onClick={() => setAddWidgetOpen(true)}
            style={{ background: "linear-gradient(90deg, #0029FF 0%, #00144B 100%)" }}
            className="text-white rounded-full px-4 py-2 text-xs font-medium shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 border-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Summary Stat Cards (Card Selectors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {CARDS.map((card) => {
          const IconComponent = card.icon;
          const isSelected = selectedCardId === card.id;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col items-center justify-center text-center gap-2 ${
                isSelected
                  ? card.activeBorderColor
                  : "border-slate-100 dark:border-slate-800 hover:border-slate-300 shadow-xs"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  isSelected ? card.activeTextColor : "text-slate-900 dark:text-white"
                }`}
              >
                {card.count}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Responsive Grid Layout for Category Widgets */}
      {currentWidgets.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 my-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No widgets added to {activeCard.label}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Customize your {activeCard.label} view by adding relevant widgets for this category.
          </p>
          <Button
            onClick={() => setAddWidgetOpen(true)}
            style={{ background: "linear-gradient(90deg, #0029FF 0%, #00144B 100%)" }}
            className="mt-4 text-white rounded-full px-5 py-2 text-xs font-medium shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 mx-auto border-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5 flex-1 items-start">
          {currentWidgets.map((uState) => {
            const config = ALL_WIDGETS.find((w) => w.id === uState.id);
            const title = config?.title || "Widget";

            let headerAction: React.ReactNode = null;
            let customHeader: React.ReactNode = undefined;

            if (uState.id === "help_approvals") {
              headerAction = (
                <button
                  type="button"
                  onClick={() => toast.info("Opening full approvals queue...")}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-medium flex items-center gap-1 hover:underline mr-1"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              );
            } else if (uState.id === "live_activity") {
              customHeader = (
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  <h2 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    Live Activity
                  </h2>
                </div>
              );
            }

            return (
              <DashboardWidgetCard
                key={uState.id}
                id={uState.id}
                title={title}
                width={uState.width}
                headerAction={headerAction}
                customHeader={customHeader}
                onWidthChange={handleWidthChange}
                onDeleteRequest={handleDeleteRequest}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedId === uState.id}
                isDraggingOver={dragOverId === uState.id}
              >
                {renderWidgetContent(uState.id)}
              </DashboardWidgetCard>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!widgetToDelete}
        onOpenChange={(open) => !open && setWidgetToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Delete this widget?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              This widget will be removed from your {activeCard.label} section. You can add it back anytime using the "Add Widget" button.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex items-center justify-end gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-full px-4 py-1.5 text-xs font-medium border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWidget}
              className="rounded-full px-4 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-sm border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Widget Modal */}
      <AddWidgetModal
        open={addWidgetOpen}
        onOpenChange={setAddWidgetOpen}
        availableWidgets={ALL_WIDGETS}
        activeWidgetIds={activeWidgetIds}
        onAddWidget={handleAddWidget}
        categoryFilter={activeCard.category}
        categoryLabel={activeCard.label}
      />
    </div>
  );
}


