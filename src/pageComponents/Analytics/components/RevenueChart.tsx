"use client";

import { useTranslation } from "react-i18next";
import { Filter, ArrowDown } from "lucide-react";
import { formatNumber } from "./utils";
import { cn } from "~/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversionFunnelData {
  views: number;
  dishClicks: number;
  orders: number;
}

export interface RevenueChartProps {
  data: ConversionFunnelData;
  title: string;
}

// ---------------------------------------------------------------------------
// Conversion Funnel (Revenue / Orders visualization)
// ---------------------------------------------------------------------------

export function RevenueChart({ data, title }: RevenueChartProps) {
  const { t } = useTranslation();

  const steps = [
    {
      label: t("analyticsPage.funnel.menuViews"),
      value: data.views,
      color: "bg-blue-500",
      lightColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-700 dark:text-blue-300",
    },
    {
      label: t("analyticsPage.funnel.dishClicks"),
      value: data.dishClicks,
      color: "bg-amber-500",
      lightColor: "bg-amber-100 dark:bg-amber-900/30",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    {
      label: t("analyticsPage.funnel.orders"),
      value: data.orders,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-100 dark:bg-emerald-900/30",
      textColor: "text-emerald-700 dark:text-emerald-300",
    },
  ];

  const maxValue = Math.max(data.views, 1);

  return (
    <div className="rounded-2xl border border-border/50 bg-card">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const widthPercent = (step.value / maxValue) * 100;
            const prevValue = idx > 0 ? steps[idx - 1]!.value : null;
            const dropOff =
              prevValue && prevValue > 0
                ? (((prevValue - step.value) / prevValue) * 100).toFixed(1)
                : null;

            return (
              <div key={step.label}>
                {/* Drop-off indicator between steps */}
                {dropOff !== null && (
                  <div className="flex items-center justify-center gap-2 py-1.5">
                    <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {dropOff}% {t("analyticsPage.funnel.dropOff")}
                    </span>
                  </div>
                )}
                {/* Funnel bar */}
                <div
                  className={cn(
                    "mx-auto flex items-center justify-between rounded-lg px-4 py-3 transition-all duration-500",
                    step.lightColor,
                  )}
                  style={{
                    width: `${Math.max(widthPercent, 30)}%`,
                    minWidth: "200px",
                  }}
                >
                  <span className={cn("text-sm font-medium", step.textColor)}>
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold tabular-nums",
                      step.textColor,
                    )}
                  >
                    {formatNumber(step.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall conversion */}
        {data.views > 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-center">
            <span className="text-sm text-muted-foreground">
              {t("analyticsPage.funnel.overallConversion")}:{" "}
            </span>
            <span className="text-lg font-bold text-primary">
              {((data.orders / data.views) * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
