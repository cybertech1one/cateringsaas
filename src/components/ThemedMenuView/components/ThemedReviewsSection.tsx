"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";

// ── Types ────────────────────────────────────────────────────

interface ThemedReviewsSectionProps {
  menuId: string;
  menuSlug: string;
}

// ── Constants ────────────────────────────────────────────────

const REVIEWS_PER_PAGE = 5;

// ── Star SVG Helpers ─────────────────────────────────────────

function StarIcon({
  filled,
  half,
  size = 18,
  interactive = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  filled: boolean;
  half?: boolean;
  size?: number;
  interactive?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const fillColor = filled
    ? "var(--menu-primary)"
    : "var(--menu-border)";
  const halfId = `halfStar-${size}-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={half ? `url(#${halfId})` : fillColor}
      stroke={filled || half ? "var(--menu-primary)" : "var(--menu-border)"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        cursor: interactive ? "pointer" : "default",
        transition: "transform 0.15s ease",
        flexShrink: 0,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {half && (
        <defs>
          <linearGradient id={halfId}>
            <stop offset="50%" stopColor="var(--menu-primary)" />
            <stop offset="50%" stopColor="var(--menu-border)" />
          </linearGradient>
        </defs>
      )}
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/**
 * Render a row of stars for a given rating (supports half-star display).
 */
function StarRating({ rating, size = 18 }: { rating: number; size?: number }) {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<StarIcon key={i} filled size={size} />);
    } else if (rating >= i - 0.5) {
      stars.push(<StarIcon key={i} filled={false} half size={size} />);
    } else {
      stars.push(<StarIcon key={i} filled={false} size={size} />);
    }
  }

  return (
    <div
      style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {stars}
    </div>
  );
}

/**
 * Interactive star selector for the review form.
 */
function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
      role="radiogroup"
      aria-labelledby="star-rating-label"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star <= value}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange(star);
            }
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <StarIcon
            filled={displayValue >= star}
            size={28}
            interactive
          />
        </button>
      ))}
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────

