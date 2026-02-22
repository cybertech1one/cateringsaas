"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Camera, ExternalLink, Stamp, Type } from "lucide-react";
import { cn } from "~/utils/cn";
import { type ThemeSectionProps, SectionHeader } from "./shared";

// ── Brand Color Palettes ────────────────────────────────────

interface BrandPalette {
  key: string;
  primary: string;
  text: string;
  background: string;
}

const BRAND_PALETTES: BrandPalette[] = [
  {
    key: "paletteWarmMoroccan",
    primary: "#C17B4A",
    text: "#2D2319",
    background: "#FBF8F4",
  },
  {
    key: "paletteFreshModern",
    primary: "#16A34A",
    text: "#1A1B1E",
    background: "#FFFFFF",
  },
  {
    key: "paletteRoyalBlue",
    primary: "#2563EB",
    text: "#0F172A",
    background: "#F8FAFC",
  },
  {
    key: "paletteBoldRed",
    primary: "#DC2626",
    text: "#1C1917",
    background: "#FFFBEB",
  },
];

// ── Font Pairing Presets ────────────────────────────────────

interface FontPairing {
  key: string;
  heading: string;
  body: string;
}

const FONT_PAIRINGS: FontPairing[] = [
  { key: "fontPairingModern", heading: "Plus Jakarta Sans", body: "Outfit" },
  { key: "fontPairingClassic", heading: "Playfair Display", body: "Lato" },
  { key: "fontPairingElegant", heading: "Cormorant", body: "Raleway" },
];

// ── Header Style Logo Placement Map ─────────────────────────

const HEADER_LOGO_PLACEMENTS = [
  { header: "banner", logoPosition: "bottom-right", iconType: "badge" },
  { header: "minimal", logoPosition: "left", iconType: "inline" },
  { header: "centered", logoPosition: "center-top", iconType: "centered" },
  { header: "overlay", logoPosition: "center-top", iconType: "centered" },
] as const;

// ── Props ───────────────────────────────────────────────────

export interface BrandSectionProps extends ThemeSectionProps {
  logoUrl: string | null | undefined;
  slug: string;
}

// ── Component ───────────────────────────────────────────────

