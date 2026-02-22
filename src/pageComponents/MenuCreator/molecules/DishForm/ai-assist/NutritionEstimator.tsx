"use client";

import { Calculator } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import { useTranslation } from "react-i18next";
import { type AddDishFormValuesWithImage } from "../DishForm.schema";
import { AIButton } from "./AIAssistShared";

// ---------------------------------------------------------------------------
// NutritionAIButton -- form-integrated nutrition estimator
// ---------------------------------------------------------------------------

interface NutritionAIButtonProps {
  form: UseFormReturn<AddDishFormValuesWithImage>;
}

export function NutritionAIButton({ form }: NutritionAIButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const estimate = api.ai.estimateNutrition.useMutation();
  const { data: providers } = api.ai.getAvailableProviders.useQuery();

  const hasProviders = providers && providers.length > 0;

  const handleEstimate = async () => {
    const dishName = form.getValues("translatedDishData.0.name");
    const description = form.getValues("translatedDishData.0.description");

    if (!dishName || dishName.length < 2) {
      toast({
        title: t("aiAssist.enterDishName"),
        description: t("aiAssist.enterDishNameForNutrition"),
        variant: "destructive",
        duration: 3000,
      });

      return;
    }

    try {
      const result = await estimate.mutateAsync({
        dishName,
        description: description ?? undefined,
      });

      if (result.calories != null)
        form.setValue("calories", result.calories, { shouldDirty: true });
      if (result.protein != null)
        form.setValue("proteins", result.protein, { shouldDirty: true });
      if (result.carbohydrates != null)
        form.setValue("carbohydrates", result.carbohydrates, {
          shouldDirty: true,
        });
      if (result.fats != null)
        form.setValue("fats", result.fats, { shouldDirty: true });

      toast({
        title: t("aiAssist.nutritionEstimated"),
        description: t("aiAssist.nutritionEstimatedDescription"),
        duration: 3000,
      });
    } catch {
      toast({
        title: t("aiAssist.estimationFailed"),
        description: t("aiAssist.estimationFailedDescription"),
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  if (!hasProviders) return null;

  return (
    <AIButton
      onClick={handleEstimate}
      loading={estimate.isLoading}
      icon={Calculator}
      label={t("aiAssist.aiEstimate")}
      tooltip={t("aiAssist.aiEstimateTooltip")}
    />
  );
}
