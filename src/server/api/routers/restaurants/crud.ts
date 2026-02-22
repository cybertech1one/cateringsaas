import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import {
  restaurantCreateSchema,
  restaurantUpdateSchema,
  verifyRestaurantOwner,
} from "./_shared";

export const restaurantCrudRouter = createTRPCRouter({
  /** Get all restaurants for the current user with location count. */
  getRestaurants: privateProcedure.query(async ({ ctx }) => {
    const restaurants = await ctx.db.restaurants.findMany({
      where: { userId: ctx.user.id },
      include: {
        _count: {
          select: { locations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return restaurants;
  }),

  /** Get a single restaurant by ID with all locations. IDOR-protected. */
  getRestaurant: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurants.findUnique({
        where: { id: input.id },
        include: {
          locations: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      if (restaurant.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return restaurant;
    }),

  /** Create a new restaurant. Rate-limited to 10 per hour. */
  createRestaurant: privateProcedure
    .input(restaurantCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `create-restaurant:${ctx.user.id}`,
        limit: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many restaurant creation attempts. Try again later.",
        });
      }

      return ctx.db.restaurants.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          logoUrl: input.logoUrl ?? null,
          website: input.website ?? null,
          cuisineType: input.cuisineType ?? null,
          isChain: input.isChain ?? false,
        },
      });
    }),

  /** Update a restaurant. IDOR-protected. */
  updateRestaurant: privateProcedure
    .input(restaurantUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyRestaurantOwner(ctx.db, input.id, ctx.user.id);

      const { id, ...data } = input;

      return ctx.db.restaurants.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description ?? null }),
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl ?? null }),
          ...(data.website !== undefined && { website: data.website ?? null }),
          ...(data.cuisineType !== undefined && { cuisineType: data.cuisineType ?? null }),
          ...(data.isChain !== undefined && { isChain: data.isChain }),
        },
      });
    }),

  /** Delete a restaurant and all cascade-related data. IDOR-protected. */
  deleteRestaurant: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyRestaurantOwner(ctx.db, input.id, ctx.user.id);

      return ctx.db.restaurants.delete({
        where: { id: input.id },
      });
    }),
});
