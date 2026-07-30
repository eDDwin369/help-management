/**
 * HMS usage analytics.
 *
 * Lightweight, dependency-free event log persisted to localStorage. Designed to
 * be swapped for a backend sink later: replace `persist()` with an API call and
 * keep the same `track()` surface.
 */

export type HmsAnalyticsEventType =
  | "panel_open"
  | "panel_close"
  | "article_view"
  | "article_media_error"
  | "search"
  | "filter_change"
  | "ticket_created"
  | "article_created"
  | "upload_dropped";

export interface HmsAnalyticsEvent {
  id: string;
  type: HmsAnalyticsEventType;
  /** Article id, context key, query string — whatever identifies the subject. */
  target?: string;
  label?: string;
  role?: string;
  contextKey?: string;
  at: string;
}

const STORAGE_KEY = "hms_analytics_v1";
const MAX_EVENTS = 500;

type Listener = (events: HmsAnalyticsEvent[]) => void;

let cache: HmsAnalyticsEvent[] | null = null;
const listeners = new Set<Listener>();

function read(): HmsAnalyticsEvent[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as HmsAnalyticsEvent[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(events: HmsAnalyticsEvent[]) {
  cache = events;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      /* storage full or unavailable — analytics is best-effort */
    }
  }
  listeners.forEach((l) => l(events));
}

/** Suppresses duplicate events fired within this window (StrictMode double-effects). */
const DEDUPE_MS = 1500;
const lastSeen = new Map<string, number>();

export function trackHmsEvent(
  type: HmsAnalyticsEventType,
  payload: Omit<HmsAnalyticsEvent, "id" | "type" | "at"> = {},
) {
  if (typeof window === "undefined") return;
  const dedupeKey = `${type}|${payload.target ?? ""}|${payload.label ?? ""}`;
  const now = Date.now();
  const prev = lastSeen.get(dedupeKey);
  if (prev && now - prev < DEDUPE_MS) return;
  lastSeen.set(dedupeKey, now);
  const event: HmsAnalyticsEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    at: new Date().toISOString(),
    ...payload,
  };
  persist([event, ...read()].slice(0, MAX_EVENTS));
}

export function getHmsEvents(): HmsAnalyticsEvent[] {
  return read();
}

export function clearHmsEvents() {
  persist([]);
}

export function subscribeHmsEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export interface HmsUsageSummary {
  totalEvents: number;
  panelOpens: number;
  articleViews: number;
  searches: number;
  ticketsCreated: number;
  mediaErrors: number;
  topArticles: { label: string; count: number }[];
  topSearches: { label: string; count: number }[];
  topContexts: { label: string; count: number }[];
  recent: HmsAnalyticsEvent[];
}

function rank(events: HmsAnalyticsEvent[], key: (e: HmsAnalyticsEvent) => string | undefined) {
  const counts = new Map<string, number>();
  for (const e of events) {
    const k = key(e);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function summarizeHmsEvents(events: HmsAnalyticsEvent[]): HmsUsageSummary {
  const by = (t: HmsAnalyticsEventType) => events.filter((e) => e.type === t);
  return {
    totalEvents: events.length,
    panelOpens: by("panel_open").length,
    articleViews: by("article_view").length,
    searches: by("search").length,
    ticketsCreated: by("ticket_created").length,
    mediaErrors: by("article_media_error").length,
    topArticles: rank(by("article_view"), (e) => e.label ?? e.target),
    topSearches: rank(by("search"), (e) => e.label),
    topContexts: rank(events, (e) => e.contextKey),
    recent: events.slice(0, 12),
  };
}
