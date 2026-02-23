"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { api } from "~/utils/api";
import { formatPrice } from "~/utils/currency";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Ban,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  DollarSign,
  X,
  Loader2,
  CalendarOff,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
  Repeat,
  Info,
} from "lucide-react";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-gray-100 text-gray-700 border-gray-200",
  reviewed: "bg-slate-100 text-slate-700 border-slate-200",
  quoted: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  declined: "bg-red-100 text-red-700 border-red-200",
  deposit_paid: "bg-lime-100 text-lime-700 border-lime-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  prep: "bg-amber-100 text-amber-700 border-amber-200",
  setup: "bg-orange-100 text-orange-700 border-orange-200",
  execution: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-teal-100 text-teal-700 border-teal-200",
  settled: "bg-cyan-100 text-cyan-700 border-cyan-200",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

const STATUS_LABELS: Record<string, string> = {
  inquiry: "Inquiry",
  reviewed: "Reviewed",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
  deposit_paid: "Deposit Paid",
  confirmed: "Confirmed",
  prep: "In Preparation",
  setup: "Setup",
  execution: "Execution",
  completed: "Completed",
  settled: "Settled",
  cancelled: "Cancelled",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Wedding",
  corporate: "Corporate",
  birthday: "Birthday",
  conference: "Conference",
  social: "Social",
  religious: "Religious",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  status: string;
  customerName: string;
  venueName: string | null;
  totalAmount: number | null;
}

