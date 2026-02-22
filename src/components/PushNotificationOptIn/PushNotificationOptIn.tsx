"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { api } from "~/trpc/react";
import { env } from "~/env.mjs";

interface PushNotificationOptInProps {
  orderId: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

type SubscriptionState = "idle" | "subscribed" | "denied" | "unsupported";

const STORAGE_KEY_PREFIX = "feastqr-push-subscribed-";

/**
 * Convert a base64-encoded VAPID public key to a Uint8Array for
 * the applicationServerKey parameter.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function PushNotificationOptIn({
  orderId,
  t,
}: PushNotificationOptInProps) {
  const [state, setState] = useState<SubscriptionState>("idle");
  const [isLoading, setIsLoading] = useState(false);

  const subscribeMutation = api.orders.subscribeToPush.useMutation();

  // Check initial state on mount
  useEffect(() => {
    // Check browser support
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setState("unsupported");

      return;
    }

    // Check if already subscribed for this order
    const storageKey = STORAGE_KEY_PREFIX + orderId;

    if (localStorage.getItem(storageKey) === "true") {
      setState("subscribed");

      return;
    }

    // Check if notification permission was denied
    if (Notification.permission === "denied") {
      setState("denied");

      return;
    }

    // Check if already granted and subscribed (from another visit)
    if (Notification.permission === "granted") {
      // Still show idle so user can click to subscribe this order
      setState("idle");
    }
  }, [orderId]);

  const handleSubscribe = useCallback(async () => {
    const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      // VAPID not configured, silently fail
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState("denied");
        setIsLoading(false);

        return;
      }

      // Get or wait for service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Extract keys from the subscription
      const p256dhKey = pushSubscription.getKey("p256dh");
      const authKey = pushSubscription.getKey("auth");

      if (!p256dhKey || !authKey) {
        throw new Error("Failed to get push subscription keys");
      }

      // Convert ArrayBuffer to base64url
      const p256dh = btoa(
        String.fromCharCode(...new Uint8Array(p256dhKey)),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const auth = btoa(
        String.fromCharCode(...new Uint8Array(authKey)),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Send subscription to server
      await subscribeMutation.mutateAsync({
        orderId,
        endpoint: pushSubscription.endpoint,
        p256dh,
        auth,
      });

      // Store in localStorage to avoid re-prompting
      const storageKey = STORAGE_KEY_PREFIX + orderId;

      localStorage.setItem(storageKey, "true");
      setState("subscribed");
    } catch {
      // If user cancelled or something went wrong, just stay idle
      if (Notification.permission === "denied") {
        setState("denied");
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId, subscribeMutation]);

  // Do not render if unsupported or if VAPID key is not configured
  if (
    state === "unsupported" ||
    !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  ) {
    return null;
  }

  // Already subscribed
  if (state === "subscribed") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {t("pushNotification.notificationsEnabled")}
        </p>
      </div>
    );
  }

  // Permission denied
  if (state === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/50 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <BellOff className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("pushNotification.notificationsBlocked")}
        </p>
      </div>
    );
  }

  // Idle -- show opt-in button
  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={isLoading}
      className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {t("pushNotification.enableNotifications")}
        </p>
      </div>
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </button>
  );
}
