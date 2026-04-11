"use client";

import { useState } from "react";
import { studentApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { MessageSquare, Send, CheckCircle2, Star } from "lucide-react";

const QUICK_PROMPTS = [
  "The exam questions were clear and well-structured.",
  "I need more questions in the question bank.",
  "The timer duration should be adjusted.",
  "The system was easy to use and navigate.",
];

export default function FeedbackPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      toast({ title: "Too short", description: "Please write at least 5 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await studentApi.submitFeedback(message.trim());
      setSubmitted(true);
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto pt-10">
        <Card className="border-0 shadow-md">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Your feedback has been submitted successfully. The administration will review it shortly.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => setSubmitted(false)}
            >
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Submit Feedback
        </h1>
        <p className="text-muted-foreground text-sm">
          Share your experience or suggestions with the administration.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Feedback</CardTitle>
          <CardDescription>All feedback is reviewed by the administration team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick prompts */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Star className="w-3 h-3" /> Quick suggestions (click to use)
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setMessage(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                className="w-full border rounded-xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[140px]"
                placeholder="Write your feedback here… Be specific so we can improve."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={5}
                maxLength={1000}
              />
              <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {message.length}/1000
              </span>
            </div>

            <Button
              type="submit"
              disabled={submitting || message.trim().length < 5}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting…" : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-0 shadow-none bg-secondary/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Privacy Note:</span> Your feedback is associated with your student account and visible to administrators only.
            It helps us improve the examination system for all students.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
