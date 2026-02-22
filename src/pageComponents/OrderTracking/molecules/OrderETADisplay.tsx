"use client";

import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "~/utils/cn";

interface OrderETADisplayProps {
  status: string | null;
  orderType: string | null;
  estimatedMinutes: number;
  ordersAhead: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function OrderETADisplay({
  status,
  orderType,
  estimatedMinutes,
  ordersAhead,
  t,
}: OrderETADisplayProps) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-destructive/10 px-5 py-4">
        <XCircle className="h-6 w-6 shrink-0 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          {t("orderTracking.eta.cancelled")}
        </p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-5 py-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm font-medium text-primary">
          {t("orderTracking.eta.completed")}
        </p>
      </div>
    );
  }

  if (status === "ready") {
    const readyKeyMap: Record<string, string> = {
      dine_in: "orderTracking.eta.readyDineIn",
      pickup: "orderTracking.eta.readyPickup",
    };
    const readyKey =
      (orderType && readyKeyMap[orderType]) ?? "orderTracking.eta.ready";

    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-5 py-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t(readyKey)}
        </p>
      </div>
    );
  }

  // Active states: pending, confirmed, preparing
  return (
    <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "bg-primary/10",
          )}
        >
          <Clock className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold tabular-nums text-foreground">
            {t("orderTracking.eta.estimatedTime", {
              minutes: estimatedMinutes,
            })}
          </p>
          {ordersAhead > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("orderTracking.eta.ordersAhead", { count: ordersAhead })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
