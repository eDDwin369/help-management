/**
 * Mock data layer for the workspace sections.
 *
 * Everything the dashboard renders comes from here so the UI stays free of
 * hardcoded business content and can be swapped for a backend later.
 */

export interface RecordingRow {
  id: string;
  session: number;
  sessionTint: string;
  pin: string;
  pinLabel: string;
  name: string;
  res: string;
  dt: string;
  date: string; // ISO date for filtering
  started: string;
  startedTint: string;
  closed: string;
  closedTint: string;
  dur: string;
  size: string;
}

const VIOLET = "bg-violet-100 text-violet-700";
const EMERALD = "bg-emerald-100 text-emerald-700";
const ORANGE = "bg-orange-100 text-orange-700";

export const RECORDING_ROWS: RecordingRow[] = [
  {
    id: "rec-1",
    session: 2,
    sessionTint: VIOLET,
    pin: "L2",
    pinLabel: "KL-Ar-L2",
    name: "KL-Architecture-plan-1-may-26-19-36-05.mp4",
    res: "1920x960",
    dt: "May 1, 2026, 07:36 PM",
    date: "2026-05-01",
    started: "May 1, 2026, 6:05 PM",
    startedTint: ORANGE,
    closed: "May 7, 2026, 7:52 PM",
    closedTint: ORANGE,
    dur: "5 sec",
    size: "0.33",
  },
  {
    id: "rec-2",
    session: 2,
    sessionTint: VIOLET,
    pin: "L1",
    pinLabel: "KL-Ar-L1",
    name: "KL-Architecture-plan-1-may-26-19-35-50.mp4",
    res: "1920x960",
    dt: "May 1, 2026, 07:35 PM",
    date: "2026-05-01",
    started: "May 1, 2026, 6:05 PM",
    startedTint: ORANGE,
    closed: "May 7, 2026, 7:52 PM",
    closedTint: ORANGE,
    dur: "5 sec",
    size: "0.33",
  },
  {
    id: "rec-3",
    session: 1,
    sessionTint: EMERALD,
    pin: "L2",
    pinLabel: "KL-Ar-L2",
    name: "KL-Architecture-plan-1-may-26-19-29-11.mp4",
    res: "1920x960",
    dt: "May 1, 2026, 07:29 PM",
    date: "2026-05-01",
    started: "May 1, 2026, 4:22 PM",
    startedTint: "",
    closed: "May 1, 2026, 6:05 PM",
    closedTint: "",
    dur: "5 sec",
    size: "0.37",
  },
  {
    id: "rec-4",
    session: 1,
    sessionTint: EMERALD,
    pin: "L1",
    pinLabel: "KL-Ar-L1",
    name: "KL-Architecture-plan-1-may-26-17-52-45.mp4",
    res: "1920x960",
    dt: "May 1, 2026, 05:52 PM",
    date: "2026-05-01",
    started: "May 1, 2026, 4:22 PM",
    startedTint: "",
    closed: "May 1, 2026, 6:05 PM",
    closedTint: "",
    dur: "5 sec",
    size: "1.88",
  },
  {
    id: "rec-5",
    session: 2,
    sessionTint: VIOLET,
    pin: "L1",
    pinLabel: "KL-Ar-L1",
    name: "KL-Architecture-plan-30-apr-26-19-36-16.mp4",
    res: "1920x960",
    dt: "Apr 30, 2026, 07:36 PM",
    date: "2026-04-30",
    started: "Apr 30, 2026, 6:06 PM",
    startedTint: ORANGE,
    closed: "May 1, 2026, 4:22 PM",
    closedTint: ORANGE,
    dur: "5 sec",
    size: "2.38",
  },
  {
    id: "rec-6",
    session: 1,
    sessionTint: EMERALD,
    pin: "L2",
    pinLabel: "KL-Ar-L2",
    name: "KL-Architecture-plan-30-apr-26-19-35-12.mp4",
    res: "1920x960",
    dt: "Apr 30, 2026, 07:35 PM",
    date: "2026-04-30",
    started: "Apr 30, 2026, 6:02 PM",
    startedTint: "",
    closed: "Apr 30, 2026, 6:06 PM",
    closedTint: "",
    dur: "5 sec",
    size: "2.40",
  },
  {
    id: "rec-7",
    session: 1,
    sessionTint: EMERALD,
    pin: "L1",
    pinLabel: "KL-Ar-L1",
    name: "KL-Architecture-plan-30-apr-26-19-34-18.mp4",
    res: "1920x960",
    dt: "Apr 30, 2026, 07:34 PM",
    date: "2026-04-30",
    started: "Apr 30, 2026, 6:02 PM",
    startedTint: "",
    closed: "Apr 30, 2026, 6:06 PM",
    closedTint: "",
    dur: "5 sec",
    size: "2.43",
  },
];

