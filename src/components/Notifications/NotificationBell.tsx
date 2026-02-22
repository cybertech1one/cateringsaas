"use client";

import React from "react";
import Link from "next/link";
import { Bell, ShoppingCart, Star, Check, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { cn } from "~/utils/cn";

function formatTimeAgo(date: Date, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return t("notificationBell.justNow");
  if (diffMin < 60) return t("notificationBell.minutesAgo", { count: diffMin });
  if (diffHr < 24) return t("notificationBell.hoursAgo", { count: diffHr });

  return t("notificationBell.daysAgo", { count: Math.floor(diffHr / 24) });
}

export function NotificationBell() {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const utils = api.useContext();

  const { data: unreadData } = api.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30000,
    },
  );

  const { data: notificationsData } =
    api.notifications.getNotifications.useQuery(
      { limit: 20 },
      {
        refetchInterval: 30000,
      },
    );

  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notifications.getUnreadCount.invalidate();
      void utils.notifications.getNotifications.invalidate();
    },
  });

  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notifications.getUnreadCount.invalidate();
      void utils.notifications.getNotifications.invalidate();
    },
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex items-center justify-center rounded-full border border-border/50 bg-card/80 p-2.5 text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md"
          aria-label={t("notificationBell.title")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {t("notificationBell.title")}
          </h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isLoading}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              {t("notificationBell.markAllRead")}
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("notificationBell.noNew")}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                    !notification.isRead && "bg-primary/5",
                  )}
                >
                  {/* Type icon */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      notification.type === "order"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
                    )}
                  >
                    {notification.type === "order" ? (
                      <ShoppingCart className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {notification.type === "order"
                          ? t("notificationBell.newOrder")
                          : t("notificationBell.newReview")}
                      </p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {notification.menuName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(notification.createdAt, t)}
                      </span>
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.isRead && (
                    <button
                      className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() =>
                        markAsReadMutation.mutate({
                          notificationId: notification.id,
                        })
                      }
                      disabled={markAsReadMutation.isLoading}
                      title={t("notificationBell.markAsRead")}
                      aria-label={t("notificationBell.markAsRead")}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <div className="flex gap-2">
              <Link
                href="/dashboard/orders"
                className="flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t("notificationBell.viewAll")}
              </Link>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
