import { memo } from "react";
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

// ── Minimal Dish Item (Memoized) ────────────────────────────

const MinimalDishItem = memo(function MinimalDishItem({
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
        padding: `var(--menu-spacing-item) 0`,
        borderBottom: isLast ? "none" : "1px solid var(--menu-border)",
        cursor: onDishClick ? "pointer" : undefined,
      }}
    >
      {/* Name + dotted line + Price + Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          opacity: dish.isSoldOut ? 0.5 : 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-lg)",
            fontWeight: 600,
            color: "var(--menu-text)",
            whiteSpace: "nowrap",
            textDecoration: dish.isSoldOut ? "line-through" : "none",
          }}
        >
          {dish.name}
        </span>
        {dish.isSoldOut && <ThemedSoldOutBadge />}
        <span
          style={{
            flex: 1,
            borderBottom: "1px dotted var(--menu-border)",
            minWidth: "20px",
            alignSelf: "center",
            marginBottom: "4px",
          }}
        />
        <DishActionButtons dish={dish} menuName={menuName} menuSlug={menuSlug} />
        {theme.showPrices && dish.price > 0 && (
          <ThemedPrice
            price={dish.price}
            style={{ fontSize: "var(--menu-font-lg)" }}
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

      {/* Description */}
      {dish.description && dish.description !== "-" && (
        <p
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            marginTop: "4px",
            lineHeight: 1.5,
            maxWidth: "80%",
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
    </li>
  );
});

// ── Layout: Minimal ─────────────────────────────────────────

export function MinimalLayout({
  dishes,
  theme,
  languageId,
  menuName,
  menuSlug,
  isPreview,
  onDishClick,
}: DishLayoutProps) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {dishes.map((dish, idx) => (
        <MinimalDishItem
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
