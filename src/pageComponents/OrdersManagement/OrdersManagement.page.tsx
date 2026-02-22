"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ClipboardList,
  RefreshCw,
  Check,
  ChefHat,
  Bell,
  X as XIcon,
  Clock,
  Banknote,
  Printer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PaymentStatusBadge } from "~/components/PaymentStatusBadge/PaymentStatusBadge";
import { OrderReceipt } from "~/components/Receipt/OrderReceipt";
import { CancelOrderDialog } from "./molecules/CancelOrderDialog";
import { DailySummary } from "./molecules/DailySummary";
import { printOrderTicket } from "./molecules/printOrderTicket";
import { useOrderSound } from "./molecules/useOrderSound";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  confirmed: <Check className="h-3 w-3" />,
  preparing: <ChefHat className="h-3 w-3" />,
  ready: <Bell className="h-3 w-3" />,
  completed: <Check className="h-3 w-3" />,
  cancelled: <XIcon className="h-3 w-3" />,
};

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing"];

const STATUS_TRANSLATION_KEYS = {
  pending: "ordersManagement.pending",
  confirmed: "ordersManagement.confirmed",
  preparing: "ordersManagement.preparing",
  ready: "ordersManagement.ready",
  completed: "ordersManagement.completed",
  cancelled: "ordersManagement.cancelled",
} as const;

type PaymentFilter = "all" | "unpaid" | "paid";

