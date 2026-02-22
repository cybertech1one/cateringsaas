import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormInput } from "~/components/FormInput/FormInput";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { getDefaultLanguage } from "~/utils/getDefaultLanguage";
import {
  type AddCategoryFormValues,
  addCategoryValidationSchema,
} from "./CategoryForm.schema";
import { CategoryTranslateButton } from "./CategoryTranslateButton";

export const CategoryForm = ({
  defaultValues,
  onClose,
}: {
  defaultValues?: Partial<AddCategoryFormValues>;
  onClose: () => void;
}) => {
  const { mutateAsync } = api.menus.upsertCategory.useMutation();
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<AddCategoryFormValues>({
    defaultValues: {
      translatedCategoriesData: [],
      ...defaultValues,
    },
    resolver: zodResolver(addCategoryValidationSchema),
  });
  const { slug } = useParams() as { slug: string };
  const { data: menuData, isLoading } = api.menus.getMenuBySlug.useQuery({
    slug,
  });
  const onSubmit = async (values: AddCategoryFormValues) => {
    if (!menuData) return;

    try {
      await mutateAsync({ ...values, menuId: menuData.id });
      toast({
        title: t("toast.categorySaved"),
        description: t("toast.categorySavedDescription"),
      });
      onClose();
    } catch {
      toast({
        title: t("toast.error"),
        description: t("toast.errorDescription"),
        variant: "destructive",
      });
    }
  };

  if (isLoading || !menuData) return null;

  const initialLanguage = getDefaultLanguage(menuData.menuLanguages);

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-4">
          {" "}
          <Tabs defaultValue={initialLanguage.languageId} className="gap-0">
            <TabsList className="gap-4 bg-background p-0">
              {menuData?.menuLanguages.map((lang, index) => (
                <TabsTrigger
                  className={cn(
                    "data-[state=active]:bg-muted",
                    form.formState.errors.translatedCategoriesData?.[index] &&
                      "border-2 border-red-300",
                  )}
                  key={lang.languageId}
                  value={lang.languageId}
                >
                  <div className="flex flex-row items-center gap-4">
                    <Image
                      src={lang.languages.flagUrl}
                      alt={`${lang.languages.name} flag`}
                      width={16}
                      height={16}
                      sizes="16px"
                    />
                    {lang.languages.name}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            {menuData.menuLanguages.length > 1 && (
              <div className="flex justify-end px-1 py-1.5">
                <CategoryTranslateButton
                  form={form}
                  defaultLanguageIndex={menuData.menuLanguages.findIndex(
                    (l) => l.languageId === initialLanguage.languageId,
                  )}
                  defaultLanguageName={
                    menuData.menuLanguages.find(
                      (l) => l.languageId === initialLanguage.languageId,
                    )?.languages.name ?? "English"
                  }
                  targetLanguages={menuData.menuLanguages
                    .filter(
                      (l) => l.languageId !== initialLanguage.languageId,
                    )
                    .map((l) => ({
                      index: menuData.menuLanguages.findIndex(
                        (ml) => ml.languageId === l.languageId,
                      ),
                      name: l.languages.name,
                    }))}
                />
              </div>
            )}
            {menuData?.menuLanguages.map((lang, index) => (
              <TabsContent
                value={lang.languageId}
                key={lang.languageId}
                className="mt-0 rounded-b-lg bg-muted p-4 "
              >
                <div className="flex flex-col gap-4">
                  <Input
                    {...form.register(
                      `translatedCategoriesData.${index}.languageId`,
                    )}
                    value={lang.languageId}
                    className="hidden"
                  />
                  <FormField
                    control={form.control}
                    name={`translatedCategoriesData.${index}.name`}
                    render={({ field }) => (
                      <FormInput
                        label={`Nazwa kategorii (${lang.languages.isoCode})`}
                      >
                        <Input
                          {...field}
                          placeholder="Burgery"
                          maxLength={100}
                          required
                        />
                      </FormInput>
                    )}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <Button loading={form.formState.isSubmitting} type="submit">
          {t("categoryForm.save")}
        </Button>
      </form>
    </Form>
  );
};
