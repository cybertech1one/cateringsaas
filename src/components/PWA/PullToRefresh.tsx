"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/utils/cn";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * Pull-to-refresh wrapper for mobile menu pages.
 * Wraps children and adds touch-based pull-to-refresh behavior.
 * Only activates when scrolled to the top of the page.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Only enable pull-to-refresh at the top of the page
      if (window.scrollY > 0 || isRefreshing) return;

      const touch = e.touches[0];

      if (touch) {
        touchStartY.current = touch.clientY;
        setIsPulling(true);
      }
    },
    [isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const touch = e.touches[0];

      if (!touch) return;

      const diff = touch.clientY - touchStartY.current;

      // Only pull down, not up
      if (diff <= 0) {
        setPullDistance(0);

        return;
      }

      // Apply resistance - the further you pull, the harder it gets
      const resistance = 0.4;
      const adjustedDiff = Math.min(diff * resistance, MAX_PULL);

      setPullDistance(adjustedDiff);

      // Prevent default scroll when pulling
      if (adjustedDiff > 5 && window.scrollY <= 0) {
        e.preventDefault();
      }
    },
    [isPulling, isRefreshing],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.5);

      // Perform refresh
      window.location.reload();
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // Use passive: false for touchmove to allow preventDefault
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 5;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="absolute left-0 right-0 top-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ height: `${pullDistance}px` }}
          aria-hidden="true"
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-primary/10 transition-transform",
              isRefreshing && "animate-spin",
            )}
            style={{
              width: 36,
              height: 36,
              transform: `rotate(${progress * 360}deg)`,
            }}
          >
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              {isRefreshing ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: showIndicator
            ? `translateY(${pullDistance}px)`
            : undefined,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
