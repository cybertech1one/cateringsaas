"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "~/components/Icons";
import { type NavItem } from "~/components/Navbar/molecules/MainNav";
import { cn } from "~/utils/cn";

export type SidebarNavItem = NavItem & {
  icon?: keyof typeof Icons;
  badge?: React.ReactNode;
};

interface DashboardNavProps {
  items: readonly SidebarNavItem[];
}

export function DashboardNav({ items }: DashboardNavProps) {
  const path = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <nav aria-label="Dashboard" className="flex w-full grow flex-row flex-wrap gap-0.5 md:flex-col">
      {items.map((item) => {
        const Icon = Icons[item.icon || "arrowRight"];
        const isActive = path === item.href;

        return (
          item.href && (
            <Link key={item.href} href={item.disabled ? "/" : item.href} aria-current={isActive ? "page" : undefined}>
              <span
                className={cn(
                  "group relative flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/[0.08] text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  item.disabled && "cursor-not-allowed opacity-80",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "mr-2.5 h-4 w-4 transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/70 group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{item.title}</span>
                {item.badge}
              </span>
            </Link>
          )
        );
      })}
    </nav>
  );
}
