"use client";

import { useEffect, useState } from "react";
import { adminApi, ExamAttempt } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { BarChart2, Trophy, XCircle, FlaskConical, Globe, BookOpen, CalendarDays } from "lucide-react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";

export default function ResultsPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.results().then(setResults).catch(() =>
      toast({ title: "Error", description: "Failed to load results", variant: "destructive" })
    ).finally(() => setLoading(false));
  }, []);

  const totalAttempts = results.length;
  const passCount = results.filter((r) => r.score / r.totalQuestions >= 0.5).length;
  const avgPct = totalAttempts
    ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / totalAttempts)
    : 0;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" /> Examination Analytics
        </h1>
        <p className="text-muted-foreground font-medium">Cross-stream student performance reporting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg shadow-primary/5 bg-white/80 backdrop-blur-sm rounded-3xl">
          <CardContent className="p-8 text-center space-y-2">
            <div className="text-4xl font-black text-slate-800 tracking-tighter">{totalAttempts}</div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Submissions</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-emerald-500/5 bg-white/80 backdrop-blur-sm rounded-3xl">
          <CardContent className="p-8 text-center space-y-2">
            <div className="text-4xl font-black text-emerald-600 tracking-tighter">{passCount}</div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Successful Passes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-blue-500/5 bg-white/80 backdrop-blur-sm rounded-3xl">
          <CardContent className="p-8 text-center space-y-2">
            <div className="text-4xl font-black text-blue-600 tracking-tighter">{avgPct}%</div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Class Average</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="border-b bg-slate-50/50 px-8 py-6">
           <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Global Performance Logs
           </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center animate-pulse text-muted-foreground font-medium tracking-widest uppercase text-xs">Crunching data logs…</div>
          ) : results.length === 0 ? (
            <div className="p-20 text-center">
              <BarChart2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
              <p className="text-muted-foreground font-bold italic">No examination records found in history.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b bg-slate-50/30">
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Student & Dept</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Subject & Stream</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Performance</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => {
                    const pct = Math.round((r.score / r.totalQuestions) * 100);
                    const passed = pct >= 50;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                 {r.student?.fullName[0]}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800">{r.student?.fullName || "Student Removed"}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">Gender: {r.student?.gender || "Unknown"}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-2">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                 <BookOpen className="w-3.5 h-3.5 text-primary" /> {r.subject?.name || "General"}
                                 <Badge variant="outline" className="text-[9px] h-4 py-0 font-black tracking-tighter border-slate-200">
                                    <CalendarDays className="w-2.5 h-2.5 mr-1" /> {r.year || "N/A"}
                                 </Badge>
                              </div>
                              <div className="flex items-center gap-1.5">
                                 {r.subject?.stream === "NATURAL_SCIENCE" ? (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest"><FlaskConical className="w-3 h-3" /> Natural</div>
                                 ) : (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest"><Globe className="w-3 h-3" /> Social</div>
                                 )}
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center justify-between gap-4 mb-2">
                              <span className="font-extrabold text-slate-800 text-lg">{r.score}/{r.totalQuestions}</span>
                              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${passed ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                                 {passed ? "Qualified" : "Failed"}
                              </span>
                           </div>
                           <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-1000 ${passed ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="font-bold text-slate-800">{dayjs(r.createdAt).format("MMM DD")}</p>
                           <p className="text-[10px] font-bold text-slate-400">{dayjs(r.createdAt).format("HH:mm A")}</p>
                        </td>
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