interface BlockedDate {
  id: string;
  orgId: string;
  date: Date | string;
  reason: string | null;
  isRecurring: boolean;
  createdAt: Date | string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0-6 where Monday = 0 */
function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isBeforeToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  const cell = new Date(year, month, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return cell < today;
}

function formatDateLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toISODate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getDayOfWeekLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  return DAYS_FULL[date.getDay() === 0 ? 6 : date.getDay() - 1] ?? "";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Event pill displayed inside a calendar day cell */
function EventPill({
  event,
  compact,
}: {
  event: CalendarEvent;
  compact?: boolean;
}) {
  const colors = STATUS_COLORS[event.status] ?? STATUS_COLORS.inquiry;

  if (compact) {
    return (
      <div
        className={`h-1.5 w-1.5 rounded-full ${(colors ?? "bg-gray-300").split(" ")[0] ?? "bg-gray-300"}`}
        title={event.title}
      />
    );
  }

  return (
    <div
      className={`text-[10px] leading-tight rounded px-1.5 py-0.5 truncate cursor-pointer border transition-all hover:shadow-sm ${colors}`}
      title={`${event.title} - ${STATUS_LABELS[event.status] ?? event.status}`}
    >
      {event.title}
    </div>
  );
}

/** A single event row inside the Day Detail panel */
function EventDetailRow({
  event,
  expanded,
  onToggle,
}: {
  event: CalendarEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = STATUS_COLORS[event.status] ?? STATUS_COLORS.inquiry;

  return (
    <div className="rounded-lg border bg-card transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{event.title}</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 shrink-0 ${colors}`}
            >
              {STATUS_LABELS[event.status] ?? event.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.guestCount} guests
            </span>
            {event.totalAmount != null && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatPrice(event.totalAmount)}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t pt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Customer</span>
              <p className="font-medium">{event.customerName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Event Type</span>
              <p className="font-medium">
                {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
              </p>
            </div>
            {event.venueName && (
              <div>
                <span className="text-muted-foreground">Venue</span>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.venueName}
                </p>
              </div>
            )}
            {event.totalAmount != null && (
              <div>
                <span className="text-muted-foreground">Amount</span>
                <p className="font-medium">{formatPrice(event.totalAmount)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Legend item */
function LegendItem({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2.5 w-2.5 rounded-sm border ${className}`} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/** Hook to detect mobile viewport (below lg breakpoint = 1024px) */
function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}

export default function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const isMobile = useIsMobile();

  // Day detail panel state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Block date dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockMode, setBlockMode] = useState<"single" | "range">("single");
  const [blockSingleDate, setBlockSingleDate] = useState("");
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockIsRecurring, setBlockIsRecurring] = useState(false);

  // -------------------------------------------------------------------------
  // API queries
  // -------------------------------------------------------------------------

  const apiContext = api.useContext();

  const { data: calendarData, isLoading: isLoadingCalendar } =
    api.calendar.getMonthCalendar.useQuery({
      year,
      month: month + 1, // API expects 1-12
    });

  const { data: blockedDatesRaw } = api.calendar.getBlockedDates.useQuery({
    year,
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const blockDateMutation = api.calendar.blockDate.useMutation({
    onSuccess: () => {
      void apiContext.calendar.getMonthCalendar.invalidate();
      void apiContext.calendar.getBlockedDates.invalidate();
      resetBlockDialog();
    },
  });

  const blockDateRangeMutation = api.calendar.blockDateRange.useMutation({
    onSuccess: () => {
      void apiContext.calendar.getMonthCalendar.invalidate();
      void apiContext.calendar.getBlockedDates.invalidate();
      resetBlockDialog();
    },
  });

  const unblockDateMutation = api.calendar.unblockDate.useMutation({
    onSuccess: () => {
      void apiContext.calendar.getMonthCalendar.invalidate();
      void apiContext.calendar.getBlockedDates.invalidate();
    },
  });

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const events = useMemo(
    () =>
      ((calendarData as Record<string, unknown>)?.events ?? []) as CalendarEvent[],
    [calendarData],
  );

  const calendarBlockedDates = useMemo(
    () =>
      ((calendarData as Record<string, unknown>)?.blockedDates ??
        []) as BlockedDate[],
    [calendarData],
  );

  const allBlockedDates = useMemo(
    () => (blockedDatesRaw ?? []) as BlockedDate[],
    [blockedDatesRaw],
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build event map: dayNumber -> events[]
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    events.forEach((ev) => {
      const d = new Date(ev.eventDate).getDate();
      if (!map[d]) map[d] = [];
      map[d]!.push(ev);
    });
    return map;
  }, [events]);

  // Build blocked map: dayNumber -> BlockedDate
  const blockedByDay = useMemo(() => {
    const map: Record<number, BlockedDate> = {};
    calendarBlockedDates.forEach((b) => {
      const d = new Date(b.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        map[d.getDate()] = b;
      }
    });
    return map;
  }, [calendarBlockedDates, year, month]);

  // Stats
  const monthStats = useMemo(() => {
    const totalEvents = events.length;
    const totalBlocked = Object.keys(blockedByDay).length;
    const availableDays = daysInMonth - totalBlocked;
    return { totalEvents, totalBlocked, availableDays };
  }, [events, blockedByDay, daysInMonth]);

  // Upcoming blocked dates (future only, sorted)
  const upcomingBlockedDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allBlockedDates
      .filter((b) => new Date(b.date) >= today)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [allBlockedDates]);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
  }, []);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  // -------------------------------------------------------------------------
  // Block dialog
  // -------------------------------------------------------------------------

  function resetBlockDialog() {
    setBlockDialogOpen(false);
    setBlockMode("single");
    setBlockSingleDate("");
    setBlockStartDate("");
    setBlockEndDate("");
    setBlockReason("");
    setBlockIsRecurring(false);
  }

  function openBlockDialogForDay(day: number) {
    const dateStr = toISODate(year, month, day);
    setBlockSingleDate(dateStr);
    setBlockMode("single");
    setBlockDialogOpen(true);
  }

  function handleBlockSubmit() {
    if (blockMode === "single" && blockSingleDate) {
      blockDateMutation.mutate({
        date: new Date(blockSingleDate),
        reason: blockReason || undefined,
        isRecurring: blockIsRecurring,
      });
    } else if (blockMode === "range" && blockStartDate && blockEndDate) {
      blockDateRangeMutation.mutate({
        startDate: new Date(blockStartDate),
        endDate: new Date(blockEndDate),
        reason: blockReason || undefined,
      });
    }
  }

  function handleUnblock(blockedDateId: string) {
    unblockDateMutation.mutate({ blockedDateId });
  }

  const isBlockSubmitting =
    blockDateMutation.isLoading || blockDateRangeMutation.isLoading;

  // -------------------------------------------------------------------------
  // Day detail
  // -------------------------------------------------------------------------

  const selectedDayEvents = selectedDay ? eventsByDay[selectedDay] ?? [] : [];
  const selectedDayBlocked = selectedDay ? blockedByDay[selectedDay] : undefined;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <DashboardPageHeader
        title="Calendar"
        description="View events, manage availability, and block dates"
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {!isCurrentMonth && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="gap-1.5"
              >
                <CalendarCheck className="h-4 w-4" />
                Today
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setBlockSingleDate("");
                setBlockStartDate("");
                setBlockEndDate("");
                setBlockReason("");
                setBlockIsRecurring(false);
                setBlockMode("single");
                setBlockDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <Ban className="h-4 w-4" />
              Block Dates
            </Button>
          </div>
        }
      />

      {/* ================================================================= */}
      {/* Month Navigation                                                  */}
      {/* ================================================================= */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold">
                {MONTHS[month]} {year}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 mb-5 px-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <strong className="text-foreground">
                {monthStats.totalEvents}
              </strong>{" "}
              event{monthStats.totalEvents !== 1 ? "s" : ""} this month
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-red-400" />
              <strong className="text-foreground">
                {monthStats.totalBlocked}
              </strong>{" "}
              blocked date{monthStats.totalBlocked !== 1 ? "s" : ""}
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-green-500" />
              <strong className="text-foreground">
                {monthStats.availableDays}
              </strong>{" "}
              available day{monthStats.availableDays !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Loading overlay */}
          {isLoadingCalendar && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading calendar...
              </span>
            </div>
          )}

          {!isLoadingCalendar && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* --------------------------------------------------------- */}
              {/* Calendar Grid                                              */}
              {/* --------------------------------------------------------- */}
              <div className="flex-1 min-w-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-px mb-1">
                  {DAYS_SHORT.map((d, i) => (
                    <div
                      key={d}
                      className="text-center text-xs font-medium text-muted-foreground py-2 hidden sm:block"
                    >
                      {DAYS_FULL[i]}
                    </div>
                  ))}
                  {DAYS_SHORT.map((d) => (
                    <div
                      key={`short-${d}`}
                      className="text-center text-xs font-medium text-muted-foreground py-2 sm:hidden"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-px">
                  {/* Empty cells before month starts */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[60px] sm:min-h-[100px] p-1 bg-muted/20 rounded"
                    />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday =
                      now.getFullYear() === year &&
                      now.getMonth() === month &&
                      now.getDate() === day;
                    const isPast = isBeforeToday(year, month, day);
                    const isBlocked = !!blockedByDay[day];
                    const dayEvents = eventsByDay[day] ?? [];
                    const isSelected = selectedDay === day;

                    // Max visible events: 3 on desktop, compact dots on mobile
                    const MAX_VISIBLE = 3;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setSelectedDay(day);
                          setExpandedEventId(null);
                        }}
                        className={`
                          relative min-h-[60px] sm:min-h-[100px] p-1 sm:p-1.5 rounded border text-left
                          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40
                          ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                              : isBlocked
                                ? "border-red-200 hover:border-red-300"
                                : isToday
                                  ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                                  : isPast
                                    ? "border-transparent hover:bg-muted/30"
                                    : "border-transparent hover:bg-muted/50 hover:border-muted-foreground/10"
                          }
                          ${isPast && !isToday ? "opacity-60" : ""}
                        `}
                        aria-label={`${formatDateLabel(year, month, day)}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}${isBlocked ? ", blocked" : ""}`}
                      >
                        {/* Blocked diagonal stripes background */}
                        {isBlocked && (
                          <div
                            className="absolute inset-0 rounded opacity-[0.07] pointer-events-none"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(135deg, transparent, transparent 4px, #ef4444 4px, #ef4444 5px)",
                            }}
                          />
                        )}

                        {/* Day number */}
                        <div className="flex items-center justify-between relative">
                          <span
                            className={`
                              text-xs sm:text-sm font-medium flex items-center justify-center
                              ${
                                isToday
                                  ? "bg-primary text-primary-foreground rounded-full w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm"
                                  : isPast
                                    ? "text-muted-foreground/70"
                                    : "text-foreground"
                              }
                            `}
                          >
                            {day}
                          </span>
                          {isBlocked && (
                            <Ban className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-400" />
                          )}
                        </div>

                        {/* Events - full pills on desktop */}
                        <div className="mt-1 space-y-0.5 hidden sm:block">
                          {dayEvents.slice(0, MAX_VISIBLE).map((ev) => (
                            <EventPill key={ev.id} event={ev} />
                          ))}
                          {dayEvents.length > MAX_VISIBLE && (
                            <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                              +{dayEvents.length - MAX_VISIBLE} more
                            </div>
                          )}
                        </div>

                        {/* Events - compact dots on mobile */}
                        <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                          {dayEvents.slice(0, 4).map((ev) => (
                            <EventPill key={ev.id} event={ev} compact />
                          ))}
                          {dayEvents.length > 4 && (
                            <span className="text-[8px] text-muted-foreground">
                              +{dayEvents.length - 4}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Trailing empty cells to complete last row */}
                  {(() => {
                    const totalCells = firstDay + daysInMonth;
                    const remainder = totalCells % 7;
                    if (remainder === 0) return null;
                    return Array.from({ length: 7 - remainder }).map((_, i) => (
                      <div
                        key={`trail-${i}`}
                        className="min-h-[60px] sm:min-h-[100px] p-1 bg-muted/20 rounded"
                      />
                    ));
                  })()}
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* Day Detail Side Panel (desktop)                            */}
              {/* --------------------------------------------------------- */}
              {selectedDay != null && (
                <div className="hidden lg:block w-80 shrink-0">
                  <DayDetailPanel
                    year={year}
                    month={month}
                    day={selectedDay}
                    events={selectedDayEvents}
                    blockedDate={selectedDayBlocked}
                    expandedEventId={expandedEventId}
                    onToggleEvent={(id) =>
                      setExpandedEventId((prev) =>
                        prev === id ? null : id,
                      )
                    }
                    onClose={() => setSelectedDay(null)}
                    onBlockDate={() => openBlockDialogForDay(selectedDay)}
                    onUnblock={(id) => handleUnblock(id)}
                    isUnblocking={unblockDateMutation.isLoading}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Day Detail Dialog (mobile)                                        */}
      {/* ================================================================= */}
      <Dialog
        open={selectedDay != null && isMobile}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent className="max-w-lg">
          {selectedDay != null && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {formatDateLabel(year, month, selectedDay)}
                </DialogTitle>
                <DialogDescription>
                  {selectedDayEvents.length} event
                  {selectedDayEvents.length !== 1 ? "s" : ""} on this day
                </DialogDescription>
              </DialogHeader>
              <DayDetailContent
                year={year}
                month={month}
                day={selectedDay}
                events={selectedDayEvents}
                blockedDate={selectedDayBlocked}
                expandedEventId={expandedEventId}
                onToggleEvent={(id) =>
                  setExpandedEventId((prev) => (prev === id ? null : id))
                }
                onBlockDate={() => openBlockDialogForDay(selectedDay)}
                onUnblock={(id) => handleUnblock(id)}
                isUnblocking={unblockDateMutation.isLoading}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Upcoming Blocked Dates Section                                    */}
      {/* ================================================================= */}
      {upcomingBlockedDates.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CalendarOff className="h-4 w-4 text-red-400" />
                Upcoming Blocked Dates
              </h3>
              <Badge variant="secondary" className="text-xs">
                {upcomingBlockedDates.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {upcomingBlockedDates.map((b) => {
                const d = new Date(b.date);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-red-50/50 border-red-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 text-red-600 shrink-0">
                        <Ban className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {d.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year:
                              d.getFullYear() !== now.getFullYear()
                                ? "numeric"
                                : undefined,
                          })}
                          {b.isRecurring && (
                            <Repeat className="inline h-3 w-3 ml-1.5 text-muted-foreground" />
                          )}
                        </p>
                        {b.reason && (
                          <p className="text-xs text-muted-foreground truncate">
                            {b.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleUnblock(b.id)}
                      disabled={unblockDateMutation.isLoading}
                      aria-label="Unblock date"
                    >
                      {unblockDateMutation.isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* Legend                                                             */}
      {/* ================================================================= */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Status Legend
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <LegendItem
                key={key}
                label={label}
                className={STATUS_COLORS[key] ?? ""}
              />
            ))}
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-sm border border-red-200"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, transparent, transparent 2px, #ef4444 2px, #ef4444 2.5px)",
                }}
              />
              <span className="text-[11px] text-muted-foreground">
                Blocked
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Block Date Dialog                                                 */}
      {/* ================================================================= */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Block Date{blockMode === "range" ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Block a date or range of dates to mark them as unavailable for
              bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Single / Range toggle */}
            <div className="flex items-center gap-3">
              <Label htmlFor="block-mode-toggle" className="text-sm">
                Date range
              </Label>
              <Switch
                id="block-mode-toggle"
                checked={blockMode === "range"}
                onCheckedChange={(checked) =>
                  setBlockMode(checked ? "range" : "single")
                }
              />
            </div>

            {/* Date inputs */}
            {blockMode === "single" ? (
              <div className="space-y-2">
                <Label htmlFor="block-single-date">Date</Label>
                <Input
                  id="block-single-date"
                  type="date"
                  value={blockSingleDate}
                  onChange={(e) => setBlockSingleDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="block-start-date">Start Date</Label>
                  <Input
                    id="block-start-date"
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end-date">End Date</Label>
                  <Input
                    id="block-end-date"
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    min={blockStartDate}
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="block-reason">
                Reason{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="block-reason"
                placeholder="e.g. Holiday, Private event, Maintenance..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={2}
              />
            </div>

            {/* Recurring checkbox (single mode only) */}
            {blockMode === "single" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="block-recurring"
                  checked={blockIsRecurring}
                  onCheckedChange={(checked) =>
                    setBlockIsRecurring(checked === true)
                  }
                />
                <Label
                  htmlFor="block-recurring"
                  className="text-sm font-normal cursor-pointer"
                >
                  Repeat every year{" "}
                  <span className="text-muted-foreground">
                    (e.g. annual holiday)
                  </span>
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetBlockDialog}
              disabled={isBlockSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBlockSubmit}
              disabled={
                isBlockSubmitting ||
                (blockMode === "single" && !blockSingleDate) ||
                (blockMode === "range" && (!blockStartDate || !blockEndDate))
              }
              className="gap-1.5"
            >
              {isBlockSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Ban className="h-4 w-4" />
              Block{blockMode === "range" ? " Range" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day Detail Panel (desktop sidebar)
// ---------------------------------------------------------------------------

function DayDetailPanel({
  year,
  month,
  day,
  events,
  blockedDate,
  expandedEventId,
  onToggleEvent,
  onClose,
  onBlockDate,
  onUnblock,
  isUnblocking,
}: {
  year: number;
  month: number;
  day: number;
  events: CalendarEvent[];
  blockedDate?: BlockedDate;
  expandedEventId: string | null;
  onToggleEvent: (id: string) => void;
  onClose: () => void;
  onBlockDate: () => void;
  onUnblock: (id: string) => void;
  isUnblocking: boolean;
}) {
  return (
    <Card className="sticky top-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {getDayOfWeekLabel(year, month, day)}
            </p>
            <p className="text-lg font-semibold">
              {MONTHS[month]} {day}, {year}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <DayDetailContent
          year={year}
          month={month}
          day={day}
          events={events}
          blockedDate={blockedDate}
          expandedEventId={expandedEventId}
          onToggleEvent={onToggleEvent}
          onBlockDate={onBlockDate}
          onUnblock={onUnblock}
          isUnblocking={isUnblocking}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Day Detail Content (shared between panel and dialog)
// ---------------------------------------------------------------------------

function DayDetailContent({
  year,
  month,
  day,
  events,
  blockedDate,
  expandedEventId,
  onToggleEvent,
  onBlockDate,
  onUnblock,
  isUnblocking,
}: {
  year: number;
  month: number;
  day: number;
  events: CalendarEvent[];
  blockedDate?: BlockedDate;
  expandedEventId: string | null;
  onToggleEvent: (id: string) => void;
  onBlockDate: () => void;
  onUnblock: (id: string) => void;
  isUnblocking: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Blocked notice */}
      {blockedDate && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-start gap-2">
            <Ban className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700">
                Date is blocked
                {blockedDate.isRecurring && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-[10px] border-red-200 text-red-500"
                  >
                    <Repeat className="h-2.5 w-2.5 mr-0.5" />
                    Recurring
                  </Badge>
                )}
              </p>
              {blockedDate.reason && (
                <p className="text-xs text-red-600 mt-0.5">
                  {blockedDate.reason}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full text-red-600 border-red-200 hover:bg-red-100"
            onClick={() => onUnblock(blockedDate.id)}
            disabled={isUnblocking}
          >
            {isUnblocking ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Unblock this date
          </Button>
        </div>
      )}

      {/* Events list */}
      {events.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Events ({events.length})
          </p>
          {events.map((ev) => (
            <EventDetailRow
              key={ev.id}
              event={ev}
              expanded={expandedEventId === ev.id}
              onToggle={() => onToggleEvent(ev.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <CalendarIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No events on this day
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t space-y-2">
        {!blockedDate && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            onClick={onBlockDate}
          >
            <Ban className="h-3.5 w-3.5" />
            Block this date
          </Button>
        )}
      </div>
    </div>
  );
}
