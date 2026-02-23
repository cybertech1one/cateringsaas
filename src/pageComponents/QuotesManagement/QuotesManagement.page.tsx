"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import {
  FileText,
  Plus,
  Search,
  Send,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trash2,
  Download,
  Clock,
  Eye,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  MapPin,
  Pencil,
  RotateCcw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "superseded";

type UnitType = "per_person" | "per_unit" | "flat";

type QuoteItem = {
  id: string;
  quoteId: string;
  sectionName: string;
  sectionOrder: number;
  itemName: string;
  itemDescription: string | null;
  quantity: number;
  unitType: UnitType;
  unitPrice: number;
  subtotal: number;
  itemOrder: number;
};

type QuoteEvent = {
  id: string;
  title: string | null;
  eventType: string;
  eventDate: Date | string;
  guestCount: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string | null;
  venueName?: string | null;
};

type QuoteListItem = {
  id: string;
  versionNumber: number;
  status: QuoteStatus;
  subtotal: number;
  tvaAmount: number;
  totalAmount: number;
  pricePerPerson: number | null;
  validUntil: Date | string | null;
  notes: string | null;
  createdAt: Date | string;
  sentAt: Date | string | null;
  event: QuoteEvent;
};

type QuoteDetail = QuoteListItem & {
  tvaRate: number;
  termsAndConditions: string | null;
  seasonalAdjustment: number;
  volumeDiscount: number;
  additionalCharges: number;
  pdfUrl: string | null;
  viewedAt: Date | string | null;
  respondedAt: Date | string | null;
  expiredAt: Date | string | null;
  items: QuoteItem[];
};

