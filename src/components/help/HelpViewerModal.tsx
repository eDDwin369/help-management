import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { fmt } from "@/lib/format";
import type { HelpItem } from "@/lib/types";

export function HelpViewerModal({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: HelpItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const [zoom, setZoom] = useState(1);
  if (!item) return null;

  const next = () => {
    setZoom(1);
    onIndexChange((index + 1) % items.length);
  };
  const prev = () => {
    setZoom(1);
    onIndexChange((index - 1 + items.length) % items.length);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-5xl p-0 gap-0 overflow-hidden h-[85vh] flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-card">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {index + 1} of {items.length} · {item.componentLabel}
            </div>
            <div className="font-semibold truncate">{item.title}</div>
          </div>
          <div className="flex items-center gap-1">
            {item.contentType === "image" && (
              <>
                <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                  <ZoomOut className="size-4" />
                </Button>
                <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                  <ZoomIn className="size-4" />
                </Button>
              </>
            )}
            {item.url && (item.contentType === "pdf" || item.contentType === "video") && null}
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-muted/30 overflow-auto relative">
          {item.contentType === "video" && item.url && (
            <div className="h-full flex items-center justify-center p-6">
              <video src={item.url} controls className="max-h-full max-w-full rounded-lg shadow-2xl" />
            </div>
          )}
          {item.contentType === "image" && item.url && (
            <div className="h-full flex items-center justify-center p-6 overflow-auto">
              <img
                src={item.url}
                alt={item.title}
                style={{ transform: `scale(${zoom})`, transition: "transform 200ms" }}
                className="max-w-full rounded-lg shadow-xl origin-center"
              />
            </div>
          )}
          {item.contentType === "pdf" && item.url && (
            <iframe src={item.url} className="w-full h-full" title={item.title} />
          )}
          {item.contentType === "text" && (
            <div className="max-w-3xl mx-auto p-8">
              <article className="prose prose-sm dark:prose-invert max-w-none">
                {item.body?.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-4">{line.slice(3)}</h2>;
                  if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-3">{line.slice(4)}</h3>;
                  if (line.startsWith("- ")) return <li key={i} className="ml-5 list-disc">{line.slice(2)}</li>;
                  if (!line.trim()) return <br key={i} />;
                  return (
                    <p
                      key={i}
                      className="text-sm leading-6 my-2"
                      dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\*(.+?)\*/g, "<em>$1</em>"),
                      }}
                    />
                  );
                })}
              </article>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Updated {fmt.ago(item.updatedAt)}</span>
            <span>·</span>
            <span>By {item.addedBy}</span>
            <div className="flex gap-1.5">
              {item.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] h-4 py-0 px-1.5">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prev} disabled={items.length < 2}>
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button size="sm" onClick={next} disabled={items.length < 2}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
