import { type Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/server";
import { getAppUrl } from "~/utils/getBaseUrl";
import { Navbar } from "~/components/Navbar/Navbar";
import { cn } from "~/utils/cn";
import {
  MapPin,
  Star,
  BadgeCheck,
  ChefHat,
  ArrowRight,
  Search,
} from "lucide-react";

export const dynamic = "force-dynamic";

const appUrl = getAppUrl();

// ────────────────────────────────────────────────────────────────────
// Metadata
// ────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Find Caterers in Morocco | Diyafa Marketplace",
  description:
    "Browse and discover the best caterers across Morocco. Find wedding caterers, corporate event specialists, Ramadan iftar services and more in Casablanca, Marrakech, Rabat, Fes, Tangier, and Agadir.",
  keywords: [
    "caterers Morocco",
    "traiteur Maroc",
    "wedding catering Morocco",
    "corporate catering Casablanca",
    "traiteur mariage Casablanca",
    "traiteur Marrakech",
    "catering Rabat",
    "Diyafa marketplace",
    "find caterer Morocco",
  ],
  alternates: {
    canonical: `${appUrl}/explore`,
  },
  openGraph: {
    title: "Find Caterers in Morocco | Diyafa",
    description:
      "Discover top caterers for weddings, corporate events, and celebrations across Morocco. Compare ratings, menus, and prices.",
    url: `${appUrl}/explore`,
    type: "website",
  },
};

// ────────────────────────────────────────────────────────────────────
// Helper
// ────────────────────────────────────────────────────────────────────

const PRICE_LABELS: Record<string, string> = {
  budget: "$",
  mid: "$$",
  premium: "$$$",
  luxury: "$$$$",
};

function formatRating(rating: unknown): string {
  if (rating === null || rating === undefined) return "0.0";
  const n = typeof rating === "string" ? parseFloat(rating) : Number(rating);
  return isNaN(n) ? "0.0" : n.toFixed(1);
}

// ────────────────────────────────────────────────────────────────────
// Static city data for the hero grid
// ────────────────────────────────────────────────────────────────────

const HERO_CITIES = [
  {
    name: "Casablanca",
    slug: "casablanca",
    image: "/images/landing/restaurant-interior.jpg",
    description: "Morocco's economic capital",
    large: true,
  },
  {
    name: "Marrakech",
    slug: "marrakech",
    image: "/images/landing/tagine.jpg",
    description: "The Red City",
  },
  {
    name: "Rabat",
    slug: "rabat",
    image: "/images/landing/moroccan-food.jpg",
    description: "The capital city",
  },
  {
    name: "Fes",
    slug: "fes",
    image: "/images/landing/couscous.jpg",
    description: "Spiritual capital",
  },
  {
    name: "Tangier",
    slug: "tangier",
    image: "/images/landing/food-plating.jpg",
    description: "Gateway to Africa",
  },
  {
    name: "Agadir",
    slug: "agadir",
    image: "/images/landing/fine-dining.jpg",
    description: "Beach paradise",
  },
];

// ────────────────────────────────────────────────────────────────────
// JSON-LD
// ────────────────────────────────────────────────────────────────────

function ExploreJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Find Caterers in Morocco",
    description:
      "Browse and discover the best caterers across Morocco for weddings, corporate events, and celebrations.",
    url: `${appUrl}/explore`,
    isPartOf: {
      "@type": "WebSite",
      name: "Diyafa",
      url: appUrl,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: appUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Explore Caterers",
          item: `${appUrl}/explore`,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  // Server-side data fetching
  const [featuredCaterers, cities, stats] = await Promise.all([
    api.marketplace.getFeatured.query({ limit: 6 }),
    api.marketplace.getCities.query(),
    api.marketplace.getStats.query(),
  ]);

  // Build city count map
  const cityCountMap = new Map(cities.map((c) => [c.name.toLowerCase(), c.count]));

  return (
    <>
      <ExploreJsonLd />
      <Navbar />

      <main id="main-content" className="min-h-screen">
        {/* ═══════════════════════════════════════════════════════════
            HERO — Search-forward header
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden hero-vibrant">
          <div
            className="hero-bg-pattern absolute inset-0"
            aria-hidden="true"
          />
          <div
            className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-ember/[0.06] blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gold/[0.08] blur-[80px]"
            aria-hidden="true"
          />

          <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="animate-fade-up font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Find the Perfect{" "}
                <span className="text-gradient">Caterer</span>
              </h1>
              <p className="animate-fade-up animate-delay-100 mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Discover top-rated caterers across Morocco for weddings,
                corporate events, and celebrations.
              </p>

              {/* Search bar that links to client-side explore */}
              <div className="animate-fade-up animate-delay-200 mx-auto mt-8 max-w-lg">
                <Link
                  href="#browse"
                  className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-background/80 px-5 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-ember/30 hover:shadow-xl"
                >
                  <Search className="h-5 w-5 text-muted-foreground/50 transition-colors group-hover:text-ember" />
                  <span className="text-base text-muted-foreground/60">
                    Search caterers, cuisines, cities...
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ember" />
                </Link>
              </div>

              {/* Stats */}
              <div className="animate-fade-up animate-delay-300 mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground/60">
                <span className="flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4" />
                  <span className="font-semibold text-foreground">
                    {stats.catererCount}+
                  </span>{" "}
                  caterers
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold text-foreground">
                    {stats.cityCount}
                  </span>{" "}
                  cities
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4" />
                  <span className="font-semibold text-foreground">
                    {stats.reviewCount}
                  </span>{" "}
                  reviews
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CITIES — Browse by city
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative border-b border-border/30 bg-background px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div
            className="moroccan-geo absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-ember/70">
                Browse by City
              </p>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Caterers Across Morocco
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {HERO_CITIES.map((city) => {
                const count = cityCountMap.get(city.slug) ?? 0;
                return (
                  <Link
                    key={city.slug}
                    href={`/explore/${city.slug}`}
                    className={cn(
                      "card-3d group relative overflow-hidden rounded-2xl",
                      city.large && "lg:col-span-2 lg:row-span-2",
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex items-end p-5 transition-all duration-300",
                        city.large
                          ? "aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[300px] lg:p-6"
                          : "aspect-[16/10]",
                      )}
                    >
                      <Image
                        src={city.image}
                        alt={`Caterers in ${city.name}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes={
                          city.large
                            ? "(max-width: 768px) 100vw, 600px"
                            : "256px"
                        }
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="relative z-10">
                        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
                          {count} caterer{count !== 1 ? "s" : ""}
                        </p>
                        <h3
                          className={cn(
                            "font-display font-bold text-white drop-shadow-sm",
                            city.large
                              ? "text-3xl sm:text-4xl"
                              : "text-xl sm:text-2xl",
                          )}
                        >
                          {city.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                          <MapPin className="h-3.5 w-3.5" />
                          {city.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Additional cities */}
            {cities.length > 6 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {cities.slice(6).map((city) => (
                  <Link
                    key={city.slug}
                    href={`/explore/${city.slug}`}
                    className="rounded-full bg-sand px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-ember/[0.08] hover:text-ember"
                  >
                    {city.name}{" "}
                    <span className="text-muted-foreground/40">
                      ({city.count})
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FEATURED CATERERS
        ═══════════════════════════════════════════════════════════ */}
        {featuredCaterers.length > 0 && (
          <section className="bg-background px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="container mx-auto max-w-6xl">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold/80">
                    Hand-Picked
                  </p>
                  <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                    Featured Caterers
                  </h2>
                </div>
                <Link
                  href="#browse"
                  className="group hidden items-center gap-1.5 text-sm font-semibold text-ember transition-colors hover:text-ember/80 sm:flex"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCaterers.map((caterer) => {
                  const ratingStr = formatRating(caterer.rating);
                  return (
                    <Link
                      key={caterer.id}
                      href={`/caterer/${caterer.slug}`}
                      className="card-3d group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-ember/20 hover:shadow-lg"
                    >
                      {/* Cover */}
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

                        {/* Badges */}
                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <span className="rounded-full bg-gold/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
                            Featured
                          </span>
                          {caterer.isVerified && (
                            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-sage shadow-sm backdrop-blur-sm">
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        {/* Rating */}
                        {parseFloat(ratingStr) > 0 && (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-espresso/80 px-2.5 py-1 text-white shadow-sm backdrop-blur-sm">
                            <Star className="h-3 w-3 fill-gold text-gold" />
                            <span className="text-xs font-bold">
                              {ratingStr}
                            </span>
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
                                <span className="text-border">
                                  &middot;
                                </span>
                              )}
                              {caterer.priceRange && (
                                <span className="font-semibold text-ember/70">
                                  {PRICE_LABELS[caterer.priceRange] ??
                                    caterer.priceRange}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {caterer.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {caterer.description}
                          </p>
                        )}

                        {/* Cuisine tags */}
                        <div className="mt-auto pt-3">
                          <div className="flex flex-wrap gap-1.5">
                            {(caterer.cuisines as string[])
                              .slice(0, 3)
                              .map((cuisine) => (
                                <span
                                  key={cuisine}
                                  className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium text-foreground/60"
                                >
                                  {cuisine}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            BROWSE ALL — Client-side interactive explorer
        ═══════════════════════════════════════════════════════════ */}
        <section id="browse" className="border-t border-border/30">
          <ExploreClient />
        </section>
      </main>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Lazy-loaded client component
// ────────────────────────────────────────────────────────────────────

import dynamic2 from "next/dynamic";

const ExploreClient = dynamic2(
  () =>
    import("~/pageComponents/Explore/Explore.page").then((m) => ({
      default: m.ExplorePage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 h-11 w-full animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card"
            >
              <div className="aspect-[16/10] w-full animate-pulse bg-muted" />
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
);
