"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi, Student, Department, CreateStudentData, Stream } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { UserPlus, Trash2, Search, Users, FlaskConical, Globe, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateStudentData>({
    username: "", 
    password: "", 
    fullName: "", 
    studentId: "", 
    departmentId: "",
    stream: "NATURAL_SCIENCE",
  });

  const fetchData = async () => {
    try {
      const [s, d] = await Promise.all([adminApi.students(), adminApi.departments()]);
      setStudents(s);
      setDepartments(d);
    } catch {
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!form.departmentId) throw new Error("Please select a department");
      await adminApi.createStudent(form);
      toast({ title: "Success", description: "Student created successfully" });
      setOpen(false);
      setForm({ username: "", password: "", fullName: "", studentId: "", departmentId: "", stream: "NATURAL_SCIENCE" });
      fetchData();
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
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filtered = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.department.name.toLowerCase().includes(search.toLowerCase()) ||
    s.stream.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            <Users className="w-8 h-8 text-primary" /> Students
          </h1>
          <p className="text-muted-foreground text-sm">{students.length} registered students across all streams</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6">
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
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" required />
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
                    <SelectContent>
                      <SelectItem value="NATURAL_SCIENCE">Natural Science</SelectItem>
                      <SelectItem value="SOCIAL_SCIENCE">Social Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select 
                    value={form.departmentId} 
                    onValueChange={(v) => setForm({ ...form, departmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
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
        <Input placeholder="Search name, ID, or stream…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50 backdrop-blur-sm" />
      </div>

      <Card className="border shadow-none overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center text-muted-foreground animate-pulse">Loading student records…</div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No students matches your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b bg-muted/30">
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Full Name</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Student ID</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Stream</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Department</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] w-16 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm ${
                            s.stream === "NATURAL_SCIENCE" ? "bg-emerald-500" : "bg-blue-500"
                          }`}>
                            {s.fullName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-base">{s.fullName}</div>
                            <div className="text-xs text-muted-foreground">@{s.user?.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-[10px] py-0 px-2 rounded-sm border-muted-foreground/20">
                          {s.studentId}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {s.stream === "NATURAL_SCIENCE" ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <FlaskConical className="w-3.5 h-3.5" /> Natural Science
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs">
                            <Globe className="w-3.5 h-3.5" /> Social Science
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground font-medium">{s.department.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <Link href={`/admin/students/${s.id}`}>
                          <Button variant="outline" size="sm" className="rounded-full h-8 px-3 text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(s.id, s.fullName)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
