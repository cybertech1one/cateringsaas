"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { formatNumber, formatHour } from "./utils";
import type { PeakHour } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PeakHoursChartProps {
  data: PeakHour[];
  title: string;
}

// ---------------------------------------------------------------------------
// Peak Hours (Horizontal Bar Chart)
// ---------------------------------------------------------------------------

export function PeakHoursChart({ data, title }: PeakHoursChartProps) {
  const maxCount = useMemo(
    () => Math.max(...data.map((h) => h.count), 1),
    [data],
  );

  if (data.length === 0) return null;

  // Show only hours that have activity, sorted by hour
  const activeHours = data
    .filter((h) => h.count > 0)
    .sort((a, b) => a.hour - b.hour);

  if (activeHours.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-2">
          {activeHours.map((h) => {
            const widthPercent = (h.count / maxCount) * 100;

            return (
              <div key={h.hour} className="flex items-center gap-3">
                <span className="w-12 text-right text-xs font-medium text-muted-foreground tabular-nums">
                  {formatHour(h.hour)}
                </span>
                <div className="relative flex-1">
                  <div className="h-6 w-full rounded-md bg-muted/40" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-md bg-primary/70 transition-all duration-500"
                    style={{ width: `${Math.max(widthPercent, 3)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-medium tabular-nums">
                  {formatNumber(h.count)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
