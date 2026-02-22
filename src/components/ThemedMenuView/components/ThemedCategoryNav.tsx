"use client";

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { type FullMenuOutput } from "~/utils/parseDishes";
import { type MenuTheme } from "~/lib/theme/types";
import { getCategoryTranslations } from "~/utils/categoriesUtils";

import { NAVIGATION_HEIGHT } from "../types";

// ── Category Navigation Keyframe Styles ──────────────────────────

export function ThemedCategoryNavStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes menuNavIndicatorSlide {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}
.menu-category-nav::-webkit-scrollbar {
  display: none;
}
.menu-category-nav {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
`,
      }}
    />
  );
}

// ── Category Navigation ─────────────────────────────────────

export const ThemedCategoryNav = memo(function ThemedCategoryNav({
  categories,
  languageId,
  theme,
  backgroundIsDark,
}: {
  categories: FullMenuOutput["categories"];
  languageId: string;
  theme: MenuTheme;
  backgroundIsDark: boolean;
}) {
  const [visibleSectionIds, setVisibleSectionIds] = useState<string[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll overflow state
  const checkScrollState = useCallback(() => {
    const slider = sliderRef.current;

    if (!slider) return;

    const hasOverflow = slider.scrollWidth > slider.clientWidth;

    setCanScrollLeft(slider.scrollLeft > 2);
    setCanScrollRight(
      hasOverflow &&
        slider.scrollLeft < slider.scrollWidth - slider.clientWidth - 2,
    );
  }, []);

  // Observe scroll and resize
  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) return;

    checkScrollState();

    slider.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);

    return () => {
      slider.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [checkScrollState, categories]);

  // Mouse drag scrolling for desktop
  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      slider.style.cursor = "grabbing";
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      slider.style.cursor = "grab";
    };

    const onMouseUp = () => {
      isDown = false;
      slider.style.cursor = "grab";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;

      slider.scrollLeft = scrollLeft - walk;
    };

    // Horizontal mouse wheel scroll
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        slider.scrollLeft += e.deltaY;
      }
    };

    slider.addEventListener("mousedown", onMouseDown);
    slider.addEventListener("mouseleave", onMouseLeave);
    slider.addEventListener("mouseup", onMouseUp);
    slider.addEventListener("mousemove", onMouseMove);
    slider.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      slider.removeEventListener("mousedown", onMouseDown);
      slider.removeEventListener("mouseleave", onMouseLeave);
      slider.removeEventListener("mouseup", onMouseUp);
      slider.removeEventListener("mousemove", onMouseMove);
      slider.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Gradient fade colors based on dark/light mode
  const fadeColor = backgroundIsDark
    ? "rgba(0,0,0,0.85)"
    : "rgba(255,255,255,0.92)";
  const fadeTransparent = backgroundIsDark
    ? "rgba(0,0,0,0)"
    : "rgba(255,255,255,0)";

  return (
    <>
      <ThemedCategoryNavStyles />
      <nav
        aria-label="Menu categories"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          width: "100%",
          backgroundColor: backgroundIsDark
            ? "rgba(0,0,0,0.85)"
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--menu-border)",
          height: `${NAVIGATION_HEIGHT}px`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Left gradient fade */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "32px",
              background: `linear-gradient(to right, ${fadeColor}, ${fadeTransparent})`,
              zIndex: 2,
              pointerEvents: "none",
              opacity: canScrollLeft ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          />

          {/* Right gradient fade */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "32px",
              background: `linear-gradient(to left, ${fadeColor}, ${fadeTransparent})`,
              zIndex: 2,
              pointerEvents: "none",
              opacity: canScrollRight ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          />

          {/* Scrollable category buttons */}
          <div
            ref={sliderRef}
            className="menu-category-nav"
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              overflowX: "auto",
              scrollbarWidth: "none",
              cursor: "grab",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {categories.map((category) => (
              <ThemedSingleCategory
                key={category.id}
                category={category}
                languageId={languageId}
                theme={theme}
                isLastVisibleSection={
                  category.id ===
                  visibleSectionIds[visibleSectionIds.length - 1]
                }
                onVisibilityChange={(isVisible) => {
                  setVisibleSectionIds((prev) => {
                    let next = [...prev];

                    if (isVisible) {
                      next = [...prev, category.id];
                    } else {
                      next = prev.filter((id) => id !== category.id);
                    }

                    if (category.id === next[next.length - 1]) {
                      const element = document.getElementById(
                        `${category.id}-themed-nav`,
                      );

                      if (element && sliderRef.current) {
                        const elementOffsetLeft = element.offsetLeft - 30;

                        sliderRef.current.scrollTo({
                          left: elementOffsetLeft,
                          behavior: "smooth",
                        });
                      }
                    }

                    return next;
                  });
                }}
                sliderRef={sliderRef}
              />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
});

// ── Single Category Button ──────────────────────────────────

const ThemedSingleCategory = memo(function ThemedSingleCategory({
  category,
  languageId,
  theme: _theme,
  isLastVisibleSection,
  onVisibilityChange,
  sliderRef: _sliderRef,
}: {
  category: FullMenuOutput["categories"][number];
  languageId: string;
  theme: MenuTheme;
  isLastVisibleSection: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
  sliderRef: React.RefObject<HTMLDivElement>;
}) {
  const translatedCategory = getCategoryTranslations({
    category,
    languageId,
  });
  const { ref, inView } = useInView({
    onChange(_inView) {
      onVisibilityChange(_inView);
    },
  });

  const navigateToCategory = useCallback(() => {
    const element = document.getElementById(category.id);

    if (element) {
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const finalScrollPosition =
        absoluteElementTop - NAVIGATION_HEIGHT - 20;

      window.scrollTo({
        top: finalScrollPosition,
        behavior: "smooth",
      });
    }
  }, [category.id]);

  useEffect(() => {
    ref(document.getElementById(category.id));
  }, [category.id, ref]);

  const isActive = inView && isLastVisibleSection;

  return (
    <button
      type="button"
      onClick={navigateToCategory}
      id={`${category.id}-themed-nav`}
      aria-current={isActive ? "true" : undefined}
      style={{
        whiteSpace: "nowrap",
        padding: "6px 16px",
        margin: "6px 3px",
        minWidth: "44px",
        minHeight: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--menu-body-font)",
        fontSize: "var(--menu-font-sm)",
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "#FFFFFF" : "var(--menu-muted)",
        backgroundColor: isActive ? "var(--menu-primary)" : "transparent",
        border: "none",
        borderRadius: "9999px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
        animation: isActive ? "menuNavIndicatorSlide 0.2s ease-out" : "none",
        boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
      }}
    >
      {translatedCategory}
    </button>
  );
});
