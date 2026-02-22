"use client";

import { useTranslation } from "react-i18next";
import { MousePointerClick } from "lucide-react";
import { formatNumber } from "./utils";
import type { TopDish } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PopularDishesChartProps {
  data: TopDish[];
  title: string;
}

// ---------------------------------------------------------------------------
// Top Dishes Table
// ---------------------------------------------------------------------------

export function PopularDishesChart({ data, title }: PopularDishesChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MousePointerClick className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-display font-semibold">{title}</h3>
          </div>
        </div>
        <div className="px-5 pb-5">
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("analyticsPage.noData")}
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
            <MousePointerClick className="h-4 w-4 text-primary" />
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
                  {t("analyticsPage.tables.clicks")}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("analyticsPage.tables.orders")}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("analyticsPage.tables.convRate")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {data.map((dish, idx) => {
                const convRate =
                  dish.clicks > 0
                    ? ((dish.orders / dish.clicks) * 100).toFixed(1)
                    : "0.0";

                return (
                  <tr
                    key={dish.dishName}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {dish.dishName}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {formatNumber(dish.clicks)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {formatNumber(dish.orders)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {convRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
