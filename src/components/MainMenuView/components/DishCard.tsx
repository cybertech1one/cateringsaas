"use client";

import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Heart, Star } from "lucide-react";
import { cn } from "~/utils/cn";
import { tagsTranslations } from "~/utils/tags";
import { getDishVariantsTranslated } from "~/utils/categoriesUtils";
import { type AllergenInfo } from "./types";
import { ThemePriceCard } from "./ThemePriceCard";
import { ThemeMacroCard } from "./ThemeMacroCard";
import { ThemeVariantCard } from "./ThemeVariantCard";
import { AllergenBadges } from "./AllergenBadges";
import { OptimizedDishImage } from "~/components/OptimizedDishImage";

// Use the same dish shape that parseDishes returns
interface DishCardDish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pictureUrl: string | null;
  isSoldOut: boolean | null;
  isFeatured: boolean | null;
  prepTimeMinutes: number | null;
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fats: number | null;
  dishesTag: Array<{ tagName: string }>;
  dishVariants: Array<{
    id: string;
    price: number | null;
    variantTranslations: Array<{
      languageId: string;
      name: string;
      description: string | null;
    }>;
  }>;
}

export interface DishCardProps {
  dish: DishCardDish;
  themed: boolean;
  selectedLanguage: string;
  allergens: AllergenInfo[] | undefined;
  isFavorite: boolean;
  onDishClick: (dishId: string, dishName: string) => void;
  onToggleFavorite: (dishId: string) => void;
}

