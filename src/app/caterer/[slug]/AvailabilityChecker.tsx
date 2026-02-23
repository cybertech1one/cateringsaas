"use client";

import { useState } from "react";
import { api } from "~/utils/api";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

interface AvailabilityCheckerProps {
  orgSlug: string;
  orgName: string;
  minGuests?: number | null;
  maxGuests?: number | null;
}

export function AvailabilityChecker({
  orgSlug,
  orgName,
  minGuests,
  maxGuests,
}: AvailabilityCheckerProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState<string>("");

  // Query availability when a date is selected
  const availabilityQuery = api.calendar.checkPublicAvailability.useQuery(
    {
      orgSlug,
      date: selectedDate ?? new Date(),
      ...(guestCount ? { guestCount: parseInt(guestCount, 10) } : {}),
    },
    {
      enabled: !!selectedDate,
    },
  );

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (isBeforeToday(date)) return;
    setSelectedDate(date);
  };

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Can't go before current month
  const canGoPrevious =
    currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage/[0.06]">
          <Calendar className="h-4 w-4 text-sage" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground">
          Check Availability
        </h3>
      </div>

      {/* Guest count input */}
      <div className="mb-4">
        <label
          htmlFor="guest-count"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Number of Guests
          {minGuests || maxGuests ? (
            <span className="ml-1 text-muted-foreground/50">
              ({minGuests ?? "?"}&ndash;{maxGuests ?? "500+"})
            </span>
          ) : null}
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
          <input
            id="guest-count"
            type="number"
            min={minGuests ?? 1}
            max={maxGuests ?? 9999}
            placeholder="e.g. 150"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/50 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-sage/30 focus:outline-none focus:ring-2 focus:ring-sage/10"
          />
        </div>
      </div>

      {/* Calendar header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sand hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sand hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-8" />;
          }

          const date = new Date(currentYear, currentMonth, day);
          const isPast = isBeforeToday(date);
          const isSelected = selectedDate !== null && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isPast}
              className={`flex h-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                isPast
                  ? "cursor-not-allowed text-muted-foreground/20"
                  : isSelected
                    ? "bg-sage text-white shadow-sm"
                    : isToday
                      ? "bg-sage/[0.08] font-bold text-sage ring-1 ring-sage/20"
                      : "text-foreground/70 hover:bg-sand hover:text-foreground"
              }`}
              aria-label={`${MONTH_NAMES[currentMonth]} ${day}, ${currentYear}${isToday ? " (today)" : ""}`}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Result */}
      {selectedDate && (
        <div className="mt-4">
          {availabilityQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-xl bg-sand/50 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking availability...
            </div>
          ) : availabilityQuery.isError ? (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/[0.06] p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Could not check availability. Please try again.
            </div>
          ) : availabilityQuery.data?.available ? (
            <div className="flex items-center gap-2 rounded-xl bg-sage/[0.06] p-3 text-sm text-sage">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                <strong>Available</strong> on{" "}
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/[0.06] p-3 text-sm text-destructive/80">
              <XCircle className="h-4 w-4" />
              <span>
                <strong>Not available</strong>
                {availabilityQuery.data?.reason && (
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {availabilityQuery.data.reason}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground/50">
        Select a date to check if {orgName} is available for your event.
      </p>
    </div>
  );
}
