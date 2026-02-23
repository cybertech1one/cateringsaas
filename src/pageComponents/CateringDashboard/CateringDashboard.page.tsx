"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { formatPrice } from "~/utils/currency";
import { cn } from "~/utils/cn";
import {
  Plus,
  UtensilsCrossed,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Package,
  ChevronUp,
  ChevronDown,
  Star,
  Layers,
  Users,
  Check,
  X,
  Leaf,
  Wheat,
  GripVertical,
} from "lucide-react";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

const CateringMenuForm = dynamic(
  () =>
    import("./molecules/CateringMenuForm").then((mod) => ({
      default: mod.CateringMenuForm,
    })),
  { ssr: false },
);

const CateringMenuEditor = dynamic(
  () =>
    import("./molecules/CateringMenuEditor").then((mod) => ({
      default: mod.CateringMenuEditor,
    })),
  { ssr: false },
);

// ---------------------------------------------------------------------------
// Types — derived from cateringMenus router return types
// ---------------------------------------------------------------------------

type CateringMenu = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  eventType: string;
  menuType: string;
  isPublished: boolean;
  isActive: boolean;
  isFeatured: boolean;
  minGuests: number;
  maxGuests: number | null;
  basePricePerPerson: number;
  cuisineType: string | null;
  dietaryTags: string[];
  photos: string[];
  leadTimeDays: number;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    items: number;
    categories: number;
  };
};

type CateringMenuFull = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  eventType: string;
  menuType: string;
  isPublished: boolean;
  isActive: boolean;
  isFeatured: boolean;
  minGuests: number;
  maxGuests: number | null;
  basePricePerPerson: number;
  categories: CateringCategory[];
  packages: CateringPackageFull[];
};

type CateringCategory = {
  id: string;
  cateringMenuId: string;
  name: string;
  nameAr: string | null;
  nameFr: string | null;
  description: string | null;
  sortOrder: number;
  isOptional: boolean;
  maxSelections: number | null;
  cateringItems: CateringItem[];
};

type CateringItem = {
  id: string;
  cateringCategoryId: string;
  cateringMenuId: string;
  name: string;
  nameAr: string | null;
  nameFr: string | null;
  description: string | null;
  pricePerPerson: number | null;
  pricePerUnit: number | null;
  unitLabel: string | null;
  isIncluded: boolean;
  isOptional: boolean;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  imageUrl: string | null;
  sortOrder: number;
};

