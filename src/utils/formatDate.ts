/**
 * Locale-aware date formatting utilities for the multi-language FeastQR app.
 * Uses Intl.DateTimeFormat for proper localization (en, fr, ar).
 */

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-MA", // Moroccan Arabic
};

function getLocale(language?: string): string {
  return LOCALE_MAP[language ?? "en"] ?? "en-US";
}

/**
 * Format a date as a short date string (e.g., "Jan 15, 2024" or "15 janv. 2024")
 */
export function formatDate(
  date: Date | string,
  language?: string,
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(getLocale(language), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Format a date as a long date string (e.g., "January 15, 2024")
 */
export function formatDateLong(
  date: Date | string,
  language?: string,
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(getLocale(language), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Format a date with time (e.g., "Jan 15, 2024, 2:30 PM")
 */
export function formatDateTime(
  date: Date | string,
  language?: string,
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(getLocale(language), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format a relative time string (e.g., "2 hours ago", "il y a 2 heures")
 */
export function formatRelativeTime(
  date: Date | string,
  language?: string,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(getLocale(language), {
    numeric: "auto",
  });

  if (diffSeconds < 60) return rtf.format(-diffSeconds, "second");
  if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  if (diffDays < 30) return rtf.format(-diffDays, "day");

  // Fall back to formatted date for older dates
  return formatDate(d, language);
}

/**
 * Format a price/currency for the given locale
 */
export function formatCurrency(
  amountInCents: number,
  currency = "MAD",
  language?: string,
): string {
  const amount = amountInCents / 100;

  try {
    return new Intl.NumberFormat(getLocale(language), {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies
    return `${amount.toFixed(2)} ${currency}`;
  }
}
