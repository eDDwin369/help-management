import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  X,
  Loader2,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { helpStore, REGISTERED_COMPONENTS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { HelpContentType, HelpItem } from "@/lib/types";
import { compressImageFile } from "@/lib/utils";

type HelpSectionType = HelpItem["sectionType"];

function detectType(file: File): HelpContentType {
  const t = file.type;
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("image/")) return "image";
  if (t === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
    return "pdf";
  return "text";
}

export function AddHelpItemDialog({
  open,
  onOpenChange,
  defaultComponent,
  defaultSectionType = "button",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultComponent?: { key: string; label: string };
  defaultSectionType?: HelpSectionType;
}) {
  const { user } = useAuth();
  const fallback = REGISTERED_COMPONENTS[0];
  const componentKey = defaultComponent?.key ?? fallback.key;
  const componentLabel = defaultComponent?.label ?? fallback.label;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<HelpContentType>("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setTags("");
    setProgress(0);
    setContentType("video");
  };

  const onFile = async (f: File | null) => {
    setFile(f);
    if (f) {
      const type = detectType(f);
      setContentType(type);
      if (type === "image") {
        try {
          const dataUrl = await compressImageFile(f);
          setPreviewUrl(dataUrl || "/help/pin-location-map.jpg");
        } catch {
          setPreviewUrl("/help/pin-location-map.jpg");
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl((reader.result as string) || null);
        };
        reader.readAsDataURL(f);
      }
      if (!title) {
        setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!file) {
      toast.error("Please upload a file.");
      return;
    }
    setSubmitting(true);
    setProgress(0);
    const tick = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 12));
    }, 80);

    setTimeout(() => {
      clearInterval(tick);
      const item: HelpItem = {
        id: `h_${Date.now()}`,
        tenantId: user?.tenantId ?? "tenant-omnieye",
        componentKey,
        componentLabel,
        title,
        description,
        contentType,
        url: previewUrl ?? undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: user?.role === "admin" ? "approved" : "unapproved",
        archived: false,
        addedBy: user?.name ?? "Unknown",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sectionType: defaultSectionType,
        sizeKb: Math.round(file.size / 1024),
      };
      helpStore.add(item);
      toast.success("Help added");
      setSubmitting(false);
      reset();
      onOpenChange(false);
    }, 900);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="text-lg">Add Help</DialogTitle>
          <div className="text-xs text-muted-foreground mt-0.5">
            {componentLabel}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-0 min-h-[420px]">
          {/* LEFT — form */}
          <div className="p-5 space-y-4 border-r">
            <div className="space-y-1.5">
              <Label className="text-xs">Upload file</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
                }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "hover:border-primary/40"
                }`}
              >
                <Upload className="mx-auto size-5 text-muted-foreground mb-1" />
                <div className="text-xs font-medium">Drop file or click to upload</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Video, PDF or image
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/*,image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-xs bg-muted/40 rounded-md px-2.5 py-1.5 mt-2">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFile(null);
                    }}
                  >
                    <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-filled from filename"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tags</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="onboarding, walkthrough"
                className="h-9"
              />
            </div>
          </div>

          {/* RIGHT — preview + upload progress */}
          <div className="bg-muted/20 flex flex-col">
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              {!file && (
                <div className="text-center text-xs text-muted-foreground">
                  <ImageIcon className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                  Preview appears here
                </div>
              )}
              {file && contentType === "image" && previewUrl && (
                <img
                  src={previewUrl}
                  alt=""
                  className="max-w-full max-h-full rounded shadow"
                />
              )}
              {file && contentType === "video" && previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full max-h-full rounded shadow"
                />
              )}
              {file && contentType === "pdf" && previewUrl && (
                <iframe src={previewUrl} className="w-full h-full rounded bg-white" title="preview" />
              )}
              {file && contentType === "text" && (
                <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                  <Film className="size-8 text-muted-foreground/40" />
                  No inline preview
                </div>
              )}
            </div>
            {submitting && (
              <div className="px-4 py-3 border-t bg-card space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Uploading…</span>
                  <span className="tabular-nums">{Math.min(100, progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-3 border-t bg-card">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
