import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the loyalty tRPC router.
 * Covers stamp counting logic, redemption eligibility, card creation/lookup,
 * program CRUD validation, stats calculation, IDOR protection, and edge cases
 * (double redemption prevention, inactive program stamp blocking).
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 29 })),
}));

vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    loyaltyProgram: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    loyaltyCard: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    loyaltyStamp: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { loyaltyRouter } from "../api/routers/loyalty";
import {
  createUser,
  createMenu,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return loyaltyRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return loyaltyRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";
const VALID_UUID_3 = "00000000-0000-4000-a000-000000000003";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("loyaltyRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockProgram = vi.mocked(db.loyaltyProgram);
  const mockCard = vi.mocked(db.loyaltyCard);
  const mockStamp = vi.mocked(db.loyaltyStamp);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 29 });
  });

  // =========================================================================
  // getPrograms (private)
  // =========================================================================

  describe("getPrograms", () => {
    it("should return loyalty programs for owned menu", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockProgram.findMany.mockResolvedValue([
        {
          id: VALID_UUID,
          menuId: menu.id,
          name: "Coffee Club",
          stampsRequired: 10,
          rewardDescription: "Free Coffee",
          _count: { cards: 5 },
        },
      ] as never);

      const result = await caller.getPrograms({ menuId: menu.id });

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Coffee Club");
      expect(mockMenus.findFirst).toHaveBeenCalledWith({
        where: { id: menu.id, userId: owner.id },
        select: { id: true },
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getPrograms({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to view loyalty programs for this menu",
      });
    });

    it("should return empty array when no programs exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockProgram.findMany.mockResolvedValue([]);

      const result = await caller.getPrograms({ menuId: menu.id });

      expect(result).toEqual([]);
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getPrograms({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // createProgram (private)
  // =========================================================================

  describe("createProgram", () => {
    it("should create a loyalty program with valid input", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockProgram.create.mockResolvedValue({
        id: VALID_UUID,
        menuId: menu.id,
        name: "Tagine Lovers",
        stampsRequired: 8,
        rewardDescription: "Free Tagine",
        rewardType: "free_item",
      } as never);

      const result = await caller.createProgram({
        menuId: menu.id,
        name: "Tagine Lovers",
        stampsRequired: 8,
        rewardDescription: "Free Tagine",
      });

      expect(result.name).toBe("Tagine Lovers");
      expect(mockProgram.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          menuId: menu.id,
          name: "Tagine Lovers",
          stampsRequired: 8,
          rewardDescription: "Free Tagine",
          rewardType: "free_item",
        }),
      });
    });

    it("should use default values for optional fields", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockProgram.create.mockResolvedValue({ id: VALID_UUID } as never);

      await caller.createProgram({
        menuId: menu.id,
        name: "Basic Program",
        rewardDescription: "Free Item",
      });

      expect(mockProgram.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stampsRequired: 10, // default
          rewardType: "free_item", // default
          icon: "\u2B50", // default star emoji
          color: "#D4A853", // default gold
        }),
      });
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.createProgram({
          menuId: VALID_UUID,
          name: "Stolen Program",
          rewardDescription: "Stolen Reward",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to create programs for this menu",
      });
    });

    it("should accept all valid rewardType values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const types = ["free_item", "discount_percent", "discount_amount"] as const;

      for (const rewardType of types) {
        vi.clearAllMocks();
        mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
        mockProgram.create.mockResolvedValue({ id: VALID_UUID, rewardType } as never);

        await expect(
          caller.createProgram({
            menuId: menu.id,
            name: "Test Program",
            rewardDescription: "Test Reward",
            rewardType,
          }),
        ).resolves.toBeDefined();
      }
    });

    it("should reject empty name", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createProgram({
          menuId: VALID_UUID,
          name: "",
          rewardDescription: "Some Reward",
        }),
      ).rejects.toThrow();
    });

    it("should reject name exceeding 200 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createProgram({
          menuId: VALID_UUID,
          name: "A".repeat(201),
          rewardDescription: "Some Reward",
        }),
      ).rejects.toThrow();
    });

    it("should reject stampsRequired below 2", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createProgram({
          menuId: VALID_UUID,
          name: "Test",
          rewardDescription: "Test",
          stampsRequired: 1,
        }),
      ).rejects.toThrow();
    });

    it("should reject stampsRequired above 50", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createProgram({
          menuId: VALID_UUID,
          name: "Test",
          rewardDescription: "Test",
          stampsRequired: 51,
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createProgram({
          menuId: "invalid",
          name: "Test",
          rewardDescription: "Test",
        }),
      ).rejects.toThrow();
    });

    it("should reject description exceeding 500 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createProgram({
          menuId: VALID_UUID,
          name: "Test",
          rewardDescription: "Test",
          description: "X".repeat(501),
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateProgram (private)
  // =========================================================================

  describe("updateProgram", () => {
    it("should update program fields", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockProgram.update.mockResolvedValue({
        id: VALID_UUID,
        name: "Updated Name",
        stampsRequired: 15,
      } as never);

      const result = await caller.updateProgram({
        programId: VALID_UUID,
        name: "Updated Name",
        stampsRequired: 15,
      });

      expect(result.name).toBe("Updated Name");
      expect(mockProgram.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          name: "Updated Name",
          stampsRequired: 15,
        }),
      });
    });

    it("should allow toggling isActive", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockProgram.update.mockResolvedValue({
        id: VALID_UUID,
        isActive: false,
      } as never);

      const result = await caller.updateProgram({
        programId: VALID_UUID,
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });

    it("should throw FORBIDDEN when program not found", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateProgram({ programId: VALID_UUID, name: "New Name" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to update this program",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: "different-owner" },
      } as never);

      await expect(
        caller.updateProgram({ programId: VALID_UUID, name: "Hijacked" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to update this program",
      });
    });

    it("should reject non-UUID programId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateProgram({ programId: "bad-id" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // deleteProgram (private)
  // =========================================================================

  describe("deleteProgram", () => {
    it("should delete program when owner requests it", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockProgram.delete.mockResolvedValue({ id: VALID_UUID } as never);

      const result = await caller.deleteProgram({ programId: VALID_UUID });

      expect(result.id).toBe(VALID_UUID);
      expect(mockProgram.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
      });
    });

    it("should throw FORBIDDEN when program not found", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteProgram({ programId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: "real-owner" },
      } as never);

      await expect(
        caller.deleteProgram({ programId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to delete this program",
      });

      expect(mockProgram.delete).not.toHaveBeenCalled();
    });

    it("should reject non-UUID programId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.deleteProgram({ programId: "xyz" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getCard (public)
  // =========================================================================

  describe("getCard", () => {
    it("should return card with program details", async () => {
      const caller = createPublicCaller();

      mockCard.findUnique.mockResolvedValue({
        id: VALID_UUID,
        stampsCollected: 7,
        isRedeemed: false,
        program: {
          name: "Coffee Club",
          stampsRequired: 10,
          rewardDescription: "Free Coffee",
          rewardType: "free_item",
          rewardValue: null,
          icon: "\u2B50",
          color: "#D4A853",
          isActive: true,
        },
      } as never);

      const result = await caller.getCard({
        programId: VALID_UUID,
        customerIdentifier: "fatima@example.com",
      });

      expect(result).not.toBeNull();
      expect(result!.stampsCollected).toBe(7);
      expect(result!.program.stampsRequired).toBe(10);
    });

    it("should normalize customer identifier to lowercase and trim", async () => {
      const caller = createPublicCaller();

      mockCard.findUnique.mockResolvedValue(null);

      await caller.getCard({
        programId: VALID_UUID,
        customerIdentifier: "  Fatima@Example.COM  ",
      });

      expect(mockCard.findUnique).toHaveBeenCalledWith({
        where: {
          programId_customerIdentifier: {
            programId: VALID_UUID,
            customerIdentifier: "fatima@example.com",
          },
        },
        include: expect.any(Object),
      });
    });

    it("should return null when card does not exist", async () => {
      const caller = createPublicCaller();

      mockCard.findUnique.mockResolvedValue(null);

      const result = await caller.getCard({
        programId: VALID_UUID,
        customerIdentifier: "unknown@example.com",
      });

      expect(result).toBeNull();
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.getCard({
          programId: VALID_UUID,
          customerIdentifier: "test@example.com",
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      expect(mockCard.findUnique).not.toHaveBeenCalled();
    });

    it("should reject empty customerIdentifier", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getCard({
          programId: VALID_UUID,
          customerIdentifier: "",
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID programId", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getCard({
          programId: "bad",
          customerIdentifier: "test@example.com",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getPublicPrograms (public)
  // =========================================================================

  describe("getPublicPrograms", () => {
    it("should return active programs for a published menu", async () => {
      const caller = createPublicCaller();

      mockMenus.findUnique.mockResolvedValue({
        id: VALID_UUID,
        isPublished: true,
      } as never);
      mockProgram.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          name: "Coffee Club",
          stampsRequired: 10,
          rewardDescription: "Free Coffee",
          rewardType: "free_item",
        },
      ] as never);

      const result = await caller.getPublicPrograms({ menuSlug: "my-restaurant" });

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Coffee Club");
      expect(mockProgram.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { menuId: VALID_UUID, isActive: true },
        }),
      );
    });

    it("should return empty array for unpublished menu", async () => {
      const caller = createPublicCaller();

      mockMenus.findUnique.mockResolvedValue({
        id: VALID_UUID,
        isPublished: false,
      } as never);

      const result = await caller.getPublicPrograms({ menuSlug: "hidden-menu" });

      expect(result).toEqual([]);
      expect(mockProgram.findMany).not.toHaveBeenCalled();
    });

    it("should return empty array when menu does not exist", async () => {
      const caller = createPublicCaller();

      mockMenus.findUnique.mockResolvedValue(null);

      const result = await caller.getPublicPrograms({ menuSlug: "nonexistent" });

      expect(result).toEqual([]);
    });

    it("should reject slug exceeding 200 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getPublicPrograms({ menuSlug: "a".repeat(201) }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // addStamp (private)
  // =========================================================================

  describe("addStamp", () => {
    it("should add stamp and create audit record for new customer", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        isActive: true,
        stampsRequired: 10,
        menu: { userId: owner.id },
      } as never);
      mockCard.upsert.mockResolvedValue({
        id: VALID_UUID_2,
        stampsCollected: 1,
        programId: VALID_UUID,
        customerIdentifier: "fatima@example.com",
      } as never);
      mockStamp.create.mockResolvedValue({ id: VALID_UUID_3 } as never);

      const result = await caller.addStamp({
        programId: VALID_UUID,
        customerIdentifier: "Fatima@Example.COM",
        notes: "First visit",
      });

      expect(result.stampsCollected).toBe(1);
      expect(result.stampsRequired).toBe(10);
      expect(result.customerIdentifier).toBe("fatima@example.com");

      // Verify upsert was called with normalized identifier
      expect(mockCard.upsert).toHaveBeenCalledWith({
        where: {
          programId_customerIdentifier: {
            programId: VALID_UUID,
            customerIdentifier: "fatima@example.com",
          },
        },
        create: {
          programId: VALID_UUID,
          customerIdentifier: "fatima@example.com",
          stampsCollected: 1,
        },
        update: {
          stampsCollected: { increment: 1 },
          updatedAt: expect.any(Date),
        },
      });

      // Verify audit record
      expect(mockStamp.create).toHaveBeenCalledWith({
        data: {
          cardId: VALID_UUID_2,
          stampedBy: owner.id,
          notes: "First visit",
        },
      });
    });

    it("should increment stamp count for existing customer", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        isActive: true,
        stampsRequired: 10,
        menu: { userId: owner.id },
      } as never);
      mockCard.upsert.mockResolvedValue({
        id: VALID_UUID_2,
        stampsCollected: 5,
        programId: VALID_UUID,
        customerIdentifier: "ahmed@example.com",
      } as never);
      mockStamp.create.mockResolvedValue({ id: VALID_UUID_3 } as never);

      const result = await caller.addStamp({
        programId: VALID_UUID,
        customerIdentifier: "ahmed@example.com",
      });

      expect(result.stampsCollected).toBe(5);
    });

    it("should throw FORBIDDEN when user does not own the program (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        isActive: true,
        menu: { userId: "real-owner" },
      } as never);

      await expect(
        caller.addStamp({
          programId: VALID_UUID,
          customerIdentifier: "test@example.com",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to add stamps for this program",
      });

      expect(mockCard.upsert).not.toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when program not found", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue(null);

      await expect(
        caller.addStamp({
          programId: VALID_UUID,
          customerIdentifier: "test@example.com",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw BAD_REQUEST when program is inactive (edge case)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        isActive: false,
        menu: { userId: owner.id },
      } as never);

      await expect(
        caller.addStamp({
          programId: VALID_UUID,
          customerIdentifier: "test@example.com",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "This loyalty program is not active",
      });

      expect(mockCard.upsert).not.toHaveBeenCalled();
    });

    it("should set notes to null when not provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        isActive: true,
        stampsRequired: 10,
        menu: { userId: owner.id },
      } as never);
      mockCard.upsert.mockResolvedValue({
        id: VALID_UUID_2,
        stampsCollected: 1,
      } as never);
      mockStamp.create.mockResolvedValue({ id: VALID_UUID_3 } as never);

      await caller.addStamp({
        programId: VALID_UUID,
        customerIdentifier: "test@example.com",
      });

      expect(mockStamp.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notes: null,
        }),
      });
    });

    it("should reject empty customerIdentifier", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.addStamp({
          programId: VALID_UUID,
          customerIdentifier: "",
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID programId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.addStamp({
          programId: "bad-id",
          customerIdentifier: "test@example.com",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // redeemReward (private)
  // =========================================================================

  describe("redeemReward", () => {
    it("should redeem reward when stamps >= required", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCard.findUnique.mockResolvedValue({
        id: VALID_UUID,
        stampsCollected: 10,
        isRedeemed: false,
        program: {
          stampsRequired: 10,
          menu: { userId: owner.id },
        },
      } as never);
      mockCard.update.mockResolvedValue({
        id: VALID_UUID,
        isRedeemed: true,
        redeemedAt: new Date(),
      } as never);

      const result = await caller.redeemReward({ cardId: VALID_UUID });

      expect(result.isRedeemed).toBe(true);
      expect(mockCard.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: {
          isRedeemed: true,
          redeemedAt: expect.any(Date),
        },
      });
    });

    it("should redeem when stamps exceed required threshold", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCard.findUnique.mockResolvedValue({
        id: VALID_UUID,
        stampsCollected: 15, // More than the 10 required
        isRedeemed: false,
        program: {
          stampsRequired: 10,
          menu: { userId: owner.id },
        },
      } as never);
      mockCard.update.mockResolvedValue({
        id: VALID_UUID,
        isRedeemed: true,
      } as never);

      const result = await caller.redeemReward({ cardId: VALID_UUID });

      expect(result.isRedeemed).toBe(true);
    });

    it("should throw BAD_REQUEST for double redemption (edge case)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCard.findUnique.mockResolvedValue({
        id: VALID_UUID,
        stampsCollected: 10,
        isRedeemed: true, // Already redeemed
        program: {
          stampsRequired: 10,
          menu: { userId: owner.id },
        },
      } as never);

      await expect(
        caller.redeemReward({ cardId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "This card has already been redeemed",
      });

      expect(mockCard.update).not.toHaveBeenCalled();
    });

    it("should throw BAD_REQUEST when not enough stamps", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCard.findUnique.mockResolvedValue({
        id: VALID_UUID,
        stampsCollected: 7, // Only 7 out of 10 needed
        isRedeemed: false,
        program: {
          stampsRequired: 10,
          menu: { userId: owner.id },
        },
      } as never);

      await expect(
        caller.redeemReward({ cardId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Not enough stamps to redeem",
      });

      expect(mockCard.update).not.toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when card not found", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCard.findUnique.mockResolvedValue(null);

      await expect(
        caller.redeemReward({ cardId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to redeem this card",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockCard.findUnique.mockResolvedValue({
        id: VALID_UUID,
        stampsCollected: 10,
        isRedeemed: false,
        program: {
          stampsRequired: 10,
          menu: { userId: "different-owner" },
        },
      } as never);

      await expect(
        caller.redeemReward({ cardId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      expect(mockCard.update).not.toHaveBeenCalled();
    });

    it("should reject non-UUID cardId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.redeemReward({ cardId: "bad" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getProgramStats (private)
  // =========================================================================

  describe("getProgramStats", () => {
    it("should return correct stats for a program", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockCard.count
        .mockResolvedValueOnce(20)  // totalCards
        .mockResolvedValueOnce(15)  // activeCards
        .mockResolvedValueOnce(5);  // redemptions
      mockStamp.count.mockResolvedValue(150); // totalStamps

      const result = await caller.getProgramStats({ programId: VALID_UUID });

      expect(result.totalCards).toBe(20);
      expect(result.activeCards).toBe(15);
      expect(result.redemptions).toBe(5);
      expect(result.totalStamps).toBe(150);
    });

    it("should return zero stats for a new program", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockCard.count.mockResolvedValue(0);
      mockStamp.count.mockResolvedValue(0);

      const result = await caller.getProgramStats({ programId: VALID_UUID });

      expect(result.totalCards).toBe(0);
      expect(result.activeCards).toBe(0);
      expect(result.redemptions).toBe(0);
      expect(result.totalStamps).toBe(0);
    });

    it("should calculate redemption rate correctly (redemptions / totalCards)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockCard.count
        .mockResolvedValueOnce(100) // totalCards
        .mockResolvedValueOnce(75)  // activeCards
        .mockResolvedValueOnce(25); // redemptions
      mockStamp.count.mockResolvedValue(800);

      const result = await caller.getProgramStats({ programId: VALID_UUID });

      // The router returns raw counts; rate calculated by UI
      expect(result.totalCards).toBe(100);
      expect(result.redemptions).toBe(25);
      expect(result.activeCards).toBe(75);
      // Verify: totalCards = activeCards + redemptions
      expect(result.totalCards).toBe(result.activeCards + result.redemptions);
    });

    it("should throw FORBIDDEN when program not found", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue(null);

      await expect(
        caller.getProgramStats({ programId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to view stats for this program",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: "real-owner" },
      } as never);

      await expect(
        caller.getProgramStats({ programId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID programId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getProgramStats({ programId: "nope" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getCards (private) - paginated
  // =========================================================================

  describe("getCards", () => {
    it("should return cards for a program", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockCard.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          stampsCollected: 5,
          customerIdentifier: "ahmed@example.com",
          isRedeemed: false,
        },
      ] as never);

      const result = await caller.getCards({ programId: VALID_UUID });

      expect(result.cards).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should return nextCursor when more results exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      // Generate limit + 1 cards to trigger pagination
      const cards = Array.from({ length: 51 }, (_, i) => ({
        id: `00000000-0000-4000-a000-${String(i).padStart(12, "0")}`,
        stampsCollected: i,
        customerIdentifier: `customer-${i}@example.com`,
      }));

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockCard.findMany.mockResolvedValue(cards as never);

      const result = await caller.getCards({ programId: VALID_UUID, limit: 50 });

      expect(result.cards).toHaveLength(50);
      expect(result.nextCursor).toBeDefined();
    });

    it("should return empty list when no cards exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: owner.id },
      } as never);
      mockCard.findMany.mockResolvedValue([]);

      const result = await caller.getCards({ programId: VALID_UUID });

      expect(result.cards).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should throw FORBIDDEN when user does not own the program (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockProgram.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menu: { userId: "different-owner" },
      } as never);

      await expect(
        caller.getCards({ programId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to view cards for this program",
      });
    });

    it("should reject limit below 1", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getCards({ programId: VALID_UUID, limit: 0 }),
      ).rejects.toThrow();
    });

    it("should reject limit above 100", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getCards({ programId: VALID_UUID, limit: 101 }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID programId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getCards({ programId: "bad" }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID cursor", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getCards({ programId: VALID_UUID, cursor: "not-uuid" }),
      ).rejects.toThrow();
    });
  });
});
