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

// ── Magazine Dish Card (Memoized) ───────────────────────────

const MagazineDishCard = memo(function MagazineDishCard({
  dish,
  theme,
  languageId,
  menuName,
  menuSlug,
  isPreview,
  isEven,
  onDishClick,
}: {
  dish: ParsedDish;
  theme: MenuTheme;
  languageId: string;
  menuName?: string;
  menuSlug?: string;
  isPreview?: boolean;
  isEven: boolean;
  onDishClick?: DishLayoutProps["onDishClick"];
}) {
  const hasImage = theme.showImages && !!dish.pictureUrl;

  return (
    <div
      id={`dish-${dish.id}`}
      onClick={() => onDishClick?.(dish)}
      style={{
        display: "flex",
        flexDirection: isEven ? "row" : "row-reverse",
        gap: "24px",
        alignItems: "flex-start",
        flexWrap: "wrap",
        opacity: dish.isSoldOut ? 0.5 : 1,
        cursor: onDishClick ? "pointer" : undefined,
      }}
    >
      {/* Image */}
      {hasImage && (
        <div
          style={{
            width: "clamp(160px, 40%, 260px)",
            aspectRatio: "3 / 4",
            position: "relative",
            overflow: "hidden",
            borderRadius: getImageBorderRadius(theme.imageStyle),
            flexShrink: 0,
          }}
        >
          <Image
            src={dish.pictureUrl!}
            alt={`${dish.name} dish photo`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 260px"
            loading="lazy"
            placeholder="blur"
            blurDataURL={shimmerToBase64(260, 347)}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: "200px",
          paddingTop: hasImage ? "8px" : "0",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <h3
              style={{
                fontFamily: "var(--menu-heading-font)",
                fontSize: "var(--menu-font-xl)",
                fontWeight: 700,
                color: "var(--menu-text)",
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.3px",
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <ThemedPrice
              price={dish.price}
              style={{ fontSize: "var(--menu-font-lg)" }}
            />
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
          <div style={{ marginTop: "8px" }}>
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
              fontSize: "var(--menu-font-base)",
              color: "var(--menu-muted)",
              marginTop: "12px",
              lineHeight: 1.7,
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

// ── Layout: Magazine ────────────────────────────────────────

export function MagazineLayout({
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
        gap: "calc(var(--menu-spacing-item) * 2)",
      }}
    >
      {dishes.map((dish, idx) => (
        <MagazineDishCard
          key={dish.id}
          dish={dish}
          theme={theme}
          languageId={languageId}
          menuName={menuName}
          menuSlug={menuSlug}
          isPreview={isPreview}
          isEven={idx % 2 === 0}
          onDishClick={onDishClick}
        />
      ))}
    </div>
  );
}
