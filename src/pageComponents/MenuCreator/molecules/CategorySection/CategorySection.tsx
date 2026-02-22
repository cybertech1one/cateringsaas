"use client";

import { useTranslation } from "react-i18next";
import {
  AddDishButton,
} from "../AddDishButton/AddDishButton";
import {
  EditCategoryButton,
} from "../AddCategoryButton/AddCategoryButton";
import { EmptyPlaceholder } from "~/components/EmptyPlaceholder";
import { DishItem } from "../DishItem/DishItem";
import { type parseDishes } from "~/utils/parseDishes";
import { FolderOpen, AlertCircle } from "lucide-react";

type ParsedCategory = ReturnType<typeof parseDishes>[number];

export interface CategorySectionProps {
  category: ParsedCategory["category"];
  dishes: ParsedCategory["dishes"];
  menuLanguages: {
    languageId: string;
    languages: { name: string };
  }[];
}

export const CategorySection = ({
  category,
  dishes,
  menuLanguages,
}: CategorySectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Category header */}
      <div className="flex w-full flex-col gap-3 rounded-xl bg-secondary/30 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {category?.name ?? t("menuCreator.noCategory")}
            </h3>
            {category &&
              category?.categoriesTranslation.length !==
                menuLanguages.length && (
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  {t("menuCreator.categoryNotTranslated")}
                </p>
              )}
          </div>
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {dishes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AddDishButton
            defaultValues={{
              categoryId: category?.id || "",
            }}
            buttonText={t("menuCreator.AddDishesToCategory")}
            buttonProps={{ variant: "outline", size: "sm" }}
          />
          {category && (
            <EditCategoryButton
              defaultValues={{
                id: category.id,
                translatedCategoriesData: category.categoriesTranslation,
              }}
            />
          )}
        </div>
      </div>

      {/* Dishes */}
      {dishes.length === 0 && (
        <EmptyPlaceholder className="min-h-[80px] rounded-xl border-dashed">
          <EmptyPlaceholder.Title className="text-sm">
            {t("menuCreator.noDishes")}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description className="text-xs">
            {t("menuCreator.noDishesDescription")}
          </EmptyPlaceholder.Description>
        </EmptyPlaceholder>
      )}
      <div className="flex flex-col gap-3 pl-2 md:pl-4">
        {dishes.map((dish) => (
          <DishItem
            key={dish.id}
            {...dish}
            categoryId={dish.categories?.id}
            tags={dish.dishesTag.map((val) => val.tagName)}
            translatedDishData={dish.dishesTranslation.map(
              ({ description: dishDescription, ...rest }) => ({
                ...rest,
                description: dishDescription || "",
              }),
            )}
            variants={dish.translatedDishVariants}
            menuLanguages={menuLanguages.map((val) => ({
              languageId: val.languageId,
              name: val.languages.name,
            }))}
          />
        ))}
      </div>
    </div>
  );
};
