import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { cache } from "~/server/cache";
import { logger } from "~/server/logger";

export const inventoryRouter = createTRPCRouter({
  /**
   * Get inventory status for all dishes in a menu.
   * Returns dish info with computed isLowStock flag.
   */
  getInventoryStatus: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify menu ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view inventory for this menu",
        });
      }

      const dishes = await ctx.db.dishes.findMany({
        where: { menuId: input.menuId },
        select: {
          id: true,
          menuId: true,
          categoryId: true,
          price: true,
          isSoldOut: true,
          trackInventory: true,
          stockQuantity: true,
          lowStockThreshold: true,
          dishesTranslation: {
            select: { name: true, languageId: true },
          },
          categories: {
            select: {
              id: true,
              categoriesTranslation: {
                select: { name: true, languageId: true },
              },
            },
          },
        },
        orderBy: [{ categories: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      });

      return dishes.map((dish) => {
        const isTracked = dish.trackInventory === true;
        const isLowStock =
          isTracked &&
          dish.stockQuantity !== null &&
          dish.lowStockThreshold !== null &&
          dish.stockQuantity <= dish.lowStockThreshold &&
          dish.stockQuantity > 0;

        return {
          ...dish,
          isLowStock,
        };
      });
    }),

  /**
   * Update stock level for a single dish.
   * Setting quantity to null means unlimited stock.
   * Setting quantity to 0 auto-marks the dish as sold out.
   */
  updateStockLevel: privateProcedure
    .input(
      z.object({
        dishId: z.string().uuid(),
        quantity: z.number().int().nonnegative().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify dish ownership through menu
      const dish = await ctx.db.dishes.findFirst({
        where: {
          id: input.dishId,
          menus: { userId: ctx.user.id },
        },
        select: { id: true, menuId: true },
      });

      if (!dish) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this dish",
        });
      }

      // If quantity is 0, auto-mark as sold out
      const updateData: Record<string, unknown> = {
        stockQuantity: input.quantity,
      };

      if (input.quantity === 0) {
        updateData.isSoldOut = true;
      } else if (input.quantity !== null && input.quantity > 0) {
        // If restocking, clear sold out flag
        updateData.isSoldOut = false;
      }

      const updated = await ctx.db.dishes.update({
        where: { id: input.dishId },
        data: updateData,
      });

      cache.invalidate("public:menu:");

      logger.info(
        `Inventory updated: dish ${input.dishId} -> ${input.quantity ?? "unlimited"}`,
        "inventory",
      );

      return updated;
    }),

  /**
   * Batch update stock levels for multiple dishes in a menu.
   */
  bulkUpdateStock: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        items: z
          .array(
            z.object({
              dishId: z.string().uuid(),
              quantity: z.number().int().nonnegative().nullable(),
            }),
          )
          .min(1)
          .max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify menu ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update inventory for this menu",
        });
      }

      // Batch update in a transaction
      await ctx.db.$transaction(
        input.items.map((item) => {
          const data: Record<string, unknown> = {
            stockQuantity: item.quantity,
          };

          if (item.quantity === 0) {
            data.isSoldOut = true;
          } else if (item.quantity !== null && item.quantity > 0) {
            data.isSoldOut = false;
          }

          return ctx.db.dishes.update({
            where: { id: item.dishId, menuId: input.menuId },
            data,
          });
        }),
      );

      cache.invalidate("public:menu:");

      logger.info(
        `Bulk inventory update: ${input.items.length} dishes in menu ${input.menuId}`,
        "inventory",
      );

      return { success: true, updated: input.items.length };
    }),

  /**
   * Toggle inventory tracking on/off for a dish.
   */
  toggleTrackInventory: privateProcedure
    .input(
      z.object({
        dishId: z.string().uuid(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify dish ownership through menu
      const dish = await ctx.db.dishes.findFirst({
        where: {
          id: input.dishId,
          menus: { userId: ctx.user.id },
        },
        select: { id: true },
      });

      if (!dish) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this dish",
        });
      }

      const updated = await ctx.db.dishes.update({
        where: { id: input.dishId },
        data: { trackInventory: input.enabled },
      });

      cache.invalidate("public:menu:");

      logger.info(
        `Inventory tracking ${input.enabled ? "enabled" : "disabled"} for dish ${input.dishId}`,
        "inventory",
      );

      return updated;
    }),
});
