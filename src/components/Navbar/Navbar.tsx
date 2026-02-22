"use client";

import React from "react";
import { UserAccountNav } from "./molecules/UserAccountNav";
import { MainNav, type NavItem } from "./molecules/MainNav";
import Link from "next/link";
import { useUser } from "~/providers/AuthProvider/AuthProvider";
import { LanguageToggle } from "../LanguageToggle/LanguageToggle";
import { NotificationBell } from "../Notifications/NotificationBell";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "../TranslatedText";

export const Navbar = () => {
  const { user } = useUser();
  const userLoggedIn = !!user;
  const { t } = useTranslation();

  const navbarItems: NavItem[] = userLoggedIn
    ? [
        { title: <TranslatedText id="navbar.dashboard" />, href: "/dashboard" },
        { title: <TranslatedText id="navbar.explore" />, href: "/explore" },
        { title: <TranslatedText id="dashboardSidenav.restaurants" />, href: "/dashboard/restaurants" },
        { title: <TranslatedText id="dashboardSidenav.analytics" />, href: "/dashboard/analytics" },
      ]
    : [
        { title: <TranslatedText id="navbar.explore" />, href: "/explore" },
        { title: <TranslatedText id="navbar.forRestaurants" />, href: "/for-restaurants" },
        { title: <TranslatedText id="navbar.forDrivers" />, href: "/for-drivers" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="container flex h-[72px] items-center justify-between">
        <MainNav items={navbarItems} />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {userLoggedIn && <NotificationBell />}
          {userLoggedIn ? (
            <UserAccountNav />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
            >
              {t("navbar.login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
