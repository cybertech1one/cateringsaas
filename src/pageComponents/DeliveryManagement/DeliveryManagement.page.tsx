"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Truck,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  MapPin,
  Phone,
  Star,
  Users,
  DollarSign,
} from "lucide-react";
import { DriverManagementPanel } from "./molecules/DriverManagementPanel";
import { DeliveryZoneConfig } from "./molecules/DeliveryZoneConfig";

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  assigned:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  picked_up:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  in_transit:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  failed:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  assigned: <Users className="h-3 w-3" />,
  picked_up: <Package className="h-3 w-3" />,
  in_transit: <Truck className="h-3 w-3" />,
  delivered: <CheckCircle2 className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  failed: <AlertTriangle className="h-3 w-3" />,
};

type DeliveryStatus =
  | "all"
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "failed";

export const DeliveryManagementPage = () => {
  const { t } = useTranslation();
  const tAny = t as (key: string) => string;
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus>("all");

  const apiContext = api.useContext();

  // Get user's menus
  const menusQuery = api.menus.getMenus.useQuery();
  const menuId = menusQuery.data?.[0]?.id;

  // Delivery queries
  const deliveriesQuery = api.delivery.getDeliveryRequests.useQuery(
    {
      menuId: menuId ?? "",
      ...(statusFilter !== "all"
        ? {
            status: statusFilter as Exclude<DeliveryStatus, "all">,
          }
        : {}),
    },
    {
      enabled: !!menuId,
      refetchInterval: 10_000,
    },
  );

  const statsQuery = api.delivery.getDeliveryStats.useQuery(
    { menuId: menuId ?? "" },
    { enabled: !!menuId },
  );

  const driversQuery = api.drivers.getDriversForRestaurant.useQuery(
    { menuId: menuId ?? "" },
    { enabled: !!menuId },
  );

  // Mutations
  const autoDispatchMutation = api.delivery.autoDispatch.useMutation({
    onSuccess: (data) => {
      if (data.assigned) {
        toast({
          title: `${tAny("delivery.autoDispatch")} - ${data.driver?.fullName}`,
        });
      } else {
        toast({
          title:
            data.reason ?? tAny("delivery.noDriversAvailable"),
          variant: "destructive",
        });
      }

      void apiContext.delivery.invalidate();
    },
    onError: (err) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const cancelMutation = api.delivery.cancelDelivery.useMutation({
    onSuccess: () => {
      toast({ title: tAny("delivery.cancelDelivery") });
      void apiContext.delivery.invalidate();
    },
    onError: (err) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  if (menusQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (!menuId) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Truck className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">
            {tAny("delivery.title")}
          </h2>
          <p className="text-muted-foreground">
            Create a menu first to manage deliveries
          </p>
        </div>
      </DashboardShell>
    );
  }

  const stats = statsQuery.data;
  const deliveries = deliveriesQuery.data?.deliveries ?? [];
  const approvedDrivers =
    driversQuery.data?.filter((d) => d.status === "approved") ?? [];
  const pendingDrivers =
    driversQuery.data?.filter((d) => d.status === "pending") ?? [];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {tAny("delivery.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tAny("delivery.requests")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void apiContext.delivery.invalidate()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {tAny("delivery.refresh")}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">
                {tAny("delivery.stats.totalDeliveries")}
              </div>
              <div className="mt-1 text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">
                {tAny("delivery.stats.pendingCount")}
              </div>
              <div className="mt-1 text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">
                {tAny("delivery.successRate")}
              </div>
              <div className="mt-1 text-2xl font-bold text-green-600">
                {stats.successRate}%
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">
                {tAny("delivery.stats.avgDeliveryTime")}
              </div>
              <div className="mt-1 text-2xl font-bold">
                {stats.avgDeliveryMinutes
                  ? `${stats.avgDeliveryMinutes} min`
                  : "\u2014"}
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Content */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">
              {tAny("delivery.tabs.activeDeliveries")}
            </TabsTrigger>
            <TabsTrigger value="drivers">
              {tAny("delivery.tabs.drivers")}
              {pendingDrivers.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {pendingDrivers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              {tAny("delivery.tabs.settings")}
            </TabsTrigger>
            <TabsTrigger value="settlement">
              {tAny("delivery.tabs.settlement")}
            </TabsTrigger>
          </TabsList>

          {/* Active Deliveries Tab */}
          <TabsContent value="active" className="mt-6 space-y-4">
            {/* Drivers Summary */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 font-semibold">
                <Users className="mr-2 inline h-4 w-4" />
                {tAny("delivery.drivers")}
              </h3>
              <div className="flex gap-6 text-sm">
                <span className="text-green-600">
                  {approvedDrivers.length} {tAny("delivery.approved")}
                </span>
                <span className="text-yellow-600">
                  {pendingDrivers.length} {tAny("delivery.pendingLabel")}
                </span>
                <span className="text-muted-foreground">
                  {approvedDrivers.filter((d) => d.driver.isAvailable).length}{" "}
                  {tAny("delivery.availableNow")}
                </span>
              </div>
            </div>

            {/* Filter + Delivery List */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as DeliveryStatus)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={tAny("delivery.filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tAny("delivery.allStatuses")}</SelectItem>
                    <SelectItem value="pending">
                      {tAny("delivery.status.pending")}
                    </SelectItem>
                    <SelectItem value="assigned">
                      {tAny("delivery.status.assigned")}
                    </SelectItem>
                    <SelectItem value="picked_up">
                      {tAny("delivery.status.picked_up")}
                    </SelectItem>
                    <SelectItem value="in_transit">
                      {tAny("delivery.status.in_transit")}
                    </SelectItem>
                    <SelectItem value="delivered">
                      {tAny("delivery.status.delivered")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {tAny("delivery.status.cancelled")}
                    </SelectItem>
                    <SelectItem value="failed">
                      {tAny("delivery.status.failed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deliveriesQuery.isLoading && <LoadingScreen />}

              {!deliveriesQuery.isLoading && deliveries.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground">
                    {tAny("delivery.noDeliveries")}
                  </p>
                </div>
              )}

              {!deliveriesQuery.isLoading && deliveries.length > 0 && (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="rounded-lg border bg-card p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[delivery.status] ?? ""}`}
                            >
                              {STATUS_ICONS[delivery.status]}
                              {tAny(
                                `delivery.status.${delivery.status}`,
                              )}
                            </span>
                            <span className="text-sm font-medium">
                              #{delivery.orders?.orderNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {delivery.orders?.customerName}
                            </span>
                            {delivery.dropoffAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {delivery.dropoffAddress}
                              </span>
                            )}
                          </div>
                          {delivery.driver && (
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="h-3 w-3 text-blue-500" />
                              <span className="font-medium">
                                {delivery.driver.fullName}
                              </span>
                              <span className="flex items-center gap-0.5 text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {delivery.driver.rating}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {delivery.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                disabled={autoDispatchMutation.isLoading}
                                onClick={() =>
                                  autoDispatchMutation.mutate({
                                    deliveryId: delivery.id,
                                  })
                                }
                              >
                                <Zap className="mr-1 h-3 w-3" />
                                {tAny("delivery.autoDispatch")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={cancelMutation.isLoading}
                                onClick={() =>
                                  cancelMutation.mutate({
                                    deliveryId: delivery.id,
                                  })
                                }
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                {tAny("delivery.cancelDelivery")}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>
                          {tAny("delivery.deliveryFee")}:{" "}
                          {((delivery.deliveryFee ?? 0) / 100).toFixed(2)} MAD
                        </span>
                        {delivery.estimatedDuration && (
                          <span>
                            {tAny("delivery.estimatedTime")}:{" "}
                            {delivery.estimatedDuration} min
                          </span>
                        )}
                        {delivery.estimatedDistance && (
                          <span>
                            {tAny("delivery.distance")}:{" "}
                            {delivery.estimatedDistance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="mt-6">
            <DriverManagementPanel menuId={menuId} t={tAny} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <DeliveryZoneConfig menuId={menuId} t={tAny} />
          </TabsContent>

          {/* Settlement Tab */}
          <TabsContent value="settlement" className="mt-6">
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    {tAny("delivery.settlement.title")}
                  </h3>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  {tAny("delivery.settlement.description")}
                </p>

                {stats ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        {tAny("delivery.settlement.totalFees")}
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {(stats.totalFees / 100).toFixed(2)} MAD
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        {tAny("delivery.settlement.totalDriverPayouts")}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-orange-600">
                        {(stats.totalDriverEarnings / 100).toFixed(2)} MAD
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        {tAny("delivery.settlement.platformRevenue")}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        {((stats.totalFees - stats.totalDriverEarnings) / 100).toFixed(2)} MAD
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}

                <p className="mt-6 text-xs text-muted-foreground">
                  {tAny("delivery.settlement.comingSoon")}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
};
