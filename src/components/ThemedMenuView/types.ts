import { type parseDishes, type FullMenuOutput } from "~/utils/parseDishes";
import { type MenuTheme } from "~/lib/theme/types";

// ── Props for the top-level ThemedMenuView ──────────────────

export interface ThemedMenuViewProps {
  menu: FullMenuOutput;
  theme: MenuTheme;
  isPreview?: boolean;
}

// ── Derived dish types ──────────────────────────────────────

export type ParsedCategory = ReturnType<typeof parseDishes>[number];
export type ParsedDish = ParsedCategory["dishes"][number];

// ── Shared layout props ─────────────────────────────────────

export interface DishLayoutProps {
  dishes: ParsedDish[];
  theme: MenuTheme;
  languageId: string;
  menuName?: string;
  menuSlug?: string;
  currency?: string;
  isPreview?: boolean;
  onDishClick?: (dish: ParsedDish) => void;
}

// ── Constants ───────────────────────────────────────────────

export const NAVIGATION_HEIGHT = 44;
