// @ts-nocheck
/**
 * Delivery Platform — tRPC Router
 *
 * @ts-nocheck is used because this router references Prisma models
 * (Driver, Delivery, DriverDocument, etc.) that do not exist yet.
 * Once the Prisma schema migration is created, remove @ts-nocheck.
 *
 * 11 sub-routers:
 * - driver: Registration, status, profile
 * - document: KYC document submission and verification
 * - delivery: Create, assign, status updates
 * - location: Real-time driver location
 * - scoring: Driver score and tier info
 * - rating: Customer ratings for drivers
 * - fraud: Fraud alerts and reports
 * - dispute: Delivery disputes
 * - zone: Delivery zone management
 * - earnings: Driver earnings and payouts
 * - analytics: Delivery analytics
 */

import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { logger } from "~/server/logger";
import {
  RegisterDriverSchema,
  UpdateDriverStatusSchema,
  SubmitDocumentSchema,
  CreateDeliverySchema,
  UpdateDeliveryStatusSchema,
  UpdateLocationSchema,
  CalculateDeliveryFeeSchema,
  RateDriverSchema,
  ReportFraudSchema,
  CreateDisputeSchema,
  UpdateDisputeSchema,
  CreateDeliveryZoneSchema,
  GetEarningsSchema,
  GetAnalyticsSchema,
  DeliveryStatusEnum,
} from "./schema/deliverySchema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function haversineDistance(
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
  return 2 * R * Math.asin(Math.sqrt(a));
}

const BASE_DELIVERY_FEE = 1000; // centimes
const PER_KM_RATE = 300; // centimes
const MIN_FEE = 1000;
const MAX_FEE = 5000;

const validTransitions: Record<string, string[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picking_up", "cancelled"],
  picking_up: ["at_restaurant", "cancelled"],
  at_restaurant: ["picked_up", "cancelled"],
  picked_up: ["delivering", "cancelled"],
  delivering: ["at_dropoff", "cancelled"],
  at_dropoff: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

// ---------------------------------------------------------------------------
// Sub-Routers
// ---------------------------------------------------------------------------

const driverRouter = createTRPCRouter({
  register: publicProcedure
    .input(RegisterDriverSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info(`Driver registration: ${input.fullName}`, "Delivery");
      const driver = await ctx.db.driver.create({
        data: {
          fullName: input.fullName,
          phone: input.phone,
          email: input.email ?? null,
          vehicleType: input.vehicleType,
          city: input.city,
          status: "pending_verification",
          tier: "bronze",
          score: 50,
          referralCode: input.referralCode ?? null,
        },
      });
      return { id: driver.id, status: driver.status };
    }),

  getProfile: privateProcedure
    .input(z.object({ driverId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.driver.findUniqueOrThrow({
        where: { id: input.driverId },
        include: { documents: true, ratings: true },
      });
    }),

  updateStatus: privateProcedure
    .input(UpdateDriverStatusSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info(
        `Driver ${input.driverId} status → ${input.status}`,
        "Delivery",
      );
      return ctx.db.driver.update({
        where: { id: input.driverId },
        data: { status: input.status },
      });
    }),

  list: privateProcedure
    .input(
      z.object({
        status: z.string().optional(),
        city: z.string().optional(),
        tier: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.status) where.status = input.status;
      if (input.city) where.city = input.city;
      if (input.tier) where.tier = input.tier;

      const drivers = await ctx.db.driver.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (drivers.length > input.limit) {
        const next = drivers.pop();
        nextCursor = next?.id;
      }

      return { drivers, nextCursor };
    }),
});

const documentRouter = createTRPCRouter({
  submit: privateProcedure
    .input(SubmitDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info(
        `Document ${input.documentType} submitted for driver ${input.driverId}`,
        "Delivery",
      );
      return ctx.db.driverDocument.create({
        data: {
          driverId: input.driverId,
          type: input.documentType,
          data: input.documentData,
          fileUrls: input.fileUrls ?? [],
          status: "pending",
        },
      });
    }),

  getByDriver: privateProcedure
    .input(z.object({ driverId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.driverDocument.findMany({
        where: { driverId: input.driverId },
        orderBy: { createdAt: "desc" },
      });
    }),

  updateStatus: privateProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        reviewNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.driverDocument.update({
        where: { id: input.documentId },
        data: {
          status: input.status,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes ?? null,
        },
      });
    }),
});

