import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { getProvider } from "~/server/ai/registry";
import {
  generateDishDescription,
  generateDescriptionSuggestions,
  enhanceDescription,
  suggestCategory,
  estimateNutrition,
  batchGenerateDescriptions,
} from "~/server/ai/prompts";
import {
  getUserAIConfig,
  logAIUsage,
  enforceRateLimit,
  getProviderOrThrow,
} from "./_shared";

export const aiGenerationRouter = createTRPCRouter({
  generateDescription: privateProcedure
    .input(
      z.object({
        dishName: z.string().min(1).max(200),
        category: z.string().max(200).optional(),
        language: z.string().max(50).optional(),
        cuisineType: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "generateDescription", 20);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProvider(config.provider);

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "AI provider not configured. Please set an API key.",
        });
      }

      const prompt = generateDishDescription(input.dishName, input.category, input.language, input.cuisineType);
      const result = await provider.generateText(prompt, config.model);

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "generateDescription", result.tokensUsed);

      return { text: result.text.trim() };
    }),

  generateDescriptionSuggestions: privateProcedure
    .input(
      z.object({
        dishName: z.string().min(1).max(200),
        category: z.string().max(200).optional(),
        language: z.string().max(50).optional(),
        cuisineType: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "generateDescriptionSuggestions", 15);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      const prompt = generateDescriptionSuggestions(
        input.dishName,
        input.category,
        input.cuisineType,
        input.language,
      );
      const result = await provider.generateText(prompt, config.model, { temperature: 0.8 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "generateDescriptionSuggestions", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);

        if (!jsonMatch) throw new Error("No JSON array found");

        const parsed = JSON.parse(jsonMatch[0]) as unknown[];

        if (!Array.isArray(parsed)) throw new Error("Response is not an array");

        const suggestions = parsed
          .filter((item): item is string => typeof item === "string" && item.length > 0)
          .slice(0, 3);

        if (suggestions.length === 0) {
          throw new Error("No valid suggestions in response");
        }

        return { suggestions };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse description suggestions from AI response.",
        });
      }
    }),

  enhanceText: privateProcedure
    .input(
      z.object({
        text: z.string().min(1).max(2000),
        language: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "enhanceText", 20);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProvider(config.provider);

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "AI provider not configured. Please set an API key.",
        });
      }

      const prompt = enhanceDescription(input.text, input.language);
      const result = await provider.generateText(prompt, config.model);

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "enhanceText", result.tokensUsed);

      return { text: result.text.trim() };
    }),

  suggestCategory: privateProcedure
    .input(
      z.object({
        dishName: z.string().min(1).max(200),
        menuId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "suggestCategory", 20);

      const categories = await ctx.db.categories.findMany({
        where: { menuId: input.menuId },
        include: { categoriesTranslation: true },
      });

      const categoryNames = categories.flatMap((c) =>
        c.categoriesTranslation.map((t) => t.name),
      );

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProvider(config.provider);

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "AI provider not configured. Please set an API key.",
        });
      }

      const prompt = suggestCategory(input.dishName, categoryNames);
      const result = await provider.generateText(prompt, config.model);

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "suggestCategory", result.tokensUsed);

      return { text: result.text.trim() };
    }),

  estimateNutrition: privateProcedure
    .input(
      z.object({
        dishName: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "estimateNutrition", 20);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProvider(config.provider);

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "AI provider not configured. Please set an API key.",
        });
      }

      const prompt = estimateNutrition(input.dishName, input.description);
      const result = await provider.generateText(prompt, config.model, { temperature: 0.3 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "estimateNutrition", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("No JSON found");

        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

        return {
          calories: typeof parsed.calories === "number" ? Math.round(parsed.calories) : null,
          protein: typeof parsed.protein === "number" ? Math.round(parsed.protein) : null,
          carbohydrates: typeof parsed.carbohydrates === "number" ? Math.round(parsed.carbohydrates) : null,
          fats: typeof parsed.fats === "number" ? Math.round(parsed.fats) : null,
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse nutrition estimates from AI response.",
        });
      }
    }),

  batchGenerateDescriptions: privateProcedure
    .input(
      z.object({
        dishes: z
          .array(
            z.object({
              name: z.string().min(1).max(200),
              category: z.string().max(200).optional(),
            }),
          )
          .min(1)
          .max(20),
        language: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "batchGenerateDescriptions", 5);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      const prompt = batchGenerateDescriptions(input.dishes, input.language);
      const result = await provider.generateText(prompt, config.model, { temperature: 0.7 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "batchGenerateDescriptions", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);

        if (!jsonMatch) throw new Error("No JSON array found");

        const parsed = JSON.parse(jsonMatch[0]) as Array<{ name: string; description: string }>;

        if (!Array.isArray(parsed)) throw new Error("Response is not an array");

        return {
          descriptions: parsed.map((item) => ({
            name: typeof item.name === "string" ? item.name : "",
            description: typeof item.description === "string" ? item.description : "",
          })),
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse batch descriptions from AI response.",
        });
      }
    }),
});
