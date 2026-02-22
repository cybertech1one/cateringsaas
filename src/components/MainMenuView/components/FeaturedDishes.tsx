"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/utils/cn";
import { shimmerToBase64 } from "~/utils/shimmer";

// -- Types ---------------------------------------------------------------

interface FeaturedDish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pictureUrl: string | null;
  isFeatured: boolean | null;
  isSoldOut: boolean | null;
}

interface FeaturedDishesProps {
  dishes: FeaturedDish[];
  themed: boolean;
  currency: string;
}

// -- Helpers -------------------------------------------------------------

function formatPrice(price: number, currency: string): string {
  return `${(price / 100).toFixed(2)} ${currency}`;
}

// -- Neo Gastro palette (used when themed = false) -----------------------

const NEO = {
  ink: "#1A1B1E",
  coral: "#E8453C",
  coralEnd: "#D63B32",
  sage: "#F5F5F0",
  muted: "#6B7280",
  white: "#FFFFFF",
} as const;

// -- Main Component ------------------------------------------------------

export const FeaturedDishes = ({
  dishes,
  themed,
  currency,
}: FeaturedDishesProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Filter featured, non-sold-out
  const featured = dishes.filter((d) => d.isFeatured && !d.isSoldOut);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);

    return () => clearTimeout(timer);
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;

    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });

    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState, featured.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;

    if (!el) return;
    const amount = direction === "left" ? -200 : 200;

    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  if (featured.length === 0) return null;

  return (
    <section
      className="w-full px-5 pb-6 pt-3"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* ---- Section Header ---- */}
      <div className="mb-4 flex items-center gap-3">
        {/* Gradient Flame icon badge */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={
            themed
              ? {
                  background: `linear-gradient(135deg, var(--menu-accent), color-mix(in srgb, var(--menu-accent) 80%, #000))`,
                }
              : {
                  background: `linear-gradient(135deg, ${NEO.coral}, ${NEO.coralEnd})`,
                }
          }
        >
          <Flame className="h-[18px] w-[18px] text-white" />
        </div>

        <div className="flex flex-col">
          <h2
            className={cn(
              "text-[17px] font-extrabold leading-tight tracking-tight",
            )}
            style={
              themed
                ? { fontFamily: "var(--menu-heading-font)" }
                : { fontFamily: "'Plus Jakarta Sans', sans-serif", color: NEO.ink }
            }
          >
            {t("publicMenu.chefsSpecials")}
          </h2>
          <p
            className="text-[12px] leading-tight"
            style={
              themed
                ? { color: "var(--menu-muted)" }
                : { fontFamily: "'Outfit', sans-serif", color: NEO.muted }
            }
          >
            {t("publicMenu.chefsSpecialsSubtitle")}
          </p>
        </div>
      </div>

      {/* ---- Scrollable Carousel ---- */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className={cn(
              "absolute -left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 active:scale-95",
            )}
            style={
              themed
                ? {
                    backgroundColor: "color-mix(in srgb, var(--menu-surface) 80%, transparent)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: "var(--menu-border)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: "rgba(0,0,0,0.06)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }
            }
          >
            <ChevronLeft
              className="h-4 w-4"
              style={themed ? { color: "var(--menu-text)" } : { color: NEO.ink }}
            />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className={cn(
              "absolute -right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 active:scale-95",
            )}
            style={
              themed
                ? {
                    backgroundColor: "color-mix(in srgb, var(--menu-surface) 80%, transparent)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: "var(--menu-border)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: "rgba(0,0,0,0.06)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }
            }
          >
            <ChevronRight
              className="h-4 w-4"
              style={themed ? { color: "var(--menu-text)" } : { color: NEO.ink }}
            />
          </button>
        )}

        {/* Carousel track */}
        <div
          ref={scrollRef}
          className="flex w-full gap-3 overflow-x-auto pb-2"
          style={{
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <style>{`
            .neo-carousel::-webkit-scrollbar { display: none; }
          `}</style>

          {featured.map((dish, idx) => (
            <div
              key={dish.id}
              className="neo-carousel group shrink-0 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                width: "180px",
                minWidth: "180px",
                borderRadius: "16px",
                scrollSnapAlign: "start",
                boxShadow: themed
                  ? "var(--menu-card-shadow)"
                  : "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
                transitionDelay: `${idx * 40}ms`,
              }}
            >
              {/* Full-height image card */}
              <div className="relative" style={{ height: "240px" }}>
                {dish.pictureUrl ? (
                  <Image
                    src={dish.pictureUrl}
                    fill
                    alt={dish.name}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="180px"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={shimmerToBase64(180, 240)}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      backgroundColor: themed
                        ? "var(--menu-surface)"
                        : NEO.sage,
                    }}
                  >
                    <Flame
                      className="h-8 w-8"
                      style={{
                        color: themed ? "var(--menu-accent)" : NEO.coral,
                        opacity: 0.3,
                      }}
                    />
                  </div>
                )}

                {/* Gradient overlay at bottom for text legibility */}
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{
                    height: "60%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)",
                  }}
                />

                {/* Featured pill -- top-left */}
                <div
                  className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1"
                  style={{
                    background: themed
                      ? "var(--menu-accent)"
                      : `linear-gradient(135deg, ${NEO.coral}, ${NEO.coralEnd})`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <Flame className="h-2.5 w-2.5 text-white" />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {t("publicMenu.featured")}
                  </span>
                </div>

                {/* Name + price overlaid on image */}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h3
                    className="line-clamp-2 text-[14px] font-bold leading-snug text-white"
                    style={
                      themed
                        ? { fontFamily: "var(--menu-heading-font)" }
                        : { fontFamily: "'Plus Jakarta Sans', sans-serif" }
                    }
                  >
                    {dish.name}
                  </h3>
                  <p
                    className="mt-1 text-[13px] font-semibold text-white/90"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {formatPrice(dish.price, currency)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
