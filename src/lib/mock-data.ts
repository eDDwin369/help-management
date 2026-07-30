import type { HelpItem, MissingHelpArea, Ticket } from "./types";

const TENANT = "tenant-omnieye";

let helpItems: HelpItem[] = [
  {
    id: "h_1",
    tenantId: TENANT,
    componentKey: "md-search",
    componentLabel: "Search Drawings",
    title: "Searching your drawings",
    description: "Use the search bar to filter drawings by name, tag or owner.",
    contentType: "video",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnail: "",
    tags: ["onboarding", "search"],
    status: "approved",
    archived: false,
    addedBy: "Priya Natarajan",
    createdAt: "2026-04-12T10:24:00Z",
    updatedAt: "2026-05-02T08:10:00Z",
    sectionType: "button",
    durationSec: 142,
  },
  {
    id: "h_2",
    tenantId: TENANT,
    componentKey: "md-list-view",
    componentLabel: "List View — My Drawings",
    title: "Switching between list and grid views",
    description: "Recommended layouts for browsing large drawing libraries.",
    contentType: "pdf",
    url: "https://www.africau.edu/images/default/sample.pdf",
    tags: ["best-practices"],
    status: "approved",
    archived: false,
    addedBy: "Marcus Lee",
    createdAt: "2026-03-30T09:00:00Z",
    updatedAt: "2026-04-01T11:30:00Z",
    sectionType: "component",
    sizeKb: 248,
  },
  {
    id: "h_3",
    tenantId: TENANT,
    componentKey: "md-new",
    componentLabel: "New Folder / File",
    title: "Creating a new folder or uploading a drawing",
    description: "Screenshot guide walking through the New menu.",
    contentType: "image",
    url: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200",
    tags: ["upload"],
    status: "approved",
    archived: false,
    addedBy: "Priya Natarajan",
    createdAt: "2026-04-18T14:12:00Z",
    updatedAt: "2026-04-18T14:12:00Z",
    sectionType: "button",
  },
  {
    id: "h_4",
    tenantId: TENANT,
    componentKey: "dv-pdf-viewer",
    componentLabel: "PDF Viewer — Drawing Videos",
    title: "Navigating the drawing PDF viewer",
    description: "Pan, zoom, rotate and fit-to-screen controls explained.",
    contentType: "text",
    body: "## PDF Viewer\n\nUse the toolbar above the drawing to **pan**, **zoom**, **rotate** or **fit to screen**.\n\n### Tips\n- Double-click a pin to open its time-lapse video.\n- Use the date navigator to jump between snapshots.",
    tags: ["pdf", "viewer"],
    status: "approved",
    archived: false,
    addedBy: "Aisha Khan",
    createdAt: "2026-04-22T11:00:00Z",
    updatedAt: "2026-05-10T09:45:00Z",
    sectionType: "screen",
  },
  {
    id: "h_5",
    tenantId: TENANT,
    componentKey: "dv-date-nav",
    componentLabel: "Date Navigator — Drawing Videos",
    title: "Jumping between snapshot dates",
    description: "Step-by-step guide to the date picker and arrow controls.",
    contentType: "pdf",
    url: "https://www.africau.edu/images/default/sample.pdf",
    tags: ["navigation"],
    status: "unapproved",
    archived: false,
    addedBy: "Marcus Lee",
    createdAt: "2026-05-14T13:20:00Z",
    updatedAt: "2026-05-14T13:20:00Z",
    sectionType: "button",
    sizeKb: 412,
  },
  {
    id: "h_6",
    tenantId: TENANT,
    componentKey: "sr-filter",
    componentLabel: "Filter — Site Recordings",
    title: "Advanced filtering operators",
    description: "Combine date, resolution and duration filters with boolean logic.",
    contentType: "text",
    body: "Filters support **AND**/**OR** expressions. Click *Filter* and choose *Advanced*.",
    tags: ["filter", "advanced"],
    status: "approved",
    archived: false,
    addedBy: "Aisha Khan",
    createdAt: "2026-02-08T09:00:00Z",
    updatedAt: "2026-02-08T09:00:00Z",
    sectionType: "button",
  },
  {
    id: "h_7",
    tenantId: TENANT,
    componentKey: "sr-grid-view",
    componentLabel: "Grid View — Site Recordings",
    title: "Recording card thumbnails explained",
    description: "What each badge on the recording card means.",
    contentType: "image",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200",
    tags: ["recordings"],
    status: "approved",
    archived: false,
    addedBy: "Marcus Lee",
    createdAt: "2026-05-04T08:00:00Z",
    updatedAt: "2026-05-04T08:00:00Z",
    sectionType: "component",
  },
  {
    id: "h_8",
    tenantId: TENANT,
    componentKey: "msp-patrol-list",
    componentLabel: "Patrol List",
    title: "Reading the patrol list",
    description: "Understand patrol IDs, sessions and the date range filter.",
    contentType: "video",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    tags: ["patrol"],
    status: "approved",
    archived: false,
    addedBy: "Priya Natarajan",
    createdAt: "2026-05-09T10:00:00Z",
    updatedAt: "2026-05-09T10:00:00Z",
    sectionType: "component",
    durationSec: 96,
  },
  {
    id: "h_9",
    tenantId: TENANT,
    componentKey: "msp-video-viewer",
    componentLabel: "Patrol Video Viewer",
    title: "Playing back a patrol recording",
    description: "Mute, scrub and fullscreen controls for patrol playback.",
    contentType: "text",
    body: "The **Patrol Video Viewer** plays back the recording attached to the selected patrol.\n\n- Click the speaker icon to toggle audio.\n- Use the fullscreen button (top-right) for an immersive review.",
    tags: ["playback"],
    status: "approved",
    archived: false,
    addedBy: "Aisha Khan",
    createdAt: "2026-05-16T12:00:00Z",
    updatedAt: "2026-05-16T12:00:00Z",
    sectionType: "screen",
  },
  {
    id: "h_10",
    tenantId: TENANT,
    componentKey: "hdr-settings",
    componentLabel: "Global Settings",
    title: "Opening the Global Settings panel",
    description: "Where to find tenant-wide branding, security and cache controls.",
    contentType: "image",
    url: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=1200",
    tags: ["admin"],
    status: "approved",
    archived: false,
    addedBy: "Marcus Lee",
    createdAt: "2026-04-02T09:00:00Z",
    updatedAt: "2026-04-02T09:00:00Z",
    sectionType: "button",
  },
  {
    id: "h_11",
    tenantId: TENANT,
    componentKey: "gs-company-logo",
    componentLabel: "Company Logo — Global Settings",
    title: "Uploading a company logo",
    description: "Recommended sizes, formats and transparent-background tips.",
    contentType: "pdf",
    url: "https://www.africau.edu/images/default/sample.pdf",
    tags: ["branding"],
    status: "approved",
    archived: false,
    addedBy: "Priya Natarajan",
    createdAt: "2026-03-20T08:00:00Z",
    updatedAt: "2026-03-20T08:00:00Z",
    sectionType: "component",
    sizeKb: 312,
  },
  {
    id: "h_12",
    tenantId: TENANT,
    componentKey: "gs-preview",
    componentLabel: "Preview Changes — Global Settings",
    title: "Previewing branding before saving",
    description: "How the preview overlay works without affecting live tenants.",
    contentType: "text",
    body: "Click **Preview Changes** to see edits applied to a sandboxed copy of the app before committing with *Save Changes*.",
    tags: ["preview"],
    status: "approved",
    archived: false,
    addedBy: "Aisha Khan",
    createdAt: "2026-05-21T15:00:00Z",
    updatedAt: "2026-05-21T15:00:00Z",
    sectionType: "button",
  },
  {
    id: "h_13",
    tenantId: TENANT,
    componentKey: "md-list-view",
    componentLabel: "List View — My Drawings",
    title: "Legacy list view (deprecated)",
    description: "Old list layout retired in v4.2.",
    contentType: "image",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200",
    tags: ["legacy"],
    status: "approved",
    archived: true,
    addedBy: "Marcus Lee",
    createdAt: "2025-11-04T08:00:00Z",
    updatedAt: "2026-01-20T08:00:00Z",
    sectionType: "button",
  },
];

