"use client";

import { DashboardRouteError } from "~/components/DashboardRouteError/DashboardRouteError";

export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardRouteError reset={reset} />;
}
