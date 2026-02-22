import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export const DefaultLanguagesSelector = ({
  menuId,
  initialDefaultLanguage,
}: {
  menuId: string;
  initialDefaultLanguage: string;
}) => {
  const { mutateAsync, isLoading } = api.languages.changeDefaultLanguage.useMutation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { slug } = useParams() as { slug: string };
  const { data, isLoading: isMenuLoading } = api.menus.getMenuBySlug.useQuery({ slug });

  const languagesSelectOptions = data?.menuLanguages.map((lang) => ({
    label: lang.languages.name,
    value: lang.languages.id,
  }));

  const [selectedDefaultLanguage, setselectedDefaultLanguage] =
    useState<string>(initialDefaultLanguage);

  const handleUpdateLanguages = async () => {
    try {
      await mutateAsync({ menuId, languageId: selectedDefaultLanguage });
      toast({
        title: t("defaultLanguageSelector.changeSavedTitle"),
        description: t("defaultLanguageSelector.changeSavedDescription"),
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
        <Select
          options={languagesSelectOptions}
          value={languagesSelectOptions?.find(
            (option) => selectedDefaultLanguage === option.value,
          )}
          onChange={(newValue) =>
            newValue && setselectedDefaultLanguage(newValue.value)
          }
          isSearchable
          isLoading={isMenuLoading}
          className="text-sm"
          styles={{
            control: (base) => ({
              ...base,
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              minHeight: "36px",
              backgroundColor: "hsl(var(--background))",
              boxShadow: "none",
              "&:hover": { borderColor: "hsl(var(--primary) / 0.5)" },
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: "hsl(var(--card))",
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }),
            option: (base, state) => {
              let bg = "transparent";

              if (state.isSelected) bg = "hsl(var(--primary) / 0.1)";
              else if (state.isFocused) bg = "hsl(var(--secondary))";

              return {
                ...base,
                backgroundColor: bg,
                color: "hsl(var(--foreground))",
                fontSize: "0.875rem",
              };
            },
            singleValue: (base) => ({
              ...base,
              color: "hsl(var(--foreground))",
            }),
          }}
        />
      </div>
      <Button
        onClick={() => handleUpdateLanguages()}
        size="sm"
        className="rounded-lg"
        loading={isLoading}
      >
        {t("defaultLanguageSelector.save")}
      </Button>
    </div>
  );
};
