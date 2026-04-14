"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminApi, StudentProfile } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { ArrowLeft, Trash2, Layers, CalendarCheck } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const studentId = typeof params?.id === "string" ? params.id : undefined;
    if (!studentId) return;

    async function load(id: string) {
      try {
        const data = await adminApi.studentDetail(id);
        setProfile(data);
      } catch (error: any) {
        toast({ title: "Error", description: error?.message ?? "Failed to load student", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }

    load(studentId);
  }, [params?.id, toast]);

  const examAttempts = profile?.examAttempts ?? [];

  const averagePercentage = useMemo(() => {
    if (!examAttempts.length) return 0;
    const total = examAttempts.reduce((sum, attempt) => {
      const percent = attempt.totalQuestions ? (attempt.score / attempt.totalQuestions) * 100 : 0;
      return sum + percent;
    }, 0);
    return Math.round(total / examAttempts.length);
  }, [examAttempts]);

  const subjectPerformance = useMemo(() => {
    const map = new Map<string, { totalScore: number; totalQuestions: number; attempts: number; }>();

    examAttempts.forEach((attempt) => {
      const subjectName = attempt.subject?.name || "Unknown";
      const current = map.get(subjectName) ?? { totalScore: 0, totalQuestions: 0, attempts: 0 };
      map.set(subjectName, {
        totalScore: current.totalScore + attempt.score,
        totalQuestions: current.totalQuestions + attempt.totalQuestions,
        attempts: current.attempts + 1,
      });
    });

    const performance = Array.from(map.entries()).map(([subjectName, data]) => ({
      subjectName,
      average: data.totalQuestions ? Math.round((data.totalScore / data.totalQuestions) * 100) : 0,
      attempts: data.attempts,
    }));

    performance.sort((a, b) => b.average - a.average);
    return performance;
  }, [examAttempts]);

  const bestSubject = subjectPerformance[0];
  const weakestSubject = subjectPerformance[subjectPerformance.length - 1];

  const handleDelete = async () => {
    if (!profile) return;
    if (!confirm(`Delete student ${profile.student.fullName}? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await adminApi.deleteStudent(profile.student.id);
      toast({ title: "Deleted", description: "Student account removed" });
      router.push("/admin/students");
    } catch (error: any) {
      toast({ title: "Error", description: error?.message ?? "Could not delete student", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading student profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Student profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Link href="/admin/students" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to students
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{profile.student.fullName}</h1>
            <p className="text-sm text-muted-foreground">Student profile and exam history overview</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="w-4 h-4 mr-2" /> {deleting ? "Deleting…" : "Delete Student"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="space-y-1 p-6">
              <CardTitle className="text-xl font-bold">Profile Summary</CardTitle>
              <CardDescription>Core student details, enrollment context, and contact info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{profile.student.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Student ID</p>
                  <p className="font-semibold">{profile.student.studentId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stream</p>
                  <Badge variant="outline" className="uppercase tracking-wide">
                    {profile.student.stream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gender</p>
                  <p className="font-semibold">{profile.student.gender}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
                  <p className="font-semibold text-slate-700">
                    {profile.student.user?.username ?? "Not available"}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Joined</p>
                  <p className="font-semibold">{formatDate(profile.student.user?.createdAt ?? new Date().toISOString())}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Enrolled Subjects</p>
                  <Badge variant="outline" className="text-xs">{profile.subjects.length} subjects</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((subject) => (
                    <Badge key={subject.id} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="space-y-1 p-6">
              <CardTitle className="text-xl font-bold">Performance Overview</CardTitle>
              <CardDescription>Summary of recent exam outcomes and subject-level trends.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total exams</p>
                  <p className="mt-2 text-3xl font-bold">{examAttempts.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Average score</p>
                  <p className="mt-2 text-3xl font-bold">{averagePercentage}%</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Best subject</p>
                  <p className="mt-2 font-semibold">{bestSubject?.subjectName ?? "—"}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Weakest subject</p>
                  <p className="mt-2 font-semibold">{weakestSubject?.subjectName ?? "—"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tracked subjects</p>
                  <p className="mt-2 font-semibold">{subjectPerformance.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="space-y-1 p-6">
            <CardTitle className="text-xl font-bold">Exam History</CardTitle>
            <CardDescription>Review each exam attempt by subject, score, and status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {examAttempts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
                No exam attempts recorded for this student.
              </div>
            ) : (
              <div className="space-y-4">
                {examAttempts.map((attempt) => {
                  const percent = attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
                  const passed = percent >= 50;

                  return (
                    <Card key={attempt.id} className="border border-slate-200 bg-white shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{attempt.subject?.name ?? "Unknown Subject"}</div>
                            <div className="text-xs text-muted-foreground">Year {attempt.year ?? "N/A"} · {formatDate(attempt.createdAt)}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={passed ? "default" : "destructive"} className="uppercase tracking-[0.2em] text-[10px] font-bold">
                              {passed ? "Pass" : "Fail"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {attempt.score}/{attempt.totalQuestions} points
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {percent}%
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <div className="inline-flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5" /> {formatDate(attempt.startTime)}
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" /> Status {attempt.isCompleted ? "Completed" : "In progress"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