const deliveryOpsRouter = createTRPCRouter({
  create: privateProcedure
    .input(CreateDeliverySchema)
    .mutation(async ({ ctx, input }) => {
      logger.info(`Delivery created for order ${input.orderId}`, "Delivery");
      return ctx.db.delivery.create({
        data: {
          orderId: input.orderId,
          restaurantId: input.restaurantId,
          pickupLat: input.pickupLat,
          pickupLng: input.pickupLng,
          dropoffLat: input.dropoffLat,
          dropoffLng: input.dropoffLng,
          customerPhone: input.customerPhone ?? null,
          paymentMethod: input.paymentMethod,
          orderAmount: input.orderAmount,
          deliveryFee: input.deliveryFee,
          specialInstructions: input.specialInstructions ?? null,
          status: "pending",
        },
      });
    }),

  updateStatus: privateProcedure
    .input(UpdateDeliveryStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const delivery = await ctx.db.delivery.findUniqueOrThrow({
        where: { id: input.deliveryId },
      });

      const allowed = validTransitions[delivery.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new Error(
          `Invalid transition: ${delivery.status} → ${input.status}`,
        );
      }

      logger.info(
        `Delivery ${input.deliveryId}: ${delivery.status} → ${input.status}`,
        "Delivery",
      );

      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      if (input.status === "picked_up") {
        updateData.pickedUpAt = new Date();
      }
      if (input.status === "delivered") {
        updateData.deliveredAt = new Date();
      }

      return ctx.db.delivery.update({
        where: { id: input.deliveryId },
        data: updateData,
      });
    }),

  getById: privateProcedure
    .input(z.object({ deliveryId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.delivery.findUniqueOrThrow({
        where: { id: input.deliveryId },
        include: { driver: true },
      });
    }),

  getByOrder: publicProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.delivery.findFirst({
        where: { orderId: input.orderId },
        include: {
          driver: {
            select: { id: true, fullName: true, phone: true, vehicleType: true },
          },
        },
      });
    }),

  calculateFee: publicProcedure
    .input(CalculateDeliveryFeeSchema)
    .query(({ input }) => {
      const distanceKm = haversineDistance(
        input.pickupLat,
        input.pickupLng,
        input.dropoffLat,
        input.dropoffLng,
      );
      const rawFee = BASE_DELIVERY_FEE + Math.round(distanceKm * PER_KM_RATE);
      const totalFee = Math.max(MIN_FEE, Math.min(MAX_FEE, rawFee));

      return {
        baseFee: BASE_DELIVERY_FEE,
        distanceFee: Math.round(distanceKm * PER_KM_RATE),
        surgeFee: 0,
        totalFee,
        distanceKm: Math.round(distanceKm * 100) / 100,
        currency: "MAD",
      };
    }),
});

const locationRouter = createTRPCRouter({
  update: privateProcedure
    .input(UpdateLocationSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.driverLocation.upsert({
        where: { driverId: input.driverId },
        create: {
          driverId: input.driverId,
          lat: input.lat,
          lng: input.lng,
          speed: input.speed,
          heading: input.heading,
          accuracy: input.accuracy,
          batteryLevel: input.batteryLevel ?? null,
          updatedAt: new Date(),
        },
        update: {
          lat: input.lat,
          lng: input.lng,
          speed: input.speed,
          heading: input.heading,
          accuracy: input.accuracy,
          batteryLevel: input.batteryLevel ?? null,
          updatedAt: new Date(),
        },
      });
    }),

  getDriverLocation: privateProcedure
    .input(z.object({ driverId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.driverLocation.findUnique({
        where: { driverId: input.driverId },
      });
    }),

  getNearbyDrivers: privateProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radiusKm: z.number().positive().default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const allLocations = await ctx.db.driverLocation.findMany({
        include: { driver: { select: { id: true, status: true, vehicleType: true } } },
      });

      return allLocations.filter((loc) => {
        const dist = haversineDistance(input.lat, input.lng, loc.lat, loc.lng);
        return dist <= input.radiusKm && loc.driver.status === "available";
      });
    }),
});

