"use client";

import { useEffect, useState } from "react";
import { adminApi, Question, CreateQuestionData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { BookOpen, Plus, Trash2, CheckCircle } from "lucide-react";

const OPTIONS = ["A", "B", "C", "D"] as const;

export default function QuestionsPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateQuestionData>({
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A",
  });

  const fetchData = async () => {
    try {
      setQuestions(await adminApi.questions());
    } catch {
      toast({ title: "Error", description: "Failed to load questions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createQuestion(form);
      toast({ title: "Success", description: "Question added to question bank" });
      setOpen(false);
      setForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await adminApi.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast({ title: "Deleted", description: "Question removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Question Bank
          </h1>
          <p className="text-muted-foreground text-sm">{questions.length} questions available</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Question</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New MCQ Question</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Question Text</Label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Enter the question…"
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {OPTIONS.map((opt) => (
                  <div key={opt} className="space-y-1.5">
                    <Label>Option {opt}</Label>
                    <Input
                      placeholder={`Answer ${opt}`}
                      value={form[`option${opt}` as keyof CreateQuestionData] as string}
                      onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value })}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label>Correct Answer</Label>
                <div className="flex gap-2">
                  {OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm({ ...form, correctAnswer: opt })}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                        form.correctAnswer === opt
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-background hover:bg-secondary"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Saving…" : "Add Question"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No questions yet. Add your first question!</p>
            </div>
          ) : (
            <div className="divide-y">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 hover:bg-secondary/20 transition-colors">
                  <div className="flex gap-4">
                    <span className="text-muted-foreground text-sm font-mono flex-shrink-0 w-7 pt-0.5">
                      {String(idx + 1).padStart(2, "0")}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-3">{q.questionText}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {OPTIONS.map((opt) => {
                          const text = q[`option${opt}` as keyof Question] as string;
                          const isCorrect = q.correctAnswer === opt;
                          return (
                            <div key={opt} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                              isCorrect ? "bg-green-50 text-green-700 font-medium" : "bg-secondary/50 text-muted-foreground"
                            }`}>
                              <span className="font-bold">{opt}.</span>
                              <span className="truncate">{text}</span>
                              {isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
