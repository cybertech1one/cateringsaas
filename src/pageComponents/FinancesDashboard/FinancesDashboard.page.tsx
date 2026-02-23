"use client";

import { useState, useMemo } from "react";
import { api } from "~/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Skeleton } from "~/components/ui/skeleton";
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
import { useToast } from "~/components/ui/use-toast";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Send,
  Banknote,
  Building2,
  Smartphone,
  Receipt,
  Wallet,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(centimes: number): string {
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("fr-MA", { month: "short" });
}

// ---------------------------------------------------------------------------
// Status & Payment Method Colors
// ---------------------------------------------------------------------------

const MILESTONE_STATUS_STYLES: Record<string, { className: string; label: string }> = {
  pending: { className: "bg-amber-100 text-amber-800 border-amber-200", label: "Pending" },
  due: { className: "bg-orange-100 text-orange-800 border-orange-200", label: "Due" },
  paid: { className: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Paid" },
  overdue: { className: "bg-red-100 text-red-800 border-red-200", label: "Overdue" },
  waived: { className: "bg-slate-100 text-slate-600 border-slate-200", label: "Waived" },
  cancelled: { className: "bg-gray-100 text-gray-500 border-gray-200", label: "Cancelled" },
};

const INVOICE_STATUS_STYLES: Record<string, { className: string; label: string }> = {
  draft: { className: "bg-gray-100 text-gray-700 border-gray-200", label: "Draft" },
  sent: { className: "bg-blue-100 text-blue-700 border-blue-200", label: "Sent" },
  partial: { className: "bg-amber-100 text-amber-700 border-amber-200", label: "Partial" },
  paid: { className: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Paid" },
  overdue: { className: "bg-red-100 text-red-700 border-red-200", label: "Overdue" },
  cancelled: { className: "bg-gray-100 text-gray-500 border-gray-200", label: "Cancelled" },
};

const PAYMENT_METHOD_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cod: { label: "COD", icon: <Banknote className="h-3.5 w-3.5" />, color: "bg-amber-500" },
  bank_transfer: { label: "Bank Transfer", icon: <Building2 className="h-3.5 w-3.5" />, color: "bg-blue-500" },
  cmi: { label: "CMI", icon: <CreditCard className="h-3.5 w-3.5" />, color: "bg-indigo-500" },
  check: { label: "Check", icon: <Receipt className="h-3.5 w-3.5" />, color: "bg-purple-500" },
  mobile_money: { label: "Mobile Money", icon: <Smartphone className="h-3.5 w-3.5" />, color: "bg-green-500" },
  cash: { label: "Cash", icon: <Wallet className="h-3.5 w-3.5" />, color: "bg-emerald-600" },
};

const MILESTONE_TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  progress: "Progress",
  final: "Final",
  full: "Full Payment",
};

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-52">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <Skeleton
                className="w-full rounded-t"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GrowthIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Revenue Chart (CSS bars)
// ---------------------------------------------------------------------------

