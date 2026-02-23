# Sprint 3: Customer-Facing Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform every customer-facing surface of Diyafa from basic/generic to world-class — rebuilding the public menu from scratch with ordering, redesigning the explore page, adding a Linktree-style restaurant page, and fixing critical bugs.

**Architecture:** The public menu (`/menu/[slug]`) is rebuilt as a new `PublicMenu` component that replaces `MainMenuView`. It uses CSS custom properties for theme colors/fonts (via the existing `themeToCSS` engine) combined with Tailwind for structure. The layout engine switches rendering between 6 layout modes based on the owner's theme config. Cart state, analytics hooks, and ordering logic are extracted from the dead `ThemedMenuView` code and integrated cleanly. The explore page is redesigned in-place. The Linktree page is a new route with new Prisma model.

**Tech Stack:** Next.js 14, Tailwind CSS, CSS custom properties, lucide-react, next/image, next/dynamic, tRPC, Prisma, react-i18next.

---

## Overview

| Phase | What | Effort | Priority |
|-------|------|--------|----------|
| 0 | Fix Button asChild+loading bug | 10 min | P0 |
| 1 | Public Menu rebuild (core shell + header + categories + dishes) | 3-4 hours | P0 |
| 2 | Public Menu interactions (dish detail, cart, search, filters, sharing, language) | 3-4 hours | P0 |
| 3 | Explore page redesign | 2 hours | P1 |
| 4 | Restaurant Linktree page | 2 hours | P1 |
| 5 | Tests + verification | 1-2 hours | P0 |

---

## Phase 0: Button Bug Fix

### Task 0.1: Fix Button asChild + loading crash

**Files:**
- Modify: `src/components/ui/button.tsx` (lines 50-67)

**Problem:** When `asChild=true` and `loading=true`, the `Slot` component receives two children (`<Spinner>` + `<span>`), causing `React.Children.only` error.

**Step 1: Fix the Button component**

Replace lines 50-67 with:

```tsx
const Comp = asChild ? Slot : "button";

// When asChild is used, Slot requires exactly one child.
// Don't inject Spinner as a sibling — wrap children instead.
if (asChild) {
  return (
    <Comp
      className={cn(
        "relative flex select-none items-center justify-center",
        buttonVariants({ variant, size, className }),
      )}
      data-loading={loading}
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  );
}

return (
  <Comp
    className={cn(
      "relative flex select-none items-center justify-center",
      buttonVariants({ variant, size, className }),
    )}
    data-loading={loading}
    ref={ref}
    {...props}
  >
    {loading && (
      <Spinner className="absolute text-primary-foreground dark:text-primary" />
    )}
    {loading ? <span className="opacity-0">{children}</span> : children}
  </Comp>
);
```

**Step 2: Verify**

Run: `pnpm check-types`
Expected: zero errors

**Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "fix: Button asChild+loading crash (Slot requires single child)"
```

---

## Phase 1: Public Menu Rebuild — Core

### Task 1.1: Create PublicMenu shell component + wire to route

**Files:**
- Create: `src/components/PublicMenu/PublicMenu.tsx`
- Create: `src/components/PublicMenu/types.ts`
- Create: `src/components/PublicMenu/hooks/useMenuData.ts`
- Modify: `src/pageComponents/Menu/Menu.page.tsx` (swap MainMenuView → PublicMenu)

**Step 1: Create types file**

```typescript
// src/components/PublicMenu/types.ts
import { type FullMenuOutput } from "~/utils/parseDishes";
import { type MenuTheme, type LayoutStyle } from "~/lib/theme/types";

export interface PublicMenuProps {
  menu: FullMenuOutput;
  slug: string;
  initialTheme?: Partial<MenuTheme> | null;
  initialPromotions?: Promotion[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  promotionType: string;
  discountPercent: number | null;
  discountAmount: number | null;
  imageUrl: string | null;
}

export interface ParsedDish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isSoldOut: boolean;
  prepTime: number | null;
  tags: string[];
  variants: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  macros: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  } | null;
}

export interface ParsedCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface ThemeConfig {
  layout: LayoutStyle;
  css: Record<string, string>;
  fontsUrl: string | null;
  raw: MenuTheme;
}
```

**Step 2: Create useMenuData hook**

This hook consolidates ALL the data-fetching logic currently scattered across MainMenuView (theme, promotions, allergens, schedules, favorites, reviews, analytics):

```typescript
// src/components/PublicMenu/hooks/useMenuData.ts
"use client";

