"use client";

import { useTranslation } from "react-i18next";
import {
  Star,
  UtensilsCrossed,
  FolderOpen,
  Globe,
  Sparkles,
  ShoppingCart,
  MessageSquare,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";

// --- Types ---

export interface MenuStats {
  _count: {
    dishes: number;
    categories: number;
    menuLanguages: number;
    orders: number;
    reviews: number;
  };
  pricing: {
    average: number;
    min: number;
    max: number;
  };
  reviews: {
    averageRating: number;
    count: number;
  };
}

// --- StatsContent ---

interface StatsContentProps {
  isLoading: boolean;
  stats: MenuStats | undefined;
  formatPrice: (cents: number) => string;
}

export function StatsContent({
  isLoading,
  stats,
  formatPrice,
}: StatsContentProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <StatsLoadingSkeleton />;
  }

  if (!stats) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {t("toastCommon.errorDescription")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      <StatItem
        icon={UtensilsCrossed}
        label={t("menuManagement.dishCount")}
        value={stats._count.dishes.toString()}
      />
      <StatItem
        icon={FolderOpen}
        label={t("menuManagement.categoryCount")}
        value={stats._count.categories.toString()}
      />
      <StatItem
        icon={Globe}
        label={t("menuManagement.languageCount")}
        value={stats._count.menuLanguages.toString()}
      />
      <StatItem
        icon={Sparkles}
        label={t("menuManagement.averagePrice")}
        value={formatPrice(stats.pricing.average)}
        suffix={
          stats.pricing.min > 0 ? (
            <span className="mt-0.5 text-xs text-muted-foreground">
              {formatPrice(stats.pricing.min)} -{" "}
              {formatPrice(stats.pricing.max)}
            </span>
          ) : null
        }
      />
      <StatItem
        icon={ShoppingCart}
        label={t("menuManagement.orderCount")}
        value={stats._count.orders.toString()}
      />
      <StatItem
        icon={MessageSquare}
        label={t("menuManagement.reviewCount")}
        value={stats._count.reviews.toString()}
        suffix={
          stats.reviews.count > 0 ? (
            <Badge
              variant="secondary"
              className="mt-1 gap-1 px-1.5 py-0 text-xs"
            >
              <Star className="h-3 w-3 fill-current text-amber-500" />
              {stats.reviews.averageRating.toFixed(1)}
            </Badge>
          ) : null
        }
      />
    </div>
  );
}

// --- StatItem ---

function StatItem({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border/30 bg-background/50 p-3 text-center">
      <Icon className="mb-1.5 h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="mt-0.5 text-lg font-semibold tabular-nums">{value}</span>
      {suffix}
    </div>
  );
}

// --- StatsLoadingSkeleton ---

export function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center rounded-lg border border-border/30 bg-background/50 p-3"
        >
          <Skeleton className="mb-1.5 h-4 w-4 rounded-full" />
          <Skeleton className="mb-1 h-3 w-16" />
          <Skeleton className="h-6 w-10" />
        </div>
      ))}
    </div>
  );
}
