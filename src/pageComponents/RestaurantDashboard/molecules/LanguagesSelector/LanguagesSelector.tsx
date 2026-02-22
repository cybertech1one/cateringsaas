import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MultiCountriesSelect } from "~/components/CountriesSelect/CountriesSelect";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export const LanguagesSelector = ({
  menuId,
  initialLanguages,
}: {
  menuId: string;
  initialLanguages: string[];
}) => {
  const { mutateAsync, isLoading } = api.languages.changeMenuLanguages.useMutation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedLanguages, setSelectedLanguages] =
    useState<string[]>(initialLanguages);

  const handleUpdateLanguages = async (languagesIds: string[]) => {
    try {
      await mutateAsync({ menuId, languages: languagesIds });
      toast({
        title: t("languageSelector.saved"),
        description: t("languageSelector.changesSaved"),
      });
    } catch {
      toast({
        title: t("toast.error"),
        description: t("toast.errorDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <MultiCountriesSelect
          value={selectedLanguages}
          onChange={(value) => setSelectedLanguages(value)}
          className="w-full text-sm"
        />
      </div>
      <Button
        onClick={() => handleUpdateLanguages(selectedLanguages)}
        size="sm"
        className="rounded-lg"
        loading={isLoading}
      >
        {t("languageSelector.save")}
      </Button>
    </div>
  );
};
