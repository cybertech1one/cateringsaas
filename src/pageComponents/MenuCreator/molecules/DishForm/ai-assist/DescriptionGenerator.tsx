"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Wand2, ListChecks, Check, X } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import { useTranslation } from "react-i18next";
import { type AddDishFormValuesWithImage } from "../DishForm.schema";
import { AIButton } from "./AIAssistShared";

// ---------------------------------------------------------------------------
// DescriptionAIButtons -- form-integrated description generate, enhance,
// and smart suggestions (pick from 3 AI-generated options)
// ---------------------------------------------------------------------------

interface DescriptionAIButtonsProps {
  form: UseFormReturn<AddDishFormValuesWithImage>;
  languageIndex: number;
  languageName: string;
  categoryName?: string;
  cuisineType?: string;
  menuId?: string;
}

export function DescriptionAIButtons({
  form,
  languageIndex,
  languageName,
  categoryName,
  cuisineType,
}: DescriptionAIButtonsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const generateDesc = api.ai.generateDescription.useMutation();
  const enhanceText = api.ai.enhanceText.useMutation();
  const suggestDescs = api.ai.generateDescriptionSuggestions.useMutation();
  const { data: providers } = api.ai.getAvailableProviders.useQuery();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const hasProviders = providers && providers.length > 0;

  // Close suggestions when clicking outside
  useEffect(() => {
    if (suggestions.length === 0) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [suggestions.length]);

  const getDishName = () =>
    form.getValues(`translatedDishData.${languageIndex}.name`);

  const validateDishName = (): boolean => {
    const dishName = getDishName();

    if (!dishName || dishName.length < 2) {
      toast({
        title: t("aiAssist.enterDishName"),
        description: t("aiAssist.enterDishNameForDescription"),
        variant: "destructive",
        duration: 3000,
      });

      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    if (!validateDishName()) return;

    try {
      const result = await generateDesc.mutateAsync({
        dishName: getDishName(),
        category: categoryName,
        language: languageName,
        cuisineType,
      });

      form.setValue(
        `translatedDishData.${languageIndex}.description`,
        result.text,
        { shouldDirty: true },
      );
    } catch {
      toast({
        title: t("aiAssist.generationFailed"),
        description: t("aiAssist.generationFailedDescription"),
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleEnhance = async () => {
    const currentDesc = form.getValues(
      `translatedDishData.${languageIndex}.description`,
    );

    if (!currentDesc || currentDesc.length < 3) {
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
        text: currentDesc,
        language: languageName,
      });

      form.setValue(
        `translatedDishData.${languageIndex}.description`,
        result.text,
        { shouldDirty: true },
      );
    } catch {
      toast({
        title: t("aiAssist.enhancementFailed"),
        description: t("aiAssist.enhancementFailedDescription"),
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleSuggest = async () => {
    if (!validateDishName()) return;

    setSuggestions([]);

    try {
      const result = await suggestDescs.mutateAsync({
        dishName: getDishName(),
        category: categoryName,
        language: languageName,
        cuisineType,
      });

      setSuggestions(result.suggestions);
    } catch {
      toast({
        title: t("aiAssist.suggestionsFailed"),
        description: t("aiAssist.suggestionsFailedDescription"),
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handlePickSuggestion = (text: string) => {
    form.setValue(
      `translatedDishData.${languageIndex}.description`,
      text,
      { shouldDirty: true },
    );
    setSuggestions([]);
  };

  if (!hasProviders) return null;

  const suggestionLabels = [
    t("aiAssist.suggestionClassic"),
    t("aiAssist.suggestionModern"),
    t("aiAssist.suggestionConcise"),
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <AIButton
          onClick={handleGenerate}
          loading={generateDesc.isLoading}
          icon={Sparkles}
          label={t("aiAssist.generate")}
          tooltip={t("aiAssist.generateTooltip")}
        />
        <AIButton
          onClick={handleEnhance}
          loading={enhanceText.isLoading}
          icon={Wand2}
          label={t("aiAssist.enhance")}
          tooltip={t("aiAssist.enhanceTooltip")}
        />
        <AIButton
          onClick={handleSuggest}
          loading={suggestDescs.isLoading}
          icon={ListChecks}
          label={t("aiAssist.suggest")}
          tooltip={t("aiAssist.suggestTooltip")}
        />
      </div>

      {/* Smart Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute right-0 top-full z-50 mt-1.5 w-[340px] rounded-lg border border-violet-200 bg-white shadow-lg dark:border-violet-800 dark:bg-gray-900"
          role="listbox"
          aria-label={t("aiAssist.suggestionsLabel")}
        >
          <div className="flex items-center justify-between border-b border-violet-100 px-3 py-2 dark:border-violet-800/50">
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
              {t("aiAssist.pickDescription")}
            </span>
            <button
              type="button"
              onClick={() => setSuggestions([])}
              className="text-violet-400 hover:text-violet-600 dark:hover:text-violet-200"
              aria-label={t("aiAssist.closeSuggestions")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1.5">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => handlePickSuggestion(suggestion)}
                className="group flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/30"
              >
                <div className="flex-1">
                  <span className="mb-0.5 block font-medium text-violet-600 dark:text-violet-400">
                    {suggestionLabels[index] ?? `#${index + 1}`}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {suggestion}
                  </span>
                </div>
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
