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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Phase flow: select year + password → exam → result */
type Phase = "select" | "exam" | "result";

/** State for per-question answer feedback shown after clicking Next */
interface FeedbackState {
  isCorrect: boolean;
  correctAnswer: string;
  selectedAnswer: string;
  questionText: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamPage() {
  const { toast } = useToast();

  // ── Phase & navigation ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("select");

  // ── Year selection ───────────────────────────────────────────────────────────
  const [years, setYears] = useState<number[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [password, setPassword] = useState("");

  // ── Exam session ─────────────────────────────────────────────────────────────
  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // ── Per-question feedback ────────────────────────────────────────────────────
  /** Set after clicking Next when question was answered; cleared after 1.6s */
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Result ───────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<ExamResult | null>(null);

  // ── Refs for timer callback ──────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const startTimeRef = useRef<string>("");

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  // ── Fetch available years on mount ───────────────────────────────────────────
  useEffect(() => {
    examApi.getYears()
      .then((data) => {
        setYears(data);
        if (data.length > 0) setSelectedYear(data[0]); // default to latest year
      })
      .catch(() => toast({ title: "Error", description: "Failed to load exam years", variant: "destructive" }))
      .finally(() => setYearsLoading(false));
  }, []);

  // ── Submit exam ──────────────────────────────────────────────────────────────
  const doSubmit = useCallback(async (ans: Record<string, string>, st: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(null);
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

  // ── Countdown timer ──────────────────────────────────────────────────────────
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

  // ── Start exam ───────────────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) {
      toast({ title: "Select a year", description: "Please choose an exam year first.", variant: "destructive" });
      return;
    }
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
      setCurrent(0);
      setPhase("exam");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPhase("select");
    setPassword("");
    setSession(null);
    setResult(null);
    setAnswers({});
    setCurrent(0);
    setShowSubmitConfirm(false);
    setFeedback(null);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  };

  // ── Per-question feedback on Next click ──────────────────────────────────────
  /**
   * Show green/red feedback for the current question for 1.6s, then navigate.
   * If no answer was selected, navigate immediately without feedback.
   */
  const handleNext = () => {
    if (!session) return;
    const q = session.questions[current];
    const selected = answers[q.id];

    if (selected) {
      const isCorrect = selected === q.correctAnswer;
      setFeedback({
        isCorrect,
        correctAnswer: q.correctAnswer,
        selectedAnswer: selected,
        questionText: q.questionText,
      });

      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
        setCurrent((c) => c + 1);
      }, 1600);
    } else {
      // No answer selected — navigate without feedback
      setCurrent((c) => c + 1);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ = session?.questions.length ?? 0;

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: SELECT (year + password) ─────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "select") {
    return (
      <div className="max-w-md mx-auto pt-10 space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold">Start Exam</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Choose the exam year and enter the password to begin.
              </p>
            </div>

            {/* [NEW] Year tabs */}
            {yearsLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading years…
              </div>
            ) : years.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No exam questions available yet.
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Select Exam Year
                </p>
                <Tabs
                  value={String(selectedYear ?? years[0])}
                  onValueChange={(v) => setSelectedYear(Number(v))}
                >
                  <TabsList className="w-full flex-wrap gap-1 h-auto">
                    {years.map((yr) => (
                      <TabsTrigger key={yr} value={String(yr)} className="flex-1 min-w-[60px]">
                        {yr}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter exam password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-lg tracking-widest h-12"
                required
                autoFocus
              />
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || yearsLoading || years.length === 0}
              >
                {loading ? "Verifying…" : `Start ${selectedYear ?? ""} Exam →`}
              </Button>
            </form>

            <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Once started, the timer cannot be paused. Ensure you have enough time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: RESULT ────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "result" && result) {
    const entries = Object.entries(result.detailedResults);
    const opts = ["A", "B", "C", "D"] as const;

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        {/* Score card */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className={`h-2 ${result.passed ? "bg-green-500" : "bg-red-400"}`} />
          <CardContent className="p-8 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? "bg-green-100" : "bg-red-100"}`}>
              {result.passed
                ? <Trophy className="w-12 h-12 text-green-600" />
                : <XCircle className="w-12 h-12 text-red-500" />
              }
            </div>
            <h2 className="text-2xl font-bold">
              {result.passed ? "Excellent Work!" : "Keep Practicing"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {result.passed
                ? "You have passed the self-test examination."
                : "You did not reach the 50% passing mark this time."}
            </p>

            <div className="mt-6 flex justify-center gap-10">
              <div>
                <p className="text-4xl font-bold">{result.score}<span className="text-xl text-muted-foreground">/{result.totalQuestions}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Correct Answers</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className={`text-4xl font-bold ${result.passed ? "text-green-600" : "text-red-500"}`}>
                  {result.percentage}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Final Score</p>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-5 max-w-xs mx-auto">
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${result.passed ? "bg-green-500" : "bg-red-400"}`}
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-orange-500">50% pass mark</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* [FEATURE 3] Detailed review — all questions with green/red indicators */}
        <div>
          <h3 className="font-semibold text-base mb-3">Detailed Review</h3>
          <div className="space-y-3">
            {entries.map(([qId, r], idx) => (
              <Card key={qId} className={`border-0 shadow-sm overflow-hidden`}>
                {/* Colored left border via top bar */}
                <div className={`h-1 ${r.isCorrect ? "bg-green-500" : "bg-red-400"}`} />
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${r.isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                      {r.isCorrect
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <XCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-relaxed">
                        <span className="text-muted-foreground mr-1">Q{idx + 1}.</span>
                        {r.questionText}
                      </p>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {opts.map((opt) => {
                          const text = r[`option${opt}` as keyof typeof r] as string;
                          const isSelected = r.selected === opt;
                          const isCorrect = r.correct === opt;
                          let cls = "bg-secondary/60 text-muted-foreground";
                          if (isCorrect) cls = "bg-green-50 text-green-800 border border-green-200 font-medium";
                          else if (isSelected && !isCorrect) cls = "bg-red-50 text-red-700 border border-red-200";
                          return (
                            <div key={opt} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${cls}`}>
                              <span className="font-bold w-4 flex-shrink-0">{opt}.</span>
                              <span className="flex-1">{text}</span>
                              {isCorrect && <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0 text-green-600" />}
                              {isSelected && !isCorrect && <XCircle className="w-3 h-3 ml-auto flex-shrink-0 text-red-500" />}
                            </div>
                          );
                        })}
                      </div>
                      {!r.isCorrect && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Correct answer: <span className="text-green-700 font-semibold ml-1">{r.correct}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Button className="w-full gap-2" onClick={handleReset} variant="outline">
          <RotateCcw className="w-4 h-4" /> Take Exam Again
        </Button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Phase: EXAM ──────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "exam" && session) {
    const q = session.questions[current];
    const opts = ["A", "B", "C", "D"] as const;
    const progressPct = Math.round(((current + 1) / totalQ) * 100);
    const timerCritical = timeLeft < 300;
    const timerWarning = timeLeft < 600;
    const isLastQuestion = current === totalQ - 1;

    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-10">
        {/* Header: timer + progress */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${timerCritical ? "bg-red-50 text-red-600" : timerWarning ? "bg-amber-50 text-amber-700" : "bg-secondary text-foreground"}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
            <CalendarDays className="w-3.5 h-3.5" />{selectedYear}
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{current + 1}</span>
            <span> of {totalQ}</span>
          </div>

          <div className="text-xs text-muted-foreground">
            {answeredCount}/{totalQ} answered
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* [FEATURE 3] Per-question feedback overlay — shown for 1.6s after clicking Next */}
        {feedback && (
          <div className={`rounded-xl border-2 p-4 flex items-start gap-3 animate-pulse ${
            feedback.isCorrect
              ? "bg-green-50 border-green-400"
              : "bg-red-50 border-red-400"
          }`}>
            <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${feedback.isCorrect ? "bg-green-500" : "bg-red-500"}`}>
              {feedback.isCorrect
                ? <CheckCircle className="w-5 h-5 text-white" />
                : <XCircle className="w-5 h-5 text-white" />
              }
            </div>
            <div>
              <p className={`font-bold text-sm ${feedback.isCorrect ? "text-green-800" : "text-red-800"}`}>
                {feedback.isCorrect ? "✓ Correct!" : "✗ Wrong!"}
              </p>
              {!feedback.isCorrect && (
                <p className="text-xs text-red-700 mt-0.5">
                  Correct answer: <span className="font-bold">{feedback.correctAnswer}</span>
                  {" · "}Your answer: <span className="font-bold line-through opacity-70">{feedback.selectedAnswer}</span>
                </p>
              )}
              {feedback.isCorrect && (
                <p className="text-xs text-green-700 mt-0.5">
                  You selected: <span className="font-bold">{feedback.selectedAnswer}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Question card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground mb-2">Question {current + 1}</p>
            <p className="font-semibold text-base leading-relaxed mb-6">{q.questionText}</p>

            <div className="space-y-2.5">
              {opts.map((opt) => {
                const text = q[`option${opt}` as keyof typeof q] as string;
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      // Prevent changing answer while feedback is showing
                      if (feedback) return;
                      setAnswers((prev) => ({ ...prev, [q.id]: opt }));
                    }}
                    disabled={!!feedback}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 disabled:cursor-not-allowed ${
                      selected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-border hover:border-indigo-300 hover:bg-secondary/40"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${selected ? "bg-indigo-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                      {opt}
                    </span>
                    <span className={`text-sm ${selected ? "text-indigo-900 font-medium" : ""}`}>{text}</span>
                    {selected && <CheckCircle className="w-4 h-4 text-indigo-600 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={current === 0 || !!feedback}
            onClick={() => setCurrent((c) => c - 1)}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>

          {!isLastQuestion ? (
            <Button
              className="flex-1 gap-1"
              onClick={handleNext}
              disabled={!!feedback}
            >
              {feedback ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
          ) : (
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={loading || !!feedback}
            >
              <Send className="w-4 h-4" />
              {loading ? "Submitting…" : "Submit Exam"}
            </Button>
          )}
        </div>

        {/* Submit confirmation */}
        {showSubmitConfirm && (
          <Card className="border-amber-200 bg-amber-50 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Ready to submit?</p>
                  <p className="text-amber-800 text-xs mt-0.5">
                    You have answered {answeredCount} of {totalQ} questions.
                    {answeredCount < totalQ && ` ${totalQ - answeredCount} question(s) are unanswered.`}
                    {" "}This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowSubmitConfirm(false)}>
                  Review Answers
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => doSubmit(answers, startTime)}
                  disabled={loading}
                >
                  {loading ? "Submitting…" : "Confirm Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question palette */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {session.questions.map((q2, idx) => {
              const answered = !!answers[q2.id];
              const isCurrent = idx === current;
              return (
                <button
                  key={q2.id}
                  onClick={() => { if (!feedback) setCurrent(idx); }}
                  disabled={!!feedback}
                  title={answered ? "Answered" : "Not answered"}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all border disabled:cursor-not-allowed ${
                    isCurrent
                      ? "bg-indigo-600 text-white border-indigo-600 scale-110"
                      : answered
                      ? "bg-green-50 text-green-700 border-green-300 hover:border-green-500"
                      : "bg-white text-muted-foreground border-border hover:border-indigo-300"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white border border-border inline-block" /> Unanswered
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
