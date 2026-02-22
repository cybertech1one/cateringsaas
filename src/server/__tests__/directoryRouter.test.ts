import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the directory tRPC router.
 * Covers getCities, getFeaturedCities, getCityBySlug (with cuisine type
 * breakdown), getRestaurantsByCity (pagination, filtering, sorting),
 * getCuisineTypes, getFeaturedRestaurants, searchRestaurants, getRegions,
 * getRegionsWithCities, incrementViewCount (rate limiting), and
 * getTrendingRestaurants (with optional city filter).
 *
 * All procedures are public. Uses a mocked Prisma client.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 9 })),
}));

vi.mock("~/server/db", () => ({
  db: {
    city: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    menus: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    cuisineType: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    region: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { directoryRouter } from "../api/routers/directory";
import { createMenu, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return directoryRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("directoryRouter", () => {
  const mockCity = vi.mocked(db.city);
  const mockMenus = vi.mocked(db.menus);
  const mockCuisineType = vi.mocked(db.cuisineType);
  const mockRegion = vi.mocked(db.region);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 9 });
  });

  // =========================================================================
  // getCities
  // =========================================================================

  describe("getCities", () => {
    it("should return all cities ordered by population desc", async () => {
      const caller = createPublicCaller();
      const cities = [
        { id: "1", name: "Casablanca", slug: "casablanca", population: 3500000, isFeatured: true, region: { id: "r1", name: "Casablanca-Settat", slug: "casablanca-settat" }, _count: { menus: 12 } },
        { id: "2", name: "Marrakech", slug: "marrakech", population: 928850, isFeatured: true, region: { id: "r2", name: "Marrakech-Safi", slug: "marrakech-safi" }, _count: { menus: 8 } },
      ];

      mockCity.findMany.mockResolvedValue(cities as never);

      const result = await caller.getCities();

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("Casablanca");
      expect(mockCity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { population: "desc" },
        }),
      );
    });

    it("should return empty array when no cities exist", async () => {
      const caller = createPublicCaller();

      mockCity.findMany.mockResolvedValue([] as never);

      const result = await caller.getCities();

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getFeaturedCities
  // =========================================================================

  describe("getFeaturedCities", () => {
    it("should return only featured cities limited to 8", async () => {
      const caller = createPublicCaller();
      const cities = [
        { id: "1", name: "Casablanca", slug: "casablanca", isFeatured: true },
      ];

      mockCity.findMany.mockResolvedValue(cities as never);

      const result = await caller.getFeaturedCities();

      expect(result).toHaveLength(1);
      expect(mockCity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isFeatured: true },
          take: 8,
        }),
      );
    });
  });

  // =========================================================================
  // getCityBySlug
  // =========================================================================

  describe("getCityBySlug", () => {
    it("should return city details with cuisine type breakdown", async () => {
      const caller = createPublicCaller();
      const city = {
        id: "city-1",
        name: "Casablanca",
        slug: "casablanca",
        description: "Economic capital",
        isFeatured: true,
        region: { id: "r1", name: "Casablanca-Settat", slug: "cs" },
        _count: { menus: 5 },
      };

      mockCity.findUnique.mockResolvedValue(city as never);
      mockMenus.groupBy.mockResolvedValue([
        { cuisineTypeId: "ct-1", _count: { id: 3 } },
        { cuisineTypeId: "ct-2", _count: { id: 2 } },
      ] as never);
      mockCuisineType.findMany.mockResolvedValue([
        { id: "ct-1", name: "Moroccan", slug: "moroccan", icon: "tajine" },
        { id: "ct-2", name: "Italian", slug: "italian", icon: "pizza" },
      ] as never);

      const result = await caller.getCityBySlug({ slug: "casablanca" });

      expect(result.name).toBe("Casablanca");
      expect(result.cuisineTypes).toHaveLength(2);
      expect(result.cuisineTypes[0]!.menuCount).toBe(3);
    });

    it("should throw NOT_FOUND for non-existent city slug", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(null as never);

      await expect(
        caller.getCityBySlug({ slug: "atlantis" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "City not found",
      });
    });

    it("should return empty cuisineTypes when no menus with cuisine exist", async () => {
      const caller = createPublicCaller();
      const city = {
        id: "city-1",
        name: "Fes",
        slug: "fes",
        region: { id: "r1", name: "Fes-Meknes", slug: "fm" },
        _count: { menus: 0 },
      };

      mockCity.findUnique.mockResolvedValue(city as never);
      mockMenus.groupBy.mockResolvedValue([] as never);

      const result = await caller.getCityBySlug({ slug: "fes" });

      expect(result.cuisineTypes).toEqual([]);
      expect(mockCuisineType.findMany).not.toHaveBeenCalled();
    });

    it("should reject slugs longer than 200 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getCityBySlug({ slug: "a".repeat(201) }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getRestaurantsByCity
  // =========================================================================

  describe("getRestaurantsByCity", () => {
    const cityData = { id: "city-1", name: "Casablanca", slug: "casablanca" };

    it("should return paginated restaurants for a city", async () => {
      const caller = createPublicCaller();
      const restaurant = createMenu({ isPublished: true });

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockMenus.findMany.mockResolvedValue([restaurant] as never);
      mockMenus.count.mockResolvedValue(1 as never);

      const result = await caller.getRestaurantsByCity({
        citySlug: "casablanca",
      });

      expect(result.restaurants).toHaveLength(1);
      expect(result.city).toEqual(cityData);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should throw NOT_FOUND for non-existent city", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(null as never);

      await expect(
        caller.getRestaurantsByCity({ citySlug: "atlantis" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "City not found",
      });
    });

    it("should throw NOT_FOUND for non-existent cuisine slug", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockCuisineType.findUnique.mockResolvedValue(null as never);

      await expect(
        caller.getRestaurantsByCity({
          citySlug: "casablanca",
          cuisineSlug: "klingon-food",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Cuisine type not found",
      });
    });

    it("should filter by cuisine type when cuisineSlug is provided", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockCuisineType.findUnique.mockResolvedValue({ id: "ct-1" } as never);
      mockMenus.findMany.mockResolvedValue([] as never);
      mockMenus.count.mockResolvedValue(0 as never);

      await caller.getRestaurantsByCity({
        citySlug: "casablanca",
        cuisineSlug: "moroccan",
      });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cuisineTypeId: "ct-1",
          }),
        }),
      );
    });

    it("should filter by priceRange when provided", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockMenus.findMany.mockResolvedValue([] as never);
      mockMenus.count.mockResolvedValue(0 as never);

      await caller.getRestaurantsByCity({
        citySlug: "casablanca",
        priceRange: 3,
      });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceRange: 3,
          }),
        }),
      );
    });

    it("should sort by viewCount desc for 'popular'", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockMenus.findMany.mockResolvedValue([] as never);
      mockMenus.count.mockResolvedValue(0 as never);

      await caller.getRestaurantsByCity({
        citySlug: "casablanca",
        sortBy: "popular",
      });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: "desc" },
        }),
      );
    });

    it("should sort by rating desc for 'rating'", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockMenus.findMany.mockResolvedValue([] as never);
      mockMenus.count.mockResolvedValue(0 as never);

      await caller.getRestaurantsByCity({
        citySlug: "casablanca",
        sortBy: "rating",
      });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: "desc" },
        }),
      );
    });

    it("should sort by name asc for 'name'", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockMenus.findMany.mockResolvedValue([] as never);
      mockMenus.count.mockResolvedValue(0 as never);

      await caller.getRestaurantsByCity({
        citySlug: "casablanca",
        sortBy: "name",
      });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        }),
      );
    });

    it("should calculate pagination correctly for page 2", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockMenus.findMany.mockResolvedValue([] as never);
      mockMenus.count.mockResolvedValue(45 as never);

      const result = await caller.getRestaurantsByCity({
        citySlug: "casablanca",
        page: 2,
        limit: 20,
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalCount).toBe(45);
      expect(result.pagination.totalPages).toBe(3);
      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });

    it("should set hasMore correctly", async () => {
      const caller = createPublicCaller();
      const restaurants = Array.from({ length: 20 }, () => createMenu());

      mockCity.findUnique.mockResolvedValue(cityData as never);
      mockMenus.findMany.mockResolvedValue(restaurants as never);
      mockMenus.count.mockResolvedValue(45 as never);

      const result = await caller.getRestaurantsByCity({
        citySlug: "casablanca",
        page: 1,
        limit: 20,
      });

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  // =========================================================================
  // getCuisineTypes
  // =========================================================================

  describe("getCuisineTypes", () => {
    it("should return all cuisine types ordered by sortOrder", async () => {
      const caller = createPublicCaller();
      const cuisineTypes = [
        { id: "1", name: "Moroccan", slug: "moroccan", icon: "tajine", sortOrder: 1, _count: { menus: 15 } },
        { id: "2", name: "Italian", slug: "italian", icon: "pizza", sortOrder: 2, _count: { menus: 5 } },
      ];

      mockCuisineType.findMany.mockResolvedValue(cuisineTypes as never);

      const result = await caller.getCuisineTypes();

      expect(result).toHaveLength(2);
      expect(mockCuisineType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sortOrder: "asc" },
        }),
      );
    });
  });

  // =========================================================================
  // getFeaturedRestaurants
  // =========================================================================

  describe("getFeaturedRestaurants", () => {
    it("should return featured published menus", async () => {
      const caller = createPublicCaller();
      const restaurant = createMenu({ isPublished: true, isFeatured: true });

      mockMenus.findMany.mockResolvedValue([restaurant] as never);

      const result = await caller.getFeaturedRestaurants({ limit: 8 });

      expect(result).toHaveLength(1);
      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true, isFeatured: true },
          orderBy: { viewCount: "desc" },
          take: 8,
        }),
      );
    });

    it("should use default limit of 8", async () => {
      const caller = createPublicCaller();

      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.getFeaturedRestaurants({});

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 8,
        }),
      );
    });
  });

  // =========================================================================
  // searchRestaurants
  // =========================================================================

  describe("searchRestaurants", () => {
    it("should search across name, address, city, directoryCity, and cuisineType", async () => {
      const caller = createPublicCaller();
      const restaurant = createMenu({ name: "Riad Casablanca" });

      mockMenus.findMany.mockResolvedValue([restaurant] as never);

      const result = await caller.searchRestaurants({
        query: "casablanca",
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            OR: expect.arrayContaining([
              { name: { contains: "casablanca", mode: "insensitive" } },
              { address: { contains: "casablanca", mode: "insensitive" } },
              { city: { contains: "casablanca", mode: "insensitive" } },
              {
                directoryCity: {
                  name: { contains: "casablanca", mode: "insensitive" },
                },
              },
              {
                cuisineType: {
                  name: { contains: "casablanca", mode: "insensitive" },
                },
              },
            ]),
          }),
        }),
      );
    });

    it("should perform case-insensitive search via Prisma mode", async () => {
      const caller = createPublicCaller();
      const restaurant = createMenu({ name: "Le Petit Marrakech" });

      mockMenus.findMany.mockResolvedValue([restaurant] as never);

      const result = await caller.searchRestaurants({
        query: "MARRAKECH",
        limit: 10,
      });

      expect(result).toHaveLength(1);
      // Verify mode: "insensitive" is used on all OR clauses
      const callArgs = mockMenus.findMany.mock.calls[0]![0] as { where: { OR: Array<Record<string, unknown>> } };
      const orClauses = callArgs.where.OR;

      for (const clause of orClauses) {
        // Each clause should contain mode: "insensitive" at some nesting level
        const json = JSON.stringify(clause);

        expect(json).toContain('"mode":"insensitive"');
      }
    });

    it("should respect the limit parameter", async () => {
      const caller = createPublicCaller();
      const restaurants = Array.from({ length: 3 }, (_, i) =>
        createMenu({ name: `Restaurant ${i}` }),
      );

      mockMenus.findMany.mockResolvedValue(restaurants as never);

      await caller.searchRestaurants({ query: "restaurant", limit: 3 });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
        }),
      );
    });

    it("should use default limit of 10 when not provided", async () => {
      const caller = createPublicCaller();

      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.searchRestaurants({ query: "test" });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it("should reject empty query", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.searchRestaurants({ query: "", limit: 10 }),
      ).rejects.toThrow();
    });

    it("should reject query over 100 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.searchRestaurants({ query: "a".repeat(101), limit: 10 }),
      ).rejects.toThrow();
    });

    it("should return empty array when no matches found", async () => {
      const caller = createPublicCaller();

      mockMenus.findMany.mockResolvedValue([] as never);

      const result = await caller.searchRestaurants({
        query: "nonexistent-restaurant-xyz",
      });

      expect(result).toEqual([]);
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.searchRestaurants({ query: "test" }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });
    });

    it("should search by cuisine type name", async () => {
      const caller = createPublicCaller();
      const restaurant = createMenu({ name: "Some Restaurant" });

      mockMenus.findMany.mockResolvedValue([restaurant] as never);

      await caller.searchRestaurants({ query: "moroccan", limit: 5 });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                cuisineType: {
                  name: { contains: "moroccan", mode: "insensitive" },
                },
              },
            ]),
          }),
        }),
      );
    });

    it("should only return published menus", async () => {
      const caller = createPublicCaller();

      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.searchRestaurants({ query: "test" });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // getRegions
  // =========================================================================

  describe("getRegions", () => {
    it("should return regions with city counts ordered alphabetically", async () => {
      const caller = createPublicCaller();
      const regions = [
        { id: "r1", name: "Casablanca-Settat", slug: "cs", _count: { cities: 3 } },
        { id: "r2", name: "Marrakech-Safi", slug: "ms", _count: { cities: 5 } },
      ];

      mockRegion.findMany.mockResolvedValue(regions as never);

      const result = await caller.getRegions();

      expect(result).toHaveLength(2);
      expect(mockRegion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        }),
      );
    });
  });

  // =========================================================================
  // getRegionsWithCities
  // =========================================================================

  describe("getRegionsWithCities", () => {
    it("should return regions with nested cities", async () => {
      const caller = createPublicCaller();
      const regions = [
        {
          id: "r1",
          name: "Casablanca-Settat",
          slug: "cs",
          cities: [
            { id: "c1", name: "Casablanca", slug: "casablanca", _count: { menus: 12 } },
            { id: "c2", name: "Mohammedia", slug: "mohammedia", _count: { menus: 3 } },
          ],
        },
      ];

      mockRegion.findMany.mockResolvedValue(regions as never);

      const result = await caller.getRegionsWithCities();

      expect(result).toHaveLength(1);
      expect(result[0]!.cities).toHaveLength(2);
    });
  });

  // =========================================================================
  // incrementViewCount
  // =========================================================================

  describe("incrementViewCount", () => {
    it("should increment view count for a published menu", async () => {
      const caller = createPublicCaller();
      const menu = createMenu({ isPublished: true });

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenus.update.mockResolvedValue({ ...menu, viewCount: 1 } as never);

      const result = await caller.incrementViewCount({ menuId: menu.id });

      expect(result.success).toBe(true);
      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: menu.id },
        data: { viewCount: { increment: 1 } },
      });
    });

    it("should throw NOT_FOUND for non-existent or unpublished menu", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null as never);

      await expect(
        caller.incrementViewCount({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should silently succeed when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      const result = await caller.incrementViewCount({ menuId: VALID_UUID });

      expect(result.success).toBe(true);
      expect(mockMenus.findFirst).not.toHaveBeenCalled();
      expect(mockMenus.update).not.toHaveBeenCalled();
    });

    it("should reject invalid UUID", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.incrementViewCount({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getTrendingRestaurants
  // =========================================================================

  describe("getTrendingRestaurants", () => {
    it("should return trending restaurants ordered by viewCount", async () => {
      const caller = createPublicCaller();
      const restaurant = createMenu({ viewCount: 100 });

      mockMenus.findMany.mockResolvedValue([restaurant] as never);

      const result = await caller.getTrendingRestaurants({ limit: 6 });

      expect(result).toHaveLength(1);
      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            viewCount: { gt: 0 },
          }),
          orderBy: [{ viewCount: "desc" }, { rating: "desc" }],
          take: 6,
        }),
      );
    });

    it("should filter by city when citySlug is provided", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue({ id: "city-1" } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.getTrendingRestaurants({
        citySlug: "casablanca",
        limit: 6,
      });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cityId: "city-1",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND for non-existent city slug", async () => {
      const caller = createPublicCaller();

      mockCity.findUnique.mockResolvedValue(null as never);

      await expect(
        caller.getTrendingRestaurants({ citySlug: "atlantis" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "City not found",
      });
    });

    it("should return all trending when no citySlug is given", async () => {
      const caller = createPublicCaller();

      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.getTrendingRestaurants({});

      expect(mockCity.findUnique).not.toHaveBeenCalled();
    });
  });
});
