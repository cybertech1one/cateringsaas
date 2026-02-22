"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  type PromotionType,
  type DayOfWeek,
  type Promotion,
  type Menu,
  type PromotionFormValues,
  promotionFormSchema,
  toDateInputValue,
} from "../types";
import { PromotionFormFields } from "./PromotionFormFields";

// ── Types ────────────────────────────────────────────────────

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  promotion: Promotion | null;
  menus: Menu[];
  onSuccess: () => void;
}

// ── Component ────────────────────────────────────────────────

export function PromotionDialog({
  open,
  onOpenChange,
  restaurantId,
  promotion,
  menus,
  onSuccess,
}: PromotionDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEditing = !!promotion;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      promotionType: "discount",
      discountPercent: "",
      discountAmount: "",
      startDate: toDateInputValue(new Date()),
      endDate: "",
      applicableDays: [],
      startTime: "",
      endTime: "",
      menuId: "",
      isActive: true,
    },
  });

  // Reset form when dialog opens/closes or when promotion changes
  useEffect(() => {
    if (open && promotion) {
      reset({
        title: promotion.title,
        description: promotion.description ?? "",
        promotionType: promotion.promotionType as PromotionType,
        discountPercent: promotion.discountPercent ?? "",
        discountAmount: promotion.discountAmount ?? "",
        startDate: toDateInputValue(promotion.startDate),
        endDate: promotion.endDate ? toDateInputValue(promotion.endDate) : "",
        applicableDays: promotion.applicableDays as DayOfWeek[],
        startTime: promotion.startTime ?? "",
        endTime: promotion.endTime ?? "",
        menuId: promotion.menuId ?? "",
        isActive: promotion.isActive,
      });
    } else if (open && !promotion) {
      reset({
        title: "",
        description: "",
        promotionType: "discount",
        discountPercent: "",
        discountAmount: "",
        startDate: toDateInputValue(new Date()),
        endDate: "",
        applicableDays: [],
        startTime: "",
        endTime: "",
        menuId: "",
        isActive: true,
      });
    }
  }, [open, promotion, reset]);

  // ── Mutations ──────────────────────────────────────────────

  const createMutation = api.promotions.createPromotion.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.promotionCreated"),
        description: t("toast.promotionCreatedDescription"),
      });
      onSuccess();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.promotions.updatePromotion.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.promotionUpdated"),
        description: t("toast.promotionUpdatedDescription"),
      });
      onSuccess();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  // ── Submit ─────────────────────────────────────────────────

  function onSubmit(values: PromotionFormValues) {
    const discountPercent =
      values.discountPercent !== "" && values.discountPercent !== undefined
        ? Number(values.discountPercent)
        : undefined;
    const discountAmount =
      values.discountAmount !== "" && values.discountAmount !== undefined
        ? Number(values.discountAmount)
        : undefined;

    if (isEditing && promotion) {
      updateMutation.mutate({
        id: promotion.id,
        title: values.title,
        description: values.description || null,
        promotionType: values.promotionType,
        discountPercent: discountPercent ?? null,
        discountAmount: discountAmount ?? null,
        startDate: new Date(values.startDate),
        endDate: values.endDate ? new Date(values.endDate) : null,
        isActive: values.isActive,
        applicableDays: values.applicableDays,
        startTime: values.startTime || null,
        endTime: values.endTime || null,
        menuId: values.menuId || null,
      });
    } else {
      createMutation.mutate({
        restaurantId,
        title: values.title,
        description: values.description || undefined,
        promotionType: values.promotionType,
        discountPercent,
        discountAmount,
        startDate: new Date(values.startDate),
        endDate: values.endDate ? new Date(values.endDate) : undefined,
        isActive: values.isActive,
        applicableDays: values.applicableDays,
        startTime: values.startTime || undefined,
        endTime: values.endTime || undefined,
        menuId: values.menuId || undefined,
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("promotions.editPromotion") : t("promotions.createPromotion")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("promotions.dialogEditDescription")
              : t("promotions.dialogCreateDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <PromotionFormFields
            register={register}
            control={control}
            errors={errors}
            menus={menus}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("promotions.cancel")}
            </Button>
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {isEditing ? t("promotions.updatePromotion") : t("promotions.createPromotion")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
