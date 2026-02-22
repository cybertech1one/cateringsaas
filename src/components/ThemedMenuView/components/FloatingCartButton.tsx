"use client";

import { useTranslation } from "react-i18next";

import { useCart } from "./CartProvider";
import { formatPrice, getCurrencySymbol } from "../utils";

// ── SVG Icons ────────────────────────────────────────────────

function ShoppingBagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Keyframe Styles ──────────────────────────────────────────

export function FloatingCartStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes cartBarSlideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes cartBadgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
.cart-bar-enter {
  animation: cartBarSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.cart-badge-pulse {
  animation: cartBadgePulse 0.3s ease-out;
}
`,
      }}
    />
  );
}

// ── Persistent Bottom Cart Bar ──────────────────────────────
// Universal pattern: Uber Eats, DoorDash, me&u, Sunday

export function FloatingCartButton() {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const { totalItems, totalPrice, setIsOpen, lastAddedKey, currency } = useCart();

  if (totalItems === 0) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div
      className="cart-bar-enter"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        backgroundColor: "rgba(0,0,0,0.03)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`View cart with ${totalItems} item${totalItems !== 1 ? "s" : ""}, total ${formatPrice(totalPrice)} ${currencySymbol}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "640px",
          margin: "0 auto",
          padding: "14px 20px",
          borderRadius: "var(--menu-radius-lg, 16px)",
          border: "none",
          backgroundColor: "var(--menu-primary)",
          color: "#FFFFFF",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1)",
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-base)",
          fontWeight: 600,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          transition: "transform 0.15s ease, box-shadow 0.2s ease",
          minHeight: "52px",
        }}
      >
        {/* Left: Icon + badge */}
        <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <ShoppingBagIcon />
          <span
            className={lastAddedKey ? "cart-badge-pulse" : ""}
            style={{
              position: "absolute",
              top: "-8px",
              right: "-10px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              color: "var(--menu-primary)",
              fontSize: "11px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {totalItems > 9 ? "9+" : totalItems}
          </span>
        </span>

        {/* Center: "View Cart" text */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            letterSpacing: "0.3px",
          }}
        >
          {t("ordering.viewCart")}
          <ChevronRightIcon />
        </span>

        {/* Right: Total price */}
        <span style={{ fontWeight: 700, letterSpacing: "0.2px" }}>
          {formatPrice(totalPrice)} {currencySymbol}
        </span>
      </button>
    </div>
  );
}
