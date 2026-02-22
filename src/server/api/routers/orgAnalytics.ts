/**
 * Diyafa — Organization Analytics Router
 *
 * Business intelligence for caterers:
 * - Revenue tracking (daily, monthly, by event type)
 * - Booking funnel (inquiry → confirmed → completed)
 * - Client acquisition sources
 * - Popular menus and packages
 * - Staff performance
 * - Equipment utilization
 * - Seasonal trends (Ramadan, wedding season)
 */
import { z } from "zod";
import {
  createTRPCRouter,
  orgProcedure,
} from "~/server/api/trpc";

export const orgAnalyticsRouter = createTRPCRouter({
  /** Revenue overview (current month vs previous) */
  getRevenueOverview: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [currentMonth, previousMonth, totalAllTime] = await Promise.all([
        ctx.db.events.aggregate({
          where: {
            orgId: ctx.orgId,
            status: { in: ["completed", "settled"] },
            eventDate: { gte: startOfMonth },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        ctx.db.events.aggregate({
          where: {
            orgId: ctx.orgId,
            status: { in: ["completed", "settled"] },
            eventDate: { gte: startOfPrevMonth, lt: startOfMonth },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        ctx.db.events.aggregate({
          where: {
            orgId: ctx.orgId,
            status: { in: ["completed", "settled"] },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
      ]);

      const currentRevenue = currentMonth._sum.totalAmount ?? 0;
      const previousRevenue = previousMonth._sum.totalAmount ?? 0;
      const revenueGrowth = previousRevenue > 0
        ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
        : 0;

      return {
        currentMonthRevenue: currentRevenue,
        currentMonthEvents: currentMonth._count.id,
        previousMonthRevenue: previousRevenue,
        previousMonthEvents: previousMonth._count.id,
        revenueGrowth,
        totalAllTimeRevenue: totalAllTime._sum.totalAmount ?? 0,
        totalAllTimeEvents: totalAllTime._count.id,
      };
    }),

  /** Booking funnel conversion rates */
  getBookingFunnel: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const dateFilter: Record<string, unknown> = {};
      if (input.dateFrom) dateFilter.gte = input.dateFrom;
      if (input.dateTo) dateFilter.lte = input.dateTo;

      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

      const [inquiries, quoted, accepted, confirmed, completed, cancelled] = await Promise.all([
        ctx.db.events.count({ where }),
        ctx.db.events.count({
          where: { ...where, status: { notIn: ["inquiry"] } },
        }),
        ctx.db.events.count({
          where: { ...where, status: { notIn: ["inquiry", "quote_sent", "quote_revised"] } },
        }),
        ctx.db.events.count({
          where: { ...where, status: { in: ["confirmed", "in_preparation", "in_execution", "completed", "settlement_pending", "settled"] } },
        }),
        ctx.db.events.count({
          where: { ...where, status: { in: ["completed", "settled"] } },
        }),
        ctx.db.events.count({
          where: { ...where, status: "cancelled" },
        }),
      ]);

      return {
        inquiries,
        quoted,
        accepted,
        confirmed,
        completed,
        cancelled,
        conversionRate: inquiries > 0 ? Math.round((completed / inquiries) * 100) : 0,
        quoteToBookRate: quoted > 0 ? Math.round((confirmed / quoted) * 100) : 0,
      };
    }),

  /** Revenue by event type */
  getRevenueByEventType: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        orgId: ctx.orgId,
        status: { in: ["completed", "settled"] },
      };

      if (input.dateFrom || input.dateTo) {
        where.eventDate = {
          ...(input.dateFrom ? { gte: input.dateFrom } : {}),
          ...(input.dateTo ? { lte: input.dateTo } : {}),
        };
      }

      const data = await ctx.db.events.groupBy({
        by: ["eventType"],
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { guestCount: true },
      });

      return data.map((d) => ({
        eventType: d.eventType,
        revenue: d._sum.totalAmount ?? 0,
        eventCount: d._count.id,
        avgGuestCount: Math.round(d._avg.guestCount ?? 0),
      }));
    }),

  /** Monthly revenue trend (last 12 months) */
  getMonthlyTrend: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const months: Array<{ month: string; revenue: number; events: number }> = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const data = await ctx.db.events.aggregate({
          where: {
            orgId: ctx.orgId,
            status: { in: ["completed", "settled"] },
            eventDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        });

        months.push({
          month: startOfMonth.toISOString().slice(0, 7),
          revenue: data._sum.totalAmount ?? 0,
          events: data._count.id,
        });
      }

      return months;
    }),

  /** Client acquisition sources */
  getClientSources: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const data = await ctx.db.events.groupBy({
        by: ["source"],
        where: { orgId: ctx.orgId },
        _count: { id: true },
        _sum: { totalAmount: true },
      });

      return data.map((d) => ({
        source: d.source,
        eventCount: d._count.id,
        revenue: d._sum.totalAmount ?? 0,
      }));
    }),

  /** Upcoming events pipeline */
  getUpcomingPipeline: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const now = new Date();

      const [thisWeek, thisMonth, next3Months] = await Promise.all([
        ctx.db.events.count({
          where: {
            orgId: ctx.orgId,
            status: { notIn: ["cancelled", "completed", "settled"] },
            eventDate: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        ctx.db.events.count({
          where: {
            orgId: ctx.orgId,
            status: { notIn: ["cancelled", "completed", "settled"] },
            eventDate: {
              gte: now,
              lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            },
          },
        }),
        ctx.db.events.count({
          where: {
            orgId: ctx.orgId,
            status: { notIn: ["cancelled", "completed", "settled"] },
            eventDate: {
              gte: now,
              lte: new Date(now.getFullYear(), now.getMonth() + 3, 0),
            },
          },
        }),
      ]);

      // Pending quotes (need response)
      const pendingQuotes = await ctx.db.quotes.count({
        where: { orgId: ctx.orgId, status: "draft" },
      });

      // Overdue payments
      const overduePayments = await ctx.db.paymentSchedules.count({
        where: {
          orgId: ctx.orgId,
          status: "pending",
          dueDate: { lt: now },
        },
      });

      return {
        thisWeek,
        thisMonth,
        next3Months,
        pendingQuotes,
        overduePayments,
      };
    }),

  /** Dashboard summary (top-level KPIs) */
  getDashboardSummary: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        monthRevenue,
        activeEvents,
        totalClients,
        avgRating,
        pendingInquiries,
        unreadMessages,
      ] = await Promise.all([
        ctx.db.events.aggregate({
          where: {
            orgId: ctx.orgId,
            status: { in: ["completed", "settled"] },
            eventDate: { gte: startOfMonth },
          },
          _sum: { totalAmount: true },
        }),
        ctx.db.events.count({
          where: {
            orgId: ctx.orgId,
            status: { notIn: ["cancelled", "completed", "settled", "inquiry"] },
          },
        }),
        ctx.db.clientProfiles.count({
          where: { orgId: ctx.orgId },
        }),
        ctx.db.reviews.aggregate({
          where: { orgId: ctx.orgId, isPublished: true },
          _avg: { ratingOverall: true },
        }),
        ctx.db.events.count({
          where: { orgId: ctx.orgId, status: "inquiry" },
        }),
        ctx.db.conversations.aggregate({
          where: { orgId: ctx.orgId, status: "active" },
          _sum: { unreadOrg: true },
        }),
      ]);

      return {
        monthRevenue: monthRevenue._sum.totalAmount ?? 0,
        activeEvents,
        totalClients,
        avgRating: Number(avgRating._avg.ratingOverall ?? 0),
        pendingInquiries,
        unreadMessages: unreadMessages._sum.unreadOrg ?? 0,
      };
    }),
});
