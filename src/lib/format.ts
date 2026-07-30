import { format, formatDistanceToNow } from "date-fns";

export const fmt = {
  date: (iso: string) => format(new Date(iso), "MMM d, yyyy"),
  dateTime: (iso: string) => format(new Date(iso), "MMM d, yyyy · h:mm a"),
  ago: (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true }),
  bytes: (kb?: number) => {
    if (!kb) return "—";
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  },
  duration: (sec?: number) => {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  },
};