type LineItemDraft = {
  key: string;
  sectionName: string;
  sectionOrder: number;
  itemName: string;
  itemDescription: string;
  quantity: number;
  unitType: UnitType;
  unitPrice: number;
  subtotal: number;
  itemOrder: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; className: string; icon: typeof FileText }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700", icon: FileText },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700", icon: Send },
  viewed: { label: "Viewed", className: "bg-amber-100 text-amber-700", icon: Eye },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700", icon: XCircle },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-400", icon: Clock },
  superseded: { label: "Superseded", className: "bg-gray-100 text-gray-400", icon: RotateCcw },
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  per_person: "/ person",
  per_unit: "/ unit",
  flat: "flat",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(centimes: number): string {
  return `${(centimes / 100).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createEmptyLineItem(order: number): LineItemDraft {
  return {
    key: generateKey(),
    sectionName: "",
    sectionOrder: 0,
    itemName: "",
    itemDescription: "",
    quantity: 1,
    unitType: "per_person",
    unitPrice: 0,
    subtotal: 0,
    itemOrder: order,
  };
}

function computeSubtotal(item: LineItemDraft): number {
  return item.quantity * item.unitPrice;
}

function getEmptyStateTitle(search: string, statusFilter: string): string {
  if (search.trim()) return "No quotes match your search";
  if (statusFilter !== "all") return `No ${statusFilter} quotes`;

  return "No quotes yet";
}

function getEmptyStateSubtitle(search: string, statusFilter: string): string {
  if (!search.trim() && statusFilter === "all") {
    return 'Click "Create Quote" to build your first quote';
  }

  return "Try adjusting your filters";
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function QuoteListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuoteDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-24" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Badge Component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: QuoteStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <Badge variant="secondary" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Line Item Editor Row
// ---------------------------------------------------------------------------

function LineItemRow({
  item,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  item: LineItemDraft;
  index: number;
  onChange: (index: number, updated: LineItemDraft) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  const updateField = <K extends keyof LineItemDraft>(
    field: K,
    value: LineItemDraft[K],
  ) => {
    const updated = { ...item, [field]: value };

    // Recompute subtotal when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      updated.subtotal = computeSubtotal(updated);
    }

    onChange(index, updated);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      {/* Section Name */}
      <div className="col-span-12 sm:col-span-2">
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">
          Section
        </label>
        <Input
          placeholder="e.g. Appetizers"
          value={item.sectionName}
          onChange={(e) => updateField("sectionName", e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Item Name */}
      <div className="col-span-12 sm:col-span-3">
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">
          Item
        </label>
        <Input
          placeholder="e.g. Moroccan Briouats"
          value={item.itemName}
          onChange={(e) => updateField("itemName", e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Quantity */}
      <div className="col-span-4 sm:col-span-1">
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">
          Qty
        </label>
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => updateField("quantity", Math.max(1, parseInt(e.target.value) || 1))}
          className="h-9 text-sm"
        />
      </div>

      {/* Unit Type */}
      <div className="col-span-4 sm:col-span-2">
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">
          Type
        </label>
        <Select
          value={item.unitType}
          onValueChange={(v) => updateField("unitType", v as UnitType)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="per_person">Per person</SelectItem>
            <SelectItem value="per_unit">Per unit</SelectItem>
            <SelectItem value="flat">Flat rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Unit Price (centimes input, displayed as MAD) */}
      <div className="col-span-4 sm:col-span-2">
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">
          Price (MAD)
        </label>
        <Input
          type="number"
          min={0}
          step={100}
          value={item.unitPrice}
          onChange={(e) => updateField("unitPrice", Math.max(0, parseInt(e.target.value) || 0))}
          className="h-9 text-sm"
          placeholder="centimes"
        />
      </div>

      {/* Subtotal (computed) */}
      <div className="col-span-10 sm:col-span-1">
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">
          Total
        </label>
        <div className="h-9 flex items-center text-sm font-medium">
          {formatCurrency(computeSubtotal(item))}
        </div>
      </div>

      {/* Remove button */}
      <div className="col-span-2 sm:col-span-1">
        <label className="text-[11px] text-muted-foreground font-medium block mb-1 invisible">
          &nbsp;
        </label>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Quote Dialog
// ---------------------------------------------------------------------------

function CreateQuoteDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (quoteId: string) => void;
}) {
  const { toast } = useToast();
  const ctx = api.useContext();

  // Fetch events for the event selector
  const { data: eventsData, isLoading: eventsLoading } = api.events.list.useQuery(
    { limit: 50, sortBy: "date", sortOrder: "desc" },
    { enabled: open },
  );

  const events = (eventsData?.events ?? []) as unknown as Array<{
    id: string;
    title: string | null;
    eventType: string;
    eventDate: Date | string;
    guestCount: number;
    customerName: string;
    customerPhone: string | null;
    status: string;
  }>;

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([createEmptyLineItem(0)]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [includeTva, setIncludeTva] = useState(true);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + computeSubtotal(item), 0),
    [lineItems],
  );
  const tvaAmount = includeTva ? Math.round(subtotal * 0.2) : 0;
  const totalAmount = subtotal + tvaAmount;
  const pricePerPerson =
    selectedEvent && selectedEvent.guestCount > 0
      ? Math.round(totalAmount / selectedEvent.guestCount)
      : null;

  const createMutation = api.quotes.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "Quote created", description: "Draft quote has been created successfully." });
      void ctx.quotes.listAll.invalidate();
      resetForm();
      onOpenChange(false);
      onCreated(data.id);
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setSelectedEventId("");
    setLineItems([createEmptyLineItem(0)]);
    setNotes("");
    setTerms("");
    setIncludeTva(true);
  }

  function handleAddItem() {
    setLineItems((prev) => [...prev, createEmptyLineItem(prev.length)]);
  }

  function handleRemoveItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, updated: LineItemDraft) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? updated : item)));
  }

  function handleCreate() {
    if (!selectedEventId) {
      toast({ title: "Select an event", description: "Please choose an event for this quote.", variant: "destructive" });

      return;
    }

    const validItems = lineItems.filter((item) => item.itemName.trim() && item.sectionName.trim());

    if (validItems.length === 0) {
      toast({ title: "Add line items", description: "At least one complete line item is required.", variant: "destructive" });

      return;
    }

    createMutation.mutate({
      eventId: selectedEventId,
      items: validItems.map((item) => ({
        sectionName: item.sectionName.trim(),
        sectionOrder: item.sectionOrder,
        itemName: item.itemName.trim(),
        itemDescription: item.itemDescription.trim() || undefined,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        subtotal: computeSubtotal(item),
        itemOrder: item.itemOrder,
      })),
      taxRate: includeTva ? 20 : 0,
      pricePerPerson: pricePerPerson ?? undefined,
      notes: notes.trim() || undefined,
      termsAndConditions: terms.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
          <DialogDescription>
            Build a detailed quote with line items for a catering event.
          </DialogDescription>
        </DialogHeader>

        {/* Event Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Event</label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder={eventsLoading ? "Loading events..." : "Select an event"} />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title ?? "Untitled"} - {event.customerName} ({formatDate(event.eventDate)})
                </SelectItem>
              ))}
              {events.length === 0 && !eventsLoading && (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No events available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Client Info (auto-populated) */}
        {selectedEvent && (
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {selectedEvent.customerName}
                </div>
                {selectedEvent.customerPhone && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {selectedEvent.customerPhone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {selectedEvent.guestCount} guests
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(selectedEvent.eventDate)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Line Items</label>
            <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-1 h-8">
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <LineItemRow
                key={item.key}
                item={item}
                index={index}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
                canRemove={lineItems.length > 1}
              />
            ))}
          </div>
        </div>

        {/* TVA Toggle + Totals */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTva}
                  onChange={(e) => setIncludeTva(e.target.checked)}
                  className="rounded"
                />
                TVA (20%)
              </label>
              <span className="font-medium">{formatCurrency(tvaAmount)}</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="font-semibold">Total TTC</span>
              <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
            </div>
            {pricePerPerson !== null && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Per head ({selectedEvent?.guestCount} guests)</span>
                <span>{formatCurrency(pricePerPerson)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder="Internal notes or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Terms & Conditions</label>
            <Textarea
              placeholder="Payment terms, cancellation policy..."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isLoading} className="gap-2">
            {createMutation.isLoading ? "Creating..." : "Create Draft Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Quote Card (for the list view)
// ---------------------------------------------------------------------------

function QuoteCard({
  quote,
  onClick,
}: {
  quote: QuoteListItem;
  onClick: () => void;
}) {
  const status = quote.status as QuoteStatus;

  return (
    <Card
      className="transition-shadow hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Top row: event info + status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {quote.event.title ?? "Untitled Event"}
              </h3>
              <p className="text-xs text-muted-foreground">
                v{quote.versionNumber} &middot; {quote.event.customerName}
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Details row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(quote.event.eventDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {quote.event.guestCount} guests
            </span>
            {quote.sentAt && (
              <span className="flex items-center gap-1">
                <Send className="h-3 w-3" />
                Sent {formatDate(quote.sentAt)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-semibold text-sm">{formatCurrency(quote.totalAmount)}</span>
            {quote.pricePerPerson !== null && (
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(quote.pricePerPerson)}/head
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quote Detail View
// ---------------------------------------------------------------------------

function QuoteDetailView({
  quoteId,
  onBack,
}: {
  quoteId: string;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const ctx = api.useContext();

  const { data: quote, isLoading } = api.quotes.getById.useQuery(
    { quoteId },
    { enabled: !!quoteId },
  );

  const sendMutation = api.quotes.send.useMutation({
    onSuccess: () => {
      toast({ title: "Quote sent", description: "The quote has been marked as sent." });
      void ctx.quotes.getById.invalidate({ quoteId });
      void ctx.quotes.listAll.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error sending quote", description: err.message, variant: "destructive" });
    },
  });

  const reviseMutation = api.quotes.revise.useMutation({
    onSuccess: (data) => {
      toast({ title: "Revision created", description: `Version ${data.versionNumber} has been created as a draft.` });
      void ctx.quotes.listAll.invalidate();
      void ctx.quotes.getById.invalidate({ quoteId });
      // Navigate to the new version
      onBack();
    },
    onError: (err) => {
      toast({ title: "Error creating revision", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to quotes
        </Button>
        <QuoteDetailSkeleton />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to quotes
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Quote not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typedQuote = quote as unknown as QuoteDetail;
  const status = typedQuote.status as QuoteStatus;
  const isDraft = status === "draft";
  const canSend = isDraft;
  const canRevise = ["sent", "viewed", "rejected"].includes(status);

  // Group items by section
  const sections = typedQuote.items.reduce<
    Record<string, QuoteItem[]>
  >((acc, item) => {
    const section = item.sectionName || "General";

    if (!acc[section]) acc[section] = [];
    acc[section]!.push(item);

    return acc;
  }, {});

  function handleSend() {
    sendMutation.mutate({ quoteId: typedQuote.id });
  }

  function handleRevise() {
    reviseMutation.mutate({
      quoteId: typedQuote.id,
      items: typedQuote.items.map((item) => ({
        sectionName: item.sectionName,
        sectionOrder: item.sectionOrder,
        itemName: item.itemName,
        itemDescription: item.itemDescription ?? undefined,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        itemOrder: item.itemOrder,
      })),
      notes: typedQuote.notes ?? undefined,
      termsAndConditions: typedQuote.termsAndConditions ?? undefined,
      taxRate: Number(typedQuote.tvaRate) || 20,
    });
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" />
          Back to quotes
        </Button>
        <div className="flex flex-wrap gap-2">
          {canSend && (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sendMutation.isLoading}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sendMutation.isLoading ? "Sending..." : "Send to Client"}
            </Button>
          )}
          {canRevise && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevise}
              disabled={reviseMutation.isLoading}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              {reviseMutation.isLoading ? "Creating..." : "Create Revision"}
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {typedQuote.event.title ?? "Untitled Event"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Quote v{typedQuote.versionNumber} &middot; Created {formatDateTime(typedQuote.createdAt)}
              </p>
              {typedQuote.validUntil && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Valid until {formatDate(typedQuote.validUntil)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(typedQuote.totalAmount)}</p>
                {typedQuote.pricePerPerson !== null && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(typedQuote.pricePerPerson)} / guest
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client & Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              {typedQuote.event.customerName}
            </div>
            {typedQuote.event.customerPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {typedQuote.event.customerPhone}
              </div>
            )}
            {typedQuote.event.customerEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {typedQuote.event.customerEmail}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDate(typedQuote.event.eventDate)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              {typedQuote.event.guestCount} guests
            </div>
            {typedQuote.event.venueName && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {typedQuote.event.venueName}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm capitalize">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {typedQuote.event.eventType.replace(/_/g, " ")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Item</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground text-center">Qty</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground text-right">Unit Price</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(sections).map(([sectionName, items]) => (
                    <>
                      <tr key={`section-${sectionName}`} className="bg-muted/30">
                        <td colSpan={5} className="px-4 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                          {sectionName}
                        </td>
                      </tr>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2.5">
                            <div>
                              <p className="font-medium">{item.itemName}</p>
                              {item.itemDescription && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.itemDescription}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {UNIT_TYPE_LABELS[item.unitType]}
                          </td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {Object.entries(sections).map(([sectionName, items]) => (
              <div key={`mobile-section-${sectionName}`}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                  {sectionName}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.itemName}</p>
                          {item.itemDescription && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.itemDescription}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-sm">{formatCurrency(item.subtotal)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>{UNIT_TYPE_LABELS[item.unitType]}</span>
                        <span>{formatCurrency(item.unitPrice)} each</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(typedQuote.subtotal)}</span>
            </div>
            {Number(typedQuote.tvaRate) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA ({Number(typedQuote.tvaRate)}%)</span>
                <span>{formatCurrency(typedQuote.tvaAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total TTC</span>
              <span>{formatCurrency(typedQuote.totalAmount)}</span>
            </div>
            {typedQuote.pricePerPerson !== null && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Price per guest ({typedQuote.event.guestCount} guests)</span>
                <span>{formatCurrency(typedQuote.pricePerPerson)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      {(typedQuote.notes || typedQuote.termsAndConditions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typedQuote.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{typedQuote.notes}</p>
              </CardContent>
            </Card>
          )}
          {typedQuote.termsAndConditions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{typedQuote.termsAndConditions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Created</span>
              <span>{formatDateTime(typedQuote.createdAt)}</span>
            </div>
            {typedQuote.sentAt && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Sent</span>
                <span>{formatDateTime(typedQuote.sentAt)}</span>
              </div>
            )}
            {typedQuote.viewedAt && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Viewed</span>
                <span>{formatDateTime(typedQuote.viewedAt)}</span>
              </div>
            )}
            {typedQuote.respondedAt && (
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${status === "accepted" ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-muted-foreground">
                  {status === "accepted" ? "Accepted" : "Rejected"}
                </span>
                <span>{formatDateTime(typedQuote.respondedAt)}</span>
              </div>
            )}
            {typedQuote.expiredAt && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-muted-foreground">Expired</span>
                <span>{formatDateTime(typedQuote.expiredAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Quotes Management Page
// ---------------------------------------------------------------------------

export default function QuotesManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading } = api.quotes.listAll.useQuery({ limit: 50 });

  const allQuotes = useMemo(
    () => (data?.quotes ?? []) as QuoteListItem[],
    [data?.quotes],
  );

  // Client-side filtering
  const filteredQuotes = useMemo(() => {
    let result = allQuotes;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((q) => q.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase();

      result = result.filter(
        (q) =>
          (q.event.title ?? "").toLowerCase().includes(term) ||
          q.event.customerName.toLowerCase().includes(term) ||
          `v${q.versionNumber}`.includes(term),
      );
    }

    return result;
  }, [allQuotes, statusFilter, search]);

  // Count per status for tab badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allQuotes.length };

    for (const q of allQuotes) {
      counts[q.status] = (counts[q.status] ?? 0) + 1;
    }

    return counts;
  }, [allQuotes]);

  const handleQuoteCreated = useCallback((quoteId: string) => {
    setSelectedQuoteId(quoteId);
  }, []);

  // If a quote is selected, show the detail view
  if (selectedQuoteId) {
    return (
      <QuoteDetailView
        quoteId={selectedQuoteId}
        onBack={() => setSelectedQuoteId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Create, send, and track versioned quotes for events
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Quote
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by event, client name, or version..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="w-full"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              {(statusCounts[tab.value] ?? 0) > 0 && (
                <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded-full">
                  {statusCounts[tab.value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Single content for all tabs (client-side filtering) */}
        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {isLoading && <QuoteListSkeleton />}

            {!isLoading && filteredQuotes.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">
                  {getEmptyStateTitle(search, statusFilter)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getEmptyStateSubtitle(search, statusFilter)}
                </p>
                {!search.trim() && statusFilter === "all" && (
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Create your first quote
                  </Button>
                )}
              </div>
            )}

            {!isLoading && filteredQuotes.length > 0 && (
              <div className="grid gap-3">
                {filteredQuotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    onClick={() => setSelectedQuoteId(quote.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Quote Dialog */}
      <CreateQuoteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleQuoteCreated}
      />
    </div>
  );
}
