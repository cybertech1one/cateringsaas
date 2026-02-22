"use client";

import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopSellingDish {
  dishName: string;
  revenue: number;
  quantity: number;
  percentage: number;
}

export interface TopSellingDishesTableProps {
  data: TopSellingDish[];
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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;

  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Top Selling Dishes Table
// ---------------------------------------------------------------------------

export function TopSellingDishesTable({ data, title }: TopSellingDishesTableProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Trophy className="h-4 w-4 text-amber-600" />
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
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="overflow-hidden rounded-lg border border-border/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("analyticsPage.tables.dishName")}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qty
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Revenue
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {data.map((dish, idx) => (
                <tr
                  key={dish.dishName}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {dish.dishName}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">
                    {formatNumber(dish.quantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                    {formatCurrency(dish.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                    {dish.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
