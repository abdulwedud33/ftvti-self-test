"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Trophy, Calendar, MessageSquare, GraduationCap } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";

const quickLinks = [
  {
    href: "/student/exam",
    label: "Take Exam",
    desc: "Enter exam password and start practicing",
    icon: ClipboardList,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    href: "/student/results",
    label: "My Results",
    desc: "View all your past exam attempts",
    icon: Trophy,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  {
    href: "/student/events",
    label: "Events",
    desc: "Upcoming announcements and schedules",
    icon: Calendar,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    href: "/student/feedback",
    label: "Feedback",
    desc: "Share your thoughts with the administration",
    icon: MessageSquare,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const s = user?.student;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-7 text-white">
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 top-16 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-200 text-sm mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>FTVTI Self-Test Exit Examination System</span>
          </div>
          <h1 className="text-2xl font-bold">
            Welcome back, {s?.fullName ?? user?.username}!
          </h1>
          <p className="text-indigo-200 text-sm mt-1">
            {dayjs().format("dddd, MMMM D, YYYY")}
          </p>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-indigo-300">Student ID</span>
              <p className="font-semibold font-mono">{s?.studentId ?? "—"}</p>
            </div>
            <div>
              <span className="text-indigo-300">Department</span>
              <p className="font-semibold">{s?.department?.name ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips card */}
      <Card className="border border-blue-100 bg-blue-50/50 shadow-none">
        <CardContent className="p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">📋 Exam Instructions</p>
          <ul className="space-y-1 text-blue-700 text-xs list-disc list-inside">
            <li>Obtain the exam password from your administrator before starting.</li>
            <li>Once started, the timer cannot be paused — complete the exam in one sitting.</li>
            <li>You may retake the exam as many times as needed to practice.</li>
            <li>Results are shown immediately after submission with correct answers.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Quick links grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map(({ href, label, desc, icon: Icon, color, bg, border }) => (
            <Link key={href} href={href}>
              <Card className={`border shadow-sm hover:shadow-md transition-all cursor-pointer group ${border}`}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