export interface DrawingItem {
  id: string;
  name: string;
  kind: "folder" | "pdf";
  owner: string;
  modified: string;
  size: string;
  pins: number;
  starred: boolean;
}

export const DRAWING_ITEMS: DrawingItem[] = [
  { id: "d1", name: "KI Test Folder", kind: "folder", owner: "Priya Natarajan", modified: "May 4, 2026", size: "—", pins: 0, starred: true },
  { id: "d2", name: "Tower B — Structural", kind: "folder", owner: "Arun Menon", modified: "May 2, 2026", size: "—", pins: 0, starred: false },
  { id: "d3", name: "Site Logistics", kind: "folder", owner: "Sana Qureshi", modified: "Apr 28, 2026", size: "—", pins: 0, starred: false },
  { id: "d4", name: "KL-Architecture-plan.pdf", kind: "pdf", owner: "Priya Natarajan", modified: "May 1, 2026", size: "8.4 MB", pins: 6, starred: true },
  { id: "d5", name: "KL-MEP-services-L2.pdf", kind: "pdf", owner: "Arun Menon", modified: "Apr 30, 2026", size: "5.1 MB", pins: 4, starred: false },
  { id: "d6", name: "KL-Facade-elevation.pdf", kind: "pdf", owner: "Dilip Rao", modified: "Apr 27, 2026", size: "3.7 MB", pins: 2, starred: false },
  { id: "d7", name: "KL-Foundation-layout.pdf", kind: "pdf", owner: "Sana Qureshi", modified: "Apr 22, 2026", size: "2.9 MB", pins: 3, starred: false },
  { id: "d8", name: "KL-Landscape-master.pdf", kind: "pdf", owner: "Dilip Rao", modified: "Apr 18, 2026", size: "6.2 MB", pins: 1, starred: false },
];

export interface DrawingPin {
  id: string;
  label: string;
  level: string;
  dates: string[];
  sessions: number;
}

export const DRAWING_PINS: DrawingPin[] = [
  { id: "p1", label: "KL-Ar-L1", level: "Level 1", dates: ["Apr 30, 2026", "May 1, 2026", "May 4, 2026"], sessions: 3 },
  { id: "p2", label: "KL-Ar-L2", level: "Level 2", dates: ["Apr 30, 2026", "May 1, 2026"], sessions: 2 },
  { id: "p3", label: "KL-Ar-Roof", level: "Roof", dates: ["Apr 27, 2026", "May 4, 2026"], sessions: 2 },
  { id: "p4", label: "KL-Ar-Base", level: "Basement", dates: ["Apr 22, 2026"], sessions: 1 },
];

export interface PatrolSession {
  id: string;
  route: string;
  patroller: string;
  date: string;
  start: string;
  end: string;
  duration: string;
  clips: number;
  status: "completed" | "in-progress" | "flagged";
  findings: number;
}

export const PATROL_SESSIONS: PatrolSession[] = [
  { id: "sp-1041", route: "Perimeter — North Gate", patroller: "Arun Menon", date: "May 4, 2026", start: "07:10 AM", end: "07:48 AM", duration: "38 min", clips: 12, status: "completed", findings: 0 },
  { id: "sp-1040", route: "Tower B — Levels 1-4", patroller: "Sana Qureshi", date: "May 3, 2026", start: "09:02 AM", end: "10:05 AM", duration: "63 min", clips: 21, status: "flagged", findings: 3 },
  { id: "sp-1039", route: "Material Yard", patroller: "Dilip Rao", date: "May 2, 2026", start: "04:15 PM", end: "04:39 PM", duration: "24 min", clips: 8, status: "completed", findings: 1 },
  { id: "sp-1038", route: "Basement Services", patroller: "Arun Menon", date: "May 1, 2026", start: "11:20 AM", end: "12:04 PM", duration: "44 min", clips: 15, status: "completed", findings: 0 },
  { id: "sp-1037", route: "Perimeter — South Gate", patroller: "Priya Natarajan", date: "Apr 30, 2026", start: "06:55 AM", end: "07:30 AM", duration: "35 min", clips: 11, status: "in-progress", findings: 0 },
];
