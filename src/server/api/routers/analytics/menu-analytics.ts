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
  type Granularity,
  type GranularRow,
  dateFilter,
  getStartDate,
  granularityEnum,
  periodEnum,
  verifyMenuOwnership,
} from "./_shared";

export const menuAnalyticsRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // getMenuViewsOverTime (private query)
  // -------------------------------------------------------------------------
  getMenuViewsOverTime: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        period: periodEnum,
        granularity: granularityEnum,
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const startDate = getStartDate(input.period);
      const filter = dateFilter(startDate, input.menuId);

      // Map granularity to Postgres date_trunc intervals
      const granularityMap: Record<Granularity, string> = {
        hour: "hour",
        day: "day",
        week: "week",
        month: "month",
      };
      const truncInterval = granularityMap[input.granularity];

      try {
        const rows = await ctx.db.$queryRaw<GranularRow[]>`
          SELECT
            date_trunc(${truncInterval}, created_at) as bucket,
            COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'menu_view'
          GROUP BY date_trunc(${truncInterval}, created_at)
          ORDER BY bucket ASC
        `;

        return rows.map((r) => ({
          bucket: r.bucket.toISOString(),
          count: Number(r.count),
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Analytics views over time query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load menu views data",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getPopularDishes (private query)
  // -------------------------------------------------------------------------
  getPopularDishes: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        period: periodEnum,
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const startDate = getStartDate(input.period);
      const filter = dateFilter(startDate, input.menuId);

      try {
        const rows = await ctx.db.$queryRaw<DishRow[]>`
          SELECT
            COALESCE(event_data->>'dishName', event_data->>'dish_name', 'Unknown') as dish_name,
            COUNT(*) FILTER (WHERE event_type = 'dish_click') as clicks,
            COUNT(*) FILTER (WHERE event_type = 'order_placed') as orders
          FROM public.analytics_events
          ${filter}
            AND event_type IN ('dish_click', 'order_placed')
          GROUP BY COALESCE(event_data->>'dishName', event_data->>'dish_name', 'Unknown')
          ORDER BY clicks DESC
          LIMIT ${input.limit}
        `;

        return rows.map((r) => ({
          dishName: r.dish_name,
          clicks: Number(r.clicks),
          orders: Number(r.orders),
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Analytics popular dishes query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load popular dishes data",
        });
      }
    }),

  // -------------------------------------------------------------------------
  // getQRScanStats (private query)
  // -------------------------------------------------------------------------
  getQRScanStats: privateProcedure
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
        // Total scans
        const totalResult = await ctx.db.$queryRaw<CountRow[]>`
          SELECT COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'qr_scan'
        `;
        const totalScans = Number(totalResult[0]?.count ?? 0);

        // Unique scanners (by session)
        const uniqueResult = await ctx.db.$queryRaw<CountRow[]>`
          SELECT COUNT(DISTINCT session_id) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'qr_scan'
        `;
        const uniqueScanners = Number(uniqueResult[0]?.count ?? 0);

        // Scans by day
        const scansByDay = await ctx.db.$queryRaw<DateCountRow[]>`
          SELECT date_trunc('day', created_at) as date, COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'qr_scan'
          GROUP BY date_trunc('day', created_at)
          ORDER BY date ASC
        `;

        // Scans by location / table (from eventData)
        interface LocationScanRow {
          location: string;
          table_number: string;
          count: bigint;
        }

        const scansByLocation = await ctx.db.$queryRaw<LocationScanRow[]>`
          SELECT
            COALESCE(event_data->>'location', location_id::text, 'Unknown') as location,
            COALESCE(event_data->>'tableNumber', event_data->>'table_number', 'N/A') as table_number,
            COUNT(*) as count
          FROM public.analytics_events
          ${filter}
            AND event_type = 'qr_scan'
          GROUP BY
            COALESCE(event_data->>'location', location_id::text, 'Unknown'),
            COALESCE(event_data->>'tableNumber', event_data->>'table_number', 'N/A')
          ORDER BY count DESC
          LIMIT 50
        `;

        return {
          totalScans,
          uniqueScanners,
          scansByDay: scansByDay.map((r) => ({
            date: r.date.toISOString().split("T")[0],
            count: Number(r.count),
          })),
          scansByLocation: scansByLocation.map((r) => ({
            location: r.location,
            tableNumber: r.table_number,
            count: Number(r.count),
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Analytics QR scan stats query failed", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load QR scan statistics",
        });
      }
    }),
});
