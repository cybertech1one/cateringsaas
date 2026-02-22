/**
 * Server-side subscription tier enforcement.
 *
 * Checks whether the current user's usage of a given resource (menu, dish,
 * or category) is within their subscription tier limits.
 *
 * Rules:
 *  - In development or test mode (NODE_ENV=development|test), all limits are bypassed.
 *  - Active subscription (status in active/cancelled/on_trial/past_due with
 *    valid endsAt) grants Pro-tier (unlimited).
 *  - Otherwise, free-tier limits apply.
 */

import { type PrismaClient } from "@prisma/client";
import { TIER_LIMITS, type TierResource } from "~/constants/tiers";
import { logger } from "~/server/logger";

export interface TierCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  tier: "free" | "pro";
}

/**
 * Determine whether a user has an active subscription.
 *
 * Mirrors the logic from `checkIfSubscribed` in
 * `src/shared/hooks/useUserSubscription.ts` but runs server-side and
 * also considers the `endsAt` timestamp.
 */
async function isSubscribed(
  db: PrismaClient,
  userId: string,
): Promise<boolean> {
  const subscription = await db.subscriptions.findFirst({
    where: { profileId: userId },
    select: { status: true, endsAt: true },
  });

  if (!subscription) return false;

  const validStatuses = ["active", "cancelled", "on_trial", "past_due"];

  if (!validStatuses.includes(subscription.status)) return false;

  // If endsAt is set and in the past, the subscription has expired.
  if (subscription.endsAt && subscription.endsAt < new Date()) return false;

  return true;
}

/**
 * Check whether the user is allowed to create one more of the given resource.
 *
 * @param db       - Prisma client instance
 * @param userId   - The authenticated user's UUID
 * @param resource - The resource type being created
 * @param menuId   - Required when resource is "dish" or "category"
 */
export async function checkTierLimit(
  db: PrismaClient,
  userId: string,
  resource: TierResource,
  menuId?: string,
): Promise<TierCheckResult> {
  // Development and test bypass: always allow
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return { allowed: true, current: 0, limit: Infinity, tier: "pro" };
  }

  const subscribed = await isSubscribed(db, userId);

  if (subscribed) {
    return { allowed: true, current: 0, limit: Infinity, tier: "pro" };
  }

  // Free tier - count current usage and compare to limits
  const limits = TIER_LIMITS.free;

  switch (resource) {
    case "menu": {
      const currentMenus = await db.menus.count({
        where: { userId },
      });

      logger.info(
        `Tier check: user ${userId} has ${currentMenus}/${limits.maxMenus} menus`,
        "tierCheck",
      );

      return {
        allowed: currentMenus < limits.maxMenus,
        current: currentMenus,
        limit: limits.maxMenus,
        tier: "free",
      };
    }

    case "dish": {
      if (!menuId) {
        logger.warn("checkTierLimit called for dish without menuId", undefined, "tierCheck");

        return { allowed: false, current: 0, limit: limits.maxDishesPerMenu, tier: "free" };
      }

      const currentDishes = await db.dishes.count({
        where: { menuId },
      });

      logger.info(
        `Tier check: menu ${menuId} has ${currentDishes}/${limits.maxDishesPerMenu} dishes`,
        "tierCheck",
      );

      return {
        allowed: currentDishes < limits.maxDishesPerMenu,
        current: currentDishes,
        limit: limits.maxDishesPerMenu,
        tier: "free",
      };
    }

    case "category": {
      if (!menuId) {
        logger.warn("checkTierLimit called for category without menuId", undefined, "tierCheck");

        return { allowed: false, current: 0, limit: limits.maxCategories, tier: "free" };
      }

      const currentCategories = await db.categories.count({
        where: { menuId },
      });

      logger.info(
        `Tier check: menu ${menuId} has ${currentCategories}/${limits.maxCategories} categories`,
        "tierCheck",
      );

      return {
        allowed: currentCategories < limits.maxCategories,
        current: currentCategories,
        limit: limits.maxCategories,
        tier: "free",
      };
    }
  }
}
