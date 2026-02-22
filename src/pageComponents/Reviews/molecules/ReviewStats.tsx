"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "~/components/ui/skeleton";
import { Star, MessageSquare, Clock, TrendingUp } from "lucide-react";
import { StarRating } from "./StarRating";

// ── Types ────────────────────────────────────────────────────

export interface ReviewStatsData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  recentTrend: {
    averageRating: number;
    reviewCount: number;
    periodDays: number;
  };
}

interface ReviewStatsProps {
  stats: ReviewStatsData;
}

// ── StatCard ─────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  gradient,
  iconColor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  iconColor: string;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${gradient} p-4`}>
      <div className="flex items-start justify-between">
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="mt-3">{children}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── StatsSkeletons ───────────────────────────────────────────

export function StatsSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/50 bg-card p-4"
        >
          <Skeleton className="h-5 w-5 rounded" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ReviewStatsCards ─────────────────────────────────────────

export function ReviewStatsCards({ stats }: ReviewStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Star className="h-5 w-5" />}
        label={t("reviews.averageRating")}
        gradient="from-yellow-500/15 to-yellow-500/5"
        iconColor="text-yellow-600"
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold tabular-nums tracking-tight">
            {stats.averageRating.toFixed(1)}
          </span>
          <StarRating rating={stats.averageRating} size="sm" />
        </div>
      </StatCard>
      <StatCard
        icon={<MessageSquare className="h-5 w-5" />}
        label={t("reviews.totalReviews")}
        gradient="from-blue-500/15 to-blue-500/5"
        iconColor="text-blue-600"
      >
        <span className="text-3xl font-bold tabular-nums tracking-tight">
          {stats.totalReviews}
        </span>
      </StatCard>
      <StatCard
        icon={<Clock className="h-5 w-5" />}
        label={t("reviews.pendingReviews")}
        gradient="from-orange-500/15 to-orange-500/5"
        iconColor="text-orange-600"
      >
        <span className="text-3xl font-bold tabular-nums tracking-tight">
          {stats.ratingDistribution && Object.keys(stats.ratingDistribution).length > 0
            ? "\u2014"
            : "0"}
        </span>
      </StatCard>
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        label={t("reviews.recentTrend")}
        gradient="from-emerald-500/15 to-emerald-500/5"
        iconColor="text-emerald-600"
      >
        <span className="text-3xl font-bold tabular-nums tracking-tight">
          {stats.recentTrend.averageRating > 0 ? "+" : ""}
          {stats.recentTrend.averageRating.toFixed(1)}%
        </span>
      </StatCard>
    </div>
  );
}

// ── RatingDistribution ───────────────────────────────────────

export function RatingDistribution({ stats }: ReviewStatsProps) {
  const { t } = useTranslation();

  if (!stats.ratingDistribution) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <Star className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <h3 className="font-display font-semibold">
            {t("reviews.ratingDistribution")}
          </h3>
        </div>
      </div>
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count =
            (stats.ratingDistribution as Record<number, number>)[star] ?? 0;
          const percentage =
            stats.totalReviews > 0
              ? (count / stats.totalReviews) * 100
              : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <span className="w-8 text-right text-sm font-semibold tabular-nums">
                {star}
              </span>
              <Star className="h-4 w-4 text-yellow-500" />
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-medium tabular-nums text-muted-foreground">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
