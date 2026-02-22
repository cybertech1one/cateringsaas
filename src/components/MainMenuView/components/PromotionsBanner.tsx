"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Sparkles, Tag } from "lucide-react";
import { shimmerToBase64 } from "~/utils/shimmer";
import { type Promotion } from "./types";

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

export const PromotionsBanner = ({
  promotions,
  themed,
}: {
  promotions: Promotion[];
  themed: boolean;
}) => {
  const { t } = useTranslation();

  if (promotions.length === 0) return null;

  return (
    <section className="w-full px-5 pb-6 pt-3">
      {/* ---- Section Header ---- */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
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
          <Sparkles className="h-[18px] w-[18px] text-white" />
        </div>

        <h2
          className="text-[17px] font-extrabold leading-tight tracking-tight"
          style={
            themed
              ? { fontFamily: "var(--menu-heading-font)" }
              : { fontFamily: "'Plus Jakarta Sans', sans-serif", color: NEO.ink }
          }
        >
          {t("publicMenu.activeOffers")}
        </h2>
      </div>

      {/* ---- Horizontal Scroll Track ---- */}
      <div
        className="flex w-full gap-3.5 overflow-x-auto pb-2"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style>{`
          .neo-promo-track::-webkit-scrollbar { display: none; }
        `}</style>

        {promotions.map((promo, idx) => (
          <div
            key={promo.id}
            className="neo-promo-track group shrink-0 overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
              minWidth: "220px",
              maxWidth: "280px",
              borderRadius: "16px",
              scrollSnapAlign: "start",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              backgroundColor: themed
                ? "color-mix(in srgb, var(--menu-surface) 60%, transparent)"
                : "rgba(255, 255, 255, 0.60)",
              border: themed
                ? "1px solid var(--menu-border)"
                : "1px solid rgba(0,0,0,0.04)",
              boxShadow: themed
                ? "var(--menu-card-shadow)"
                : "0 4px 24px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
              transitionDelay: `${idx * 30}ms`,
            }}
          >
            {/* Image area */}
            {promo.imageUrl && (
              <div className="relative aspect-[2/1] w-full overflow-hidden">
                <Image
                  src={promo.imageUrl}
                  fill
                  alt={`${promo.title} promotion`}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="280px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={shimmerToBase64(280, 140)}
                />
                {/* Subtle gradient at bottom for blend */}
                <div
                  className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
                  style={{
                    background: themed
                      ? "linear-gradient(to top, color-mix(in srgb, var(--menu-surface) 60%, transparent), transparent)"
                      : "linear-gradient(to top, rgba(255,255,255,0.6), transparent)",
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="relative p-3.5">
              {/* Discount badge -- top-right (absolute against card content) */}
              {promo.discountPercent != null && promo.discountPercent > 0 && (
                <div
                  className="absolute -top-3 right-3 flex items-center rounded-full px-2.5 py-1"
                  style={{
                    background: themed
                      ? "var(--menu-accent)"
                      : `linear-gradient(135deg, ${NEO.coral}, ${NEO.coralEnd})`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <span
                    className="text-[11px] font-extrabold text-white"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    -{promo.discountPercent}%
                  </span>
                </div>
              )}

              {promo.discountAmount != null && promo.discountAmount > 0 && !promo.discountPercent && (
                <div
                  className="absolute -top-3 right-3 flex items-center rounded-full px-2.5 py-1"
                  style={{
                    background: themed
                      ? "var(--menu-accent)"
                      : `linear-gradient(135deg, ${NEO.coral}, ${NEO.coralEnd})`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <span
                    className="text-[11px] font-extrabold text-white"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    -{(promo.discountAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3
                className="line-clamp-2 text-[14px] font-bold leading-snug"
                style={
                  themed
                    ? { fontFamily: "var(--menu-heading-font)" }
                    : {
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: NEO.ink,
                      }
                }
              >
                {promo.title}
              </h3>

              {/* Description */}
              {promo.description && (
                <p
                  className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed"
                  style={
                    themed
                      ? { color: "var(--menu-muted)" }
                      : {
                          fontFamily: "'Outfit', sans-serif",
                          color: NEO.muted,
                        }
                  }
                >
                  {promo.description}
                </p>
              )}

              {/* Promotion type label */}
              <div className="mt-3 flex items-center gap-1.5">
                <Tag
                  className="h-3 w-3"
                  style={{
                    color: themed ? "var(--menu-muted)" : NEO.muted,
                    opacity: 0.6,
                  }}
                />
                <span
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    color: themed ? "var(--menu-muted)" : NEO.muted,
                    fontFamily: "'Outfit', sans-serif",
                    opacity: 0.6,
                  }}
                >
                  {promo.promotionType.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
