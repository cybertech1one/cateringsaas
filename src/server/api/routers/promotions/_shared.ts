import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@prisma/client";

// ── Enums ───────────────────────────────────────────────────

export const promotionTypeEnum = z.enum([
  "daily_special",
  "happy_hour",
  "discount",
  "combo",
  "seasonal",
]);

export const allergenTypeEnum = z.enum([
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soybeans",
  "dairy",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
]);

export const dayOfWeekEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

// ── Validation Schemas ──────────────────────────────────────

export const timeStringRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createPromotionInput = z.object({
  restaurantId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  promotionType: promotionTypeEnum,
  discountPercent: z.number().int().min(0).max(100).optional(),
  discountAmount: z.number().int().min(0).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
  applicableDays: z.array(dayOfWeekEnum).default([]),
  startTime: z
    .string()
    .regex(timeStringRegex, "Time must be HH:MM format")
    .optional(),
  endTime: z
    .string()
    .regex(timeStringRegex, "Time must be HH:MM format")
    .optional(),
  menuId: z.string().uuid().optional(),
  dishId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
});

export const updatePromotionInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  promotionType: promotionTypeEnum.optional(),
  discountPercent: z.number().int().min(0).max(100).optional().nullable(),
  discountAmount: z.number().int().min(0).optional().nullable(),
  startDate: z.date().optional(),
  endDate: z.date().optional().nullable(),
  isActive: z.boolean().optional(),
  applicableDays: z.array(dayOfWeekEnum).optional(),
  startTime: z
    .string()
    .regex(timeStringRegex, "Time must be HH:MM format")
    .optional()
    .nullable(),
  endTime: z
    .string()
    .regex(timeStringRegex, "Time must be HH:MM format")
    .optional()
    .nullable(),
  menuId: z.string().uuid().optional().nullable(),
  dishId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

// ── Helpers ─────────────────────────────────────────────────

export async function verifyRestaurantOwnership(
  db: PrismaClient,
  menuId: string,
  userId: string,
) {
  const menu = await db.menus.findFirst({
    where: { id: menuId, userId },
    select: { id: true },
  });

  if (!menu) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not authorized to access this restaurant's data",
    });
  }

  return menu;
}
