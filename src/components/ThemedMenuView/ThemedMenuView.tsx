"use client";

import { useRef, useState, useEffect, useMemo, useCallback, memo } from "react";

import { parseDishes } from "~/utils/parseDishes";
import { themeToCSS, buildGoogleFontsUrl, isDarkColor } from "~/lib/theme/css-engine";
import { getDefaultLanguage } from "~/utils/getDefaultLanguage";
import { notEmpty } from "~/utils/utils";
import { cn } from "~/utils/cn";
import { api } from "~/trpc/react";

import { type ThemedMenuViewProps, type ParsedDish } from "./types";
import { ThemedHeader } from "./components/ThemedHeader";
import { ThemedCategoryNav } from "./components/ThemedCategoryNav";
import { CategorySection, CategorySectionStyles } from "./components/CategorySection";
import { FeaturedDishes } from "./components/FeaturedDishes";
import {
  ThemedPromotionsBanner,
  type ThemedPromotion,
} from "./components/PromotionsBanner";
import { MenuSearchBar } from "./components/MenuSearchBar";
import {
  AllergenFilter,
  AllergenFilterStyles,
  type AllergenInfo,
} from "./components/AllergenFilter";
import { FloatingShareButton } from "./components/ShareMenu";
import { ShareCTABanner } from "./components/ShareCTA";
import { ThemedReviewsSection } from "./components/ThemedReviewsSection";
import {
  FavoritesProvider,
  FavoritesFilterButton,
  useFavorites,
} from "./components/DishFavorite";
import { CartProvider } from "./components/CartProvider";
import { CartDrawer, CartDrawerStyles } from "./components/CartDrawer";
import { FloatingCartButton, FloatingCartStyles } from "./components/FloatingCartButton";
import { AddToCartStyles } from "./components/AddToCartButton";
import { DishDetailSheet, DishDetailSheetStyles } from "./components/DishDetailSheet";
import { ThemedMenuViewErrorBoundary } from "./ThemedMenuViewErrorBoundary";
import { useMenuAnalytics } from "./hooks/useMenuAnalytics";

// ── Helpers ────────────────────────────────────────────────

/**
 * Sanitize user-provided CSS to prevent XSS attacks.
 * Strips dangerous CSS functions, protocols, and tag injection attempts.
 */
function sanitizeCSS(css: string): string {
  let sanitized = css.replace(/<\/?style[^>]*>/gi, "");

  sanitized = sanitized.replace(/expression\s*\(/gi, "");
  sanitized = sanitized.replace(/javascript\s*:/gi, "");
  sanitized = sanitized.replace(/@import/gi, "");
  sanitized = sanitized.replace(/url\s*\(/gi, "");
  sanitized = sanitized.replace(/-moz-binding/gi, "");
  sanitized = sanitized.replace(/behavior\s*:/gi, "");

  return sanitized;
}

/**
 * Normalize a string for search matching: lowercase + trim.
 */
function normalizeForSearch(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if a dish matches the search query by name or description.
 */
function dishMatchesSearch(dish: ParsedDish, query: string): boolean {
  if (!query) return true;
  const q = normalizeForSearch(query);
  const name = normalizeForSearch(dish.name ?? "");
  const description = normalizeForSearch(dish.description ?? "");

  return name.includes(q) || description.includes(q);
}

/**
 * Check if a dish should be hidden based on selected allergen filters.
 * Returns true if the dish should be VISIBLE (not hidden).
 */
function dishPassesAllergenFilter(
  dishId: string,
  selectedAllergenIds: Set<string>,
  allergensByDishId: Map<string, Array<{ id: string }>>,
): boolean {
  if (selectedAllergenIds.size === 0) return true;

  const dishAllergens = allergensByDishId.get(dishId);

  if (!dishAllergens || dishAllergens.length === 0) return true;

  // Hide the dish if it contains any of the selected allergens
  for (const allergen of dishAllergens) {
    if (selectedAllergenIds.has(allergen.id)) {
      return false;
    }
  }

  return true;
}

// ── Scroll-to-Top Arrow SVG ───────────────────────────────────

function ChevronUpIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// ── Scroll-to-Top Button ─────────────────────────────────────

function ScrollToTopButton({ backgroundIsDark }: { backgroundIsDark: boolean }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      style={{
        position: "fixed",
        bottom: "90px",
        left: "24px",
        zIndex: 30,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: "1px solid var(--menu-border)",
        backgroundColor: backgroundIsDark
          ? "rgba(30,30,40,0.9)"
          : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        color: "var(--menu-text)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        pointerEvents: isVisible ? "auto" : "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <ChevronUpIcon />
    </button>
  );
}

// ── Powered-by Footer ────────────────────────────────────────

function PoweredByFooter() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "28px 20px 36px",
        borderTop: "1px solid var(--menu-border)",
        marginTop: "var(--menu-spacing-section)",
      }}
    >
      <a
        href={process.env.NEXT_PUBLIC_APP_URL ?? "https://www.diyafa.ma"}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-sm)",
          color: "var(--menu-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          transition: "opacity 0.2s",
          opacity: 0.7,
        }}
      >
        Powered by{" "}
        <span
          style={{
            fontWeight: 700,
            color: "var(--menu-primary)",
            letterSpacing: "0.3px",
          }}
        >
          Diyafa
        </span>
      </a>
    </div>
  );
}

