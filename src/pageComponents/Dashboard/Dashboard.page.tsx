"use client";

import { MenuItem } from "./molecules/MenuItem";
import { DashboardShell } from "./molecules/Shell";
import { api } from "~/trpc/react";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useTranslation } from "react-i18next";
import { OnboardingChecklist } from "~/components/OnboardingChecklist/OnboardingChecklist";
import { UpgradePrompt } from "~/components/UpgradePrompt/UpgradePrompt";
import {
  Plus,
  Building2,
  BarChart3,
  Star,
  Megaphone,
  Users,
  ClipboardList,
  MapPin,
  TrendingUp,
  MenuSquare,
  QrCode,
  ArrowUpRight,
  Lightbulb,
  ChefHat,
  Sparkles,
} from "lucide-react";

function useQuickLinks() {
  const { t } = useTranslation();

  return [
    {
      title: t("dashboardSidenav.restaurants"),
      desc: t("dashboard.quickLinks.restaurantsDesc"),
      href: "/dashboard/restaurants",
      icon: Building2,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: t("dashboardSidenav.analytics"),
      desc: t("dashboard.quickLinks.analyticsDesc"),
      href: "/dashboard/analytics",
      icon: BarChart3,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: t("dashboardSidenav.reviews"),
      desc: t("dashboard.quickLinks.reviewsDesc"),
      href: "/dashboard/reviews",
      icon: Star,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: t("dashboardSidenav.promotions"),
      desc: t("dashboard.quickLinks.promotionsDesc"),
      href: "/dashboard/promotions",
      icon: Megaphone,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: t("dashboardSidenav.staff"),
      desc: t("dashboard.quickLinks.staffDesc"),
      href: "/dashboard/staff",
      icon: Users,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30",
    },
    {
      title: t("dashboardSidenav.orders"),
      desc: t("dashboard.quickLinks.ordersDesc"),
      href: "/dashboard/orders",
      icon: ClipboardList,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
    },
  ];
}

