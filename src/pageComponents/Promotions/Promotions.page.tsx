"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { PromotionCard } from "./molecules/PromotionCard";
import { PromotionFilters } from "./molecules/PromotionFilters";
import { Plus, Megaphone } from "lucide-react";
import {
  type FilterStatus,
  type Promotion,
  getPromotionStatus,
} from "./types";

// Lazy-load PromotionDialog - only rendered when user clicks create/edit
const PromotionDialog = dynamic(
  () => import("./molecules/PromotionDialog").then((mod) => ({ default: mod.PromotionDialog })),
  { ssr: false },
);

// ── Component ────────────────────────────────────────────────

export function PromotionsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );

  // ── Queries ──────────────────────────────────────────────

  const { data: restaurants, isLoading: restaurantsLoading } =
    api.restaurants.getRestaurants.useQuery();

  const {
    data: promotions,
    isLoading: promotionsLoading,
    refetch: refetchPromotions,
  } = api.promotions.getPromotions.useQuery(
    { restaurantId: selectedRestaurantId },
    { enabled: !!selectedRestaurantId },
  );

  const { data: menus } = api.menus.getMenus.useQuery();

  // ── Mutations ────────────────────────────────────────────

  const toggleMutation = api.promotions.togglePromotion.useMutation({
    onSuccess: () => {
      toast({ title: t("toast.promotionToggled") });
      void refetchPromotions();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.promotions.deletePromotion.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.promotionDeleted"),
        description: t("toast.promotionDeletedDescription"),
      });
      void refetchPromotions();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Filtering ────────────────────────────────────────────

  const filteredPromotions = useMemo(() => {
    if (!promotions) return [];
    if (filterStatus === "all") return promotions;

    return promotions.filter(
      (p: unknown) => getPromotionStatus(p as Promotion) === filterStatus,
    );
  }, [promotions, filterStatus]);

  // ── Handlers ─────────────────────────────────────────────

  const handleEdit = useCallback((promo: Promotion) => {
    setEditingPromotion(promo);
    setDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingPromotion(null);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingPromotion(null);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setDialogOpen(false);
    setEditingPromotion(null);
    void refetchPromotions();
  }, [refetchPromotions]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate({ id });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.mutate],
  );

  const handleToggle = useCallback(
    (id: string) => {
      toggleMutation.mutate({ id });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleMutation.mutate],
  );

  // ── Loading state ────────────────────────────────────────

  if (restaurantsLoading) {
    return (
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <DashboardShell>
          <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-primary shadow-sm">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                  {t("promotions.title")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("promotions.description")}
                </p>
              </div>
            </div>
            <Button className="rounded-full px-6 shadow-sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              {t("promotions.createPromotion")}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <div className="space-y-3">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </DashboardShell>
      </main>
    );
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Header with gradient icon badge */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-primary shadow-sm">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("promotions.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("promotions.description")}
              </p>
            </div>
          </div>
          {selectedRestaurantId && (
            <Button
              className="rounded-full px-6 shadow-sm"
              variant="default"
              onClick={handleCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("promotions.createPromotion")}
            </Button>
          )}
        </div>

        {/* Restaurant selector in section card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="max-w-sm">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("promotions.selectRestaurant")}
            </label>
            <Select
              value={selectedRestaurantId}
              onValueChange={setSelectedRestaurantId}
            >
              <SelectTrigger className="rounded-lg border-border/60 bg-background shadow-sm">
                <SelectValue placeholder={t("promotions.selectRestaurantPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {restaurants?.map((restaurant: { id: string; name: string }) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter tabs in section card */}
        {selectedRestaurantId && (
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <PromotionFilters
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              promotions={promotions as Promotion[] | undefined}
            />
          </div>
        )}

        {/* Promotions loading */}
        {selectedRestaurantId && promotionsLoading && <LoadingScreen />}

        {/* Promotions list */}
        {selectedRestaurantId && !promotionsLoading && (
          <div>
            {!filteredPromotions.length ? (
              <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-purple-500/5 via-transparent to-gold/5 p-8 text-center">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-gold/5 blur-2xl" />
                <div className="relative">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-primary/10">
                    <Megaphone className="h-10 w-10 text-purple-500/60" />
                  </div>
                  <h2 className="mt-6 font-display text-xl font-semibold">
                    {t("promotions.noPromotions")}
                  </h2>
                  <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
                    {t("promotions.noPromotionsDescription")}
                  </p>
                  <Button
                    className="rounded-full shadow-sm"
                    variant="default"
                    onClick={handleCreate}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("promotions.createPromotion")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredPromotions.map((promo: unknown) => {
                  const promotion = promo as Promotion;

                  return (
                    <PromotionCard
                      key={promotion.id}
                      promotion={promotion}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DashboardShell>

      {/* Create/Edit Dialog */}
      <PromotionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}
        restaurantId={selectedRestaurantId}
        promotion={editingPromotion}
        menus={menus ?? []}
        onSuccess={handleDialogSuccess}
      />
    </main>
  );
}
