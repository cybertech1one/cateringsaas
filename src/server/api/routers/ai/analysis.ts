import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import {
  detectAllergens,
  suggestPricing,
  optimizeMenu,
  generateMenuScore,
} from "~/server/ai/prompts";
import {
  getUserAIConfig,
  logAIUsage,
  enforceRateLimit,
  verifyMenuOwnership,
  getProviderOrThrow,
  VALID_ALLERGENS,
} from "./_shared";

export const aiAnalysisRouter = createTRPCRouter({
  detectAllergens: privateProcedure
    .input(
      z.object({
        dishName: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "detectAllergens", 30);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      const prompt = detectAllergens(input.dishName, input.description);
      const result = await provider.generateText(prompt, config.model, { temperature: 0.2 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "detectAllergens", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);

        if (!jsonMatch) throw new Error("No JSON array found");

        const parsed = JSON.parse(jsonMatch[0]) as unknown[];

        if (!Array.isArray(parsed)) throw new Error("Response is not an array");

        return {
          allergens: parsed.filter(
            (item): item is string =>
              typeof item === "string" && (VALID_ALLERGENS as readonly string[]).includes(item),
          ),
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse allergen detection from AI response.",
        });
      }
    }),

  suggestPricing: privateProcedure
    .input(
      z.object({
        dishName: z.string().min(1).max(200),
        category: z.string().max(200).optional(),
        cuisineType: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "suggestPricing", 20);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      const prompt = suggestPricing(input.dishName, input.category, input.cuisineType);
      const result = await provider.generateText(prompt, config.model, { temperature: 0.3 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "suggestPricing", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("No JSON found");

        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

        return {
          lowPrice: typeof parsed.lowPrice === "number" ? Math.round(parsed.lowPrice) : null,
          highPrice: typeof parsed.highPrice === "number" ? Math.round(parsed.highPrice) : null,
          suggestedPrice: typeof parsed.suggestedPrice === "number" ? Math.round(parsed.suggestedPrice) : null,
          confidence: ["low", "medium", "high"].includes(parsed.confidence as string)
            ? (parsed.confidence as "low" | "medium" | "high")
            : "low",
          reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse pricing suggestion from AI response.",
        });
      }
    }),

  optimizeMenu: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "optimizeMenu", 5);

      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const categories = await ctx.db.categories.findMany({
        where: { menuId: input.menuId },
        include: { categoriesTranslation: true },
      });

      const dishes = await ctx.db.dishes.findMany({
        where: { menuId: input.menuId },
        include: { dishesTranslation: true },
      });

      const categoryNames = categories.flatMap((c) =>
        c.categoriesTranslation.map((t) => t.name),
      );

      const dishData = dishes.map((d) => {
        const firstTranslation = d.dishesTranslation[0];

        return {
          name: firstTranslation?.name ?? "Unnamed dish",
          price: d.price,
          description: firstTranslation?.description ?? undefined,
        };
      });

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      const prompt = optimizeMenu({ categories: categoryNames, dishes: dishData });
      const result = await provider.generateText(prompt, config.model, { temperature: 0.4 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "optimizeMenu", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("No JSON found");

        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

        return {
          overallScore: typeof parsed.overallScore === "number" ? parsed.overallScore : 0,
          pricingSuggestions: Array.isArray(parsed.pricingSuggestions) ? parsed.pricingSuggestions : [],
          descriptionSuggestions: Array.isArray(parsed.descriptionSuggestions) ? parsed.descriptionSuggestions : [],
          missingCategories: Array.isArray(parsed.missingCategories) ? parsed.missingCategories : [],
          namingSuggestions: Array.isArray(parsed.namingSuggestions) ? parsed.namingSuggestions : [],
          generalTips: Array.isArray(parsed.generalTips) ? parsed.generalTips : [],
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse menu optimization from AI response.",
        });
      }
    }),

  getMenuScore: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "getMenuScore", 10);

      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const menu = await ctx.db.menus.findUnique({
        where: { id: input.menuId },
        include: {
          categories: true,
          dishes: {
            include: {
              dishesTranslation: true,
              dishesTag: true,
            },
          },
          menuLanguages: true,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found.",
        });
      }

      const totalDishes = menu.dishes.length;
      const hasDescriptions = menu.dishes.some((d) =>
        d.dishesTranslation.some((t) => t.description && t.description.length > 0),
      );
      const hasImages = menu.dishes.some((d) => d.pictureUrl !== null);
      const hasAllergens = menu.dishes.some((d) => d.dishesTag.length > 0);
      const hasNutrition = menu.dishes.some(
        (d) => d.calories !== null || d.protein !== null || d.carbohydrates !== null || d.fats !== null,
      );
      const languageCount = menu.menuLanguages.length;
      const categoryCount = menu.categories.length;

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      const prompt = generateMenuScore({
        totalDishes,
        hasDescriptions,
        hasImages,
        hasAllergens,
        hasNutrition,
        languageCount,
        categoryCount,
      });
      const result = await provider.generateText(prompt, config.model, { temperature: 0.3 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "getMenuScore", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("No JSON found");

        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        const breakdown = (parsed.breakdown ?? {}) as Record<string, unknown>;

        return {
          score: typeof parsed.score === "number" ? Math.round(parsed.score) : 0,
          breakdown: {
            dishCount: typeof breakdown.dishCount === "number" ? Math.round(breakdown.dishCount) : 0,
            descriptions: typeof breakdown.descriptions === "number" ? Math.round(breakdown.descriptions) : 0,
            images: typeof breakdown.images === "number" ? Math.round(breakdown.images) : 0,
            allergens: typeof breakdown.allergens === "number" ? Math.round(breakdown.allergens) : 0,
            nutrition: typeof breakdown.nutrition === "number" ? Math.round(breakdown.nutrition) : 0,
            languages: typeof breakdown.languages === "number" ? Math.round(breakdown.languages) : 0,
            categories: typeof breakdown.categories === "number" ? Math.round(breakdown.categories) : 0,
          },
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions.filter((s): s is string => typeof s === "string")
            : [],
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse menu score from AI response.",
        });
      }
    }),
});
