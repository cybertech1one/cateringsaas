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
  ClipboardList,
  BarChart3,
  Calendar,
  Users,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

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
// Types
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

type CateringInquiry = {
  id: string;
  cateringMenuId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  eventType: string;
  eventDate: Date;
  guestCount: number;
  status: string;
  estimatedTotal: number | null;
  specialRequests: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  cateringMenu?: { id: string; name: string };
};

type InquiryStats = {
  totalInquiries: number;
  confirmedBookings: number;
  totalRevenue: number;
  avgGuestCount: number;
};

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const INQUIRY_STATUSES = [
  "all",
  "pending",
  "reviewed",
  "quoted",
  "confirmed",
  "deposit_paid",
  "completed",
  "cancelled",
] as const;

type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "reviewed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "quoted":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "confirmed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "deposit_paid":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "completed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getEventTypeLabel(eventType: string, t: (key: string) => string): string {
  const key = `catering.eventTypes.${eventType}`;
  const translated = t(key);
  // If translation not found, fall back to formatted event type
  if (translated === key) {
    return eventType
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return translated;
}

// ---------------------------------------------------------------------------
// Overview Card
// ---------------------------------------------------------------------------

function OverviewCard({
  title,
  value,
  icon: Icon,
  loading,
  gradient,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  gradient?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
            gradient ?? "bg-gradient-to-br from-primary/20 to-primary/5",
          )}
        >
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <div className="mt-2 font-display text-2xl font-bold tracking-tight">
          {value}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inquiry Card
// ---------------------------------------------------------------------------

