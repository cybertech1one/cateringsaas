import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";

export const favoritesRouter = createTRPCRouter({
  /**
   * Toggle a dish as favorite for a customer session (public).
   * If the favorite already exists, it is removed; otherwise it is created.
   * Rate limited to 30 per minute per session.
   */
  toggleFavorite: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        dishId: z.string().uuid(),
        sessionId: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `toggle-favorite:${input.sessionId}`,
        limit: 30,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      // Check if the favorite already exists
      const existing = await ctx.db.customerFavorites.findFirst({
        where: {
          menuId: input.menuId,
          dishId: input.dishId,
          sessionId: input.sessionId,
        },
      });

      if (existing) {
        // Remove the favorite
        await ctx.db.customerFavorites.delete({
          where: { id: existing.id },
        });

        return { favorited: false, dishId: input.dishId };
      }

      // Add the favorite
      await ctx.db.customerFavorites.create({
        data: {
          menuId: input.menuId,
          dishId: input.dishId,
          sessionId: input.sessionId,
        },
      });

      return { favorited: true, dishId: input.dishId };
    }),

  /**
   * Get all favorites for a customer session on a menu (public).
   */
  getFavorites: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        sessionId: z.string().min(1).max(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.customerFavorites.findMany({
        where: {
          menuId: input.menuId,
          sessionId: input.sessionId,
        },
        select: {
          id: true,
          dishId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /**
   * Get the most favorited dishes for a menu (public).
   * Returns dishes ranked by favorite count.
   */
  getPopularDishes: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const grouped = await ctx.db.customerFavorites.groupBy({
        by: ["dishId"],
        where: { menuId: input.menuId },
        _count: { dishId: true },
        orderBy: { _count: { dishId: "desc" } },
        take: input.limit,
      });

      if (grouped.length === 0) {
        return [];
      }

      // Fetch dish details for the popular dishes
      const dishIds = grouped.map((g) => g.dishId);
      const dishes = await ctx.db.dishes.findMany({
        where: { id: { in: dishIds } },
        select: {
          id: true,
          price: true,
          pictureUrl: true,
          dishesTranslation: {
            select: {
              name: true,
              description: true,
              languageId: true,
            },
          },
        },
      });

      // Merge counts with dish details, preserving the popularity order
      const dishMap = new Map(dishes.map((d) => [d.id, d]));

      return grouped.map((g) => ({
        dish: dishMap.get(g.dishId) ?? null,
        favoriteCount: g._count.dishId,
      }));
    }),
});
