"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import {
  MessageSquare,
  Check,
  X as XIcon,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { StarRating } from "./StarRating";

// ── Types ────────────────────────────────────────────────────

type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  menuId: string;
  customerName: string | null;
  customerEmail: string | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus | null;
  response: string | null;
  respondedAt: Date | string | null;
  createdAt: Date | string;
}

interface ReviewCardProps {
  review: Review;
  replyingToId: string | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onStartReply: (reviewId: string, existingResponse: string | null) => void;
  onCancelReply: () => void;
  onSendReply: (reviewId: string) => void;
  onModerate: (reviewId: string, status: "approved" | "rejected") => void;
  onDelete: (reviewId: string) => void;
  isModerateLoading: boolean;
  isRespondLoading: boolean;
  formatDate: (date: Date | string) => string;
}

// ── Constants ────────────────────────────────────────────────

const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// ── Component ────────────────────────────────────────────────

export const ReviewCard = memo(function ReviewCard({
  review,
  replyingToId,
  replyText,
  onReplyTextChange,
  onStartReply,
  onCancelReply,
  onSendReply,
  onModerate,
  onDelete,
  isModerateLoading,
  isRespondLoading,
  formatDate,
}: ReviewCardProps) {
  const { t } = useTranslation();

  return (
    <div className="group rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Review content */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-950/30">
              <StarRating rating={review.rating} size="sm" />
            </div>
            <span className="font-display text-sm font-bold">
              {review.customerName || t("reviews.anonymous")}
            </span>
            <Badge
              className={`border-0 ${STATUS_COLORS[review.status ?? "pending"]}`}
              variant="secondary"
            >
              {t(`reviews.status_${review.status ?? "pending"}` as `reviews.status_${ReviewStatus}`)}
            </Badge>
            <time className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </time>
          </div>

          {review.comment && (
            <p className="text-sm leading-relaxed text-foreground/90">
              {review.comment}
            </p>
          )}

          {review.customerEmail && (
            <p className="text-xs text-muted-foreground">
              {review.customerEmail}
            </p>
          )}

          {/* Owner response */}
          {review.response && (
            <div className="mt-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 to-transparent p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                  <MessageCircle className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary">
                  {t("reviews.ownerResponse")}
                </span>
                {review.respondedAt && (
                  <time className="text-xs text-muted-foreground">
                    {formatDate(review.respondedAt)}
                  </time>
                )}
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                {review.response}
              </p>
            </div>
          )}

          {/* Inline reply form */}
          {replyingToId === review.id && (
            <div className="mt-3 space-y-3">
              <Textarea
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                placeholder={t("reviews.replyPlaceholder")}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => onSendReply(review.id)}
                  loading={isRespondLoading}
                  disabled={!replyText.trim()}
                >
                  {t("reviews.sendReply")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={onCancelReply}
                >
                  {t("reviews.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-shrink-0 flex-wrap gap-2 sm:flex-col">
          {review.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                onClick={() => onModerate(review.id, "approved")}
                loading={isModerateLoading}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {t("reviews.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => onModerate(review.id, "rejected")}
                loading={isModerateLoading}
              >
                <XIcon className="mr-1.5 h-3.5 w-3.5" />
                {t("reviews.reject")}
              </Button>
            </>
          )}
          {replyingToId !== review.id && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => onStartReply(review.id, review.response)}
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              {review.response
                ? t("reviews.editReply")
                : t("reviews.reply")}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(review.id)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {t("reviews.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
});
