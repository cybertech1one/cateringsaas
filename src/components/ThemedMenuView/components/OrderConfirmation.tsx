"use client";

import { useTranslation } from "react-i18next";

// ── Animated Checkmark SVG ───────────────────────────────────

function AnimatedCheckmark() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes orderCheckCircle {
  0% { stroke-dashoffset: 166; }
  100% { stroke-dashoffset: 0; }
}
@keyframes orderCheckMark {
  0% { stroke-dashoffset: 48; }
  100% { stroke-dashoffset: 0; }
}
@keyframes orderCheckScale {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
.order-check-container {
  animation: orderCheckScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.order-check-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: orderCheckCircle 0.6s 0.2s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}
.order-check-mark {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: orderCheckMark 0.3s 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}
`,
        }}
      />
      <div
        className="order-check-container"
        style={{
          width: "80px",
          height: "80px",
          margin: "0 auto",
        }}
      >
        <svg
          viewBox="0 0 52 52"
          width="80"
          height="80"
          aria-hidden="true"
        >
          <circle
            className="order-check-circle"
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke="var(--menu-primary)"
            strokeWidth="2"
          />
          <path
            className="order-check-mark"
            fill="none"
            stroke="var(--menu-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
          />
        </svg>
      </div>
    </>
  );
}

// ── Component ────────────────────────────────────────────────

export function OrderConfirmation({
  orderNumber,
  orderId,
  onOrderMore,
  onClose: _onClose,
}: {
  orderNumber: number;
  orderId?: string;
  onOrderMore: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  // Estimate wait time: 10-25 minutes
  const estimatedMinutes = 15;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 32px",
        textAlign: "center",
        minHeight: "360px",
      }}
    >
      {/* Animated checkmark */}
      <AnimatedCheckmark />

      {/* Title */}
      <h2
        style={{
          fontFamily: "var(--menu-heading-font)",
          fontSize: "var(--menu-font-2xl)",
          fontWeight: 700,
          color: "var(--menu-text)",
          margin: "24px 0 8px",
        }}
      >
        {t("ordering.orderSent")}
      </h2>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-base)",
          color: "var(--menu-muted)",
          margin: "0 0 20px",
          maxWidth: "280px",
          lineHeight: 1.5,
        }}
      >
        {t("ordering.orderSentDescription")}
      </p>

      {/* Order number */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          borderRadius: "12px",
          backgroundColor: "var(--menu-surface)",
          border: "1px solid var(--menu-border)",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            fontSize: "var(--menu-font-lg)",
            fontWeight: 700,
            color: "var(--menu-primary)",
            fontFamily: "var(--menu-heading-font)",
          }}
        >
          {t("ordering.orderNumber", { number: orderNumber })}
        </span>
      </div>

      {/* Estimated wait */}
      <p
        style={{
          fontSize: "var(--menu-font-sm)",
          color: "var(--menu-muted)",
          margin: "0 0 24px",
        }}
      >
        {t("ordering.estimatedWait", { minutes: estimatedMinutes })}
      </p>

      {/* Track Your Order link */}
      {orderId && (
        <a
          href={`/order/${orderId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            maxWidth: "280px",
            padding: "12px 24px",
            borderRadius: "14px",
            border: "2px solid var(--menu-primary)",
            backgroundColor: "transparent",
            color: "var(--menu-primary)",
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "center",
            textDecoration: "none",
            marginBottom: "12px",
            transition: "all 0.15s ease",
          }}
        >
          {t("cart.trackOrder")}
        </a>
      )}

      {/* Order More button */}
      <button
        type="button"
        onClick={onOrderMore}
        style={{
          width: "100%",
          maxWidth: "280px",
          padding: "14px 24px",
          borderRadius: "14px",
          border: "none",
          backgroundColor: "var(--menu-primary)",
          color: "var(--menu-surface)",
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-base)",
          fontWeight: 700,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          minHeight: "48px",
          transition: "opacity 0.15s ease",
        }}
      >
        {t("ordering.orderMore")}
      </button>

      {/* Safe area padding */}
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}