let tickets: Ticket[] = [
  {
    id: "TCK-10248",
    tenantId: TENANT,
    userId: "u_customer",
    subject: "Drawing thumbnail not loading",
    description: "Thumbnails are blank for PDFs uploaded after May 10.",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-05-18T10:24:00Z",
    updatedAt: "2026-05-21T16:00:00Z",
    attachments: [{ name: "screenshot.png", size: 124000 }],
    componentKey: "md-list-view",
  },
  {
    id: "TCK-10231",
    tenantId: TENANT,
    userId: "u_customer",
    subject: "Cannot export recording > 5 min",
    description: "Export job fails at 92%.",
    status: "waiting",
    priority: "urgent",
    createdAt: "2026-05-15T08:00:00Z",
    updatedAt: "2026-05-20T11:30:00Z",
    attachments: [],
    componentKey: "sr-bulk-download",
  },
  {
    id: "TCK-10198",
    tenantId: TENANT,
    userId: "u_customer",
    subject: "Add bulk archive action",
    description: "Feature request",
    status: "open",
    priority: "low",
    createdAt: "2026-05-09T14:00:00Z",
    updatedAt: "2026-05-09T14:00:00Z",
    attachments: [],
  },
  {
    id: "TCK-10142",
    tenantId: TENANT,
    userId: "u_customer",
    subject: "Login redirect loop on SSO",
    description: "Resolved via cache clear.",
    status: "closed",
    priority: "medium",
    createdAt: "2026-04-28T09:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
    attachments: [],
  },
];

