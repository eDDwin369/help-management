import myDrawingsImg from "@/assets/screens/my-drawings.png";
import drawingVideosImg from "@/assets/screens/drawing-videos.png";
import sitePatrolImg from "@/assets/screens/site-patrol.png";
import siteRecordingsImg from "@/assets/screens/site-recordings.png";
import globalSettingsImg from "@/assets/screens/global-settings.png";

/** Mapping from screen name -> screenshot used in the admin audit views. */
export const SCREEN_IMAGES: Record<string, string> = {
  "My Drawings": myDrawingsImg,
  "Drawing - Videos": drawingVideosImg,
  "My Site Patrol": sitePatrolImg,
  "Site Recordings": siteRecordingsImg,
  // Header lives at the top of every screen — reuse a representative one.
  Header: myDrawingsImg,
  "Global Settings": globalSettingsImg,
};

export interface Hotspot {
  x: number; // left %
  y: number; // top %
  w: number; // width %
  h: number; // height %
}

/**
 * Approximate bounding boxes (percent of the screenshot) for each registered
 * component key. Used to draw the highlighted indicator overlay on top of the
 * real screen image inside the audit popup.
 */
export const COMPONENT_HOTSPOTS: Record<string, Hotspot> = {
  // ---- My Drawings (1832x834) ----
  "md-search": { x: 0.7, y: 29.5, w: 14.6, h: 6 },
  "md-favorites": { x: 15.6, y: 29.5, w: 2.8, h: 6 },
  "md-list-view": { x: 18.6, y: 29.5, w: 2.8, h: 6 },
  "md-grid-view": { x: 21.6, y: 29.5, w: 2.8, h: 6 },
  "md-info": { x: 83.7, y: 29.5, w: 2, h: 6 },
  "md-new": { x: 91.4, y: 29.5, w: 7.4, h: 6 },

  // ---- Drawing - Videos (1835x842) ----
  "dv-pin-list": { x: 0.5, y: 22.5, w: 10.5, h: 5 },
  "dv-date-nav": { x: 32, y: 22.5, w: 12.5, h: 5.5 },
  "dv-session-selector": { x: 44.7, y: 22.5, w: 4, h: 5.5 },
  "dv-pdf-viewer": { x: 0.3, y: 29, w: 48.8, h: 68 },
  "dv-video-viewer": { x: 49.3, y: 23, w: 49.8, h: 74 },

  // ---- My Site Patrol (1825x844) ----
  "msp-search": { x: 2.7, y: 31.5, w: 24, h: 5 },
  "msp-tree-view": { x: 27.7, y: 31.5, w: 2.3, h: 5 },
  "msp-report-view": { x: 31, y: 31.5, w: 2.3, h: 5 },
  "msp-patrol-list": { x: 0.5, y: 38.5, w: 34, h: 60 },
  "msp-video-viewer": { x: 35.3, y: 20.5, w: 64.4, h: 78 },

  // ---- Site Recordings (1850x865) ----
  "sr-search": { x: 1.4, y: 29, w: 14, h: 5.5 },
  "sr-grid-view": { x: 19.5, y: 29, w: 2, h: 5.5 },
  "sr-date-filter": { x: 22.7, y: 29, w: 11, h: 5.8 },
  "sr-filter": { x: 93.5, y: 29, w: 5, h: 5.8 },
  "sr-bulk-download": { x: 94, y: 22, w: 5, h: 5 },

  // ---- Header (positioned on the dark top bar) ----
  "hdr-refresh": { x: 89.5, y: 3, w: 1.8, h: 3.8 },
  "hdr-fullscreen": { x: 92, y: 3, w: 1.8, h: 3.8 },
  "hdr-settings": { x: 94.4, y: 3, w: 1.8, h: 3.8 },
  "hdr-profile": { x: 96.5, y: 2.5, w: 2.8, h: 4.5 },

  // ---- Global Settings (1119x800) ----
  "gs-security": { x: 47.8, y: 11.9, w: 13.9, h: 5.6 },
  "gs-customer-profile": { x: 63, y: 11.9, w: 19.7, h: 5.6 },
  "gs-company-logo": { x: 4.5, y: 20.6, w: 43.8, h: 38.8 },
  "gs-company-name": { x: 50.9, y: 20.6, w: 43, h: 38.8 },
  "gs-preview": { x: 50.9, y: 61.9, w: 43, h: 28.1 },
};

/** Default fallback when a component lacks an explicit hotspot. */
export function defaultHotspot(index: number): Hotspot {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: 6 + col * 24, y: 12 + row * 22, w: 18, h: 14 };
}
