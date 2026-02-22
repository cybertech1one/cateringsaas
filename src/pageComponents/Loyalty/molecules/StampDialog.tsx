"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";

interface StampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  onSuccess: () => void;
}

export function StampDialog({
  open,
  onOpenChange,
  programId,
  onSuccess,
}: StampDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [notes, setNotes] = useState("");

  const addStampMutation = api.loyalty.addStamp.useMutation({
    onSuccess: (data) => {
      toast({
        title: t("loyalty.stampAdded"),
        description: t("loyalty.stampAddedDescription", {
          collected: data.stampsCollected,
          required: data.stampsRequired,
        }),
      });
      setCustomerIdentifier("");
      setNotes("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerIdentifier.trim() || !programId) return;

    addStampMutation.mutate({
      programId,
      customerIdentifier: customerIdentifier.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("loyalty.addStamp")}</DialogTitle>
          <DialogDescription>
            {t("loyalty.addStampDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-id">
              {t("loyalty.customerIdentifier")}
            </Label>
            <Input
              id="customer-id"
              value={customerIdentifier}
              onChange={(e) => setCustomerIdentifier(e.target.value)}
              placeholder={t("loyalty.customerIdentifierPlaceholder")}
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stamp-notes">{t("loyalty.stampNotes")}</Label>
            <Input
              id="stamp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("loyalty.stampNotesPlaceholder")}
              maxLength={500}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("loyalty.cancel")}
            </Button>
            <Button type="submit" loading={addStampMutation.isLoading}>
              {t("loyalty.addStamp")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
