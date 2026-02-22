"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { cn } from "~/utils/cn";
import { shimmerToBase64 } from "~/utils/shimmer";
import { type ThemeLike } from "./types";

// ── Neo Gastro Palette ────────────────────────────────────────
const PALETTE = {
  ink: "#1A1B1E",
  coral: "#E8453C",
  sage: "#F5F5F0",
  muted: "#6B7280",
  white: "#FFFFFF",
} as const;

export interface MenuHeaderProps {
  name: string;
  address: string | null;
  city: string | null;
  backgroundImageUrl: string | null;
  logoImageUrl: string | null;
  themed: boolean;
  theme: ThemeLike | null | undefined;
}

export const MenuHeader = ({
  name,
  address,
  city,
  backgroundImageUrl,
  logoImageUrl,
  themed,
  theme,
}: MenuHeaderProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const addressParts = [address, city].filter(Boolean);
  const hasImage = !!backgroundImageUrl;

  return (
    <header className="relative w-full overflow-hidden">
      {/* Hero container: full-bleed with constrained height */}
      <div
        className={cn(
          "relative w-full min-h-[240px] max-h-[300px] overflow-hidden",
        )}
        style={
          !hasImage && themed
            ? {
                background: `linear-gradient(135deg, var(--menu-primary) 0%, color-mix(in srgb, var(--menu-primary) 40%, var(--menu-background)) 100%)`,
                minHeight: 240,
                maxHeight: 300,
              }
            : undefined
        }
      >
        {/* ── Background Image Path ──────────────────────────── */}
        {hasImage && (
          <>
            <Image
              src={backgroundImageUrl!}
              fill
              alt={`${name} restaurant`}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              placeholder="blur"
              blurDataURL={shimmerToBase64(768, 300)}
              onLoad={() => setImageLoaded(true)}
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                transform: imageLoaded ? "scale(1)" : "scale(1.05)",
              }}
            />
            {/* Multi-layer gradient overlay: transparent top, heavy bottom */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: [
                  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.7) 100%)",
                ].join(", "),
              }}
            />
            {/* Subtle vignette for depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)",
              }}
            />
          </>
        )}

        {/* ── No-Image Geometric Pattern Background ──────────── */}
        {!hasImage && !themed && (
          <>
            {/* Gradient mesh base */}
            <div
              className="absolute inset-0"
              style={{
                background: [
                  `radial-gradient(ellipse at 20% 50%, ${PALETTE.coral}18 0%, transparent 50%)`,
                  `radial-gradient(ellipse at 80% 20%, ${PALETTE.sage} 0%, transparent 40%)`,
                  `radial-gradient(ellipse at 50% 80%, ${PALETTE.coral}0C 0%, transparent 50%)`,
                  `linear-gradient(135deg, ${PALETTE.ink} 0%, #2A2B30 40%, #1F2023 100%)`,
                ].join(", "),
              }}
            />
            {/* Geometric dot pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle, ${PALETTE.white} 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
              }}
            />
            {/* Diagonal accent line */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                background: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 60px,
                  ${PALETTE.coral}33 60px,
                  ${PALETTE.coral}33 61px
                )`,
              }}
            />
          </>
        )}

        {/* ── No-Image Themed Pattern ────────────────────────── */}
        {!hasImage && themed && (
          <>
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--menu-text) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </>
        )}

        {/* ── Restaurant Info Overlay ────────────────────────── */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-10",
            "flex flex-col justify-end",
            "px-5 pb-5 pt-16",
          )}
          style={{
            animation:
              "neoGastroFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both",
          }}
        >
          {/* Restaurant Name */}
          <h1
            className={cn(
              "font-extrabold leading-tight tracking-tight",
              "text-2xl sm:text-3xl",
              (hasImage || !themed) && "text-white",
            )}
            style={
              themed
                ? {
                    fontFamily: "var(--menu-heading-font)",
                    color: hasImage ? PALETTE.white : "var(--menu-background)",
                    fontWeight: 800,
                  }
                : {
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }
            }
          >
            {name}
          </h1>

          {/* Address Pill with frosted glass */}
          {addressParts.length > 0 && (
            <div
              className="mt-2.5 flex items-center"
              style={{
                animation:
                  "neoGastroFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
              }}
            >
              <div
                className={cn(
                  "inline-flex items-center gap-1.5",
                  "rounded-full px-3 py-1.5",
                )}
                style={
                  themed
                    ? {
                        backgroundColor: "color-mix(in srgb, var(--menu-background) 20%, transparent)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid color-mix(in srgb, var(--menu-background) 15%, transparent)",
                      }
                    : {
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                      }
                }
              >
                <MapPin
                  className="h-3 w-3 flex-shrink-0"
                  style={{
                    color: hasImage || !themed
                      ? "rgba(255, 255, 255, 0.8)"
                      : "var(--menu-background)",
                  }}
                  strokeWidth={2.5}
                />
                <p
                  className={cn(
                    "text-xs font-medium tracking-wide",
                    (hasImage || !themed) && "text-white/85",
                  )}
                  style={
                    themed && !hasImage
                      ? {
                          color:
                            "color-mix(in srgb, var(--menu-background) 85%, transparent)",
                        }
                      : {
                          fontSize: "12px",
                          lineHeight: "1",
                        }
                  }
                >
                  {addressParts.join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Logo Overlay (bottom-right) ────────────────────── */}
        {(() => {
          const logoSrc =
            logoImageUrl ||
            (theme &&
              typeof theme === "object" &&
              "logoUrl" in theme &&
              typeof theme.logoUrl === "string"
              ? theme.logoUrl
              : null);

          if (!logoSrc) return null;

          return (
            <div
              className={cn(
                "absolute bottom-4 right-4 z-10",
                "h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden",
                "border-2 border-white/90",
                "shadow-lg",
              )}
              style={{
                animation:
                  "neoGastroFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both",
              }}
            >
              <Image
                src={logoSrc}
                fill
                alt={`${name} logo`}
                className="object-cover"
                sizes="(max-width: 640px) 48px, 56px"
                placeholder="blur"
                blurDataURL={shimmerToBase64(56, 56)}
              />
            </div>
          );
        })()}
      </div>

      {/* Animation keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes neoGastroFadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`,
        }}
      />
    </header>
  );
};
