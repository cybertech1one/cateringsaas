import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { logger } from "~/server/logger";
import { generateMenuSlug } from "./_shared";

export const managementRouter = createTRPCRouter({
  /**
   * Duplicate an entire menu including categories, dishes, translations, and variants.
   * The new menu is unpublished with a new slug.
   */
  duplicateMenu: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the original menu with all related data
      const original = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        include: {
          categories: {
            include: {
              categoriesTranslation: true,
              dishes: {
                include: {
                  dishesTranslation: true,
                  dishVariants: { include: { variantTranslations: true } },
                  dishesTag: true,
                },
              },
            },
          },
          menuLanguages: true,
        },
      });

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      const newSlug = generateMenuSlug({
        name: `${original.name} Copy`,
        city: original.city,
      });

      try {
        const newMenu = await ctx.db.$transaction(async (tx) => {
          // Create the new menu
          const createdMenu = await tx.menus.create({
            data: {
              name: `${original.name} (Copy)`,
              slug: newSlug,
              userId: ctx.user.id,
              city: original.city,
              address: original.address,
              currency: original.currency,
              contactNumber: original.contactNumber,
              facebookUrl: original.facebookUrl,
              instagramUrl: original.instagramUrl,
              googleReviewUrl: original.googleReviewUrl,
              backgroundImageUrl: original.backgroundImageUrl,
              logoImageUrl: original.logoImageUrl,
              isPublished: false,
              restaurantId: original.restaurantId,
              locationId: original.locationId,
            },
          });

          // Clone menu languages
          if (original.menuLanguages.length > 0) {
            await tx.menuLanguages.createMany({
              data: original.menuLanguages.map((ml) => ({
                menuId: createdMenu.id,
                languageId: ml.languageId,
                isDefault: ml.isDefault,
              })),
            });
          }

          // Clone categories + dishes + translations + variants
          for (const cat of original.categories) {
            const newCat = await tx.categories.create({
              data: {
                menuId: createdMenu.id,
                sortOrder: cat.sortOrder,
                icon: cat.icon,
                description: cat.description,
              },
            });

            // Clone category translations
            if (cat.categoriesTranslation.length > 0) {
              await tx.categoriesTranslation.createMany({
                data: cat.categoriesTranslation.map((ct) => ({
                  categoryId: newCat.id,
                  languageId: ct.languageId,
                  name: ct.name,
                })),
              });
            }

            // Clone dishes in this category
            for (const dish of cat.dishes) {
              const newDish = await tx.dishes.create({
                data: {
                  menuId: createdMenu.id,
                  categoryId: newCat.id,
                  price: dish.price,
                  pictureUrl: dish.pictureUrl,
                  carbohydrates: dish.carbohydrates,
                  fats: dish.fats,
                  protein: dish.protein,
                  calories: dish.calories,
                  weight: dish.weight,
                  isSoldOut: false,
                  isFeatured: dish.isFeatured,
                  sortOrder: dish.sortOrder,
                  prepTimeMinutes: dish.prepTimeMinutes,
                },
              });

              // Clone dish translations
              if (dish.dishesTranslation.length > 0) {
                await tx.dishesTranslation.createMany({
                  data: dish.dishesTranslation.map((dt) => ({
                    dishId: newDish.id,
                    languageId: dt.languageId,
                    name: dt.name,
                    description: dt.description,
                  })),
                });
              }

              // Clone dish variants
              for (const variant of dish.dishVariants) {
                const newVariant = await tx.dishVariants.create({
                  data: {
                    dishId: newDish.id,
                    price: variant.price,
                  },
                });

                if (variant.variantTranslations.length > 0) {
                  await tx.variantTranslations.createMany({
                    data: variant.variantTranslations.map((vt) => ({
                      dishVariantId: newVariant.id,
                      languageId: vt.languageId,
                      name: vt.name,
                      description: vt.description,
                    })),
                  });
                }
              }

              // Clone dish tags
              if (dish.dishesTag.length > 0) {
                // Tags are unique by tagName, skip duplicates
                for (const tag of dish.dishesTag) {
                  try {
                    await tx.dishesTag.create({
                      data: { dishId: newDish.id, tagName: tag.tagName },
                    });
                  } catch {
                    // Tag already exists, skip
                  }
                }
              }
            }
          }

          return createdMenu;
        });

        return newMenu;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Failed to duplicate menu", error, "menus");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to duplicate menu. Please try again.",
        });
      }
    }),

  /**
   * Get menu statistics: dish count, category count, languages, published status.
   */
  getMenuStats: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: {
          id: true,
          name: true,
          slug: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          currency: true,
          _count: {
            select: {
              categories: true,
              dishes: true,
              menuLanguages: true,
              orders: true,
              reviews: true,
            },
          },
        },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      // Get average dish price
      const priceAgg = await ctx.db.dishes.aggregate({
        where: { menuId: input.menuId },
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
      });

      // Get review stats
      const reviewAgg = await ctx.db.reviews.aggregate({
        where: { menuId: input.menuId, status: "approved" },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return {
        ...menu,
        pricing: {
          average: priceAgg._avg.price ?? 0,
          min: priceAgg._min.price ?? 0,
          max: priceAgg._max.price ?? 0,
        },
        reviews: {
          averageRating: reviewAgg._avg.rating ?? 0,
          count: reviewAgg._count.rating,
        },
      };
    }),
});
