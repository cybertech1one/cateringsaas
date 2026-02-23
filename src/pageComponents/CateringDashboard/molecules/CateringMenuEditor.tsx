"use client";

import { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
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
import { useTranslation } from "react-i18next";
import { formatPrice } from "~/utils/currency";
import { cn } from "~/utils/cn";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  GripVertical,
  Package,
  UtensilsCrossed,
  Palette,
  ClipboardList,
  FileText,
  ChevronUp,
  ChevronDown,
  Leaf,
  Wheat,
  Check,
  X,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CateringMenuFull = {
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
  leadTimeDays: number;
  serviceOptions: Record<string, boolean>;
  packages: CateringPackage[];
  categories: CateringCategory[];
};

type CateringPackage = {
  id: string;
  cateringMenuId: string;
  name: string;
  nameAr: string | null;
  nameFr: string | null;
  description: string | null;
  pricePerPerson: number;
  minGuests: number;
  maxGuests: number | null;
  isFeatured: boolean;
  sortOrder: number;
  imageUrl: string | null;
  includesText: string | null;
  packageItems: {
    id: string;
    item: CateringItem;
  }[];
};

type CateringCategory = {
  id: string;
  cateringMenuId: string;
  name: string;
  nameAr: string | null;
  nameFr: string | null;
  description: string | null;
  sortOrder: number;
  isOptional: boolean;
  maxSelections: number | null;
  cateringItems: CateringItem[];
};

type CateringItem = {
  id: string;
  cateringCategoryId: string;
  cateringMenuId: string;
  name: string;
  nameAr: string | null;
  nameFr: string | null;
  description: string | null;
  pricePerPerson: number | null;
  pricePerUnit: number | null;
  unitLabel: string | null;
  isIncluded: boolean;
  isOptional: boolean;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  imageUrl: string | null;
  sortOrder: number;
};

type CateringInquiry = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  eventType: string;
  eventDate: Date;
  guestCount: number;
  status: string;
  estimatedTotal: number | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: Date;
};

