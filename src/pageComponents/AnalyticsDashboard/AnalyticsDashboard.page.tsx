"use client";

import { useState, useMemo } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  Activity,
  Briefcase,
} from "lucide-react";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";
import { Skeleton } from "~/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS = [
  { value: "this_month", label: "Ce mois" },
  { value: "last_3_months", label: "3 derniers mois" },
  { value: "last_6_months", label: "6 derniers mois" },
  { value: "last_year", label: "Derni\u00e8re ann\u00e9e" },
] as const;

type Period = (typeof PERIOD_OPTIONS)[number]["value"];

const EVENT_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  wedding: { color: "text-[hsl(var(--rose-petal))]", bg: "bg-[hsl(var(--rose-petal))]/15" },
  corporate: { color: "text-[hsl(var(--majorelle-blue))]", bg: "bg-[hsl(var(--majorelle-blue))]/15" },
  ramadan_iftar: { color: "text-[hsl(var(--mint-tea))]", bg: "bg-[hsl(var(--mint-tea))]/15" },
  eid: { color: "text-gold", bg: "bg-gold/15" },
  birthday: { color: "text-primary", bg: "bg-primary/15" },
  conference: { color: "text-[hsl(var(--zellige-teal))]", bg: "bg-[hsl(var(--zellige-teal))]/15" },
  funeral: { color: "text-muted-foreground", bg: "bg-muted" },
  engagement: { color: "text-[hsl(var(--rose-petal))]", bg: "bg-[hsl(var(--rose-petal))]/10" },
  henna: { color: "text-[hsl(var(--saffron))]", bg: "bg-[hsl(var(--saffron))]/15" },
  graduation: { color: "text-[hsl(var(--chefchaouen))]", bg: "bg-[hsl(var(--chefchaouen))]/15" },
  diffa: { color: "text-terracotta", bg: "bg-terracotta/15" },
  other: { color: "text-muted-foreground", bg: "bg-muted" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Mariage",
  corporate: "Corporate",
  ramadan_iftar: "Iftar Ramadan",
  eid: "A\u00efd",
  birthday: "Anniversaire",
  conference: "Conf\u00e9rence",
  funeral: "Fun\u00e9railles",
  engagement: "Fian\u00e7ailles",
  henna: "Henn\u00e9",
  graduation: "Remise de dipl\u00f4mes",
  diffa: "Diffa",
  other: "Autre",
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  referral: "Parrainage",
  website: "Site Web",
  marketplace: "Marketplace",
  other: "Autre",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(centimes: number | null | undefined): string {
  if (centimes == null) return "0 MAD";
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centimes / 100) + " MAD";
}

function formatCompactCurrency(centimes: number): string {
  const value = centimes / 100;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M MAD`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K MAD`;
  return `${value.toFixed(0)} MAD`;
}

function getDateRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  let from: Date;

  switch (period) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_3_months":
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case "last_6_months":
      from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case "last_year":
      from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { from, to };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Trend arrow indicator */