function InquiryCard({
  inquiry,
  onUpdateStatus,
  isUpdating,
  t,
}: {
  inquiry: CateringInquiry;
  onUpdateStatus: (id: string, status: string) => void;
  isUpdating: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  const eventDate = new Date(inquiry.eventDate);
  const isPast = eventDate < new Date();

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{inquiry.customerName}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                getStatusColor(inquiry.status),
              )}
            >
              {t(`catering.statuses.${inquiry.status}`)}
            </span>
          </div>
          {inquiry.cateringMenu && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {inquiry.cateringMenu.name}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={expanded ? t("catering.collapse") : t("catering.expand")}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Summary row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {eventDate.toLocaleDateString()}
          {isPast && (
            <span className="text-xs text-muted-foreground/60">
              ({t("catering.past")})
            </span>
          )}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {inquiry.guestCount} {t("catering.guests")}
        </span>
        <span className="flex items-center gap-1">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          {getEventTypeLabel(inquiry.eventType, t as (key: string) => string)}
        </span>
        {inquiry.estimatedTotal != null && inquiry.estimatedTotal > 0 && (
          <span className="flex items-center gap-1 font-medium text-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            {formatPrice(inquiry.estimatedTotal)}
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
          {/* Contact info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {inquiry.customerEmail && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {inquiry.customerEmail}
              </span>
            )}
            {inquiry.customerPhone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {inquiry.customerPhone}
              </span>
            )}
          </div>

          {/* Notes */}
          {inquiry.specialRequests && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("catering.customerNotes")}
              </p>
              <p className="mt-1 text-sm">{inquiry.specialRequests}</p>
            </div>
          )}

          {inquiry.adminNotes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("catering.adminNotes")}
              </p>
              <p className="mt-1 text-sm">{inquiry.adminNotes}</p>
            </div>
          )}

          {/* Status update buttons */}
          {inquiry.status !== "completed" && inquiry.status !== "cancelled" && (
            <div className="flex flex-wrap gap-2 pt-1">
              {inquiry.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(inquiry.id, "reviewed")}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  {t("catering.markReviewed")}
                </Button>
              )}
              {(inquiry.status === "pending" ||
                inquiry.status === "reviewed") && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(inquiry.id, "quoted")}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {t("catering.sendQuote")}
                </Button>
              )}
              {inquiry.status === "quoted" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(inquiry.id, "confirmed")}
                >
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  {t("catering.confirm")}
                </Button>
              )}
              {inquiry.status === "confirmed" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(inquiry.id, "deposit_paid")}
                >
                  <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                  {t("catering.markDepositPaid")}
                </Button>
              )}
              {(inquiry.status === "confirmed" ||
                inquiry.status === "deposit_paid") && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(inquiry.id, "completed")}
                >
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  {t("catering.markCompleted")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(inquiry.id, "cancelled")}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                {t("catering.cancel")}
              </Button>
            </div>
          )}
        </div>
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
              {getEventTypeLabel(menu.eventType, t as (key: string) => string)}
            </Badge>
            <Badge
              variant={menu.isPublished ? "default" : "outline"}
              className="text-xs"
            >
              {menu.isPublished
                ? t("catering.published")
                : t("catering.draft")}
            </Badge>
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
          <Package className="h-3.5 w-3.5" />
          {menu._count.categories} {t("catering.categories")}
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
  const [inquiryFilter, setInquiryFilter] = useState<InquiryStatus>("all");

  // ── Queries ────────────────────────────────────────────────

  const {
    data: menus,
    isLoading: menusLoading,
    refetch: refetchMenus,
  } = api.cateringMenus.list.useQuery({});

  // TODO: api.catering.getInquiries does not exist. The Diyafa model uses
  // api.events.list for event inquiries, but its return shape differs from
  // the CateringInquiry type used here. Wire up once the shapes are aligned.
  const {
    data: inquiriesData,
    isLoading: inquiriesLoading,
    refetch: refetchInquiries,
  } = api.events.list.useQuery(
    {
      status: inquiryFilter === "all"
        ? undefined
        : [inquiryFilter as "inquiry" | "reviewed" | "quoted" | "accepted" | "declined" | "deposit_paid" | "confirmed" | "prep" | "setup" | "execution" | "completed" | "settled" | "cancelled"],
    },
    { enabled: activeTab === "inquiries" || activeTab === "analytics" },
  );
  const inquiries = inquiriesData?.events as unknown as CateringInquiry[] | undefined;

  // TODO: api.catering.getInquiryStats does not exist. Using api.events.getStats
  // which returns a different shape (totalEvents, activeEvents, thisMonthEvents,
  // pendingInquiries). Map fields as needed once the analytics tab is finalized.
  const { data: statsRaw, isLoading: statsLoading } =
    api.events.getStats.useQuery(
      {},
      { enabled: activeTab === "analytics" },
    );
  const stats: InquiryStats | undefined = statsRaw
    ? {
        totalInquiries: statsRaw.pendingInquiries,
        confirmedBookings: statsRaw.activeEvents,
        totalRevenue: 0, // TODO: wire up from orgAnalytics.getRevenueOverview
        avgGuestCount: 0, // TODO: no direct equivalent endpoint
      }
    : undefined;

  // ── Mutations ──────────────────────────────────────────────

  // api.catering.togglePublish does not exist. Using cateringMenus.update
  // to toggle the isActive field instead.
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

  // TODO: api.catering.updateInquiryStatus does not exist. Using
  // api.events.updateStatus which has a different input shape
  // ({ eventId, newStatus, reason? } instead of { id, status }).
  const updateStatusMutation = api.events.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: t("catering.statusUpdated"),
        description: t("catering.statusUpdatedDescription"),
      });
      void refetchInquiries();
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
      // Find the menu to determine current isActive state, then toggle it
      const menu = menus?.find((m: { id: string }) => m.id === id) as CateringMenu | undefined;
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

  const handleUpdateInquiryStatus = useCallback(
    (id: string, status: string) => {
      // TODO: The status values used in the UI (pending, reviewed, quoted, etc.)
      // differ from the events router statuses (inquiry, quote_sent, confirmed, etc.).
      // A proper mapping between the two status systems is needed.
      updateStatusMutation.mutate({
        eventId: id,
        newStatus: status as "inquiry" | "reviewed" | "quoted" | "accepted" | "declined" | "deposit_paid" | "confirmed" | "prep" | "setup" | "execution" | "completed" | "settled" | "cancelled",
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateStatusMutation.mutate],
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
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {t("catering.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("catering.description")}
              </p>
            </div>
          </div>
          <Button
            className="gap-2 rounded-full px-6 shadow-sm"
            variant="default"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" />
            {t("catering.createMenu")}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
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
              value="inquiries"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("catering.tabs.inquiries")}
              </span>
              <span className="sm:hidden">
                {t("catering.tabs.inquiriesShort")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("catering.tabs.analytics")}
              </span>
              <span className="sm:hidden">
                {t("catering.tabs.analyticsShort")}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ────────────────────────────────────────────────────── */}
          {/* Tab 1: My Catering Menus                               */}
          {/* ────────────────────────────────────────────────────── */}
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
                    t={
                      t as (
                        key: string,
                        opts?: Record<string, unknown>,
                      ) => string
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ────────────────────────────────────────────────────── */}
          {/* Tab 2: Inquiries                                       */}
          {/* ────────────────────────────────────────────────────── */}
          <TabsContent value="inquiries" className="mt-6 space-y-4">
            {/* Status filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {INQUIRY_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => setInquiryFilter(status)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                    inquiryFilter === status
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {status === "all"
                    ? t("catering.filterAll")
                    : t(`catering.statuses.${status}`)}
                </button>
              ))}
            </div>

            {/* Inquiries list */}
            {inquiriesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/50 bg-card p-4 space-y-2"
                  >
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </div>
            ) : !inquiries?.length ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {t("catering.noInquiries")}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {t("catering.noInquiriesDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inquiry) => (
                  <InquiryCard
                    key={inquiry.id}
                    inquiry={inquiry}
                    onUpdateStatus={handleUpdateInquiryStatus}
                    isUpdating={updateStatusMutation.isLoading}
                    t={
                      t as (
                        key: string,
                        opts?: Record<string, unknown>,
                      ) => string
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ────────────────────────────────────────────────────── */}
          {/* Tab 3: Analytics                                       */}
          {/* ────────────────────────────────────────────────────── */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OverviewCard
                title={t("catering.analytics.totalInquiries")}
                value={stats?.totalInquiries ?? 0}
                icon={ClipboardList}
                loading={statsLoading}
              />
              <OverviewCard
                title={t("catering.analytics.confirmedBookings")}
                value={stats?.confirmedBookings ?? 0}
                icon={CheckCircle}
                loading={statsLoading}
                gradient="bg-gradient-to-br from-green-500/20 to-green-500/5"
              />
              <OverviewCard
                title={t("catering.analytics.totalRevenue")}
                value={
                  stats
                    ? formatPrice(stats.totalRevenue)
                    : "0.00"
                }
                icon={TrendingUp}
                loading={statsLoading}
                gradient="bg-gradient-to-br from-amber-500/20 to-amber-500/5"
              />
              <OverviewCard
                title={t("catering.analytics.avgGuestCount")}
                value={stats?.avgGuestCount ?? 0}
                icon={Users}
                loading={statsLoading}
                gradient="bg-gradient-to-br from-blue-500/20 to-blue-500/5"
              />
            </div>

            {/* Quick summary */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-6">
              <h3 className="font-semibold">
                {t("catering.analytics.recentActivity")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("catering.analytics.recentActivityDescription")}
              </p>
              {inquiriesLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !inquiries?.length ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  {t("catering.analytics.noRecentActivity")}
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {inquiries.slice(0, 5).map((inquiry: CateringInquiry) => (
                    <div
                      key={inquiry.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {inquiry.customerName}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            getStatusColor(inquiry.status),
                          )}
                        >
                          {t(`catering.statuses.${inquiry.status}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>
                          {inquiry.guestCount} {t("catering.guests")}
                        </span>
                        <span>
                          {new Date(inquiry.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