export function BrandSection({
  theme,
  onUpdate,
  logoUrl,
  slug,
}: BrandSectionProps) {
  const { t } = useTranslation();

  const applyPalette = (palette: BrandPalette) => {
    onUpdate("primaryColor", palette.primary);
    onUpdate("textColor", palette.text);
    onUpdate("backgroundColor", palette.background);
  };

  const applyFontPairing = (pairing: FontPairing) => {
    onUpdate("headingFont", pairing.heading);
    onUpdate("bodyFont", pairing.body);
  };

  return (
    <div className="space-y-6">
      {/* ── Logo Preview ──────────────────────────────────── */}
      <section>
        <SectionHeader icon={<Camera className="h-4 w-4" />}>
          {t("themeEditor.brandLogo")}
        </SectionHeader>

        <div className="flex items-center gap-4">
          {/* Logo circle / placeholder */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border/60 bg-muted/40">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Restaurant logo"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground/50" />
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              {t("themeEditor.brandLogoDescription")}
            </p>
            <Link
              href={`/menu/manage/${slug}/restaurant`}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {t("themeEditor.brandLogoGoToSettings")}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Logo Placement Guide ──────────────────────────── */}
      <section>
        <SectionHeader icon={<Stamp className="h-4 w-4" />}>
          {t("themeEditor.brandLogoPlacement")}
        </SectionHeader>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("themeEditor.brandLogoPlacementDescription")}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {HEADER_LOGO_PLACEMENTS.map((placement) => {
            const isActive = theme.headerStyle === placement.header;

            return (
              <div
                key={placement.header}
                className={cn(
                  "flex flex-col items-center rounded-lg border-2 p-3 transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border/40 bg-card/60",
                )}
              >
                {/* Mini visual diagram */}
                <LogoPlacementDiagram
                  type={placement.iconType}
                  isActive={isActive}
                />
                <span className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t(`themeEditor.header${capitalize(placement.header)}` as "themeEditor.headerBanner")}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Brand Color Quick-Set ─────────────────────────── */}
      <section>
        <SectionHeader icon={<span className="h-4 w-4 rounded-full bg-gradient-to-br from-amber-500 to-rose-500" />}>
          {t("themeEditor.brandColors")}
        </SectionHeader>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("themeEditor.brandColorsDescription")}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {BRAND_PALETTES.map((palette) => {
            const isActive =
              theme.primaryColor.toLowerCase() === palette.primary.toLowerCase() &&
              theme.textColor.toLowerCase() === palette.text.toLowerCase() &&
              theme.backgroundColor.toLowerCase() === palette.background.toLowerCase();

            return (
              <button
                key={palette.key}
                type="button"
                onClick={() => applyPalette(palette)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg border-2 p-2.5 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/40 bg-card/60 hover:border-border hover:bg-card",
                )}
              >
                {/* Color swatch trio */}
                <div className="flex -space-x-1.5">
                  <span
                    className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: palette.text }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: palette.background }}
                  />
                </div>
                <span className="text-xs font-medium leading-tight">
                  {t(`themeEditor.${palette.key}` as "themeEditor.paletteWarmMoroccan")}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Font Pairing Suggestions ──────────────────────── */}
      <section>
        <SectionHeader icon={<Type className="h-4 w-4" />}>
          {t("themeEditor.brandFonts")}
        </SectionHeader>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("themeEditor.brandFontsDescription")}
        </p>

        <div className="space-y-2">
          {FONT_PAIRINGS.map((pairing) => {
            const isActive =
              theme.headingFont === pairing.heading &&
              theme.bodyFont === pairing.body;

            return (
              <button
                key={pairing.key}
                type="button"
                onClick={() => applyFontPairing(pairing)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/40 bg-card/60 hover:border-border hover:bg-card",
                )}
              >
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {t(`themeEditor.${pairing.key}` as "themeEditor.fontPairingModern")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pairing.heading} + {pairing.body}
                  </p>
                </div>
                {/* Font preview */}
                <div className="text-right">
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{ fontFamily: `"${pairing.heading}", sans-serif` }}
                  >
                    Aa
                  </p>
                  <p
                    className="text-[10px] text-muted-foreground"
                    style={{ fontFamily: `"${pairing.body}", sans-serif` }}
                  >
                    Aa Bb Cc
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ── Internal helpers ────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Small visual diagram showing where the logo appears for each header style. */
function LogoPlacementDiagram({
  type,
  isActive,
}: {
  type: "badge" | "inline" | "centered";
  isActive: boolean;
}) {
  const dotClass = cn(
    "rounded-full",
    isActive ? "bg-primary" : "bg-muted-foreground/40",
  );
  const barClass = cn(
    "rounded-full",
    isActive ? "bg-primary/30" : "bg-muted-foreground/20",
  );

  switch (type) {
    case "badge":
      // Banner: logo as badge in bottom-right of a wide bar
      return (
        <div className="relative h-10 w-full">
          <div className={cn("h-6 w-full rounded-sm", barClass)} />
          <div
            className={cn("absolute bottom-0 right-2 h-4 w-4", dotClass)}
          />
        </div>
      );
    case "inline":
      // Minimal: logo inline left of text bar
      return (
        <div className="flex h-10 w-full items-center gap-1.5">
          <div className={cn("h-5 w-5 shrink-0", dotClass)} />
          <div className="flex flex-1 flex-col gap-1">
            <div className={cn("h-1.5 w-3/4", barClass)} />
            <div className={cn("h-1 w-1/2", barClass)} />
          </div>
        </div>
      );
    case "centered":
      // Centered / Overlay: logo centered above text
      return (
        <div className="flex h-10 w-full flex-col items-center justify-center gap-1">
          <div className={cn("h-4 w-4", dotClass)} />
          <div className={cn("h-1.5 w-2/3", barClass)} />
        </div>
      );
  }
}
