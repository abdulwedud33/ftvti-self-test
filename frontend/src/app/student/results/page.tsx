"use client";

import { useEffect, useState } from "react";
import { studentApi, ExamAttempt } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { Trophy, XCircle, Clock, CalendarDays } from "lucide-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

export default function MyResultsPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi
      .results()
      .then(setResults)
      .catch(() =>
        toast({ title: "Error", description: "Failed to load results", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const passCount = results.filter((r) => r.score / r.totalQuestions >= 0.5).length;
  const avgPct = results.length
    ? Math.round(results.reduce((a, r) => a + (r.score / r.totalQuestions) * 100, 0) / results.length)
    : 0;
  const best = results.length
    ? Math.max(...results.map((r) => Math.round((r.score / r.totalQuestions) * 100)))
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6" /> My Results
        </h1>
        <p className="text-muted-foreground text-sm">{results.length} exam attempt(s) recorded</p>
      </div>

      {/* Summary stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{results.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Attempts</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{passCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Passed</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{best}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Best Score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {results.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-muted-foreground opacity-40" />
            </div>
            <p className="font-medium">No exam attempts yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Go to <a href="/student/exam" className="text-indigo-600 underline">Take Exam</a> to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((r, idx) => {
            const pct = Math.round((r.score / r.totalQuestions) * 100);
            const passed = pct >= 50;
            const durationMins = r.endTime
              ? dayjs(r.endTime).diff(dayjs(r.startTime), "minute")
              : null;

            return (
              <Card key={r.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? "bg-green-100" : "bg-red-100"}`}>
                      {passed
                        ? <Trophy className="w-5 h-5 text-green-600" />
                        : <XCircle className="w-5 h-5 text-red-500" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          Attempt #{results.length - idx}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {dayjs(r.createdAt).format("MMM D, YYYY")}
                        </span>
                        {durationMins !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {durationMins}m taken
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${passed ? "bg-green-500" : "bg-red-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    </div>

                    {/* Score badge */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${passed ? "text-green-600" : "text-red-500"}`}>
                        {r.score}
                        <span className="text-sm text-muted-foreground font-normal">/{r.totalQuestions}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {results.length > 0 && (
        <div className="text-center">
          <a href="/student/exam" className="text-sm text-indigo-600 hover:underline">
            Take another attempt →
          </a>
        </div>
      )}
    </div>
  );
}
