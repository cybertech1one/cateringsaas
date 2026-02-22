"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "~/trpc/react";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { DashboardHeader } from "~/pageComponents/Dashboard/molecules/Header";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Plus,
  Store,
  MapPin,
  CalendarDays,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Lazy-load dialog - only rendered when user clicks "Create Restaurant"
const CreateRestaurantDialog = dynamic(
  () => import("./molecules/CreateRestaurantDialog").then((mod) => ({ default: mod.CreateRestaurantDialog })),
  { ssr: false },
);

export function RestaurantsPage() {
  const { t } = useTranslation();
  const { data: restaurants, isLoading } =
    api.restaurants.getRestaurants.useQuery();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <DashboardShell>
          <DashboardHeader heading={t("restaurants.title")} text={t("restaurants.description")}>
            <Button className="rounded-full px-6 shadow-sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              {t("restaurants.createRestaurant")}
            </Button>
          </DashboardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-[180px]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        </DashboardShell>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        <DashboardHeader
          heading={t("restaurants.title")}
          text={t("restaurants.description")}
        >
          <Button
            className="rounded-full px-6 shadow-sm"
            variant="default"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("restaurants.createRestaurant")}
          </Button>
        </DashboardHeader>

        <div>
          {restaurants?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {restaurants
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/dashboard/restaurants/${restaurant.id}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-card">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                            {restaurant.name}
                          </h3>
                          {restaurant.cuisineType && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <UtensilsCrossed className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {restaurant.cuisineType}
                              </span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {restaurant._count.locations ?? 0}{" "}
                            {(restaurant._count.locations ?? 0) === 1
                              ? t("restaurants.locationSingular")
                              : t("restaurants.locationPlural")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>
                            {new Date(restaurant.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-xl font-semibold">
                {t("restaurants.noRestaurants")}
              </h2>
              <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
                {t("restaurants.noRestaurantsDescription")}
              </p>
              <Button
                className="rounded-full"
                variant="default"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("restaurants.createRestaurant")}
              </Button>
            </div>
          )}
        </div>
      </DashboardShell>

      <CreateRestaurantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </main>
  );
}
