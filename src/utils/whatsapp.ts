/**
 * Diyafa -- WhatsApp Integration Utilities
 *
 * Morocco's #1 business channel. WhatsApp links are first-class,
 * not a fallback. All links use the wa.me deep-link format which
 * works on mobile (opens app) and desktop (opens WhatsApp Web).
 */

// ── Types ────────────────────────────────────────────────────────

export interface CateringInquiryParams {
  /** The caterer's WhatsApp number (E.164 format, e.g. "+212612345678") */
  phone: string;
  /** Name of the catering organization */
  orgName: string;
  /** Type of event (e.g. "Wedding", "Corporate", "Ramadan Iftar") */
  eventType?: string;
  /** Estimated number of guests */
  guestCount?: number;
  /** Event date as a display string (e.g. "2026-04-15") */
  eventDate?: string;
  /** Optional extra message from the client */
  additionalMessage?: string;
}

export interface WhatsAppLinkParams {
  /** Phone number in E.164 format (with country code, no spaces/dashes) */
  phone: string;
  /** Pre-filled message text (will be URL-encoded) */
  message?: string;
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Strip a phone number of all formatting characters and ensure
 * it starts with the country code (no leading "+").
 *
 * wa.me expects the number WITHOUT the "+" prefix.
 *
 * Examples:
 *   "+212 6 12 34 56 78" -> "212612345678"
 *   "0612345678"         -> "212612345678" (assumes Morocco)
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If it starts with "00" (international prefix), strip it
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // If it starts with "0" (local Moroccan), replace with "212"
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "212" + digits.slice(1);
  }

  return digits;
}

// ── Link Generators ──────────────────────────────────────────────

/**
 * Generate a basic WhatsApp deep link.
 *
 * @see https://faq.whatsapp.com/5913398998672934
 */
export function generateWhatsAppLink(params: WhatsAppLinkParams): string {
  const phone = normalizePhoneForWhatsApp(params.phone);
  const base = `https://wa.me/${phone}`;

  if (!params.message) return base;

  return `${base}?text=${encodeURIComponent(params.message)}`;
}

/**
 * Generate a WhatsApp link with a pre-formatted catering inquiry message.
 *
 * The message is professional but conversational -- matching how
 * Moroccan clients actually message caterers on WhatsApp.
 */
export function generateCateringInquiryLink(
  params: CateringInquiryParams,
): string {
  const lines: string[] = [];

  lines.push(`Hello! I'm interested in catering services from ${params.orgName}.`);
  lines.push("");

  if (params.eventType || params.eventDate || params.guestCount) {
    lines.push("Event details:");

    if (params.eventType) {
      lines.push(`  - Event type: ${params.eventType}`);
    }
    if (params.eventDate) {
      lines.push(`  - Date: ${params.eventDate}`);
    }
    if (params.guestCount) {
      lines.push(`  - Guests: ${params.guestCount}`);
    }

    lines.push("");
  }

  lines.push("Can you provide a quote?");

  if (params.additionalMessage) {
    lines.push("");
    lines.push(params.additionalMessage);
  }

  return generateWhatsAppLink({
    phone: params.phone,
    message: lines.join("\n"),
  });
}

/**
 * Generate a simple "Hello, I'd like to inquire about your catering services"
 * link when no event details are available yet.
 */
export function generateSimpleInquiryLink(phone: string, orgName: string): string {
  return generateWhatsAppLink({
    phone,
    message: `Hello! I'm interested in catering services from ${orgName}. Can you share more about your offerings and availability?`,
  });
}
