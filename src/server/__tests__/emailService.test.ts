/**
 * Email Service Tests
 *
 * Tests for the Diyafa email notification service.
 * Covers HTML generation, MAD formatting, bilingual content,
 * graceful degradation, and all template types.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatMAD,
  generateEmailHtml,
  sendInquiryConfirmation,
  sendNewInquiryAlert,
  sendQuoteEmail,
  sendQuoteAcceptedEmail,
  sendPaymentConfirmation,
  sendPaymentReminder,
  sendEventConfirmation,
  type InquiryEmailData,
  type QuoteEmailData,
  type PaymentEmailData,
  type MilestoneEmailData,
  type EventConfirmationData,
} from "~/server/notifications/emailService";

// ── Mock global fetch ────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── Helpers ──────────────────────────────────────

function setResendKey(key: string | undefined) {
  if (key) {
    process.env.RESEND_API_KEY = key;
  } else {
    delete process.env.RESEND_API_KEY;
  }
}

const sampleInquiry: InquiryEmailData = {
  customerName: "Fatima Benali",
  eventType: "wedding",
  eventDate: new Date("2026-06-15"),
  guestCount: 200,
  venueName: "Riad Palais Sebban",
  venueCity: "Marrakech",
  customerPhone: "+212 6 12 34 56 78",
  customerEmail: "fatima@example.com",
  specialRequests: "Vegetarian options needed",
  orgName: "Traiteur Al Baraka",
};

const sampleQuote: QuoteEmailData = {
  customerName: "Fatima Benali",
  eventType: "wedding",
  eventDate: new Date("2026-06-15"),
  guestCount: 200,
  venueName: "Riad Palais Sebban",
  quoteNumber: "Q-2026-042",
  versionNumber: 1,
  items: [
    { sectionName: "Entrees", itemName: "Pastilla au poulet", quantity: 200, unitPrice: 45, subtotal: 9000 },
    { sectionName: "Plats", itemName: "Tagine de agneau", quantity: 200, unitPrice: 85, subtotal: 17000 },
    { sectionName: "Desserts", itemName: "Cornes de gazelle", quantity: 400, unitPrice: 15, subtotal: 6000 },
  ],
  subtotal: 32000,
  tvaRate: 20,
  tvaAmount: 6400,
  totalAmount: 38400,
  pricePerPerson: 192,
  validUntil: new Date("2026-04-01"),
  notes: "Includes setup and service staff",
  orgName: "Traiteur Al Baraka",
};

const samplePayment: PaymentEmailData = {
  customerName: "Fatima Benali",
  eventType: "wedding",
  eventDate: new Date("2026-06-15"),
  amount: 19200,
  paymentMethod: "bank_transfer",
  reference: "PAY-2026-0042",
  orgName: "Traiteur Al Baraka",
};

const sampleMilestone: MilestoneEmailData = {
  customerName: "Fatima Benali",
  eventType: "wedding",
  eventDate: new Date("2026-06-15"),
  milestoneName: "Acompte (50%)",
  amount: 19200,
  dueDate: new Date("2026-03-15"),
  totalAmount: 38400,
  paidSoFar: 0,
  orgName: "Traiteur Al Baraka",
};

const sampleEventConfirm: EventConfirmationData = {
  customerName: "Fatima Benali",
  eventType: "wedding",
  eventDate: new Date("2026-06-15"),
  startTime: "19:00",
  endTime: "01:00",
  guestCount: 200,
  venueName: "Riad Palais Sebban",
  venueAddress: "12 Rue de la Kasbah, Marrakech",
  totalAmount: 38400,
  depositPaid: 19200,
  balanceDue: 19200,
  orgName: "Traiteur Al Baraka",
  orgPhone: "+212 5 24 38 91 00",
};

// ── Tests ────────────────────────────────────────

describe("emailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setResendKey("re_test_1234567890");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_ADDRESS;
  });

  // ── MAD Currency Formatting ──────────────────

  describe("formatMAD", () => {
    it("should format whole numbers with space separator", () => {
      expect(formatMAD(45000)).toBe("45 000 MAD");
    });

    it("should format small amounts", () => {
      expect(formatMAD(150)).toBe("150 MAD");
    });

    it("should format zero", () => {
      expect(formatMAD(0)).toBe("0 MAD");
    });

    it("should format large amounts with thousands separators", () => {
      expect(formatMAD(1250000)).toBe("1 250 000 MAD");
    });
  });

  // ── HTML Generation ──────────────────────────

  describe("generateEmailHtml", () => {
    it("should include Diyafa branding colors", () => {
      const html = generateEmailHtml("Test", "<p>Content</p>");
      expect(html).toContain("#c2410c"); // ember primary
      expect(html).toContain("#b8860b"); // gold accent
    });

    it("should include Diyafa footer", () => {
      const html = generateEmailHtml("Test", "<p>Content</p>");
      expect(html).toContain("Diyafa");
      expect(html).toContain("Plateforme de traiteur au Maroc");
    });

    it("should include the title in the header", () => {
      const html = generateEmailHtml("Votre devis est pret", "<p>Content</p>");
      expect(html).toContain("Votre devis est pret");
    });

    it("should use table-based layout for email compatibility", () => {
      const html = generateEmailHtml("Test", "<p>Hello</p>");
      expect(html).toContain("<table");
      expect(html).toContain("</table>");
    });

    it("should include inline styles", () => {
      const html = generateEmailHtml("Test", "<p>Hello</p>");
      expect(html).toContain('style="');
    });
  });

  // ── Graceful Degradation ─────────────────────

  describe("graceful degradation", () => {
    it("should not throw when RESEND_API_KEY is not configured", async () => {
      setResendKey(undefined);
      await expect(
        sendInquiryConfirmation("test@example.com", sampleInquiry)
      ).resolves.toEqual({ success: false, reason: "not_configured" });
    });

    it("should not call fetch when not configured", async () => {
      setResendKey(undefined);
      await sendInquiryConfirmation("test@example.com", sampleInquiry);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle fetch errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const result = await sendInquiryConfirmation("test@example.com", sampleInquiry);
      expect(result).toEqual({ success: false, reason: "send_failed" });
    });

    it("should handle non-OK response gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => "Invalid email",
      });
      const result = await sendInquiryConfirmation("test@example.com", sampleInquiry);
      expect(result).toEqual({ success: false, reason: "send_failed" });
    });
  });

  // ── Inquiry Confirmation (to client) ─────────

  describe("sendInquiryConfirmation", () => {
    it("should send email with correct subject and content", async () => {
      await sendInquiryConfirmation("fatima@example.com", sampleInquiry);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0]!;
      expect(url).toBe("https://api.resend.com/emails");
      const body = JSON.parse(options.body as string);
      expect(body.to).toEqual(["fatima@example.com"]);
      expect(body.subject).toContain("Demande");
    });

    it("should include event details in HTML body", async () => {
      await sendInquiryConfirmation("fatima@example.com", sampleInquiry);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("Fatima Benali");
      expect(body.html).toContain("200");
      expect(body.html).toContain("Riad Palais Sebban");
    });

    it("should include bilingual content (French + Arabic)", async () => {
      await sendInquiryConfirmation("fatima@example.com", sampleInquiry);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      // French content
      expect(body.html).toContain("Votre demande");
      // Arabic content (HTML entities for Arabic characters)
      expect(body.html).toMatch(/&#\d{4};/); // Arabic HTML entities present
      expect(body.html).toContain('dir="rtl"'); // RTL direction set
    });
  });

  // ── New Inquiry Alert (to caterer) ───────────

  describe("sendNewInquiryAlert", () => {
    it("should alert caterer with inquiry details", async () => {
      await sendNewInquiryAlert("caterer@albaraka.ma", sampleInquiry);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.subject).toContain("Nouvelle demande");
      expect(body.html).toContain("Fatima Benali");
      expect(body.html).toContain("+212 6 12 34 56 78");
    });
  });

  // ── Quote Email (to client) ──────────────────

  describe("sendQuoteEmail", () => {
    it("should include line items table", async () => {
      await sendQuoteEmail("fatima@example.com", sampleQuote);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("Pastilla au poulet");
      expect(body.html).toContain("Tagine de agneau");
      expect(body.html).toContain("Cornes de gazelle");
    });

    it("should show amounts in MAD format", async () => {
      await sendQuoteEmail("fatima@example.com", sampleQuote);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("38 400 MAD");
      expect(body.html).toContain("6 400 MAD");
    });

    it("should include TVA rate and amount", async () => {
      await sendQuoteEmail("fatima@example.com", sampleQuote);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("20%");
      expect(body.html).toContain("TVA");
    });

    it("should include validity date", async () => {
      await sendQuoteEmail("fatima@example.com", sampleQuote);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("2026");
    });

    it("should include price per person", async () => {
      await sendQuoteEmail("fatima@example.com", sampleQuote);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("192 MAD");
    });
  });

  // ── Quote Accepted (to caterer) ──────────────

  describe("sendQuoteAcceptedEmail", () => {
    it("should notify caterer of acceptance", async () => {
      await sendQuoteAcceptedEmail("caterer@albaraka.ma", sampleQuote);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.subject).toContain("accept");
      expect(body.html).toContain("Fatima Benali");
      expect(body.html).toContain("38 400 MAD");
    });
  });

  // ── Payment Confirmation ─────────────────────

  describe("sendPaymentConfirmation", () => {
    it("should confirm payment with amount and reference", async () => {
      await sendPaymentConfirmation("fatima@example.com", samplePayment);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("19 200 MAD");
      expect(body.html).toContain("PAY-2026-0042");
    });
  });

  // ── Payment Reminder ─────────────────────────

  describe("sendPaymentReminder", () => {
    it("should include milestone details and due date", async () => {
      await sendPaymentReminder("fatima@example.com", sampleMilestone);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("19 200 MAD");
      expect(body.html).toContain("Acompte (50%)");
    });
  });

  // ── Event Confirmation ───────────────────────

  describe("sendEventConfirmation", () => {
    it("should include full event details", async () => {
      await sendEventConfirmation("fatima@example.com", sampleEventConfirm);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("19:00");
      expect(body.html).toContain("200");
      expect(body.html).toContain("Riad Palais Sebban");
      expect(body.html).toContain("38 400 MAD");
    });

    it("should show balance due", async () => {
      await sendEventConfirmation("fatima@example.com", sampleEventConfirm);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("19 200 MAD");
    });

    it("should include caterer contact info", async () => {
      await sendEventConfirmation("fatima@example.com", sampleEventConfirm);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.html).toContain("Traiteur Al Baraka");
      expect(body.html).toContain("+212 5 24 38 91 00");
    });
  });

  // ── Custom from address ──────────────────────

  describe("custom from address", () => {
    it("should use EMAIL_FROM_ADDRESS if set", async () => {
      process.env.EMAIL_FROM_ADDRESS = "Custom <hello@custom.ma>";
      await sendInquiryConfirmation("test@example.com", sampleInquiry);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.from).toBe("Custom <hello@custom.ma>");
    });

    it("should use default Diyafa from address when not set", async () => {
      delete process.env.EMAIL_FROM_ADDRESS;
      await sendInquiryConfirmation("test@example.com", sampleInquiry);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
      expect(body.from).toContain("Diyafa");
      expect(body.from).toContain("noreply@diyafa.ma");
    });
  });
});