function ReviewsSkeleton() {
  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header skeleton */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "140px",
            height: "24px",
            backgroundColor: "var(--menu-border)",
            borderRadius: "6px",
            opacity: 0.4,
            animation: "reviewPulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: "var(--menu-surface)",
            borderRadius: "var(--menu-radius, 8px)",
            border: "1px solid var(--menu-border)",
            padding: "16px",
            marginBottom: "12px",
            animation: "reviewPulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "14px",
                backgroundColor: "var(--menu-border)",
                borderRadius: "4px",
                opacity: 0.4,
              }}
            />
            <div
              style={{
                width: "80px",
                height: "14px",
                backgroundColor: "var(--menu-border)",
                borderRadius: "4px",
                opacity: 0.3,
              }}
            />
          </div>
          <div
            style={{
              width: "90px",
              height: "14px",
              backgroundColor: "var(--menu-border)",
              borderRadius: "4px",
              opacity: 0.3,
              marginBottom: "10px",
            }}
          />
          <div
            style={{
              width: "100%",
              height: "12px",
              backgroundColor: "var(--menu-border)",
              borderRadius: "4px",
              opacity: 0.25,
              marginBottom: "6px",
            }}
          />
          <div
            style={{
              width: "70%",
              height: "12px",
              backgroundColor: "var(--menu-border)",
              borderRadius: "4px",
              opacity: 0.2,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Keyframe Styles ──────────────────────────────────────────

export function ThemedReviewsSectionStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes reviewPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes reviewSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`,
      }}
    />
  );
}

// ── Date Formatter ───────────────────────────────────────────

function formatReviewDate(
  date: Date | string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("publicMenu.dateToday");
  if (diffDays === 1) return t("publicMenu.dateYesterday");
  if (diffDays < 7) return t("publicMenu.dateDaysAgo", { count: diffDays });
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);

    return t("publicMenu.dateWeeksAgo", { count: weeks });
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);

    return t("publicMenu.dateMonthsAgo", { count: months });
  }

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Review Card ──────────────────────────────────────────────

interface ReviewData {
  id: string;
  customerName: string | null;
  rating: number;
  comment: string | null;
  response: string | null;
  respondedAt: Date | string | null;
  createdAt: Date | string;
}

const ReviewCard = memo(function ReviewCard({
  review,
  index,
  t,
}: {
  review: ReviewData;
  index: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--menu-surface)",
        borderRadius: "var(--menu-radius, 8px)",
        border: "1px solid var(--menu-border)",
        padding: "16px",
        marginBottom: "12px",
        animation: "reviewSlideIn 0.3s ease-out forwards",
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
      }}
    >
      {/* Top row: name + date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {/* Avatar circle */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "var(--menu-primary)",
              color: "var(--menu-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-sm)",
              fontWeight: 700,
              flexShrink: 0,
              textTransform: "uppercase",
            }}
          >
            {(review.customerName ?? "A").charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--menu-heading-font)",
                fontSize: "var(--menu-font-base)",
                fontWeight: 600,
                color: "var(--menu-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {review.customerName || t("publicMenu.anonymous")}
            </div>
            <StarRating rating={review.rating} size={14} />
          </div>
        </div>
        <span
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {formatReviewDate(review.createdAt, t)}
        </span>
      </div>

      {/* Comment */}
      {review.comment && (
        <p
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-base)",
            color: "var(--menu-text)",
            lineHeight: 1.6,
            margin: "8px 0 0",
            wordBreak: "break-word",
          }}
        >
          {review.comment}
        </p>
      )}

      {/* Owner response */}
      {review.response && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "var(--menu-background)",
            borderRadius: "calc(var(--menu-radius, 8px) * 0.75)",
            borderLeft: "3px solid var(--menu-primary)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-sm)",
              fontWeight: 600,
              color: "var(--menu-primary)",
              marginBottom: "4px",
            }}
          >
            {t("publicMenu.ownerResponse")}
          </div>
          <p
            style={{
              fontFamily: "var(--menu-body-font)",
              fontSize: "var(--menu-font-sm)",
              color: "var(--menu-text)",
              lineHeight: 1.5,
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {review.response}
          </p>
        </div>
      )}
    </div>
  );
});

// ── Summary Header ───────────────────────────────────────────

function ReviewsSummary({
  averageRating,
  reviewCount,
  t,
}: {
  averageRating: number;
  reviewCount: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (reviewCount === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >
      {/* Big rating number */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "36px",
            fontWeight: 700,
            color: "var(--menu-text)",
            lineHeight: 1,
          }}
        >
          {averageRating.toFixed(1)}
        </span>
        <span
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
          }}
        >
          / 5
        </span>
      </div>

      {/* Stars + count */}
      <div>
        <StarRating rating={averageRating} size={20} />
        <div
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            marginTop: "2px",
          }}
        >
          {t("publicMenu.reviewCount", { count: reviewCount })}
        </div>
      </div>
    </div>
  );
}

// ── Review Form ──────────────────────────────────────────────

function ReviewForm({
  menuId,
  onSuccess,
  t,
}: {
  menuId: string;
  onSuccess: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState("");

  const submitMutation = api.reviews.submitReview.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setRating(0);
      setComment("");
      setValidationError("");
      onSuccess();
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError("");

      if (rating === 0) {
        setValidationError(t("publicMenu.ratingRequired"));

        return;
      }

      submitMutation.mutate({
        menuId,
        customerName: name.trim() || undefined,
        rating,
        comment: comment.trim() || undefined,
      });
    },
    [menuId, name, rating, comment, submitMutation, t],
  );

  if (submitted) {
    return (
      <div
        style={{
          backgroundColor: "var(--menu-surface)",
          borderRadius: "var(--menu-radius, 8px)",
          border: "1px solid var(--menu-border)",
          padding: "24px",
          textAlign: "center",
          animation: "reviewSlideIn 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--menu-primary)",
            color: "var(--menu-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h4
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-lg)",
            fontWeight: 600,
            color: "var(--menu-text)",
            margin: "0 0 6px",
          }}
        >
          {t("publicMenu.thankYou")}
        </h4>
        <p
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {t("publicMenu.reviewSubmittedDescription")}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          style={{
            marginTop: "16px",
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-primary)",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          {t("publicMenu.writeAnother")}
        </button>
      </div>
    );
  }

  const inputBaseStyle: React.CSSProperties = {
    fontFamily: "var(--menu-body-font)",
    fontSize: "var(--menu-font-base)",
    color: "var(--menu-text)",
    backgroundColor: "var(--menu-background)",
    border: "1px solid var(--menu-border)",
    borderRadius: "calc(var(--menu-radius, 8px) * 0.75)",
    padding: "10px 12px",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: "var(--menu-surface)",
        borderRadius: "var(--menu-radius, 8px)",
        border: "1px solid var(--menu-border)",
        padding: "20px",
      }}
    >
      <h4
        style={{
          fontFamily: "var(--menu-heading-font)",
          fontSize: "var(--menu-font-lg)",
          fontWeight: 600,
          color: "var(--menu-text)",
          margin: "0 0 16px",
        }}
      >
        {t("publicMenu.leaveReview")}
      </h4>

      {/* Star rating selector */}
      <div style={{ marginBottom: "16px" }}>
        <label
          id="star-rating-label"
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            display: "block",
            marginBottom: "6px",
            fontWeight: 500,
          }}
        >
          {t("publicMenu.yourRating")}
        </label>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      {/* Name input */}
      <div style={{ marginBottom: "12px" }}>
        <label
          htmlFor="review-name"
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            display: "block",
            marginBottom: "6px",
            fontWeight: 500,
          }}
        >
          {t("publicMenu.yourName")}
        </label>
        <input
          id="review-name"
          type="text"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("publicMenu.yourNamePlaceholder")}
          style={inputBaseStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--menu-primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--menu-border)";
          }}
        />
      </div>

      {/* Comment textarea */}
      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="review-comment"
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "var(--menu-muted)",
            display: "block",
            marginBottom: "6px",
            fontWeight: 500,
          }}
        >
          {t("publicMenu.yourComment")}
        </label>
        <textarea
          id="review-comment"
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("publicMenu.yourCommentPlaceholder")}
          rows={3}
          style={{
            ...inputBaseStyle,
            resize: "vertical",
            minHeight: "80px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--menu-primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--menu-border)";
          }}
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <p
          role="alert"
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "#dc2626",
            margin: "0 0 12px",
          }}
        >
          {validationError}
        </p>
      )}

      {/* API error */}
      {submitMutation.error && (
        <p
          role="alert"
          style={{
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-sm)",
            color: "#dc2626",
            margin: "0 0 12px",
          }}
        >
          {submitMutation.error.message}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitMutation.isLoading}
        style={{
          fontFamily: "var(--menu-heading-font)",
          fontSize: "var(--menu-font-base)",
          fontWeight: 600,
          color: "var(--menu-surface)",
          backgroundColor: "var(--menu-primary)",
          border: "none",
          borderRadius: "calc(var(--menu-radius, 8px) * 0.75)",
          padding: "12px 24px",
          cursor: submitMutation.isLoading ? "not-allowed" : "pointer",
          opacity: submitMutation.isLoading ? 0.6 : 1,
          transition: "opacity 0.2s, transform 0.1s",
          width: "100%",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {submitMutation.isLoading ? t("publicMenu.submitting") : t("publicMenu.submitReview")}
      </button>
    </form>
  );
}

// ── Main Section ─────────────────────────────────────────────

export const ThemedReviewsSection = memo(function ThemedReviewsSection({
  menuId,
  menuSlug,
}: ThemedReviewsSectionProps) {
  const { t: rawT } = useTranslation("common");
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const [displayCount, setDisplayCount] = useState(REVIEWS_PER_PAGE);

  const { data, isLoading, refetch } = api.reviews.getPublicReviews.useQuery(
    {
      menuId,
      limit: 50,
      offset: 0,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    },
  );

  const handleShowMore = useCallback(() => {
    setDisplayCount((prev) => prev + REVIEWS_PER_PAGE);
  }, []);

  const handleReviewSuccess = useCallback(() => {
    void refetch();
  }, [refetch]);

  const visibleReviews = useMemo(() => {
    if (!data?.reviews) return [];

    return data.reviews.slice(0, displayCount);
  }, [data?.reviews, displayCount]);

  const hasMore = data?.reviews ? data.reviews.length > displayCount : false;

  return (
    <section
      aria-label={`Reviews for menu ${menuSlug}`}
      style={{
        padding: "0 20px",
        maxWidth: "720px",
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        marginTop: "var(--menu-spacing-section)",
      }}
    >
      <ThemedReviewsSectionStyles />

      {/* Section heading */}
      <h3
        style={{
          fontFamily: "var(--menu-heading-font)",
          fontSize: "var(--menu-font-xl)",
          fontWeight: 700,
          color: "var(--menu-text)",
          margin: "0 0 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Chat bubble icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--menu-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {t("publicMenu.customerReviews")}
      </h3>

      {/* Loading state */}
      {isLoading && <ReviewsSkeleton />}

      {/* Loaded with reviews */}
      {!isLoading && data && data.reviewCount > 0 && (
        <>
          {/* Summary */}
          <ReviewsSummary
            averageRating={data.averageRating}
            reviewCount={data.reviewCount}
            t={t}
          />

          {/* Review cards */}
          <div>
            {visibleReviews.map((review, index) => (
              <ReviewCard key={review.id} review={review} index={index} t={t} />
            ))}
          </div>

          {/* Show More button */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleShowMore}
                style={{
                  fontFamily: "var(--menu-body-font)",
                  fontSize: "var(--menu-font-base)",
                  fontWeight: 500,
                  color: "var(--menu-primary)",
                  backgroundColor: "transparent",
                  border: "1px solid var(--menu-primary)",
                  borderRadius: "var(--menu-radius, 8px)",
                  padding: "10px 28px",
                  cursor: "pointer",
                  transition: "background-color 0.15s, color 0.15s",
                  WebkitTapHighlightColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--menu-primary)";
                  e.currentTarget.style.color = "var(--menu-surface)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--menu-primary)";
                }}
              >
                {t("publicMenu.showMoreReviews")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state (no reviews yet) */}
      {!isLoading && data && data.reviewCount === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "24px 16px",
            color: "var(--menu-muted)",
            fontFamily: "var(--menu-body-font)",
            fontSize: "var(--menu-font-base)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "36px",
              marginBottom: "10px",
              opacity: 0.5,
            }}
            aria-hidden="true"
          >
            {/* Star icon as text for empty state */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--menu-border)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "inline-block" }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <p style={{ margin: "0 0 4px", fontWeight: 500 }}>{t("publicMenu.noReviewsYet")}</p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--menu-font-sm)",
              lineHeight: 1.5,
            }}
          >
            {t("publicMenu.beFirstReview")}
          </p>
        </div>
      )}

      {/* Review Form (always shown after reviews) */}
      {!isLoading && (
        <div style={{ marginTop: "20px", marginBottom: "8px" }}>
          <ReviewForm menuId={menuId} onSuccess={handleReviewSuccess} t={t} />
        </div>
      )}
    </section>
  );
});
