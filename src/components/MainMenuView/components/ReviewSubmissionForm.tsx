"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Send } from "lucide-react";
import { cn } from "~/utils/cn";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";

interface ReviewSubmissionFormProps {
  menuId: string;
  onReviewSubmitted: () => void;
  themed: boolean;
}

export function ReviewSubmissionForm({
  menuId,
  onReviewSubmitted,
  themed,
}: ReviewSubmissionFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const submitReview = api.reviews.submitReview.useMutation({
    onSuccess: () => {
      toast({
        title: t("publicMenu.reviewSubmitted") as string,
        description: t("publicMenu.reviewSubmittedDescription") as string,
      });
      setReviewName("");
      setReviewComment("");
      setReviewRating(0);
      setShowForm(false);
      onReviewSubmitted();
    },
    onError: () => {
      toast({
        title: t("publicMenu.reviewFailed") as string,
        description: t("publicMenu.reviewFailedDescription") as string,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (reviewRating === 0) {
      toast({
        title: t("publicMenu.ratingRequired") as string,
        variant: "destructive",
      });

      return;
    }

    submitReview.mutate({
      menuId,
      rating: reviewRating,
      customerName: reviewName.trim() || undefined,
      comment: reviewComment.trim() || undefined,
    });
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className={cn(
          "flex w-full items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
          !themed && "rounded-lg border border-border/50 bg-secondary/50 text-primary hover:bg-secondary",
        )}
        style={themed ? {
          backgroundColor: "var(--menu-surface)",
          color: "var(--menu-primary)",
          border: "1px solid var(--menu-border)",
          borderRadius: "var(--menu-radius)",
        } : undefined}
      >
        <Star className="h-4 w-4" />
        {t("publicMenu.leaveReview")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-4 p-4",
        !themed && "rounded-lg border border-border/50 bg-secondary/30",
      )}
      style={themed ? {
        backgroundColor: "var(--menu-surface)",
        border: "1px solid var(--menu-border)",
        borderRadius: "var(--menu-radius-lg)",
      } : undefined}
    >
      <h3
        className={cn("text-sm font-semibold", !themed && "text-foreground")}
        style={themed ? { fontFamily: "var(--menu-heading-font)" } : undefined}
      >
        {t("publicMenu.leaveReview")}
      </h3>

      {/* Star Rating Picker */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                star <= (hoverRating || reviewRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300",
              )}
            />
          </button>
        ))}
      </div>

      {/* Name Input */}
      <div className="flex flex-col gap-1">
        <label
          className={cn("text-xs font-medium", !themed && "text-muted-foreground")}
          style={themed ? { color: "var(--menu-muted)" } : undefined}
        >
          {t("publicMenu.yourName")}
        </label>
        <input
          type="text"
          value={reviewName}
          onChange={(e) => setReviewName(e.target.value)}
          placeholder={t("publicMenu.yourNamePlaceholder") as string}
          maxLength={100}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2",
            !themed && "border-border bg-background text-foreground focus:ring-primary/30",
          )}
          style={themed ? {
            backgroundColor: "var(--menu-background)",
            color: "var(--menu-text)",
            borderColor: "var(--menu-border)",
            borderRadius: "var(--menu-radius)",
          } : undefined}
        />
      </div>

      {/* Comment Input */}
      <div className="flex flex-col gap-1">
        <label
          className={cn("text-xs font-medium", !themed && "text-muted-foreground")}
          style={themed ? { color: "var(--menu-muted)" } : undefined}
        >
          {t("publicMenu.yourComment")}
        </label>
        <textarea
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder={t("publicMenu.yourCommentPlaceholder") as string}
          maxLength={2000}
          rows={3}
          className={cn(
            "w-full resize-none rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2",
            !themed && "border-border bg-background text-foreground focus:ring-primary/30",
          )}
          style={themed ? {
            backgroundColor: "var(--menu-background)",
            color: "var(--menu-text)",
            borderColor: "var(--menu-border)",
            borderRadius: "var(--menu-radius)",
          } : undefined}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitReview.isLoading}
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50",
          !themed && "rounded-lg bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        style={themed ? {
          backgroundColor: "var(--menu-primary)",
          color: "#fff",
          borderRadius: "var(--menu-radius)",
        } : undefined}
      >
        <Send className="h-4 w-4" />
        {submitReview.isLoading
          ? t("publicMenu.submitting")
          : t("publicMenu.submitReview")}
      </button>
    </form>
  );
}
