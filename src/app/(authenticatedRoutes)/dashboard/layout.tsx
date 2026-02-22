"use client";

import { useMemo } from "react";
import { DashboardNav, type SidebarNavItem } from "~/components/DashboardNav";
import { PendingOrderBadge } from "~/components/PendingOrderBadge";
import { TranslatedText } from "~/components/TranslatedText";
import { KeyboardShortcutsProvider } from "~/providers/KeyboardShortcutsProvider";

const mainNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.menus" />,
    href: "/dashboard",
    icon: "menu",
  },
  {
    title: <TranslatedText id="dashboardSidenav.restaurants" />,
    href: "/dashboard/restaurants",
    icon: "building",
  },
];

const businessNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.analytics" />,
    href: "/dashboard/analytics",
    icon: "analytics",
  },
  {
    title: <TranslatedText id="dashboardSidenav.promotions" />,
    href: "/dashboard/promotions",
    icon: "megaphone",
  },
  {
    title: <TranslatedText id="dashboardSidenav.loyalty" />,
    href: "/dashboard/loyalty",
    icon: "loyalty",
  },
  {
    title: <TranslatedText id="dashboardSidenav.marketing" />,
    href: "/dashboard/marketing",
    icon: "marketing",
  },
  {
    title: <TranslatedText id="dashboardSidenav.crm" />,
    href: "/dashboard/crm",
    icon: "brain",
  },
  {
    title: <TranslatedText id="dashboardSidenav.catering" />,
    href: "/dashboard/catering",
    icon: "catering",
  },
];

const systemNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.billing" />,
    href: "/dashboard/billing",
    icon: "billing",
  },
  {
    title: <TranslatedText id="dashboardSidenav.settings" />,
    href: "/dashboard/settings",
    icon: "settings",
  },
];

function NavGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      {children}
    </div>
  );
}

function RootLayout({ children }: { children: React.ReactNode }) {
  const managementNavItems: readonly SidebarNavItem[] = useMemo(
    () => [
      {
        title: <TranslatedText id="dashboardSidenav.orders" />,
        href: "/dashboard/orders",
        icon: "orders" as const,
        badge: <PendingOrderBadge />,
      },
      {
        title: <TranslatedText id="dashboardSidenav.kitchen" />,
        href: "/dashboard/kitchen",
        icon: "chefHat" as const,
      },
      {
        title: <TranslatedText id="dashboardSidenav.reviews" />,
        href: "/dashboard/reviews",
        icon: "star" as const,
      },
      {
        title: <TranslatedText id="dashboardSidenav.staff" />,
        href: "/dashboard/staff",
        icon: "users" as const,
      },
      {
        title: <TranslatedText id="dashboardSidenav.delivery" />,
        href: "/dashboard/delivery",
        icon: "truck" as const,
      },
    ],
    [],
  );

  const driverNavItems: readonly SidebarNavItem[] = useMemo(
    () => [
      {
        title: <TranslatedText id="dashboardSidenav.driverDashboard" />,
        href: "/dashboard/driver",
        icon: "wallet" as const,
      },
    ],
    [],
  );

  return (
    <KeyboardShortcutsProvider>
      <div className="flex w-full flex-1 flex-col gap-6 md:flex-row">
        <aside className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-2.5 backdrop-blur-sm md:w-[210px] md:self-start md:sticky md:top-[88px]">
          <NavGroup label={<TranslatedText id="navbar.dashboard" />}>
            <DashboardNav items={mainNavItems} />
          </NavGroup>
          <div className="mx-2 border-t border-border/20" />
          <NavGroup label={<TranslatedText id="dashboardSidenav.management" />}>
            <DashboardNav items={managementNavItems} />
          </NavGroup>
          <div className="mx-2 border-t border-border/20" />
          <NavGroup label={<TranslatedText id="dashboardSidenav.business" />}>
            <DashboardNav items={businessNavItems} />
          </NavGroup>
          <div className="mx-2 border-t border-border/20" />
          <NavGroup label={<TranslatedText id="dashboardSidenav.driver" />}>
            <DashboardNav items={driverNavItems} />
          </NavGroup>
          <div className="mx-2 border-t border-border/20" />
          <DashboardNav items={systemNavItems} />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </KeyboardShortcutsProvider>
  );
}

export default RootLayout;
