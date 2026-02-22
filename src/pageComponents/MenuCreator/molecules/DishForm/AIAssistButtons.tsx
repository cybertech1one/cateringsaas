"use client";

// ---------------------------------------------------------------------------
// AIAssistButtons.tsx -- composition wrapper / barrel re-export
//
// All AI-assist sub-components have been extracted into the ./ai-assist/
// directory. This file preserves the original public API so that existing
// imports (e.g. from DishForm.tsx) continue to work unchanged.
// ---------------------------------------------------------------------------

export { AIAssistButtons } from "./ai-assist/TextEnhancer";
export { DescriptionAIButtons } from "./ai-assist/DescriptionGenerator";
export { TranslateAIButton } from "./ai-assist/ContentTranslator";
export { NutritionAIButton } from "./ai-assist/NutritionEstimator";
export { AIButton, type AIButtonProps, type PricingSuggestion, type NutritionData } from "./ai-assist/AIAssistShared";
