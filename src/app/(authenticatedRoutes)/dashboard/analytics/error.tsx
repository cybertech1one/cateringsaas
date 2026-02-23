"use client";

import { DashboardRouteError } from "~/components/DashboardRouteError";

export default function AnalyticsError({ error, reset }: { error: Error; reset: () => void }) {
  return <DashboardRouteError error={error} reset={reset} pageName="Analytics" />;
}
