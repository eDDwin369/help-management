/**
 * HMS context registry.
 *
 * Every meaningful UI element carries `data-hms-context` (+ optional
 * `data-hms-label`). The global right-click handler walks up the DOM to find
 * the nearest registered element and reports its context key + label.
 *
 * Section contexts (the `section-*` keys) describe *where* the user is and
 * drive the panel breadcrumb by default. Component contexts extend the
 * section label with a ` › Component` suffix when the user right-clicks.
 */

/** Section keys — one per navigable area of the application. */
export const SECTION_LABELS: Record<string, string> = {
  "section-my-drawings": "My Drawings",
  "section-drawing-videos": "Drawing-Videos",
  "section-site-patrol": "My Site Patrol",
  "section-site-recordings": "Site Recordings",
  "section-tickets": "My Tickets",
  "section-admin-overview": "Dashboard",
  "section-admin-content": "Approvals",
  "section-admin-coverage": "Areas Without Help",
  "section-workspace": "Workspace",
};

export const CONTEXT_LABELS: Record<string, string> = {
  ...SECTION_LABELS,

  // Legacy aliases kept so existing article context keys keep resolving.
  "app-tab-my-drawings": "My Drawings",
  "app-tab-drawing-videos": "Drawing-Videos",
  "app-tab-site-patrol": "My Site Patrol",
  "app-tab-site-recordings": "Site Recordings",
  "admin-overview-tab": "Dashboard",
  "admin-content-library-tab": "Approvals",
  "admin-coverage-tab": "Areas Without Help",

  // Site Recordings
  "site-recordings-breadcrumb": "Site Recordings › Breadcrumb",
  "site-recordings-search": "Site Recordings › Search Bar",
  "site-recordings-view-toggle": "Site Recordings › View Toggle",
  "site-recordings-date-filter": "Site Recordings › Date Filter",
  "site-recordings-filter": "Site Recordings › Filter",
  "site-recordings-table": "Site Recordings › Recordings Table",
  "site-recordings-col-session": "Site Recordings › Session Column",
  "site-recordings-col-pin": "Site Recordings › Pin Location",
  "site-recordings-col-recording": "Site Recordings › Recording Name",
  "site-recordings-col-resolution": "Site Recordings › Resolution",
  "site-recordings-col-date": "Site Recordings › Date & Time",
  "site-recordings-col-session-start": "Site Recordings › Session Started At",
  "site-recordings-col-session-close": "Site Recordings › Session Closed At",
  "site-recordings-col-duration": "Site Recordings › Duration",
  "site-recordings-col-size": "Site Recordings › Size",
  "site-recordings-row": "Site Recordings › Recording Entry",
  "site-recordings-settings": "Site Recordings › Column Settings",

  // My Drawings
  "my-drawings-search": "My Drawings › Search Bar",
  "my-drawings-list-view": "My Drawings › List View",
  "my-drawings-grid-view": "My Drawings › Grid View",
  "my-drawings-filter": "My Drawings › Filter",
  "my-drawings-new-button": "My Drawings › New Folder / File",
  "my-drawings-table": "My Drawings › Drawings Table",
  "my-drawings-row": "My Drawings › Drawing Entry",
  "my-drawings-breadcrumb": "My Drawings › Breadcrumb",

  // Drawing Videos
  "drawing-videos-pdf-viewer": "Drawing-Videos › PDF Viewer",
  "drawing-videos-date-navigator": "Drawing-Videos › Date Navigator",
  "drawing-videos-tab": "Drawing-Videos › Tab",
  "drawing-videos-time-lapse": "Drawing-Videos › Time-Lapse Viewer",
  "drawing-videos-pin-list": "Drawing-Videos › Pin List",
  "drawing-videos-search": "Drawing-Videos › Search Bar",
  "drawing-videos-filter": "Drawing-Videos › Filter",

  // My Site Patrol
  "site-patrol-list": "My Site Patrol › Patrol List",
  "site-patrol-session": "My Site Patrol › Session Entry",
  "site-patrol-video-viewer": "My Site Patrol › Patrol Video Viewer",
  "site-patrol-search": "My Site Patrol › Search Bar",
  "site-patrol-filter": "My Site Patrol › Filter",


  // App shell
  "app-header": "Workspace › Header",
  "app-sidebar": "Workspace › Sidebar",
  "app-nav-drawings": "Workspace › Dashboard Nav",
  "app-nav-tickets": "Workspace › Tickets Nav",
  "app-nav-admin": "Workspace › Admin Nav",
  "app-refresh": "Workspace › Refresh",
  "app-fullscreen": "Workspace › Fullscreen",
  "app-notifications": "Workspace › Notifications",
  "app-settings": "Workspace › Settings",
  "app-profile": "Workspace › Profile Menu",
  "app-theme-toggle": "Workspace › Theme Toggle",
  "app-support": "Workspace › Contact Support",
  "app-tickets-button": "Workspace › My Tickets",

  // Tickets
  "tickets-search": "My Tickets › Search Bar",
  "tickets-new-button": "My Tickets › New Ticket",
  "tickets-total-card": "My Tickets › Total Card",
  "tickets-open-card": "My Tickets › Open Card",
  "tickets-inprogress-card": "My Tickets › In Progress Card",
  "tickets-waiting-card": "My Tickets › Waiting Card",
  "tickets-closed-card": "My Tickets › Closed Card",
  "tickets-table": "My Tickets › Ticket List",
  "tickets-row": "My Tickets › Ticket Entry",

  // Admin dashboard
  "admin-help-mgmt-card": "Dashboard › Help Management",
  "admin-ticket-mgmt-card": "Dashboard › Ticket Management",
  "admin-user-mgmt-card": "Dashboard › User Management",
  "admin-graph-view": "Dashboard › Graph View",
  "admin-coverage-card": "Dashboard › Coverage",
  "admin-content-mix": "Dashboard › Content Mix",
  "admin-content-search": "Content Library › Search Bar",
  "admin-content-filter": "Content Library › Filter",
  "admin-content-table": "Content Library › Content Table",
  "admin-content-row": "Content Library › Content Entry",
  "admin-coverage-list": "Areas Without Help › Coverage List",

  // Virtual context
  "global-search": "Help Library",
};

