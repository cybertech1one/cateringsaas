"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Progress } from "~/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
  CalendarDays,
  Users,
  MapPin,
  DollarSign,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Phone,
  Mail,
  MoreHorizontal,
  AlertTriangle,
  TrendingUp,
  Eye,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_STATUSES = [
  "inquiry",
  "reviewed",
  "quoted",
  "accepted",
  "declined",
  "deposit_paid",
  "confirmed",
  "prep",
  "setup",
  "execution",
  "completed",
  "settled",
  "cancelled",
] as const;

type EventStatus = (typeof EVENT_STATUSES)[number];

const EVENT_TYPES = [
  "wedding",
  "corporate",
  "ramadan_iftar",
  "eid",
  "birthday",
  "conference",
  "funeral",
  "engagement",
  "henna",
  "graduation",
  "diffa",
  "other",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

/** Valid forward transitions (mirrors server state machine) */
const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  inquiry: ["reviewed", "cancelled"],
  reviewed: ["quoted", "declined", "cancelled"],
  quoted: ["accepted", "declined", "cancelled"],
  accepted: ["deposit_paid", "cancelled"],
  declined: [],
  deposit_paid: ["confirmed", "cancelled"],
  confirmed: ["prep", "cancelled"],
  prep: ["setup", "cancelled"],
  setup: ["execution", "cancelled"],
  execution: ["completed"],
  completed: ["settled"],
  settled: [],
  cancelled: [],
};

/** The primary forward action for each status (excludes cancel/decline) */
const NEXT_ACTION: Record<EventStatus, { label: string; target: EventStatus } | null> = {
  inquiry: { label: "Mark Reviewed", target: "reviewed" },
  reviewed: { label: "Send Quote", target: "quoted" },
  quoted: { label: "Mark Accepted", target: "accepted" },
  accepted: { label: "Mark Deposit Paid", target: "deposit_paid" },
  declined: null,
  deposit_paid: { label: "Confirm Event", target: "confirmed" },
  confirmed: { label: "Start Prep", target: "prep" },
  prep: { label: "Begin Setup", target: "setup" },
  setup: { label: "Start Execution", target: "execution" },
  execution: { label: "Mark Complete", target: "completed" },
  completed: { label: "Settle", target: "settled" },
  settled: null,
  cancelled: null,
};

/** Status display configuration */
const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  inquiry: { label: "Inquiry", color: "text-[hsl(var(--majorelle-blue))]", bgColor: "bg-[hsl(var(--majorelle-blue))]/8 border-[hsl(var(--majorelle-blue))]/20", dotColor: "bg-[hsl(var(--majorelle-blue))]" },
  reviewed: { label: "Reviewed", color: "text-[hsl(var(--chefchaouen))]", bgColor: "bg-[hsl(var(--chefchaouen))]/8 border-[hsl(var(--chefchaouen))]/20", dotColor: "bg-[hsl(var(--chefchaouen))]" },
  quoted: { label: "Quoted", color: "text-gold", bgColor: "bg-gold/8 border-gold/20", dotColor: "bg-gold" },
  accepted: { label: "Accepted", color: "text-sage", bgColor: "bg-sage/8 border-sage/20", dotColor: "bg-sage" },
  declined: { label: "Declined", color: "text-destructive", bgColor: "bg-destructive/8 border-destructive/20", dotColor: "bg-destructive" },
  deposit_paid: { label: "Deposit Paid", color: "text-[hsl(var(--zellige-teal))]", bgColor: "bg-[hsl(var(--zellige-teal))]/8 border-[hsl(var(--zellige-teal))]/20", dotColor: "bg-[hsl(var(--zellige-teal))]" },
  confirmed: { label: "Confirmed", color: "text-[hsl(var(--mint-tea))]", bgColor: "bg-[hsl(var(--mint-tea))]/8 border-[hsl(var(--mint-tea))]/20", dotColor: "bg-[hsl(var(--mint-tea))]" },
  prep: { label: "In Prep", color: "text-[hsl(var(--saffron))]", bgColor: "bg-[hsl(var(--saffron))]/8 border-[hsl(var(--saffron))]/20", dotColor: "bg-[hsl(var(--saffron))]" },
  setup: { label: "Setup", color: "text-terracotta", bgColor: "bg-terracotta/8 border-terracotta/20", dotColor: "bg-terracotta" },
  execution: { label: "Execution", color: "text-primary", bgColor: "bg-primary/8 border-primary/20", dotColor: "bg-primary" },
  completed: { label: "Completed", color: "text-muted-foreground", bgColor: "bg-muted border-border", dotColor: "bg-muted-foreground" },
  settled: { label: "Settled", color: "text-sage", bgColor: "bg-sage/8 border-sage/20", dotColor: "bg-sage" },
  cancelled: { label: "Cancelled", color: "text-destructive", bgColor: "bg-destructive/8 border-destructive/20", dotColor: "bg-destructive" },
};

