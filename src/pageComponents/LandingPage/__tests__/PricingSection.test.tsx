import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "pricing.title": "Simple",
        "pricing.titleHighlight": "Pricing",
        "pricing.subtitle": "Start free. Upgrade when ready.",
        "pricing.perMonth": "/month",
        "pricing.perYear": "/year",
        "pricing.choosePlan": "Get Started",
        "pricing.mostPopular": "Most Popular",
        "landingPage.pricing.free.price": "0 MAD",
        "landingPage.pricing.free.name": "Free",
        "landingPage.pricing.free.description": "Perfect for getting started",
        "landingPage.pricing.free.feature1": "1 menu",
        "landingPage.pricing.free.feature2": "10 dishes",
        "landingPage.pricing.free.feature3": "Basic QR code",
        "landingPage.pricing.free.feature4": "Community support",
        "landingPage.pricing.standard.name": "Standard",
        "landingPage.pricing.standard.description":
          "For growing restaurants",
        "landingPage.pricing.standard.feature1": "Unlimited menus",
        "landingPage.pricing.standard.feature2": "Unlimited dishes",
        "landingPage.pricing.standard.feature3": "Premium QR codes",
        "landingPage.pricing.enterprise.name": "Enterprise",
        "landingPage.pricing.enterprise.price": "Custom",
        "landingPage.pricing.enterprise.yearlyPrice": "Custom",
        "landingPage.pricing.enterprise.description":
          "For restaurant chains",
        "landingPage.pricing.enterprise.feature1": "Everything in Standard",
        "landingPage.pricing.enterprise.feature2": "Multi-location",
        "landingPage.pricing.enterprise.feature3": "Priority support",
        "landingPage.pricing.enterprise.extraBenefits":
          "All Standard features plus:",
        "landingPage.pricing.toggle.monthly": "Monthly",
        "landingPage.pricing.toggle.annually": "Annually",
      };

      return translations[key] ?? key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));

vi.mock("@headlessui/react", () => ({
  Switch: ({
    checked,
    onChange,
    className,
    children,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    className: string;
    children: React.ReactNode;
  }) =>
    React.createElement(
      "button",
      {
        role: "switch",
        "aria-checked": String(checked),
        className,
        onClick: () => onChange(!checked),
        "data-testid": "pricing-toggle-switch",
      },
      children,
    ),
}));

import { PricingSection } from "../molecules/PricingSection";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PricingSection", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders 3 pricing tiers", () => {
    const { container } = render(<PricingSection />);
    const text = container.textContent ?? "";

    expect(text).toContain("Free");
    expect(text).toContain("Standard");
    expect(text).toContain("Enterprise");
  });

  it("free tier shows 0 MAD price", () => {
    const { container } = render(<PricingSection />);

    expect(container.textContent).toContain("0 MAD");
  });

  it("standard tier shows $6.99 monthly price by default", () => {
    const { container } = render(<PricingSection />);

    expect(container.textContent).toContain("299");
  });

  it("all CTA links point to /register", () => {
    const { container } = render(<PricingSection />);
    const links = container.querySelectorAll('a[href="/register"]');

    expect(links.length).toBe(3);
  });

  it("shows Most Popular badge on Standard tier", () => {
    const { container } = render(<PricingSection />);

    expect(container.textContent).toContain("Most Popular");
  });

  it("toggle switches from monthly to yearly prices", () => {
    const { container } = render(<PricingSection />);

    // Find the switch within the rendered container
    const toggles = container.querySelectorAll(
      '[data-testid="pricing-toggle-switch"]',
    );
    const toggle = toggles[toggles.length - 1] as HTMLElement;

    fireEvent.click(toggle);

    // Should now show yearly price for Standard
    expect(container.textContent).toContain("2,999");
  });

  it("renders features for each tier", () => {
    const { container } = render(<PricingSection />);
    const text = container.textContent ?? "";

    // Free features
    expect(text).toContain("1 menu");
    expect(text).toContain("10 dishes");
    expect(text).toContain("Basic QR code");
    expect(text).toContain("Community support");

    // Standard features
    expect(text).toContain("Unlimited menus");
    expect(text).toContain("Unlimited dishes");
    expect(text).toContain("Premium QR codes");

    // Enterprise features
    expect(text).toContain("Everything in Standard");
    expect(text).toContain("Multi-location");
    expect(text).toContain("Priority support");
  });

  it("enterprise tier shows extra benefits text", () => {
    const { container } = render(<PricingSection />);

    expect(container.textContent).toContain("All Standard features plus:");
  });
});
