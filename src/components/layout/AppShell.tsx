import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  LayoutDashboard,
  
  Settings,
  Sun,
  Moon,
  LogOut,
  Ticket,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,

  MessageSquare,
} from "lucide-react";
import { MyTicketsSheet } from "@/components/help/MyTicketsSheet";
import { ContactSupportDialog } from "@/components/help/ContactSupportDialog";
import { ticketStore } from "@/lib/mock-data";
import { useStoreVersion } from "@/lib/use-store";
import { useHmsStore } from "@/components/hms/hmsStore";

function roleLabel(role: string) {
  if (role === "sub_admin") return "Help Admin";
  if (role === "admin") return "Superadmin";
  if (role === "customer") return "Customer";
  return role;
}

export function AppShell({ children }: { children: ReactNode }) {
  useStoreVersion();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { isOpen: isHmsOpen, closePanel } = useHmsStore();
  const navigate = useNavigate();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close other popovers/sheets when HMS Panel opens
  useEffect(() => {
    if (isHmsOpen) {
      setMenuOpen(false);
      setTicketsOpen(false);
      setSupportOpen(false);
    }
  }, [isHmsOpen]);

  // Keep the fullscreen icon in sync with the browser's own state (Esc, F11).
  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* fullscreen can be blocked by the embedding context — ignore */
    }
  }, []);


  if (!user) return null;

  const openTickets = ticketStore
    .list()
    .filter((t) => t.status !== "closed" && (t.userId === user.id || t.userId === "u_customer"))
    .length;

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true, context: "app-nav-drawings" },
    { to: "/tickets", label: "Tickets", icon: Ticket, show: true, context: "app-nav-tickets" },
    {
      to: "/admin",
      label: user.role === "sub_admin" ? "Help Admin" : "Superadmin",
      icon: ShieldCheck,
      show: user.role === "admin" || user.role === "sub_admin",
      context: "app-nav-admin",
    },
  ].filter((n) => n.show);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-screen w-screen overflow-hidden flex bg-background">
        {/* Sidebar */}
        <aside
          className="w-[68px] border-r bg-card flex flex-col items-center py-4 gap-2 shrink-0"
          data-hms-context="app-sidebar"
        >
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex flex-col items-center group cursor-pointer focus:outline-none"
            title="Go to Dashboard"
            aria-label="Go to Dashboard"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold mb-2 shadow-sm group-hover:opacity-90 group-hover:scale-105 transition-all">
              <Eye className="size-5" />
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground -mt-1 mb-2 group-hover:text-foreground transition-colors">
              OomniEye
            </div>
          </button>
          {nav.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <button
                key={n.to}
                data-hms-context={n.context}

                onClick={() => navigate({ to: n.to })}
                aria-label={n.label}

                className={`size-11 rounded-xl flex items-center justify-center transition-all relative group ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={n.label}
              >
                <n.icon className="size-5" />
                {active && (
                  <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
                )}
                <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {n.label}
                </span>
              </button>
            );
          })}
          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              data-hms-context="app-theme-toggle"
              className="size-11 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header
            className="h-14 border-b bg-card flex items-center px-6 gap-4 sticky top-0 z-30 backdrop-blur"
            data-hms-context="app-header"
          >
            <div className="font-semibold tracking-tight">My Site Time Machine</div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              <span className="text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Digital Twin Solutions
              </span>
            </div>

            {/* Icon-only header actions */}
            <div className="flex items-center gap-0.5">
              <HeaderIconButton
                label="Refresh"
                context="app-refresh"
                onClick={() => router.invalidate()}
              >
                <RefreshCw className="size-4" />
              </HeaderIconButton>
              <HeaderIconButton
                label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                context="app-fullscreen"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </HeaderIconButton>

              <span className="mx-1 h-5 w-px bg-border" />

              <HeaderIconButton
                label="Contact Support"
                context="app-support"
                onClick={() => {
                  closePanel();
                  setSupportOpen(true);
                }}
              >
                <MessageSquare className="size-4" />
              </HeaderIconButton>

              <HeaderIconButton
                label="My Tickets"
                context="app-tickets-button"
                onClick={() => {
                  closePanel();
                  setTicketsOpen(true);
                }}
                badge={openTickets || undefined}
              >
                <Ticket className="size-4" />
              </HeaderIconButton>

              <HeaderIconButton
                label="Settings"
                context="app-settings"
                onClick={() => navigate({ to: "/tickets" })}
              >
                <Settings className="size-4" />
              </HeaderIconButton>

              <DropdownMenu
                open={menuOpen}
                onOpenChange={(open) => {
                  if (open) closePanel();
                  setMenuOpen(open);
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="size-8 rounded-full text-white text-xs font-semibold flex items-center justify-center ml-1.5 shadow"
                        style={{ background: user.avatarColor }}
                      >
                        {user.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{user.name}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                    <Badge variant="outline" className="mt-1.5 text-[10px]">
                      {roleLabel(user.role)}
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      closePanel();
                      setTicketsOpen(true);
                    }}
                  >
                    <Ticket className="size-4 mr-2" /> My Tickets
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      closePanel();
                      setSupportOpen(true);
                    }}
                  >
                    <MessageSquare className="size-4 mr-2" /> Contact Support
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={toggle}>
                    {theme === "dark" ? (
                      <Sun className="size-4 mr-2" />
                    ) : (
                      <Moon className="size-4 mr-2" />
                    )}
                    Toggle theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      void logout().then(() =>
                        navigate({ to: "/login", search: { redirect: "/dashboard" }, replace: true }),
                      );

                    }}

                    className="text-destructive"
                  >
                    <LogOut className="size-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto">{children}</main>

          <footer className="h-9 border-t bg-card flex items-center justify-between px-6 text-xs text-muted-foreground">
            <span>Ready</span>
            <span>© 2026 OomniEye. All rights reserved.</span>
            <span className="font-semibold tracking-wider text-emerald-600">ALLCAD</span>
          </footer>
        </div>

        <MyTicketsSheet open={ticketsOpen} onOpenChange={setTicketsOpen} />
        {supportOpen && (
          <ContactSupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
        )}
      </div>
    </TooltipProvider>
  );
}

function HeaderIconButton({
  label,
  onClick,
  badge,
  context,
  children,
}: {
  label: string;
  onClick?: () => void;
  badge?: number;
  context?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          aria-label={label}
          data-hms-context={context}
          className="relative"
        >
          {children}
          {badge !== undefined && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center tabular-nums">
              {badge}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
