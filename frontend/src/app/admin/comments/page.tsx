"use client";

import { useEffect, useState } from "react";
import { adminApi, Comment } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { MessageSquare, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function CommentsPage() {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.comments().then(setComments).catch(() =>
      toast({ title: "Error", description: "Failed to load feedback", variant: "destructive" })
    ).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    try {
      await adminApi.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Deleted", description: "Feedback removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 ml-6 mt-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Student Feedback
        </h1>
        <p className="text-muted-foreground text-sm mt-2">{comments.length} feedback submissions</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      ) : comments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No feedback submitted yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm">
              <CardContent className="p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold flex-shrink-0">
                  {c.student?.fullName?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{c.student?.fullName}</p>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">
                      Gender: {c.student?.gender}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{dayjs(c.createdAt).fromNow()}</span>
                  </div>
                  <p className="text-sm mt-2 text-foreground/80 leading-relaxed">{c.message}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
