"use client";

import { useState, useMemo, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Search,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Utensils,
  ArrowRight,
  TrendingUp,
  Globe,
  Sparkles,
  X,
  Flame,
  Sun,
  Fish,
  Coffee,
  Beef,
  Soup,
  Salad,
  Croissant,
  IceCream,
  Wine,
  UtensilsCrossed,
  Pizza,
  Sandwich,
  Cherry,
} from "lucide-react";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { RestaurantCard } from "./molecules/RestaurantCard";
import { Skeleton } from "~/components/ui/skeleton";

// ── Cuisine Icon Map (replaces emojis) ───────────────────────

const cuisineIcons: Record<string, ComponentType<{ className?: string }>> = {
  moroccan: Flame,
  mediterranean: Sun,
  seafood: Fish,
  international: Globe,
  cafe: Coffee,
  coffee: Coffee,
  burger: Beef,
  pizza: Pizza,
  asian: Soup,
  chinese: Soup,
  japanese: Soup,
  salad: Salad,
  healthy: Salad,
  bakery: Croissant,
  patisserie: Croissant,
  dessert: IceCream,
  desserts: IceCream,
  drinks: Wine,
  bar: Wine,
  sandwich: Sandwich,
  snacks: Sandwich,
  fruit: Cherry,
  vegan: Salad,
  default: UtensilsCrossed,
};

function getCuisineIcon(slug: string): ComponentType<{ className?: string }> {
  return cuisineIcons[slug.toLowerCase()] ?? cuisineIcons.default!;
}

// ── Skeleton Components ──────────────────────────────────────

function RestaurantCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function CityCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
      <Skeleton className="aspect-[4/3] w-full" />
    </div>
  );
}

function CuisineChipSkeleton() {
  return (
    <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
  );
}

// ── Hero Section ──────────────────────────────────────────────

