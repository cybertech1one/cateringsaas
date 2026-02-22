"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk";
import {
  Plus,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  MenuSquare,
  Building2,
  Star,
  Megaphone,
  ClipboardList,
  Search,
  FileText,
} from "lucide-react";
import { api } from "~/trpc/react";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
};

type ActionItem = {
  label: string;
  action: () => void;
  icon: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: menus } = api.menus.getMenus.useQuery(undefined, {
    enabled: open,
  });

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const navigationItems: NavigationItem[] = [
    {
      label: t("dashboardSidenav.menus"),
      href: "/dashboard",
      icon: <MenuSquare className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["menus", "dashboard", "home"],
    },
    {
      label: t("dashboardSidenav.restaurants"),
      href: "/dashboard/restaurants",
      icon: <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["restaurants", "locations"],
    },
    {
      label: t("dashboardSidenav.orders"),
      href: "/dashboard/orders",
      icon: <ClipboardList className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["orders", "sales"],
    },
    {
      label: t("dashboardSidenav.reviews"),
      href: "/dashboard/reviews",
      icon: <Star className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["reviews", "ratings", "feedback"],
    },
    {
      label: t("dashboardSidenav.promotions"),
      href: "/dashboard/promotions",
      icon: <Megaphone className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["promotions", "deals", "offers", "discounts"],
    },
    {
      label: t("dashboardSidenav.analytics"),
      href: "/dashboard/analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["analytics", "statistics", "data", "views"],
    },
    {
      label: t("dashboardSidenav.staff"),
      href: "/dashboard/staff",
      icon: <Users className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["staff", "team", "employees", "members"],
    },
    {
      label: t("dashboardSidenav.billing"),
      href: "/dashboard/billing",
      icon: <CreditCard className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["billing", "subscription", "payment", "plan"],
    },
    {
      label: t("dashboardSidenav.settings"),
      href: "/dashboard/settings",
      icon: <Settings className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["settings", "preferences", "account"],
    },
  ];

  const actionItems: ActionItem[] = [
    {
      label: t("commandPalette.createMenu"),
      action: () => router.push("/menu/create"),
      icon: <Plus className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      shortcut: "Ctrl+N",
      keywords: ["create", "new", "menu", "add"],
    },
    {
      label: t("dashboardSidenav.analytics"),
      action: () => router.push("/dashboard/analytics"),
      icon: <BarChart3 className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["analytics", "view", "statistics"],
    },
    {
      label: t("dashboardSidenav.staff"),
      action: () => router.push("/dashboard/staff"),
      icon: <Users className="mr-2 h-4 w-4 shrink-0 opacity-70" />,
      keywords: ["staff", "manage", "team"],
    },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("commandPalette.placeholder")}
      overlayClassName="bg-background/80 backdrop-blur-sm"
      contentClassName="fixed left-[50%] top-[50%] z-50 w-full max-w-[540px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl"
    >
      <div className="flex items-center border-b border-border/50 px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <CommandInput
          placeholder={t("commandPalette.placeholder")}
          value={search}
          onValueChange={setSearch}
          className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          ESC
        </kbd>
      </div>

      <CommandList className="max-h-[360px] overflow-y-auto overflow-x-hidden p-2">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          {t("commandPalette.noResults")}
        </CommandEmpty>

        {menus && menus.length > 0 && (
          <CommandGroup
            heading={t("commandPalette.menus")}
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            {menus.map((menu) => (
              <CommandItem
                key={menu.id}
                value={`menu-${menu.name}`}
                onSelect={() =>
                  runCommand(() =>
                    router.push(`/menu/manage/${menu.slug}`),
                  )
                }
                keywords={[menu.name, menu.slug, "menu"]}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none transition-colors aria-selected:bg-accent/50 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <FileText className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                <span className="flex-1 truncate">{menu.name}</span>
                {menu.isPublished && (
                  <span className="ml-2 inline-flex h-5 items-center rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-600">
                    {t("restaurantDashboard.menuPublished")}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {menus && menus.length > 0 && (
          <CommandSeparator className="mx-2 my-1 h-px bg-border/50" />
        )}

        <CommandGroup
          heading={t("commandPalette.navigation")}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => runCommand(() => router.push(item.href))}
              keywords={item.keywords}
              className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none transition-colors aria-selected:bg-accent/50 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  {item.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="mx-2 my-1 h-px bg-border/50" />

        <CommandGroup
          heading={t("commandPalette.actions")}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          {actionItems.map((item) => (
            <CommandItem
              key={item.label}
              value={item.label}
              onSelect={() => runCommand(item.action)}
              keywords={item.keywords}
              className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none transition-colors aria-selected:bg-accent/50 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  {item.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted px-1 py-0.5 font-mono text-[10px]">
              &uarr;&darr;
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted px-1 py-0.5 font-mono text-[10px]">
              &crarr;
            </kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted px-1 py-0.5 font-mono text-[10px]">
              esc
            </kbd>
            close
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}
