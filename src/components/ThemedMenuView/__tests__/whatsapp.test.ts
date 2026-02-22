import { describe, it, expect } from "vitest";
import {
  normalizePhoneNumber,
  buildOrderMessage,
} from "../components/WhatsAppOrderButton";

describe("normalizePhoneNumber", () => {
  it("strips +, spaces, and dashes from a phone number", () => {
    expect(normalizePhoneNumber("+212 600-123 456")).toBe("212600123456");
  });

  it("strips leading 00 international prefix", () => {
    expect(normalizePhoneNumber("00212600123456")).toBe("212600123456");
  });

  it("passes through a clean number untouched", () => {
    expect(normalizePhoneNumber("212600123456")).toBe("212600123456");
  });

  it("handles parentheses and dots", () => {
    expect(normalizePhoneNumber("(+212) 600.123.456")).toBe("212600123456");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePhoneNumber("")).toBe("");
  });
});

describe("buildOrderMessage", () => {
  const baseArgs = {
    menuName: "Shawerma Klub",
    currency: "MAD",
    cartItems: [
      {
        dishId: "1",
        name: "Tagine Chicken",
        price: 7500,
        quantity: 1,
      },
      {
        dishId: "2",
        name: "Mint Tea",
        price: 1500,
        quantity: 2,
      },
    ],
  };

  it("includes restaurant name in header", () => {
    const message = buildOrderMessage(baseArgs);

    expect(message).toContain("Shawerma Klub");
  });

  it("lists all cart items with quantities and prices", () => {
    const message = buildOrderMessage(baseArgs);

    expect(message).toContain("1x Tagine Chicken - 75.00 MAD");
    expect(message).toContain("2x Mint Tea - 30.00 MAD");
  });

  it("calculates total correctly", () => {
    const message = buildOrderMessage(baseArgs);

    // 7500 + (1500 * 2) = 10500 -> 105.00
    expect(message).toContain("Total: 105.00 MAD");
  });

  it("includes table number when provided", () => {
    const message = buildOrderMessage({
      ...baseArgs,
      tableNumber: "5",
    });

    expect(message).toContain("Table: 5");
  });

  it("includes customer name when provided", () => {
    const message = buildOrderMessage({
      ...baseArgs,
      customerName: "Ahmed",
    });

    expect(message).toContain("Name: Ahmed");
  });

  it("omits table and name when not provided", () => {
    const message = buildOrderMessage(baseArgs);

    expect(message).not.toContain("Table:");
    expect(message).not.toContain("Name:");
  });

  it("includes variant name when present", () => {
    const message = buildOrderMessage({
      menuName: "Test Restaurant",
      currency: "MAD",
      cartItems: [
        {
          dishId: "1",
          name: "Burger",
          price: 5000,
          quantity: 1,
          variantName: "Large",
        },
      ],
    });

    expect(message).toContain("Burger (Large)");
  });

  it("includes item notes when present", () => {
    const message = buildOrderMessage({
      menuName: "Test Restaurant",
      currency: "MAD",
      cartItems: [
        {
          dishId: "1",
          name: "Burger",
          price: 5000,
          quantity: 1,
          notes: "No onions please",
        },
      ],
    });

    expect(message).toContain("Note: No onions please");
  });

  it("always ends with FeastQR branding", () => {
    const message = buildOrderMessage(baseArgs);

    expect(message).toContain("Sent via FeastQR");
  });
});
