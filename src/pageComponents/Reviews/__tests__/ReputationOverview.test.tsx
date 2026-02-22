import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "reputation.title": "Reputation Overview",
        "reputation.totalReviews": "Total Reviews",
        "reputation.avgRating": "Average Rating",
        "reputation.googleRedirects": "Google Redirects",
        "reputation.responseRate": "Response Rate",
        "reputation.ratingDistribution": "Rating Distribution",
      };

      return translations[key] ?? key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

import {
  ReputationOverview,
  ReputationOverviewSkeleton,
  type ReputationData,
} from "../molecules/ReputationOverview";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleData: ReputationData = {
  totalReviews: 150,
  avgRating: 4.2,
  ratingDistribution: { 5: 80, 4: 40, 3: 15, 2: 10, 1: 5 },
  googleRedirects: 42,
  responseRate: 87,
};

function renderOverview(data: ReputationData = sampleData) {
  return render(<ReputationOverview data={data} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReputationOverview", () => {
  beforeEach(() => {
    cleanup();
  });

  // 1. Renders all 4 stat values correctly
  it("renders all 4 stat values correctly", () => {
    const { container } = renderOverview();
    const text = container.textContent ?? "";

    // Total reviews
    expect(text).toContain("150");
    expect(text).toContain("Total Reviews");

    // Average rating (formatted to 1 decimal)
    expect(text).toContain("4.2");
    expect(text).toContain("Average Rating");

    // Google redirects
    expect(text).toContain("42");
    expect(text).toContain("Google Redirects");

    // Response rate with percentage
    expect(text).toContain("87%");
    expect(text).toContain("Response Rate");
  });

  // 2. Rating distribution shows all 5 star levels
  it("renders all 5 star levels in the rating distribution", () => {
    const { container } = renderOverview();
    const text = container.textContent ?? "";

    expect(text).toContain("Rating Distribution");

    // Each star level label (5, 4, 3, 2, 1) and corresponding counts
    expect(text).toContain("80");  // 5-star count
    expect(text).toContain("40");  // 4-star count
    expect(text).toContain("15");  // 3-star count
    expect(text).toContain("10");  // 2-star count
    // 1-star count "5" - verify the distribution section has all 5 rows
    const distributionBars = container.querySelectorAll(
      ".space-y-2\\.5 > div",
    );

    expect(distributionBars).toHaveLength(5);
  });

  // 3. Bar widths match percentages
  it("bar widths match calculated percentages", () => {
    const { container } = renderOverview();

    // Each inner bar has an inline style with width = (count / totalReviews) * 100
    const bars = container.querySelectorAll<HTMLElement>(
      ".space-y-2\\.5 .rounded-full.bg-gradient-to-r",
    );

    expect(bars).toHaveLength(5);

    // 5-star: 80/150 = 53.33%
    expect(bars[0]!.style.width).toBe(`${(80 / 150) * 100}%`);
    // 4-star: 40/150 = 26.67%
    expect(bars[1]!.style.width).toBe(`${(40 / 150) * 100}%`);
    // 3-star: 15/150 = 10%
    expect(bars[2]!.style.width).toBe(`${(15 / 150) * 100}%`);
    // 2-star: 10/150 = 6.67%
    expect(bars[3]!.style.width).toBe(`${(10 / 150) * 100}%`);
    // 1-star: 5/150 = 3.33%
    expect(bars[4]!.style.width).toBe(`${(5 / 150) * 100}%`);
  });

  // 4. Handles zero reviews state
  it("handles zero reviews state with 0 values and 0% bars", () => {
    const zeroData: ReputationData = {
      totalReviews: 0,
      avgRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      googleRedirects: 0,
      responseRate: 0,
    };

    const { container } = renderOverview(zeroData);
    const text = container.textContent ?? "";

    // Average rating should show 0.0
    expect(text).toContain("0.0");
    // Response rate 0%
    expect(text).toContain("0%");

    // All bars should be 0% width
    const bars = container.querySelectorAll<HTMLElement>(
      ".space-y-2\\.5 .rounded-full.bg-gradient-to-r",
    );

    for (const bar of bars) {
      expect(bar.style.width).toBe("0%");
    }
  });

  // 5. Handles perfect 5.0 rating
  it("handles perfect 5.0 rating where all reviews are 5-star", () => {
    const perfectData: ReputationData = {
      totalReviews: 50,
      avgRating: 5.0,
      ratingDistribution: { 5: 50, 4: 0, 3: 0, 2: 0, 1: 0 },
      googleRedirects: 30,
      responseRate: 100,
    };

    const { container } = renderOverview(perfectData);
    const text = container.textContent ?? "";

    expect(text).toContain("5.0");
    expect(text).toContain("100%");

    // 5-star bar should be 100%
    const bars = container.querySelectorAll<HTMLElement>(
      ".space-y-2\\.5 .rounded-full.bg-gradient-to-r",
    );

    expect(bars[0]!.style.width).toBe("100%");
    // All other bars should be 0%
    expect(bars[1]!.style.width).toBe("0%");
    expect(bars[2]!.style.width).toBe("0%");
    expect(bars[3]!.style.width).toBe("0%");
    expect(bars[4]!.style.width).toBe("0%");
  });

  // 6. Renders section header with title
  it("renders the section header with reputation title", () => {
    renderOverview();

    expect(screen.getByText("Reputation Overview")).toBeInTheDocument();
  });

  // 7. Distribution counts are displayed next to bars
  it("displays count numbers next to each distribution bar", () => {
    const { container } = renderOverview();

    // The counts appear as the last span in each distribution row
    const countSpans = container.querySelectorAll(
      ".space-y-2\\.5 > div .tabular-nums.text-muted-foreground",
    );

    expect(countSpans).toHaveLength(5);

    const counts = Array.from(countSpans).map((el) => el.textContent?.trim());

    expect(counts).toEqual(["80", "40", "15", "10", "5"]);
  });

  // 8. Missing distribution keys default to 0
  it("handles missing distribution keys gracefully (defaults to 0)", () => {
    const sparseData: ReputationData = {
      totalReviews: 20,
      avgRating: 4.5,
      ratingDistribution: { 5: 15, 4: 5 }, // missing 3, 2, 1
      googleRedirects: 10,
      responseRate: 50,
    };

    const { container } = renderOverview(sparseData);

    const bars = container.querySelectorAll<HTMLElement>(
      ".space-y-2\\.5 .rounded-full.bg-gradient-to-r",
    );

    // 5-star: 15/20 = 75%
    expect(bars[0]!.style.width).toBe(`${(15 / 20) * 100}%`);
    // 4-star: 5/20 = 25%
    expect(bars[1]!.style.width).toBe(`${(5 / 20) * 100}%`);
    // 3, 2, 1 star: 0%
    expect(bars[2]!.style.width).toBe("0%");
    expect(bars[3]!.style.width).toBe("0%");
    expect(bars[4]!.style.width).toBe("0%");
  });
});

describe("ReputationOverviewSkeleton", () => {
  beforeEach(() => {
    cleanup();
  });

  // 9. Skeleton renders correct number of placeholder elements
  it("renders 4 stat card skeletons and 5 distribution row skeletons", () => {
    const { container } = render(<ReputationOverviewSkeleton />);

    // 4 stat card placeholders (each has a rounded-xl border div)
    const statCards = container.querySelectorAll(
      ".grid > .rounded-xl",
    );

    expect(statCards).toHaveLength(4);

    // 5 distribution row skeletons
    const distRows = container.querySelectorAll(
      ".space-y-3 > div",
    );

    expect(distRows).toHaveLength(5);
  });

  // 10. Skeleton renders header placeholder
  it("renders header skeleton placeholder", () => {
    const { container } = render(<ReputationOverviewSkeleton />);

    // Header section contains two skeleton elements (icon + title)
    const headerSkeletons = container.querySelectorAll(
      ".mb-5 .animate-pulse",
    );

    expect(headerSkeletons.length).toBeGreaterThanOrEqual(2);
  });
});
