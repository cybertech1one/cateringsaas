import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

const ORDER_STATUS_ENUM = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

export const kitchenRouter = createTRPCRouter({
  /**
   * Get all orders for a menu in the last 24 hours, grouped by status.
   * Used by the Kitchen Display System (KDS).
   */
  getKitchenOrders: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify menu ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true, currency: true, name: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view kitchen orders for this menu",
        });
      }

      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      );

      const baseWhere = {
        menuId: input.menuId,
        createdAt: { gte: twentyFourHoursAgo },
      };

      const includeOrderItems = {
        orderItems: {
          include: {
            dishes: { select: { pictureUrl: true, kitchenStationId: true } },
          },
        },
      } as const;

      // Run 6 parallel queries, one per status, to avoid loading all orders
      // into memory and filtering 6 times (N+1 elimination).
      const [
        pendingRows,
        confirmedRows,
        preparingRows,
        readyRows,
        completedRows,
        cancelledRows,
      ] = await Promise.all([
        ctx.db.orders.findMany({
          where: { ...baseWhere, status: "pending" },
          include: includeOrderItems,
          orderBy: { createdAt: "asc" },
        }),
        ctx.db.orders.findMany({
          where: { ...baseWhere, status: "confirmed" },
          include: includeOrderItems,
          orderBy: { createdAt: "asc" },
        }),
        ctx.db.orders.findMany({
          where: { ...baseWhere, status: "preparing" },
          include: includeOrderItems,
          orderBy: { createdAt: "asc" },
        }),
        ctx.db.orders.findMany({
          where: { ...baseWhere, status: "ready" },
          include: includeOrderItems,
          orderBy: { createdAt: "asc" },
        }),
        ctx.db.orders.findMany({
          where: { ...baseWhere, status: "completed" },
          include: includeOrderItems,
          orderBy: { createdAt: "asc" },
        }),
        ctx.db.orders.findMany({
          where: { ...baseWhere, status: "cancelled" },
          include: includeOrderItems,
          orderBy: { createdAt: "asc" },
        }),
      ]);

      return {
        orders: {
          pending: pendingRows.filter((o) => o.status === "pending"),
          confirmed: confirmedRows.filter((o) => o.status === "confirmed"),
          preparing: preparingRows.filter((o) => o.status === "preparing"),
          ready: readyRows.filter((o) => o.status === "ready"),
          completed: completedRows
            .filter((o) => o.status === "completed")
            .slice(-10), // Only last 10 completed
          cancelled: cancelledRows.filter((o) => o.status === "cancelled"),
        },
        currency: menu.currency,
        menuName: menu.name,
      };
    }),

  /**
   * Update an order's status from the kitchen display.
   * Validates menu ownership via the order's menu.
   */
  updateOrderStatus: privateProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        status: ORDER_STATUS_ENUM,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.orders.findUnique({
        where: { id: input.orderId },
        include: { menus: { select: { userId: true } } },
      });

      if (!order || order.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this order",
        });
      }

      return ctx.db.orders.update({
        where: { id: input.orderId },
        data: {
          status: input.status,
          updatedAt: new Date(),
          ...(input.status === "completed"
            ? { completedAt: new Date() }
            : {}),
        },
      });
    }),

  /**
   * Quick order count by status for a menu (last 24 hours).
   * Used for column headers in the kitchen display.
   */
  getOrderCounts: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      );

      const [pending, confirmed, preparing, ready, completed] =
        await Promise.all([
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "pending",
              createdAt: { gte: twentyFourHoursAgo },
            },
          }),
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "confirmed",
              createdAt: { gte: twentyFourHoursAgo },
            },
          }),
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "preparing",
              createdAt: { gte: twentyFourHoursAgo },
            },
          }),
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "ready",
              createdAt: { gte: twentyFourHoursAgo },
            },
          }),
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "completed",
              createdAt: { gte: twentyFourHoursAgo },
            },
          }),
        ]);

      return {
        pending: pending + confirmed, // "New Orders" column combines pending+confirmed
        preparing,
        ready,
        completed,
      };
    }),

  // =========================================================================
  // Kitchen Stations CRUD
  // =========================================================================

  /**
   * List all stations for a menu, with the count of dishes assigned to each.
   */
  getStations: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view stations for this menu",
        });
      }

      const stations = await ctx.db.kitchenStations.findMany({
        where: { menuId: input.menuId },
        include: {
          _count: {
            select: { dishes: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      return stations.map((s) => ({
        id: s.id,
        menuId: s.menuId,
        name: s.name,
        color: s.color,
        sortOrder: s.sortOrder,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        dishCount: s._count.dishes,
      }));
    }),

  /**
   * Create a new kitchen station for a menu.
   */
  createStation: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B82F6"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to create stations for this menu",
        });
      }

      // Determine next sort order
      const maxStation = await ctx.db.kitchenStations.findFirst({
        where: { menuId: input.menuId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      const nextSortOrder = (maxStation?.sortOrder ?? -1) + 1;

      return ctx.db.kitchenStations.create({
        data: {
          menuId: input.menuId,
          name: input.name,
          color: input.color,
          sortOrder: nextSortOrder,
        },
      });
    }),

  /**
   * Update an existing kitchen station.
   */
  updateStation: privateProcedure
    .input(
      z.object({
        stationId: z.string().uuid(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const station = await ctx.db.kitchenStations.findUnique({
        where: { id: input.stationId },
        include: { menus: { select: { userId: true } } },
      });

      if (!station || station.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this station",
        });
      }

      return ctx.db.kitchenStations.update({
        where: { id: input.stationId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          updatedAt: new Date(),
        },
      });
    }),

  /**
   * Delete a kitchen station. Dishes assigned to it become unassigned.
   */
  deleteStation: privateProcedure
    .input(
      z.object({
        stationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const station = await ctx.db.kitchenStations.findUnique({
        where: { id: input.stationId },
        include: { menus: { select: { userId: true } } },
      });

      if (!station || station.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this station",
        });
      }

      // Dishes will be unassigned via ON DELETE SET NULL in the DB,
      // but we also handle it explicitly for clarity
      await ctx.db.dishes.updateMany({
        where: { kitchenStationId: input.stationId },
        data: { kitchenStationId: null },
      });

      return ctx.db.kitchenStations.delete({
        where: { id: input.stationId },
      });
    }),

  /**
   * Assign or unassign a dish to a kitchen station.
   * Pass stationId = null to unassign.
   */
  assignDishToStation: privateProcedure
    .input(
      z.object({
        dishId: z.string().uuid(),
        stationId: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dish = await ctx.db.dishes.findUnique({
        where: { id: input.dishId },
        include: { menus: { select: { userId: true } } },
      });

      if (!dish || dish.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this dish",
        });
      }

      // If assigning to a station, verify it belongs to the same menu
      if (input.stationId) {
        const station = await ctx.db.kitchenStations.findFirst({
          where: {
            id: input.stationId,
            menuId: dish.menuId,
          },
        });

        if (!station) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Station not found or does not belong to this menu",
          });
        }
      }

      return ctx.db.dishes.update({
        where: { id: input.dishId },
        data: { kitchenStationId: input.stationId },
      });
    }),

  /**
   * Get kitchen orders filtered by station.
   * When stationId is provided, only return orders that contain at least one
   * item from a dish assigned to that station, and filter order items accordingly.
   */
  getKitchenOrdersByStation: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        stationId: z.string().uuid().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true, currency: true, name: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view kitchen orders for this menu",
        });
      }

      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      );

      const orders = await ctx.db.orders.findMany({
        where: {
          menuId: input.menuId,
          createdAt: { gte: twentyFourHoursAgo },
          // When filtering by station, only fetch orders that have matching items
          ...(input.stationId
            ? {
                orderItems: {
                  some: {
                    dishes: { kitchenStationId: input.stationId },
                  },
                },
              }
            : {}),
        },
        include: {
          orderItems: {
            // Filter items at the DB level when station is specified
            ...(input.stationId
              ? {
                  where: {
                    dishes: { kitchenStationId: input.stationId },
                  },
                }
              : {}),
            include: {
              dishes: { select: { pictureUrl: true, kitchenStationId: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const filteredOrders = orders;

      const grouped = {
        pending: filteredOrders.filter((o) => o.status === "pending"),
        confirmed: filteredOrders.filter((o) => o.status === "confirmed"),
        preparing: filteredOrders.filter((o) => o.status === "preparing"),
        ready: filteredOrders.filter((o) => o.status === "ready"),
        completed: filteredOrders
          .filter((o) => o.status === "completed")
          .slice(-10),
        cancelled: filteredOrders.filter((o) => o.status === "cancelled"),
      };

      return {
        orders: grouped,
        currency: menu.currency,
        menuName: menu.name,
      };
    }),
});
