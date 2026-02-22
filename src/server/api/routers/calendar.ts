/**
 * Diyafa — Calendar & Availability Router
 *
 * Manage caterer availability and calendar:
 * - Block dates (vacations, holidays, maintenance)
 * - Check availability for event requests
 * - Calendar view with events and blocked dates
 * - Capacity management (max events per day)
 * - Public availability check for marketplace
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

export const calendarRouter = createTRPCRouter({
  /** Public: Check if a date is available for an org */
  checkPublicAvailability: publicProcedure
    .input(
      z.object({
        orgSlug: z.string(),
        date: z.date(),
        guestCount: z.number().int().positive().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.orgSlug, isActive: true },
        select: { id: true, minGuests: true, maxGuests: true },
      });

      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      // Check blocked dates
      const blocked = await ctx.db.blockedDates.findFirst({
        where: { orgId: org.id, date: input.date },
      });

      if (blocked) {
        return { available: false, reason: "Date is blocked" };
      }

      // Check guest count capacity
      if (input.guestCount && org.maxGuests && input.guestCount > org.maxGuests) {
        return { available: false, reason: `Maximum capacity is ${org.maxGuests} guests` };
      }

      if (input.guestCount && org.minGuests && input.guestCount < org.minGuests) {
        return { available: false, reason: `Minimum guests is ${org.minGuests}` };
      }

      // Check existing events on that date
      const existingEvents = await ctx.db.events.count({
        where: {
          orgId: org.id,
          eventDate: input.date,
          status: { notIn: ["cancelled", "inquiry"] },
        },
      });

      // Default max 3 events per day (configurable via settings)
      const maxEventsPerDay = 3;
      if (existingEvents >= maxEventsPerDay) {
        return { available: false, reason: "Fully booked for this date" };
      }

      return { available: true, existingEvents };
    }),

  /** Get calendar data for a month */
  getMonthCalendar: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      const [events, blockedDates] = await Promise.all([
        ctx.db.events.findMany({
          where: {
            orgId: ctx.orgId,
            eventDate: { gte: startDate, lte: endDate },
            status: { not: "cancelled" },
          },
          select: {
            id: true,
            title: true,
            eventType: true,
            eventDate: true,
            guestCount: true,
            status: true,
            customerName: true,
            venueName: true,
            totalAmount: true,
          },
          orderBy: { eventDate: "asc" },
        }),
        ctx.db.blockedDates.findMany({
          where: {
            orgId: ctx.orgId,
            date: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      return { events, blockedDates };
    }),

  /** Block a date */
  blockDate: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        date: z.date(),
        reason: z.string().max(200).optional(),
        isRecurring: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if date already blocked
      const existing = await ctx.db.blockedDates.findFirst({
        where: { orgId: ctx.orgId, date: input.date },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This date is already blocked",
        });
      }

      return ctx.db.blockedDates.create({
        data: {
          orgId: ctx.orgId,
          date: input.date,
          reason: input.reason,
          isRecurring: input.isRecurring,
        },
      });
    }),

  /** Unblock a date */
  unblockDate: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        blockedDateId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const blocked = await ctx.db.blockedDates.findFirst({
        where: { id: input.blockedDateId, orgId: ctx.orgId },
      });

      if (!blocked) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.blockedDates.delete({
        where: { id: input.blockedDateId },
      });
    }),

  /** Block multiple dates (e.g., vacation range) */
  blockDateRange: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dates: Date[] = [];
      const current = new Date(input.startDate);
      const end = new Date(input.endDate);

      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      if (dates.length > 90) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot block more than 90 days at once",
        });
      }

      // Filter out already blocked dates
      const existingBlocked = await ctx.db.blockedDates.findMany({
        where: {
          orgId: ctx.orgId,
          date: { in: dates },
        },
        select: { date: true },
      });

      const existingDates = new Set(
        existingBlocked.map((b) => b.date.toISOString().slice(0, 10))
      );

      const newDates = dates.filter(
        (d) => !existingDates.has(d.toISOString().slice(0, 10))
      );

      if (newDates.length > 0) {
        await ctx.db.blockedDates.createMany({
          data: newDates.map((date) => ({
            orgId: ctx.orgId,
            date,
            reason: input.reason,
          })),
        });
      }

      return { blockedCount: newDates.length, skippedCount: dates.length - newDates.length };
    }),

  /** Get all blocked dates */
  getBlockedDates: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        year: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };

      if (input.year) {
        where.date = {
          gte: new Date(input.year, 0, 1),
          lte: new Date(input.year, 11, 31),
        };
      }

      return ctx.db.blockedDates.findMany({
        where,
        orderBy: { date: "asc" },
      });
    }),

  /** Check availability for a date range (internal) */
  checkAvailability: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [events, blockedDates] = await Promise.all([
        ctx.db.events.findMany({
          where: {
            orgId: ctx.orgId,
            eventDate: { gte: input.startDate, lte: input.endDate },
            status: { notIn: ["cancelled"] },
          },
          select: { eventDate: true, status: true },
        }),
        ctx.db.blockedDates.findMany({
          where: {
            orgId: ctx.orgId,
            date: { gte: input.startDate, lte: input.endDate },
          },
          select: { date: true, reason: true },
        }),
      ]);

      // Build availability map
      const busyDates: Record<string, { eventCount: number; isBlocked: boolean; reason?: string }> = {};

      events.forEach((e) => {
        const key = e.eventDate.toISOString().slice(0, 10);
        if (!busyDates[key]) busyDates[key] = { eventCount: 0, isBlocked: false };
        const entry = busyDates[key]!;
        entry.eventCount++;
      });

      blockedDates.forEach((b) => {
        const key = b.date.toISOString().slice(0, 10);
        if (!busyDates[key]) busyDates[key] = { eventCount: 0, isBlocked: false };
        const entry = busyDates[key]!;
        entry.isBlocked = true;
        entry.reason = b.reason ?? undefined;
      });

      return busyDates;
    }),
});
