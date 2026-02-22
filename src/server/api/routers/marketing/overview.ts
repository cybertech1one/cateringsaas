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
  getStartDate,
  periodEnum,
} from "../analytics/_shared";

// ---------------------------------------------------------------------------
// Shared raw-query result types
// ---------------------------------------------------------------------------

interface PlatformRow {
  platform: string;
  count: bigint;
}

interface SharedDishRow {
  dish_name: string;
  count: bigint;
}

interface CustomerContactRow {
  customer_name: string | null;
  customer_phone: string;
  total_orders: bigint;
  total_spent: bigint;
  last_order: Date;
}

// ---------------------------------------------------------------------------
// Marketing overview router
// ---------------------------------------------------------------------------

export const marketingOverviewRouter = createTRPCRouter({
  /**
   * Get marketing overview stats for the authenticated user.
   * Aggregates data across all menus the user owns.
   */
  getMarketingOverview: privateProcedure
    .input(
      z.object({
        period: periodEnum.default("30d"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const startDate = getStartDate(input.period);

      try {
        // Get all menu IDs owned by this user
        const userMenus = await ctx.db.menus.findMany({
          where: { userId },
          select: { id: true },
        });

        if (userMenus.length === 0) {
          return {
            activePromotions: 0,
            totalCouponUses: 0,
            menuViews: 0,
            socialShares: 0,
          };
        }

        const menuIds = userMenus.map((m) => m.id);

        // Active promotions count (across all restaurants)
        const activePromotions = await ctx.db.promotions.count({
          where: {
            restaurant: { userId },
            isActive: true,
            startDate: { lte: new Date() },
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
        });

        // Total coupon uses is not directly tracked, so we use promotion count
        // as a proxy. In a real system, you would track redemptions separately.
        const totalPromotionViews = await ctx.db.promotions.aggregate({
          where: {
            restaurant: { userId },
          },
          _count: true,
        });

        // Menu views (from analytics events)
        const dateCondition = startDate
          ? Prisma.sql`AND ae.created_at >= ${startDate}::timestamptz`
          : Prisma.empty;

        const viewsResult = await ctx.db.$queryRaw<CountRow[]>(Prisma.sql`
          SELECT COUNT(*) as count
          FROM public.analytics_events ae
          WHERE ae.menu_id = ANY(${menuIds}::uuid[])
            AND ae.event_type = 'menu_view'
            ${dateCondition}
        `);
        const menuViews = Number(viewsResult[0]?.count ?? 0);

        // Social shares (from analytics events with type 'share_click')
        const sharesResult = await ctx.db.$queryRaw<CountRow[]>(Prisma.sql`
          SELECT COUNT(*) as count
          FROM public.analytics_events ae
          WHERE ae.menu_id = ANY(${menuIds}::uuid[])
            AND ae.event_type = 'share_click'
            ${dateCondition}
        `);
        const socialShares = Number(sharesResult[0]?.count ?? 0);

        return {
          activePromotions,
          totalCouponUses: totalPromotionViews._count,
          menuViews,
          socialShares,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Marketing overview query failed", error, "marketing");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load marketing overview data",
        });
      }
    }),

  /**
   * Get share analytics - breakdown by platform and over time.
   */
  getShareAnalytics: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid().optional(),
        period: periodEnum.default("30d"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const startDate = getStartDate(input.period);

      try {
        // If specific menu, verify ownership; otherwise get all user menus
        let menuIds: string[];

        if (input.menuId) {
          const menu = await ctx.db.menus.findFirst({
            where: { id: input.menuId, userId },
            select: { id: true },
          });

          if (!menu) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Menu not found or access denied",
            });
          }

          menuIds = [input.menuId];
        } else {
          const userMenus = await ctx.db.menus.findMany({
            where: { userId },
            select: { id: true },
          });

          menuIds = userMenus.map((m) => m.id);
        }

        if (menuIds.length === 0) {
          return {
            byPlatform: [],
            overTime: [],
            topSharedDishes: [],
          };
        }

        const dateCondition = startDate
          ? Prisma.sql`AND ae.created_at >= ${startDate}::timestamptz`
          : Prisma.empty;

        // Shares by platform
        const byPlatform = await ctx.db.$queryRaw<PlatformRow[]>(Prisma.sql`
          SELECT COALESCE(ae.event_data->>'platform', 'direct') as platform,
                 COUNT(*) as count
          FROM public.analytics_events ae
          WHERE ae.menu_id = ANY(${menuIds}::uuid[])
            AND ae.event_type = 'share_click'
            ${dateCondition}
          GROUP BY COALESCE(ae.event_data->>'platform', 'direct')
          ORDER BY count DESC
        `);

        // Shares over time (by day)
        const overTime = await ctx.db.$queryRaw<DateCountRow[]>(Prisma.sql`
          SELECT date_trunc('day', ae.created_at) as date,
                 COUNT(*) as count
          FROM public.analytics_events ae
          WHERE ae.menu_id = ANY(${menuIds}::uuid[])
            AND ae.event_type = 'share_click'
            ${dateCondition}
          GROUP BY date_trunc('day', ae.created_at)
          ORDER BY date ASC
        `);

        // Top shared dishes
        const topSharedDishes = await ctx.db.$queryRaw<SharedDishRow[]>(Prisma.sql`
          SELECT COALESCE(ae.event_data->>'dishName', ae.event_data->>'dish_name', 'Menu') as dish_name,
                 COUNT(*) as count
          FROM public.analytics_events ae
          WHERE ae.menu_id = ANY(${menuIds}::uuid[])
            AND ae.event_type = 'share_click'
            ${dateCondition}
          GROUP BY COALESCE(ae.event_data->>'dishName', ae.event_data->>'dish_name', 'Menu')
          ORDER BY count DESC
          LIMIT 10
        `);

        return {
          byPlatform: byPlatform.map((r) => ({
            platform: r.platform,
            count: Number(r.count),
          })),
          overTime: overTime.map((r) => ({
            date: r.date.toISOString().split("T")[0] ?? "",
            count: Number(r.count),
          })),
          topSharedDishes: topSharedDishes.map((r) => ({
            dishName: r.dish_name,
            count: Number(r.count),
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Share analytics query failed", error, "marketing");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load share analytics data",
        });
      }
    }),

  /**
   * Get email subscribers collected from public menu reviews.
   * These are customers who left their email when submitting reviews.
   */
  getSubscribers: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        // Build menu filter
        const menuFilter = input.menuId
          ? { id: input.menuId, userId }
          : { userId };

        const userMenus = await ctx.db.menus.findMany({
          where: menuFilter,
          select: { id: true },
        });

        const menuIds = userMenus.map((m) => m.id);

        if (menuIds.length === 0) {
          return { subscribers: [], total: 0 };
        }

        // Get unique emails from reviews
        const reviews = await ctx.db.reviews.findMany({
          where: {
            menuId: { in: menuIds },
            customerEmail: { not: null },
          },
          select: {
            customerEmail: true,
            customerName: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          distinct: ["customerEmail"],
        });

        const subscribers = reviews
          .filter((r) => r.customerEmail)
          .map((r) => ({
            email: r.customerEmail!,
            name: r.customerName ?? null,
            subscribedAt: r.createdAt.toISOString(),
          }));

        return {
          subscribers,
          total: subscribers.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Subscribers query failed", error, "marketing");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load subscribers data",
        });
      }
    }),

  /**
   * Aggregate customer contacts from orders.
   * Groups by phone number to build a customer directory.
   */
  getCustomerContacts: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid().optional(),
        minOrders: z.number().int().min(1).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        const menuFilter = input.menuId
          ? { id: input.menuId, userId }
          : { userId };

        const userMenus = await ctx.db.menus.findMany({
          where: menuFilter,
          select: { id: true },
        });

        const menuIds = userMenus.map((m) => m.id);

        if (menuIds.length === 0) {
          return { contacts: [], totalCount: 0 };
        }

        const searchCondition = input.search
          ? Prisma.sql`AND (
              o.customer_name ILIKE ${"%" + input.search + "%"}
              OR o.customer_phone ILIKE ${"%" + input.search + "%"}
            )`
          : Prisma.empty;

        const havingCondition = input.minOrders
          ? Prisma.sql`HAVING COUNT(*) >= ${input.minOrders}`
          : Prisma.empty;

        const contacts = await ctx.db.$queryRaw<CustomerContactRow[]>(
          Prisma.sql`
            SELECT
              o.customer_name,
              o.customer_phone,
              COUNT(*) as total_orders,
              SUM(o.total_amount) as total_spent,
              MAX(o.created_at) as last_order
            FROM public.orders o
            WHERE o.menu_id = ANY(${menuIds}::uuid[])
              AND o.status != 'cancelled'
              AND o.customer_phone IS NOT NULL
              AND o.customer_phone != ''
              ${searchCondition}
            GROUP BY o.customer_name, o.customer_phone
            ${havingCondition}
            ORDER BY last_order DESC
          `,
        );

        return {
          contacts: contacts.map((c) => ({
            name: c.customer_name,
            phone: c.customer_phone,
            totalOrders: Number(c.total_orders),
            totalSpent: Number(c.total_spent),
            lastOrder: c.last_order.toISOString(),
          })),
          totalCount: contacts.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          "Customer contacts query failed",
          error,
          "marketing",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load customer contacts",
        });
      }
    }),

  /**
   * Export customer contacts as a CSV string.
   */
  exportCustomerCSV: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        const menuFilter = input.menuId
          ? { id: input.menuId, userId }
          : { userId };

        const userMenus = await ctx.db.menus.findMany({
          where: menuFilter,
          select: { id: true },
        });

        const menuIds = userMenus.map((m) => m.id);

        if (menuIds.length === 0) {
          return {
            csv: "Name,Phone,Total Orders,Total Spent,Last Order\n",
            filename: `customer-contacts-${new Date().toISOString().split("T")[0]}.csv`,
          };
        }

        const contacts = await ctx.db.$queryRaw<CustomerContactRow[]>(
          Prisma.sql`
            SELECT
              o.customer_name,
              o.customer_phone,
              COUNT(*) as total_orders,
              SUM(o.total_amount) as total_spent,
              MAX(o.created_at) as last_order
            FROM public.orders o
            WHERE o.menu_id = ANY(${menuIds}::uuid[])
              AND o.status != 'cancelled'
              AND o.customer_phone IS NOT NULL
              AND o.customer_phone != ''
            GROUP BY o.customer_name, o.customer_phone
            ORDER BY last_order DESC
          `,
        );

        const headers = "Name,Phone,Total Orders,Total Spent,Last Order";
        const rows = contacts.map((c) => {
          const name = (c.customer_name ?? "Anonymous").replace(
            /"/g,
            '""',
          );
          const phone = c.customer_phone.replace(/"/g, '""');
          const spent = (Number(c.total_spent) / 100).toFixed(2);
          const lastOrder =
            c.last_order.toISOString().split("T")[0] ?? "";

          return `"${name}","${phone}",${Number(c.total_orders)},${spent},"${lastOrder}"`;
        });

        return {
          csv: [headers, ...rows].join("\n"),
          filename: `customer-contacts-${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          "Customer CSV export failed",
          error,
          "marketing",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export customer contacts",
        });
      }
    }),
});
