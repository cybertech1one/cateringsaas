"use client";

import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  /** Speed in seconds for one full scroll. Default 40 */
  speed?: number;
  /** Additional className for the container */
  className?: string;
  /** Pause on hover. Default true */
  pauseOnHover?: boolean;
}

export const Marquee = ({
  children,
  speed = 40,
  className = "",
  pauseOnHover = true,
}: MarqueeProps) => {
  return (
    <div
      className={`overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className={`marquee-track ${pauseOnHover ? "[&:hover]:animation-play-state-paused" : ""}`}
        style={{
          animationDuration: `${speed}s`,
          ...(pauseOnHover ? {} : {}),
        }}
      >
        {/* Duplicate content for seamless loop */}
        <div className="flex shrink-0 items-center gap-8">{children}</div>
        <div className="flex shrink-0 items-center gap-8">{children}</div>
      </div>
    </div>
  );
};
