import { type FullMenuOutput } from "~/utils/parseDishes";

// ── Session ID management ──────────────────────────────────────

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "feastqr_session_id";
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

// ── Allergen color mapping ─────────────────────────────────────

export const ALLERGEN_COLORS: Record<string, string> = {
  gluten: "bg-amber-500",
  crustaceans: "bg-red-500",
  eggs: "bg-yellow-400",
  fish: "bg-blue-500",
  peanuts: "bg-orange-600",
  soybeans: "bg-green-600",
  dairy: "bg-sky-400",
  nuts: "bg-amber-700",
  celery: "bg-green-500",
  mustard: "bg-yellow-600",
  sesame: "bg-stone-500",
  sulphites: "bg-purple-500",
  lupin: "bg-violet-500",
  molluscs: "bg-teal-500",
};

// ── Shared types ───────────────────────────────────────────────

// The tRPC return type uses `string` for enum fields like fontSize, layoutStyle, etc.
// We accept a partial theme shape and cast it to MenuTheme when using the CSS engine.
export type ThemeLike = Record<string, unknown>;

export interface AllergenInfo {
  id: string;
  name: string;
  icon: string | null;
  type: string | null;
  severity: string | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  promotionType: string;
  discountPercent: number | null;
  discountAmount: number | null;
  imageUrl: string | null;
}

export interface ReviewItem {
  id: string;
  customerName: string | null;
  rating: number;
  comment: string | null;
  response: string | null;
  respondedAt: Date | null;
  createdAt: Date;
}

// ── Navigation constant ────────────────────────────────────────

export const NAVIGATION_HEIGHT = 40;

// ── Reusable category type from FullMenuOutput ─────────────────

export type MenuCategory = FullMenuOutput["categories"][number];
