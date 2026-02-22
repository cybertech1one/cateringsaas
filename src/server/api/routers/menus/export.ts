import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";

/** Shared Prisma include for full menu export data. */
const fullMenuExportInclude = {
  categories: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      categoriesTranslation: true,
      dishes: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          dishesTranslation: true,
          dishVariants: { include: { variantTranslations: true } },
          dishesTag: true,
          dishAllergens: { include: { allergen: true } },
        },
      },
    },
  },
  menuLanguages: { include: { languages: true } },
  menuThemes: true,
};

/** Map a menu theme to a serializable object. */
function mapTheme(menuThemes: {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  fontSize: string;
  layoutStyle: string;
  cardStyle: string;
  borderRadius: string;
  spacing: string;
} | null) {
  if (!menuThemes) return null;

  return {
    primaryColor: menuThemes.primaryColor,
    secondaryColor: menuThemes.secondaryColor,
    backgroundColor: menuThemes.backgroundColor,
    surfaceColor: menuThemes.surfaceColor,
    textColor: menuThemes.textColor,
    accentColor: menuThemes.accentColor,
    headingFont: menuThemes.headingFont,
    bodyFont: menuThemes.bodyFont,
    fontSize: menuThemes.fontSize,
    layoutStyle: menuThemes.layoutStyle,
    cardStyle: menuThemes.cardStyle,
    borderRadius: menuThemes.borderRadius,
    spacing: menuThemes.spacing,
  };
}

const menuIdInput = z.object({ menuId: z.string().uuid() });

