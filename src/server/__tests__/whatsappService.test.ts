/**
 * WhatsApp Notification Service — Test Suite
 *
 * Tests message formatting (MAD currency, bilingual FR+AR),
 * graceful degradation when not configured, and all notification
 * types produce valid messages for the Meta Cloud API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We'll mock fetch globally and env vars via process.env
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock logger to avoid console noise
vi.mock("~/server/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks are set up
import {
  formatMAD,
  formatEventDate,
  notifyNewInquiry,
  confirmInquiryToClient,
  notifyQuoteSent,
  notifyQuoteAccepted,
  notifyPaymentReceived,
  sendPaymentReminder,
  notifyEventConfirmed,
  isWhatsAppConfigured,
} from "~/server/notifications/whatsappService";
import { logger } from "~/server/logger";

// ── Helpers ──────────────────────────────────────────

describe("formatMAD", () => {
  it("formats whole numbers with spaces as thousand separators", () => {
    expect(formatMAD(45000)).toBe("45 000 MAD");
  });

  it("formats zero", () => {
    expect(formatMAD(0)).toBe("0 MAD");
  });

  it("formats small amounts", () => {
    expect(formatMAD(500)).toBe("500 MAD");
  });

  it("formats large amounts", () => {
    expect(formatMAD(1250000)).toBe("1 250 000 MAD");
  });

  it("rounds decimals", () => {
    expect(formatMAD(45000.75)).toBe("45 001 MAD");
  });
});

describe("formatEventDate", () => {
  it("formats a Date into a readable French date string", () => {
    const date = new Date("2026-04-15T00:00:00Z");
    const result = formatEventDate(date);
    // Should contain day, month, year in a readable format
    expect(result).toContain("2026");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(5);
  });

  it("handles string dates", () => {
    const result = formatEventDate("2026-06-20");
    expect(result).toContain("2026");
  });
});

// ── Configuration ────────────────────────────────────

describe("isWhatsAppConfigured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when env vars are missing", () => {
    delete process.env.WHATSAPP_API_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    expect(isWhatsAppConfigured()).toBe(false);
  });

  it("returns false when only token is set", () => {
    process.env.WHATSAPP_API_TOKEN = "test-token";
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    expect(isWhatsAppConfigured()).toBe(false);
  });

  it("returns false when only phone number ID is set", () => {
    delete process.env.WHATSAPP_API_TOKEN;
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";
    expect(isWhatsAppConfigured()).toBe(false);
  });

  it("returns true when both env vars are set", () => {
    process.env.WHATSAPP_API_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";
    expect(isWhatsAppConfigured()).toBe(true);
  });
});

// ── Graceful Degradation ─────────────────────────────

describe("graceful degradation when not configured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.WHATSAPP_API_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("notifyNewInquiry logs warning and returns false without crashing", async () => {
    const result = await notifyNewInquiry("+212612345678", {
      customerName: "Ahmed",
      eventType: "wedding",
      guestCount: 200,
      eventDate: new Date("2026-06-15"),
    });

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("WhatsApp"),
      undefined,
      "whatsapp",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("confirmInquiryToClient returns false without crashing", async () => {
    const result = await confirmInquiryToClient("+212612345678", {
      orgName: "Riad Catering",
      eventType: "wedding",
      eventDate: new Date("2026-06-15"),
    });

    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("notifyQuoteSent returns false without crashing", async () => {
    const result = await notifyQuoteSent("+212612345678", {
      orgName: "Riad Catering",
      totalAmount: 45000,
      guestCount: 200,
      eventTitle: "Wedding - Ahmed",
      quoteLink: "https://diyafa.ma/quote/abc123",
    });

    expect(result).toBe(false);
  });

  it("notifyQuoteAccepted returns false without crashing", async () => {
    const result = await notifyQuoteAccepted("+212612345678", {
      customerName: "Ahmed",
      eventTitle: "Wedding - Ahmed",
      totalAmount: 45000,
    });

    expect(result).toBe(false);
  });

  it("notifyPaymentReceived returns false without crashing", async () => {
    const result = await notifyPaymentReceived("+212612345678", {
      customerName: "Ahmed",
      eventTitle: "Wedding - Ahmed",
      amount: 13500,
      milestoneLabel: "Deposit (30%)",
      paymentMethod: "bank_transfer",
    });

    expect(result).toBe(false);
  });

  it("sendPaymentReminder returns false without crashing", async () => {
    const result = await sendPaymentReminder("+212612345678", {
      orgName: "Riad Catering",
      eventTitle: "Wedding - Ahmed",
      amount: 22500,
      milestoneLabel: "Progress (50%)",
      dueDate: new Date("2026-05-01"),
    });

    expect(result).toBe(false);
  });

  it("notifyEventConfirmed returns false without crashing", async () => {
    const result = await notifyEventConfirmed("+212612345678", {
      orgName: "Riad Catering",
      eventTitle: "Wedding - Ahmed",
      eventDate: new Date("2026-06-15"),
      venueName: "Riad Palais Sebban",
      guestCount: 200,
    });

    expect(result).toBe(false);
  });
});

// ── Successful API Calls ─────────────────────────────

describe("WhatsApp API calls when configured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WHATSAPP_API_TOKEN = "test-token-abc123";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "987654321";
    vi.clearAllMocks();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: "whatsapp",
        messages: [{ id: "wamid.xxx" }],
      }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("notifyNewInquiry sends correct API request with bilingual message", async () => {
    const result = await notifyNewInquiry("+212612345678", {
      customerName: "Ahmed Benali",
      eventType: "wedding",
      guestCount: 200,
      eventDate: new Date("2026-06-15"),
      customerPhone: "+212698765432",
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0]!;
    expect(url).toBe(
      "https://graph.facebook.com/v21.0/987654321/messages",
    );
    expect(options.method).toBe("POST");
    expect(options.headers["Authorization"]).toBe("Bearer test-token-abc123");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.messaging_product).toBe("whatsapp");
    expect(body.to).toBe("212612345678"); // normalized, no "+"
    expect(body.type).toBe("text");

    // Bilingual: French primary, Arabic secondary
    const message = body.text.body;
    expect(message).toContain("Ahmed Benali"); // customer name
    expect(message).toContain("200"); // guest count
  });

  it("confirmInquiryToClient sends confirmation with org name", async () => {
    const result = await confirmInquiryToClient("+212698765432", {
      orgName: "Riad Catering Marrakech",
      eventType: "corporate",
      eventDate: new Date("2026-09-20"),
    });

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    const message = body.text.body;
    expect(message).toContain("Riad Catering Marrakech");
  });

  it("notifyQuoteSent includes amount formatted as MAD", async () => {
    const result = await notifyQuoteSent("+212698765432", {
      orgName: "Riad Catering",
      totalAmount: 45000,
      guestCount: 200,
      eventTitle: "Wedding - Ahmed",
      quoteLink: "https://diyafa.ma/quote/abc123",
    });

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    const message = body.text.body;
    expect(message).toContain("45 000 MAD");
  });

  it("notifyQuoteAccepted sends to org with event details", async () => {
    const result = await notifyQuoteAccepted("+212612345678", {
      customerName: "Ahmed Benali",
      eventTitle: "Wedding - Ahmed",
      totalAmount: 45000,
    });

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    const message = body.text.body;
    expect(message).toContain("Ahmed Benali");
    expect(message).toContain("45 000 MAD");
  });

  it("notifyPaymentReceived includes milestone and amount", async () => {
    const result = await notifyPaymentReceived("+212612345678", {
      customerName: "Ahmed Benali",
      eventTitle: "Wedding - Ahmed",
      amount: 13500,
      milestoneLabel: "Deposit (30%)",
      paymentMethod: "bank_transfer",
    });

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    const message = body.text.body;
    expect(message).toContain("13 500 MAD");
    expect(message).toContain("Deposit (30%)");
  });

  it("sendPaymentReminder includes due date and amount", async () => {
    const result = await sendPaymentReminder("+212698765432", {
      orgName: "Riad Catering",
      eventTitle: "Wedding - Ahmed",
      amount: 22500,
      milestoneLabel: "Progress (50%)",
      dueDate: new Date("2026-05-01"),
    });

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    const message = body.text.body;
    expect(message).toContain("22 500 MAD");
    expect(message).toContain("Progress (50%)");
  });

  it("notifyEventConfirmed includes venue and guest count", async () => {
    const result = await notifyEventConfirmed("+212698765432", {
      orgName: "Riad Catering",
      eventTitle: "Wedding - Ahmed",
      eventDate: new Date("2026-06-15"),
      venueName: "Riad Palais Sebban",
      guestCount: 200,
    });

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    const message = body.text.body;
    expect(message).toContain("Riad Palais Sebban");
    expect(message).toContain("200");
  });
});

// ── Error Handling ───────────────────────────────────

describe("error handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WHATSAPP_API_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false and logs error when API returns 401", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    const result = await notifyNewInquiry("+212612345678", {
      customerName: "Ahmed",
      eventType: "wedding",
      guestCount: 100,
      eventDate: new Date("2026-06-15"),
    });

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns false and logs error when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await notifyNewInquiry("+212612345678", {
      customerName: "Ahmed",
      eventType: "wedding",
      guestCount: 100,
      eventDate: new Date("2026-06-15"),
    });

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns false on API rate limit (429)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    });

    const result = await notifyQuoteSent("+212612345678", {
      orgName: "Test",
      totalAmount: 10000,
      guestCount: 50,
      eventTitle: "Test Event",
      quoteLink: "https://diyafa.ma/quote/xyz",
    });

    expect(result).toBe(false);
  });
});

// ── Phone Number Normalization ───────────────────────

describe("phone number normalization in API calls", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WHATSAPP_API_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";
    vi.clearAllMocks();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: "wamid.xxx" }] }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("strips + prefix from phone numbers", async () => {
    await notifyNewInquiry("+212612345678", {
      customerName: "Ahmed",
      eventType: "wedding",
      guestCount: 100,
      eventDate: new Date("2026-06-15"),
    });

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.to).toBe("212612345678");
  });

  it("converts local Moroccan numbers (06...) to international", async () => {
    await notifyNewInquiry("0612345678", {
      customerName: "Ahmed",
      eventType: "wedding",
      guestCount: 100,
      eventDate: new Date("2026-06-15"),
    });

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.to).toBe("212612345678");
  });

  it("strips spaces and dashes from phone numbers", async () => {
    await notifyNewInquiry("+212 6 12 34 56 78", {
      customerName: "Ahmed",
      eventType: "wedding",
      guestCount: 100,
      eventDate: new Date("2026-06-15"),
    });

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.to).toBe("212612345678");
  });
});
