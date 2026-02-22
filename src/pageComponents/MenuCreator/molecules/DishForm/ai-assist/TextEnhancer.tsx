"use client";

import { useState } from "react";
import {
  Sparkles,
  Wand2,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { api } from "~/trpc/react";
import { useTranslation } from "react-i18next";
import { AIButton, type PricingSuggestion } from "./AIAssistShared";

// ---------------------------------------------------------------------------
// AIAssistButtons -- standalone callback-based component
// ---------------------------------------------------------------------------

interface AIAssistButtonsProps {
  dishName: string;
  description?: string;
  categoryName?: string;
  cuisineType?: string;
  language?: string;
  menuId: string;
  onDescriptionGenerated: (text: string) => void;
  onNutritionEstimated: (data: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fats: number;
  }) => void;
  onAllergensDetected: (allergens: string[]) => void;
}

export function AIAssistButtons({
  dishName,
  description,
  categoryName,
  cuisineType,
  language,
  menuId: _menuId,
  onDescriptionGenerated,
  onNutritionEstimated,
  onAllergensDetected,
}: AIAssistButtonsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const generateDesc = api.ai.generateDescription.useMutation();
  const enhanceText = api.ai.enhanceText.useMutation();
  const estimateNutrition = api.ai.estimateNutrition.useMutation();
  const detectAllergensMut = api.ai.detectAllergens.useMutation();
  const suggestPricing = api.ai.suggestPricing.useMutation();
  const { data: aiSettings } = api.ai.getAISettings.useQuery();
  const { data: providers } = api.ai.getAvailableProviders.useQuery();

  const [pricingSuggestion, setPricingSuggestion] =
    useState<PricingSuggestion | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasProviders = providers && providers.length > 0;
  const hasDishName = dishName.trim().length >= 2;
  const hasDescription = !!description && description.trim().length >= 3;

  const clearError = () => setErrorMessage(null);

  // -- Generate Description
  const handleGenerateDescription = async () => {
    clearError();

    if (!hasDishName) {
      toast({
        title: t("aiAssist.enterDishName"),
        description: t("aiAssist.enterDishNameForDescription"),
        variant: "destructive",
        duration: 3000,
      });

      return;
    }

    try {
      const result = await generateDesc.mutateAsync({
        dishName: dishName.trim(),
        category: categoryName,
        language,
        cuisineType,
      });

      onDescriptionGenerated(result.text);
    } catch {
      setErrorMessage(t("aiAssist.generationFailed"));
    }
  };

  // -- Enhance Description
  const handleEnhanceDescription = async () => {
    clearError();

    if (!hasDescription) {
      toast({
        title: t("aiAssist.noDescription"),
        description: t("aiAssist.noDescriptionHint"),
        variant: "destructive",
        duration: 3000,
      });

      return;
    }

    try {
      const result = await enhanceText.mutateAsync({
        text: description!,
        language,
      });

      onDescriptionGenerated(result.text);
    } catch {
      setErrorMessage(t("aiAssist.enhancementFailed"));
    }
  };

  // -- Estimate Nutrition
  const handleEstimateNutrition = async () => {
    clearError();

    if (!hasDishName) {
      toast({
        title: t("aiAssist.enterDishName"),
        description: t("aiAssist.enterDishNameForNutrition"),
        variant: "destructive",
        duration: 3000,
      });

      return;
    }

    try {
      const result = await estimateNutrition.mutateAsync({
        dishName: dishName.trim(),
        description: description ?? undefined,
      });

      onNutritionEstimated({
        calories: result.calories ?? 0,
        protein: result.protein ?? 0,
        carbohydrates: result.carbohydrates ?? 0,
        fats: result.fats ?? 0,
      });
    } catch {
      setErrorMessage(t("aiAssist.estimationFailed"));
    }
  };

  // -- Detect Allergens
  const handleDetectAllergens = async () => {
    clearError();

    if (!hasDishName) {
      toast({
        title: t("aiAssist.enterDishName"),
        description: t("aiAssist.enterDishNameForDescription"),
        variant: "destructive",
        duration: 3000,
      });

      return;
    }

    try {
      const result = await detectAllergensMut.mutateAsync({
        dishName: dishName.trim(),
        description: description ?? undefined,
      });

      onAllergensDetected(result.allergens);
    } catch {
      setErrorMessage(t("aiAssist.generationFailed"));
    }
  };

  // -- Suggest Pricing
  const handleSuggestPricing = async () => {
    clearError();
    setPricingSuggestion(null);

    if (!hasDishName) {
      toast({
        title: t("aiAssist.enterDishName"),
        description: t("aiAssist.enterDishNameForDescription"),
        variant: "destructive",
        duration: 3000,
      });

      return;
    }

    try {
      const result = await suggestPricing.mutateAsync({
        dishName: dishName.trim(),
        category: categoryName,
      });

      setPricingSuggestion(result);
    } catch {
      setErrorMessage(t("aiAssist.generationFailed"));
    }
  };

  if (!hasProviders) return null;

  const formatPrice = (cents: number | null) => {
    if (cents == null) return "--";

    return (cents / 100).toFixed(2);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Generate Description */}
        <AIButton
          onClick={handleGenerateDescription}
          loading={generateDesc.isLoading}
          disabled={!hasDishName}
          icon={Sparkles}
          label={t("aiAssist.generate")}
          tooltip={t("aiAssist.generateTooltip")}
        />

        {/* Enhance Description */}
        <AIButton
          onClick={handleEnhanceDescription}
          loading={enhanceText.isLoading}
          disabled={!hasDescription}
          icon={Wand2}
          label={t("aiAssist.enhance")}
          tooltip={t("aiAssist.enhanceTooltip")}
        />

        {/* Estimate Nutrition */}
        <AIButton
          onClick={handleEstimateNutrition}
          loading={estimateNutrition.isLoading}
          disabled={!hasDishName}
          icon={Activity}
          label={t("aiAssist.nutrition")}
          tooltip={t("aiAssist.nutritionTooltip")}
        />

        {/* Detect Allergens */}
        <AIButton
          onClick={handleDetectAllergens}
          loading={detectAllergensMut.isLoading}
          disabled={!hasDishName}
          icon={AlertCircle}
          label={t("aiAssist.allergens")}
          tooltip={t("aiAssist.allergensTooltip")}
        />

        {/* Suggest Pricing */}
        <AIButton
          onClick={handleSuggestPricing}
          loading={suggestPricing.isLoading}
          disabled={!hasDishName}
          icon={TrendingUp}
          label={t("aiAssist.suggestPrice")}
          tooltip={t("aiAssist.suggestPriceTooltip")}
        />

        {/* AI Provider Indicator */}
        {aiSettings && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            title={`${aiSettings.provider} / ${aiSettings.model}`}
          >
            <Sparkles className="h-2.5 w-2.5" />
            {aiSettings.model}
          </span>
        )}
      </div>

      {/* Pricing Suggestion Popover */}
      {pricingSuggestion && (
        <div className="rounded-md border border-violet-200 bg-violet-50 p-2.5 text-xs dark:border-violet-800 dark:bg-violet-950/30" aria-live="polite">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium text-violet-700 dark:text-violet-300">
              {t("aiAssist.priceSuggestion")}
            </span>
            <button
              type="button"
              onClick={() => setPricingSuggestion(null)}
              className="text-violet-400 hover:text-violet-600 dark:hover:text-violet-200"
              aria-label="Close"
            >
              x
            </button>
          </div>
          <div className="flex items-baseline gap-3 text-violet-800 dark:text-violet-200">
            <span>
              {t("aiAssist.range")}:{" "}
              {formatPrice(pricingSuggestion.lowPrice)} &ndash;{" "}
              {formatPrice(pricingSuggestion.highPrice)}
            </span>
            <span className="font-semibold">
              {t("aiAssist.suggested")}:{" "}
              {formatPrice(pricingSuggestion.suggestedPrice)}
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                pricingSuggestion.confidence === "high" &&
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                pricingSuggestion.confidence === "medium" &&
                  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                pricingSuggestion.confidence === "low" &&
                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
              )}
            >
              {pricingSuggestion.confidence}
            </span>
          </div>
          {pricingSuggestion.reasoning && (
            <p className="mt-1 text-violet-600 dark:text-violet-400">
              {pricingSuggestion.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Inline Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={clearError}
            className="ml-auto text-destructive/60 hover:text-destructive"
            aria-label="Dismiss"
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}
