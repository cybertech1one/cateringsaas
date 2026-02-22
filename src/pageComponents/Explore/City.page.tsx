"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  ArrowRight,
  Utensils,
  X,
} from "lucide-react";
import { api } from "~/trpc/react";
import { RestaurantCard } from "./molecules/RestaurantCard";
import { Spinner } from "~/components/Loading/Loading";

// ── Breadcrumb ────────────────────────────────────────────────

function Breadcrumb({ cityName }: { cityName: string }) {
  const { t } = useTranslation();

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="transition-colors hover:text-foreground"
          >
            {t("explore.breadcrumb.home")}
          </Link>
        </li>
        <ChevronRight className="h-3.5 w-3.5" />
        <li>
          <Link
            href="/explore"
            className="transition-colors hover:text-foreground"
          >
            {t("explore.breadcrumb.explore")}
          </Link>
        </li>
        <ChevronRight className="h-3.5 w-3.5" />
        <li aria-current="page" className="font-medium text-foreground">
          {cityName}
        </li>
      </ol>
    </nav>
  );
}

// ── City Hero ─────────────────────────────────────────────────

function CityHero({
  city,
}: {
  city: {
    name: string;
    region: string;
    description: string | null;
    imageUrl: string | null;
    restaurantCount: number;
  };
}) {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-muted/40">
      {/* Decorative */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-gold/[0.05] blur-3xl" />
      </div>

      <div className="relative container mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumb cityName={city.name} />

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h1 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("explore.hero.title")}{" "}
              <span className="text-gradient">{city.name}</span>
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {city.region}
            </p>
            {city.description && (
              <p className="mt-3 text-muted-foreground">
                {city.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border/50 bg-card px-6 py-4 shadow-sm">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {city.restaurantCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("explore.restaurants")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Filters ───────────────────────────────────────────────────

type SortOption = "popular" | "rating" | "newest" | "name";

function FiltersBar({
  cuisineSlug,
  setCuisineSlug,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  cuisines,
}: {
  cuisineSlug: string | undefined;
  setCuisineSlug: (v: string | undefined) => void;
  priceRange: number | undefined;
  setPriceRange: (v: number | undefined) => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  cuisines: Array<{ id: string; name: string; slug: string }>;
}) {
  const { t } = useTranslation();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const priceOptions = [
    { value: undefined, label: t("explore.allPrices") },
    { value: 1, label: "$" },
    { value: 2, label: "$$" },
    { value: 3, label: "$$$" },
    { value: 4, label: "$$$$" },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "popular", label: t("explore.popular") },
    { value: "rating", label: t("explore.rating") },
    { value: "newest", label: t("explore.newest") },
    { value: "name", label: t("explore.byName") },
  ];

  const hasActiveFilters =
    cuisineSlug !== undefined || priceRange !== undefined;

  const filterContent = (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      {/* Cuisine filter */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <label
          htmlFor="cuisine-filter"
          className="text-sm font-medium text-muted-foreground sm:hidden"
        >
          {t("explore.allCuisines")}
        </label>
        <select
          id="cuisine-filter"
          value={cuisineSlug ?? ""}
          onChange={(e) =>
            setCuisineSlug(e.target.value || undefined)
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          aria-label={t("explore.allCuisines")}
        >
          <option value="">{t("explore.allCuisines")}</option>
          {cuisines.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price range filter */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <label
          htmlFor="price-filter"
          className="text-sm font-medium text-muted-foreground sm:hidden"
        >
          {t("explore.priceRange")}
        </label>
        <select
          id="price-filter"
          value={priceRange ?? ""}
          onChange={(e) =>
            setPriceRange(
              e.target.value ? Number(e.target.value) : undefined,
            )
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          aria-label={t("explore.priceRange")}
        >
          {priceOptions.map((opt) => (
            <option key={opt.label} value={opt.value ?? ""}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort by */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:ml-auto">
        <label
          htmlFor="sort-filter"
          className="text-sm font-medium text-muted-foreground sm:hidden"
        >
          {t("explore.sortBy")}
        </label>
        <select
          id="sort-filter"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          aria-label={t("explore.sortBy")}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setCuisineSlug(undefined);
            setPriceRange(undefined);
          }}
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
        >
          <X className="h-3.5 w-3.5" />
          {t("publicMenu.clearFilters")}
        </button>
      )}
    </div>
  );

  return (
    <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-sm font-medium sm:hidden"
          aria-expanded={showMobileFilters}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {t("explore.filters")}
            {hasActiveFilters && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                !
              </span>
            )}
          </span>
          {showMobileFilters ? (
            <X className="h-4 w-4" />
          ) : (
            <SlidersHorizontal className="h-4 w-4" />
          )}
        </button>

        {/* Mobile expanded filters */}
        {showMobileFilters && (
          <div className="mt-3 sm:hidden">{filterContent}</div>
        )}

        {/* Desktop filters - always visible */}
        <div className="hidden sm:block">{filterContent}</div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────

function EmptyState({ cityName }: { cityName: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-4">
        <Utensils className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-sans text-xl font-semibold">
        {t("explore.noResultsInCity", { city: cityName })}
      </h3>
      <p className="mt-2 max-w-md text-muted-foreground">
        {t("explore.noResultsInCityDescription")}
      </p>
      <Link
        href="/register"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
      >
        {t("explore.listNow")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Main City Page ────────────────────────────────────────────

export function CityPage({ citySlug }: { citySlug: string }) {
  const { t } = useTranslation();
  const [cuisineSlug, setCuisineSlug] = useState<string | undefined>();
  const [priceRange, setPriceRange] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: city, isLoading: cityLoading, error: cityError } =
    api.directory.getCityBySlug.useQuery({ slug: citySlug });

  const { data: allCuisines } = api.directory.getCuisineTypes.useQuery();

  const { data: restaurantData, isLoading: restaurantsLoading } =
    api.directory.getRestaurantsByCity.useQuery(
      {
        citySlug,
        cuisineSlug,
        priceRange,
        sortBy,
        page,
        limit: pageSize,
      },
    );

  const totalPages = restaurantData?.pagination.totalPages ?? 0;

  // City not found (tRPC throws NOT_FOUND)
  if (!cityLoading && (cityError || !city)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="font-sans text-2xl font-bold">
            {t("notFound.title")}
          </h2>
          <Link
            href="/explore"
            className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            {t("explore.breadcrumb.explore")}
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (cityLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  // Build cuisine list from the city's cuisine types (from getCityBySlug)
  const cuisineOptions =
    city?.cuisineTypes.map((ct) => ({
      id: ct.id,
      name: ct.name,
      slug: ct.slug,
    })) ??
    allCuisines?.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })) ??
    [];

  return (
    <div className="min-h-screen bg-background">
      {/* City Hero */}
      <CityHero
        city={{
          name: city!.name,
          region: city!.region.name,
          description: city!.description,
          imageUrl: city!.imageUrl,
          restaurantCount: city!._count.menus,
        }}
      />

      {/* Filters */}
      <FiltersBar
        cuisineSlug={cuisineSlug}
        setCuisineSlug={(v) => {
          setCuisineSlug(v);
          setPage(1);
        }}
        priceRange={priceRange}
        setPriceRange={(v) => {
          setPriceRange(v);
          setPage(1);
        }}
        sortBy={sortBy}
        setSortBy={(v) => {
          setSortBy(v);
          setPage(1);
        }}
        cuisines={cuisineOptions}
      />

      {/* Restaurant Grid */}
      <section className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {restaurantsLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {!restaurantsLoading &&
          restaurantData &&
          restaurantData.restaurants.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {restaurantData.restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("explore.pagination.previous")}
                  </button>

                  <span className="px-3 text-sm text-muted-foreground">
                    {t("explore.pagination.page", {
                      page,
                      total: totalPages,
                    })}
                  </span>

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("explore.pagination.next")}
                  </button>
                </div>
              )}

              {/* Total count */}
              {restaurantData.pagination.totalCount > 0 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {t("explore.pagination.showing", {
                    from: (page - 1) * pageSize + 1,
                    to: Math.min(
                      page * pageSize,
                      restaurantData.pagination.totalCount,
                    ),
                    total: restaurantData.pagination.totalCount,
                  })}
                </p>
              )}
            </>
          )}

        {!restaurantsLoading &&
          (!restaurantData ||
            restaurantData.restaurants.length === 0) && (
            <EmptyState cityName={city!.name} />
          )}
      </section>

      {/* CTA Banner */}
      <section
        className="section-padding relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, hsl(228 22% 8%) 0%, hsl(228 18% 12%) 50%, hsl(228 15% 8%) 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/[0.08] blur-[80px]" aria-hidden="true" />
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="font-sans text-3xl font-bold text-white sm:text-4xl">
            {t("explore.ownRestaurant")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-white/40">
            {t("explore.ownRestaurantSubtitle")}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110"
          >
            {t("explore.listNow")}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
