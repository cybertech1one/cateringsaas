"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "~/utils/cn";

// Storage key for tracking visits
const VISIT_COUNT_KEY = "feastqr_visit_count";
const INSTALL_DISMISSED_KEY = "feastqr_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows an "Add to Home Screen" prompt after the user's 2nd visit.
 * Uses the browser's beforeinstallprompt event for Chrome/Edge/Android,
 * and shows a manual instruction banner for iOS Safari.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already in standalone mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as unknown as { standalone: boolean }).standalone);

    setIsStandalone(!!standalone);
    if (standalone) return;

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);

    if (dismissed) return;

    // Track visits
    const visitCount = parseInt(
      localStorage.getItem(VISIT_COUNT_KEY) || "0",
      10,
    );
    const newCount = visitCount + 1;

    localStorage.setItem(VISIT_COUNT_KEY, String(newCount));

    // Only show after 2nd visit
    if (newCount < 2) return;

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS-specific instructions after a short delay
      const timer = setTimeout(() => setShowBanner(true), 3000);

      return () => clearTimeout(timer);
    }

    // For Chrome/Edge/Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  }, []);

  // Don't render anything if already standalone or nothing to show
  if (isStandalone || !showBanner) return null;

  return (
    <div
      role="complementary"
      aria-label="Install app prompt"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9998] border-t border-border/30 bg-background/95 px-4 py-3 shadow-elevated backdrop-blur-lg transition-transform duration-500",
        showBanner ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-6m0 0V6m0 6h6m-6 0H6"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Add FeastQR to Home Screen
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {isIOS
              ? "Tap the share button, then \"Add to Home Screen\""
              : "Quick access to menus - works offline too"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {!isIOS && deferredPrompt && (
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              style={{ minHeight: "44px", minWidth: "44px" }}
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dismiss install prompt"
            style={{ minHeight: "44px", minWidth: "44px" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