function RevenueChart({
  data,
}: {
  data: Array<{ month: string; revenue: number; eventCount: number }>;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxRevenue = useMemo(
    () => Math.max(...data.map((d) => d.revenue), 1),
    [data],
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
            No revenue data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 h-52 relative">
          {data.map((d, i) => {
            const pct = (d.revenue / maxRevenue) * 100;
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={d.month}
                className="flex-1 flex flex-col items-center gap-1 relative"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && d.revenue > 0 && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-gray-900 text-white text-xs rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg pointer-events-none">
                    <div className="font-semibold">{formatCurrency(d.revenue)}</div>
                    <div className="text-gray-300">
                      {d.eventCount} event{d.eventCount !== 1 ? "s" : ""}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                )}
                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? "bg-emerald-500"
                      : d.revenue > 0
                        ? "bg-emerald-400/80"
                        : "bg-gray-200"
                  }`}
                  style={{
                    height: `${Math.max(pct, d.revenue > 0 ? 4 : 2)}%`,
                  }}
                />
                {/* Month label */}
                <span className="text-[10px] text-muted-foreground leading-none">
                  {formatMonthLabel(d.month)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Payment Method Distribution
// ---------------------------------------------------------------------------

function PaymentMethodDistribution({
  data,
}: {
  data: {
    breakdown: Record<string, number>;
    total: number;
    methods: Array<{ method: string; amount: number; percentage: number }>;
  };
}) {
  if (data.methods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No payment data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked bar */}
        <div className="h-6 w-full rounded-full overflow-hidden flex bg-gray-100">
          {data.methods.map((m) => {
            const meta = PAYMENT_METHOD_META[m.method];
            return (
              <div
                key={m.method}
                className={`${meta?.color ?? "bg-gray-400"} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${m.percentage}%` }}
                title={`${meta?.label ?? m.method}: ${formatCurrency(m.amount)} (${m.percentage}%)`}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.methods.map((m) => {
            const meta = PAYMENT_METHOD_META[m.method];
            return (
              <div key={m.method} className="flex items-center gap-2 text-sm">
                <div
                  className={`h-3 w-3 rounded-full flex-shrink-0 ${meta?.color ?? "bg-gray-400"}`}
                />
                <span className="flex items-center gap-1 text-muted-foreground">
                  {meta?.icon}
                  <span>{meta?.label ?? m.method}</span>
                </span>
                <span className="ml-auto font-medium text-xs tabular-nums">
                  {m.percentage}%
                </span>
              </div>
            );
          })}
        </div>
        {/* Total */}
        <div className="pt-2 border-t text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Total collected</span>
          <span className="font-semibold">{formatCurrency(data.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Mark as Paid Dialog
// ---------------------------------------------------------------------------

function MarkAsPaidDialog({
  open,
  onOpenChange,
  milestone,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: { id: string; label: string; amount: number } | null;
  onConfirm: (milestoneId: string, paymentMethod: string) => void;
  isLoading: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Mark &quot;{milestone.label}&quot; as paid ({formatCurrency(milestone.amount)}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <label className="text-sm font-medium">Payment Method</label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cod">COD</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cmi">CMI</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(milestone.id, paymentMethod)}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FinancesDashboard() {
  const { toast } = useToast();
  const utils = api.useContext();

  // State
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [markAsPaidTarget, setMarkAsPaidTarget] = useState<{
    id: string;
    label: string;
    amount: number;
  } | null>(null);

  // Queries
  const {
    data: revenue,
    isLoading: revenueLoading,
  } = api.finances.getRevenueOverview.useQuery({});

  const {
    data: monthlyRevenue,
    isLoading: chartLoading,
  } = api.finances.getMonthlyRevenue.useQuery({ months: 12 });

  const {
    data: invoicesData,
    isLoading: invoicesLoading,
  } = api.finances.listInvoices.useQuery({ limit: 20 });

  const {
    data: milestonesData,
    isLoading: milestonesLoading,
  } = api.finances.listAllMilestones.useQuery({
    limit: 50,
    ...(milestoneFilter !== "all" ? { status: milestoneFilter as "pending" | "due" | "paid" | "overdue" | "waived" | "cancelled" } : {}),
  });

  const {
    data: paymentBreakdown,
    isLoading: breakdownLoading,
  } = api.finances.getPaymentMethodBreakdown.useQuery({});

  // Mutations
  const markAsPaidMutation = api.finances.markAsPaid.useMutation({
    onSuccess: () => {
      toast({ title: "Payment confirmed", description: "Milestone has been marked as paid." });
      setMarkAsPaidTarget(null);
      void utils.finances.listAllMilestones.invalidate();
      void utils.finances.getRevenueOverview.invalidate();
      void utils.finances.getMonthlyRevenue.invalidate();
      void utils.finances.getPaymentMethodBreakdown.invalidate();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to mark milestone as paid.",
        variant: "destructive",
      });
    },
  });

  const sendInvoiceMutation = api.finances.sendInvoice.useMutation({
    onSuccess: () => {
      toast({ title: "Invoice sent", description: "Invoice status updated to sent." });
      void utils.finances.listInvoices.invalidate();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to send invoice.",
        variant: "destructive",
      });
    },
  });

  // Derived data
  const invoices = invoicesData?.invoices ?? [];
  const milestones = milestonesData?.milestones ?? [];

  function handleMarkAsPaid(milestoneId: string, paymentMethod: string) {
    markAsPaidMutation.mutate({
      milestoneId,
      paymentMethod: paymentMethod as "cod" | "bank_transfer" | "cmi" | "check" | "mobile_money" | "cash",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finances</h1>
        <p className="text-sm text-muted-foreground">
          Track revenue, payment milestones, and invoices
        </p>
      </div>

      {/* ── Revenue Overview Cards ───────────────────────────────────────── */}
      {revenueLoading ? (
        <OverviewSkeleton />
      ) : revenue ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue (Year) */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Year Revenue
                </span>
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                {formatCurrency(revenue.totalRevenue)}
              </div>
              <div className="mt-1">
                <GrowthIndicator value={revenue.monthOverMonthGrowth} />
                {revenue.monthOverMonthGrowth !== 0 && (
                  <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  This Month
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-700 tabular-nums">
                {formatCurrency(revenue.monthRevenue)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Last month: {formatCurrency(revenue.lastMonthRevenue)}
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending
                </span>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-700 tabular-nums">
                {formatCurrency(revenue.pendingAmount)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Awaiting payment
              </div>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Overdue
                </span>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    revenue.overdueAmount > 0
                      ? "bg-red-100"
                      : "bg-gray-100"
                  }`}
                >
                  <AlertCircle
                    className={`h-4 w-4 ${
                      revenue.overdueAmount > 0
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  revenue.overdueAmount > 0 ? "text-red-700" : "text-gray-400"
                }`}
              >
                {formatCurrency(revenue.overdueAmount)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {revenue.overdueAmount > 0 ? "Requires attention" : "All clear"}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* ── Revenue Chart + Payment Distribution ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {chartLoading ? (
            <ChartSkeleton />
          ) : (
            <RevenueChart data={monthlyRevenue ?? []} />
          )}
        </div>
        <div>
          {breakdownLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-full rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
          ) : paymentBreakdown ? (
            <PaymentMethodDistribution data={paymentBreakdown} />
          ) : null}
        </div>
      </div>

      {/* ── Tabs: Milestones / Invoices ──────────────────────────────────── */}
      <Tabs defaultValue="milestones" className="w-full">
        <TabsList>
          <TabsTrigger value="milestones" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* ── Milestones Tab ──────────────────────────────────────────── */}
        <TabsContent value="milestones" className="mt-4 space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
            </span>
          </div>

          {milestonesLoading ? (
            <TableSkeleton rows={5} />
          ) : milestones.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No payment milestones</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Milestones are created when you set up payment schedules for events
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Table header (desktop) */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-3">Event</div>
                <div className="col-span-2">Milestone</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-2 text-center">Due Date</div>
                <div className="col-span-1 text-center">Method</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {milestones.map((m) => {
                const statusStyle = MILESTONE_STATUS_STYLES[String(m.status)] ?? { className: "bg-gray-100 text-gray-500", label: String(m.status) };
                const typeLabel = MILESTONE_TYPE_LABELS[String(m.milestoneType)] ?? String(m.milestoneType);
                const methodMeta = m.paymentMethod ? PAYMENT_METHOD_META[String(m.paymentMethod)] : null;
                const isPending = String(m.status) === "pending" || String(m.status) === "due" || String(m.status) === "overdue";
                const isOverdue = String(m.status) === "overdue";

                return (
                  <Card
                    key={m.id}
                    className={`transition-shadow hover:shadow-md ${isOverdue ? "border-red-200" : ""}`}
                  >
                    <CardContent className="p-4">
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm line-clamp-1">
                              {m.schedule.event.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {typeLabel} &middot; {m.label}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {formatCurrency(m.amount)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Due: {formatDate(m.dueDate)}
                          </span>
                        </div>
                        {methodMeta && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {methodMeta.icon}
                            {methodMeta.label}
                          </div>
                        )}
                        {isPending && (
                          <Button
                            size="sm"
                            className="w-full mt-1"
                            onClick={() =>
                              setMarkAsPaidTarget({
                                id: m.id,
                                label: m.label,
                                amount: m.amount,
                              })
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Mark as Paid
                          </Button>
                        )}
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                        <div className="col-span-3">
                          <p className="font-semibold text-sm line-clamp-1">
                            {m.schedule.event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.schedule.event.customerName}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">{typeLabel}</span>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {m.label}
                          </p>
                        </div>
                        <div className="col-span-1 text-right font-semibold text-sm tabular-nums">
                          {formatCurrency(m.amount)}
                        </div>
                        <div className="col-span-2 text-center text-sm">
                          {formatDate(m.dueDate)}
                        </div>
                        <div className="col-span-1 text-center">
                          {methodMeta ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {methodMeta.icon}
                              <span className="hidden lg:inline">{methodMeta.label}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                        <div className="col-span-1 text-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-right">
                          {isPending ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setMarkAsPaidTarget({
                                  id: m.id,
                                  label: m.label,
                                  amount: m.amount,
                                })
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Mark Paid
                            </Button>
                          ) : String(m.status) === "paid" ? (
                            <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {m.paidAt ? formatDate(m.paidAt) : "Paid"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Invoices Tab ────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-4 space-y-4">
          {invoicesLoading ? (
            <TableSkeleton rows={5} />
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No invoices yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invoices are generated from event payment schedules
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Table header (desktop) */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-2">Invoice #</div>
                <div className="col-span-3">Event</div>
                <div className="col-span-2">Client</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1 text-center">Due</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {invoices.map((inv) => {
                const statusStyle =
                  INVOICE_STATUS_STYLES[String(inv.status)] ?? { className: "bg-gray-100 text-gray-700", label: String(inv.status) };
                const isDraft = String(inv.status) === "draft";
                const event = inv.event as {
                  id: string;
                  title: string;
                  customerName: string;
                  eventDate: Date | string;
                } | null;

                return (
                  <Card
                    key={inv.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">
                              {inv.invoiceNumber}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {event?.title ?? "Unknown event"}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {formatCurrency(inv.totalAmount)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Due: {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDraft && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              disabled={sendInvoiceMutation.isLoading}
                              onClick={() =>
                                sendInvoiceMutation.mutate({ invoiceId: inv.id })
                              }
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Send
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="flex-1">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                        <div className="col-span-2">
                          <span className="font-semibold text-sm">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm line-clamp-1">
                            {event?.title ?? "Unknown event"}
                          </p>
                          {event?.eventDate && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(event.eventDate)}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm line-clamp-1">
                            {inv.clientName}
                          </p>
                        </div>
                        <div className="col-span-1 text-right font-semibold text-sm tabular-nums">
                          {formatCurrency(inv.totalAmount)}
                        </div>
                        <div className="col-span-1 text-center text-sm">
                          {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                        </div>
                        <div className="col-span-1 text-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          {isDraft && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendInvoiceMutation.isLoading}
                              onClick={() =>
                                sendInvoiceMutation.mutate({ invoiceId: inv.id })
                              }
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Send
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Mark as Paid Dialog ───────────────────────────────────────────── */}
      <MarkAsPaidDialog
        open={markAsPaidTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMarkAsPaidTarget(null);
        }}
        milestone={markAsPaidTarget}
        onConfirm={handleMarkAsPaid}
        isLoading={markAsPaidMutation.isLoading}
      />
    </div>
  );
}
