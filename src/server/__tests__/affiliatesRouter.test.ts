import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the affiliates tRPC router.
 * Covers referral code generation, referral listing, stats aggregation,
 * public referral submission, IDOR protection, rate limiting,
 * input validation, and edge cases (duplicate emails, invalid codes).
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 4 })),
}));

vi.mock("~/server/db", () => ({
  db: {
    referrals: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

vi.mock("~/server/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { affiliatesRouter } from "../api/routers/affiliates";
import {
  createUser,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return affiliatesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return affiliatesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("affiliatesRouter", () => {
  const mockReferrals = vi.mocked(db.referrals);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 4 });
  });

  // =========================================================================
  // getMyReferralCode (private)
  // =========================================================================

  describe("getMyReferralCode", () => {
    it("should return existing referral code when user already has one", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReferrals.findFirst.mockResolvedValue({
        referralCode: "FQ-ABC12345",
      } as never);

      const result = await caller.getMyReferralCode();

      expect(result.referralCode).toBe("FQ-ABC12345");
      expect(mockReferrals.findFirst).toHaveBeenCalledWith({
        where: { referrerId: owner.id },
        select: { referralCode: true },
      });
    });

    it("should generate a new referral code when user has none", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReferrals.findFirst.mockResolvedValue(null);
      mockReferrals.findUnique.mockResolvedValue(null); // No collision
      mockReferrals.create.mockResolvedValue({
        id: VALID_UUID,
        referralCode: "FQ-NEWCODE1",
      } as never);

      const result = await caller.getMyReferralCode();

      expect(result.referralCode).toMatch(/^FQ-[A-Z2-9]{8}$/);
      expect(mockReferrals.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referrerId: owner.id,
          referredEmail: "",
          status: "pending",
          rewardAmount: 0,
        }),
      });
    });

    it("should retry on code collision and succeed", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReferrals.findFirst.mockResolvedValue(null);
      // First code collides, second does not
      mockReferrals.findUnique
        .mockResolvedValueOnce({ id: "existing" } as never)
        .mockResolvedValueOnce(null);
      mockReferrals.create.mockResolvedValue({
        id: VALID_UUID,
        referralCode: "FQ-RETRY123",
      } as never);

      const result = await caller.getMyReferralCode();

      expect(result.referralCode).toBeDefined();
      expect(mockReferrals.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // getMyReferrals (private)
  // =========================================================================

  describe("getMyReferrals", () => {
    it("should return referrals for the current user, excluding seed records", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      const referralData = [
        {
          id: VALID_UUID,
          referredEmail: "restaurant@example.com",
          referralCode: "FQ-CODE1234",
          status: "pending",
          rewardAmount: 500,
          createdAt: new Date("2025-03-01"),
          completedAt: null,
        },
      ];

      mockReferrals.findMany.mockResolvedValue(referralData as never);

      const result = await caller.getMyReferrals();

      expect(result).toHaveLength(1);
      expect(result[0]!.referredEmail).toBe("restaurant@example.com");
      expect(mockReferrals.findMany).toHaveBeenCalledWith({
        where: {
          referrerId: owner.id,
          referredEmail: { not: "" },
        },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when no referrals exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReferrals.findMany.mockResolvedValue([]);

      const result = await caller.getMyReferrals();

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getReferralStats (private)
  // =========================================================================

  describe("getReferralStats", () => {
    it("should return correct aggregated stats", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReferrals.findMany.mockResolvedValue([
        { status: "pending", rewardAmount: 500 },
        { status: "completed", rewardAmount: 500 },
        { status: "rewarded", rewardAmount: 500 },
        { status: "rewarded", rewardAmount: 500 },
        { status: "pending", rewardAmount: 500 },
      ] as never);

      const result = await caller.getReferralStats();

      expect(result.totalReferred).toBe(5);
      expect(result.completed).toBe(3); // completed + rewarded
      expect(result.pending).toBe(2);
      expect(result.totalRewards).toBe(1000); // Only rewarded: 500 + 500
    });

    it("should return zero stats when no referrals exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReferrals.findMany.mockResolvedValue([]);

      const result = await caller.getReferralStats();

      expect(result.totalReferred).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.totalRewards).toBe(0);
    });

    it("should only count rewards from status=rewarded referrals", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReferrals.findMany.mockResolvedValue([
        { status: "pending", rewardAmount: 500 },
        { status: "completed", rewardAmount: 500 },
      ] as never);

      const result = await caller.getReferralStats();

      // No rewarded status, so totalRewards should be 0
      expect(result.totalRewards).toBe(0);
    });

    it("should exclude seed records from stats", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      // The router filters referredEmail: { not: "" }
      mockReferrals.findMany.mockResolvedValue([]);

      const result = await caller.getReferralStats();

      expect(mockReferrals.findMany).toHaveBeenCalledWith({
        where: {
          referrerId: owner.id,
          referredEmail: { not: "" },
        },
        select: expect.any(Object),
      });
      expect(result.totalReferred).toBe(0);
    });
  });

  // =========================================================================
  // submitReferral (public)
  // =========================================================================

  describe("submitReferral", () => {
    it("should create a referral when valid code and email are provided", async () => {
      const caller = createPublicCaller();

      mockReferrals.findUnique.mockResolvedValue({
        referrerId: VALID_UUID,
        referralCode: "FQ-CODE1234",
      } as never);
      mockReferrals.findFirst.mockResolvedValue(null);
      mockReferrals.create.mockResolvedValue({
        id: "new-ref-id",
        status: "pending",
      } as never);

      const result = await caller.submitReferral({
        referralCode: "FQ-CODE1234",
        referredEmail: "newuser@example.com",
      });

      expect(result.id).toBe("new-ref-id");
      expect(result.status).toBe("pending");
      expect(mockReferrals.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referrerId: VALID_UUID,
          referredEmail: "newuser@example.com",
          referralCode: "FQ-CODE1234",
          status: "pending",
          rewardAmount: 500,
        }),
      });
    });

    it("should normalize email to lowercase", async () => {
      const caller = createPublicCaller();

      mockReferrals.findUnique.mockResolvedValue({
        referrerId: VALID_UUID,
        referralCode: "FQ-CODE1234",
      } as never);
      mockReferrals.findFirst.mockResolvedValue(null);
      mockReferrals.create.mockResolvedValue({
        id: "new-ref-id",
        status: "pending",
      } as never);

      await caller.submitReferral({
        referralCode: "FQ-CODE1234",
        referredEmail: "User@Example.COM",
      });

      expect(mockReferrals.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referredEmail: "user@example.com",
        }),
      });
    });

    it("should throw NOT_FOUND when referral code is invalid", async () => {
      const caller = createPublicCaller();

      mockReferrals.findUnique.mockResolvedValue(null);

      await expect(
        caller.submitReferral({
          referralCode: "FQ-INVALID1",
          referredEmail: "test@example.com",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Invalid referral code",
      });

      expect(mockReferrals.create).not.toHaveBeenCalled();
    });

    it("should throw CONFLICT when email has already been referred", async () => {
      const caller = createPublicCaller();

      mockReferrals.findUnique.mockResolvedValue({
        referrerId: VALID_UUID,
        referralCode: "FQ-CODE1234",
      } as never);
      mockReferrals.findFirst.mockResolvedValue({
        id: "existing-id",
        referredEmail: "existing@example.com",
      } as never);

      await expect(
        caller.submitReferral({
          referralCode: "FQ-CODE1234",
          referredEmail: "existing@example.com",
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "This email has already been referred with this code",
      });

      expect(mockReferrals.create).not.toHaveBeenCalled();
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.submitReferral({
          referralCode: "FQ-CODE1234",
          referredEmail: "test@example.com",
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      expect(mockReferrals.findUnique).not.toHaveBeenCalled();
      expect(mockReferrals.create).not.toHaveBeenCalled();
    });

    it("should reject invalid email format", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReferral({
          referralCode: "FQ-CODE1234",
          referredEmail: "not-an-email",
        }),
      ).rejects.toThrow();
    });

    it("should reject empty referral code", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReferral({
          referralCode: "",
          referredEmail: "test@example.com",
        }),
      ).rejects.toThrow();
    });

    it("should reject referral code exceeding 20 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReferral({
          referralCode: "A".repeat(21),
          referredEmail: "test@example.com",
        }),
      ).rejects.toThrow();
    });

    it("should reject email exceeding 255 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReferral({
          referralCode: "FQ-CODE1234",
          referredEmail: "a".repeat(244) + "@example.com",
        }),
      ).rejects.toThrow();
    });
  });
});
