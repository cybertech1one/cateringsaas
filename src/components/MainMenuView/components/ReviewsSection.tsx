"use client";

import { useTranslation } from "react-i18next";
import { MessageSquare, Star } from "lucide-react";
import { cn } from "~/utils/cn";
import { type ReviewItem } from "./types";
import { ReviewCard } from "./ReviewCard";
import { ReviewSubmissionForm } from "./ReviewSubmissionForm";

// -- Neo Gastro palette (used when themed = false) -----------------------

const NEO = {
  ink: "#1A1B1E",
  coral: "#E8453C",
  coralEnd: "#D63B32",
  sage: "#F5F5F0",
  muted: "#6B7280",
  white: "#FFFFFF",
} as const;

// -- Star helpers --------------------------------------------------------

function getInactiveStarClass(themed: boolean): string {
  return themed ? "text-gray-300" : "text-gray-200";
}

function starClass(isFilled: boolean, themed: boolean): string {
  if (isFilled) {
    return "fill-amber-400 text-amber-400";
  }

  return getInactiveStarClass(themed);
}

// -- Component -----------------------------------------------------------

export interface ReviewsSectionProps {
  reviews: ReviewItem[];
  averageRating: number;
  reviewCount: number;
  menuId: string;
  onReviewSubmitted: () => void;
  themed: boolean;
}

export const ReviewsSection = ({
  reviews,
  averageRating,
  reviewCount,
  menuId,
  onReviewSubmitted,
  themed,
}: ReviewsSectionProps) => {
  const { t } = useTranslation();

  return (
    <section
      className="px-5 py-8"
      style={{
        borderTop: themed
          ? "1px solid var(--menu-border)"
          : `1px solid ${NEO.sage}`,
      }}
    >
      {/* ---- Header with aggregate rating ---- */}
      <div className="mb-6 flex items-center gap-3">
        {/* Icon badge */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={
            themed
              ? {
                  background: `linear-gradient(135deg, var(--menu-primary), color-mix(in srgb, var(--menu-primary) 80%, #000))`,
                }
              : {
                  background: `linear-gradient(135deg, ${NEO.coral}, ${NEO.coralEnd})`,
                }
          }
        >
          <MessageSquare className="h-5 w-5 text-white" />
        </div>

        {/* Title + inline rating */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h2
              className="text-[17px] font-extrabold leading-tight tracking-tight"
              style={
                themed
                  ? { fontFamily: "var(--menu-heading-font)" }
                  : {
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: NEO.ink,
                    }
              }
            >
              {t("publicMenu.customerReviews")}
            </h2>

            {reviewCount > 0 && (
              <div className="flex items-center gap-1.5">
                {/* Inline stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3.5 w-3.5",
                        starClass(star <= Math.round(averageRating), themed),
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-[13px] font-bold tabular-nums"
                  style={
                    themed
                      ? undefined
                      : {
                          fontFamily: "'Outfit', sans-serif",
                          color: NEO.ink,
                        }
                  }
                >
                  {averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {reviewCount > 0 && (
            <span
              className="text-[12px]"
              style={
                themed
                  ? { color: "var(--menu-muted)" }
                  : {
                      fontFamily: "'Outfit', sans-serif",
                      color: NEO.muted,
                    }
              }
            >
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          )}
        </div>
      </div>

      {/* ---- Individual review cards ---- */}
      {reviews.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="overflow-hidden transition-all duration-200"
              style={{
                borderRadius: "16px",
                backgroundColor: themed
                  ? "var(--menu-surface)"
                  : NEO.sage,
                border: themed
                  ? "1px solid var(--menu-border)"
                  : "1px solid rgba(0,0,0,0.03)",
              }}
            >
              <div className="p-4">
                <ReviewCard review={review} themed={themed} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Review Submission Form ---- */}
      <div
        className="overflow-hidden"
        style={{
          borderRadius: "16px",
          backgroundColor: themed
            ? "var(--menu-surface)"
            : NEO.sage,
          border: themed
            ? "1px solid var(--menu-border)"
            : "1px solid rgba(0,0,0,0.03)",
        }}
      >
        <div className="p-4">
          <ReviewSubmissionForm
            menuId={menuId}
            onReviewSubmitted={onReviewSubmitted}
            themed={themed}
          />
        </div>
      </div>
    </section>
  );
};
