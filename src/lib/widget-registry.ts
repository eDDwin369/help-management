import type { ComponentType } from "react";
import {
  LifeBuoy,
  Ticket as TicketIcon,
  BarChart3,
  Library,
  Users,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Activity,
} from "lucide-react";
import type { Role } from "@/lib/types";

export type WidgetWidth = "third" | "half" | "two-thirds" | "full";

export type WidgetCategory = "for_review" | "for_follow_up" | "for_info" | "for_monitoring";

export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  defaultWidth: WidgetWidth;
  category: WidgetCategory;
  /** Roles allowed to view/add this widget. If empty/undefined, available to all. */
  allowedRoles?: Role[];
}

export interface UserWidgetState {
  id: string;
  width: WidgetWidth;
  order: number;
}

export const WIDTH_STEPS: WidgetWidth[] = ["third", "half", "two-thirds", "full"];

export function getWidgetGridClass(width: WidgetWidth): string {
  switch (width) {
    case "third":
      return "lg:col-span-4 md:col-span-6 col-span-12";
    case "half":
      return "lg:col-span-6 md:col-span-6 col-span-12";
    case "two-thirds":
      return "lg:col-span-8 md:col-span-6 col-span-12";
    case "full":
      return "lg:col-span-12 md:col-span-12 col-span-12";
    default:
      return "lg:col-span-6 md:col-span-6 col-span-12";
  }
}

export function getWidgetWidthLabel(width: WidgetWidth): string {
  switch (width) {
    case "third":
      return "1/3 Width (33%)";
    case "half":
      return "1/2 Width (50%)";
    case "two-thirds":
      return "2/3 Width (66%)";
    case "full":
      return "Full Width (100%)";
    default:
      return "1/2 Width (50%)";
  }
}

/** Registry of all available widgets on the system. */
export const ALL_WIDGETS: WidgetConfig[] = [
  {
    id: "help_approvals",
    title: "Approval Queue",
    description: "Pending help article review queue and SLA status",
    icon: CheckCircle2,
    defaultWidth: "full",
    category: "for_review",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
  {
    id: "missing_areas",
    title: "Areas Without Help",
    description: "High priority gaps requiring documentation",
    icon: AlertTriangle,
    defaultWidth: "full",
    category: "for_info",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
  {
    id: "usage_analytics",
    title: "Usage Analytics",
    description: "Help panel opens, article views, searches, and activity series",
    icon: BarChart3,
    defaultWidth: "full",
    category: "for_monitoring",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
  {
    id: "live_activity",
    title: "Live Activity",
    description: "Real-time user actions and updates feed",
    icon: Activity,
    defaultWidth: "half",
    category: "for_monitoring",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
  {
    id: "ticket_management",
    title: "Ticket Management",
    description: "Support requests raised from the help panel",
    icon: TicketIcon,
    defaultWidth: "half",
    category: "for_follow_up",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
  {
    id: "help_management",
    title: "Help Management",
    description: "Library health across every registered area",
    icon: LifeBuoy,
    defaultWidth: "half",
    category: "for_follow_up",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
  {
    id: "coverage_metrics",
    title: "Coverage Metrics",
    description: "How much of the application has published help",
    icon: Library,
    defaultWidth: "half",
    category: "for_info",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
  {
    id: "user_management",
    title: "User Management",
    description: "Workspace roles and account overview",
    icon: Users,
    defaultWidth: "half",
    category: "for_info",
    allowedRoles: ["admin", "sub_admin", "customer"],
  },
];

const DEFAULT_WIDGET_ORDER: UserWidgetState[] = [
  { id: "help_approvals", width: "two-thirds", order: 0 },
  { id: "live_activity", width: "third", order: 1 },
];

/** Get all widgets allowed for a user's role based on permission rules. */
export function getAvailableWidgetsForRole(role: Role): WidgetConfig[] {
  return ALL_WIDGETS.filter(
    (w) => !w.allowedRoles || w.allowedRoles.includes(role)
  );
}

/** Load user's custom dashboard configuration from local storage. */
export function loadUserDashboardState(userId: string, role: Role): UserWidgetState[] {
  if (typeof window === "undefined") return DEFAULT_WIDGET_ORDER;
  try {
    const key = `dashboard_widgets_v1_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_WIDGET_ORDER;
    const parsed = JSON.parse(raw) as UserWidgetState[];
    if (!Array.isArray(parsed)) return DEFAULT_WIDGET_ORDER;

    // Filter against user permissions
    const allowed = getAvailableWidgetsForRole(role);
    const allowedIds = new Set(allowed.map((a) => a.id));

    return parsed
      .filter((w) => allowedIds.has(w.id))
      .sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_WIDGET_ORDER;
  }
}

/** Save user's custom dashboard configuration to local storage. */
export function saveUserDashboardState(userId: string, state: UserWidgetState[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = `dashboard_widgets_v1_${userId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {}
}

/** Reset user's dashboard configuration to system default. */
export function resetUserDashboardState(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = `dashboard_widgets_v1_${userId}`;
    localStorage.removeItem(key);
  } catch {}
}
