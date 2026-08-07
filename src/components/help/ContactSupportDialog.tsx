import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  Paperclip,
} from "lucide-react";
import { ticketStore } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { TicketPriority } from "@/lib/types";

export function ContactSupportDialog({
  open,
  onOpenChange,
  componentKey,
  componentLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  componentKey?: string;
  componentLabel?: string;
}) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(
    componentLabel ? `Help needed with ${componentLabel}` : "",
  );
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list)].slice(0, 5));
  };

  const reset = () => {
    setSubject("");
    setDescription("");
    setFiles([]);
    setDone(false);
    setSubmitting(false);
  };

  const submit = () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill subject and description.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const id = `TCK-${10300 + Math.floor(Math.random() * 999)}`;
      ticketStore.add({
        id,
        tenantId: user?.tenantId ?? "tenant-omnieye",
        userId: user?.id ?? "u_anon",
        subject,
        description,
        status: "open",
        priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: files.map((f) => ({ name: f.name, size: f.size })),
        componentKey,
      });
      setDone(true);
      setSubmitting(false);
      toast.success(`Ticket ${id} created`);
    }, 700);
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
        {done ? (
          <div className="py-12 text-center px-8">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
              <CheckCircle2 className="size-7" />
            </div>
            <h3 className="text-lg font-semibold">We've received your request</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Our support team will get back to you within 24 hours.
            </p>
            <Button className="mt-5" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-5 pb-4 border-b">
              <DialogTitle className="text-lg">Contact Support</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-0 min-h-[380px]">
              {/* LEFT — form */}
              <div className="p-5 space-y-4 border-r">
                {user && (
                  <div className="flex items-center gap-2.5 pb-3 border-b">
                    <div
                      className="size-9 rounded-full text-white text-xs font-semibold flex items-center justify-center"
                      style={{ background: user.avatarColor }}
                    >
                      {user.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{user.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as TicketPriority)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue, steps to reproduce, and expected behaviour…"
                  />
                </div>
              </div>

              {/* RIGHT — attachments */}
              <div className="bg-muted/20 p-5 flex flex-col">
                <Label className="text-xs mb-1.5">Attachments</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    onFiles(e.dataTransfer.files);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                    dragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Upload className="mx-auto size-5 text-muted-foreground mb-1" />
                  <div className="text-xs font-medium">Drop files or click to upload</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    PNG, JPG, PDF · up to 5 files
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => onFiles(e.target.files)}
                  />
                </div>
                <div className="mt-3 space-y-1.5 flex-1 overflow-auto">
                  {files.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground text-center mt-6 flex flex-col items-center gap-1.5">
                      <Paperclip className="size-5 text-muted-foreground/40" />
                      No files attached
                    </div>
                  ) : (
                    files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs bg-card border rounded-md px-2.5 py-1.5"
                      >
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          onClick={() =>
                            setFiles((arr) => arr.filter((_, x) => x !== i))
                          }
                        >
                          <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-3.5 border-t bg-card">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-700 font-medium">
                Cancel
              </Button>
              <Button 
                onClick={submit} 
                disabled={submitting}
                style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 700, borderRadius: '8px', padding: '0 20px' }}
              >
                {submitting && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Submit Ticket
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
