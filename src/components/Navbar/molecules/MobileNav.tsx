import * as React from "react";
import Link from "next/link";
import { cn } from "~/utils/cn";
import { useLockBody } from "~/shared/hooks/useLockBody";
import { type NavItem } from "./MainNav";

interface MobileNavProps {
  items: NavItem[];
  children?: React.ReactNode;
}

export function MobileNav({ items, children }: MobileNavProps) {
  useLockBody();

  return (
    <div
      role="dialog"
      aria-label="Mobile navigation menu"
      className={cn(
        "fixed inset-0 top-[72px] z-50 grid h-[calc(100vh-4.5rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden",
      )}
    >
      <div className="relative z-20 grid gap-4 rounded-2xl border border-border/50 bg-card/95 p-5 text-card-foreground shadow-soft backdrop-blur-xl">
        <nav className="grid grid-flow-row auto-rows-max gap-1 text-sm">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                item.disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
