"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "~/utils/cn";
import { type AllergenInfo } from "./types";
import { DishCard } from "./DishCard";

// Re-use the parsed dish shape from parseDishes
interface ParsedCategory {
  id: string;
  name: string;
}

interface ParsedDish {
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

export interface DishGridProps {
  category: ParsedCategory | null;
  dishes: ParsedDish[];
  themed: boolean;
  selectedLanguage: string;
  allergensByDishId: Map<string, AllergenInfo[]>;
  favoriteDishIds: Set<string>;
  onDishClick: (dishId: string, dishName: string) => void;
  onToggleFavorite: (dishId: string) => void;
  scheduleInfo?: {
    startTime: string | null;
    endTime: string | null;
    name: string;
  };
}

export const DishGrid = memo(function DishGrid({
  category,
  dishes,
  themed,
  selectedLanguage,
  allergensByDishId,
  favoriteDishIds,
  onDishClick,
  onToggleFavorite,
  scheduleInfo,
}: DishGridProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.05, rootMargin: "50px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, []);

  if (!dishes.length) return null;

  return (
    <div
      ref={sectionRef}
      key={category?.id || "no-category"}
      className={cn(
        "w-full transition-all duration-500",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
      )}
      id={category?.id}
    >
      <div className="flex w-full flex-col">
        {category?.name && (
          <div
            className={cn(
              "mb-3 flex items-center gap-3",
            )}
          >
            {/* Accent bar */}
            <div
              className={cn(
                "h-6 w-1 flex-shrink-0 rounded-full",
                !themed && "bg-[#E8453C]",
              )}
              style={themed ? {
                backgroundColor: "var(--menu-primary, #E8453C)",
              } : undefined}
            />

            <h2
              className={cn(
                "font-bold tracking-tight",
                !themed && "text-[18px] text-[#1A1B1E]",
              )}
              style={themed ? {
                fontFamily: "var(--menu-heading-font)",
                fontSize: "var(--menu-font-xl, 18px)",
                color: "var(--menu-text)",
                fontWeight: 700,
              } : {
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {category.name}
            </h2>

            {/* Schedule badge */}
            {scheduleInfo && scheduleInfo.startTime && scheduleInfo.endTime && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  !themed && "bg-[#F5F5F0] text-[#6B7280]",
                )}
                style={themed ? {
                  backgroundColor: "color-mix(in srgb, var(--menu-primary) 12%, transparent)",
                  color: "var(--menu-primary)",
                } : undefined}
              >
                <Clock className="h-3 w-3" />
                {scheduleInfo.startTime} - {scheduleInfo.endTime}
              </span>
            )}
          </div>
        )}

        <ul
          className={cn(
            "flex flex-col",
          )}
        >
          {dishes.map((dish, index) => (
            <div key={dish.id}>
              <DishCard
                dish={dish}
                themed={themed}
                selectedLanguage={selectedLanguage}
                allergens={allergensByDishId.get(dish.id)}
                isFavorite={favoriteDishIds.has(dish.id)}
                onDishClick={onDishClick}
                onToggleFavorite={onToggleFavorite}
              />
              {/* Subtle divider between dishes, not after the last one */}
              {index < dishes.length - 1 && (
                <div
                  className={cn(
                    "mx-auto w-full",
                    !themed && "h-px bg-[#1A1B1E]/[0.06]",
                  )}
                  style={themed ? {
                    height: "1px",
                    backgroundColor: "var(--menu-border, rgba(26,27,30,0.06))",
                  } : undefined}
                />
              )}
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
});
