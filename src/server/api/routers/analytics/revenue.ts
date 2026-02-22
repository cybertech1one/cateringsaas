import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { logger } from "~/server/logger";
import {
  type LocationRow,
  getStartDate,
  periodEnum,
  verifyMenuOwnership,
} from "./_shared";

// ---------------------------------------------------------------------------
// Raw-query result types for revenue queries
// ---------------------------------------------------------------------------

interface RevenueOverviewRow {
  total_revenue: bigint;
  order_count: bigint;
  avg_order_value: number;
}

interface RevenueByDayRow {
  date: Date;
  revenue: bigint;
  order_count: bigint;
}

interface RevenueByOrderTypeRow {
  order_type: string | null;
  revenue: bigint;
  order_count: bigint;
}

interface TopSellingDishRow {
  dish_name: string;
  revenue: bigint;
  quantity: bigint;
}

interface PeakRevenueHourRow {
  hour: number;
  revenue: bigint;
  order_count: bigint;
}

// ---------------------------------------------------------------------------
// Valid order statuses for revenue calculations
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["completed", "confirmed", "preparing", "ready"];

export const revenueRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // getLocationComparison (private query)
  // -------------------------------------------------------------------------
  getLocationComparison: privateProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid(),
        period: periodEnum,
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify the user owns menus under this "restaurant" (profile)
      // In Diyafa, a user's profile id serves as the restaurant id.
      if (input.restaurantId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const startDate = getStartDate(input.period);

      // Get all menu IDs owned by this user
      const userMenus = await ctx.db.menus.findMany({
        where: { userId: ctx.user.id },
        select: { id: true, name: true },
      });

      if (userMenus.length === 0) {
        return [];
      }

      const menuIds = userMenus.map((m) => m.id);
      const menuNameMap = new Map(userMenus.map((m) => [m.id, m.name]));

      // Query analytics for all menus belonging to this user
      const dateCondition = startDate
        ? Prisma.sql`AND ae.created_at >= ${startDate}::timestamptz`
        : Prisma.empty;

      try {
        const rows = await ctx.db.$queryRaw<LocationRow[]>`
          SELECT
            ae.menu_id::text as location_id,
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE ae.event_type = 'menu_view') as views,
            COUNT(*) FILTER (WHERE ae.event_type = 'dish_click') as clicks,
            COUNT(*) FILTER (WHERE ae.event_type = 'order_placed') as orders
          FROM public.analytics_events ae
          WHERE ae.menu_id = ANY(${menuIds}::uuid[])
            ${dateCondition}
          GROUP BY ae.menu_id
          ORDER BY views DESC
        `;

        return rows.map((r) => {
          const viewCount = Number(r.views);
          const orderCount = Number(r.orders);

          return {
            menuId: r.location_id,
            menuName: menuNameMap.get(r.location_id ?? "") ?? "Unknown Menu",
            totalEvents: Number(r.total_events),
            views: viewCount,
            clicks: Number(r.clicks),
            orders: orderCount,
            conversionRate:
              viewCount > 0
                ? Math.round((orderCount / viewCount) * 10000) / 100
                : 0,
          };
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Analytics location comparison query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load location comparison data",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getRevenueOverview (private query)
  // -------------------------------------------------------------------------
  getRevenueOverview: privateProcedure
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
        // Current period totals
        const [current] = await ctx.db.$queryRaw<RevenueOverviewRow[]>`
          SELECT
            COALESCE(SUM(o.total_amount), 0) AS total_revenue,
            COUNT(*) AS order_count,
            COALESCE(AVG(o.total_amount), 0)::float8 AS avg_order_value
          FROM public.orders o
          WHERE o.menu_id = ${input.menuId}::uuid
            AND o.status = ANY(${VALID_STATUSES}::text[])
            ${dateCondition}
        `;

        // Previous period totals for comparison
        let revenueChange = 0;

        if (startDate) {
          const periodMs = Date.now() - startDate.getTime();
          const prevStartDate = new Date(startDate.getTime() - periodMs);

          const [previous] = await ctx.db.$queryRaw<RevenueOverviewRow[]>`
            SELECT
              COALESCE(SUM(o.total_amount), 0) AS total_revenue,
              COUNT(*) AS order_count,
              COALESCE(AVG(o.total_amount), 0)::float8 AS avg_order_value
            FROM public.orders o
            WHERE o.menu_id = ${input.menuId}::uuid
              AND o.status = ANY(${VALID_STATUSES}::text[])
              AND o.created_at >= ${prevStartDate}::timestamptz
              AND o.created_at < ${startDate}::timestamptz
          `;

          const prevRevenue = Number(previous?.total_revenue ?? 0);
          const currRevenue = Number(current?.total_revenue ?? 0);

          if (prevRevenue > 0) {
            revenueChange = Math.round(((currRevenue - prevRevenue) / prevRevenue) * 10000) / 100;
          } else if (currRevenue > 0) {
            revenueChange = 100;
          }
        }

        return {
          totalRevenue: Number(current?.total_revenue ?? 0),
          orderCount: Number(current?.order_count ?? 0),
          avgOrderValue: Math.round(Number(current?.avg_order_value ?? 0)),
          revenueChange,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Revenue overview query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load revenue overview",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getRevenueByDay (private query)
  // -------------------------------------------------------------------------
  getRevenueByDay: privateProcedure
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
        const rows = await ctx.db.$queryRaw<RevenueByDayRow[]>`
          SELECT
            DATE(o.created_at) AS date,
            COALESCE(SUM(o.total_amount), 0) AS revenue,
            COUNT(*) AS order_count
          FROM public.orders o
          WHERE o.menu_id = ${input.menuId}::uuid
            AND o.status = ANY(${VALID_STATUSES}::text[])
            ${dateCondition}
          GROUP BY DATE(o.created_at)
          ORDER BY date ASC
        `;

        return rows.map((r) => ({
          date: r.date instanceof Date ? r.date.toISOString().split("T")[0]! : String(r.date),
          revenue: Number(r.revenue),
          orderCount: Number(r.order_count),
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Revenue by day query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load revenue by day",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getRevenueByOrderType (private query)
  // -------------------------------------------------------------------------
  getRevenueByOrderType: privateProcedure
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
        const rows = await ctx.db.$queryRaw<RevenueByOrderTypeRow[]>`
          SELECT
            COALESCE(o.order_type::text, 'unknown') AS order_type,
            COALESCE(SUM(o.total_amount), 0) AS revenue,
            COUNT(*) AS order_count
          FROM public.orders o
          WHERE o.menu_id = ${input.menuId}::uuid
            AND o.status = ANY(${VALID_STATUSES}::text[])
            ${dateCondition}
          GROUP BY o.order_type
          ORDER BY revenue DESC
        `;

        const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue), 0);

        return rows.map((r) => ({
          orderType: r.order_type ?? "unknown",
          revenue: Number(r.revenue),
          orderCount: Number(r.order_count),
          percentage: totalRevenue > 0
            ? Math.round((Number(r.revenue) / totalRevenue) * 10000) / 100
            : 0,
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Revenue by order type query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load revenue by order type",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getTopSellingDishes (private query)
  // -------------------------------------------------------------------------
  getTopSellingDishes: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        period: periodEnum,
        limit: z.number().int().min(1).max(50).optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const startDate = getStartDate(input.period);
      const dateCondition = startDate
        ? Prisma.sql`AND o.created_at >= ${startDate}::timestamptz`
        : Prisma.empty;

      try {
        const rows = await ctx.db.$queryRaw<TopSellingDishRow[]>`
          SELECT
            oi.dish_name,
            COALESCE(SUM(oi.total_price), 0) AS revenue,
            COALESCE(SUM(oi.quantity), 0) AS quantity
          FROM public.order_items oi
          INNER JOIN public.orders o ON o.id = oi.order_id
          WHERE o.menu_id = ${input.menuId}::uuid
            AND o.status = ANY(${VALID_STATUSES}::text[])
            ${dateCondition}
          GROUP BY oi.dish_name
          ORDER BY revenue DESC
          LIMIT ${input.limit}
        `;

        const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue), 0);

        return rows.map((r) => ({
          dishName: r.dish_name,
          revenue: Number(r.revenue),
          quantity: Number(r.quantity),
          percentage: totalRevenue > 0
            ? Math.round((Number(r.revenue) / totalRevenue) * 10000) / 100
            : 0,
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Top selling dishes query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load top selling dishes",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getPeakRevenueHours (private query)
  // -------------------------------------------------------------------------
  getPeakRevenueHours: privateProcedure
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
        const rows = await ctx.db.$queryRaw<PeakRevenueHourRow[]>`
          SELECT
            EXTRACT(HOUR FROM o.created_at)::int AS hour,
            COALESCE(SUM(o.total_amount), 0) AS revenue,
            COUNT(*) AS order_count
          FROM public.orders o
          WHERE o.menu_id = ${input.menuId}::uuid
            AND o.status = ANY(${VALID_STATUSES}::text[])
            ${dateCondition}
          GROUP BY EXTRACT(HOUR FROM o.created_at)
          ORDER BY hour ASC
        `;

        return rows.map((r) => ({
          hour: r.hour,
          revenue: Number(r.revenue),
          orderCount: Number(r.order_count),
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Peak revenue hours query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load peak revenue hours",
        });
      }
    }),
});