export const CONTEXT_ARTICLE_MAP: Record<string, string[]> = {
  // Site Recordings
  "section-site-recordings": ["art-001", "art-002"],
  "site-recordings-table": ["art-001", "art-002", "art-003"],
  "site-recordings-search": ["art-004"],
  "site-recordings-filter": ["art-005"],
  "site-recordings-date-filter": ["art-006"],
  "site-recordings-view-toggle": ["art-007"],
  "site-recordings-col-session": ["art-008"],
  "site-recordings-col-pin": ["art-009"],
  "site-recordings-col-recording": ["art-001"],
  "site-recordings-breadcrumb": ["art-002"],
  "site-recordings-row": ["art-001", "art-003"],

  // My Drawings
  "section-my-drawings": ["art-010", "art-011"],
  "app-tab-my-drawings": ["art-010", "art-011"],
  "my-drawings-search": ["art-012"],
  "my-drawings-list-view": ["art-013"],
  "my-drawings-grid-view": ["art-014"],
  "my-drawings-new-button": ["art-015"],
  "my-drawings-filter": ["art-013"],
  "my-drawings-table": ["art-010", "art-011"],
  "my-drawings-row": ["art-013"],
  "my-drawings-breadcrumb": ["art-010"],

  // Drawing Videos
  "section-drawing-videos": ["art-016", "art-017"],
  "app-tab-drawing-videos": ["art-016", "art-017"],
  "drawing-videos-pdf-viewer": ["art-016"],
  "drawing-videos-date-navigator": ["art-017"],
  "drawing-videos-time-lapse": ["art-018"],
  "drawing-videos-pin-list": ["art-017"],
  "drawing-videos-search": ["art-012"],
  "drawing-videos-filter": ["art-005"],

  // My Site Patrol — intentionally uncovered (empty state)
  "section-site-patrol": [],
  "app-tab-site-patrol": [],
  "site-patrol-list": [],
  "site-patrol-session": [],
  "site-patrol-video-viewer": [],
  "site-patrol-search": [],
  "site-patrol-filter": [],


  // App shell
  "section-workspace": ["art-019", "art-020"],
  "app-header": ["art-019"],
  "app-refresh": ["art-019"],
  "app-fullscreen": ["art-019"],
  "app-notifications": ["art-019"],
  "app-settings": ["art-019"],
  "app-profile": ["art-019"],
  "app-support": ["art-022"],
  "app-tickets-button": ["art-021"],
  "app-sidebar": ["art-020"],
  "app-theme-toggle": ["art-020"],
  "app-nav-drawings": ["art-020", "art-010"],
  "app-nav-tickets": ["art-021"],
  "app-nav-admin": ["art-023"],
  "app-tab-site-recordings": ["art-001", "art-002"],

  // Tickets
  "section-tickets": ["art-021", "art-022"],
  "tickets-table": ["art-021"],
  "tickets-search": ["art-021"],
  "tickets-new-button": ["art-022"],
  "tickets-open-card": ["art-021"],
  "tickets-total-card": ["art-021"],
  "tickets-row": ["art-021"],

  // Admin
  "section-admin-overview": ["art-023"],
  "admin-overview-tab": ["art-023"],
  "admin-help-mgmt-card": ["art-023"],
  "admin-ticket-mgmt-card": ["art-021"],
  "section-admin-content": ["art-024"],
  "admin-content-library-tab": ["art-024"],
  "admin-content-search": ["art-024"],
  "admin-content-filter": ["art-024"],
  "admin-content-table": ["art-024"],
  "section-admin-coverage": ["art-025"],
  "admin-coverage-tab": ["art-025"],
  "admin-coverage-list": ["art-025"],
  "admin-graph-view": ["art-026"],
  "admin-content-mix": ["art-026"],
};

export function labelForContext(key: string): string {
  if (key.includes(" › ") || key.startsWith("My ") || key.startsWith("Drawing") || key.startsWith("Site ")) {
    return key;
  }
  return CONTEXT_LABELS[key] ?? key;
}

/** Section shown when no in-page section has registered itself yet. */
export function detectPageContext(pathname?: string): { context: string; label: string } {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const make = (context: string) => ({ context, label: labelForContext(context) });
  if (path.startsWith("/tickets")) return make("section-tickets");
  if (path.startsWith("/admin")) return make("section-admin-overview");
  if (path.startsWith("/dashboard")) return make("section-site-recordings");
  return make("section-workspace");
}

export function initHmsRightClickHandler(
  onContextDetected: (context: string, label: string, event: MouseEvent) => void,
) {
  const handler = (e: MouseEvent) => {
    let el = e.target as HTMLElement | null;

    // Do not block right clicks inside text inputs or textareas
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
      return;
    }

    e.preventDefault(); // suppress the browser context menu

    while (el && el !== document.body) {
      const ctx = el.getAttribute?.("data-hms-context");
      if (ctx) {
        const lbl = el.getAttribute("data-hms-label") ?? labelForContext(ctx);
        onContextDetected(ctx, lbl, e);
        return;
      }
      el = el.parentElement;
    }

    const page = detectPageContext();
    onContextDetected(page.context, page.label, e);
  };

  document.addEventListener("contextmenu", handler);
  return () => document.removeEventListener("contextmenu", handler);
}
