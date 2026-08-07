import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  CONTEXT_ARTICLE_MAP,
  CONTEXT_LABELS,
  detectPageContext,
  initHmsRightClickHandler,
  labelForContext,
} from "@/lib/hms-context-registry";
import { ARTICLE_MEDIA, bodyForArticle, type ArticleSection } from "@/lib/help-content";

export type ContentType = "video" | "pdf" | "image" | "text";
export type ApprovalStatus = "approved" | "pending" | "unapproved";
export type ArchiveStatus = "active" | "archived";
export type TicketStatus = "pending" | "under-review" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent";
export type UserRole = "customer" | "help-admin" | "admin";

export interface HmsAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export interface HmsArticle {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  contentUrl: string | null;
  /** Human readable breadcrumb of where the article was authored. */
  relatedContext: string;
  /** Structured documentation body (text articles + fallback copy). */
  body?: ArticleSection[];
  /** Registered context keys this article is surfaced for. */
  contexts: string[];
  approvalStatus: ApprovalStatus;
  archiveStatus: ArchiveStatus;
  authorId: string;
  authorName: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  priority: Priority;
  sizeBytes?: number;
  pages?: number;
}

export interface HmsTicket {
  id: string;
  subject: string;
  description: string;
  priority: Priority;
  tags: string[];
  status: TicketStatus;
  authorId: string;
  authorName: string;
  authorEmail: string;
  context: string;
  attachments: HmsAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface Notifications {
  customer: number;
  helpAdmin: number;
  admin: number;
}

export interface HmsState {
  articles: HmsArticle[];
  tickets: HmsTicket[];
  notifications: Notifications;
}

export { CONTEXT_LABELS, CONTEXT_ARTICLE_MAP };

/** Backwards-compatible alias used by older call sites. */
export const COMPONENT_CONTEXT_MAP = CONTEXT_LABELS;

export function detectContext(pathname: string): string {
  return detectPageContext(pathname).context;
}

function article(a: Omit<HmsArticle, "authorId" | "relatedContext"> & { authorId?: string }): HmsArticle {
  return {
    authorId: a.authorId ?? "seed",
    relatedContext: labelForContext(a.contexts[0] ?? "app-header"),
    ...a,
    contentUrl: a.contentUrl ?? ARTICLE_MEDIA[a.id] ?? null,
    body: bodyForArticle(a.id),
  } as HmsArticle;
}

const APPROVED = {
  approvalStatus: "approved" as ApprovalStatus,
  archiveStatus: "active" as ArchiveStatus,
  approvedBy: "Jordan Admin",
};

const SEED_ARTICLES: HmsArticle[] = [
  article({
    id: "art-001",
    title: "Getting started with Site Recordings",
    description: "A walkthrough of the basic recording interface and all available columns.",
    contentType: "video",
    contentUrl: null,
    contexts: ["site-recordings-table", "site-recordings-col-recording", "site-recordings-row", "app-tab-site-recordings"],
    ...APPROVED,
    approvedAt: "2026-07-18T11:00:00Z",
    createdAt: "2026-07-18T09:00:00Z",
    updatedAt: "2026-07-18T11:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["recordings", "table", "basics"],
    priority: "medium",
    sizeBytes: 4_280_000,
  }),
  article({
    id: "art-002",
    title: "Site Recordings Table — Full Guide",
    description: "A walkthrough of the recording interface columns, sorting, and pagination.",
    contentType: "pdf",
    contentUrl: null,
    contexts: ["site-recordings-table", "site-recordings-breadcrumb", "app-tab-site-recordings"],
    ...APPROVED,
    approvedAt: "2026-07-18T12:00:00Z",
    createdAt: "2026-07-18T10:00:00Z",
    updatedAt: "2026-07-20T17:15:00Z",
    authorName: "Marcus Lee",
    tags: ["recordings", "table", "guide"],
    priority: "medium",
    pages: 3,
    sizeBytes: 2_400_000,
  }),
  article({
    id: "art-003",
    title: "Pin Location Reference Map",
    description: "Understand pin labels, session IDs and location codes in the recordings table.",
    contentType: "image",
    contentUrl: null,
    contexts: ["site-recordings-table", "site-recordings-col-pin", "site-recordings-row"],
    ...APPROVED,
    approvedAt: "2026-07-18T13:00:00Z",
    createdAt: "2026-07-18T08:00:00Z",
    updatedAt: "2026-07-18T13:00:00Z",
    authorName: "Aisha Khan",
    tags: ["pin", "location", "map"],
    priority: "low",
    sizeBytes: 820_000,
  }),
  article({
    id: "art-004",
    title: "Searching recordings by name or tag",
    description: "How to use the search bar to find recordings quickly.",
    contentType: "text",
    contentUrl: null,
    contexts: ["site-recordings-search"],
    ...APPROVED,
    approvedAt: "2026-07-19T09:00:00Z",
    createdAt: "2026-07-19T08:00:00Z",
    updatedAt: "2026-07-19T09:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["search", "filter"],
    priority: "low",
  }),
  article({
    id: "art-005",
    title: "Advanced filtering operators",
    description: "Combine date, resolution and duration filters with boolean logic.",
    contentType: "pdf",
    contentUrl: null,
    contexts: ["site-recordings-filter"],
    ...APPROVED,
    approvedAt: "2026-07-19T10:00:00Z",
    createdAt: "2026-07-19T09:00:00Z",
    updatedAt: "2026-07-19T10:00:00Z",
    authorName: "Marcus Lee",
    tags: ["filter", "advanced"],
    priority: "medium",
    pages: 2,
    sizeBytes: 1_100_000,
  }),
  article({
    id: "art-006",
    title: "Using the Last 30 Days date filter",
    description: "Step-by-step guide to the date picker and arrow controls.",
    contentType: "video",
    contentUrl: null,
    contexts: ["site-recordings-date-filter"],
    approvalStatus: "pending",
    archiveStatus: "active",
    approvedBy: null,
    approvedAt: null,
    createdAt: "2026-07-20T09:00:00Z",
    updatedAt: "2026-07-20T09:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["dates", "filter", "navigation"],
    priority: "medium",
  }),
  article({
    id: "art-007",
    title: "Switching between list and grid views",
    description: "Recommended layouts for browsing large recording libraries.",
    contentType: "text",
    contentUrl: null,
    contexts: ["site-recordings-view-toggle"],
    ...APPROVED,
    approvedAt: "2026-07-15T10:00:00Z",
    createdAt: "2026-07-15T09:00:00Z",
    updatedAt: "2026-07-15T10:00:00Z",
    authorName: "Aisha Khan",
    tags: ["layout", "grid", "list"],
    priority: "low",
  }),
  article({
    id: "art-008",
    title: "How session numbers are assigned",
    description: "Sessions group recordings captured between site check-in and check-out.",
    contentType: "text",
    contentUrl: null,
    contexts: ["site-recordings-col-session"],
    ...APPROVED,
    approvedAt: "2026-07-15T12:00:00Z",
    createdAt: "2026-07-15T11:00:00Z",
    updatedAt: "2026-07-15T12:00:00Z",
    authorName: "Marcus Lee",
    tags: ["session", "recordings"],
    priority: "low",
  }),
  article({
    id: "art-009",
    title: "Decoding pin location codes",
    description: "What L1, L2 and the KL-Ar prefixes mean on a site plan.",
    contentType: "image",
    contentUrl: null,
    contexts: ["site-recordings-col-pin"],
    ...APPROVED,
    approvedAt: "2026-07-15T13:00:00Z",
    createdAt: "2026-07-15T12:00:00Z",
    updatedAt: "2026-07-15T13:00:00Z",
    authorName: "Aisha Khan",
    tags: ["pin", "codes"],
    priority: "low",
    sizeBytes: 640_000,
  }),
  article({
    id: "art-010",
    title: "Browsing and searching your drawings",
    description: "Use the search bar to filter drawings by name, tag or owner.",
    contentType: "video",
    contentUrl: null,
    contexts: ["app-tab-my-drawings", "my-drawings-table", "my-drawings-breadcrumb", "app-nav-drawings"],
    ...APPROVED,
    approvedAt: "2026-07-10T10:00:00Z",
    createdAt: "2026-07-10T09:00:00Z",
    updatedAt: "2026-07-10T10:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["drawings", "search"],
    priority: "low",
    sizeBytes: 3_200_000,
  }),
  article({
    id: "art-011",
    title: "Creating a new folder or uploading a drawing",
    description: "Screenshot guide walking through the New menu.",
    contentType: "image",
    contentUrl: null,
    contexts: ["app-tab-my-drawings", "my-drawings-table"],
    ...APPROVED,
    approvedAt: "2026-07-10T11:00:00Z",
    createdAt: "2026-07-10T10:00:00Z",
    updatedAt: "2026-07-10T11:00:00Z",
    authorName: "Marcus Lee",
    tags: ["drawings", "upload", "folder"],
    priority: "medium",
    sizeBytes: 910_000,
  }),
  article({
    id: "art-012",
    title: "Search tips for large drawing sets",
    description: "Wildcards, owner filters and recently-opened shortcuts.",
    contentType: "text",
    contentUrl: null,
    contexts: ["my-drawings-search"],
    ...APPROVED,
    approvedAt: "2026-07-11T10:00:00Z",
    createdAt: "2026-07-11T09:00:00Z",
    updatedAt: "2026-07-11T10:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["drawings", "search", "tips"],
    priority: "low",
  }),
  article({
    id: "art-013",
    title: "Working in list view",
    description: "Column sorting, multi-select and bulk actions in the list layout.",
    contentType: "text",
    contentUrl: null,
    contexts: ["my-drawings-list-view"],
    ...APPROVED,
    approvedAt: "2026-07-11T11:00:00Z",
    createdAt: "2026-07-11T10:00:00Z",
    updatedAt: "2026-07-11T11:00:00Z",
    authorName: "Aisha Khan",
    tags: ["drawings", "list"],
    priority: "low",
  }),
  article({
    id: "art-014",
    title: "Working in grid view",
    description: "Thumbnail previews, hover actions and density settings.",
    contentType: "image",
    contentUrl: null,
    contexts: ["my-drawings-grid-view"],
    ...APPROVED,
    approvedAt: "2026-07-11T12:00:00Z",
    createdAt: "2026-07-11T11:00:00Z",
    updatedAt: "2026-07-11T12:00:00Z",
    authorName: "Aisha Khan",
    tags: ["drawings", "grid"],
    priority: "low",
    sizeBytes: 720_000,
  }),
  article({
    id: "art-015",
    title: "Uploading files with the New button",
    description: "Supported formats, size limits and folder placement rules.",
    contentType: "video",
    contentUrl: null,
    contexts: ["my-drawings-new-button"],
    ...APPROVED,
    approvedAt: "2026-07-11T13:00:00Z",
    createdAt: "2026-07-11T12:00:00Z",
    updatedAt: "2026-07-11T13:00:00Z",
    authorName: "Marcus Lee",
    tags: ["upload", "folder", "new"],
    priority: "medium",
    sizeBytes: 2_900_000,
  }),
  article({
    id: "art-016",
    title: "Navigating the drawing PDF viewer",
    description: "Pan, zoom, rotate and fit-to-screen controls explained.",
    contentType: "pdf",
    contentUrl: null,
    contexts: ["app-tab-drawing-videos", "drawing-videos-pdf-viewer"],
    ...APPROVED,
    approvedAt: "2026-07-12T10:00:00Z",
    createdAt: "2026-07-12T09:00:00Z",
    updatedAt: "2026-07-12T10:00:00Z",
    authorName: "Aisha Khan",
    tags: ["pdf", "viewer", "drawing"],
    priority: "medium",
    pages: 2,
    sizeBytes: 1_800_000,
  }),
  article({
    id: "art-017",
    title: "Jumping between snapshot dates",
    description: "Step-by-step guide to the date navigator and arrow controls.",
    contentType: "text",
    contentUrl: null,
    contexts: ["app-tab-drawing-videos", "drawing-videos-date-navigator"],
    ...APPROVED,
    approvedAt: "2026-07-13T10:00:00Z",
    createdAt: "2026-07-13T09:00:00Z",
    updatedAt: "2026-07-13T10:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["dates", "navigation", "snapshot"],
    priority: "low",
  }),
  article({
    id: "art-018",
    title: "Reading a time-lapse sequence",
    description: "Playback speed, frame stepping and comparing two dates side by side.",
    contentType: "video",
    contentUrl: null,
    contexts: ["drawing-videos-time-lapse"],
    ...APPROVED,
    approvedAt: "2026-07-13T12:00:00Z",
    createdAt: "2026-07-13T11:00:00Z",
    updatedAt: "2026-07-13T12:00:00Z",
    authorName: "Marcus Lee",
    tags: ["time-lapse", "playback"],
    priority: "medium",
    sizeBytes: 5_400_000,
  }),
  article({
    id: "art-019",
    title: "Header actions explained",
    description: "Refresh, fullscreen, support, tickets and workspace settings.",
    contentType: "text",
    contentUrl: null,
    contexts: ["app-header"],
    ...APPROVED,
    approvedAt: "2026-07-14T08:00:00Z",
    createdAt: "2026-07-14T07:00:00Z",
    updatedAt: "2026-07-14T08:00:00Z",
    authorName: "Aisha Khan",
    tags: ["header", "navigation"],
    priority: "low",
  }),
  article({
    id: "art-020",
    title: "Navigating with the sidebar",
    description: "Switch between dashboard, tickets and admin areas.",
    contentType: "image",
    contentUrl: null,
    contexts: ["app-sidebar"],
    ...APPROVED,
    approvedAt: "2026-07-14T09:00:00Z",
    createdAt: "2026-07-14T08:00:00Z",
    updatedAt: "2026-07-14T09:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["sidebar", "navigation"],
    priority: "low",
    sizeBytes: 480_000,
  }),
  article({
    id: "art-021",
    title: "Understanding your ticket dashboard",
    description: "What each ticket status card means and how to filter by status.",
    contentType: "text",
    contentUrl: null,
    contexts: ["tickets-table", "tickets-open-card", "app-nav-tickets"],
    ...APPROVED,
    approvedAt: "2026-07-14T10:00:00Z",
    createdAt: "2026-07-14T09:00:00Z",
    updatedAt: "2026-07-14T10:00:00Z",
    authorName: "Marcus Lee",
    tags: ["tickets", "dashboard", "status"],
    priority: "medium",
  }),
  article({
    id: "art-022",
    title: "Raising an effective support ticket",
    description: "What to include so support can resolve your request on the first pass.",
    contentType: "pdf",
    contentUrl: null,
    contexts: ["tickets-new-button"],
    ...APPROVED,
    approvedAt: "2026-07-14T12:00:00Z",
    createdAt: "2026-07-14T11:00:00Z",
    updatedAt: "2026-07-14T12:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["tickets", "support"],
    priority: "medium",
    pages: 2,
    sizeBytes: 700_000,
  }),
  article({
    id: "art-023",
    title: "Reading the Admin Overview dashboard",
    description: "Understand help items, ticket counts, coverage and graph metrics.",
    contentType: "pdf",
    contentUrl: null,
    contexts: ["admin-overview-tab", "admin-help-mgmt-card"],
    ...APPROVED,
    approvedAt: "2026-07-16T10:00:00Z",
    createdAt: "2026-07-16T09:00:00Z",
    updatedAt: "2026-07-16T10:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["admin", "dashboard", "overview"],
    priority: "high",
    pages: 3,
    sizeBytes: 3_100_000,
  }),
  article({
    id: "art-024",
    title: "Using the Content Library",
    description: "How to search, filter, approve, archive and delete articles.",
    contentType: "video",
    contentUrl: null,
    contexts: ["admin-content-library-tab"],
    ...APPROVED,
    approvedAt: "2026-07-16T11:00:00Z",
    createdAt: "2026-07-16T10:00:00Z",
    updatedAt: "2026-07-16T11:00:00Z",
    authorName: "Aisha Khan",
    tags: ["admin", "content", "library"],
    priority: "high",
    sizeBytes: 6_200_000,
  }),
  article({
    id: "art-025",
    title: "Identifying and resolving coverage gaps",
    description: "How to read the Areas Without Help tab and prioritise content creation.",
    contentType: "text",
    contentUrl: null,
    contexts: ["admin-coverage-tab", "admin-coverage-card"],
    ...APPROVED,
    approvedAt: "2026-07-17T10:00:00Z",
    createdAt: "2026-07-17T09:00:00Z",
    updatedAt: "2026-07-17T10:00:00Z",
    authorName: "Marcus Lee",
    tags: ["coverage", "gaps", "admin"],
    priority: "medium",
  }),
  article({
    id: "art-026",
    title: "Interpreting the activity graphs",
    description: "Trend lines, content mix and ticket velocity in the graph view.",
    contentType: "image",
    contentUrl: null,
    contexts: ["admin-graph-view", "admin-content-mix"],
    ...APPROVED,
    approvedAt: "2026-07-17T12:00:00Z",
    createdAt: "2026-07-17T11:00:00Z",
    updatedAt: "2026-07-17T12:00:00Z",
    authorName: "Priya Natarajan",
    tags: ["admin", "graphs", "metrics"],
    priority: "medium",
    sizeBytes: 540_000,
  }),
];

const SEED_TICKETS: HmsTicket[] = [
  {
    id: "TCK-10231",
    subject: "Cannot filter recordings by date range",
    description: "Clicking Last 30 Days does not update the table results as expected.",
    priority: "medium",
    tags: ["filter", "date-range"],
    status: "pending",
    authorId: "cust-001",
    authorName: "Riya Customer",
    authorEmail: "customer@oomnieye.com",
    context: "Site Recordings › Table",
    attachments: [],
    createdAt: "2026-07-20T14:00:00Z",
    updatedAt: "2026-07-20T14:00:00Z",
  },
  {
    id: "TCK-10219",
    subject: "Pin location map not loading on mobile",
    description: "The pin location map does not render on iOS Safari.",
    priority: "high",
    tags: ["pin", "mobile"],
    status: "under-review",
    authorId: "cust-001",
    authorName: "Riya Customer",
    authorEmail: "customer@oomnieye.com",
    context: "Site Recordings › Table",
    attachments: [],
    createdAt: "2026-07-19T10:00:00Z",
    updatedAt: "2026-07-19T10:00:00Z",
  },
  {
    id: "TCK-10198",
    subject: "Export to PDF produces blank output",
    description: "The PDF export button generates a blank file.",
    priority: "urgent",
    tags: ["export", "pdf"],
    status: "resolved",
    authorId: "cust-001",
    authorName: "Riya Customer",
    authorEmail: "customer@oomnieye.com",
    context: "My Drawings",
    attachments: [],
    createdAt: "2026-07-18T08:00:00Z",
    updatedAt: "2026-07-18T16:00:00Z",
  },
];

const DEFAULT_STATE: HmsState = {
  articles: SEED_ARTICLES,
  tickets: SEED_TICKETS,
  notifications: { customer: 0, helpAdmin: 0, admin: 0 },
};

const STORAGE_KEY = "hmsStore.v2";

function loadPersistedState(): HmsState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<HmsState>;
    if (!Array.isArray(parsed.articles) || !Array.isArray(parsed.tickets)) return DEFAULT_STATE;
    return {
      articles: parsed.articles.map((a) => ({
        ...a,
        contexts: a.contexts ?? [],
        contentUrl: a.contentUrl ?? ARTICLE_MEDIA[a.id] ?? null,
        body: a.body ?? bodyForArticle(a.id),
      })),
      tickets: parsed.tickets,
      notifications: parsed.notifications ?? DEFAULT_STATE.notifications,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

type Action =
  | { type: "HYDRATE"; state: HmsState }
  | { type: "ADD_ARTICLE"; article: HmsArticle }
  | { type: "UPDATE_ARTICLE"; id: string; fields: Partial<HmsArticle> }
  | { type: "APPROVE_ARTICLE"; id: string; adminName: string }
  | { type: "UNAPPROVE_ARTICLE"; id: string }
  | { type: "ARCHIVE_ARTICLE"; id: string }
  | { type: "DELETE_ARTICLE"; id: string }
  | { type: "SUBMIT_TICKET"; ticket: HmsTicket }
  | { type: "DISMISS_NOTIFICATIONS"; role: UserRole };

function reducer(state: HmsState, action: Action): HmsState {
  const now = new Date().toISOString();
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "ADD_ARTICLE":
      return {
        ...state,
        articles: [action.article, ...state.articles],
        notifications:
          action.article.approvalStatus === "pending"
            ? { ...state.notifications, admin: state.notifications.admin + 1 }
            : { ...state.notifications, customer: state.notifications.customer + 1 },
      };
    case "UPDATE_ARTICLE":
      return {
        ...state,
        articles: state.articles.map((a) =>
          a.id === action.id ? { ...a, ...action.fields, updatedAt: now } : a,
        ),
      };
    case "APPROVE_ARTICLE":
      return {
        ...state,
        articles: state.articles.map((a) =>
          a.id === action.id
            ? {
                ...a,
                approvalStatus: "approved",
                approvedBy: action.adminName,
                approvedAt: now,
                updatedAt: now,
              }
            : a,
        ),
        notifications: {
          ...state.notifications,
          customer: state.notifications.customer + 1,
        },
      };
    case "UNAPPROVE_ARTICLE":
      return {
        ...state,
        articles: state.articles.map((a) =>
          a.id === action.id ? { ...a, approvalStatus: "unapproved", updatedAt: now } : a,
        ),
      };
    case "ARCHIVE_ARTICLE":
      return {
        ...state,
        articles: state.articles.map((a) =>
          a.id === action.id
            ? {
                ...a,
                archiveStatus: a.archiveStatus === "active" ? "archived" : "active",
                updatedAt: now,
              }
            : a,
        ),
      };
    case "DELETE_ARTICLE":
      return { ...state, articles: state.articles.filter((a) => a.id !== action.id) };
    case "SUBMIT_TICKET":
      return {
        ...state,
        tickets: [action.ticket, ...state.tickets],
        notifications: {
          ...state.notifications,
          helpAdmin: state.notifications.helpAdmin + 1,
        },
      };
    case "DISMISS_NOTIFICATIONS": {
      const key =
        action.role === "customer"
          ? "customer"
          : action.role === "help-admin"
            ? "helpAdmin"
            : "admin";
      return { ...state, notifications: { ...state.notifications, [key]: 0 } };
    }
    default:
      return state;
  }
}

/** A view the panel should jump to when opened from outside (e.g. admin table). */
export type PanelRequest =
  | { type: "article"; id: string }
  | { type: "add"; editId?: string };

interface HmsContextValue {
  state: HmsState;
  role: UserRole;
  userName: string;
  userEmail: string;
  userId: string;
  /** Human readable breadcrumb label of the active context. */
  context: string;
  /** Registered key of the active context, e.g. "site-recordings-table". */
  contextKey: string;
  setContext: (key: string, label?: string) => void;
  clearOverride: () => void;
  /** Registers the section the user is currently viewing (tab / page level). */
  setSection: (key: string, label?: string) => void;
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  /** Deep-link request consumed by the panel (opens a specific view). */
  panelRequest: PanelRequest | null;
  requestPanelView: (r: PanelRequest) => void;
  consumePanelRequest: () => void;
  addArticle: (a: HmsArticle) => void;
  updateArticle: (id: string, fields: Partial<HmsArticle>) => void;
  approveArticle: (id: string) => void;
  unapproveArticle: (id: string) => void;
  archiveArticle: (id: string) => void;
  deleteArticle: (id: string) => void;
  submitTicket: (t: HmsTicket) => void;
  dismissNotifications: (role: UserRole) => void;
}

const Ctx = createContext<HmsContextValue | null>(null);

export function HmsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [isOpen, setOpen] = useState(false);
  const [override, setOverride] = useState<{ key: string; label: string } | null>(null);
  const [section, setSectionState] = useState<{ key: string; label: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [panelRequest, setPanelRequest] = useState<PanelRequest | null>(null);

  const role: UserRole =
    user?.role === "admin" ? "admin" : user?.role === "sub_admin" ? "help-admin" : "customer";

  const page = detectPageContext(pathname);
  const contextKey = override?.key ?? section?.key ?? page.context;
  const context = override?.label ?? section?.label ?? page.label;

  // Restore persisted store (shared across role switches within the browser).
  useEffect(() => {
    dispatch({ type: "HYDRATE", state: loadPersistedState() });
    setHydrated(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const safeArticles = state.articles.map((a) => {
        if (a.contentUrl && a.contentUrl.startsWith("data:") && a.contentUrl.length > 200000) {
          return { ...a, contentUrl: a.contentUrl.slice(0, 500) };
        }
        return a;
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, articles: safeArticles }));
    } catch {
      /* storage full or unavailable — non fatal */
    }
  }, [state, hydrated]);