const missingAreas: MissingHelpArea[] = [
  {
    id: "ma_1",
    screen: "Site Recordings",
    componentKey: "sr-bulk-download",
    componentLabel: "Bulk Download",
    reason: "No help content authored",
    suggestedAction: "Record 60-sec walkthrough",
    route: "/dashboard",
  },
  {
    id: "ma_2",
    screen: "My Site Patrol",
    componentKey: "msp-tree-view",
    componentLabel: "Tree View",
    reason: "Help item archived without replacement",
    suggestedAction: "Republish updated guide",
    route: "/dashboard",
  },
  {
    id: "ma_3",
    screen: "Drawing - Videos",
    componentKey: "dv-session-selector",
    componentLabel: "Session Selector",
    reason: "Feature shipped without docs",
    suggestedAction: "Author short text guide",
    route: "/dashboard",
  },
  {
    id: "ma_4",
    screen: "Header",
    componentKey: "hdr-refresh",
    componentLabel: "Refresh",
    reason: "No help content authored",
    suggestedAction: "Add tooltip help text",
    route: "/dashboard",
  },
  {
    id: "ma_5",
    screen: "Global Settings",
    componentKey: "gs-security",
    componentLabel: "Security Tab",
    reason: "No help content authored",
    suggestedAction: "Author PDF policy guide",
    route: "/dashboard",
  },
  {
    id: "ma_6",
    screen: "My Drawings",
    componentKey: "md-favorites",
    componentLabel: "Favorites",
    reason: "Feature shipped without docs",
    suggestedAction: "Add image walkthrough",
    route: "/dashboard",
  },
];

