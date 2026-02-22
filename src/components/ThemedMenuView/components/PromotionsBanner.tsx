"use client";

import { memo, useRef, useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Tag,
  ChevronLeft,
  ChevronRight,
  Percent,
} from "lucide-react";

import { type MenuTheme } from "~/lib/theme/types";
import { shimmerToBase64 } from "~/utils/shimmer";

// ── Types ────────────────────────────────────────────────────

export interface ThemedPromotion {
  id: string;
  title: string;
  description: string | null;
  promotionType: string;
  discountPercent: number | null;
  discountAmount: number | null;
  imageUrl: string | null;
  endDate: Date | string | null;
}

interface PromotionsBannerProps {
  promotions: ThemedPromotion[];
  theme: MenuTheme;
  currency?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function getPromotionTypeKey(type: string): string {
  const typeMap: Record<string, string> = {
    daily_special: "publicMenu.dailySpecial",
    happy_hour: "publicMenu.happyHour",
    discount: "publicMenu.discount",
    combo: "publicMenu.combo",
    seasonal: "publicMenu.seasonal",
  };

  return typeMap[type] ?? "publicMenu.discount";
}

function formatDiscount(
  promo: ThemedPromotion,
  currency?: string,
): { key: string; opts?: Record<string, unknown> } | null {
  if (promo.discountPercent != null && promo.discountPercent > 0) {
    return { key: "publicMenu.percentOff", opts: { percent: promo.discountPercent } };
  }

  if (promo.discountAmount != null && promo.discountAmount > 0) {
    const formatted = `${(promo.discountAmount / 100).toFixed(2)}${currency ? ` ${currency}` : ""}`;

    return { key: "publicMenu.amountOff", opts: { amount: formatted } };
  }

  return null;
}

function isExpired(endDate: Date | string | null): boolean {
  if (!endDate) return false;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  return end.getTime() < Date.now();
}

// ── Main Component ───────────────────────────────────────────

export const ThemedPromotionsBanner = memo(function ThemedPromotionsBanner({
  promotions,
  theme,
  currency,
}: PromotionsBannerProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Filter out expired promotions on the client
  const activePromos = useMemo(
    () => promotions.filter((p) => !isExpired(p.endDate)),
    [promotions],
  );

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);

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
  }, [updateScrollState, activePromos.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;

    if (!el) return;
    const amount = direction === "left" ? -280 : 280;

    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  if (activePromos.length === 0) return null;

  return (
    <div
      style={{
        padding: "0 20px var(--menu-spacing-item)",
        maxWidth: theme.layoutStyle === "grid" ? "900px" : "720px",
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <Sparkles
          style={{
            width: "18px",
            height: "18px",
            color: "var(--menu-primary)",
          }}
        />
        <h2
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-base)",
            fontWeight: 600,
            color: "var(--menu-text)",
            margin: 0,
          }}
        >
          {t("publicMenu.promotions")}
        </h2>
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
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "var(--menu-surface)",
              border: "1px solid var(--menu-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <ChevronLeft
              style={{
                width: "14px",
                height: "14px",
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
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "var(--menu-surface)",
              border: "1px solid var(--menu-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <ChevronRight
              style={{
                width: "14px",
                height: "14px",
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
          {activePromos.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              theme={theme}
              currency={currency}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Card Sub-component ───────────────────────────────────────

const PromoCard = memo(function PromoCard({
  promo,
  theme,
  currency,
}: {
  promo: ThemedPromotion;
  theme: MenuTheme;
  currency?: string;
}) {
  const { t } = useTranslation();
  const discountInfo = formatDiscount(promo, currency);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const discountLabel = discountInfo ? (t as any)(discountInfo.key, discountInfo.opts) as string : null;

  const cardStyles: Record<string, string | number | undefined> = {
    minWidth: "220px",
    maxWidth: "280px",
    flexShrink: 0,
    scrollSnapAlign: "start",
    backgroundColor: "var(--menu-surface)",
    borderRadius: "var(--menu-radius)",
    overflow: "hidden",
    position: "relative",
  };

  // Apply card style from theme
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
    <div style={cardStyles as React.CSSProperties}>
      {/* Discount Badge */}
      {discountLabel && (
        <div
          style={{
            position: "absolute",
            top: promo.imageUrl ? "8px" : "0",
            right: promo.imageUrl ? "8px" : "0",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: "3px",
            padding: "3px 10px",
            borderRadius: promo.imageUrl
              ? "9999px"
              : `0 calc(var(--menu-radius) - 1px) 0 var(--menu-radius)`,
            backgroundColor: "var(--menu-accent)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 800,
            fontFamily: "var(--menu-body-font)",
            letterSpacing: "0.3px",
          }}
        >
          <Percent style={{ width: "10px", height: "10px" }} />
          {discountLabel}
        </div>
      )}

      {/* Image */}
      {promo.imageUrl && (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "2/1",
            overflow: "hidden",
          }}
        >
          <Image
            src={promo.imageUrl}
            fill
            alt={`${promo.title} promotion`}
            className="object-cover"
            sizes="280px"
            loading="lazy"
            placeholder="blur"
            blurDataURL={shimmerToBase64(280, 140)}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-sm)",
              fontWeight: 600,
              color: "var(--menu-text)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {promo.title}
          </h3>
        </div>

        {promo.description && (
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
            {promo.description}
          </p>
        )}

        {/* Type badge + end date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "8px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "9999px",
              backgroundColor: "var(--menu-primary)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "var(--menu-body-font)",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            <Tag style={{ width: "9px", height: "9px" }} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(t as any)(getPromotionTypeKey(promo.promotionType)) as string}
          </span>

          {promo.endDate && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--menu-muted)",
                fontFamily: "var(--menu-body-font)",
              }}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(t as any)("publicMenu.validUntil", {
                date: new Date(promo.endDate).toLocaleDateString(),
              }) as string}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