// ── View Keyframe Styles ─────────────────────────────────────

function ThemedMenuViewStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes menuContentFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
`,
      }}
    />
  );
}

// ── Empty Filter State ──────────────────────────────────────

const EmptyFilterState = memo(function EmptyFilterState({
  searchQuery,
  hasAllergenFilters,
  onClearFilters,
}: {
  searchQuery: string;
  hasAllergenFilters: boolean;
  onClearFilters: () => void;
}) {
  let message = "Try removing some allergen filters.";

  if (searchQuery && hasAllergenFilters) {
    message = "Try adjusting your search or allergen filters.";
  } else if (searchQuery) {
    message = "Try a different search term.";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          marginBottom: "16px",
          opacity: 0.6,
        }}
      >
        {hasAllergenFilters ? "\uD83D\uDD0D\uD83C\uDF7D\uFE0F" : "\uD83D\uDD0D"}
      </div>
      <h3
        style={{
          fontFamily: "var(--menu-heading-font)",
          fontSize: "var(--menu-font-xl)",
          fontWeight: 600,
          color: "var(--menu-text)",
          marginBottom: "8px",
        }}
      >
        No dishes found
      </h3>
      <p
        style={{
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-base)",
          color: "var(--menu-muted)",
          maxWidth: "320px",
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        style={{
          marginTop: "20px",
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-base)",
          color: "var(--menu-primary)",
          backgroundColor: "transparent",
          border: "1px solid var(--menu-primary)",
          borderRadius: "var(--menu-radius, 8px)",
          padding: "10px 24px",
          cursor: "pointer",
          fontWeight: 500,
          transition: "all 0.15s",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        Clear all filters
      </button>
    </div>
  );
});

// ── Main Component (outer wrapper with FavoritesProvider) ───

export const ThemedMenuView = ({
  menu,
  theme,
  isPreview = false,
  activePromotions,
}: ThemedMenuViewProps & {
  activePromotions?: ThemedPromotion[];
}) => {
  return (
    <FavoritesProvider menuSlug={menu.slug}>
      <CartProvider
        menuSlug={menu.slug}
        menuId={menu.id}
        menuName={menu.name}
        currency={menu.currency}
        whatsappNumber={menu.whatsappNumber}
        enabledOrderTypes={menu.enabledOrderTypes ?? ["dine_in"]}
        deliveryFee={menu.deliveryFee ?? 0}
        minOrderAmount={menu.minOrderAmount ?? 0}
      >
        <ThemedMenuViewErrorBoundary>
          <ThemedMenuViewInner
            menu={menu}
            theme={theme}
            isPreview={isPreview}
            activePromotions={activePromotions}
          />
        </ThemedMenuViewErrorBoundary>
      </CartProvider>
    </FavoritesProvider>
  );
};

// ── Inner Component ─────────────────────────────────────────

const ThemedMenuViewInner = ({
  menu,
  theme,
  isPreview = false,
  activePromotions,
}: ThemedMenuViewProps & {
  activePromotions?: ThemedPromotion[];
}) => {
  const defaultLanguageSet = useRef(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedDish, setSelectedDish] = useState<ParsedDish | null>(null);

  // ── Analytics tracking ─────────────────────────────────
  const { trackDishClick } = useMenuAnalytics({
    menuId: menu.id,
    disabled: isPreview,
  });

  const defaultLanguage = getDefaultLanguage(menu.menuLanguages);

  if (!defaultLanguageSet.current) {
    setSelectedLanguage(defaultLanguage.languageId);
    defaultLanguageSet.current = true;
  }

  const languageId = selectedLanguage || defaultLanguage.languageId;
  const parsedDishes = parseDishes(menu, languageId);
  const cssVarsObject = themeToCSS(theme);
  const fontsUrl = buildGoogleFontsUrl(theme);
  const backgroundIsDark = isDarkColor(theme.backgroundColor);

  // ── Fetch allergens for this menu ──────────────────────

  const { data: menuAllergenData } = api.promotions.getMenuAllergens.useQuery(
    { menuId: menu.id },
    { staleTime: 5 * 60 * 1000, enabled: !isPreview },
  );

  // Build a map of dishId -> allergen info array
  const allergensByDishId = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        id: string;
        name: string;
        icon: string | null;
        type: string | null;
        severity: string | null;
      }>
    >();

    if (!menuAllergenData) return map;

    for (const entry of menuAllergenData) {
      map.set(entry.dishId, entry.allergens);
    }

    return map;
  }, [menuAllergenData]);

  // Derive unique allergens present in this menu (for filter options)
  const menuAllergens = useMemo<AllergenInfo[]>(() => {
    if (!menuAllergenData) return [];

    const allergenMap = new Map<string, AllergenInfo>();

    for (const entry of menuAllergenData) {
      for (const allergen of entry.allergens) {
        if (!allergenMap.has(allergen.id)) {
          allergenMap.set(allergen.id, {
            id: allergen.id,
            name: allergen.name,
            icon: allergen.icon,
            type: allergen.type,
          });
        }
      }
    }

    return Array.from(allergenMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [menuAllergenData]);

  // ── Inject Google Fonts link into head ─────────────────

  useEffect(() => {
    const existingLink = document.querySelector(
      `link[href="${fontsUrl}"]`,
    );

    if (existingLink) return;

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = fontsUrl;
    document.head.appendChild(link);

    return () => {
      // Only remove if no other themed view is using it
      const stillNeeded = document.querySelector(
        `link[href="${fontsUrl}"]`,
      );

      if (stillNeeded && stillNeeded === link) {
        document.head.removeChild(link);
      }
    };
  }, [fontsUrl]);

  // ── Favorites context ─────────────────────────────────

  const { showFavoritesOnly, isFavorite } = useFavorites();

  // ── Filter & search logic ─────────────────────────────

  const isFiltering = searchQuery.length > 0 || selectedAllergenIds.size > 0;

  // All categories with at least one dish (before filtering)
  const allVisibleCategories = useMemo(
    () => parsedDishes.filter((cat) => cat.dishes.length > 0),
    [parsedDishes],
  );

  // Count total dishes (before filtering)
  const totalDishCount = useMemo(() => {
    return allVisibleCategories.reduce(
      (sum, cat) => sum + cat.dishes.length,
      0,
    );
  }, [allVisibleCategories]);

  // Apply search + allergen filters
  const filteredCategories = useMemo(() => {
    if (!isFiltering) return allVisibleCategories;

    return allVisibleCategories
      .map((cat) => {
        const filteredDishes = cat.dishes.filter((dish) => {
          const matchesSearch = dishMatchesSearch(dish, searchQuery);
          const passesAllergen = dishPassesAllergenFilter(
            dish.id,
            selectedAllergenIds,
            allergensByDishId,
          );

          return matchesSearch && passesAllergen;
        });

        return {
          category: cat.category,
          dishes: filteredDishes,
        };
      })
      .filter((cat) => cat.dishes.length > 0);
  }, [
    allVisibleCategories,
    searchQuery,
    selectedAllergenIds,
    allergensByDishId,
    isFiltering,
  ]);

  // Apply favorites filter on top of search/allergen results
  const afterFavoritesFilter = useMemo(() => {
    const base = isFiltering ? filteredCategories : allVisibleCategories;

    if (!showFavoritesOnly) return base;

    return base
      .map((cat) => ({
        ...cat,
        dishes: cat.dishes.filter((dish) => isFavorite(dish.id)),
      }))
      .filter((cat) => cat.dishes.length > 0);
  }, [isFiltering, filteredCategories, allVisibleCategories, showFavoritesOnly, isFavorite]);

  // The categories used for display
  const visibleCategories = afterFavoritesFilter;

  // Count of filtered dishes (for search bar display)
  const filteredDishCount = useMemo(() => {
    if (!isFiltering) return totalDishCount;

    return filteredCategories.reduce(
      (sum, cat) => sum + cat.dishes.length,
      0,
    );
  }, [filteredCategories, isFiltering, totalDishCount]);

  // Collect all featured dishes across all categories for the featured section
  const allFeaturedDishes = useMemo(
    () =>
      allVisibleCategories.flatMap(({ dishes }) =>
        dishes.filter((dish) => dish.isFeatured),
      ),
    [allVisibleCategories],
  );

  // ── Allergen callbacks ────────────────────────────────

  const handleToggleAllergen = useCallback((allergenId: string) => {
    setSelectedAllergenIds((prev) => {
      const next = new Set(prev);

      if (next.has(allergenId)) {
        next.delete(allergenId);
      } else {
        next.add(allergenId);
      }

      return next;
    });
  }, []);

  const handleClearAllergens = useCallback(() => {
    setSelectedAllergenIds(new Set());
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedAllergenIds(new Set());
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleDishClick = useCallback((dish: ParsedDish) => {
    if (!isPreview) {
      setSelectedDish(dish);
      trackDishClick(dish.id, dish.name ?? "");
    }
  }, [isPreview, trackDishClick]);

  // ── Render ────────────────────────────────────────────

  return (
    <div
      className={cn(
        "menu-themed relative min-h-screen w-full",
        isPreview && "pointer-events-none select-none",
      )}
      style={{
        ...cssVarsObject,
        backgroundColor: "var(--menu-background)",
        color: "var(--menu-text)",
        fontFamily: "var(--menu-body-font)",
        fontSize: "var(--menu-font-base)",
      }}
    >
      {/* Global keyframe animations */}
      <AllergenFilterStyles />
      <ThemedMenuViewStyles />
      <CategorySectionStyles />
      {!isPreview && <CartDrawerStyles />}
      {!isPreview && <FloatingCartStyles />}
      {!isPreview && <AddToCartStyles />}
      {!isPreview && <DishDetailSheetStyles />}

      {/* Custom CSS injection (sanitized to prevent XSS) */}
      {theme.customCss && (
        <style
          dangerouslySetInnerHTML={{
            __html: `.menu-themed { ${sanitizeCSS(theme.customCss.slice(0, 5000))} }`,
          }}
        />
      )}

      {/* Header */}
      <ThemedHeader menu={menu} theme={theme} />

      {/* Active Promotions Banner */}
      {activePromotions && activePromotions.length > 0 && (
        <ThemedPromotionsBanner
          promotions={activePromotions}
          theme={theme}
          currency={menu.currency}
        />
      )}

      {/* Featured Dishes Section */}
      {allFeaturedDishes.length > 0 && (
        <FeaturedDishes
          dishes={allFeaturedDishes}
          theme={theme}
          languageId={languageId}
          currency={menu.currency}
        />
      )}

      {/* Category Navigation */}
      {theme.showCategoryNav && visibleCategories.length > 0 && (
        <ThemedCategoryNav
          categories={visibleCategories
            .map(({ category }) => category)
            .filter(notEmpty)}
          languageId={languageId}
          theme={theme}
          backgroundIsDark={backgroundIsDark}
        />
      )}

      {/* Search & Allergen Filter Bar */}
      {!isPreview && (
        <div
          style={{
            position: "sticky",
            top: theme.showCategoryNav ? "44px" : "0px",
            zIndex: 19,
            backgroundColor: backgroundIsDark
              ? "rgba(0,0,0,0.75)"
              : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: isFiltering
              ? "1px solid var(--menu-border)"
              : "none",
            transition: "border-color 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 20px",
              maxWidth: theme.layoutStyle === "grid" ? "900px" : "720px",
              marginLeft: "auto",
              marginRight: "auto",
              width: "100%",
            }}
          >
            <MenuSearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              resultCount={isFiltering ? filteredDishCount : null}
              totalCount={totalDishCount}
              backgroundIsDark={backgroundIsDark}
            />
            {menuAllergens.length > 0 && (
              <AllergenFilter
                allergens={menuAllergens}
                selectedAllergenIds={selectedAllergenIds}
                onToggleAllergen={handleToggleAllergen}
                onClearAll={handleClearAllergens}
                backgroundIsDark={backgroundIsDark}
              />
            )}
            <FavoritesFilterButton />
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div
        style={{
          padding: `var(--menu-spacing-section) 20px`,
          maxWidth: theme.layoutStyle === "grid" ? "900px" : "720px",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
          animation: "menuContentFadeIn 0.3s ease-out",
        }}
      >
        {visibleCategories.length > 0 && (
          visibleCategories.map(({ category, dishes }) => (
            <CategorySection
              key={category?.id ?? "no-category"}
              category={category}
              dishes={dishes}
              theme={theme}
              languageId={languageId}
              menuName={menu.name}
              menuSlug={menu.slug}
              currency={menu.currency}
              isPreview={isPreview}
              onDishClick={handleDishClick}
            />
          ))
        )}

        {visibleCategories.length === 0 && showFavoritesOnly && (
          /* Empty state when favorites filter is active */
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--menu-muted)",
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-base)",
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>No favorites yet</p>
            <p style={{ margin: "8px 0 0", fontSize: "var(--menu-font-sm)" }}>
              Tap the heart icon on any dish to save it here.
            </p>
          </div>
        )}

        {visibleCategories.length === 0 && !showFavoritesOnly && isFiltering && (
          /* Empty state when filtering produces no results */
          <EmptyFilterState
            searchQuery={searchQuery}
            hasAllergenFilters={selectedAllergenIds.size > 0}
            onClearFilters={handleClearAllFilters}
          />
        )}
      </div>

      {/* Reviews Section */}
      {!isPreview && (
        <ThemedReviewsSection menuId={menu.id} menuSlug={menu.slug} />
      )}

      {/* Share CTA Banner */}
      {!isPreview && (
        <ShareCTABanner menuName={menu.name} menuSlug={menu.slug} />
      )}

      {/* Powered by Diyafa footer */}
      {!isPreview && <PoweredByFooter />}

      {/* Floating Share Button */}
      {!isPreview && (
        <FloatingShareButton menuName={menu.name} menuSlug={menu.slug} />
      )}

      {/* Floating Cart Button */}
      {!isPreview && <FloatingCartButton />}

      {/* Cart Drawer */}
      {!isPreview && <CartDrawer />}

      {/* Scroll to Top Button */}
      {!isPreview && <ScrollToTopButton backgroundIsDark={backgroundIsDark} />}

      {/* Dish Detail Bottom Sheet */}
      {!isPreview && (
        <DishDetailSheet
          dish={selectedDish}
          isOpen={!!selectedDish}
          onClose={() => setSelectedDish(null)}
          currency={menu.currency}
          languageId={languageId}
        />
      )}
    </div>
  );
};
