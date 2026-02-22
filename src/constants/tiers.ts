/**
 * Subscription tier limits for FeastQR.
 *
 * Free-tier users are capped on menus, dishes-per-menu, and categories-per-menu.
 * Pro (subscribed) users have no limits.
 *
 * In development mode (NODE_ENV=development), all limits are bypassed so that
 * local testing is never blocked by subscription state.
 */

export const TIER_LIMITS = {
  free: {
    maxMenus: 1,
    maxDishesPerMenu: 15,
    maxCategories: 5,
  },
  pro: {
    maxMenus: Infinity,
    maxDishesPerMenu: Infinity,
    maxCategories: Infinity,
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;
export type TierLimits = (typeof TIER_LIMITS)[TierName];
export type TierResource = "menu" | "dish" | "category";
