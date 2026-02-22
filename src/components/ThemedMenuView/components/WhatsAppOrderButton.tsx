"use client";

import { useCallback, useMemo } from "react";
import { type CartItem } from "./CartProvider";
import { formatPrice } from "../utils";

// ── Types ────────────────────────────────────────────────────

export interface WhatsAppOrderButtonProps {
  /** Restaurant display name */
  menuName: string;
  /** WhatsApp number in any format -- will be normalized */
  whatsappNumber: string;
  /** Cart items to include in the order message */
  cartItems: CartItem[];
  /** Currency code, e.g. "MAD" */
  currency: string;
  /** Optional table number */
  tableNumber?: string;
  /** Optional customer name */
  customerName?: string;
  /** Size variant */
  variant?: "full" | "compact";
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Normalize a phone number to international format without +, spaces, or dashes.
 * e.g. "+212 600-123 456" -> "212600123456"
 */
function normalizePhoneNumber(phone: string): string {
  // Strip everything except digits
  let digits = phone.replace(/[^\d]/g, "");

  // If the number starts with "00", strip the leading "00" (alt international prefix)
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  return digits;
}

/**
 * Build the WhatsApp order message text from cart items.
 */
function buildOrderMessage({
  menuName,
  cartItems,
  currency,
  tableNumber,
  customerName,
}: {
  menuName: string;
  cartItems: CartItem[];
  currency: string;
  tableNumber?: string;
  customerName?: string;
}): string {
  const lines: string[] = [];

  // Header
  lines.push(`\uD83C\uDF7D\uFE0F New Order from ${menuName}`);
  lines.push("");

  // Order details
  lines.push("\uD83D\uDCCB Order Details:");

  for (const item of cartItems) {
    const displayName = item.variantName
      ? `${item.name} (${item.variantName})`
      : item.name;
    const itemTotal = formatPrice(item.price * item.quantity);

    lines.push(
      `\u2022 ${item.quantity}x ${displayName} - ${itemTotal} ${currency}`,
    );

    if (item.notes) {
      lines.push(`  \u2514 Note: ${item.notes}`);
    }
  }

  lines.push("");

  // Total
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  lines.push(`\uD83D\uDCB0 Total: ${formatPrice(total)} ${currency}`);

  // Table number
  if (tableNumber) {
    lines.push(`\uD83E\uDE91 Table: ${tableNumber}`);
  }

  // Customer name
  if (customerName) {
    lines.push(`\uD83D\uDC64 Name: ${customerName}`);
  }

  lines.push("");
  lines.push("Sent via FeastQR");

  return lines.join("\n");
}

// ── WhatsApp SVG Icon ────────────────────────────────────────

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────

export function WhatsAppOrderButton({
  menuName,
  whatsappNumber,
  cartItems,
  currency,
  tableNumber,
  customerName,
  variant = "full",
}: WhatsAppOrderButtonProps) {
  const normalizedNumber = useMemo(
    () => normalizePhoneNumber(whatsappNumber),
    [whatsappNumber],
  );

  const whatsappUrl = useMemo(() => {
    if (!normalizedNumber || cartItems.length === 0) return null;

    const message = buildOrderMessage({
      menuName,
      cartItems,
      currency,
      tableNumber,
      customerName,
    });

    return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
  }, [normalizedNumber, menuName, cartItems, currency, tableNumber, customerName]);

  const handleClick = useCallback(() => {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [whatsappUrl]);

  const isDisabled = !whatsappUrl || cartItems.length === 0;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Order via WhatsApp"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "var(--menu-radius, 8px)",
          border: "none",
          backgroundColor: isDisabled ? "#ccc" : "#25D366",
          color: "#FFFFFF",
          cursor: isDisabled ? "not-allowed" : "pointer",
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-sm)",
          fontWeight: 600,
          transition: "background-color 0.15s ease, transform 0.1s ease",
          opacity: isDisabled ? 0.6 : 1,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        <WhatsAppIcon size={18} />
        <span>WhatsApp</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Order via WhatsApp"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "14px 24px",
        borderRadius: "var(--menu-radius, 8px)",
        border: "none",
        backgroundColor: isDisabled ? "#ccc" : "#25D366",
        color: "#FFFFFF",
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: "var(--menu-body-font)",
        fontSize: "var(--menu-font-base)",
        fontWeight: 600,
        transition: "background-color 0.15s ease, transform 0.1s ease",
        opacity: isDisabled ? 0.6 : 1,
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        minHeight: "48px",
        boxShadow: isDisabled ? "none" : "0 2px 8px rgba(37, 211, 102, 0.3)",
      }}
    >
      <WhatsAppIcon size={22} />
      <span>Order via WhatsApp</span>
    </button>
  );
}

