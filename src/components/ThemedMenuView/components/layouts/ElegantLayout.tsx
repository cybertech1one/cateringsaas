import { memo } from "react";
import Image from "next/image";

import { shimmerToBase64 } from "~/utils/shimmer";
import { type DishLayoutProps, type ParsedDish } from "../../types";
import { getImageBorderRadius, hexToRgbString } from "../../utils";
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

// ── Elegant Dish Card (Memoized) ────────────────────────────

const ElegantDishCard = memo(function ElegantDishCard({
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
        padding: "var(--menu-spacing-card)",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: "var(--menu-radius)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        display: "flex",
        gap: "20px",
        overflow: "hidden",
        opacity: dish.isSoldOut ? 0.5 : 1,
        cursor: onDishClick ? "pointer" : undefined,
      }}
    >
      {/* Image */}
      {theme.showImages && dish.pictureUrl && (
        <div
          style={{
            width: "100px",
            height: "100px",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            borderRadius: getImageBorderRadius(theme.imageStyle),
            boxShadow: `0 0 20px rgba(${hexToRgbString(theme.primaryColor)}, 0.15)`,
          }}
        >
          <Image
            src={dish.pictureUrl}
            alt={`${dish.name} dish photo`}
            fill
            className="object-cover"
            sizes="100px"
            loading="lazy"
            placeholder="blur"
            blurDataURL={shimmerToBase64(100, 100)}
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
            gap: "12px",
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
              <ThemedPrice
                price={dish.price}
                style={{
                  color: "var(--menu-primary)",
                  fontWeight: 700,
                  fontSize: "var(--menu-font-lg)",
                }}
              />
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
              lineHeight: 1.6,
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

// ── Layout: Elegant ─────────────────────────────────────────

export function ElegantLayout({
  dishes,
  theme,
  languageId,
  menuName,
  menuSlug,
  isPreview,
  onDishClick,
}: DishLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--menu-spacing-item)",
      }}
    >
      {dishes.map((dish) => (
        <ElegantDishCard
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
