"use client";

import { useTranslation } from "react-i18next";
import { Smartphone, Monitor, Tablet } from "lucide-react";
import { formatNumber } from "./utils";
import { cn } from "~/utils/cn";
import type { DeviceBreakdown } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeviceBreakdownCardProps {
  data: DeviceBreakdown;
  title: string;
}

// ---------------------------------------------------------------------------
// Device Breakdown
// ---------------------------------------------------------------------------

export function DeviceBreakdownCard({ data, title }: DeviceBreakdownCardProps) {
  const { t } = useTranslation();
  const total = data.mobile + data.desktop + data.tablet;

  if (total === 0) return null;

  const segments = [
    {
      label: t("analyticsPage.devices.mobile"),
      value: data.mobile,
      percent: ((data.mobile / total) * 100).toFixed(1),
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      icon: <Smartphone className="h-4 w-4" />,
    },
    {
      label: t("analyticsPage.devices.desktop"),
      value: data.desktop,
      percent: ((data.desktop / total) * 100).toFixed(1),
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      label: t("analyticsPage.devices.tablet"),
      value: data.tablet,
      percent: ((data.tablet / total) * 100).toFixed(1),
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      icon: <Tablet className="h-4 w-4" />,
    },
  ];

  return (
    <div className="h-full rounded-2xl border border-border/50 bg-card">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Monitor className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
      </div>
      <div className="space-y-4 px-5 pb-5">
        {/* Stacked bar */}
        <div className="flex h-4 overflow-hidden rounded-full">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={cn("transition-all duration-500", seg.color)}
              style={{ width: `${seg.percent}%` }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", seg.color)} />
                <span className={cn("flex items-center gap-1.5 text-sm", seg.textColor)}>
                  {seg.icon}
                  {seg.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold tabular-nums">
                  {seg.percent}%
                </span>
                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                  ({formatNumber(seg.value)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
