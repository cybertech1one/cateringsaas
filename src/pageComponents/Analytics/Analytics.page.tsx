"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  BarChart3,
  DollarSign,
  Filter,
  HeartPulse,
  QrCode,
} from "lucide-react";
import { cn } from "~/utils/cn";
import { EmptyState, DashboardSkeleton } from "./components";
import type { Period } from "./components";

// Lazy-load chart components - they are only rendered when a menu is selected
// and data has loaded, so splitting them reduces initial page JS significantly
const OverviewCards = dynamic(
  () => import("./components/OverviewCards").then((mod) => ({ default: mod.OverviewCards })),
);
const ViewsChart = dynamic(
  () => import("./components/ViewsChart").then((mod) => ({ default: mod.ViewsChart })),
);
const PopularDishesChart = dynamic(
  () => import("./components/PopularDishesChart").then((mod) => ({ default: mod.PopularDishesChart })),
);
const RevenueChart = dynamic(
  () => import("./components/RevenueChart").then((mod) => ({ default: mod.RevenueChart })),
);
const DeviceBreakdownCard = dynamic(
  () => import("./components/DeviceBreakdownCard").then((mod) => ({ default: mod.DeviceBreakdownCard })),
);
const PeakHoursChart = dynamic(
  () => import("./components/PeakHoursChart").then((mod) => ({ default: mod.PeakHoursChart })),
);
const TopReferrersCard = dynamic(
  () => import("./components/TopReferrersCard").then((mod) => ({ default: mod.TopReferrersCard })),
);
const RevenueSection = dynamic(
  () => import("./components/RevenueSection").then((mod) => ({ default: mod.RevenueSection })),
);
const SuccessKPIs = dynamic(
  () => import("./components/SuccessKPIs").then((mod) => ({ default: mod.SuccessKPIs })),
);

// ---------------------------------------------------------------------------
// Tabs & Period options
// ---------------------------------------------------------------------------

type TabValue = "traffic" | "revenue" | "health";

