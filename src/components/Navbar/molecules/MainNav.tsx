"use client";

import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "~/utils/cn";
import { Icons } from "~/components/Icons";
import { MobileNav } from "./MobileNav";
import { type Route } from "next";
import { FeastQRLogo } from "./FeastQRLogo";

export type NavItem = {
  title: string | React.ReactNode;
  href: Route<string>;
  disabled?: boolean;
  mobileOnly?: boolean;
};

interface MainNavProps {
  items?: NavItem[];
  children?: React.ReactNode;
}

export function MainNav({ items, children }: MainNavProps) {
  const segment = useSelectedLayoutSegment();
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);

  return (
    <nav className="flex gap-6 md:gap-10" aria-label="Main navigation">
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <FeastQRLogo />
      </Link>
      {items?.length ? (
        <div className="hidden gap-6 md:flex">
          {items?.map((item) => (
            <Link
              key={item.href}
              href={item.disabled ? ("#" as Route) : item.href}
              className={cn(
                "flex items-center text-sm font-medium transition-all duration-200 hover:text-foreground",
                item.href.startsWith(`/${segment || ""}`)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-primary",
                item.disabled && "cursor-not-allowed opacity-80",
                item.mobileOnly && "md:hidden",
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      ) : null}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        aria-expanded={showMobileMenu}
        aria-label="Toggle navigation menu"
      >
        {showMobileMenu ? <Icons.close /> : <Icons.menu />}
        <span className="font-bold">Diyafa</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items}>{children}</MobileNav>
      )}
    </nav>
  );
}
