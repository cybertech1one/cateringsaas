"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Banknote,
  ShoppingCart,
  Award,
} from "lucide-react";

interface DailySummaryProps {
  menuId: string;
  currency: string;
}

export function DailySummary({ menuId, currency }: DailySummaryProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: stats, isLoading } = api.orders.getOrderStats.useQuery(
    { menuId, period: "today" },
    { enabled: !!menuId },
  );

  if (isLoading || !stats) return null;

  const avgOrderValue =
    stats.completedOrders > 0
      ? Math.round(stats.totalRevenue / stats.completedOrders)
      : 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/10">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">
              {t("ordersManagement.todaySummary")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {stats.totalOrders} {t("ordersManagement.allStatuses").toLowerCase()} &middot;{" "}
              {(stats.totalRevenue / 100).toFixed(2)} {currency}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border/50 p-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {/* Total Orders */}
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t("ordersManagement.allStatuses")}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {stats.totalOrders}
              </p>
            </div>

            {/* Total Revenue */}
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Banknote className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t("ordersManagement.totalRevenue")}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {(stats.totalRevenue / 100).toFixed(2)}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  {currency}
                </span>
              </p>
            </div>

            {/* Avg Order Value */}
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t("ordersManagement.avgOrderValue")}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {(avgOrderValue / 100).toFixed(2)}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  {currency}
                </span>
              </p>
            </div>
          </div>

          {/* Top Dishes */}
          {stats.topDishes.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t("ordersManagement.topDishes")}
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {stats.topDishes.slice(0, 3).map((dish, index) => (
                  <div
                    key={dish.name}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{dish.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold tabular-nums">
                        {dish.quantity}x
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                        {(dish.revenue / 100).toFixed(2)} {currency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.totalOrders === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("ordersManagement.noSummaryData")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
