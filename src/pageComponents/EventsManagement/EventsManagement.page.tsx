"use client";

import { useState } from "react";
import { api } from "~/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  CalendarDays,
  Users,
  MapPin,
  Phone,
  Plus,
  Search,
  Filter,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-800",
  quote_sent: "bg-yellow-100 text-yellow-800",
  quote_revised: "bg-amber-100 text-amber-800",
  quote_accepted: "bg-emerald-100 text-emerald-800",
  deposit_pending: "bg-orange-100 text-orange-800",
  deposit_received: "bg-teal-100 text-teal-800",
  confirmed: "bg-green-100 text-green-800",
  in_preparation: "bg-indigo-100 text-indigo-800",
  in_execution: "bg-purple-100 text-purple-800",
  completed: "bg-gray-100 text-gray-800",
  settlement_pending: "bg-pink-100 text-pink-800",
  settled: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: "💍",
  corporate: "🏢",
  ramadan_iftar: "🌙",
  eid: "⭐",
  birthday: "🎂",
  conference: "🎤",
  engagement: "💛",
  henna: "✋",
  graduation: "🎓",
  funeral: "🌸",
  diffa: "🏛️",
  other: "📅",
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(centimes: number) {
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

function EventCard({ event }: { event: Record<string, unknown> }) {
  const statusClass = STATUS_COLORS[event.status as string] ?? "bg-gray-100 text-gray-800";
  const icon = EVENT_TYPE_ICONS[event.eventType as string] ?? "📅";

  return (
    <Card className="transition-shadow hover:shadow-md cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">
                {event.title as string}
              </h3>
              <Badge variant="secondary" className={`text-[10px] ${statusClass}`}>
                {(event.status as string).replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
          {(event.totalAmount as number) > 0 && (
            <span className="text-sm font-semibold text-emerald-700">
              {formatCurrency(event.totalAmount as number)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDate(event.eventDate as string)}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.guestCount as number} guests
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {event.customerName as string}
          </div>
          {event.venueName && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.venueName as string}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventsManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = api.events.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 50,
  });

  const events = (data?.events ?? []) as Array<Record<string, unknown>>;

  // Group events by status category
  const pipeline = events.filter((e) =>
    ["inquiry", "quote_sent", "quote_revised", "quote_accepted"].includes(e.status as string)
  );
  const active = events.filter((e) =>
    ["deposit_pending", "deposit_received", "confirmed", "in_preparation", "in_execution"].includes(e.status as string)
  );
  const completed = events.filter((e) =>
    ["completed", "settlement_pending", "settled"].includes(e.status as string)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">
            Manage inquiries, bookings, and event execution
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, clients, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Pipeline View */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="all">All Events ({events.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6 mt-4">
          {/* Pipeline columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Inquiry Pipeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Inquiries & Quotes</h3>
                <Badge variant="outline">{pipeline.length}</Badge>
              </div>
              <div className="space-y-3">
                {pipeline.map((event) => (
                  <EventCard key={event.id as string} event={event} />
                ))}
                {pipeline.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No pending inquiries
                  </p>
                )}
              </div>
            </div>

            {/* Active Events */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Active Events</h3>
                <Badge variant="outline">{active.length}</Badge>
              </div>
              <div className="space-y-3">
                {active.map((event) => (
                  <EventCard key={event.id as string} event={event} />
                ))}
                {active.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No active events
                  </p>
                )}
              </div>
            </div>

            {/* Completed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Completed</h3>
                <Badge variant="outline">{completed.length}</Badge>
              </div>
              <div className="space-y-3">
                {completed.slice(0, 5).map((event) => (
                  <EventCard key={event.id as string} event={event} />
                ))}
                {completed.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No completed events yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No events found</p>
                <Button variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create your first event
                </Button>
              </div>
            ) : (
              events.map((event) => (
                <EventCard key={event.id as string} event={event} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Calendar view coming soon — use the Calendar page for now
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
