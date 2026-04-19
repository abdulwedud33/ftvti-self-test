"use client";

import { useEffect, useState } from "react";
import { adminApi, Event, CreateEventData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { Calendar, Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";

export default function EventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateEventData>({ title: "", description: "", date: "" });

  const fetchData = async () => {
    try {
      setEvents(await adminApi.events());
    } catch {
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createEvent({ ...form, date: new Date(form.date).toISOString() });
      toast({ title: "Success", description: "Event created successfully" });
      setOpen(false);
      setForm({ title: "", description: "", date: "" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await adminApi.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Deleted", description: "Event removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const upcoming = events.filter((e) => dayjs(e.date).isAfter(dayjs()));
  const past = events.filter((e) => !dayjs(e.date).isAfter(dayjs()));

  return (
    <div className="space-y-6 ml-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" /> Events
          </h1>
          <p className="text-muted-foreground text-sm">{events.length} total events</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Event description…"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Creating…" : "Create Event"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      ) : events.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No events yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Upcoming</h2>
              {upcoming.map((event) => <EventCard key={event.id} event={event} onDelete={handleDelete} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Past Events</h2>
              {past.map((event) => <EventCard key={event.id} event={event} onDelete={handleDelete} past />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({ event, onDelete, past }: { event: Event; onDelete: (id: string) => void; past?: boolean }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold flex-shrink-0 ${past ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}>
          <span className="text-lg leading-none">{dayjs(event.date).format("D")}</span>
          <span>{dayjs(event.date).format("MMM")}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{event.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{dayjs(event.date).format("MMMM D, YYYY [at] h:mm A")}</p>
        </div>
        <button onClick={() => onDelete(event.id)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
