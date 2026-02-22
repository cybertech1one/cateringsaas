"use client";

import { OfflineBanner } from "./OfflineBanner";
import { InstallPrompt } from "./InstallPrompt";
import { PullToRefresh } from "./PullToRefresh";

/**
 * Wraps public menu pages with PWA-specific features:
 * - Offline connectivity banner
 * - Pull-to-refresh on mobile
 * - "Add to Home Screen" install prompt
 */
export function MenuPWAWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <PullToRefresh>
        {children}
      </PullToRefresh>
      <InstallPrompt />
    </>
  );
}
