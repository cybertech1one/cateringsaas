"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "~/utils/cn";
import { useFocusTrap } from "~/hooks/useFocusTrap";
import {
  CURRENT_CONSENT_VERSION,
  type CookieConsentState,
} from "./useCookieConsent";

const CONSENT_KEY = "feastqr_cookie_consent";
const CONSENT_VERSION_KEY = "feastqr_consent_version";

export function CookieConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const { containerRef, handleKeyDown } = useFocusTrap(showModal);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      const storedVersion = localStorage.getItem(CONSENT_VERSION_KEY);

      if (stored && storedVersion) {
        const version = parseInt(storedVersion, 10);

        if (version === CURRENT_CONSENT_VERSION) {
          return;
        }
      }
    } catch {
      // localStorage not available, show banner anyway
    }

    const timer = setTimeout(() => setShowBanner(true), 1000);

    return () => clearTimeout(timer);
  }, []);

  const saveConsent = useCallback((state: CookieConsentState) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
      localStorage.setItem(
        CONSENT_VERSION_KEY,
        String(CURRENT_CONSENT_VERSION),
      );
    } catch {
      // localStorage not available
    }

    setShowBanner(false);
    setShowModal(false);
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      version: CURRENT_CONSENT_VERSION,
    });
  }, [saveConsent]);

  const handleSavePreferences = useCallback(() => {
    saveConsent({
      essential: true,
      analytics,
      marketing,
      version: CURRENT_CONSENT_VERSION,
    });
  }, [saveConsent, analytics, marketing]);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleModalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);

        return;
      }

      handleKeyDown(e);
    },
    [handleKeyDown],
  );

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Banner */}
      <div
        role="dialog"
        aria-label={t("cookieConsent.title")}
        aria-modal="false"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[9997] border-t border-border/30 bg-background/95 px-4 py-3 shadow-elevated backdrop-blur-lg transition-transform duration-500",
          showBanner && !showModal ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {/* Cookie Icon */}
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
                d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-1 4 4 0 0 1-1-5 10 10 0 0 0-4-4Zm1 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-4 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm6 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("cookieConsent.title")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {t("cookieConsent.description")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleOpenModal}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              style={{ minHeight: "44px" }}
            >
              {t("cookieConsent.managePreferences")}
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              style={{ minHeight: "44px" }}
            >
              {t("cookieConsent.acceptAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50"
          onClick={handleCloseModal}
          aria-hidden="true"
        />
      )}
      {showModal && (
        <div
          ref={containerRef}
          role="dialog"
          aria-label={t("cookieConsent.preferencesTitle")}
          aria-modal="true"
          onKeyDown={handleModalKeyDown}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {t("cookieConsent.preferencesTitle")}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
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

            <p className="mb-6 text-sm text-muted-foreground">
              {t("cookieConsent.preferencesDescription")}
            </p>

            {/* Cookie Toggles */}
            <div className="space-y-4">
              {/* Essential - always on */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {t("cookieConsent.essential")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("cookieConsent.essentialDescription")}
                  </p>
                </div>
                <span className="ml-3 flex-shrink-0 text-xs font-medium text-muted-foreground">
                  {t("cookieConsent.alwaysOn")}
                </span>
              </div>

              {/* Analytics */}
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {t("cookieConsent.analytics")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("cookieConsent.analyticsDescription")}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analytics}
                  aria-label={t("cookieConsent.analytics")}
                  onClick={() => setAnalytics((prev) => !prev)}
                  className={cn(
                    "ml-3 flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    analytics ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      analytics ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </label>

              {/* Marketing */}
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {t("cookieConsent.marketing")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("cookieConsent.marketingDescription")}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={marketing}
                  aria-label={t("cookieConsent.marketing")}
                  onClick={() => setMarketing((prev) => !prev)}
                  className={cn(
                    "ml-3 flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    marketing ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      marketing ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </label>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSavePreferences}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              style={{ minHeight: "44px" }}
            >
              {t("cookieConsent.savePreferences")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
