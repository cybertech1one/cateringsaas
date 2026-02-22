"use client";

import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { Button } from "~/components/ui/button";
import {
  User,
  Phone,
  MapPin,
  Star,
  Truck,
  Bike,
  Car,
  Footprints,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface DriverManagementPanelProps {
  menuId: string;
  t: (key: string) => string;
}

const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  bicycle: <Bike className="h-4 w-4" />,
  motorcycle: <Bike className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  van: <Truck className="h-4 w-4" />,
  on_foot: <Footprints className="h-4 w-4" />,
};

const STATUS_BADGE: Record<string, { icon: React.ReactNode; className: string }> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  approved: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function DriverManagementPanel({ menuId, t }: DriverManagementPanelProps) {
  const { toast } = useToast();
  const apiContext = api.useContext();

  const driversQuery = api.drivers.getDriversForRestaurant.useQuery(
    { menuId },
    { refetchInterval: 30_000 },
  );

  const approveMutation = api.drivers.approveDriver.useMutation({
    onSuccess: () => {
      toast({ title: t("delivery.driverManagement.approved") });
      void apiContext.drivers.getDriversForRestaurant.invalidate();
    },
    onError: (err) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = api.drivers.rejectDriver.useMutation({
    onSuccess: () => {
      toast({ title: t("delivery.driverManagement.rejected") });
      void apiContext.drivers.getDriversForRestaurant.invalidate();
    },
    onError: (err) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const drivers = driversQuery.data ?? [];

  if (driversQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
        <User className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">
          {t("delivery.driverManagement.noDrivers")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drivers.map((rd) => {
        const driver = rd.driver;
        const badge = STATUS_BADGE[rd.status] ?? STATUS_BADGE.pending;

        return (
          <div
            key={rd.id}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                {/* Name + status badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {driver.fullName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge?.className}`}
                  >
                    {badge?.icon}
                    {t(`delivery.driverManagement.${rd.status === "pending" ? "pendingApproval" : rd.status}`)}
                  </span>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {driver.phone}
                  </span>
                  {driver.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {driver.city}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    {VEHICLE_ICONS[driver.vehicleType] ?? <Truck className="h-3 w-3" />}
                    {driver.vehicleType}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {driver.rating?.toFixed(1) ?? "5.0"}
                  </span>
                  <span>
                    {driver.totalDeliveries ?? 0} {t("delivery.driverManagement.deliveries")}
                  </span>
                  <span
                    className={
                      driver.isAvailable
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {driver.isAvailable
                      ? t("delivery.driverManagement.available")
                      : t("delivery.driverManagement.unavailable")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {rd.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={approveMutation.isLoading}
                    onClick={() =>
                      approveMutation.mutate({
                        restaurantDriverId: rd.id,
                      })
                    }
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t("delivery.driverManagement.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={rejectMutation.isLoading}
                    onClick={() =>
                      rejectMutation.mutate({
                        restaurantDriverId: rd.id,
                      })
                    }
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    {t("delivery.driverManagement.reject")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
