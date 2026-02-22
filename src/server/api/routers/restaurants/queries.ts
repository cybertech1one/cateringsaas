import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { cache } from "~/server/cache";
import {
  verifyRestaurantOwner,
  verifyLocationOwner,
} from "./_shared";

export const queriesRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // Menu <-> Location linking
  // -------------------------------------------------------------------------

  /** Link an existing menu to a restaurant and location. IDOR-protected. */
  linkMenuToLocation: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        restaurantId: z.string().uuid(),
        locationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the restaurant
      await verifyRestaurantOwner(ctx.db, input.restaurantId, ctx.user.id);

      // Verify user owns the location and it belongs to this restaurant
      const location = await verifyLocationOwner(ctx.db, input.locationId, ctx.user.id);

      if (location.restaurantId !== input.restaurantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Location does not belong to the specified restaurant",
        });
      }

      // Verify user owns the menu
      const menu = await ctx.db.menus.findUnique({
        where: { id: input.menuId },
        select: { userId: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found",
        });
      }

      if (menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const result = await ctx.db.menus.update({
        where: { id: input.menuId },
        data: {
          restaurantId: input.restaurantId,
          locationId: input.locationId,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  // -------------------------------------------------------------------------
  // Public endpoint
  // -------------------------------------------------------------------------

  /** Get public location info for a menu page (hours, address, phone). */
  getPublicLocationInfo: publicProcedure
    .input(z.object({ locationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const location = await ctx.db.locations.findUnique({
        where: { id: input.locationId, isActive: true },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          latitude: true,
          longitude: true,
          phone: true,
          email: true,
          timezone: true,
          operatingHours: {
            orderBy: { dayOfWeek: "asc" },
            select: {
              dayOfWeek: true,
              openTime: true,
              closeTime: true,
              isClosed: true,
            },
          },
          specialHours: {
            where: {
              date: { gte: new Date() },
            },
            orderBy: { date: "asc" },
            take: 30, // Limit to upcoming 30 entries
            select: {
              date: true,
              openTime: true,
              closeTime: true,
              isClosed: true,
              reason: true,
            },
          },
          restaurant: {
            select: {
              name: true,
              logoUrl: true,
              cuisineType: true,
            },
          },
        },
      });

      if (!location) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location not found",
        });
      }

      return location;
    }),
});
