import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the marketing overview tRPC router.
 * Covers getMarketingOverview (aggregated stats), getShareAnalytics
 * (platform breakdown, time series, top shared dishes), and getSubscribers
 * (email collection from reviews).
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    promotions: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    reviews: {
      findMany: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { marketingOverviewRouter } from "../api/routers/marketing/overview";
import {
  createUser,
  createMenu,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPrivateCaller(userId: string) {
  return marketingOverviewRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("marketingOverviewRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockPromotions = vi.mocked(db.promotions);
  const mockReviews = vi.mocked(db.reviews);
  const mockQueryRaw = vi.mocked(db.$queryRaw);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // getMarketingOverview
  // =========================================================================

  describe("getMarketingOverview", () => {
    it("should return zeros when user has no menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.getMarketingOverview({ period: "30d" });

      expect(result).toEqual({
        activePromotions: 0,
        totalCouponUses: 0,
        menuViews: 0,
        socialShares: 0,
      });
      expect(mockPromotions.count).not.toHaveBeenCalled();
    });

    it("should aggregate stats across all user menus", async () => {
      const owner = createUser();
      const menu1 = createMenu({ userId: owner.id });
      const menu2 = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([
        { id: menu1.id },
        { id: menu2.id },
      ] as never);
      mockPromotions.count.mockResolvedValue(3 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 7 } as never);
      // Menu views query
      mockQueryRaw.mockResolvedValueOnce([{ count: BigInt(150) }] as never);
      // Social shares query
      mockQueryRaw.mockResolvedValueOnce([{ count: BigInt(42) }] as never);

      const result = await caller.getMarketingOverview({ period: "30d" });

      expect(result.activePromotions).toBe(3);
      expect(result.totalCouponUses).toBe(7);
      expect(result.menuViews).toBe(150);
      expect(result.socialShares).toBe(42);
    });

    it("should use default period of 30d when not specified", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockPromotions.count.mockResolvedValue(0 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 0 } as never);
      mockQueryRaw.mockResolvedValue([{ count: BigInt(0) }] as never);

      const result = await caller.getMarketingOverview({});

      expect(result).toBeDefined();
      expect(mockMenus.findMany).toHaveBeenCalled();
    });

    it("should accept 'all' period (no date filter)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockPromotions.count.mockResolvedValue(1 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 5 } as never);
      mockQueryRaw.mockResolvedValue([{ count: BigInt(100) }] as never);

      const result = await caller.getMarketingOverview({ period: "all" });

      expect(result.activePromotions).toBe(1);
    });

    it("should accept 'today' period", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockPromotions.count.mockResolvedValue(0 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 0 } as never);
      mockQueryRaw.mockResolvedValue([{ count: BigInt(0) }] as never);

      const result = await caller.getMarketingOverview({ period: "today" });

      expect(result).toBeDefined();
    });

    it("should accept '7d' period", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockPromotions.count.mockResolvedValue(2 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 3 } as never);
      mockQueryRaw.mockResolvedValue([{ count: BigInt(10) }] as never);

      const result = await caller.getMarketingOverview({ period: "7d" });

      expect(result.activePromotions).toBe(2);
    });

    it("should accept '90d' period", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockPromotions.count.mockResolvedValue(0 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 1 } as never);
      mockQueryRaw.mockResolvedValue([{ count: BigInt(500) }] as never);

      const result = await caller.getMarketingOverview({ period: "90d" });

      expect(result.menuViews).toBe(500);
    });

    it("should handle zero counts from raw queries", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockPromotions.count.mockResolvedValue(0 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 0 } as never);
      mockQueryRaw.mockResolvedValue([{ count: BigInt(0) }] as never);

      const result = await caller.getMarketingOverview({ period: "30d" });

      expect(result.menuViews).toBe(0);
      expect(result.socialShares).toBe(0);
    });

    it("should handle empty raw query result", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockPromotions.count.mockResolvedValue(0 as never);
      mockPromotions.aggregate.mockResolvedValue({ _count: 0 } as never);
      mockQueryRaw.mockResolvedValue([] as never);

      const result = await caller.getMarketingOverview({ period: "30d" });

      expect(result.menuViews).toBe(0);
      expect(result.socialShares).toBe(0);
    });

    it("should throw INTERNAL_SERVER_ERROR on unexpected failure", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockRejectedValue(new Error("DB connection lost"));

      await expect(
        caller.getMarketingOverview({ period: "30d" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load marketing overview data",
      });
    });

    it("should reject invalid period value", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMarketingOverview({ period: "invalid" as never }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getShareAnalytics
  // =========================================================================

  describe("getShareAnalytics", () => {
    it("should return share analytics for all user menus when no menuId provided", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);

      // byPlatform query
      mockQueryRaw.mockResolvedValueOnce([
        { platform: "whatsapp", count: BigInt(20) },
        { platform: "facebook", count: BigInt(15) },
      ] as never);
      // overTime query
      mockQueryRaw.mockResolvedValueOnce([
        { date: new Date("2025-03-10T00:00:00Z"), count: BigInt(5) },
        { date: new Date("2025-03-11T00:00:00Z"), count: BigInt(8) },
      ] as never);
      // topSharedDishes query
      mockQueryRaw.mockResolvedValueOnce([
        { dish_name: "Lamb Tagine", count: BigInt(12) },
      ] as never);

      const result = await caller.getShareAnalytics({ period: "30d" });

      expect(result.byPlatform).toHaveLength(2);
      expect(result.byPlatform[0]!.platform).toBe("whatsapp");
      expect(result.byPlatform[0]!.count).toBe(20);
      expect(result.overTime).toHaveLength(2);
      expect(result.topSharedDishes).toHaveLength(1);
      expect(result.topSharedDishes[0]!.dishName).toBe("Lamb Tagine");
    });

    it("should filter by specific menuId with ownership check", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockQueryRaw.mockResolvedValue([] as never);

      const result = await caller.getShareAnalytics({
        menuId: menu.id,
        period: "30d",
      });

      expect(result.byPlatform).toEqual([]);
      expect(result.overTime).toEqual([]);
      expect(result.topSharedDishes).toEqual([]);
      expect(mockMenus.findFirst).toHaveBeenCalledWith({
        where: { id: menu.id, userId: owner.id },
        select: { id: true },
      });
    });

    it("should throw NOT_FOUND when menuId does not belong to user", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getShareAnalytics({ menuId: VALID_UUID, period: "30d" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found or access denied",
      });
    });

    it("should return empty results when user has no menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.getShareAnalytics({ period: "30d" });

      expect(result).toEqual({
        byPlatform: [],
        overTime: [],
        topSharedDishes: [],
      });
    });

    it("should convert BigInt counts to numbers in platform data", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        { platform: "direct", count: BigInt(999) },
      ] as never);
      mockQueryRaw.mockResolvedValueOnce([] as never);
      mockQueryRaw.mockResolvedValueOnce([] as never);

      const result = await caller.getShareAnalytics({ period: "7d" });

      expect(typeof result.byPlatform[0]!.count).toBe("number");
      expect(result.byPlatform[0]!.count).toBe(999);
    });

    it("should format dates as ISO date strings in overTime", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockResolvedValueOnce([] as never);
      mockQueryRaw.mockResolvedValueOnce([
        { date: new Date("2025-03-15T00:00:00Z"), count: BigInt(10) },
      ] as never);
      mockQueryRaw.mockResolvedValueOnce([] as never);

      const result = await caller.getShareAnalytics({ period: "30d" });

      expect(result.overTime[0]!.date).toBe("2025-03-15");
      expect(typeof result.overTime[0]!.count).toBe("number");
    });

    it("should reject invalid menuId (non-UUID)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getShareAnalytics({ menuId: "not-a-uuid", period: "30d" }),
      ).rejects.toThrow();
    });

    it("should throw INTERNAL_SERVER_ERROR on unexpected failure", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockRejectedValue(new Error("Query timeout"));

      await expect(
        caller.getShareAnalytics({ period: "30d" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load share analytics data",
      });
    });

    it("should use default period of 30d", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.getShareAnalytics({});

      expect(result).toEqual({
        byPlatform: [],
        overTime: [],
        topSharedDishes: [],
      });
    });
  });

  // =========================================================================
  // getSubscribers
  // =========================================================================

  describe("getSubscribers", () => {
    it("should return subscribers from reviews with emails", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockReviews.findMany.mockResolvedValue([
        {
          customerEmail: "fatima@example.com",
          customerName: "Fatima",
          createdAt: new Date("2025-03-10T10:00:00Z"),
        },
        {
          customerEmail: "ahmed@example.com",
          customerName: null,
          createdAt: new Date("2025-03-08T14:00:00Z"),
        },
      ] as never);

      const result = await caller.getSubscribers({});

      expect(result.total).toBe(2);
      expect(result.subscribers).toHaveLength(2);
      expect(result.subscribers[0]!.email).toBe("fatima@example.com");
      expect(result.subscribers[0]!.name).toBe("Fatima");
      expect(result.subscribers[1]!.name).toBeNull();
    });

    it("should filter by specific menuId", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockReviews.findMany.mockResolvedValue([
        {
          customerEmail: "guest@example.com",
          customerName: "Guest",
          createdAt: new Date("2025-03-12T10:00:00Z"),
        },
      ] as never);

      const result = await caller.getSubscribers({ menuId: menu.id });

      expect(result.total).toBe(1);
      expect(mockMenus.findMany).toHaveBeenCalledWith({
        where: { id: menu.id, userId: owner.id },
        select: { id: true },
      });
    });

    it("should return empty when user has no menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.getSubscribers({});

      expect(result).toEqual({ subscribers: [], total: 0 });
    });

    it("should return empty when no reviews have emails", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockReviews.findMany.mockResolvedValue([] as never);

      const result = await caller.getSubscribers({});

      expect(result.subscribers).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should format subscribedAt as ISO string", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockReviews.findMany.mockResolvedValue([
        {
          customerEmail: "test@example.com",
          customerName: "Test",
          createdAt: new Date("2025-03-15T12:30:00Z"),
        },
      ] as never);

      const result = await caller.getSubscribers({});

      expect(result.subscribers[0]!.subscribedAt).toBe("2025-03-15T12:30:00.000Z");
    });

    it("should reject invalid menuId (non-UUID)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getSubscribers({ menuId: "bad-uuid" }),
      ).rejects.toThrow();
    });

    it("should throw INTERNAL_SERVER_ERROR on unexpected failure", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockRejectedValue(new Error("Connection lost"));

      await expect(
        caller.getSubscribers({}),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load subscribers data",
      });
    });

    it("should filter out reviews where customerEmail is null from results", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      // Even though we filter in DB query, the .filter() in code also filters
      mockReviews.findMany.mockResolvedValue([
        {
          customerEmail: "real@example.com",
          customerName: "Real",
          createdAt: new Date("2025-03-10T10:00:00Z"),
        },
        {
          customerEmail: null,
          customerName: "No Email",
          createdAt: new Date("2025-03-09T10:00:00Z"),
        },
      ] as never);

      const result = await caller.getSubscribers({});

      expect(result.total).toBe(1);
      expect(result.subscribers[0]!.email).toBe("real@example.com");
    });
  });

  // =========================================================================
  // getCustomerContacts
  // =========================================================================

  describe("getCustomerContacts", () => {
    it("should return customer contacts aggregated from orders", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: "Fatima",
          customer_phone: "+212600000001",
          total_orders: BigInt(5),
          total_spent: BigInt(15000),
          last_order: new Date("2025-03-15T10:00:00Z"),
        },
        {
          customer_name: "Ahmed",
          customer_phone: "+212600000002",
          total_orders: BigInt(2),
          total_spent: BigInt(4500),
          last_order: new Date("2025-03-12T14:00:00Z"),
        },
      ] as never);

      const result = await caller.getCustomerContacts({});

      expect(result.contacts).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.contacts[0]!.name).toBe("Fatima");
      expect(result.contacts[0]!.phone).toBe("+212600000001");
      expect(result.contacts[1]!.name).toBe("Ahmed");
      expect(result.contacts[1]!.phone).toBe("+212600000002");
    });

    it("should return empty when no menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.getCustomerContacts({});

      expect(result).toEqual({ contacts: [], totalCount: 0 });
      expect(mockQueryRaw).not.toHaveBeenCalled();
    });

    it("should convert BigInt to numbers for totalOrders and totalSpent", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: "Youssef",
          customer_phone: "+212600000003",
          total_orders: BigInt(12),
          total_spent: BigInt(98700),
          last_order: new Date("2025-03-14T08:00:00Z"),
        },
      ] as never);

      const result = await caller.getCustomerContacts({});

      expect(typeof result.contacts[0]!.totalOrders).toBe("number");
      expect(typeof result.contacts[0]!.totalSpent).toBe("number");
      expect(result.contacts[0]!.totalOrders).toBe(12);
      expect(result.contacts[0]!.totalSpent).toBe(98700);
    });

    it("should format lastOrder as ISO string", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: "Layla",
          customer_phone: "+212600000004",
          total_orders: BigInt(1),
          total_spent: BigInt(2500),
          last_order: new Date("2025-03-15T12:30:00Z"),
        },
      ] as never);

      const result = await caller.getCustomerContacts({});

      expect(result.contacts[0]!.lastOrder).toBe(
        "2025-03-15T12:30:00.000Z",
      );
    });

    it("should support search filter by name or phone", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: "Fatima Zahra",
          customer_phone: "+212600000001",
          total_orders: BigInt(3),
          total_spent: BigInt(9000),
          last_order: new Date("2025-03-15T10:00:00Z"),
        },
      ] as never);

      const result = await caller.getCustomerContacts({ search: "Fatima" });

      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0]!.name).toBe("Fatima Zahra");
    });

    it("should support minOrders filter", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: "Hassan",
          customer_phone: "+212600000005",
          total_orders: BigInt(10),
          total_spent: BigInt(50000),
          last_order: new Date("2025-03-15T10:00:00Z"),
        },
      ] as never);

      const result = await caller.getCustomerContacts({ minOrders: 5 });

      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0]!.totalOrders).toBe(10);
    });

    it("should reject invalid menuId (non-UUID)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getCustomerContacts({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });

    it("should throw INTERNAL_SERVER_ERROR on unexpected failure", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockRejectedValue(new Error("DB connection lost"));

      await expect(
        caller.getCustomerContacts({}),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load customer contacts",
      });
    });
  });

  // =========================================================================
  // exportCustomerCSV
  // =========================================================================

  describe("exportCustomerCSV", () => {
    it("should export contacts as CSV with correct headers", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: "Fatima",
          customer_phone: "+212600000001",
          total_orders: BigInt(5),
          total_spent: BigInt(15000),
          last_order: new Date("2025-03-15T10:00:00Z"),
        },
      ] as never);

      const result = await caller.exportCustomerCSV({});

      expect(result.csv).toContain("Name,Phone,Total Orders,Total Spent,Last Order");
      expect(result.csv).toContain('"Fatima"');
      expect(result.csv).toContain('"+212600000001"');
      expect(result.csv).toContain("5");
      expect(result.csv).toContain("150.00");
      expect(result.csv).toContain('"2025-03-15"');
    });

    it("should return headers-only CSV when no menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.exportCustomerCSV({});

      expect(result.csv).toBe(
        "Name,Phone,Total Orders,Total Spent,Last Order\n",
      );
    });

    it("should convert amount from cents to dollars (divide by 100)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: "Ali",
          customer_phone: "+212600000006",
          total_orders: BigInt(1),
          total_spent: BigInt(1999),
          last_order: new Date("2025-03-10T10:00:00Z"),
        },
      ] as never);

      const result = await caller.exportCustomerCSV({});

      // 1999 cents = 19.99
      expect(result.csv).toContain("19.99");
    });

    it("should handle null customer name as Anonymous", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: null,
          customer_phone: "+212600000007",
          total_orders: BigInt(2),
          total_spent: BigInt(5000),
          last_order: new Date("2025-03-10T10:00:00Z"),
        },
      ] as never);

      const result = await caller.exportCustomerCSV({});

      expect(result.csv).toContain('"Anonymous"');
    });

    it("should escape double quotes in CSV fields", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([{ id: VALID_UUID }] as never);
      mockQueryRaw.mockResolvedValueOnce([
        {
          customer_name: 'Ali "The Chef"',
          customer_phone: "+212600000008",
          total_orders: BigInt(1),
          total_spent: BigInt(3000),
          last_order: new Date("2025-03-10T10:00:00Z"),
        },
      ] as never);

      const result = await caller.exportCustomerCSV({});

      // Double quotes should be escaped as ""
      expect(result.csv).toContain('"Ali ""The Chef"""');
    });

    it("should return filename with current date", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.exportCustomerCSV({});

      const today = new Date().toISOString().split("T")[0];

      expect(result.filename).toBe(`customer-contacts-${today}.csv`);
    });

    it("should throw INTERNAL_SERVER_ERROR on unexpected failure", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockRejectedValue(new Error("Connection reset"));

      await expect(
        caller.exportCustomerCSV({}),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to export customer contacts",
      });
    });
  });
});