import { useMemo, useEffect, useCallback, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { type FullMenuOutput, parseDishes } from "~/utils/parseDishes";
import { getDefaultLanguage } from "~/utils/getDefaultLanguage";
import { notEmpty } from "~/utils/utils";
import { themeToCSS, buildGoogleFontsUrl } from "~/lib/theme/css-engine";
import { type MenuTheme, DEFAULT_THEME } from "~/lib/theme/types";
import { type ThemeConfig, type Promotion } from "../types";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("diyafa_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("diyafa_session", id);
  }
  return id;
}

export function useMenuData(
  menu: FullMenuOutput,
  slug: string,
  initialTheme?: Partial<MenuTheme> | null,
  initialPromotions?: Promotion[],
) {
  // ── Language ─────────────────────────────────────────
  const defaultLanguage = getDefaultLanguage(menu.menuLanguages);
  const defaultLanguageSet = useRef(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  if (!defaultLanguageSet.current) {
    setSelectedLanguage(defaultLanguage.languageId);
    defaultLanguageSet.current = true;
  }
  const languageId = selectedLanguage || defaultLanguage.languageId;

  const availableLanguages = useMemo(() => {
    return menu.menuLanguages.map((ml) => ({
      id: ml.languageId,
      name: ml.language?.name ?? ml.languageId,
      nativeName: ml.language?.nativeName ?? ml.languageId,
    }));
  }, [menu.menuLanguages]);

  // ── Theme ────────────────────────────────────────────
  const { data: fetchedTheme } = api.theme.getPublicTheme.useQuery(
    { menuSlug: slug },
    { staleTime: 10 * 60 * 1000 },
  );

  const themeConfig = useMemo<ThemeConfig>(() => {
    const raw = { ...DEFAULT_THEME, ...(fetchedTheme ?? initialTheme) } as MenuTheme;
    return {
      layout: raw.layoutStyle,
      css: themeToCSS(raw),
      fontsUrl: buildGoogleFontsUrl(raw),
      raw,
    };
  }, [fetchedTheme, initialTheme]);

  // ── Parsed dishes ────────────────────────────────────
  const parsedDishes = parseDishes(menu, languageId);

  // ── Schedules ────────────────────────────────────────
  const { data: activeScheduleData } = api.menus.getActiveSchedules.useQuery(
    { slug },
    { staleTime: 60 * 1000 },
  );

  const hiddenCategoryIds = useMemo(() => {
    return new Set(activeScheduleData?.hiddenCategoryIds ?? []);
  }, [activeScheduleData]);

  const visibleCategories = useMemo(() => {
    if (hiddenCategoryIds.size === 0) return parsedDishes;
    return parsedDishes.filter(({ category }) => {
      if (!category?.id) return true;
      return !hiddenCategoryIds.has(category.id);
    });
  }, [parsedDishes, hiddenCategoryIds]);

  // ── Allergens ────────────────────────────────────────
  const { data: menuAllergens } = api.promotions.getMenuAllergens.useQuery(
    { menuId: menu.id },
    { staleTime: 5 * 60 * 1000 },
  );

  const allergensByDishId = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string; icon: string | null; type: string | null; severity: string | null }>>();
    if (!menuAllergens) return map;
    for (const entry of menuAllergens) map.set(entry.dishId, entry.allergens);
    return map;
  }, [menuAllergens]);

  // ── Promotions ───────────────────────────────────────
  const { data: fetchedPromotions } = api.promotions.getActivePromotions.useQuery(
    { menuId: menu.id },
    { staleTime: 2 * 60 * 1000 },
  );

  const activePromotions = useMemo<Promotion[]>(() => {
    const source = fetchedPromotions ?? initialPromotions;
    if (!source) return [];
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

  // ── Featured ─────────────────────────────────────────
  const featuredDishes = useMemo(() => {
    return visibleCategories.flatMap(({ dishes }) =>
      dishes.filter((d) => d.isFeatured && !d.isSoldOut),
    );
  }, [visibleCategories]);

  // ── Session + Analytics ──────────────────────────────
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

  // ── Favorites ────────────────────────────────────────
  const { data: favorites, refetch: refetchFavorites } = api.promotions.getFavorites.useQuery(
    { menuId: menu.id, sessionId: sessionId || "none" },
    { enabled: !!sessionId, staleTime: 30 * 1000 },
  );

  const favoriteDishIds = useMemo(() => {
    return new Set(favorites?.map((f: { dishId: string }) => f.dishId) ?? []);
  }, [favorites]);

  const toggleFavorite = api.promotions.toggleFavorite.useMutation({
    onSuccess: () => void refetchFavorites(),
  });

  const handleToggleFavorite = useCallback(
    (dishId: string) => {
      if (!sessionId) return;
      toggleFavorite.mutate({ menuId: menu.id, dishId, sessionId });
    },
    [menu.id, sessionId, toggleFavorite],
  );

  // ── Reviews ──────────────────────────────────────────
  const { data: reviewsData, refetch: refetchReviews } = api.reviews.getPublicReviews.useQuery(
    { menuId: menu.id, limit: 10 },
    { staleTime: 5 * 60 * 1000 },
  );

  return {
    // Language
    languageId,
    setSelectedLanguage,
    availableLanguages,
    // Theme
    themeConfig,
    // Data
    visibleCategories,
    featuredDishes,
    activePromotions,
    allergensByDishId,
    // Interactions
    handleDishClick,
    favoriteDishIds,
    handleToggleFavorite,
    // Reviews
    reviews: reviewsData?.reviews ?? [],
    averageRating: reviewsData?.averageRating ?? 0,
    reviewCount: reviewsData?.reviewCount ?? 0,
    refetchReviews,
    // Meta
    sessionId,
    menu,
    slug,
    currency: menu.currency,
  };
}
```

**Step 3: Create PublicMenu shell**

```tsx
// src/components/PublicMenu/PublicMenu.tsx
"use client";

import { useMenuData } from "./hooks/useMenuData";
import { type PublicMenuProps } from "./types";

export function PublicMenu({ menu, slug, initialTheme, initialPromotions }: PublicMenuProps) {
  const data = useMenuData(menu, slug, initialTheme, initialPromotions);

  return (
    <>
      {data.themeConfig.fontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={data.themeConfig.fontsUrl} />
      )}
      <div
        className="menu-themed min-h-screen"
        style={{
          ...data.themeConfig.css,
          backgroundColor: "var(--menu-background)",
          color: "var(--menu-text)",
          fontFamily: "var(--menu-body-font)",
        }}
      >
        {/* TODO: Phase 1 components (header, categories, dishes) */}
        {/* TODO: Phase 2 components (cart, search, detail sheet, sharing) */}
        <div className="mx-auto max-w-2xl p-4 text-center">
          <h1 style={{ fontFamily: "var(--menu-heading-font)" }} className="text-2xl font-bold">
            {menu.name}
          </h1>
          <p className="mt-2 opacity-70">Menu rebuild in progress — {data.visibleCategories.length} categories loaded</p>
        </div>
      </div>
    </>
  );
}
```

**Step 4: Wire to route**

In `src/pageComponents/Menu/Menu.page.tsx`, replace line 3:
```
- import { MainMenuView } from "~/components/MainMenuView/MainMenuView";
+ import { PublicMenu } from "~/components/PublicMenu/PublicMenu";
```

And replace line 82:
```
- <MainMenuView menu={data} slug={slug} initialTheme={theme} initialPromotions={initialPromotions} />
+ <PublicMenu menu={data} slug={slug} initialTheme={theme} initialPromotions={initialPromotions} />
```

**Step 5: Verify**

Run: `pnpm check-types`
Expected: zero errors

**Step 6: Commit**

```bash
git add src/components/PublicMenu/ src/pageComponents/Menu/Menu.page.tsx
git commit -m "feat(menu): scaffold PublicMenu shell with useMenuData hook"
```

---

### Task 1.2: MenuHeader component (4 header variants)

**Files:**
- Create: `src/components/PublicMenu/components/MenuHeader.tsx`

**What it does:** Renders the restaurant header with hero image, name, address, and logo. Adapts to 4 header styles from theme config: `banner` (full-width hero), `minimal` (compact name-only), `centered` (centered layout), `overlay` (text overlaid on image with gradient).

Uses `next/image` with blur placeholder for hero images. Falls back to geometric gradient pattern when no image.

**Key design details:**
- Banner: full-width hero (aspect-ratio 16/9 on mobile, 21/9 on desktop), frosted glass address pill, logo in corner
- Minimal: thin bar with name left, logo right, no hero image
- Centered: medium hero (aspect 3/1), centered name + logo stacked
- Overlay: full hero with heavy gradient overlay, name + address overlaid in white
- All variants: respect theme fonts, colors, spacing via CSS vars

**Step 1: Build the component** (engineer writes full component with all 4 variants)

**Step 2: Import into PublicMenu.tsx** — replace the placeholder `<h1>` with `<MenuHeader>`, passing menu data and `themeConfig.raw.headerStyle`.

**Step 3: Verify** — `pnpm check-types`, view in browser at `/menu/[slug]`

**Step 4: Commit**

---

### Task 1.3: CategoryNav with scroll-spy

**Files:**
- Create: `src/components/PublicMenu/components/CategoryNav.tsx`

**What it does:** Sticky horizontal scrollable category navigation with:
- Pill-style buttons with theme primary color for active state
- `IntersectionObserver`-based scroll-spy (auto-highlights active category as user scrolls)
- Click-to-scroll with smooth scrolling + nav height offset
- Gradient edge fades (left/right) to hint more categories exist
- Hidden scrollbar, drag-to-scroll on desktop
- Mouse wheel horizontal scroll support
- Frosted glass background (`backdrop-filter: blur`)

**Key pattern:** Use `react-intersection-observer` `useInView` per category section, pass active category ID up via callback. This is proven working in the existing `CategoryNavigation.tsx`.

**Step 1: Build component**
**Step 2: Wire into PublicMenu — render above dish sections, pass category list**
**Step 3: Verify scroll-spy works by scrolling through categories**
**Step 4: Commit**

---

### Task 1.4: DishCard component (adaptive to 6 layouts)

**Files:**
- Create: `src/components/PublicMenu/components/DishCard.tsx`
- Create: `src/components/PublicMenu/components/DishImage.tsx`

**What it does:** A single `DishCard` component that renders differently based on the active layout:

| Layout | Card Design |
|--------|-------------|
| `classic` | Horizontal: text left, 120x120 image right. Clean list style. |
| `modern` | Vertical card: large image top (16:10), text below. Subtle shadow. |
| `grid` | Square image card (1:1) with text overlay at bottom (gradient). |
| `magazine` | Alternating: odd=full-width hero card, even=compact row. |
| `minimal` | No image. Name + price on one line, description below. Pure typography. |
| `elegant` | Dark card with glass effect, rounded image, serif headings, gold accents. |

**All layouts show:**
- Dish name (heading font, responsive size)
- Price (right-aligned or below, formatted with `getCurrencySymbol`)
- "Sold Out" overlay when `isSoldOut`
- "Popular" / "New" badge (when applicable)
- Heart favorite button
- Quick-add "+" button (opens dish detail sheet on tap)
- Blur-up image loading via `next/image` placeholder="blur" with shimmer fallback

**DishImage component:** Wraps `next/image` with:
- Blur placeholder (LQIP)
- Shimmer skeleton during load
- Fallback gradient with first letter of dish name when no image
- Respects `imageStyle` from theme (rounded, square, circle)

**Step 1: Build DishImage**
**Step 2: Build DishCard with layout prop**
**Step 3: Create DishGrid/DishList wrapper that renders cards in correct grid**
**Step 4: Wire into PublicMenu with layout from themeConfig**
**Step 5: Verify all 6 layouts render (temporarily hardcode layout to test each)**
**Step 6: Commit**

---

### Task 1.5: Category sections + full menu assembly

**Files:**
- Create: `src/components/PublicMenu/components/CategorySection.tsx`
- Create: `src/components/PublicMenu/components/FeaturedCarousel.tsx`
- Create: `src/components/PublicMenu/components/PromotionsBanner.tsx`
- Modify: `src/components/PublicMenu/PublicMenu.tsx`

**CategorySection:** Wraps a category heading + its dish cards. Each section gets an `id` for scroll-spy targeting. Shows category name, description, optional schedule badge (timed availability), and divider.

**FeaturedCarousel:** Horizontal scrollable row of featured dish cards with auto-scroll. Larger cards (240x320) with gradient overlay and "Featured" badge.

**PromotionsBanner:** Horizontal scrollable promotion cards (same as existing but with theme colors). Shows discount badges, promo images.

**Full assembly in PublicMenu.tsx:**
```
MenuHeader
PromotionsBanner (if active promotions)
FeaturedCarousel (if featured dishes)
CategoryNav (sticky)
CategorySection × N (with dish cards)
ReviewsSection
Footer (powered by Diyafa)
```

**Step 1: Build CategorySection**
**Step 2: Build FeaturedCarousel**
**Step 3: Build PromotionsBanner (port from existing)**
**Step 4: Assemble in PublicMenu.tsx**
**Step 5: Verify full menu renders with all sections**
**Step 6: Commit**

---

## Phase 2: Public Menu — Interactions

### Task 2.1: DishDetailSheet (bottom sheet / modal)

**Files:**
- Create: `src/components/PublicMenu/components/DishDetailSheet.tsx`

**What it does:** When customer taps a dish card, a bottom sheet slides up (mobile) or centered modal opens (desktop):
- Drag handle at top with velocity-based snap (dismiss/expand)
- Hero image (full-width, 16:9)
- Dish name, description, price
- Variant/modifier radio groups
- Special instructions text area
- Quantity stepper (- 1 +)
- Allergen badges
- Nutrition info (collapsible)
- Sticky "Add to Order — XX MAD" CTA at bottom
- Close button (X) top-right
- Backdrop overlay with blur

**Implementation:**
- Use CSS `@media (max-width: 640px)` for bottom sheet vs desktop modal
- Touch drag via `onTouchStart/Move/End` with velocity calculation
- Focus trap for accessibility
- Portal rendering via React portal

**Step 1: Build sheet component with open/close state**
**Step 2: Wire to DishCard — tap opens sheet with dish data**
**Step 3: Verify on mobile viewport and desktop**
**Step 4: Commit**

---

### Task 2.2: Cart system (CartProvider + CartDrawer + FloatingCartBar)

**Files:**
- Create: `src/components/PublicMenu/components/CartProvider.tsx`
- Create: `src/components/PublicMenu/components/CartDrawer.tsx`
- Create: `src/components/PublicMenu/components/CartBar.tsx`

**CartProvider:** React context wrapping the menu. State: `items[]`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`. Persists to `sessionStorage`.

