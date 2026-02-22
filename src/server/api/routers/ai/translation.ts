import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { getProvider } from "~/server/ai/registry";
import {
  translateContent,
  batchTranslateMenu,
} from "~/server/ai/prompts";
import {
  getUserAIConfig,
  logAIUsage,
  enforceRateLimit,
  getProviderOrThrow,
  verifyMenuOwnership,
} from "./_shared";

// ── Bulk translation types ──────────────────────────────────

interface TranslationResult {
  type: "category" | "dishName" | "dishDescription";
  entityId: string;
  targetLanguageId: string;
  success: boolean;
  error?: string;
}

const BATCH_SIZE = 10;

export const aiTranslationRouter = createTRPCRouter({
  translateContent: privateProcedure
    .input(
      z.object({
        text: z.string().min(1).max(2000),
        fromLanguage: z.string().min(1).max(50),
        toLanguage: z.string().min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "translateContent", 30);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProvider(config.provider);

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "AI provider not configured. Please set an API key.",
        });
      }

      const prompt = translateContent(input.text, input.fromLanguage, input.toLanguage);
      const result = await provider.generateText(prompt, config.model);

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "translateContent", result.tokensUsed);

      return { text: result.text.trim() };
    }),

  batchTranslate: privateProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              name: z.string().min(1).max(200),
              description: z.string().max(500).optional(),
            }),
          )
          .min(1)
          .max(50),
        fromLanguage: z.string().min(1).max(50),
        toLanguage: z.string().min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceRateLimit(ctx.user.id, "batchTranslate", 10);

      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      const prompt = batchTranslateMenu(input.items, input.fromLanguage, input.toLanguage);
      const result = await provider.generateText(prompt, config.model, { temperature: 0.3 });

      await logAIUsage(ctx.db, ctx.user.id, config.provider, config.model, "batchTranslate", result.tokensUsed);

      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);

        if (!jsonMatch) throw new Error("No JSON array found");

        const parsed = JSON.parse(jsonMatch[0]) as Array<{ name: string; description?: string }>;

        if (!Array.isArray(parsed)) throw new Error("Response is not an array");

        return {
          translations: parsed.map((item) => ({
            name: typeof item.name === "string" ? item.name : "",
            description: typeof item.description === "string" ? item.description : undefined,
          })),
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse batch translation from AI response.",
        });
      }
    }),

  bulkTranslateMenu: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        sourceLanguageId: z.string().uuid(),
        targetLanguageIds: z.array(z.string().uuid()).min(1).max(20),
        translateCategories: z.boolean().default(true),
        translateDishNames: z.boolean().default(true),
        translateDishDescriptions: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Rate limit: 5 bulk translations per hour
      enforceRateLimit(ctx.user.id, "bulkTranslateMenu", 5);

      // 2. Verify menu ownership
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      // 3. Get AI provider config
      const config = await getUserAIConfig(ctx.db, ctx.user.id);
      const provider = getProviderOrThrow(config.provider);

      // 4. Get source & target language details
      const allLanguageIds = [input.sourceLanguageId, ...input.targetLanguageIds];
      const languages = await ctx.db.languages.findMany({
        where: { id: { in: allLanguageIds } },
        select: { id: true, name: true },
      });
      const langMap = new Map(languages.map((l) => [l.id, l.name]));

      const sourceLangName = langMap.get(input.sourceLanguageId);

      if (!sourceLangName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Source language not found.",
        });
      }

      // 5. Gather categories with source translations
      const categories = input.translateCategories
        ? await ctx.db.categories.findMany({
            where: { menuId: input.menuId },
            select: {
              id: true,
              categoriesTranslation: {
                where: { languageId: input.sourceLanguageId },
                select: { name: true },
              },
            },
          })
        : [];

      // 6. Gather dishes with source translations
      const dishes = (input.translateDishNames || input.translateDishDescriptions)
        ? await ctx.db.dishes.findMany({
            where: { menuId: input.menuId },
            select: {
              id: true,
              dishesTranslation: {
                where: { languageId: input.sourceLanguageId },
                select: { name: true, description: true },
              },
            },
          })
        : [];

      // Filter to items that have source translations
      const translatableCategories = categories.filter(
        (c) => c.categoriesTranslation.length > 0 && c.categoriesTranslation[0]!.name.length > 0,
      );

      const translatableDishes = dishes.filter(
        (d) => d.dishesTranslation.length > 0 && d.dishesTranslation[0]!.name.length > 0,
      );

      // 7. Build work items: each item is a text to translate + metadata
      interface WorkItem {
        type: "category" | "dishName" | "dishDescription";
        entityId: string;
        targetLanguageId: string;
        sourceText: string;
      }

      const workItems: WorkItem[] = [];

      for (const targetLangId of input.targetLanguageIds) {
        if (!langMap.has(targetLangId)) continue;

        if (input.translateCategories) {
          for (const cat of translatableCategories) {
            workItems.push({
              type: "category",
              entityId: cat.id,
              targetLanguageId: targetLangId,
              sourceText: cat.categoriesTranslation[0]!.name,
            });
          }
        }

        if (input.translateDishNames) {
          for (const dish of translatableDishes) {
            workItems.push({
              type: "dishName",
              entityId: dish.id,
              targetLanguageId: targetLangId,
              sourceText: dish.dishesTranslation[0]!.name,
            });
          }
        }

        if (input.translateDishDescriptions) {
          for (const dish of translatableDishes) {
            const desc = dish.dishesTranslation[0]?.description;

            if (desc && desc.length > 0) {
              workItems.push({
                type: "dishDescription",
                entityId: dish.id,
                targetLanguageId: targetLangId,
                sourceText: desc,
              });
            }
          }
        }
      }

      if (workItems.length === 0) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          results: [] as TranslationResult[],
        };
      }

      // 8. Process in batches using the batch translate prompt
      const results: TranslationResult[] = [];
      let totalTokens = 0;

      // Group work items by target language for efficient batching
      const byTargetLang = new Map<string, WorkItem[]>();

      for (const item of workItems) {
        const existing = byTargetLang.get(item.targetLanguageId) ?? [];

        existing.push(item);
        byTargetLang.set(item.targetLanguageId, existing);
      }

      for (const [targetLangId, items] of byTargetLang) {
        const targetLangName = langMap.get(targetLangId);

        if (!targetLangName) continue;

        // Process in chunks of BATCH_SIZE
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          const chunk = items.slice(i, i + BATCH_SIZE);

          const batchItems = chunk.map((item) => ({
            name: item.sourceText,
          }));

          try {
            const prompt = batchTranslateMenu(batchItems, sourceLangName, targetLangName);
            const aiResult = await provider.generateText(prompt, config.model, {
              temperature: 0.3,
            });

            totalTokens += aiResult.tokensUsed;

            const jsonMatch = aiResult.text.match(/\[[\s\S]*\]/);

            if (!jsonMatch) throw new Error("No JSON array in response");

            const parsed = JSON.parse(jsonMatch[0]) as Array<{ name: string; description?: string }>;

            if (!Array.isArray(parsed)) throw new Error("Response is not an array");

            // Map results back to work items
            for (let j = 0; j < chunk.length; j++) {
              const workItem = chunk[j]!;
              const translated = parsed[j];

              if (!translated || !translated.name) {
                results.push({
                  type: workItem.type,
                  entityId: workItem.entityId,
                  targetLanguageId: workItem.targetLanguageId,
                  success: false,
                  error: "Empty translation returned",
                });
                continue;
              }

              try {
                // Upsert the translation
                if (workItem.type === "category") {
                  await ctx.db.categoriesTranslation.upsert({
                    where: {
                      categoryId_languageId: {
                        categoryId: workItem.entityId,
                        languageId: workItem.targetLanguageId,
                      },
                    },
                    update: { name: translated.name.trim() },
                    create: {
                      categoryId: workItem.entityId,
                      languageId: workItem.targetLanguageId,
                      name: translated.name.trim(),
                    },
                  });
                } else if (workItem.type === "dishName") {
                  // For dish names, upsert the translation record
                  await ctx.db.dishesTranslation.upsert({
                    where: {
                      dishId_languageId: {
                        dishId: workItem.entityId,
                        languageId: workItem.targetLanguageId,
                      },
                    },
                    update: { name: translated.name.trim() },
                    create: {
                      dishId: workItem.entityId,
                      languageId: workItem.targetLanguageId,
                      name: translated.name.trim(),
                      description: null,
                    },
                  });
                } else if (workItem.type === "dishDescription") {
                  // For descriptions, update only the description field
                  // The record may already exist from a dishName translation
                  const existing = await ctx.db.dishesTranslation.findUnique({
                    where: {
                      dishId_languageId: {
                        dishId: workItem.entityId,
                        languageId: workItem.targetLanguageId,
                      },
                    },
                  });

                  if (existing) {
                    await ctx.db.dishesTranslation.update({
                      where: {
                        dishId_languageId: {
                          dishId: workItem.entityId,
                          languageId: workItem.targetLanguageId,
                        },
                      },
                      data: { description: translated.name.trim() },
                    });
                  } else {
                    // Need to find the dish's source name for the required name field
                    const sourceTranslation = translatableDishes.find(
                      (d) => d.id === workItem.entityId,
                    );
                    const sourceName = sourceTranslation?.dishesTranslation[0]?.name ?? "";

                    await ctx.db.dishesTranslation.create({
                      data: {
                        dishId: workItem.entityId,
                        languageId: workItem.targetLanguageId,
                        name: sourceName,
                        description: translated.name.trim(),
                      },
                    });
                  }
                }

                results.push({
                  type: workItem.type,
                  entityId: workItem.entityId,
                  targetLanguageId: workItem.targetLanguageId,
                  success: true,
                });
              } catch (dbError) {
                results.push({
                  type: workItem.type,
                  entityId: workItem.entityId,
                  targetLanguageId: workItem.targetLanguageId,
                  success: false,
                  error: dbError instanceof Error ? dbError.message : "Database error",
                });
              }
            }
          } catch (batchError) {
            // If the entire batch fails, mark all items in it as failed
            for (const workItem of chunk) {
              results.push({
                type: workItem.type,
                entityId: workItem.entityId,
                targetLanguageId: workItem.targetLanguageId,
                success: false,
                error: batchError instanceof Error ? batchError.message : "Batch translation failed",
              });
            }
          }
        }
      }

      // 9. Log total AI usage
      if (totalTokens > 0) {
        await logAIUsage(
          ctx.db,
          ctx.user.id,
          config.provider,
          config.model,
          "bulkTranslateMenu",
          totalTokens,
        );
      }

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      return {
        total: results.length,
        success: successCount,
        failed: failedCount,
        results,
      };
    }),
});
