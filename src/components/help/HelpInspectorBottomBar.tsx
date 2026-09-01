import { useAuth } from "@/lib/auth-context";
import { useHelpInspector } from "@/lib/inspector-context";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";

export function HelpInspectorBottomBar() {
  const { user } = useAuth();
  const { isEnabled, setIsEnabled } = useHelpInspector();

  // Only show bottom tab bar when logged in as Super Admin / Admin
  if (user?.role !== "admin") return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300">
      <div className="flex items-center gap-2 rounded-full bg-slate-950/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.5)] px-3 py-1.5 text-white">
        {/* Master Inspector Toggle Switch with Eye Icon */}
        <div className="flex items-center gap-2 px-1 py-0.5 shrink-0">
          <Switch
            id="inspector-toggle"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            className="data-[state=checked]:bg-indigo-600 scale-90 shrink-0"
          />
          {isEnabled ? (
            <span title="Inspector ON">
              <Eye className="h-4 w-4 text-emerald-400 shrink-0" />
            </span>
          ) : (
            <span title="Inspector OFF">
              <EyeOff className="h-4 w-4 text-slate-400 shrink-0" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
