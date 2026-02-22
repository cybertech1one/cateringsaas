"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";

const EMOJI_PRESETS = [
  "\u2B50", "\u2615", "\uD83C\uDF55", "\uD83C\uDF54", "\uD83C\uDF70",
  "\uD83C\uDF69", "\uD83C\uDF7D\uFE0F", "\uD83D\uDC96", "\uD83C\uDF1F", "\uD83C\uDF81",
  "\uD83C\uDF89", "\uD83D\uDCAB", "\uD83D\uDD25", "\uD83C\uDF08", "\uD83C\uDF40",
];

const COLOR_PRESETS = [
  "#D4A853", "#E74C3C", "#3498DB", "#2ECC71", "#9B59B6",
  "#F39C12", "#1ABC9C", "#E67E22", "#34495E", "#E91E63",
];

type LoyaltyProgram = {
  id: string;
  menuId: string;
  name: string;
  description: string | null;
  stampsRequired: number;
  rewardDescription: string;
  rewardType: string;
  rewardValue: number | null;
  isActive: boolean | null;
  icon: string | null;
  color: string | null;
};

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  program: LoyaltyProgram | null;
  onSuccess: () => void;
}

export function ProgramDialog({
  open,
  onOpenChange,
  menuId,
  program,
  onSuccess,
}: ProgramDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stampsRequired, setStampsRequired] = useState(10);
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardType, setRewardType] = useState("free_item");
  const [rewardValue, setRewardValue] = useState<number | "">("");
  const [icon, setIcon] = useState("\u2B50");
  const [color, setColor] = useState("#D4A853");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description ?? "");
      setStampsRequired(program.stampsRequired);
      setRewardDescription(program.rewardDescription);
      setRewardType(program.rewardType);
      setRewardValue(program.rewardValue ?? "");
      setIcon(program.icon ?? "");
      setColor(program.color ?? "");
      setIsActive(program.isActive ?? true);
    } else {
      setName("");
      setDescription("");
      setStampsRequired(10);
      setRewardDescription("");
      setRewardType("free_item");
      setRewardValue("");
      setIcon("\u2B50");
      setColor("#D4A853");
      setIsActive(true);
    }
  }, [program, open]);

  const createMutation = api.loyalty.createProgram.useMutation({
    onSuccess: () => {
      toast({
        title: t("loyalty.programCreated"),
        description: t("loyalty.programCreatedDescription"),
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

  const updateMutation = api.loyalty.updateProgram.useMutation({
    onSuccess: () => {
      toast({
        title: t("loyalty.programUpdated"),
        description: t("loyalty.programUpdatedDescription"),
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

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !rewardDescription.trim()) return;

    const parsedRewardValue =
      typeof rewardValue === "number" ? rewardValue : undefined;

    if (program) {
      updateMutation.mutate({
        programId: program.id,
        name: name.trim(),
        description: description.trim() || undefined,
        stampsRequired,
        rewardDescription: rewardDescription.trim(),
        rewardType: rewardType as
          | "free_item"
          | "discount_percent"
          | "discount_amount",
        rewardValue: parsedRewardValue ?? null,
        icon,
        color,
        isActive,
      });
    } else {
      createMutation.mutate({
        menuId,
        name: name.trim(),
        description: description.trim() || undefined,
        stampsRequired,
        rewardDescription: rewardDescription.trim(),
        rewardType: rewardType as
          | "free_item"
          | "discount_percent"
          | "discount_amount",
        rewardValue: parsedRewardValue,
        icon,
        color,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {program ? t("loyalty.editProgram") : t("loyalty.createProgram")}
          </DialogTitle>
          <DialogDescription>
            {program
              ? t("loyalty.programUpdatedDescription")
              : t("loyalty.noProgramsDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program-name">{t("loyalty.programName")}</Label>
            <Input
              id="program-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("loyalty.programNamePlaceholder")}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-description">
              {t("loyalty.programDescription")}
            </Label>
            <Input
              id="program-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("loyalty.programDescriptionPlaceholder")}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stamps-required">
              {t("loyalty.stampsRequired")}
            </Label>
            <Input
              id="stamps-required"
              type="number"
              min={2}
              max={50}
              value={stampsRequired}
              onChange={(e) => setStampsRequired(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward-description">
              {t("loyalty.rewardDescription")}
            </Label>
            <Input
              id="reward-description"
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder={t("loyalty.rewardDescriptionPlaceholder")}
              maxLength={200}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("loyalty.rewardType")}</Label>
              <Select value={rewardType} onValueChange={setRewardType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_item">
                    {t("loyalty.rewardTypeFreeItem")}
                  </SelectItem>
                  <SelectItem value="discount_percent">
                    {t("loyalty.rewardTypeDiscountPercent")}
                  </SelectItem>
                  <SelectItem value="discount_amount">
                    {t("loyalty.rewardTypeDiscountAmount")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rewardType !== "free_item" && (
              <div className="space-y-2">
                <Label htmlFor="reward-value">
                  {t("loyalty.rewardValue")}
                </Label>
                <Input
                  id="reward-value"
                  type="number"
                  min={0}
                  value={rewardValue}
                  onChange={(e) =>
                    setRewardValue(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("loyalty.icon")}</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-colors ${
                    icon === emoji
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("loyalty.color")}</Label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      color === c
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-10 cursor-pointer border-0 p-0"
              />
            </div>
          </div>

          {program && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="is-active" className="cursor-pointer">
                {t("loyalty.active")}
              </Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("loyalty.cancel")}
            </Button>
            <Button type="submit" loading={isLoading}>
              {t("loyalty.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
