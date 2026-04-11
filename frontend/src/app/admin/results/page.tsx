"use client";

import { useEffect, useState } from "react";
import { adminApi, ExamAttempt } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { BarChart2, Trophy, XCircle } from "lucide-react";
import dayjs from "dayjs";

export default function ResultsPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.results().then(setResults).catch(() =>
      toast({ title: "Error", description: "Failed to load results", variant: "destructive" })
    ).finally(() => setLoading(false));
  }, []);

  const avgPct = results.length
    ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / results.length)
    : 0;
  const passCount = results.filter((r) => r.score / r.totalQuestions >= 0.5).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="w-6 h-6" /> Exam Results
        </h1>
        <p className="text-muted-foreground text-sm">{results.length} completed exam attempts</p>
      </div>

      {/* Summary stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{results.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Attempts</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{passCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Passed (≥50%)</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{avgPct}%</p>
              <p className="text-xs text-muted-foreground mt-1">Average Score</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No exam results yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Result</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.map((r) => {
                    const pct = Math.round((r.score / r.totalQuestions) * 100);
                    const passed = pct >= 50;
                    const duration = r.endTime
                      ? `${dayjs(r.endTime).diff(dayjs(r.startTime), "minute")}m`
                      : "—";
                    return (
                      <tr key={r.id} className="hover:bg-secondary/30">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-medium">{r.student?.fullName ?? "—"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{r.student?.studentId}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{r.student?.department?.name}</td>
                        <td className="px-5 py-3.5">
                          <div>
                            <span className="font-semibold">{r.score}/{r.totalQuestions}</span>
                            <span className="text-muted-foreground ml-1 text-xs">({pct}%)</span>
                          </div>
                          <div className="w-24 h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${passed ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {passed ? <Trophy className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{duration}</td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{dayjs(r.createdAt).format("MMM D, YYYY HH:mm")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
