"use client";

import Image from "next/image";
import { shimmerToBase64 } from "~/utils/shimmer";
import { useTranslation } from "react-i18next";
import {
  EditDishButton,
} from "../AddDishButton/AddDishButton";
import { DeleteDishButton } from "../DeleteDishButton/DeleteDishButton";
import {
  AddVariantButton,
  EditVariantButton,
} from "../VariantsCreatorButton/VariantsCreatorButton";
import { DeleteVariantButton } from "../DeleteVariantButton/DeleteVariantButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { type AddDishFormValues } from "../DishForm/DishForm.schema";
import { type TagType } from "@prisma/client";
import { api } from "~/trpc/react";
import { cn } from "~/utils/cn";

export interface DishItemProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pictureUrl: string | null;
  categoryId?: string;
  isSoldOut?: boolean | null;
  menuId?: string;
  translatedDishData: AddDishFormValues["translatedDishData"];
  tags: TagType[];
  calories: number | null;
  carbohydrates: number | null;
  fats: number | null;
  protein: number | null;
  variants: {
    variantTranslations: {
      name: string;
      description: string | null;
      languageId: string;
    }[];
    id: string;
    name: string;
    description: string | null;
    price: number | null;
  }[];
  menuLanguages: {
    languageId: string;
    name: string;
  }[];
}

export const DishItem = ({
  id,
  name,
  description,
  price,
  pictureUrl,
  categoryId,
  isSoldOut = false,
  menuId,
  translatedDishData,
  tags,
  calories,
  carbohydrates,
  fats,
  protein,
  variants,
  menuLanguages,
}: DishItemProps) => {
  const { t } = useTranslation();
  const utils = api.useContext();

  const toggleSoldOut = api.menus.bulkToggleSoldOut.useMutation({
    onSuccess: () => {
      void utils.menus.getMenuBySlug.invalidate();
    },
  });

  const handleToggleSoldOut = () => {
    if (!menuId) return;

    toggleSoldOut.mutate({
      menuId,
      dishIds: [id],
      isSoldOut: !isSoldOut,
    });
  };

  return (
    <>
      <Accordion
        type="single"
        collapsible
        className={cn(
          "flex flex-col rounded-xl border border-border/50 bg-card px-6 pb-4 pt-6 shadow-sm",
          isSoldOut && "opacity-60",
        )}
      >
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
          <div className="flex w-full flex-row items-center gap-3">
            {pictureUrl && (
              <div className="relative aspect-square h-full ">
                <Image
                  src={pictureUrl}
                  alt={`${name} dish photo`}
                  fill
                  className="rounded-md object-cover"
                  sizes="64px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={shimmerToBase64(64, 64)}
                />
              </div>
            )}
            <div className="flex w-full flex-col py-2">
              <div className="flex w-full flex-row items-center gap-3">
                <p className={cn("text-xl font-medium", isSoldOut && "line-through")}>{name}</p>
                {isSoldOut && (
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {t("publicMenu.soldOut")}
                  </span>
                )}
              </div>
              <p className="text-sm">{price / 100} MAD</p>

              <p className="text-xs text-muted-foreground">{description}</p>
              {menuLanguages.length !== translatedDishData.length && (
                <p className="text-xs text-red-500">
                  {t("menuCreator.dishNotTranslated")}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 ">
            <div className="flex flex-row items-center gap-3">
              {menuId && (
                <button
                  type="button"
                  onClick={handleToggleSoldOut}
                  disabled={toggleSoldOut.isLoading}
                  className={cn(
                    "whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    isSoldOut
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
                  )}
                >
                  {isSoldOut ? t("menuCreator.markAvailable") : t("menuCreator.markSoldOut")}
                </button>
              )}
              <AddVariantButton
                buttonProps={{
                  variant: "outline",
                  className: "whitespace-nowrap",
                }}
                dishId={id}
              />
              <EditDishButton
                defaultValues={{
                  price: price / 100,
                  id,
                  categoryId,
                  translatedDishData,
                  imageUrl: pictureUrl,
                  tags: tags,
                  calories: calories ?? undefined,
                  carbohydrates: carbohydrates ?? undefined,
                  fats: fats ?? undefined,
                  proteins: protein ?? undefined,
                }}
              />
              <DeleteDishButton id={id} dishName={name} />
            </div>
          </div>
        </div>
        {variants.length > 0 && (
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger>
              <p className="whitespace-nowrap text-center">
                {t("menuCreator.variants")}
                {variants.some(
                  (val) =>
                    menuLanguages.length !== val.variantTranslations.length,
                ) && (
                  <span className="ml-2 text-center text-xs text-red-500">
                    {t("menuCreator.variantsNotTranslated")}
                  </span>
                )}
              </p>
            </AccordionTrigger>
            <AccordionContent className="border-b-0">
              {variants.map((variant) => (
                <div
                  className="flex w-full flex-row items-center gap-4 "
                  key={variant.id}
                >
                  <div className="flex w-full flex-col py-2">
                    <div className="flex flex-row items-center gap-2">
                      <p className="text-lg font-medium">{variant.name}</p>
                      {variant.price && (
                        <p className="text-sm">{variant.price / 100} MAD</p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {variant.description}
                    </p>
                    {menuLanguages.length !==
                      variant.variantTranslations.length && (
                      <p className="text-xs text-red-500">
                        {t("menuCreator.variantNotTranslated")}
                      </p>
                    )}
                  </div>
                  <EditVariantButton
                    defaultValues={{
                      id: variant.id,
                      price: variant.price ? variant.price / 100 : undefined,
                      translatedVariant: variant.variantTranslations.map(
                        (val) => ({
                          ...val,
                          description: val.description ?? "",
                        }),
                      ),
                    }}
                    dishId={id}
                  />
                  <DeleteVariantButton
                    variantName={variant.name}
                    id={variant.id}
                  />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </>
  );
};
