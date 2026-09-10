import { useState } from "react";
import {
  ClipboardCheck,
  Clock,
  AlertCircle,
  Activity,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddWidgetModal } from "@/components/dashboard/AddWidgetModal";
import { ALL_WIDGETS } from "@/lib/widget-registry";
import { toast } from "sonner";

interface QueueItem {
  id: string;
  avatar: string;
  title: string;
  status: "In Review" | "Pending" | "Active";
  timeLeft: string;
}

interface ActivityItem {
  id: string;
  avatar: string;
  name: string;
  action: string;
  timeAgo: string;
}

const QUEUE_DATA: QueueItem[] = [
  { id: "gq-1", avatar: "AR", title: "Digital twin sync error", status: "In Review", timeLeft: "2h left" },
  { id: "gq-2", avatar: "RM", title: "Sensor latency spike", status: "Pending", timeLeft: "45 min" },
  { id: "gq-3", avatar: "PS", title: "Widget configuration issue", status: "Active", timeLeft: "6h left" },
  { id: "gq-4", avatar: "VP", title: "GPS telemetry timeout", status: "Pending", timeLeft: "12h left" },
  { id: "gq-5", avatar: "KA", title: "Access permission issue", status: "In Review", timeLeft: "1h left" },
];

const ACTIVITY_DATA: ActivityItem[] = [
  { id: "ga-1", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "ga-2", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "ga-3", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "ga-4", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
  { id: "ga-5", avatar: "AR", name: "Ananya R.", action: "resolved", timeAgo: "2m ago" },
];

export function GradientUserDashboard() {
  const [selectedCard, setSelectedCard] = useState<number>(0);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const getStatusBadge = (status: QueueItem["status"]) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-1.5 w-24 py-0.5 rounded-full text-[11px] font-semibold shrink-0 text-center";
    switch (status) {
      case "In Review":
        return (
          <span className={`${baseClasses} bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] shrink-0" />
            In Review
          </span>
        );
      case "Pending":
        return (
          <span className={`${baseClasses} bg-[#f59e0b]/15 text-[#fcd34d] border border-[#f59e0b]/30`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#fcd34d] shrink-0" />
            Pending
          </span>
        );
      case "Active":
        return (
          <span className={`${baseClasses} bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0" />
            Active
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-4 pb-12 font-sans bg-[#0d122b] p-6 rounded-2xl text-white shadow-2xl animate-in fade-in duration-300 overflow-hidden border border-white/5">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-normal tracking-tight text-white font-['DM_Sans',sans-serif]">
          Dashboard
        </h1>
        <Button
          onClick={() => setAddWidgetOpen(true)}
          style={{ background: "linear-gradient(90deg, #0029FF 0%, #00144B 100%)" }}
          className="text-white rounded-full px-5 py-2 text-xs font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-1.5 border-0 tracking-wide"
        >
          <Plus className="h-4 w-4" />
          <span>Add Widget</span>
        </Button>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Card 0: For Review (Linear Gradient Card with Shadow Glow) */}
        <div
          onClick={() => setSelectedCard(0)}
          style={{
            background: selectedCard === 0 ? "linear-gradient(135deg, #0029FF 0%, #00144B 100%)" : "#131e30",
          }}
          className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col items-center justify-center text-center gap-2 ${
            selectedCard === 0
              ? "border-[#0078ff] shadow-[0_4px_24px_rgba(0,120,255,0.4)]"
              : "border-white/[0.07] hover:border-white/20"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#0078ff]/20 flex items-center justify-center text-[#0078ff]">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white font-['DM_Sans',sans-serif]">
            83
          </span>
          <span className="text-xs font-medium text-slate-200">For Review</span>
        </div>

        {/* Card 1: For Follow up */}
        <div
          onClick={() => setSelectedCard(1)}
          style={{
            background: selectedCard === 1 ? "linear-gradient(135deg, #0029FF 0%, #00144B 100%)" : "#131e30",
          }}
          className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col items-center justify-center text-center gap-2 ${
            selectedCard === 1
              ? "border-[#0078ff] shadow-[0_4px_24px_rgba(0,120,255,0.4)]"
              : "border-white/[0.07] hover:border-white/20"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-[#f0f4ff] font-['DM_Sans',sans-serif]">
            112
          </span>
          <span className="text-xs font-medium text-[#7b8db0]">For Follow- Up</span>
        </div>

        {/* Card 2: For Info */}
        <div
          onClick={() => setSelectedCard(2)}
          style={{
            background: selectedCard === 2 ? "linear-gradient(135deg, #0029FF 0%, #00144B 100%)" : "#131e30",
          }}
          className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col items-center justify-center text-center gap-2 ${
            selectedCard === 2
              ? "border-[#0078ff] shadow-[0_4px_24px_rgba(0,120,255,0.4)]"
              : "border-white/[0.07] hover:border-white/20"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-cyan-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-[#f0f4ff] font-['DM_Sans',sans-serif]">
            47
          </span>
          <span className="text-xs font-medium text-[#7b8db0]">For Info</span>
        </div>

        {/* Card 3: For Monitoring */}
        <div
          onClick={() => setSelectedCard(3)}
          style={{
            background: selectedCard === 3 ? "linear-gradient(135deg, #0029FF 0%, #00144B 100%)" : "#131e30",
          }}
          className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col items-center justify-center text-center gap-2 ${
            selectedCard === 3
              ? "border-[#0078ff] shadow-[0_4px_24px_rgba(0,120,255,0.4)]"
              : "border-white/[0.07] hover:border-white/20"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-[#f0f4ff] font-['DM_Sans',sans-serif]">
            112
          </span>
          <span className="text-xs font-medium text-[#7b8db0]">For Monitoring</span>
        </div>
      </div>

      {/* Main Section: Approvals Queue & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
        {/* Help Approvals Queue */}
        <div className="lg:col-span-8 bg-[#131e30] rounded-2xl p-4 border border-white/[0.07] shadow-xl flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.07] shrink-0">
            <h2 className="text-sm font-normal text-[#f0f4ff]">
              Help Approvals Queue
            </h2>
            <button
              type="button"
              onClick={() => toast.info("Opening full approvals queue...")}
              className="text-[#0078ff] hover:underline text-xs font-semibold flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.07] flex-1 flex flex-col justify-around py-1 overflow-hidden">
            {QUEUE_DATA.map((item) => (
              <div
                key={item.id}
                onClick={() => toast.info(`Viewing details for ${item.title}`)}
                className="py-2 flex items-center justify-between gap-4 hover:bg-white/[0.03] px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Blue-Cyan Gradient Avatar */}
                  <div
                    style={{ background: "linear-gradient(135deg, #0078ff 0%, #00d4ff 100%)" }}
                    className="w-8 h-8 rounded-full text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm"
                  >
                    {item.avatar}
                  </div>
                  <span className="text-xs font-light text-[#f0f4ff] truncate">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(item.status)}
                  <span className="text-[11px] text-[#7b8db0] font-normal min-w-[50px] text-right">
                    {item.timeLeft}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-4 bg-[#131e30] rounded-2xl p-4 border border-white/[0.07] shadow-xl flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.07] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#0078ff] shadow-[0_0_8px_#0078ff] animate-pulse" />
            <h2 className="text-sm font-normal text-[#f0f4ff]">
              Live Activity
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1 overflow-hidden">
            {ACTIVITY_DATA.map((act) => (
              <div key={act.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2.5">
                  <div
                    style={{ background: "linear-gradient(135deg, #0078ff 0%, #00d4ff 100%)" }}
                    className="w-7 h-7 rounded-full text-white font-semibold text-[11px] flex items-center justify-center shrink-0 shadow-sm"
                  >
                    {act.avatar}
                  </div>
                  <span className="text-xs text-[#f0f4ff]">
                    {act.name} {act.action}
                  </span>
                </div>
                <span className="text-[11px] text-[#4a5a78]">
                  {act.timeAgo}
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
