"use client";

import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { RevenueOverviewCards } from "./RevenueOverviewCards";
import { RevenueByDayChart } from "./RevenueByDayChart";
import { RevenueByOrderTypeCard } from "./RevenueByOrderTypeCard";
import { TopSellingDishesTable } from "./TopSellingDishesTable";
import { PeakHoursChart } from "./PeakHoursChart";
import type { Period } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueSectionProps {
  menuId: string;
  period: Period;
}

// ---------------------------------------------------------------------------
// Revenue Section Skeleton
// ---------------------------------------------------------------------------

function RevenueSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border/50 bg-muted/30" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="h-64 rounded-2xl border border-border/50 bg-muted/30" />
      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-48 rounded-2xl border border-border/50 bg-muted/30" />
        <div className="h-48 rounded-2xl border border-border/50 bg-muted/30" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Section
// ---------------------------------------------------------------------------

export function RevenueSection({ menuId, period }: RevenueSectionProps) {
  const { t } = useTranslation();

  const { data: overview, isLoading: overviewLoading } =
    api.analytics.getRevenueOverview.useQuery(
      { menuId, period },
      { enabled: !!menuId },
    );

  const { data: byDay, isLoading: byDayLoading } =
    api.analytics.getRevenueByDay.useQuery(
      { menuId, period },
      { enabled: !!menuId },
    );

  const { data: byOrderType, isLoading: byOrderTypeLoading } =
    api.analytics.getRevenueByOrderType.useQuery(
      { menuId, period },
      { enabled: !!menuId },
    );

  const { data: topDishes, isLoading: topDishesLoading } =
    api.analytics.getTopSellingDishes.useQuery(
      { menuId, period, limit: 10 },
      { enabled: !!menuId },
    );

  const { data: peakHours, isLoading: peakHoursLoading } =
    api.analytics.getPeakRevenueHours.useQuery(
      { menuId, period },
      { enabled: !!menuId },
    );

  const isLoading = overviewLoading || byDayLoading || byOrderTypeLoading || topDishesLoading || peakHoursLoading;

  if (isLoading) {
    return <RevenueSkeleton />;
  }

  const hasData = overview && overview.orderCount > 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t("analytics.revenue.noData")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue KPI Cards */}
      <RevenueOverviewCards
        totalRevenue={overview.totalRevenue}
        avgOrderValue={overview.avgOrderValue}
        orderCount={overview.orderCount}
        revenueChange={overview.revenueChange}
        labels={{
          totalRevenue: t("analytics.revenue.totalRevenue"),
          avgOrderValue: t("analytics.revenue.avgOrderValue"),
          orderCount: t("analytics.revenue.orderCount"),
          revenueChange: t("analytics.revenue.revenueChange"),
        }}
      />

      {/* Revenue by Day Chart */}
      {byDay && byDay.length > 0 && (
        <RevenueByDayChart
          data={byDay}
          title={t("analytics.revenue.byDay")}
        />
      )}

      {/* Two-column: Order Type Breakdown + Top Selling Dishes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {byOrderType && (
          <RevenueByOrderTypeCard
            data={byOrderType}
            title={t("analytics.revenue.byOrderType")}
          />
        )}
        {topDishes && (
          <TopSellingDishesTable
            data={topDishes}
            title={t("analytics.revenue.topDishes")}
          />
        )}
      </div>

      {/* Peak Revenue Hours */}
      {peakHours && peakHours.length > 0 && (
        <PeakHoursChart
          data={peakHours.map((h) => ({ hour: h.hour, count: h.orderCount }))}
          title={t("analytics.revenue.peakHours")}
        />
      )}
    </div>
  );
}