// Listener registry for reactivity
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const helpStore = {
  list: () => helpItems,
  byComponent: (key: string, includeArchived = false) =>
    helpItems.filter(
      (h) =>
        h.componentKey === key &&
        h.sectionType !== "screen" &&
        h.status === "approved" &&
        (includeArchived || !h.archived),
    ),
  /** Screen-level help — covers the whole page/section, not any specific button. */
  byScreen: (screenKey: string) =>
    helpItems.filter(
      (h) =>
        h.componentKey === screenKey &&
        h.sectionType === "screen" &&
        h.status === "approved" &&
        !h.archived,
    ),
  allByComponent: (key: string) => helpItems.filter((h) => h.componentKey === key),

  add: (item: HelpItem) => {
    helpItems = [item, ...helpItems];
    emit();
  },
  update: (id: string, patch: Partial<HelpItem>) => {
    helpItems = helpItems.map((h) =>
      h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h,
    );
    emit();
  },
  remove: (id: string) => {
    helpItems = helpItems.filter((h) => h.id !== id);
    emit();
  },
};

export const ticketStore = {
  list: () => tickets,
  byUser: (userId: string) => tickets.filter((t) => t.userId === userId),
  add: (t: Ticket) => {
    tickets = [t, ...tickets];
    emit();
  },
};

export const areaStore = {
  list: () => missingAreas,
};

// Registered components in the app — used to compute "areas without help".
// Mirrors the real screens the customer sees (My Drawings, Drawing - Videos,
// My Site Patrol, Site Recordings, Header, Global Settings).
export const REGISTERED_COMPONENTS: { key: string; label: string; screen: string }[] = [
  // My Drawings
  { key: "md-search", label: "Search Drawings", screen: "My Drawings" },
  { key: "md-favorites", label: "Favorites", screen: "My Drawings" },
  { key: "md-list-view", label: "List View", screen: "My Drawings" },
  { key: "md-grid-view", label: "Grid View", screen: "My Drawings" },
  { key: "md-new", label: "New Folder / File", screen: "My Drawings" },
  { key: "md-info", label: "Info Panel", screen: "My Drawings" },

  // Drawing - Videos
  { key: "dv-pdf-viewer", label: "PDF Viewer", screen: "Drawing - Videos" },
  { key: "dv-video-viewer", label: "Time-Lapse Video Viewer", screen: "Drawing - Videos" },
  { key: "dv-session-selector", label: "Session Selector", screen: "Drawing - Videos" },
  { key: "dv-date-nav", label: "Date Navigator", screen: "Drawing - Videos" },
  { key: "dv-pin-list", label: "Drawings With Pins", screen: "Drawing - Videos" },

  // My Site Patrol
  { key: "msp-patrol-list", label: "Patrol List", screen: "My Site Patrol" },
  { key: "msp-search", label: "Search Patrols", screen: "My Site Patrol" },
  { key: "msp-tree-view", label: "Tree View", screen: "My Site Patrol" },
  { key: "msp-report-view", label: "Report View", screen: "My Site Patrol" },
  { key: "msp-video-viewer", label: "Patrol Video Viewer", screen: "My Site Patrol" },

  // Site Recordings
  { key: "sr-search", label: "Search Recordings", screen: "Site Recordings" },
  { key: "sr-filter", label: "Filter", screen: "Site Recordings" },
  { key: "sr-grid-view", label: "Grid View", screen: "Site Recordings" },
  { key: "sr-date-filter", label: "Date Filter", screen: "Site Recordings" },
  { key: "sr-bulk-download", label: "Bulk Download", screen: "Site Recordings" },

  // Header
  { key: "hdr-refresh", label: "Refresh", screen: "Header" },
  { key: "hdr-fullscreen", label: "Fullscreen", screen: "Header" },
  { key: "hdr-settings", label: "Global Settings", screen: "Header" },
  { key: "hdr-profile", label: "Profile Menu", screen: "Header" },

  // Global Settings
  { key: "gs-company-logo", label: "Company Logo", screen: "Global Settings" },
  { key: "gs-company-name", label: "Company Name", screen: "Global Settings" },
  { key: "gs-security", label: "Security Tab", screen: "Global Settings" },
  { key: "gs-customer-profile", label: "Customer Profile", screen: "Global Settings" },
  { key: "gs-preview", label: "Preview Changes", screen: "Global Settings" },
];
