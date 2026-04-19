"use client";

import { useEffect, useState } from "react";
import { instructorApi, InstructorDashboardData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BarChart2, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InstructorDashboard() {
  const [data, setData] = useState<InstructorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorApi.dashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 animate-pulse text-muted-foreground">Loading dashboard stats…</div>;
  if (!data) return <div className="p-8 text-destructive">Failed to load dashboard</div>;

  const { instructor, stats, recentResults } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {instructor.user?.username}</h1>
        <p className="text-muted-foreground font-medium flex items-center gap-2 mt-2">
          Management portal for <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-bold">{instructor.subject.name}</Badge>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg shadow-emerald-500/5 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-emerald-600">Total Questions</CardTitle>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-700">{stats.questionCount}</div>
            <p className="text-[10px] text-emerald-600/70 font-bold uppercase mt-1">In your subject</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-blue-500/5 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-blue-600">Total Attempts</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-700">{stats.attemptCount}</div>
            <p className="text-[10px] text-blue-600/70 font-bold uppercase mt-1">Student completions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-primary/5 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-primary">Subject Stream</CardTitle>
            <CheckCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-primary/80 truncate">
               {instructor.stream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science"}
            </div>
            <p className="text-[10px] text-primary/70 font-bold uppercase mt-1">Classification</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Clock className="w-5 h-5 text-primary" /> Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentResults.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground font-medium">No results recorded yet for this subject</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b bg-muted/10">
                      <th className="px-6 py-4 font-bold text-[10px] uppercase">Student</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase">Score</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase">Status</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentResults.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{r.student?.fullName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{r.student?.studentId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-lg">{r.score}/{r.totalQuestions}</div>
                          <div className="text-[10px] font-bold text-muted-foreground leading-none">
                            {Math.round((r.score/r.totalQuestions)*100)}%
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          { (r.score/r.totalQuestions) >= 0.5 ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">Passed</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground font-medium">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
