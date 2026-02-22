"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/utils/api";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Search,
  MapPin,
  Star,
  ChevronDown,
  BadgeCheck,
  Users,
  SlidersHorizontal,
  X,
  ChefHat,
} from "lucide-react";
import { cn } from "~/utils/cn";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

interface CatererCard {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  city: string | null;
  cuisines: string[];
  specialties: string[];
  priceRange: string | null;
  minGuests: number | null;
  maxGuests: number | null;
  rating: unknown;
  reviewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
}

interface ExplorePageProps {
  initialCity?: string;
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const MOROCCAN_CITIES = [
  "Casablanca",
  "Marrakech",
  "Rabat",
  "Fes",
  "Tangier",
  "Agadir",
];

const SORT_OPTIONS = [
  { value: "featured" as const, label: "Featured" },
  { value: "rating" as const, label: "Highest Rated" },
  { value: "reviews" as const, label: "Most Reviewed" },
  { value: "newest" as const, label: "Newest" },
];

const ORG_TYPE_OPTIONS = [
  { value: "caterer", label: "Caterer" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "venue", label: "Venue" },
  { value: "event_planner", label: "Event Planner" },
];

const PRICE_LABELS: Record<string, string> = {
  budget: "$",
  mid: "$$",
  premium: "$$$",
  luxury: "$$$$",
};

// ────────────────────────────────────────────────────────────────────
// Helper: format rating
// ────────────────────────────────────────────────────────────────────

function formatRating(rating: unknown): string {
  if (rating === null || rating === undefined) return "0.0";
  const n = typeof rating === "string" ? parseFloat(rating) : Number(rating);
  return isNaN(n) ? "0.0" : n.toFixed(1);
}

// ────────────────────────────────────────────────────────────────────
// Caterer Card Component
// ────────────────────────────────────────────────────────────────────

function CatererCardComponent({ caterer }: { caterer: CatererCard }) {
  const ratingStr = formatRating(caterer.rating);

  return (
    <Link
      href={`/caterer/${caterer.slug}`}
      className="card-3d group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-ember/20 hover:shadow-lg"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-sand">
        {caterer.coverImageUrl ? (
          <Image
            src={caterer.coverImageUrl}
            alt={`${caterer.name} cover`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand to-sand-dark">
            <ChefHat className="h-12 w-12 text-ember/20" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {caterer.isFeatured && (
            <span className="rounded-full bg-gold/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
              Featured
            </span>
          )}
          {caterer.isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-sage shadow-sm backdrop-blur-sm">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        {/* Rating badge */}
        {parseFloat(ratingStr) > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-espresso/80 px-2.5 py-1 text-white shadow-sm backdrop-blur-sm">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="text-xs font-bold">{ratingStr}</span>
            {caterer.reviewCount > 0 && (
              <span className="text-[10px] text-white/60">
                ({caterer.reviewCount})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Logo + Name */}
        <div className="flex items-start gap-3">
          {caterer.logoUrl ? (
            <Image
              src={caterer.logoUrl}
              alt={`${caterer.name} logo`}
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0 rounded-xl border border-border/50 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ember/[0.08]">
              <span className="text-sm font-bold text-ember">
                {caterer.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-foreground">
              {caterer.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {caterer.city && (
                <>
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>{caterer.city}</span>
                </>
              )}
              {caterer.city && caterer.priceRange && (
                <span className="text-border">&middot;</span>
              )}
              {caterer.priceRange && (
                <span className="font-semibold text-ember/70">
                  {PRICE_LABELS[caterer.priceRange] ?? caterer.priceRange}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {caterer.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {caterer.description}
          </p>
        )}

        {/* Tags */}
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap gap-1.5">
            {caterer.cuisines.slice(0, 3).map((cuisine) => (
              <span
                key={cuisine}
                className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium text-foreground/60"
              >
                {cuisine}
              </span>
            ))}
            {caterer.maxGuests && (
              <span className="flex items-center gap-1 rounded-full bg-sage/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-sage/70">
                <Users className="h-2.5 w-2.5" />
                up to {caterer.maxGuests}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────────
// Loading Skeleton
// ────────────────────────────────────────────────────────────────────

function CatererCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-1.5 h-3 w-4/5" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Main Client Component
// ────────────────────────────────────────────────────────────────────

export const ExplorePage = ({ initialCity }: ExplorePageProps) => {
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState(initialCity ?? "");
  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState<
    "featured" | "rating" | "reviews" | "newest"
  >("featured");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get cities for filter pills
  const { data: citiesData } = api.marketplace.getCities.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Get cuisines for filter
  const { data: cuisinesData } = api.marketplace.getCuisines.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000,
    },
  );

  // Infinite query for caterers
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = api.marketplace.browse.useInfiniteQuery(
    {
      city: selectedCity || undefined,
      type: selectedType || undefined,
      search: debouncedSearch || undefined,
      sortBy,
      limit: 12,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 30 * 1000,
    },
  );

  // Intersection Observer for infinite scroll
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const allCaterers =
    data?.pages.flatMap((page) => page.caterers as CatererCard[]) ?? [];

  const hasActiveFilters = selectedCity || selectedType || debouncedSearch;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCity("");
    setSelectedType("");
    setSortBy("featured");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Search & Filter Bar ───────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Search caterers, cuisines, cities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-10 pr-4"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground/50 hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort + Filter toggle */}
            <div className="flex items-center gap-3">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | "featured"
                        | "rating"
                        | "reviews"
                        | "newest",
                    )
                  }
                  className="h-11 appearance-none rounded-xl border border-input bg-background py-2 pl-3.5 pr-9 text-sm font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
                  showFilters
                    ? "border-ember/30 bg-ember/[0.06] text-ember"
                    : "border-input bg-background text-foreground hover:border-ember/20",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ember text-[10px] font-bold text-white">
                    {[selectedCity, selectedType, debouncedSearch].filter(
                      Boolean,
                    ).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Extended Filters Panel ──────────────────── */}
          {showFilters && (
            <div className="mt-4 rounded-xl border border-border/50 bg-sand/30 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Org type */}
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ORG_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setSelectedType(
                            selectedType === opt.value ? "" : opt.value,
                          )
                        }
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                          selectedType === opt.value
                            ? "bg-ember text-white"
                            : "bg-background text-foreground/70 ring-1 ring-border/50 hover:ring-ember/30",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular cuisines */}
                {cuisinesData && cuisinesData.length > 0 && (
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Popular Cuisines
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {cuisinesData.slice(0, 8).map((cuisine) => (
                        <span
                          key={cuisine.name}
                          className="rounded-full bg-background px-3 py-1 text-xs text-foreground/60 ring-1 ring-border/50"
                        >
                          {cuisine.name}{" "}
                          <span className="text-muted-foreground/40">
                            ({cuisine.count})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedCity && (
                      <Badge
                        variant="secondary"
                        className="gap-1.5 bg-ember/[0.08] text-ember"
                      >
                        <MapPin className="h-3 w-3" />
                        {selectedCity}
                        <button
                          onClick={() => setSelectedCity("")}
                          className="ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedType && (
                      <Badge
                        variant="secondary"
                        className="gap-1.5 bg-sage/[0.08] text-sage"
                      >
                        {selectedType}
                        <button
                          onClick={() => setSelectedType("")}
                          className="ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-ember hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── City Filter Pills ─────────────────────────────── */}
      <div className="border-b border-border/30 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="scrollbar-thin flex gap-2 overflow-x-auto py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedCity("")}
              className={cn(
                "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                !selectedCity
                  ? "bg-ember text-white shadow-sm"
                  : "bg-sand text-foreground/60 hover:bg-sand-dark",
              )}
            >
              All Cities
            </button>
            {(
              citiesData?.map((c) => c.name) ??
              MOROCCAN_CITIES
            ).map((city) => (
              <button
                key={city}
                onClick={() =>
                  setSelectedCity(selectedCity === city ? "" : city)
                }
                className={cn(
                  "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  selectedCity === city
                    ? "bg-ember text-white shadow-sm"
                    : "bg-sand text-foreground/60 hover:bg-sand-dark",
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading caterers..."
              : `${allCaterers.length}${hasNextPage ? "+" : ""} caterer${allCaterers.length !== 1 ? "s" : ""} found`}
            {selectedCity && (
              <span className="font-medium text-foreground">
                {" "}
                in {selectedCity}
              </span>
            )}
          </p>
        </div>

        {/* Error state */}
        {isError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-8 text-center">
            <p className="font-semibold text-destructive">
              Failed to load caterers
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please try again later.
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CatererCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && allCaterers.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sand">
              <ChefHat className="h-8 w-8 text-ember/30" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              No caterers found
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Try adjusting your filters or search terms. We&apos;re constantly
              adding new caterers across Morocco.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-5 rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember/90"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Caterer grid */}
        {!isLoading && allCaterers.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allCaterers.map((caterer) => (
              <CatererCardComponent key={caterer.id} caterer={caterer} />
            ))}

            {/* Loading more skeletons */}
            {isFetchingNextPage &&
              Array.from({ length: 3 }).map((_, i) => (
                <CatererCardSkeleton key={`loading-${i}`} />
              ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-10" />

        {/* End of results */}
        {!isLoading &&
          !hasNextPage &&
          allCaterers.length > 0 &&
          allCaterers.length > 12 && (
            <p className="mt-8 text-center text-sm text-muted-foreground/50">
              You&apos;ve seen all caterers
              {selectedCity ? ` in ${selectedCity}` : ""}
            </p>
          )}
      </div>
    </div>
  );
};
