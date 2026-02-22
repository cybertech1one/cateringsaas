"use client";

interface PushNotificationOptInProps {
  orderId: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

/**
 * Push notification opt-in — stubbed for Diyafa.
 * Will be reimplemented for event status notifications.
 */
export function PushNotificationOptIn(_props: PushNotificationOptInProps) {
  return null;
}
