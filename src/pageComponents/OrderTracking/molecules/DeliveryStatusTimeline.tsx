"use client";

import { Package, Truck, MapPin, CheckCircle2, Check } from "lucide-react";
import { cn } from "~/utils/cn";

type DeliveryStep = "picking_up" | "in_transit" | "at_doorstep" | "delivered";

interface DeliveryStatusTimelineProps {
  status: string;
  pickedUpAt: string | Date | null;
  deliveredAt: string | Date | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const DELIVERY_STEPS: {
  key: DeliveryStep;
  icon: React.ComponentType<{ className?: string }>;
  statusMatch: string[];
}[] = [
  {
    key: "picking_up",
    icon: Package,
    statusMatch: ["assigned", "picked_up", "in_transit", "delivered"],
  },
  {
    key: "in_transit",
    icon: Truck,
    statusMatch: ["in_transit", "delivered"],
  },
  {
    key: "at_doorstep",
    icon: MapPin,
    statusMatch: ["delivered"],
  },
  {
    key: "delivered",
    icon: CheckCircle2,
    statusMatch: ["delivered"],
  },
];

function formatTimestamp(date: string | Date | null): string | null {
  if (!date) return null;

  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DeliveryStatusTimeline({
  status,
  pickedUpAt,
  deliveredAt,
  t,
}: DeliveryStatusTimelineProps) {
  // Map delivery_request status to step index
  function getStepIndex(deliveryStatus: string): number {
    switch (deliveryStatus) {
      case "pending":
        return -1;
      case "assigned":
        return 0;
      case "picked_up":
        return 0;
      case "in_transit":
        return 1;
      case "delivered":
        return 3;
      default:
        return -1;
    }
  }

  const currentIndex = getStepIndex(status);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("deliveryTracking.timeline.title")}
      </p>
      <div className="flex flex-col gap-0">
        {DELIVERY_STEPS.map((step, index) => {
          const isDone = step.statusMatch.includes(status);
          const isCurrent = index === currentIndex;
          const isLast = index === DELIVERY_STEPS.length - 1;
          const StepIcon = step.icon;

          // Determine timestamp for this step
          let timestamp: string | null = null;

          if (step.key === "picking_up" && pickedUpAt) {
            timestamp = formatTimestamp(pickedUpAt);
          } else if (step.key === "delivered" && deliveredAt) {
            timestamp = formatTimestamp(deliveredAt);
          }

          return (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                    isDone &&
                      !isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary animate-pulse",
                    !isDone &&
                      !isCurrent &&
                      "border-muted-foreground/30 bg-background text-muted-foreground/50",
                  )}
                >
                  {isDone && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[28px] transition-colors duration-500",
                      isDone && !isCurrent
                        ? "bg-primary"
                        : "bg-muted-foreground/20",
                    )}
                  />
                )}
              </div>

              <div className={cn("pb-6", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-medium leading-9",
                    isDone ? "text-foreground" : "text-muted-foreground",
                    isCurrent && "font-semibold text-primary",
                  )}
                >
                  {t(`deliveryTracking.timeline.${step.key}`)}
                </p>
                {timestamp && (
                  <p className="text-xs text-muted-foreground">{timestamp}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
