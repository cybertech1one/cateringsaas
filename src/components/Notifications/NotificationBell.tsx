"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * NotificationBell — Stubbed out for Diyafa.
 *
 * The old `api.notifications` router was removed. This renders
 * a static bell icon with no dropdown or tRPC calls. Once a Diyafa
 * notifications router is implemented, this can be wired back up.
 */
export function NotificationBell() {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  return (
    <button
      className="relative inline-flex items-center justify-center rounded-full border border-border/50 bg-card/80 p-2.5 text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md"
      aria-label={t("notificationBell.title")}
    >
      <Bell className="h-4 w-4" />
    </button>
  );
}
