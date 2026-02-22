"use client";

import { useEffect, useRef, useCallback } from "react";
import { api } from "~/trpc/react";

// ---------------------------------------------------------------------------
// Session ID -- persisted in sessionStorage so all events in one browser
// session share the same identifier for analytics grouping.
// ---------------------------------------------------------------------------

function getSessionId(): string {
  const KEY = "feastqr-analytics-session";

  if (typeof window === "undefined") return "ssr";

  try {
    const existing = sessionStorage.getItem(KEY);

    if (existing) return existing;

    const id = crypto.randomUUID();

    sessionStorage.setItem(KEY, id);

    return id;
  } catch {
    // sessionStorage disabled (private browsing, etc.) -- fall back to a
    // per-page-load ID so we still get *some* grouping.
    return crypto.randomUUID();
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseMenuAnalyticsOptions {
  menuId: string;
  /** When true (e.g. in the design-editor preview) no events are sent. */
  disabled?: boolean;
}

interface UseMenuAnalyticsReturn {
  trackDishClick: (dishId: string, dishName: string) => void;
  trackOrderPlaced: (orderId: string, total: number) => void;
}

export function useMenuAnalytics({
  menuId,
  disabled = false,
}: UseMenuAnalyticsOptions): UseMenuAnalyticsReturn {
  const viewTrackedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Lazily resolve the session ID on first access (avoids SSR mismatch).
  const getSession = useCallback((): string => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = getSessionId();
    }

    return sessionIdRef.current;
  }, []);

  const trackEvent = api.analytics.trackEvent.useMutation();

  // ── menu_view (fire once) ───────────────────────────────────
  useEffect(() => {
    if (disabled || viewTrackedRef.current) return;

    viewTrackedRef.current = true;

    trackEvent.mutate({
      menuId,
      eventType: "menu_view",
      sessionId: getSession(),
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
    // Only run on mount (menuId is stable for the lifetime of the component).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, disabled]);

  // ── dish_click ──────────────────────────────────────────────
  const trackDishClick = useCallback(
    (dishId: string, dishName: string) => {
      if (disabled) return;

      trackEvent.mutate({
        menuId,
        eventType: "dish_click",
        eventData: { dishId, dishName },
        sessionId: getSession(),
      });
    },
    [menuId, disabled, trackEvent, getSession],
  );

  // ── order_placed ────────────────────────────────────────────
  const trackOrderPlaced = useCallback(
    (orderId: string, total: number) => {
      if (disabled) return;

      trackEvent.mutate({
        menuId,
        eventType: "order_placed",
        eventData: { orderId, total },
        sessionId: getSession(),
      });
    },
    [menuId, disabled, trackEvent, getSession],
  );

  return { trackDishClick, trackOrderPlaced };
}
