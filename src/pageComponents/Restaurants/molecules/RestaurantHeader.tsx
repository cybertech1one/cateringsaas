"use client";

import { Store, UtensilsCrossed, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RestaurantHeaderProps {
  name: string;
  cuisineType: string | null;
  website: string | null;
  description: string | null;
}

export function RestaurantHeader({
  name,
  cuisineType,
  website,
  description,
}: RestaurantHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <Store className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {cuisineType && (
              <span className="flex items-center gap-1">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                {cuisineType}
              </span>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 transition-colors hover:text-primary"
              >
                <Globe className="h-3.5 w-3.5" />
                {t("restaurants.website")}
              </a>
            )}
            {description && (
              <span className="text-muted-foreground/70">
                {description}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
