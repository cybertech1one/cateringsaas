import { type Prisma } from "@prisma/client";
import { db } from "~/server/db";

/**
 * Audit logger for tracking mutations across the application.
 * Logs user actions with before/after data for compliance and debugging.
 */
export async function auditLog({
  userId,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  ipAddress,
  userAgent,
}: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.appAuditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        oldData: oldData ?? undefined,
        newData: newData ?? undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch {
    // Audit logging should never block the main operation
  }
}

/**
 * Common audit actions
 */
export const AuditAction = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  PUBLISH: "publish",
  UNPUBLISH: "unpublish",
  LOGIN: "login",
  INVITE: "invite",
  ROLE_CHANGE: "role_change",
  SETTINGS_UPDATE: "settings_update",
  AI_GENERATE: "ai_generate",
  REVIEW_MODERATE: "review_moderate",
  PROMOTION_CREATE: "promotion_create",
  MENU_LINK: "menu_link",
} as const;

/**
 * Common entity types
 */
export const AuditEntity = {
  MENU: "menu",
  DISH: "dish",
  CATEGORY: "category",
  RESTAURANT: "restaurant",
  LOCATION: "location",
  STAFF: "staff",
  ORDER: "order",
  REVIEW: "review",
  PROMOTION: "promotion",
  THEME: "theme",
  PROFILE: "profile",
  TABLE_ZONE: "table_zone",
  AI_USAGE: "ai_usage",
} as const;
