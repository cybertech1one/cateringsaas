import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import { hashIP, sanitizeString } from "~/server/security";
import { logger } from "~/server/logger";
import {
  settleOrder,
  calculateDriverPay,
  getCommissionTier,
  getCommissionRates,
  type PaymentMethod,
} from "~/server/delivery/payments/settlementEngine";

/** Haversine distance between two lat/lng points, returns km */
function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Valid state transitions for delivery status */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled", "failed"],
  picked_up: ["in_transit", "cancelled", "failed"],
  in_transit: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

export const deliveryRouter = createTRPCRouter({
  // ── 1. Create a delivery request ────────────────────────────
  createDeliveryRequest: privateProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        menuId: z.string().uuid(),
        dropoffAddress: z.string().min(1).max(500),
        dropoffLat: z.number().min(-90).max(90).optional(),
        dropoffLng: z.number().min(-180).max(180).optional(),
        notes: z.string().max(500).optional(),
        priority: z.number().int().min(0).max(10).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify menu ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: {
          id: true,
          deliveryFee: true,
          restaurantLat: true,
          restaurantLng: true,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to create deliveries for this menu",
        });
      }

      // Verify order exists and belongs to this menu
      const order = await ctx.db.orders.findFirst({
        where: { id: input.orderId, menuId: input.menuId },
        select: { id: true, status: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found for this menu",
        });
      }

      // Calculate estimated distance if coordinates are available
      let estimatedDistance: number | null = null;

      if (
        menu.restaurantLat &&
        menu.restaurantLng &&
        input.dropoffLat &&
        input.dropoffLng
      ) {
        estimatedDistance = haversineDistanceKm(
          menu.restaurantLat,
          menu.restaurantLng,
          input.dropoffLat,
          input.dropoffLng,
        );
      }

      const delivery = await ctx.db.deliveryRequests.create({
        data: {
          orderId: input.orderId,
          menuId: input.menuId,
          status: "pending",
          dropoffAddress: sanitizeString(input.dropoffAddress),
          dropoffLat: input.dropoffLat ?? null,
          dropoffLng: input.dropoffLng ?? null,
          pickupLat: menu.restaurantLat ?? null,
          pickupLng: menu.restaurantLng ?? null,
          estimatedDistance,
          estimatedDuration: estimatedDistance
            ? Math.ceil(estimatedDistance * 3 + 10)
            : null,
          deliveryFee: menu.deliveryFee ?? 0,
          driverEarning: Math.round((menu.deliveryFee ?? 0) * 0.8),
          priority: input.priority,
          notes: input.notes ? sanitizeString(input.notes) : null,
        },
      });

      logger.info(
        `Delivery request created: ${delivery.id} for order ${input.orderId}`,
        "delivery",
      );

      return delivery;
    }),

  // ── 2. Get delivery requests for a menu (paginated) ─────────
  getDeliveryRequests: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        status: z
          .enum([
            "pending",
            "assigned",
            "picked_up",
            "in_transit",
            "delivered",
            "cancelled",
            "failed",
          ])
          .optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
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
          message: "Not authorized to view deliveries for this menu",
        });
      }

      const deliveries = await ctx.db.deliveryRequests.findMany({
        where: {
          menuId: input.menuId,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          orders: {
            select: {
              orderNumber: true,
              totalAmount: true,
              currency: true,
              customerName: true,
              customerPhone: true,
              deliveryAddress: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              vehicleType: true,
              rating: true,
              currentLat: true,
              currentLng: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      });

      let nextCursor: string | undefined;

      if (deliveries.length > input.limit) {
        const nextItem = deliveries.pop();

        nextCursor = nextItem?.id;
      }

      return { deliveries, nextCursor };
    }),

  // ── 3. Get a single delivery request ────────────────────────
  getDeliveryRequest: privateProcedure
    .input(z.object({ deliveryId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const delivery = await ctx.db.deliveryRequests.findUnique({
        where: { id: input.deliveryId },
        include: {
          orders: {
            select: {
              orderNumber: true,
              totalAmount: true,
              currency: true,
              customerName: true,
              customerPhone: true,
              deliveryAddress: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              vehicleType: true,
              rating: true,
              currentLat: true,
              currentLng: true,
              profilePhotoUrl: true,
            },
          },
          menus: {
            select: { userId: true },
          },
        },
      });

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      // Verify the user is the menu owner OR the assigned driver
      const isOwner = delivery.menus.userId === ctx.user.id;
      const driverProfile = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const isDriver = driverProfile?.id === delivery.assignedDriverId;

      if (!isOwner && !isDriver) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this delivery",
        });
      }

      return delivery;
    }),

  // ── 4. Assign a driver manually ─────────────────────────────
  assignDriver: privateProcedure
    .input(
      z.object({
        deliveryId: z.string().uuid(),
        driverId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const delivery = await ctx.db.deliveryRequests.findUnique({
        where: { id: input.deliveryId },
        include: {
          menus: { select: { userId: true } },
        },
      });

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      if (delivery.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to assign drivers for this delivery",
        });
      }

      if (delivery.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot assign driver to delivery with status "${delivery.status}"`,
        });
      }

      // Verify driver is approved for this restaurant
      const restaurantDriver = await ctx.db.restaurantDrivers.findFirst({
        where: {
          menuId: delivery.menuId,
          driverId: input.driverId,
          status: "approved",
        },
        select: { id: true },
      });

      if (!restaurantDriver) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Driver is not approved for this restaurant",
        });
      }

      // Verify driver is active
      const driver = await ctx.db.drivers.findUnique({
        where: { id: input.driverId },
        select: { id: true, fullName: true, isAvailable: true, status: true },
      });

      if (!driver || driver.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Driver is not active",
        });
      }

      const updated = await ctx.db.deliveryRequests.update({
        where: { id: input.deliveryId },
        data: {
          assignedDriverId: input.driverId,
          status: "assigned",
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Driver ${input.driverId} (${driver.fullName}) assigned to delivery ${input.deliveryId}`,
        "delivery",
      );

      return updated;
    }),

  // ── 5. Update delivery status (state machine) ───────────────
  updateDeliveryStatus: privateProcedure
    .input(
      z.object({
        deliveryId: z.string().uuid(),
        status: z.enum([
          "pending",
          "assigned",
          "picked_up",
          "in_transit",
          "delivered",
          "cancelled",
          "failed",
        ]),
        failureReason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const delivery = await ctx.db.deliveryRequests.findUnique({
        where: { id: input.deliveryId },
        include: {
          menus: { select: { userId: true } },
        },
      });

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      // Check authorization: menu owner or assigned driver
      const isOwner = delivery.menus.userId === ctx.user.id;
      const driverProfile = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const isDriver = driverProfile?.id === delivery.assignedDriverId;

      if (!isOwner && !isDriver) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this delivery",
        });
      }

      // Validate state transition
      const validNextStates = VALID_TRANSITIONS[delivery.status] ?? [];

      if (!validNextStates.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from "${delivery.status}" to "${input.status}"`,
        });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: now,
      };

      if (input.status === "picked_up") {
        updateData.pickedUpAt = now;
      } else if (input.status === "delivered") {
        updateData.deliveredAt = now;

        if (delivery.pickedUpAt) {
          updateData.actualDuration = Math.round(
            (now.getTime() - new Date(delivery.pickedUpAt).getTime()) / 60000,
          );
        }
      } else if (input.status === "cancelled") {
        updateData.cancelledAt = now;
      } else if (input.status === "failed") {
        updateData.failureReason = input.failureReason
          ? sanitizeString(input.failureReason)
          : null;
      }

      const updated = await ctx.db.deliveryRequests.update({
        where: { id: input.deliveryId },
        data: updateData,
      });

      // On delivered: calculate driver pay via settlement engine + persist
      if (input.status === "delivered" && delivery.assignedDriverId) {
        const distanceKm = delivery.estimatedDistance ?? 3;
        const currentHour = now.getHours();
        const isPeakHour =
          (currentHour >= 12 && currentHour < 14) ||
          (currentHour >= 19 && currentHour < 22);
        const tipCentimes = delivery.tipAmount ?? 0;

        const driverPayCalc = calculateDriverPay(
          distanceKm,
          isPeakHour,
          false, // isRaining — default, no weather API yet
          tipCentimes,
        );

        const earnedAmount = driverPayCalc.netPay;

        // Also update the delivery record with the calculated earning
        await ctx.db.deliveryRequests.update({
          where: { id: delivery.id },
          data: { driverEarning: earnedAmount },
        });

        await Promise.all([
          ctx.db.driverEarnings.create({
            data: {
              driverId: delivery.assignedDriverId,
              deliveryRequestId: delivery.id,
              amount: earnedAmount,
              type: "delivery_fee",
              description: `Delivery #${delivery.id.slice(0, 8)} — base ${driverPayCalc.basePay} + dist ${driverPayCalc.distanceBonus}${isPeakHour ? ` + peak ${driverPayCalc.peakBonus}` : ""}${tipCentimes > 0 ? ` + tip ${tipCentimes}` : ""}`,
            },
          }),
          ctx.db.drivers.update({
            where: { id: delivery.assignedDriverId },
            data: {
              totalDeliveries: { increment: 1 },
              totalEarnings: { increment: earnedAmount },
              updatedAt: now,
            },
          }),
        ]);

        logger.info(
          `Settlement: driver ${delivery.assignedDriverId} earned ${earnedAmount} centimes (base=${driverPayCalc.basePay}, dist=${driverPayCalc.distanceBonus}, peak=${driverPayCalc.peakBonus}, tip=${tipCentimes})`,
          "delivery",
        );
      }

      logger.info(
        `Delivery ${input.deliveryId} status updated: ${delivery.status} → ${input.status}`,
        "delivery",
      );

      return updated;
    }),

  // ── 6. Auto-dispatch: smart driver matching ─────────────────
  autoDispatch: privateProcedure
    .input(
      z.object({
        deliveryId: z.string().uuid(),
        maxDistanceKm: z.number().min(1).max(50).default(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `auto-dispatch:${ctx.user.id}`,
        limit: 30,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Auto-dispatch rate limit exceeded",
        });
      }

      const delivery = await ctx.db.deliveryRequests.findUnique({
        where: { id: input.deliveryId },
        include: {
          menus: {
            select: {
              userId: true,
              restaurantLat: true,
              restaurantLng: true,
            },
          },
        },
      });

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      if (delivery.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      if (delivery.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot auto-dispatch delivery with status "${delivery.status}"`,
        });
      }

      // Get all approved, available drivers for this restaurant
      const approvedLinks = await ctx.db.restaurantDrivers.findMany({
        where: {
          menuId: delivery.menuId,
          status: "approved",
        },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              isAvailable: true,
              status: true,
              rating: true,
              currentLat: true,
              currentLng: true,
            },
          },
        },
      });

      // Filter to only available, active drivers
      const candidates = approvedLinks.filter(
        (link) => link.driver.isAvailable && link.driver.status === "active",
      );

      if (candidates.length === 0) {
        return { assigned: false, driver: null, reason: "No available drivers" };
      }

      // Score each candidate: priority * 3 + rating * 2 + proximity score
      const pickupLat = delivery.pickupLat ?? delivery.menus.restaurantLat;
      const pickupLng = delivery.pickupLng ?? delivery.menus.restaurantLng;

      const scored = candidates
        .map((link) => {
          let distanceKm = Infinity;

          if (
            pickupLat &&
            pickupLng &&
            link.driver.currentLat &&
            link.driver.currentLng
          ) {
            distanceKm = haversineDistanceKm(
              pickupLat,
              pickupLng,
              link.driver.currentLat,
              link.driver.currentLng,
            );
          }

          if (distanceKm > input.maxDistanceKm) return null;

          const distanceScore = distanceKm < 1 ? 10 : 10 / distanceKm;
          const score =
            (link.priority ?? 0) * 3 +
            (link.driver.rating ?? 5) * 2 +
            distanceScore;

          return {
            driverId: link.driver.id,
            fullName: link.driver.fullName,
            distanceKm,
            score,
          };
        })
        .filter(Boolean) as Array<{
        driverId: string;
        fullName: string;
        distanceKm: number;
        score: number;
      }>;

      if (scored.length === 0) {
        return {
          assigned: false,
          driver: null,
          reason: "No drivers within range",
        };
      }

      // Pick the highest-scoring driver
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0]!;

      // Assign the driver
      await ctx.db.deliveryRequests.update({
        where: { id: input.deliveryId },
        data: {
          assignedDriverId: best.driverId,
          status: "assigned",
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Auto-dispatched delivery ${input.deliveryId} to driver ${best.driverId} (${best.fullName}, score: ${best.score.toFixed(2)})`,
        "delivery",
      );

      return {
        assigned: true,
        driver: {
          id: best.driverId,
          fullName: best.fullName,
          score: Math.round(best.score * 100) / 100,
        },
        reason: null,
      };
    }),

  // ── 7. Cancel a delivery ────────────────────────────────────
  cancelDelivery: privateProcedure
    .input(
      z.object({
        deliveryId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const delivery = await ctx.db.deliveryRequests.findUnique({
        where: { id: input.deliveryId },
        include: {
          menus: { select: { userId: true } },
        },
      });

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      if (delivery.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to cancel this delivery",
        });
      }

      const validNext = VALID_TRANSITIONS[delivery.status] ?? [];

      if (!validNext.includes("cancelled")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot cancel delivery with status "${delivery.status}"`,
        });
      }

      const updated = await ctx.db.deliveryRequests.update({
        where: { id: input.deliveryId },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          notes: input.reason ? sanitizeString(input.reason) : delivery.notes,
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Delivery ${input.deliveryId} cancelled by owner`,
        "delivery",
      );

      return updated;
    }),

  // ── 8. Rate a driver (public, by customer) ──────────────────
  rateDriver: publicProcedure
    .input(
      z.object({
        deliveryId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `rate-driver:${input.deliveryId}`,
        limit: 1,
        windowMs: 24 * 60 * 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "This delivery has already been rated",
        });
      }

      const delivery = await ctx.db.deliveryRequests.findUnique({
        where: { id: input.deliveryId },
        select: {
          id: true,
          status: true,
          assignedDriverId: true,
          rating: true,
        },
      });

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery not found",
        });
      }

      if (delivery.status !== "delivered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only rate delivered orders",
        });
      }

      if (delivery.rating) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This delivery has already been rated",
        });
      }

      if (!delivery.assignedDriverId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No driver assigned to this delivery",
        });
      }

      // Update delivery with rating
      await ctx.db.deliveryRequests.update({
        where: { id: input.deliveryId },
        data: {
          rating: input.rating,
          ratingComment: input.comment
            ? sanitizeString(input.comment)
            : null,
          updatedAt: new Date(),
        },
      });

      // Update driver's average rating
      const allRatings = await ctx.db.deliveryRequests.findMany({
        where: {
          assignedDriverId: delivery.assignedDriverId,
          rating: { not: null },
        },
        select: { rating: true },
      });

      const avgRating =
        allRatings.reduce((sum, d) => sum + (d.rating ?? 0), 0) /
        allRatings.length;

      await ctx.db.drivers.update({
        where: { id: delivery.assignedDriverId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Delivery ${input.deliveryId} rated ${input.rating}/5`,
        "delivery",
      );

      return { success: true, rating: input.rating };
    }),

  // ── 9. Get active deliveries for restaurant ─────────────────
  getActiveDeliveries: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
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

      const deliveries = await ctx.db.deliveryRequests.findMany({
        where: {
          menuId: input.menuId,
          status: { in: ["pending", "assigned", "picked_up", "in_transit"] },
        },
        include: {
          orders: {
            select: {
              orderNumber: true,
              totalAmount: true,
              currency: true,
              customerName: true,
              customerPhone: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              vehicleType: true,
              currentLat: true,
              currentLng: true,
            },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      return deliveries;
    }),

  // ── 10. Delivery stats for restaurant dashboard ─────────────
  getDeliveryStats: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
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

      const dateFilter: Record<string, Date> = {};

      if (input.startDate) {
        dateFilter.gte = new Date(input.startDate);
      }

      if (input.endDate) {
        dateFilter.lte = new Date(input.endDate);
      }

      const baseWhere = {
        menuId: input.menuId,
        ...(Object.keys(dateFilter).length > 0
          ? { createdAt: dateFilter }
          : {}),
      };

      const [total, delivered, cancelled, failed, feesAgg, avgDuration] =
        await Promise.all([
          ctx.db.deliveryRequests.count({ where: baseWhere }),
          ctx.db.deliveryRequests.count({
            where: { ...baseWhere, status: "delivered" },
          }),
          ctx.db.deliveryRequests.count({
            where: { ...baseWhere, status: "cancelled" },
          }),
          ctx.db.deliveryRequests.count({
            where: { ...baseWhere, status: "failed" },
          }),
          ctx.db.deliveryRequests.aggregate({
            where: { ...baseWhere, status: "delivered" },
            _sum: { deliveryFee: true, driverEarning: true },
          }),
          ctx.db.deliveryRequests.aggregate({
            where: {
              ...baseWhere,
              status: "delivered",
              actualDuration: { not: null },
            },
            _avg: { actualDuration: true },
          }),
        ]);

      return {
        total,
        delivered,
        cancelled,
        failed,
        pending: total - delivered - cancelled - failed,
        successRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
        totalFees: feesAgg._sum.deliveryFee ?? 0,
        totalDriverEarnings: feesAgg._sum.driverEarning ?? 0,
        avgDeliveryMinutes: avgDuration._avg.actualDuration
          ? Math.round(avgDuration._avg.actualDuration)
          : null,
      };
    }),

  // ── 11. Calculate delivery fee for a customer location ───
  calculateDeliveryFee: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        dropoffLat: z.number().min(-90).max(90),
        dropoffLng: z.number().min(-180).max(180),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const { success } = rateLimit({
        key: `delivery-fee:${clientIP}:${input.menuId}`,
        limit: 30,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, isPublished: true },
        select: {
          id: true,
          restaurantLat: true,
          restaurantLng: true,
          deliveryRadiusKm: true,
          deliveryFee: true,
          enabledOrderTypes: true,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found or not published",
        });
      }

      if (!menu.enabledOrderTypes.includes("delivery")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Delivery is not available for this restaurant",
        });
      }

      if (menu.restaurantLat === null || menu.restaurantLng === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Restaurant has not configured delivery coordinates",
        });
      }

      const distanceKm = haversineDistanceKm(
        menu.restaurantLat,
        menu.restaurantLng,
        input.dropoffLat,
        input.dropoffLng,
      );

      const radiusKm = menu.deliveryRadiusKm ?? 5;
      const withinDeliveryZone = distanceKm <= radiusKm;
      const baseFee = menu.deliveryFee ?? 0;

      // 300 centimes per km above 3km threshold
      const distanceSurcharge =
        distanceKm > 3 ? Math.round((distanceKm - 3) * 300) : 0;
      const totalFee = baseFee + distanceSurcharge;

      // ETA: ~3 min per km + 10 min base prep/pickup
      const estimatedMinutes = Math.ceil(distanceKm * 3 + 10);

      logger.info(
        `Delivery fee calculated: ${totalFee} centimes, ${Math.round(distanceKm * 10) / 10}km, ETA ${estimatedMinutes}min`,
        "delivery",
      );

      return {
        distanceKm: Math.round(distanceKm * 10) / 10,
        baseFee,
        distanceSurcharge,
        totalFee,
        estimatedMinutes,
        withinDeliveryZone,
      };
    }),

  // ── 12. Settle a delivery (calculate full financial split) ──
  settleDelivery: privateProcedure
    .input(z.object({ deliveryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const delivery = await ctx.db.deliveryRequests.findUnique({
        where: { id: input.deliveryId },
        include: {
          menus: { select: { userId: true } },
          orders: { select: { totalAmount: true } },
        },
      });

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      if (delivery.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to settle this delivery",
        });
      }

      if (delivery.status !== "delivered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Can only settle delivered orders (current: "${delivery.status}")`,
        });
      }

      // Count monthly delivered orders for commission tier
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyOrders = await ctx.db.deliveryRequests.count({
        where: {
          menuId: delivery.menuId,
          status: "delivered",
          deliveredAt: { gte: monthStart },
        },
      });

      const orderAmountCentimes = delivery.orders.totalAmount ?? 0;
      const deliveryFeeCentimes = delivery.deliveryFee;
      const tipCentimes = delivery.tipAmount ?? 0;
      const distanceKm = delivery.estimatedDistance ?? 3;

      const currentHour = new Date().getHours();
      const isPeakHour =
        (currentHour >= 12 && currentHour < 14) ||
        (currentHour >= 19 && currentHour < 22);

      const paymentMethod = (delivery.paymentMethod ?? "cash") as PaymentMethod;
      const validMethods: PaymentMethod[] = [
        "cod",
        "card",
        "mobile_wallet",
        "bank_transfer",
      ];
      const resolvedPaymentMethod = validMethods.includes(paymentMethod)
        ? paymentMethod
        : "cod";

      const settlement = settleOrder(
        delivery.orderId,
        orderAmountCentimes,
        deliveryFeeCentimes,
        tipCentimes,
        distanceKm,
        isPeakHour,
        false,
        resolvedPaymentMethod,
        monthlyOrders,
      );

      // Persist settlement amounts to the earnings record if not already created
      const existingEarning = await ctx.db.driverEarnings.findFirst({
        where: { deliveryRequestId: delivery.id },
        select: { id: true },
      });

      if (!existingEarning && delivery.assignedDriverId) {
        await ctx.db.driverEarnings.create({
          data: {
            driverId: delivery.assignedDriverId,
            deliveryRequestId: delivery.id,
            amount: settlement.driverPay,
            type: "delivery_fee",
            description: `Settlement for delivery #${delivery.id.slice(0, 8)}`,
          },
        });
      }

      logger.info(
        `Delivery ${input.deliveryId} settled: commission=${settlement.commissionAmount}, driverPay=${settlement.driverPay}, restaurantPayout=${settlement.restaurantPayout}`,
        "delivery",
      );

      return settlement;
    }),

  // ── 13. Get settlement summary for a restaurant ─────────────
  getSettlementSummary: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
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
          message: "Not authorized to view settlement for this menu",
        });
      }

      const dateFilter: Record<string, Date> = {};

      if (input.startDate) {
        dateFilter.gte = new Date(input.startDate);
      }

      if (input.endDate) {
        dateFilter.lte = new Date(input.endDate);
      }

      const baseWhere = {
        menuId: input.menuId,
        status: "delivered" as const,
        ...(Object.keys(dateFilter).length > 0
          ? { deliveredAt: dateFilter }
          : {}),
      };

      const [deliveredOrders, feeAgg, codCount] = await Promise.all([
        ctx.db.deliveryRequests.count({ where: baseWhere }),
        ctx.db.deliveryRequests.aggregate({
          where: baseWhere,
          _sum: { deliveryFee: true, driverEarning: true, tipAmount: true },
        }),
        ctx.db.deliveryRequests.count({
          where: { ...baseWhere, paymentMethod: "cash" },
        }),
      ]);

      // Get current commission tier
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyOrders = await ctx.db.deliveryRequests.count({
        where: {
          menuId: input.menuId,
          status: "delivered",
          deliveredAt: { gte: monthStart },
        },
      });

      const currentTier = getCommissionTier(monthlyOrders);

      const totalFees = feeAgg._sum.deliveryFee ?? 0;
      const totalDriverPayouts = feeAgg._sum.driverEarning ?? 0;
      const totalTips = feeAgg._sum.tipAmount ?? 0;
      const totalRevenue = totalFees + totalTips;
      const totalCommissions = Math.round(totalFees * currentTier.rate);
      const netEarnings = totalRevenue - totalCommissions - totalDriverPayouts;

      return {
        totalOrders: deliveredOrders,
        totalRevenue,
        totalCommissions,
        totalDriverPayouts,
        totalTips,
        netEarnings,
        currentTier: {
          name: currentTier.name,
          rate: currentTier.rate,
          monthlyOrders,
        },
        codPercentage:
          deliveredOrders > 0
            ? Math.round((codCount / deliveredOrders) * 100)
            : 0,
      };
    }),

  // ── 14. Get commission info for a restaurant ────────────────
  getCommissionInfo: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view commission info for this menu",
        });
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyOrders = await ctx.db.deliveryRequests.count({
        where: {
          menuId: input.menuId,
          status: "delivered",
          deliveredAt: { gte: monthStart },
        },
      });

      const currentTier = getCommissionTier(monthlyOrders);
      const allTiers = getCommissionRates();

      return {
        monthlyOrders,
        currentRate: currentTier.rate,
        currentTierName: currentTier.name,
        tiers: allTiers,
      };
    }),

  // ── 16. Public delivery tracking by order ID ──────────────
  getDeliveryByOrderId: publicProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);

      const { success } = rateLimit({
        key: `delivery-track:${ipHash}:${input.orderId}`,
        limit: 30,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      const delivery = await ctx.db.deliveryRequests.findFirst({
        where: { orderId: input.orderId },
        select: {
          id: true,
          status: true,
          dropoffAddress: true,
          dropoffLat: true,
          dropoffLng: true,
          pickupLat: true,
          pickupLng: true,
          estimatedDistance: true,
          estimatedDuration: true,
          actualDuration: true,
          deliveryFee: true,
          priority: true,
          rating: true,
          ratingComment: true,
          pickedUpAt: true,
          deliveredAt: true,
          cancelledAt: true,
          failureReason: true,
          createdAt: true,
          updatedAt: true,
          driver: {
            select: {
              fullName: true,
              phone: true,
              vehicleType: true,
              profilePhotoUrl: true,
              rating: true,
              currentLat: true,
              currentLng: true,
            },
          },
        },
      });

      if (!delivery) {
        return null;
      }

      logger.info(
        `Public delivery tracking accessed for order ${input.orderId}`,
        "delivery",
      );

      return delivery;
    }),
});
