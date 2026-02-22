"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { formatNumber } from "./utils";
import type { TopReferrer } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopReferrersCardProps {
  data: TopReferrer[];
  title: string;
}

// ---------------------------------------------------------------------------
// Top Referrers
// ---------------------------------------------------------------------------

export function TopReferrersCard({ data, title }: TopReferrersCardProps) {
  const { t } = useTranslation();
  const maxCount = useMemo(
    () => Math.max(...data.map((r) => r.count), 1),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="h-full rounded-2xl border border-border/50 bg-card">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
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
    <div className="h-full rounded-2xl border border-border/50 bg-card">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-3">
          {data.map((ref) => {
            const widthPercent = (ref.count / maxCount) * 100;

            return (
              <div key={ref.referrer}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="max-w-[70%] truncate text-sm font-medium">
                    {ref.referrer}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {formatNumber(ref.count)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-violet-500/70 transition-all duration-500"
                    style={{ width: `${Math.max(widthPercent, 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
