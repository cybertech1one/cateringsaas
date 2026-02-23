"use client";

import { useState, useMemo } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
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
import { useToast } from "~/components/ui/use-toast";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ArrowUpDown,
  CalendarPlus,
  Box,
} from "lucide-react";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type EquipmentCategory =
  | "chafing_dish"
  | "plates"
  | "glasses"
  | "cutlery"
  | "linens"
  | "tables"
  | "chairs"
  | "serving_trays"
  | "cooking_equipment"
  | "decoration"
  | "transport"
  | "other";

type EquipmentCondition =
  | "new_condition"
  | "good"
  | "fair"
  | "needs_repair"
  | "retired";

type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  quantityTotal: number;
  quantityAvailable: number;
  condition: EquipmentCondition;
  costPerUnit: number | null;
  rentalPricePerDay: number | null;
  imageUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventSummary = {
  id: string;
  title: string | null;
  eventDate: Date;
  status: string;
};

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORIES: { value: EquipmentCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chafing_dish", label: "Chafing Dishes" },
  { value: "plates", label: "Plates" },
  { value: "glasses", label: "Glasses" },
  { value: "cutlery", label: "Cutlery" },
  { value: "linens", label: "Linens" },
  { value: "tables", label: "Tables" },
  { value: "chairs", label: "Chairs" },
  { value: "serving_trays", label: "Serving Trays" },
  { value: "cooking_equipment", label: "Cooking" },
  { value: "decoration", label: "Decoration" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

const CONDITION_CONFIG: Record<
  EquipmentCondition,
  { label: string; color: string; bgColor: string }
> = {
  new_condition: {
    label: "New",
    color: "text-sage",
    bgColor: "bg-sage/10",
  },
  good: {
    label: "Good",
    color: "text-[hsl(var(--mint-tea))]",
    bgColor: "bg-[hsl(var(--mint-tea))]/10",
  },
  fair: {
    label: "Fair",
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
  needs_repair: {
    label: "Needs Repair",
    color: "text-[hsl(var(--harissa))]",
    bgColor: "bg-[hsl(var(--harissa))]/10",
  },
  retired: {
    label: "Retired",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

const CONDITIONS: EquipmentCondition[] = [
  "new_condition",
  "good",
  "fair",
  "needs_repair",
  "retired",
];

type SortField = "name" | "quantity" | "condition" | "available";

function formatCurrency(centimes: number) {
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

function formatCategoryLabel(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ──────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Loading Skeletons
// ──────────────────────────────────────────────

function StatsSkeletons() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GridSkeletons() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Equipment Card
// ──────────────────────────────────────────────

function EquipmentCard({
  item,
  onEdit,
  onAllocate,
}: {
  item: EquipmentItem;
  onEdit: (item: EquipmentItem) => void;
  onAllocate: (item: EquipmentItem) => void;
}) {
  const condition = CONDITION_CONFIG[item.condition] ?? CONDITION_CONFIG.good;
  const pct =
    item.quantityTotal > 0
      ? Math.round((item.quantityAvailable / item.quantityTotal) * 100)
      : 0;

  const isLow = item.quantityAvailable < Math.ceil(item.quantityTotal * 0.2);
  const allocated = item.quantityTotal - item.quantityAvailable;

  return (
    <Card className="transition-shadow hover:shadow-md group">
      <CardContent className="p-4">
        {/* Header: Name + Category */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{item.name}</h3>
            {item.notes && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.notes}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {formatCategoryLabel(item.category)}
          </Badge>
        </div>

        {/* Availability bar */}
        <div className="flex items-center gap-2 mb-2">
          <Progress
            value={pct}
            className={`h-2 flex-1 ${isLow ? "[&>div]:bg-orange-500" : ""}`}
          />
          <span
            className={`text-xs font-medium tabular-nums ${isLow ? "text-orange-600" : ""}`}
          >
            {item.quantityAvailable}/{item.quantityTotal}
          </span>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="outline"
            className={`text-[10px] ${condition.bgColor} ${condition.color} border-0`}
          >
            {condition.label}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {allocated > 0 && (
              <span className="text-[hsl(var(--majorelle-blue))] font-medium">
                {allocated} allocated
              </span>
            )}
            {item.costPerUnit != null && (
              <span className="ml-2">
                {formatCurrency(item.costPerUnit)}/unit
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onAllocate(item);
            }}
            disabled={item.quantityAvailable === 0}
          >
            <CalendarPlus className="h-3 w-3" />
            Allocate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Add / Edit Equipment Dialog
// ──────────────────────────────────────────────

function EquipmentFormDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: EquipmentItem | null;
}) {
  const { toast } = useToast();
  const isEditing = editItem !== null;

  const [name, setName] = useState(editItem?.name ?? "");
  const [category, setCategory] = useState<EquipmentCategory>(
    (editItem?.category as EquipmentCategory) ?? "other",
  );
  const [quantityTotal, setQuantityTotal] = useState(
    editItem?.quantityTotal?.toString() ?? "1",
  );
  const [condition, setCondition] = useState<EquipmentCondition>(
    editItem?.condition ?? "good",
  );
  const [costPerUnit, setCostPerUnit] = useState(
    editItem?.costPerUnit != null
      ? (editItem.costPerUnit / 100).toString()
      : "",
  );
  const [rentalPrice, setRentalPrice] = useState(
    editItem?.rentalPricePerDay != null
      ? (editItem.rentalPricePerDay / 100).toString()
      : "",
  );
  const [notes, setNotes] = useState(editItem?.notes ?? "");

  const createMutation = api.equipment.create.useMutation({
    onSuccess: () => {
      toast({ title: "Equipment added", description: `${name} has been added to inventory.` });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = api.equipment.update.useMutation({
    onSuccess: () => {
      toast({ title: "Equipment updated", description: `${name} has been updated.` });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const qty = parseInt(quantityTotal, 10);
    if (!name.trim() || isNaN(qty) || qty < 1) return;

    const costCentimes = costPerUnit
      ? Math.round(parseFloat(costPerUnit) * 100)
      : undefined;
    const rentalCentimes = rentalPrice
      ? Math.round(parseFloat(rentalPrice) * 100)
      : undefined;

    if (isEditing && editItem) {
      updateMutation.mutate({
        equipmentId: editItem.id,
        name: name.trim(),
        category,
        quantityTotal: qty,
        condition,
        costPerUnit: costCentimes,
        notes: notes.trim() || undefined,
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        category,
        quantityTotal: qty,
        condition,
        costPerUnit: costCentimes,
        notes: notes.trim() || undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Equipment" : "Add Equipment"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update details for this equipment item."
              : "Add a new item to your equipment inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="eq-name">Name</Label>
            <Input
              id="eq-name"
              placeholder="e.g. Round Chafing Dish 8L"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as EquipmentCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select
                value={condition}
                onValueChange={(v) => setCondition(v as EquipmentCondition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CONDITION_CONFIG[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="eq-qty">
              Total Quantity
              {isEditing && (
                <span className="text-muted-foreground font-normal ml-1">
                  (currently {editItem.quantityAvailable} available)
                </span>
              )}
            </Label>
            <Input
              id="eq-qty"
              type="number"
              min={1}
              value={quantityTotal}
              onChange={(e) => setQuantityTotal(e.target.value)}
              required
            />
          </div>

          {/* Cost + Rental Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eq-cost">Cost per Unit (MAD)</Label>
              <Input
                id="eq-cost"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eq-rental">Rental Price / Event (MAD)</Label>
              <Input
                id="eq-rental"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={rentalPrice}
                onChange={(e) => setRentalPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="eq-notes">Notes</Label>
            <Textarea
              id="eq-notes"
              placeholder="Brand, storage location, special handling instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Update Equipment"
                  : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Allocate to Event Dialog
// ──────────────────────────────────────────────

function AllocateDialog({
  open,
  onOpenChange,
  equipment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: EquipmentItem | null;
}) {
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [allocNotes, setAllocNotes] = useState("");

  // Fetch upcoming events for the allocation dropdown
  const { data: eventsData } = api.events.list.useQuery(
    {
      status: [
        "inquiry",
        "reviewed",
        "quoted",
        "accepted",
        "deposit_paid",
        "confirmed",
        "prep",
        "setup",
        "execution",
      ],
      limit: 50,
      sortBy: "date",
      sortOrder: "asc",
    },
    { enabled: open },
  );

  const events = (eventsData?.events ?? []) as EventSummary[];

  const allocateMutation = api.equipment.allocateToEvent.useMutation({
    onSuccess: () => {
      toast({
        title: "Equipment allocated",
        description: `${quantity} unit(s) of ${equipment?.name} allocated to event.`,
      });
      setSelectedEventId("");
      setQuantity("1");
      setAllocNotes("");
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: "Allocation failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleAllocate(e: React.FormEvent) {
    e.preventDefault();
    if (!equipment || !selectedEventId) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) return;

    allocateMutation.mutate({
      eventId: selectedEventId,
      equipmentId: equipment.id,
      quantityAllocated: qty,
      notes: allocNotes.trim() || undefined,
    });
  }

  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Allocate Equipment</DialogTitle>
          <DialogDescription>
            Assign <strong>{equipment.name}</strong> to an event.{" "}
            {equipment.quantityAvailable} unit(s) available.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAllocate} className="space-y-4">
          {/* Event Select */}
          <div className="space-y-1.5">
            <Label>Event</Label>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming events found.
              </p>
            ) : (
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title ?? "Untitled Event"} &mdash;{" "}
                      {new Date(ev.eventDate).toLocaleDateString("fr-MA")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="alloc-qty">Quantity</Label>
            <Input
              id="alloc-qty"
              type="number"
              min={1}
              max={equipment.quantityAvailable}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Max: {equipment.quantityAvailable} available
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="alloc-notes">Notes (optional)</Label>
            <Textarea
              id="alloc-notes"
              placeholder="Special setup instructions..."
              value={allocNotes}
              onChange={(e) => setAllocNotes(e.target.value)}
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
            <Button
              type="submit"
              disabled={
                allocateMutation.isLoading ||
                !selectedEventId ||
                parseInt(quantity, 10) < 1
              }
            >
              {allocateMutation.isLoading ? "Allocating..." : "Allocate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Equipment Detail / Allocations Dialog
// ──────────────────────────────────────────────

function EquipmentDetailDialog({
  open,
  onOpenChange,
  equipment,
  onEdit,
  onAllocate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: EquipmentItem | null;
  onEdit: (item: EquipmentItem) => void;
  onAllocate: (item: EquipmentItem) => void;
}) {
  const { toast } = useToast();

  // We cannot query allocations by equipment directly (only getByEvent exists),
  // so we display computed info from the equipment item itself.
  const condition = equipment
    ? CONDITION_CONFIG[equipment.condition]
    : CONDITION_CONFIG.good;
  const allocated = equipment
    ? equipment.quantityTotal - equipment.quantityAvailable
    : 0;

  const retireMutation = api.equipment.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Equipment retired",
        description: `${equipment?.name} has been marked as retired.`,
      });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (!equipment) return null;

  const pct =
    equipment.quantityTotal > 0
      ? Math.round(
          (equipment.quantityAvailable / equipment.quantityTotal) * 100,
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{equipment.name}</DialogTitle>
          <DialogDescription>
            Equipment details and availability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category & Condition */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {formatCategoryLabel(equipment.category)}
            </Badge>
            <Badge
              variant="outline"
              className={`${condition.bgColor} ${condition.color} border-0`}
            >
              {condition.label}
            </Badge>
          </div>

          {/* Availability */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Availability</span>
              <span className="font-medium">
                {equipment.quantityAvailable} / {equipment.quantityTotal}
              </span>
            </div>
            <Progress value={pct} className="h-2.5" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{equipment.quantityAvailable} available</span>
              <span>{allocated} allocated</span>
            </div>
          </div>

          {/* Cost Info */}
          {(equipment.costPerUnit != null ||
            equipment.rentalPricePerDay != null) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {equipment.costPerUnit != null && (
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Cost / Unit
                  </span>
                  <span className="font-medium">
                    {formatCurrency(equipment.costPerUnit)}
                  </span>
                </div>
              )}
              {equipment.rentalPricePerDay != null && (
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Rental / Event
                  </span>
                  <span className="font-medium">
                    {formatCurrency(equipment.rentalPricePerDay)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Total inventory value */}
          {equipment.costPerUnit != null && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Total Inventory Value: </span>
              <span className="font-semibold">
                {formatCurrency(equipment.costPerUnit * equipment.quantityTotal)}
              </span>
            </div>
          )}

          {/* Notes */}
          {equipment.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground block text-xs mb-0.5">
                Notes
              </span>
              <p className="text-foreground">{equipment.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={() => {
              retireMutation.mutate({
                equipmentId: equipment.id,
                condition: "retired",
              });
            }}
            disabled={
              retireMutation.isLoading || equipment.condition === "retired"
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            {equipment.condition === "retired" ? "Already Retired" : "Retire"}
          </Button>
          <div className="flex gap-2 flex-1 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                onOpenChange(false);
                onEdit(equipment);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={() => {
                onOpenChange(false);
                onAllocate(equipment);
              }}
              disabled={equipment.quantityAvailable === 0}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Allocate
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function EquipmentManagement() {
  // ─── State ──────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    EquipmentCategory | "all"
  >("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editItem, setEditItem] = useState<EquipmentItem | null>(null);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [allocateItem, setAllocateItem] = useState<EquipmentItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailItem, setDetailItem] = useState<EquipmentItem | null>(null);

  // ─── Queries ────────────────────────────────
  const { data: equipmentData, isLoading } = api.equipment.list.useQuery({
    category:
      activeCategory !== "all" ? activeCategory : undefined,
  });

  const { data: lowStockData } = api.equipment.getLowStock.useQuery({});

  const allItems = (equipmentData ?? []) as EquipmentItem[];
  const lowStockItems = (lowStockData ?? []) as Array<
    EquipmentItem & { availablePercentage: number }
  >;

  // ─── Computed Stats ─────────────────────────
  // Stats are computed from the full list (no category filter)
  // so we query all items for stats
  const { data: allEquipmentData } = api.equipment.list.useQuery({});
  const allForStats = (allEquipmentData ?? []) as EquipmentItem[];

  const stats = useMemo(() => {
    const total = allForStats.reduce((sum, e) => sum + e.quantityTotal, 0);
    const available = allForStats.reduce(
      (sum, e) => sum + e.quantityAvailable,
      0,
    );
    const allocated = total - available;
    const needsRepair = allForStats.filter(
      (e) => e.condition === "needs_repair",
    ).length;

    return { total, available, allocated, needsRepair };
  }, [allForStats]);

  // ─── Filtered & Sorted ─────────────────────
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Search filter (client-side)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.notes ?? "").toLowerCase().includes(q),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "quantity":
          cmp = a.quantityTotal - b.quantityTotal;
          break;
        case "available":
          cmp = a.quantityAvailable - b.quantityAvailable;
          break;
        case "condition": {
          const order: Record<EquipmentCondition, number> = {
            new_condition: 0,
            good: 1,
            fair: 2,
            needs_repair: 3,
            retired: 4,
          };
          cmp = order[a.condition] - order[b.condition];
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [allItems, search, sortField, sortAsc]);

  // ─── Handlers ───────────────────────────────
  function handleAddNew() {
    setEditItem(null);
    setShowFormDialog(true);
  }

  function handleEdit(item: EquipmentItem) {
    setEditItem(item);
    setShowFormDialog(true);
  }

  function handleAllocate(item: EquipmentItem) {
    setAllocateItem(item);
    setShowAllocateDialog(true);
  }

  function handleCardClick(item: EquipmentItem) {
    setDetailItem(item);
    setShowDetailDialog(true);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  // ─── Render ─────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title="Equipment"
        description="Track inventory, allocations, and condition"
        icon={<Package className="h-5 w-5" />}
        actions={
          <Button className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        }
      />

      {/* Stats */}
      {isLoading ? (
        <StatsSkeletons />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total Items"
            value={stats.total}
            icon={Box}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Available Now"
            value={stats.available}
            icon={CheckCircle2}
            color="bg-sage/10 text-sage"
          />
          <StatCard
            label="Allocated"
            value={stats.allocated}
            icon={Package}
            color="bg-gold/10 text-gold"
          />
          <StatCard
            label="Needs Repair"
            value={stats.needsRepair}
            icon={Wrench}
            color="bg-[hsl(var(--harissa))]/10 text-[hsl(var(--harissa))]"
          />
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-[hsl(var(--harissa))]/20 bg-[hsl(var(--harissa))]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--harissa))]" />
              <span className="font-semibold text-sm text-[hsl(var(--harissa))]">
                Low Stock Alerts ({lowStockItems.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Badge
                  key={item.id}
                  variant="outline"
                  className="bg-[hsl(var(--harissa))]/10 text-[hsl(var(--harissa))] border-[hsl(var(--harissa))]/30 cursor-pointer hover:bg-[hsl(var(--harissa))]/20"
                  onClick={() => handleCardClick(item)}
                >
                  {item.name} ({item.quantityAvailable}/{item.quantityTotal})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters row: Search + Category pills */}
      <div className="space-y-3">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                { field: "name" as SortField, label: "Name" },
                { field: "quantity" as SortField, label: "Qty" },
                { field: "available" as SortField, label: "Avail" },
                { field: "condition" as SortField, label: "Condition" },
              ] as const
            ).map(({ field, label }) => (
              <Button
                key={field}
                variant={sortField === field ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => toggleSort(field)}
              >
                {label}
                {sortField === field && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-full px-3"
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      {isLoading ? (
        <GridSkeletons />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-14 w-14 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">
            {search || activeCategory !== "all"
              ? "No equipment matches your filters"
              : "No equipment added yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {search || activeCategory !== "all"
              ? "Try adjusting your search or category filter."
              : "Start building your inventory by adding your first item."}
          </p>
          {!search && activeCategory === "all" && (
            <Button variant="outline" className="gap-2" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              Add your first equipment
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {filteredItems.length} item
            {filteredItems.length !== 1 ? "s" : ""}
            {activeCategory !== "all" &&
              ` in ${CATEGORIES.find((c) => c.value === activeCategory)?.label}`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="cursor-pointer"
              >
                <EquipmentCard
                  item={item}
                  onEdit={handleEdit}
                  onAllocate={handleAllocate}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      {showFormDialog && (
        <EquipmentFormDialog
          open={showFormDialog}
          onOpenChange={(open) => {
            setShowFormDialog(open);
            if (!open) setEditItem(null);
          }}
          editItem={editItem}
        />
      )}

      <AllocateDialog
        open={showAllocateDialog}
        onOpenChange={(open) => {
          setShowAllocateDialog(open);
          if (!open) setAllocateItem(null);
        }}
        equipment={allocateItem}
      />

      <EquipmentDetailDialog
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open);
          if (!open) setDetailItem(null);
        }}
        equipment={detailItem}
        onEdit={handleEdit}
        onAllocate={handleAllocate}
      />
    </div>
  );
}
