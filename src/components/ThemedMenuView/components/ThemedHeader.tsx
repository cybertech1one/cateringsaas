"use client";

import { useState, memo } from "react";
import Image from "next/image";

import { shimmerToBase64 } from "~/utils/shimmer";
import { type FullMenuOutput } from "~/utils/parseDishes";
import { type MenuTheme } from "~/lib/theme/types";

// ── Header Keyframe Styles ─────────────────────────────────────

export function ThemedHeaderStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes menuHeaderFadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes menuHeaderLineGrow {
  from {
    width: 0;
  }
  to {
    width: 60px;
  }
}
`,
      }}
    />
  );
}

// ── Header Component ────────────────────────────────────────

export const ThemedHeader = memo(function ThemedHeader({
  menu,
  theme,
}: {
  menu: FullMenuOutput;
  theme: MenuTheme;
}) {
  const hasBackgroundImage = !!menu.backgroundImageUrl;

  return (
    <>
      <ThemedHeaderStyles />
      {(() => {
        switch (theme.headerStyle) {
          case "banner":
            return (
              <BannerHeader
                menu={menu}
                hasBackgroundImage={hasBackgroundImage}
              />
            );

          case "minimal":
            return <MinimalHeader menu={menu} />;

          case "centered":
            return (
              <CenteredHeader
                menu={menu}
                hasBackgroundImage={hasBackgroundImage}
              />
            );

          case "overlay":
            return (
              <OverlayHeader
                menu={menu}
                hasBackgroundImage={hasBackgroundImage}
              />
            );

          default:
            return null;
        }
      })()}
    </>
  );
});

// ── Location Pin SVG ───────────────────────────────────────────

function LocationPinIcon({
  color,
  size = 14,
}: {
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ── Address Line ───────────────────────────────────────────────

function AddressLine({
  menu,
  color,
  iconColor,
}: {
  menu: FullMenuOutput;
  color: string;
  iconColor?: string;
}) {
  const addressParts = [menu.address, menu.city].filter(Boolean);

  if (addressParts.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        marginTop: "8px",
        animation: "menuHeaderFadeUp 0.5s ease-out 0.15s both",
      }}
    >
      <LocationPinIcon color={iconColor ?? color} size={14} />
      <p
        style={{
          fontFamily: "var(--menu-body-font)",
          fontSize: "var(--menu-font-sm)",
          color,
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {addressParts.join(", ")}
      </p>
    </div>
  );
}

// ── Banner Header ───────────────────────────────────────────────

function BannerHeader({
  menu,
  hasBackgroundImage,
}: {
  menu: FullMenuOutput;
  hasBackgroundImage: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <header
      role="banner"
      style={{
        position: "relative",
        width: "100%",
        minHeight: hasBackgroundImage ? "220px" : "120px",
        overflow: "hidden",
      }}
    >
      {hasBackgroundImage && (
        <>
          <Image
            src={menu.backgroundImageUrl!}
            fill
            alt={`${menu.name} restaurant banner`}
            className="object-cover"
            sizes="100vw"
            priority
            placeholder="blur"
            blurDataURL={shimmerToBase64(768, 240)}
            onLoad={() => setImageLoaded(true)}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.5s ease-out",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.75) 100%)",
            }}
          />
        </>
      )}
      {!hasBackgroundImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, var(--menu-primary) 0%, color-mix(in srgb, var(--menu-primary) 50%, var(--menu-background)) 100%)`,
          }}
        />
      )}
      <div
        style={{
          position: hasBackgroundImage ? "absolute" : "relative",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "28px 20px",
          animation: "menuHeaderFadeUp 0.5s ease-out both",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-2xl)",
            fontWeight: 700,
            color: hasBackgroundImage ? "#FFFFFF" : "var(--menu-background)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {menu.name}
        </h1>
        <AddressLine
          menu={menu}
          color={
            hasBackgroundImage ? "rgba(255,255,255,0.85)" : "color-mix(in srgb, var(--menu-background) 80%, transparent)"
          }
          iconColor={
            hasBackgroundImage ? "rgba(255,255,255,0.7)" : "color-mix(in srgb, var(--menu-background) 70%, transparent)"
          }
        />
      </div>
      {menu.logoImageUrl && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            zIndex: 10,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "menuHeaderFadeUp 0.5s ease-out 0.2s both",
          }}
        >
          <Image
            src={menu.logoImageUrl}
            fill
            alt={`${menu.name} logo`}
            className="object-cover"
            sizes="48px"
            placeholder="blur"
            blurDataURL={shimmerToBase64(48, 48)}
          />
        </div>
      )}
    </header>
  );
}

// ── Minimal Header ──────────────────────────────────────────────

