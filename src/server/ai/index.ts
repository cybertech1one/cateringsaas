/**
 * AI Module - Barrel Export
 *
 * Centralized exports for AI provider management, prompt templates,
 * and type definitions for AI-powered features.
 */

// ── Type Definitions ──────────────────────────────────────────

export type {
  AIModel,
  AIRequestOptions,
  AIResponse,
  AIProvider,
} from "./types";

// ── Provider Registry ─────────────────────────────────────────

export {
  getProvider,
  getAvailableProviders,
  getAllModels,
  isValidProviderModel,
} from "./registry";

// ── Prompt Templates ──────────────────────────────────────────

export {
  generateDishDescription,
  translateContent,
  enhanceDescription,
  suggestCategory,
  estimateNutrition,
  batchTranslateMenu,
  optimizeMenu,
  detectAllergens,
  suggestPricing,
  generateMenuScore,
  batchGenerateDescriptions,
} from "./prompts";
