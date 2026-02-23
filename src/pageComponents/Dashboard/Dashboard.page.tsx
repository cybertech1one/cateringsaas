"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "./molecules/Shell";
import { api } from "~/trpc/react";
import { OnboardingChecklist } from "~/components/OnboardingChecklist/OnboardingChecklist";
import { UpgradePrompt } from "~/components/UpgradePrompt/UpgradePrompt";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  CalendarDays,
  DollarSign,
  FileText,
  Users,
  Plus,
  CalendarCheck,
  Calculator,
  Calendar,
  UserCircle,
  Wrench,
  Wallet,
  ArrowUpRight,
  Clock,
  MapPin,
  ChefHat,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ──────────────────────────────────────────────
// Currency formatting for MAD (Moroccan Dirham)
// ──────────────────────────────────────────────

function formatMAD(centimes: number): string {
  return (
    new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 0 }).format(
      centimes / 100,
    ) + " MAD"
  );
}

function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// ──────────────────────────────────────────────
// Status color map
// ──────────────────────────────────────────────

const EVENT_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  inquiry: {
    bg: "bg-[hsl(var(--majorelle-blue))]/10 dark:bg-[hsl(var(--majorelle-blue))]/20",
    text: "text-[hsl(var(--majorelle-blue))] dark:text-[hsl(var(--majorelle-blue))]",
    label: "Inquiry",
  },
  reviewed: {
    bg: "bg-[hsl(var(--chefchaouen))]/10 dark:bg-[hsl(var(--chefchaouen))]/20",
    text: "text-[hsl(var(--chefchaouen))] dark:text-[hsl(var(--chefchaouen))]",
    label: "Reviewed",
  },
  quoted: {
    bg: "bg-[hsl(var(--saffron))]/10 dark:bg-[hsl(var(--saffron))]/20",
    text: "text-[hsl(var(--saffron))] dark:text-[hsl(var(--saffron))]",
    label: "Quoted",
  },
  accepted: {
    bg: "bg-sage/10 dark:bg-sage/20",
    text: "text-sage dark:text-sage",
    label: "Accepted",
  },
  declined: {
    bg: "bg-destructive/10 dark:bg-destructive/20",
    text: "text-destructive dark:text-destructive",
    label: "Declined",
  },
  deposit_paid: {
    bg: "bg-[hsl(var(--mint-tea))]/10 dark:bg-[hsl(var(--mint-tea))]/20",
    text: "text-[hsl(var(--mint-tea))] dark:text-[hsl(var(--mint-tea))]",
    label: "Deposit Paid",
  },
  confirmed: {
    bg: "bg-sage/15 dark:bg-sage/25",
    text: "text-sage dark:text-sage",
    label: "Confirmed",
  },
  prep: {
    bg: "bg-gold/10 dark:bg-gold/20",
    text: "text-gold dark:text-gold",
    label: "In Prep",
  },
  setup: {
    bg: "bg-[hsl(var(--harissa))]/10 dark:bg-[hsl(var(--harissa))]/20",
    text: "text-[hsl(var(--harissa))] dark:text-[hsl(var(--harissa))]",
    label: "Setup",
  },
  execution: {
    bg: "bg-primary/10 dark:bg-primary/20",
    text: "text-primary dark:text-primary",
    label: "Live",
  },
  completed: {
    bg: "bg-[hsl(var(--zellige-teal))]/10 dark:bg-[hsl(var(--zellige-teal))]/20",
    text: "text-[hsl(var(--zellige-teal))] dark:text-[hsl(var(--zellige-teal))]",
    label: "Completed",
  },
  settled: {
    bg: "bg-muted dark:bg-muted",
    text: "text-muted-foreground dark:text-muted-foreground",
    label: "Settled",
  },
  cancelled: {
    bg: "bg-destructive/10 dark:bg-destructive/20",
    text: "text-destructive dark:text-destructive",
    label: "Cancelled",
  },
};

