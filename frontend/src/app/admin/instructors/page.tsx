"use client";

import { useEffect, useState } from "react";
import { adminApi, Instructor, Subject, Stream, CreateInstructorData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { UserCheck, UserPlus, Trash2, Search, FlaskConical, Globe, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function InstructorsPage() {
  const { toast } = useToast();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateInstructorData>({
    username: "",
    password: "",
    fullName: "",
    stream: "NATURAL_SCIENCE",
    subjectId: "",
  });

  const fetchData = async () => {
    try {
      const [i, s] = await Promise.all([adminApi.instructors(), adminApi.subjects()]);
      setInstructors(i);
      setSubjects(s);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!form.subjectId) throw new Error("Please select a subject");
      await adminApi.createInstructor(form);
      toast({ title: "Success", description: "Instructor created successfully" });
      setOpen(false);
      setForm({ username: "", password: "", fullName: "", stream: "NATURAL_SCIENCE", subjectId: "" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete instructor "${name}"?`)) return;
    try {
      await adminApi.deleteInstructor(id);
      toast({ title: "Deleted", description: "Instructor removed successfully" });
      setInstructors((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredSubjects = subjects.filter((s) => s.stream === form.stream);

  const filteredInstructors = instructors.filter((i) =>
    i.user?.username.toLowerCase().includes(search.toLowerCase()) ||
    i.subject.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
            <UserCheck className="w-8 h-8 text-primary" /> Instructors
          </h1>
          <p className="text-muted-foreground text-sm">Manage subject-matter experts and their assignments</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 shadow-lg shadow-primary/20 rounded-xl">
              <UserPlus className="w-4 h-4" /> Add Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Instructor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label className="font-bold">Display Name / Full Name</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Instructor" required className="rounded-xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Stream</Label>
                  <Select 
                    value={form.stream} 
                    onValueChange={(v: Stream) => setForm({ ...form, stream: v, subjectId: "" })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATURAL_SCIENCE">Natural Science</SelectItem>
                      <SelectItem value="SOCIAL_SCIENCE">Social Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Subject</Label>
                  <Select 
                    value={form.subjectId} 
                    onValueChange={(v) => setForm({ ...form, subjectId: v })}
                    disabled={filteredSubjects.length === 0}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="instructor.name" required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" required minLength={6} className="rounded-xl" />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 rounded-xl shadow-md" disabled={submitting}>
                  {submitting ? "Creating…" : "Add Instructor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search name or subject…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50 backdrop-blur-sm rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-3xl" />
          ))
        ) : filteredInstructors.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No instructors found</p>
          </div>
        ) : (
          filteredInstructors.map((i) => (
            <Card key={i.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg ${
                      i.stream === "NATURAL_SCIENCE" ? "bg-emerald-500 shadow-emerald-200" : "bg-blue-500 shadow-blue-200"
                    }`}>
                      {i.user?.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-slate-800">{i.user?.username}</h3>
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 w-fit px-3 py-1 rounded-full">
                          <BookOpen className="w-3 h-3" /> {i.subject.name}
                        </div>
                        {i.stream === "NATURAL_SCIENCE" ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                            <FlaskConical className="w-3 h-3" /> Natural Science
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full">
                            <Globe className="w-3 h-3" /> Social Science
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                    onClick={() => handleDelete(i.id, i.user?.username || "")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
