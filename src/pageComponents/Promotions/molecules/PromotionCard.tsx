"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import {
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Percent,
  DollarSign,
  Tag,
} from "lucide-react";
import {
  type Promotion,
  type PromotionType,
  PROMOTION_TYPE_STYLES,
  getPromotionStatus,
  formatDate,
  capitalize,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────

function getStatusStyle(status: "active" | "scheduled" | "expired"): string {
  if (status === "active") {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }

  if (status === "scheduled") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }

  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

// ── Types ────────────────────────────────────────────────────

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────

export const PromotionCard = memo(function PromotionCard({
  promotion,
  onEdit,
  onDelete,
  onToggle,
}: PromotionCardProps) {
  const { t } = useTranslation();
  const status = getPromotionStatus(promotion);
  const typeStyle =
    PROMOTION_TYPE_STYLES[
      promotion.promotionType as PromotionType
    ] ?? PROMOTION_TYPE_STYLES.discount;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-200 hover:border-primary/20 hover:shadow-card">
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-semibold">
              {promotion.title}
            </h3>
            {promotion.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {promotion.description}
              </p>
            )}
          </div>
          <Badge
            className={`shrink-0 border-0 ${typeStyle.bg} ${typeStyle.text}`}
          >
            {(() => {
              const typeLabels: Record<string, string> = {
                daily_special: t("promotions.dailySpecial"),
                happy_hour: t("promotions.happyHour"),
                discount: t("promotions.discount"),
                combo: t("promotions.combo"),
                seasonal: t("promotions.seasonal"),
              };

              return typeLabels[promotion.promotionType] ?? promotion.promotionType;
            })()}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-3">
        {/* Discount info */}
        {(promotion.discountPercent ||
          promotion.discountAmount) && (
          <div className="flex items-center gap-2 text-sm">
            {promotion.discountPercent ? (
              <>
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {promotion.discountPercent}% off
                </span>
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {((promotion.discountAmount ?? 0) / 100).toFixed(2)}{" "}
                  off
                </span>
              </>
            )}
          </div>
        )}

        {/* Date range */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(promotion.startDate)}
            {promotion.endDate &&
              ` - ${formatDate(promotion.endDate)}`}
            {!promotion.endDate && ` - ${t("promotions.noEndDate")}`}
          </span>
        </div>

        {/* Time window */}
        {promotion.startTime && promotion.endTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {promotion.startTime} - {promotion.endTime}
            </span>
          </div>
        )}

        {/* Applicable days */}
        {promotion.applicableDays.length > 0 &&
          promotion.applicableDays.length < 7 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <div className="flex flex-wrap gap-1">
                {promotion.applicableDays.map((day) => (
                  <span
                    key={day}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-xs"
                  >
                    {capitalize(day.slice(0, 3))}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(status)}`}
          >
            {capitalize(status)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={promotion.isActive}
            onCheckedChange={() => onToggle(promotion.id)}
          />
          <span className="text-xs text-muted-foreground">
            {promotion.isActive ? t("promotions.active") : t("promotions.inactive")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => onEdit(promotion)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg text-destructive hover:text-destructive"
            onClick={() => onDelete(promotion.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
