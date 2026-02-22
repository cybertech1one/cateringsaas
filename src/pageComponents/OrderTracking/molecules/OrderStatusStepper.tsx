"use client";

import { Check, Clock, ChefHat, Bell, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "~/utils/cn";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

interface OrderStatusStepperProps {
  status: OrderStatus;
  createdAt: string | Date;
  confirmedAt: string | Date | null;
  preparingAt: string | Date | null;
  readyAt: string | Date | null;
  completedAt: string | Date | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

interface Step {
  key: OrderStatus;
  icon: React.ComponentType<{ className?: string }>;
  timestamp: string | Date | null;
}

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
];

function getStepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;

  return STATUS_ORDER.indexOf(status);
}

function formatTimestamp(date: string | Date | null): string | null {
  if (!date) return null;

  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OrderStatusStepper({
  status,
  createdAt,
  confirmedAt,
  preparingAt,
  readyAt,
  completedAt,
  t,
}: OrderStatusStepperProps) {
  const isCancelled = status === "cancelled";
  const currentIndex = getStepIndex(status);

  const steps: Step[] = [
    { key: "pending", icon: Clock, timestamp: createdAt },
    { key: "confirmed", icon: Check, timestamp: confirmedAt },
    { key: "preparing", icon: ChefHat, timestamp: preparingAt },
    { key: "ready", icon: Bell, timestamp: readyAt },
    { key: "completed", icon: CheckCircle2, timestamp: completedAt },
  ];

  if (isCancelled) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">
              {t("orderTracking.status.cancelled")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("orderTracking.eta.cancelled")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="flex flex-col gap-0">
        {steps.map((step, index) => {
          const isDone = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;
          const StepIcon = step.icon;
          const time = formatTimestamp(step.timestamp);

          return (
            <div key={step.key} className="flex gap-4">
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                    isDone && !isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary animate-pulse",
                    !isDone &&
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
                      index < currentIndex
                        ? "bg-primary"
                        : "bg-muted-foreground/20",
                    )}
                  />
                )}
              </div>

              {/* Label + timestamp */}
              <div className={cn("pb-6", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-medium leading-9",
                    isDone ? "text-foreground" : "text-muted-foreground",
                    isCurrent && "font-semibold text-primary",
                  )}
                >
                  {t(`orderTracking.status.${step.key}`)}
                </p>
                {time && (
                  <p className="text-xs text-muted-foreground">{time}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