function HeroSection({
  cities,
  searchValue,
  onSearchChange,
  stats,
}: {
  cities: Array<{ name: string; slug: string }>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  stats: { restaurantCount: number; cityCount: number; cuisineCount: number };
}) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  return (
    <section className="relative overflow-hidden bg-sand-section">
      {/* Moroccan geometric pattern + warm orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 moroccan-geo opacity-30" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-gold/[0.03] blur-3xl" />
      </div>

      <div className="relative container mx-auto max-w-6xl section-padding">
        <div className="relative mx-auto max-w-3xl text-center">
          {/* Decorative star */}
          <svg className="absolute top-4 right-8 w-12 h-12 text-gold/10 hidden sm:block" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ animation: "gentleRotate 8s ease-in-out infinite" }}>
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>

          {/* Badge */}
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-muted-foreground">
              {t("explore.subtitle")}
            </span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-up animate-delay-100 font-sans text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("explore.hero.title")}{" "}
            <span className="text-gradient">
              {t("explore.hero.titleHighlight")}
            </span>
          </h1>

          <p className="animate-fade-up animate-delay-200 mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("explore.hero.subtitle")}
          </p>

          {/* Search bar - bigger with glow effect */}
          <div className="animate-fade-up animate-delay-300 mt-8">
            <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-border/60 bg-background p-2 shadow-lg shadow-black/5 transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-xl focus-within:shadow-primary/10">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t("explore.searchPlaceholder")}
                  className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  aria-label={t("explore.hero.searchLabel")}
                  maxLength={100}
                />
                {searchValue.length > 0 && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          {(stats.restaurantCount > 0 || stats.cityCount > 0) && !searchValue && (
            <div className="animate-fade-up animate-delay-400 mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-6">
              {stats.restaurantCount > 0 && (
                <span className="font-medium">
                  {t("explore.stats.restaurants", { count: stats.restaurantCount })}
                </span>
              )}
              {stats.restaurantCount > 0 && stats.cityCount > 0 && (
                <span className="text-border">|</span>
              )}
              {stats.cityCount > 0 && (
                <span className="font-medium">
                  {t("explore.stats.cities", { count: stats.cityCount })}
                </span>
              )}
              {stats.cuisineCount > 0 && (
                <>
                  <span className="text-border">|</span>
                  <span className="font-medium">
                    {t("explore.stats.cuisines", { count: stats.cuisineCount })}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Popular cities chips */}
          {cities.length > 0 && !searchValue && (
            <div className="animate-fade-up animate-delay-500 mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t("explore.hero.popularSearches")}
              </span>
              {cities.slice(0, 5).map((city) => (
                <Link
                  key={city.slug}
                  href={`/explore/${city.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-sm text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <MapPin className="h-3 w-3" />
                  {city.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Search Results Section ────────────────────────────────────

function SearchResultsSection({ query }: { query: string }) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const { data: restaurants, isLoading } =
    api.directory.searchRestaurants.useQuery(
      { query, limit: 10 },
      { enabled: query.length >= 1 },
    );

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <h2 className="font-sans text-3xl font-bold tracking-tight">
            {t("explore.searchResults")}
          </h2>
        </div>

        {restaurants && restaurants.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {t("explore.noResults")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {t("explore.noResultsDescription")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Featured Cities Grid ──────────────────────────────────────

function FeaturedCitiesSection() {
  const { t } = useTranslation();
  const { data: cities, isLoading } =
    api.directory.getFeaturedCities.useQuery();

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="mb-10 h-8 w-56" />
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CityCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!cities || cities.length === 0) return null;

  const gradients = [
    "from-amber-500 to-orange-600",
    "from-red-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-600 to-yellow-500",
    "from-blue-500 to-cyan-600",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-teal-500 to-emerald-600",
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-sans text-3xl font-bold tracking-tight">
              {t("explore.featuredCities")}
            </h2>
          </div>
          <Link
            href="#regions"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:inline-flex"
          >
            {t("explore.viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {cities.map((city, index) => (
            <Link
              key={city.id}
              href={`/explore/${city.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image / gradient area */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {city.imageUrl ? (
                  <Image
                    src={city.imageUrl}
                    alt={city.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradients[index % gradients.length]}`}
                  >
                    <MapPin className="h-10 w-10 text-white/60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* City name overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-sans text-lg font-bold text-white drop-shadow-sm sm:text-xl">
                    {city.name}
                  </h3>
                  <p className="text-sm text-white/80">
                    {t("explore.cityCard.restaurants", {
                      count: city._count.menus,
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Sticky Cuisine Filter Bar ─────────────────────────────────

function CuisineFilterBar({
  selectedCuisine,
  onCuisineChange,
}: {
  selectedCuisine: string | null;
  onCuisineChange: (slug: string | null) => void;
}) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const { data: cuisines, isLoading } =
    api.directory.getCuisineTypes.useQuery();

  if (isLoading) {
    return (
      <div className="sticky top-16 z-30 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <CuisineChipSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cuisines || cuisines.length === 0) return null;

  return (
    <div className="sticky top-16 z-30 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto max-w-6xl px-4 py-3">
        <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
          {/* All pill */}
          <button
            onClick={() => onCuisineChange(null)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 hover:scale-105 ${
              selectedCuisine === null
                ? "bg-primary text-white shadow-sm"
                : "border border-border/60 bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            {t("explore.allCuisines")}
          </button>

          {cuisines.map((cuisine) => {
            const CuisineIcon = getCuisineIcon(cuisine.slug);
            const isActive = selectedCuisine === cuisine.slug;

            return (
              <button
                key={cuisine.id}
                onClick={() =>
                  onCuisineChange(isActive ? null : cuisine.slug)
                }
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 hover:scale-105 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "border border-border/60 bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <CuisineIcon className="h-3.5 w-3.5" />
                {cuisine.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Popular Near You (formerly Trending) ─────────────────────

function PopularNearYouSection({
  selectedCuisine,
}: {
  selectedCuisine: string | null;
}) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const { data: restaurants, isLoading } =
    api.directory.getTrendingRestaurants.useQuery({});

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!restaurants || restaurants.length === 0) return null;

  // Filter by selected cuisine if any
  const filtered = selectedCuisine
    ? restaurants.filter(
        (r) => r.cuisineType?.slug === selectedCuisine,
      )
    : restaurants;

  if (filtered.length === 0) return null;

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-sans text-3xl font-bold tracking-tight">
                {t("explore.popularNearYou")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("explore.popularNearYouSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((restaurant, index) => (
            <div key={restaurant.id} className="w-72 shrink-0 sm:w-auto">
              <RestaurantCard restaurant={restaurant} rank={index + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── All Restaurants Section ──────────────────────────────────

function AllRestaurantsSection({
  selectedCuisine,
}: {
  selectedCuisine: string | null;
}) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  // Search with empty or cuisine-based query to get all restaurants
  const searchQuery = selectedCuisine ?? "";
  const { data: restaurants, isLoading } =
    api.directory.searchRestaurants.useQuery(
      { query: searchQuery || "a", limit: 20 },
      { enabled: true },
    );

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!restaurants || restaurants.length === 0) return null;

  // Filter by cuisine client-side if selected
  const filtered = selectedCuisine
    ? restaurants.filter(
        (r) => r.cuisineType?.slug === selectedCuisine,
      )
    : restaurants;

  if (filtered.length === 0) return null;

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 className="font-sans text-3xl font-bold tracking-tight">
            {t("explore.allRestaurants")}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── All Regions ───────────────────────────────────────────────

function RegionCard({
  region,
}: {
  region: {
    id: string;
    name: string;
    slug: string;
    cities: Array<{
      id: string;
      name: string;
      slug: string;
      _count: { menus: number };
    }>;
  };
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visibleCities = expanded
    ? region.cities
    : region.cities.slice(0, 4);

  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 transition-shadow duration-200 hover:shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
        aria-controls={`region-${region.id}`}
      >
        <h3 className="font-sans text-lg font-semibold text-foreground">
          {region.name}
        </h3>
        {region.cities.length > 4 &&
          (expanded ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
          ))}
      </button>

      <div id={`region-${region.id}`} className="mt-3 flex flex-wrap gap-2">
        {visibleCities.map((city) => (
          <Link
            key={city.id}
            href={`/explore/${city.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {city.name}
            {city._count.menus > 0 && (
              <span className="text-xs text-muted-foreground">
                ({city._count.menus})
              </span>
            )}
          </Link>
        ))}
      </div>

      {!expanded && region.cities.length > 4 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs font-medium text-primary hover:text-primary/80"
        >
          +{region.cities.length - 4} {t("explore.showMore")}
        </button>
      )}
    </div>
  );
}

function RegionsSection() {
  const { t } = useTranslation();
  const { data: regions, isLoading } =
    api.directory.getRegionsWithCities.useQuery();

  if (isLoading) {
    return (
      <section className="section-padding bg-sand-section">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!regions || regions.length === 0) return null;

  return (
    <section
      id="regions"
      className="section-padding bg-sand-section"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-sans text-3xl font-bold tracking-tight">
              {t("explore.allRegions")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("explore.allRegionsSubtitle")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <RegionCard key={region.id} region={region} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────

function CTABanner() {
  const { t } = useTranslation();

  return (
    <section
      className="section-padding relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, hsl(228 22% 8%) 0%, hsl(228 18% 12%) 50%, hsl(228 15% 8%) 100%)" }}
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/[0.08] blur-[80px]" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gold/[0.06] blur-[80px]" aria-hidden="true" />
      <div className="absolute inset-0 moroccan-geo opacity-30 pointer-events-none" aria-hidden="true" />
      <div className="container relative z-10 mx-auto max-w-4xl text-center">
        <div className="flex items-center justify-center gap-2">
          <Utensils className="h-8 w-8 text-white/60" />
        </div>
        <h2 className="mt-4 font-sans text-3xl font-bold text-white sm:text-4xl">
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
  );
}

// ── Main Page ─────────────────────────────────────────────────

export function ExplorePage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchValue.trim(), 300);
  const isSearching = debouncedSearch.length >= 1;

  const { data: cities } = api.directory.getFeaturedCities.useQuery();
  const { data: trending } = api.directory.getTrendingRestaurants.useQuery({});
  const { data: cuisines } = api.directory.getCuisineTypes.useQuery();

  const heroCities = (cities ?? []).map((c) => ({
    name: c.name,
    slug: c.slug,
  }));

  const stats = useMemo(
    () => ({
      restaurantCount: trending?.length ?? 0,
      cityCount: cities?.length ?? 0,
      cuisineCount: cuisines?.length ?? 0,
    }),
    [trending?.length, cities?.length, cuisines?.length],
  );

  return (
    <div className="min-h-screen">
      <HeroSection
        cities={heroCities}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        stats={stats}
      />
      {isSearching ? (
        <SearchResultsSection query={debouncedSearch} />
      ) : (
        <>
          <FeaturedCitiesSection />
          <CuisineFilterBar
            selectedCuisine={selectedCuisine}
            onCuisineChange={setSelectedCuisine}
          />
          <PopularNearYouSection selectedCuisine={selectedCuisine} />
          <AllRestaurantsSection selectedCuisine={selectedCuisine} />
          <RegionsSection />
        </>
      )}
      <CTABanner />
    </div>
  );
}
