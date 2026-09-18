import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, X } from "lucide-react";

const REASON_PRESETS = [
  "Outdated specifications",
  "Media resolution below standard",
  "Incorrect control mapping",
  "Poor recording quality",
  "Missing documentation",
  "Does not follow guidelines",
];

interface RejectHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  articleTitle?: string;
}

export function RejectHelpModal({
  isOpen,
  onClose,
  onConfirm,
  articleTitle,
}: RejectHelpModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  const finalReason = customReason.trim() || selectedPreset || "";

  const handleConfirm = () => {
    if (!finalReason) return;
    onConfirm(finalReason);
    handleReset();
  };

  const handleReset = () => {
    setSelectedPreset(null);
    setCustomReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <div className="size-8 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <DialogTitle className="text-base font-semibold">Reject Help</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {articleTitle ? (
              <>
                You are rejecting <span className="font-medium text-foreground">"{articleTitle}"</span>. Please specify a reason for rejection.
              </>
            ) : (
              "Specify a reason for rejecting this help entry. Rejection reasons are saved for audit history."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Common Rejection Reasons
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REASON_PRESETS.map((preset) => {
                const active = selectedPreset === preset && !customReason.trim();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset);
                      if (!customReason.trim()) {
                        setCustomReason(preset);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300 font-medium"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Reason for rejection <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="E.g. The audio commentary in the video is distorted and missing the filter setup step..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              className="text-xs resize-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Required. This feedback will be attached to the rejected item record.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!finalReason}
            onClick={handleConfirm}
            className="h-8 text-xs gap-1.5"
          >
            <X className="size-3.5" />
            Reject Help
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
