import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { logger } from "~/server/logger";
import {
  locationCreateSchema,
  locationUpdateSchema,
  operatingHourSchema,
  specialHourSchema,
  tableZoneCreateSchema,
  tableZoneUpdateSchema,
  verifyRestaurantOwner,
  verifyLocationOwner,
} from "./_shared";

export const locationsRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // Location CRUD
  // -------------------------------------------------------------------------

  /** Get all locations for a restaurant. IDOR-protected via restaurant ownership. */
  getLocations: privateProcedure
    .input(z.object({ restaurantId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyRestaurantOwner(ctx.db, input.restaurantId, ctx.user.id);

      return ctx.db.locations.findMany({
        where: { restaurantId: input.restaurantId },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Create a location under a restaurant. IDOR-protected. */
  createLocation: privateProcedure
    .input(locationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyRestaurantOwner(ctx.db, input.restaurantId, ctx.user.id);

      return ctx.db.locations.create({
        data: {
          restaurantId: input.restaurantId,
          name: input.name,
          address: input.address,
          city: input.city,
          state: input.state ?? null,
          country: input.country,
          postalCode: input.postalCode ?? null,
          latitude: input.latitude != null ? new Prisma.Decimal(input.latitude) : null,
          longitude: input.longitude != null ? new Prisma.Decimal(input.longitude) : null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          timezone: input.timezone ?? undefined,
          isActive: input.isActive ?? true,
        },
      });
    }),

  /** Update a location. IDOR-protected via parent restaurant. */
  updateLocation: privateProcedure
    .input(locationUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyLocationOwner(ctx.db, input.id, ctx.user.id);

      const { id, ...data } = input;

      return ctx.db.locations.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state ?? null }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode ?? null }),
          ...(data.latitude !== undefined && { latitude: data.latitude != null ? new Prisma.Decimal(data.latitude) : null }),
          ...(data.longitude !== undefined && { longitude: data.longitude != null ? new Prisma.Decimal(data.longitude) : null }),
          ...(data.phone !== undefined && { phone: data.phone ?? null }),
          ...(data.email !== undefined && { email: data.email ?? null }),
          ...(data.timezone !== undefined && { timezone: data.timezone ?? null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    }),

  /** Delete a location. IDOR-protected. */
  deleteLocation: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyLocationOwner(ctx.db, input.id, ctx.user.id);

      return ctx.db.locations.delete({
        where: { id: input.id },
      });
    }),

  // -------------------------------------------------------------------------
  // Operating Hours
  // -------------------------------------------------------------------------

  /** Set operating hours for a location (upsert all 7 days). IDOR-protected. */
  setOperatingHours: privateProcedure
    .input(
      z.object({
        locationId: z.string().uuid(),
        hours: z.array(operatingHourSchema).min(7).max(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyLocationOwner(ctx.db, input.locationId, ctx.user.id);

      // Validate uniqueness of dayOfWeek values (must cover all 7 days)
      const days = new Set(input.hours.map((h) => h.dayOfWeek));

      if (days.size !== 7) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must provide exactly one entry for each day of the week",
        });
      }

      // Helper: convert "HH:MM" string to a Date (only time part matters for @db.Time)
      const timeToDate = (time: string) => new Date(`1970-01-01T${time}:00.000Z`);

      try {
        // Use a transaction: delete all existing, then create all
        return await ctx.db.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.operatingHours.deleteMany({
            where: { locationId: input.locationId },
          });

          return tx.operatingHours.createMany({
            data: input.hours.map((h) => ({
              locationId: input.locationId,
              dayOfWeek: h.dayOfWeek,
              openTime: timeToDate(h.openTime),
              closeTime: timeToDate(h.closeTime),
              isClosed: h.isClosed,
            })),
          });
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Failed to set operating hours", error, "restaurants");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update operating hours",
        });
      }
    }),

  /** Get operating hours for a location. IDOR-protected. */
  getOperatingHours: privateProcedure
    .input(z.object({ locationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyLocationOwner(ctx.db, input.locationId, ctx.user.id);

      return ctx.db.operatingHours.findMany({
        where: { locationId: input.locationId },
        orderBy: { dayOfWeek: "asc" },
      });
    }),

  // -------------------------------------------------------------------------
  // Special Hours
  // -------------------------------------------------------------------------

  /** Add or update special hours for a location. IDOR-protected. */
  setSpecialHours: privateProcedure
    .input(specialHourSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyLocationOwner(ctx.db, input.locationId, ctx.user.id);

      if (input.id) {
        // Verify the special hour belongs to this location
        const existing = await ctx.db.specialHours.findUnique({
          where: { id: input.id },
          select: { locationId: true },
        });

        if (!existing || existing.locationId !== input.locationId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Special hours entry not found for this location",
          });
        }

        const timeToDate = (time: string) => new Date(`1970-01-01T${time}:00.000Z`);

        return ctx.db.specialHours.update({
          where: { id: input.id },
          data: {
            date: new Date(input.date),
            openTime: input.openTime ? timeToDate(input.openTime) : null,
            closeTime: input.closeTime ? timeToDate(input.closeTime) : null,
            isClosed: input.isClosed,
            reason: input.reason ?? null,
          },
        });
      }

      const timeToDate = (time: string) => new Date(`1970-01-01T${time}:00.000Z`);

      return ctx.db.specialHours.create({
        data: {
          locationId: input.locationId,
          date: new Date(input.date),
          openTime: input.openTime ? timeToDate(input.openTime) : null,
          closeTime: input.closeTime ? timeToDate(input.closeTime) : null,
          isClosed: input.isClosed,
          reason: input.reason ?? null,
        },
      });
    }),

  // -------------------------------------------------------------------------
  // Table Zones
  // -------------------------------------------------------------------------

  /** Get table zones for a location. IDOR-protected. */
  getTableZones: privateProcedure
    .input(z.object({ locationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyLocationOwner(ctx.db, input.locationId, ctx.user.id);

      return ctx.db.tableZones.findMany({
        where: { locationId: input.locationId },
        orderBy: { tableNumber: "asc" },
      });
    }),

  /** Create a table zone. IDOR-protected via parent location. */
  createTableZone: privateProcedure
    .input(tableZoneCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyLocationOwner(ctx.db, input.locationId, ctx.user.id);

      return ctx.db.tableZones.create({
        data: {
          locationId: input.locationId,
          tableNumber: input.tableNumber,
          zoneName: input.zoneName ?? undefined,
          capacity: input.capacity ?? undefined,
          isActive: input.isActive ?? true,
          qrCodeUrl: input.qrCodeUrl ?? undefined,
        },
      });
    }),

  /** Update a table zone. IDOR-protected. */
  updateTableZone: privateProcedure
    .input(tableZoneUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const zone = await ctx.db.tableZones.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          locationId: true,
          location: { select: { restaurant: { select: { userId: true } } } },
        },
      });

      if (!zone) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table zone not found",
        });
      }

      if (zone.location.restaurant.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const { id, ...data } = input;

      return ctx.db.tableZones.update({
        where: { id },
        data: {
          ...(data.tableNumber !== undefined && { tableNumber: data.tableNumber }),
          ...(data.zoneName !== undefined && { zoneName: data.zoneName ?? null }),
          ...(data.capacity !== undefined && { capacity: data.capacity ?? null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.qrCodeUrl !== undefined && { qrCodeUrl: data.qrCodeUrl ?? null }),
        },
      });
    }),

  /** Delete a table zone. IDOR-protected. */
  deleteTableZone: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const zone = await ctx.db.tableZones.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          location: { select: { restaurant: { select: { userId: true } } } },
        },
      });

      if (!zone) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table zone not found",
        });
      }

      if (zone.location.restaurant.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return ctx.db.tableZones.delete({
        where: { id: input.id },
      });
    }),
});