**CartBar:** Fixed full-width bar at bottom of screen. Shows: item count badge + total price + "View Cart" CTA. Appears only when items > 0 with slide-up spring animation. Tapping opens CartDrawer.

**CartDrawer:** Slides up from bottom (full-screen on mobile, 480px drawer on desktop):
- Line items with quantity steppers
- Order type tabs (Dine-in / Pickup / Delivery)
- Customer info fields (table number, name, phone, delivery address — conditional on order type)
- Subtotal + delivery fee + total
- Min order validation warning
- "Place Order" primary CTA
- "Order via WhatsApp" secondary CTA
- Order confirmation animation on success

**Step 1: Build CartProvider with context**
**Step 2: Build CartBar (floating bottom bar)**
**Step 3: Build CartDrawer with order form**
**Step 4: Wire DishDetailSheet "Add to Order" to CartProvider**
**Step 5: Wire order submission to `api.orders.createOrder`**
**Step 6: Verify full flow: add dish → view cart → place order**
**Step 7: Commit**

---

### Task 2.3: Search + Allergen filter + Language switcher

**Files:**
- Create: `src/components/PublicMenu/components/SearchBar.tsx`
- Create: `src/components/PublicMenu/components/AllergenFilter.tsx`
- Create: `src/components/PublicMenu/components/LanguageSwitcher.tsx`

