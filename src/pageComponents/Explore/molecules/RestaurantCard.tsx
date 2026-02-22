"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Eye, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Decimal } from "@prisma/client/runtime/library";

export interface RestaurantCardData {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  logoImageUrl: string | null;
  backgroundImageUrl: string | null;
  priceRange: number | null;
  rating: Decimal | null;
  reviewCount: number | null;
  viewCount: number | null;
  isFeatured: boolean | null;
  cuisineType: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  directoryCity: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

function PriceRange({ level }: { level: number }) {
  return (
    <span
      className="text-sm font-medium tracking-tight"
      aria-label={`Price range ${level} out of 4`}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={
            i < level ? "text-foreground" : "text-muted-foreground/25"
          }
        >
          $
        </span>
      ))}
    </span>
  );
}

function RatingBadge({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  if (reviewCount === 0 || rating === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {t("explore.noReviews")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
      <Star className="h-3 w-3 fill-current" />
      {rating.toFixed(1)}
      <span className="font-normal text-emerald-600 dark:text-emerald-500">
        ({reviewCount > 99 ? "99+" : reviewCount})
      </span>
    </span>
  );
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30";
  if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md shadow-gray-400/30";
  if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-700/30";

  return "bg-muted text-muted-foreground";
}

export function RestaurantCard({
  restaurant,
  rank,
}: {
  restaurant: RestaurantCardData;
  rank?: number;
}) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const ratingNum = restaurant.rating ? Number(restaurant.rating) : 0;
  const reviewCountNum = restaurant.reviewCount ?? 0;
  const priceRangeNum = restaurant.priceRange ?? 2;
  const viewCountNum = restaurant.viewCount ?? 0;
  const isFeatured = restaurant.isFeatured ?? false;
  const displayCity =
    restaurant.directoryCity?.name ?? restaurant.city;
  const cuisineName = restaurant.cuisineType?.name ?? null;

  const imageGradient =
    "bg-gradient-to-br from-primary/[0.08] via-muted to-gold/[0.08]";

  const renderImage = () => {
    if (restaurant.backgroundImageUrl) {
      return (
        <Image
          src={restaurant.backgroundImageUrl}
          alt={restaurant.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          loading="lazy"
        />
      );
    }

    if (restaurant.logoImageUrl) {
      return (
        <div
          className={`flex h-full w-full items-center justify-center ${imageGradient}`}
        >
          <Image
            src={restaurant.logoImageUrl}
            alt={restaurant.name}
            width={64}
            height={64}
            className="rounded-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div
        className={`flex h-full w-full items-center justify-center ${imageGradient}`}
      >
        <span className="font-sans text-4xl font-bold text-primary/30">
          {restaurant.name.charAt(0)}
        </span>
      </div>
    );
  };

  return (
    <Link
      href={`/menu/${restaurant.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
      aria-label={`${restaurant.name} - ${cuisineName ?? ""} - ${displayCity}`}
    >
      {/* Image area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {renderImage()}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Rank badge (for trending) */}
        {rank != null && (
          <span className={`absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full font-sans text-sm font-bold ${getRankBadgeClass(rank)}`}>
            {rank}
          </span>
        )}

        {/* Featured badge */}
        {isFeatured && !rank && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            {t("explore.featured")}
          </span>
        )}

        {/* View count */}
        {viewCountNum > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            {viewCountNum.toLocaleString()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-sans text-base font-semibold leading-tight text-foreground line-clamp-1 transition-colors group-hover:text-primary">
          {restaurant.name}
        </h3>

        {/* Rating + Price row */}
        <div className="flex items-center gap-2">
          <RatingBadge rating={ratingNum} reviewCount={reviewCountNum} />
          <span className="text-muted-foreground/30">·</span>
          <PriceRange level={priceRangeNum} />
        </div>

        {/* Cuisine + City info line */}
        <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          {cuisineName && (
            <>
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
                {cuisineName}
              </span>
              <span className="text-muted-foreground/30">·</span>
            </>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{displayCity}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