const QUOTE_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: {
    bg: "bg-muted dark:bg-muted",
    text: "text-muted-foreground dark:text-muted-foreground",
    label: "Draft",
  },
  sent: {
    bg: "bg-[hsl(var(--majorelle-blue))]/10 dark:bg-[hsl(var(--majorelle-blue))]/20",
    text: "text-[hsl(var(--majorelle-blue))] dark:text-[hsl(var(--majorelle-blue))]",
    label: "Sent",
  },
  accepted: {
    bg: "bg-sage/10 dark:bg-sage/20",
    text: "text-sage dark:text-sage",
    label: "Accepted",
  },
  rejected: {
    bg: "bg-destructive/10 dark:bg-destructive/20",
    text: "text-destructive dark:text-destructive",
    label: "Rejected",
  },
  superseded: {
    bg: "bg-muted dark:bg-muted",
    text: "text-muted-foreground/60 dark:text-muted-foreground/60",
    label: "Superseded",
  },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Wedding",
  corporate: "Corporate",
  ramadan_iftar: "Iftar",
  eid: "Eid",
  birthday: "Birthday",
  conference: "Conference",
  funeral: "Funeral",
  engagement: "Engagement",
  henna: "Henna",
  graduation: "Graduation",
  diffa: "Diffa",
  other: "Other",
};

// ──────────────────────────────────────────────
// Main Dashboard Page
// ──────────────────────────────────────────────

