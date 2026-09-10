import { useState, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Eye,
  LayoutGrid,
  CheckCircle2,
  Plus,
  Trash2,
  Crown,
  Tag,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface CeoComment {
  id: string;
  author: string;
  role: string;
  targetView: "new" | "old" | "general";
  category: "UI Design" | "UX Flow" | "Data & Stats" | "Feature Request";
  content: string;
  createdAt: string;
  resolved: boolean;
}

const INITIAL_COMMENTS: CeoComment[] = [
  {
    id: "comment-1",
    author: "Elena Rostova",
    role: "Chief Executive Officer",
    targetView: "new",
    category: "UI Design",
    content:
      "The new modern layout is a massive improvement! The metric visual hierarchy makes SLA risk and article status immediately visible to stakeholders.",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolved: false,
  },
  {
    id: "comment-2",
    author: "Elena Rostova",
    role: "Chief Executive Officer",
    targetView: "old",
    category: "UX Flow",
    content:
      "The old classic layout was functional but lacked clear executive summary metrics. Recommending team switch default to New UI.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    resolved: true,
  },
];

interface CeoViewToggleBarProps {
  viewMode: "old" | "new" | "gradient";
  onViewModeChange: (mode: "old" | "new" | "gradient") => void;
}

export function CeoViewToggleBar({ viewMode, onViewModeChange }: CeoViewToggleBarProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CeoComment[]>(() => {
    if (typeof window === "undefined") return INITIAL_COMMENTS;
    try {
      const stored = localStorage.getItem("ceo_dashboard_comments");
      return stored ? JSON.parse(stored) : INITIAL_COMMENTS;
    } catch {
      return INITIAL_COMMENTS;
    }
  });

  // Form states
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentTarget, setNewCommentTarget] = useState<"new" | "old" | "general">("new");
  const [newCommentCategory, setNewCommentCategory] = useState<
    "UI Design" | "UX Flow" | "Data & Stats" | "Feature Request"
  >("UI Design");

  useEffect(() => {
    try {
      localStorage.setItem("ceo_dashboard_comments", JSON.stringify(comments));
    } catch {}
  }, [comments]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) {
      toast.error("Please enter a comment before submitting.");
      return;
    }

    const item: CeoComment = {
      id: `comment-${Date.now()}`,
      author: "Elena Rostova",
      role: "Chief Executive Officer",
      targetView: newCommentTarget,
      category: newCommentCategory,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    setComments((prev) => [item, ...prev]);
    setNewCommentText("");
    toast.success("CEO comment saved successfully!");
  };

  const handleToggleResolve = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  };

  const handleDeleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success("Comment deleted");
  };

  const activeCommentsCount = comments.filter((c) => !c.resolved).length;

  return (
    <>
      {/* Floating Bottom Capsule Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 rounded-full bg-slate-950/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.6)] px-3.5 py-2 text-white">
          {/* CEO Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold shrink-0">
            <Crown className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">CEO Review</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700/80 shrink-0" />

          {/* Old vs New vs Gradient Segmented Switch */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-full border border-slate-800 shrink-0 gap-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("old")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                viewMode === "old"
                  ? "bg-slate-700 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Old UI</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("new")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                viewMode === "new"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>New UI</span>
              <span className="text-[10px] bg-indigo-400/30 text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">
                V2
              </span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("gradient")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                viewMode === "gradient"
                  ? "bg-gradient-to-r from-[#0029FF] to-[#00144B] text-white shadow-md shadow-blue-500/30 font-semibold border border-blue-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span>Gradient</span>
              <span className="text-[10px] bg-blue-500/30 text-cyan-200 px-1.5 py-0.2 rounded-full font-bold">
                V3
              </span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-700/80 shrink-0" />

          {/* Comment & Feedback Button */}
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-medium text-indigo-200 transition-all shrink-0 relative"
          >
            <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">CEO Comments</span>
            <Badge className="bg-indigo-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full font-bold">
              {comments.length}
            </Badge>
          </button>
        </div>
      </div>

      {/* CEO Comments Dialog / Modal */}
      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="max-w-2xl bg-slate-950 text-slate-100 border-slate-800 sm:rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    CEO Review & Feedback Thread
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Switch views, evaluate design changes, and record executive feedback.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* View Status Indicator */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Currently Evaluating:</span>
              <Badge
                className={
                  viewMode === "new"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-200"
                }
              >
                {viewMode === "new" ? "New Redesigned UI (V2)" : "Classic Old UI"}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewModeChange(viewMode === "new" ? "old" : "new")}
              className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 gap-1.5"
            >
              <Eye className="h-3 w-3 text-indigo-400" />
              Switch to {viewMode === "new" ? "Old UI" : "New UI"}
            </Button>
          </div>

          {/* Submit New CEO Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-indigo-400" />
                Add Executive Comment
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={newCommentTarget}
                  onChange={(e) => setNewCommentTarget(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="new">Target: New UI</option>
                  <option value="old">Target: Old UI</option>
                  <option value="general">Target: General</option>
                </select>
                <select
                  value={newCommentCategory}
                  onChange={(e) => setNewCommentCategory(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="UI Design">UI Design</option>
                  <option value="UX Flow">UX Flow</option>
                  <option value="Data & Stats">Data & Stats</option>
                  <option value="Feature Request">Feature Request</option>
                </select>
              </div>
            </div>

            <Textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Type your feedback as CEO (e.g., 'The SLA risk chart is very clear on New UI, approved for launch!')..."
              className="min-h-[70px] bg-slate-950 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:ring-indigo-500"
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Send className="h-3.5 w-3.5" />
                Post CEO Comment
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
              <span>Feedback Log ({comments.length})</span>
              <span>{activeCommentsCount} active</span>
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No feedback comments logged yet. Use the form above to add CEO comments.
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    comment.resolved
                      ? "bg-slate-900/30 border-slate-800/60 opacity-60"
                      : "bg-slate-900 border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{comment.author}</span>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/20 py-0">
                        {comment.role}
                      </Badge>
                      <Badge
                        className={`text-[10px] py-0 ${
                          comment.targetView === "new"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            : comment.targetView === "old"
                            ? "bg-slate-700 text-slate-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {comment.targetView === "new" ? "New UI" : comment.targetView === "old" ? "Old UI" : "General"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[10px]">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleResolve(comment.id)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          comment.resolved ? "text-emerald-400" : "text-slate-400"
                        }`}
                        title={comment.resolved ? "Mark unresolved" : "Mark resolved"}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-normal">{comment.content}</p>

                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <Tag className="h-3 w-3 text-slate-600" />
                    <span>Category: {comment.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
