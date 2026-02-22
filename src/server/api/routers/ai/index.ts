import { createTRPCRouter } from "~/server/api/trpc";
import { aiSettingsRouter } from "./settings";
import { aiGenerationRouter } from "./generation";
import { aiTranslationRouter } from "./translation";
import { aiAnalysisRouter } from "./analysis";

/**
 * Merged AI router.
 *
 * All sub-routers are merged into a single flat namespace so that
 * existing call-sites like `api.ai.generateDescription` continue to work
 * without any changes.
 */
export const aiRouter = createTRPCRouter({
  // Settings
  getAvailableProviders: aiSettingsRouter.getAvailableProviders,
  getAISettings: aiSettingsRouter.getAISettings,
  updateAISettings: aiSettingsRouter.updateAISettings,

  // Generation
  generateDescription: aiGenerationRouter.generateDescription,
  generateDescriptionSuggestions: aiGenerationRouter.generateDescriptionSuggestions,
  enhanceText: aiGenerationRouter.enhanceText,
  suggestCategory: aiGenerationRouter.suggestCategory,
  estimateNutrition: aiGenerationRouter.estimateNutrition,
  batchGenerateDescriptions: aiGenerationRouter.batchGenerateDescriptions,

  // Translation
  translateContent: aiTranslationRouter.translateContent,
  batchTranslate: aiTranslationRouter.batchTranslate,

  // Analysis (allergens, pricing, menu optimization, scoring)
  detectAllergens: aiAnalysisRouter.detectAllergens,
  suggestPricing: aiAnalysisRouter.suggestPricing,
  optimizeMenu: aiAnalysisRouter.optimizeMenu,
  getMenuScore: aiAnalysisRouter.getMenuScore,
});

// Re-export shared constants for any external consumers
export { VALID_ALLERGENS } from "./_shared";