export const DishCard = memo(function DishCard({
  dish,
  themed,
  selectedLanguage,
  allergens,
  isFavorite,
  onDishClick,
  onToggleFavorite,
}: DishCardProps) {
  const { t } = useTranslation();
  const [variantsOpen, setVariantsOpen] = useState(false);

  const handleClick = useCallback(() => {
    onDishClick(dish.id, dish.name);
  }, [onDishClick, dish.id, dish.name]);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(dish.id);
    },
    [onToggleFavorite, dish.id],
  );

  const handleToggleVariants = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setVariantsOpen((prev) => !prev);
    },
    [],
  );

  const hasImage = !!dish.pictureUrl;
  const hasVariants = dish.dishVariants.length > 0;
  const hasTags = dish.dishesTag.length > 0;
  const hasAllergens = allergens && allergens.length > 0;

  return (
    <li
      className={cn(
        "group relative w-full cursor-pointer list-none",
        !themed && "transition-all duration-200",
      )}
      style={themed ? {
        padding: "var(--menu-spacing-item, 14px) 0",
      } : {
        padding: "14px 0",
      }}
      onClick={handleClick}
    >
      {/* -- Sold Out Overlay -- */}
      {dish.isSoldOut && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span
            className={cn(
              "rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest",
              !themed && "bg-[#1A1B1E]/80 text-white shadow-lg",
            )}
            style={themed ? {
              backgroundColor: "var(--menu-accent, #1A1B1E)",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            } : undefined}
          >
            {t("publicMenu.soldOut")}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex w-full gap-3.5",
          dish.isSoldOut && "opacity-[0.45]",
        )}
      >
        {/* Left: Text content */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              <h3
                className={cn(
                  "leading-snug",
                  !themed && "text-[15px] font-semibold text-[#1A1B1E]",
                )}
                style={themed ? {
                  fontFamily: "var(--menu-heading-font)",
                  color: "var(--menu-text)",
                  fontSize: "15px",
                  fontWeight: 600,
                  lineHeight: 1.4,
                } : {
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {dish.name}
              </h3>

              {/* -- Featured Badge -- */}
              {dish.isFeatured && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    !themed && "text-amber-800",
                  )}
                  style={themed ? {
                    background: "color-mix(in srgb, var(--menu-primary) 15%, transparent)",
                    color: "var(--menu-primary)",
                  } : {
                    background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                  }}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {t("publicMenu.featured")}
                </span>
              )}

              {/* -- Prep Time -- */}
              {dish.prepTimeMinutes != null && dish.prepTimeMinutes > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    !themed && "bg-[#F5F5F0] text-[#6B7280]",
                  )}
                  style={themed ? {
                    color: "var(--menu-muted)",
                    backgroundColor: "var(--menu-surface, #F5F5F0)",
                  } : undefined}
                >
                  <Clock className="h-2.5 w-2.5" />
                  {dish.prepTimeMinutes}m
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {dish.description && (
            <p
              className={cn(
                "mt-1 line-clamp-2 leading-relaxed",
                !themed && "text-[13px] text-[#6B7280]",
              )}
              style={themed ? {
                color: "var(--menu-muted)",
                fontSize: "13px",
                lineHeight: 1.6,
              } : {
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {dish.description}
            </p>
          )}

          {/* Price */}
          <div className="mt-1.5">
            <ThemePriceCard price={dish.price} themed={themed} />
          </div>

          {/* Tags */}
          {hasTags && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {dish.dishesTag.map(({ tagName }) => (
                <span
                  key={tagName}
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    !themed && "bg-[#F5F5F0] text-[#6B7280]",
                  )}
                  style={themed ? {
                    backgroundColor: "var(--menu-surface, #F5F5F0)",
                    color: "var(--menu-muted)",
                  } : undefined}
                >
                  {t(tagsTranslations[tagName as keyof typeof tagsTranslations])}
                </span>
              ))}
            </div>
          )}

          {/* Allergen Badges */}
          {hasAllergens && (
            <div className="mt-1.5">
              <AllergenBadges allergens={allergens} />
            </div>
          )}

          {/* Macros */}
          <ThemeMacroCard
            protein={dish.protein}
            carbohydrates={dish.carbohydrates}
            fat={dish.fats}
            calories={dish.calories}
            themed={themed}
          />
        </div>

        {/* Right: Image + Favorite */}
        {hasImage && (
          <div className="relative flex-shrink-0">
            <div className="relative overflow-hidden rounded-2xl">
              <OptimizedDishImage
                src={dish.pictureUrl}
                alt={`${dish.name} dish photo`}
                width={110}
                height={110}
                sizes="110px"
                grayscale={!!dish.isSoldOut}
                className={cn(
                  "h-[110px] min-h-[110px] w-[110px] min-w-[110px] object-cover transition-transform duration-300 group-hover:scale-[1.03]",
                  !themed && "rounded-2xl",
                )}
                borderRadius={themed ? "var(--menu-radius, 16px)" : undefined}
              />
            </div>
            {/* Favorite button overlaid on bottom-right of image */}
            <button
              type="button"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={handleToggleFavorite}
              className={cn(
                "absolute -bottom-1.5 -right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110",
                !themed && "bg-white shadow-md",
              )}
              style={themed ? {
                backgroundColor: "var(--menu-bg, #fff)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              } : undefined}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isFavorite
                    ? "fill-[#E8453C] text-[#E8453C]"
                    : "text-[#6B7280]",
                )}
              />
            </button>
          </div>
        )}

        {/* Favorite button when no image -- placed inline at end */}
        {!hasImage && (
          <div className="flex flex-shrink-0 items-start pt-0.5">
            <button
              type="button"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={handleToggleFavorite}
              className="group/fav rounded-full p-1.5 transition-colors hover:bg-[#F5F5F0]"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite
                    ? "fill-[#E8453C] text-[#E8453C]"
                    : "text-[#6B7280] group-hover/fav:text-[#E8453C]",
                )}
              />
            </button>
          </div>
        )}
      </div>

      {/* Variants -- collapsible section */}
      {hasVariants && (
        <div
          className="mt-2 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleToggleVariants}
            className={cn(
              "flex items-center gap-1 text-[12px] font-medium transition-colors",
              !themed && "text-[#E8453C] hover:text-[#E8453C]/80",
            )}
            style={themed ? {
              color: "var(--menu-primary)",
            } : undefined}
          >
            <svg
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                variantsOpen && "rotate-90",
              )}
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 2.5L8 6L4.5 9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {dish.dishVariants.length} {dish.dishVariants.length === 1 ? "option" : "options"}
          </button>

          {variantsOpen && (
            <div
              className={cn(
                "mt-1.5 flex w-full flex-col gap-1 rounded-xl py-1.5",
                !themed && "bg-[#F5F5F0]/60",
              )}
              style={themed ? {
                backgroundColor: "var(--menu-surface, rgba(245,245,240,0.6))",
                borderRadius: "var(--menu-radius, 12px)",
              } : undefined}
            >
              {getDishVariantsTranslated({
                dishVariants: dish.dishVariants,
                languageId: selectedLanguage,
              }).map((variant) => (
                <ThemeVariantCard
                  key={variant.id}
                  name={variant.name || ""}
                  price={variant.price}
                  description={variant.description || ""}
                  themed={themed}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
});