function TrendArrow({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">-</span>;
  const isUp = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isUp ? "text-sage" : "text-destructive"
      )}
    >
      {isUp ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {isUp ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

function KPICards({
  revenue,
  eventsCompleted,
  avgEventValue,
  revenueGrowth,
}: {
  revenue: number;
  eventsCompleted: number;
  avgEventValue: number;
  revenueGrowth: number;
}) {
  const items = [
    {
      label: "Chiffre d'Affaires",
      value: formatCurrency(revenue),
      icon: DollarSign,
      color: "text-gold",
      bg: "bg-gold/10",
      trend: revenueGrowth,
    },
    {
      label: "\u00c9v\u00e9nements R\u00e9alis\u00e9s",
      value: eventsCompleted,
      icon: CheckCircle2,
      color: "text-sage",
      bg: "bg-sage/10",
      trend: null,
    },
    {
      label: "Valeur Moyenne",
      value: formatCurrency(avgEventValue),
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: null,
    },
    {
      label: "Croissance",
      value: `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}%`,
      icon: revenueGrowth >= 0 ? TrendingUp : TrendingDown,
      color: revenueGrowth >= 0 ? "text-sage" : "text-destructive",
      bg: revenueGrowth >= 0 ? "bg-sage/10" : "bg-destructive/10",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", item.bg)}>
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              {item.trend !== null && <TrendArrow value={item.trend} />}
            </div>
            <p className="text-xl font-bold leading-none">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Bar Chart (CSS-based)
// ---------------------------------------------------------------------------

function RevenueChart({
  data,
}: {
  data: Array<{ month: string; revenue: number; events: number }>;
}) {
  const maxRevenue = useMemo(() => {
    return Math.max(...data.map((d) => d.revenue), 1);
  }, [data]);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Tendance du Chiffre d&apos;Affaires (12 mois)
        </h3>

        {/* Chart area */}
        <div className="flex items-end gap-1.5 h-40">
          {data.map((item) => {
            const heightPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            const monthLabel = new Date(item.month + "-01").toLocaleDateString("fr-MA", {
              month: "short",
            });

            return (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap">
                    <p className="font-semibold">{formatCompactCurrency(item.revenue)}</p>
                    <p className="text-muted-foreground">{item.events} \u00e9v\u00e9nements</p>
                  </div>
                </div>

                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-t transition-all duration-300 cursor-pointer",
                    "bg-gradient-to-t from-primary/80 to-primary/40",
                    "hover:from-primary hover:to-primary/60",
                    heightPct < 5 && "min-h-[4px]"
                  )}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />

                {/* Month label */}
                <span className="text-[9px] text-muted-foreground mt-1.5 truncate w-full text-center">
                  {monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Event Type Breakdown (visual badges)
// ---------------------------------------------------------------------------

function EventTypeBreakdown({
  data,
}: {
  data: Array<{ eventType: string; revenue: number; eventCount: number; avgGuestCount: number }>;
}) {
  const totalRevenue = useMemo(() => data.reduce((sum, d) => sum + d.revenue, 0), [data]);
  const sorted = useMemo(() => [...data].sort((a, b) => b.revenue - a.revenue), [data]);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-terracotta" />
          R\u00e9partition par Type
        </h3>

        {sorted.length === 0 ? (
          <div className="text-center py-6">
            <PieChart className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">Aucune donn\u00e9e disponible.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((item) => {
              const pct = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
              const fallback = { color: "text-muted-foreground", bg: "bg-muted" };
              const colors = EVENT_TYPE_COLORS[item.eventType] ?? fallback ?? { bg: "bg-muted/15", color: "text-muted-foreground" };
              const label = EVENT_TYPE_LABELS[item.eventType] ?? item.eventType;

              return (
                <div key={item.eventType} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px] font-medium border", colors.bg, colors.color)}>
                        {label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {item.eventCount} \u00e9v\u00e9nement{item.eventCount > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold">{formatCurrency(item.revenue)}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">({pct}%)</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", colors.bg.replace("/15", ""))}
                      style={{ width: `${pct}%`, backgroundColor: "currentColor" }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>Moy. {item.avgGuestCount} invit\u00e9s</span>
                    <span>Moy. {formatCurrency(item.eventCount > 0 ? Math.round(item.revenue / item.eventCount) : 0)} / \u00e9vt</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Booking Funnel
// ---------------------------------------------------------------------------

function BookingFunnel({
  data,
}: {
  data: {
    inquiries: number;
    quoted: number;
    accepted: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    conversionRate: number;
    quoteToBookRate: number;
  };
}) {
  const stages = [
    { label: "Demandes", value: data.inquiries, color: "bg-[hsl(var(--majorelle-blue))]" },
    { label: "Devis envoy\u00e9s", value: data.quoted, color: "bg-gold" },
    { label: "Accept\u00e9s", value: data.accepted, color: "bg-[hsl(var(--saffron))]" },
    { label: "Confirm\u00e9s", value: data.confirmed, color: "bg-terracotta" },
    { label: "R\u00e9alis\u00e9s", value: data.completed, color: "bg-sage" },
  ];

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[hsl(var(--majorelle-blue))]" />
          Entonnoir de Conversion
        </h3>

        <div className="space-y-2.5">
          {stages.map((stage) => {
            const widthPct = maxValue > 0 ? Math.max((stage.value / maxValue) * 100, 8) : 8;
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-24 text-right shrink-0">
                  {stage.label}
                </span>
                <div className="flex-1 h-6 flex items-center">
                  <div
                    className={cn("h-full rounded-md flex items-center px-2 transition-all", stage.color)}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{stage.value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversion rates */}
        <div className="flex gap-4 mt-4 pt-3 border-t">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-primary">{data.conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Taux de conversion</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-gold">{data.quoteToBookRate}%</p>
            <p className="text-[10px] text-muted-foreground">Devis &#8594; R\u00e9servation</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-destructive">{data.cancelled}</p>
            <p className="text-[10px] text-muted-foreground">Annulations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Client Sources
// ---------------------------------------------------------------------------

function ClientSources({
  data,
}: {
  data: Array<{ source: string; eventCount: number; revenue: number }>;
}) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.eventCount - a.eventCount), [data]);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.eventCount, 0), [data]);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-[hsl(var(--zellige-teal))]" />
          Sources de Clients
        </h3>

        {sorted.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">Aucune donn\u00e9e de source disponible.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((item) => {
              const pct = total > 0 ? Math.round((item.eventCount / total) * 100) : 0;
              return (
                <div
                  key={item.source}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium">
                      {SOURCE_LABELS[item.source] ?? item.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-[10px] text-muted-foreground">
                      {item.eventCount} ({pct}%)
                    </span>
                    <span className="text-xs font-semibold w-24">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Overview
// ---------------------------------------------------------------------------

function PipelineOverview({
  data,
}: {
  data: {
    thisWeek: number;
    thisMonth: number;
    next3Months: number;
    pendingQuotes: number;
    overduePayments: number;
  };
}) {
  const items = [
    { label: "Cette semaine", value: data.thisWeek, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
    { label: "Ce mois", value: data.thisMonth, icon: CalendarDays, color: "text-gold", bg: "bg-gold/10" },
    { label: "3 prochains mois", value: data.next3Months, icon: CalendarDays, color: "text-sage", bg: "bg-sage/10" },
    {
      label: "Devis en attente",
      value: data.pendingQuotes,
      icon: data.pendingQuotes > 0 ? AlertTriangle : CheckCircle2,
      color: data.pendingQuotes > 0 ? "text-[hsl(var(--saffron))]" : "text-sage",
      bg: data.pendingQuotes > 0 ? "bg-[hsl(var(--saffron))]/10" : "bg-sage/10",
    },
    {
      label: "Paiements en retard",
      value: data.overduePayments,
      icon: data.overduePayments > 0 ? AlertTriangle : CheckCircle2,
      color: data.overduePayments > 0 ? "text-destructive" : "text-sage",
      bg: data.overduePayments > 0 ? "bg-destructive/10" : "bg-sage/10",
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-gold" />
          Pipeline &amp; Prochains \u00c9v\u00e9nements
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-2.5">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", item.bg)}>
                  <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <span className="text-sm font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-52 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>("this_month");
  const [activeTab, setActiveTab] = useState("overview");

  const dateRange = useMemo(() => getDateRange(period), [period]);

  // ── Queries ──────────────────────────────────────────────────────────
  const { data: overview, isLoading: loadingOverview } = api.orgAnalytics.getRevenueOverview.useQuery({});
  const { data: monthlyTrend, isLoading: loadingTrend } = api.orgAnalytics.getMonthlyTrend.useQuery({});

  const { data: byEventType } = api.orgAnalytics.getRevenueByEventType.useQuery({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const { data: bookingFunnel } = api.orgAnalytics.getBookingFunnel.useQuery({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const { data: clientSources } = api.orgAnalytics.getClientSources.useQuery({});
  const { data: pipeline } = api.orgAnalytics.getUpcomingPipeline.useQuery({});
  const { data: dashboardSummary } = api.orgAnalytics.getDashboardSummary.useQuery({});

  // ── Derived data ─────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    if (!overview) return { revenue: 0, events: 0, avg: 0, growth: 0 };
    const avgValue = overview.currentMonthEvents > 0
      ? Math.round(overview.currentMonthRevenue / overview.currentMonthEvents)
      : 0;
    return {
      revenue: overview.currentMonthRevenue,
      events: overview.currentMonthEvents,
      avg: avgValue,
      growth: overview.revenueGrowth,
    };
  }, [overview]);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loadingOverview && loadingTrend) return <AnalyticsSkeleton />;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        title="Analytiques"
        description="Suivez vos performances, analysez vos revenus et optimisez votre activit\u00e9."
        icon={<BarChart3 className="h-6 w-6" />}
        actions={
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* KPI Cards */}
      <KPICards
        revenue={kpiData.revenue}
        eventsCompleted={kpiData.events}
        avgEventValue={kpiData.avg}
        revenueGrowth={kpiData.growth}
      />

      {/* Dashboard summary banner */}
      {dashboardSummary && (
        <Card className="border shadow-sm bg-gradient-to-r from-sand/50 via-card to-sand/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold">{formatCompactCurrency(dashboardSummary.monthRevenue)}</p>
                <p className="text-[10px] text-muted-foreground">Revenu du mois</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{dashboardSummary.activeEvents}</p>
                <p className="text-[10px] text-muted-foreground">\u00c9v\u00e9nements actifs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{dashboardSummary.totalClients}</p>
                <p className="text-[10px] text-muted-foreground">Total clients</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {dashboardSummary.avgRating > 0 ? dashboardSummary.avgRating.toFixed(1) : "-"}
                </p>
                <p className="text-[10px] text-muted-foreground">Note moyenne</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[hsl(var(--saffron))]">
                  {dashboardSummary.pendingInquiries}
                </p>
                <p className="text-[10px] text-muted-foreground">Demandes en attente</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">
                  {dashboardSummary.unreadMessages}
                </p>
                <p className="text-[10px] text-muted-foreground">Messages non lus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="funnel" className="text-xs">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Conversion
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs">
            <Briefcase className="h-3.5 w-3.5 mr-1" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Revenue chart */}
          {monthlyTrend && <RevenueChart data={monthlyTrend} />}

          {/* Two-column layout: event type + sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {byEventType && <EventTypeBreakdown data={byEventType} />}
            {clientSources && <ClientSources data={clientSources} />}
          </div>

          {/* All-time summary */}
          {overview && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-sage" />
                  R\u00e9sum\u00e9 Global
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">CA Total</p>
                    <p className="text-lg font-bold">{formatCurrency(overview.totalAllTimeRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total \u00c9v\u00e9nements</p>
                    <p className="text-lg font-bold">{overview.totalAllTimeEvents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ce Mois</p>
                    <p className="text-lg font-bold">{formatCurrency(overview.currentMonthRevenue)}</p>
                    <TrendArrow value={overview.revenueGrowth} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mois Pr\u00e9c\u00e9dent</p>
                    <p className="text-lg font-bold">{formatCurrency(overview.previousMonthRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Funnel Tab ── */}
        <TabsContent value="funnel" className="space-y-4 mt-4">
          {bookingFunnel ? (
            <BookingFunnel data={bookingFunnel} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Activity className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Chargement des donn\u00e9es de conversion...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tips card */}
          <Card className="border border-gold/20 bg-gold/5 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2 text-gold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conseils pour Am\u00e9liorer le Taux de Conversion
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>R\u00e9pondez aux demandes dans les 2 heures pour un taux de conversion 3x plus \u00e9lev\u00e9</li>
                <li>Incluez des photos de r\u00e9alisations pass\u00e9es dans vos devis</li>
                <li>Proposez des forfaits d\u00e9gustation pour les mariages et grands \u00e9v\u00e9nements</li>
                <li>Relancez les devis en attente apr\u00e8s 48 heures</li>
                <li>Offrez une remise early-bird pour les r\u00e9servations anticip\u00e9es</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pipeline Tab ── */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          {pipeline ? (
            <PipelineOverview data={pipeline} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Chargement du pipeline...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
