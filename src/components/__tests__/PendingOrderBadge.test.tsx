import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockQueryData: { count: number } | undefined = undefined;

vi.mock("~/trpc/react", () => ({
  api: {
    orders: {
      getPendingOrderCount: {
        useQuery: (_input: undefined, _opts: Record<string, unknown>) => ({
          data: mockQueryData,
          isLoading: false,
        }),
      },
    },
  },
}));

import { PendingOrderBadge } from "~/components/PendingOrderBadge";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PendingOrderBadge", () => {
  beforeEach(() => {
    cleanup();
    mockQueryData = undefined;
  });

  it("renders nothing when count is 0", () => {
    mockQueryData = { count: 0 };
    const { container } = render(<PendingOrderBadge />);

    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when data is undefined (loading)", () => {
    mockQueryData = undefined;
    const { container } = render(<PendingOrderBadge />);

    expect(container.innerHTML).toBe("");
  });

  it("renders the count when greater than 0", () => {
    mockQueryData = { count: 3 };
    const { container } = render(<PendingOrderBadge />);

    expect(container.textContent).toBe("3");
  });

  it("shows correct aria-label for singular count", () => {
    mockQueryData = { count: 1 };
    const { container } = render(<PendingOrderBadge />);
    const badge = container.querySelector("[aria-label]");

    expect(badge?.getAttribute("aria-label")).toBe("1 pending order");
  });

  it("shows correct aria-label for plural count", () => {
    mockQueryData = { count: 5 };
    const { container } = render(<PendingOrderBadge />);
    const badge = container.querySelector("[aria-label]");

    expect(badge?.getAttribute("aria-label")).toBe("5 pending orders");
  });

  it("caps display at 99+ for large counts", () => {
    mockQueryData = { count: 150 };
    const { container } = render(<PendingOrderBadge />);

    expect(container.textContent).toBe("99+");
  });

  it("shows exact count at 99", () => {
    mockQueryData = { count: 99 };
    const { container } = render(<PendingOrderBadge />);

    expect(container.textContent).toBe("99");
  });

  it("renders with destructive background styling", () => {
    mockQueryData = { count: 2 };
    const { container } = render(<PendingOrderBadge />);
    const badge = container.querySelector("[aria-label]") as HTMLElement;

    expect(badge.className).toContain("bg-destructive");
    expect(badge.className).toContain("rounded-full");
  });
});
