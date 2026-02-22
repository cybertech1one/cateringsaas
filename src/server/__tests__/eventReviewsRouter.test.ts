import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the eventReviews tRPC router.
 * Covers getPublicReviews, submitReview, list, respond, moderate,
 * toggleFeatured, getStats, getPublicStats.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    organizations: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    reviews: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    events: {
      findFirst: vi.fn(),
    },
    orgMembers: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
  getServiceSupabase: vi.fn(),
}));

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { db } from "~/server/db";
import { eventReviewsRouter } from "../api/routers/eventReviews";
import { createReview, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";
const REVIEW_ID = "00000000-0000-4000-a000-000000000300";

function createOrgCaller(role: string = "staff") {
  return eventReviewsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "test@example.com" } as never,
    orgId: ORG_ID,
    orgRole: role,
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

function createManagerCaller() {
  return createOrgCaller("manager");
}

function createPublicCaller() {
  return eventReviewsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("eventReviewsRouter", () => {
  const mockOrgs = vi.mocked(db.organizations);
  const mockReviews = vi.mocked(db.reviews);
  const mockEvents = vi.mocked(db.events);
  const mockMembers = vi.mocked(db.orgMembers);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockMembers.findFirst.mockResolvedValue({
      id: MEMBER_ID,
      orgId: ORG_ID,
      role: "manager",
      permissions: null,
    } as never);
  });

  // =========================================================================
  // getPublicReviews
  // =========================================================================

  describe("getPublicReviews", () => {
    it("should return published reviews for an org slug", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      const reviews = [createReview({ orgId: ORG_ID, status: "approved", isPublished: true })];
      mockReviews.findMany.mockResolvedValue(reviews as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicReviews({ orgSlug: "test-caterer" });

      expect(result.reviews).toHaveLength(1);
      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: ORG_ID,
            status: "approved",
            isPublished: true,
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when org slug is invalid", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.getPublicReviews({ orgSlug: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should handle cursor pagination", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      const reviews = Array.from({ length: 3 }, () => createReview());
      mockReviews.findMany.mockResolvedValue(reviews as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicReviews({ orgSlug: "test", limit: 2 });

      expect(result.nextCursor).toBeDefined();
      expect(result.reviews).toHaveLength(2);
    });

    it("should filter by minimum rating", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      mockReviews.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.getPublicReviews({ orgSlug: "test", minRating: 4 });

      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ratingOverall: { gte: 4 },
          }),
        }),
      );
    });
  });

  // =========================================================================
  // submitReview
  // =========================================================================

  describe("submitReview", () => {
    it("should create a review with pending status", async () => {
      const review = createReview({ orgId: ORG_ID });
      mockReviews.create.mockResolvedValue(review as never);

      const caller = createPublicCaller();
      const result = await caller.submitReview({
        orgId: ORG_ID,
        reviewerName: "Ahmed Tazi",
        ratingOverall: 5,
        comment: "Amazing food!",
      });

      expect(mockReviews.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            status: "pending",
            isPublished: false,
            ratingOverall: 5,
          }),
        }),
      );
    });

    it("should mark as verified when linked to completed event", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, status: "completed" } as never);
      mockReviews.create.mockResolvedValue(createReview({ isVerified: true }) as never);

      const caller = createPublicCaller();
      await caller.submitReview({
        orgId: ORG_ID,
        eventId: EVENT_ID,
        reviewerName: "Ahmed",
        ratingOverall: 4,
      });

      expect(mockReviews.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isVerified: true }),
        }),
      );
    });

    it("should not verify when event is not completed", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);
      mockReviews.create.mockResolvedValue(createReview() as never);

      const caller = createPublicCaller();
      await caller.submitReview({
        orgId: ORG_ID,
        eventId: EVENT_ID,
        reviewerName: "Ahmed",
        ratingOverall: 3,
      });

      expect(mockReviews.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isVerified: false }),
        }),
      );
    });

    it("should reject reviewer name shorter than 2 characters", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.submitReview({ orgId: ORG_ID, reviewerName: "A", ratingOverall: 5 }),
      ).rejects.toThrow();
    });

    it("should reject rating outside 1-5 range", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.submitReview({ orgId: ORG_ID, reviewerName: "Ahmed", ratingOverall: 6 }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // list (org)
  // =========================================================================

  describe("list", () => {
    it("should return all reviews scoped to org", async () => {
      const reviews = [createReview({ orgId: ORG_ID })];
      mockReviews.findMany.mockResolvedValue(reviews as never);

      const caller = createOrgCaller();
      const result = await caller.list({});

      expect(result.reviews).toHaveLength(1);
    });

    it("should filter by status", async () => {
      mockReviews.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ status: "pending" });

      expect(mockReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "pending" }),
        }),
      );
    });
  });

  // =========================================================================
  // respond
  // =========================================================================

  describe("respond", () => {
    it("should add org response to a review", async () => {
      mockReviews.findFirst.mockResolvedValue({ id: REVIEW_ID, orgId: ORG_ID } as never);
      mockReviews.update.mockResolvedValue({
        id: REVIEW_ID,
        response: "Thank you for your feedback!",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.respond({
        reviewId: REVIEW_ID,
        response: "Thank you for your feedback!",
      });

      expect(result.response).toBe("Thank you for your feedback!");
      expect(mockReviews.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            response: "Thank you for your feedback!",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when review does not belong to org", async () => {
      mockReviews.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.respond({ reviewId: REVIEW_ID, response: "Thanks!" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // moderate
  // =========================================================================

  describe("moderate", () => {
    it("should approve and publish a review, updating org rating", async () => {
      mockReviews.findFirst.mockResolvedValue({ id: REVIEW_ID, orgId: ORG_ID } as never);
      mockReviews.update.mockResolvedValue({ id: REVIEW_ID, status: "approved" } as never);
      mockReviews.aggregate.mockResolvedValue({
        _avg: { ratingOverall: 4.5 },
        _count: { ratingOverall: 10 },
      } as never);
      mockOrgs.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.moderate({ reviewId: REVIEW_ID, status: "approved" });

      expect(result.success).toBe(true);
      expect(mockReviews.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "approved", isPublished: true },
        }),
      );
      expect(mockOrgs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { rating: 4.5, reviewCount: 10 },
        }),
      );
    });

    it("should reject a review without publishing", async () => {
      mockReviews.findFirst.mockResolvedValue({ id: REVIEW_ID, orgId: ORG_ID } as never);
      mockReviews.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      await caller.moderate({ reviewId: REVIEW_ID, status: "rejected" });

      expect(mockReviews.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "rejected", isPublished: false },
        }),
      );
      // Should NOT update org rating
      expect(mockOrgs.update).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when review not found", async () => {
      mockReviews.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.moderate({ reviewId: REVIEW_ID, status: "approved" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // toggleFeatured
  // =========================================================================

  describe("toggleFeatured", () => {
    it("should toggle featured status from false to true", async () => {
      mockReviews.findFirst.mockResolvedValue({ id: REVIEW_ID, orgId: ORG_ID, isFeatured: false } as never);
      mockReviews.update.mockResolvedValue({ id: REVIEW_ID, isFeatured: true } as never);

      const caller = createManagerCaller();
      const result = await caller.toggleFeatured({ reviewId: REVIEW_ID });

      expect(result.isFeatured).toBe(true);
      expect(mockReviews.update).toHaveBeenCalledWith({
        where: { id: REVIEW_ID },
        data: { isFeatured: true },
      });
    });

    it("should toggle featured status from true to false", async () => {
      mockReviews.findFirst.mockResolvedValue({ id: REVIEW_ID, orgId: ORG_ID, isFeatured: true } as never);
      mockReviews.update.mockResolvedValue({ id: REVIEW_ID, isFeatured: false } as never);

      const caller = createManagerCaller();
      const result = await caller.toggleFeatured({ reviewId: REVIEW_ID });

      expect(result.isFeatured).toBe(false);
    });

    it("should throw NOT_FOUND when review not in org", async () => {
      mockReviews.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.toggleFeatured({ reviewId: REVIEW_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // getStats
  // =========================================================================

  describe("getStats", () => {
    it("should return comprehensive review statistics", async () => {
      mockReviews.aggregate.mockResolvedValue({
        _avg: {
          ratingOverall: 4.2,
          ratingFoodQuality: 4.5,
          ratingPresentation: 4.0,
          ratingServiceStaff: 4.3,
          ratingPunctuality: 4.1,
          ratingValueForMoney: 3.9,
          ratingCommunication: 4.4,
        },
        _count: { ratingOverall: 25 },
      } as never);
      mockReviews.count
        .mockResolvedValueOnce(3 as never)  // pending
        .mockResolvedValueOnce(1 as never)  // 1 star
        .mockResolvedValueOnce(2 as never)  // 2 stars
        .mockResolvedValueOnce(5 as never)  // 3 stars
        .mockResolvedValueOnce(10 as never) // 4 stars
        .mockResolvedValueOnce(7 as never); // 5 stars

      const caller = createOrgCaller();
      const result = await caller.getStats({});

      expect(result.averageRating).toBe(4.2);
      expect(result.totalReviews).toBe(25);
      expect(result.pendingCount).toBe(3);
      expect(result.dimensions.foodQuality).toBe(4.5);
      expect(result.distribution[5]).toBe(7);
    });
  });

  // =========================================================================
  // getPublicStats
  // =========================================================================

  describe("getPublicStats", () => {
    it("should return public rating stats for an org", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        rating: 4.3,
        reviewCount: 20,
      } as never);
      mockReviews.aggregate.mockResolvedValue({
        _avg: {
          ratingOverall: 4.3,
          ratingFoodQuality: 4.5,
          ratingPresentation: 4.0,
          ratingServiceStaff: 4.2,
          ratingPunctuality: 4.1,
          ratingValueForMoney: 3.8,
          ratingCommunication: 4.4,
        },
        _count: { ratingOverall: 20 },
      } as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicStats({ orgSlug: "test-caterer" });

      expect(result.rating).toBe(4.3);
      expect(result.reviewCount).toBe(20);
      expect(result.dimensions.foodQuality).toBe(4.5);
    });

    it("should throw NOT_FOUND when org not found", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.getPublicStats({ orgSlug: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
