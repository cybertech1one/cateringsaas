"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useToast } from "~/components/ui/use-toast";
import { MapPin, MessageSquare, Navigation } from "lucide-react";

interface OrderSettingsProps {
  menuId: string;
}

const ORDER_TYPES = ["dine_in", "pickup", "delivery"] as const;

type OrderType = (typeof ORDER_TYPES)[number];

export function OrderSettings({ menuId }: OrderSettingsProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const utils = api.useContext();
  const { toast } = useToast();

  const { data, isLoading } = api.orders.getMenuOrderSettings.useQuery({
    menuId,
  });

  const [enabledOrderTypes, setEnabledOrderTypes] = useState<OrderType[]>([
    "dine_in",
  ]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(5);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(15);
  const [restaurantLat, setRestaurantLat] = useState<string>("");
  const [restaurantLng, setRestaurantLng] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [whatsappNotifyEnabled, setWhatsappNotifyEnabled] = useState(false);

  useEffect(() => {
    if (data) {
      setEnabledOrderTypes(
        (data.enabledOrderTypes as OrderType[]) ?? ["dine_in"],
      );
      setDeliveryFee(data.deliveryFee ?? 0);
      setDeliveryRadiusKm(data.deliveryRadiusKm ?? 5);
      setMinOrderAmount(data.minOrderAmount ?? 0);
      setEstimatedPrepTime(data.estimatedPrepTime ?? 15);
      setRestaurantLat(data.restaurantLat?.toString() ?? "");
      setRestaurantLng(data.restaurantLng?.toString() ?? "");
      setWhatsappNotifyEnabled(data.whatsappNotifyEnabled ?? false);
    }
  }, [data]);

  const mutation = api.orders.updateMenuOrderSettings.useMutation({
    onSuccess: () => {
      void utils.orders.getMenuOrderSettings.invalidate({ menuId });
      toast({
        title: t("orderSettings.saved"),
      });
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const handleToggleOrderType = (type: OrderType) => {
    setEnabledOrderTypes((prev) => {
      if (prev.includes(type)) {
        // Must keep at least one
        if (prev.length <= 1) return prev;

        return prev.filter((item) => item !== type);
      }

      return [...prev, type];
    });
  };

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: t("toastCommon.errorTitle"),
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });

      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRestaurantLat(position.coords.latitude.toFixed(6));
        setRestaurantLng(position.coords.longitude.toFixed(6));
        setIsLocating(false);
        toast({
          title: t("delivery.zone.coordinatesSet"),
        });
      },
      () => {
        setIsLocating(false);
        toast({
          title: t("toastCommon.errorTitle"),
          description: "Unable to retrieve your location",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [toast, t]);

  const handleSave = () => {
    const parsedLat = restaurantLat ? parseFloat(restaurantLat) : null;
    const parsedLng = restaurantLng ? parseFloat(restaurantLng) : null;

    // Validate coordinates if either is provided
    if ((parsedLat !== null) !== (parsedLng !== null)) {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("delivery.zone.bothCoordsRequired"),
        variant: "destructive",
      });

      return;
    }

    if (parsedLat !== null && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("delivery.zone.invalidLat"),
        variant: "destructive",
      });

      return;
    }

    if (parsedLng !== null && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("delivery.zone.invalidLng"),
        variant: "destructive",
      });

      return;
    }

    mutation.mutate({
      menuId,
      enabledOrderTypes,
      deliveryFee,
      deliveryRadiusKm,
      minOrderAmount,
      estimatedPrepTime,
      restaurantLat: parsedLat,
      restaurantLng: parsedLng,
      whatsappNotifyEnabled,
    });
  };

  const isDeliveryEnabled = enabledOrderTypes.includes("delivery");
  const currency = data?.currency ?? "MAD";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Types Checkboxes */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-semibold">
            {t("orderSettings.orderTypes")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("orderSettings.orderTypesDescription")}
          </p>
        </div>
        <div className="space-y-2">
          {ORDER_TYPES.map((type) => {
            const typeMap: Record<OrderType, string> = {
              dine_in: "dineIn",
              pickup: "pickup",
              delivery: "delivery",
            };
            const labelKey = `orderSettings.${typeMap[type]}`;
            const descMap: Record<OrderType, string> = {
              dine_in: "dineInDescription",
              pickup: "pickupDescription",
              delivery: "deliveryDescription",
            };
            const descKey = `orderSettings.${descMap[type]}`;
            const checked = enabledOrderTypes.includes(type);

            return (
              <label
                key={type}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleOrderType(type)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium">{t(labelKey)}</span>
                  <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Delivery-specific settings */}
      {isDeliveryEnabled && (
        <div className="space-y-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="deliveryFee" className="text-sm font-medium">
              {t("orderSettings.deliveryFee")}
            </Label>
            <Input
              id="deliveryFee"
              type="number"
              min={0}
              max={100000}
              value={deliveryFee}
              onChange={(e) =>
                setDeliveryFee(Math.max(0, parseInt(e.target.value) || 0))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t("orderSettings.deliveryFeeHelper", { currency })}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deliveryRadius" className="text-sm font-medium">
              {t("orderSettings.deliveryRadius")}
            </Label>
            <Input
              id="deliveryRadius"
              type="number"
              min={1}
              max={100}
              value={deliveryRadiusKm}
              onChange={(e) =>
                setDeliveryRadiusKm(
                  Math.max(1, parseInt(e.target.value) || 1),
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              {t("orderSettings.deliveryRadiusHelper")}
            </p>
          </div>

          {/* Delivery Zone Coordinates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                {t("delivery.zone.title")}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("delivery.zone.coordsHelp")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="restaurantLat" className="text-xs">
                  {t("delivery.zone.latitude")}
                </Label>
                <Input
                  id="restaurantLat"
                  type="text"
                  inputMode="decimal"
                  placeholder="33.573110"
                  value={restaurantLat}
                  onChange={(e) => setRestaurantLat(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restaurantLng" className="text-xs">
                  {t("delivery.zone.longitude")}
                </Label>
                <Input
                  id="restaurantLng"
                  type="text"
                  inputMode="decimal"
                  placeholder="-7.589843"
                  value={restaurantLng}
                  onChange={(e) => setRestaurantLng(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="w-full"
            >
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
              {isLocating ? "..." : t("delivery.zone.useMyLocation")}
            </Button>

            {restaurantLat && restaurantLng && (
              <p className="text-xs text-emerald-600">
                {t("delivery.zone.maxRadius", { radius: deliveryRadiusKm })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* General order settings */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="minOrderAmount" className="text-sm font-medium">
            {t("orderSettings.minOrderAmount")}
          </Label>
          <Input
            id="minOrderAmount"
            type="number"
            min={0}
            max={100000}
            value={minOrderAmount}
            onChange={(e) =>
              setMinOrderAmount(Math.max(0, parseInt(e.target.value) || 0))
            }
          />
          <p className="text-xs text-muted-foreground">
            {t("orderSettings.minOrderAmountHelper", { currency })}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimatedPrepTime" className="text-sm font-medium">
            {t("orderSettings.prepTime")}
          </Label>
          <Input
            id="estimatedPrepTime"
            type="number"
            min={1}
            max={120}
            value={estimatedPrepTime}
            onChange={(e) =>
              setEstimatedPrepTime(
                Math.max(1, parseInt(e.target.value) || 15),
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            {t("orderSettings.prepTimeHelper")}
          </p>
        </div>
      </div>

      {/* WhatsApp Notification Toggle */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">
            {t("orderSettings.whatsappNotify")}
          </Label>
        </div>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
            whatsappNotifyEnabled
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <input
            type="checkbox"
            checked={whatsappNotifyEnabled}
            onChange={(e) => setWhatsappNotifyEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div className="min-w-0">
            <span className="text-sm font-medium">
              {t("orderSettings.whatsappNotifyLabel")}
            </span>
            <p className="text-xs text-muted-foreground">
              {t("orderSettings.whatsappNotifyDescription")}
            </p>
            {whatsappNotifyEnabled && !data?.whatsappNumber && (
              <p className="mt-1 text-xs text-amber-600">
                {t("orderSettings.whatsappNotifyWarning")}
              </p>
            )}
          </div>
        </label>
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={mutation.isLoading}
        className="w-full"
      >
        {mutation.isLoading ? "..." : t("orderSettings.save")}
      </Button>
    </div>
  );
}