export function DashboardPage() {
  // --- Data fetching ---
  const { data: org, isLoading: orgLoading } =
    api.organizations.getMine.useQuery();
  const { data: eventStats, isLoading: statsLoading } =
    api.events.getStats.useQuery({});
  const { data: revenueData, isLoading: revenueLoading } =
    api.finances.getRevenueOverview.useQuery({});
  const { data: eventsData, isLoading: eventsLoading } =
    api.events.list.useQuery({
      sortBy: "date",
      sortOrder: "asc",
      limit: 5,
    });
  const { data: quotesData, isLoading: quotesLoading } =
    api.quotes.listAll.useQuery({ limit: 5 });
  const { data: clientSegments, isLoading: clientsLoading } =
    api.clients.getSegments.useQuery({});
  const { data: menus, isLoading: menusLoading } =
    api.cateringMenus.list.useQuery({});

  const isLoading =
    orgLoading ||
    statsLoading ||
    revenueLoading ||
    eventsLoading ||
    quotesLoading ||
    clientsLoading ||
    menusLoading;

  // --- Derived data ---
  const orgName = org?.name ?? "";
  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Count events happening today
  const todayEvents = useMemo(() => {
    if (!eventsData?.events) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventsData.events.filter((e) => {
      const d = new Date(e.eventDate);
      return d >= today && d < tomorrow;
    }).length;
  }, [eventsData]);

  // Count pending quotes (draft + sent)
  const pendingQuotesCount = useMemo(() => {
    if (!quotesData?.quotes) return 0;
    return quotesData.quotes.filter(
      (q) => q.status === "draft" || q.status === "sent",
    ).length;
  }, [quotesData]);

  // Monthly revenue data for sparkline (last 6 months approximated from overview)
  const monthlyRevenueForSparkline = useMemo(() => {
    if (!revenueData) return [];
    // Build a simple 7-bar approximation from available data
    const current = revenueData.monthRevenue;
    const last = revenueData.lastMonthRevenue;
    // Synthetic weekly approximation: distribute monthly over ~4 weeks
    const weekCurrent = current / 4;
    const weekLast = last / 4;
    return [
      weekLast * 0.8,
      weekLast * 1.1,
      weekLast * 0.9,
      weekLast * 1.2,
      weekCurrent * 0.7,
      weekCurrent * 1.0,
      weekCurrent * 1.3,
    ];
  }, [revenueData]);

  const sparkMax = Math.max(...monthlyRevenueForSparkline, 1);

  // --- Loading state ---
  if (isLoading) {
    return (
      <div
        className="flex w-full flex-1 flex-col overflow-hidden"
        role="region"
        aria-label="Dashboard content"
      >
        <DashboardShell>
          <DashboardSkeleton />
        </DashboardShell>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-1 flex-col overflow-hidden"
      role="region"
      aria-label="Dashboard content"
    >
      <DashboardShell>
        {/* ━━━ 1. Welcome Banner ━━━ */}
        <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/12 via-gold/8 to-terracotta/10 p-6 md:p-8">
          {/* Decorative Moroccan-inspired geometric shapes */}
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
          <div
            className="absolute right-8 top-8 h-20 w-20 rotate-45 rounded-lg border border-primary/10 opacity-30"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-4 right-24 h-12 w-12 rotate-12 rounded-lg border border-gold/15 opacity-25"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {todayStr}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {orgName ? `Welcome back, ${orgName}` : "Welcome back"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {todayEvents > 0 ? (
                  <>
                    You have{" "}
                    <span className="font-semibold text-primary">
                      {todayEvents} event{todayEvents !== 1 ? "s" : ""}
                    </span>{" "}
                    scheduled today. Let&apos;s make them unforgettable.
                  </>
                ) : (
                  "Your catering command center. Everything you need at a glance."
                )}
              </p>
            </div>
            <Link href="/dashboard/events">
              <Button
                className="rounded-full px-6 shadow-sm"
                variant="default"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* ━━━ Onboarding (backward compat) ━━━ */}
        {menus && <OnboardingChecklist menus={menus as never} />}

        {/* ━━━ 2. KPI Cards Row ━━━ */}
        <div className="animate-fade-up grid grid-cols-2 gap-4 animate-delay-100 md:grid-cols-4">
          <KPICard
            icon={CalendarDays}
            label="Events This Month"
            value={eventStats?.thisMonthEvents ?? 0}
            detail={`${eventStats?.activeEvents ?? 0} active`}
            gradient="from-primary/15 to-primary/5"
            iconColor="text-primary"
          />
          <KPICard
            icon={DollarSign}
            label="Monthly Revenue"
            value={formatMAD(revenueData?.monthRevenue ?? 0)}
            detail={
              revenueData?.monthOverMonthGrowth !== undefined &&
              revenueData.monthOverMonthGrowth !== 0 ? (
                <span
                  className={`inline-flex items-center gap-0.5 ${revenueData.monthOverMonthGrowth > 0 ? "text-sage" : "text-destructive"}`}
                >
                  {revenueData.monthOverMonthGrowth > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(revenueData.monthOverMonthGrowth)}% vs last month
                </span>
              ) : (
                "vs last month"
              )
            }
            gradient="from-sage/15 to-sage/5"
            iconColor="text-sage"
          />
          <KPICard
            icon={FileText}
            label="Pending Quotes"
            value={pendingQuotesCount}
            detail={`${eventStats?.pendingInquiries ?? 0} new inquiries`}
            gradient="from-[hsl(var(--saffron))]/15 to-[hsl(var(--saffron))]/5"
            iconColor="text-[hsl(var(--saffron))]"
          />
          <KPICard
            icon={Users}
            label="Total Clients"
            value={clientSegments?.total ?? 0}
            detail={`${clientSegments?.vip ?? 0} VIP, ${clientSegments?.corporate ?? 0} corporate`}
            gradient="from-gold/15 to-gold/5"
            iconColor="text-gold"
          />
        </div>

        {/* ━━━ 3 & 4. Events + Quotes (two columns) ━━━ */}
        <div className="animate-fade-up grid gap-6 animate-delay-200 lg:grid-cols-2">
          {/* Upcoming Events */}
          <div className="flex flex-col rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4.5 w-4.5 text-primary" />
                <h2 className="font-display text-base font-semibold tracking-tight">
                  Upcoming Events
                </h2>
              </div>
              <Link
                href="/dashboard/events"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-1 flex-col divide-y divide-border/50">
              {eventsData?.events && eventsData.events.length > 0 ? (
                eventsData.events.map((event) => {
                  const statusStyle =
                    EVENT_STATUS_STYLES[event.status] ?? {
                      bg: "bg-muted dark:bg-muted",
                      text: "text-muted-foreground dark:text-muted-foreground",
                      label: event.status,
                    };
                  const typeLabel =
                    EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;

                  return (
                    <Link
                      key={event.id}
                      href="/dashboard/events"
                      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      {/* Date pill */}
                      <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary/8 text-center">
                        <span className="text-[10px] font-semibold uppercase leading-none text-primary">
                          {new Date(event.eventDate).toLocaleDateString(
                            "en-GB",
                            { month: "short" },
                          )}
                        </span>
                        <span className="text-lg font-bold leading-tight text-primary">
                          {new Date(event.eventDate).getDate()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {event.title}
                          </p>
                          <Badge
                            className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[10px] px-1.5 py-0`}
                            variant="outline"
                          >
                            {statusStyle.label}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {typeLabel}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.guestCount} guests
                          </span>
                          {event.venueName && (
                            <span className="hidden items-center gap-1 sm:inline-flex">
                              <MapPin className="h-3 w-3" />
                              {event.venueName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {Number(event.totalAmount) > 0
                            ? formatMAD(Number(event.totalAmount))
                            : "--"}
                        </p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No upcoming events
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Create your first event to get started
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Quotes */}
          <div className="flex flex-col rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-[hsl(var(--saffron))]" />
                <h2 className="font-display text-base font-semibold tracking-tight">
                  Recent Quotes
                </h2>
              </div>
              <Link
                href="/dashboard/quotes"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-1 flex-col divide-y divide-border/50">
              {quotesData?.quotes && quotesData.quotes.length > 0 ? (
                quotesData.quotes.map((quote) => {
                  const qStyle =
                    QUOTE_STATUS_STYLES[quote.status] ?? {
                      bg: "bg-muted dark:bg-muted",
                      text: "text-muted-foreground dark:text-muted-foreground",
                      label: quote.status,
                    };
                  return (
                    <Link
                      key={quote.id}
                      href="/dashboard/quotes"
                      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      {/* Version badge */}
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--saffron))]/10">
                        <span className="text-xs font-bold text-[hsl(var(--saffron))]">
                          v{quote.versionNumber}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {quote.event?.customerName ?? "Unknown Client"}
                          </p>
                          <Badge
                            className={`${qStyle.bg} ${qStyle.text} border-0 text-[10px] px-1.5 py-0`}
                            variant="outline"
                          >
                            {qStyle.label}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{quote.event?.title ?? "Event"}</span>
                          {quote.event?.eventDate && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatShortDate(quote.event.eventDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatMAD(Number(quote.totalAmount))}
                        </p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No quotes yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Create a quote for your next event
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ━━━ 5. Quick Actions Grid ━━━ */}
        <div className="animate-fade-up animate-delay-300">
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <QuickActionCard
              icon={CalendarCheck}
              title="Create Event"
              href="/dashboard/events"
              color="text-primary bg-primary/10"
            />
            <QuickActionCard
              icon={Calculator}
              title="New Quote"
              href="/dashboard/quotes"
              color="text-[hsl(var(--saffron))] bg-[hsl(var(--saffron))]/10"
            />
            <QuickActionCard
              icon={Calendar}
              title="Calendar"
              href="/dashboard/calendar"
              color="text-[hsl(var(--majorelle-blue))] bg-[hsl(var(--majorelle-blue))]/10"
            />
            <QuickActionCard
              icon={UserCircle}
              title="Clients"
              href="/dashboard/clients"
              color="text-gold bg-gold/10"
            />
            <QuickActionCard
              icon={Wrench}
              title="Equipment"
              href="/dashboard/equipment"
              color="text-[hsl(var(--zellige-teal))] bg-[hsl(var(--zellige-teal))]/10"
            />
            <QuickActionCard
              icon={Wallet}
              title="Finances"
              href="/dashboard/finances"
              color="text-sage bg-sage/10"
            />
          </div>
        </div>

        {/* ━━━ 6. Revenue Sparkline + Financial Summary ━━━ */}
        <div className="animate-fade-up animate-delay-400">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Revenue Sparkline */}
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Revenue Trend
                  </p>
                  <p className="text-xl font-bold tabular-nums tracking-tight">
                    {formatMAD(revenueData?.monthRevenue ?? 0)}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/10">
                  <TrendingUp className="h-4 w-4 text-sage" />
                </div>
              </div>

              {/* CSS-only sparkline bars */}
              <div
                className="flex items-end gap-1.5"
                style={{ height: 48 }}
                aria-label="Weekly revenue sparkline chart"
                role="img"
              >
                {monthlyRevenueForSparkline.map((val, i) => {
                  const heightPct = sparkMax > 0 ? (val / sparkMax) * 100 : 0;
                  const isLast =
                    i === monthlyRevenueForSparkline.length - 1;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all ${
                        isLast
                          ? "bg-primary"
                          : "bg-primary/25 dark:bg-primary/20"
                      }`}
                      style={{
                        height: `${Math.max(heightPct, 6)}%`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>Last month</span>
                <span>This month</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Financial Summary
                </p>
                <p className="text-xl font-bold tabular-nums tracking-tight">
                  {formatMAD(revenueData?.totalRevenue ?? 0)}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    YTD
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <FinancialRow
                  label="Outstanding"
                  amount={revenueData?.pendingAmount ?? 0}
                  color="text-gold"
                  dotColor="bg-gold"
                />
                <FinancialRow
                  label="Overdue"
                  amount={revenueData?.overdueAmount ?? 0}
                  color={
                    (revenueData?.overdueAmount ?? 0) > 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                  dotColor={
                    (revenueData?.overdueAmount ?? 0) > 0
                      ? "bg-destructive"
                      : "bg-muted-foreground/30"
                  }
                />
                <FinancialRow
                  label="Last Month"
                  amount={revenueData?.lastMonthRevenue ?? 0}
                  color="text-muted-foreground"
                  dotColor="bg-muted-foreground/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ Upgrade Prompt (backward compat) ━━━ */}
        <UpgradePrompt
          resource="Events"
          current={eventStats?.totalEvents ?? 0}
          limit={50}
        />
      </DashboardShell>
    </div>
  );
}

// ──────────────────────────────────────────────
// KPI Card
// ──────────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  value,
  detail,
  gradient,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  detail: React.ReactNode;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div
      className={`hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${gradient} p-4`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm ${iconColor}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
          {value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <div className="mt-1.5 text-[10px] text-muted-foreground/80">
          {detail}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Quick Action Card
// ──────────────────────────────────────────────

function QuickActionCard({
  icon: Icon,
  title,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div className="hover-lift group flex flex-col items-center gap-2.5 rounded-xl border border-border/50 bg-card p-4 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-card">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </span>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────────
// Financial Row
// ──────────────────────────────────────────────

function FinancialRow({
  label,
  amount,
  color,
  dotColor,
}: {
  label: string;
  amount: number;
  color: string;
  dotColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {formatMAD(amount)}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Loading Skeleton
// ──────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <>
      {/* Welcome Banner Skeleton */}
      <div className="rounded-2xl bg-muted/50 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-5"
          >
            <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="mb-1 h-3 w-24" />
            <Skeleton className="h-2 w-20" />
          </div>
        ))}
      </div>

      {/* Events + Quotes Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="divide-y divide-border/50">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-border/50 bg-card p-4"
            >
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-5"
          >
            <div className="mb-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 48 }}>
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="flex-1 rounded-sm"
                  style={{ height: `${30 + j * 10}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