/** Event type display */
const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string }> = {
  wedding: { label: "Wedding", icon: "ring", color: "bg-[hsl(var(--rose-petal))]/10 text-[hsl(var(--rose-petal))]" },
  corporate: { label: "Corporate", icon: "building", color: "bg-muted text-muted-foreground" },
  ramadan_iftar: { label: "Ramadan Iftar", icon: "moon", color: "bg-[hsl(var(--mint-tea))]/10 text-[hsl(var(--mint-tea))]" },
  eid: { label: "Eid", icon: "star", color: "bg-gold/10 text-gold" },
  birthday: { label: "Birthday", icon: "cake", color: "bg-primary/10 text-primary" },
  conference: { label: "Conference", icon: "mic", color: "bg-[hsl(var(--majorelle-blue))]/10 text-[hsl(var(--majorelle-blue))]" },
  funeral: { label: "Funeral", icon: "flower", color: "bg-muted text-muted-foreground" },
  engagement: { label: "Engagement", icon: "heart", color: "bg-[hsl(var(--rose-petal))]/10 text-[hsl(var(--rose-petal))]" },
  henna: { label: "Henna", icon: "hand", color: "bg-[hsl(var(--saffron))]/10 text-[hsl(var(--saffron))]" },
  graduation: { label: "Graduation", icon: "cap", color: "bg-[hsl(var(--chefchaouen))]/10 text-[hsl(var(--chefchaouen))]" },
  diffa: { label: "Diffa", icon: "palace", color: "bg-[hsl(var(--zellige-teal))]/10 text-[hsl(var(--zellige-teal))]" },
  other: { label: "Other", icon: "calendar", color: "bg-muted text-muted-foreground" },
};

/** Pipeline column definitions. Each maps to one or more statuses. */
const PIPELINE_COLUMNS = [
  { key: "inquiry", title: "Inquiries", statuses: ["inquiry", "reviewed"] as EventStatus[] },
  { key: "quoted", title: "Quoted", statuses: ["quoted"] as EventStatus[] },
  { key: "accepted", title: "Accepted", statuses: ["accepted", "deposit_paid"] as EventStatus[] },
  { key: "confirmed", title: "Confirmed", statuses: ["confirmed"] as EventStatus[] },
  { key: "in_progress", title: "In Progress", statuses: ["prep", "setup", "execution"] as EventStatus[] },
  { key: "completed", title: "Completed", statuses: ["completed", "settled"] as EventStatus[] },
];

/** Ordered lifecycle stages for the timeline (excludes terminal states) */
const LIFECYCLE_STAGES: EventStatus[] = [
  "inquiry",
  "reviewed",
  "quoted",
  "accepted",
  "deposit_paid",
  "confirmed",
  "prep",
  "setup",
  "execution",
  "completed",
  "settled",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventSummary = {
  id: string;
  title: string | null;
  eventType: string;
  eventDate: Date | string;
  startTime: Date | string | null;
  endTime: Date | string | null;
  venueName: string | null;
  guestCount: number;
  status: string;
  totalAmount: number | null;
  depositAmount: number | null;
  balanceDue: number | null;
  customerName: string;
  customerPhone: string | null;
  createdAt: Date | string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: Date | string | null): string {
  if (!time) return "";
  const d = new Date(time);
  // Prisma Time fields come as 1970-01-01T{HH:mm:ss}
  return d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(centimes: number | null | undefined): string {
  if (centimes == null || centimes === 0) return "-";
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

function getStatusIndex(status: string): number {
  return LIFECYCLE_STAGES.indexOf(status as EventStatus);
}

function getProgressPercent(status: string): number {
  if (status === "cancelled" || status === "declined") return 0;
  const idx = getStatusIndex(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / LIFECYCLE_STAGES.length) * 100);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Status badge with dot indicator */
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as EventStatus] ?? STATUS_CONFIG.inquiry;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-[11px] font-medium border", config.bgColor, config.color)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </Badge>
  );
}