// ── Standalone link component (no cart dependency) ───────────

export interface WhatsAppLinkProps {
  /** WhatsApp number in any format */
  whatsappNumber: string;
  /** Pre-formatted message text */
  message?: string;
  /** Link text override */
  label?: string;
}

/**
 * A simple WhatsApp link that opens with an optional pre-formatted message.
 * For use outside the cart context (e.g., contact links in menu headers).
 */
export function WhatsAppLink({
  whatsappNumber,
  message,
  label = "Chat on WhatsApp",
}: WhatsAppLinkProps) {
  const normalizedNumber = useMemo(
    () => normalizePhoneNumber(whatsappNumber),
    [whatsappNumber],
  );

  const href = useMemo(() => {
    const base = `https://wa.me/${normalizedNumber}`;

    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }, [normalizedNumber, message]);

  if (!normalizedNumber) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: "#25D366",
        textDecoration: "none",
        fontWeight: 500,
        fontSize: "inherit",
        transition: "opacity 0.15s",
      }}
    >
      <WhatsAppIcon size={18} />
      <span>{label}</span>
    </a>
  );
}

// ── Restaurant Notification helpers ──────────────────────────

export interface OrderNotificationDetails {
  orderNumber: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  orderType: string;
  customerName?: string;
  tableNumber?: number;
}

/**
 * Build a notification message for the restaurant owner about a new order.
 * Prices are expected in cents (integer) and formatted to decimal.
 */
export function buildOrderNotificationMessage(
  details: OrderNotificationDetails,
): string {
  const lines: string[] = [];

  lines.push("\uD83D\uDD14 New Order!");
  lines.push(`\uD83D\uDCCB Order #${details.orderNumber}`);
  lines.push("");

  // Order type
  lines.push(`\uD83D\uDCE6 Type: ${details.orderType}`);
  lines.push("");

  // Items
  lines.push("\uD83C\uDF7D\uFE0F Items:");

  for (const item of details.items) {
    const itemTotal = ((item.price * item.quantity) / 100).toFixed(2);

    lines.push(`\u2022 ${item.quantity}x ${item.name} - ${itemTotal}`);
  }

  lines.push("");

  // Total
  const formattedTotal = (details.total / 100).toFixed(2);

  lines.push(`\uD83D\uDCB0 Total: ${formattedTotal}`);

  // Table number
  if (details.tableNumber !== undefined) {
    lines.push(`\uD83E\uDE91 Table: ${details.tableNumber}`);
  }

  // Customer name
  if (details.customerName) {
    lines.push(`\uD83D\uDC64 Customer: ${details.customerName}`);
  }

  lines.push("");
  lines.push("Sent via FeastQR");

  return lines.join("\n");
}

/**
 * Build a WhatsApp notification URL for the restaurant owner.
 * Phone number is normalized (strips +, spaces, dashes, leading 00).
 */
export function buildOrderNotificationUrl(
  phone: string,
  details: OrderNotificationDetails,
): string {
  const normalizedPhone = normalizePhoneNumber(phone);
  const message = buildOrderNotificationMessage(details);

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

// Re-export for convenience
export {
  normalizePhoneNumber,
  buildOrderMessage,
};
