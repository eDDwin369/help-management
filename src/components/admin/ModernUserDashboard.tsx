import { useState } from "react";
import {
  ClipboardCheck,
  Clock,
  AlertCircle,
  Activity,
  Plus,
  ArrowRight,
  User,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddWidgetModal } from "@/components/dashboard/AddWidgetModal";
import { ALL_WIDGETS } from "@/lib/widget-registry";
import { useHmsStore } from "@/components/hms/hmsStore";
import { toast } from "sonner";

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

export function ModernUserDashboard() {
  const [selectedCard, setSelectedCard] = useState<number>(0);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const { openPanel } = useHmsStore();

  const cards = [
    {
      id: 0,
      count: 83,
      label: "For Review",
      icon: ClipboardCheck,
      iconBg: "bg-sky-100 text-sky-500",
      activeBorderColor: "border-2 border-blue-500 shadow-md shadow-blue-500/10",
      activeTextColor: "text-sky-500",
    },
    {
      id: 1,
      count: 112,
      label: "For Follow up",
      icon: Clock,
      iconBg: "bg-amber-100 text-amber-500",
      activeBorderColor: "border-2 border-amber-500 shadow-md shadow-amber-500/10",
      activeTextColor: "text-amber-500",
    },
    {
      id: 2,
      count: 47,
      label: "For Info",
      icon: AlertCircle,
      iconBg: "bg-cyan-100 text-cyan-500",
      activeBorderColor: "border-2 border-cyan-500 shadow-md shadow-cyan-500/10",
      activeTextColor: "text-cyan-500",
    },
    {
      id: 3,
      count: 112,
      label: "For Monitoring",
      icon: Activity,
      iconBg: "bg-emerald-100 text-emerald-500",
      activeBorderColor: "border-2 border-emerald-500 shadow-md shadow-emerald-500/10",
      activeTextColor: "text-emerald-500",
    },
  ];

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

  return (
    <div className="h-full flex flex-col justify-between space-y-4 pb-12 font-sans text-slate-800 animate-in fade-in duration-200 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-normal tracking-tight text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <Button
          onClick={() => setAddWidgetOpen(true)}
          style={{ background: "linear-gradient(90deg, #0029FF 0%, #00144B 100%)" }}
          className="text-white rounded-full px-4 py-2 text-xs font-medium shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 border-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Widget</span>
        </Button>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {cards.map((card) => {
          const IconComponent = card.icon;
          const isSelected = selectedCard === card.id;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card.id)}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col items-center justify-center text-center gap-2 ${
                isSelected
                  ? card.activeBorderColor
                  : "border-slate-100 dark:border-slate-800 hover:border-slate-300 shadow-xs"
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}
              >
                <IconComponent className="h-5 w-5" />
              </div>

              {/* Number */}
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  isSelected ? card.activeTextColor : "text-slate-900 dark:text-white"
                }`}
              >
                {card.count}
              </span>

              {/* Label */}
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Approvals Queue (Left) & Live Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
        {/* Help Approvals Queue Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h2 className="text-sm font-medium text-slate-900 dark:text-white">
              Help Approvals Queue
            </h2>
            <button
              type="button"
              onClick={() => toast.info("Opening full approvals queue...")}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-medium flex items-center gap-1 hover:underline"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 flex flex-col justify-around py-1 overflow-hidden">
            {QUEUE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="py-2 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => toast.info(`Viewing details for ${item.title}`)}
              >
                {/* Avatar + Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {item.avatar}
                  </div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.title}
                  </span>
                </div>

                {/* Status + Time */}
                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(item.status)}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium min-w-[50px] text-right">
                    {item.timeLeft}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-sm font-medium text-slate-900 dark:text-white">
              Live Activity
            </h2>
          </div>

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
        </div>
      </div>

      {/* Add Widget Modal */}
      <AddWidgetModal
        open={addWidgetOpen}
        onOpenChange={setAddWidgetOpen}
        availableWidgets={ALL_WIDGETS}
        activeWidgetIds={[]}
        onAddWidget={() => setAddWidgetOpen(false)}
      />
    </div>
  );
}
