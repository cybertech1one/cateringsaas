"use client";

import { useMemo } from "react";
import { DashboardNav, type SidebarNavItem } from "~/components/DashboardNav";
import { TranslatedText } from "~/components/TranslatedText";
import { KeyboardShortcutsProvider } from "~/providers/KeyboardShortcutsProvider";

// ── Dashboard (overview + pipeline) ──────────────────────────────────
const dashboardNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.overview" />,
    href: "/dashboard",
    icon: "analytics",
  },
  {
    title: <TranslatedText id="dashboardSidenav.calendar" />,
    href: "/dashboard/calendar",
    icon: "calendar",
  },
];

// ── Event Management ─────────────────────────────────────────────────
const eventNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.events" />,
    href: "/dashboard/events",
    icon: "star",
  },
  {
    title: <TranslatedText id="dashboardSidenav.quotes" />,
    href: "/dashboard/quotes",
    icon: "post",
  },
  {
    title: <TranslatedText id="dashboardSidenav.clients" />,
    href: "/dashboard/clients",
    icon: "users",
  },
  {
    title: <TranslatedText id="dashboardSidenav.messages" />,
    href: "/dashboard/messages",
    icon: "mail",
  },
];

// ── Operations ───────────────────────────────────────────────────────
const operationsNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.menus" />,
    href: "/dashboard/catering",
    icon: "menu",
  },
  {
    title: <TranslatedText id="dashboardSidenav.staff" />,
    href: "/dashboard/staff",
    icon: "users",
  },
  {
    title: <TranslatedText id="dashboardSidenav.equipment" />,
    href: "/dashboard/equipment",
    icon: "construction",
  },
  {
    title: <TranslatedText id="dashboardSidenav.kitchen" />,
    href: "/dashboard/kitchen",
    icon: "chefHat",
  },
];

// ── Business ─────────────────────────────────────────────────────────
const businessNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.finances" />,
    href: "/dashboard/finances",
    icon: "billing",
  },
  {
    title: <TranslatedText id="dashboardSidenav.analytics" />,
    href: "/dashboard/analytics",
    icon: "analytics",
  },
  {
    title: <TranslatedText id="dashboardSidenav.reviews" />,
    href: "/dashboard/reviews",
    icon: "star",
  },
  {
    title: <TranslatedText id="dashboardSidenav.portfolio" />,
    href: "/dashboard/portfolio",
    icon: "image",
  },
];

// ── System ───────────────────────────────────────────────────────────
const systemNavItems: readonly SidebarNavItem[] = [
  {
    title: <TranslatedText id="dashboardSidenav.settings" />,
    href: "/dashboard/settings",
    icon: "settings",
  },
  {
    title: <TranslatedText id="dashboardSidenav.billing" />,
    href: "/dashboard/billing",
    icon: "billing",
  },
];

function NavGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-primary/50">
        {label}
      </span>
      {children}
    </div>
  );
}

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardShortcutsProvider>
      <div className="flex w-full flex-1 flex-col gap-6 md:flex-row">
        <aside className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/80 p-2.5 backdrop-blur-sm md:w-[220px] md:self-start md:sticky md:top-[88px] arch-card-top">
          <NavGroup label="Dashboard">
            <DashboardNav items={dashboardNavItems} />
          </NavGroup>
          <div className="mx-2 gold-separator" />
          <NavGroup label="Events">
            <DashboardNav items={eventNavItems} />
          </NavGroup>
          <div className="mx-2 gold-separator" />
          <NavGroup label="Operations">
            <DashboardNav items={operationsNavItems} />
          </NavGroup>
          <div className="mx-2 gold-separator" />
          <NavGroup label="Business">
            <DashboardNav items={businessNavItems} />
          </NavGroup>
          <div className="mx-2 gold-separator" />
          <DashboardNav items={systemNavItems} />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </KeyboardShortcutsProvider>
  );
}

export default RootLayout;
