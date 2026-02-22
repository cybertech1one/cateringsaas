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

// ── Modern Dish Card (Memoized) ─────────────────────────────

const ModernDishCard = memo(function ModernDishCard({
  dish,
  theme,
  languageId,
  menuName,
  menuSlug,
  isPreview,
  onDishClick,
}: {
  dish: ParsedDish;
  theme: MenuTheme;
  languageId: string;
  menuName?: string;
  menuSlug?: string;
  isPreview?: boolean;
  onDishClick?: DishLayoutProps["onDishClick"];
}) {
  return (
    <div
      id={`dish-${dish.id}`}
      onClick={() => onDishClick?.(dish)}
      style={{
        display: "flex",
        gap: "16px",
        padding: "var(--menu-spacing-card)",
        backgroundColor: "var(--menu-card-bg)",
        borderRadius: "var(--menu-radius-lg)",
        boxShadow: "var(--menu-card-shadow)",
        border: "var(--menu-card-border)",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        opacity: dish.isSoldOut ? 0.5 : 1,
        cursor: onDishClick ? "pointer" : undefined,
      }}
    >
      {/* Image */}
      {theme.showImages && dish.pictureUrl && (
        <div
          style={{
            width: "120px",
            minHeight: "120px",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            borderRadius: getImageBorderRadius(theme.imageStyle),
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

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
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
            {theme.showPrices && dish.price > 0 && (
              <ThemedPrice price={dish.price} />
            )}
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

        {dish.description && dish.description !== "-" && (
          <p
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-sm)",
              color: "var(--menu-muted)",
              marginTop: "8px",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {dish.description}
          </p>
        )}

        {theme.showNutrition && (
          <ThemedMacros
            calories={dish.calories}
            protein={dish.protein}
            carbohydrates={dish.carbohydrates}
            fat={dish.fats}
          />
        )}

        <ThemedTags tags={dish.dishesTag} />
        <ThemedVariants dish={dish} languageId={languageId} />
      </div>
    </div>
  );
});

// ── Layout: Modern ──────────────────────────────────────────

export function ModernLayout({ dishes, theme, languageId, menuName, menuSlug, isPreview, onDishClick }: DishLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--menu-spacing-item)",
      }}
    >
      {dishes.map((dish) => (
        <ModernDishCard
          key={dish.id}
          dish={dish}
          theme={theme}
          languageId={languageId}
          menuName={menuName}
          menuSlug={menuSlug}
          isPreview={isPreview}
          onDishClick={onDishClick}
        />
      ))}
    </div>
  );
}
