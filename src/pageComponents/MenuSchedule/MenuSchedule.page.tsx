"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Clock, Plus, Trash2, Edit2, CalendarDays } from "lucide-react";

import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { LoadingScreen } from "~/components/Loading";

import { ScheduleFormDialog } from "./ScheduleFormDialog";
import { WeeklyCalendarGrid } from "./WeeklyCalendarGrid";

// ── Color palette for category schedule blocks ────────────────

const BLOCK_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-300 dark:border-blue-700", text: "text-blue-800 dark:text-blue-200", hex: "#3b82f6" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-800 dark:text-emerald-200", hex: "#10b981" },
  { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-300 dark:border-amber-700", text: "text-amber-800 dark:text-amber-200", hex: "#f59e0b" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-300 dark:border-purple-700", text: "text-purple-800 dark:text-purple-200", hex: "#8b5cf6" },
  { bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-300 dark:border-rose-700", text: "text-rose-800 dark:text-rose-200", hex: "#f43f5e" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/30", border: "border-cyan-300 dark:border-cyan-700", text: "text-cyan-800 dark:text-cyan-200", hex: "#06b6d4" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-300 dark:border-orange-700", text: "text-orange-800 dark:text-orange-200", hex: "#f97316" },
  { bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-300 dark:border-indigo-700", text: "text-indigo-800 dark:text-indigo-200", hex: "#6366f1" },
];

export type ScheduleFormData = {
  id?: string;
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
};

export const MenuSchedulePage = () => {
  const { slug } = useParams() as { slug: string };
  const { t } = useTranslation();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleFormData | null>(null);

  // ── Fetch menu data ────────────────────────────────────────
  const { data: menu, isLoading: menuLoading } =
    api.menus.getMenuBySlug.useQuery({ slug }, { enabled: !!slug });

  // ── Fetch schedules ────────────────────────────────────────
  const {
    data: schedules,
    isLoading: schedulesLoading,
    refetch: refetchSchedules,
  } = api.menus.getSchedules.useQuery(
    { menuId: menu?.id ?? "" },
    { enabled: !!menu?.id },
  );

  // ── Fetch categories ───────────────────────────────────────
  const { data: categories } = api.menus.getCategoriesBySlug.useQuery(
    { menuSlug: slug },
    { enabled: !!slug },
  );

  // ── Mutations ──────────────────────────────────────────────
  const upsertMutation = api.menus.upsertSchedule.useMutation({
    onSuccess: () => {
      void refetchSchedules();
      setDialogOpen(false);
      setEditingSchedule(null);
      toast({
        title: t("schedule.saved"),
        description: t("schedule.savedDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.menus.deleteSchedule.useMutation({
    onSuccess: () => {
      void refetchSchedules();
      toast({
        title: t("schedule.deleted"),
        description: t("schedule.deletedDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  // ── Color mapping by category ──────────────────────────────
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, (typeof BLOCK_COLORS)[number]>();

    if (!categories) return map;
    categories.forEach((cat, idx) => {
      map.set(cat.id, BLOCK_COLORS[idx % BLOCK_COLORS.length]!);
    });

    return map;
  }, [categories]);

  // ── Handlers ───────────────────────────────────────────────
  const handleCreate = useCallback(() => {
    setEditingSchedule(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback(
    (schedule: {
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
    }) => {
      setEditingSchedule({
        id: schedule.id,
        menuId: schedule.menuId,
        categoryId: schedule.categoryId,
        name: schedule.name,
        scheduleType: schedule.scheduleType,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        days: schedule.days,
        isRecurring: schedule.isRecurring,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        isActive: schedule.isActive,
      });
      setDialogOpen(true);
    },
    [],
  );

  const handleDelete = useCallback(
    (scheduleId: string) => {
      if (!menu?.id) return;
      deleteMutation.mutate({ scheduleId, menuId: menu.id });
    },
    [deleteMutation, menu?.id],
  );

  const handleSave = useCallback(
    (formData: ScheduleFormData) => {
      upsertMutation.mutate({
        id: formData.id,
        menuId: formData.menuId,
        categoryId: formData.categoryId,
        name: formData.name,
        scheduleType: formData.scheduleType as
          | "breakfast"
          | "brunch"
          | "lunch"
          | "afternoon"
          | "dinner"
          | "late_night"
          | "all_day",
        startTime: formData.startTime,
        endTime: formData.endTime,
        days: formData.days as Array<
          | "monday"
          | "tuesday"
          | "wednesday"
          | "thursday"
          | "friday"
          | "saturday"
          | "sunday"
        >,
        isRecurring: formData.isRecurring,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive ?? true,
      });
    },
    [upsertMutation],
  );

  // ── Get category name helper ───────────────────────────────
  const getCategoryName = useCallback(
    (categoryId: string | null) => {
      if (!categoryId || !categories) return t("schedule.allCategories");
      const cat = categories.find((c) => c.id === categoryId);

      if (!cat) return t("schedule.unknownCategory");

      return (
        cat.categoriesTranslation[0]?.name ?? t("schedule.unknownCategory")
      );
    },
    [categories, t],
  );

  // ── Day label helper ───────────────────────────────────────
  const getDayLabel = useCallback(
    (day: string) => {
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
    },
    [t],
  );

  if (menuLoading || schedulesLoading) {
    return <LoadingScreen />;
  }

  if (!menu) return null;

  return (
    <div className="my-12 flex w-full max-w-5xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {t("schedule.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("schedule.description")}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("schedule.createSchedule")}
        </Button>
      </div>

      {/* Weekly Calendar Grid - desktop only */}
      <div className="hidden md:block">
        <WeeklyCalendarGrid
          schedules={schedules ?? []}
          categoryColorMap={categoryColorMap}
          getCategoryName={getCategoryName}
          onEdit={handleEdit}
        />
      </div>

      {/* Schedule List (always visible on mobile, below grid on desktop) */}
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {t("schedule.scheduleList")}
        </h2>

        {(!schedules || schedules.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="font-display text-lg font-semibold">
                {t("schedule.noSchedules")}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {t("schedule.noSchedulesDescription")}
              </p>
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                {t("schedule.createSchedule")}
              </Button>
            </CardContent>
          </Card>
        )}

        {schedules?.map((schedule) => {
          const color = schedule.categoryId
            ? categoryColorMap.get(schedule.categoryId)
            : BLOCK_COLORS[0];

          return (
            <Card
              key={schedule.id}
              className={`border ${color?.border ?? "border-border/50"} ${color?.bg ?? ""}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Clock className={`h-5 w-5 ${color?.text ?? "text-muted-foreground"}`} />
                  <CardTitle className={`text-base font-semibold ${color?.text ?? ""}`}>
                    {schedule.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={schedule.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {schedule.isActive
                      ? t("schedule.active")
                      : t("schedule.inactive")}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {schedule.isRecurring
                      ? t("schedule.recurring")
                      : t("schedule.oneTime")}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(schedule)}
                    aria-label={t("schedule.editSchedule")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                    aria-label={t("schedule.deleteSchedule")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {t("schedule.category")}:{" "}
                    <strong>{getCategoryName(schedule.categoryId)}</strong>
                  </span>
                  {schedule.startTime && schedule.endTime && (
                    <span className="text-muted-foreground">
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {schedule.days.map((day) => (
                      <Badge
                        key={day}
                        variant="outline"
                        className="px-1.5 py-0 text-xs"
                      >
                        {getDayLabel(day as string)}
                      </Badge>
                    ))}
                  </div>
                  {!schedule.isRecurring && schedule.startDate && (
                    <span className="text-xs text-muted-foreground">
                      {schedule.startDate}
                      {schedule.endDate ? ` - ${schedule.endDate}` : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schedule Form Dialog */}
      <ScheduleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={editingSchedule}
        menuId={menu.id}
        categories={categories ?? []}
        onSave={handleSave}
        isSaving={upsertMutation.isLoading}
      />
    </div>
  );
};
