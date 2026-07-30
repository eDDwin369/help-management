import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { helpStore } from "@/lib/mock-data";
import { useStoreVersion } from "@/lib/use-store";
import { useAuth } from "@/lib/auth-context";
import { HelpExplorer } from "./HelpExplorer";
import { AddHelpItemDialog } from "./AddHelpItemDialog";
import { toast } from "sonner";

export function SubAdminHelpDialog({
  open,
  onOpenChange,
  componentKey,
  componentLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  componentKey: string;
  componentLabel: string;
}) {
  useStoreVersion();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.componentKey === componentKey) setAddOpen(true);
    };
    window.addEventListener("hm:add-help", handler);
    return () => window.removeEventListener("hm:add-help", handler);
  }, [componentKey]);

  const items = helpStore.allByComponent(componentKey);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-3 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Help Admin
                </div>
                <DialogTitle className="text-lg mt-0.5 truncate">
                  Manage Help — {componentLabel}
                </DialogTitle>
              </div>
              <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
                <Plus className="size-4" /> Add Help
              </Button>
            </div>
          </DialogHeader>

          <HelpExplorer
            items={items}
            showArchive
            showApproval={isAdmin}
            emptyHint="No items here yet."
            admin={{
              onApprove: isAdmin
                ? (item) => {
                    helpStore.update(item.id, {
                      status: item.status === "approved" ? "unapproved" : "approved",
                    });
                    toast.success(item.status === "approved" ? "Unapproved" : "Approved");
                  }
                : undefined,
              onArchive: (item) => {
                helpStore.update(item.id, { archived: !item.archived });
                toast.success(item.archived ? "Restored" : "Archived");
              },
              onDelete: isAdmin
                ? (item) => {
                    helpStore.remove(item.id);
                    toast.success("Deleted");
                  }
                : undefined,
            }}
          />
        </DialogContent>
      </Dialog>

      {addOpen && (
        <AddHelpItemDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          defaultComponent={{ key: componentKey, label: componentLabel }}
        />
      )}
    </>
  );
}
