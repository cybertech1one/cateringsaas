import { useTranslation } from "react-i18next";

import { getDishVariantsTranslated } from "~/utils/categoriesUtils";
import { tagsTranslations } from "~/utils/tags";

import { type ParsedDish } from "../types";
import { formatPrice, getCurrencySymbol } from "../utils";
import { DishShareButton } from "./ShareMenu";
import { DishFavoriteButton } from "./DishFavorite";

// ── Price Display ───────────────────────────────────────────

export function ThemedPrice({
  price,
  currency,
  style,
}: {
  price: number;
  currency?: string | null;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        color: "var(--menu-primary)",
        fontWeight: 600,
        fontSize: "var(--menu-font-base)",
        fontFamily: "var(--menu-body-font)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {formatPrice(price)}{" "}
      <span
        style={{
          fontSize: "var(--menu-font-sm)",
          fontWeight: 400,
          color: "var(--menu-muted)",
        }}
      >
        {getCurrencySymbol(currency)}
      </span>
    </span>
  );
}

// ── Macros / Nutrition ──────────────────────────────────────

export function ThemedMacros({
  calories,
  protein,
  carbohydrates,
  fat,
}: {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
}) {
  if (!calories && !protein && !carbohydrates && !fat) return null;

  const items: string[] = [];

  if (calories != null && calories > 0) items.push(`${calories} kcal`);
  if (protein != null && protein > 0) items.push(`P: ${protein}g`);
  if (carbohydrates != null && carbohydrates > 0)
    items.push(`C: ${carbohydrates}g`);
  if (fat != null && fat > 0) items.push(`F: ${fat}g`);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "6px",
      }}
    >
      {items.map((item, idx) => (
        <span
          key={idx}
          style={{
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            backgroundColor: "var(--menu-surface)",
            padding: "2px 8px",
            borderRadius: "9999px",
            border: "1px solid var(--menu-border)",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Tags ────────────────────────────────────────────────────

export function ThemedTags({
  tags,
}: {
  tags: ParsedDish["dishesTag"];
}) {
  const { t } = useTranslation();

  if (!tags || tags.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "6px",
      }}
    >
      {tags.map(({ tagName }, idx) => (
        <span
          key={idx}
          style={{
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-accent)",
            backgroundColor: "transparent",
            border: "1px solid var(--menu-accent)",
            padding: "1px 8px",
            borderRadius: "9999px",
            fontWeight: 500,
          }}
        >
          {t(tagsTranslations[tagName])}
        </span>
      ))}
    </div>
  );
}

// ── Variants ────────────────────────────────────────────────

export function ThemedVariants({
  dish,
  languageId,
}: {
  dish: ParsedDish;
  languageId: string;
}) {
  const variants = getDishVariantsTranslated({
    dishVariants: dish.dishVariants,
    languageId,
  });

  if (variants.length === 0) return null;

  return (
    <div style={{ marginTop: "8px", paddingLeft: "12px" }}>
      {variants.map((variant) => (
        <div
          key={variant.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "4px 0",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-sm)",
                fontWeight: 500,
                color: "var(--menu-text)",
              }}
            >
              {variant.name || ""}
            </span>
            {variant.description && (
              <span
                style={{
                  fontFamily: "var(--menu-body-font)",
                  fontSize: "var(--menu-font-sm)",
                  color: "var(--menu-muted)",
                  marginLeft: "8px",
                }}
              >
                {variant.description}
              </span>
            )}
          </div>
          {variant.price != null && variant.price > 0 && (
            <ThemedPrice
              price={variant.price}
              style={{ fontSize: "var(--menu-font-sm)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Sold-Out Badge ──────────────────────────────────────────

export function ThemedSoldOutBadge() {
  const { t } = useTranslation();

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: "var(--menu-accent, #dc2626)",
        color: "#fff",
        fontSize: "var(--menu-font-sm)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "2px 10px",
        borderRadius: "9999px",
        lineHeight: 1.4,
      }}
    >
      {t("publicMenu.soldOut")}
    </span>
  );
}

// ── Dish Action Buttons (favorite + share) ──────────────────

export function DishActionButtons({
  dish,
  menuName,
  menuSlug,
}: {
  dish: ParsedDish;
  menuName?: string;
  menuSlug?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        flexShrink: 0,
      }}
    >
      <DishFavoriteButton dishId={dish.id} />
      {menuName && menuSlug && (
        <DishShareButton
          menuName={menuName}
          menuSlug={menuSlug}
          dishName={dish.name}
          dishId={dish.id}
        />
      )}
    </div>
  );
}
