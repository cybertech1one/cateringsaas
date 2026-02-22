"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { api } from "~/trpc/react";
import { cn } from "~/utils/cn";

interface RateDriverFormProps {
  deliveryId: string;
  existingRating: number | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function RateDriverForm({
  deliveryId,
  existingRating,
  t,
}: RateDriverFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(!!existingRating);

  const rateMutation = api.delivery.rateDriver.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (submitted || existingRating) {
    return (
      <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-5 w-5",
                  i < (existingRating ?? rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-primary">
            {t("deliveryTracking.ratingSubmitted")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-foreground">
        {t("deliveryTracking.rateDelivery")}
      </p>

      {/* Star rating */}
      <div className="mb-3 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;

          return (
            <button
              key={i}
              type="button"
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHoveredRating(starValue)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`Rate ${starValue} stars`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  starValue <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30",
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Comment */}
      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("deliveryTracking.rateComment")}
            maxLength={500}
            rows={2}
            className="mb-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            disabled={rateMutation.isLoading}
            onClick={() =>
              rateMutation.mutate({
                deliveryId,
                rating,
                comment: comment.trim() || undefined,
              })
            }
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {rateMutation.isLoading
              ? "..."
              : t("deliveryTracking.submitRating")}
          </button>
        </>
      )}

      {rateMutation.isError && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {rateMutation.error.message}
        </p>
      )}
    </div>
  );
}
