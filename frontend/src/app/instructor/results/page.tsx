"use client";

import { useEffect, useState } from "react";
import { instructorApi, ExamAttempt, InstructorDashboardData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { BarChart2, Trophy, XCircle, BookOpen, CalendarDays, FlaskConical, Globe, Search } from "lucide-react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function InstructorResultsPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [instructorData, setInstructorData] = useState<InstructorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([instructorApi.results(), instructorApi.dashboard()])
      .then(([r, d]) => {
        setResults(r);
        setInstructorData(d);
      })
      .catch(() => toast({ title: "Error", description: "Failed to load results", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = results.filter(r => 
    r.student?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    r.student?.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.length;
  const passed = filtered.filter(r => r.score / r.totalQuestions >= 0.5).length;
  const avg = total ? Math.round(filtered.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / total) : 0;

  if (loading && !instructorData) return <div className="p-8 animate-pulse text-muted-foreground">Loading result analytics…</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-slate-900">
            <BarChart2 className="w-8 h-8 text-primary" /> Performance Analysis
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2 mt-2">
            Detailed tracking for <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">{instructorData?.instructor.subject.name}</Badge>
          </p>
        </div>

        <div className="relative w-full sm:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <Input 
             placeholder="Search student or ID…" 
             value={search} 
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9 rounded-2xl bg-white/50 border-slate-100 focus:bg-white transition-all shadow-sm"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg shadow-indigo-500/5 bg-gradient-to-br from-indigo-50/50 to-white rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200 mb-2">
               <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter">{total}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Sits</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-emerald-50/50 to-white rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 mb-2">
               <Trophy className="w-5 h-5" />
            </div>
            <p className="text-4xl font-black text-emerald-600 tracking-tighter">{passed}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Success Count</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-primary/5 to-white rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
               <BarChart2 className="w-5 h-5" />
            </div>
            <p className="text-4xl font-black text-primary tracking-tighter">{avg}%</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Average Marks</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="border-b bg-slate-50/50 px-8 py-6 flex flex-row items-center justify-between">
           <CardTitle className="text-base font-bold text-slate-700">Detailed Student Performance</CardTitle>
           {instructorData?.instructor.stream === "NATURAL_SCIENCE" ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-black text-[10px] uppercase border-emerald-200">
                <FlaskConical className="w-3 h-3 mr-1" /> Natural Science Stream
              </Badge>
           ) : (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-black text-[10px] uppercase border-blue-200">
                <Globe className="w-3 h-3 mr-1" /> Social Science Stream
              </Badge>
           )}
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground font-medium italic">
              {search ? "No matches found for your search." : "No results recorded for your subject yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b bg-slate-50/30">
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Student Information</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-center">Year</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Result Metrics</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => {
                    const pct = Math.round((r.score / r.totalQuestions) * 100);
                    const passed = pct >= 50;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                 {r.student?.fullName[0]}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800">{r.student?.fullName}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">{r.student?.studentId}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center text-slate-400">
                           <Badge variant="outline" className="font-black text-[10px] tabular-nums">
                              {r.year}
                           </Badge>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4 mb-2">
                              <span className="font-extrabold text-slate-800 text-lg">{r.score}/{r.totalQuestions}</span>
                              <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${passed ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                                 {passed ? "Pass" : "Fail"}
                              </div>
                           </div>
                           <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${passed ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className="font-bold text-slate-800">{dayjs(r.createdAt).format("MMM DD")}</p>
                           <p className="text-[10px] font-bold text-slate-400 lowercase tracking-normal">{dayjs(r.createdAt).format("h:mm a")}</p>
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
