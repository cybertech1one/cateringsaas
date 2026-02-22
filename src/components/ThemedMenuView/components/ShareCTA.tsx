"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { InlineShareButtons } from "./ShareMenu";

// ── Close Icon ──────────────────────────────────────────────

function CloseSmallIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── CTA Banner ──────────────────────────────────────────────

const DISMISSED_KEY = "feastqr_share_cta_dismissed";

interface ShareCTABannerProps {
  menuName: string;
  menuSlug: string;
}

export const ShareCTABanner = memo(function ShareCTABanner({ menuName, menuSlug }: ShareCTABannerProps) {
  const [visible, setVisible] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_KEY);

      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "relative",
        margin: "0 20px 24px",
        padding: "20px",
        borderRadius: "16px",
        backgroundColor: "var(--menu-surface, #fff)",
        border: "1px solid var(--menu-border, #e5e5e5)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        animation: "fadeInUp 400ms ease-out",
      }}
      role="complementary"
      aria-label="Share this menu"
    >
      {/* Inject animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`,
        }}
      />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss share banner"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--menu-muted)",
          padding: "4px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 150ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--menu-text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--menu-muted)";
        }}
      >
        <CloseSmallIcon />
      </button>

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          textAlign: "center",
          paddingRight: "16px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-base)",
            fontWeight: 600,
            color: "var(--menu-text)",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Enjoying the menu? Share it with friends!
        </p>

        <InlineShareButtons menuName={menuName} menuSlug={menuSlug} />
      </div>
    </div>
  );
});
