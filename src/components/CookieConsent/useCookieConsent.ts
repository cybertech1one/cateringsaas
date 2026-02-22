"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "feastqr_cookie_consent";
const CONSENT_VERSION_KEY = "feastqr_consent_version";

export const CURRENT_CONSENT_VERSION = 1;

export interface CookieConsentState {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  version: number;
}

export function useCookieConsent(): CookieConsentState | null {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      const storedVersion = localStorage.getItem(CONSENT_VERSION_KEY);

      if (!stored || !storedVersion) {
        setConsent(null);

        return;
      }

      const version = parseInt(storedVersion, 10);

      if (version !== CURRENT_CONSENT_VERSION) {
        setConsent(null);

        return;
      }

      const parsed = JSON.parse(stored) as CookieConsentState;

      setConsent(parsed);
    } catch {
      setConsent(null);
    }
  }, []);

  return consent;
}
