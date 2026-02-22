"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/utils/cn";
import { api } from "~/trpc/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedbackFormProps {
  menuId: string;
  restaurantName: string;
  logoUrl: string | null;
  googleReviewUrl: string | null;
}

type FormPhase = "form" | "thank-you";

// ---------------------------------------------------------------------------
// Star Rating Component
// ---------------------------------------------------------------------------

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-center gap-2" role="radiogroup">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hovered || value);

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className={cn(
              "rounded-full p-1.5 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
              "hover:scale-110 active:scale-95",
              isActive ? "text-amber-400" : "text-gray-300",
            )}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className="h-10 w-10 sm:h-12 sm:w-12"
              fill={isActive ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback Form
// ---------------------------------------------------------------------------

export function FeedbackForm({
  menuId,
  restaurantName,
  logoUrl,
  googleReviewUrl,
}: FeedbackFormProps) {
  const { t: rawT } = useTranslation("common");
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phase, setPhase] = useState<FormPhase>("form");
  const [ratingError, setRatingError] = useState(false);

  // Duplicate submission guard (localStorage)
  const storageKey = `feedback-submitted-${menuId}`;
  const hasAlreadySubmitted =
    typeof window !== "undefined" &&
    localStorage.getItem(storageKey) === "true";

  const submitMutation = api.reviews.submitReview.useMutation({
    onSuccess: () => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
      }

      setPhase("thank-you");
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (rating === 0) {
        setRatingError(true);

        return;
      }

      setRatingError(false);

      submitMutation.mutate({
        menuId,
        rating,
        comment: comment.trim() || undefined,
        customerName: customerName.trim() || undefined,
      });
    },
    [rating, comment, customerName, menuId, submitMutation],
  );

  // -- Already submitted guard --
  if (hasAlreadySubmitted && phase === "form") {
    return (
      <Card className="mx-auto w-full max-w-md p-8 text-center">
        <RestaurantHeader
          logoUrl={logoUrl}
          restaurantName={restaurantName}
        />
        <p className="mt-4 text-gray-600">
          {t("feedback.alreadySubmitted")}
        </p>
        <PoweredBy />
      </Card>
    );
  }

  // -- Thank-you phase with smart routing --
  if (phase === "thank-you") {
    const isPositive = rating >= 4;

    return (
      <Card className="mx-auto w-full max-w-md p-8 text-center">
        <RestaurantHeader
          logoUrl={logoUrl}
          restaurantName={restaurantName}
        />

        {/* Filled stars showing submitted rating */}
        <div className="my-6 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-8 w-8",
                star <= rating ? "text-amber-400" : "text-gray-200",
              )}
              fill={star <= rating ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          ))}
        </div>

        {isPositive ? (
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-800">
              {t("feedback.thankYouPositive")}
            </p>
            {googleReviewUrl && (
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg",
                  "bg-blue-600 px-6 py-3 text-base font-medium text-white",
                  "transition-colors hover:bg-blue-700",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t("feedback.shareOnGoogle")}
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-800">
              {t("feedback.thankYouNegative")}
            </p>
          </div>
        )}

        <PoweredBy />
      </Card>
    );
  }

  // -- Main form --
  return (
    <Card className="mx-auto w-full max-w-md p-8">
      <RestaurantHeader
        logoUrl={logoUrl}
        restaurantName={restaurantName}
      />

      <h1 className="mt-4 text-center text-xl font-semibold text-gray-800">
        {t("feedback.title")}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Star rating */}
        <div className="space-y-2">
          <label className="block text-center text-sm font-medium text-gray-600">
            {t("feedback.ratingLabel")}
          </label>
          <StarRating
            value={rating}
            onChange={(r) => {
              setRating(r);
              setRatingError(false);
            }}
          />
          {ratingError && (
            <p className="text-center text-sm text-red-500" role="alert">
              {t("feedback.selectRating")}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-1.5">
          <label
            htmlFor="feedback-comment"
            className="block text-sm font-medium text-gray-600"
          >
            {t("feedback.commentLabel")}
          </label>
          <Textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={2000}
            className="resize-none"
          />
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="feedback-name"
            className="block text-sm font-medium text-gray-600"
          >
            {t("feedback.nameLabel")}
          </label>
          <Input
            id="feedback-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={submitMutation.isLoading}
        >
          {submitMutation.isLoading
            ? t("feedback.submitting")
            : t("feedback.submit")}
        </Button>

        {submitMutation.isError && (
          <p className="text-center text-sm text-red-500" role="alert">
            {submitMutation.error.message}
          </p>
        )}
      </form>

      <PoweredBy />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RestaurantHeader({
  logoUrl,
  restaurantName,
}: {
  logoUrl: string | null;
  restaurantName: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={restaurantName}
          width={72}
          height={72}
          className="rounded-full object-cover"
        />
      )}
      <h2 className="text-lg font-semibold text-gray-700">{restaurantName}</h2>
    </div>
  );
}

function PoweredBy() {
  const { t: rawT } = useTranslation("common");
  const t = rawT as (key: string) => string;

  return (
    <p className="mt-6 text-center text-xs text-gray-400">
      {t("feedback.poweredBy")}
    </p>
  );
}
