"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { Button } from "~/components/ui/button";
import { Settings, Save } from "lucide-react";

interface DeliveryZoneConfigProps {
  menuId: string;
  t: (key: string) => string;
}

export function DeliveryZoneConfig({ menuId, t }: DeliveryZoneConfigProps) {
  const { toast } = useToast();

  const menuQuery = api.menus.getMenus.useQuery();
  const menu = menuQuery.data?.find((m) => m.id === menuId);

  const [radius, setRadius] = useState<number>(5);
  const [baseFee, setBaseFee] = useState<number>(0);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [dirty, setDirty] = useState(false);

  // Sync from menu data when loaded
  useEffect(() => {
    if (menu) {
      setRadius(menu.deliveryRadiusKm ?? 5);
      setBaseFee(menu.deliveryFee ?? 0);
      setMinOrder(menu.minOrderAmount ?? 0);
    }
  }, [menu]);

  const updateMutation = api.orders.updateMenuOrderSettings.useMutation({
    onSuccess: () => {
      toast({ title: t("delivery.zoneConfig.saved") });
      setDirty(false);
      void menuQuery.refetch();
    },
    onError: (err) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  function handleSave() {
    if (!menu) return;

    updateMutation.mutate({
      menuId,
      enabledOrderTypes: (menu.enabledOrderTypes ?? ["dine_in"]) as Array<"dine_in" | "pickup" | "delivery">,
      deliveryRadiusKm: radius,
      deliveryFee: baseFee,
      minOrderAmount: minOrder,
      estimatedPrepTime: menu.estimatedPrepTime ?? 15,
      restaurantLat: menu.restaurantLat ?? null,
      restaurantLng: menu.restaurantLng ?? null,
      whatsappNotifyEnabled: menu.whatsappNotifyEnabled ?? false,
    });
  }

  if (menuQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {t("delivery.zoneConfig.title")}
          </h3>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          {t("delivery.zoneConfig.description")}
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Delivery Radius */}
          <div>
            <label
              htmlFor="deliveryRadius"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("delivery.zoneConfig.deliveryRadius")}
            </label>
            <input
              id="deliveryRadius"
              type="number"
              min={1}
              max={100}
              step={1}
              value={radius}
              onChange={(e) => {
                setRadius(Number(e.target.value));
                setDirty(true);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("delivery.zoneConfig.deliveryRadiusHelper")}
            </p>
          </div>

          {/* Base Delivery Fee */}
          <div>
            <label
              htmlFor="baseFee"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("delivery.zoneConfig.baseFee")}
            </label>
            <input
              id="baseFee"
              type="number"
              min={0}
              step={100}
              value={baseFee}
              onChange={(e) => {
                setBaseFee(Number(e.target.value));
                setDirty(true);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("delivery.zoneConfig.baseFeeHelper")}
            </p>
          </div>

          {/* Minimum Order Amount */}
          <div>
            <label
              htmlFor="minOrder"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("delivery.zoneConfig.minOrderAmount")}
            </label>
            <input
              id="minOrder"
              type="number"
              min={0}
              step={100}
              value={minOrder}
              onChange={(e) => {
                setMinOrder(Number(e.target.value));
                setDirty(true);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("delivery.zoneConfig.minOrderAmountHelper")}
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={!dirty || updateMutation.isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {t("delivery.zoneConfig.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
