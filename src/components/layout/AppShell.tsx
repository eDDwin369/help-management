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
  Settings,
  Sun,
  Moon,
  LogOut,
  Ticket,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { MyTicketsSheet } from "@/components/help/MyTicketsSheet";
import { ContactSupportDialog } from "@/components/help/ContactSupportDialog";
import { ticketStore } from "@/lib/mock-data";
import { useStoreVersion } from "@/lib/use-store";
import { useHmsStore } from "@/components/hms/hmsStore";
import { AppSidebar } from "./AppSidebar";

import { TwinHeader } from "./TwinHeader";
import { GlobalSettingsWorkspace } from "@/components/GlobalSettings/GlobalSettingsWorkspace";

function roleLabel(role: string) {
  if (role === "sub_admin") return "Help Admin";
  if (role === "admin") return "Superadmin";
  if (role === "customer") return "Customer";
  return role;
}

export function AppShell({ children, darkTheme = false }: { children: ReactNode; darkTheme?: boolean }) {
  useStoreVersion();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { isOpen: isHmsOpen, closePanel } = useHmsStore();
  const navigate = useNavigate();
  const router = useRouter();
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);

  const [headerConfig, setHeaderConfig] = useState({
    logo: "",
    showLogo: true,
    companyName: "OomniEye",
    showCompanyName: true,
    companyCaption: "Digital Twin Solutions",
    showCompanyCaption: true,
    textColor: "#000000",
    textColorApply: "both" as const,
  });
  const [sidebarAutoHide, setSidebarAutoHide] = useState(false);
  const [sidebarExpandedWidth, setSidebarExpandedWidth] = useState(260);
  const [sidebarCollapsedWidth, setSidebarCollapsedWidth] = useState(68);
  const [sidebarShowIcons, setSidebarShowIcons] = useState(true);
  const [sidebarShowLabels, setSidebarShowLabels] = useState(true);

  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('header');
  const [customerProfileData, setCustomerProfileData] = useState({
    showCustomerProfile: false,
    customerName: 'Default Customer',
    customerColorFollow: true,
    showCustomerLogo: false,
    customerLogo: '',
    customerNameStyle: 'h1',
    customerNameColor: '#1e293b'
  });

  const [forceSidebarCollapsed, setForceSidebarCollapsed] = useState<boolean | null>(null);

  // Close other popovers/sheets when HMS Panel opens
  useEffect(() => {
    if (isHmsOpen) {
      setTicketsOpen(false);
      setSupportOpen(false);
      setGlobalSettingsOpen(false);
      setForceSidebarCollapsed(null);
    }
  }, [isHmsOpen]);

  if (!user) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`h-screen w-screen overflow-hidden flex flex-col ${darkTheme ? 'bg-[#050814] text-white' : 'bg-background'}`}>
        {/* Full-width Header from twin_eye */}
        <TwinHeader
          headerConfig={headerConfig}
          isEditing={globalSettingsOpen && (activeSettingsTab === 'header' || activeSettingsTab === 'profile')}
          showCustomerProfile={customerProfileData.showCustomerProfile}
          customerName={customerProfileData.customerName}
          customerNameStyle={customerProfileData.customerNameStyle}
          customerNameColor={customerProfileData.customerNameColor}
          customerColorFollow={customerProfileData.customerColorFollow}
          showCustomerLogo={customerProfileData.showCustomerLogo}
          customerLogo={customerProfileData.customerLogo}
          onSettingsClick={() => {
            closePanel();
            setGlobalSettingsOpen(true);
          }}
          onContactSupportClick={() => {
            closePanel();
            setSupportOpen(true);
          }}
          onTicketsClick={() => {
            closePanel();
            setTicketsOpen(true);
          }}
          onLogout={() => {
            void logout().then(() =>
              navigate({ to: "/login", search: { redirect: "/dashboard" }, replace: true }),
            );
          }}
          onNavigate={(view) => {
            if (view === 'overview') navigate({ to: '/dashboard' });
          }}
        />

        {/* Middle Container: AppSidebar on Left, Main Content on Right */}
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          <AppSidebar
            isEditing={globalSettingsOpen && activeSettingsTab === 'sidebar'}
            autoHideSidebar={sidebarAutoHide}
            expandedWidth={sidebarExpandedWidth}
            collapsedWidth={sidebarCollapsedWidth}
            showIcons={sidebarShowIcons}
            showLabels={sidebarShowLabels}
            forceCollapsed={forceSidebarCollapsed}
          />
          <main className={`flex-1 overflow-auto ${darkTheme ? 'bg-[#050814] text-white' : 'bg-background'}`}>{children}</main>
        </div>

        {/* Full-width Footer on Bottom */}
        <footer className={`h-9 border-t flex items-center justify-between px-6 text-xs shrink-0 z-30 ${darkTheme ? 'bg-[#070b19] border-slate-800 text-slate-400' : 'bg-card border-border text-muted-foreground'} ${globalSettingsOpen && activeSettingsTab === 'footer' ? 'editing-focus' : ''}`}>
          <span>Ready</span>
          <span>© 2026 OomniEye. All rights reserved.</span>
          <span className="font-semibold tracking-wider text-emerald-600">ALLCAD</span>
        </footer>

        <MyTicketsSheet open={ticketsOpen} onOpenChange={setTicketsOpen} />
        {supportOpen && (
          <ContactSupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
        )}
        {globalSettingsOpen && (
          <GlobalSettingsWorkspace
            onClose={() => { setGlobalSettingsOpen(false); setForceSidebarCollapsed(null); }}
            onTabChange={(tab) => setActiveSettingsTab(tab)}
            onSyncCustomerProfile={(data) => setCustomerProfileData(prev => ({ ...prev, ...data }))}
            headerConfig={headerConfig}
            onSaveConfig={(cfg) => setHeaderConfig(cfg)}
            sidebarAutoHide={sidebarAutoHide}
            setSidebarAutoHide={setSidebarAutoHide}
            sidebarExpandedWidth={sidebarExpandedWidth}
            setSidebarExpandedWidth={setSidebarExpandedWidth}
            sidebarCollapsedWidth={sidebarCollapsedWidth}
            setSidebarCollapsedWidth={setSidebarCollapsedWidth}
            sidebarShowIcons={sidebarShowIcons}
            setSidebarShowIcons={setSidebarShowIcons}
            sidebarShowLabels={sidebarShowLabels}
            setSidebarShowLabels={setSidebarShowLabels}
            onSyncFooter={() => {}}
            setSidebarCollapsed={(collapsed) => setForceSidebarCollapsed(collapsed)}
          />
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