export function DashboardPage() {
  const { data: menus, isLoading: menusLoading } = api.cateringMenus.list.useQuery({});
  const { data: org, isLoading: orgLoading } = api.organizations.getMine.useQuery();
  const { data: revenueData, isLoading: revenueLoading } = api.finances.getRevenueOverview.useQuery({});
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const quickLinks = useQuickLinks();

  const isLoading = menusLoading || orgLoading || revenueLoading;

  if (isLoading) {
    return (
      <div className="flex w-full flex-1 flex-col overflow-hidden" role="region" aria-label="Dashboard content">
        <DashboardShell>
          {/* Welcome Banner Skeleton */}
          <div className="rounded-2xl bg-muted/50 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="h-4 w-32 rounded-full bg-muted animate-pulse" />
                <div className="h-7 w-56 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-44 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="h-10 w-36 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card p-5">
                <div className="h-8 w-8 rounded-lg bg-muted animate-pulse mb-3" />
                <div className="h-3 w-20 rounded-full bg-muted animate-pulse mb-2" />
                <div className="h-6 w-12 rounded-full bg-muted animate-pulse" />
              </div>
            ))}
          </div>
          {/* Quick Links Skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-36 rounded-full bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardShell>
      </div>
    );
  }

  const menuCount = menus?.length ?? 0;
  const publishedCount = menus?.filter((m: { isPublished: boolean }) => m.isPublished).length ?? 0;
  const activeMenuCount = menus?.filter((m: { isActive: boolean }) => m.isActive).length ?? 0;
  const orgName = org?.name ?? "";
  const hasMenus = menuCount > 0;

  return (
    <div
      className="flex w-full flex-1 flex-col overflow-hidden"
      role="region"
      aria-label="Dashboard content"
    >
      <DashboardShell>
        {/* Welcome Banner */}
        <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-gold/10 p-6 md:p-8">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gold/10 blur-xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {hasMenus
                    ? t("dashboard.welcomeBack")
                    : t("dashboard.welcome")}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("dashboard.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.welcomeSubtitle")}
              </p>
            </div>
            <Link href="/menu/create">
              <Button className="rounded-full px-6 shadow-sm" variant="default">
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.createMenu")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Onboarding Checklist */}
        {menus && (
          <OnboardingChecklist menus={menus as never} />
        )}

        {/* Quick Stats */}
        <div className="animate-fade-up grid grid-cols-2 gap-4 animate-delay-100 md:grid-cols-4">
          <StatCard
            icon={MenuSquare}
            label={t("dashboard.stats.totalMenus")}
            value={menuCount}
            trend={t("dashboard.statsTrend.active")}
            gradient="from-primary/15 to-primary/5"
            iconColor="text-primary"
          />
          <StatCard
            icon={TrendingUp}
            label={t("dashboard.stats.published")}
            value={publishedCount}
            trend={t("dashboard.statsTrend.live")}
            gradient="from-emerald-500/15 to-emerald-500/5"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={MapPin}
            label={t("dashboard.stats.activeMenus")}
            value={activeMenuCount}
            trend={t("dashboard.statsTrend.tracked")}
            gradient="from-blue-500/15 to-blue-500/5"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={Building2}
            label={t("dashboard.stats.organization")}
            value={orgName ? 1 : 0}
            trend={t("dashboard.statsTrend.managed")}
            gradient="from-amber-500/15 to-amber-500/5"
            iconColor="text-amber-500"
          />
        </div>

        {/* Quick Actions Row */}
        <div className="animate-fade-up animate-delay-200">
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
            <QuickActionCard
              icon={Plus}
              title={t("dashboard.quickActions.createMenu")}
              description={t("dashboard.quickActions.createMenuDesc")}
              href="/menu/create"
              gradient="from-primary to-terracotta"
            />
            <QuickActionCard
              icon={BarChart3}
              title={t("dashboard.quickActions.viewAnalytics")}
              description={t("dashboard.quickActions.viewAnalyticsDesc")}
              href="/dashboard/analytics"
              gradient="from-emerald-500 to-sage"
            />
            <QuickActionCard
              icon={QrCode}
              title={t("dashboard.quickActions.scanQr")}
              description={t("dashboard.quickActions.scanQrDesc")}
              href={
                menus?.[0]?.slug
                  ? `/menu/manage/${menus[0].slug}/qr-menu`
                  : "/menu/create"
              }
              gradient="from-blue-500 to-indigo-500"
            />
          </div>
        </div>

        {/* Pro Tip */}
        {hasMenus && (
          <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/5 p-4 animate-delay-200">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gold/15">
              <Lightbulb className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gold">
                {t("dashboard.tipLabel")}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("dashboard.tip")}
              </p>
            </div>
          </div>
        )}

        {/* Quick Links Grid */}
        <div className="animate-fade-up animate-delay-300">
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">
            {t("dashboard.quickAccess")}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="hover-lift group flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-card">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.color}`}
                  >
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {link.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Menus Section */}
        <div className="animate-fade-up animate-delay-400">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {t("dashboard.yourMenus")}
            </h2>
            <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
              {menuCount === 1
                ? t("dashboard.menuCount", { count: menuCount })
                : t("dashboard.menuCountPlural", { count: menuCount })}
            </span>
          </div>
          {hasMenus ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menus
                ?.sort(
                  (a: { createdAt: Date }, b: { createdAt: Date }) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )
                .map((menu: { id: string; [key: string]: unknown }) => (
                  <MenuItem key={menu.id} menu={menu as never} />
                ))}
            </div>
          ) : (
            <EmptyStateWizard />
          )}
        </div>
      </DashboardShell>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                         */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  gradient,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  trend: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div
      className={`hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${gradient} p-4`}
    >
      <div className="flex items-start justify-between">
        <div className={iconColor}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
          <ArrowUpRight className="h-3 w-3" />
          {trend}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Action Card                                                 */
/* ------------------------------------------------------------------ */

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link href={href} className="flex-shrink-0">
      <div className="hover-lift group flex w-44 flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-card md:w-52">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State Wizard                                                */
/* ------------------------------------------------------------------ */

function EmptyStateWizard() {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      title: t("dashboard.emptyState.step1"),
      icon: Building2,
    },
    {
      number: 2,
      title: t("dashboard.emptyState.step2"),
      icon: MenuSquare,
    },
    {
      number: 3,
      title: t("dashboard.emptyState.step3"),
      icon: Sparkles,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-gradient-to-br from-primary/5 via-transparent to-gold/5 p-8 text-center md:p-12">
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-gold/5 blur-2xl" />

      <div className="relative mx-auto max-w-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-terracotta shadow-glow">
          <ChefHat className="h-8 w-8 text-white" />
        </div>

        <h3 className="font-display text-xl font-bold tracking-tight md:text-2xl">
          {t("dashboard.emptyState.title")}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {t("dashboard.emptyState.description")}
        </p>

        {/* Steps */}
        <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-left sm:flex-row sm:gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-1 items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 backdrop-blur-sm"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xs font-bold text-primary">
                  {step.number}
                </span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/menu/create">
            <Button className="rounded-full px-8 shadow-glow" variant="default">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.createMenu")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
