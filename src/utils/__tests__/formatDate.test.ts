import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
} from "../formatDate";

/**
 * Tests for locale-aware date formatting utilities.
 *
 * formatDate / formatDateLong / formatDateTime are deterministic given a fixed
 * date, so we test with known dates. formatRelativeTime depends on "now", so
 * we use vi.useFakeTimers to pin the clock.
 */

// Pin the clock for all relative-time tests.
const NOW = new Date("2025-03-15T14:30:00Z");

describe("formatDate", () => {
  // Use noon UTC so the day is stable across all timezones (UTC-12 to UTC+14).
  it("formats a Date object with default (English) locale", () => {
    const result = formatDate(new Date("2024-01-15T12:00:00Z"));

    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("accepts a date string", () => {
    const result = formatDate("2024-06-20T12:00:00Z");

    expect(result).toContain("Jun");
    expect(result).toContain("2024");
  });

  it("formats with French locale", () => {
    const result = formatDate(new Date("2024-01-15T12:00:00Z"), "fr");

    // French uses "janv." for January
    expect(result).toContain("janv.");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("formats with Arabic (Moroccan) locale", () => {
    const result = formatDate(new Date("2024-01-15T12:00:00Z"), "ar");

    // Arabic locale should contain the year
    expect(result).toContain("2024");
  });

  it("falls back to en-US for unknown locale code", () => {
    const result = formatDate(new Date("2024-01-15T12:00:00Z"), "xx");

    // Should use en-US fallback
    expect(result).toContain("Jan");
    expect(result).toContain("2024");
  });

  it("formats dates at year boundaries correctly", () => {
    const result = formatDate(new Date("2024-12-31T12:00:00Z"));

    expect(result).toContain("2024");
  });
});

describe("formatDateLong", () => {
  it("uses full month name in English", () => {
    const result = formatDateLong(new Date("2024-03-10T12:00:00Z"));

    expect(result).toContain("March");
    expect(result).toContain("10");
    expect(result).toContain("2024");
  });

  it("uses full month name in French", () => {
    const result = formatDateLong(new Date("2024-03-10T12:00:00Z"), "fr");

    expect(result).toContain("mars");
    expect(result).toContain("2024");
  });

  it("accepts a date string", () => {
    const result = formatDateLong("2024-11-25T12:00:00Z");

    expect(result).toContain("November");
    expect(result).toContain("25");
    expect(result).toContain("2024");
  });
});

describe("formatDateTime", () => {
  it("includes time in English", () => {
    const result = formatDateTime(new Date("2024-01-15T14:30:00Z"));

    // Should contain both date and time parts
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
    // Time component (exact format depends on locale/timezone)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("includes time in French", () => {
    const result = formatDateTime(new Date("2024-01-15T14:30:00Z"), "fr");

    expect(result).toContain("janv.");
    expect(result).toContain("2024");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("accepts a date string", () => {
    const result = formatDateTime("2024-07-04T09:15:00Z");

    expect(result).toContain("Jul");
    expect(result).toContain("2024");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows 'just now' or seconds-based text for very recent dates", () => {
    const fiveSecondsAgo = new Date(NOW.getTime() - 5_000);
    const result = formatRelativeTime(fiveSecondsAgo);

    // Intl.RelativeTimeFormat with numeric: "auto" may say "5 seconds ago"
    // or similar depending on the exact count
    expect(result).toMatch(/second|now/i);
  });

  it("shows minutes ago for dates within the last hour", () => {
    const tenMinutesAgo = new Date(NOW.getTime() - 10 * 60_000);
    const result = formatRelativeTime(tenMinutesAgo);

    expect(result).toMatch(/10 minutes ago/i);
  });

  it("shows hours ago for dates within the last day", () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 3_600_000);
    const result = formatRelativeTime(threeHoursAgo);

    expect(result).toMatch(/3 hours ago/i);
  });

  it("shows days ago for dates within the last month", () => {
    const fiveDaysAgo = new Date(NOW.getTime() - 5 * 86_400_000);
    const result = formatRelativeTime(fiveDaysAgo);

    expect(result).toMatch(/5 days ago/i);
  });

  it("falls back to formatted date for dates older than 30 days", () => {
    const sixtyDaysAgo = new Date(NOW.getTime() - 60 * 86_400_000);
    const result = formatRelativeTime(sixtyDaysAgo);

    // Should fall back to formatDate output (short date, e.g. "Jan 14, 2025")
    expect(result).toContain("Jan");
    expect(result).toContain("2025");
  });

  it("formats relative time in French", () => {
    const tenMinutesAgo = new Date(NOW.getTime() - 10 * 60_000);
    const result = formatRelativeTime(tenMinutesAgo, "fr");

    // French: "il y a 10 minutes"
    expect(result).toMatch(/il y a 10 minutes/i);
  });

  it("handles 0 seconds ago", () => {
    const result = formatRelativeTime(NOW);

    // Should say "now" or "0 seconds ago"
    expect(result).toMatch(/now|0 second/i);
  });

  it("handles exactly 1 minute ago", () => {
    const oneMinuteAgo = new Date(NOW.getTime() - 60_000);
    const result = formatRelativeTime(oneMinuteAgo);

    expect(result).toMatch(/1 minute ago/i);
  });

  it("handles exactly 1 hour ago", () => {
    const oneHourAgo = new Date(NOW.getTime() - 3_600_000);
    const result = formatRelativeTime(oneHourAgo);

    expect(result).toMatch(/1 hour ago/i);
  });

  it("handles exactly 1 day ago", () => {
    const oneDayAgo = new Date(NOW.getTime() - 86_400_000);
    const result = formatRelativeTime(oneDayAgo);

    expect(result).toMatch(/yesterday|1 day ago/i);
  });

  it("accepts a date string", () => {
    const tenMinutesAgoStr = new Date(NOW.getTime() - 10 * 60_000).toISOString();
    const result = formatRelativeTime(tenMinutesAgoStr);

    expect(result).toMatch(/10 minutes ago/i);
  });
});

describe("formatCurrency", () => {
  it("formats MAD currency with default locale", () => {
    const result = formatCurrency(3500);

    // 35.00 in Moroccan Dirham
    expect(result).toContain("35.00");
    // Should contain the MAD symbol or code
    expect(result).toMatch(/MAD/);
  });

  it("formats zero cents correctly", () => {
    const result = formatCurrency(0);

    expect(result).toContain("0.00");
  });

  it("formats USD currency", () => {
    const result = formatCurrency(1999, "USD");

    // $19.99 or 19.99 USD
    expect(result).toMatch(/19\.99/);
    expect(result).toMatch(/\$|USD/);
  });

  it("formats EUR currency", () => {
    const result = formatCurrency(4999, "EUR");

    expect(result).toMatch(/49\.99/);
    // Euro symbol or EUR code
    expect(result).toMatch(/\u20AC|EUR/);
  });

  it("converts cents to dollars correctly for small amounts", () => {
    const result = formatCurrency(1, "USD");

    expect(result).toMatch(/0\.01/);
  });

  it("converts cents to dollars correctly for large amounts", () => {
    const result = formatCurrency(999999, "USD");

    expect(result).toMatch(/9,?999\.99/);
  });

  it("formats with French locale", () => {
    const result = formatCurrency(2500, "EUR", "fr");

    // French uses space as thousands separator and comma as decimal
    // e.g., "25,00 EUR" or "25,00 \u20AC"
    expect(result).toMatch(/25[,.]00/);
  });

  it("formats with Arabic locale", () => {
    const result = formatCurrency(5000, "MAD", "ar");

    // Should still represent 50.00
    // Arabic may use different numeral system, but the value is the same
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("uses fallback for unsupported currency code", () => {
    const result = formatCurrency(1500, "XYZ");

    // Should use the fallback: "15.00 XYZ"
    expect(result).toContain("15.00");
    expect(result).toContain("XYZ");
  });

  it("always shows two decimal places", () => {
    const result = formatCurrency(1000, "USD");

    expect(result).toMatch(/10\.00/);
  });

  it("handles negative amounts gracefully", () => {
    const result = formatCurrency(-500, "USD");

    expect(result).toMatch(/5\.00/);
  });
});