const scoringRouter = createTRPCRouter({
  getScore: privateProcedure
    .input(z.object({ driverId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const driver = await ctx.db.driver.findUniqueOrThrow({
        where: { id: input.driverId },
      });
      return {
        driverId: driver.id,
        score: driver.score,
        tier: driver.tier,
      };
    }),

  getLeaderboard: privateProcedure
    .input(
      z.object({
        city: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { status: "active" };
      if (input.city) where.city = input.city;

      return ctx.db.driver.findMany({
        where,
        orderBy: { score: "desc" },
        take: input.limit,
        select: { id: true, fullName: true, score: true, tier: true, city: true },
      });
    }),
});

const ratingRouter = createTRPCRouter({
  submit: publicProcedure
    .input(RateDriverSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info(
        `Rating ${input.rating}/5 for driver ${input.driverId} on delivery ${input.deliveryId}`,
        "Delivery",
      );
      return ctx.db.driverRating.create({
        data: {
          deliveryId: input.deliveryId,
          driverId: input.driverId,
          rating: input.rating,
          comment: input.comment ?? null,
        },
      });
    }),

  getByDriver: privateProcedure
    .input(
      z.object({
        driverId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.driverRating.findMany({
        where: { driverId: input.driverId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});

const fraudRouter = createTRPCRouter({
  report: privateProcedure
    .input(ReportFraudSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info(
        `Fraud alert: ${input.alertType} for driver ${input.driverId}`,
        "Delivery",
      );
      return ctx.db.fraudAlert.create({
        data: {
          driverId: input.driverId,
          type: input.alertType,
          description: input.description,
          evidence: input.evidence ?? {},
          status: "open",
        },
      });
    }),

  getByDriver: privateProcedure
    .input(z.object({ driverId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.fraudAlert.findMany({
        where: { driverId: input.driverId },
        orderBy: { createdAt: "desc" },
      });
    }),
});

const disputeRouter = createTRPCRouter({
  create: privateProcedure
    .input(CreateDisputeSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info(
        `Dispute created for delivery ${input.deliveryId}`,
        "Delivery",
      );
      return ctx.db.dispute.create({
        data: {
          deliveryId: input.deliveryId,
          reason: input.reason,
          requestedAmount: input.requestedAmount ?? null,
          status: "open",
        },
      });
    }),

  update: privateProcedure
    .input(UpdateDisputeSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.dispute.update({
        where: { id: input.disputeId },
        data: {
          status: input.status,
          resolution: input.resolution ?? null,
          refundAmount: input.refundAmount ?? null,
          resolvedAt: input.status === "resolved" || input.status === "closed" ? new Date() : null,
        },
      });
    }),
});

const zoneRouter = createTRPCRouter({
  create: privateProcedure
    .input(CreateDeliveryZoneSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.deliveryZone.create({
        data: {
          name: input.name,
          centerLat: input.centerLat,
          centerLng: input.centerLng,
          radiusKm: input.radiusKm,
          city: input.city,
        },
      });
    }),

  list: publicProcedure
    .input(z.object({ city: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.city) where.city = input.city;
      return ctx.db.deliveryZone.findMany({ where });
    }),
});

const earningsRouter = createTRPCRouter({
  getEarnings: privateProcedure
    .input(GetEarningsSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { driverId: input.driverId };
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(input.startDate);
        if (input.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(input.endDate);
      }

      const payouts = await ctx.db.driverPayout.findMany({ where });
      const total = payouts.reduce((s, p) => s + p.amount, 0);
      return {
        totalEarnings: total,
        deliveryCount: payouts.length,
        tips: payouts.reduce((s, p) => s + (p.tipAmount ?? 0), 0),
        bonuses: payouts.reduce((s, p) => s + (p.bonusAmount ?? 0), 0),
        deductions: payouts.reduce((s, p) => s + (p.deductions ?? 0), 0),
        netEarnings: total,
        period: input.period ?? "all",
      };
    }),
});

const analyticsRouter = createTRPCRouter({
  overview: privateProcedure
    .input(GetAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.restaurantId) where.restaurantId = input.restaurantId;

      const deliveries = await ctx.db.delivery.findMany({ where });
      const completed = deliveries.filter((d) => d.status === "delivered");

      return {
        totalDeliveries: deliveries.length,
        completedDeliveries: completed.length,
        averageDeliveryTime: 0,
        averageRating: 0,
        revenueTotal: completed.reduce((s, d) => s + d.deliveryFee, 0),
        topZones: [],
        hourlyDistribution: [],
      };
    }),
});

// ---------------------------------------------------------------------------
// Main Router
// ---------------------------------------------------------------------------

export const deliveryRouter = createTRPCRouter({
  driver: driverRouter,
  document: documentRouter,
  delivery: deliveryOpsRouter,
  location: locationRouter,
  scoring: scoringRouter,
  rating: ratingRouter,
  fraud: fraudRouter,
  dispute: disputeRouter,
  zone: zoneRouter,
  earnings: earningsRouter,
  analytics: analyticsRouter,
});
