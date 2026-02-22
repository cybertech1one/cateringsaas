import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@prisma/client";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared Zod schemas
// ---------------------------------------------------------------------------

export const restaurantCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().max(2048).optional(),
  website: z.string().url().max(2048).optional(),
  cuisineType: z.string().max(100).optional(),
  isChain: z.boolean().optional(),
});

export const restaurantUpdateSchema = restaurantCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const locationCreateSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(200),
  state: z.string().max(200).optional(),
  country: z.string().min(1).max(200),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(320).optional(),
  timezone: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const locationUpdateSchema = locationCreateSchema
  .omit({ restaurantId: true })
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export const dayOfWeekEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const operatingHourSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  openTime: z.string().max(10), // e.g. "09:00"
  closeTime: z.string().max(10), // e.g. "22:00"
  isClosed: z.boolean(),
});

export const specialHourSchema = z.object({
  id: z.string().uuid().optional(), // omit for create, supply for update
  locationId: z.string().uuid(),
  date: z.string().max(10), // ISO date "YYYY-MM-DD"
  openTime: z.string().max(10).optional(),
  closeTime: z.string().max(10).optional(),
  isClosed: z.boolean(),
  reason: z.string().max(500).optional(),
});

export const tableZoneCreateSchema = z.object({
  locationId: z.string().uuid(),
  tableNumber: z.string().min(1).max(50),
  zoneName: z.string().max(200).optional(),
  capacity: z.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
  qrCodeUrl: z.string().url().max(2048).optional(),
});

export const tableZoneUpdateSchema = tableZoneCreateSchema
  .omit({ locationId: true })
  .partial()
  .extend({
    id: z.string().uuid(),
  });

// ---------------------------------------------------------------------------
// Ownership helpers
// ---------------------------------------------------------------------------

/**
 * Verify the current user owns the restaurant. Throws FORBIDDEN on mismatch.
 */
export async function verifyRestaurantOwner(
  db: PrismaClient,
  restaurantId: string,
  userId: string,
) {
  const restaurant = await db.restaurants.findUnique({
    where: { id: restaurantId },
    select: { userId: true },
  });

  if (!restaurant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Restaurant not found",
    });
  }

  if (restaurant.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  return restaurant;
}

/**
 * Verify the current user owns the location (via its parent restaurant).
 * Returns the location record on success.
 */
export async function verifyLocationOwner(
  db: PrismaClient,
  locationId: string,
  userId: string,
) {
  const location = await db.locations.findUnique({
    where: { id: locationId },
    select: { id: true, restaurantId: true, restaurant: { select: { userId: true } } },
  });

  if (!location) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Location not found",
    });
  }

  if (location.restaurant.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  return location;
}
