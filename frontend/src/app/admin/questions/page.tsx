"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi, Question, CreateQuestionData, Subject, Stream } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import {
  BookOpen,
  BookMarked,
  ChevronRight,
  FlaskConical,
  Globe,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  Home,
  CalendarDays,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const OPTIONS = ["A", "B", "C", "D"] as const;
const STREAMS: { value: Stream; title: string; description: string; accent: string }[] = [
  {
    value: "NATURAL_SCIENCE",
    title: "Natural Science",
    description: "Mathematics, Biology, Physics, Chemistry, English, Aptitude",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    value: "SOCIAL_SCIENCE",
    title: "Social Science",
    description: "Mathematics, Economics, Geography, History, English, Aptitude",
    accent: "from-blue-500 to-cyan-600",
  },
];

const SUBJECT_ORDER: Record<Stream, string[]> = {
  NATURAL_SCIENCE: ["Mathematics (Natural)", "Biology", "Physics", "Chemistry", "English", "Aptitude"],
  SOCIAL_SCIENCE: ["Mathematics (Social)", "Economics", "Geography", "History", "English", "Aptitude"],
};

type ViewLevel = "streams" | "subjects" | "questions";
type FormMode = "create" | "edit";

const blankForm: CreateQuestionData = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  year: 2025,
  subjectId: "",
};

