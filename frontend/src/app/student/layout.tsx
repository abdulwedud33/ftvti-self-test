"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ClipboardList, Calendar, MessageSquare, LogOut, GraduationCap, Menu, X, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/student/exam", label: "Take Exam", icon: ClipboardList },
  { href: "/student/results", label: "My Results", icon: Trophy },
  { href: "/student/events", label: "Events", icon: Calendar },
  { href: "/student/feedback", label: "Feedback", icon: MessageSquare },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "STUDENT")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white border-r flex flex-col z-30 transition-transform duration-200 shadow-sm",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="font-extrabold text-sm leading-none tracking-tight">FTVTI Student</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-widest text-indigo-600">Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive(href, exact)
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1"
                  : "text-muted-foreground hover:bg-slate-50 hover:text-indigo-600 hover:translate-x-1"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t bg-slate-50/50">
          <div className="flex flex-col gap-0.5 px-3 py-2 mb-2">
            <p className="text-sm font-bold text-slate-800 tracking-tight">{user.student?.fullName || user.username}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Exit Exam Student</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold text-xs"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm tracking-tight">FTVTI Student Portal</span>
        </header>

        <main className="flex-1 p-4 lg:p-10 overflow-auto scroll-smooth">
          <div className="max-w-5xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
