"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  MessageSquare,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

// ── Types ────────────────────────────────────────────────────

export interface ReputationData {
  totalReviews: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
  googleRedirects: number;
  responseRate: number;
}

interface ReputationOverviewProps {
  data: ReputationData;
}

// ── Skeleton ─────────────────────────────────────────────────

export function ReputationOverviewSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-4">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Mini Card ───────────────────────────────────────────

function StatMiniCard({
  icon,
  value,
  label,
  gradient,
  iconColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${gradient} p-4`}
    >
      <div className={iconColor}>{icon}</div>
      <div className="mt-3">
        <span className="text-2xl font-bold tabular-nums tracking-tight">
          {value}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Star Display ─────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, rating - (star - 1)));

        return (
          <div key={star} className="relative h-4 w-4">
            <Star className="absolute h-4 w-4 text-muted-foreground/30" />
            <div
              className="absolute overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export function ReputationOverview({ data }: ReputationOverviewProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/10">
          <Star className="h-4 w-4 text-emerald-600" />
        </div>
        <h2 className="font-display text-lg font-semibold">
          {t("reputation.title")}
        </h2>
      </div>

      {/* Stat Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          icon={<MessageSquare className="h-4 w-4" />}
          value={data.totalReviews}
          label={t("reputation.totalReviews")}
          gradient="from-blue-500/15 to-blue-500/5"
          iconColor="text-blue-600"
        />
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 p-4">
          <div className="text-yellow-600">
            <Star className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {data.avgRating.toFixed(1)}
            </span>
            <StarDisplay rating={data.avgRating} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("reputation.avgRating")}
          </p>
        </div>
        <StatMiniCard
          icon={<ExternalLink className="h-4 w-4" />}
          value={data.googleRedirects}
          label={t("reputation.googleRedirects")}
          gradient="from-emerald-500/15 to-emerald-500/5"
          iconColor="text-emerald-600"
        />
        <StatMiniCard
          icon={<MessageCircle className="h-4 w-4" />}
          value={`${data.responseRate}%`}
          label={t("reputation.responseRate")}
          gradient="from-purple-500/15 to-purple-500/5"
          iconColor="text-purple-600"
        />
      </div>

      {/* Rating Distribution */}
      <div className="mt-5">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {t("reputation.ratingDistribution")}
        </h3>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = data.ratingDistribution[star] ?? 0;
            const percentage =
              data.totalReviews > 0
                ? (count / data.totalReviews) * 100
                : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-6 text-right text-sm font-semibold tabular-nums">
                  {star}
                </span>
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