**SearchBar:** Expandable search icon that opens to full-width input. Debounced 300ms. Filters dishes by name + description. Shows result count. Positioned in the toolbar area between header and category nav.

**AllergenFilter:** Button that opens a dropdown (desktop) / bottom sheet (mobile) with checkbox items for 14 allergen types. Active count badge on trigger. Filters dishes client-side by excluding dishes that have selected allergens.

**LanguageSwitcher:** Small dropdown/pills in the header area showing available languages (e.g., EN | FR | عربي). Tapping switches `selectedLanguage` which re-renders all dish names, descriptions, and category names in the selected language.

**Step 1: Build SearchBar with debounce**
**Step 2: Build AllergenFilter**
**Step 3: Build LanguageSwitcher**
**Step 4: Add toolbar row to PublicMenu between header and CategoryNav**
**Step 5: Wire search + allergen filtering to dish list**
**Step 6: Verify: search filters dishes, allergen filter works, language switches text**
**Step 7: Commit**

---

### Task 2.4: Share + Reviews + ScrollToTop

**Files:**
- Create: `src/components/PublicMenu/components/ShareButton.tsx`
- Create: `src/components/PublicMenu/components/ReviewsSection.tsx`
- Create: `src/components/PublicMenu/components/ScrollToTop.tsx`

