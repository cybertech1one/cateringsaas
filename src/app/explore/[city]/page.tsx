import { type Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { getAppUrl } from "~/utils/getBaseUrl";
import { Navbar } from "~/components/Navbar/Navbar";
import {
  MapPin,
  Star,
  BadgeCheck,
  ChefHat,
  ChevronRight,
  Users,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const appUrl = getAppUrl();

// ────────────────────────────────────────────────────────────────────
// City meta info
// ────────────────────────────────────────────────────────────────────

const CITY_META: Record<
  string,
  { name: string; nameFr: string; nameAr: string; description: string }
> = {
  casablanca: {
    name: "Casablanca",
    nameFr: "Casablanca",
    nameAr: "الدار البيضاء",
    description:
      "Morocco's largest city and economic hub. Find premium caterers for weddings, corporate galas, and grand celebrations.",
  },
  marrakech: {
    name: "Marrakech",
    nameFr: "Marrakech",
    nameAr: "مراكش",
    description:
      "The Red City, famous for its vibrant food scene. Discover traditional riads and modern caterers for unforgettable events.",
  },
  rabat: {
    name: "Rabat",
    nameFr: "Rabat",
    nameAr: "الرباط",
    description:
      "Morocco's capital city. Find elegant caterers specializing in diplomatic receptions, government events, and refined celebrations.",
  },
  fes: {
    name: "Fes",
    nameFr: "Fès",
    nameAr: "فاس",
    description:
      "The spiritual capital of Morocco. Home to master chefs preserving centuries-old Fassi culinary traditions.",
  },
  tangier: {
    name: "Tangier",
    nameFr: "Tanger",
    nameAr: "طنجة",
    description:
      "Gateway between Africa and Europe. Discover caterers blending Mediterranean and Moroccan flavors for coastal celebrations.",
  },
  agadir: {
    name: "Agadir",
    nameFr: "Agadir",
    nameAr: "أكادير",
    description:
      "Morocco's beach paradise. Find caterers specializing in seafood feasts, resort events, and beachside celebrations.",
  },
  meknes: {
    name: "Meknes",
    nameFr: "Meknès",
    nameAr: "مكناس",
    description:
      "Imperial city known for olives and wine. Discover local caterers with authentic Meknassi cuisine.",
  },
  oujda: {
    name: "Oujda",
    nameFr: "Oujda",
    nameAr: "وجدة",
    description:
      "Eastern Morocco's cultural heart. Find caterers specializing in Algerian-influenced cuisine and Eastern Moroccan traditions.",
  },
  kenitra: {
    name: "Kenitra",
    nameFr: "Kénitra",
    nameAr: "القنيطرة",
    description:
      "A growing city on the Atlantic coast. Discover versatile caterers for all types of events.",
  },
};

// ────────────────────────────────────────────────────────────────────
// Helpers
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

function toTitleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ────────────────────────────────────────────────────────────────────
// Metadata
// ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: { city: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const citySlug = params.city.toLowerCase();
  const meta = CITY_META[citySlug];
  const cityName = meta?.name ?? toTitleCase(citySlug);

  return {
    title: `Caterers in ${cityName} | Diyafa Marketplace`,
    description: `Find the best caterers in ${cityName}, Morocco. Browse wedding caterers, corporate event specialists, and celebration catering services. Compare ratings, menus, and prices on Diyafa.`,
    keywords: [
      `caterers ${cityName}`,
      `traiteur ${cityName}`,
      `catering ${cityName}`,
      `wedding catering ${cityName}`,
      `traiteur mariage ${cityName}`,
      `corporate catering ${cityName}`,
    ],
    alternates: {
      canonical: `${appUrl}/explore/${citySlug}`,
    },
    openGraph: {
      title: `Caterers in ${cityName} | Diyafa`,
      description: `Discover top caterers in ${cityName} for weddings, corporate events, and celebrations.`,
      url: `${appUrl}/explore/${citySlug}`,
      type: "website",
    },
  };
}

// ────────────────────────────────────────────────────────────────────
// JSON-LD
// ────────────────────────────────────────────────────────────────────

function CityJsonLd({ cityName, slug }: { cityName: string; slug: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Caterers in ${cityName}`,
    description: `Browse and discover the best caterers in ${cityName}, Morocco.`,
    url: `${appUrl}/explore/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Diyafa",
      url: appUrl,
    },
    about: {
      "@type": "City",
      name: cityName,
      containedInPlace: {
        "@type": "Country",
        name: "Morocco",
      },
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
        {
          "@type": "ListItem",
          position: 3,
          name: cityName,
          item: `${appUrl}/explore/${slug}`,
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

export default async function CityExplorePage({ params }: PageProps) {
  const citySlug = params.city.toLowerCase();
  const meta = CITY_META[citySlug];
  const cityName = meta?.name ?? toTitleCase(citySlug);

  // Fetch caterers for this city
  const [browseResult, allCities] = await Promise.all([
    api.marketplace.browse.query({
      city: cityName,
      sortBy: "featured",
      limit: 30,
    }),
    api.marketplace.getCities.query(),
  ]);

  const caterers = browseResult.caterers;

  // If city has no caterers and is not in our known cities, 404
  if (caterers.length === 0 && !meta) {
    notFound();
  }

  // Other cities for cross-linking
  const otherCities = allCities.filter(
    (c) => c.slug !== citySlug,
  );

  return (
    <>
      <CityJsonLd cityName={cityName} slug={citySlug} />
      <Navbar />

      <main id="main-content" className="min-h-screen bg-background">
        {/* ═══════════════════════════════════════════════════════════
            BREADCRUMB
        ═══════════════════════════════════════════════════════════ */}
        <div className="border-b border-border/30 bg-sand/30">
          <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Link
                href="/"
                className="transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                href="/explore"
                className="transition-colors hover:text-foreground"
              >
                Explore
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{cityName}</span>
            </nav>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CITY HEADER
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden hero-vibrant">
          <div
            className="hero-bg-pattern absolute inset-0"
            aria-hidden="true"
          />
          <div
            className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-ember/[0.06] blur-[100px]"
            aria-hidden="true"
          />

          <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember/[0.08]">
                <MapPin className="h-6 w-6 text-ember" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                  Caterers in {cityName}
                </h1>
                {meta?.nameAr && (
                  <p className="mt-0.5 text-base text-muted-foreground/60 font-arabic" dir="rtl">
                    {meta.nameAr}
                  </p>
                )}
              </div>
            </div>

            {meta?.description && (
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {meta.description}
              </p>
            )}

            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground/60">
              <span className="flex items-center gap-1.5">
                <ChefHat className="h-4 w-4" />
                <span className="font-semibold text-foreground">
                  {caterers.length}
                </span>{" "}
                caterer{caterers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CATERER GRID
        ═══════════════════════════════════════════════════════════ */}
        <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            {caterers.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sand">
                  <ChefHat className="h-8 w-8 text-ember/30" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  No caterers in {cityName} yet
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  We&apos;re expanding rapidly. Check back soon or browse
                  caterers in other cities.
                </p>
                <Link
                  href="/explore"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember/90"
                >
                  Browse all cities
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {caterers.map((caterer) => {
                  const ratingStr = formatRating(caterer.rating);
                  return (
                    <Link
                      key={caterer.id}
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

                        {/* Badges */}
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
                              {caterer.priceRange && (
                                <span className="font-semibold text-ember/70">
                                  {PRICE_LABELS[caterer.priceRange] ??
                                    caterer.priceRange}
                                </span>
                              )}
                              {caterer.maxGuests && (
                                <>
                                  <span className="text-border">
                                    &middot;
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    up to {caterer.maxGuests} guests
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {caterer.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {caterer.description}
                          </p>
                        )}

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
                            {(caterer.specialties as string[])
                              .slice(0, 2)
                              .map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full bg-sage/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-sage/70"
                                >
                                  {s}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            OTHER CITIES
        ═══════════════════════════════════════════════════════════ */}
        {otherCities.length > 0 && (
          <section className="border-t border-border/30 bg-sand/20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="container mx-auto max-w-6xl">
              <div className="mb-8 text-center">
                <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  Explore Other Cities
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Find caterers across all of Morocco
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {otherCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/explore/${c.slug}`}
                    className="group flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-medium text-foreground/70 ring-1 ring-border/50 transition-all hover:ring-ember/30 hover:text-ember"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-ember" />
                    {c.name}
                    <span className="text-xs text-muted-foreground/40">
                      ({c.count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CTA
        ═══════════════════════════════════════════════════════════ */}
        <section className="border-t border-border/30 bg-background px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Are you a caterer in {cityName}?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Join Diyafa and reach thousands of event planners looking for
              catering services in your city. Free to get started.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-ember px-8 py-4 text-base font-semibold text-white shadow-lg shadow-ember/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <ChefHat className="h-4.5 w-4.5" />
              List Your Business
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
