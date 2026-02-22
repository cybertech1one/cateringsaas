"use client";

import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Share2, BarChart3 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareTrackingProps {
  period: "today" | "7d" | "30d" | "90d" | "all";
}

// ---------------------------------------------------------------------------
// Simple Bar Component (no external chart library needed)
// ---------------------------------------------------------------------------

function SimpleBar({
  label,
  value,
  maxValue,
  color = "bg-primary",
}: {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 truncate text-sm text-muted-foreground">{label}</span>
      <div className="flex-1">
        <div className="h-6 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
      </div>
      <span className="min-w-[3rem] text-right text-sm font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareTracking({ period }: ShareTrackingProps) {
  const { t } = useTranslation();

  const { data, isLoading } = api.marketing.getShareAnalytics.useQuery({
    period,
  });

  const maxPlatformCount = Math.max(
    ...(data?.byPlatform.map((p) => p.count) ?? [0]),
  );
  const maxDishCount = Math.max(
    ...(data?.topSharedDishes.map((d) => d.count) ?? [0]),
  );

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (!data || (data.byPlatform.length === 0 && data.topSharedDishes.length === 0)) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Share2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">
          {t("marketing.shares.noData")}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("marketing.shares.noDataDescription")}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Shares by Platform */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">
            {t("marketing.shares.byPlatform")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.byPlatform.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("marketing.shares.noSharesYet")}
            </p>
          ) : (
            data.byPlatform.map((platform) => (
              <SimpleBar
                key={platform.platform}
                label={platform.platform}
                value={platform.count}
                maxValue={maxPlatformCount}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Shared Dishes */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center gap-2">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">
            {t("marketing.shares.topSharedDishes")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.topSharedDishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("marketing.shares.noSharesYet")}
            </p>
          ) : (
            data.topSharedDishes.map((dish) => (
              <SimpleBar
                key={dish.dishName}
                label={dish.dishName}
                value={dish.count}
                maxValue={maxDishCount}
                color="bg-primary/80"
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Shares Over Time */}
      {data.overTime.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              {t("marketing.shares.overTime")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-1">
              {data.overTime.map((day) => {
                const maxDay = Math.max(...data.overTime.map((d) => d.count));
                const height = maxDay > 0 ? (day.count / maxDay) * 100 : 0;

                return (
                  <div
                    key={day.date}
                    className="group relative flex flex-1 flex-col items-center"
                  >
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all duration-300 hover:bg-primary"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 hidden whitespace-nowrap rounded bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                      {day.date}: {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{data.overTime[0]?.date ?? ""}</span>
              <span>{data.overTime[data.overTime.length - 1]?.date ?? ""}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
