"use client";

import { useTranslation } from "react-i18next";

// ── SVG Icons ────────────────────────────────────────────────

function BanknotesIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  );
}

// ── Types ────────────────────────────────────────────────────

interface PaymentMethodSelectorProps {
  selected: string;
  onSelect: (method: string) => void;
}

interface PaymentOption {
  id: string;
  labelKey: string;
  descKey: string;
  icon: React.ReactNode;
  disabled: boolean;
  comingSoon: boolean;
}

// ── Component ────────────────────────────────────────────────

export function PaymentMethodSelector({
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string) => string;

  const options: PaymentOption[] = [
    {
      id: "cash",
      labelKey: "payment.cashOnDelivery",
      descKey: "payment.cashOnDeliveryDesc",
      icon: <BanknotesIcon />,
      disabled: false,
      comingSoon: false,
    },
    {
      id: "card",
      labelKey: "payment.cardPayment",
      descKey: "payment.cardPaymentDesc",
      icon: <CreditCardIcon />,
      disabled: true,
      comingSoon: true,
    },
    {
      id: "mobile_wallet",
      labelKey: "payment.mobileWallet",
      descKey: "payment.mobileWalletDesc",
      icon: <WalletIcon />,
      disabled: true,
      comingSoon: true,
    },
  ];

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const headingStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--menu-font-sm)",
    fontWeight: 600,
    marginBottom: "4px",
    color: "var(--menu-text)",
  };

  return (
    <div style={containerStyle}>
      <span style={headingStyle}>{t("payment.selectMethod")}</span>

      {options.map((option) => {
        const isSelected = selected === option.id;

        const cardStyle: React.CSSProperties = {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 14px",
          borderRadius: "10px",
          border: isSelected
            ? "2px solid var(--menu-primary)"
            : "1px solid var(--menu-border)",
          backgroundColor: isSelected
            ? "rgba(var(--menu-primary-rgb, 0, 0, 0), 0.04)"
            : "var(--menu-surface)",
          cursor: option.disabled ? "not-allowed" : "pointer",
          opacity: option.disabled ? 0.55 : 1,
          transition: "border-color 0.15s ease, background-color 0.15s ease",
          position: "relative",
          overflow: "hidden",
          WebkitTapHighlightColor: "transparent",
        };

        const radioOuterStyle: React.CSSProperties = {
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: isSelected
            ? "2px solid var(--menu-primary)"
            : "2px solid var(--menu-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "border-color 0.15s ease",
        };

        const radioInnerStyle: React.CSSProperties = {
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: isSelected ? "var(--menu-primary)" : "transparent",
          transition: "background-color 0.15s ease",
        };

        const iconStyle: React.CSSProperties = {
          flexShrink: 0,
          color: isSelected ? "var(--menu-primary)" : "var(--menu-muted)",
          transition: "color 0.15s ease",
        };

        const labelTextStyle: React.CSSProperties = {
          fontSize: "var(--menu-font-base)",
          fontWeight: 600,
          color: "var(--menu-text)",
          margin: 0,
          lineHeight: 1.3,
        };

        const descTextStyle: React.CSSProperties = {
          fontSize: "12px",
          color: "var(--menu-muted)",
          margin: "2px 0 0",
          lineHeight: 1.3,
        };

        const badgeStyle: React.CSSProperties = {
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--menu-primary)",
          backgroundColor: "rgba(var(--menu-primary-rgb, 0, 0, 0), 0.08)",
          padding: "2px 8px",
          borderRadius: "10px",
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        };

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={option.disabled}
            disabled={option.disabled}
            onClick={() => {
              if (!option.disabled) {
                onSelect(option.id);
              }
            }}
            style={cardStyle}
          >
            {/* Radio indicator */}
            <div style={radioOuterStyle}>
              <div style={radioInnerStyle} />
            </div>

            {/* Icon */}
            <div style={iconStyle}>{option.icon}</div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={labelTextStyle}>{t(option.labelKey)}</p>
              <p style={descTextStyle}>{t(option.descKey)}</p>
            </div>

            {/* Coming soon badge */}
            {option.comingSoon && (
              <span style={badgeStyle}>{t("payment.comingSoon")}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
