"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getDefaultLanguage } from "~/utils/getDefaultLanguage";
import { type FullMenuOutput, parseDishes } from "~/utils/parseDishes";
import { notEmpty } from "~/utils/utils";
import { api } from "~/trpc/react";
import { type MenuTheme } from "~/lib/theme/types";
import { themeToCSS, buildGoogleFontsUrl } from "~/lib/theme/css-engine";

import { type ThemeLike, type Promotion, getSessionId } from "./components/types";
import { MenuHeader } from "./components/MenuHeader";
import { CategoriesNavigation } from "./components/CategoryNavigation";
import { DishGrid } from "./components/DishGrid";
import { PromotionsBanner } from "./components/PromotionsBanner";
import { FeaturedDishes } from "./components/FeaturedDishes";
import { ReviewsSection } from "./components/ReviewsSection";

// ── Main Component ─────────────────────────────────────────────

export const MainMenuView = ({
  menu,
  slug,
  initialTheme,
  initialPromotions,
}: {
  menu: FullMenuOutput;
  slug?: string;
  initialTheme?: ThemeLike | null;
  initialPromotions?: Promotion[];
}) => {
  const defaultLanguageSet = useRef(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const defaultLanguage = getDefaultLanguage(menu.menuLanguages);

  if (!defaultLanguageSet.current) {
    setSelectedLanguage(defaultLanguage.languageId);
    defaultLanguageSet.current = true;
  }

  const languageId = selectedLanguage || defaultLanguage.languageId;

  const parsedDishes = parseDishes(menu, languageId);

  // ── Theme ──────────────────────────────────────────────────
  const { data: fetchedTheme } = api.theme.getPublicTheme.useQuery(
    { menuSlug: slug ?? menu.slug },
    {
      staleTime: 10 * 60 * 1000,
      enabled: true,
    },
  );

  const theme = fetchedTheme ?? initialTheme;
  const themed = !!theme;

  const themeStyles = useMemo<Record<string, string>>(() => {
    if (!theme) {
      return {};
    }

    return themeToCSS(theme as unknown as MenuTheme);
  }, [theme]);

  const googleFontsUrl = useMemo(() => {
    if (!theme) {
      return null;
    }

    return buildGoogleFontsUrl(theme as unknown as MenuTheme);
  }, [theme]);

  // ── Session & Analytics ──────────────────────────────────
  const sessionId = useMemo(() => getSessionId(), []);
  const trackEvent = api.analytics.trackEvent.useMutation();

  useEffect(() => {
    if (!sessionId || !menu.id) return;
    trackEvent.mutate({
      menuId: menu.id,
      eventType: "menu_view",
      sessionId,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu.id, sessionId]);

  const handleDishClick = useCallback(
    (dishId: string, dishName: string) => {
      if (!sessionId) return;
      trackEvent.mutate({
        menuId: menu.id,
        eventType: "dish_click",
        sessionId,
        eventData: { dishId, dishName },
      });
    },
    [menu.id, sessionId, trackEvent],
  );

  // ── Active Schedules (category visibility) ──────────────
  const { data: activeScheduleData } = api.menus.getActiveSchedules.useQuery(
    { slug: slug ?? menu.slug },
    { staleTime: 60 * 1000 },
  );

  const hiddenCategoryIds = useMemo(() => {
    return new Set(activeScheduleData?.hiddenCategoryIds ?? []);
  }, [activeScheduleData]);

  const scheduledCategoryInfo = useMemo(() => {
    const map = new Map<string, { startTime: string | null; endTime: string | null; name: string }>();

    if (!activeScheduleData?.scheduledCategories) return map;
    for (const sc of activeScheduleData.scheduledCategories) {
      if (sc.isCurrentlyVisible) {
        map.set(sc.categoryId, { startTime: sc.startTime, endTime: sc.endTime, name: sc.name });
      }
    }

    return map;
  }, [activeScheduleData]);

  // Filter out hidden categories based on active schedules
  const visibleParsedDishes = useMemo(() => {
    if (hiddenCategoryIds.size === 0) return parsedDishes;

    return parsedDishes.filter(({ category }) => {
      if (!category?.id) return true; // Always show uncategorized

      return !hiddenCategoryIds.has(category.id);
    });
  }, [parsedDishes, hiddenCategoryIds]);

  // ── Allergens ────────────────────────────────────────────
  const { data: menuAllergens } = api.promotions.getMenuAllergens.useQuery(
    { menuId: menu.id },
    { staleTime: 5 * 60 * 1000 },
  );

  const allergensByDishId = useMemo(() => {
    const map = new Map<
      string,
      Array<{ id: string; name: string; icon: string | null; type: string | null; severity: string | null }>
    >();

    if (!menuAllergens) return map;

    for (const entry of menuAllergens) {
      map.set(entry.dishId, entry.allergens);
    }

    return map;
  }, [menuAllergens]);

  // ── Active Promotions ────────────────────────────────────
  const { data: fetchedPromotions } = api.promotions.getActivePromotions.useQuery(
    { menuId: menu.id },
    {
      staleTime: 2 * 60 * 1000,
    },
  );

  // Use fetched promotions from tRPC, falling back to server-provided initial data
  const activePromotions: Promotion[] | undefined = useMemo(() => {
    const source = fetchedPromotions ?? initialPromotions;

    if (!source) return undefined;

    return source.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      promotionType: p.promotionType,
      discountPercent: p.discountPercent,
      discountAmount: p.discountAmount,
      imageUrl: p.imageUrl,
    }));
  }, [fetchedPromotions, initialPromotions]);

  // ── Featured Dishes (from visible data, no extra API call) ──
  const allFeaturedDishes = useMemo(() => {
    return visibleParsedDishes.flatMap(({ dishes }) =>
      dishes.filter((dish) => dish.isFeatured && !dish.isSoldOut),
    );
  }, [visibleParsedDishes]);

  // ── Customer Favorites ───────────────────────────────────
  const { data: favorites, refetch: refetchFavorites } = api.promotions.getFavorites.useQuery(
    { menuId: menu.id, sessionId: sessionId || "none" },
    { enabled: !!sessionId, staleTime: 30 * 1000 },
  );

  const favoriteDishIds = useMemo(() => {
    return new Set(
      favorites?.map((f: { id: string; dishId: string; createdAt: Date }) => f.dishId) ?? [],
    );
  }, [favorites]);

  const toggleFavorite = api.promotions.toggleFavorite.useMutation({
    onSuccess: () => {
      void refetchFavorites();
    },
  });

  const handleToggleFavorite = useCallback(
    (dishId: string) => {
      if (!sessionId) return;
      toggleFavorite.mutate({
        menuId: menu.id,
        dishId,
        sessionId,
      });
    },
    [menu.id, sessionId, toggleFavorite],
  );

  // ── Public Reviews ───────────────────────────────────────
  const { data: reviewsData, refetch: refetchReviews } = api.reviews.getPublicReviews.useQuery(
    { menuId: menu.id, limit: 5 },
    { staleTime: 5 * 60 * 1000 },
  );

  return (
    <>
      {/* Google Fonts link for theme fonts */}
      {googleFontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={googleFontsUrl} />
      )}

      <div
        className="menu-themed z-0 flex h-full w-full"
        style={{
          ...themeStyles,
          backgroundColor: theme ? "var(--menu-background)" : undefined,
          color: theme ? "var(--menu-text)" : undefined,
          fontFamily: theme ? "var(--menu-body-font)" : undefined,
        }}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          {/* ── Header / Hero Image + Restaurant Info ──── */}
          <MenuHeader
            name={menu.name}
            address={menu.address}
            city={menu.city}
            backgroundImageUrl={menu.backgroundImageUrl}
            logoImageUrl={menu.logoImageUrl ?? null}
            themed={themed}
            theme={theme}
          />

          {/* ── Active Promotions Banner ─────────────────── */}
          {activePromotions && activePromotions.length > 0 && (
            <PromotionsBanner promotions={activePromotions} themed={themed} />
          )}

          {/* ── Featured Dishes ───────────────────────────── */}
          {allFeaturedDishes.length > 0 && (
            <FeaturedDishes
              dishes={allFeaturedDishes}
              themed={themed}
              currency={menu.currency}
            />
          )}

          {/* ── Category Navigation ──────────────────────── */}
          <div className="sticky top-0 z-20 flex w-full flex-row items-center justify-between">
            <CategoriesNavigation
              categories={visibleParsedDishes
                .filter((category) => category.dishes.length > 0)
                .map(({ category }) => category)
                .filter(notEmpty)}
              languageId={languageId}
              themed={themed}
            />
          </div>

          {/* ── Dishes ───────────────────────────────────── */}
          <div
            className="flex flex-col px-5 py-6"
            style={{ gap: theme ? "var(--menu-spacing-section)" : "32px" }}
          >
            {visibleParsedDishes?.map(({ category, dishes }) => {
              const scheduleInfo = category?.id
                ? scheduledCategoryInfo.get(category.id)
                : undefined;

              return (
                <DishGrid
                  key={category?.id || "no-category"}
                  category={category}
                  dishes={dishes}
                  themed={themed}
                  selectedLanguage={languageId}
                  allergensByDishId={allergensByDishId}
                  favoriteDishIds={favoriteDishIds}
                  onDishClick={handleDishClick}
                  onToggleFavorite={handleToggleFavorite}
                  scheduleInfo={scheduleInfo}
                />
              );
            })}
          </div>

          {/* ── Customer Reviews Section ───────────────────── */}
          <ReviewsSection
            reviews={reviewsData?.reviews ?? []}
            averageRating={reviewsData?.averageRating ?? 0}
            reviewCount={reviewsData?.reviewCount ?? 0}
            menuId={menu.id}
            onReviewSubmitted={() => void refetchReviews()}
            themed={themed}
          />
        </div>
      </div>
    </>
  );
};
