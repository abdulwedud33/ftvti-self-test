"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { examApi, ExamSession, ExamResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Phase flow: password entry -> selecting year -> exam session -> results */
type Phase = "password" | "select-year" | "exam" | "result";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamPage() {
  const { toast } = useToast();

  // ── Phase & Navigation ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("password");

  // ── Auth & Year Selection ───────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [years, setYears] = useState<number[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // ── Exam Session ────────────────────────────────────────────────────────────
  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  /** Tracks which questions have "revealed" their correctness feedback */
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // ── Results ──────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<ExamResult | null>(null);

  // ── Timer Refs ──────────────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const startTimeRef = useRef<string>("");

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  // ── Actions: Password Verification ─────────────────────────────────────────
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Step 1: Just verify password and get config
      const res = await examApi.verifyPassword(password);
      // If no error, we move to selection phase
      setPhase("select-year");
      fetchAvailableYears();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    setYearsLoading(true);
    try {
      const data = await examApi.getYears();
      setYears(data);
      if (data.length > 0) setSelectedYear(data[0]);
    } catch {
      toast({ title: "Error", description: "Failed to load exam years", variant: "destructive" });
    } finally {
      setYearsLoading(false);
    }
  };

  // ── ACTIONS: Start Session for Year ────────────────────────────────────────
  const handleStartExam = async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const sess = await examApi.verifyPassword(password, selectedYear);
      setSession(sess);
      const now = new Date().toISOString();
      setStartTime(now);
      startTimeRef.current = now;
      setTimeLeft(sess.durationMins * 60);
      setAnswers({});
      answersRef.current = {};
      setRevealed({});
      setCurrent(0);
      setPhase("exam");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error starting exam";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── ACTIONS: Submit ────────────────────────────────────────────────────────
  const doSubmit = useCallback(async (ans: Record<string, string>, st: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    try {
      const res = (await examApi.submit(ans, st)) as ExamResult;
      setResult(res);
      setPhase("result");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast({ title: "Submission Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ── Timer Effect ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "exam" || !session) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          toast({ title: "⏰ Time's Up!", description: "Your exam has been automatically submitted." });
          doSubmit(answersRef.current, startTimeRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, session, doSubmit, toast]);

  // ── ACTIONS: Answer Selection ──────────────────────────────────────────────
  const handleSelectAnswer = (qId: string, opt: string) => {
    // If already revealed, don't allow change
    if (revealed[qId]) return;

    setAnswers((prev) => ({ ...prev, [qId]: opt }));
    // Immediately reveal truth
    setRevealed((prev) => ({ ...prev, [qId]: true }));
  };

  const handleReset = () => {
    setPhase("password");
    setPassword("");
    setSession(null);
    setResult(null);
    setAnswers({});
    setRevealed({});
    setCurrent(0);
    setShowSubmitConfirm(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ = session?.questions.length ?? 0;

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: PASSWORD (General) ───────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "password") {
    return (
      <div className="max-w-md mx-auto pt-10">
        <Card className="border-0 shadow-xl bg-card">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Exam Access</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Enter the general exam password to see available test years.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-5">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg tracking-[0.5em] h-14 border-2 focus-visible:ring-primary"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Verify Access"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Unauthorized access is recorded for security.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: SELECT YEAR (Selective Tabs) ─────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "select-year") {
    return (
      <div className="max-w-2xl mx-auto pt-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Select Exam Year</h1>
          <p className="text-muted-foreground">Choose the year of questions you wish to practice with.</p>
        </div>

        <Card className="border-0 shadow-lg p-6">
          {yearsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Finding available years...</p>
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">No questions found in the database.</p>
              <Button variant="outline" onClick={() => setPhase("password")}>Back to Login</Button>
            </div>
          ) : (
            <div className="space-y-8">
              <Tabs
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
                className="w-full"
              >
                <TabsList className="w-full h-14 bg-secondary/30 p-1 rounded-2xl">
                  {years.map((yr) => (
                    <TabsTrigger
                      key={yr}
                      value={String(yr)}
                      className="flex-1 rounded-xl py-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary font-bold text-lg"
                    >
                      {yr}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Timed Examination</h3>
                    <p className="text-xs text-muted-foreground">Once started, you cannot pause the timer.</p>
                  </div>
                </div>

                <Button
                  onClick={handleStartExam}
                  className="w-full h-14 text-xl font-black rounded-xl shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : `START ${selectedYear} EXAM →`}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: EXAM (Real-time Feedback) ────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "exam" && session) {
    const q = session.questions[current];
    const opts = ["A", "B", "C", "D"] as const;
    const progressPct = Math.round(((current + 1) / totalQ) * 100);
    const timerCritical = timeLeft < 300;
    const isRevealed = revealed[q.id];
    const userChoice = answers[q.id];

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20 pt-4">
        {/* Header Stats */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4 border-b border-border shadow-sm flex items-center justify-between px-4 rounded-b-2xl">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg shadow-inner ${
              timerCritical ? "bg-red-100 text-red-600 animate-pulse border border-red-200" : "bg-secondary text-secondary-foreground"
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold border border-primary/10">
              <CalendarDays className="w-4 h-4" /> {selectedYear}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-primary uppercase tracking-widest">Question {current + 1} of {totalQ}</span>
            <span className="text-xs text-muted-foreground font-medium">{answeredCount} Answered</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden shadow-inner mx-auto max-w-2xl">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy className="w-24 h-24 text-primary" />
          </div>

          <CardContent className="p-8 md:p-12 space-y-10 relative z-10">
            <div className="space-y-4">
              <p className="text-primary font-black text-sm uppercase tracking-tighter flex items-center gap-2">
                <span className="w-8 h-[2px] bg-primary"></span> Question Content
              </p>
              <h2 className="text-xl md:text-2xl font-bold leading-snug text-foreground/90">{q.questionText}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {opts.map((opt) => {
                const text = q[`option${opt}` as keyof typeof q] as string;
                const isSelected = userChoice === opt;
                const isCorrect = q.correctAnswer === opt;

                let stateCls = "border-border hover:border-primary/30 hover:bg-primary/5";
                let icon = null;

                if (isRevealed) {
                  if (isCorrect) {
                    stateCls = "bg-green-500/10 border-green-500 text-green-700 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-2 ring-green-500/20";
                    icon = <div className="ml-auto w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white scale-110 shadow-lg"><Check className="w-4 h-4 stroke-[4]" /></div>;
                  } else if (isSelected) {
                    stateCls = "bg-red-500/10 border-red-500 text-red-700 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-2 ring-red-500/20";
                    icon = <div className="ml-auto w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white scale-110 shadow-lg"><X className="w-4 h-4 stroke-[4]" /></div>;
                  } else {
                    stateCls = "opacity-50 border-border bg-muted/20 grayscale-[0.5]";
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectAnswer(q.id, opt)}
                    disabled={isRevealed}
                    className={`w-full group/item flex items-center gap-5 p-5 md:p-6 rounded-2xl border-2 text-left transition-all duration-300 relative ${stateCls}`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 transition-all shadow-sm ${
                      isRevealed && isCorrect ? "bg-green-500 text-white" :
                      isRevealed && isSelected && !isCorrect ? "bg-red-500 text-white" :
                      isSelected ? "bg-primary text-white scale-110" : "bg-secondary text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary"
                    }`}>
                      {opt}
                    </span>
                    <span className="text-base md:text-lg font-medium leading-tight flex-1">{text}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {isRevealed && (
              <div className={`p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500 ${
                userChoice === q.correctAnswer ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  userChoice === q.correctAnswer ? "bg-green-100" : "bg-red-100"
                }`}>
                  {userChoice === q.correctAnswer ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${userChoice === q.correctAnswer ? "text-green-800" : "text-red-800"}`}>
                    {userChoice === q.correctAnswer ? "Correct Choice!" : "Wrong Choice"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The correct answer is <span className="font-black text-green-700">{q.correctAnswer}</span>.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="lg"
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
            className="rounded-xl font-bold h-14 px-6 hover:bg-secondary"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back
          </Button>

          {current < totalQ - 1 ? (
            <Button
              size="lg"
              className="flex-1 h-14 rounded-xl text-xl font-black shadow-lg"
              onClick={() => setCurrent((c) => c + 1)}
              disabled={!isRevealed}
            >
              NEXT QUESTION <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1 h-14 rounded-xl text-xl font-black shadow-lg bg-green-600 hover:bg-green-700"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={loading || !isRevealed}
            >
              <Send className="w-6 h-6 mr-2" /> FINISH & SUBMIT
            </Button>
          )}
        </div>

        {/* Submit confirmation */}
        {showSubmitConfirm && (
          <Card className="border-amber-200 bg-amber-50 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardContent className="p-8">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <p className="font-extrabold text-xl text-amber-900 leading-none">Ready to submit?</p>
                  <p className="text-amber-800/80 text-sm mt-3 font-medium">
                    You have answered {answeredCount} of {totalQ} questions.
                    This operation is final and your score will be recorded.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold text-lg border-amber-200 hover:bg-amber-100" onClick={() => setShowSubmitConfirm(false)}>
                  Double Check
                </Button>
                <Button
                  className="flex-1 h-14 rounded-xl text-lg font-black bg-green-600 hover:bg-green-700 shadow-lg"
                  onClick={() => doSubmit(answers, startTime)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "YES, SUBMIT NOW"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigator Mini */}
        <div className="pt-10">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] text-center mb-6">Quick Navigator</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {session.questions.map((q2, idx) => {
              const isAnswered = !!revealed[q2.id];
              const isCorrect = isAnswered && answers[q2.id] === q2.correctAnswer;
              const isCurr = idx === current;

              return (
                <button
                  key={q2.id}
                  onClick={() => setCurrent(idx)}
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all border-2 ${
                    isCurr ? "bg-primary text-white border-primary scale-125 z-10 shadow-lg" :
                    isAnswered ? (isCorrect ? "bg-green-500/10 border-green-500 text-green-700" : "bg-red-500/10 border-red-500 text-red-700") :
                    "bg-secondary/40 border-transparent text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: RESULT (Same as before but with cleaner styling) ────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "result" && result) {
    const entries = Object.entries(result.detailedResults);
    const opts = ["A", "B", "C", "D"] as const;

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-10">
        <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl">
          <div className={`h-3 ${result.passed ? "bg-green-500" : "bg-red-500"}`} />
          <CardContent className="p-10 md:p-16 text-center space-y-8">
            <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl ${result.passed ? "bg-green-500 text-white rotate-6" : "bg-red-500 text-white -rotate-6"}`}>
              {result.passed ? <Trophy className="w-16 h-16 stroke-[2.5]" /> : <XCircle className="w-16 h-16 stroke-[2.5]" />}
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter">
                {result.passed ? "EXAM PASSED!" : "NOT QUITE YET"}
              </h2>
              <p className="text-muted-foreground font-medium text-lg">
                {result.passed ? "Brilliant! You've successfully cleared this year's assessment." : "Don't give up! Review your mistakes and try another attempt."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border max-w-md mx-auto rounded-3xl overflow-hidden border">
              <div className="bg-card p-6">
                <p className="text-5xl font-black text-primary">{result.score}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-2">Correct Answers</p>
              </div>
              <div className="bg-card p-6">
                <p className={`text-5xl font-black ${result.passed ? "text-green-600" : "text-red-600"}`}>{result.percentage}%</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-2">Final Percentage</p>
              </div>
            </div>

            <div className="max-w-xs mx-auto pt-4">
               <div className="h-4 bg-secondary rounded-full overflow-hidden shadow-inner flex items-center p-1">
                <div
                  className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${result.passed ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width: `${result.percentage}%` }}
                >
                  <div className="w-full h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground mt-2 px-1">
                <span>Beginner</span>
                <span className="text-amber-600">50% PASS POINT</span>
                <span>Expert</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Review */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
             <span className="w-2 h-8 bg-primary rounded-full"></span> Detailed Review
          </h3>
          <div className="space-y-4">
            {entries.map(([qId, r], idx) => (
              <Card key={qId} className="border-0 shadow-lg rounded-2xl group transition-all hover:shadow-xl">
                <div className={`h-1.5 w-full ${r.isCorrect ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  <div className={`h-full ${r.isCorrect ? "bg-green-500" : "bg-red-500"}`} style={{width: "4%"}} />
                </div>
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-6">
                    <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${r.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      {r.isCorrect ? <CheckCircle className="w-6 h-6 stroke-[3]" /> : <XCircle className="w-6 h-6 stroke-[3]" />}
                    </div>
                    <div className="flex-1 space-y-6">
                      <p className="font-bold text-lg leading-snug">
                        <span className="text-primary/40 mr-2 font-black">Q{idx + 1}.</span>
                        {r.questionText}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {opts.map((opt) => {
                          const text = r[`option${opt}` as keyof typeof r] as string;
                          const isSelected = r.selected === opt;
                          const isCorrect = r.correct === opt;
                          let cls = "bg-secondary/40 text-muted-foreground border-transparent";

                          if (isCorrect) cls = "bg-green-500/10 border-green-500 text-green-700 font-bold";
                          else if (isSelected && !isCorrect) cls = "bg-red-500/10 border-red-500 text-red-700 font-bold";

                          return (
                            <div key={opt} className={`text-sm px-5 py-3.5 rounded-xl flex items-center gap-3 border-2 transition-all ${cls}`}>
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${
                                isCorrect ? "bg-green-500 text-white" :
                                isSelected && !isCorrect ? "bg-red-500 text-white" :
                                "bg-card text-muted-foreground"
                              }`}>{opt}</span>
                              <span className="flex-1">{text}</span>
                              {isCorrect && <Check className="w-4 h-4 text-green-600 stroke-[3]" />}
                              {isSelected && !isCorrect && <X className="w-4 h-4 text-red-600 stroke-[3]" />}
                            </div>
                          );
                        })}
                      </div>
                      {!r.isCorrect && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-lg w-fit">
                          <Check className="w-4 h-4 text-green-600 stroke-[3]" />
                          <p className="text-xs font-bold text-green-800">
                             Correct: <span className="font-black underline px-1">{r.correct}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 py-10">
           <Button className="h-14 rounded-2xl w-full max-w-md text-lg font-black shadow-xl" onClick={handleReset}>
            <RotateCcw className="w-5 h-5 mr-3" /> TRY ANOTHER YEAR
          </Button>
          <a href="/student" className="text-sm font-black text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return null;
}
