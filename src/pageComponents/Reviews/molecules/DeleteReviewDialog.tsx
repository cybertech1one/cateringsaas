"use client";

import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────

interface DeleteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

// ── Component ────────────────────────────────────────────────

export function DeleteReviewDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteReviewDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("reviews.deleteConfirmTitle")}</DialogTitle>
          <DialogDescription>
            {t("reviews.deleteConfirmDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={onCancel}
          >
            {t("reviews.cancel")}
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={onConfirm}
            loading={isLoading}
          >
            {t("reviews.confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
