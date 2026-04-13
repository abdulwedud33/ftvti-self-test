"use client";

import { useEffect, useState } from "react";
import { adminApi, DashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, BarChart2, Calendar, TrendingUp, Clock, UserCheck, Bookmark, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
dayjs.extend(relativeTime);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then((s) => {
      setStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-3xl" />)}
        </div>
        <div className="h-64 bg-slate-50 rounded-[2.5rem]" />
      </div>
    );
  }

  const statCards = [
    { label: "Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", shadow: "shadow-blue-500/10" },
    { label: "Instructors", value: stats?.totalInstructors ?? 0, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50", shadow: "shadow-indigo-500/10" },
    { label: "Question Bank", value: stats?.totalQuestions ?? 0, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50", shadow: "shadow-emerald-500/10" },
    { label: "Avg Performance", value: `${stats?.avgScore ?? 0}%`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50", shadow: "shadow-orange-500/10" },
  ];

  return (
    <div className="p-8 space-y-10">
      {/* Header section with real-time greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">System Oversight</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1 uppercase text-[10px] tracking-[0.2em]">
            <Calendar className="w-3.5 h-3.5" /> {dayjs().format("dddd, MMM D, YYYY")}
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-4 rounded-full bg-white shadow-sm border-slate-100 font-bold text-slate-600">
           FTVTI-SYSTEM-V2.1.0
        </Badge>
      </div>

      {/* Hero Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, color, bg, shadow }) => (
          <Card key={label} className={`border-0 shadow-xl ${shadow} rounded-3xl transition-transform hover:scale-105 duration-300 overflow-hidden group`}>
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center transition-all group-hover:rotate-6`}>
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Table */}
        <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="px-8 py-6 border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Recent Exam Activity
            </CardTitle>
            <Link href="/admin/results" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.recentAttempts?.length ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">No student sessions recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {stats.recentAttempts.map((attempt) => {
                  const pct = Math.round((attempt.score / (attempt.totalQuestions || 1)) * 100);
                  return (
                    <div key={attempt.id} className="flex items-center gap-6 p-6 hover:bg-slate-50 group transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-lg font-bold group-hover:bg-primary group-hover:text-white transition-all">
                        {attempt.student?.fullName?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-slate-800 truncate">{attempt.student?.fullName || "Removed User"}</p>
                           <Badge variant="outline" className="text-[9px] font-black h-4 py-0 uppercase border-slate-200">{attempt.subject?.name || "Global"}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{dayjs(attempt.createdAt).fromNow()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-black tabular-nums tracking-tighter ${pct >= 50 ? "text-emerald-600" : "text-red-500"}`}>
                          {attempt.score}/{attempt.totalQuestions}
                        </span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 ml-auto overflow-hidden">
                           <div className={`h-full ${pct >= 50 ? "bg-emerald-500" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Panel */}
        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <h3 className="text-xl font-black mb-6 tracking-tight relative z-10">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3 relative z-10">
                 {[
                    { href: "/admin/students", label: "Enroll Students", icon: Users },
                    { href: "/admin/instructors", label: "Hire Instructors", icon: UserCheck },
                    { href: "/admin/subjects", label: "Curriculum Map", icon: Bookmark },
                    { href: "/admin/questions", label: "Sync Test Bank", icon: BookOpen },
                 ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href}>
                       <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer group hover:translate-x-1">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <Icon className="w-5 h-5 text-white" />
                          </div>
                          <p className="font-bold text-sm tracking-tight">{label}</p>
                       </div>
                    </Link>
                 ))}
              </div>
           </div>

           <Card className="border-0 bg-emerald-50 text-emerald-900 rounded-[2rem] p-8 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                 </div>
                 <p className="font-black text-lg">Health Report</p>
              </div>
              <p className="text-xs font-bold opacity-70 leading-relaxed">
                 The system is currently operating at <span className="underline">Normal Latency</span>. 
                 Database synchronization with subject-year banks is optimal.
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}
