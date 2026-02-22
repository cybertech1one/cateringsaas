"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";

import { type ScheduleFormData } from "./MenuSchedule.page";

const ALL_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const SCHEDULE_TYPES = [
  "breakfast",
  "brunch",
  "lunch",
  "afternoon",
  "dinner",
  "late_night",
  "all_day",
] as const;

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ScheduleFormData | null;
  menuId: string;
  categories: Array<{
    id: string;
    categoriesTranslation: Array<{ name: string; languageId: string }>;
  }>;
  onSave: (data: ScheduleFormData) => void;
  isSaving: boolean;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  menuId,
  categories,
  onSave,
  isSaving,
}: ScheduleFormDialogProps) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<string>("all_day");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<string[]>([...ALL_DAYS]);
  const [isRecurring, setIsRecurring] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Reset form when dialog opens / schedule changes
  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setCategoryId(schedule.categoryId);
      setScheduleType(schedule.scheduleType);
      setStartTime(schedule.startTime ?? "");
      setEndTime(schedule.endTime ?? "");
      setSelectedDays(schedule.days);
      setIsRecurring(schedule.isRecurring);
      setStartDate(schedule.startDate ?? "");
      setEndDate(schedule.endDate ?? "");
      setIsActive(schedule.isActive ?? true);
    } else {
      setName("");
      setCategoryId(null);
      setScheduleType("all_day");
      setStartTime("");
      setEndTime("");
      setSelectedDays([...ALL_DAYS]);
      setIsRecurring(true);
      setStartDate("");
      setEndDate("");
      setIsActive(true);
    }
  }, [schedule, open]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || selectedDays.length === 0) return;

    onSave({
      id: schedule?.id,
      menuId,
      categoryId,
      name: name.trim(),
      scheduleType,
      startTime: startTime || null,
      endTime: endTime || null,
      days: selectedDays,
      isRecurring,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
    });
  };

  const getDayLabel = (day: string) => {
    const dayMap: Record<string, string> = {
      monday: t("schedule.dayMon"),
      tuesday: t("schedule.dayTue"),
      wednesday: t("schedule.dayWed"),
      thursday: t("schedule.dayThu"),
      friday: t("schedule.dayFri"),
      saturday: t("schedule.daySat"),
      sunday: t("schedule.daySun"),
    };

    return dayMap[day] ?? day;
  };

  const getScheduleTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      breakfast: t("schedule.typeBreakfast"),
      brunch: t("schedule.typeBrunch"),
      lunch: t("schedule.typeLunch"),
      afternoon: t("schedule.typeAfternoon"),
      dinner: t("schedule.typeDinner"),
      late_night: t("schedule.typeLateNight"),
      all_day: t("schedule.typeAllDay"),
    };

    return typeMap[type] ?? type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {schedule ? t("schedule.editSchedule") : t("schedule.createSchedule")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Schedule Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="schedule-name">{t("schedule.nameLabel")}</Label>
            <Input
              id="schedule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("schedule.namePlaceholder")}
              required
            />
          </div>

          {/* Category Selection */}
          <div className="flex flex-col gap-2">
            <Label>{t("schedule.categoryLabel")}</Label>
            <Select
              value={categoryId ?? "__all__"}
              onValueChange={(v) =>
                setCategoryId(v === "__all__" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("schedule.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">
                  {t("schedule.allCategories")}
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.categoriesTranslation[0]?.name ?? cat.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Type */}
          <div className="flex flex-col gap-2">
            <Label>{t("schedule.scheduleTypeLabel")}</Label>
            <Select value={scheduleType} onValueChange={setScheduleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getScheduleTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start-time">{t("schedule.startTime")}</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end-time">{t("schedule.endTime")}</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Days of Week */}
          <div className="flex flex-col gap-2">
            <Label>{t("schedule.daysOfWeek")}</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => (
                <Badge
                  key={day}
                  variant={selectedDays.includes(day) ? "default" : "outline"}
                  className="cursor-pointer select-none px-3 py-1.5 text-sm transition-colors"
                  onClick={() => toggleDay(day)}
                >
                  {getDayLabel(day)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="recurring-toggle">
                {t("schedule.recurringLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("schedule.recurringHint")}
              </p>
            </div>
            <Switch
              id="recurring-toggle"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Date Range (visible only for non-recurring) */}
          {!isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start-date">{t("schedule.startDate")}</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end-date">{t("schedule.endDate")}</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active-toggle">{t("schedule.activeLabel")}</Label>
            <Switch
              id="active-toggle"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("schedule.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !name.trim() || selectedDays.length === 0}
              loading={isSaving}
            >
              {t("schedule.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
