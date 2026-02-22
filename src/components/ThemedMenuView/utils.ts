import { type MenuTheme } from "~/lib/theme/types";

// ── Image style helpers ─────────────────────────────────────

export function getImageBorderRadius(
  imageStyle: MenuTheme["imageStyle"],
): string {
  switch (imageStyle) {
    case "rounded":
      return "12px";
    case "square":
      return "0px";
    case "circle":
      return "9999px";
    default:
      return "12px";
  }
}

export function getImageClass(imageStyle: MenuTheme["imageStyle"]): string {
  switch (imageStyle) {
    case "rounded":
      return "rounded-xl";
    case "square":
      return "rounded-none";
    case "circle":
      return "rounded-full";
    default:
      return "rounded-xl";
  }
}

// ── Price formatter ─────────────────────────────────────────

export function formatPrice(price: number): string {
  return (price / 100).toFixed(2);
}

export function getCurrencySymbol(currency?: string | null): string {
  switch (currency?.toUpperCase()) {
    case "MAD":
      return "\u062F.\u0645.";
    case "USD":
      return "$";
    case "EUR":
      return "\u20AC";
    case "GBP":
      return "\u00A3";
    default:
      return currency || "\u062F.\u0645.";
  }
}

// ── Color utility ───────────────────────────────────────────

export function hexToRgbString(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) return "0, 0, 0";

  return `${parseInt(result[1]!, 16)}, ${parseInt(result[2]!, 16)}, ${parseInt(result[3]!, 16)}`;
}
