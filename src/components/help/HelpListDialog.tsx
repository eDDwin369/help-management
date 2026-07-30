import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, LifeBuoy } from "lucide-react";
import { helpStore } from "@/lib/mock-data";
import { HelpExplorer } from "./HelpExplorer";
import { ContactSupportDialog } from "./ContactSupportDialog";
import type { HelpItem } from "@/lib/types";

export function HelpListDialog({
  open,
  onOpenChange,
  componentKey,
  componentLabel,
  items: itemsProp,
  onNeedMore,
  screenOnly = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  componentKey: string;
  componentLabel: string;
  items?: HelpItem[];
  onNeedMore?: () => void;
  screenOnly?: boolean;
}) {
  const baseItems = useMemo(
    () =>
      itemsProp ??
      (screenOnly ? helpStore.byScreen(componentKey) : helpStore.byComponent(componentKey)),
    [itemsProp, componentKey, screenOnly],
  );

  const [contactOpen, setContactOpen] = useState(false);

  const handleContact = () => {
    if (onNeedMore) onNeedMore();
    else setContactOpen(true);
  };

  const hasItems = baseItems.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-3 border-b">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <LifeBuoy className="size-3" />
                  Help
                </div>
                <DialogTitle className="text-lg mt-0.5 truncate">
                  {componentLabel}
                </DialogTitle>
              </div>
              {hasItems && (
                <Button variant="outline" size="sm" onClick={handleContact} className="gap-1.5">
                  <MessageSquare className="size-3.5" />
                  Contact Support
                </Button>
              )}
            </div>
          </DialogHeader>

          <HelpExplorer
            items={baseItems}
            emptyHint="Need assistance? Our support team is here to help."
            onContactSupport={handleContact}
          />
        </DialogContent>
      </Dialog>

      {contactOpen && (
        <ContactSupportDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          componentKey={componentKey}
          componentLabel={componentLabel}
        />
      )}
    </>
  );
}
