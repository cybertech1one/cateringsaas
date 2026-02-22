import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { addDishValidationSchema } from "~/pageComponents/MenuCreator/molecules/DishForm/DishForm.schema";
import { dishVariantValidationSchema } from "~/pageComponents/MenuCreator/molecules/VariantForm/VariantForm.schema";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { cache } from "~/server/cache";
import { logger } from "~/server/logger";
import { checkTierLimit } from "~/server/tierCheck";
import { generateDishImagePath } from "~/server/supabase/storagePaths";
import {
  storageBucketsNames,
  supabase,
} from "~/server/supabase/supabaseClient";
import { asOptionalField } from "~/utils/utils";

export const dishesRouter = createTRPCRouter({
  upsertDish: privateProcedure
    .input(addDishValidationSchema.extend({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Tier check: only enforce when creating a new dish (no id means create)
      if (!input.id) {
        const tierResult = await checkTierLimit(ctx.db, ctx.user.id, "dish", input.menuId);

        if (!tierResult.allowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Free plan limit: ${tierResult.limit} dishes per menu. Upgrade to Pro for unlimited dishes.`,
          });
        }
      }

      const result = await ctx.db.dishes.upsert({
        where: {
          id: input.id || "00000000-0000-0000-0000-000000000000",
          menus: {
            userId: ctx.user.id,
            id: input.menuId,
          },
        },
        create: {
          price: input.price * 100,
          menuId: input.menuId,
          categoryId: input.categoryId || null,
          dishesTranslation: {
            createMany: {
              data: input.translatedDishData.map((translation) => ({
                description: translation.description,
                languageId: translation.languageId,
                name: translation.name,
              })),
            },
          },
          carbohydrates: input.carbohydrates ?? null,
          fats: input.fats ?? null,
          protein: input.proteins ?? null,
          calories: input.calories ?? null,
          dishesTag: {
            createMany: {
              data: input.tags.map((tag) => ({
                tagName: tag,
              })),
            },
          },
        },
        update: {
          categoryId: input.categoryId || null,
          price: input.price * 100,
          carbohydrates: input.carbohydrates ?? null,
          fats: input.fats ?? null,
          protein: input.proteins ?? null,
          calories: input.calories ?? null,
          dishesTag: {
            deleteMany: {
              dishId: input.id,
            },
            createMany: {
              data: input.tags.map((tag) => ({
                tagName: tag,
              })),
            },
          },
          dishesTranslation: {
            deleteMany: {
              dishId: input.id,
            },
            createMany: {
              data: input.translatedDishData.map((translation) => ({
                description: translation.description,
                languageId: translation.languageId,
                name: translation.name,
              })),
            },
          },
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  updateDishImageUrl: privateProcedure
    .input(
      z.object({
        dishId: z.string().uuid(),
        imageUrl: asOptionalField(z.string().url()).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.imageUrl === null) {
        const dishesPromise = ctx.db.dishes.update({
          where: {
            id: input.dishId,
            menus: {
              userId: ctx.user.id,
            },
          },
          data: {
            pictureUrl: null,
          },
        });

        const imagePromise = supabase()
          .storage.from(storageBucketsNames.menus)
          .remove([
            generateDishImagePath({
              dishId: input.dishId,
              userId: ctx.user.id,
            }),
          ]);

        const [imageResult, dishResult] = await Promise.all([imagePromise, dishesPromise]);

        if (imageResult.error) {
          logger.warn("Failed to remove dish image from storage", imageResult.error.message, "menus");
        }

        cache.invalidate("public:menu:");

        return dishResult;
      }

      const result = await ctx.db.dishes.update({
        where: {
          id: input.dishId,
          menus: {
            userId: ctx.user.id,
          },
        },
        data: {
          pictureUrl: input.imageUrl,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  upsertDishVariant: privateProcedure
    .input(dishVariantValidationSchema.extend({ dishId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.dishVariants.upsert({
        where: {
          id: input.id || "00000000-0000-0000-0000-000000000000",
          dishes: {
            menus: {
              userId: ctx.user.id,
            },
          },
        },
        create: {
          price: input.price ? input.price * 100 : null,
          variantTranslations: {
            createMany: {
              data: input.translatedVariant.map((translation) => ({
                languageId: translation.languageId,
                name: translation.name,
                description: translation.description,
              })),
            },
          },
          dishId: input.dishId,
        },
        update: {
          price: input.price ? input.price * 100 : null,
          variantTranslations: {
            deleteMany: {
              dishVariantId: input.id,
            },
            createMany: {
              data: input.translatedVariant.map((translation) => ({
                languageId: translation.languageId,
                name: translation.name,
                description: translation.description,
              })),
            },
          },
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  deleteDish: privateProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.dishes.delete({
        where: {
          id: input.dishId,
          menus: {
            userId: ctx.user.id,
          },
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  deleteVariant: privateProcedure
    .input(z.object({ variantId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.dishVariants.delete({
        where: {
          id: input.variantId,
          dishes: {
            menus: {
              userId: ctx.user.id,
            },
          },
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  /**
   * Bulk update dish sort orders within a category.
   * Used for drag-and-drop reordering.
   */
  reorderDishes: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        dishes: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int().min(0),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.$transaction(async (tx) => {
          // Verify menu ownership inside transaction
          const menu = await tx.menus.findFirst({
            where: { id: input.menuId, userId: ctx.user.id },
            select: { id: true },
          });

          if (!menu) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
          }

          // Update all dish sort orders
          await Promise.all(
            input.dishes.map((dish) =>
              tx.dishes.update({
                where: { id: dish.id, menuId: input.menuId },
                data: { sortOrder: dish.sortOrder },
              }),
            ),
          );
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reorder dishes. One or more dish IDs may be invalid.",
        });
      }

      cache.invalidate("public:menu:");

      return { success: true };
    }),

  /**
   * Bulk toggle sold-out status for multiple dishes at once.
   */
  bulkToggleSoldOut: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        dishIds: z.array(z.string().uuid()),
        isSoldOut: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      await ctx.db.dishes.updateMany({
        where: {
          id: { in: input.dishIds },
          menuId: input.menuId,
        },
        data: { isSoldOut: input.isSoldOut },
      });

      cache.invalidate("public:menu:");

      return { success: true, updated: input.dishIds.length };
    }),
});
