"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Search,
  Clock,
  ChevronRight,
  ShoppingBag,
  RotateCcw,
  Package,
  Gift,
  Star,
} from "lucide-react";
import { api } from "~/trpc/react";
import { shimmerToBase64 } from "~/utils/shimmer";
import { Skeleton } from "~/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function getStatusKey(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "orderHistory.statusPending",
    confirmed: "orderHistory.statusConfirmed",
    preparing: "orderHistory.statusPreparing",
    ready: "orderHistory.statusReady",
    completed: "orderHistory.statusCompleted",
    cancelled: "orderHistory.statusCancelled",
  };

  return statusMap[status] ?? "orderHistory.statusPending";
}

function formatPrice(amount: number, currency: string): string {
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MOROCCAN_PHONE_REGEX = /^(\+212|0)[0-9]{9}$/;

function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function OrderHistoryPage() {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const searchParams = useSearchParams();

  const initialPhone = searchParams.get("phone") ?? "";
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [searchPhone, setSearchPhone] = useState(
    initialPhone ? normalizePhone(initialPhone) : "",
  );
  const [phoneError, setPhoneError] = useState("");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = api.orders.getOrderHistory.useInfiniteQuery(
    { phone: searchPhone, limit: 10 },
    {
      enabled: searchPhone.length > 0,
      getNextPageParam: (lastPage: { nextCursor?: string }) =>
        lastPage.nextCursor,
    },
  );

  const orders = data?.pages.flatMap((page) => page.orders) ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizePhone(phoneInput);

    if (!MOROCCAN_PHONE_REGEX.test(normalized)) {
      setPhoneError(
        t("orderHistory.invalidPhone"),
      );

      return;
    }

    setPhoneError("");
    setSearchPhone(normalized);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("orderHistory.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("orderHistory.subtitle")}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setPhoneError("");
                }}
                aria-label={t("orderHistory.phonePlaceholder")}
                placeholder={t("orderHistory.phonePlaceholder")}
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !phoneInput.trim()}
              className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading && searchPhone
                ? t("orderHistory.searching")
                : t("orderHistory.searchButton")}
            </button>
          </div>
          {phoneError && (
            <p role="alert" className="mt-2 text-xs text-destructive">{phoneError}</p>
          )}
        </form>

        {/* Loading State */}
        {isLoading && searchPhone && <OrderHistorySkeleton />}

        {/* Results */}
        {!isLoading && searchPhone && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("orderHistory.noOrders")}
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t("orderHistory.noOrdersDescription")}
            </p>
          </div>
        )}

        {/* Loyalty Card Preview */}
        {orders.length > 0 && searchPhone && (
          <LoyaltyCardPreview
            menuId={orders[0]!.menuId}
            phone={searchPhone}
            restaurantName={orders[0]!.restaurantName}
            t={t}
          />
        )}

        {orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-xl border border-border/50 bg-card transition-shadow hover:shadow-md"
              >
                <div className="p-4">
                  {/* Restaurant + Status Row */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {order.restaurantLogo ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/50">
                          <Image
                            src={order.restaurantLogo}
                            fill
                            alt={`${order.restaurantName} logo`}
                            className="object-cover"
                            sizes="40px"
                            placeholder="blur"
                            blurDataURL={shimmerToBase64(40, 40)}
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {order.restaurantName}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {t("orderHistory.orderDate", {
                              date: formatDate(order.createdAt),
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? STATUS_COLORS.pending}`}
                    >
                      {t(getStatusKey(order.status))}
                    </span>
                  </div>

                  {/* Order Details */}
                  <div className="flex items-center justify-between border-t border-border/30 pt-3">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">
                        {formatPrice(order.totalAmount, order.currency)}
                      </span>
                      <span className="mx-2 text-border">|</span>
                      <span className="text-muted-foreground">
                        {t("orderHistory.items", {
                          count: order.itemCount,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.restaurantSlug && (
                        <Link
                          href={`/menu/${order.restaurantSlug}`}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {t("orderHistory.reorder")}
                        </Link>
                      )}
                      <Link
                        href={`/order/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        {t("orderHistory.viewOrder")}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {isFetchingNextPage
                  ? t("orderHistory.searching")
                  : t("orderHistory.loadMore")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoyaltyCardPreview({
  menuId,
  phone,
  restaurantName,
  t,
}: {
  menuId: string;
  phone: string;
  restaurantName: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { data: loyaltyData } = api.loyalty.getCustomerLoyalty.useQuery(
    { menuId, phone },
  );

  if (!loyaltyData || loyaltyData.length === 0) {
    return null;
  }

  const program = loyaltyData[0]!;
  const remaining = program.stampsRequired - program.stampsCollected;

  return (
    <div className="mb-4 rounded-xl border border-border/50 bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${program.color ?? "#8b5cf6"}20` }}
        >
          <Gift
            className="h-5 w-5"
            style={{ color: program.color ?? "#8b5cf6" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {t("loyalty.auto.progress", {
              current: program.stampsCollected,
              total: program.stampsRequired,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {restaurantName}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {Array.from({ length: program.stampsRequired }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < program.stampsCollected
                  ? "fill-current"
                  : "text-muted-foreground/30"
              }`}
              style={
                i < program.stampsCollected
                  ? { color: program.color ?? "#8b5cf6" }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {program.isRedeemable && (
        <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {t("loyalty.auto.rewardReady")}
          </p>
        </div>
      )}
      {!program.isRedeemable && remaining > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("loyalty.auto.almostThere", { remaining })}
        </p>
      )}
    </div>
  );
}

function OrderHistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border/50 bg-card p-4"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between border-t border-border/30 pt-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
