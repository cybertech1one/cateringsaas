"use client";

import { useEffect, useState } from "react";
import { cn } from "~/utils/cn";

/**
 * Displays a small banner at the top of the page when the user is offline.
 * Automatically hides when connectivity is restored.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
      setIsVisible(true);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      // Delay hiding for smooth transition
      setTimeout(() => setIsVisible(false), 2000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed left-0 right-0 top-0 z-[9999] flex items-center justify-center px-4 py-2 text-center text-sm font-medium transition-all duration-500",
        isOffline
          ? "translate-y-0 bg-amber-500 text-white opacity-100"
          : "bg-green-500 text-white opacity-100",
      )}
    >
      {isOffline ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M15.536 8.464a5 5 0 010 7.072"
            />
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth={2.5} />
          </svg>
          You are offline - viewing cached menu
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Back online
        </span>
      )}
    </div>
  );
}