**ShareButton:** Floating button (bottom-right, above cart bar). Uses Web Share API with fallback modal (WhatsApp, Facebook, X, copy link). Can share menu or individual dish.

**ReviewsSection:** At bottom of menu. Shows average rating, star distribution bar chart, review cards with pagination ("Show More" loads 5 at a time), and review submission form (star selector + text area + name + submit).

**ScrollToTop:** Appears after scrolling past first screen. Smooth scroll to top on tap. Fades in/out.

**Step 1: Build ShareButton**
**Step 2: Build ReviewsSection with pagination**
**Step 3: Build ScrollToTop**
**Step 4: Wire all into PublicMenu**
**Step 5: Commit**

---

## Phase 3: Explore Page Redesign

### Task 3.1: Replace emoji cuisines with professional icons

**Files:**
- Modify: `src/pageComponents/Explore/Explore.page.tsx` (CuisineSection, lines 274-340)

**What to change:**
- Remove `fallbackIcons` emoji array (lines 293-309)
- Replace with lucide-react icons mapped by cuisine slug:

```tsx
const cuisineIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  moroccan: Flame,
  mediterranean: Sun,
  seafood: Fish,
  international: Globe,
  cafe: Coffee,
  burger: Beef,
  pizza: Pizza,
  asian: Soup,
  salad: Salad,
  bakery: Croissant,
  dessert: IceCream,
  drinks: Wine,
  default: UtensilsCrossed,
};
```

