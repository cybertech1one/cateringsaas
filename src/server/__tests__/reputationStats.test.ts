import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the getReputationStats tRPC procedure in the reviews router.
 * Covers total reviews count, average rating, rating distribution,
 * google redirects proxy (4-5 star count), response rate,
 * IDOR protection, and zero-state for menus with no reviews.
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
import { reviewsRouter } from "../api/routers/reviews";
import {
  createUser,
  createMenu,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPrivateCaller(userId: string) {
  return reviewsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("reviewsRouter.getReputationStats", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockReviews = vi.mocked(db.reviews);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  it("should return correct total review count", async () => {
    const owner = createUser();
    const menu = createMenu({ userId: owner.id });
    const caller = createPrivateCaller(owner.id);

    mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
    mockReviews.aggregate.mockResolvedValue({
      _avg: { rating: 3.8 },
      _count: { rating: 42 },
    } as never);
    mockReviews.groupBy.mockResolvedValue([
      { rating: 1, _count: { rating: 2 } },
      { rating: 2, _count: { rating: 5 } },
      { rating: 3, _count: { rating: 8 } },
      { rating: 4, _count: { rating: 12 } },
      { rating: 5, _count: { rating: 15 } },
    ] as never);
    mockReviews.count.mockResolvedValue(20);

    const result = await caller.getReputationStats({ menuId: menu.id });

    expect(result.totalReviews).toBe(42);
  });

  it("should return correct average rating", async () => {
    const owner = createUser();
    const menu = createMenu({ userId: owner.id });
    const caller = createPrivateCaller(owner.id);

    mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
    mockReviews.aggregate.mockResolvedValue({
      _avg: { rating: 4.3 },
      _count: { rating: 25 },
    } as never);
    mockReviews.groupBy.mockResolvedValue([
      { rating: 3, _count: { rating: 5 } },
      { rating: 4, _count: { rating: 10 } },
      { rating: 5, _count: { rating: 10 } },
    ] as never);
    mockReviews.count.mockResolvedValue(10);

    const result = await caller.getReputationStats({ menuId: menu.id });

    expect(result.avgRating).toBe(4.3);
  });

  it("should return correct rating distribution with zero-fill", async () => {
    const owner = createUser();
    const menu = createMenu({ userId: owner.id });
    const caller = createPrivateCaller(owner.id);

    mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
    mockReviews.aggregate.mockResolvedValue({
      _avg: { rating: 4.5 },
      _count: { rating: 20 },
    } as never);
    // Only ratings 4 and 5 present
    mockReviews.groupBy.mockResolvedValue([
      { rating: 4, _count: { rating: 8 } },
      { rating: 5, _count: { rating: 12 } },
    ] as never);
    mockReviews.count.mockResolvedValue(5);

    const result = await caller.getReputationStats({ menuId: menu.id });

    expect(result.ratingDistribution).toEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 8,
      5: 12,
    });
    // Google redirects = 4-star + 5-star
    expect(result.googleRedirects).toBe(20);
  });

  it("should calculate response rate correctly", async () => {
    const owner = createUser();
    const menu = createMenu({ userId: owner.id });
    const caller = createPrivateCaller(owner.id);

    mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
    mockReviews.aggregate.mockResolvedValue({
      _avg: { rating: 4.0 },
      _count: { rating: 10 },
    } as never);
    mockReviews.groupBy.mockResolvedValue([
      { rating: 4, _count: { rating: 5 } },
      { rating: 5, _count: { rating: 5 } },
    ] as never);
    // 7 out of 10 have responses
    mockReviews.count.mockResolvedValue(7);

    const result = await caller.getReputationStats({ menuId: menu.id });

    expect(result.responseRate).toBe(70);
  });

  it("should throw NOT_FOUND for non-owned menu (IDOR protection)", async () => {
    const attacker = createUser();
    const caller = createPrivateCaller(attacker.id);

    mockMenus.findFirst.mockResolvedValue(null);

    await expect(
      caller.getReputationStats({ menuId: VALID_UUID }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Menu not found or you don't have permission",
    });
  });

  it("should return zeros for menu with no reviews", async () => {
    const owner = createUser();
    const menu = createMenu({ userId: owner.id });
    const caller = createPrivateCaller(owner.id);

    mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
    mockReviews.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { rating: 0 },
    } as never);
    mockReviews.groupBy.mockResolvedValue([]);
    mockReviews.count.mockResolvedValue(0);

    const result = await caller.getReputationStats({ menuId: menu.id });

    expect(result.totalReviews).toBe(0);
    expect(result.avgRating).toBe(0);
    expect(result.ratingDistribution).toEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    });
    expect(result.googleRedirects).toBe(0);
    expect(result.responseRate).toBe(0);
  });

  it("should reject non-UUID menuId", async () => {
    const owner = createUser();
    const caller = createPrivateCaller(owner.id);

    await expect(
      caller.getReputationStats({ menuId: "not-a-uuid" }),
    ).rejects.toThrow();
  });

  it("should count google redirects as sum of 4 and 5 star reviews", async () => {
    const owner = createUser();
    const menu = createMenu({ userId: owner.id });
    const caller = createPrivateCaller(owner.id);

    mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
    mockReviews.aggregate.mockResolvedValue({
      _avg: { rating: 3.5 },
      _count: { rating: 30 },
    } as never);
    mockReviews.groupBy.mockResolvedValue([
      { rating: 1, _count: { rating: 3 } },
      { rating: 2, _count: { rating: 4 } },
      { rating: 3, _count: { rating: 6 } },
      { rating: 4, _count: { rating: 9 } },
      { rating: 5, _count: { rating: 8 } },
    ] as never);
    mockReviews.count.mockResolvedValue(15);

    const result = await caller.getReputationStats({ menuId: menu.id });

    expect(result.googleRedirects).toBe(17); // 9 + 8
  });
});
