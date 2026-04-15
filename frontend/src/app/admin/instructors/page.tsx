"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STREAMS: { value: Stream; label: string; description: string; tone: string }[] = [
  {
    value: "NATURAL_SCIENCE",
    label: "Natural Science",
    description: "Instructors assigned to natural science subjects",
    tone: "from-emerald-500 to-teal-600",
  },
  {
    value: "SOCIAL_SCIENCE",
    label: "Social Science",
    description: "Instructors assigned to social science subjects",
    tone: "from-blue-500 to-cyan-600",
  },
];

export default function InstructorsPage() {
  const { toast } = useToast();
  const [instructorsByStream, setInstructorsByStream] = useState<Record<Stream, Instructor[]>>({
    NATURAL_SCIENCE: [],
    SOCIAL_SCIENCE: [],
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStream, setActiveStream] = useState<Stream>("NATURAL_SCIENCE");
  const [form, setForm] = useState<CreateInstructorData>({
    username: "",
    password: "",
    fullName: "",
    stream: "NATURAL_SCIENCE",
    subjectId: "",
  });

  const fetchData = async () => {
    try {
      const [natural, social, loadedSubjects] = await Promise.all([
        adminApi.instructors({ stream: "NATURAL_SCIENCE" }),
        adminApi.instructors({ stream: "SOCIAL_SCIENCE" }),
        adminApi.subjects(),
      ]);
      setInstructorsByStream({
        NATURAL_SCIENCE: natural,
        SOCIAL_SCIENCE: social,
      });
      setSubjects(loadedSubjects);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeInstructors = instructorsByStream[activeStream];
  const filteredSubjects = subjects.filter((subject) => subject.stream === form.stream);

  const tabCounts = useMemo(
    () => ({
      NATURAL_SCIENCE: instructorsByStream.NATURAL_SCIENCE.length,
      SOCIAL_SCIENCE: instructorsByStream.SOCIAL_SCIENCE.length,
    }),
    [instructorsByStream]
  );

  const filteredInstructors = (stream: Stream) =>
    instructorsByStream[stream].filter((instructor) =>
      instructor.user?.username.toLowerCase().includes(search.toLowerCase()) ||
      instructor.subject.name.toLowerCase().includes(search.toLowerCase()) ||
      instructor.subject.stream.toLowerCase().includes(search.toLowerCase())
    );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!form.subjectId) throw new Error("Please select a subject");
      await adminApi.createInstructor(form);
      toast({ title: "Success", description: "Instructor created successfully" });
      setOpen(false);
      setForm({ username: "", password: "", fullName: "", stream: activeStream, subjectId: "" });
      await fetchData();
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
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openAddDialog = () => {
    setForm((current) => ({ ...current, stream: activeStream }));
    setOpen(true);
  };

  const renderInstructorCards = (stream: Stream) => {
    const visibleInstructors = filteredInstructors(stream);

    return visibleInstructors.length === 0 ? (
      <div className="py-20 text-center">
        <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">No instructors found in this stream</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleInstructors.map((instructor) => (
          <Card key={instructor.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div className="space-y-4 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg ${
                    instructor.stream === "NATURAL_SCIENCE" ? "bg-emerald-500 shadow-emerald-200" : "bg-blue-500 shadow-blue-200"
                  }`}>
                    {instructor.user?.username?.[0]?.toUpperCase() || "I"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-800">{instructor.user?.username}</h3>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 w-fit px-3 py-1 rounded-full">
                        <BookOpen className="w-3 h-3" /> {instructor.subject.name}
                      </div>
                      {instructor.stream === "NATURAL_SCIENCE" ? (
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
                  onClick={() => handleDelete(instructor.id, instructor.user?.username || "")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
            <UserCheck className="w-8 h-8 text-primary" /> Instructors
          </h1>
          <p className="text-muted-foreground text-sm">
            {tabCounts.NATURAL_SCIENCE + tabCounts.SOCIAL_SCIENCE} instructors across both streams
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 shadow-lg shadow-primary/20 rounded-xl" onClick={openAddDialog}>
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
                      {filteredSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
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
                      {stream.label} Instructors
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stream.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs font-bold">
                    {tabCounts[stream.value]} instructors
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-40 bg-muted/50 animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : (
              renderInstructorCards(stream.value)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
