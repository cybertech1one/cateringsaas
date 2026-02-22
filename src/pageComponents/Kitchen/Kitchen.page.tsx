"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  ChefHat,
  Clock,
  Bell,
  Check,
  X as XIcon,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  RefreshCw,
  ChevronsRight,
  AlertTriangle,
  Columns,
  LayoutList,
  Settings2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "~/utils/cn";

// -- Types ----------------------------------------------------------------

type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

type OrderItem = {
  id: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  dishes: { pictureUrl: string | null; kitchenStationId: string | null } | null;
};

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  currency: string;
  customerName: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  tableNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  orderItems: OrderItem[];
};

type Station = {
  id: string;
  menuId: string;
  name: string;
  color: string;
  sortOrder: number;
  dishCount: number;
};

// -- Helpers ---------------------------------------------------------------

function getMinutesAgo(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

function getUrgencyLevel(minutesAgo: number): "low" | "medium" | "high" {
  if (minutesAgo < 5) return "low";
  if (minutesAgo <= 15) return "medium";

  return "high";
}

const URGENCY_BORDER_COLORS = {
  low: "border-l-green-500",
  medium: "border-l-amber-500",
  high: "border-l-red-500",
} as const;

const URGENCY_BG = {
  low: "bg-green-500/10",
  medium: "bg-amber-500/10",
  high: "bg-red-500/10",
} as const;

const URGENCY_TEXT = {
  low: "text-green-400",
  medium: "text-amber-400",
  high: "text-red-400",
} as const;

// -- Column config --------------------------------------------------------

type ColumnConfig = {
  key: string;
  statuses: OrderStatus[];
  titleKey: string;
  accentClass: string;
  headerBg: string;
  icon: React.ReactNode;
};

const COLUMNS: ColumnConfig[] = [
  {
    key: "new",
    statuses: ["pending", "confirmed"],
    titleKey: "kitchen.newOrders",
    accentClass: "text-red-400",
    headerBg: "bg-red-500/15 border-red-500/30",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    key: "preparing",
    statuses: ["preparing"],
    titleKey: "kitchen.preparing",
    accentClass: "text-amber-400",
    headerBg: "bg-amber-500/15 border-amber-500/30",
    icon: <ChefHat className="h-5 w-5" />,
  },
  {
    key: "ready",
    statuses: ["ready"],
    titleKey: "kitchen.ready",
    accentClass: "text-green-400",
    headerBg: "bg-green-500/15 border-green-500/30",
    icon: <Check className="h-5 w-5" />,
  },
  {
    key: "completed",
    statuses: ["completed"],
    titleKey: "kitchen.completed",
    accentClass: "text-gray-400",
    headerBg: "bg-gray-500/15 border-gray-500/30",
    icon: <ChevronsRight className="h-5 w-5" />,
  },
];

// -- Default station colors -----------------------------------------------

const STATION_COLOR_OPTIONS: string[] = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

// -- Order Card -----------------------------------------------------------

function OrderCard({
  order,
  onAction,
  isCompact,
  isLargeFont,
  isUpdating,
  t,
}: {
  order: Order;
  onAction: (orderId: string, status: OrderStatus) => void;
  isCompact: boolean;
  isLargeFont: boolean;
  isUpdating: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [minutesAgo, setMinutesAgo] = useState(
    getMinutesAgo(order.createdAt),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesAgo(getMinutesAgo(order.createdAt));
    }, 30_000); // update every 30 seconds

    return () => clearInterval(interval);
  }, [order.createdAt]);

  const urgency = getUrgencyLevel(minutesAgo);

  const getAction = (): {
    status: OrderStatus;
    labelKey: string;
  } | null => {
    switch (order.status) {
      case "pending":
      case "confirmed":
        return { status: "preparing", labelKey: "kitchen.startPreparing" };
      case "preparing":
        return { status: "ready", labelKey: "kitchen.markReady" };
      case "ready":
        return { status: "completed", labelKey: "kitchen.markComplete" };
      default:
        return null;
    }
  };

  const action = getAction();

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-card/90 backdrop-blur-sm transition-all hover:border-border/60",
        "border-l-4",
        URGENCY_BORDER_COLORS[urgency],
        isCompact ? "p-3" : "p-4",
      )}
    >
      {/* Header: order number + time */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono font-bold",
              isLargeFont ? "text-2xl" : "text-lg",
            )}
          >
            #{String(order.orderNumber).padStart(3, "0")}
          </span>
          {order.tableNumber && (
            <span
              className={cn(
                "rounded-md bg-muted/60 px-2 py-0.5 font-medium",
                isLargeFont ? "text-base" : "text-xs",
              )}
            >
              {t("kitchen.table", { number: order.tableNumber })}
            </span>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5",
            URGENCY_BG[urgency],
            URGENCY_TEXT[urgency],
            isLargeFont ? "text-sm" : "text-xs",
          )}
        >
          <Clock className="h-3 w-3" />
          <span>
            {minutesAgo < 1
              ? t("kitchen.justNow")
              : t("kitchen.timeAgo", { minutes: minutesAgo })}
          </span>
        </div>
      </div>

      {/* Customer name */}
      {order.customerName && (
        <p
          className={cn(
            "mt-1 text-muted-foreground",
            isLargeFont ? "text-base" : "text-sm",
          )}
        >
          {order.customerName}
        </p>
      )}

      {/* Items list */}
      <div className={cn("mt-3 space-y-1", isCompact && "mt-2")}>
        {order.orderItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between",
              isLargeFont ? "text-base" : "text-sm",
            )}
          >
            <span className="font-medium">
              <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded bg-muted/80 font-mono text-xs font-bold">
                {item.quantity}
              </span>
              {item.dishName}
            </span>
          </div>
        ))}
      </div>

      {/* Special notes / allergies */}
      {(order.customerNotes ||
        order.orderItems.some((i) => i.notes)) && (
        <div className="mt-3 space-y-1">
          {order.customerNotes && (
            <div
              className={cn(
                "flex items-start gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1.5",
                isLargeFont ? "text-sm" : "text-xs",
              )}
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-400" />
              <span className="font-medium text-red-300">
                {order.customerNotes}
              </span>
            </div>
          )}
          {order.orderItems
            .filter((i) => i.notes)
            .map((item) => (
              <div
                key={`note-${item.id}`}
                className={cn(
                  "flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5",
                  isLargeFont ? "text-sm" : "text-xs",
                )}
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
                <span className="text-amber-300">
                  {item.dishName}: {item.notes}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Action buttons */}
      {(action || order.status === "pending" || order.status === "confirmed") && (
        <div className="mt-3 flex gap-2">
          {action && (
            <Button
              size={isLargeFont ? "default" : "sm"}
              className={cn(
                "flex-1 rounded-lg font-semibold",
                isLargeFont ? "h-12 text-base" : "h-9",
              )}
              onClick={() => onAction(order.id, action.status)}
              disabled={isUpdating}
            >
              {t(action.labelKey)}
            </Button>
          )}
          {(order.status === "pending" || order.status === "confirmed") && (
            <Button
              size={isLargeFont ? "default" : "sm"}
              variant="destructive"
              className={cn(
                "rounded-lg",
                isLargeFont ? "h-12" : "h-9",
              )}
              onClick={() => onAction(order.id, "cancelled")}
              disabled={isUpdating}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// -- Kitchen Column -------------------------------------------------------

function KitchenColumn({
  config,
  orders,
  onAction,
  isCompact,
  isLargeFont,
  isUpdating,
  t,
}: {
  config: ColumnConfig;
  orders: Order[];
  onAction: (orderId: string, status: OrderStatus) => void;
  isCompact: boolean;
  isLargeFont: boolean;
  isUpdating: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="flex h-full min-w-[300px] flex-1 flex-col">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-xl border px-4 py-3",
          config.headerBg,
        )}
      >
        <div className="flex items-center gap-2">
          <span className={config.accentClass}>{config.icon}</span>
          <h2
            className={cn(
              "font-bold",
              isLargeFont ? "text-xl" : "text-base",
              config.accentClass,
            )}
          >
            {t(config.titleKey)}
          </h2>
        </div>
        <span
          className={cn(
            "flex h-7 min-w-[28px] items-center justify-center rounded-full bg-background/60 px-2 font-mono font-bold",
            isLargeFont ? "text-lg" : "text-sm",
            config.accentClass,
          )}
        >
          {orders.length}
        </span>
      </div>

      {/* Column body - scrollable */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-b-xl border border-t-0 border-border/30 bg-background/40 p-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
            <ChefHat className="mb-2 h-8 w-8" />
            <p className={isLargeFont ? "text-base" : "text-sm"}>
              {t("kitchen.noOrders")}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={onAction}
              isCompact={isCompact}
              isLargeFont={isLargeFont}
              isUpdating={isUpdating}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  );
}

// -- Station Tabs ---------------------------------------------------------

function StationTabs({
  stations,
  activeStationId,
  onSelect,
  isLargeFont,
  t,
}: {
  stations: Station[];
  activeStationId: string | null;
  onSelect: (stationId: string | null) => void;
  isLargeFont: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          isLargeFont && "px-4 py-2 text-base",
          activeStationId === null
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border/40 bg-background/60 text-muted-foreground hover:bg-muted/40",
        )}
      >
        {t("kitchen.stations.all")}
      </button>
      {stations.map((station) => (
        <button
          key={station.id}
          onClick={() => onSelect(station.id)}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            isLargeFont && "px-4 py-2 text-base",
            activeStationId === station.id
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border/40 bg-background/60 text-muted-foreground hover:bg-muted/40",
          )}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: station.color }}
          />
          {station.name}
          <span className="ml-0.5 text-xs opacity-60">
            ({station.dishCount})
          </span>
        </button>
      ))}
    </div>
  );
}

// -- Manage Stations Dialog -----------------------------------------------

function ManageStationsDialog({
  open,
  onOpenChange,
  menuId,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { toast } = useToast();
  const trpcContext = api.useContext();

  const { data: stations, isLoading } = api.kitchen.getStations.useQuery(
    { menuId },
    { enabled: open && !!menuId },
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(STATION_COLOR_OPTIONS[0]!);
  const [isCreating, setIsCreating] = useState(false);

  const createMutation = api.kitchen.createStation.useMutation({
    onSuccess: () => {
      toast({ title: t("kitchen.stations.created") });
      void trpcContext.kitchen.getStations.invalidate({ menuId });
      setFormName("");
      setFormColor(STATION_COLOR_OPTIONS[0]!);
      setIsCreating(false);
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.kitchen.updateStation.useMutation({
    onSuccess: () => {
      toast({ title: t("kitchen.stations.updated") });
      void trpcContext.kitchen.getStations.invalidate({ menuId });
      setEditingId(null);
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.kitchen.deleteStation.useMutation({
    onSuccess: () => {
      toast({ title: t("kitchen.stations.deleted") });
      void trpcContext.kitchen.getStations.invalidate({ menuId });
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formName.trim()) return;
    createMutation.mutate({
      menuId,
      name: formName.trim(),
      color: formColor,
    });
  };

  const handleUpdate = (stationId: string) => {
    if (!formName.trim()) return;
    updateMutation.mutate({
      stationId,
      name: formName.trim(),
      color: formColor,
    });
  };

  const handleDelete = (stationId: string) => {
    deleteMutation.mutate({ stationId });
  };

  const startEdit = (station: Station) => {
    setEditingId(station.id);
    setFormName(station.name);
    setFormColor(station.color);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormName("");
    setFormColor(STATION_COLOR_OPTIONS[0]!);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormName("");
    setFormColor(STATION_COLOR_OPTIONS[0]!);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("kitchen.stations.manage")}</DialogTitle>
          <DialogDescription>
            {t("kitchen.stations.title")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading && (
            <div className="flex justify-center py-6">
              <LoadingScreen />
            </div>
          )}

          {/* Existing stations */}
          {stations?.map((station) => (
            <div
              key={station.id}
              className="flex items-center gap-3 rounded-lg border border-border/40 p-3"
            >
              {editingId === station.id ? (
                <div className="flex flex-1 flex-col gap-2">
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t("kitchen.stations.namePlaceholder")}
                    className="h-9"
                  />
                  <div className="flex items-center gap-1.5">
                    {STATION_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setFormColor(c)}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 transition-transform",
                          formColor === c
                            ? "scale-110 border-foreground"
                            : "border-transparent hover:scale-105",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(station.id)}
                      disabled={updateMutation.isLoading || !formName.trim()}
                    >
                      {t("kitchen.stations.edit")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      {t("common.backButton")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: station.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{station.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("kitchen.stations.dishCount", {
                        count: station.dishCount,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => startEdit(station)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(station.id)}
                      disabled={deleteMutation.isLoading}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Create new station form */}
          {isCreating ? (
            <div className="space-y-2 rounded-lg border border-dashed border-primary/40 p-3">
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("kitchen.stations.namePlaceholder")}
                className="h-9"
                autoFocus
              />
              <div className="flex items-center gap-1.5">
                {STATION_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform",
                      formColor === c
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={createMutation.isLoading || !formName.trim()}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t("kitchen.stations.add")}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  {t("common.backButton")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg border-dashed"
              onClick={startCreate}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t("kitchen.stations.add")}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.backButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Main Kitchen Page ----------------------------------------------------

export function KitchenPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLargeFont, setIsLargeFont] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [manageStationsOpen, setManageStationsOpen] = useState(false);
  const previousOrderCountRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: menus, isLoading: menusLoading } =
    api.menus.getMenus.useQuery();

  // Use station-filtered endpoint when a station is selected, otherwise use the regular one
  const {
    data: kitchenData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = api.kitchen.getKitchenOrdersByStation.useQuery(
    { menuId: selectedMenuId, stationId: activeStationId },
    {
      enabled: !!selectedMenuId,
      refetchInterval: 10_000, // Auto-refresh every 10 seconds
    },
  );

  const { data: stations } = api.kitchen.getStations.useQuery(
    { menuId: selectedMenuId },
    { enabled: !!selectedMenuId },
  );

  const updateStatusMutation = api.kitchen.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast({ title: t("kitchen.statusUpdated") });
      void refetchOrders();
    },
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const handleAction = useCallback(
    (orderId: string, status: OrderStatus) => {
      updateStatusMutation.mutate({ orderId, status });
    },
    [updateStatusMutation],
  );

  // Reset station filter when menu changes
  useEffect(() => {
    setActiveStationId(null);
  }, [selectedMenuId]);

  // Sound notification for new orders
  useEffect(() => {
    if (!kitchenData || !soundEnabled) return;

    const newOrderCount =
      (kitchenData.orders.pending?.length ?? 0) +
      (kitchenData.orders.confirmed?.length ?? 0);

    if (
      newOrderCount > previousOrderCountRef.current &&
      previousOrderCountRef.current > 0
    ) {
      // Play sound for new orders
      try {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gain.gain.value = 0.3;
        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.5,
        );
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch {
        // AudioContext not available
      }

      // Browser notification
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(t("kitchen.newOrders"), {
          body: `${newOrderCount - previousOrderCountRef.current} new order(s)`,
          icon: "/favicon.ico",
        });
      }
    }

    previousOrderCountRef.current = newOrderCount;
  }, [kitchenData, soundEnabled, t]);

  // Request notification permission when sound is enabled
  useEffect(() => {
    if (soundEnabled && typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, [soundEnabled]);

  // Full-screen toggle
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullScreen(false);
    }
  }, []);

  // Listen for fullscreen exit via Escape
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handler);

    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Build grouped orders for each column
  const getOrdersForColumn = useCallback(
    (statuses: OrderStatus[]): Order[] => {
      if (!kitchenData) return [];
      const result: Order[] = [];

      for (const status of statuses) {
        const orders =
          kitchenData.orders[status as keyof typeof kitchenData.orders];

        if (orders) {
          result.push(...(orders as Order[]));
        }
      }

      return result;
    },
    [kitchenData],
  );

  const renderKitchenContent = () => {
    if (!selectedMenuId) {
      return (
        <div className="flex h-full flex-col items-center justify-center">
          <ChefHat className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h2
            className={cn(
              "font-display font-bold",
              isLargeFont ? "text-2xl" : "text-xl",
            )}
          >
            {t("kitchen.selectMenu")}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {t("kitchen.description")}
          </p>
        </div>
      );
    }

    if (ordersLoading) {
      return <LoadingScreen />;
    }

    return (
      <div className="flex h-full gap-3 overflow-x-auto p-4">
        {COLUMNS.map((col) => (
          <KitchenColumn
            key={col.key}
            config={col}
            orders={getOrdersForColumn(col.statuses)}
            onAction={handleAction}
            isCompact={isCompact}
            isLargeFont={isLargeFont}
            isUpdating={updateStatusMutation.isLoading}
            t={t as (key: string, opts?: Record<string, unknown>) => string}
          />
        ))}
      </div>
    );
  };

  if (menusLoading) return <LoadingScreen />;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full flex-col",
        isFullScreen && "fixed inset-0 z-50 bg-background",
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "flex flex-col gap-3 border-b border-border/30 bg-card/60 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between",
          isFullScreen && "px-6",
        )}
      >
        {/* Left: Title + Menu selector */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <ChefHat
              className={cn(
                "text-primary",
                isLargeFont ? "h-7 w-7" : "h-5 w-5",
              )}
            />
            <h1
              className={cn(
                "font-display font-bold tracking-tight",
                isLargeFont ? "text-2xl" : "text-xl",
              )}
            >
              {t("kitchen.title")}
            </h1>
          </div>
          <div className="min-w-[200px]">
            <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
              <SelectTrigger
                className={cn(
                  "rounded-lg border-border/40",
                  isLargeFont && "h-12 text-base",
                )}
              >
                <SelectValue placeholder={t("kitchen.selectMenuPlaceholder")} />
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
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedMenuId && (
            <>
              <Button
                variant="outline"
                size={isLargeFont ? "default" : "sm"}
                className="rounded-lg"
                onClick={() => setManageStationsOpen(true)}
              >
                <Settings2 className="mr-1.5 h-4 w-4" />
                {t("kitchen.stations.manage")}
              </Button>

              <Button
                variant="outline"
                size={isLargeFont ? "default" : "sm"}
                className="rounded-lg"
                onClick={() => void refetchOrders()}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                {t("kitchen.refreshNow")}
              </Button>
            </>
          )}

          <Button
            variant={soundEnabled ? "default" : "outline"}
            size={isLargeFont ? "default" : "sm"}
            className="rounded-lg"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={
              soundEnabled
                ? t("kitchen.soundEnabled")
                : t("kitchen.soundDisabled")
            }
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant={isLargeFont ? "default" : "outline"}
            size={isLargeFont ? "default" : "sm"}
            className="rounded-lg"
            onClick={() => setIsLargeFont(!isLargeFont)}
            title={t("kitchen.largeFontMode")}
          >
            <span className="font-bold">A</span>
          </Button>

          <Button
            variant="outline"
            size={isLargeFont ? "default" : "sm"}
            className="rounded-lg"
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? t("kitchen.expandedView") : t("kitchen.compactView")}
          >
            {isCompact ? (
              <LayoutList className="h-4 w-4" />
            ) : (
              <Columns className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size={isLargeFont ? "default" : "sm"}
            className="rounded-lg"
            onClick={toggleFullScreen}
            title={
              isFullScreen
                ? t("kitchen.exitFullScreen")
                : t("kitchen.fullScreen")
            }
          >
            {isFullScreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Station filter tabs */}
      {selectedMenuId && stations && stations.length > 0 && (
        <div className="flex items-center gap-3 border-b border-border/20 bg-card/40 px-4 py-2">
          <StationTabs
            stations={stations as Station[]}
            activeStationId={activeStationId}
            onSelect={setActiveStationId}
            isLargeFont={isLargeFont}
            t={t as (key: string, opts?: Record<string, unknown>) => string}
          />
        </div>
      )}

      {/* Auto-refresh indicator */}
      {selectedMenuId && (
        <div className="flex items-center justify-center gap-2 border-b border-border/20 bg-muted/20 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          {t("kitchen.autoRefresh")}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {renderKitchenContent()}
      </div>

      {/* Manage stations dialog */}
      {selectedMenuId && (
        <ManageStationsDialog
          open={manageStationsOpen}
          onOpenChange={setManageStationsOpen}
          menuId={selectedMenuId}
          t={t as (key: string, opts?: Record<string, unknown>) => string}
        />
      )}
    </div>
  );
}
