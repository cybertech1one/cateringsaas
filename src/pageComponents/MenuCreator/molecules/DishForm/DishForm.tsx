import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormInput } from "~/components/FormInput/FormInput";
import { ImageUploadInput } from "~/components/ImageUploadInput/ImageUploadInput";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import Select from "react-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Image from "next/image";
import { cn } from "~/utils/cn";
import { getCategoryTranslations } from "~/utils/categoriesUtils";
import { getDefaultLanguage } from "~/utils/getDefaultLanguage";
import { useTranslation } from "react-i18next";
import { MacronutrientsSection } from "./MacronutrientsSection";
import { TagType } from "@prisma/client";
import { tagsTranslations } from "~/utils/tags";
import { api } from "~/trpc/react";
import {
  addDishValidationSchemaWithImage,
  type AddDishFormValues,
  type AddDishFormValuesWithImage,
} from "./DishForm.schema";
import {
  DescriptionAIButtons,
  TranslateAIButton,
} from "./AIAssistButtons";
import { useUpsertDish } from "./useUpsertDish";

export const DishForm = ({
  defaultValues,
  onClose,
}: {
  defaultValues?: Partial<AddDishFormValues>;
  onClose: () => void;
}) => {
  const form = useForm<AddDishFormValuesWithImage>({
    defaultValues: {
      translatedDishData: [],
      tags: [],
      price: 0,
      categoryId: "",
      ...defaultValues,
    },
    resolver: zodResolver(addDishValidationSchemaWithImage),
  });
  const { slug } = useParams() as { slug: string };
  const { data: menuData, isLoading } = api.menus.getMenuBySlug.useQuery({
    slug,
  });
  const { t } = useTranslation();
  const { data: categoriesList, isLoading: categoriesLoading } =
    api.menus.getCategoriesBySlug.useQuery({
      menuSlug: slug,
    });
  const { mutateAsync } = useUpsertDish();

  const onSubmit = async (values: AddDishFormValuesWithImage) => {
    await mutateAsync(values);
    onClose();
  };

  if (isLoading || !menuData) return null;

  const initialLanguage = getDefaultLanguage(menuData.menuLanguages);

  const mappedCategories =
    categoriesList?.map((val) => ({
      value: val.id,
      label: getCategoryTranslations({
        category: val,
        languageId: initialLanguage.languageId,
      }),
    })) || [];

  const categoriesSelectOptions = [
    { value: "", label: t("menuCreator.noCategory") },
    ...mappedCategories,
  ];
  const tagsSelectOptions = Object.values(TagType).map((value) => ({
    value,
    label: t(tagsTranslations[value]),
  }));

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col">
            <Tabs defaultValue={initialLanguage.languageId} className="gap-0">
              <TabsList className="gap-4 bg-background p-0">
                {menuData?.menuLanguages.map((lang, index) => (
                  <TabsTrigger
                    className={cn(
                      "data-[state=active]:bg-muted",
                      form.formState.errors.translatedDishData?.[index] &&
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
              <div className="flex justify-end px-1 py-1.5">
                <TranslateAIButton
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
              {menuData?.menuLanguages.map((lang, index) => (
                <TabsContent
                  value={lang.languageId}
                  key={lang.languageId}
                  className="mt-0 rounded-b-lg bg-muted p-4 "
                >
                  <div className="flex flex-col gap-4">
                    <Input
                      {...form.register(
                        `translatedDishData.${index}.languageId`,
                      )}
                      value={lang.languageId}
                      className="hidden"
                    />
                    <FormField
                      control={form.control}
                      name={`translatedDishData.${index}.name`}
                      render={({ field }) => (
                        <FormInput
                          label={`${t("dishForm.dishName")} (${
                            lang.languages.isoCode
                          })`}
                        >
                          <Input
                            {...field}
                            placeholder="Pierogi Ruskie"
                            maxLength={200}
                            required
                          />
                        </FormInput>
                      )}
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {`${t("dishForm.dishDescription")} (${lang.languages.isoCode})`}
                        </span>
                        <DescriptionAIButtons
                          form={form}
                          languageIndex={index}
                          languageName={lang.languages.name}
                          categoryName={
                            mappedCategories.find(
                              (c) => c.value === form.getValues("categoryId"),
                            )?.label
                          }
                          cuisineType={menuData.cuisineType?.name}
                          menuId={menuData.id}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`translatedDishData.${index}.description`}
                        render={({ field }) => (
                          <FormInput label="">
                            <Input
                              {...field}
                              placeholder={t("dishForm.descriptionPlaceholder")}
                              maxLength={2000}
                            />
                          </FormInput>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormInput label={t("dishForm.priceInPLN")}>
                <Input
                  {...field}
                  type="number"
                  placeholder="10.99"
                  min="0"
                  step="0.01"
                />
              </FormInput>
            )}
          />
          <FormInput label={t("dishForm.dishPhoto")}>
            <div className="h-[100px] w-[200px]">
              <ImageUploadInput
                control={form.control}
                defaultImageUrl={defaultValues?.imageUrl ?? undefined}
                name="dishImageToUpload"
                aspectRatio={2 / 1}
                cropImageAspectRatio={1 / 1}
                restoreButton={false}
              />
            </div>
          </FormInput>
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormInput label={t("dishForm.categoryLabel")}>
                <Select
                  name={field.name}
                  ref={field.ref}
                  value={categoriesSelectOptions.find(
                    (val) => val.value === field.value,
                  )}
                  isSearchable
                  onChange={(val) => field.onChange(val?.value)}
                  options={categoriesSelectOptions}
                  isLoading={categoriesLoading}
                />
              </FormInput>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormInput label={t("dishForm.tagsLabel")}>
                <Select
                  options={tagsSelectOptions}
                  value={tagsSelectOptions?.filter((option) =>
                    field.value.includes(option.value),
                  )}
                  onChange={(newValue) =>
                    field.onChange(newValue.map((val) => val.value))
                  }
                  isSearchable
                  isMulti
                />
              </FormInput>
            )}
          />

          <MacronutrientsSection form={form} />
        </div>
        <Button loading={form.formState.isSubmitting} type="submit">
          {t("menuForm.save")}
        </Button>
      </form>
    </Form>
  );
};
