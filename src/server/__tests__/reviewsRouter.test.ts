import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the reviews tRPC router.
 * Covers public review submission, moderation workflow (pending -> approved/rejected),
 * owner responses, public review filtering (only approved visible), review stats
 * calculation (avg rating, distribution), rate limiting, IDOR protection,
 * and input validation edge cases.
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
    menus: {
      findFirst: vi.fn(),
    },
    reviews: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { reviewsRouter } from "../api/routers/reviews";
import {
  createUser,
  createMenu,
  createReview,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return reviewsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return reviewsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";

function validReviewInput(menuId: string) {
  return {
    menuId,
    customerName: "Fatima Zahra",
    customerEmail: "fatima@example.com",
    rating: 4 as number,
    comment: "Excellent tagine, the lamb was perfectly tender.",
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("reviewsRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockReviews = vi.mocked(db.reviews);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 4 });
  });

  // =========================================================================
  // submitReview (public procedure)
  // =========================================================================

  describe("submitReview", () => {
    it("should create a review with valid input", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      const reviewData = createReview({ menuId: menu.id, status: "pending" });

      mockReviews.create.mockResolvedValue(reviewData);

      const result = await caller.submitReview(validReviewInput(menu.id));

      expect(result.menuId).toBe(menu.id);
      expect(result.status).toBe("pending");
      expect(mockReviews.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          menuId: menu.id,
          customerName: "Fatima Zahra",
          customerEmail: "fatima@example.com",
          rating: 4,
          comment: "Excellent tagine, the lamb was perfectly tender.",
          status: "pending",
        }),
      });
    });

    it("should accept review without optional fields", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.create.mockResolvedValue(
        createReview({ menuId: menu.id, customerName: null, customerEmail: null, comment: null }),
      );

      const result = await caller.submitReview({
        menuId: menu.id,
        rating: 5,
      });

      expect(result).toBeDefined();
      expect(mockReviews.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerName: null,
          customerEmail: null,
          comment: null,
        }),
      });
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.submitReview(validReviewInput(VALID_UUID)),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found or not published",
      });
    });

    it("should throw NOT_FOUND for unpublished menu", async () => {
      const caller = createPublicCaller();

      // findFirst with isPublished: true returns null for unpublished
      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.submitReview(validReviewInput(VALID_UUID)),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.submitReview(validReviewInput(VALID_UUID)),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      // Should not even check the menu when rate limited
      expect(mockMenus.findFirst).not.toHaveBeenCalled();
    });

    // -- Rating validation --

    it("should accept minimum rating of 1", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.create.mockResolvedValue(createReview({ menuId: menu.id, rating: 1 }));

      await expect(
        caller.submitReview({ menuId: menu.id, rating: 1 }),
      ).resolves.toBeDefined();
    });

    it("should accept maximum rating of 5", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.create.mockResolvedValue(createReview({ menuId: menu.id, rating: 5 }));

      await expect(
        caller.submitReview({ menuId: menu.id, rating: 5 }),
      ).resolves.toBeDefined();
    });

    it("should reject rating of 0", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({ menuId: VALID_UUID, rating: 0 }),
      ).rejects.toThrow();
    });

    it("should reject rating of 6", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({ menuId: VALID_UUID, rating: 6 }),
      ).rejects.toThrow();
    });

    it("should reject negative rating", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({ menuId: VALID_UUID, rating: -1 }),
      ).rejects.toThrow();
    });

    it("should reject decimal rating", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({ menuId: VALID_UUID, rating: 3.5 }),
      ).rejects.toThrow();
    });

    // -- Text validation --

    it("should reject comment exceeding 2000 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({
          menuId: VALID_UUID,
          rating: 4,
          comment: "A".repeat(2001),
        }),
      ).rejects.toThrow();
    });

    it("should accept comment exactly at 2000 characters", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.create.mockResolvedValue(createReview({ menuId: menu.id }));

      await expect(
        caller.submitReview({
          menuId: menu.id,
          rating: 4,
          comment: "A".repeat(2000),
        }),
      ).resolves.toBeDefined();
    });

    it("should reject customerName exceeding 100 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({
          menuId: VALID_UUID,
          rating: 4,
          customerName: "A".repeat(101),
        }),
      ).rejects.toThrow();
    });

    it("should reject customerEmail exceeding 200 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({
          menuId: VALID_UUID,
          rating: 4,
          customerEmail: "a".repeat(195) + "@b.com",
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid email format", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({
          menuId: VALID_UUID,
          rating: 4,
          customerEmail: "not-an-email",
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID menuId", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitReview({ menuId: "not-a-uuid", rating: 4 }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getPublicReviews (public procedure)
  // =========================================================================

  describe("getPublicReviews", () => {
    it("should return only approved reviews", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const approvedReview = createReview({ menuId: menu.id, status: "approved" });

      mockReviews.findMany.mockResolvedValue([
        {
          id: approvedReview.id,
          customerName: approvedReview.customerName,
          rating: approvedReview.rating,
          comment: approvedReview.comment,
          response: approvedReview.response,
          respondedAt: approvedReview.respondedAt,
          createdAt: approvedReview.createdAt,
        },
      ] as never);
      mockReviews.count.mockResolvedValue(1);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 1 },
      } as never);

      const result = await caller.getPublicReviews({ menuId: menu.id });

      expect(result.reviews).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.averageRating).toBe(4);
      expect(result.reviewCount).toBe(1);

      // Verify the query filters by status: "approved"
      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: menu.id,
            status: "approved",
          }),
        }),
      );
    });

    it("should return empty list when no approved reviews exist", async () => {
      const caller = createPublicCaller();

      mockReviews.findMany.mockResolvedValue([]);
      mockReviews.count.mockResolvedValue(0);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as never);

      const result = await caller.getPublicReviews({ menuId: VALID_UUID });

      expect(result.reviews).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });

    it("should respect limit and offset for pagination", async () => {
      const caller = createPublicCaller();

      mockReviews.findMany.mockResolvedValue([]);
      mockReviews.count.mockResolvedValue(50);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: 4.2 },
        _count: { rating: 50 },
      } as never);

      await caller.getPublicReviews({
        menuId: VALID_UUID,
        limit: 10,
        offset: 20,
      });

      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        }),
      );
    });

    it("should use default limit of 20 and offset of 0", async () => {
      const caller = createPublicCaller();

      mockReviews.findMany.mockResolvedValue([]);
      mockReviews.count.mockResolvedValue(0);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as never);

      await caller.getPublicReviews({ menuId: VALID_UUID });

      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });

    it("should reject limit below 1", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getPublicReviews({ menuId: VALID_UUID, limit: 0 }),
      ).rejects.toThrow();
    });

    it("should reject limit above 50", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getPublicReviews({ menuId: VALID_UUID, limit: 51 }),
      ).rejects.toThrow();
    });

    it("should reject negative offset", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getPublicReviews({ menuId: VALID_UUID, offset: -1 }),
      ).rejects.toThrow();
    });

    it("should order reviews by createdAt descending", async () => {
      const caller = createPublicCaller();

      mockReviews.findMany.mockResolvedValue([]);
      mockReviews.count.mockResolvedValue(0);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as never);

      await caller.getPublicReviews({ menuId: VALID_UUID });

      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });

  // =========================================================================
  // getMenuReviews (private procedure - owner sees all statuses)
  // =========================================================================

  describe("getMenuReviews", () => {
    it("should return all reviews for owned menu", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const review = createReview({ menuId: menu.id });

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.findMany.mockResolvedValue([review] as never);
      mockReviews.count.mockResolvedValue(1);

      const result = await caller.getMenuReviews({ menuId: menu.id });

      expect(result.reviews).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it("should filter by status when provided", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.findMany.mockResolvedValue([]);
      mockReviews.count.mockResolvedValue(0);

      await caller.getMenuReviews({ menuId: menu.id, status: "pending" });

      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: menu.id,
            status: "pending",
          }),
        }),
      );
    });

    it("should return all statuses when status not provided", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.findMany.mockResolvedValue([]);
      mockReviews.count.mockResolvedValue(0);

      await caller.getMenuReviews({ menuId: menu.id });

      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { menuId: menu.id },
        }),
      );
    });

    it("should throw NOT_FOUND when menu does not belong to user (IDOR)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getMenuReviews({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should accept all valid status filter values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const statuses = ["pending", "approved", "rejected"] as const;

      for (const status of statuses) {
        vi.clearAllMocks();
        mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
        mockReviews.findMany.mockResolvedValue([]);
        mockReviews.count.mockResolvedValue(0);

        await expect(
          caller.getMenuReviews({ menuId: menu.id, status }),
        ).resolves.toBeDefined();
      }
    });

    it("should reject invalid status value", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMenuReviews({
          menuId: VALID_UUID,
          status: "invalid" as never,
        }),
      ).rejects.toThrow();
    });

    it("should reject limit below 1", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMenuReviews({ menuId: VALID_UUID, limit: 0 }),
      ).rejects.toThrow();
    });

    it("should reject limit above 100", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMenuReviews({ menuId: VALID_UUID, limit: 101 }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // moderateReview (private procedure)
  // =========================================================================

  describe("moderateReview", () => {
    it("should approve a pending review", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const review = createReview({ menuId: menu.id, status: "pending" });
      const caller = createPrivateCaller(owner.id);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: owner.id },
      } as never);
      mockReviews.update.mockResolvedValue({
        ...review,
        status: "approved",
      } as never);

      const result = await caller.moderateReview({
        reviewId: review.id,
        status: "approved",
      });

      expect(result.status).toBe("approved");
      expect(mockReviews.update).toHaveBeenCalledWith({
        where: { id: review.id },
        data: {
          status: "approved",
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should reject a pending review", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const review = createReview({ menuId: menu.id, status: "pending" });
      const caller = createPrivateCaller(owner.id);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: owner.id },
      } as never);
      mockReviews.update.mockResolvedValue({
        ...review,
        status: "rejected",
      } as never);

      const result = await caller.moderateReview({
        reviewId: review.id,
        status: "rejected",
      });

      expect(result.status).toBe("rejected");
    });

    it("should throw NOT_FOUND when review does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReviews.findUnique.mockResolvedValue(null);

      await expect(
        caller.moderateReview({
          reviewId: VALID_UUID,
          status: "approved",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Review not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR)", async () => {
      const attacker = createUser();
      const review = createReview();
      const caller = createPrivateCaller(attacker.id);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: "different-owner" },
      } as never);

      await expect(
        caller.moderateReview({
          reviewId: review.id,
          status: "approved",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to manage this review",
      });
    });

    it("should reject invalid status value", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.moderateReview({
          reviewId: VALID_UUID,
          status: "pending" as never,
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID reviewId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.moderateReview({
          reviewId: "not-a-uuid",
          status: "approved",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // respondToReview (private procedure)
  // =========================================================================

  describe("respondToReview", () => {
    it("should add owner response to a review", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const review = createReview({ menuId: menu.id });
      const caller = createPrivateCaller(owner.id);
      const responseText = "Thank you for your kind words!";

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: owner.id },
      } as never);
      mockReviews.update.mockResolvedValue({
        ...review,
        response: responseText,
        respondedAt: new Date(),
      } as never);

      const result = await caller.respondToReview({
        reviewId: review.id,
        response: responseText,
      });

      expect(result.response).toBe(responseText);
      expect(result.respondedAt).toBeDefined();
      expect(mockReviews.update).toHaveBeenCalledWith({
        where: { id: review.id },
        data: {
          response: responseText,
          respondedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should throw NOT_FOUND when review does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReviews.findUnique.mockResolvedValue(null);

      await expect(
        caller.respondToReview({
          reviewId: VALID_UUID,
          response: "Thanks!",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR)", async () => {
      const attacker = createUser();
      const review = createReview();
      const caller = createPrivateCaller(attacker.id);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: "different-owner" },
      } as never);

      await expect(
        caller.respondToReview({
          reviewId: review.id,
          response: "Thanks!",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject response exceeding 1000 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.respondToReview({
          reviewId: VALID_UUID,
          response: "A".repeat(1001),
        }),
      ).rejects.toThrow();
    });

    it("should accept response at exactly 1000 characters", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const review = createReview({ menuId: menu.id });
      const caller = createPrivateCaller(owner.id);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: owner.id },
      } as never);
      mockReviews.update.mockResolvedValue({
        ...review,
        response: "A".repeat(1000),
      } as never);

      await expect(
        caller.respondToReview({
          reviewId: review.id,
          response: "A".repeat(1000),
        }),
      ).resolves.toBeDefined();
    });

    it("should reject non-UUID reviewId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.respondToReview({
          reviewId: "not-a-uuid",
          response: "Thanks!",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // deleteReview (private procedure)
  // =========================================================================

  describe("deleteReview", () => {
    it("should delete a review owned by the user", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const review = createReview({ menuId: menu.id });
      const caller = createPrivateCaller(owner.id);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: owner.id },
      } as never);
      mockReviews.delete.mockResolvedValue(review);

      const result = await caller.deleteReview({ reviewId: review.id });

      expect(result.id).toBe(review.id);
      expect(mockReviews.delete).toHaveBeenCalledWith({
        where: { id: review.id },
      });
    });

    it("should throw NOT_FOUND when review does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockReviews.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteReview({ reviewId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR)", async () => {
      const attacker = createUser();
      const review = createReview();
      const caller = createPrivateCaller(attacker.id);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: "different-owner" },
      } as never);

      await expect(
        caller.deleteReview({ reviewId: review.id }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID reviewId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.deleteReview({ reviewId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getReviewStats (private procedure)
  // =========================================================================

  describe("getReviewStats", () => {
    it("should return full review statistics", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.aggregate
        .mockResolvedValueOnce({
          _avg: { rating: 4.2 },
          _count: { rating: 50 },
        } as never)
        .mockResolvedValueOnce({
          _avg: { rating: 4.5 },
          _count: { rating: 12 },
        } as never);
      mockReviews.groupBy.mockResolvedValue([
        { rating: 1, _count: { rating: 2 } },
        { rating: 2, _count: { rating: 3 } },
        { rating: 3, _count: { rating: 5 } },
        { rating: 4, _count: { rating: 15 } },
        { rating: 5, _count: { rating: 25 } },
      ] as never);

      const result = await caller.getReviewStats({ menuId: menu.id });

      expect(result.averageRating).toBe(4.2);
      expect(result.totalReviews).toBe(50);
      expect(result.ratingDistribution).toEqual({
        1: 2,
        2: 3,
        3: 5,
        4: 15,
        5: 25,
      });
      expect(result.recentTrend.averageRating).toBe(4.5);
      expect(result.recentTrend.reviewCount).toBe(12);
      expect(result.recentTrend.periodDays).toBe(30);
    });

    it("should return zero-filled distribution when no reviews", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as never);
      mockReviews.groupBy.mockResolvedValue([]);

      const result = await caller.getReviewStats({ menuId: menu.id });

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
      expect(result.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
      expect(result.recentTrend.averageRating).toBe(0);
      expect(result.recentTrend.reviewCount).toBe(0);
    });

    it("should fill missing rating buckets with zero", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 10 },
      } as never);
      // Only ratings 4 and 5 present
      mockReviews.groupBy.mockResolvedValue([
        { rating: 4, _count: { rating: 4 } },
        { rating: 5, _count: { rating: 6 } },
      ] as never);

      const result = await caller.getReviewStats({ menuId: menu.id });

      expect(result.ratingDistribution[1]).toBe(0);
      expect(result.ratingDistribution[2]).toBe(0);
      expect(result.ratingDistribution[3]).toBe(0);
      expect(result.ratingDistribution[4]).toBe(4);
      expect(result.ratingDistribution[5]).toBe(6);
    });

    it("should throw NOT_FOUND when menu does not belong to user (IDOR)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getReviewStats({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getReviewStats({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });
});
