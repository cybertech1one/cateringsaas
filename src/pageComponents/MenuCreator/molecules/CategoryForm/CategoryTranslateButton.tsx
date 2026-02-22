"use client";

import { Globe } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import { useTranslation } from "react-i18next";
import { type AddCategoryFormValues } from "./CategoryForm.schema";
import { AIButton } from "~/pageComponents/MenuCreator/molecules/DishForm/ai-assist/AIAssistShared";

// ---------------------------------------------------------------------------
// CategoryTranslateButton -- AI auto-translate for category names
// ---------------------------------------------------------------------------

interface CategoryTranslateButtonProps {
  form: UseFormReturn<AddCategoryFormValues>;
  defaultLanguageIndex: number;
  defaultLanguageName: string;
  targetLanguages: { index: number; name: string }[];
}

export function CategoryTranslateButton({
  form,
  defaultLanguageIndex,
  defaultLanguageName,
  targetLanguages,
}: CategoryTranslateButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const translate = api.ai.translateContent.useMutation();
  const { data: providers } = api.ai.getAvailableProviders.useQuery();

  const hasProviders = providers && providers.length > 0;

  const handleTranslate = async () => {
    const sourceName = form.getValues(
      `translatedCategoriesData.${defaultLanguageIndex}.name`,
    );

    if (!sourceName || sourceName.length < 2) {
      toast({
        title: t("aiAssist.enterCategoryNameFirst"),
        description: t("aiAssist.enterCategoryNameFirstDescription"),
        variant: "destructive",
        duration: 3000,
      });

      return;
    }

    try {
      for (const target of targetLanguages) {
        const nameResult = await translate.mutateAsync({
          text: sourceName,
          fromLanguage: defaultLanguageName,
          toLanguage: target.name,
        });

        form.setValue(
          `translatedCategoriesData.${target.index}.name`,
          nameResult.text,
          { shouldDirty: true },
        );
      }

      toast({
        title: t("aiAssist.categoryTranslationComplete"),
        description: t("aiAssist.categoryTranslatedToLanguages", {
          count: targetLanguages.length,
        }),
        duration: 3000,
      });
    } catch {
      toast({
        title: t("aiAssist.translationFailed"),
        description: t("aiAssist.translationFailedDescription"),
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  if (!hasProviders || targetLanguages.length === 0) return null;

  return (
    <AIButton
      onClick={handleTranslate}
      loading={translate.isLoading}
      icon={Globe}
      label={t("aiAssist.autoTranslate")}
      tooltip={t("aiAssist.autoTranslateCategoryTooltip")}
    />
  );
}
