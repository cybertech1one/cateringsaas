/**
 * Theme CSS Engine
 *
 * Converts MenuTheme objects into CSS custom properties for real-time
 * theme application. This is the bridge between stored theme data
 * and visual rendering.
 */

import { type MenuTheme, DEFAULT_THEME } from "./types";

// ── CSS Variable Mapping ────────────────────────────────────

const FONT_SIZE_MAP = {
  small: { base: "13px", sm: "11px", lg: "16px", xl: "20px", "2xl": "24px" },
  medium: { base: "15px", sm: "13px", lg: "18px", xl: "22px", "2xl": "28px" },
  large: { base: "17px", sm: "14px", lg: "20px", xl: "26px", "2xl": "34px" },
} as const;

const BORDER_RADIUS_MAP = {
  none: "0px",
  small: "4px",
  medium: "8px",
  large: "16px",
  full: "9999px",
} as const;

const SPACING_MAP = {
  compact: { section: "16px", item: "8px", card: "12px" },
  comfortable: { section: "32px", item: "16px", card: "20px" },
  spacious: { section: "48px", item: "24px", card: "28px" },
} as const;

const CARD_STYLE_MAP = {
  flat: { shadow: "none", border: "none", bg: "transparent" },
  elevated: { shadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)", bg: "var(--menu-surface)" },
  bordered: { shadow: "none", border: "1px solid var(--menu-border)", bg: "var(--menu-surface)" },
  glass: { shadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(255,255,255,0.15)", bg: "rgba(255,255,255,0.08)" },
} as const;

// ── Hex to HSL Conversion ───────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);

  if (!rgb) return 0;
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

/** Check if a color is "dark" (text should be light on top of it) */
export function isDarkColor(hex: string): boolean {
  return luminance(hex) < 0.5;
}

// ── CSS Variable Generator ──────────────────────────────────

export function themeToCSS(theme: MenuTheme): Record<string, string> {
  const fontSize = FONT_SIZE_MAP[theme.fontSize];
  const borderRadius = BORDER_RADIUS_MAP[theme.borderRadius];
  const spacing = SPACING_MAP[theme.spacing];
  const card = CARD_STYLE_MAP[theme.cardStyle];

  const rgb = hexToRgb(theme.textColor);
  const borderColor = rgb
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`
    : "rgba(0,0,0,0.12)";

  const mutedRgb = hexToRgb(theme.textColor);
  const mutedColor = mutedRgb
    ? `rgba(${mutedRgb.r}, ${mutedRgb.g}, ${mutedRgb.b}, 0.55)`
    : "rgba(0,0,0,0.55)";

  return {
    // Colors
    "--menu-primary": theme.primaryColor,
    "--menu-secondary": theme.secondaryColor,
    "--menu-background": theme.backgroundColor,
    "--menu-surface": theme.surfaceColor,
    "--menu-text": theme.textColor,
    "--menu-accent": theme.accentColor,
    "--menu-border": borderColor,
    "--menu-muted": mutedColor,

    // Typography
    "--menu-heading-font": `"${theme.headingFont}", serif`,
    "--menu-body-font": `"${theme.bodyFont}", sans-serif`,
    "--menu-font-base": fontSize.base,
    "--menu-font-sm": fontSize.sm,
    "--menu-font-lg": fontSize.lg,
    "--menu-font-xl": fontSize.xl,
    "--menu-font-2xl": fontSize["2xl"],

    // Border Radius
    "--menu-radius": borderRadius,
    "--menu-radius-lg": borderRadius === "0px" ? "0px" : `calc(${borderRadius} * 1.5)`,

    // Spacing
    "--menu-spacing-section": spacing.section,
    "--menu-spacing-item": spacing.item,
    "--menu-spacing-card": spacing.card,

    // Card
    "--menu-card-shadow": card.shadow,
    "--menu-card-border": card.border,
    "--menu-card-bg": card.bg,
  };
}

/** Convert theme to a CSS string for <style> injection */
export function themeToCSSString(theme: MenuTheme): string {
  const vars = themeToCSS(theme);
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  let css = `.menu-themed {\n${declarations}\n}`;

  // Add sanitized custom CSS
  if (theme.customCss) {
    const sanitized = sanitizeCSS(theme.customCss);

    if (sanitized) {
      css += `\n\n/* Custom CSS */\n.menu-themed {\n  ${sanitized}\n}`;
    }
  }

  return css;
}

/** Sanitize user-provided CSS (no JS, no imports, no @rules except media) */
function sanitizeCSS(css: string): string {
  // Remove any <script> tags or JS expressions
  let cleaned = css.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove url() with javascript:
  cleaned = cleaned.replace(/url\s*\(\s*['"]?\s*javascript:/gi, "");
  // Remove expression()
  cleaned = cleaned.replace(/expression\s*\(/gi, "");
  // Remove @import
  cleaned = cleaned.replace(/@import\s+/gi, "");
  // Remove behavior:
  cleaned = cleaned.replace(/behavior\s*:/gi, "");
  // Remove -moz-binding
  cleaned = cleaned.replace(/-moz-binding\s*:/gi, "");

  // Limit length
  return cleaned.slice(0, 5000);
}

// ── Google Fonts URL Builder ────────────────────────────────

export function buildGoogleFontsUrl(theme: MenuTheme): string {
  const fonts = new Set([theme.headingFont, theme.bodyFont]);
  const families = Array.from(fonts)
    .map((font) => {
      const encoded = font.replace(/\s+/g, "+");

      return `family=${encoded}:wght@300;400;500;600;700;800`;
    })
    .join("&");

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ── Merge with defaults ─────────────────────────────────────

export function mergeWithDefaults(partial: Partial<MenuTheme>): MenuTheme {
  return { ...DEFAULT_THEME, ...partial };
}
