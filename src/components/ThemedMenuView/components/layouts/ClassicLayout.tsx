import { memo } from "react";
import Image from "next/image";

import { shimmerToBase64 } from "~/utils/shimmer";
import { type DishLayoutProps, type ParsedDish } from "../../types";
import { getImageBorderRadius } from "../../utils";
import { type MenuTheme } from "~/lib/theme/types";
import {
  ThemedPrice,
  ThemedMacros,
  ThemedTags,
  ThemedVariants,
  DishActionButtons,
  ThemedSoldOutBadge,
} from "../ThemedDishParts";
import { AddToCartButton } from "../AddToCartButton";

// ── Classic Dish Item (Memoized) ────────────────────────────

const ClassicDishItem = memo(function ClassicDishItem({
  dish,
  theme,
  languageId,
  menuName,
  menuSlug,
  isPreview,
  isLast,
  onDishClick,
}: {
  dish: ParsedDish;
  theme: MenuTheme;
  languageId: string;
  menuName?: string;
  menuSlug?: string;
  isPreview?: boolean;
  isLast: boolean;
  onDishClick?: DishLayoutProps["onDishClick"];
}) {
  return (
    <li
      id={`dish-${dish.id}`}
      onClick={() => onDishClick?.(dish)}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: `var(--menu-spacing-item) 0`,
        borderBottom: isLast ? "none" : "1px solid var(--menu-border)",
        transition: "opacity 0.2s ease",
        opacity: dish.isSoldOut ? 0.5 : 1,
        cursor: onDishClick ? "pointer" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        {/* Left: Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <h3
                style={{
                  fontFamily: "var(--menu-heading-font)",
                  fontSize: "var(--menu-font-lg)",
                  fontWeight: 600,
                  color: "var(--menu-text)",
                  margin: 0,
                  lineHeight: 1.3,
                  textDecoration: dish.isSoldOut ? "line-through" : "none",
                }}
              >
                {dish.name}
              </h3>
              {dish.isSoldOut && <ThemedSoldOutBadge />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              <DishActionButtons dish={dish} menuName={menuName} menuSlug={menuSlug} />
              {!isPreview && (
                <AddToCartButton
                  dishId={dish.id}
                  dishName={dish.name}
                  price={dish.price}
                  disabled={!!dish.isSoldOut}
                />
              )}
            </div>
          </div>
          {theme.showPrices && dish.price > 0 && (
            <div style={{ marginTop: "4px" }}>
              <ThemedPrice price={dish.price} />
            </div>
          )}
          {theme.showNutrition && (
            <ThemedMacros
              calories={dish.calories}
              protein={dish.protein}
              carbohydrates={dish.carbohydrates}
              fat={dish.fats}
            />
          )}
          {dish.description && dish.description !== "-" && (
            <p
              style={{
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-sm)",
                color: "var(--menu-muted)",
                marginTop: "6px",
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              {dish.description}
            </p>
          )}
          <ThemedTags tags={dish.dishesTag} />
        </div>

        {/* Right: Thumbnail */}
        {theme.showImages && dish.pictureUrl && (
          <div
            style={{
              width: "120px",
              height: "120px",
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
              borderRadius: getImageBorderRadius(theme.imageStyle),
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Image
              src={dish.pictureUrl}
              alt={`${dish.name} dish photo`}
              fill
              className="object-cover"
              sizes="120px"
              loading="lazy"
              placeholder="blur"
              blurDataURL={shimmerToBase64(120, 120)}
            />
          </div>
        )}
      </div>

      <ThemedVariants dish={dish} languageId={languageId} />
    </li>
  );
});

// ── Layout: Classic ─────────────────────────────────────────

export function ClassicLayout({ dishes, theme, languageId, menuName, menuSlug, isPreview, onDishClick }: DishLayoutProps) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {dishes.map((dish, idx) => (
        <ClassicDishItem
          key={dish.id}
          dish={dish}
          theme={theme}
          languageId={languageId}
          menuName={menuName}
          menuSlug={menuSlug}
          isPreview={isPreview}
          isLast={idx === dishes.length - 1}
          onDishClick={onDishClick}
        />
      ))}
    </ul>
  );
}
