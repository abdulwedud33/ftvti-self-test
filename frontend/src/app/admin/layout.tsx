"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, BookOpen, Calendar, BarChart2,
  MessageSquare, Settings, LogOut, GraduationCap, Menu, X,
  UserCheck, Bookmark, UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/subjects", label: "Subjects", icon: Bookmark },
  { href: "/admin/instructors", label: "Instructors", icon: UserCheck },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/questions", label: "Questions", icon: BookOpen },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/results", label: "Results", icon: BarChart2 },
  { href: "/admin/comments", label: "Feedback", icon: MessageSquare },
  { href: "/admin/exam-config", label: "Exam Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: UserCog, exact: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
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
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white border-r flex flex-col z-30 transition-transform duration-200",
        "lg:translate-x-0 lg:static lg:z-auto shadow-sm",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-sm leading-none tracking-tight">Grade 12 Admin</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-widest">Entrance Exam System</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive(href, exact)
                  ? "bg-primary text-white shadow-md shadow-primary/20 translate-x-1"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-extrabold border border-primary/20">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.username}</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Super Admin</p>
            </div>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm tracking-tight">Grade 12 Entrance Exam System - Admin</span>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50/50">
          <div className="max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
