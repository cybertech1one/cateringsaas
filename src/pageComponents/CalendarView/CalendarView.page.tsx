"use client";

import { useState } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Ban,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export default function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { data: calendarData } = api.calendar.getMonthCalendar.useQuery({
    year,
    month: month + 1,
  });

  const { data: blockedDates } = api.calendar.getBlockedDates.useQuery({});

  const events = ((calendarData as Record<string, unknown>)?.events ?? []) as Array<
    Record<string, unknown>
  >;
  const blocked = (blockedDates ?? []) as Array<Record<string, unknown>>;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  // Build event map: day -> events[]
  const eventsByDay: Record<number, Array<Record<string, unknown>>> = {};
  events.forEach((ev) => {
    const d = new Date(ev.eventDate as string).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d]!.push(ev);
  });

  // Build blocked set
  const blockedSet = new Set<string>();
  blocked.forEach((b) => {
    const d = new Date(b.date as string);
    if (d.getFullYear() === year && d.getMonth() === month) {
      blockedSet.add(String(d.getDate()));
    }
  });

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            View events and manage availability
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Ban className="h-4 w-4" />
          Block Dates
        </Button>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] p-1" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;
              const isBlocked = blockedSet.has(String(day));
              const dayEvents = eventsByDay[day] ?? [];

              return (
                <div
                  key={day}
                  className={`min-h-[80px] p-1 rounded border transition-colors ${
                    isBlocked
                      ? "bg-red-50 border-red-200"
                      : isToday
                        ? "bg-primary/5 border-primary/30"
                        : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    {isBlocked && (
                      <Ban className="h-3 w-3 text-red-400" />
                    )}
                  </div>

                  {/* Events on this day */}
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id as string}
                        className="text-[9px] leading-tight bg-primary/10 text-primary rounded px-1 py-0.5 truncate cursor-pointer"
                        title={ev.title as string}
                      >
                        {ev.title as string}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Blocked Dates */}
      {blocked.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Blocked Dates</h3>
            <div className="flex flex-wrap gap-2">
              {blocked.map((b) => (
                <Badge
                  key={b.id as string}
                  variant="secondary"
                  className="text-xs gap-1"
                >
                  <Ban className="h-3 w-3" />
                  {new Date(b.date as string).toLocaleDateString("fr-MA", {
                    day: "numeric",
                    month: "short",
                  })}
                  {b.reason ? (
                    <span className="text-muted-foreground">
                      — {String(b.reason)}
                    </span>
                  ) : null}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
