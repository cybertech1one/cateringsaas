import { z } from "zod";

// ── Shared types for the Promotions feature ──────────────────

export type PromotionType =
  | "daily_special"
  | "happy_hour"
  | "discount"
  | "combo"
  | "seasonal";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type FilterStatus = "all" | "active" | "scheduled" | "expired";

export type Promotion = {
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
};

export type Menu = {
  id: string;
  name: string;
};

// ── Constants ──────────────────────────────────────────────────

export const DAYS_OF_WEEK: { value: DayOfWeek; i18nKey: string }[] = [
  { value: "monday", i18nKey: "promotions.dayMon" },
  { value: "tuesday", i18nKey: "promotions.dayTue" },
  { value: "wednesday", i18nKey: "promotions.dayWed" },
  { value: "thursday", i18nKey: "promotions.dayThu" },
  { value: "friday", i18nKey: "promotions.dayFri" },
  { value: "saturday", i18nKey: "promotions.daySat" },
  { value: "sunday", i18nKey: "promotions.daySun" },
];

export const PROMOTION_TYPES: { value: PromotionType; i18nKey: string }[] = [
  { value: "daily_special", i18nKey: "promotions.dailySpecial" },
  { value: "happy_hour", i18nKey: "promotions.happyHour" },
  { value: "discount", i18nKey: "promotions.discount" },
  { value: "combo", i18nKey: "promotions.combo" },
  { value: "seasonal", i18nKey: "promotions.seasonal" },
];

export const PROMOTION_TYPE_STYLES: Record<
  PromotionType,
  { bg: string; text: string; i18nKey: string }
> = {
  daily_special: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    i18nKey: "promotions.dailySpecial",
  },
  happy_hour: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    i18nKey: "promotions.happyHour",
  },
  discount: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    i18nKey: "promotions.discount",
  },
  combo: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    i18nKey: "promotions.combo",
  },
  seasonal: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    i18nKey: "promotions.seasonal",
  },
};

// ── Helpers ────────────────────────────────────────────────────

export function getPromotionStatus(
  promo: Promotion,
): "active" | "scheduled" | "expired" {
  const now = new Date();

  if (!promo.isActive) return "expired";
  if (new Date(promo.startDate) > now) return "scheduled";
  if (promo.endDate && new Date(promo.endDate) < now) return "expired";

  return "active";
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toDateInputValue(date: Date | string): string {
  const d = new Date(date);

  return d.toISOString().split("T")[0] ?? "";
}

// ── Validation Schema ────────────────────────────────────────

export const promotionFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(1000).optional(),
    promotionType: z.enum([
      "daily_special",
      "happy_hour",
      "discount",
      "combo",
      "seasonal",
    ]),
    discountPercent: z.coerce
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .or(z.literal("")),
    discountAmount: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .or(z.literal("")),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    applicableDays: z.array(
      z.enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ]),
    ),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    menuId: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      // At least one of discountPercent or discountAmount should be provided,
      // but not both. If neither is provided, that is also fine.
      const hasPercent =
        data.discountPercent !== undefined &&
        data.discountPercent !== "" &&
        data.discountPercent > 0;
      const hasAmount =
        data.discountAmount !== undefined &&
        data.discountAmount !== "" &&
        data.discountAmount > 0;

      if (hasPercent && hasAmount) return false;

      return true;
    },
    {
      message: "Provide either a discount percentage or a fixed amount, not both",
      path: ["discountPercent"],
    },
  )
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
  );

export type PromotionFormValues = z.input<typeof promotionFormSchema>;