- Render icon inside a themed circle instead of raw emoji:
```tsx
<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
  <CuisineIcon className="h-6 w-6" />
</div>
```

**Step 1: Replace emoji section with icon-based design**
**Step 2: Verify in browser**
**Step 3: Commit**

---

### Task 3.2: RestaurantCard upgrade with next/image + skeleton

**Files:**
- Modify: `src/pageComponents/Explore/molecules/RestaurantCard.tsx`

**What to change:**
- Replace `<img>` tags with `next/image` for optimization + blur-up
- Add shimmer skeleton loading state
- Replace `$` price range with currency-appropriate symbol (MAD)
- Add "Open Now" / "Closed" badge (if operating hours available)
- Improve card hover: subtle shadow + scale(1.02) with spring easing
- Use `getCurrencySymbol` for price range display

**Step 1: Upgrade to next/image with fallback**
**Step 2: Add skeleton loading state**
**Step 3: Fix price range symbol**
**Step 4: Commit**

---

### Task 3.3: Explore page layout polish

**Files:**
- Modify: `src/pageComponents/Explore/Explore.page.tsx`

**What to change:**

**Hero section:**
- Add subtle geometric pattern overlay (reuse `geo-pattern` from globals.css)
- Improve search bar: add "Popular searches" as autocomplete suggestions below input
- Add stats bar: "500+ restaurants • 12 cities • 15 cuisines" with animated counters

**Featured Cities:**
- Use `next/image` instead of `<img>` for city photos
- Add shimmer skeleton for loading state (grid of skeleton cards)
- Improve hover: parallax effect on image (slight translate on mouse move)