/** Event type badge */
function TypeBadge({ eventType }: { eventType: string }) {
  const config = EVENT_TYPE_CONFIG[eventType as EventType] ?? EVENT_TYPE_CONFIG.other;
  return (
    <Badge variant="secondary" className={cn("text-[10px] font-medium", config.color)}>
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar
// ---------------------------------------------------------------------------

function StatsBar() {
  const { data: stats } = api.events.getStats.useQuery({});

  const items = [
    {
      label: "Total Events",
      value: stats?.totalEvents ?? 0,
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "New Inquiries",
      value: stats?.pendingInquiries ?? 0,
      icon: AlertTriangle,
      color: "text-[hsl(var(--saffron))]",
      bg: "bg-[hsl(var(--saffron))]/10",
    },
    {
      label: "Active",
      value: stats?.activeEvents ?? 0,
      icon: TrendingUp,
      color: "text-sage",
      bg: "bg-sage/10",
    },
    {
      label: "This Month",
      value: stats?.thisMonthEvents ?? 0,
      icon: Clock,
      color: "text-[hsl(var(--majorelle-blue))]",
      bg: "bg-[hsl(var(--majorelle-blue))]/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", item.bg)}>
              <item.icon className={cn("h-5 w-5", item.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Funnel Bar
// ---------------------------------------------------------------------------

function PipelineFunnel({ events }: { events: EventSummary[] }) {
  const total = events.length || 1;
  const segments = PIPELINE_COLUMNS.map((col) => {
    const count = events.filter((e) =>
      col.statuses.includes(e.status as EventStatus)
    ).length;
    return { ...col, count, pct: Math.round((count / total) * 100) };
  });

  const colors = [
    "bg-primary",
    "bg-gold",
    "bg-terracotta",
    "bg-sage",
    "bg-[hsl(var(--majorelle-blue))]",
    "bg-muted-foreground/40",
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((seg, i) =>
          seg.pct > 0 ? (
            <div
              key={seg.key}
              className={cn("h-full transition-all", colors[i])}
              style={{ width: `${seg.pct}%` }}
              title={`${seg.title}: ${seg.count}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg, i) => (
          <div key={seg.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", colors[i])} />
            {seg.title} ({seg.count})
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Card (Pipeline view)
// ---------------------------------------------------------------------------

function PipelineEventCard({
  event,
  onSelect,
  onStatusChange,
}: {
  event: EventSummary;
  onSelect: (id: string) => void;
  onStatusChange: (eventId: string, newStatus: EventStatus) => void;
}) {
  const status = event.status as EventStatus;
  const transitions = VALID_TRANSITIONS[status] ?? [];
  const nonCancelTransitions = transitions.filter((t) => t !== "cancelled" && t !== "declined");

  return (
    <Card
      className="transition-all hover:shadow-md cursor-pointer group border"
      onClick={() => onSelect(event.id)}
    >
      <CardContent className="p-3">
        {/* Top row: title + amount */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm leading-tight line-clamp-1">
              {event.title || "Untitled Event"}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <TypeBadge eventType={event.eventType} />
              <StatusBadge status={event.status} />
            </div>
          </div>
          {/* Quick actions dropdown */}
          {nonCancelTransitions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {nonCancelTransitions.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => onStatusChange(event.id, t)}
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-2" />
                    Move to {STATUS_CONFIG[t].label}
                  </DropdownMenuItem>
                ))}
                {transitions.includes("cancelled") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onStatusChange(event.id, "cancelled")}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-2" />
                      Cancel Event
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatDate(event.eventDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 shrink-0" />
            <span>{event.guestCount} guests</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.customerName}</span>
          </div>
          {(event.totalAmount ?? 0) > 0 && (
            <div className="flex items-center gap-1 font-medium text-sage">
              <DollarSign className="h-3 w-3 shrink-0" />
              <span>{formatCurrency(event.totalAmount)}</span>
            </div>
          )}
          {event.venueName && (
            <div className="flex items-center gap-1 col-span-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.venueName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Board (Kanban-style)
// ---------------------------------------------------------------------------

function PipelineBoard({
  events,
  onSelect,
  onStatusChange,
}: {
  events: EventSummary[];
  onSelect: (id: string) => void;
  onStatusChange: (eventId: string, newStatus: EventStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {PIPELINE_COLUMNS.map((col) => {
        const colEvents = events.filter((e) =>
          col.statuses.includes(e.status as EventStatus)
        );
        return (
          <div key={col.key} className="min-w-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {col.title}
              </h3>
              <Badge variant="secondary" className="text-xs h-5 min-w-[1.25rem] justify-center">
                {colEvents.length}
              </Badge>
            </div>
            <div className="space-y-2.5 min-h-[120px]">
              {colEvents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8 opacity-60">
                  No events
                </p>
              )}
              {colEvents.map((event) => (
                <PipelineEventCard
                  key={event.id}
                  event={event}
                  onSelect={onSelect}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// List View (Table-like)
// ---------------------------------------------------------------------------

function ListView({
  events,
  onSelect,
  sortBy,
  sortOrder,
  onSort,
}: {
  events: EventSummary[];
  onSelect: (id: string) => void;
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
}) {
  const SortHeader = ({
    field,
    children,
    className,
  }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      className={cn(
        "flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors",
        className
      )}
      onClick={() => onSort(field)}
    >
      {children}
      {sortBy === field && (
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform",
            sortOrder === "asc" ? "rotate-90" : "-rotate-90"
          )}
        />
      )}
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid md:grid-cols-[1fr_100px_120px_100px_80px_100px_100px] gap-3 px-4 py-2.5 bg-muted/50 border-b text-xs">
        <SortHeader field="date">Event</SortHeader>
        <SortHeader field="date">Type</SortHeader>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</span>
        <SortHeader field="date">Date</SortHeader>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Guests</span>
        <SortHeader field="status">Status</SortHeader>
        <SortHeader field="amount">Value</SortHeader>
      </div>
      {/* Rows */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No events match your filters
        </div>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_100px_80px_100px_100px] gap-2 md:gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
            onClick={() => onSelect(event.id)}
          >
            {/* Event name */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">
                {event.title || "Untitled"}
              </span>
            </div>
            {/* Type */}
            <div className="flex items-center">
              <TypeBadge eventType={event.eventType} />
            </div>
            {/* Client */}
            <div className="text-sm text-muted-foreground truncate">
              {event.customerName}
            </div>
            {/* Date */}
            <div className="text-sm text-muted-foreground">
              {formatDate(event.eventDate)}
            </div>
            {/* Guests */}
            <div className="text-sm text-muted-foreground">
              {event.guestCount}
            </div>
            {/* Status */}
            <div>
              <StatusBadge status={event.status} />
            </div>
            {/* Value */}
            <div className="text-sm font-medium text-sage">
              {formatCurrency(event.totalAmount)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Timeline (horizontal)
// ---------------------------------------------------------------------------

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = getStatusIndex(currentStatus);
  const isTerminal = currentStatus === "cancelled" || currentStatus === "declined";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status Progress</span>
        {!isTerminal && (
          <span className="text-xs text-muted-foreground">
            ({getProgressPercent(currentStatus)}%)
          </span>
        )}
      </div>

      {isTerminal ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-red-700">
            Event {STATUS_CONFIG[currentStatus as EventStatus].label}
          </span>
        </div>
      ) : (
        <>
          <Progress
            value={getProgressPercent(currentStatus)}
            className="h-2"
            indicatorClassName="bg-sage"
          />
          <div className="flex justify-between">
            {LIFECYCLE_STAGES.map((stage, i) => {
              const isPast = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <div
                  key={stage}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    // Hide some on small screens for readability
                    i > 0 && i < LIFECYCLE_STAGES.length - 1 && "hidden sm:flex"
                  )}
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full border-2 transition-colors",
                      isPast && "bg-sage border-sage",
                      isCurrent && "bg-white border-sage ring-2 ring-sage/30",
                      !isPast && !isCurrent && "bg-muted border-muted-foreground/20"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] leading-tight text-center max-w-[50px]",
                      isCurrent ? "font-semibold text-sage" : "text-muted-foreground"
                    )}
                  >
                    {STATUS_CONFIG[stage].label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Detail Dialog
// ---------------------------------------------------------------------------

function EventDetailDialog({
  eventId,
  open,
  onOpenChange,
  onStatusChange,
}: {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (eventId: string, newStatus: EventStatus, reason?: string) => void;
}) {
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: event, isLoading } = api.events.getById.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId && open }
  );

  const status = (event?.status ?? "inquiry") as EventStatus;
  const nextAction = NEXT_ACTION[status];
  const canCancel = VALID_TRANSITIONS[status]?.includes("cancelled");
  const canDecline = VALID_TRANSITIONS[status]?.includes("declined");

  const handleCancel = () => {
    if (!eventId || !cancelReason.trim()) return;
    onStatusChange(eventId, "cancelled", cancelReason.trim());
    setShowCancelConfirm(false);
    setCancelReason("");
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !event ? (
          <div className="py-12 text-center text-muted-foreground">Loading event details...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-lg">
                    {event.title || "Untitled Event"}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    <TypeBadge eventType={event.eventType} />
                    <StatusBadge status={event.status} />
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Status Timeline */}
            <div className="py-2">
              <StatusTimeline currentStatus={event.status} />
            </div>

            <div className="h-px bg-border" />

            {/* Event Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Event Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{formatDate(event.eventDate)}</span>
                  </div>
                  {event.startTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">
                        {formatTime(event.startTime)}
                        {event.endTime && ` - ${formatTime(event.endTime)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">
                      {event.guestCount}
                      {event.confirmedGuestCount
                        ? ` (${event.confirmedGuestCount} confirmed)`
                        : ""}
                    </span>
                  </div>
                  {event.venueName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="font-medium text-right">
                        {event.venueName}
                        {event.venueCity && `, ${event.venueCity}`}
                      </span>
                    </div>
                  )}
                  {event.venueAddress && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address</span>
                      <span className="font-medium text-right text-xs">
                        {event.venueAddress}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Client
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{event.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{event.customerPhone}</span>
                  </div>
                  {event.customerEmail && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium text-xs">{event.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            {((event.totalAmount ?? 0) > 0 ||
              (event.depositAmount ?? 0) > 0) && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financials
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-bold mt-0.5">
                        {formatCurrency(event.totalAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Deposit</p>
                      <p className="text-sm font-bold mt-0.5 text-sage">
                        {formatCurrency(event.depositAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Balance Due</p>
                      <p className="text-sm font-bold mt-0.5 text-amber-700">
                        {formatCurrency(event.balanceDue)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Payment Milestones */}
            {event.paymentSchedules &&
              event.paymentSchedules.length > 0 &&
              event.paymentSchedules[0]?.milestones &&
              event.paymentSchedules[0].milestones.length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Payment Milestones</h4>
                    <div className="space-y-1.5">
                      {event.paymentSchedules[0].milestones.map((ms) => (
                        <div
                          key={ms.id}
                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            {ms.status === "paid" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span>{ms.label ?? ms.milestoneType}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {ms.dueDate ? formatDate(ms.dueDate) : ""}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(ms.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            {/* Related Quotes */}
            {event.quotes && event.quotes.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Quotes</h4>
                  <div className="space-y-1.5">
                    {event.quotes.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/30"
                      >
                        <span>
                          Quote v{q.versionNumber} - {q.status}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(q.totalAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Special requests / notes */}
            {(event.specialRequests || event.notes) && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-2">
                  {event.specialRequests && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Special Requests</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {event.specialRequests}
                      </p>
                    </div>
                  )}
                  {event.notes && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {event.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Internal notes */}
            {event.internalNotes && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <h4 className="text-sm font-semibold mb-1">Internal Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded">
                    {event.internalNotes}
                  </p>
                </div>
              </>
            )}

            {/* Cancel confirmation */}
            {showCancelConfirm && (
              <>
                <div className="h-px bg-border" />
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 space-y-2">
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to cancel this event?
                  </p>
                  <Textarea
                    placeholder="Cancellation reason (required)..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="bg-white"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!cancelReason.trim()}
                      onClick={handleCancel}
                    >
                      Confirm Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCancelConfirm(false);
                        setCancelReason("");
                      }}
                    >
                      Keep Event
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Action buttons */}
            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                {nextAction && (
                  <Button
                    className="gap-2"
                    onClick={() => onStatusChange(event.id, nextAction.target)}
                  >
                    <ArrowRight className="h-4 w-4" />
                    {nextAction.label}
                  </Button>
                )}
                {canDecline && (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 gap-2"
                    onClick={() => onStatusChange(event.id, "declined")}
                  >
                    <XCircle className="h-4 w-4" />
                    Decline
                  </Button>
                )}
                {canCancel && !showCancelConfirm && (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 gap-2"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Event
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Create Event Dialog
// ---------------------------------------------------------------------------

type CreateEventForm = {
  title: string;
  eventType: EventType;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  guestCount: string;
  dietaryRequirements: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  internalNotes: string;
};

const EMPTY_FORM: CreateEventForm = {
  title: "",
  eventType: "other",
  eventDate: "",
  startTime: "",
  endTime: "",
  venueName: "",
  venueCity: "",
  venueAddress: "",
  guestCount: "",
  dietaryRequirements: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  notes: "",
  internalNotes: "",
};

function CreateEventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<CreateEventForm>(EMPTY_FORM);
  const { toast } = useToast();
  const utils = api.useContext();

  const createMutation = api.events.create.useMutation({
    onSuccess: () => {
      toast({ title: "Event created", description: "New event has been added to the pipeline." });
      void utils.events.list.invalidate();
      void utils.events.getStats.invalidate();
      setForm(EMPTY_FORM);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (
    field: keyof CreateEventForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const guestCount = parseInt(form.guestCount, 10);
    if (!form.title.trim() || !form.eventDate || !form.customerName.trim() || !form.customerPhone.trim() || isNaN(guestCount) || guestCount <= 0) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const dietary = form.dietaryRequirements
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    createMutation.mutate({
      title: form.title.trim(),
      eventType: form.eventType,
      eventDate: new Date(form.eventDate),
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      venueName: form.venueName || undefined,
      venueCity: form.venueCity || undefined,
      venueAddress: form.venueAddress || undefined,
      guestCount,
      dietaryRequirements: dietary.length > 0 ? dietary : undefined,
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail || undefined,
      notes: form.notes || undefined,
      internalNotes: form.internalNotes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to the pipeline. It will start as an inquiry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Name */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Event Name *</Label>
            <Input
              id="title"
              placeholder="e.g. Amrani Wedding Reception"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          {/* Type + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Event Type *</Label>
              <Select
                value={form.eventType}
                onValueChange={(v) => handleChange("eventType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EVENT_TYPE_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={form.eventDate}
                onChange={(e) => handleChange("eventDate", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
              />
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-1.5">
            <Label htmlFor="venueName">Venue Name</Label>
            <Input
              id="venueName"
              placeholder="e.g. Riad Fes"
              value={form.venueName}
              onChange={(e) => handleChange("venueName", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="venueCity">Venue City</Label>
              <Input
                id="venueCity"
                placeholder="e.g. Casablanca"
                value={form.venueCity}
                onChange={(e) => handleChange("venueCity", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guestCount">Guest Count *</Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                placeholder="150"
                value={form.guestCount}
                onChange={(e) => handleChange("guestCount", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venueAddress">Venue Address</Label>
            <Input
              id="venueAddress"
              placeholder="Full address"
              value={form.venueAddress}
              onChange={(e) => handleChange("venueAddress", e.target.value)}
            />
          </div>

          {/* Dietary */}
          <div className="space-y-1.5">
            <Label htmlFor="dietary">Dietary Requirements</Label>
            <Input
              id="dietary"
              placeholder="Halal, Vegetarian, Gluten-free (comma separated)"
              value={form.dietaryRequirements}
              onChange={(e) => handleChange("dietaryRequirements", e.target.value)}
            />
          </div>

          <div className="h-px bg-border" />

          {/* Client Info */}
          <h4 className="text-sm font-semibold">Client Information</h4>

          <div className="space-y-1.5">
            <Label htmlFor="customerName">Name *</Label>
            <Input
              id="customerName"
              placeholder="Client full name"
              value={form.customerName}
              onChange={(e) => handleChange("customerName", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customerPhone">Phone *</Label>
              <Input
                id="customerPhone"
                placeholder="+212 6XX XXX XXX"
                value={form.customerPhone}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="client@email.com"
                value={form.customerEmail}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              placeholder="Internal team notes (not visible to client)..."
              value={form.internalNotes}
              onChange={(e) => handleChange("internalNotes", e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isLoading} className="gap-2">
              {createMutation.isLoading ? (
                <>Creating...</>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Cancel Reason Dialog (for pipeline quick-cancel)
// ---------------------------------------------------------------------------

function CancelReasonDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancel Event</DialogTitle>
          <DialogDescription>
            Please provide a reason for cancellation. This will be recorded in the event notes.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Cancellation reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setReason(""); }}>
            Keep Event
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
            }}
          >
            Confirm Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Filter Bar
// ---------------------------------------------------------------------------

function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events, clients, venues..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" />
            <SelectValue placeholder="All Statuses" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {EVENT_STATUSES.filter((s) => s !== "cancelled" && s !== "declined").map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </SelectItem>
          ))}
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="declined">Declined</SelectItem>
        </SelectContent>
      </Select>

      {/* Type filter */}
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {EVENT_TYPE_CONFIG[t].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EventsManagement() {
  // -- State --
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [sortBy, setSortBy] = useState<"date" | "status" | "amount" | "created">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { toast } = useToast();
  const utils = api.useContext();

  // Debounce search
  const searchTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimerRef[0]) clearTimeout(searchTimerRef[0]);
      searchTimerRef[0] = setTimeout(() => setDebouncedSearch(value), 300);
    },
    [searchTimerRef]
  );

  // -- Data fetching --
  const statusArray = useMemo(() => {
    if (statusFilter === "all") return undefined;
    return [statusFilter] as EventStatus[];
  }, [statusFilter]);

  const { data, isLoading, isFetching } = api.events.list.useQuery({
    search: debouncedSearch || undefined,
    status: statusArray,
    eventType: typeFilter !== "all" ? (typeFilter as EventType) : undefined,
    sortBy,
    sortOrder,
    limit: 50,
  });

  const events = (data?.events ?? []) as EventSummary[];

  // -- Mutations --
  const updateStatusMutation = api.events.updateStatus.useMutation({
    onSuccess: (updatedEvent) => {
      toast({
        title: "Status updated",
        description: `Event moved to ${STATUS_CONFIG[(updatedEvent.status as EventStatus)]?.label ?? updatedEvent.status}.`,
      });
      void utils.events.list.invalidate();
      void utils.events.getById.invalidate();
      void utils.events.getStats.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // -- Handlers --
  const handleSelectEvent = useCallback((id: string) => {
    setSelectedEventId(id);
    setDetailOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    (eventId: string, newStatus: EventStatus, reason?: string) => {
      // If cancelling and no reason provided, show cancel dialog
      if (newStatus === "cancelled" && !reason) {
        setCancelTarget(eventId);
        return;
      }

      updateStatusMutation.mutate({
        eventId,
        newStatus,
        reason,
      });
    },
    [updateStatusMutation]
  );

  const handleCancelConfirm = useCallback(
    (reason: string) => {
      if (!cancelTarget) return;
      updateStatusMutation.mutate({
        eventId: cancelTarget,
        newStatus: "cancelled",
        reason,
      });
      setCancelTarget(null);
    },
    [cancelTarget, updateStatusMutation]
  );

  const handleSort = useCallback(
    (field: string) => {
      const mappedField = field as "date" | "status" | "amount" | "created";
      if (sortBy === mappedField) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(mappedField);
        setSortOrder("asc");
      }
    },
    [sortBy]
  );

  // -- Render --
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title="Events"
        description="Manage inquiries, bookings, and event execution pipeline"
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5">
              <Button
                variant={viewMode === "pipeline" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5"
                onClick={() => setViewMode("pipeline")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </div>
        }
      />

      {/* Stats Bar */}
      <StatsBar />

      {/* Pipeline Funnel */}
      {events.length > 0 && <PipelineFunnel events={events} />}

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              </div>
              {Array.from({ length: 2 }).map((_, j) => (
                <Card key={j} className="border">
                  <CardContent className="p-3 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No events found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {debouncedSearch || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "Create your first event to get started with the pipeline."}
          </p>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create your first event
          </Button>
        </div>
      ) : viewMode === "pipeline" ? (
        /* Pipeline Board */
        <PipelineBoard
          events={events}
          onSelect={handleSelectEvent}
          onStatusChange={handleStatusChange}
        />
      ) : (
        /* List View */
        <ListView
          events={events}
          onSelect={handleSelectEvent}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {/* Fetching indicator */}
      {isFetching && !isLoading && (
        <div className="fixed bottom-4 right-4 bg-background border shadow-lg rounded-full px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Updating...
        </div>
      )}

      {/* Dialogs */}
      <EventDetailDialog
        eventId={selectedEventId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
      />

      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <CancelReasonDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
