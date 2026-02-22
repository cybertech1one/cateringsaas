"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { cn } from "~/utils/cn";
import { type ReviewItem } from "./types";

function starClass(isFilled: boolean, themed: boolean): string {
  if (isFilled) {
    return "fill-amber-400 text-amber-400";
  }

  return themed ? "text-gray-300" : "text-border";
}

interface ReviewCardProps {
  review: ReviewItem;
  themed: boolean;
}

export const ReviewCard = memo(function ReviewCard({ review, themed }: ReviewCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col gap-1.5 pb-3"
      style={themed ? { borderBottom: "1px solid var(--menu-border)" } : { borderBottom: "1px solid hsl(var(--border) / 0.2)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn("text-sm font-medium", !themed && "text-foreground")}
        >
          {review.customerName ?? t("reviews.anonymous")}
        </span>
        <span
          className={cn("text-[10px]", !themed && "text-muted-foreground")}
          style={themed ? { color: "var(--menu-muted)" } : undefined}
        >
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3 w-3",
              starClass(star <= review.rating, themed),
            )}
          />
        ))}
      </div>
      {review.comment && (
        <p
          className={cn("text-sm leading-relaxed", !themed && "text-muted-foreground")}
          style={themed ? { color: "var(--menu-muted)" } : undefined}
        >
          {review.comment}
        </p>
      )}
      {review.response && (
        <div
          className={cn(
            "ml-3 mt-1 px-3 py-2",
            !themed && "rounded-md border-l-2 border-primary/30 bg-secondary/30",
          )}
          style={themed ? {
            borderLeft: "2px solid var(--menu-primary)",
            backgroundColor: "var(--menu-surface)",
            borderRadius: "var(--menu-radius)",
          } : undefined}
        >
          <span
            className={cn("text-[10px] font-semibold", !themed && "text-primary")}
            style={themed ? { color: "var(--menu-primary)" } : undefined}
          >
            {t("publicMenu.ownerResponse")}
          </span>
          <p
            className={cn("text-xs", !themed && "text-muted-foreground")}
            style={themed ? { color: "var(--menu-muted)" } : undefined}
          >
            {review.response}
          </p>
        </div>
      )}
    </div>
  );
});
