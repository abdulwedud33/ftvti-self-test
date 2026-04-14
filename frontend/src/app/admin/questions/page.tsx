"use client";

import { useEffect, useState } from "react";
import { adminApi, Question, CreateQuestionData, Subject } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { BookOpen, Plus, Trash2, CheckCircle, CalendarDays, FlaskConical, Globe, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const OPTIONS = ["A", "B", "C", "D"] as const;

export default function QuestionsPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState<number | "all">("all");

  const [form, setForm] = useState<CreateQuestionData>({
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctAnswer: "A",
    year: 2025,
    subjectId: "",
  });

  const fetchData = async () => {
    try {
      const [q, s] = await Promise.all([adminApi.questions(), adminApi.subjects()]);
      setQuestions(q);
      setSubjects(s);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!form.subjectId) throw new Error("Please select a subject");
      await adminApi.createQuestion(form);
      toast({ title: "Success", description: "Question created successfully" });
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
  const filtered = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(search.toLowerCase()) || 
                         q.subject?.name.toLowerCase().includes(search.toLowerCase());
    const matchesYear = filterYear === "all" || q.year === filterYear;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" /> Question Bank
          </h1>
          <p className="text-muted-foreground font-medium">Global management of subject-year test resources</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> New Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Add Question to System</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Subject</Label>
                  <Select 
                    value={form.subjectId} 
                    onValueChange={(v) => setForm({ ...form, subjectId: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border">
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.stream === "NATURAL_SCIENCE" ? "NAT" : "SOC"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Question Text</Label>
                <textarea
                  className="w-full border rounded-2xl px-4 py-3 text-sm bg-background resize-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Enter the question fully here…"
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {OPTIONS.map((opt) => (
                  <div key={opt} className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-slate-400">Option {opt}</Label>
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
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        form.correctAnswer === opt
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-background hover:bg-muted border-transparent"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 rounded-xl shadow-md" disabled={submitting}>
                  {submitting ? "Processing…" : "Commit Question"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <Input 
             placeholder="Search questions or subjects…" 
             value={search} 
             onChange={(e) => setSearch(e.target.value)} 
             className="pl-9 rounded-xl bg-white/50 border-slate-100" 
           />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
           <Badge variant="ghost" className="text-[10px] font-black uppercase text-slate-400 tracking-widest"><Filter className="w-3 h-3 mr-1" /> Year</Badge>
           <Button variant={filterYear === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterYear("all")} className="rounded-full h-8 px-4 text-xs font-bold">All</Button>
           {distinctYears.map(yr => (
             <Button key={yr} variant={filterYear === yr ? "default" : "outline"} size="sm" onClick={() => setFilterYear(yr)} className="rounded-full h-8 px-4 text-xs font-bold">{yr}</Button>
           ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
           Array(5).fill(0).map((_, i) => <div key={i} className="h-40 bg-muted/30 animate-pulse rounded-[2rem]" />)
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed">
            <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium italic">No questions match your filter.</p>
          </div>
        ) : (
          filtered.map((q, idx) => (
            <Card key={q.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden group bg-white">
              <CardContent className="p-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-mono text-lg font-bold">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                       <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-3 py-1">
                         <CalendarDays className="w-3 h-3 mr-1" /> {q.year}
                       </Badge>
                       <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-bold px-3 py-1">
                          {q.subject?.name}
                       </Badge>
                       {q.subject?.stream === "NATURAL_SCIENCE" ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50"><FlaskConical className="w-3 h-3 mr-1" /> Natural</Badge>
                       ) : (
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50"><Globe className="w-3 h-3 mr-1" /> Social</Badge>
                       )}
                    </div>
                    <p className="text-lg font-extrabold text-slate-800 leading-relaxed">{q.questionText}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {OPTIONS.map((opt) => {
                        const isCorrect = q.correctAnswer === opt;
                        const text = q[`option${opt}` as keyof Question] as string;
                        return (
                          <div key={opt} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${
                            isCorrect 
                              ? "bg-emerald-50 border-emerald-500/20 text-emerald-700 ring-2 ring-emerald-500/5" 
                              : "bg-slate-50/50 border-slate-100 text-slate-500"
                          }`}>
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border font-black text-[10px] shadow-sm">
                              {opt}
                            </span>
                            <span className="text-sm font-bold">{text}</span>
                            {isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-200 hover:text-red-500 hover:bg-red-50"
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
