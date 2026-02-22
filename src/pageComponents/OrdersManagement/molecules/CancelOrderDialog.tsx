"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

const CANCEL_REASONS = [
  { key: "cancelReasonOutOfStock", value: "Out of stock" },
  { key: "cancelReasonKitchenClosed", value: "Kitchen closed" },
  { key: "cancelReasonCustomerRequest", value: "Customer request" },
  { key: "cancelReasonOther", value: "Other" },
] as const;

interface CancelOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

export function CancelOrderDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
}: CancelOrderDialogProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    let reason = selectedReason;

    if (selectedReason === "Other" && customReason.trim()) {
      reason = customReason.trim();
    }

    if (!reason) return;
    onConfirm(reason);
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("ordersManagement.cancelOrder")}</DialogTitle>
          <DialogDescription>
            {t("ordersManagement.cancelReason")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((reason) => (
            <Button
              key={reason.key}
              variant={selectedReason === reason.value ? "default" : "outline"}
              className="justify-start rounded-lg"
              onClick={() => setSelectedReason(reason.value)}
            >
              {t(`ordersManagement.${reason.key}`)}
            </Button>
          ))}
        </div>

        {selectedReason === "Other" && (
          <Textarea
            placeholder={t("ordersManagement.cancelReasonCustom")}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="mt-2"
            rows={3}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="rounded-full">
            {t("ordersManagement.cancel")}
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === "Other" && !customReason.trim())}
            loading={isLoading}
          >
            {t("ordersManagement.confirmCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