function MinimalHeader({ menu }: { menu: FullMenuOutput }) {
  const thumbnailUrl = menu.logoImageUrl || menu.backgroundImageUrl;

  return (
    <header
      role="banner"
      style={{
        padding: "32px 20px 16px",
        maxWidth: "720px",
        marginLeft: "auto",
        marginRight: "auto",
        animation: "menuHeaderFadeUp 0.5s ease-out both",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {thumbnailUrl && (
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              overflow: "hidden",
              position: "relative",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Image
              src={thumbnailUrl}
              fill
              alt={`${menu.name} restaurant logo`}
              className="object-cover"
              sizes="52px"
              placeholder="blur"
              blurDataURL={shimmerToBase64(52, 52)}
            />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--menu-heading-font)",
              fontSize: "var(--menu-font-xl)",
              fontWeight: 700,
              color: "var(--menu-text)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {menu.name}
          </h1>
          <AddressLine menu={menu} color="var(--menu-muted)" />
        </div>
      </div>
    </header>
  );
}

// ── Centered Header ─────────────────────────────────────────────

function CenteredHeader({
  menu,
  hasBackgroundImage,
}: {
  menu: FullMenuOutput;
  hasBackgroundImage: boolean;
}) {
  return (
    <header
      role="banner"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        minHeight: hasBackgroundImage ? "200px" : "140px",
      }}
    >
      {hasBackgroundImage && (
        <>
          <Image
            src={menu.backgroundImageUrl!}
            fill
            alt={`${menu.name} restaurant background`}
            className="object-cover"
            style={{ opacity: 0.15 }}
            sizes="100vw"
            priority
            placeholder="blur"
            blurDataURL={shimmerToBase64(768, 200)}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "var(--menu-background)",
              opacity: 0.85,
            }}
          />
        </>
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
          minHeight: hasBackgroundImage ? "200px" : "140px",
          animation: "menuHeaderFadeUp 0.5s ease-out both",
        }}
      >
        {menu.logoImageUrl && (
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              overflow: "hidden",
              position: "relative",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "2px solid var(--menu-primary)",
              animation: "menuHeaderFadeUp 0.5s ease-out 0.1s both",
            }}
          >
            <Image
              src={menu.logoImageUrl}
              fill
              alt={`${menu.name} logo`}
              className="object-cover"
              sizes="64px"
              placeholder="blur"
              blurDataURL={shimmerToBase64(64, 64)}
            />
          </div>
        )}
        {!menu.logoImageUrl && (
          <div
            style={{
              width: "60px",
              height: "2px",
              backgroundColor: "var(--menu-primary)",
              marginBottom: "20px",
              animation: "menuHeaderLineGrow 0.6s ease-out 0.2s both",
            }}
          />
        )}
        <h1
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "var(--menu-font-2xl)",
            fontWeight: 700,
            color: "var(--menu-text)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {menu.name}
        </h1>
        {(menu.address || menu.city) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              marginTop: "8px",
              animation: "menuHeaderFadeUp 0.5s ease-out 0.15s both",
            }}
          >
            <LocationPinIcon color="var(--menu-muted)" size={13} />
            <p
              style={{
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-sm)",
                color: "var(--menu-muted)",
                margin: 0,
                letterSpacing: "0.5px",
              }}
            >
              {[menu.address, menu.city].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        <div
          style={{
            width: "60px",
            height: "2px",
            backgroundColor: "var(--menu-primary)",
            marginTop: "20px",
            animation: "menuHeaderLineGrow 0.6s ease-out 0.3s both",
          }}
        />
      </div>
    </header>
  );
}

// ── Overlay Header ──────────────────────────────────────────────

function OverlayHeader({
  menu,
  hasBackgroundImage,
}: {
  menu: FullMenuOutput;
  hasBackgroundImage: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <header
      role="banner"
      style={{
        position: "relative",
        width: "100%",
        minHeight: hasBackgroundImage ? "260px" : "160px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {hasBackgroundImage && (
        <>
          <Image
            src={menu.backgroundImageUrl!}
            fill
            alt={`${menu.name} restaurant background`}
            className="object-cover"
            sizes="100vw"
            priority
            placeholder="blur"
            blurDataURL={shimmerToBase64(768, 260)}
            onLoad={() => setImageLoaded(true)}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.4s ease-out",
              transform: "scale(1.02)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          />
        </>
      )}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          padding: "40px 20px",
          animation: "menuHeaderFadeUp 0.5s ease-out both",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--menu-heading-font)",
            fontSize: "calc(var(--menu-font-2xl) * 1.2)",
            fontWeight: 800,
            color: hasBackgroundImage ? "#FFFFFF" : "var(--menu-text)",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
          }}
        >
          {menu.name}
        </h1>
        {(menu.address || menu.city) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "14px",
              animation: "menuHeaderFadeUp 0.5s ease-out 0.15s both",
            }}
          >
            <LocationPinIcon
              color={
                hasBackgroundImage
                  ? "rgba(255,255,255,0.6)"
                  : "var(--menu-muted)"
              }
              size={14}
            />
            <p
              style={{
                fontFamily: "var(--menu-body-font)",
                fontSize: "var(--menu-font-base)",
                color: hasBackgroundImage
                  ? "rgba(255,255,255,0.8)"
                  : "var(--menu-muted)",
                margin: 0,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {[menu.address, menu.city].filter(Boolean).join("  |  ")}
            </p>
          </div>
        )}
      </div>
      {menu.logoImageUrl && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            overflow: "hidden",
            border: hasBackgroundImage
              ? "2px solid rgba(255,255,255,0.9)"
              : "2px solid var(--menu-primary)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "menuHeaderFadeUp 0.5s ease-out 0.25s both",
          }}
        >
          <Image
            src={menu.logoImageUrl}
            fill
            alt={`${menu.name} logo`}
            className="object-cover"
            sizes="48px"
            placeholder="blur"
            blurDataURL={shimmerToBase64(48, 48)}
          />
        </div>
      )}
    </header>
  );
}
