"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InventoryPanelProps {
  menuId: string;
  defaultLanguageId: string;
}

interface StockEdit {
  quantity: number | null;
  trackInventory: boolean;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock" | "not_tracked";

function getStatus(
  trackInventory: boolean | null,
  stockQuantity: number | null,
  lowStockThreshold: number | null,
  isSoldOut: boolean | null,
): InventoryStatus {
  if (!trackInventory) {
    return "not_tracked";
  }

  if (isSoldOut || stockQuantity === 0) {
    return "out_of_stock";
  }

  if (
    stockQuantity !== null &&
    lowStockThreshold !== null &&
    stockQuantity <= lowStockThreshold
  ) {
    return "low_stock";
  }

  return "in_stock";
}

function StatusBadge({ status, t }: { status: InventoryStatus; t: (key: string) => string }) {
  switch (status) {
    case "in_stock":
      return (
        <Badge className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          {t("inventory.inStock")}
        </Badge>
      );
    case "low_stock":
      return (
        <Badge className="gap-1 border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3" />
          {t("inventory.lowStock")}
        </Badge>
      );
    case "out_of_stock":
      return (
        <Badge className="gap-1 border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <XCircle className="h-3 w-3" />
          {t("inventory.outOfStock")}
        </Badge>
      );
    case "not_tracked":
      return (
        <Badge variant="secondary" className="gap-1">
          <CircleDashed className="h-3 w-3" />
          {t("inventory.notTracked")}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InventoryPanel({ menuId, defaultLanguageId }: InventoryPanelProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const { toast } = useToast();
  const apiContext = api.useContext();

  const { data: dishes, isLoading } = api.menus.getInventoryStatus.useQuery(
    { menuId },
    { staleTime: 15_000 },
  );

  const bulkUpdateMutation = api.menus.bulkUpdateStock.useMutation({
    onSuccess: () => {
      toast({
        title: t("inventory.updated"),
        description: t("toast.saveSuccessDescription"),
      });
      void apiContext.menus.getInventoryStatus.invalidate({ menuId });
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const toggleTrackMutation = api.menus.toggleTrackInventory.useMutation({
    onSuccess: () => {
      void apiContext.menus.getInventoryStatus.invalidate({ menuId });
    },
  });

  // Local edits for bulk save
  const [edits, setEdits] = useState<Record<string, StockEdit>>({});
  const hasEdits = Object.keys(edits).length > 0;

  const getEditedValue = useCallback(
    (dishId: string, field: "quantity" | "trackInventory", original: unknown) => {
      const edit = edits[dishId];

      if (!edit) {
        return original;
      }

      return field === "quantity" ? edit.quantity : edit.trackInventory;
    },
    [edits],
  );

  const setStockEdit = useCallback(
    (dishId: string, quantity: number | null, trackInventory: boolean) => {
      setEdits((prev) => ({
        ...prev,
        [dishId]: { quantity, trackInventory },
      }));
    },
    [],
  );

  const handleQuantityChange = useCallback(
    (dishId: string, newQty: number | null, trackInventory: boolean) => {
      setStockEdit(dishId, newQty, trackInventory);
    },
    [setStockEdit],
  );

  const handleToggleTrack = useCallback(
    (dishId: string, enabled: boolean) => {
      toggleTrackMutation.mutate({ dishId, enabled });
    },
    [toggleTrackMutation],
  );

  const handleBulkSave = useCallback(() => {
    const items = Object.entries(edits).map(([dishId, edit]) => ({
      dishId,
      quantity: edit.quantity,
    }));

    if (items.length === 0) {
      return;
    }

    bulkUpdateMutation.mutate({ menuId, items });
    setEdits({});
  }, [edits, menuId, bulkUpdateMutation]);

  const getDishName = useCallback(
    (dishTranslations: Array<{ name: string; languageId: string }>) => {
      const match = dishTranslations.find(
        (tr) => tr.languageId === defaultLanguageId,
      );

      return match?.name ?? dishTranslations[0]?.name ?? "???";
    },
    [defaultLanguageId],
  );

  const getCategoryName = useCallback(
    (
      categories: {
        id: string;
        categoriesTranslation: Array<{ name: string; languageId: string }>;
      } | null,
    ) => {
      if (!categories) {
        return t("inventory.noCategory");
      }

      const match = categories.categoriesTranslation.find(
        (tr) => tr.languageId === defaultLanguageId,
      );

      return match?.name ?? categories.categoriesTranslation[0]?.name ?? t("inventory.noCategory");
    },
    [defaultLanguageId, t],
  );

  // --- Loading state ---
  if (isLoading) {
    return <InventoryLoadingSkeleton />;
  }

  if (!dishes || dishes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card p-8 text-center">
        <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("menuCreator.noDishes")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("inventory.title")}</h3>
        </div>
        {hasEdits && (
          <Button
            size="sm"
            onClick={handleBulkSave}
            disabled={bulkUpdateMutation.isLoading}
          >
            {bulkUpdateMutation.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("inventory.saving")}
              </>
            ) : (
              t("inventory.bulkUpdate")
            )}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {t("inventory.dishName")}
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                {t("inventory.category")}
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                {t("inventory.stock")}
              </th>
              <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground md:table-cell">
                {t("inventory.threshold")}
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                {t("inventory.track")}
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                {t("inventory.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((dish) => {
              const editedQty = getEditedValue(
                dish.id,
                "quantity",
                dish.stockQuantity,
              ) as number | null;
              const isTracked = dish.trackInventory === true;
              const status = getStatus(
                dish.trackInventory,
                editedQty,
                dish.lowStockThreshold,
                dish.isSoldOut,
              );

              return (
                <tr
                  key={dish.id}
                  className="border-b border-border/30 transition-colors hover:bg-muted/30"
                >
                  {/* Dish Name */}
                  <td className="px-4 py-3 font-medium">
                    {getDishName(dish.dishesTranslation)}
                  </td>

                  {/* Category */}
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {getCategoryName(dish.categories)}
                  </td>

                  {/* Stock Quantity with +/- */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {isTracked ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const current = editedQty ?? 0;
                              const newQty = Math.max(0, current - 1);

                              handleQuantityChange(dish.id, newQty, isTracked);
                            }}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            className="h-8 w-16 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={editedQty ?? ""}
                            placeholder={t("inventory.unlimited")}
                            onChange={(e) => {
                              const val = e.target.value;

                              if (val === "") {
                                handleQuantityChange(dish.id, null, isTracked);
                              } else {
                                const num = parseInt(val, 10);

                                if (!isNaN(num) && num >= 0) {
                                  handleQuantityChange(dish.id, num, isTracked);
                                }
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const current = editedQty ?? 0;

                              handleQuantityChange(
                                dish.id,
                                current + 1,
                                isTracked,
                              );
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("inventory.unlimited")}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Threshold */}
                  <td className="hidden px-4 py-3 text-center tabular-nums text-muted-foreground md:table-cell">
                    {isTracked ? (dish.lowStockThreshold ?? 5) : "-"}
                  </td>

                  {/* Track Toggle */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <Switch
                        checked={isTracked}
                        onCheckedChange={(checked) => {
                          handleToggleTrack(dish.id, checked);
                        }}
                      />
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <StatusBadge status={status} t={t} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function InventoryLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="rounded-lg border border-border/50">
        <div className="border-b border-border/50 bg-muted/50 px-4 py-3">
          <div className="flex gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 border-b border-border/30 px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
