"use client";

import { memo, useRef, useEffect, useState } from "react";
import { type MenuTheme } from "~/lib/theme/types";

import { type ParsedCategory, type ParsedDish, type DishLayoutProps } from "../types";
import { DishesLayout } from "./layouts";

// ── Category Section Styles ──────────────────────────────────────

export function CategorySectionStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes menuCategoryFadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`,
      }}
    />
  );
}

// ── Category Section ────────────────────────────────────────

export const CategorySection = memo(function CategorySection({
  category,
  dishes,
  theme,
  languageId,
  menuName,
  menuSlug,
  currency,
  isPreview,
  onDishClick,
}: {
  category: ParsedCategory["category"];
  dishes: ParsedDish[];
  theme: MenuTheme;
  languageId: string;
  menuName?: string;
  menuSlug?: string;
  currency?: string;
  isPreview?: boolean;
  onDishClick?: DishLayoutProps["onDishClick"];
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || !dishes.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(section);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 60px 0px" },
    );

    observer.observe(section);

    return () => {
      observer.unobserve(section);
    };
  }, [dishes.length]);

  if (!dishes.length) return null;

  return (
    <div
      ref={sectionRef}
      id={category?.id}
      style={{
        marginBottom: "var(--menu-spacing-section)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
      }}
    >
      {/* Category Header */}
      {category?.name && (
        <CategoryHeader
          name={category.name}
          theme={theme}
        />
      )}

      {/* Category Divider */}
      {theme.showCategoryDividers && category?.name && (
        <CategoryDivider theme={theme} />
      )}

      {/* Dishes by layout */}
      <DishesLayout
        dishes={dishes}
        theme={theme}
        languageId={languageId}
        menuName={menuName}
        menuSlug={menuSlug}
        currency={currency}
        isPreview={isPreview}
        onDishClick={onDishClick}
      />
    </div>
  );
});

// ── Category Header ─────────────────────────────────────────

function CategoryHeader({
  name,
  theme,
}: {
  name: string;
  theme: MenuTheme;
}) {
  switch (theme.layoutStyle) {
    case "minimal":
      return (
        <h2
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            fontWeight: 600,
            color: "var(--menu-muted)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "var(--menu-spacing-item)",
            paddingBottom: "8px",
          }}
        >
          {name}
        </h2>
      );

    case "magazine":
      return (
        <h2
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "calc(var(--menu-font-2xl) * 1.1)",
            fontWeight: 700,
            color: "var(--menu-text)",
            marginBottom: "var(--menu-spacing-item)",
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
          }}
        >
          {name}
        </h2>
      );

    case "elegant":
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "var(--menu-spacing-item)",
            paddingBottom: "8px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "linear-gradient(to right, transparent, var(--menu-primary))",
            }}
          />
          <h2
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-xl)",
              fontWeight: 600,
              color: "var(--menu-text)",
              margin: 0,
              whiteSpace: "nowrap",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {name}
          </h2>
          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "linear-gradient(to left, transparent, var(--menu-primary))",
            }}
          />
        </div>
      );

    case "modern":
      return (
        <h2
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-xl)",
            fontWeight: 700,
            color: "var(--menu-text)",
            marginBottom: "4px",
            paddingBottom: "8px",
            borderBottom: "3px solid var(--menu-accent)",
            display: "inline-block",
          }}
        >
          {name}
        </h2>
      );

    case "grid":
      return (
        <h2
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-xl)",
            fontWeight: 700,
            color: "var(--menu-text)",
            marginBottom: "var(--menu-spacing-item)",
            width: "100%",
          }}
        >
          {name}
        </h2>
      );

    // classic (Neo Gastro accent bar)
    default:
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "var(--menu-spacing-item)",
          }}
        >
          <div
            style={{
              width: "4px",
              height: "24px",
              borderRadius: "4px",
              backgroundColor: "var(--menu-primary)",
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-xl)",
              fontWeight: 700,
              color: "var(--menu-text)",
              margin: 0,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </h2>
        </div>
      );
  }
}

// ── Category Divider ────────────────────────────────────────

function CategoryDivider({ theme }: { theme: MenuTheme }) {
  if (theme.layoutStyle === "elegant") {
    // Elegant already has decorative lines in the header
    return null;
  }

  if (theme.layoutStyle === "minimal") {
    return (
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "var(--menu-border)",
          marginBottom: "var(--menu-spacing-item)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "1px",
        backgroundColor: "var(--menu-border)",
        marginBottom: "var(--menu-spacing-item)",
      }}
    />
  );
}
