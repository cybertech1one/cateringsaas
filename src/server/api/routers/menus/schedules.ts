import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

// ── Zod Schemas ───────────────────────────────────────────────

const dayOfWeekEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const scheduleTypeEnum = z.enum([
  "breakfast",
  "brunch",
  "lunch",
  "afternoon",
  "dinner",
  "late_night",
  "all_day",
]);

const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format");

const upsertScheduleInput = z.object({
  id: z.string().uuid().optional(),
  menuId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  name: z.string().min(1).max(200),
  scheduleType: scheduleTypeEnum,
  startTime: timeStringSchema.nullable(),
  endTime: timeStringSchema.nullable(),
  days: z.array(dayOfWeekEnum).min(1),
  isRecurring: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isActive: z.boolean().optional().default(true),
});

// ── Helper: Parse HH:mm string into a Date for Time column ────

function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(1970, 0, 1, hours, minutes, 0, 0);

  return date;
}

// ── Helper: Format a Date from Time column to HH:mm string ────

function formatTimeToString(date: Date | null): string | null {
  if (!date) return null;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

// ── Helper: Check if a schedule is currently active ──────────

function isScheduleActiveNow(schedule: {
  isActive: boolean | null;
  isRecurring: boolean;
  days: string[];
  startTime: Date | null;
  endTime: Date | null;
  startDate: Date | null;
  endDate: Date | null;
}): boolean {
  if (!schedule.isActive) return false;

  const now = new Date();

  // Check date range for non-recurring schedules
  if (!schedule.isRecurring) {
    if (schedule.startDate) {
      const startDate = new Date(schedule.startDate);

      startDate.setHours(0, 0, 0, 0);
      const today = new Date(now);

      today.setHours(0, 0, 0, 0);
      if (today < startDate) return false;
    }

    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);

      endDate.setHours(23, 59, 59, 999);
      if (now > endDate) return false;
    }
  }

  // Check day of week
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = dayNames[now.getDay()];

  if (schedule.days.length > 0 && !schedule.days.includes(currentDay!)) {
    return false;
  }

  // Check time range
  if (schedule.startTime && schedule.endTime) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes =
      schedule.startTime.getHours() * 60 + schedule.startTime.getMinutes();
    const endMinutes =
      schedule.endTime.getHours() * 60 + schedule.endTime.getMinutes();

    // Handle overnight schedules (e.g., 22:00 - 02:00)
    if (endMinutes < startMinutes) {
      if (currentMinutes < startMinutes && currentMinutes >= endMinutes) {
        return false;
      }
    } else {
      if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
        return false;
      }
    }
  }

  return true;
}

// ── Router ────────────────────────────────────────────────────

export const schedulesRouter = createTRPCRouter({
  /**
   * List all schedules for a menu.
   */
  getSchedules: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      const schedules = await ctx.db.menuSchedules.findMany({
        where: { menuId: input.menuId },
        include: {
          category: {
            select: {
              id: true,
              categoriesTranslation: {
                select: {
                  name: true,
                  languageId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return schedules.map((s) => ({
        id: s.id,
        menuId: s.menuId,
        categoryId: s.categoryId,
        category: s.category,
        name: s.name,
        scheduleType: s.scheduleType,
        startTime: formatTimeToString(s.startTime),
        endTime: formatTimeToString(s.endTime),
        days: s.days,
        isRecurring: s.isRecurring,
        startDate: s.startDate?.toISOString().split("T")[0] ?? null,
        endDate: s.endDate?.toISOString().split("T")[0] ?? null,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    }),

  /**
   * Create or update a schedule.
   */
  upsertSchedule: privateProcedure
    .input(upsertScheduleInput)
    .mutation(async ({ ctx, input }) => {
      // Verify menu ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      // If categoryId provided, verify it belongs to this menu
      if (input.categoryId) {
        const category = await ctx.db.categories.findFirst({
          where: { id: input.categoryId, menuId: input.menuId },
          select: { id: true },
        });

        if (!category) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Category does not belong to this menu",
          });
        }
      }

      const data = {
        menuId: input.menuId,
        categoryId: input.categoryId,
        name: input.name,
        scheduleType: input.scheduleType,
        startTime: input.startTime ? parseTimeToDate(input.startTime) : null,
        endTime: input.endTime ? parseTimeToDate(input.endTime) : null,
        days: input.days,
        isRecurring: input.isRecurring,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        isActive: input.isActive,
        updatedAt: new Date(),
      };

      if (input.id) {
        // Update existing
        const existing = await ctx.db.menuSchedules.findFirst({
          where: { id: input.id, menuId: input.menuId },
          select: { id: true },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schedule not found",
          });
        }

        return ctx.db.menuSchedules.update({
          where: { id: input.id },
          data,
        });
      }

      // Create new
      return ctx.db.menuSchedules.create({
        data: {
          ...data,
          createdAt: new Date(),
        },
      });
    }),

  /**
   * Delete a schedule.
   */
  deleteSchedule: privateProcedure
    .input(
      z.object({
        scheduleId: z.string().uuid(),
        menuId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify menu ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      const schedule = await ctx.db.menuSchedules.findFirst({
        where: { id: input.scheduleId, menuId: input.menuId },
        select: { id: true },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      await ctx.db.menuSchedules.delete({
        where: { id: input.scheduleId },
      });

      return { success: true };
    }),

  /**
   * Public endpoint: get all active schedules for a menu slug.
   * Returns which category IDs are currently visible, along with
   * schedule time info for badges.
   */
  getActiveSchedules: publicProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { slug: input.slug, isPublished: true },
        select: { id: true },
      });

      if (!menu) {
        return { hiddenCategoryIds: [], scheduledCategories: [] };
      }

      const schedules = await ctx.db.menuSchedules.findMany({
        where: { menuId: menu.id, isActive: true, categoryId: { not: null } },
        select: {
          id: true,
          categoryId: true,
          name: true,
          scheduleType: true,
          startTime: true,
          endTime: true,
          days: true,
          isRecurring: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      });

      // Group schedules by category
      const categoryScheduleMap = new Map<
        string,
        typeof schedules
      >();

      for (const schedule of schedules) {
        if (!schedule.categoryId) continue;
        const existing = categoryScheduleMap.get(schedule.categoryId) ?? [];

        existing.push(schedule);
        categoryScheduleMap.set(schedule.categoryId, existing);
      }

      // For each category with schedules, check if ANY schedule is active now
      const hiddenCategoryIds: string[] = [];
      const scheduledCategories: Array<{
        categoryId: string;
        isCurrentlyVisible: boolean;
        startTime: string | null;
        endTime: string | null;
        name: string;
      }> = [];

      for (const [categoryId, catSchedules] of categoryScheduleMap) {
        const anyActive = catSchedules.some((s) => isScheduleActiveNow(s));

        if (!anyActive) {
          hiddenCategoryIds.push(categoryId);
        }

        // Return the first schedule info for badge display
        const primary = catSchedules[0]!;

        scheduledCategories.push({
          categoryId,
          isCurrentlyVisible: anyActive,
          startTime: formatTimeToString(primary.startTime),
          endTime: formatTimeToString(primary.endTime),
          name: primary.name,
        });
      }

      return { hiddenCategoryIds, scheduledCategories };
    }),
});
