import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { addCategoryValidationSchema } from "~/pageComponents/MenuCreator/molecules/CategoryForm/CategoryForm.schema";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { cache } from "~/server/cache";
import { checkTierLimit } from "~/server/tierCheck";

export const categoriesRouter = createTRPCRouter({
  getDishesByCategory: privateProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.categories.findMany({
        where: {
          menus: {
            slug: input.slug,
            userId: ctx.user.id,
          },
        },
        include: {
          dishes: {
            select: {
              id: true,
              dishesTranslation: true,
              price: true,
              categories: true,
              pictureUrl: true,
            },
          },
        },
      });
    }),

  upsertCategory: privateProcedure
    .input(addCategoryValidationSchema.extend({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Tier check: only enforce when creating a new category (no id means create)
      if (!input.id) {
        const tierResult = await checkTierLimit(ctx.db, ctx.user.id, "category", input.menuId);

        if (!tierResult.allowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Free plan limit: ${tierResult.limit} categories per menu. Upgrade to Pro for unlimited categories.`,
          });
        }
      }

      const result = await ctx.db.categories.upsert({
        where: {
          id: input.id || "00000000-0000-0000-0000-000000000000",
          menus: {
            userId: ctx.user.id,
          },
        },
        create: {
          menuId: input.menuId,
          categoriesTranslation: {
            createMany: {
              data: input.translatedCategoriesData.map((translation) => ({
                languageId: translation.languageId,
                name: translation.name,
              })),
            },
          },
        },
        update: {
          categoriesTranslation: {
            deleteMany: {
              categoryId: input.id,
            },
            createMany: {
              data: input.translatedCategoriesData.map((translation) => ({
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

  getCategoriesBySlug: privateProcedure
    .input(z.object({ menuSlug: z.string().max(200) }))
    .query(({ ctx, input }) => {
      return ctx.db.categories.findMany({
        where: {
          menus: {
            slug: input.menuSlug,
            userId: ctx.user.id,
          },
        },
        select: {
          id: true,
          categoriesTranslation: {
            select: {
              name: true,
              languageId: true,
            },
          },
        },
      });
    }),

  deleteCategory: privateProcedure
    .input(z.object({ categoryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.categories.delete({
        where: {
          id: input.categoryId,
          menus: {
            userId: ctx.user.id,
          },
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  /**
   * Bulk update category sort orders.
   * Used for drag-and-drop reordering.
   */
  reorderCategories: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        categories: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int().min(0),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify menu ownership via a category in this menu
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      try {
        await ctx.db.$transaction(
          input.categories.map((cat) =>
            ctx.db.categories.update({
              where: { id: cat.id, menuId: input.menuId },
              data: { sortOrder: cat.sortOrder },
            }),
          ),
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reorder categories. One or more category IDs may be invalid.",
        });
      }

      cache.invalidate("public:menu:");

      return { success: true };
    }),
});
