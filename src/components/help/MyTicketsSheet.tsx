import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ticketStore } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useStoreVersion } from "@/lib/use-store";
import { fmt } from "@/lib/format";
import { Search } from "lucide-react";
import type { Ticket, TicketStatus } from "@/lib/types";

const STATUS_META: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  in_progress: { label: "In Progress", cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  waiting: { label: "Waiting", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  closed: { label: "Closed", cls: "bg-muted text-muted-foreground border-border" },
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-rose-500",
};

export function MyTicketsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  useStoreVersion();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const all = ticketStore.list().filter((t) => !user || t.userId === user.id || t.userId === "u_customer");
  const items = all.filter((t) => !q || t.subject.toLowerCase().includes(q.toLowerCase()) || t.id.includes(q));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-4 border-b">
          <SheetTitle>My Tickets</SheetTitle>
          <SheetDescription>All support requests you've created.</SheetDescription>
          <div className="relative mt-2">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by ID or subject…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 h-9" />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-16 text-sm text-muted-foreground">No tickets found.</div>
          )}
          {items.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const meta = STATUS_META[ticket.status];
  return (
    <div className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">{ticket.id}</span>
            <span className={`size-1.5 rounded-full ${PRIORITY_DOT[ticket.priority]}`} title={`Priority: ${ticket.priority}`} />
            <span className="text-[11px] capitalize text-muted-foreground">{ticket.priority}</span>
          </div>
          <div className="font-medium text-sm mt-0.5 leading-snug">{ticket.subject}</div>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] py-0 h-5 ${meta.cls}`}>
          {meta.label}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ticket.description}</p>
      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
        <span>Created {fmt.date(ticket.createdAt)}</span>
        <span>Updated {fmt.ago(ticket.updatedAt)}</span>
      </div>
    </div>
  );
}