const PERIOD_OPTIONS = [
  { value: "today" as Period, labelKey: "analyticsPage.periods.today" as const },
  { value: "7d" as Period, labelKey: "analyticsPage.periods.7d" as const },
  { value: "30d" as Period, labelKey: "analyticsPage.periods.30d" as const },
  { value: "90d" as Period, labelKey: "analyticsPage.periods.90d" as const },
  { value: "all" as Period, labelKey: "analyticsPage.periods.all" as const },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AnalyticsPage() {
  const { t } = useTranslation();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("30d");
  const [activeTab, setActiveTab] = useState<TabValue>("traffic");

  const { data: menus, isLoading: menusLoading } =
    api.menus.getMenus.useQuery();

  const { data: dashboard, isLoading: dashboardLoading } =
    api.analytics.getDashboard.useQuery(
      { menuId: selectedMenuId, period },
      { enabled: !!selectedMenuId && activeTab === "traffic" },
    );

  const { data: funnel, isLoading: funnelLoading } =
    api.analytics.getConversionFunnel.useQuery(
      { menuId: selectedMenuId, period },
      { enabled: !!selectedMenuId && activeTab === "traffic" },
    );

  if (menusLoading) return <LoadingScreen />;

  const hasData =
    dashboard &&
    (dashboard.totalViews > 0 ||
      dashboard.uniqueVisitors > 0 ||
      dashboard.totalOrders > 0);

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Header with gradient icon badge */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sage shadow-sm">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("analyticsPage.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("analyticsPage.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Row in section card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Menu Selector */}
            <div className="min-w-[220px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("analyticsPage.selectMenu")}
              </label>
              <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                <SelectTrigger className="rounded-lg border-border/60 bg-background shadow-sm">
                  <SelectValue
                    placeholder={t("analyticsPage.selectMenuPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {menus?.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tab Switcher */}
            {selectedMenuId && (
              <div className="flex gap-1.5 rounded-lg bg-muted/30 p-1">
                <button
                  onClick={() => setActiveTab("traffic")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    activeTab === "traffic"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm",
                  )}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  {t("analyticsPage.title")}
                </button>
                <button
                  onClick={() => setActiveTab("revenue")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    activeTab === "revenue"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm",
                  )}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  {t("analytics.revenue.title")}
                </button>
                <button
                  onClick={() => setActiveTab("health")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    activeTab === "health"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm",
                  )}
                >
                  <HeartPulse className="h-3.5 w-3.5" />
                  {t("analytics.kpi.title")}
                </button>
              </div>
            )}

            {/* Period Selector */}
            {selectedMenuId && (
              <div className="flex gap-1.5 rounded-lg bg-muted/30 p-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                      period === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm",
                    )}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empty State - No menu selected */}
        {!selectedMenuId && menus && menus.length > 0 && (
          <EmptyState
            icon={<Filter className="h-12 w-12 text-muted-foreground/50" />}
            title={t("analyticsPage.empty.selectMenuTitle")}
            description={t("analyticsPage.empty.selectMenuDescription")}
          />
        )}

        {/* Empty State - No menus at all */}
        {!selectedMenuId && menus && menus.length === 0 && (
          <EmptyState
            icon={<BarChart3 className="h-12 w-12 text-muted-foreground/50" />}
            title={t("analyticsPage.empty.noMenusTitle")}
            description={t("analyticsPage.empty.noMenusDescription")}
          />
        )}

        {/* ============================================================= */}
        {/* TRAFFIC TAB                                                     */}
        {/* ============================================================= */}
        {selectedMenuId && activeTab === "traffic" && (
          <>
            {/* Loading State */}
            {dashboardLoading && <DashboardSkeleton />}

            {/* No Data State */}
            {!dashboardLoading && dashboard && !hasData && (
              <EmptyState
                icon={<QrCode className="h-12 w-12 text-muted-foreground/50" />}
                title={t("analyticsPage.empty.noDataTitle")}
                description={t("analyticsPage.empty.noDataDescription")}
              />
            )}

            {/* Dashboard Content */}
            {!dashboardLoading && dashboard && hasData && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <OverviewCards
                  totalViews={dashboard.totalViews}
                  uniqueVisitors={dashboard.uniqueVisitors}
                  totalOrders={dashboard.totalOrders}
                  conversionRate={dashboard.conversionRate}
                  labels={{
                    totalViews: t("analyticsPage.kpi.totalViews"),
                    uniqueVisitors: t("analyticsPage.kpi.uniqueVisitors"),
                    totalOrders: t("analyticsPage.kpi.totalOrders"),
                    conversionRate: t("analyticsPage.kpi.conversionRate"),
                  }}
                />

                {/* Views Over Time Chart */}
                <ViewsChart
                  data={dashboard.viewsByDay.map((d) => ({ ...d, date: d.date ?? "" }))}
                  title={t("analyticsPage.charts.viewsOverTime")}
                />

                {/* Two-column: Top Dishes + Device Breakdown */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <PopularDishesChart
                      data={dashboard.topDishes}
                      title={t("analyticsPage.tables.topDishes")}
                    />
                  </div>
                  <div>
                    <DeviceBreakdownCard
                      data={dashboard.deviceBreakdown}
                      title={t("analyticsPage.charts.deviceBreakdown")}
                    />
                  </div>
                </div>

                {/* Two-column: Peak Hours + Top Referrers */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <PeakHoursChart
                    data={dashboard.peakHours}
                    title={t("analyticsPage.charts.peakHours")}
                  />
                  <TopReferrersCard
                    data={dashboard.topReferrers}
                    title={t("analyticsPage.charts.topReferrers")}
                  />
                </div>

                {/* Conversion Funnel */}
                {!funnelLoading && funnel && (
                  <RevenueChart
                    data={{
                      views: funnel.steps[0]?.totalEvents ?? 0,
                      dishClicks: funnel.steps[1]?.totalEvents ?? 0,
                      orders: funnel.steps[2]?.totalEvents ?? 0,
                    }}
                    title={t("analyticsPage.charts.conversionFunnel")}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* ============================================================= */}
        {/* REVENUE TAB                                                     */}
        {/* ============================================================= */}
        {selectedMenuId && activeTab === "revenue" && (
          <RevenueSection menuId={selectedMenuId} period={period} />
        )}

        {/* ============================================================= */}
        {/* BUSINESS HEALTH TAB                                            */}
        {/* ============================================================= */}
        {selectedMenuId && activeTab === "health" && (
          <SuccessKPIs menuId={selectedMenuId} period={period} />
        )}
      </DashboardShell>
    </main>
  );
}
