import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { verifyRestaurantOwnership } from "./_shared";

export const allergensRouter = createTRPCRouter({
  /**
   * Get all standard allergens plus custom ones for a restaurant (public).
   * If restaurantId is provided, includes custom allergens for that restaurant.
   */
  getAllergens: publicProcedure
    .input(
      z.object({ restaurantId: z.string().uuid().optional() }).default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.allergens.findMany({
        where: {
          OR: [
            { isCustom: false },
            ...(input.restaurantId
              ? [{ isCustom: true, restaurantId: input.restaurantId }]
              : []),
          ],
        },
        orderBy: [{ isCustom: "asc" }, { name: "asc" }],
      });
    }),

  /**
   * Create a custom allergen for a restaurant.
   * IDOR: verifies the restaurantId belongs to the authenticated user.
   */
  createCustomAllergen: privateProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid(),
        name: z.string().min(1).max(100),
        icon: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyRestaurantOwnership(ctx.db, input.restaurantId, ctx.user.id);

      // Check for duplicate name within this restaurant's custom allergens
      const existing = await ctx.db.allergens.findFirst({
        where: {
          name: input.name,
          restaurantId: input.restaurantId,
          isCustom: true,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A custom allergen with this name already exists",
        });
      }

      return ctx.db.allergens.create({
        data: {
          name: input.name,
          icon: input.icon ?? null,
          type: null,
          isCustom: true,
          restaurantId: input.restaurantId,
        },
      });
    }),

  /**
   * Delete a custom allergen.
   * IDOR: verifies the allergen's restaurant belongs to the authenticated user.
   */
  deleteCustomAllergen: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const allergen = await ctx.db.allergens.findUnique({
        where: { id: input.id },
        select: { isCustom: true, restaurantId: true },
      });

      if (!allergen) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Allergen not found",
        });
      }

      if (!allergen.isCustom) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a standard allergen",
        });
      }

      if (!allergen.restaurantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Custom allergen has no associated restaurant",
        });
      }

      await verifyRestaurantOwnership(
        ctx.db,
        allergen.restaurantId,
        ctx.user.id,
      );

      // Also remove any dish-allergen associations
      await ctx.db.dishAllergens.deleteMany({
        where: { allergenId: input.id },
      });

      return ctx.db.allergens.delete({
        where: { id: input.id },
      });
    }),

  /**
   * Set allergens for a dish (replace all existing associations).
   * IDOR: verifies ownership through dish -> menu -> userId chain.
   */
  setDishAllergens: privateProcedure
    .input(
      z.object({
        dishId: z.string().uuid(),
        allergens: z.array(
          z.object({
            allergenId: z.string().uuid(),
            severity: z.string().min(1).max(50).default("contains"),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through dish -> menu -> user chain
      const dish = await ctx.db.dishes.findUnique({
        where: { id: input.dishId },
        select: { menus: { select: { userId: true } } },
      });

      if (!dish) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      if (dish.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify allergens for this dish",
        });
      }

      // Use a transaction to atomically replace allergen associations
      return ctx.db.$transaction(async (tx) => {
        // Delete all existing allergen associations for this dish
        await tx.dishAllergens.deleteMany({
          where: { dishId: input.dishId },
        });

        // Create new associations if any provided
        if (input.allergens.length > 0) {
          await tx.dishAllergens.createMany({
            data: input.allergens.map((a) => ({
              dishId: input.dishId,
              allergenId: a.allergenId,
              severity: a.severity,
            })),
          });
        }

        // Return the updated dish allergens
        return tx.dishAllergens.findMany({
          where: { dishId: input.dishId },
          include: {
            allergen: true,
          },
        });
      });
    }),

  /**
   * Get allergens for a specific dish (public).
   */
  getDishAllergens: publicProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dishAllergens.findMany({
        where: { dishId: input.dishId },
        include: {
          allergen: true,
        },
      });
    }),

  /**
   * Get all allergens used across a menu, grouped by dish (public).
   */
  getMenuAllergens: publicProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get all dishes for the menu, along with their allergen associations
      const dishes = await ctx.db.dishes.findMany({
        where: { menuId: input.menuId },
        select: {
          id: true,
          dishesTranslation: {
            select: {
              name: true,
              languageId: true,
            },
          },
          dishAllergens: {
            include: {
              allergen: true,
            },
          },
        },
      });

      // Filter to only dishes that have allergens
      return dishes
        .filter((dish) => dish.dishAllergens.length > 0)
        .map((dish) => ({
          dishId: dish.id,
          dishTranslations: dish.dishesTranslation,
          allergens: dish.dishAllergens.map((da) => ({
            id: da.allergen.id,
            name: da.allergen.name,
            icon: da.allergen.icon,
            type: da.allergen.type,
            severity: da.severity,
          })),
        }));
    }),
});