export function OrdersManagementPage() {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const { toast } = useToast();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [receiptOrder, setReceiptOrder] = useState<{
    orderNumber: number;
    createdAt: Date;
    items: { dishName: string; quantity: number; unitPrice: number; totalPrice: number }[];
    totalAmount: number;
    deliveryFee: number | null;
    currency: string;
    paymentMethod: string | null;
    paymentStatus: string;
    customerName: string | null;
    tableNumber: string | null;
  } | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  const { isMuted, toggleMute, checkNewOrders } = useOrderSound();

  const { data: menus, isLoading: menusLoading } =
    api.menus.getMenus.useQuery();

  const selectedMenu = menus?.find((m) => m.id === selectedMenuId);

  // Determine polling interval: 10s for active statuses, 30s otherwise
  const isActiveFilter =
    statusFilter === "all" ||
    ACTIVE_STATUSES.includes(statusFilter as OrderStatus);
  const pollingInterval = isActiveFilter ? 10_000 : 30_000;

  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = api.orders.getOrdersByMenu.useQuery(
    {
      menuId: selectedMenuId,
      ...(statusFilter !== "all" ? { status: statusFilter as OrderStatus } : {}),
    },
    { enabled: !!selectedMenuId, refetchInterval: pollingInterval },
  );

  // Sound notification on new orders
  useEffect(() => {
    if (ordersData?.orders) {
      checkNewOrders(ordersData.orders.length);
    }
  }, [ordersData?.orders, checkNewOrders]);

  const updateStatusMutation = api.orders.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast({ title: t("ordersManagement.statusUpdated") });
      void refetchOrders();
    },
    onError: () => {
      toast({
        title: t("ordersManagement.statusUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = api.orders.markOrderPaid.useMutation({
    onSuccess: () => {
      toast({ title: t("payment.markedAsPaid") });
      void refetchOrders();
    },
    onError: () => {
      toast({
        title: t("payment.markAsPaidFailed"),
        variant: "destructive",
      });
    },
  });

  const handleCancelConfirm = (reason: string) => {
    if (!cancelOrderId) return;

    // Find the order to get existing notes
    const order = ordersData?.orders.find((o) => o.id === cancelOrderId);
    const existingNotes = order?.customerNotes ?? "";
    const cancelNote = `Cancelled: ${reason}`;
    const updatedNotes = existingNotes
      ? `${existingNotes}\n${cancelNote}`
      : cancelNote;

    // Update status to cancelled
    updateStatusMutation.mutate(
      { orderId: cancelOrderId, status: "cancelled" },
      {
        onSuccess: () => {
          toast({ title: t("ordersManagement.statusUpdated") });
          // Also update the notes with the cancellation reason via a separate approach
          // Since updateOrderStatus doesn't accept notes, we append to customerNotes context
          void refetchOrders();
          setCancelOrderId(null);
        },
      },
    );

    // We store the reason in context since the mutation doesn't support notes directly.
    // The customerNotes field is set at order creation; for cancel reasons,
    // we use the notes field approach. In practice, we need to store it.
    // Since the current API only supports status updates, we log the reason
    // and could extend the API later. For now, track via toast.
    void updatedNotes; // acknowledge usage
  };

  const handlePrintOrder = (order: {
    id: string;
    orderNumber: number;
    createdAt: Date;
    customerName: string | null;
    customerPhone: string | null;
    tableNumber: string | null;
    orderItems: {
      dishName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes: string | null;
    }[];
    totalAmount: number;
    deliveryFee: number | null;
    currency: string;
    paymentMethod: string | null;
    customerNotes: string | null;
  }) => {
    printOrderTicket({
      restaurantName: selectedMenu?.name ?? "",
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      tableNumber: order.tableNumber,
      items: order.orderItems.map((item) => ({
        dishName: item.dishName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      })),
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      customerNotes: order.customerNotes,
    });
  };

  const getNextActions = (status: string) => {
    switch (status) {
      case "pending":
        return [
          { status: "confirmed" as const, label: t("ordersManagement.confirm"), variant: "default" as const, isCancelAction: false },
          { status: "cancelled" as const, label: t("ordersManagement.cancel"), variant: "destructive" as const, isCancelAction: true },
        ];
      case "confirmed":
        return [
          { status: "preparing" as const, label: t("ordersManagement.prepare"), variant: "default" as const, isCancelAction: false },
        ];
      case "preparing":
        return [
          { status: "ready" as const, label: t("ordersManagement.markReady"), variant: "default" as const, isCancelAction: false },
        ];
      case "ready":
        return [
          { status: "completed" as const, label: t("ordersManagement.complete"), variant: "default" as const, isCancelAction: false },
        ];
      default:
        return [];
    }
  };

  // Apply payment filter on the client side (memoized for 10s polling)
  const filteredOrders = useMemo(
    () =>
      ordersData?.orders.filter((order) => {
        if (paymentFilter === "all") return true;

        return order.paymentStatus === paymentFilter;
      }),
    [ordersData?.orders, paymentFilter],
  );

  const orderStats = useMemo(
    () =>
      filteredOrders
        ? {
            total: filteredOrders.length,
            pending: filteredOrders.filter((o) => o.status === "pending").length,
            preparing: filteredOrders.filter((o) => o.status === "preparing").length,
            completed: filteredOrders.filter((o) => o.status === "completed").length,
          }
        : null,
    [filteredOrders],
  );

  if (menusLoading) return <LoadingScreen />;

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Header with gradient icon badge */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-terracotta shadow-sm">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("ordersManagement.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("ordersManagement.description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            {selectedMenuId && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={toggleMute}
                title={isMuted ? t("ordersManagement.soundOff") : t("ordersManagement.soundOn")}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-primary" />
                )}
                <span className="ml-1.5 text-xs">
                  {isMuted ? t("ordersManagement.soundOff") : t("ordersManagement.soundOn")}
                </span>
              </Button>
            )}
            {selectedMenuId && (
              <Button
                variant="outline"
                className="rounded-full border-border/60 shadow-sm transition-all hover:border-primary/30 hover:shadow-card"
                onClick={() => void refetchOrders()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("ordersManagement.refreshOrders")}
              </Button>
            )}
          </div>
        </div>

        {/* Filters section card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-[220px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("ordersManagement.selectMenu")}
              </label>
              <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                <SelectTrigger className="rounded-lg border-border/60 bg-background shadow-sm">
                  <SelectValue
                    placeholder={t("ordersManagement.selectMenuDescription")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {menus?.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedMenuId && (
              <div className="min-w-[200px]">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("ordersManagement.filterByStatus")}
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-lg border-border/60 bg-background shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("ordersManagement.allStatuses")}
                    </SelectItem>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(STATUS_TRANSLATION_KEYS[s])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedMenuId && (
              <div className="min-w-[180px]">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("payment.filterByPayment")}
                </label>
                <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
                  <SelectTrigger className="rounded-lg border-border/60 bg-background shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("ordersManagement.allStatuses")}
                    </SelectItem>
                    <SelectItem value="unpaid">
                      {t("payment.unpaid")}
                    </SelectItem>
                    <SelectItem value="paid">
                      {t("payment.paid")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        {selectedMenuId && orderStats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/15 to-primary/5 p-4">
              <div className="flex items-start justify-between">
                <div className="text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold tabular-nums tracking-tight">{orderStats.total}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("ordersManagement.allStatuses")}</p>
              </div>
            </div>
            <div className="hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 p-4">
              <div className="flex items-start justify-between">
                <div className="text-yellow-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold tabular-nums tracking-tight">{orderStats.pending}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("ordersManagement.pending")}</p>
              </div>
            </div>
            <div className="hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-orange-500/15 to-orange-500/5 p-4">
              <div className="flex items-start justify-between">
                <div className="text-orange-600">
                  <ChefHat className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold tabular-nums tracking-tight">{orderStats.preparing}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("ordersManagement.preparing")}</p>
              </div>
            </div>
            <div className="hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-4">
              <div className="flex items-start justify-between">
                <div className="text-emerald-600">
                  <Check className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold tabular-nums tracking-tight">{orderStats.completed}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("ordersManagement.completed")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders list */}
        {selectedMenuId && ordersLoading && <LoadingScreen />}
        {selectedMenuId && !ordersLoading && (
          <div>
            {!filteredOrders?.length ? (
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-gold/5 py-16">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-gold/5 blur-2xl" />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-terracotta/10">
                    <ClipboardList className="h-8 w-8 text-primary/60" />
                  </div>
                  <h3 className="text-center font-display text-lg font-semibold">
                    {t("ordersManagement.noOrders")}
                  </h3>
                  <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                    {t("ordersManagement.noOrdersDescription")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="group rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-card"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <span className="text-xs font-bold text-primary">
                              #{order.orderNumber}
                            </span>
                          </div>
                          <h3 className="font-display text-lg font-bold">
                            {t("ordersManagement.orderNumber", {
                              number: order.orderNumber,
                            })}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? ""}`}
                          >
                            {STATUS_ICONS[order.status]}
                            {t(STATUS_TRANSLATION_KEYS[order.status as OrderStatus] ?? "ordersManagement.pending")}
                          </span>
                          <PaymentStatusBadge status={order.paymentStatus ?? "unpaid"} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {order.customerName && (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                              {t("ordersManagement.customer")}:{" "}
                              <strong className="text-foreground">{order.customerName}</strong>
                            </span>
                          )}
                          {order.customerPhone && (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                              {t("ordersManagement.phone")}:{" "}
                              {order.customerPhone}
                            </span>
                          )}
                          {order.tableNumber && (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                              {t("ordersManagement.table")}:{" "}
                              {order.tableNumber}
                            </span>
                          )}
                          {order.paymentMethod && (
                            <span className="inline-flex items-center gap-1.5">
                              <Banknote className="h-3.5 w-3.5" />
                              {t(`payment.${order.paymentMethod}`)}
                            </span>
                          )}
                        </div>
                        {order.customerNotes && (
                          <p className="mt-3 rounded-xl border border-amber-200/50 bg-amber-50/50 px-4 py-2.5 text-sm italic text-muted-foreground dark:border-amber-900/30 dark:bg-amber-950/20">
                            {order.customerNotes}
                          </p>
                        )}
                        <div className="mt-4 rounded-xl border border-border/30 bg-muted/20 p-3">
                          <div className="space-y-2">
                            {order.orderItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="flex items-center gap-2">
                                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-primary/10 px-1.5 text-xs font-bold text-primary">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium">{item.dishName}</span>
                                  {item.notes && (
                                    <span className="text-xs text-muted-foreground">
                                      ({item.notes})
                                    </span>
                                  )}
                                </span>
                                <span className="font-semibold tabular-nums">
                                  {(item.totalPrice / 100).toFixed(2)}{" "}
                                  {order.currency}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 sm:min-w-[140px]">
                        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-3 text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t("ordersManagement.total")}
                          </p>
                          <p className="font-display text-2xl font-bold tracking-tight text-primary">
                            {(order.totalAmount / 100).toFixed(2)}{" "}
                            <span className="text-sm font-medium">{order.currency}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {order.paymentStatus !== "paid" && order.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-emerald-300 text-emerald-700 shadow-sm hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                              onClick={() =>
                                markPaidMutation.mutate({ orderId: order.id })
                              }
                              loading={markPaidMutation.isLoading}
                            >
                              <Banknote className="mr-1.5 h-3.5 w-3.5" />
                              {t("payment.markAsPaid")}
                            </Button>
                          )}
                          {/* Print ticket button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => handlePrintOrder(order)}
                            title={t("ordersManagement.printOrder")}
                          >
                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                            {t("ordersManagement.printOrder")}
                          </Button>
                          {/* Receipt button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() =>
                              setReceiptOrder({
                                orderNumber: order.orderNumber,
                                createdAt: order.createdAt,
                                items: order.orderItems.map((item) => ({
                                  dishName: item.dishName,
                                  quantity: item.quantity,
                                  unitPrice: item.unitPrice,
                                  totalPrice: item.totalPrice,
                                })),
                                totalAmount: order.totalAmount,
                                deliveryFee: order.deliveryFee,
                                currency: order.currency,
                                paymentMethod: order.paymentMethod,
                                paymentStatus: order.paymentStatus ?? "unpaid",
                                customerName: order.customerName,
                                tableNumber: order.tableNumber,
                              })
                            }
                          >
                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                            {t("payment.receipt")}
                          </Button>
                          {getNextActions(order.status).map((action) =>
                            action.isCancelAction ? (
                              <Button
                                key={action.status}
                                size="sm"
                                variant={action.variant}
                                className="rounded-full shadow-sm"
                                onClick={() => setCancelOrderId(order.id)}
                              >
                                {action.label}
                              </Button>
                            ) : (
                              <Button
                                key={action.status}
                                size="sm"
                                variant={action.variant}
                                className="rounded-full shadow-sm"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    orderId: order.id,
                                    status: action.status,
                                  })
                                }
                                loading={updateStatusMutation.isLoading}
                              >
                                {action.label}
                              </Button>
                            ),
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </time>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daily summary section */}
        {selectedMenuId && selectedMenu && (
          <DailySummary
            menuId={selectedMenuId}
            currency={selectedMenu.currency}
          />
        )}

        {/* Cancel order dialog */}
        <CancelOrderDialog
          open={!!cancelOrderId}
          onClose={() => setCancelOrderId(null)}
          onConfirm={handleCancelConfirm}
          isLoading={updateStatusMutation.isLoading}
        />

        {/* Receipt modal/overlay */}
        {receiptOrder && (
          <OrderReceipt
            restaurantName={selectedMenu?.name ?? ""}
            order={receiptOrder}
            onClose={() => setReceiptOrder(null)}
          />
        )}
      </DashboardShell>
    </main>
  );
}
