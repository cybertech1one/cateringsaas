import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const faqMap: Record<string, string> = {
        "landing.faq.title": "Frequently Asked Questions",
        "landing.faq.subtitle":
          "Everything you need to know about FeastQR",
        "landing.faq.items.0.question": "What is FeastQR?",
        "landing.faq.items.0.answer":
          "FeastQR is a digital menu platform for restaurants.",
        "landing.faq.items.1.question": "Is it free?",
        "landing.faq.items.1.answer":
          "Yes, we offer a free tier with basic features.",
        "landing.faq.items.2.question": "Do I need coding skills?",
        "landing.faq.items.2.answer":
          "Not at all! FeastQR is designed for restaurant owners.",
        "landing.faq.items.3.question": "How do QR codes work?",
        "landing.faq.items.3.answer":
          "Customers scan the QR code to view your menu.",
        "landing.faq.items.4.question": "Can I customize the design?",
        "landing.faq.items.4.answer":
          "Absolutely! Choose from multiple themes and layouts.",
        "landing.faq.items.5.question": "Is there multi-language support?",
        "landing.faq.items.5.answer":
          "Yes, we support English, French, and Arabic.",
        "landing.faq.items.6.question": "How fast can I set up?",
        "landing.faq.items.6.answer":
          "Most restaurants are up and running in under 10 minutes.",
        "landing.faq.items.7.question": "Can I update the menu in real-time?",
        "landing.faq.items.7.answer":
          "Yes, changes appear instantly when you save.",
        "landing.faq.items.8.question": "Is there analytics?",
        "landing.faq.items.8.answer":
          "Yes, track views, orders, and popular dishes.",
        "landing.faq.items.9.question": "What about WhatsApp ordering?",
        "landing.faq.items.9.answer":
          "Customers can order directly via WhatsApp.",
      };

      return faqMap[key] ?? key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

import { FAQSection } from "../molecules/FAQSection";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FAQSection", () => {
  it("renders the FAQ section title", () => {
    render(<FAQSection />);

    expect(
      screen.getByText("Frequently Asked Questions"),
    ).toBeInTheDocument();
  });

  it("renders all 10 FAQ questions as triggers", () => {
    const { container } = render(<FAQSection />);

    const questions = [
      "What is FeastQR?",
      "Is it free?",
      "Do I need coding skills?",
      "How do QR codes work?",
      "Can I customize the design?",
      "Is there multi-language support?",
      "How fast can I set up?",
      "Can I update the menu in real-time?",
      "Is there analytics?",
      "What about WhatsApp ordering?",
    ];

    for (const q of questions) {
      // Use container.textContent for robustness against multiple elements
      expect(container.textContent).toContain(q);
    }
  });

  it("accordion items start in closed state", () => {
    const { container } = render(<FAQSection />);

    // Radix Accordion items have data-state on the item element
    const items = container.querySelectorAll(
      '[data-state="closed"]',
    );

    // At minimum, the 10 items should be closed (items + triggers = 20+)
    expect(items.length).toBeGreaterThanOrEqual(10);
  });

  it("clicking a trigger opens the accordion item to show the answer", () => {
    const { container } = render(<FAQSection />);

    // Get the first accordion trigger button
    const triggers = container.querySelectorAll("button[data-state]");
    const firstTrigger = triggers[0] as HTMLElement;

    expect(firstTrigger.getAttribute("data-state")).toBe("closed");

    fireEvent.click(firstTrigger);

    expect(firstTrigger.getAttribute("data-state")).toBe("open");
  });

  it("renders JSON-LD structured data for FAQPage schema", () => {
    const { container } = render(<FAQSection />);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );

    expect(script).toBeTruthy();

    const jsonLd = JSON.parse(script!.textContent!);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(10);
    expect(jsonLd.mainEntity[0]["@type"]).toBe("Question");
    expect(jsonLd.mainEntity[0].name).toBe("What is FeastQR?");
    expect(jsonLd.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
  });

  it("JSON-LD includes correct answers for first and last FAQ", () => {
    const { container } = render(<FAQSection />);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const jsonLd = JSON.parse(script!.textContent!);

    expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBe(
      "FeastQR is a digital menu platform for restaurants.",
    );
    expect(jsonLd.mainEntity[9].acceptedAnswer.text).toBe(
      "Customers can order directly via WhatsApp.",
    );
  });
});
