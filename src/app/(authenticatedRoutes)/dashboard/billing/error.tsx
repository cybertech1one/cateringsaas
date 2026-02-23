"use client";

import { DashboardRouteError } from "~/components/DashboardRouteError";

export default function BillingError({ error, reset }: { error: Error; reset: () => void }) {
  return <DashboardRouteError error={error} reset={reset} pageName="Billing" />;
}
