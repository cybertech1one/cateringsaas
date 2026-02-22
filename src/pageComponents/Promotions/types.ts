/**
 * Promotions types and utility functions.
 *
 * Defines the Promotion model shape, form validation schema,
 * and helper functions for formatting and status derivation.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Promotion type
// ---------------------------------------------------------------------------

export interface Promotion {
  id: string;
  restaurantId: string;
  title: string;
  description: string | null;
  promotionType: string;
  discountPercent: number | null;
  discountAmount: number | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  applicableDays: string[];
  startTime: string | null;
  endTime: string | null;
  menuId: string | null;
  dishId: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Form validation schema
// ---------------------------------------------------------------------------

const dayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : Number(val)),
  z.number().int().min(0).max(100).optional(),
);

const optionalAmount = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : Number(val)),
  z.number().int().min(0).optional(),
);

export const promotionFormSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    promotionType: z.enum([
      "daily_special",
      "happy_hour",
      "discount",
      "combo",
      "seasonal",
    ]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    isActive: z.boolean(),
    applicableDays: z.array(dayEnum),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    discountPercent: optionalNumber,
    discountAmount: optionalAmount,
    menuId: z.string().optional(),
    dishId: z.string().optional(),
    categoryId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      const hasPercent =
        data.discountPercent !== undefined && data.discountPercent > 0;
      const hasAmount =
        data.discountAmount !== undefined && data.discountAmount > 0;
      if (hasPercent && hasAmount) return false;
      return true;
    },
    {
      message:
        "Provide either a discount percentage or a discount amount, not both",
      path: ["discountPercent"],
    },
  );

export type PromotionFormValues = z.input<typeof promotionFormSchema>;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Capitalize the first letter of a string */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format a date as a short human-readable string (e.g., "Jun 15, 2025") */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Convert a date to YYYY-MM-DD format suitable for <input type="date"> */
export function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/** Derive a promotion's display status from its fields */
export function getPromotionStatus(
  promo: Pick<Promotion, "isActive" | "startDate" | "endDate">,
): "active" | "expired" | "scheduled" {
  if (!promo.isActive) return "expired";

  const now = new Date();
  const start = new Date(promo.startDate);

  if (start > now) return "scheduled";

  if (promo.endDate) {
    const end = new Date(promo.endDate);
    if (end < now) return "expired";
  }

  return "active";
}
