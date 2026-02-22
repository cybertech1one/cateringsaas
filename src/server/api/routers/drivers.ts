import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import { hashIP, sanitizeString } from "~/server/security";
import { logger } from "~/server/logger";

export const driversRouter = createTRPCRouter({
  // ── 1. Driver registration (public) ─────────────────────────
  register: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(100),
        phone: z.string().min(5).max(20),
        email: z.string().email().max(255).optional(),
        city: z.string().min(1).max(100),
        vehicleType: z.enum(["bicycle", "motorcycle", "car", "van", "on_foot"]),
        licenseNumber: z.string().max(50).optional(),
        idNumber: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);

      const { success } = rateLimit({
        key: `driver-register:${ipHash}`,
        limit: 3,
        windowMs: 60 * 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many registration attempts. Please try again later.",
        });
      }

      // Check for duplicate phone number
      const existingDriver = await ctx.db.drivers.findFirst({
        where: { phone: input.phone },
        select: { id: true },
      });

      if (existingDriver) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A driver with this phone number already exists",
        });
      }

      const driver = await ctx.db.drivers.create({
        data: {
          fullName: sanitizeString(input.fullName),
          phone: input.phone,
          email: input.email?.toLowerCase().trim() ?? null,
          city: sanitizeString(input.city),
          vehicleType: input.vehicleType,
          licenseNumber: input.licenseNumber ?? null,
          idNumber: input.idNumber ?? null,
          status: "pending",
          isAvailable: false,
          rating: 5.0,
          totalDeliveries: 0,
          totalEarnings: 0,
        },
      });

      logger.info(
        `New driver registered: ${driver.id} (${input.fullName}, ${input.city})`,
        "drivers",
      );

      return {
        id: driver.id,
        fullName: driver.fullName,
        status: driver.status,
      };
    }),

  // ── 2. Get driver's own profile ─────────────────────────────
  getProfile: privateProcedure.query(async ({ ctx }) => {
    const driver = await ctx.db.drivers.findFirst({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        email: true,
        city: true,
        vehicleType: true,
        licenseNumber: true,
        idNumber: true,
        profilePhotoUrl: true,
        status: true,
        rating: true,
        totalDeliveries: true,
        totalEarnings: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!driver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found. Please register first.",
      });
    }

    return driver;
  }),

  // ── 3. Update driver's own profile ──────────────────────────
  updateProfile: privateProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(100).optional(),
        phone: z.string().min(5).max(20).optional(),
        email: z.string().email().max(255).optional(),
        city: z.string().min(1).max(100).optional(),
        vehicleType: z
          .enum(["bicycle", "motorcycle", "car", "van", "on_foot"])
          .optional(),
        licenseNumber: z.string().max(50).optional(),
        idNumber: z.string().max(50).optional(),
        profilePhotoUrl: z.string().url().max(2048).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found",
        });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.fullName !== undefined) {
        updateData.fullName = sanitizeString(input.fullName);
      }

      if (input.phone !== undefined) {
        updateData.phone = input.phone;
      }

      if (input.email !== undefined) {
        updateData.email = input.email.toLowerCase().trim();
      }

      if (input.city !== undefined) {
        updateData.city = sanitizeString(input.city);
      }

      if (input.vehicleType !== undefined) {
        updateData.vehicleType = input.vehicleType;
      }

      if (input.licenseNumber !== undefined) {
        updateData.licenseNumber = input.licenseNumber;
      }

      if (input.idNumber !== undefined) {
        updateData.idNumber = input.idNumber;
      }

      if (input.profilePhotoUrl !== undefined) {
        updateData.profilePhotoUrl = input.profilePhotoUrl;
      }

      const updated = await ctx.db.drivers.update({
        where: { id: driver.id },
        data: updateData,
      });

      return updated;
    }),

  // ── 4. Update driver's current location ─────────────────────
  updateLocation: privateProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `driver-location:${ctx.user.id}`,
        limit: 60,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Location update rate limit exceeded",
        });
      }

      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found",
        });
      }

      const now = new Date();

      const updated = await ctx.db.drivers.update({
        where: { id: driver.id },
        data: {
          currentLat: input.lat,
          currentLng: input.lng,
          lastLocationUpdate: now,
          updatedAt: now,
        },
      });

      return {
        currentLat: updated.currentLat,
        currentLng: updated.currentLng,
        lastLocationUpdate: updated.lastLocationUpdate,
      };
    }),

  // ── 5. Toggle driver availability ───────────────────────────
  toggleAvailability: privateProcedure.mutation(async ({ ctx }) => {
    const driver = await ctx.db.drivers.findFirst({
      where: { userId: ctx.user.id },
      select: { id: true, isAvailable: true, status: true },
    });

    if (!driver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    }

    if (driver.status !== "active") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only active drivers can toggle availability",
      });
    }

    const newAvailability = !(driver.isAvailable ?? false);

    const updated = await ctx.db.drivers.update({
      where: { id: driver.id },
      data: {
        isAvailable: newAvailability,
        updatedAt: new Date(),
      },
    });

    logger.info(
      `Driver ${driver.id} availability toggled to ${newAvailability}`,
      "drivers",
    );

    return { isAvailable: updated.isAvailable };
  }),

  // ── 6. Get driver's availability schedule ───────────────────
  getAvailability: privateProcedure.query(async ({ ctx }) => {
    const driver = await ctx.db.drivers.findFirst({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    if (!driver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    }

    const availability = await ctx.db.driverAvailability.findMany({
      where: { driverId: driver.id },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isActive: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return availability;
  }),

  // ── 7. Set weekly availability windows ──────────────────────
  setAvailability: privateProcedure
    .input(
      z.object({
        windows: z
          .array(
            z.object({
              dayOfWeek: z.enum([
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ]),
              startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM"),
              endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM"),
            }),
          )
          .max(21),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found",
        });
      }

      // Replace all existing availability with new windows
      await ctx.db.$transaction(async (tx) => {
        await tx.driverAvailability.deleteMany({
          where: { driverId: driver.id },
        });

        if (input.windows.length > 0) {
          await tx.driverAvailability.createMany({
            data: input.windows.map((window) => ({
              driverId: driver.id,
              dayOfWeek: window.dayOfWeek,
              startTime: new Date(`1970-01-01T${window.startTime}:00.000Z`),
              endTime: new Date(`1970-01-01T${window.endTime}:00.000Z`),
              isActive: true,
            })),
          });
        }
      });

      logger.info(
        `Driver ${driver.id} availability updated (${input.windows.length} windows)`,
        "drivers",
      );

      return { success: true, windowCount: input.windows.length };
    }),

  // ── 8. Apply to deliver for a restaurant ────────────────────
  applyToRestaurant: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `driver-apply:${ctx.user.id}`,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many applications. Please try again later.",
        });
      }

      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true, status: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found. Please register first.",
        });
      }

      // Verify menu exists
      const menu = await ctx.db.menus.findUnique({
        where: { id: input.menuId },
        select: { id: true, name: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant menu not found",
        });
      }

      // Check for existing application
      const existing = await ctx.db.restaurantDrivers.findUnique({
        where: {
          menuId_driverId: {
            menuId: input.menuId,
            driverId: driver.id,
          },
        },
        select: { id: true, status: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You have already applied to this restaurant (status: ${existing.status})`,
        });
      }

      const application = await ctx.db.restaurantDrivers.create({
        data: {
          menuId: input.menuId,
          driverId: driver.id,
          status: "pending",
          notes: input.notes ? sanitizeString(input.notes) : null,
        },
      });

      logger.info(
        `Driver ${driver.id} applied to restaurant menu ${input.menuId}`,
        "drivers",
      );

      return {
        id: application.id,
        status: application.status,
        menuName: menu.name,
      };
    }),

  // ── 9. Get driver's restaurant applications ─────────────────
  getMyRestaurants: privateProcedure.query(async ({ ctx }) => {
    const driver = await ctx.db.drivers.findFirst({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    if (!driver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    }

    const restaurants = await ctx.db.restaurantDrivers.findMany({
      where: { driverId: driver.id },
      select: {
        id: true,
        status: true,
        priority: true,
        appliedAt: true,
        approvedAt: true,
        notes: true,
        menus: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            logoImageUrl: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return restaurants;
  }),

  // ── 10. Get driver's delivery requests ──────────────────────
  getMyDeliveries: privateProcedure
    .input(
      z.object({
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
      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found",
        });
      }

      const deliveries = await ctx.db.deliveryRequests.findMany({
        where: {
          assignedDriverId: driver.id,
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
            },
          },
          menus: {
            select: {
              name: true,
              address: true,
              logoImageUrl: true,
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

  // ── 11. Get driver's earnings ───────────────────────────────
  getEarnings: privateProcedure
    .input(
      z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true, totalEarnings: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found",
        });
      }

      const dateFilter: Record<string, Date> = {};

      if (input.startDate) {
        dateFilter.gte = new Date(input.startDate);
      }

      if (input.endDate) {
        dateFilter.lte = new Date(input.endDate);
      }

      const [earnings, totals] = await Promise.all([
        ctx.db.driverEarnings.findMany({
          where: {
            driverId: driver.id,
            ...(Object.keys(dateFilter).length > 0
              ? { createdAt: dateFilter }
              : {}),
          },
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            createdAt: true,
            deliveryRequestId: true,
          },
          orderBy: { createdAt: "desc" },
          take: input.limit + 1,
          ...(input.cursor
            ? { cursor: { id: input.cursor }, skip: 1 }
            : {}),
        }),
        ctx.db.driverEarnings.aggregate({
          where: {
            driverId: driver.id,
            ...(Object.keys(dateFilter).length > 0
              ? { createdAt: dateFilter }
              : {}),
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      let nextCursor: string | undefined;

      if (earnings.length > input.limit) {
        const nextItem = earnings.pop();

        nextCursor = nextItem?.id;
      }

      return {
        earnings,
        nextCursor,
        totalAmount: totals._sum.amount ?? 0,
        totalCount: totals._count,
        lifetimeEarnings: driver.totalEarnings ?? 0,
      };
    }),

  // ── 12. Get drivers for a restaurant (owner view) ───────────
  getDriversForRestaurant: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify menu ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view drivers for this menu",
        });
      }

      const restaurantDrivers = await ctx.db.restaurantDrivers.findMany({
        where: {
          menuId: input.menuId,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              city: true,
              vehicleType: true,
              rating: true,
              totalDeliveries: true,
              isAvailable: true,
              status: true,
              profilePhotoUrl: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { appliedAt: "desc" }],
      });

      return restaurantDrivers;
    }),

  // ── 13. Approve a driver application ────────────────────────
  approveDriver: privateProcedure
    .input(
      z.object({
        restaurantDriverId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const restaurantDriver = await ctx.db.restaurantDrivers.findUnique({
        where: { id: input.restaurantDriverId },
        include: {
          menus: { select: { userId: true } },
          driver: { select: { fullName: true } },
        },
      });

      if (!restaurantDriver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver application not found",
        });
      }

      if (restaurantDriver.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to approve drivers for this restaurant",
        });
      }

      if (restaurantDriver.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve application with status "${restaurantDriver.status}"`,
        });
      }

      const now = new Date();

      const updated = await ctx.db.restaurantDrivers.update({
        where: { id: input.restaurantDriverId },
        data: {
          status: "approved",
          approvedAt: now,
        },
      });

      logger.info(
        `Driver ${restaurantDriver.driverId} (${restaurantDriver.driver.fullName}) approved for menu ${restaurantDriver.menuId}`,
        "drivers",
      );

      return updated;
    }),

  // ── 14. Reject a driver application ─────────────────────────
  rejectDriver: privateProcedure
    .input(
      z.object({
        restaurantDriverId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const restaurantDriver = await ctx.db.restaurantDrivers.findUnique({
        where: { id: input.restaurantDriverId },
        include: {
          menus: { select: { userId: true } },
          driver: { select: { fullName: true } },
        },
      });

      if (!restaurantDriver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver application not found",
        });
      }

      if (restaurantDriver.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to reject drivers for this restaurant",
        });
      }

      if (restaurantDriver.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reject application with status "${restaurantDriver.status}"`,
        });
      }

      const updated = await ctx.db.restaurantDrivers.update({
        where: { id: input.restaurantDriverId },
        data: {
          status: "rejected",
          notes: input.reason
            ? sanitizeString(input.reason)
            : restaurantDriver.notes,
        },
      });

      logger.info(
        `Driver ${restaurantDriver.driverId} (${restaurantDriver.driver.fullName}) rejected for menu ${restaurantDriver.menuId}`,
        "drivers",
      );

      return updated;
    }),

  // ── 15. Set driver priority for restaurant ──────────────────
  setDriverPriority: privateProcedure
    .input(
      z.object({
        restaurantDriverId: z.string().uuid(),
        priority: z.number().int().min(0).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const restaurantDriver = await ctx.db.restaurantDrivers.findUnique({
        where: { id: input.restaurantDriverId },
        include: {
          menus: { select: { userId: true } },
        },
      });

      if (!restaurantDriver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant-driver link not found",
        });
      }

      if (restaurantDriver.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to set driver priority for this restaurant",
        });
      }

      if (restaurantDriver.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only set priority for approved drivers",
        });
      }

      const updated = await ctx.db.restaurantDrivers.update({
        where: { id: input.restaurantDriverId },
        data: {
          priority: input.priority,
        },
      });

      logger.info(
        `Driver ${restaurantDriver.driverId} priority set to ${input.priority} for menu ${restaurantDriver.menuId}`,
        "drivers",
      );

      return updated;
    }),

  // ── 16. Check phone availability (public) ─────────────────
  checkPhoneAvailable: publicProcedure
    .input(
      z.object({
        phone: z.string().min(5).max(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);

      const { success } = rateLimit({
        key: `driver-phone-check:${ipHash}`,
        limit: 20,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
        });
      }

      const existing = await ctx.db.drivers.findFirst({
        where: { phone: input.phone },
        select: { id: true },
      });

      return { available: !existing };
    }),

  // ── 17. Upload document (private) ─────────────────────────
  uploadDocument: privateProcedure
    .input(
      z.object({
        documentType: z.enum([
          "cnie_front",
          "cnie_back",
          "passport",
          "driving_license",
        ]),
        documentUrl: z.string().url().max(2048),
        expiresAt: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found. Please register first.",
        });
      }

      // Upsert: replace existing document of same type
      const existing = await ctx.db.driverDocuments.findFirst({
        where: {
          driverId: driver.id,
          documentType: input.documentType,
        },
        select: { id: true },
      });

      if (existing) {
        const updated = await ctx.db.driverDocuments.update({
          where: { id: existing.id },
          data: {
            documentUrl: input.documentUrl,
            status: "pending",
            reviewerNotes: null,
            submittedAt: new Date(),
            reviewedAt: null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          },
        });

        logger.info(
          `Driver ${driver.id} re-uploaded document: ${input.documentType}`,
          "drivers",
        );

        return updated;
      }

      const doc = await ctx.db.driverDocuments.create({
        data: {
          driverId: driver.id,
          documentType: input.documentType,
          documentUrl: input.documentUrl,
          status: "pending",
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      });

      logger.info(
        `Driver ${driver.id} uploaded document: ${input.documentType}`,
        "drivers",
      );

      return doc;
    }),

  // ── 18. Get application status (public) ───────────────────
  getApplicationStatus: publicProcedure
    .input(
      z.object({
        phone: z.string().min(5).max(20).optional(),
        email: z.string().email().max(255).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);

      const { success } = rateLimit({
        key: `driver-status-check:${ipHash}`,
        limit: 10,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
        });
      }

      if (!input.phone && !input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a phone number or email address",
        });
      }

      const driver = await ctx.db.drivers.findFirst({
        where: {
          OR: [
            ...(input.phone ? [{ phone: input.phone }] : []),
            ...(input.email
              ? [{ email: input.email.toLowerCase().trim() }]
              : []),
          ],
        },
        select: {
          id: true,
          fullName: true,
          status: true,
          backgroundCheckStatus: true,
          onboardingStep: true,
          createdAt: true,
          documents: {
            select: {
              documentType: true,
              status: true,
              reviewerNotes: true,
            },
          },
        },
      });

      if (!driver) {
        return { found: false as const };
      }

      return {
        found: true as const,
        id: driver.id,
        fullName: driver.fullName,
        status: driver.status,
        backgroundCheckStatus: driver.backgroundCheckStatus,
        onboardingStep: driver.onboardingStep,
        createdAt: driver.createdAt,
        documents: driver.documents,
      };
    }),

  // ── 19. Update driver status (admin only) ─────────────────
  updateDriverStatus: adminProcedure
    .input(
      z.object({
        driverId: z.string().uuid(),
        status: z.enum(["pending", "active", "suspended", "rejected"]),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const driver = await ctx.db.drivers.findUnique({
        where: { id: input.driverId },
        select: { id: true, fullName: true, status: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver not found",
        });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: now,
      };

      if (input.status === "active") {
        updateData.onboardingCompletedAt = now;
        updateData.backgroundCheckStatus = "approved";
      }

      if (input.status === "rejected") {
        updateData.backgroundCheckStatus = "rejected";
        updateData.isAvailable = false;
      }

      if (input.status === "suspended") {
        updateData.isAvailable = false;
      }

      const updated = await ctx.db.drivers.update({
        where: { id: input.driverId },
        data: updateData,
      });

      logger.info(
        `Admin ${ctx.user.id} updated driver ${driver.id} (${driver.fullName}) status: ${driver.status} -> ${input.status}${input.reason ? ` (reason: ${sanitizeString(input.reason)})` : ""}`,
        "drivers",
      );

      return {
        id: updated.id,
        fullName: updated.fullName,
        status: updated.status,
      };
    }),

  // ── 20. Get payout summary ─────────────────────────────────
  getPayoutSummary: privateProcedure.query(async ({ ctx }) => {
    const driver = await ctx.db.drivers.findFirst({
      where: { userId: ctx.user.id },
      select: { id: true, totalEarnings: true },
    });

    if (!driver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    }

    const now = new Date();

    // Start of today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Start of this week (Monday)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Start of this month
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayAgg, weekAgg, monthAgg, unpaidAgg] = await Promise.all([
      ctx.db.driverEarnings.aggregate({
        where: {
          driverId: driver.id,
          createdAt: { gte: todayStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      ctx.db.driverEarnings.aggregate({
        where: {
          driverId: driver.id,
          createdAt: { gte: weekStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      ctx.db.driverEarnings.aggregate({
        where: {
          driverId: driver.id,
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // All earnings currently "unpaid" — no payout system yet
      ctx.db.driverEarnings.aggregate({
        where: { driverId: driver.id },
        _sum: { amount: true },
      }),
    ]);

    return {
      todayEarnings: todayAgg._sum.amount ?? 0,
      todayDeliveries: todayAgg._count,
      weekEarnings: weekAgg._sum.amount ?? 0,
      weekDeliveries: weekAgg._count,
      monthEarnings: monthAgg._sum.amount ?? 0,
      monthDeliveries: monthAgg._count,
      unpaidTotal: unpaidAgg._sum.amount ?? 0,
      lifetimeTotal: driver.totalEarnings ?? 0,
    };
  }),

  // ── 21. Request a payout ──────────────────────────────────
  requestPayout: privateProcedure
    .input(
      z.object({
        amount: z.number().int().min(1000), // Min 10 MAD = 1000 centimes
        method: z
          .enum(["bank_transfer", "mobile_wallet", "cash"])
          .default("bank_transfer"),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `payout-request:${ctx.user.id}`,
        limit: 3,
        windowMs: 24 * 60 * 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Maximum 3 payout requests per day",
        });
      }

      const driver = await ctx.db.drivers.findFirst({
        where: { userId: ctx.user.id },
        select: { id: true, fullName: true, totalEarnings: true },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found",
        });
      }

      if ((driver.totalEarnings ?? 0) < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance for this payout amount",
        });
      }

      // Log payout request — actual payment integration comes later
      logger.info(
        `Payout requested: driver ${driver.id} (${driver.fullName}), amount ${input.amount} centimes via ${input.method}`,
        "drivers",
      );

      return {
        success: true,
        message:
          "Payout request received. Processing will begin within 24-48 hours.",
        amount: input.amount,
        method: input.method,
        estimatedArrival: "24-48 hours",
      };
    }),

  // ── 22. Get driver applications (admin only) ──────────────
  getDriverApplications: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "active", "suspended", "rejected"])
          .optional(),
        city: z.string().max(100).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause: Record<string, unknown> = {};

      if (input.status) {
        whereClause.status = input.status;
      }

      if (input.city) {
        whereClause.city = input.city;
      }

      const drivers = await ctx.db.drivers.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          city: true,
          vehicleType: true,
          vehiclePlate: true,
          vehicleMake: true,
          licenseNumber: true,
          idNumber: true,
          nationalIdType: true,
          nationalIdExpiry: true,
          insuranceExpiry: true,
          dateOfBirth: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          profilePhotoUrl: true,
          status: true,
          backgroundCheckStatus: true,
          onboardingStep: true,
          rating: true,
          totalDeliveries: true,
          totalEarnings: true,
          createdAt: true,
          updatedAt: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              documentUrl: true,
              status: true,
              reviewerNotes: true,
              submittedAt: true,
              expiresAt: true,
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

      if (drivers.length > input.limit) {
        const nextItem = drivers.pop();

        nextCursor = nextItem?.id;
      }

      // Get counts for each status
      const [pendingCount, activeCount, rejectedCount, totalCount] =
        await Promise.all([
          ctx.db.drivers.count({ where: { status: "pending" } }),
          ctx.db.drivers.count({ where: { status: "active" } }),
          ctx.db.drivers.count({ where: { status: "rejected" } }),
          ctx.db.drivers.count(),
        ]);

      return {
        drivers,
        nextCursor,
        counts: {
          pending: pendingCount,
          active: activeCount,
          rejected: rejectedCount,
          total: totalCount,
        },
      };
    }),
});
