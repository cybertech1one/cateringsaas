"use client";

import { useMemo } from "react";
import { DollarSign } from "lucide-react";
import { formatShortDate } from "./utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueByDayData {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueByDayChartProps {
  data: RevenueByDayData[];
  title: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrencyShort(cents: number): string {
  const amount = cents / 100;

  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;

  return amount.toFixed(0);
}

// ---------------------------------------------------------------------------
// Revenue by Day Bar Chart (CSS-only)
// ---------------------------------------------------------------------------

export function RevenueByDayChart({ data, title }: RevenueByDayChartProps) {
  const maxRevenue = useMemo(
    () => Math.max(...data.map((d) => d.revenue), 1),
    [data],
  );

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card">
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-end gap-1" style={{ height: "200px" }}>
          {data.map((day) => {
            const heightPercent = (day.revenue / maxRevenue) * 100;
            const dateLabel = formatShortDate(day.date);

            return (
              <div
                key={day.date}
                className="group relative flex flex-1 flex-col items-center justify-end"
                style={{ height: "100%" }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-10 z-10 hidden rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg group-hover:block">
                  <div>{formatCurrencyShort(day.revenue)} MAD</div>
                  <div className="text-muted-foreground">{day.orderCount} orders</div>
                </div>
                {/* Bar */}
                <div
                  className="w-full max-w-[40px] rounded-t-sm bg-emerald-500/80 transition-all duration-300 hover:bg-emerald-500"
                  style={{
                    height: `${Math.max(heightPercent, 2)}%`,
                    minHeight: "2px",
                  }}
                />
                {/* Date label - show every few to avoid overlap */}
                {data.length <= 14 && (
                  <span className="mt-2 text-[10px] leading-none text-muted-foreground">
                    {dateLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Show date range if too many bars */}
        {data.length > 14 && (
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{formatShortDate(data[0]?.date ?? "")}</span>
            <span>{formatShortDate(data[data.length - 1]?.date ?? "")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
