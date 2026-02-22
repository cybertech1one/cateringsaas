"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import {
  Plus,
  Copy,
  Trash2,
  Megaphone,
  Calendar,
  Tag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Restaurant {
  id: string;
  name: string;
}

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  promotionType: string;
  discountPercent: number | null;
  discountAmount: number | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

function getStatusInfo(promo: Promotion): { variant: "secondary" | "destructive" | "default"; key: "marketing.coupon.inactive" | "marketing.coupon.expired" | "marketing.coupon.active" } {
  const now = new Date();

  if (!promo.isActive) {
    return { variant: "secondary", key: "marketing.coupon.inactive" };
  }

  if (promo.endDate && new Date(promo.endDate) < now) {
    return { variant: "destructive", key: "marketing.coupon.expired" };
  }

  return { variant: "default", key: "marketing.coupon.active" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CouponManagerProps {
  restaurants: Restaurant[];
}

export function CouponManager({ restaurants }: CouponManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percent" | "fixed">("percent");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0] ?? "");
  const [formEndDate, setFormEndDate] = useState("");

  // Queries
  const {
    data: promotions,
    isLoading: promotionsLoading,
    refetch: refetchPromotions,
  } = api.promotions.getPromotions.useQuery(
    { restaurantId: selectedRestaurantId },
    { enabled: !!selectedRestaurantId },
  );

  // Mutations
  const createMutation = api.promotions.createPromotion.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.promotionCreated"),
        description: t("toast.promotionCreatedDescription"),
      });
      setDialogOpen(false);
      resetForm();
      void refetchPromotions();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const toggleMutation = api.promotions.togglePromotion.useMutation({
    onSuccess: () => {
      toast({ title: t("toast.promotionToggled") });
      void refetchPromotions();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.promotions.deletePromotion.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.promotionDeleted"),
        description: t("toast.promotionDeletedDescription"),
      });
      setDeleteId(null);
      void refetchPromotions();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormDescription("");
    setFormDiscountType("percent");
    setFormDiscountValue("");
    setFormStartDate(new Date().toISOString().split("T")[0] ?? "");
    setFormEndDate("");
  }, []);

  const handleCreate = useCallback(() => {
    resetForm();
    setFormTitle(generateCouponCode());
    setDialogOpen(true);
  }, [resetForm]);

  const handleSubmit = useCallback(() => {
    const value = Number(formDiscountValue);

    if (!formTitle || isNaN(value) || value <= 0) return;

    createMutation.mutate({
      restaurantId: selectedRestaurantId,
      title: formTitle,
      description: formDescription || undefined,
      promotionType: "discount",
      discountPercent: formDiscountType === "percent" ? value : undefined,
      discountAmount: formDiscountType === "fixed" ? Math.round(value * 100) : undefined,
      startDate: new Date(formStartDate),
      endDate: formEndDate ? new Date(formEndDate) : undefined,
      isActive: true,
      applicableDays: [],
    });
  }, [
    formTitle,
    formDescription,
    formDiscountType,
    formDiscountValue,
    formStartDate,
    formEndDate,
    selectedRestaurantId,
    createMutation,
  ]);

  const handleCopyCode = useCallback(
    (code: string) => {
      void navigator.clipboard.writeText(code);
      toast({ title: t("marketing.coupon.codeCopied") });
    },
    [toast, t],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Restaurant selector + Create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-[220px]">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            {t("promotions.selectRestaurant")}
          </label>
          <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
            <SelectTrigger>
              <SelectValue placeholder={t("promotions.selectRestaurantPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRestaurantId && (
          <Button
            className="rounded-full px-6 shadow-sm"
            variant="default"
            onClick={handleCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("marketing.coupon.create")}
          </Button>
        )}
      </div>

      {/* Loading state */}
      {selectedRestaurantId && promotionsLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-[180px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {selectedRestaurantId && !promotionsLoading && (!promotions || promotions.length === 0) && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Tag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">
            {t("marketing.coupon.noCoupons")}
          </h2>
          <p className="mb-8 mt-2 max-w-md text-sm text-muted-foreground">
            {t("marketing.coupon.noCouponsDescription")}
          </p>
          <Button className="rounded-full" variant="default" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("marketing.coupon.create")}
          </Button>
        </div>
      )}

      {/* No restaurant selected */}
      {!selectedRestaurantId && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Megaphone className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">
            {t("marketing.coupon.selectRestaurantFirst")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("marketing.coupon.selectRestaurantFirstDescription")}
          </p>
        </div>
      )}

      {/* Coupon list */}
      {selectedRestaurantId && !promotionsLoading && promotions && promotions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(promotions as unknown as Promotion[]).map((promo) => (
            <Card key={promo.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {promo.title}
                  </CardTitle>
                  {promo.description && (
                    <p className="text-sm text-muted-foreground">{promo.description}</p>
                  )}
                </div>
                {(() => {
                  const status = getStatusInfo(promo);

                  return (
                    <Badge variant={status.variant} className="text-xs">
                      {t(status.key)}
                    </Badge>
                  );
                })()}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {/* Discount info */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {t("marketing.coupon.discount")}:
                    </span>
                    <span className="font-medium">
                      {(() => {
                        if (promo.discountPercent) {
                          return `${promo.discountPercent}% ${t("promotions.discount")}`;
                        }

                        if (promo.discountAmount) {
                          return `${(promo.discountAmount / 100).toFixed(2)} ${t("promotions.discount")}`;
                        }

                        return promo.promotionType;
                      })()}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(promo.startDate).toLocaleDateString()}
                      {promo.endDate ? ` - ${new Date(promo.endDate).toLocaleDateString()}` : ""}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleCopyCode(promo.title)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {t("marketing.coupon.copyCode")}
                    </Button>

                    <div className="ml-auto flex items-center gap-2">
                      <Switch
                        checked={promo.isActive}
                        onCheckedChange={() => toggleMutation.mutate({ id: promo.id })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(promo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("marketing.coupon.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("marketing.coupon.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Code */}
            <div className="grid gap-2">
              <Label htmlFor="coupon-code">{t("marketing.coupon.codeLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon-code"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 shrink-0 p-0"
                  onClick={() => setFormTitle(generateCouponCode())}
                  title={t("marketing.coupon.generateCode")}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="coupon-description">{t("marketing.coupon.descriptionLabel")}</Label>
              <Input
                id="coupon-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("marketing.coupon.descriptionPlaceholder")}
              />
            </div>

            {/* Discount type */}
            <div className="grid gap-2">
              <Label>{t("marketing.coupon.discountType")}</Label>
              <Select
                value={formDiscountType}
                onValueChange={(v) => setFormDiscountType(v as "percent" | "fixed")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">{t("marketing.coupon.percentage")}</SelectItem>
                  <SelectItem value="fixed">{t("marketing.coupon.fixedAmount")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount value */}
            <div className="grid gap-2">
              <Label htmlFor="coupon-value">{t("marketing.coupon.discountValue")}</Label>
              <Input
                id="coupon-value"
                type="number"
                min="0"
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(e.target.value)}
                placeholder={formDiscountType === "percent" ? "20" : "5.00"}
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="coupon-start">{t("promotions.startDate")}</Label>
                <Input
                  id="coupon-start"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coupon-end">{t("promotions.endDate")}</Label>
                <Input
                  id="coupon-end"
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("promotions.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formTitle || !formDiscountValue || createMutation.isLoading}
            >
              {createMutation.isLoading ? t("marketing.coupon.creating") : t("marketing.coupon.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("promotions.deletePromotion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("marketing.coupon.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("promotions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteMutation.mutate({ id: deleteId });
              }}
            >
              {t("menuOperations.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
