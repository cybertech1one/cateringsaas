import { describe, it, expect } from "vitest";
import {
  buildOrderNotificationUrl,
  buildOrderNotificationMessage,
} from "../components/WhatsAppOrderButton";

describe("buildOrderNotificationMessage", () => {
  const baseOrder = {
    orderNumber: 42,
    items: [
      { name: "Tagine Chicken", quantity: 1, price: 7500 },
      { name: "Mint Tea", quantity: 2, price: 1500 },
    ],
    total: 10500,
    orderType: "dine_in",
  };

  it("includes order number in the message", () => {
    const message = buildOrderNotificationMessage(baseOrder);

    expect(message).toContain("Order #42");
  });

  it("lists all items with quantities and formatted prices", () => {
    const message = buildOrderNotificationMessage(baseOrder);

    expect(message).toContain("1x Tagine Chicken - 75.00");
    expect(message).toContain("2x Mint Tea - 30.00");
  });

  it("formats total from cents to decimal", () => {
    const message = buildOrderNotificationMessage(baseOrder);

    expect(message).toContain("Total: 105.00");
  });

  it("includes order type", () => {
    const message = buildOrderNotificationMessage(baseOrder);

    expect(message).toContain("dine_in");
  });

  it("includes customer name when provided", () => {
    const message = buildOrderNotificationMessage({
      ...baseOrder,
      customerName: "Ahmed",
    });

    expect(message).toContain("Ahmed");
  });

  it("includes table number when provided", () => {
    const message = buildOrderNotificationMessage({
      ...baseOrder,
      tableNumber: 7,
    });

    expect(message).toContain("Table: 7");
  });

  it("omits customer name when not provided", () => {
    const message = buildOrderNotificationMessage(baseOrder);

    expect(message).not.toContain("Customer:");
  });

  it("omits table number when not provided", () => {
    const message = buildOrderNotificationMessage(baseOrder);

    expect(message).not.toContain("Table:");
  });

  it("handles pickup order type", () => {
    const message = buildOrderNotificationMessage({
      ...baseOrder,
      orderType: "pickup",
      customerName: "Fatima",
    });

    expect(message).toContain("pickup");
    expect(message).toContain("Fatima");
  });

  it("handles delivery order type", () => {
    const message = buildOrderNotificationMessage({
      ...baseOrder,
      orderType: "delivery",
      customerName: "Youssef",
    });

    expect(message).toContain("delivery");
    expect(message).toContain("Youssef");
  });

  it("handles single item order", () => {
    const message = buildOrderNotificationMessage({
      orderNumber: 1,
      items: [{ name: "Couscous", quantity: 1, price: 4500 }],
      total: 4500,
      orderType: "dine_in",
    });

    expect(message).toContain("1x Couscous - 45.00");
    expect(message).toContain("Total: 45.00");
  });

  it("handles items with special characters in name", () => {
    const message = buildOrderNotificationMessage({
      orderNumber: 5,
      items: [{ name: "Creme Brulee (Large)", quantity: 1, price: 3500 }],
      total: 3500,
      orderType: "dine_in",
    });

    expect(message).toContain("Creme Brulee (Large)");
  });

  it("includes FeastQR branding", () => {
    const message = buildOrderNotificationMessage(baseOrder);

    expect(message).toContain("FeastQR");
  });

  it("handles zero-price items gracefully", () => {
    const message = buildOrderNotificationMessage({
      orderNumber: 10,
      items: [{ name: "Water", quantity: 1, price: 0 }],
      total: 0,
      orderType: "dine_in",
    });

    expect(message).toContain("1x Water - 0.00");
    expect(message).toContain("Total: 0.00");
  });
});

describe("buildOrderNotificationUrl", () => {
  const baseOrder = {
    orderNumber: 42,
    items: [
      { name: "Tagine Chicken", quantity: 1, price: 7500 },
      { name: "Mint Tea", quantity: 2, price: 1500 },
    ],
    total: 10500,
    orderType: "dine_in",
  };

  it("returns a valid WhatsApp API URL", () => {
    const url = buildOrderNotificationUrl("+212600123456", baseOrder);

    expect(url).toMatch(/^https:\/\/wa\.me\//);
  });

  it("normalizes the phone number (strips +, spaces, dashes)", () => {
    const url = buildOrderNotificationUrl("+212 600-123 456", baseOrder);

    expect(url).toContain("wa.me/212600123456");
  });

  it("URL-encodes the message text", () => {
    const url = buildOrderNotificationUrl("212600123456", baseOrder);

    // The URL should contain ?text= with encoded content
    expect(url).toContain("?text=");
    // Should not contain raw newlines
    expect(url).not.toContain("\n");
  });

  it("includes order number in the encoded message", () => {
    const url = buildOrderNotificationUrl("212600123456", baseOrder);
    const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");

    expect(decoded).toContain("Order #42");
  });

  it("includes total in the encoded message", () => {
    const url = buildOrderNotificationUrl("212600123456", baseOrder);
    const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");

    expect(decoded).toContain("105.00");
  });

  it("handles special characters in item names with URL encoding", () => {
    const url = buildOrderNotificationUrl("212600123456", {
      orderNumber: 1,
      items: [{ name: "Cafe & Creme Brulee", quantity: 1, price: 3500 }],
      total: 3500,
      orderType: "dine_in",
    });

    // The URL should be properly encoded
    expect(url).toContain("?text=");
    const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");

    expect(decoded).toContain("Cafe & Creme Brulee");
  });

  it("handles phone numbers with 00 international prefix", () => {
    const url = buildOrderNotificationUrl("00212600123456", baseOrder);

    expect(url).toContain("wa.me/212600123456");
  });

  it("includes optional customer name and table number", () => {
    const url = buildOrderNotificationUrl("212600123456", {
      ...baseOrder,
      customerName: "Ahmed",
      tableNumber: 5,
    });

    const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");

    expect(decoded).toContain("Ahmed");
    expect(decoded).toContain("Table: 5");
  });

  it("works with all order types", () => {
    for (const orderType of ["dine_in", "pickup", "delivery"]) {
      const url = buildOrderNotificationUrl("212600123456", {
        ...baseOrder,
        orderType,
      });

      const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");

      expect(decoded).toContain(orderType);
    }
  });
});
