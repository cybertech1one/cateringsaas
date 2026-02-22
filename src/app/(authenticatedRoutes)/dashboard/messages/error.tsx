"use client";

import { DashboardRouteError } from "~/components/DashboardRouteError";

export default function MessagesError({ error, reset }: { error: Error; reset: () => void }) {
  return <DashboardRouteError error={error} reset={reset} pageName="Messages" />;
}
