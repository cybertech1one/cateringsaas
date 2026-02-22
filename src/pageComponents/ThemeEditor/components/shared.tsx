"use client";

import { type MenuTheme } from "~/lib/theme";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/utils/cn";
import { Check } from "lucide-react";

// ── Prop types shared across sections ────────────────────────

export interface ThemeSectionProps {
  theme: MenuTheme;
  onUpdate: <K extends keyof MenuTheme>(key: K, value: MenuTheme[K]) => void;
}

// ── Small UI primitives ──────────────────────────────────────

export function SectionHeader({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-primary/70">{icon}</span>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h3>
    </div>
  );
}

export function SectionDivider() {
  return <div className="my-6 h-px bg-border/40" />;
}

export function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer appearance-none overflow-hidden rounded-lg border border-border/50 bg-transparent p-0.5 shadow-sm transition-shadow hover:shadow-md [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
      />
      <div className="flex flex-1 items-center justify-between">
        <Label className="cursor-default text-sm font-medium">{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {value.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export function OptionCard<T extends string>({
  value,
  currentValue,
  onSelect,
  children,
  className,
}: {
  value: T;
  currentValue: T;
  onSelect: (v: T) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isSelected = value === currentValue;

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/50 bg-card/60 hover:border-border hover:bg-card",
        className,
      )}
    >
      {isSelected && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      {children}
    </button>
  );
}

export function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <Label className="cursor-default text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ── Translation key maps (shared across sections) ────────────

export const LAYOUT_KEYS = {
  classic: "themeEditor.layoutClassic",
  modern: "themeEditor.layoutModern",
  grid: "themeEditor.layoutGrid",
  magazine: "themeEditor.layoutMagazine",
  minimal: "themeEditor.layoutMinimal",
  elegant: "themeEditor.layoutElegant",
} as const satisfies Record<string, string>;

export const CARD_KEYS = {
  flat: "themeEditor.cardFlat",
  elevated: "themeEditor.cardElevated",
  bordered: "themeEditor.cardBordered",
  glass: "themeEditor.cardGlass",
} as const satisfies Record<string, string>;

export const RADIUS_KEYS = {
  none: "themeEditor.radiusNone",
  small: "themeEditor.radiusSmall",
  medium: "themeEditor.radiusMedium",
  large: "themeEditor.radiusLarge",
  full: "themeEditor.radiusFull",
} as const satisfies Record<string, string>;

export const SPACING_KEYS = {
  compact: "themeEditor.spacingCompact",
  comfortable: "themeEditor.spacingComfortable",
  spacious: "themeEditor.spacingSpacious",
} as const satisfies Record<string, string>;

export const HEADER_KEYS = {
  banner: "themeEditor.headerBanner",
  minimal: "themeEditor.headerMinimal",
  centered: "themeEditor.headerCentered",
  overlay: "themeEditor.headerOverlay",
} as const satisfies Record<string, string>;

export const IMAGE_KEYS = {
  rounded: "themeEditor.imageRounded",
  square: "themeEditor.imageSquare",
  circle: "themeEditor.imageCircle",
} as const satisfies Record<string, string>;

export const FONT_SIZE_KEYS = {
  small: "themeEditor.fontSizeSmall",
  medium: "themeEditor.fontSizeMedium",
  large: "themeEditor.fontSizeLarge",
} as const satisfies Record<string, string>;

export const FONT_CATEGORY_KEYS = {
  serif: "themeEditor.serif",
  "sans-serif": "themeEditor.sansSerif",
  display: "themeEditor.displayFont",
  handwriting: "themeEditor.handwriting",
} as const satisfies Record<string, string>;

// ── Visual preview helpers ───────────────────────────────────

export function LayoutIcon({ type }: { type: string }) {
  const base = "h-6 w-6 text-current";

  switch (type) {
    case "classic":
      return (
        <svg
          className={base}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      );
    case "modern":
      return (
        <svg
          className={base}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="7" height="18" rx="1" />
        </svg>
      );
    case "grid":
      return (
        <svg
          className={base}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "magazine":
      return (
        <svg
          className={base}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="7" rx="1" />
          <rect x="3" y="14" width="8" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "minimal":
      return (
        <svg
          className={base}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <line x1="6" y1="8" x2="18" y2="8" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
      );
    case "elegant":
      return (
        <svg
          className={base}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 17l3-9 5 4 2-7 2 7 5-4 3 9z" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      );
    default:
      return <div className={cn(base, "rounded border-2 border-current")} />;
  }
}

export function CardStylePreview({ style }: { style: string }) {
  const base = "h-5 w-8 rounded";

  switch (style) {
    case "flat":
      return <div className={cn(base, "bg-muted")} />;
    case "elevated":
      return <div className={cn(base, "bg-card shadow-md")} />;
    case "bordered":
      return <div className={cn(base, "border-2 border-border")} />;
    case "glass":
      return (
        <div
          className={cn(
            base,
            "border border-white/20 bg-white/30 backdrop-blur-sm dark:bg-white/10",
          )}
        />
      );
    default:
      return <div className={base} />;
  }
}

export function SpacingPreview({ spacing }: { spacing: string }) {
  const gapMap: Record<string, string> = {
    compact: "gap-0.5",
    comfortable: "gap-1",
    spacious: "gap-2",
  };
  const gap = gapMap[spacing] ?? "gap-1";

  return (
    <div className={cn("flex flex-col items-center", gap)}>
      <div className="h-1 w-6 rounded-full bg-current opacity-40" />
      <div className="h-1 w-6 rounded-full bg-current opacity-40" />
      <div className="h-1 w-6 rounded-full bg-current opacity-40" />
    </div>
  );
}

export function ImageStylePreview({ style }: { style: string }) {
  const base = "h-6 w-6 bg-muted border border-border/50";

  switch (style) {
    case "rounded":
      return <div className={cn(base, "rounded-lg")} />;
    case "square":
      return <div className={cn(base, "rounded-none")} />;
    case "circle":
      return <div className={cn(base, "rounded-full")} />;
    default:
      return <div className={base} />;
  }
}

const BORDER_RADIUS_CLASS: Record<string, string> = {
  none: "rounded-none",
  small: "rounded-sm",
  medium: "rounded-md",
  large: "rounded-xl",
  full: "rounded-2xl",
};

export function BorderRadiusPreview({ radius }: { radius: string }) {
  return (
    <div
      className={cn(
        "h-6 w-6 border-2 border-current",
        BORDER_RADIUS_CLASS[radius] ?? "rounded-md",
      )}
    />
  );
}

export function HeaderStylePreview({ style }: { style: string }) {
  switch (style) {
    case "banner":
      return (
        <div className="flex flex-col gap-0.5">
          <div className="h-3 w-10 rounded-sm bg-current opacity-20" />
          <div className="h-1.5 w-6 rounded-full bg-current opacity-40" />
        </div>
      );
    case "minimal":
      return (
        <div className="flex flex-col items-start gap-0.5">
          <div className="h-1.5 w-7 rounded-full bg-current opacity-40" />
          <div className="h-1 w-4 rounded-full bg-current opacity-20" />
        </div>
      );
    case "centered":
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="h-1.5 w-6 rounded-full bg-current opacity-40" />
          <div className="h-1 w-8 rounded-full bg-current opacity-20" />
        </div>
      );
    case "overlay":
      return (
        <div className="relative">
          <div className="h-5 w-10 rounded-sm bg-current opacity-15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-1.5 w-5 rounded-full bg-current opacity-60" />
          </div>
        </div>
      );
    default:
      return null;
  }
}

// ── Font grouping helper ─────────────────────────────────────

export function groupFontsByCategory(
  fonts: Array<{ family: string; category: string }>,
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const font of fonts) {
    if (!groups[font.category]) groups[font.category] = [];
    groups[font.category]!.push(font.family);
  }

  return groups;
}
