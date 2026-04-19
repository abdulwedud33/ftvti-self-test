"use client";

import { useEffect, useState } from "react";
import { studentApi, Event } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function StudentEventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi
      .events()
      .then(setEvents)
      .catch(() =>
        toast({ title: "Error", description: "Failed to load events", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const upcoming = events.filter((e) => dayjs(e.date).isAfter(dayjs()));
  const past = events.filter((e) => !dayjs(e.date).isAfter(dayjs()));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 ml-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" /> Events & Announcements
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          {upcoming.length} upcoming · {past.length} past
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-muted-foreground opacity-40" />
            </div>
            <p className="font-medium">No events scheduled</p>
            <p className="text-muted-foreground text-sm mt-1">Check back later for announcements.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming events */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming
              </h2>
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} upcoming />
              ))}
            </div>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Past Events
              </h2>
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({ event, upcoming }: { event: Event; upcoming?: boolean }) {
  const isToday = dayjs(event.date).isSame(dayjs(), "day");

  return (
    <Card className={`border-0 shadow-sm transition-shadow hover:shadow-md ${upcoming ? "" : "opacity-70"}`}>
      <CardContent className="p-5 flex gap-4">
        {/* Date block */}
        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${upcoming ? "bg-indigo-600 text-white" : "bg-secondary text-muted-foreground"}`}>
          <span className="text-xl font-bold leading-none">{dayjs(event.date).format("D")}</span>
          <span className="text-xs mt-0.5 opacity-80">{dayjs(event.date).format("MMM")}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{event.title}</p>
            {!upcoming && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Done
              </span>
            )}
            {isToday && upcoming && (
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">
                Today
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{dayjs(event.date).format("h:mm A")}</span>
            {upcoming && (
              <span className="text-indigo-600 ml-1">· {dayjs(event.date).fromNow()}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
