"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "~/utils/cn";
import { getCategoryTranslations } from "~/utils/categoriesUtils";
import { assert } from "~/utils/assert";
import { type FullMenuOutput } from "~/utils/parseDishes";
import { NAVIGATION_HEIGHT } from "./types";

// ── Neo Gastro Palette ────────────────────────────────────────
const PALETTE = {
  ink: "#1A1B1E",
  sage: "#F5F5F0",
  muted: "#6B7280",
  white: "#FFFFFF",
} as const;

// Bumped nav height for pill-style buttons
const PILL_NAV_HEIGHT = 56;

// ================================================================
// Single Category Pill Button
// ================================================================

const SingleCategory = ({
  category,
  languageId,
  isLastVisibleSection,
  onVisibilityChange,
  themed,
}: {
  category: FullMenuOutput["categories"][number];
  languageId: string;
  isLastVisibleSection: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
  themed: boolean;
}) => {
  const translatedCategory = getCategoryTranslations({ category, languageId });
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
      className={cn(
        "relative whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold",
        "transition-all duration-300 ease-out",
        "flex-shrink-0 select-none",
        !themed &&
          cn(
            isActive
              ? "text-white shadow-sm"
              : "text-[#6B7280] hover:text-[#1A1B1E] hover:bg-[#F5F5F0]",
          ),
      )}
      style={{
        ...(themed
          ? {
              color: isActive ? "var(--menu-background)" : "var(--menu-muted)",
              backgroundColor: isActive
                ? "var(--menu-text)"
                : "transparent",
            }
          : {
              backgroundColor: isActive ? PALETTE.ink : "transparent",
            }),
        transform: isActive ? "scale(1.04)" : "scale(1)",
        transition:
          "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      id={`${category.id}-nav`}
    >
      {translatedCategory}
    </button>
  );
};

// ================================================================
// Categories Navigation (Horizontal Pill Scroll)
// ================================================================

export const CategoriesNavigation = ({
  categories,
  languageId,
  themed,
}: {
  categories: FullMenuOutput["categories"];
  languageId: string;
  themed: boolean;
}) => {
  const [visibleSetionsIds, setVisibleSetionsIds] = useState<string[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Mouse drag-to-scroll behavior
  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    slider.addEventListener("mousedown", onMouseDown);

    const onMouseLeave = () => {
      isDown = false;
      slider.classList.remove("active");
    };

    slider.addEventListener("mouseleave", onMouseLeave);

    const onMouseUp = () => {
      isDown = false;
      slider.classList.remove("active");
    };

    slider.addEventListener("mouseup", onMouseUp);

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 3;

      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener("mousemove", onMouseMove);

    return () => {
      slider.removeEventListener("mousedown", onMouseDown);
      slider.removeEventListener("mouseleave", onMouseLeave);
      slider.removeEventListener("mouseup", onMouseUp);
      slider.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <nav
      aria-label="Menu categories"
      className={cn(
        "z-10 flex w-full max-w-2xl items-center gap-2",
        "overflow-x-auto overflow-y-hidden",
        "px-4",
      )}
      ref={sliderRef}
      style={{
        height: PILL_NAV_HEIGHT,
        // Hide scrollbar across browsers
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        // Frosted glass background
        ...(themed
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--menu-background) 80%, transparent)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            }
          : {
              backgroundColor: "rgba(255, 255, 255, 0.80)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            }),
      }}
    >
      {categories.map((category) => (
        <SingleCategory
          onVisibilityChange={(isVisible) => {
            setVisibleSetionsIds((prevVisibleSectionsIds) => {
              let newVisibleSectionIds = [...prevVisibleSectionsIds];

              if (isVisible)
                newVisibleSectionIds = [
                  ...prevVisibleSectionsIds,
                  category.id,
                ];
              if (!isVisible)
                newVisibleSectionIds = prevVisibleSectionsIds.filter(
                  (id) => id !== category.id,
                );

              if (
                category.id ===
                newVisibleSectionIds[newVisibleSectionIds.length - 1]
              ) {
                const element = document.getElementById(
                  `${category.id}-nav`,
                );

                assert(!!element, "Element should exist");
                const elementOffsetLeft = element?.offsetLeft - 30;

                assert(!!sliderRef.current, "Slider should exist");
                sliderRef.current.scrollTo({
                  left: elementOffsetLeft,
                  behavior: "smooth",
                });
              }

              return newVisibleSectionIds;
            });
          }}
          isLastVisibleSection={
            category.id ===
            visibleSetionsIds?.[visibleSetionsIds.length - 1]
          }
          key={category.id}
          languageId={languageId}
          category={category}
          themed={themed}
        />
      ))}

      {/* Hide native scrollbar via inline style tag */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
nav[aria-label="Menu categories"]::-webkit-scrollbar {
  display: none;
}
`,
        }}
      />
    </nav>
  );
};
