import { type PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared constants & enums
// ---------------------------------------------------------------------------

export const EVENT_TYPES = [
  "menu_view",
  "dish_click",
  "category_click",
  "qr_scan",
  "order_placed",
  "review_submitted",
  "favorite_added",
  "share_click",
  "search_used",
] as const;

export const eventTypeEnum = z.enum(EVENT_TYPES);

export const periodEnum = z.enum(["today", "7d", "30d", "90d", "all"]);
export type Period = z.infer<typeof periodEnum>;

export const granularityEnum = z.enum(["hour", "day", "week", "month"]);
export type Granularity = z.infer<typeof granularityEnum>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Compute the start date for a given period filter.
 * Returns null for "all" (no lower bound).
 */
export function getStartDate(period: Period): Date | null {
  const now = new Date();

  switch (period) {
    case "today": {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    case "7d": {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    case "30d": {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    case "90d": {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    case "all": {
      return null;
    }
  }
}

/**
 * Build the WHERE clause fragment for time filtering.
 * Uses parameterised values via Prisma.sql to prevent SQL injection.
 */
export function dateFilter(
  startDate: Date | null,
  menuId: string,
): Prisma.Sql {
  if (startDate) {
    return Prisma.sql`WHERE menu_id = ${menuId}::uuid AND created_at >= ${startDate}::timestamptz`;
  }

  return Prisma.sql`WHERE menu_id = ${menuId}::uuid`;
}

/**
 * Hash an IP address with SHA-256 + a static salt for privacy.
 * The salt prevents rainbow-table lookups while remaining deterministic
 * per deployment so unique-visitor counts stay accurate.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "feastqr-analytics-salt";

  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Classify a user-agent string into a device category.
 */
export function classifyDevice(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  const lower = ua.toLowerCase();

  if (/tablet|ipad|playbook|silk/i.test(lower)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(lower)) return "mobile";

  return "desktop";
}

/**
 * Verify the caller owns the menu. Throws FORBIDDEN on mismatch.
 */
export async function verifyMenuOwnership(
  db: PrismaClient,
  menuId: string,
  userId: string,
): Promise<void> {
  const menu = await db.menus.findFirst({
    where: { id: menuId },
    select: { userId: true },
  });

  if (!menu) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Menu not found",
    });
  }

  if (menu.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }
}

// ---------------------------------------------------------------------------
// Raw-query result types (for $queryRaw)
// ---------------------------------------------------------------------------

export interface CountRow {
  count: bigint;
}

export interface DateCountRow {
  date: Date;
  count: bigint;
}

export interface DishRow {
  dish_name: string;
  clicks: bigint;
  orders: bigint;
}

export interface ReferrerRow {
  referrer: string;
  count: bigint;
}

export interface DeviceRow {
  user_agent: string | null;
}

export interface HourRow {
  hour: number;
  count: bigint;
}

export interface GranularRow {
  bucket: Date;
  count: bigint;
}

export interface FunnelRow {
  event_type: string;
  count: bigint;
}

export interface LocationRow {
  location_id: string | null;
  total_events: bigint;
  views: bigint;
  clicks: bigint;
  orders: bigint;
}