export const exportRouter = createTRPCRouter({
  /**
   * Export a menu as a JSON structure for backup or import.
   * Returns all menu data including categories, dishes, translations, and variants.
   */
  exportMenu: privateProcedure
    .input(menuIdInput)
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        include: fullMenuExportInclude,
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      return {
        exportVersion: "1.0",
        exportedAt: new Date().toISOString(),
        menu: {
          name: menu.name,
          city: menu.city,
          address: menu.address,
          currency: menu.currency,
          contactNumber: menu.contactNumber,
          facebookUrl: menu.facebookUrl,
          instagramUrl: menu.instagramUrl,
          googleReviewUrl: menu.googleReviewUrl,
        },
        languages: menu.menuLanguages.map((ml) => ({
          name: ml.languages.name,
          isoCode: ml.languages.isoCode,
          isDefault: ml.isDefault,
        })),
        theme: mapTheme(menu.menuThemes),
        categories: menu.categories.map((cat) => ({
          sortOrder: cat.sortOrder,
          icon: cat.icon,
          description: cat.description,
          translations: cat.categoriesTranslation.map((ct) => ({
            languageId: ct.languageId,
            name: ct.name,
          })),
          dishes: cat.dishes.map((dish) => ({
            price: dish.price,
            carbohydrates: dish.carbohydrates,
            fats: dish.fats,
            protein: dish.protein,
            calories: dish.calories,
            weight: dish.weight,
            isFeatured: dish.isFeatured,
            prepTimeMinutes: dish.prepTimeMinutes,
            tags: dish.dishesTag.map((t) => t.tagName),
            allergens: dish.dishAllergens.map((da) => ({
              name: da.allergen.name,
              type: da.allergen.type,
              severity: da.severity,
            })),
            translations: dish.dishesTranslation.map((dt) => ({
              languageId: dt.languageId,
              name: dt.name,
              description: dt.description,
            })),
            variants: dish.dishVariants.map((v) => ({
              price: v.price,
              translations: v.variantTranslations.map((vt) => ({
                languageId: vt.languageId,
                name: vt.name,
                description: vt.description,
              })),
            })),
          })),
        })),
      };
    }),

  /**
   * Export a menu as a CSV string.
   */
  exportMenuCSV: privateProcedure
    .input(menuIdInput)
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: {
          currency: true,
          categories: {
            orderBy: { sortOrder: "asc" },
            include: {
              categoriesTranslation: true,
              dishes: {
                orderBy: { sortOrder: "asc" },
                include: {
                  dishesTranslation: true,
                  dishesTag: true,
                  dishAllergens: { include: { allergen: true } },
                },
              },
            },
          },
          dishes: {
            where: { categoryId: null },
            orderBy: { sortOrder: "asc" },
            include: {
              dishesTranslation: true,
              dishesTag: true,
              dishAllergens: { include: { allergen: true } },
            },
          },
        },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      const escapeCSV = (value: string): string => {
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      };

      const header =
        "Category,Dish Name,Description,Price,Currency,Tags,Allergens";
      const rows: string[] = [header];

      const dishToRow = (
        categoryName: string,
        dish: (typeof menu.categories)[number]["dishes"][number],
      ) => {
        const translation = dish.dishesTranslation[0];
        const name = translation?.name ?? "";
        const description = translation?.description ?? "";
        const price = (dish.price / 100).toFixed(2);
        const tags = dish.dishesTag.map((t) => t.tagName).join("; ");
        const allergens = dish.dishAllergens
          .map((a) => `${a.allergen.name} (${a.severity})`)
          .join("; ");

        return [
          escapeCSV(categoryName),
          escapeCSV(name),
          escapeCSV(description),
          escapeCSV(price),
          escapeCSV(menu.currency),
          escapeCSV(tags),
          escapeCSV(allergens),
        ].join(",");
      };

      for (const category of menu.categories) {
        const catName =
          category.categoriesTranslation[0]?.name ?? "Uncategorized";

        for (const dish of category.dishes) {
          rows.push(dishToRow(catName, dish));
        }
      }

      for (const dish of menu.dishes) {
        rows.push(dishToRow("Uncategorized", dish));
      }

      return rows.join("\n");
    }),

  /**
   * Export a menu as a full JSON structure with all details.
   */
  exportMenuJSON: privateProcedure
    .input(menuIdInput)
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        include: fullMenuExportInclude,
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
      }

      return {
        exportVersion: "1.0",
        exportedAt: new Date().toISOString(),
        menu: {
          name: menu.name,
          slug: menu.slug,
          city: menu.city,
          address: menu.address,
          currency: menu.currency,
          contactNumber: menu.contactNumber,
          isPublished: menu.isPublished,
          facebookUrl: menu.facebookUrl,
          instagramUrl: menu.instagramUrl,
          googleReviewUrl: menu.googleReviewUrl,
          backgroundImageUrl: menu.backgroundImageUrl,
          logoImageUrl: menu.logoImageUrl,
        },
        languages: menu.menuLanguages.map((ml) => ({
          name: ml.languages.name,
          isoCode: ml.languages.isoCode,
          isDefault: ml.isDefault,
        })),
        theme: mapTheme(menu.menuThemes),
        categories: menu.categories.map((cat) => ({
          sortOrder: cat.sortOrder,
          icon: cat.icon,
          description: cat.description,
          translations: cat.categoriesTranslation.map((ct) => ({
            languageId: ct.languageId,
            name: ct.name,
          })),
          dishes: cat.dishes.map((dish) => ({
            price: dish.price,
            carbohydrates: dish.carbohydrates,
            fats: dish.fats,
            protein: dish.protein,
            calories: dish.calories,
            weight: dish.weight,
            isSoldOut: dish.isSoldOut,
            isFeatured: dish.isFeatured,
            sortOrder: dish.sortOrder,
            prepTimeMinutes: dish.prepTimeMinutes,
            tags: dish.dishesTag.map((t) => t.tagName),
            allergens: dish.dishAllergens.map((da) => ({
              name: da.allergen.name,
              type: da.allergen.type,
              severity: da.severity,
            })),
            translations: dish.dishesTranslation.map((dt) => ({
              languageId: dt.languageId,
              name: dt.name,
              description: dt.description,
            })),
            variants: dish.dishVariants.map((v) => ({
              price: v.price,
              translations: v.variantTranslations.map((vt) => ({
                languageId: vt.languageId,
                name: vt.name,
                description: vt.description,
              })),
            })),
          })),
        })),
      };
    }),
});
