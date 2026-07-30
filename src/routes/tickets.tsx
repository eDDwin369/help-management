import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useHmsStore } from "@/components/hms/hmsStore";
import { AppShell } from "@/components/layout/AppShell";
import { ticketStore } from "@/lib/mock-data";
import { useStoreVersion } from "@/lib/use-store";
import { fmt } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { ContactSupportDialog } from "@/components/help/ContactSupportDialog";
import { InfoHint } from "@/components/ui/info-hint";
import type { TicketStatus } from "@/lib/types";

const TICKETS_URL = "https://help-management-flows.lovable.app/tickets";
const TICKETS_TITLE = "Support Tickets · OomniEye";
const TICKETS_DESC =
  "Track, filter, and resolve support tickets raised from anywhere in the OomniEye workspace, with status and priority at a glance.";

export const Route = createFileRoute("/tickets")({
  component: TicketsPage,
  head: () => ({
    meta: [
      { title: TICKETS_TITLE },
      { name: "description", content: TICKETS_DESC },
      { property: "og:title", content: TICKETS_TITLE },
      { property: "og:description", content: TICKETS_DESC },
      { property: "og:url", content: TICKETS_URL },
      { name: "twitter:title", content: TICKETS_TITLE },
      { name: "twitter:description", content: TICKETS_DESC },
    ],
    links: [{ rel: "canonical", href: TICKETS_URL }],
  }),
});


const STATUS: Record<TicketStatus, string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  in_progress: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
  waiting: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};
const PRIO: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-rose-500",
};

const TICKET_CARD_CONTEXT: Record<string, string> = {
  all: "tickets-total-card",
  open: "tickets-open-card",
  in_progress: "tickets-inprogress-card",
  waiting: "tickets-waiting-card",
  closed: "tickets-closed-card",
};

function TicketsPage() {
  useStoreVersion();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [newOpen, setNewOpen] = useState(false);
  const { setSection } = useHmsStore();

  useEffect(() => {
    if (!isLoading && !user)
      navigate({ to: "/login", search: { redirect: "/tickets" }, replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    setSection("section-tickets");
  }, [setSection]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Loading tickets…
      </div>
    );
  if (!user) return null;

  const all = ticketStore.list();
  const items = all.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (q && !(t.subject.toLowerCase().includes(q.toLowerCase()) || t.id.includes(q))) return false;
    return true;
  });

  const counts = {
    all: all.length,
    open: all.filter((t) => t.status === "open").length,
    in_progress: all.filter((t) => t.status === "in_progress").length,
    waiting: all.filter((t) => t.status === "waiting").length,
    closed: all.filter((t) => t.status === "closed").length,
  };

  return (
    <AppShell>
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-1.5">
              My Tickets
              <InfoHint text="Track and manage your support requests." />
            </h1>
          </div>
          <Button onClick={() => setNewOpen(true)} className="gap-1.5" data-hms-context="tickets-new-button">
            <Plus className="size-4" />
            New Ticket
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {(
            [
              ["all", "Total", counts.all, "text-foreground"],
              ["open", "Open", counts.open, "text-blue-600"],
              ["in_progress", "In Progress", counts.in_progress, "text-violet-600"],
              ["waiting", "Waiting", counts.waiting, "text-amber-600"],
              ["closed", "Closed", counts.closed, "text-muted-foreground"],
            ] as const
          ).map(([k, label, val, cls]) => (
            <button
              key={k}
              data-hms-context={TICKET_CARD_CONTEXT[k]}
              onClick={() => setFilter(k as TicketStatus | "all")}
              className={`p-4 rounded-xl border text-left bg-card hover:shadow-sm transition-all ${filter === k ? "border-primary ring-2 ring-primary/20" : ""}`}
            >
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={`text-2xl font-semibold mt-1 ${cls}`}>{val}</div>
            </button>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="relative w-72" data-hms-context="tickets-search">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ID or subject…"
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="divide-y" data-hms-context="tickets-table">
            {items.length === 0 && (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No tickets match the current filter.
              </div>
            )}
            {items.map((t) => (
              <div key={t.id} className="p-4 hover:bg-muted/30 transition-colors" data-hms-context="tickets-row">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`size-2 rounded-full ${PRIO[t.priority]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 h-5 ${STATUS[t.status]}`}
                      >
                        {t.status.replace("_", " ")}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground capitalize">
                        · {t.priority} priority
                      </span>
                    </div>
                    <div className="font-medium text-sm mt-0.5">{t.subject}</div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {t.description}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div>Created {fmt.date(t.createdAt)}</div>
                    <div>Updated {fmt.ago(t.updatedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {newOpen && <ContactSupportDialog open={newOpen} onOpenChange={setNewOpen} />}
    </AppShell>
  );
}
