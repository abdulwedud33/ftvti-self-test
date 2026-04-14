"use client";

import { useEffect, useState } from "react";
import { instructorApi, adminApi, Question, CreateQuestionData, InstructorDashboardData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { BookOpen, Plus, Trash2, CheckCircle, CalendarDays, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const OPTIONS = ["A", "B", "C", "D"] as const;

export default function InstructorQuestionsPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [instructorData, setInstructorData] = useState<InstructorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterYear, setFilterYear] = useState<number | "all">("all");

  const [form, setForm] = useState<CreateQuestionData>({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    year: 2025,
    subjectId: "", // Will be set from instructor data
  });

  const fetchData = async () => {
    try {
      const [q, d] = await Promise.all([
        instructorApi.questions(),
        instructorApi.dashboard()
      ]);
      setQuestions(q);
      setInstructorData(d);
      setForm(prev => ({ ...prev, subjectId: d.instructor.subjectId }));
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
      toast({ title: "Success", description: "Question added successfully" });
      setOpen(false);
      setForm({ ...form, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" });
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

  const distinctYears = Array.from(new Set(questions.map((q) => q.year))).sort((a, b) => b - a);
  const visibleQuestions = filterYear === "all"
    ? questions
    : questions.filter((q) => q.year === filterYear);

  if (loading && !instructorData) return <div className="p-8 animate-pulse text-muted-foreground">Loading questions…</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" /> My Questions
          </h1>
          <p className="text-muted-foreground font-medium">
            Managing questions for <span className="text-primary font-bold">{instructorData?.instructor.subject.name}</span>
            {" "}(
            {instructorData?.instructor.stream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science"}
            )
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add New Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Add Question to Bank</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Exam Year</Label>
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2025 })}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold whitespace-nowrap">Subject (Auto-assigned)</Label>
                  <Input value={instructorData?.instructor.subject.name} disabled className="bg-muted rounded-xl border-dashed" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold whitespace-nowrap">Stream (Auto-assigned)</Label>
                  <Input
                    value={instructorData?.instructor.stream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science"}
                    disabled
                    className="bg-muted rounded-xl border-dashed"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                You can only add questions for your assigned subject and stream.
              </p>

              <div className="space-y-2">
                <Label className="font-bold">Question Text</Label>
                <textarea
                  className="w-full border rounded-2xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  placeholder="Enter the question fully here…"
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {OPTIONS.map((opt) => (
                  <div key={opt} className="space-y-2">
                    <Label className="font-bold">Option {opt}</Label>
                    <Input
                      placeholder={`Choice ${opt}`}
                      value={form[`option${opt}` as keyof CreateQuestionData] as string}
                      onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="font-bold">Select Correct Answer</Label>
                <div className="flex gap-3">
                  {OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm({ ...form, correctAnswer: opt })}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                        form.correctAnswer === opt
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                          : "bg-background hover:bg-muted border-transparent"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={submitting}>
                  {submitting ? "Processing…" : "Save Question"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mr-2 whitespace-nowrap">
          <Filter className="w-3.5 h-3.5" /> Filter by Year
        </div>
        <Button
          variant={filterYear === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterYear("all")}
          className="rounded-full px-4 h-8 text-xs font-bold"
        >
          All
        </Button>
        {distinctYears.map((yr) => (
          <Button
            key={yr}
            variant={filterYear === yr ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterYear(yr)}
            className="rounded-full px-4 h-8 text-xs font-bold"
          >
            {yr}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {visibleQuestions.length === 0 ? (
          <Card className="border-0 bg-muted/20 rounded-3xl p-20 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No questions found for the selected criteria</p>
          </Card>
        ) : (
          visibleQuestions.map((q, idx) => (
            <Card key={q.id} className="border-0 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
              <CardContent className="p-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-mono text-lg font-bold">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                       <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-3">
                         <CalendarDays className="w-3 h-3 mr-1" /> {q.year}
                       </Badge>
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-relaxed">{q.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {OPTIONS.map((opt) => {
                        const isCorrect = q.correctAnswer === opt;
                        const text = q[`option${opt}` as keyof Question] as string;
                        return (
                          <div key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                            isCorrect 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/10" 
                              : "bg-slate-50/50 border-slate-100 text-slate-500"
                          }`}>
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border font-bold text-[10px] shadow-sm">
                              {opt}
                            </span>
                            <span className="text-sm font-semibold">{text}</span>
                            {isCorrect && <CheckCircle className="w-4 h-4 ml-auto text-emerald-500" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-10 w-10 sm:h-auto"
                    onClick={() => handleDelete(q.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
