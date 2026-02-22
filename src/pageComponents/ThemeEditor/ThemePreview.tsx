"use client";

import { useEffect, useMemo, useRef } from "react";
import { type MenuTheme } from "~/lib/theme/types";
import { themeToCSS, buildGoogleFontsUrl } from "~/lib/theme/css-engine";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { LoadingScreen } from "~/components/Loading";

/**
 * ThemePreview - Renders a scaled-down preview of the menu with live theme applied.
 * Used inside the ThemeEditor's right panel.
 */
export function ThemePreview({ theme }: { theme: MenuTheme }) {
  const { slug } = useParams() as { slug: string };
  const fontLinkRef = useRef<HTMLLinkElement | null>(null);

  // Fetch actual menu data for preview
  const { data: menuData, isLoading } = api.menus.getMenuBySlug.useQuery(
    { slug },
    { enabled: !!slug },
  );

  // Build CSS variables object
  const cssVars = useMemo(() => themeToCSS(theme), [theme]);

  // Load Google Fonts
  useEffect(() => {
    const url = buildGoogleFontsUrl(theme);

    if (fontLinkRef.current) {
      fontLinkRef.current.href = url;
    } else {
      const link = document.createElement("link");

      link.rel = "stylesheet";
      link.href = url;
      link.id = "theme-preview-fonts";
      document.head.appendChild(link);
      fontLinkRef.current = link;
    }

    return () => {
      if (fontLinkRef.current) {
        fontLinkRef.current.remove();
        fontLinkRef.current = null;
      }
    };
  }, [theme.headingFont, theme.bodyFont, theme]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No menu data available for preview.
      </div>
    );
  }

  // Inline style object for CSS variables
  const styleObj: Record<string, string> = {};

  for (const [key, value] of Object.entries(cssVars)) {
    styleObj[key] = value;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Device frame */}
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border-2 border-border/30 shadow-xl">
        {/* Phone-like header bar */}
        <div className="flex items-center justify-center gap-1 bg-muted/50 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Scrollable menu content */}
        <div
          className="menu-themed max-h-[600px] overflow-y-auto"
          style={{
            ...styleObj,
            backgroundColor: "var(--menu-background)",
          }}
        >
          {/* Header */}
          <MenuPreviewHeader theme={theme} menu={menuData} />

          {/* Category Nav */}
          {theme.showCategoryNav && (
            <div
              className="flex overflow-x-auto border-b px-4 py-2"
              style={{
                borderColor: "var(--menu-border)",
                backgroundColor: "var(--menu-surface)",
              }}
            >
              {menuData.categories?.map((cat) => (
                <span
                  key={cat.id}
                  className="mr-3 whitespace-nowrap text-xs font-medium"
                  style={{
                    fontFamily: "var(--menu-body-font)",
                    color: "var(--menu-muted)",
                  }}
                >
                  {cat.categoriesTranslation?.[0]?.name ?? "Category"}
                </span>
              ))}
            </div>
          )}

          {/* Dishes by layout */}
          <div style={{ padding: "var(--menu-spacing-card)" }}>
            {menuData.categories?.map((cat) => {
              const catName = cat.categoriesTranslation?.[0]?.name ?? "";
              const dishes = menuData.dishes?.filter(
                (d) => d.categoryId === cat.id,
              ) ?? [];

              if (dishes.length === 0) return null;

              return (
                <div key={cat.id} style={{ marginBottom: "var(--menu-spacing-section)" }}>
                  {catName && theme.showCategoryDividers && (
                    <h2
                      className="mb-3 font-bold"
                      style={{
                        fontFamily: "var(--menu-heading-font)",
                        fontSize: "var(--menu-font-xl)",
                        color: "var(--menu-text)",
                        borderBottom: `1px solid var(--menu-border)`,
                        paddingBottom: "8px",
                      }}
                    >
                      {catName}
                    </h2>
                  )}

                  <DishesPreview
                    dishes={dishes}
                    theme={theme}
                    layout={theme.layoutStyle}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Header Preview ──────────────────────────────────────────

function MenuPreviewHeader({
  theme,
  menu,
}: {
  theme: MenuTheme;
  menu: { name: string; backgroundImageUrl?: string | null; address: string; city: string };
}) {
  const headerStyle = theme.headerStyle;

  if (headerStyle === "minimal") {
    return (
      <div className="px-4 py-6" style={{ backgroundColor: "var(--menu-background)" }}>
        <h1
          className="text-lg font-bold"
          style={{ fontFamily: "var(--menu-heading-font)", color: "var(--menu-text)" }}
        >
          {menu.name}
        </h1>
        <p
          className="text-xs"
          style={{ fontFamily: "var(--menu-body-font)", color: "var(--menu-muted)" }}
        >
          {menu.address}, {menu.city}
        </p>
      </div>
    );
  }

  if (headerStyle === "centered") {
    return (
      <div
        className="flex flex-col items-center px-4 py-8 text-center"
        style={{ backgroundColor: "var(--menu-surface)" }}
      >
        <div
          className="mb-2 h-px w-16"
          style={{ backgroundColor: "var(--menu-primary)" }}
        />
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--menu-heading-font)", color: "var(--menu-text)" }}
        >
          {menu.name}
        </h1>
        <p
          className="mt-1 text-xs"
          style={{ fontFamily: "var(--menu-body-font)", color: "var(--menu-muted)" }}
        >
          {menu.address}, {menu.city}
        </p>
        <div
          className="mt-2 h-px w-16"
          style={{ backgroundColor: "var(--menu-primary)" }}
        />
      </div>
    );
  }

  // banner or overlay
  return (
    <div className="relative" style={{ aspectRatio: "2.5/1" }}>
      {menu.backgroundImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={menu.backgroundImageUrl}
          alt={`${menu.name} restaurant background`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
      {(headerStyle === "overlay" || !menu.backgroundImageUrl) && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: menu.backgroundImageUrl
              ? "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2))"
              : `var(--menu-primary)`,
          }}
        >
          <h1
            className="text-xl font-bold text-white"
            style={{ fontFamily: "var(--menu-heading-font)" }}
          >
            {menu.name}
          </h1>
          <p
            className="text-xs text-white/70"
            style={{ fontFamily: "var(--menu-body-font)" }}
          >
            {menu.address}, {menu.city}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Dishes Preview by Layout ────────────────────────────────

interface DishPreviewData {
  id: string;
  price: number;
  pictureUrl?: string | null;
  dishesTranslation: Array<{ name: string; description?: string | null }>;
  calories?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fats?: number | null;
}

function DishesPreview({
  dishes,
  theme,
  layout,
}: {
  dishes: DishPreviewData[];
  theme: MenuTheme;
  layout: string;
}) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {dishes.map((dish) => (
          <GridDishCard key={dish.id} dish={dish} theme={theme} />
        ))}
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div className="flex flex-col">
        {dishes.map((dish) => (
          <MinimalDishRow key={dish.id} dish={dish} theme={theme} />
        ))}
      </div>
    );
  }

  // classic, modern, magazine, elegant all use list view in preview
  return (
    <div className="flex flex-col" style={{ gap: "var(--menu-spacing-item)" }}>
      {dishes.map((dish) => (
        <ListDishCard key={dish.id} dish={dish} theme={theme} layout={layout} />
      ))}
    </div>
  );
}

function ListDishCard({
  dish,
  theme,
  layout,
}: {
  dish: DishPreviewData;
  theme: MenuTheme;
  layout: string;
}) {
  const name = dish.dishesTranslation[0]?.name ?? "Dish";
  const desc = dish.dishesTranslation[0]?.description ?? "";
  const isElegant = layout === "elegant";
  const isModern = layout === "modern";

  const imageRadiusMap: Record<string, string> = {
    circle: "50%",
    square: "0px",
  };

  const imageRadius = imageRadiusMap[theme.imageStyle] ?? "var(--menu-radius)";

  return (
    <div
      className="flex gap-3"
      style={{
        padding: "var(--menu-spacing-card)",
        backgroundColor: "var(--menu-card-bg)",
        borderRadius: "var(--menu-radius)",
        boxShadow: "var(--menu-card-shadow)",
        border: "var(--menu-card-border)",
        ...(isElegant
          ? { backdropFilter: "blur(12px)" }
          : {}),
      }}
    >
      {theme.showImages && dish.pictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dish.pictureUrl}
          alt={`${name} dish photo`}
          className="object-cover"
          loading="lazy"
          style={{
            width: isModern ? "80px" : "60px",
            height: isModern ? "80px" : "60px",
            borderRadius: imageRadius,
            flexShrink: 0,
          }}
        />
      )}
      <div className="flex flex-1 flex-col justify-center">
        <h3
          className="font-semibold"
          style={{
            fontFamily: isElegant ? "var(--menu-heading-font)" : "var(--menu-body-font)",
            fontSize: "var(--menu-font-base)",
            color: "var(--menu-text)",
          }}
        >
          {name}
        </h3>
        {theme.showPrices && (
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--menu-primary)" }}
          >
            {(dish.price / 100).toFixed(2)} د.م.
          </span>
        )}
        {desc && (
          <p
            className="mt-0.5 line-clamp-2 text-xs"
            style={{ fontFamily: "var(--menu-body-font)", color: "var(--menu-muted)" }}
          >
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}

function GridDishCard({
  dish,
  theme,
}: {
  dish: DishPreviewData;
  theme: MenuTheme;
}) {
  const name = dish.dishesTranslation[0]?.name ?? "Dish";

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--menu-radius-lg)",
        backgroundColor: "var(--menu-card-bg)",
        boxShadow: "var(--menu-card-shadow)",
        border: "var(--menu-card-border)",
      }}
    >
      {theme.showImages && dish.pictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dish.pictureUrl}
          alt={`${name} dish photo`}
          className="h-24 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="p-2">
        <h3
          className="text-xs font-semibold"
          style={{ fontFamily: "var(--menu-body-font)", color: "var(--menu-text)" }}
        >
          {name}
        </h3>
        {theme.showPrices && (
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--menu-primary)" }}
          >
            {(dish.price / 100).toFixed(2)} د.م.
          </span>
        )}
      </div>
    </div>
  );
}

function MinimalDishRow({
  dish,
  theme,
}: {
  dish: DishPreviewData;
  theme: MenuTheme;
}) {
  const name = dish.dishesTranslation[0]?.name ?? "Dish";

  return (
    <div
      className="flex items-baseline justify-between py-2"
      style={{
        borderBottom: `1px dotted var(--menu-border)`,
      }}
    >
      <span
        className="text-sm"
        style={{ fontFamily: "var(--menu-body-font)", color: "var(--menu-text)" }}
      >
        {name}
      </span>
      {theme.showPrices && (
        <span
          className="text-sm font-medium"
          style={{ fontFamily: "var(--menu-body-font)", color: "var(--menu-text)" }}
        >
          {(dish.price / 100).toFixed(2)}
        </span>
      )}
    </div>
  );
}