type CateringPackageFull = {
  id: string;
  cateringMenuId: string;
  name: string;
  nameAr: string | null;
  nameFr: string | null;
  description: string | null;
  pricePerPerson: number;
  minGuests: number;
  maxGuests: number | null;
  isFeatured: boolean;
  sortOrder: number;
  imageUrl: string | null;
  includesText: string | null;
  packageItems: {
    id: string;
    item: CateringItem;
    category: { id: string; name: string };
    isIncluded: boolean;
  }[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEventTypeLabel(
  eventType: string,
  t: (key: string) => string,
): string {
  const key = `catering.eventTypes.${eventType}`;
  const translated = t(key);
  if (translated === key) {
    return eventType
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return translated;
}

// ---------------------------------------------------------------------------
// Dietary Badges
// ---------------------------------------------------------------------------

function DietaryBadges({
  item,
  t,
}: {
  item: CateringItem;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {item.isVegetarian && (
        <Badge
          variant="outline"
          className="border-[hsl(var(--mint-tea))]/30 bg-[hsl(var(--mint-tea))]/10 text-[hsl(var(--mint-tea))] dark:border-[hsl(var(--mint-tea))]/40 dark:bg-[hsl(var(--mint-tea))]/20 dark:text-[hsl(var(--mint-tea))] px-1.5 py-0 text-xs"
        >
          <Leaf className="mr-0.5 h-3 w-3" />
          {t("catering.dietary.vegetarian")}
        </Badge>
      )}
      {item.isVegan && (
        <Badge
          variant="outline"
          className="border-[hsl(var(--zellige-teal))]/30 bg-[hsl(var(--zellige-teal))]/10 text-[hsl(var(--zellige-teal))] dark:border-[hsl(var(--zellige-teal))]/40 dark:bg-[hsl(var(--zellige-teal))]/20 dark:text-[hsl(var(--zellige-teal))] px-1.5 py-0 text-xs"
        >
          <Leaf className="mr-0.5 h-3 w-3" />
          {t("catering.dietary.vegan")}
        </Badge>
      )}
      {item.isGlutenFree && (
        <Badge
          variant="outline"
          className="border-[hsl(var(--saffron))]/30 bg-[hsl(var(--saffron))]/10 text-[hsl(var(--saffron))] dark:border-[hsl(var(--saffron))]/40 dark:bg-[hsl(var(--saffron))]/20 dark:text-[hsl(var(--saffron))] px-1.5 py-0 text-xs"
        >
          <Wheat className="mr-0.5 h-3 w-3" />
          {t("catering.dietary.glutenFree")}
        </Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Catering Menu Card
// ---------------------------------------------------------------------------

function CateringMenuCard({
  menu,
  onEdit,
  onTogglePublish,
  onDelete,
  isToggling,
  t,
}: {
  menu: CateringMenu;
  onEdit: (menu: CateringMenu) => void;
  onTogglePublish: (id: string) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{menu.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {getEventTypeLabel(
                menu.eventType,
                t as (key: string) => string,
              )}
            </Badge>
            <Badge
              variant={menu.isPublished ? "default" : "outline"}
              className="text-xs"
            >
              {menu.isPublished
                ? t("catering.published")
                : t("catering.draft")}
            </Badge>
            {menu.isFeatured && (
              <Badge
                variant="outline"
                className="border-gold/40 bg-gold/10 text-gold text-xs"
              >
                <Star className="mr-0.5 h-3 w-3" />
                {t("catering.featured")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {menu.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {menu.description}
        </p>
      )}

      {/* Stats */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {menu._count.categories} {t("catering.categories.title")}
        </span>
        <span className="flex items-center gap-1">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          {menu._count.items} {t("catering.items.title")}
        </span>
      </div>

      {/* Price & guests */}
      {(menu.basePricePerPerson > 0 || menu.minGuests > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {menu.basePricePerPerson > 0 && (
            <span className="font-medium">
              {formatPrice(menu.basePricePerPerson)}{" "}
              <span className="text-muted-foreground">
                / {t("catering.person")}
              </span>
            </span>
          )}
          {menu.minGuests > 0 && menu.maxGuests != null && (
            <span className="text-muted-foreground">
              {menu.minGuests}–{menu.maxGuests} {t("catering.guests")}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(menu)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          {t("catering.edit")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isToggling}
          onClick={() => onTogglePublish(menu.id)}
        >
          {menu.isPublished ? (
            <>
              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
              {t("catering.unpublish")}
            </>
          ) : (
            <>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {t("catering.publish")}
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(menu.id)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {t("catering.delete")}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Package Card (for the global Packages tab)
// ---------------------------------------------------------------------------

function PackageCard({
  pkg,
  menuName,
  t,
}: {
  pkg: CateringPackageFull;
  menuName: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{pkg.name}</h3>
            {pkg.isFeatured && (
              <Badge
                variant="outline"
                className="border-gold/40 bg-gold/10 text-gold text-xs"
              >
                <Star className="mr-0.5 h-3 w-3" />
                {t("catering.featured")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{menuName}</p>
        </div>
        <span className="shrink-0 text-lg font-bold text-primary">
          {formatPrice(pkg.pricePerPerson)}
          <span className="text-xs font-normal text-muted-foreground">
            /{t("catering.person")}
          </span>
        </span>
      </div>

      {pkg.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {pkg.description}
        </p>
      )}

      {/* Guest range */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {pkg.minGuests}
          {pkg.maxGuests ? `–${pkg.maxGuests}` : "+"} {t("catering.guests")}
        </span>
        {pkg.packageItems.length > 0 && (
          <span className="flex items-center gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            {pkg.packageItems.length} {t("catering.items.title")}
          </span>
        )}
      </div>

      {/* Includes text */}
      {pkg.includesText && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t("catering.inclusionsLabel")}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {pkg.includesText.split(",").map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-sage/10 text-sage text-xs"
              >
                {tag.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Global Items Tab — all items across all menus, grouped by menu+category
// ---------------------------------------------------------------------------

function GlobalItemsTab({
  menus,
  isLoading,
  t,
}: {
  menus: CateringMenuFull[] | undefined;
  isLoading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { toast } = useToast();

  const toggleAvailMutation = api.cateringMenus.updateItem.useMutation({
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border/50 bg-card p-4"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    );
  }

  // Collect all items with their menu/category context
  const allItems: {
    item: CateringItem;
    menuName: string;
    categoryName: string;
  }[] = [];

  if (menus) {
    for (const menu of menus) {
      for (const cat of menu.categories) {
        for (const item of cat.cateringItems) {
          allItems.push({
            item,
            menuName: menu.name,
            categoryName: cat.name,
          });
        }
      }
    }
  }

  if (!allItems.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">
          {t("catering.noItemsGlobal")}
        </h2>
        <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
          {t("catering.noItemsGlobalDescription")}
        </p>
      </div>
    );
  }

  // Group by menu name, then category
  const grouped = new Map<
    string,
    Map<string, { item: CateringItem; menuName: string; categoryName: string }[]>
  >();
  for (const entry of allItems) {
    if (!grouped.has(entry.menuName)) {
      grouped.set(entry.menuName, new Map());
    }
    const menuGroup = grouped.get(entry.menuName)!;
    if (!menuGroup.has(entry.categoryName)) {
      menuGroup.set(entry.categoryName, []);
    }
    menuGroup.get(entry.categoryName)!.push(entry);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("catering.allItemsDescription")}
      </p>

      {Array.from(grouped.entries()).map(([menuName, categories]) => (
        <div key={menuName} className="space-y-3">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            {menuName}
          </h3>
          {Array.from(categories.entries()).map(([catName, items]) => (
            <div
              key={catName}
              className="rounded-xl border border-border/40 bg-card/60"
            >
              <div className="border-b border-border/30 px-4 py-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {catName}{" "}
                  <span className="text-xs">
                    ({items.length} {t("catering.items.title")})
                  </span>
                </h4>
              </div>
              <div className="divide-y divide-border/30">
                {items.map(({ item }) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      !item.isAvailable && "opacity-50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.pricePerPerson != null &&
                          item.pricePerPerson > 0 && (
                            <span className="text-sm font-semibold text-primary">
                              {formatPrice(item.pricePerPerson)}
                              <span className="text-xs font-normal text-muted-foreground">
                                /{t("catering.items.pricePerPerson")}
                              </span>
                            </span>
                          )}
                        {item.pricePerUnit != null &&
                          item.pricePerUnit > 0 && (
                            <span className="text-sm font-semibold text-primary">
                              {formatPrice(item.pricePerUnit)}
                              {item.unitLabel && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  /{item.unitLabel}
                                </span>
                              )}
                            </span>
                          )}
                        {!item.isAvailable && (
                          <Badge variant="outline" className="text-xs">
                            {t("catering.unavailable")}
                          </Badge>
                        )}
                        {item.isIncluded && (
                          <Badge
                            variant="outline"
                            className="border-sage/40 bg-sage/10 text-sage text-xs"
                          >
                            {t("catering.included")}
                          </Badge>
                        )}
                        {item.isOptional && (
                          <Badge variant="outline" className="text-xs">
                            {t("catering.optional")}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-1">
                        <DietaryBadges
                          item={item}
                          t={t as (key: string) => string}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={toggleAvailMutation.isLoading}
                      onClick={() =>
                        toggleAvailMutation.mutate({
                          itemId: item.id,
                          isAvailable: !item.isAvailable,
                        })
                      }
                      title={
                        item.isAvailable
                          ? t("catering.markUnavailable")
                          : t("catering.markAvailable")
                      }
                    >
                      {item.isAvailable ? (
                        <Check className="h-3.5 w-3.5 text-sage" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Global Packages Tab — all packages across all menus
// ---------------------------------------------------------------------------

function GlobalPackagesTab({
  menus,
  isLoading,
  t,
}: {
  menus: CateringMenuFull[] | undefined;
  isLoading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border/50 bg-card p-4"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const allPackages: { pkg: CateringPackageFull; menuName: string }[] = [];
  if (menus) {
    for (const menu of menus) {
      for (const pkg of menu.packages) {
        allPackages.push({ pkg, menuName: menu.name });
      }
    }
  }

  if (!allPackages.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">
          {t("catering.noPackagesGlobal")}
        </h2>
        <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
          {t("catering.noPackagesGlobalDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("catering.allPackagesDescription")}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allPackages.map(({ pkg, menuName }) => (
          <PackageCard key={pkg.id} pkg={pkg} menuName={menuName} t={t} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Global Categories Tab — all categories across all menus
// ---------------------------------------------------------------------------

function GlobalCategoriesTab({
  menus,
  isLoading,
  t,
}: {
  menus: CateringMenuFull[] | undefined;
  isLoading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border/50 bg-card p-4"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const allCategories: {
    category: CateringCategory;
    menuName: string;
  }[] = [];
  if (menus) {
    for (const menu of menus) {
      for (const cat of menu.categories) {
        allCategories.push({ category: cat, menuName: menu.name });
      }
    }
  }

  if (!allCategories.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Layers className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">
          {t("catering.noCategoriesGlobal")}
        </h2>
        <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
          {t("catering.noCategoriesGlobalDescription")}
        </p>
      </div>
    );
  }

  // Group by menu
  const grouped = new Map<string, CateringCategory[]>();
  for (const entry of allCategories) {
    if (!grouped.has(entry.menuName)) {
      grouped.set(entry.menuName, []);
    }
    grouped.get(entry.menuName)!.push(entry.category);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("catering.allCategoriesDescription")}
      </p>

      {Array.from(grouped.entries()).map(([menuName, categories]) => (
        <div key={menuName} className="space-y-3">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            {menuName}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl border border-border/40 bg-card/60 p-4 transition-all duration-200 hover:border-border hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold">{cat.name}</h4>
                      {cat.nameAr && (
                        <p
                          className="mt-0.5 text-sm text-muted-foreground"
                          dir="rtl"
                        >
                          {cat.nameAr}
                        </p>
                      )}
                      {cat.nameFr && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {cat.nameFr}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {cat.isOptional && (
                        <Badge variant="outline" className="text-xs">
                          {t("catering.optional")}
                        </Badge>
                      )}
                      <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  </div>
                  {cat.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {cat.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    <span>
                      {cat.cateringItems.length} {t("catering.items.title")}
                    </span>
                    {cat.maxSelections != null && (
                      <span className="text-xs">
                        (max {cat.maxSelections})
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function CateringDashboardPage() {
  const { toast } = useToast();
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const [activeTab, setActiveTab] = useState("menus");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<CateringMenu | null>(null);
  const [editorMenuId, setEditorMenuId] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────

  const {
    data: menus,
    isLoading: menusLoading,
    refetch: refetchMenus,
  } = api.cateringMenus.list.useQuery({});

  // Fetch full menu details (with categories, items, packages) for the
  // global Items/Packages/Categories tabs. We only enable this when one
  // of those tabs is active to avoid unnecessary data fetching.
  const needsFullData =
    activeTab === "items" ||
    activeTab === "packages" ||
    activeTab === "categories";

  // We fetch each menu individually only when needed. We'll use the list
  // of menu IDs to load them. For simplicity, we use a single getById for
  // the first menu, but a better approach is to iterate. Since tRPC doesn't
  // support dynamic arrays of queries easily, we'll use a different strategy:
  // fetch all menus with their full tree via the list endpoint returning
  // _count, then use individual getById calls.
  //
  // Actually, the simplest approach: we use the `list` results (which only
  // have _count), and for the detail tabs we load each menu via getById.
  // But that's N+1 queries. Instead, let me check if we can load all at once.
  //
  // The router doesn't have a "listWithDetails" endpoint, so we'll use the
  // individual getById queries for the menus we have. For performance,
  // we'll load only when the tab is active and cache the results.

  // For the global tabs, we need full details. Let's query them individually.
  // We'll use a wrapper component approach instead.

  // ── Mutations ──────────────────────────────────────────────

  const togglePublishMutation = api.cateringMenus.update.useMutation({
    onSuccess: () => {
      toast({
        title: t("catering.publishToggled"),
        description: t("catering.publishToggledDescription"),
      });
      void refetchMenus();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.cateringMenus.delete.useMutation({
    onSuccess: () => {
      toast({
        title: t("catering.menuDeleted"),
        description: t("catering.menuDeletedDescription"),
      });
      void refetchMenus();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Handlers ───────────────────────────────────────────────

  const handleCreate = useCallback(() => {
    setEditingMenu(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((menu: CateringMenu) => {
    setEditorMenuId(menu.id);
  }, []);

  const handleTogglePublish = useCallback(
    (id: string) => {
      const menu = menus?.find(
        (m: { id: string }) => m.id === id,
      ) as CateringMenu | undefined;
      togglePublishMutation.mutate({
        menuId: id,
        isPublished: menu ? !menu.isPublished : true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglePublishMutation.mutate, menus],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm(t("catering.deleteConfirm"))) {
        deleteMutation.mutate({ menuId: id });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.mutate, t],
  );

  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setEditingMenu(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setFormDialogOpen(false);
    setEditingMenu(null);
    void refetchMenus();
  }, [refetchMenus]);

  const handleEditorBack = useCallback(() => {
    setEditorMenuId(null);
    void refetchMenus();
  }, [refetchMenus]);

  // ── Editor view ────────────────────────────────────────────

  if (editorMenuId) {
    return (
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <CateringMenuEditor menuId={editorMenuId} onBack={handleEditorBack} />
      </main>
    );
  }

  // ── Loading state ──────────────────────────────────────────

  if (menusLoading) return <LoadingScreen />;

  // ── Main render ────────────────────────────────────────────

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Page Header */}
        <DashboardPageHeader
          title={t("catering.title")}
          description={t("catering.subtitle")}
          icon={<UtensilsCrossed className="h-5 w-5" />}
          actions={
            <Button
              className="gap-2 rounded-full px-6 shadow-sm"
              variant="default"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4" />
              {t("catering.createMenu")}
            </Button>
          }
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto gap-1 rounded-xl bg-muted/40 p-1">
            <TabsTrigger
              value="menus"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm"
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("catering.tabs.menus")}
              </span>
              <span className="sm:hidden">
                {t("catering.tabs.menusShort")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm"
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("catering.tabs.items")}
              </span>
              <span className="sm:hidden">
                {t("catering.tabs.itemsShort")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="packages"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("catering.tabs.packages")}
              </span>
              <span className="sm:hidden">
                {t("catering.tabs.packagesShort")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("catering.tabs.categories")}
              </span>
              <span className="sm:hidden">
                {t("catering.tabs.categoriesShort")}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ───────────────────────────────────────────────────── */}
          {/* Tab 1: My Catering Menus                              */}
          {/* ───────────────────────────────────────────────────── */}
          <TabsContent value="menus" className="mt-6">
            {!menus?.length ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">
                  {t("catering.noMenus")}
                </h2>
                <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
                  {t("catering.noMenusDescription")}
                </p>
                <Button
                  className="rounded-full"
                  variant="default"
                  onClick={handleCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("catering.createMenu")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menus.map((menu: CateringMenu) => (
                  <CateringMenuCard
                    key={menu.id}
                    menu={menu}
                    onEdit={handleEdit}
                    onTogglePublish={handleTogglePublish}
                    onDelete={handleDelete}
                    isToggling={togglePublishMutation.isLoading}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ───────────────────────────────────────────────────── */}
          {/* Tab 2: All Items                                      */}
          {/* ───────────────────────────────────────────────────── */}
          <TabsContent value="items" className="mt-6">
            <MenusDetailLoader menus={menus} enabled={activeTab === "items"}>
              {(fullMenus, loading) => (
                <GlobalItemsTab menus={fullMenus} isLoading={loading} t={t} />
              )}
            </MenusDetailLoader>
          </TabsContent>

          {/* ───────────────────────────────────────────────────── */}
          {/* Tab 3: All Packages                                   */}
          {/* ───────────────────────────────────────────────────── */}
          <TabsContent value="packages" className="mt-6">
            <MenusDetailLoader
              menus={menus}
              enabled={activeTab === "packages"}
            >
              {(fullMenus, loading) => (
                <GlobalPackagesTab
                  menus={fullMenus}
                  isLoading={loading}
                  t={t}
                />
              )}
            </MenusDetailLoader>
          </TabsContent>

          {/* ───────────────────────────────────────────────────── */}
          {/* Tab 4: All Categories                                 */}
          {/* ───────────────────────────────────────────────────── */}
          <TabsContent value="categories" className="mt-6">
            <MenusDetailLoader
              menus={menus}
              enabled={activeTab === "categories"}
            >
              {(fullMenus, loading) => (
                <GlobalCategoriesTab
                  menus={fullMenus}
                  isLoading={loading}
                  t={t}
                />
              )}
            </MenusDetailLoader>
          </TabsContent>
        </Tabs>
      </DashboardShell>

      {/* Create / Edit Menu Dialog */}
      <CateringMenuForm
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
        }}
        menu={(editingMenu ?? undefined) as never}
        onSuccess={handleFormSuccess}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// MenusDetailLoader — fetches full menu details for each menu in the list.
// Uses individual getById queries and combines the results.
// ---------------------------------------------------------------------------

function MenusDetailLoader({
  menus,
  enabled,
  children,
}: {
  menus: CateringMenu[] | undefined;
  enabled: boolean;
  children: (
    fullMenus: CateringMenuFull[] | undefined,
    isLoading: boolean,
  ) => React.ReactNode;
}) {
  // We need to call useQuery for each menu, but the number of menus is
  // dynamic. To respect the rules of hooks, we always query the first menu
  // ID (or skip). For multiple menus, we use a workaround: query only the
  // first 10 menus maximum to keep the hook count stable.
  //
  // A cleaner solution would be to add a "listWithDetails" endpoint to the
  // router, but for now this works with the existing API.

  const menuIds = (menus ?? []).map((m) => m.id).slice(0, 10);

  // We must always call hooks in the same order, so we create a fixed
  // array of 10 possible queries.
  const q0 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[0] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 0 },
  );
  const q1 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[1] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 1 },
  );
  const q2 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[2] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 2 },
  );
  const q3 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[3] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 3 },
  );
  const q4 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[4] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 4 },
  );
  const q5 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[5] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 5 },
  );
  const q6 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[6] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 6 },
  );
  const q7 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[7] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 7 },
  );
  const q8 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[8] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 8 },
  );
  const q9 = api.cateringMenus.getById.useQuery(
    { menuId: menuIds[9] ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: enabled && menuIds.length > 9 },
  );

  const queries = [q0, q1, q2, q3, q4, q5, q6, q7, q8, q9];
  const activeQueries = queries.slice(0, menuIds.length);

  const isLoading =
    !enabled || activeQueries.some((q) => q.isLoading && q.fetchStatus !== "idle");

  const fullMenus: CateringMenuFull[] = [];
  for (let i = 0; i < menuIds.length; i++) {
    const data = queries[i]?.data;
    if (data) {
      fullMenus.push(data as unknown as CateringMenuFull);
    }
  }

  return <>{children(fullMenus.length > 0 ? fullMenus : undefined, isLoading)}</>;
}
