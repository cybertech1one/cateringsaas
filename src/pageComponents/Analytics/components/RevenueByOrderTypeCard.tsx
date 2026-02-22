"use client";

import { useTranslation } from "react-i18next";
import { PieChart } from "lucide-react";
import { cn } from "~/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderTypeData {
  orderType: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface RevenueByOrderTypeCardProps {
  data: OrderTypeData[];
  title: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  const amount = cents / 100;

  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K MAD`;

  return `${amount.toFixed(2)} MAD`;
}

const ORDER_TYPE_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  dine_in: {
    bar: "bg-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  pickup: {
    bar: "bg-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  delivery: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  unknown: {
    bar: "bg-gray-500",
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-700 dark:text-gray-300",
  },
};

// ---------------------------------------------------------------------------
// Revenue by Order Type Card
// ---------------------------------------------------------------------------

export function RevenueByOrderTypeCard({ data, title }: RevenueByOrderTypeCardProps) {
  const { t } = useTranslation();

  const getOrderTypeLabel = (type: string): string => {
    switch (type) {
      case "dine_in":
        return t("analytics.revenue.dineIn");
      case "pickup":
        return t("analytics.revenue.pickup");
      case "delivery":
        return t("analytics.revenue.delivery");
      default:
        return type;
    }
  };

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <PieChart className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-display font-semibold">{title}</h3>
          </div>
        </div>
        <div className="px-5 pb-5">
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("analytics.revenue.noData")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <PieChart className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-3">
          {data.map((item) => {
            const colors = ORDER_TYPE_COLORS[item.orderType] ?? ORDER_TYPE_COLORS.unknown!;

            return (
              <div key={item.orderType} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn("font-medium", colors.text)}>
                    {getOrderTypeLabel(item.orderType)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {item.orderCount} orders
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/40">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
                    style={{ width: `${Math.max(item.percentage, 2)}%` }}
                  />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
