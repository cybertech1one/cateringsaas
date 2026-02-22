"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

// ── Types ─────────────────────────────────────────────────────

interface ScheduleItem {
  id: string;
  menuId: string;
  categoryId: string | null;
  name: string;
  scheduleType: string;
  startTime: string | null;
  endTime: string | null;
  days: string[];
  isRecurring: boolean;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    categoriesTranslation: Array<{ name: string; languageId: string }>;
  } | null;
}

interface ColorScheme {
  bg: string;
  border: string;
  text: string;
  hex: string;
}

interface WeeklyCalendarGridProps {
  schedules: ScheduleItem[];
  categoryColorMap: Map<string, ColorScheme>;
  getCategoryName: (categoryId: string | null) => string;
  onEdit: (schedule: ScheduleItem) => void;
}

// ── Constants ─────────────────────────────────────────────────

const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

// ── Helpers ───────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function getBlockPosition(
  startTime: string | null,
  endTime: string | null,
): { top: number; height: number } | null {
  if (!startTime || !endTime) return null;

  const gridStart = timeToMinutes("06:00");
  const gridEnd = timeToMinutes("23:59");
  const gridRange = gridEnd - gridStart;

  const start = Math.max(timeToMinutes(startTime), gridStart);
  const end = Math.min(timeToMinutes(endTime), gridEnd);

  if (end <= start) return null;

  const top = ((start - gridStart) / gridRange) * 100;
  const height = ((end - start) / gridRange) * 100;

  return { top, height: Math.max(height, 3) };
}

// ── Default color for schedules without a category ───────────

const DEFAULT_COLOR: ColorScheme = {
  bg: "bg-gray-100 dark:bg-gray-800/30",
  border: "border-gray-300 dark:border-gray-600",
  text: "text-gray-700 dark:text-gray-300",
  hex: "#6b7280",
};

// ── Component ─────────────────────────────────────────────────

export function WeeklyCalendarGrid({
  schedules,
  categoryColorMap,
  getCategoryName,
  onEdit,
}: WeeklyCalendarGridProps) {
  const { t } = useTranslation();

  const dayLabels: Record<string, string> = useMemo(
    () => ({
      monday: t("schedule.dayMon"),
      tuesday: t("schedule.dayTue"),
      wednesday: t("schedule.dayWed"),
      thursday: t("schedule.dayThu"),
      friday: t("schedule.dayFri"),
      saturday: t("schedule.daySat"),
      sunday: t("schedule.daySun"),
    }),
    [t],
  );

  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();

    for (const day of DAYS_ORDER) {
      map.set(day, []);
    }

    for (const schedule of schedules) {
      if (!schedule.isActive) continue;
      for (const day of schedule.days) {
        const existing = map.get(day) ?? [];

        existing.push(schedule);
        map.set(day, existing);
      }
    }

    return map;
  }, [schedules]);

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">
          {t("schedule.weeklyView")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex overflow-x-auto">
          {/* Time column */}
          <div className="flex w-16 flex-shrink-0 flex-col border-r border-border/30">
            <div className="h-10 border-b border-border/30" />
            <div className="relative" style={{ height: "540px" }}>
              {TIME_SLOTS.map((time, idx) => (
                <div
                  key={time}
                  className="absolute w-full border-t border-border/20 px-1 text-right"
                  style={{
                    top: `${(idx / TIME_SLOTS.length) * 100}%`,
                    height: `${100 / TIME_SLOTS.length}%`,
                  }}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {DAYS_ORDER.map((day) => {
            const daySchedules = schedulesByDay.get(day) ?? [];

            return (
              <div
                key={day}
                className="flex flex-1 flex-col border-r border-border/30 last:border-r-0"
                style={{ minWidth: "100px" }}
              >
                {/* Day header */}
                <div className="flex h-10 items-center justify-center border-b border-border/30 bg-muted/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {dayLabels[day]}
                  </span>
                </div>

                {/* Time grid */}
                <div className="relative" style={{ height: "540px" }}>
                  {/* Grid lines */}
                  {TIME_SLOTS.map((time, idx) => (
                    <div
                      key={time}
                      className="absolute w-full border-t border-border/10"
                      style={{
                        top: `${(idx / TIME_SLOTS.length) * 100}%`,
                      }}
                    />
                  ))}

                  {/* Schedule blocks */}
                  {daySchedules.map((schedule) => {
                    const pos = getBlockPosition(
                      schedule.startTime,
                      schedule.endTime,
                    );

                    if (!pos) return null;

                    const color = schedule.categoryId
                      ? categoryColorMap.get(schedule.categoryId) ??
                        DEFAULT_COLOR
                      : DEFAULT_COLOR;

                    return (
                      <button
                        key={schedule.id}
                        type="button"
                        className={`absolute left-0.5 right-0.5 cursor-pointer overflow-hidden rounded-md border px-1.5 py-0.5 text-left transition-opacity hover:opacity-80 ${color.bg} ${color.border}`}
                        style={{
                          top: `${pos.top}%`,
                          height: `${pos.height}%`,
                          minHeight: "20px",
                        }}
                        onClick={() => onEdit(schedule)}
                        title={`${schedule.name}\n${getCategoryName(schedule.categoryId)}\n${schedule.startTime ?? ""} - ${schedule.endTime ?? ""}`}
                      >
                        <div
                          className={`truncate text-[10px] font-semibold leading-tight ${color.text}`}
                        >
                          {schedule.name}
                        </div>
                        <div
                          className={`truncate text-[9px] leading-tight opacity-75 ${color.text}`}
                        >
                          {getCategoryName(schedule.categoryId)}
                        </div>
                        {schedule.startTime && (
                          <div
                            className={`truncate text-[9px] leading-tight opacity-60 ${color.text}`}
                          >
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
