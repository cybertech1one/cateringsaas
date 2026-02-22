import { describe, expect, it } from "vitest";
import {
  formatMoroccanPhone,
  formatPrice,
  formatPriceNumber,
  isValidMoroccanPhone,
} from "../currency";

/**
 * Tests for currency and phone number formatting utilities.
 * Validates price formatting, phone validation, and phone display formatting.
 */

describe("currency utilities", () => {
  describe("formatPrice", () => {
    it("should format price in cents to MAD currency by default", () => {
      const result = formatPrice(1999);

      expect(result).toBe("19.99 د.م.");
    });

    it("should format zero correctly", () => {
      const result = formatPrice(0);

      expect(result).toBe("0.00 د.م.");
    });

    it("should format large amounts correctly", () => {
      const result = formatPrice(999999);

      expect(result).toBe("9999.99 د.م.");
    });

    it("should format single digit cents correctly", () => {
      const result = formatPrice(1005);

      expect(result).toBe("10.05 د.م.");
    });

    it("should format with custom currency code", () => {
      const result = formatPrice(2500, "USD");

      expect(result).toBe("25.00 USD");
    });

    it("should format with EUR currency", () => {
      const result = formatPrice(4999, "EUR");

      expect(result).toBe("49.99 EUR");
    });

    it("should handle round dollar amounts", () => {
      const result = formatPrice(10000);

      expect(result).toBe("100.00 د.م.");
    });

    it("should always show two decimal places", () => {
      const result = formatPrice(1500);

      expect(result).toBe("15.00 د.م.");
    });

    it("should handle very small amounts", () => {
      const result = formatPrice(1);

      expect(result).toBe("0.01 د.م.");
    });

    it("should handle 99 cents", () => {
      const result = formatPrice(99);

      expect(result).toBe("0.99 د.م.");
    });
  });

  describe("formatPriceNumber", () => {
    it("should format price as number string without currency", () => {
      const result = formatPriceNumber(1999);

      expect(result).toBe("19.99");
    });

    it("should format zero correctly", () => {
      const result = formatPriceNumber(0);

      expect(result).toBe("0.00");
    });

    it("should format large amounts correctly", () => {
      const result = formatPriceNumber(123456);

      expect(result).toBe("1234.56");
    });

    it("should always show two decimal places", () => {
      const result = formatPriceNumber(1000);

      expect(result).toBe("10.00");
    });

    it("should handle single digit cents", () => {
      const result = formatPriceNumber(505);

      expect(result).toBe("5.05");
    });

    it("should format as plain number suitable for input fields", () => {
      const result = formatPriceNumber(2550);

      expect(result).toBe("25.50");
      expect(result).not.toContain("د.م.");
      expect(result).not.toContain("MAD");
    });
  });

  describe("isValidMoroccanPhone", () => {
    it("should accept valid phone number with +212 prefix", () => {
      const result = isValidMoroccanPhone("+212612345678");

      expect(result).toBe(true);
    });

    it("should accept valid phone number with 0 prefix", () => {
      const result = isValidMoroccanPhone("0612345678");

      expect(result).toBe(true);
    });

    it("should reject phone number without correct prefix", () => {
      const result = isValidMoroccanPhone("612345678");

      expect(result).toBe(false);
    });

    it("should reject phone number with too few digits", () => {
      const result = isValidMoroccanPhone("+21261234567");

      expect(result).toBe(false);
    });

    it("should reject phone number with too many digits", () => {
      const result = isValidMoroccanPhone("+2126123456789");

      expect(result).toBe(false);
    });

    it("should reject phone number with letters", () => {
      const result = isValidMoroccanPhone("+212abc345678");

      expect(result).toBe(false);
    });

    it("should reject empty string", () => {
      const result = isValidMoroccanPhone("");

      expect(result).toBe(false);
    });

    it("should reject phone with spaces", () => {
      const result = isValidMoroccanPhone("+212 612 345 678");

      expect(result).toBe(false);
    });

    it("should reject international format without Morocco code", () => {
      const result = isValidMoroccanPhone("+1234567890");

      expect(result).toBe(false);
    });

    it("should accept different operator prefixes with +212", () => {
      expect(isValidMoroccanPhone("+212612345678")).toBe(true); // Maroc Telecom
      expect(isValidMoroccanPhone("+212712345678")).toBe(true); // Orange
      expect(isValidMoroccanPhone("+212512345678")).toBe(true); // Landline
    });

    it("should accept different operator prefixes with 0", () => {
      expect(isValidMoroccanPhone("0612345678")).toBe(true);
      expect(isValidMoroccanPhone("0712345678")).toBe(true);
      expect(isValidMoroccanPhone("0512345678")).toBe(true);
    });
  });

  describe("formatMoroccanPhone", () => {
    it("should format phone number with +212 prefix", () => {
      const result = formatMoroccanPhone("+212612345678");

      expect(result).toBe("+212 6 12 34 56 78");
    });

    it("should format phone number with 0 prefix", () => {
      const result = formatMoroccanPhone("0612345678");

      expect(result).toBe("06 12 34 56 78");
    });

    it("should return unchanged if format is not recognized", () => {
      const phone = "123456";
      const result = formatMoroccanPhone(phone);

      expect(result).toBe(phone);
    });

    it("should handle different operator codes with +212", () => {
      const result = formatMoroccanPhone("+212712345678");

      expect(result).toBe("+212 7 12 34 56 78");
    });

    it("should handle different operator codes with 0", () => {
      const result = formatMoroccanPhone("0512345678");

      expect(result).toBe("05 12 34 56 78");
    });

    it("should add proper spacing for readability", () => {
      const result = formatMoroccanPhone("+212612345678");

      // Should have spaces between digit groups
      expect(result).toMatch(/\+212 \d \d{2} \d{2} \d{2} \d{2}/);
    });

    it("should format with 0 prefix with proper spacing", () => {
      const result = formatMoroccanPhone("0612345678");

      // Should have spaces between digit groups
      expect(result).toMatch(/0\d \d{2} \d{2} \d{2} \d{2}/);
    });

    it("should return invalid format unchanged", () => {
      const invalid = "invalid-phone";
      const result = formatMoroccanPhone(invalid);

      expect(result).toBe(invalid);
    });

    it("should handle edge case with correct length but wrong prefix", () => {
      const phone = "1234567890";
      const result = formatMoroccanPhone(phone);

      // Should not crash, should return as-is
      expect(result).toBe(phone);
    });
  });
});
