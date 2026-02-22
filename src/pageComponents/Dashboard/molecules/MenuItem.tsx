import { memo } from "react";
import { MenuOperations } from "./MenuOperations";
import Link from "next/link";
import { type CateringMenus } from "@prisma/client";
import Image from "next/image";
import { MapPin, ExternalLink, Pencil, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shimmerToBase64 } from "~/utils/shimmer";

interface MenuItemProps {
  menu: CateringMenus & { logoImageUrl?: string | null; address?: string | null; city?: string | null };
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return `${Math.floor(diffDays / 30)}mo ago`;
}

export const MenuItem = memo(function MenuItem({ menu }: MenuItemProps) {
  const { t } = useTranslation();

  return (
    <div className="hover-lift group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-elevated">
      {/* Image header with gradient overlay */}
      <div className="relative aspect-[2/1] w-full bg-muted">
        {menu.logoImageUrl ? (
          <Image
            src={menu.logoImageUrl}
            fill
            alt={`${menu.name} restaurant logo`}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL={shimmerToBase64(400, 200)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-gold/10">
            <span className="font-display text-3xl font-bold text-primary/20">
              {menu.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Status badge - more prominent */}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm ${
              menu.isPublished
                ? "bg-emerald-500/90 text-white"
                : "bg-muted/90 text-muted-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                menu.isPublished ? "bg-white animate-pulse" : "bg-muted-foreground"
              }`}
            />
            {menu.isPublished
              ? t("restaurantDashboard.menuPublished")
              : t("dashboard.menuCard.draft")}
          </span>
        </div>

        {/* Updated date on image */}
        <div className="absolute bottom-2 left-3">
          <span className="text-[10px] font-medium text-white/80">
            {t("dashboard.menuCard.lastUpdated")}{" "}
            {formatRelativeDate(menu.updatedAt)}
          </span>
        </div>

        {/* Quick action buttons on hover */}
        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Link
            href={`/menu/manage/${menu.slug}/restaurant`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            title={t("dashboard.menuCard.edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          {menu.isPublished && (
            <Link
              href={`/menu/${menu.slug}/preview`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
              title={t("dashboard.menuCard.preview")}
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href={`/menu/manage/${menu.slug}/restaurant`}
              className="block"
            >
              <h3 className="truncate font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {menu.name}
              </h3>
            </Link>
            {menu.address && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {menu.address}
                  {menu.city ? `, ${menu.city}` : ""}
                </span>
              </p>
            )}
          </div>
          <MenuOperations menuId={menu.id} slug={menu.slug} />
        </div>

        {menu.isPublished && (
          <Link
            href={`/menu/${menu.slug}`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <ExternalLink className="h-3 w-3" />
            {t("dashboard.viewPublicMenu")}
          </Link>
        )}
      </div>
    </div>
  );
});
