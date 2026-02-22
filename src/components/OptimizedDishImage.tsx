"use client";

import Image from "next/image";
import { useState, useCallback, type CSSProperties } from "react";
import { cn } from "~/utils/cn";
import { shimmerToBase64 } from "~/utils/shimmer";

const FALLBACK_PLACEHOLDER = shimmerToBase64(200, 200);

export interface OptimizedDishImageProps {
  /** Image source URL. If null/undefined, a placeholder is displayed. */
  src: string | null | undefined;
  /** Accessible alt text describing the image content. */
  alt: string;
  /** Fixed width in pixels (for non-fill mode). */
  width?: number;
  /** Fixed height in pixels (for non-fill mode). */
  height?: number;
  /** Use Next.js Image fill mode (parent must be position: relative). */
  fill?: boolean;
  /**
   * Responsive sizes hint for the browser.
   * Defaults to the pixel width if width is set, otherwise "100vw".
   */
  sizes?: string;
  /** Load this image eagerly (above-the-fold). Defaults to false (lazy). */
  priority?: boolean;
  /** Additional CSS classes for the image element. */
  className?: string;
  /** Inline styles for the image element. */
  style?: CSSProperties;
  /** Border radius override. Uses design system default (rounded-xl) if not set. */
  borderRadius?: string;
  /** Show a grayscale filter (e.g. for sold-out dishes). */
  grayscale?: boolean;
}

/**
 * OptimizedDishImage wraps Next.js Image with:
 * - Shimmer blur placeholder while loading
 * - Graceful fallback when the image fails to load or src is missing
 * - Proper sizes attribute for responsive behavior
 * - Consistent rounded corners matching the design system
 */
export function OptimizedDishImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  className,
  style,
  borderRadius,
  grayscale = false,
}: OptimizedDishImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Determine the sizes attribute
  const computedSizes = sizes ?? (width ? `${width}px` : "100vw");

  // If no src or the image errored, show a neutral placeholder
  if (!src || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          !borderRadius && "rounded-xl",
          className,
        )}
        style={{
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
          borderRadius: borderRadius,
          ...style,
        }}
        role="img"
        aria-label={alt}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground/40"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
    );
  }

  const imageProps = fill
    ? { fill: true as const }
    : { width: width ?? 200, height: height ?? 200 };

  return (
    <Image
      src={src}
      alt={alt}
      {...imageProps}
      sizes={computedSizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={FALLBACK_PLACEHOLDER}
      loading={priority ? undefined : "lazy"}
      onError={handleError}
      className={cn(
        "object-cover",
        !borderRadius && "rounded-xl",
        grayscale && "grayscale",
        className,
      )}
      style={{
        borderRadius: borderRadius,
        ...style,
      }}
    />
  );
}
