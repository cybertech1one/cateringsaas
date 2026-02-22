import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { logger } from "~/server/logger";
import {
  type CountRow,
  type DateCountRow,
  type DishRow,
  type FunnelRow,
  type HourRow,
  type ReferrerRow,
  dateFilter,
  getStartDate,
  periodEnum,
  verifyMenuOwnership,
} from "./_shared";

// ---------------------------------------------------------------------------
// Raw-query result types for Success KPIs
// ---------------------------------------------------------------------------

interface RevenueRow {
  total_revenue: bigint;
}

interface AvgRatingRow {
  avg_rating: number | null;
  total_reviews: bigint;
}

interface CompletionRateRow {
  total_orders: bigint;
  completed_orders: bigint;
}

interface RepeatCustomerRow {
  total_phones: bigint;
  repeat_phones: bigint;
}

interface HeatmapRow {
  day: number;
  hour: number;
  count: bigint;
}

interface OrderStatusRow {
  status: string;
  count: bigint;
}

interface AvgOrderValueRow {
  avg_value: number | null;
}

// ---------------------------------------------------------------------------
// Valid order statuses for KPI calculations
// ---------------------------------------------------------------------------

const KPI_VALID_STATUSES = ["completed", "confirmed", "preparing", "ready"];

export const overviewRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // getDashboard (private query)
  // -------------------------------------------------------------------------
  getDashboard: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        period: periodEnum,
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const startDate = getStartDate(input.period);
      const filter = dateFilter(startDate, input.menuId);

      try {
        // Total views
        const viewsResult = await ctx.db.$queryRaw<CountRow[]>`
          SELECT COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'menu_view'
        `;
        const totalViews = Number(viewsResult[0]?.count ?? 0);

        // Unique visitors (distinct sessionId)
        const visitorsResult = await ctx.db.$queryRaw<CountRow[]>`
          SELECT COUNT(DISTINCT session_id) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'menu_view'
        `;
        const uniqueVisitors = Number(visitorsResult[0]?.count ?? 0);

        // Total orders
        const ordersResult = await ctx.db.$queryRaw<CountRow[]>`
          SELECT COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'order_placed'
        `;
        const totalOrders = Number(ordersResult[0]?.count ?? 0);

        // Conversion rate (views -> orders)
        const conversionRate = totalViews > 0
          ? Math.round((totalOrders / totalViews) * 10000) / 100
          : 0;

        // Views by day
        const viewsByDay = await ctx.db.$queryRaw<DateCountRow[]>`
          SELECT date_trunc('day', created_at) as date, COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'menu_view'
          GROUP BY date_trunc('day', created_at)
          ORDER BY date ASC
        `;

        // Top dishes (clicks + orders)
        const topDishes = await ctx.db.$queryRaw<DishRow[]>`
          SELECT
            COALESCE(event_data->>'dishName', event_data->>'dish_name', 'Unknown') as dish_name,
            COUNT(*) FILTER (WHERE event_type = 'dish_click') as clicks,
            COUNT(*) FILTER (WHERE event_type = 'order_placed') as orders
          FROM public.analytics_events
          ${filter}
            AND event_type IN ('dish_click', 'order_placed')
          GROUP BY COALESCE(event_data->>'dishName', event_data->>'dish_name', 'Unknown')
          ORDER BY clicks DESC
          LIMIT 10
        `;

        // Top referrers
        const topReferrers = await ctx.db.$queryRaw<ReferrerRow[]>`
          SELECT COALESCE(referrer, 'Direct') as referrer, COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'menu_view'
          GROUP BY COALESCE(referrer, 'Direct')
          ORDER BY count DESC
          LIMIT 10
        `;

        // Device breakdown (classified at the database level via SQL CASE)
        interface DeviceBreakdownRow {
          device_type: string;
          count: bigint;
        }

        const deviceBreakdownRows = await ctx.db.$queryRaw<DeviceBreakdownRow[]>`
          SELECT
            CASE
              WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' OR user_agent ILIKE '%playbook%' OR user_agent ILIKE '%silk%' THEN 'tablet'
              WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipod%' OR user_agent ILIKE '%android%mobile%' OR user_agent ILIKE '%windows phone%' OR user_agent ILIKE '%blackberry%' THEN 'mobile'
              ELSE 'desktop'
            END AS device_type,
            COUNT(*) AS count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'menu_view'
          GROUP BY device_type
        `;

        const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 };

        for (const row of deviceBreakdownRows) {
          const dt = row.device_type as keyof typeof deviceBreakdown;

          if (dt in deviceBreakdown) {
            deviceBreakdown[dt] = Number(row.count);
          }
        }

        // Peak hours
        const peakHours = await ctx.db.$queryRaw<HourRow[]>`
          SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'menu_view'
          GROUP BY EXTRACT(HOUR FROM created_at)
          ORDER BY hour ASC
        `;

        return {
          totalViews,
          uniqueVisitors,
          totalOrders,
          conversionRate,
          viewsByDay: viewsByDay.map((r) => ({
            date: r.date.toISOString().split("T")[0],
            count: Number(r.count),
          })),
          topDishes: topDishes.map((r) => ({
            dishName: r.dish_name,
            clicks: Number(r.clicks),
            orders: Number(r.orders),
          })),
          topReferrers: topReferrers.map((r) => ({
            referrer: r.referrer,
            count: Number(r.count),
          })),
          deviceBreakdown,
          peakHours: peakHours.map((r) => ({
            hour: r.hour,
            count: Number(r.count),
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Analytics dashboard query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load analytics dashboard data",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getConversionFunnel (private query)
  // -------------------------------------------------------------------------
  getConversionFunnel: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        period: periodEnum,
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const startDate = getStartDate(input.period);
      const filter = dateFilter(startDate, input.menuId);

      try {
        // Funnel steps: menu_view -> dish_click -> order_placed
        const funnelRows = await ctx.db.$queryRaw<FunnelRow[]>`
          SELECT event_type, COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type IN ('menu_view', 'dish_click', 'order_placed')
          GROUP BY event_type
        `;

        const counts: Record<string, number> = {};

        for (const row of funnelRows) {
          counts[row.event_type] = Number(row.count);
        }

        const views = counts["menu_view"] ?? 0;
        const dishClicks = counts["dish_click"] ?? 0;
        const orders = counts["order_placed"] ?? 0;

        // Unique sessions per funnel step (more accurate funnel)
        interface UniqueStepRow {
          event_type: string;
          unique_sessions: bigint;
        }

        const uniqueSteps = await ctx.db.$queryRaw<UniqueStepRow[]>`
          SELECT event_type, COUNT(DISTINCT session_id) as unique_sessions
          FROM public.analytics_events
          ${filter}
            AND event_type IN ('menu_view', 'dish_click', 'order_placed')
          GROUP BY event_type
        `;

        const uniqueCounts: Record<string, number> = {};

        for (const row of uniqueSteps) {
          uniqueCounts[row.event_type] = Number(row.unique_sessions);
        }

        const uniqueViews = uniqueCounts["menu_view"] ?? 0;
        const uniqueClicks = uniqueCounts["dish_click"] ?? 0;
        const uniqueOrders = uniqueCounts["order_placed"] ?? 0;

        return {
          steps: [
            {
              name: "Menu Views",
              totalEvents: views,
              uniqueSessions: uniqueViews,
              dropOffPercent: 0,
            },
            {
              name: "Dish Clicks",
              totalEvents: dishClicks,
              uniqueSessions: uniqueClicks,
              dropOffPercent:
                uniqueViews > 0
                  ? Math.round((1 - uniqueClicks / uniqueViews) * 10000) / 100
                  : 0,
            },
            {
              name: "Orders Placed",
              totalEvents: orders,
              uniqueSessions: uniqueOrders,
              dropOffPercent:
                uniqueClicks > 0
                  ? Math.round((1 - uniqueOrders / uniqueClicks) * 10000) / 100
                  : 0,
            },
          ],
          overallConversionRate:
            uniqueViews > 0
              ? Math.round((uniqueOrders / uniqueViews) * 10000) / 100
              : 0,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Analytics conversion funnel query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load conversion funnel data",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getSuccessKPIs (private query)
  // -------------------------------------------------------------------------
  getSuccessKPIs: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        period: periodEnum,
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const startDate = getStartDate(input.period);
      const dateCondition = startDate
        ? Prisma.sql`AND o.created_at >= ${startDate}::timestamptz`
        : Prisma.empty;

      try {
        // --- Revenue: today, week, month ---
        const todayStart = new Date();

        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const prevMonthStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        // Batch 1: All revenue queries (independent of each other)
        const [
          [revenueToday],
          [revenueWeek],
          [revenueMonth],
          [revenuePrevMonth],
        ] = await Promise.all([
          ctx.db.$queryRaw<RevenueRow[]>`
            SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.status = ANY(${KPI_VALID_STATUSES}::text[])
              AND o.created_at >= ${todayStart}::timestamptz
          `,
          ctx.db.$queryRaw<RevenueRow[]>`
            SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.status = ANY(${KPI_VALID_STATUSES}::text[])
              AND o.created_at >= ${weekStart}::timestamptz
          `,
          ctx.db.$queryRaw<RevenueRow[]>`
            SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.status = ANY(${KPI_VALID_STATUSES}::text[])
              AND o.created_at >= ${monthStart}::timestamptz
          `,
          ctx.db.$queryRaw<RevenueRow[]>`
            SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.status = ANY(${KPI_VALID_STATUSES}::text[])
              AND o.created_at >= ${prevMonthStart}::timestamptz
              AND o.created_at < ${monthStart}::timestamptz
          `,
        ]);

        const currMonthRev = Number(revenueMonth?.total_revenue ?? 0);
        const prevMonthRev = Number(revenuePrevMonth?.total_revenue ?? 0);
        let trendPercent = 0;

        if (prevMonthRev > 0) {
          trendPercent = Math.round(((currMonthRev - prevMonthRev) / prevMonthRev) * 10000) / 100;
        } else if (currMonthRev > 0) {
          trendPercent = 100;
        }

        // Batch 2: Avg order value, rating, completion rate, repeat customers (all independent)
        const [
          [avgOrderRow],
          [ratingRow],
          [completionRow],
          [repeatRow],
        ] = await Promise.all([
          ctx.db.$queryRaw<AvgOrderValueRow[]>`
            SELECT COALESCE(AVG(o.total_amount), 0)::float8 AS avg_value
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.status = ANY(${KPI_VALID_STATUSES}::text[])
              ${dateCondition}
          `,
          ctx.db.$queryRaw<AvgRatingRow[]>`
            SELECT
              AVG(r.rating)::float8 AS avg_rating,
              COUNT(*) AS total_reviews
            FROM public.reviews r
            WHERE r.menu_id = ${input.menuId}::uuid
          `,
          ctx.db.$queryRaw<CompletionRateRow[]>`
            SELECT
              COUNT(*) FILTER (WHERE o.status != 'cancelled') AS total_orders,
              COUNT(*) FILTER (WHERE o.status = 'completed') AS completed_orders
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              ${dateCondition}
          `,
          ctx.db.$queryRaw<RepeatCustomerRow[]>`
            SELECT
              COUNT(DISTINCT o.customer_phone) AS total_phones,
              COUNT(DISTINCT o.customer_phone) FILTER (
                WHERE o.customer_phone IN (
                  SELECT o2.customer_phone
                  FROM public.orders o2
                  WHERE o2.menu_id = ${input.menuId}::uuid
                    AND o2.customer_phone IS NOT NULL
                  GROUP BY o2.customer_phone
                  HAVING COUNT(*) > 1
                )
              ) AS repeat_phones
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.customer_phone IS NOT NULL
          `,
        ]);

        const totalNonCancelled = Number(completionRow?.total_orders ?? 0);
        const completedCount = Number(completionRow?.completed_orders ?? 0);
        const completionRate = totalNonCancelled > 0
          ? Math.round((completedCount / totalNonCancelled) * 10000) / 100
          : 0;

        const totalPhones = Number(repeatRow?.total_phones ?? 0);
        const repeatPhones = Number(repeatRow?.repeat_phones ?? 0);
        const repeatCustomerRate = totalPhones > 0
          ? Math.round((repeatPhones / totalPhones) * 10000) / 100
          : 0;

        // Batch 3: Heatmap data and order status counts (independent)
        const [heatmapRows, statusRows] = await Promise.all([
          ctx.db.$queryRaw<HeatmapRow[]>`
            SELECT
              EXTRACT(DOW FROM o.created_at)::int AS day,
              EXTRACT(HOUR FROM o.created_at)::int AS hour,
              COUNT(*) AS count
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.status = ANY(${KPI_VALID_STATUSES}::text[])
              ${dateCondition}
            GROUP BY EXTRACT(DOW FROM o.created_at), EXTRACT(HOUR FROM o.created_at)
            ORDER BY day ASC, hour ASC
          `,
          ctx.db.$queryRaw<OrderStatusRow[]>`
            SELECT o.status, COUNT(*) AS count
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              ${dateCondition}
            GROUP BY o.status
            ORDER BY count DESC
          `,
        ]);

        return {
          revenue: {
            today: Number(revenueToday?.total_revenue ?? 0),
            week: Number(revenueWeek?.total_revenue ?? 0),
            month: currMonthRev,
            trendPercent,
          },
          avgOrderValue: Math.round(Number(avgOrderRow?.avg_value ?? 0)),
          avgRating: ratingRow?.avg_rating
            ? Math.round(ratingRow.avg_rating * 10) / 10
            : 0,
          totalReviews: Number(ratingRow?.total_reviews ?? 0),
          completionRate,
          repeatCustomerRate,
          peakHoursHeatmap: heatmapRows.map((r) => ({
            day: r.day,
            hour: r.hour,
            count: Number(r.count),
          })),
          ordersByStatus: statusRows.map((r) => ({
            status: r.status,
            count: Number(r.count),
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Success KPIs query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load success KPIs data",
        });
      }
    }),
});
