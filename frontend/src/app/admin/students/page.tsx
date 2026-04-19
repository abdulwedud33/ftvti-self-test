"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminApi, Student, CreateStudentData, Stream, Gender } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { UserPlus, Trash2, Search, Users, FlaskConical, Globe, Eye, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STREAMS: { value: Stream; label: string; description: string; tone: string }[] = [
  {
    value: "NATURAL_SCIENCE",
    label: "Natural Science",
    description: "Students in the natural science stream",
    tone: "from-emerald-500 to-teal-600",
  },
  {
    value: "SOCIAL_SCIENCE",
    label: "Social Science",
    description: "Students in the social science stream",
    tone: "from-blue-500 to-cyan-600",
  },
];

export default function StudentsPage() {
  const { toast } = useToast();
  const [studentsByStream, setStudentsByStream] = useState<Record<Stream, Student[]>>({
    NATURAL_SCIENCE: [],
    SOCIAL_SCIENCE: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStream, setActiveStream] = useState<Stream>("NATURAL_SCIENCE");
  const [form, setForm] = useState<CreateStudentData>({
    username: "",
    password: "",
    fullName: "",
    studentId: "",
    gender: "MALE" as Gender,
    stream: "NATURAL_SCIENCE" as Stream,
  });

  const fetchData = async () => {
    try {
      const [natural, social] = await Promise.all([
        adminApi.students({ stream: "NATURAL_SCIENCE" }),
        adminApi.students({ stream: "SOCIAL_SCIENCE" }),
      ]);
      setStudentsByStream({
        NATURAL_SCIENCE: natural,
        SOCIAL_SCIENCE: social,
      });
    } catch {
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeStudents = studentsByStream[activeStream];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!form.gender) throw new Error("Please select gender");
      const normalizedFullName = form.fullName.replace(/\s+/g, " ").trim();
      if (normalizedFullName.split(" ").length < 2) {
        throw new Error("Enter at least name and father name");
      }

      await adminApi.createStudent({
        ...form,
        fullName: normalizedFullName,
      });
      toast({ title: "Success", description: "Student created successfully" });
      setOpen(false);
      setForm({ username: "", password: "", fullName: "", studentId: "", gender: "MALE" as Gender, stream: activeStream });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"? This action cannot be undone.`)) return;
    try {
      await adminApi.deleteStudent(id);
      toast({ title: "Deleted", description: "Student removed successfully" });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const tabCounts = useMemo(
    () => ({
      NATURAL_SCIENCE: studentsByStream.NATURAL_SCIENCE.length,
      SOCIAL_SCIENCE: studentsByStream.SOCIAL_SCIENCE.length,
    }),
    [studentsByStream]
  );

  const filteredStudents = (stream: Stream) =>
    studentsByStream[stream].filter((student) =>
      student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId.toLowerCase().includes(search.toLowerCase()) ||
      student.user?.username.toLowerCase().includes(search.toLowerCase())
    );

  const openAddDialog = () => {
    setForm((current) => ({ ...current, stream: activeStream }));
    setOpen(true);
  };

  const renderStudentsTable = (stream: Stream) => {
    const visibleStudents = filteredStudents(stream);

    return visibleStudents.length === 0 ? (
      <div className="p-20 text-center">
        <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">No students found in this stream.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b bg-muted/30">
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Full Name</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Student ID</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Gender</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visibleStudents.map((student) => (
              <tr key={student.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm ${
                      student.stream === "NATURAL_SCIENCE" ? "bg-emerald-500" : "bg-blue-500"
                    }`}>
                      {student.fullName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-base">{student.fullName}</div>
                      <div className="text-xs text-muted-foreground">@{student.user?.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="font-mono text-[10px] py-0 px-2 rounded-sm border-muted-foreground/20">
                    {student.studentId}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground font-medium">{student.gender}</span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                  <Link href={`/admin/students/${student.id}`}>
                    <Button variant="outline" size="sm" className="rounded-full h-8 px-3 text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(student.id, student.fullName)}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
            <Users className="w-8 h-8 text-primary" /> Students
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {tabCounts.NATURAL_SCIENCE + tabCounts.SOCIAL_SCIENCE} registered students across all streams
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 rounded-xl shadow-lg shadow-primary/20" onClick={openAddDialog}>
              <UserPlus className="w-4 h-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Abebe" required />
                </div>
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="ETUBR/1090/13" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stream</Label>
                  <Select 
                    value={form.stream} 
                    onValueChange={(v: Stream) => setForm({ ...form, stream: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border">
                      <SelectItem value="NATURAL_SCIENCE">Natural Science</SelectItem>
                      <SelectItem value="SOCIAL_SCIENCE">Social Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select 
                    value={form.gender} 
                    onValueChange={(v: Gender) => setForm({ ...form, gender: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border">
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="john.doe" required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required minLength={6} />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Creating…" : "Create Student Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50 backdrop-blur-sm rounded-xl" />
      </div>

      <Tabs value={activeStream} onValueChange={(value) => setActiveStream(value as Stream)} className="space-y-5">
        <TabsList className="w-full justify-start bg-slate-100/80 p-1 rounded-2xl">
          {STREAMS.map((stream) => (
            <TabsTrigger key={stream.value} value={stream.value} className="gap-2 rounded-xl px-4 py-2">
              {stream.label} ({tabCounts[stream.value]})
            </TabsTrigger>
          ))}
        </TabsList>

        {STREAMS.map((stream) => (
          <TabsContent key={stream.value} value={stream.value} className="space-y-4">
            <Card className="border-0 shadow-sm rounded-[1.75rem] overflow-hidden bg-white">
              <div className={`h-2 bg-gradient-to-r ${stream.tone}`} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                      {stream.value === "NATURAL_SCIENCE" ? <FlaskConical className="w-5 h-5 text-emerald-500" /> : <Globe className="w-5 h-5 text-blue-500" />}
                      {stream.label} Students
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stream.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-md px-3 py-1.5 text-xs font-bold">
                    {tabCounts[stream.value]} students
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-none overflow-hidden rounded-[1.75rem]">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-20 text-center text-muted-foreground animate-pulse">Loading student records…</div>
                ) : (
                  renderStudentsTable(stream.value)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
