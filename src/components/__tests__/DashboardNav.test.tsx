import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, within, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...rest }, children),
}));

vi.mock("~/components/Icons", () => {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get: (_target, prop: string) => {
      const Comp = (props: Record<string, unknown>) =>
        React.createElement("span", {
          "data-testid": `icon-${prop}`,
          ...props,
        });

      Comp.displayName = `Icon_${prop}`;

      return Comp;
    },
  };

  return {
    Icons: new Proxy({} as Record<string, unknown>, handler),
  };
});

vi.mock("~/utils/cn", () => ({
  cn: (...args: Array<string | boolean | undefined | null>) =>
    args.filter(Boolean).join(" "),
}));

import {
  DashboardNav,
  type SidebarNavItem,
} from "~/components/DashboardNav";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const dashboardItems: readonly SidebarNavItem[] = [
  { title: "Overview", href: "/dashboard" as never, icon: "pizza" },
  { title: "Orders", href: "/dashboard/orders" as never, icon: "orders" },
  {
    title: "Analytics",
    href: "/dashboard/analytics" as never,
    icon: "analytics",
  },
  {
    title: "Settings",
    href: "/dashboard/settings" as never,
    icon: "settings",
  },
  {
    title: "Billing",
    href: "/dashboard/billing" as never,
    icon: "billing",
  },
  {
    title: "Staff",
    href: "/dashboard/staff" as never,
    icon: "users",
    disabled: true,
  },
] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DashboardNav", () => {
  beforeEach(() => {
    cleanup();
    mockPathname = "/dashboard";
  });

  it("renders all navigation items", () => {
    const { container } = render(<DashboardNav items={dashboardItems} />);

    expect(container.textContent).toContain("Overview");
    expect(container.textContent).toContain("Orders");
    expect(container.textContent).toContain("Analytics");
    expect(container.textContent).toContain("Settings");
    expect(container.textContent).toContain("Billing");
    expect(container.textContent).toContain("Staff");
  });

  it("renders correct href for each item", () => {
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;
    const links = nav.querySelectorAll("a");
    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));

    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/orders");
    expect(hrefs).toContain("/dashboard/analytics");
    expect(hrefs).toContain("/dashboard/settings");
    expect(hrefs).toContain("/dashboard/billing");
  });

  it("active route gets aria-current='page'", () => {
    mockPathname = "/dashboard";
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;

    const activeLink = nav.querySelector('a[href="/dashboard"]');

    expect(activeLink?.getAttribute("aria-current")).toBe("page");
  });

  it("non-active routes do not have aria-current", () => {
    mockPathname = "/dashboard";
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;

    const ordersLink = nav.querySelector('a[href="/dashboard/orders"]');

    expect(ordersLink?.hasAttribute("aria-current")).toBe(false);
  });

  it("active route has highlighted styling classes", () => {
    mockPathname = "/dashboard/orders";
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;

    const ordersLink = nav.querySelector('a[href="/dashboard/orders"]')!;
    const styledSpan = ordersLink.querySelector("span.group") as HTMLElement;

    expect(styledSpan.className).toContain("bg-primary/[0.08]");
    expect(styledSpan.className).toContain("text-primary");
  });

  it("non-active route has muted styling", () => {
    mockPathname = "/dashboard";
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;

    const settingsLink = nav.querySelector(
      'a[href="/dashboard/settings"]',
    )!;
    const styledSpan = settingsLink.querySelector(
      "span.group",
    ) as HTMLElement;

    expect(styledSpan.className).toContain("text-muted-foreground");
  });

  it("nav element has aria-label='Dashboard'", () => {
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav");

    expect(nav?.getAttribute("aria-label")).toBe("Dashboard");
  });

  it("disabled items link to '/' instead of their href", () => {
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;

    // Staff is the disabled item
    const staffSpan = within(nav).getByText("Staff");
    const staffLink = staffSpan.closest("a");

    expect(staffLink?.getAttribute("href")).toBe("/");
  });

  it("disabled items have opacity class", () => {
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;

    const staffSpan = within(nav).getByText("Staff");
    const styledSpan = staffSpan.closest("span.group") as HTMLElement;

    expect(styledSpan.className).toContain("opacity-80");
  });

  it("returns null when items array is empty", () => {
    const { container } = render(<DashboardNav items={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("active route shows indicator dot", () => {
    mockPathname = "/dashboard";
    const { container } = render(<DashboardNav items={dashboardItems} />);
    const nav = container.querySelector("nav")!;

    const activeLink = nav.querySelector('a[href="/dashboard"]')!;
    // The dot is: <span class="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
    const dot = activeLink.querySelector("span.rounded-full.bg-primary");

    expect(dot).toBeTruthy();
  });

  it("renders a badge when item has badge prop", () => {
    const badgeItems: readonly SidebarNavItem[] = [
      {
        title: "Orders",
        href: "/dashboard/orders" as never,
        icon: "orders",
        badge: React.createElement("span", { "data-testid": "order-badge" }, "3"),
      },
    ];

    const { container } = render(<DashboardNav items={badgeItems} />);
    const badge = container.querySelector('[data-testid="order-badge"]');

    expect(badge).toBeTruthy();
    expect(badge?.textContent).toBe("3");
  });

  it("shows active indicator bar alongside badge", () => {
    mockPathname = "/dashboard/orders";
    const badgeItems: readonly SidebarNavItem[] = [
      {
        title: "Orders",
        href: "/dashboard/orders" as never,
        icon: "orders",
        badge: React.createElement("span", { "data-testid": "order-badge" }, "5"),
      },
    ];

    const { container } = render(<DashboardNav items={badgeItems} />);
    const nav = container.querySelector("nav")!;
    const activeLink = nav.querySelector('a[href="/dashboard/orders"]')!;
    const indicator = activeLink.querySelector("span.rounded-full.bg-primary");

    // Left-bar indicator should be rendered even when badge is present
    expect(indicator).toBeTruthy();
  });
});
