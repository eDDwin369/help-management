import { useAuth } from "@/lib/auth-context";
import { useHelpInspector } from "@/lib/inspector-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Crown,
} from "lucide-react";

export function HelpInspectorBottomBar() {
  const { user } = useAuth();
  const {
    isEnabled,
    setIsEnabled,
    mode,
    setMode,
    totalLocationsWithHelp,
    totalArticlesOnPage,
    refreshLocations,
  } = useHelpInspector();

  // Only show bottom tab bar when logged in as Super Admin / Admin
  if (user?.role !== "admin") return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 max-w-[95vw]">
      <div className="flex items-center gap-3 rounded-full bg-slate-950/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.5)] px-4 py-2 text-white">
        {/* Role & Title Pill */}
        <div className="flex items-center gap-2 border-r border-slate-800 pr-3 shrink-0">
          <div className="h-7 w-7 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight">
              <span>Help Inspector</span>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px] px-1.5 py-0 h-3.5">
                Super Admin
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400">CEO Demo Toolbar</p>
          </div>
        </div>

        {/* Live Counters Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 shrink-0">
          <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold">
            <Layers className="h-3.5 w-3.5" />
            <span>Places with Help:</span>
            <span className="text-white font-bold">{totalLocationsWithHelp}</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1 text-xs text-purple-400 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Items:</span>
            <span className="text-white font-bold">{totalArticlesOnPage}</span>
          </div>
        </div>

        {/* Master Inspector Toggle Switch */}
        <div className="flex items-center gap-2 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800/80">
          <Switch
            id="inspector-toggle"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            className="data-[state=checked]:bg-indigo-600 scale-90"
          />
          <label
            htmlFor="inspector-toggle"
            className="text-xs font-medium cursor-pointer text-slate-300 select-none flex items-center gap-1"
          >
            {isEnabled ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> Inspector ON
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <EyeOff className="h-3.5 w-3.5" /> OFF
              </span>
            )}
          </label>
        </div>

        {/* Visual Highlighting Pill */}
        {isEnabled && (
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-full border border-slate-800 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode("visual")}
              className={`h-7 text-xs px-3 rounded-full transition-all duration-200 gap-1.5 ${
                mode === "visual"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Option 1: Visual Highlighting</span>
            </Button>
          </div>
        )}

        {/* Refresh scanner button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={refreshLocations}
          title="Rescan page help locations"
          className="h-7 w-7 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
