import { memo } from "react";
import Image from "next/image";

import { shimmerToBase64 } from "~/utils/shimmer";
import { type DishLayoutProps, type ParsedDish } from "../../types";
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

// ── Grid Hover Styles ────────────────────────────────────────

export function GridLayoutStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.menu-grid-card {
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.menu-grid-card:hover {
  transform: translateY(-2px);
}
.menu-grid-card .menu-grid-card-img {
  transition: transform 0.4s ease;
}
.menu-grid-card:hover .menu-grid-card-img {
  transform: scale(1.05);
}
`,
      }}
    />
  );
}

// ── Grid Dish Card (Memoized) ───────────────────────────────

const GridDishCard = memo(function GridDishCard({
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
      className="menu-grid-card"
      onClick={() => onDishClick?.(dish)}
      style={{
        backgroundColor: "var(--menu-card-bg)",
        borderRadius: "var(--menu-radius-lg)",
        boxShadow: "var(--menu-card-shadow)",
        border: "var(--menu-card-border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: dish.isSoldOut ? 0.5 : 1,
        cursor: onDishClick ? "pointer" : undefined,
      }}
    >
      {/* Image */}
      {theme.showImages && dish.pictureUrl && (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            overflow: "hidden",
          }}
        >
          <Image
            src={dish.pictureUrl}
            alt={`${dish.name} dish photo`}
            fill
            className="menu-grid-card-img object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL={shimmerToBase64(280, 210)}
          />
          {/* Subtle gradient overlay at bottom of image */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40px",
              background: "linear-gradient(to top, var(--menu-card-bg), transparent)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          padding: "var(--menu-spacing-card)",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
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
          <DishActionButtons dish={dish} menuName={menuName} menuSlug={menuSlug} />
        </div>

        {theme.showPrices && dish.price > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
            <ThemedPrice price={dish.price} />
            {!isPreview && (
              <AddToCartButton
                dishId={dish.id}
                dishName={dish.name}
                price={dish.price}
                disabled={!!dish.isSoldOut}
              />
            )}
          </div>
        )}
        {(!theme.showPrices || dish.price <= 0) && !isPreview && (
          <div style={{ marginTop: "6px" }}>
            <AddToCartButton
              dishId={dish.id}
              dishName={dish.name}
              price={dish.price}
            />
          </div>
        )}

        {dish.description && dish.description !== "-" && (
          <p
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-sm)",
              color: "var(--menu-muted)",
              marginTop: "8px",
              lineHeight: 1.5,
              flex: 1,
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

// ── Layout: Grid ────────────────────────────────────────────

export function GridLayout({ dishes, theme, languageId, menuName, menuSlug, isPreview, onDishClick }: DishLayoutProps) {
  return (
    <>
      <GridLayoutStyles />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "var(--menu-spacing-item)",
        }}
      >
        {dishes.map((dish) => (
          <GridDishCard
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
    </>
  );
}
