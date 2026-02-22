"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { Icons } from "~/components/Icons";
import { type NavItem } from "~/components/Navbar/molecules/MainNav";
import { TranslatedText } from "~/components/TranslatedText";
import { cn } from "~/utils/cn";

export type SidebarNavItem = NavItem & {
  icon?: keyof typeof Icons;
};

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: <TranslatedText id="sidebar.restaurant" />,
    href: "/menu/manage/[slug]/restaurant",
    icon: "menu",
  },
  {
    title: <TranslatedText id="sidebar.menu" />,
    href: "/menu/manage/[slug]/menu",
    icon: "menuSquare",
  },
  {
    title: <TranslatedText id="sidebar.QRMenu" />,
    href: "/menu/manage/[slug]/qr-menu",
    icon: "qrcode",
  },
  {
    title: <TranslatedText id="sidebar.edit" />,
    href: "/menu/manage/[slug]/edit",
    icon: "edit",
  },
  {
    title: <TranslatedText id="sidebar.design" />,
    href: "/menu/manage/[slug]/design",
    icon: "paintbrush",
  },
  {
    title: <TranslatedText id="sidebar.schedule" />,
    href: "/menu/manage/[slug]/schedule",
    icon: "clock",
  },
];

export function Sidebar() {
  const { slug } = useParams() as { slug: string };
  const path = usePathname();

  return (
    <nav className="flex h-full grow flex-row flex-wrap gap-1 rounded-2xl border border-border/50 bg-card/80 p-3 backdrop-blur-sm md:flex-col md:self-start">
      <h2 className="mb-2 hidden px-3 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground md:block">
        <TranslatedText id="sidebar.restaurant" />
      </h2>
      {sidebarNavItems.map((item) => {
        const Icon = Icons[item.icon || "menu"];
        const resolvedHref = item.href.replace("[slug]", slug);
        const isActive = path === resolvedHref;

        return (
          <Link href={resolvedHref} key={item.href}>
            <span
              className={cn(
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "mr-2.5 h-4 w-4 transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span>{item.title}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
