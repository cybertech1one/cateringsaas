"use client";

import { api } from "~/trpc/react";

/**
 * Real-time badge showing the count of pending orders (pending + confirmed + preparing).
 * Polls every 30 seconds. Renders nothing when count is 0.
 */
export function PendingOrderBadge() {
  const { data } = api.orders.getPendingOrderCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const count = data?.count ?? 0;

  if (count === 0) {
    return null;
  }

  return (
    <span
      aria-label={`${count} pending order${count === 1 ? "" : "s"}`}
      className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
