"use client";

import { useEffect, useState } from "react";
import { adminApi, Subject, Stream, SubjectType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { Bookmark, Plus, Trash2, Search, FlaskConical, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function SubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ name: string; type: SubjectType; stream?: Stream }>({
    name: "",
    type: "STREAM_SPECIFIC",
    stream: "NATURAL_SCIENCE",
  });

  const fetchSubjects = async () => {
    try {
      const data = await adminApi.subjects();
      setSubjects(data);
    } catch {
      toast({ title: "Error", description: "Failed to load subjects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload =
        form.type === "SHARED"
          ? { name: form.name, type: form.type }
          : { name: form.name, type: form.type, stream: form.stream };

      await adminApi.createSubject(payload);
      toast({ title: "Success", description: "Subject created successfully" });
      setOpen(false);
      setForm({ name: "", type: "STREAM_SPECIFIC", stream: "NATURAL_SCIENCE" });
      fetchSubjects();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"? This might affect existing questions.`)) return;
    try {
      await adminApi.deleteSubject(id);
      toast({ title: "Deleted", description: "Subject removed successfully" });
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.stream ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.type === "SHARED" ? "shared" : "stream specific").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
            <Bookmark className="w-8 h-8 text-primary" /> Subjects
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Manage curriculum subjects for each stream</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Subject</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label className="font-bold">Subject Name</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="e.g. Mathematics" 
                  required 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Subject Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: SubjectType) =>
                    setForm((prev) => ({
                      ...prev,
                      type: v,
                      stream: v === "SHARED" ? undefined : prev.stream ?? "NATURAL_SCIENCE",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select subject type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border">
                    <SelectItem value="STREAM_SPECIFIC">Stream Specific</SelectItem>
                    <SelectItem value="SHARED">Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "STREAM_SPECIFIC" && (
                <div className="space-y-2">
                  <Label className="font-bold">Stream</Label>
                  <Select
                    value={form.stream}
                    onValueChange={(v: Stream) => setForm({ ...form, stream: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border">
                      <SelectItem value="NATURAL_SCIENCE">Natural Science</SelectItem>
                      <SelectItem value="SOCIAL_SCIENCE">Social Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 rounded-xl" disabled={submitting}>
                  {submitting ? "Saving…" : "Create Subject"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Filter by name or stream…" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9 bg-background/50 backdrop-blur-sm rounded-xl" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No subjects found</p>
          </div>
        ) : (
          filtered.map((s) => (
            <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-primary/5 text-primary w-fit group-hover:scale-110 transition-transform duration-300">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">{s.name}</h3>
                      <div className="mt-2">
                        {s.type === "SHARED" ? (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 flex gap-1 items-center px-3">
                            Shared
                          </Badge>
                        ) : s.stream === "NATURAL_SCIENCE" ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border- emerald-100 flex gap-1 items-center px-3">
                            <FlaskConical className="w-3 h-3" /> Natural Science
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 flex gap-1 items-center px-3">
                            <Globe className="w-3 h-3" /> Social Science
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-300 hover:text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(s.id, s.name)}
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