  // Route change resets any right-click override and section registration.
  useEffect(() => {
    setOverride(null);
    setSectionState(null);
  }, [pathname]);

  // Global right-click → detect nearest registered component context.
  // Disabled on the login screen: HMS is not available before sign-in.
  useEffect(() => {
    if (pathname.startsWith("/login") || !user) return;
    return initHmsRightClickHandler((key, label) => {
      setOverride({ key, label });
      setOpen(true);
      dispatch({ type: "DISMISS_NOTIFICATIONS", role });
    });
  }, [role, pathname, user]);

  const setContext = useCallback((key: string, label?: string) => {
    setOverride({ key, label: label ?? labelForContext(key) });
  }, []);

  const clearOverride = useCallback(() => {
    setOverride(null);
  }, []);

  // Section registration: switching section drops any component-level override
  // so the breadcrumb always follows the area the user is actually looking at.
  const setSection = useCallback((key: string, label?: string) => {
    setSectionState((prev) => {
      if (prev?.key === key) return prev;
      setOverride(null);
      return { key, label: label ?? labelForContext(key) };
    });
  }, []);


  const openPanel = useCallback(() => {
    setOpen(true);
    dispatch({ type: "DISMISS_NOTIFICATIONS", role });
  }, [role]);
  const closePanel = useCallback(() => setOpen(false), []);
  const togglePanel = useCallback(() => {
    setOpen((o) => {
      if (!o) dispatch({ type: "DISMISS_NOTIFICATIONS", role });
      return !o;
    });
  }, [role]);

