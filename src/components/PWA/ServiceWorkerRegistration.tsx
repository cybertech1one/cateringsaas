"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Placed in root layout so it runs once for the entire app.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Register after page load to avoid competing with critical resources
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Check for updates periodically (every 60 minutes)
        const checkInterval = setInterval(
          () => {
            void registration.update();
          },
          60 * 60 * 1000,
        );

        // Listen for new service worker available
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available - activate it
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        return () => clearInterval(checkInterval);
      } catch (error) {
        console.warn("Service worker registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", () => void register(), { once: true });
    }
  }, []);

  return null;
}
