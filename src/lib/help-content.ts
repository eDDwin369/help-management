/**
 * Real help resources for the seeded HMS library.
 *
 * `ARTICLE_MEDIA` maps an article id to a genuine asset served from /public,
 * so PDF articles embed a scrollable, downloadable document and image
 * articles render an actual illustration.
 *
 * `ARTICLE_BODY` holds structured documentation for text articles. Each
 * section renders as a heading plus paragraphs / bullet list inside the panel.
 */

export interface ArticleSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const ARTICLE_MEDIA: Record<string, string> = {
  // PDFs
  "art-002": "/help/site-recordings-table-guide.pdf",
  "art-005": "/help/advanced-filtering.pdf",
  "art-016": "/help/pdf-viewer-guide.pdf",
  "art-022": "/help/effective-support-ticket.pdf",
  "art-023": "/help/admin-overview-guide.pdf",
  // Images
  "art-003": "/help/pin-location-map.jpg",
  "art-009": "/help/pin-location-map.jpg",
  "art-011": "/help/grid-view.jpg",
  "art-014": "/help/grid-view.jpg",
  "art-020": "/help/sidebar-navigation.jpg",
  "art-026": "/help/activity-graphs.jpg",
  // Videos
  "art-001": "/help/site-recordings-intro.mp4",
  "art-006": "/help/date-range-filter.mp4",
  "art-010": "/help/my-drawings-tour.mp4",
  "art-015": "/help/new-folder-upload.mp4",
  "art-018": "/help/time-lapse-viewer.mp4",
  "art-024": "/help/content-library-admin.mp4",
};


export const ARTICLE_BODY: Record<string, ArticleSection[]> = {
  "art-004": [
    {
      heading: "What the search bar covers",
      paragraphs: [
        "Search matches the recording name, the pin label and any tag attached to a recording. Matching is case-insensitive and partial, so typing “arch” returns every KL-Architecture capture.",
      ],
    },
    {
      heading: "How to search",
      bullets: [
        "Click the search field, or press / anywhere in the section, to focus it.",
        "Type at least two characters — results narrow as you type.",
        "Clear the field to restore the full list; search never changes your saved filters.",
      ],
    },
    {
      heading: "Combining with filters",
      paragraphs: [
        "Search runs on top of the active date range and filter selections. If a recording you expect is missing, widen the date filter before assuming the search term is wrong.",
      ],
    },
  ],
  "art-007": [
    {
      heading: "List view",
      paragraphs: [
        "List view shows every column of metadata — session, pin, resolution, timings, duration and size. Use it when you need to compare captures precisely or scan session boundaries.",
      ],
    },
    {
      heading: "Grid view",
      paragraphs: [
        "Grid view replaces rows with thumbnail cards. It is the faster way to recognise a capture visually when you do not remember the file name.",
      ],
    },
    {
      heading: "Choosing a layout",
      bullets: [
        "Fewer than ~20 items and a visual task: grid view.",
        "Auditing timings, sizes or session numbers: list view.",
        "Your choice is remembered per section for the rest of the visit.",
      ],
    },
  ],
  "art-008": [
    {
      heading: "What a session is",
      paragraphs: [
        "A session groups every recording captured between a site check-in and the matching check-out. All captures in one visit therefore share a single session number.",
      ],
    },
    {
      heading: "How numbers are assigned",
      bullets: [
        "Numbering restarts at 1 for each drawing or plan.",
        "The number increments when a new check-in occurs after a closed session.",
        "Session Started At and Session Closed At show the boundary timestamps.",
      ],
    },
    {
      heading: "Reading the colour tint",
      paragraphs: [
        "The coloured chip is only a visual grouping aid so that consecutive rows from the same session are easy to scan; it carries no status meaning.",
      ],
    },
  ],
  "art-012": [
    {
      heading: "Narrowing a large set",
      bullets: [
        "Search by partial file name — no wildcards required.",
        "Prefix with an owner name to see only drawings uploaded by that person.",
        "Recently opened drawings are always ranked first in the results.",
      ],
    },
    {
      heading: "When nothing matches",
      paragraphs: [
        "Check that you are in the right folder: search is scoped to the folder shown in the breadcrumb. Move up to the root folder to search everything.",
      ],
    },
  ],
  "art-013": [
    {
      heading: "Sorting",
      paragraphs: [
        "Click a column header to sort by that column; click again to reverse the direction. Sorting is applied after filters, so it only reorders the rows you can currently see.",
      ],
    },
    {
      heading: "Selection and bulk actions",
      bullets: [
        "Click a row to select it; shift-click to select a contiguous range.",
        "With a selection active, the bulk action bar offers move, share and download.",
        "Press Escape to clear the selection.",
      ],
    },
  ],
  "art-017": [
    {
      heading: "The date navigator",
      paragraphs: [
        "The navigator lists every date on which a snapshot of this drawing exists. Selecting a date loads that snapshot into the viewer without leaving the page.",
      ],
    },
    {
      heading: "Stepping through dates",
      bullets: [
        "Use the arrow controls to move to the previous or next available snapshot.",
        "Dates with no capture are skipped automatically.",
        "The active date stays highlighted so you always know which version you are reading.",
      ],
    },
  ],
  "art-019": [
    {
      heading: "Header actions",
      bullets: [
        "Refresh reloads the current section's data without a full page reload.",
        "Fullscreen expands the workspace to the whole screen; press it again or use Escape to exit.",
        "Notifications opens the activity list for your account.",
        "Contact Support and Tickets open the support flow and your ticket history.",
        "Settings opens workspace preferences such as theme and density.",
      ],
    },
    {
      heading: "Your profile menu",
      paragraphs: [
        "The avatar on the right shows your name, email address and role, and is where you sign out of the workspace.",
      ],
    },
  ],
  "art-021": [
    {
      heading: "Status cards",
      bullets: [
        "Open — received and waiting to be picked up.",
        "In progress — a support engineer is actively working on it.",
        "Waiting — we need information from you before work continues.",
        "Closed — resolved, with the resolution recorded on the ticket.",
      ],
    },
    {
      heading: "Filtering the list",
      paragraphs: [
        "Click any status card to filter the list to that status; click the same card again to clear the filter. The search field narrows by subject, tag or ticket id.",
      ],
    },
  ],
  "art-025": [
    {
      heading: "What the coverage tab shows",
      paragraphs: [
        "Every registered area of the application is listed with the number of published help resources attached to it. Areas with none are flagged as gaps.",
      ],
    },
    {
      heading: "Prioritising content",
      bullets: [
        "Fix gaps on high-traffic areas — tables, search and filters — first.",
        "One short video plus one written reference usually closes a gap.",
        "Re-check the tab after approvals: pending items do not count as coverage.",
      ],
    },
  ],
};

const GENERIC_BODY: ArticleSection[] = [
  {
    heading: "About this resource",
    paragraphs: [
      "This resource explains the component you asked for help with, including what it does, how to use it and the options available to you.",
    ],
  },
  {
    heading: "Need more help?",
    paragraphs: [
      "If this does not answer your question, use Contact support from the help panel and a support engineer will pick it up.",
    ],
  },
];

export function bodyForArticle(id: string): ArticleSection[] {
  return ARTICLE_BODY[id] ?? GENERIC_BODY;
}
