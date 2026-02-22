import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the marketplace tRPC router.
 * Covers browse, search, getCities, getCuisines, getEventTypes, getFeatured, getStats.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    organizations: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    events: {
      count: vi.fn(),
    },
    reviews: {
      count: vi.fn(),
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
import { marketplaceRouter } from "../api/routers/marketplace";
import { createRestaurant, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return marketplaceRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("marketplaceRouter", () => {
  const mockOrgs = vi.mocked(db.organizations);
  const mockEvents = vi.mocked(db.events);
  const mockReviews = vi.mocked(db.reviews);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // browse
  // =========================================================================

  describe("browse", () => {
    it("should return paginated caterers", async () => {
      const org = createRestaurant({ isActive: true });
      mockOrgs.findMany.mockResolvedValue([org] as never);

      const caller = createPublicCaller();
      const result = await caller.browse({});

      expect(result.caterers).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should handle cursor pagination", async () => {
      const orgs = Array.from({ length: 3 }, () => createRestaurant());
      mockOrgs.findMany.mockResolvedValue(orgs as never);

      const caller = createPublicCaller();
      const result = await caller.browse({ limit: 2 });

      expect(result.nextCursor).toBeDefined();
      expect(result.caterers).toHaveLength(2);
    });

    it("should filter by city", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ city: "Casablanca" });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { equals: "Casablanca", mode: "insensitive" },
          }),
        }),
      );
    });

    it("should filter by type", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ type: "caterer" });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "caterer" }),
        }),
      );
    });

    it("should filter by cuisines", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ cuisines: ["Moroccan", "French"] });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cuisines: { hasSome: ["Moroccan", "French"] },
          }),
        }),
      );
    });

    it("should apply search across name, description, city", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ search: "Moroccan" });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.anything() }),
            ]),
          }),
        }),
      );
    });

    it("should filter by verified status", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ isVerified: true });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isVerified: true }),
        }),
      );
    });
  });

  // =========================================================================
  // search
  // =========================================================================

  describe("search", () => {
    it("should search organizations by query", async () => {
      const org = createRestaurant({ name: "Diyafa Royale" });
      mockOrgs.findMany.mockResolvedValue([org] as never);

      const caller = createPublicCaller();
      const result = await caller.search({ query: "Diyafa" });

      expect(result).toHaveLength(1);
      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("should reject query shorter than 2 characters", async () => {
      const caller = createPublicCaller();
      await expect(caller.search({ query: "A" })).rejects.toThrow();
    });

    it("should respect limit parameter", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.search({ query: "test", limit: 5 });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  // =========================================================================
  // getCities
  // =========================================================================

  describe("getCities", () => {
    it("should return city counts sorted descending", async () => {
      mockOrgs.groupBy.mockResolvedValue([
        { city: "Casablanca", _count: { city: 15 } },
        { city: "Marrakech", _count: { city: 8 } },
      ] as never);

      const caller = createPublicCaller();
      const result = await caller.getCities();

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("Casablanca");
      expect(result[0]!.count).toBe(15);
      expect(result[0]!.slug).toBe("casablanca");
    });

    it("should filter out null cities", async () => {
      mockOrgs.groupBy.mockResolvedValue([
        { city: null, _count: { city: 2 } },
        { city: "Fes", _count: { city: 3 } },
      ] as never);

      const caller = createPublicCaller();
      const result = await caller.getCities();

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Fes");
    });
  });

  // =========================================================================
  // getCuisines
  // =========================================================================

  describe("getCuisines", () => {
    it("should return unique cuisines with counts sorted by popularity", async () => {
      mockOrgs.findMany.mockResolvedValue([
        { cuisines: ["Moroccan", "French"] },
        { cuisines: ["Moroccan", "Mediterranean"] },
        { cuisines: ["French"] },
      ] as never);

      const caller = createPublicCaller();
      const result = await caller.getCuisines();

      expect(result[0]!.name).toBe("Moroccan");
      expect(result[0]!.count).toBe(2);
      expect(result[1]!.name).toBe("French");
      expect(result[1]!.count).toBe(2);
    });

    it("should return empty when no orgs exist", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      const result = await caller.getCuisines();

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getEventTypes
  // =========================================================================

  describe("getEventTypes", () => {
    it("should return static event type list with translations", async () => {
      const caller = createPublicCaller();
      const result = await caller.getEventTypes();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("nameAr");
      expect(result[0]).toHaveProperty("nameFr");
      expect(result[0]).toHaveProperty("icon");
    });

    it("should include wedding event type", async () => {
      const caller = createPublicCaller();
      const result = await caller.getEventTypes();

      const wedding = result.find((e) => e.id === "wedding");
      expect(wedding).toBeDefined();
      expect(wedding!.name).toBe("Wedding");
    });
  });

  // =========================================================================
  // getFeatured
  // =========================================================================

  describe("getFeatured", () => {
    it("should return featured active organizations", async () => {
      const orgs = [createRestaurant({ isFeatured: true })];
      mockOrgs.findMany.mockResolvedValue(orgs as never);

      const caller = createPublicCaller();
      const result = await caller.getFeatured({});

      expect(result).toHaveLength(1);
      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, isFeatured: true },
        }),
      );
    });

    it("should respect limit parameter", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.getFeatured({ limit: 4 });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 4 }),
      );
    });
  });

  // =========================================================================
  // getStats
  // =========================================================================

  describe("getStats", () => {
    it("should return aggregated marketplace statistics", async () => {
      mockOrgs.count.mockResolvedValue(25 as never);
      mockOrgs.groupBy.mockResolvedValue([
        { city: "Casablanca" },
        { city: "Marrakech" },
        { city: "Rabat" },
      ] as never);
      mockEvents.count.mockResolvedValue(150 as never);
      mockReviews.count.mockResolvedValue(80 as never);

      const caller = createPublicCaller();
      const result = await caller.getStats();

      expect(result).toEqual({
        catererCount: 25,
        cityCount: 3,
        eventCount: 150,
        reviewCount: 80,
      });
    });
  });
});
