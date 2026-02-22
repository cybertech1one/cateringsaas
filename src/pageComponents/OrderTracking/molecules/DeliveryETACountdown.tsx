"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2 } from "lucide-react";

interface DeliveryETACountdownProps {
  estimatedDuration: number | null;
  createdAt: string | Date;
  status: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function DeliveryETACountdown({
  estimatedDuration,
  createdAt,
  status,
  t,
}: DeliveryETACountdownProps) {
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!estimatedDuration) {
      setMinutesRemaining(null);

      return;
    }

    function calculate() {
      const created =
        typeof createdAt === "string" ? new Date(createdAt) : createdAt;
      const etaMs = created.getTime() + (estimatedDuration as number) * 60_000;
      const remaining = Math.max(0, Math.ceil((etaMs - Date.now()) / 60_000));

      setMinutesRemaining(remaining);
    }

    calculate();
    const interval = setInterval(calculate, 30_000);

    return () => clearInterval(interval);
  }, [estimatedDuration, createdAt]);

  if (status === "delivered") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-5 py-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm font-medium text-primary">
          {t("deliveryTracking.eta.delivered")}
        </p>
      </div>
    );
  }

  if (status === "cancelled" || status === "failed") {
    return null;
  }

  if (minutesRemaining === null) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("deliveryTracking.eta.label")}
          </p>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {minutesRemaining <= 2
              ? t("deliveryTracking.eta.arriving")
              : t("deliveryTracking.eta.minutes", {
                  minutes: minutesRemaining,
                })}
          </p>
        </div>
      </div>
    </div>
  );
}
