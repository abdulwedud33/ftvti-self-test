"use client";

import { useEffect, useState } from "react";
import { adminApi, DashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, BarChart2, Calendar, TrendingUp, Clock } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then((s) => {
      setStats(s as DashboardStats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Questions", value: stats?.totalQuestions ?? 0, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Exams Completed", value: stats?.totalAttempts ?? 0, icon: BarChart2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg Score", value: `${stats?.avgScore ?? 0}%`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your examination system — {dayjs().format("dddd, MMMM D, YYYY")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent attempts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Exam Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentAttempts?.length ? (
            <p className="text-muted-foreground text-sm py-6 text-center">No exam attempts yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAttempts.map((attempt) => {
                const pct = Math.round((attempt.score / attempt.totalQuestions) * 100);
                return (
                  <div key={attempt.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                      {attempt.student?.fullName?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attempt.student?.fullName ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{dayjs(attempt.createdAt).fromNow()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${pct >= 50 ? "text-green-600" : "text-red-500"}`}>
                        {attempt.score}/{attempt.totalQuestions}
                      </span>
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/students", label: "Manage Students", desc: "Add or remove student accounts", icon: Users },
          { href: "/admin/questions", label: "Question Bank", desc: "Add MCQ questions for exams", icon: BookOpen },
          { href: "/admin/exam-config", label: "Exam Settings", desc: "Set password and duration", icon: Calendar },
        ].map(({ href, label, desc, icon: Icon }) => (
          <a key={href} href={href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <Icon className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