**Trending:**
- Add numbered badges (#1, #2, #3...) on trending restaurant cards
- Horizontal scroll with snap points on mobile

**CTA Banner:**
- More compelling design: split layout with mockup phone showing a menu on the left, text on the right
- Or: testimonial from a restaurant owner + CTA

**Loading states:**
- Replace all `<Spinner>` with skeleton card grids matching the actual layout

**Step 1: Polish Hero section**
**Step 2: Upgrade Featured Cities with next/image + skeleton**
**Step 3: Upgrade Trending with numbered badges**
**Step 4: Replace spinner loading states with skeletons**
**Step 5: Verify**
**Step 6: Commit**

---

## Phase 4: Restaurant Linktree Page

### Task 4.1: Database model + tRPC endpoints

**Files:**
- Modify: `prisma/schema.prisma` — add `RestaurantLinks` model
- Create: endpoints in `src/server/api/routers/restaurants/` or extend existing

**Prisma model:**
```prisma
model RestaurantLinks {
  id        String   @id @default(uuid())
  menuId    String
  type      String   // "menu" | "whatsapp" | "instagram" | "facebook" | "google_maps" | "phone" | "email" | "uber_eats" | "glovo" | "google_reviews" | "custom"
  title     String
  url       String
  icon      String?  // lucide icon name for custom links
  sortOrder Int      @default(0)
  isVisible Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  menu Menus @relation(fields: [menuId], references: [id], onDelete: Cascade)

  @@index([menuId])
}
```

**tRPC endpoints (add to restaurants router):**
- `getPublicLinks(slug)` — public, returns visible links sorted by sortOrder
- `getLinks(menuId)` — private, returns all links for editing
- `upsertLinks(menuId, links[])` — private, bulk upsert all links
- `deleteLink(id)` — private, delete a link

**Step 1: Add Prisma model**
**Step 2: Run `npx prisma generate` (and create migration if needed)**
**Step 3: Add tRPC endpoints**
**Step 4: Verify with `pnpm check-types`**
**Step 5: Commit**

---

### Task 4.2: Public Linktree page (`/r/[slug]`)

**Files:**
- Create: `src/app/r/[slug]/page.tsx`
- Create: `src/pageComponents/RestaurantLinks/RestaurantLinks.page.tsx`

**Design:**
- Full-screen mobile-optimized page
- Gradient background from restaurant's theme primary color
- Restaurant logo (96px circle, centered) with subtle shadow
- Restaurant name (heading font, large)
- Tagline / cuisine type (muted text)
- Operating hours (collapsible, if available)
- Vertical stack of link buttons:
  - 56px height, rounded-xl
  - Icon on left, title centered
  - Subtle border + glassmorphism background
  - Hover: scale(1.02) + glow
- "Powered by Diyafa" footer link
- Share button (top-right) — copies `/r/[slug]` URL
- QR code download button

**Preset link icons mapping:**
```tsx
const linkIcons: Record<string, LucideIcon> = {
  menu: UtensilsCrossed,
  whatsapp: MessageCircle,
  instagram: Instagram, // from lucide
  facebook: Facebook,
  google_maps: MapPin,
  phone: Phone,
  email: Mail,
  uber_eats: ExternalLink,
  glovo: ExternalLink,
  google_reviews: Star,
  custom: Link2,
};
```

**Step 1: Create route and page component**
**Step 2: Fetch links + menu data server-side**
**Step 3: Build the Linktree UI**
**Step 4: Verify at `/r/[slug]`**
**Step 5: Commit**

---

### Task 4.3: Dashboard link editor

**Files:**
- Create: `src/app/(authenticatedRoutes)/(simpleLayout)/dashboard/links/page.tsx`
- Create: `src/app/(authenticatedRoutes)/(simpleLayout)/dashboard/links/loading.tsx`
- Create: `src/app/(authenticatedRoutes)/(simpleLayout)/dashboard/links/error.tsx`
- Create: `src/pageComponents/LinksEditor/LinksEditor.page.tsx`

**Design:**
- Dashboard page with the standard shell
- Left side: form with draggable link list (reorder by drag-and-drop or up/down buttons)
- Right side (desktop): live preview of the Linktree page
- "Add Preset Link" dropdown with all preset types
- "Add Custom Link" button (title + URL + icon picker)
- Toggle visibility per link
- Delete link with confirmation
- Save button that calls `upsertLinks`
- Preview link to `/r/[slug]`

**Step 1: Create route files (page, loading, error)**
**Step 2: Build LinksEditor page component**
**Step 3: Add "Links" nav item to dashboard sidebar**
**Step 4: Verify**
**Step 5: Commit**

---

## Phase 5: Tests + Verification

### Task 5.1: PublicMenu component tests

**Files:**
- Create: `src/components/PublicMenu/__tests__/PublicMenu.test.tsx`
- Create: `src/components/PublicMenu/__tests__/useMenuData.test.ts`
- Create: `src/components/PublicMenu/__tests__/DishCard.test.tsx`
- Create: `src/components/PublicMenu/__tests__/CartProvider.test.tsx`

**Test coverage:**
- Menu renders with all 6 layouts
- DishCard shows correct info (name, price, image, sold-out)
- CategoryNav highlights active category
- Cart: add item, remove item, update quantity, total calculation
- Search filters dishes by name
- Language switcher changes displayed text
- DishDetailSheet opens on dish tap
- Share button uses Web Share API

### Task 5.2: Explore page tests

**Files:**
- Create: `src/pageComponents/Explore/__tests__/Explore.test.tsx`

**Test coverage:**
- Cuisine section renders icons (not emojis)
- Restaurant card renders with next/image
- Search filters restaurants
- Skeleton loading states render

### Task 5.3: Linktree tests

**Files:**
- Create: `src/pageComponents/RestaurantLinks/__tests__/RestaurantLinks.test.tsx`

**Test coverage:**
- Public page renders links with correct icons
- Links open correct URLs
- Editor saves links via tRPC
- Drag reorder works

### Task 5.4: Full verification

**Step 1: Run type checker**
Run: `pnpm check-types`
Expected: zero errors

**Step 2: Run linter**
Run: `SKIP_ENV_VALIDATION=1 npx next lint`
Expected: zero errors

**Step 3: Run tests**
Run: `pnpm test`
Expected: 1800+ tests pass

**Step 4: Production build**
Run: `rm -rf .next && pnpm build`
Expected: 47+ routes pass (new routes: /r/[slug], /dashboard/links)

**Step 5: Visual verification**
- `/menu/[slug]` — full menu with ordering, search, 6 layouts
- `/explore` — no emojis, professional cards, skeleton loading
- `/r/[slug]` — Linktree page with restaurant branding
- `/dashboard/links` — link editor with preview

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: Sprint 3 — customer-facing redesign

- Rebuilt public menu from scratch (6 adaptive layouts, ordering, search, dish detail sheets)
- Cart system with bottom bar, order types, WhatsApp ordering
- Language switcher for EN/FR/AR on public menu
- Allergen filtering + search
- Social sharing (Web Share API + fallback)
- Explore page redesign (no emojis, professional icons, next/image, skeletons)
- Restaurant Linktree page (/r/[slug]) with branded link-in-bio
- Dashboard link editor with live preview
- Fixed Button asChild+loading crash"
```

---

## Key Patterns (Must Follow)

- `api.useContext()` NOT `api.useUtils()` (older tRPC)
- `"use client"` and `export const dynamic` CANNOT coexist
- English i18n = type source (NO type annotation on en/common.ts)
- Centralized logger (`src/server/logger.ts`), not console.log
- Test factories: `src/__tests__/utils/factories.ts`
- After Prisma schema changes: `npx prisma generate`
- `getCurrencySymbol()` for currency display, NOT hardcoded symbols
- `next/image` for all images (blur placeholder where possible)
- Theme colors via CSS custom properties (`var(--menu-primary)` etc.)
- Layout structure via Tailwind classes
- All new i18n keys in EN/FR/AR
- WCAG AA: focus traps on overlays, ARIA labels, keyboard nav
- `z-index` budget: CartBar=50, DishDetailSheet=60, CartDrawer=70, SearchOverlay=40

## File Dependency Graph

```
PublicMenu.tsx
├── hooks/useMenuData.ts (all data fetching)
├── components/MenuHeader.tsx
├── components/CategoryNav.tsx
├── components/FeaturedCarousel.tsx
├── components/PromotionsBanner.tsx
├── components/CategorySection.tsx
│   └── components/DishCard.tsx
│       └── components/DishImage.tsx
├── components/DishDetailSheet.tsx
├── components/CartProvider.tsx (context)
├── components/CartBar.tsx
├── components/CartDrawer.tsx
├── components/SearchBar.tsx
├── components/AllergenFilter.tsx
├── components/LanguageSwitcher.tsx
├── components/ShareButton.tsx
├── components/ReviewsSection.tsx
└── components/ScrollToTop.tsx
```