export default function QuestionsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionsByStream, setQuestionsByStream] = useState<Record<Stream, Question[]>>({
    NATURAL_SCIENCE: [],
    SOCIAL_SCIENCE: [],
  });
  const [streamQuestions, setStreamQuestions] = useState<Question[]>([]);
  const [subjectQuestions, setSubjectQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewLevel, setViewLevel] = useState<ViewLevel>("streams");
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [lockedSubjectId, setLockedSubjectId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateQuestionData>(blankForm);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  const currentQuestions = viewLevel === "questions" ? subjectQuestions : streamQuestions;

  const loadSubjects = async () => {
    const loadedSubjects = await adminApi.subjects();
    setSubjects(loadedSubjects);
  };

  const loadStreamQuestions = async (stream: Stream) => {
    const questions = await adminApi.questions({ stream });
    setStreamQuestions(questions);
    setQuestionsByStream((prev) => ({ ...prev, [stream]: questions }));
    return questions;
  };

  const loadSubjectQuestions = async (subjectId: string) => {
    const questions = await adminApi.questions({ subjectId });
    setSubjectQuestions(questions);
    return questions;
  };

  const bootstrap = async (initialStream: Stream = "NATURAL_SCIENCE") => {
    setLoading(true);
    try {
      const [loadedSubjects, naturalQuestions, socialQuestions] = await Promise.all([
        adminApi.subjects(),
        adminApi.questions({ stream: "NATURAL_SCIENCE" }),
        adminApi.questions({ stream: "SOCIAL_SCIENCE" }),
      ]);

      setSubjects(loadedSubjects);
      setQuestionsByStream({
        NATURAL_SCIENCE: naturalQuestions,
        SOCIAL_SCIENCE: socialQuestions,
      });
      setStreamQuestions(initialStream === "NATURAL_SCIENCE" ? naturalQuestions : socialQuestions);
      setSelectedStream(null);
      setSelectedSubjectId(null);
      setViewLevel("streams");
    } catch {
      toast({ title: "Error", description: "Failed to load questions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  const subjectMap = useMemo(() => {
    return subjects.reduce<Record<string, Subject>>((acc, subject) => {
      acc[subject.id] = subject;
      return acc;
    }, {});
  }, [subjects]);

  const questionsBySubject = useMemo(() => {
    return streamQuestions.reduce<Record<string, number>>((acc, question) => {
      acc[question.subjectId] = (acc[question.subjectId] || 0) + 1;
      return acc;
    }, {});
  }, [streamQuestions]);

  const currentStreamMeta = selectedStream ? STREAMS.find((stream) => stream.value === selectedStream) || null : null;
  const visibleSubjects = selectedStream
    ? SUBJECT_ORDER[selectedStream]
        .map((name) => subjects.find((subject) => subject.stream === selectedStream && subject.name === name))
        .filter(Boolean) as Subject[]
    : [];

  const breadcrumb = [
    {
      label: "Questions",
      action: () => {
        setSelectedStream(null);
        setSelectedSubjectId(null);
        setViewLevel("streams");
      },
    },
    ...(selectedStream
      ? [{
          label: selectedStream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science",
          action: () => {
            setSelectedSubjectId(null);
            setViewLevel("subjects");
          },
        }]
      : []),
    ...(selectedSubject
      ? [{
          label: selectedSubject.name,
          action: () => {
            setViewLevel("questions");
          },
        }]
      : []),
  ];

  const openCreateDialog = () => {
    const subject = selectedSubject ?? null;
    setFormMode("create");
    setEditingQuestionId(null);
    setLockedSubjectId(subject?.id ?? null);
    setForm({ ...blankForm, subjectId: subject?.id ?? "" });
    setDialogOpen(true);
  };

  const openEditDialog = (question: Question) => {
    setFormMode("edit");
    setEditingQuestionId(question.id);
    setLockedSubjectId(null);
    setForm({
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer as "A" | "B" | "C" | "D",
      year: question.year,
      subjectId: question.subjectId,
    });
    setDialogOpen(true);
  };

  const refreshCurrentScope = async () => {
    if (!selectedStream) return;
    await loadStreamQuestions(selectedStream);
    if (selectedSubjectId) {
      await loadSubjectQuestions(selectedSubjectId);
    }
  };

  const handleStreamSelect = async (stream: Stream) => {
    setSelectedStream(stream);
    setSelectedSubjectId(null);
    setViewLevel("subjects");
    setLoading(true);
    try {
      await loadStreamQuestions(stream);
    } catch {
      toast({ title: "Error", description: "Failed to load stream questions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = async (subject: Subject) => {
    setSelectedSubjectId(subject.id);
    setViewLevel("questions");
    setLoading(true);
    try {
      await loadSubjectQuestions(subject.id);
    } catch {
      toast({ title: "Error", description: "Failed to load subject questions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (viewLevel === "questions") {
      setViewLevel("subjects");
      setSelectedSubjectId(null);
      void selectedStream && loadStreamQuestions(selectedStream);
      return;
    }

    if (viewLevel === "subjects") {
      setViewLevel("streams");
      setSelectedStream(null);
      setSelectedSubjectId(null);
      setStreamQuestions([]);
      setSubjectQuestions([]);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!form.subjectId) {
        throw new Error("Please select a subject");
      }

      if (formMode === "create") {
        await adminApi.createQuestion(form);
        toast({ title: "Success", description: "Question created successfully" });
      } else if (editingQuestionId) {
        await adminApi.updateQuestion(editingQuestionId, form);
        toast({ title: "Success", description: "Question updated successfully" });
      }

      setDialogOpen(false);
      setForm(blankForm);
      await refreshCurrentScope();
      await loadSubjects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;

    try {
      await adminApi.deleteQuestion(id);
      toast({ title: "Deleted", description: "Question removed" });
      await refreshCurrentScope();
      await loadSubjects();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const activeQuestions = currentQuestions;

  const renderStreamCards = () => (
    <div className="grid gap-5 md:grid-cols-2">
      {STREAMS.map((stream) => {
        const streamCount = questionsByStream[stream.value].length;
        return (
          <button
            key={stream.value}
            onClick={() => void handleStreamSelect(stream.value)}
            className="text-left group"
          >
            <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[1.75rem] overflow-hidden bg-white group-hover:-translate-y-1">
              <div className={`h-2 bg-gradient-to-r ${stream.accent}`} />
              <CardContent className="p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${stream.accent} text-white flex items-center justify-center shadow-lg`}> 
                        {stream.value === "NATURAL_SCIENCE" ? <FlaskConical className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold tracking-tight">{stream.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stream.description}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Open the categorized subjects and question bank for this stream.
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs font-bold">
                    {streamCount} questions
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );

  const renderSubjectCards = () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visibleSubjects.map((subject) => {
        const count = questionsBySubject[subject.id] || 0;
        return (
          <button key={subject.id} onClick={() => void handleSubjectSelect(subject)} className="text-left group">
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-[1.5rem] overflow-hidden bg-white group-hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                        {subject.stream === "NATURAL_SCIENCE" ? "Natural" : "Social"}
                      </Badge>
                    </div>
                    <p className="text-lg font-extrabold leading-tight text-slate-800">{subject.name}</p>
                    <p className="text-sm text-muted-foreground">{count} questions</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );

  const renderQuestionTable = () => (
    <Card className="border-0 shadow-sm rounded-[1.75rem] overflow-hidden bg-white">
      <CardHeader className="border-b bg-slate-50/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-xl font-extrabold text-slate-900">
              {selectedSubject?.name || "Questions"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {activeQuestions.length} question{activeQuestions.length === 1 ? "" : "s"} in this subject.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {activeQuestions.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            No questions found for this subject.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50/60 text-slate-500">
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Question Text</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Options</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Year</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Correct Answer</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeQuestions.map((question) => (
                  <tr key={question.id} className="align-top hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-5 max-w-md">
                      <p className="font-semibold text-slate-900 leading-relaxed">{question.questionText}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="grid grid-cols-2 gap-2 min-w-[260px]">
                        {OPTIONS.map((option) => {
                          const text = question[`option${option}` as keyof Question] as string;
                          const isCorrect = question.correctAnswer === option;
                          return (
                            <div
                              key={option}
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <span className="mr-1 font-black">{option}.</span>
                              {text}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold tabular-nums">
                        {question.year}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className="rounded-full px-3 py-1 bg-primary text-white font-bold">
                        {question.correctAnswer}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => openEditDialog(question)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl" onClick={() => handleDelete(question.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const lockedSubject = lockedSubjectId ? subjectMap[lockedSubjectId] || null : null;
  const formStream = form.subjectId ? subjectMap[form.subjectId]?.stream : undefined;

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BookMarked className="w-8 h-8 text-primary" /> Categorized Questions
          </h1>
          <p className="text-muted-foreground font-medium">Browse by stream, then subject, then questions.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2 px-6 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {formMode === "create" ? "Add Question" : "Edit Question"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Stream</Label>
                  <Input
                    value={formStream === "NATURAL_SCIENCE" ? "Natural Science" : formStream === "SOCIAL_SCIENCE" ? "Social Science" : "Select subject first"}
                    disabled
                    className="rounded-xl bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Subject</Label>
                  <Select
                    value={form.subjectId}
                    onValueChange={(value) => setForm({ ...form, subjectId: value })}
                    disabled={Boolean(lockedSubject)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border">
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.stream === "NATURAL_SCIENCE" ? "Natural" : "Social"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lockedSubject && (
                    <p className="text-xs text-muted-foreground">
                      Subject is preselected because you opened this from {lockedSubject.name}.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label className="font-bold">Quick Info</Label>
                  <Input
                    value={selectedSubject ? `${selectedSubject.name} · ${selectedSubject.stream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science"}` : "Choose a subject from the list"}
                    disabled
                    className="rounded-xl bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Question Text</Label>
                <textarea
                  className="w-full border rounded-2xl px-4 py-3 text-sm bg-background resize-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  placeholder="Enter the question fully here…"
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OPTIONS.map((option) => (
                  <div key={option} className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-slate-400">Option {option}</Label>
                    <Input
                      placeholder={`Choice ${option}`}
                      value={form[`option${option}` as keyof CreateQuestionData] as string}
                      onChange={(e) => setForm({ ...form, [`option${option}`]: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="font-bold">Select Correct Answer</Label>
                <div className="flex gap-3 flex-wrap">
                  {OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm({ ...form, correctAnswer: option })}
                      className={`flex-1 min-w-20 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        form.correctAnswer === option
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-background hover:bg-muted border-transparent"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl shadow-md" disabled={submitting}>
                  {submitting ? "Saving…" : formMode === "create" ? "Create Question" : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {viewLevel !== "streams" && (
          <Button variant="outline" onClick={handleBack} className="gap-2 rounded-full px-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}

        <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          {breadcrumb.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              <button onClick={item.action} className="font-semibold hover:text-foreground transition-colors">
                {index === 0 ? <span className="inline-flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {item.label}</span> : item.label}
              </button>
            </div>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 bg-muted/30 animate-pulse rounded-[1.5rem]" />
          ))}
        </div>
      ) : viewLevel === "streams" ? (
        renderStreamCards()
      ) : viewLevel === "subjects" ? (
        <div className="space-y-4">
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="border-0 shadow-sm rounded-[1.5rem] bg-white md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${currentStreamMeta?.accent || "from-slate-500 to-slate-600"} text-white flex items-center justify-center shadow-lg`}>
                    {selectedStream === "NATURAL_SCIENCE" ? <FlaskConical className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">
                      {selectedStream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science"}
                    </h2>
                    <p className="text-sm text-muted-foreground">Select a subject to view and manage questions.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-[1.5rem] bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Stream total</p>
                <p className="text-3xl font-black mt-2">{streamQuestions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">questions in this stream</p>
              </CardContent>
            </Card>
          </div>
          {renderSubjectCards()}
        </div>
      ) : (
        renderQuestionTable()
      )}
    </div>
  );
}