interface CateringMenuEditorProps {
  menuId: string;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Sidebar tabs
// ---------------------------------------------------------------------------

const EDITOR_TABS = [
  { id: "details", icon: FileText },
  { id: "packages", icon: Package },
  { id: "items", icon: UtensilsCrossed },
  { id: "theme", icon: Palette },
  { id: "inquiries", icon: ClipboardList },
] as const;

type EditorTab = (typeof EDITOR_TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  "wedding",
  "corporate",
  "birthday",
  "conference",
  "graduation",
  "holiday",
  "funeral",
  "religious",
  "social",
  "other",
] as const;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-gold/10 text-gold dark:bg-gold/20 dark:text-gold";
    case "reviewed":
      return "bg-[hsl(var(--majorelle-blue))]/10 text-[hsl(var(--majorelle-blue))] dark:bg-[hsl(var(--majorelle-blue))]/20 dark:text-[hsl(var(--majorelle-blue))]";
    case "quoted":
      return "bg-[hsl(var(--saffron))]/10 text-[hsl(var(--saffron))] dark:bg-[hsl(var(--saffron))]/20 dark:text-[hsl(var(--saffron))]";
    case "confirmed":
      return "bg-sage/10 text-sage dark:bg-sage/20 dark:text-sage";
    case "deposit_paid":
      return "bg-[hsl(var(--mint-tea))]/10 text-[hsl(var(--mint-tea))] dark:bg-[hsl(var(--mint-tea))]/20 dark:text-[hsl(var(--mint-tea))]";
    case "completed":
      return "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground";
    case "cancelled":
      return "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ---------------------------------------------------------------------------
// Dietary badge helper
// ---------------------------------------------------------------------------

function DietaryBadges({
  item,
  t,
}: {
  item: CateringItem;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {item.isHalal && (
        <Badge
          variant="outline"
          className="border-sage/30 bg-sage/10 text-sage dark:border-sage/40 dark:bg-sage/20 dark:text-sage text-xs px-1.5 py-0"
        >
          {t("catering.dietary.halal")}
        </Badge>
      )}
      {item.isVegetarian && (
        <Badge
          variant="outline"
          className="border-[hsl(var(--mint-tea))]/30 bg-[hsl(var(--mint-tea))]/10 text-[hsl(var(--mint-tea))] dark:border-[hsl(var(--mint-tea))]/40 dark:bg-[hsl(var(--mint-tea))]/20 dark:text-[hsl(var(--mint-tea))] text-xs px-1.5 py-0"
        >
          <Leaf className="mr-0.5 h-3 w-3" />
          {t("catering.dietary.vegetarian")}
        </Badge>
      )}
      {item.isVegan && (
        <Badge
          variant="outline"
          className="border-[hsl(var(--zellige-teal))]/30 bg-[hsl(var(--zellige-teal))]/10 text-[hsl(var(--zellige-teal))] dark:border-[hsl(var(--zellige-teal))]/40 dark:bg-[hsl(var(--zellige-teal))]/20 dark:text-[hsl(var(--zellige-teal))] text-xs px-1.5 py-0"
        >
          <Leaf className="mr-0.5 h-3 w-3" />
          {t("catering.dietary.vegan")}
        </Badge>
      )}
      {item.isGlutenFree && (
        <Badge
          variant="outline"
          className="border-[hsl(var(--saffron))]/30 bg-[hsl(var(--saffron))]/10 text-[hsl(var(--saffron))] dark:border-[hsl(var(--saffron))]/40 dark:bg-[hsl(var(--saffron))]/20 dark:text-[hsl(var(--saffron))] text-xs px-1.5 py-0"
        >
          <Wheat className="mr-0.5 h-3 w-3" />
          {t("catering.dietary.glutenFree")}
        </Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details Tab
// ---------------------------------------------------------------------------

function DetailsTab({
  menu,
  onRefetch,
}: {
  menu: CateringMenuFull;
  onRefetch: () => void;
}) {
  const { toast } = useToast();
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const svcOpts = (menu.serviceOptions ?? {}) as Record<string, boolean>;

  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description ?? "");
  const [eventType, setEventType] = useState(menu.eventType);
  const [minGuests, setMinGuests] = useState(menu.minGuests?.toString() ?? "");
  const [maxGuests, setMaxGuests] = useState(menu.maxGuests?.toString() ?? "");
  const [basePricePerPerson, setBasePricePerPerson] = useState(
    menu.basePricePerPerson != null
      ? (menu.basePricePerPerson / 100).toFixed(2)
      : "",
  );
  const [leadTimeDays, setLeadTimeDays] = useState(
    menu.leadTimeDays?.toString() ?? "",
  );
  const [serviceDelivery, setServiceDelivery] = useState(svcOpts.delivery ?? false);
  const [serviceSetup, setServiceSetup] = useState(svcOpts.setup ?? false);
  const [serviceStaff, setServiceStaff] = useState(svcOpts.staffService ?? false);
  const [serviceEquipment, setServiceEquipment] = useState(
    svcOpts.equipmentRental ?? false,
  );
  const [serviceCleanup, setServiceCleanup] = useState(svcOpts.cleanup ?? false);

  const updateMutation = api.cateringMenus.update.useMutation({
    onSuccess: () => {
      toast({
        title: t("catering.menuUpdated"),
        description: t("catering.menuUpdatedDescription"),
      });
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      menuId: menu.id,
      name: name.trim(),
      description: description.trim() || undefined,
      minGuests: minGuests ? parseInt(minGuests, 10) : undefined,
      maxGuests: maxGuests ? parseInt(maxGuests, 10) : undefined,
      basePricePerPerson: basePricePerPerson
        ? Math.round(parseFloat(basePricePerPerson) * 100)
        : undefined,
      eventType: eventType || undefined,
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="detail-name">{t("catering.form.name")}</Label>
        <Input
          id="detail-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-desc">{t("catering.form.description")}</Label>
        <Textarea
          id="detail-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("catering.form.eventType")}</Label>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="max-w-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`catering.eventTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="detail-min">{t("catering.form.minGuests")}</Label>
          <Input
            id="detail-min"
            type="number"
            min={1}
            value={minGuests}
            onChange={(e) => setMinGuests(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="detail-max">{t("catering.form.maxGuests")}</Label>
          <Input
            id="detail-max"
            type="number"
            min={1}
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="detail-price">
            {t("catering.form.basePricePerPerson")}
          </Label>
          <Input
            id="detail-price"
            type="number"
            step="0.01"
            min={0}
            value={basePricePerPerson}
            onChange={(e) => setBasePricePerPerson(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="detail-lead">
            {t("catering.form.leadTimeDays")}
          </Label>
          <Input
            id="detail-lead"
            type="number"
            min={0}
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>{t("catering.form.serviceOptions")}</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              key: "serviceDelivery",
              value: serviceDelivery,
              set: setServiceDelivery,
            },
            { key: "serviceSetup", value: serviceSetup, set: setServiceSetup },
            { key: "serviceStaff", value: serviceStaff, set: setServiceStaff },
            {
              key: "serviceEquipment",
              value: serviceEquipment,
              set: setServiceEquipment,
            },
            {
              key: "serviceCleanup",
              value: serviceCleanup,
              set: setServiceCleanup,
            },
          ].map((svc) => (
            <label
              key={svc.key}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <Checkbox
                checked={svc.value}
                onCheckedChange={(checked) => svc.set(checked === true)}
              />
              <span className="text-sm">
                {t(`catering.form.${svc.key}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={updateMutation.isLoading}>
        <Save className="mr-2 h-4 w-4" />
        {updateMutation.isLoading
          ? t("catering.form.saving")
          : t("catering.form.saveDetails")}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Packages Tab
// ---------------------------------------------------------------------------

function PackagesTab({
  menu,
  onRefetch,
}: {
  menu: CateringMenuFull;
  onRefetch: () => void;
}) {
  const { toast } = useToast();
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CateringPackage | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");

  const createMutation = api.cateringMenus.createPackage.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.packageCreated") });
      setDialogOpen(false);
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.cateringMenus.updatePackage.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.packageUpdated") });
      setDialogOpen(false);
      setEditingPkg(null);
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.cateringMenus.deletePackage.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.packageDeleted") });
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const reorderMutation = api.cateringMenus.reorderPackages.useMutation({
    onSuccess: () => onRefetch(),
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function openCreate() {
    setEditingPkg(null);
    setPkgName("");
    setPkgDescription("");
    setPkgPrice("");
    setDialogOpen(true);
  }

  function openEdit(pkg: CateringPackage) {
    setEditingPkg(pkg);
    setPkgName(pkg.name);
    setPkgDescription(pkg.description ?? "");
    setPkgPrice((pkg.pricePerPerson / 100).toFixed(2));
    setDialogOpen(true);
  }

  function handleSubmitPkg(e: React.FormEvent) {
    e.preventDefault();
    const priceInCents = Math.round(parseFloat(pkgPrice || "0") * 100);

    if (editingPkg) {
      updateMutation.mutate({
        packageId: editingPkg.id,
        name: pkgName.trim(),
        description: pkgDescription.trim() || undefined,
        pricePerPerson: priceInCents,
      });
    } else {
      createMutation.mutate({
        menuId: menu.id,
        name: pkgName.trim(),
        description: pkgDescription.trim() || undefined,
        pricePerPerson: priceInCents,
      });
    }
  }

  function handleMovePackage(pkgId: string, direction: "up" | "down") {
    const sorted = [...menu.packages].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const idx = sorted.findIndex((p) => p.id === pkgId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const newOrder = sorted.map((p, i) => {
      if (i === idx) return { id: p.id, sortOrder: swapIdx };
      if (i === swapIdx) return { id: p.id, sortOrder: idx };
      return { id: p.id, sortOrder: i };
    });

    reorderMutation.mutate({
      menuId: menu.id,
      packages: newOrder.sort((a, b) => a.sortOrder - b.sortOrder).map((p, i) => ({
        id: p.id,
        sortOrder: i,
      })),
    });
  }

  const isSaving = createMutation.isLoading || updateMutation.isLoading;
  const sortedPackages = [...menu.packages].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t("catering.editor.packages")}</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("catering.addPackage")}
        </Button>
      </div>

      {!sortedPackages.length ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("catering.noPackages")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPackages.map((pkg, idx) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-border/40 bg-card/60 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMovePackage(pkg.id, "up")}
                    disabled={idx === 0}
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    aria-label={t("catering.moveUp")}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleMovePackage(pkg.id, "down")}
                    disabled={idx === sortedPackages.length - 1}
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    aria-label={t("catering.moveDown")}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{pkg.name}</h4>
                    <span className="text-sm font-semibold text-primary">
                      {formatPrice(pkg.pricePerPerson)} /{" "}
                      {t("catering.person")}
                    </span>
                  </div>
                  {pkg.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                      {pkg.description}
                    </p>
                  )}
                  {pkg.packageItems && pkg.packageItems.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pkg.packageItems.length} {t("catering.items.title")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(pkg)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm(t("catering.deletePackageConfirm"))) {
                        deleteMutation.mutate({ packageId: pkg.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Package create/edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditingPkg(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingPkg
                ? t("catering.editPackage")
                : t("catering.createPackage")}
            </DialogTitle>
            <DialogDescription>
              {t("catering.packageDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPkg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pkg-name">{t("catering.form.name")}</Label>
              <Input
                id="pkg-name"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                placeholder={t("catering.packageNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-desc">
                {t("catering.form.description")}
              </Label>
              <Textarea
                id="pkg-desc"
                value={pkgDescription}
                onChange={(e) => setPkgDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-price">
                {t("catering.form.pricePerPerson")}
              </Label>
              <Input
                id="pkg-price"
                type="number"
                step="0.01"
                min={0}
                value={pkgPrice}
                onChange={(e) => setPkgPrice(e.target.value)}
                placeholder="200.00"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("catering.form.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {editingPkg
                  ? t("catering.form.update")
                  : t("catering.form.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu Items Tab
// ---------------------------------------------------------------------------

function ItemsTab({
  menu,
  onRefetch,
}: {
  menu: CateringMenuFull;
  onRefetch: () => void;
}) {
  const { toast } = useToast();
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CateringCategory | null>(null);
  const [catName, setCatName] = useState("");

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CateringItem | null>(null);
  const [itemCatId, setItemCatId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemHalal, setItemHalal] = useState(false);
  const [itemVegetarian, setItemVegetarian] = useState(false);
  const [itemVegan, setItemVegan] = useState(false);
  const [itemGlutenFree, setItemGlutenFree] = useState(false);

  // ── Category mutations ─────────────────────────────────────

  const createCatMutation = api.cateringMenus.addCategory.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.categoryCreated") });
      setCatDialogOpen(false);
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateCatMutation = api.cateringMenus.updateCategory.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.categoryUpdated") });
      setCatDialogOpen(false);
      setEditingCat(null);
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteCatMutation = api.cateringMenus.deleteCategory.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.categoryDeleted") });
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Item mutations ─────────────────────────────────────────

  const createItemMutation = api.cateringMenus.addItem.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.itemCreated") });
      setItemDialogOpen(false);
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = api.cateringMenus.updateItem.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.itemUpdated") });
      setItemDialogOpen(false);
      setEditingItem(null);
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = api.cateringMenus.deleteItem.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.itemDeleted") });
      onRefetch();
    },
    onError: (err: { message: string }) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // TODO: toggleItemAvailability does not exist in cateringMenus router.
  // Use cateringMenus.updateItem to toggle isActive field instead.
  const toggleAvailMutation = api.cateringMenus.updateItem.useMutation({
    onSuccess: () => onRefetch(),
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Category handlers ──────────────────────────────────────

  function openCreateCat() {
    setEditingCat(null);
    setCatName("");
    setCatDialogOpen(true);
  }

  function openEditCat(cat: CateringCategory) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDialogOpen(true);
  }

  function handleSubmitCat(e: React.FormEvent) {
    e.preventDefault();
    if (editingCat) {
      updateCatMutation.mutate({
        categoryId: editingCat.id,
        name: catName.trim(),
      });
    } else {
      createCatMutation.mutate({
        menuId: menu.id,
        name: catName.trim(),
      });
    }
  }

  // ── Item handlers ──────────────────────────────────────────

  function openCreateItem(categoryId: string) {
    setEditingItem(null);
    setItemCatId(categoryId);
    setItemName("");
    setItemDescription("");
    setItemPrice("");
    setItemHalal(false);
    setItemVegetarian(false);
    setItemVegan(false);
    setItemGlutenFree(false);
    setItemDialogOpen(true);
  }

  function openEditItem(item: CateringItem) {
    setEditingItem(item);
    setItemCatId(item.cateringCategoryId);
    setItemName(item.name);
    setItemDescription(item.description ?? "");
    setItemPrice(((item.pricePerPerson ?? item.pricePerUnit ?? 0) / 100).toFixed(2));
    setItemHalal(item.isHalal);
    setItemVegetarian(item.isVegetarian);
    setItemVegan(item.isVegan);
    setItemGlutenFree(item.isGlutenFree);
    setItemDialogOpen(true);
  }

  function handleSubmitItem(e: React.FormEvent) {
    e.preventDefault();
    const priceInCents = Math.round(parseFloat(itemPrice || "0") * 100);

    // cateringMenus.addItem expects: { menuId, name, category, price, ... }
    // cateringMenus.updateItem expects: { itemId, name?, price?, ... }
    // Dietary flags (isHalal, isVegetarian, etc.) map to dietaryInfo array.
    const dietaryInfo: string[] = [];
    if (itemHalal) dietaryInfo.push("halal");
    if (itemVegetarian) dietaryInfo.push("vegetarian");
    if (itemVegan) dietaryInfo.push("vegan");
    if (itemGlutenFree) dietaryInfo.push("gluten_free");

    if (editingItem) {
      updateItemMutation.mutate({
        itemId: editingItem.id,
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        pricePerPerson: priceInCents,
        // NOTE: isVegetarian/isVegan/isGlutenFree are set at creation time via addItem.
        // updateItem schema does not currently accept dietary flags.
      });
    } else {
      createItemMutation.mutate({
        menuId: menu.id,
        categoryId: itemCatId,
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        pricePerPerson: priceInCents,
        isVegetarian: itemVegetarian,
        isVegan: itemVegan,
        isGlutenFree: itemGlutenFree,
      });
    }
  }

  const sortedCategories = [...menu.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t("catering.editor.menuItems")}</h3>
        <Button size="sm" onClick={openCreateCat}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("catering.addCategory")}
        </Button>
      </div>

      {!sortedCategories.length ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("catering.noCategories")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-border/40 bg-card/60"
            >
              {/* Category header */}
              <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                <h4 className="font-medium">{cat.name}</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openCreateItem(cat.id)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {t("catering.addItem")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditCat(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (
                        window.confirm(t("catering.deleteCategoryConfirm"))
                      ) {
                        deleteCatMutation.mutate({ categoryId: cat.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Items list */}
              {!cat.cateringItems?.length ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("catering.noItems")}
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {cat.cateringItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        !item.isAvailable && "opacity-50",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-primary font-semibold">
                            {formatPrice(item.pricePerPerson ?? item.pricePerUnit ?? 0)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-1">
                          <DietaryBadges
                            item={item}
                            t={t as (key: string) => string}
                          />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleAvailMutation.mutate({
                              itemId: item.id,
                              isAvailable: !item.isAvailable,
                            })
                          }
                          title={
                            item.isAvailable
                              ? t("catering.markUnavailable")
                              : t("catering.markAvailable")
                          }
                        >
                          {item.isAvailable ? (
                            <Check className="h-3.5 w-3.5 text-sage" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditItem(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (
                              window.confirm(t("catering.deleteItemConfirm"))
                            ) {
                              deleteItemMutation.mutate({ itemId: item.id });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category dialog */}
      <Dialog
        open={catDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCatDialogOpen(false);
            setEditingCat(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingCat
                ? t("catering.editCategory")
                : t("catering.createCategory")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCat} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">{t("catering.form.name")}</Label>
              <Input
                id="cat-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder={t("catering.categoryNamePlaceholder")}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatDialogOpen(false)}
              >
                {t("catering.form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createCatMutation.isLoading || updateCatMutation.isLoading
                }
              >
                {editingCat
                  ? t("catering.form.update")
                  : t("catering.form.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog
        open={itemDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setItemDialogOpen(false);
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? t("catering.editItem")
                : t("catering.createItem")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">{t("catering.form.name")}</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t("catering.itemNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">
                {t("catering.form.description")}
              </Label>
              <Textarea
                id="item-desc"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">{t("catering.form.price")}</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min={0}
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="50.00"
                required
              />
            </div>

            {/* Dietary options */}
            <div className="space-y-3">
              <Label>{t("catering.form.dietaryOptions")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={itemHalal}
                    onCheckedChange={(c) => setItemHalal(c === true)}
                  />
                  <span className="text-sm">
                    {t("catering.dietary.halal")}
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={itemVegetarian}
                    onCheckedChange={(c) => setItemVegetarian(c === true)}
                  />
                  <span className="text-sm">
                    {t("catering.dietary.vegetarian")}
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={itemVegan}
                    onCheckedChange={(c) => setItemVegan(c === true)}
                  />
                  <span className="text-sm">
                    {t("catering.dietary.vegan")}
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={itemGlutenFree}
                    onCheckedChange={(c) => setItemGlutenFree(c === true)}
                  />
                  <span className="text-sm">
                    {t("catering.dietary.glutenFree")}
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemDialogOpen(false)}
              >
                {t("catering.form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  createItemMutation.isLoading || updateItemMutation.isLoading
                }
              >
                {editingItem
                  ? t("catering.form.update")
                  : t("catering.form.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Theme Tab
// ---------------------------------------------------------------------------

function ThemeTab({
  menu,
  onRefetch,
}: {
  menu: CateringMenuFull;
  onRefetch: () => void;
}) {
  const { toast } = useToast();
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  // Theme is org-level, not per-menu. Use defaults for initial state.
  const [primaryColor, setPrimaryColor] = useState("#f97316");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [accentColor, setAccentColor] = useState("#fbbf24");
  const [font, setFont] = useState("sans-serif");
  const [layout, setLayout] = useState("classic");

  // Theme is managed at the org level via orgThemes router, not per-menu
  const saveMutation = api.orgThemes.upsert.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.themeSaved") });
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetMutation = api.orgThemes.reset.useMutation({
    onSuccess: () => {
      toast({ title: t("catering.themeReset") });
      setPrimaryColor("#f97316");
      setBackgroundColor("#ffffff");
      setTextColor("#1a1a1a");
      setAccentColor("#fbbf24");
      setFont("sans-serif");
      setLayout("classic");
      onRefetch();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleSave() {
    // orgThemes.upsert operates at the org level (no per-menu theme)
    saveMutation.mutate({
      primaryColor,
      secondaryColor: primaryColor,
      backgroundColor,
      surfaceColor: "#FFFFFF",
      textColor,
      accentColor,
      headingFont: font,
      bodyFont: font,
      layoutStyle: layout as "elegant" | "modern" | "traditional" | "minimal" | "bold",
      cardStyle: "elevated" as const,
      borderRadius: "medium" as const,
      headerStyle: "banner" as const,
    });
  }

  const FONT_OPTIONS = [
    { value: "sans-serif", label: "Sans Serif" },
    { value: "serif", label: "Serif" },
    { value: "mono", label: "Monospace" },
    { value: "display", label: "Display" },
  ];

  const LAYOUT_OPTIONS = [
    { value: "classic", labelKey: "catering.theme.layoutClassic" },
    { value: "modern", labelKey: "catering.theme.layoutModern" },
    { value: "elegant", labelKey: "catering.theme.layoutElegant" },
    { value: "minimal", labelKey: "catering.theme.layoutMinimal" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">{t("catering.editor.theme")}</h3>

      {/* Colors */}
      <div className="space-y-4">
        <Label>{t("catering.theme.colors")}</Label>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: t("catering.theme.primary"),
              value: primaryColor,
              set: setPrimaryColor,
            },
            {
              label: t("catering.theme.background"),
              value: backgroundColor,
              set: setBackgroundColor,
            },
            {
              label: t("catering.theme.text"),
              value: textColor,
              set: setTextColor,
            },
            {
              label: t("catering.theme.accent"),
              value: accentColor,
              set: setAccentColor,
            },
          ].map((color) => (
            <div key={color.label} className="space-y-1.5">
              <span className="text-sm text-muted-foreground">
                {color.label}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color.value}
                  onChange={(e) => color.set(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-md border border-border"
                />
                <Input
                  value={color.value}
                  onChange={(e) => color.set(e.target.value)}
                  className="h-9 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="space-y-2">
        <Label>{t("catering.theme.font")}</Label>
        <Select value={font} onValueChange={setFont}>
          <SelectTrigger className="max-w-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Layout */}
      <div className="space-y-2">
        <Label>{t("catering.theme.layout")}</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLayout(opt.value)}
              className={cn(
                "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                layout === opt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border/80",
              )}
            >
              {t(opt.labelKey as never)}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>{t("catering.theme.preview")}</Label>
        <div
          className="rounded-xl border border-border/40 p-6"
          style={{
            backgroundColor,
            color: textColor,
            fontFamily: font,
          }}
        >
          <h4 className="text-lg font-bold" style={{ color: primaryColor }}>
            {menu.name}
          </h4>
          <p className="mt-1 text-sm opacity-70">
            {menu.description ?? t("catering.theme.sampleDescription")}
          </p>
          <div className="mt-3 flex gap-2">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {t("catering.theme.samplePackage")}
            </span>
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              {t("catering.theme.sampleItem")}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saveMutation.isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {t("catering.theme.save")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm(t("catering.theme.resetConfirm"))) {
              resetMutation.mutate({});
            }
          }}
          disabled={resetMutation.isLoading}
        >
          {t("catering.theme.reset")}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inquiries Tab (within editor)
// ---------------------------------------------------------------------------

function EditorInquiriesTab({
  inquiries,
  t,
}: {
  inquiries: CateringInquiry[];
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (!inquiries.length) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          {t("catering.noInquiriesForMenu")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{t("catering.editor.inquiries")}</h3>
      {inquiries.map((inq) => {
        const eventDate = new Date(inq.eventDate);
        return (
          <div
            key={inq.id}
            className="rounded-xl border border-border/40 bg-card/60 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{inq.customerName}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    getStatusColor(inq.status),
                  )}
                >
                  {t(`catering.statuses.${inq.status}`)}
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {eventDate.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {inq.guestCount} {t("catering.guests")}
              </span>
              {inq.estimatedTotal != null && inq.estimatedTotal > 0 && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatPrice(inq.estimatedTotal)}
                </span>
              )}
            </div>
            {inq.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {inq.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Editor Component
// ---------------------------------------------------------------------------

export function CateringMenuEditor({ menuId, onBack }: CateringMenuEditorProps) {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const [activeTab, setActiveTab] = useState<EditorTab>("details");

  const {
    data: menu,
    isLoading,
    refetch,
  } = api.cateringMenus.getById.useQuery({ menuId });

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (isLoading) return <LoadingScreen />;

  if (!menu) {
    return (
      <DashboardShell>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {t("catering.menuNotFound")}
          </p>
          <Button variant="outline" className="mt-4" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("catering.backToList")}
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      {/* Editor header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t("catering.backToList")}
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold tracking-tight">
            {menu.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("catering.editMenuDescription")}
          </p>
        </div>
        <Badge
          variant={menu.isPublished ? "default" : "outline"}
          className="shrink-0"
        >
          {menu.isPublished
            ? t("catering.published")
            : t("catering.draft")}
        </Badge>
      </div>

      {/* Editor layout: sidebar + content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar tabs */}
        <nav className="flex gap-1 lg:w-48 lg:flex-col lg:gap-0.5">
          {EDITOR_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                {t(`catering.editor.${tab.id}`)}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 rounded-xl border border-border/40 bg-card/30 p-6">
          {activeTab === "details" && (
            <DetailsTab
              menu={menu as CateringMenuFull}
              onRefetch={handleRefetch}
            />
          )}
          {activeTab === "packages" && (
            <PackagesTab
              menu={menu as CateringMenuFull}
              onRefetch={handleRefetch}
            />
          )}
          {activeTab === "items" && (
            <ItemsTab
              menu={menu as CateringMenuFull}
              onRefetch={handleRefetch}
            />
          )}
          {activeTab === "theme" && (
            <ThemeTab
              menu={menu as CateringMenuFull}
              onRefetch={handleRefetch}
            />
          )}
          {activeTab === "inquiries" && (
            <EditorInquiriesTab
              inquiries={[]}
              t={
                t as (
                  key: string,
                  opts?: Record<string, unknown>,
                ) => string
              }
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
