"use client";

import { Globe } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import { useTranslation } from "react-i18next";
import { type AddDishFormValuesWithImage } from "../DishForm.schema";
import { AIButton } from "./AIAssistShared";

// ---------------------------------------------------------------------------
// TranslateAIButton -- form-integrated translation button
// ---------------------------------------------------------------------------

interface TranslateAIButtonProps {
  form: UseFormReturn<AddDishFormValuesWithImage>;
  defaultLanguageIndex: number;
  defaultLanguageName: string;
  targetLanguages: { index: number; name: string }[];
}

export function TranslateAIButton({
  form,
  defaultLanguageIndex,
  defaultLanguageName,
  targetLanguages,
}: TranslateAIButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const translate = api.ai.translateContent.useMutation();
  const { data: providers } = api.ai.getAvailableProviders.useQuery();

  const hasProviders = providers && providers.length > 0;

  const handleTranslate = async () => {
    const sourceName = form.getValues(
      `translatedDishData.${defaultLanguageIndex}.name`,
    );
    const sourceDesc = form.getValues(
      `translatedDishData.${defaultLanguageIndex}.description`,
    );

    if (!sourceName || sourceName.length < 2) {
      toast({
        title: t("aiAssist.enterContentFirst"),
        description: t("aiAssist.enterContentFirstDescription"),
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
          `translatedDishData.${target.index}.name`,
          nameResult.text,
          { shouldDirty: true },
        );

        if (sourceDesc && sourceDesc.length > 0) {
          const descResult = await translate.mutateAsync({
            text: sourceDesc,
            fromLanguage: defaultLanguageName,
            toLanguage: target.name,
          });

          form.setValue(
            `translatedDishData.${target.index}.description`,
            descResult.text,
            { shouldDirty: true },
          );
        }
      }

      toast({
        title: t("aiAssist.translationComplete"),
        description: t("aiAssist.translatedToLanguages", {
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
      tooltip={t("aiAssist.autoTranslateTooltip")}
    />
  );
}
