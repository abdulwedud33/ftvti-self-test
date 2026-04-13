"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { examApi, ExamSession, ExamResult, Subject } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toaster";
import {
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  RotateCcw,
  Trophy,
  CalendarDays,
  Loader2,
  Check,
  X,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Phase = "select-subject" | "select-year" | "password" | "exam" | "result";

export default function ExamPage() {
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("select-subject");

  // Selection state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [password, setPassword] = useState("");

  // Session state
  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Results
  const [result, setResult] = useState<ExamResult | null>(null);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const startTimeRef = useRef<string>("");

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  // Actions
  useEffect(() => {
    if (phase === "select-subject") {
      setLoading(true);
      examApi.getSubjects()
        .then(setSubjects)
        .catch(() => toast({ title: "Error", description: "Failed to load subjects", variant: "destructive" }))
        .finally(() => setLoading(false));
    }
  }, [phase, toast]);

  const handleSubjectSelect = (sub: Subject) => {
    setSelectedSubject(sub);
    setLoading(true);
    examApi.getYears(sub.id)
      .then((yrs) => {
        setYears(yrs);
        if (yrs.length > 0) setSelectedYear(yrs[0]);
        setPhase("select-year");
      })
      .catch(() => toast({ title: "Error", description: "Failed to load years", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  const handleYearSelect = () => {
    if (selectedYear) setPhase("password");
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedYear) return;
    setLoading(true);
    try {
      const sess = await examApi.verifyPassword(password, selectedSubject.id, selectedYear);
      setSession(sess);
      const now = new Date().toISOString();
      setStartTime(now);
      startTimeRef.current = now;
      setTimeLeft(sess.durationMins * 60);
      setAnswers({});
      setRevealed({});
      setCurrent(0);
      setPhase("exam");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const doSubmit = useCallback(async (ans: Record<string, string>, st: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!selectedSubject || !selectedYear) return;
    setLoading(true);
    try {
      const res = await examApi.submit(ans, st, selectedSubject.id, selectedYear);
      setResult(res);
      setPhase("result");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedYear, toast]);

  useEffect(() => {
    if (phase !== "exam" || !session) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          doSubmit(answersRef.current, startTimeRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, session, doSubmit]);

  const handleSelectAnswer = (qId: string, opt: string) => {
    if (revealed[qId]) return;
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
    setRevealed((prev) => ({ ...prev, [qId]: true }));
  };

  const handleReset = () => {
    setPhase("select-subject");
    setSelectedSubject(null);
    setSelectedYear(null);
    setPassword("");
    setSession(null);
    setResult(null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: SELECT SUBJECT ────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "select-subject") {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-4 py-1 text-xs font-black uppercase tracking-widest">Step 1 of 3</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Choose Your Subject</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Select the subject from your stream to begin the examination process.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-3xl" />)
          ) : subjects.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold italic">No subjects available for your stream yet.</p>
            </div>
          ) : (
            subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubjectSelect(sub)}
                className="group relative h-48 rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 text-left p-8 flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <BookOpen className="w-32 h-32 text-primary" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:text-primary transition-colors">{sub.name}</h3>
                  <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Practice Exam Content</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: SELECT YEAR ───────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "select-year") {
    return (
      <div className="max-w-xl mx-auto py-10 space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="flex items-center gap-4 mb-10">
          <Button variant="ghost" onClick={() => setPhase("select-subject")} className="rounded-full w-12 h-12 p-0">
             <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase">Step 2 of 3</Badge>
            <h2 className="text-2xl font-black text-slate-900 leading-none mt-1">Select Question Year</h2>
          </div>
        </div>

        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10 space-y-10">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <CalendarDays className="w-8 h-8" />
               </div>
               <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Selected Subject</p>
                  <p className="text-2xl font-black text-slate-900">{selectedSubject?.name}</p>
               </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Available Years</Label>
              {years.length === 0 ? (
                <div className="p-8 text-center bg-muted/30 rounded-2xl border-2 border-dashed text-muted-foreground italic font-medium">
                  No question banks available for this subject.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {years.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`px-8 py-4 rounded-2xl text-lg font-black transition-all duration-300 border-2 ${
                        selectedYear === yr 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105" 
                          : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-400"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/20 uppercase tracking-tight"
              onClick={handleYearSelect}
              disabled={years.length === 0}
            >
              Continue to Access <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: PASSWORD ──────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "password") {
    return (
      <div className="max-w-md mx-auto py-10 animate-in zoom-in-95 duration-500">
        <Card className="border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden">
          <CardContent className="p-10 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
               <Lock className="w-12 h-12 text-primary" />
            </div>
            
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase">Final Step</Badge>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Lock</h2>
            <p className="text-muted-foreground font-medium mt-3 mb-10">Enter the secret examination password to unlock your session for <span className="text-primary font-bold">{selectedSubject?.name} ({selectedYear})</span>.</p>

            <form onSubmit={handleVerifyPassword} className="space-y-6">
              <Input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-3xl tracking-[0.8em] h-20 border-2 rounded-[1.5rem] bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                required
                autoFocus
              />
              <Button type="submit" className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "START EXAMINATION"}
              </Button>
            </form>

            <button onClick={() => setPhase("select-year")} className="mt-8 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
              Change Year or Subject
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: EXAM ──────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "exam" && session) {
    const q = session.questions[current];
    const opts = ["A", "B", "C", "D"] as const;
    const progressPct = Math.round(((current + 1) / (session.questions.length || 1)) * 100);
    const isRevealed = revealed[q.id];

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-4">
        {/* Exam Header */}
        <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl py-6 px-8 rounded-3xl border border-white/40 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`px-6 py-3 rounded-2xl font-black text-2xl shadow-inner tabular-nums ${
              timeLeft < 300 ? "bg-red-500 text-white animate-pulse" : "bg-slate-900 text-white"
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Subject</p>
              <p className="font-extrabold text-sm">{selectedSubject?.name} • {selectedYear}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Progress</p>
            <p className="font-extrabold text-lg text-primary">{current + 1} / {session.questions.length}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner mx-auto max-w-3xl">
           <div 
             className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000 ease-out" 
             style={{ width: `${progressPct}%` }}
           />
        </div>

        {/* Question Area */}
        <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardContent className="p-10 md:p-16 space-y-12">
             <div className="space-y-4">
                <Badge className="bg-primary/5 text-primary border-primary/10 px-3 py-1 font-black uppercase text-[10px] tracking-widest">Question Segment</Badge>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">{q.questionText}</h2>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {opts.map((opt) => {
                  const val = q[`option${opt}` as keyof typeof q] as string;
                  const isSelected = answers[q.id] === opt;
                  const isCorrect = q.correctAnswer === opt;
                  
                  let style = "bg-slate-50 border-slate-100 text-slate-500 hover:border-primary/20 hover:bg-slate-100/50";
                  if (isRevealed) {
                    if (isCorrect) style = "bg-emerald-500 border-emerald-500 text-white scale-[1.02] shadow-xl shadow-emerald-500/20";
                    else if (isSelected) style = "bg-red-500 border-red-500 text-white scale-[1.02] shadow-xl shadow-red-500/20";
                    else style = "bg-slate-50 border-slate-50 text-slate-300 opacity-60";
                  } else if (isSelected) {
                    style = "bg-primary border-primary text-white scale-[1.02] shadow-xl shadow-primary/20";
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(q.id, opt)}
                      disabled={isRevealed}
                      className={`w-full text-left p-6 md:p-8 rounded-[1.75rem] border-2 transition-all duration-500 flex items-center gap-6 ${style}`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${
                        (isRevealed && (isCorrect || isSelected)) || isSelected ? "bg-white/20" : "bg-white text-slate-400 border border-slate-100"
                      }`}>{opt}</span>
                      <span className="text-lg md:text-xl font-bold leading-tight flex-1">{val}</span>
                      {isRevealed && isCorrect && <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600"><Check className="w-5 h-5 stroke-[4]" /></div>}
                      {isRevealed && isSelected && !isCorrect && <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600"><X className="w-5 h-5 stroke-[4]" /></div>}
                    </button>
                  );
                })}
             </div>

             {isRevealed && (
               <div className={`p-6 rounded-[1.5rem] flex items-center gap-5 border-2 animate-in slide-in-from-top-4 duration-500 ${
                 answers[q.id] === q.correctAnswer ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
               }`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    answers[q.id] === q.correctAnswer ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  }`}>
                     {answers[q.id] === q.correctAnswer ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-lg uppercase tracking-tight">{answers[q.id] === q.correctAnswer ? "Excellent Work!" : "Incorrect Option"}</p>
                    <p className="text-sm font-medium opacity-80">Correct Answer is <span className="font-black px-2 py-0.5 rounded bg-white/50">{q.correctAnswer}</span></p>
                  </div>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Exam Navigation */}
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
           <Button variant="ghost" size="lg" className="rounded-2xl h-16 font-extrabold px-8 flex-shrink-0" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
              <ChevronLeft className="w-6 h-6 mr-2" /> PREV
           </Button>
           
           {current < session.questions.length - 1 ? (
             <Button size="lg" className="flex-1 h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20" onClick={() => setCurrent(c => c + 1)} disabled={!isRevealed}>
                CONTINUE <ChevronRight className="w-6 h-6 ml-2" />
             </Button>
           ) : (
             <Button size="lg" className="flex-1 h-16 rounded-2xl font-black text-xl bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20" onClick={() => setShowSubmitConfirm(true)} disabled={!isRevealed}>
                FINISH TEST <Send className="w-6 h-6 ml-2" />
             </Button>
           ) }
        </div>

        {/* Auto Navigator */}
        <div className="pt-10 flex flex-wrap justify-center gap-2 px-8">
           {session.questions.map((sq, i) => {
             const answered = revealed[sq.id];
             const correct = answered && answers[sq.id] === sq.correctAnswer;
             const isCurr = i === current;
             return (
               <button
                 key={sq.id}
                 onClick={() => setCurrent(i)}
                 className={`w-10 h-10 rounded-xl font-black text-xs transition-all border-2 ${
                   isCurr ? "bg-primary border-primary text-white scale-125 z-10 shadow-lg ring-4 ring-primary/10" :
                   answered ? (correct ? "bg-emerald-500 border-emerald-500 text-white" : "bg-red-500 border-red-500 text-white") :
                   "bg-slate-100 border-slate-100 text-slate-400 group-hover:bg-slate-200"
                 }`}
               >
                 {i + 1}
               </button>
             );
           })}
        </div>

        {/* Confirmation Modal Overlay */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
             <Card className="max-w-md w-full border-0 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] animate-in zoom-in-95 duration-300">
                <CardContent className="p-10 text-center space-y-8">
                   <div className="w-24 h-24 rounded-[2rem] bg-orange-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-orange-500/20">
                      <AlertTriangle className="w-12 h-12" />
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-900">Final Submission?</h3>
                     <p className="text-slate-500 font-medium">You have completed all questions. Once submitted, your score will be permanently archived.</p>
                   </div>
                   <div className="flex flex-col gap-3">
                      <Button className="h-16 rounded-2xl text-xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" onClick={() => doSubmit(answers, startTime)}>
                         SUBMIT RESULTS NOW
                      </Button>
                      <Button variant="ghost" className="h-14 rounded-2xl font-bold text-slate-400" onClick={() => setShowSubmitConfirm(false)}>
                         GO BACK TO REVIEW
                      </Button>
                   </div>
                </CardContent>
             </Card>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: RESULT ────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "result" && result) {
    const passed = result.percentage >= 50;
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-12 animate-in fade-in duration-1000">
        <Card className="border-0 shadow-2xl rounded-[3.5rem] overflow-hidden bg-white">
           <div className={`h-4 ${passed ? "bg-emerald-500" : "bg-red-500"}`} />
           <CardContent className="p-12 md:p-20 text-center flex flex-col items-center">
              <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-10 transition-transform hover:scale-110 duration-500 ${
                passed ? "bg-emerald-500 text-white rotate-6" : "bg-red-500 text-white -rotate-6"
              }`}>
                {passed ? <Trophy className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
              </div>

              <div className="space-y-4 mb-12">
                 <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
                   {passed ? "CONGRATULATIONS!" : "EFFORT REQUIRED"}
                 </h1>
                 <p className="text-xl text-slate-500 font-medium">Your final score for <span className="text-primary font-extrabold">{selectedSubject?.name}</span> has been calculated.</p>
              </div>

              <div className="grid grid-cols-2 gap-8 w-full max-w-md mx-auto mb-12">
                 <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                    <p className="text-5xl font-black text-slate-900">{result.score}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">{result.score === 1 ? "Correct" : "Corrects"}</p>
                 </div>
                 <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                    <p className={`text-5xl font-black ${passed ? "text-emerald-500" : "text-red-500"}`}>{result.percentage}%</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Score Rate</p>
                 </div>
              </div>

              <Button className="h-16 rounded-2xl w-full max-w-xs text-xl font-black shadow-xl" onClick={handleReset}>
                <RotateCcw className="w-5 h-5 mr-3" /> TRY AGAIN
              </Button>
              <button onClick={() => window.location.href="/student"} className="mt-8 text-xs font-black uppercase text-slate-400 tracking-widest hover:text-primary transition-colors">
                Return to Home
              </button>
           </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center font-black text-slate-300 animate-pulse text-2xl uppercase tracking-[0.2em]">
       Loading System...
    </div>
  );
}
