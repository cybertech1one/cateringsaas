"use client";

import { memo, useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";

import { type MenuTheme } from "~/lib/theme/types";
import { type ParsedDish } from "../types";
import { shimmerToBase64 } from "~/utils/shimmer";

// ── Types ────────────────────────────────────────────────────

interface FeaturedDishesProps {
  dishes: ParsedDish[];
  theme: MenuTheme;
  languageId: string;
  currency: string;
}

// ── Helpers ──────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  return `${(price / 100).toFixed(2)} ${currency}`;
}

// ── Main Component ───────────────────────────────────────────

export const FeaturedDishes = memo(function FeaturedDishes({
  dishes,
  theme,
  languageId: _languageId,
  currency,
}: FeaturedDishesProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Filter featured, non-sold-out dishes
  const featuredDishes = dishes.filter(
    (dish) => dish.isFeatured && !dish.isSoldOut,
  );

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);

    return () => clearTimeout(timer);
  }, []);

  // Scroll state management
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;

    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });

    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState, featuredDishes.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;

    if (!el) return;
    const amount = direction === "left" ? -240 : 240;

    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  if (featuredDishes.length === 0) return null;

  return (
    <div
      style={{
        padding: "var(--menu-spacing-section) 20px",
        maxWidth: theme.layoutStyle === "grid" ? "900px" : "720px",
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <Flame
          style={{
            width: "20px",
            height: "20px",
            color: "var(--menu-accent)",
          }}
        />
        <div>
          <h2
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-lg)",
              fontWeight: 700,
              color: "var(--menu-text)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {t("publicMenu.chefsSpecials")}
          </h2>
          <p
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-xs)",
              color: "var(--menu-muted)",
              margin: 0,
              marginTop: "2px",
            }}
          >
            {t("publicMenu.chefsSpecialsSubtitle")}
          </p>
        </div>
      </div>

      {/* Scrollable Cards Container */}
      <div style={{ position: "relative" }}>
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            style={{
              position: "absolute",
              left: "-4px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--menu-surface)",
              border: "1px solid var(--menu-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <ChevronLeft
              style={{
                width: "16px",
                height: "16px",
                color: "var(--menu-text)",
              }}
            />
          </button>
        )}

        {/* Right scroll arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            style={{
              position: "absolute",
              right: "-4px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--menu-surface)",
              border: "1px solid var(--menu-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <ChevronRight
              style={{
                width: "16px",
                height: "16px",
                color: "var(--menu-text)",
              }}
            />
          </button>
        )}

        {/* Cards Row */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: "4px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {featuredDishes.map((dish, index) => (
            <FeaturedDishCard
              key={dish.id}
              dish={dish}
              theme={theme}
              currency={currency}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Card Sub-component ───────────────────────────────────────

const FeaturedDishCard = memo(function FeaturedDishCard({
  dish,
  theme,
  currency,
  index: _index,
}: {
  dish: ParsedDish;
  theme: MenuTheme;
  currency: string;
  index: number;
}) {
  const { t } = useTranslation();

  const cardStyles: Record<string, string | number | undefined> = {
    minWidth: "200px",
    maxWidth: "240px",
    flexShrink: 0,
    scrollSnapAlign: "start",
    backgroundColor: "var(--menu-surface)",
    borderRadius: "var(--menu-radius)",
    overflow: "hidden",
    position: "relative",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  // Apply card style
  switch (theme.cardStyle) {
    case "elevated":
      cardStyles.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      break;
    case "bordered":
      cardStyles.border = "1px solid var(--menu-border)";
      break;
    case "glass":
      cardStyles.backgroundColor = "rgba(255,255,255,0.08)";
      cardStyles.backdropFilter = "blur(12px)";
      cardStyles.border = "1px solid rgba(255,255,255,0.15)";
      break;
    default: // flat
      cardStyles.border = "1px solid var(--menu-border)";
      break;
  }

  return (
    <div
      style={cardStyles as React.CSSProperties}
    >
      {/* Featured badge */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "9999px",
          backgroundColor: "var(--menu-accent)",
          color: "#fff",
          fontSize: "10px",
          fontWeight: 700,
          fontFamily: "var(--menu-body-font)",
          letterSpacing: "0.3px",
          textTransform: "uppercase",
        }}
      >
        <Flame style={{ width: "10px", height: "10px" }} />
        {t("publicMenu.featured")}
      </div>

      {/* Image */}
      {dish.pictureUrl && theme.showImages && (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "3/2",
            overflow: "hidden",
          }}
        >
          <Image
            src={dish.pictureUrl}
            fill
            alt={dish.name}
            className="object-cover"
            sizes="240px"
            loading="lazy"
            placeholder="blur"
            blurDataURL={shimmerToBase64(240, 160)}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "10px 12px 12px" }}>
        <h3
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-sm)",
            fontWeight: 600,
            color: "var(--menu-text)",
            margin: 0,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {dish.name}
        </h3>

        {dish.description && (
          <p
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-xs)",
              color: "var(--menu-muted)",
              margin: "4px 0 0",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {dish.description}
          </p>
        )}

        {theme.showPrices && (
          <p
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-sm)",
              fontWeight: 700,
              color: "var(--menu-primary)",
              margin: "6px 0 0",
            }}
          >
            {formatPrice(dish.price, currency)}
          </p>
        )}
      </div>
    </div>
  );
});
