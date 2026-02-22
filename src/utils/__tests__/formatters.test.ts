import { describe, expect, it } from "vitest";
import {
  capitalize,
  formatDate,
  getPromotionStatus,
  toDateInputValue,
} from "~/pageComponents/Promotions/types";
import type { Promotion } from "~/pageComponents/Promotions/types";

/**
 * Tests for the formatting and status helper functions
 * defined alongside the Promotions types.
 */

// Helper: create a Promotion object with sensible defaults
function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: "promo-1",
    restaurantId: "rest-1",
    title: "Test Promo",
    description: null,
    promotionType: "discount",
    discountPercent: null,
    discountAmount: null,
    startDate: new Date("2025-01-01"),
    endDate: null,
    isActive: true,
    applicableDays: [],
    startTime: null,
    endTime: null,
    menuId: null,
    dishId: null,
    categoryId: null,
    imageUrl: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

// ── capitalize ────────────────────────────────────────────────

describe("capitalize", () => {
  it("should capitalize the first letter of a lowercase word", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("should leave an already-capitalized word unchanged", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("should return an empty string for empty input", () => {
    expect(capitalize("")).toBe("");
  });

  it("should handle a single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("should capitalize only the first letter and keep the rest intact", () => {
    expect(capitalize("hELLO wORLD")).toBe("HELLO wORLD");
  });

  it("should handle strings starting with a number", () => {
    expect(capitalize("123abc")).toBe("123abc");
  });

  it("should handle strings starting with special characters", () => {
    expect(capitalize("@test")).toBe("@test");
  });
});

// ── formatDate ────────────────────────────────────────────────

describe("formatDate", () => {
  it("should return a formatted date string from a Date object", () => {
    // Use UTC noon to avoid timezone-shift issues
    const result = formatDate(new Date("2025-06-15T12:00:00.000Z"));

    // The formatted string should contain the year and month
    expect(result).toContain("2025");
    expect(result).toContain("Jun");
  });

  it("should accept a string date", () => {
    const result = formatDate("2025-12-25");

    expect(result).toContain("2025");
    expect(result).toContain("25");
  });

  it("should return a non-empty string", () => {
    const result = formatDate(new Date());

    expect(result.length).toBeGreaterThan(0);
  });

  it("should format different dates differently", () => {
    const a = formatDate("2025-01-01");
    const b = formatDate("2025-12-31");

    expect(a).not.toBe(b);
  });
});

// ── toDateInputValue ──────────────────────────────────────────

describe("toDateInputValue", () => {
  it("should return YYYY-MM-DD format from a Date object", () => {
    // Use a specific UTC date to avoid timezone issues
    const result = toDateInputValue(new Date("2025-06-15T00:00:00.000Z"));

    expect(result).toBe("2025-06-15");
  });

  it("should return YYYY-MM-DD format from an ISO string", () => {
    const result = toDateInputValue("2025-12-25T00:00:00.000Z");

    expect(result).toBe("2025-12-25");
  });

  it("should return a string of length 10 (YYYY-MM-DD)", () => {
    const result = toDateInputValue(new Date("2025-03-05T12:00:00.000Z"));

    expect(result).toHaveLength(10);
  });

  it("should pad single-digit months and days with zeros", () => {
    const result = toDateInputValue("2025-01-05T00:00:00.000Z");

    expect(result).toBe("2025-01-05");
  });

  it("should handle year boundaries", () => {
    const result = toDateInputValue("2026-01-01T00:00:00.000Z");

    expect(result).toBe("2026-01-01");
  });
});

// ── getPromotionStatus ────────────────────────────────────────

describe("getPromotionStatus", () => {
  it("should return 'expired' when isActive is false", () => {
    const promo = makePromotion({ isActive: false });

    expect(getPromotionStatus(promo)).toBe("expired");
  });

  it("should return 'expired' when isActive is false even if dates are current", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 86_400_000);
    const past = new Date(now.getTime() - 86_400_000);
    const promo = makePromotion({
      isActive: false,
      startDate: past,
      endDate: future,
    });

    expect(getPromotionStatus(promo)).toBe("expired");
  });

  it("should return 'scheduled' when startDate is in the future", () => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const promo = makePromotion({ startDate: tomorrow });

    expect(getPromotionStatus(promo)).toBe("scheduled");
  });

  it("should return 'expired' when endDate is in the past", () => {
    const pastStart = new Date(Date.now() - 86_400_000 * 10);
    const pastEnd = new Date(Date.now() - 86_400_000);
    const promo = makePromotion({
      startDate: pastStart,
      endDate: pastEnd,
    });

    expect(getPromotionStatus(promo)).toBe("expired");
  });

  it("should return 'active' when started and no endDate", () => {
    const past = new Date(Date.now() - 86_400_000);
    const promo = makePromotion({ startDate: past, endDate: null });

    expect(getPromotionStatus(promo)).toBe("active");
  });

  it("should return 'active' when started and endDate in the future", () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000 * 30);
    const promo = makePromotion({ startDate: past, endDate: future });

    expect(getPromotionStatus(promo)).toBe("active");
  });

  it("should prioritize isActive=false over future scheduling", () => {
    const future = new Date(Date.now() + 86_400_000 * 30);
    const promo = makePromotion({ isActive: false, startDate: future });

    // isActive false is checked first, returns "expired"
    expect(getPromotionStatus(promo)).toBe("expired");
  });

  it("should prioritize scheduled over active when start is future", () => {
    const farFuture = new Date(Date.now() + 86_400_000 * 365);
    const promo = makePromotion({
      isActive: true,
      startDate: farFuture,
      endDate: null,
    });

    expect(getPromotionStatus(promo)).toBe("scheduled");
  });
});
