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
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  Calendar,
  Clock,
  Utensils,
  Shield,
  Award,
  ExternalLink,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";

export const dynamic = "force-dynamic";

const appUrl = getAppUrl();

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

const PRICE_LABELS: Record<string, { label: string; description: string }> = {
  budget: { label: "$", description: "Budget-friendly" },
  mid: { label: "$$", description: "Mid-range" },
  premium: { label: "$$$", description: "Premium" },
  luxury: { label: "$$$$", description: "Luxury" },
};

const ORG_TYPE_LABELS: Record<string, string> = {
  caterer: "Caterer",
  restaurant: "Restaurant",
  hotel: "Hotel",
  venue: "Venue",
  event_planner: "Event Planner",
};

function formatRating(rating: unknown): string {
  if (rating === null || rating === undefined) return "0.0";
  const n = typeof rating === "string" ? parseFloat(rating) : Number(rating);
  return isNaN(n) ? "0.0" : n.toFixed(1);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ────────────────────────────────────────────────────────────────────
// Metadata
// ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const org = await api.organizations.getPublicProfile.query({
      slug: params.slug,
    });

    const title = `${org.name} — ${org.city ? `Caterer in ${org.city}` : "Caterer"} | Diyafa`;
    const description =
      org.description ??
      `${org.name} is a ${ORG_TYPE_LABELS[org.type] ?? "caterer"} based in ${org.city ?? "Morocco"}. Browse menus, view portfolio, and read reviews on Diyafa.`;

    return {
      title,
      description,
      alternates: {
        canonical: `${appUrl}/caterer/${params.slug}`,
      },
      openGraph: {
        title: `${org.name} | Diyafa`,
        description,
        url: `${appUrl}/caterer/${params.slug}`,
        type: "profile",
        images: org.coverImageUrl
          ? [{ url: org.coverImageUrl, width: 1200, height: 630, alt: org.name }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${org.name} | Diyafa`,
        description,
      },
    };
  } catch {
    return {
      title: "Caterer Not Found | Diyafa",
    };
  }
}

// ────────────────────────────────────────────────────────────────────
// JSON-LD
// ────────────────────────────────────────────────────────────────────

function CatererJsonLd({
  org,
}: {
  org: {
    name: string;
    slug: string;
    type: string;
    description: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    cuisines: string[];
    rating: unknown;
    reviewCount: number;
    priceRange: string | null;
  };
}) {
  const ratingNum = parseFloat(formatRating(org.rating));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: org.name,
    description: org.description,
    url: `${appUrl}/caterer/${org.slug}`,
    image: org.coverImageUrl ?? org.logoUrl,
    logo: org.logoUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: org.city,
      addressCountry: "MA",
      ...(org.address ? { streetAddress: org.address } : {}),
    },
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(org.email ? { email: org.email } : {}),
    ...(org.website ? { sameAs: [org.website] } : {}),
    servesCuisine: org.cuisines,
    priceRange: org.priceRange
      ? PRICE_LABELS[org.priceRange]?.label ?? org.priceRange
      : undefined,
    ...(ratingNum > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingNum.toString(),
            reviewCount: org.reviewCount.toString(),
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
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
          name: "Explore",
          item: `${appUrl}/explore`,
        },
        ...(org.city
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: org.city,
                item: `${appUrl}/explore/${org.city.toLowerCase().replace(/\s+/g, "-")}`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name: org.name,
                item: `${appUrl}/caterer/${org.slug}`,
              },
            ]
          : [
              {
                "@type": "ListItem",
                position: 3,
                name: org.name,
                item: `${appUrl}/caterer/${org.slug}`,
              },
            ]),
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
// Star Rating Component
// ────────────────────────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${
            i < Math.round(rating) ? "fill-gold text-gold" : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────

export default async function CatererProfilePage({ params }: PageProps) {
  const org = await api.organizations.getPublicProfile.query({
    slug: params.slug,
  }).catch(() => null);

  if (!org) {
    notFound();
  }

  // Parallel data fetching
  const [menus, portfolio, reviewsResult] = await Promise.all([
    api.cateringMenus.getPublicMenus
      .query({ orgSlug: params.slug })
      .catch(() => []),
    api.portfolio.getPublicPortfolio
      .query({ orgSlug: params.slug, limit: 12 })
      .catch(() => []),
    api.eventReviews.getPublicReviews
      .query({ orgSlug: params.slug, limit: 6, sortBy: "newest" })
      .catch(() => ({ reviews: [], nextCursor: undefined })),
  ]);

  const reviews = reviewsResult.reviews ?? [];
  const ratingStr = formatRating(org.rating);
  const ratingNum = parseFloat(ratingStr);

  return (
    <>
      <CatererJsonLd
        org={{
          ...org,
          cuisines: org.cuisines as string[],
        }}
      />
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
              {org.city && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <Link
                    href={`/explore/${org.city.toLowerCase().replace(/\s+/g, "-")}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {org.city}
                  </Link>
                </>
              )}
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{org.name}</span>
            </nav>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            COVER + PROFILE HEADER
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative">
          {/* Cover image */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-sand to-sand-dark sm:h-64 md:h-72">
            {org.coverImageUrl ? (
              <Image
                src={org.coverImageUrl}
                alt={`${org.name} cover photo`}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 hero-vibrant">
                <div
                  className="hero-bg-pattern absolute inset-0"
                  aria-hidden="true"
                />
                <div
                  className="moroccan-geo absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>

          {/* Profile info */}
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-16 pb-8 sm:-mt-20">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {org.logoUrl ? (
                    <Image
                      src={org.logoUrl}
                      alt={`${org.name} logo`}
                      width={120}
                      height={120}
                      className="h-24 w-24 rounded-2xl border-4 border-background bg-card object-cover shadow-lg sm:h-28 sm:w-28 md:h-32 md:w-32"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-card shadow-lg sm:h-28 sm:w-28 md:h-32 md:w-32">
                      <span className="font-display text-3xl font-bold text-ember sm:text-4xl">
                        {org.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                      {org.name}
                    </h1>
                    {org.isVerified && (
                      <Badge className="gap-1 bg-sage/10 text-sage border-sage/20">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <ChefHat className="h-3.5 w-3.5" />
                      {ORG_TYPE_LABELS[org.type] ?? org.type}
                    </span>
                    {org.city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {org.city}
                        {org.address && (
                          <span className="text-muted-foreground/40">
                            &middot; {org.address}
                          </span>
                        )}
                      </span>
                    )}
                    {ratingNum > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <span className="font-semibold text-foreground">
                          {ratingStr}
                        </span>
                        <span className="text-muted-foreground/50">
                          ({org.reviewCount} review
                          {org.reviewCount !== 1 ? "s" : ""})
                        </span>
                      </span>
                    )}
                    {org.priceRange && (
                      <span className="font-semibold text-ember">
                        {PRICE_LABELS[org.priceRange]?.label ?? org.priceRange}
                        <span className="ml-1 font-normal text-muted-foreground/50">
                          {PRICE_LABELS[org.priceRange]?.description ?? ""}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex gap-3 flex-shrink-0">
                  {org.whatsappNumber && (
                    <a
                      href={`https://wa.me/${org.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${org.name}, I found you on Diyafa and would like to inquire about catering services.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  {org.phone && (
                    <a
                      href={`tel:${org.phone}`}
                      className="inline-flex items-center gap-2 rounded-2xl border-2 border-foreground/10 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-ember/30 hover:bg-ember/[0.04]"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CONTENT GRID
        ═══════════════════════════════════════════════════════════ */}
        <div className="container mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* ── Main Content (2/3) ──────────────────────────── */}
            <div className="space-y-10 lg:col-span-2">
              {/* About */}
              {(org.description || org.bio) && (
                <section>
                  <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                    About
                  </h2>
                  {org.description && (
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {org.description}
                    </p>
                  )}
                  {org.bio && (
                    <div className="mt-4 text-sm leading-relaxed text-muted-foreground/80 whitespace-pre-line">
                      {org.bio}
                    </div>
                  )}
                </section>
              )}

              {/* Specialties & Cuisines */}
              {((org.cuisines as string[]).length > 0 ||
                (org.specialties as string[]).length > 0) && (
                <section>
                  <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                    Specialties & Cuisines
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {(org.cuisines as string[]).map((cuisine) => (
                      <Badge
                        key={cuisine}
                        variant="secondary"
                        className="bg-ember/[0.06] text-ember/80"
                      >
                        <Utensils className="mr-1 h-3 w-3" />
                        {cuisine}
                      </Badge>
                    ))}
                    {(org.specialties as string[]).map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="bg-sage/[0.06] text-sage/80"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Catering Menus */}
              {menus.length > 0 && (
                <section>
                  <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                    Catering Menus
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {menus.map((menu) => (
                      <div
                        key={menu.id}
                        className="group rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-ember/20 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-base font-bold text-foreground">
                              {menu.name}
                            </h3>
                            {menu.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {menu.description}
                              </p>
                            )}
                          </div>
                          {menu.basePricePerPerson > 0 && (
                            <div className="ml-3 flex-shrink-0 text-right">
                              <p className="font-display text-lg font-bold text-ember">
                                {menu.basePricePerPerson} {menu.currency}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                per person
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Menu details */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium text-foreground/60">
                            {menu.eventType}
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium text-foreground/60">
                            <Users className="h-2.5 w-2.5" />
                            {menu.minGuests}
                            {menu.maxGuests
                              ? `–${menu.maxGuests}`
                              : "+"}{" "}
                            guests
                          </span>
                          {menu.dietaryTags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-sage/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-sage/70"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Categories preview */}
                        {menu.categories && menu.categories.length > 0 && (
                          <div className="mt-4 border-t border-border/30 pt-3">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                              Menu Sections
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {menu.categories.slice(0, 5).map(
                                (cat: {
                                  id: string;
                                  name: string;
                                  cateringItems: unknown[];
                                }) => (
                                  <span
                                    key={cat.id}
                                    className="rounded-md bg-background px-2 py-0.5 text-[11px] text-foreground/50 ring-1 ring-border/30"
                                  >
                                    {cat.name}{" "}
                                    <span className="text-muted-foreground/30">
                                      ({cat.cateringItems.length})
                                    </span>
                                  </span>
                                ),
                              )}
                              {menu.categories.length > 5 && (
                                <span className="text-[11px] text-muted-foreground/40">
                                  +{menu.categories.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Portfolio Gallery */}
              {portfolio.length > 0 && (
                <section>
                  <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                    Portfolio
                  </h2>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                    {portfolio.map(
                      (img: {
                        id: string;
                        imageUrl: string;
                        thumbnailUrl: string | null;
                        caption: string | null;
                        eventType: string | null;
                        isFeatured: boolean;
                      }) => (
                        <div
                          key={img.id}
                          className="group relative aspect-square overflow-hidden rounded-xl"
                        >
                          <Image
                            src={img.thumbnailUrl ?? img.imageUrl}
                            alt={img.caption ?? `${org.name} portfolio`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="p-3">
                              {img.caption && (
                                <p className="text-xs font-medium text-white">
                                  {img.caption}
                                </p>
                              )}
                              {img.eventType && (
                                <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                                  {img.eventType}
                                </span>
                              )}
                            </div>
                          </div>
                          {img.isFeatured && (
                            <div className="absolute left-2 top-2">
                              <Award className="h-4 w-4 text-gold drop-shadow-sm" />
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </section>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <section>
                  <div className="mb-6 flex items-end justify-between">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">
                        Reviews
                      </h2>
                      {ratingNum > 0 && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="font-display text-4xl font-bold text-foreground">
                            {ratingStr}
                          </span>
                          <div>
                            <StarRating rating={ratingNum} size="md" />
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Based on {org.reviewCount} review
                              {org.reviewCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.map(
                      (review: {
                        id: string;
                        reviewerName: string;
                        eventType: string | null;
                        guestCount: number | null;
                        eventDate: Date | string | null;
                        ratingOverall: number;
                        comment: string | null;
                        photos: string[];
                        response: string | null;
                        respondedAt: Date | string | null;
                        isVerified: boolean;
                      }) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-border/50 bg-card p-5"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/[0.06]">
                                <span className="text-sm font-bold text-ember">
                                  {review.reviewerName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="flex items-center gap-2 font-semibold text-foreground">
                                  {review.reviewerName}
                                  {review.isVerified && (
                                    <BadgeCheck className="h-3.5 w-3.5 text-sage" />
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                                  {review.eventType && (
                                    <span>{review.eventType}</span>
                                  )}
                                  {review.guestCount && (
                                    <span>&middot; {review.guestCount} guests</span>
                                  )}
                                  {review.eventDate && (
                                    <span>
                                      &middot; {formatDate(review.eventDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <StarRating rating={review.ratingOverall} />
                          </div>

                          {review.comment && (
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              {review.comment}
                            </p>
                          )}

                          {/* Review photos */}
                          {review.photos.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto">
                              {review.photos.slice(0, 4).map((photo, idx) => (
                                <div
                                  key={idx}
                                  className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
                                >
                                  <Image
                                    src={photo}
                                    alt="Review photo"
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Owner response */}
                          {review.response && (
                            <div className="mt-4 ml-6 rounded-xl bg-sand/50 p-4 border-l-2 border-ember/20">
                              <p className="mb-1 text-xs font-semibold text-ember">
                                Response from {org.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {review.response}
                              </p>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* ── Sidebar (1/3) ───────────────────────────────── */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <div className="sticky top-4 space-y-6">
                <div className="rounded-2xl border border-border/50 bg-card p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-foreground">
                    Quick Info
                  </h3>

                  <div className="space-y-4">
                    {/* Guest capacity */}
                    {(org.minGuests || org.maxGuests) && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember/[0.06]">
                          <Users className="h-4 w-4 text-ember" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Guest Capacity
                          </p>
                          <p className="font-semibold text-foreground">
                            {org.minGuests ?? 10} &ndash;{" "}
                            {org.maxGuests ?? "500+"} guests
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price range */}
                    {org.priceRange && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/[0.06]">
                          <span className="text-sm font-bold text-gold">
                            {PRICE_LABELS[org.priceRange]?.label ?? "$"}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Price Range
                          </p>
                          <p className="font-semibold text-foreground">
                            {PRICE_LABELS[org.priceRange]?.description ??
                              org.priceRange}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Member since */}
                    {org.createdAt && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage/[0.06]">
                          <Calendar className="h-4 w-4 text-sage" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Member Since
                          </p>
                          <p className="font-semibold text-foreground">
                            {formatDate(org.createdAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Verified badge */}
                    {org.isVerified && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage/[0.06]">
                          <Shield className="h-4 w-4 text-sage" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Verification
                          </p>
                          <p className="font-semibold text-sage">
                            Verified Business
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Card */}
                <div className="rounded-2xl border border-border/50 bg-card p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-foreground">
                    Contact
                  </h3>

                  <div className="space-y-3">
                    {org.phone && (
                      <a
                        href={`tel:${org.phone}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sand hover:text-foreground"
                      >
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        {org.phone}
                      </a>
                    )}
                    {org.email && (
                      <a
                        href={`mailto:${org.email}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sand hover:text-foreground"
                      >
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        {org.email}
                      </a>
                    )}
                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sand hover:text-foreground"
                      >
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        Website
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </a>
                    )}
                    {org.instagram && (
                      <a
                        href={`https://instagram.com/${org.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sand hover:text-foreground"
                      >
                        <Instagram className="h-4 w-4 flex-shrink-0" />
                        @{org.instagram}
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </a>
                    )}
                    {org.facebook && (
                      <a
                        href={
                          org.facebook.startsWith("http")
                            ? org.facebook
                            : `https://facebook.com/${org.facebook}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sand hover:text-foreground"
                      >
                        <Facebook className="h-4 w-4 flex-shrink-0" />
                        Facebook
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {/* WhatsApp CTA */}
                  {org.whatsappNumber && (
                    <a
                      href={`https://wa.me/${org.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${org.name}, I found you on Diyafa and would like to inquire about catering services.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send Inquiry via WhatsApp
                    </a>
                  )}

                  {!org.whatsappNumber && org.phone && (
                    <a
                      href={`tel:${org.phone}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ember py-3 text-sm font-semibold text-white shadow-md shadow-ember/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Phone className="h-4 w-4" />
                      Contact Caterer
                    </a>
                  )}
                </div>

                {/* Request Quote Card */}
                <div className="rounded-2xl border border-ember/20 bg-ember/[0.03] p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.08]">
                    <Calendar className="h-5 w-5 text-ember" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Planning an event?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get a customized quote from {org.name} for your upcoming
                    event.
                  </p>
                  <Link
                    href={org.whatsappNumber
                      ? `https://wa.me/${org.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${org.name}, I'd like to request a quote for my event.`)}`
                      : `/register`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ember py-3 text-sm font-semibold text-white shadow-md shadow-ember/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Request a Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
