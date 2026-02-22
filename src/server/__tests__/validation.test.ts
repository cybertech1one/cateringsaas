import { describe, expect, it } from "vitest";
import { promotionFormSchema } from "~/pageComponents/Promotions/types";
import type { ZodIssue } from "zod";

/**
 * Integration tests for Zod validation schemas.
 * Exercises the promotionFormSchema with valid inputs, edge cases,
 * boundary values, and the two refinement rules (date ordering &
 * discount mutual-exclusion).
 */

// Helper: a minimal valid form payload
function validPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    title: "Summer BBQ Special",
    promotionType: "daily_special",
    startDate: "2025-06-01",
    applicableDays: ["monday", "friday"],
    isActive: true,
    ...overrides,
  };
}

describe("promotionFormSchema", () => {
  // ── Happy-path ──────────────────────────────────────────────

  describe("valid inputs", () => {
    it("should accept a minimal valid payload", () => {
      const result = promotionFormSchema.safeParse(validPayload());

      expect(result.success).toBe(true);
    });

    it("should accept a fully-populated payload", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({
          description: "Grilled dishes 20% off",
          discountPercent: 20,
          discountAmount: "",
          endDate: "2025-09-01",
          startTime: "11:00",
          endTime: "15:00",
          menuId: "abc-123",
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept all five promotion types", () => {
      const types = [
        "daily_special",
        "happy_hour",
        "discount",
        "combo",
        "seasonal",
      ] as const;

      for (const promotionType of types) {
        const result = promotionFormSchema.safeParse(
          validPayload({ promotionType }),
        );

        expect(result.success).toBe(true);
      }
    });

    it("should accept all seven days in applicableDays", () => {
      const allDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const result = promotionFormSchema.safeParse(
        validPayload({ applicableDays: allDays }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept an empty applicableDays array", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ applicableDays: [] }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept discountPercent alone", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 50 }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept discountAmount alone", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountAmount: 500 }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept neither discount field", () => {
      const result = promotionFormSchema.safeParse(validPayload());

      expect(result.success).toBe(true);
    });

    it("should coerce string numbers for discountPercent", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: "25" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept empty string as discountPercent", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: "" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept empty string as discountAmount", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountAmount: "" }),
      );

      expect(result.success).toBe(true);
    });
  });

  // ── Title validation ────────────────────────────────────────

  describe("title validation", () => {
    it("should reject an empty title", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ title: "" }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        const titleIssue = result.error.issues.find(
          (i: ZodIssue) => i.path[0] === "title",
        );

        expect(titleIssue).toBeDefined();
      }
    });

    it("should reject a title exceeding 200 characters", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ title: "A".repeat(201) }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept a title of exactly 200 characters", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ title: "A".repeat(200) }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept a single-character title", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ title: "X" }),
      );

      expect(result.success).toBe(true);
    });
  });

  // ── Description validation ──────────────────────────────────

  describe("description validation", () => {
    it("should accept a missing description", () => {
      const result = promotionFormSchema.safeParse(validPayload());

      expect(result.success).toBe(true);
    });

    it("should accept a description of exactly 1000 characters", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ description: "B".repeat(1000) }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject a description exceeding 1000 characters", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ description: "B".repeat(1001) }),
      );

      expect(result.success).toBe(false);
    });
  });

  // ── Discount mutual-exclusion refinement ────────────────────

  describe("discount mutual-exclusion refinement", () => {
    it("should reject when both discountPercent and discountAmount are positive", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 10, discountAmount: 500 }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.map((i: ZodIssue) => i.message).join(" ");

        expect(msg).toContain("not both");
      }
    });

    it("should allow percent=0 and amount>0 (zero is not a positive value)", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 0, discountAmount: 500 }),
      );

      expect(result.success).toBe(true);
    });

    it("should allow percent>0 and amount=0", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 30, discountAmount: 0 }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject discountPercent above 100", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 101 }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept discountPercent of exactly 100", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 100 }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept discountPercent of exactly 0", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 0 }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject negative discountPercent", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: -1 }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject negative discountAmount", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountAmount: -100 }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject non-integer discountPercent", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ discountPercent: 10.5 }),
      );

      expect(result.success).toBe(false);
    });
  });

  // ── Date refinement ─────────────────────────────────────────

  describe("date refinement (endDate > startDate)", () => {
    it("should reject when endDate equals startDate", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ startDate: "2025-06-01", endDate: "2025-06-01" }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.map((i: ZodIssue) => i.message).join(" ");

        expect(msg).toContain("End date must be after start date");
      }
    });

    it("should reject when endDate is before startDate", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ startDate: "2025-06-15", endDate: "2025-06-01" }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept when endDate is after startDate", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ startDate: "2025-06-01", endDate: "2025-06-02" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept when endDate is omitted", () => {
      const result = promotionFormSchema.safeParse(validPayload());

      expect(result.success).toBe(true);
    });

    it("should accept when endDate is empty string", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ endDate: "" }),
      );

      // Empty string is falsy, so the refinement condition `if (data.endDate && data.startDate)` is skipped
      expect(result.success).toBe(true);
    });
  });

  // ── startDate validation ────────────────────────────────────

  describe("startDate validation", () => {
    it("should reject an empty startDate", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ startDate: "" }),
      );

      expect(result.success).toBe(false);
    });
  });

  // ── promotionType validation ────────────────────────────────

  describe("promotionType validation", () => {
    it("should reject an invalid promotion type", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ promotionType: "invalid_type" }),
      );

      expect(result.success).toBe(false);
    });
  });

  // ── applicableDays validation ───────────────────────────────

  describe("applicableDays validation", () => {
    it("should reject invalid day names", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ applicableDays: ["notaday"] }),
      );

      expect(result.success).toBe(false);
    });
  });

  // ── isActive validation ─────────────────────────────────────

  describe("isActive validation", () => {
    it("should accept true", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ isActive: true }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept false", () => {
      const result = promotionFormSchema.safeParse(
        validPayload({ isActive: false }),
      );

      expect(result.success).toBe(true);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Orders Router Validation Tests
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// Replicate the order input schemas from orders.ts for validation testing
const orderItemInputSchema = z.object({
  dishId: z.string().uuid().optional(),
  dishVariantId: z.string().uuid().optional(),
  dishName: z.string().min(1).max(200),
  quantity: z.number().int().positive().max(99),
  unitPrice: z.number().int().nonnegative(),
  notes: z.string().max(500).optional(),
});

const createOrderInputSchema = z.object({
  menuId: z.string().uuid(),
  customerName: z.string().max(100).optional(),
  customerPhone: z
    .string()
    .max(20)
    .regex(/^(\+212|0)[0-9]{9}$/, "Invalid Moroccan phone number")
    .optional()
    .or(z.literal("")),
  customerNotes: z.string().max(500).optional(),
  tableNumber: z.string().max(20).optional(),
  orderType: z.enum(["dine_in", "pickup", "delivery"]).default("dine_in"),
  deliveryAddress: z.string().max(500).optional(),
  paymentMethod: z.string().max(50).default("cash"),
  items: z.array(orderItemInputSchema).min(1).max(50),
});

describe("createOrder input validation", () => {
  // Helper: minimal valid order payload
  function validOrderPayload(
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      menuId: "550e8400-e29b-41d4-a716-446655440000",
      orderType: "dine_in",
      items: [
        {
          dishName: "Tajine",
          quantity: 1,
          unitPrice: 5000,
        },
      ],
      ...overrides,
    };
  }

  describe("valid inputs", () => {
    it("should accept a minimal dine-in order", () => {
      const result = createOrderInputSchema.safeParse(validOrderPayload());

      expect(result.success).toBe(true);
    });

    it("should accept a pickup order with name and phone", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          orderType: "pickup",
          customerName: "Ahmed",
          customerPhone: "+212612345678",
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept a delivery order with all required fields", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          orderType: "delivery",
          customerName: "Fatima",
          customerPhone: "0612345678",
          deliveryAddress: "123 Rue Hassan II, Casablanca",
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept empty string for customerPhone", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          customerPhone: "",
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept an order with 50 items (max)", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        dishName: `Dish ${i}`,
        quantity: 1,
        unitPrice: 1000,
      }));

      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ items }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept notes up to 500 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          customerNotes: "X".repeat(500),
        }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe("menuId validation", () => {
    it("should reject invalid UUID format", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ menuId: "not-a-uuid" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject empty menuId", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ menuId: "" }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("customerPhone validation", () => {
    it("should accept valid Moroccan phone with +212 prefix", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerPhone: "+212612345678" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept valid Moroccan phone with 0 prefix", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerPhone: "0612345678" }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject phone with invalid prefix", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerPhone: "+1234567890" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject phone with too few digits", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerPhone: "+21261234567" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject phone with too many digits", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerPhone: "+2126123456789" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject phone with letters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerPhone: "+212ABCDEFGHI" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject phone exceeding 20 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerPhone: "0".repeat(21) }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("customerName validation", () => {
    it("should accept a name up to 100 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerName: "A".repeat(100) }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject a name exceeding 100 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ customerName: "A".repeat(101) }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("orderType validation", () => {
    it("should accept dine_in", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ orderType: "dine_in" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept pickup", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ orderType: "pickup" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept delivery", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ orderType: "delivery" }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject invalid order type", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ orderType: "drive_thru" }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("deliveryAddress validation", () => {
    it("should accept address up to 500 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ deliveryAddress: "X".repeat(500) }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject address exceeding 500 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ deliveryAddress: "X".repeat(501) }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("items validation", () => {
    it("should reject empty items array", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ items: [] }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject more than 50 items", () => {
      const items = Array.from({ length: 51 }, (_, i) => ({
        dishName: `Dish ${i}`,
        quantity: 1,
        unitPrice: 1000,
      }));

      const result = createOrderInputSchema.safeParse(
        validOrderPayload({ items }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("orderItem validation", () => {
    it("should reject empty dishName", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "", quantity: 1, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject dishName exceeding 200 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "A".repeat(201), quantity: 1, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept dishName of exactly 200 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "A".repeat(200), quantity: 1, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject quantity of zero", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Tajine", quantity: 0, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Tajine", quantity: -1, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept quantity of exactly 99 (max)", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Tajine", quantity: 99, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject quantity exceeding 99", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Tajine", quantity: 100, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject negative unitPrice", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Tajine", quantity: 1, unitPrice: -100 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept unitPrice of zero", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Free Sample", quantity: 1, unitPrice: 0 }],
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject non-integer quantity", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Tajine", quantity: 1.5, unitPrice: 1000 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject non-integer unitPrice", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [{ dishName: "Tajine", quantity: 1, unitPrice: 10.5 }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept notes up to 500 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [
            {
              dishName: "Tajine",
              quantity: 1,
              unitPrice: 1000,
              notes: "X".repeat(500),
            },
          ],
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject notes exceeding 500 characters", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [
            {
              dishName: "Tajine",
              quantity: 1,
              unitPrice: 1000,
              notes: "X".repeat(501),
            },
          ],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept valid UUID for dishId", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [
            {
              dishId: "550e8400-e29b-41d4-a716-446655440000",
              dishName: "Tajine",
              quantity: 1,
              unitPrice: 1000,
            },
          ],
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for dishId", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [
            {
              dishId: "not-a-uuid",
              dishName: "Tajine",
              quantity: 1,
              unitPrice: 1000,
            },
          ],
        }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept valid UUID for dishVariantId", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [
            {
              dishVariantId: "550e8400-e29b-41d4-a716-446655440001",
              dishName: "Tajine Large",
              quantity: 1,
              unitPrice: 1000,
            },
          ],
        }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for dishVariantId", () => {
      const result = createOrderInputSchema.safeParse(
        validOrderPayload({
          items: [
            {
              dishVariantId: "invalid",
              dishName: "Tajine",
              quantity: 1,
              unitPrice: 1000,
            },
          ],
        }),
      );

      expect(result.success).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Reviews Router Validation Tests
// ──────────────────────────────────────────────────────────────────────────────

const submitReviewInputSchema = z.object({
  menuId: z.string().uuid(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().max(200).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const respondToReviewInputSchema = z.object({
  reviewId: z.string().uuid(),
  response: z.string().max(1000),
});

describe("submitReview input validation", () => {
  function validReviewPayload(
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      menuId: "550e8400-e29b-41d4-a716-446655440000",
      rating: 5,
      ...overrides,
    };
  }

  describe("valid inputs", () => {
    it("should accept minimal review with just menuId and rating", () => {
      const result = submitReviewInputSchema.safeParse(validReviewPayload());

      expect(result.success).toBe(true);
    });

    it("should accept fully populated review", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({
          customerName: "Ahmed",
          customerEmail: "ahmed@example.com",
          comment: "Excellent food!",
        }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe("rating validation", () => {
    it("should accept rating of 1", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ rating: 1 }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept rating of 5", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ rating: 5 }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept rating of 3", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ rating: 3 }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject rating of 0", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ rating: 0 }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject rating of 6", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ rating: 6 }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject negative rating", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ rating: -1 }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject non-integer rating", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ rating: 4.5 }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("customerName validation", () => {
    it("should accept name up to 100 characters", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ customerName: "A".repeat(100) }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject name exceeding 100 characters", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ customerName: "A".repeat(101) }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("customerEmail validation", () => {
    it("should accept valid email", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ customerEmail: "test@example.com" }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ customerEmail: "not-an-email" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject email exceeding 200 characters", () => {
      const longEmail = "a".repeat(191) + "@test.com"; // 200 chars total

      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ customerEmail: longEmail + "x" }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept email of exactly 200 characters", () => {
      const exactEmail = "a".repeat(191) + "@test.com"; // Exactly 200 chars

      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ customerEmail: exactEmail }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe("comment validation", () => {
    it("should accept comment up to 2000 characters", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ comment: "X".repeat(2000) }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject comment exceeding 2000 characters", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ comment: "X".repeat(2001) }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept empty comment", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ comment: "" }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe("menuId validation", () => {
    it("should reject invalid UUID", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ menuId: "not-a-uuid" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject empty menuId", () => {
      const result = submitReviewInputSchema.safeParse(
        validReviewPayload({ menuId: "" }),
      );

      expect(result.success).toBe(false);
    });
  });
});

describe("respondToReview input validation", () => {
  function validResponsePayload(
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      reviewId: "550e8400-e29b-41d4-a716-446655440000",
      response: "Thank you for your feedback!",
      ...overrides,
    };
  }

  describe("valid inputs", () => {
    it("should accept valid response", () => {
      const result = respondToReviewInputSchema.safeParse(
        validResponsePayload(),
      );

      expect(result.success).toBe(true);
    });
  });

  describe("response validation", () => {
    it("should accept response up to 1000 characters", () => {
      const result = respondToReviewInputSchema.safeParse(
        validResponsePayload({ response: "X".repeat(1000) }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject response exceeding 1000 characters", () => {
      const result = respondToReviewInputSchema.safeParse(
        validResponsePayload({ response: "X".repeat(1001) }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept empty response (schema allows it)", () => {
      const result = respondToReviewInputSchema.safeParse(
        validResponsePayload({ response: "" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept single character response", () => {
      const result = respondToReviewInputSchema.safeParse(
        validResponsePayload({ response: "X" }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe("reviewId validation", () => {
    it("should reject invalid UUID", () => {
      const result = respondToReviewInputSchema.safeParse(
        validResponsePayload({ reviewId: "not-a-uuid" }),
      );

      expect(result.success).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Affiliates Router Validation Tests
// ──────────────────────────────────────────────────────────────────────────────

const submitReferralInputSchema = z.object({
  referralCode: z.string().min(1).max(20),
  referredEmail: z.string().email().max(255),
});

describe("submitReferral input validation", () => {
  function validReferralPayload(
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      referralCode: "FQ-ABC12345",
      referredEmail: "newuser@example.com",
      ...overrides,
    };
  }

  describe("valid inputs", () => {
    it("should accept valid referral", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload(),
      );

      expect(result.success).toBe(true);
    });

    it("should accept short referral code", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referralCode: "X" }),
      );

      expect(result.success).toBe(true);
    });

    it("should accept referral code of exactly 20 characters", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referralCode: "A".repeat(20) }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe("referralCode validation", () => {
    it("should reject empty referralCode", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referralCode: "" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject referralCode exceeding 20 characters", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referralCode: "A".repeat(21) }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("referredEmail validation", () => {
    it("should accept valid email", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referredEmail: "user@example.com" }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referredEmail: "not-an-email" }),
      );

      expect(result.success).toBe(false);
    });

    it("should reject email exceeding 255 characters", () => {
      const longEmail = "a".repeat(246) + "@test.com"; // 255 chars total

      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referredEmail: longEmail + "x" }),
      );

      expect(result.success).toBe(false);
    });

    it("should accept email of exactly 255 characters", () => {
      const exactEmail = "a".repeat(246) + "@test.com"; // Exactly 255 chars

      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referredEmail: exactEmail }),
      );

      expect(result.success).toBe(true);
    });

    it("should reject email with invalid TLD", () => {
      const result = submitReferralInputSchema.safeParse(
        validReferralPayload({ referredEmail: "user@domain" }),
      );

      expect(result.success).toBe(false);
    });
  });
});