  const requestPanelView = useCallback(
    (r: PanelRequest) => {
      setPanelRequest(r);
      setOpen(true);
      dispatch({ type: "DISMISS_NOTIFICATIONS", role });
    },
    [role],
  );
  const consumePanelRequest = useCallback(() => setPanelRequest(null), []);

  const value: HmsContextValue = useMemo(
    () => ({
      state,
      role,
      userName: user?.name ?? "Guest",
      userEmail: user?.email ?? "",
      userId: user?.id ?? "anon",
      context,
      contextKey,
      setContext,
      clearOverride,
      setSection,
      isOpen,
      openPanel,
      closePanel,
      togglePanel,
      panelRequest,
      requestPanelView,
      consumePanelRequest,
      addArticle: (a) => dispatch({ type: "ADD_ARTICLE", article: a }),
      updateArticle: (id, fields) => dispatch({ type: "UPDATE_ARTICLE", id, fields }),
      approveArticle: (id) =>
        dispatch({ type: "APPROVE_ARTICLE", id, adminName: user?.name ?? "Admin" }),
      unapproveArticle: (id) => dispatch({ type: "UNAPPROVE_ARTICLE", id }),
      archiveArticle: (id) => dispatch({ type: "ARCHIVE_ARTICLE", id }),
      deleteArticle: (id) => dispatch({ type: "DELETE_ARTICLE", id }),
      submitTicket: (t) => dispatch({ type: "SUBMIT_TICKET", ticket: t }),
      dismissNotifications: (r) => dispatch({ type: "DISMISS_NOTIFICATIONS", role: r }),
    }),
    [
      state,
      role,
      user,
      context,
      contextKey,
      setContext,
      setSection,
      isOpen,
      openPanel,
      closePanel,
      togglePanel,
      panelRequest,
      requestPanelView,
      consumePanelRequest,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHmsStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useHmsStore must be used inside HmsProvider");
  return c;
}

function matchesContext(a: HmsArticle, contextKey: string): boolean {
  if (!contextKey || contextKey === "global-search") return true;
  if (a.contexts?.includes(contextKey)) return true;
  return (CONTEXT_ARTICLE_MAP[contextKey] ?? []).includes(a.id);
}

export function getFilteredArticles(
  articles: HmsArticle[],
  role: UserRole,
  contextKey: string,
  filters: { types?: string[]; archive: string; approval: string },
  searchQuery: string,
): HmsArticle[] {
  const q = searchQuery.trim().toLowerCase();
  return articles.filter((a) => {
    if (role === "customer") {
      if (a.approvalStatus !== "approved") return false;
      if (a.archiveStatus !== "active") return false;
    }
    if (!matchesContext(a, contextKey)) return false;
    const types = filters.types ?? [];
    if (types.length > 0 && !types.includes(a.contentType)) return false;
    if (role !== "customer" && filters.archive !== "all" && a.archiveStatus !== filters.archive)
      return false;
    if (role === "admin" && filters.approval !== "all") {
      // "pending" covers everything that is not live for customers yet.
      const isApproved = a.approvalStatus === "approved";
      if (filters.approval === "approved" && !isApproved) return false;
      if (filters.approval === "pending" && isApproved) return false;
    }
    if (q) {
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function generateTicketId(existing: { id: string }[] = []): string {
  const maxNum = existing.reduce((max, t) => {
    const num = parseInt(t.id.replace("TCK-", ""), 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 10000);
  return `TCK-${maxNum + 1}`;
}
