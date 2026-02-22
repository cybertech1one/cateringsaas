import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the promotions CRUD tRPC router.
 * Covers date range validation, discount types, active promotion filtering,
 * day-of-week filtering, time window validation, IDOR protection, and edge cases
 * (expired promotions, zero discount, toggle behavior).
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 59 })),
}));

vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findFirst: vi.fn(),
    },
    promotions: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { promotionsCrudRouter } from "../api/routers/promotions/crud";
import {
  createUser,
  createMenu,
  createPromotion,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return promotionsCrudRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return promotionsCrudRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";

function validCreateInput(restaurantId: string) {
  return {
    restaurantId,
    title: "Lunch Special: Tagine + Mint Tea",
    description: "Enjoy a full tagine with complimentary mint tea.",
    promotionType: "daily_special" as const,
    discountPercent: 15,
    startDate: new Date("2025-01-01T00:00:00Z"),
    isActive: true,
    applicableDays: ["monday", "tuesday", "wednesday"] as ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("promotionsCrudRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockPromotions = vi.mocked(db.promotions);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 59 });
  });

  // =========================================================================
  // getActiveBySlug (public)
  // =========================================================================

  describe("getActiveBySlug", () => {
    it("should return active promotions for a published menu slug", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          title: "Happy Hour",
          promotionType: "happy_hour",
          discountPercent: 20,
          discountAmount: null,
          applicableDays: [],
          startTime: null,
          endTime: null,
          endDate: null,
          imageUrl: null,
          description: "20% off drinks",
        },
      ] as never);

      const result = await caller.getActiveBySlug({ slug: "my-restaurant" });

      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe("Happy Hour");
    });

    it("should return empty array for non-existent or unpublished menu", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null);

      const result = await caller.getActiveBySlug({ slug: "nonexistent-slug" });

      expect(result).toEqual([]);
      expect(mockPromotions.findMany).not.toHaveBeenCalled();
    });

    it("should filter out promotions for non-applicable day", async () => {
      const caller = createPublicCaller();
      const now = new Date();
      const dayNames = [
        "sunday", "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday",
      ] as const;
      // Create a promotion that is applicable only on a day that is NOT today
      const notToday = dayNames[(now.getDay() + 1) % 7]!;

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          title: "Day-specific Promo",
          applicableDays: [notToday], // Only applicable on a different day
          startTime: null,
          endTime: null,
          endDate: null,
          promotionType: "daily_special",
          discountPercent: 10,
          discountAmount: null,
          imageUrl: null,
          description: null,
        },
      ] as never);

      const result = await caller.getActiveBySlug({ slug: "test-slug" });

      expect(result).toHaveLength(0);
    });

    it("should include promotions with empty applicableDays (all days)", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          title: "Every Day Deal",
          applicableDays: [], // Empty = all days
          startTime: null,
          endTime: null,
          endDate: null,
          promotionType: "discount",
          discountPercent: 5,
          discountAmount: null,
          imageUrl: null,
          description: null,
        },
      ] as never);

      const result = await caller.getActiveBySlug({ slug: "test-slug" });

      expect(result).toHaveLength(1);
    });

    it("should filter by time window when startTime and endTime are set", async () => {
      const caller = createPublicCaller();

      // Create a promotion with a time window that is definitely not now
      // (set to 03:00 - 04:00 UTC, unlikely to match during testing)
      const startTime = new Date("1970-01-01T03:00:00Z");
      const endTime = new Date("1970-01-01T04:00:00Z");

      const now = new Date();
      const currentHH = now.getHours().toString().padStart(2, "0");
      const currentMM = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${currentHH}:${currentMM}`;

      // Only test if we're NOT between 03:00-04:00 to avoid flaky test
      const isInWindow = currentTime >= "03:00" && currentTime <= "04:00";

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          title: "Early Bird",
          applicableDays: [],
          startTime,
          endTime,
          endDate: null,
          promotionType: "happy_hour",
          discountPercent: 25,
          discountAmount: null,
          imageUrl: null,
          description: null,
        },
      ] as never);

      const result = await caller.getActiveBySlug({ slug: "test-slug" });

      if (!isInWindow) {
        expect(result).toHaveLength(0);
      } else {
        expect(result).toHaveLength(1);
      }
    });

    it("should include promotions with no time restrictions", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          title: "All Day",
          applicableDays: [],
          startTime: null, // No time restriction
          endTime: null,
          endDate: null,
          promotionType: "discount",
          discountPercent: 10,
          discountAmount: null,
          imageUrl: null,
          description: null,
        },
      ] as never);

      const result = await caller.getActiveBySlug({ slug: "test-slug" });

      expect(result).toHaveLength(1);
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.getActiveBySlug({ slug: "test-slug" }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      expect(mockMenus.findFirst).not.toHaveBeenCalled();
    });

    it("should reject slug exceeding 200 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getActiveBySlug({ slug: "a".repeat(201) }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getPromotions (private, owner only)
  // =========================================================================

  describe("getPromotions", () => {
    it("should return all promotions for owned restaurant", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const promo = createPromotion({ restaurantId: menu.id });

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.findMany.mockResolvedValue([promo] as never);

      const result = await caller.getPromotions({ restaurantId: menu.id });

      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe(promo.title);
    });

    it("should throw FORBIDDEN when user does not own the restaurant (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getPromotions({ restaurantId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to access this restaurant's data",
      });
    });

    it("should return empty array when no promotions exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.findMany.mockResolvedValue([]);

      const result = await caller.getPromotions({ restaurantId: menu.id });

      expect(result).toEqual([]);
    });

    it("should reject non-UUID restaurantId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getPromotions({ restaurantId: "bad-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // createPromotion (private)
  // =========================================================================

  describe("createPromotion", () => {
    it("should create a promotion with valid input", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: menu.id,
        title: "Lunch Special: Tagine + Mint Tea",
        promotionType: "daily_special",
        discountPercent: 15,
        isActive: true,
      } as never);

      const result = await caller.createPromotion(validCreateInput(menu.id));

      expect(result.title).toBe("Lunch Special: Tagine + Mint Tea");
      expect(mockPromotions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          restaurantId: menu.id,
          title: "Lunch Special: Tagine + Mint Tea",
          promotionType: "daily_special",
          discountPercent: 15,
          isActive: true,
        }),
      });
    });

    it("should create promotion with percent discount type", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({
        id: VALID_UUID_2,
        discountPercent: 25,
        discountAmount: null,
      } as never);

      await caller.createPromotion({
        ...validCreateInput(menu.id),
        promotionType: "discount",
        discountPercent: 25,
      });

      expect(mockPromotions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          discountPercent: 25,
        }),
      });
    });

    it("should create promotion with amount discount type", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({
        id: VALID_UUID_2,
        discountPercent: null,
        discountAmount: 500,
      } as never);

      await caller.createPromotion({
        ...validCreateInput(menu.id),
        promotionType: "discount",
        discountPercent: undefined,
        discountAmount: 500,
      });

      expect(mockPromotions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          discountAmount: 500,
          discountPercent: null,
        }),
      });
    });

    it("should accept zero discount percent (edge case)", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({
        id: VALID_UUID_2,
        discountPercent: 0,
      } as never);

      await expect(
        caller.createPromotion({
          ...validCreateInput(menu.id),
          discountPercent: 0,
        }),
      ).resolves.toBeDefined();
    });

    it("should accept zero discount amount (edge case)", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({
        id: VALID_UUID_2,
        discountAmount: 0,
      } as never);

      await expect(
        caller.createPromotion({
          ...validCreateInput(menu.id),
          discountAmount: 0,
        }),
      ).resolves.toBeDefined();
    });

    it("should create promotion with endDate after startDate", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({ id: VALID_UUID_2 } as never);

      await caller.createPromotion({
        ...validCreateInput(menu.id),
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(mockPromotions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-06-30"),
        }),
      });
    });

    it("should create promotion with no endDate (never expires)", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({ id: VALID_UUID_2 } as never);

      await caller.createPromotion({
        ...validCreateInput(menu.id),
        endDate: undefined,
      });

      expect(mockPromotions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          endDate: null,
        }),
      });
    });

    it("should create promotion with time window", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({ id: VALID_UUID_2 } as never);

      await caller.createPromotion({
        ...validCreateInput(menu.id),
        startTime: "11:00",
        endTime: "14:00",
      });

      expect(mockPromotions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startTime: "11:00",
          endTime: "14:00",
        }),
      });
    });

    it("should accept all valid promotionType values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const types = ["daily_special", "happy_hour", "discount", "combo", "seasonal"] as const;

      for (const promotionType of types) {
        vi.clearAllMocks();
        mockRateLimit.mockReturnValue({ success: true, remaining: 59 });
        mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
        mockPromotions.create.mockResolvedValue({ id: VALID_UUID_2, promotionType } as never);

        await expect(
          caller.createPromotion({
            ...validCreateInput(menu.id),
            promotionType,
          }),
        ).resolves.toBeDefined();
      }
    });

    it("should accept all valid day-of-week values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.create.mockResolvedValue({ id: VALID_UUID_2 } as never);

      const allDays = [
        "monday", "tuesday", "wednesday", "thursday",
        "friday", "saturday", "sunday",
      ] as const;

      await expect(
        caller.createPromotion({
          ...validCreateInput(menu.id),
          applicableDays: [...allDays],
        }),
      ).resolves.toBeDefined();
    });

    it("should throw FORBIDDEN when user does not own the restaurant", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.createPromotion(validCreateInput(VALID_UUID)),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to access this restaurant's data",
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.createPromotion(validCreateInput(VALID_UUID)),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      expect(mockMenus.findFirst).not.toHaveBeenCalled();
    });

    it("should reject empty title", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          title: "",
        }),
      ).rejects.toThrow();
    });

    it("should reject title exceeding 200 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          title: "T".repeat(201),
        }),
      ).rejects.toThrow();
    });

    it("should reject discount percent above 100", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          discountPercent: 101,
        }),
      ).rejects.toThrow();
    });

    it("should reject negative discount percent", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          discountPercent: -5,
        }),
      ).rejects.toThrow();
    });

    it("should reject negative discount amount", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          discountAmount: -100,
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid time format for startTime", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          startTime: "25:00", // Invalid hour
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid time format for endTime", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          endTime: "12:60", // Invalid minutes
        }),
      ).rejects.toThrow();
    });

    it("should reject non-HH:MM time format", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          startTime: "1:00pm",
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid day in applicableDays", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          applicableDays: ["funday"] as never,
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID restaurantId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput("bad-uuid"),
        }),
      ).rejects.toThrow();
    });

    it("should reject description exceeding 1000 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          description: "D".repeat(1001),
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid promotionType", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPromotion({
          ...validCreateInput(VALID_UUID),
          promotionType: "invalid_type" as never,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updatePromotion (private)
  // =========================================================================

  describe("updatePromotion", () => {
    it("should update promotion fields", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: menu.id,
      } as never);
      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.update.mockResolvedValue({
        id: VALID_UUID,
        title: "Updated Title",
        discountPercent: 30,
      } as never);

      const result = await caller.updatePromotion({
        id: VALID_UUID,
        title: "Updated Title",
        discountPercent: 30,
      });

      expect(result.title).toBe("Updated Title");
      expect(mockPromotions.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          title: "Updated Title",
          discountPercent: 30,
          updatedAt: expect.any(Date),
        }),
      });
    });

    it("should only include provided fields in update data", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: menu.id,
      } as never);
      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.update.mockResolvedValue({
        id: VALID_UUID,
        isActive: false,
      } as never);

      await caller.updatePromotion({
        id: VALID_UUID,
        isActive: false,
      });

      const updateCall = mockPromotions.update.mock.calls[0]![0] as {
        data: Record<string, unknown>;
      };

      expect(updateCall.data).toHaveProperty("isActive", false);
      expect(updateCall.data).toHaveProperty("updatedAt");
      // Should NOT have title, description etc. since they weren't provided
      expect(updateCall.data).not.toHaveProperty("title");
      expect(updateCall.data).not.toHaveProperty("description");
    });

    it("should allow setting nullable fields to null", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: menu.id,
      } as never);
      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.update.mockResolvedValue({ id: VALID_UUID } as never);

      await caller.updatePromotion({
        id: VALID_UUID,
        endDate: null,
        discountPercent: null,
        description: null,
      });

      const updateCall = mockPromotions.update.mock.calls[0]![0] as {
        data: Record<string, unknown>;
      };

      expect(updateCall.data.endDate).toBeNull();
      expect(updateCall.data.discountPercent).toBeNull();
      expect(updateCall.data.description).toBeNull();
    });

    it("should throw NOT_FOUND when promotion does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue(null);

      await expect(
        caller.updatePromotion({
          id: VALID_UUID,
          title: "Ghost Promo",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Promotion not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the restaurant (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: VALID_UUID,
      } as never);
      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.updatePromotion({
          id: VALID_UUID,
          title: "Hijacked",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      expect(mockPromotions.update).not.toHaveBeenCalled();
    });

    it("should reject non-UUID id", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updatePromotion({ id: "bad" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // deletePromotion (private)
  // =========================================================================

  describe("deletePromotion", () => {
    it("should delete promotion when owner requests it", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: menu.id,
      } as never);
      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.delete.mockResolvedValue({ id: VALID_UUID } as never);

      const result = await caller.deletePromotion({ id: VALID_UUID });

      expect(result.id).toBe(VALID_UUID);
      expect(mockPromotions.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
      });
    });

    it("should throw NOT_FOUND when promotion does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue(null);

      await expect(
        caller.deletePromotion({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Promotion not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the restaurant (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: VALID_UUID,
      } as never);
      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.deletePromotion({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      expect(mockPromotions.delete).not.toHaveBeenCalled();
    });

    it("should reject non-UUID id", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.deletePromotion({ id: "xyz" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // togglePromotion (private)
  // =========================================================================

  describe("togglePromotion", () => {
    it("should toggle promotion from active to inactive", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: menu.id,
        isActive: true,
      } as never);
      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.update.mockResolvedValue({
        id: VALID_UUID,
        isActive: false,
      } as never);

      const result = await caller.togglePromotion({ id: VALID_UUID });

      expect(result.isActive).toBe(false);
      expect(mockPromotions.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should toggle promotion from inactive to active", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: menu.id,
        isActive: false,
      } as never);
      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockPromotions.update.mockResolvedValue({
        id: VALID_UUID,
        isActive: true,
      } as never);

      const result = await caller.togglePromotion({ id: VALID_UUID });

      expect(result.isActive).toBe(true);
      expect(mockPromotions.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: {
          isActive: true,
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should throw NOT_FOUND when promotion does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockPromotions.findUnique.mockResolvedValue(null);

      await expect(
        caller.togglePromotion({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Promotion not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the restaurant (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockPromotions.findUnique.mockResolvedValue({
        restaurantId: VALID_UUID,
        isActive: true,
      } as never);
      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.togglePromotion({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      expect(mockPromotions.update).not.toHaveBeenCalled();
    });

    it("should reject non-UUID id", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.togglePromotion({ id: "not-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getActivePromotions (public, by menuId)
  // =========================================================================

  describe("getActivePromotions", () => {
    it("should return active promotions for a menu", async () => {
      const caller = createPublicCaller();

      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID,
          title: "Happy Hour",
          isActive: true,
          applicableDays: [],
          startTime: null,
          endTime: null,
        },
      ] as never);

      const result = await caller.getActivePromotions({ menuId: VALID_UUID });

      expect(result).toHaveLength(1);
    });

    it("should filter out promotions for non-applicable day", async () => {
      const caller = createPublicCaller();
      const now = new Date();
      const dayNames = [
        "sunday", "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday",
      ] as const;
      const notToday = dayNames[(now.getDay() + 1) % 7]!;

      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID,
          title: "Wrong Day Promo",
          applicableDays: [notToday],
          startTime: null,
          endTime: null,
        },
      ] as never);

      const result = await caller.getActivePromotions({ menuId: VALID_UUID });

      expect(result).toHaveLength(0);
    });

    it("should return empty array when no active promotions exist", async () => {
      const caller = createPublicCaller();

      mockPromotions.findMany.mockResolvedValue([]);

      const result = await caller.getActivePromotions({ menuId: VALID_UUID });

      expect(result).toEqual([]);
    });

    it("should include promotions with empty applicableDays (applies every day)", async () => {
      const caller = createPublicCaller();

      mockPromotions.findMany.mockResolvedValue([
        {
          id: VALID_UUID,
          title: "Always On",
          applicableDays: [],
          startTime: null,
          endTime: null,
        },
      ] as never);

      const result = await caller.getActivePromotions({ menuId: VALID_UUID });

      expect(result).toHaveLength(1);
    });

    it("should reject non-UUID menuId", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getActivePromotions({ menuId: "bad" }),
      ).rejects.toThrow();
    });
  });
});
