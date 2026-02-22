"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import {
  Truck,
  Wallet,
  Clock,
  CheckCircle2,
  MapPin,
  Star,
  TrendingUp,
  AlertCircle,
  Banknote,
  Power,
  PowerOff,
} from "lucide-react";

type EarningPeriod = "today" | "week" | "month";

function formatCentimes(centimes: number): string {
  return `${(centimes / 100).toFixed(2)} MAD`;
}

export function DriverDashboardPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const ctx = api.useContext();
  const [earningsPeriod, setEarningsPeriod] = useState<EarningPeriod>("today");

  // Queries
  const profileQuery = api.drivers.getProfile.useQuery(undefined, {
    retry: false,
  });
  const payoutQuery = api.drivers.getPayoutSummary.useQuery(undefined, {
    enabled: !!profileQuery.data,
  });
  const deliveriesQuery = api.drivers.getMyDeliveries.useQuery(
    { limit: 10 },
    { enabled: !!profileQuery.data },
  );
  const restaurantsQuery = api.drivers.getMyRestaurants.useQuery(undefined, {
    enabled: !!profileQuery.data,
  });

  // Earnings query with date filter
  const earningsDateRange = getDateRange(earningsPeriod);
  const earningsQuery = api.drivers.getEarnings.useQuery(
    {
      startDate: earningsDateRange.start,
      endDate: earningsDateRange.end,
      limit: 20,
    },
    { enabled: !!profileQuery.data },
  );

  // Mutations
  const toggleAvailability = api.drivers.toggleAvailability.useMutation({
    onSuccess: (data) => {
      void ctx.drivers.getProfile.invalidate();
      toast({
        title: data.isAvailable
          ? t("driverDashboard.nowOnline")
          : t("driverDashboard.nowOffline"),
        description: data.isAvailable
          ? t("driverDashboard.onlineDescription")
          : t("driverDashboard.offlineDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("driverDashboard.error"),
        description: t("driverDashboard.toggleError"),
        variant: "destructive",
      });
    },
  });

  const requestPayout = api.drivers.requestPayout.useMutation({
    onSuccess: (data) => {
      toast({
        title: t("driverDashboard.payoutRequested"),
        description: data.message,
      });
    },
    onError: (err) => {
      toast({
        title: t("driverDashboard.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // No driver profile: show a message
  if (profileQuery.error?.data?.code === "NOT_FOUND") {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Truck className="h-16 w-16 text-muted-foreground/40" />
          <h2 className="text-xl font-semibold text-foreground">
            {t("driverDashboard.noProfile")}
          </h2>
          <p className="max-w-md text-center text-muted-foreground">
            {t("driverDashboard.noProfileDescription")}
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (profileQuery.isLoading) {
    return <LoadingScreen />;
  }

  const profile = profileQuery.data;
  const payout = payoutQuery.data;

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("driverDashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("driverDashboard.subtitle")}
          </p>
        </div>

        {/* Status Toggle */}
        {profile && (
          <Button
            onClick={() => toggleAvailability.mutate()}
            disabled={
              toggleAvailability.isLoading || profile.status !== "active"
            }
            variant={profile.isAvailable ? "default" : "outline"}
            className={`gap-2 ${
              profile.isAvailable
                ? "bg-green-600 hover:bg-green-700 text-white"
                : ""
            }`}
          >
            {profile.isAvailable ? (
              <Power className="h-4 w-4" />
            ) : (
              <PowerOff className="h-4 w-4" />
            )}
            {profile.isAvailable
              ? t("driverDashboard.online")
              : t("driverDashboard.offline")}
          </Button>
        )}
      </div>

      {profile?.status !== "active" && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {t("driverDashboard.accountPending")}
          </p>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Truck className="h-5 w-5 text-blue-500" />}
          label={t("driverDashboard.todayDeliveries")}
          value={String(payout?.todayDeliveries ?? 0)}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5 text-green-500" />}
          label={t("driverDashboard.todayEarnings")}
          value={formatCentimes(payout?.todayEarnings ?? 0)}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-yellow-500" />}
          label={t("driverDashboard.rating")}
          value={profile ? `${profile.rating?.toFixed(1) ?? "5.0"}/5` : "--"}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          label={t("driverDashboard.totalDeliveries")}
          value={String(profile?.totalDeliveries ?? 0)}
        />
      </div>

      {/* Earnings Summary */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t("driverDashboard.earningsSummary")}
          </h2>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(["today", "week", "month"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setEarningsPeriod(period)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  earningsPeriod === period
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {(t as (key: string) => string)(`driverDashboard.period${capitalize(period)}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-xs font-medium text-green-700 dark:text-green-300">
              {t("driverDashboard.earned")}
            </p>
            <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-200">
              {formatCentimes(getEarningForPeriod(payout, earningsPeriod))}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {t("driverDashboard.deliveriesCount")}
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">
              {getDeliveriesForPeriod(payout, earningsPeriod)}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
              {t("driverDashboard.unpaidBalance")}
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-800 dark:text-purple-200">
              {formatCentimes(payout?.unpaidTotal ?? 0)}
            </p>
            {(payout?.unpaidTotal ?? 0) >= 1000 && (
              <Button
                size="sm"
                className="mt-2 gap-1"
                variant="outline"
                disabled={requestPayout.isLoading}
                onClick={() =>
                  requestPayout.mutate({
                    amount: payout?.unpaidTotal ?? 0,
                    method: "bank_transfer",
                  })
                }
              >
                <Banknote className="h-3.5 w-3.5" />
                {t("driverDashboard.requestPayout")}
              </Button>
            )}
          </div>
        </div>

        {/* Earnings list */}
        {earningsQuery.data?.earnings && earningsQuery.data.earnings.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("driverDashboard.recentEarnings")}
            </h3>
            <div className="space-y-1">
              {earningsQuery.data.earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {earning.description ?? earning.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    +{formatCentimes(earning.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Deliveries */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("driverDashboard.recentDeliveries")}
        </h2>
        {deliveriesQuery.data?.deliveries &&
        deliveriesQuery.data.deliveries.length > 0 ? (
          <div className="space-y-3">
            {deliveriesQuery.data.deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between rounded-lg border border-border/40 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusColor(delivery.status)}`}
                  >
                    {delivery.status === "delivered" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {delivery.orders.customerName ??
                        `#${delivery.orders.orderNumber}`}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {delivery.menus.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(delivery.status)}`}
                  >
                    {delivery.status.replace("_", " ")}
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(delivery.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t("driverDashboard.noDeliveries")}
          </p>
        )}
      </div>

      {/* Linked Restaurants */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("driverDashboard.linkedRestaurants")}
        </h2>
        {restaurantsQuery.data && restaurantsQuery.data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {restaurantsQuery.data.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 p-3"
              >
                {link.menus.logoImageUrl ? (
                  <img
                    src={link.menus.logoImageUrl}
                    alt={link.menus.name ?? ""}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {link.menus.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {link.menus.city ?? link.menus.address ?? ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    link.status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : link.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {link.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t("driverDashboard.noRestaurants")}
          </p>
        )}
      </div>
    </DashboardShell>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    assigned:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    picked_up:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    in_transit:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    delivered:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    failed:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return colors[status] ?? colors.pending!;
}

function getDateRange(period: EarningPeriod): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = now.toISOString();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end };
  }

  if (period === "week") {
    const start = new Date(now);
    const dayOfWeek = start.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end };
  }

  // month
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end };
}

function getEarningForPeriod(
  payout: { todayEarnings: number; weekEarnings: number; monthEarnings: number } | undefined,
  period: EarningPeriod,
): number {
  if (!payout) return 0;
  if (period === "today") return payout.todayEarnings;
  if (period === "week") return payout.weekEarnings;
  return payout.monthEarnings;
}

function getDeliveriesForPeriod(
  payout: { todayDeliveries: number; weekDeliveries: number; monthDeliveries: number } | undefined,
  period: EarningPeriod,
): number {
  if (!payout) return 0;
  if (period === "today") return payout.todayDeliveries;
  if (period === "week") return payout.weekDeliveries;
  return payout.monthDeliveries;
}
