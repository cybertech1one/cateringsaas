import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the analytics tRPC router.
 * Covers event tracking (with rate limiting and menu validation),
 * dashboard overview (views, visitors, orders, conversion, devices, peak hours),
 * conversion funnel logic, menu views over time, popular dishes,
 * QR scan statistics, location comparison, and shared helpers.
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 99 })),
}));

vi.mock("~/server/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { analyticsRouter } from "../api/routers/analytics/index";
import {
  classifyDevice,
  getStartDate,
  hashIp,
} from "../api/routers/analytics/_shared";
import {
  createUser,
  createMenu,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return analyticsRouter.createCaller({
    headers: new Headers({
      "user-agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
      "x-forwarded-for": "192.168.1.100",
    }),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return analyticsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("analyticsRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockExecuteRaw = vi.mocked(db.$executeRaw);
  const mockQueryRaw = vi.mocked(db.$queryRaw);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 99 });
  });

  // =========================================================================
  // trackEvent (public mutation)
  // =========================================================================

  describe("trackEvent", () => {
    it("should track a menu_view event successfully", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockExecuteRaw.mockResolvedValue(1 as never);

      const result = await caller.trackEvent({
        menuId: menu.id,
        eventType: "menu_view",
        sessionId: "session-abc-123",
        referrer: "https://google.com",
      });

      expect(result).toEqual({ success: true });
      expect(mockExecuteRaw).toHaveBeenCalled();
    });

    it("should track a dish_click event with eventData", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockExecuteRaw.mockResolvedValue(1 as never);

      const result = await caller.trackEvent({
        menuId: menu.id,
        eventType: "dish_click",
        sessionId: "session-abc-123",
        eventData: { dishName: "Lamb Tagine", categoryId: "cat-1" },
      });

      expect(result).toEqual({ success: true });
    });

    it("should accept all valid event types", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const eventTypes = [
        "menu_view",
        "dish_click",
        "category_click",
        "qr_scan",
        "order_placed",
        "review_submitted",
        "favorite_added",
        "share_click",
        "search_used",
      ] as const;

      for (const eventType of eventTypes) {
        vi.clearAllMocks();
        mockRateLimit.mockReturnValue({ success: true, remaining: 99 });
        mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
        mockExecuteRaw.mockResolvedValue(1 as never);

        await expect(
          caller.trackEvent({
            menuId: menu.id,
            eventType,
            sessionId: `session-${eventType}`,
          }),
        ).resolves.toEqual({ success: true });
      }
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.trackEvent({
          menuId: VALID_UUID,
          eventType: "menu_view",
          sessionId: "session-123",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.trackEvent({
          menuId: VALID_UUID,
          eventType: "menu_view",
          sessionId: "spam-session",
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      // Should not check menu when rate limited
      expect(mockMenus.findFirst).not.toHaveBeenCalled();
    });

    it("should throw INTERNAL_SERVER_ERROR when insert fails", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockExecuteRaw.mockRejectedValue(new Error("DB connection lost"));

      await expect(
        caller.trackEvent({
          menuId: menu.id,
          eventType: "menu_view",
          sessionId: "session-123",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to record analytics event",
      });
    });

    // -- Input validation --

    it("should reject invalid event type", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.trackEvent({
          menuId: VALID_UUID,
          eventType: "invalid_event" as never,
          sessionId: "session-123",
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID menuId", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.trackEvent({
          menuId: "not-a-uuid",
          eventType: "menu_view",
          sessionId: "session-123",
        }),
      ).rejects.toThrow();
    });

    it("should reject sessionId exceeding 100 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.trackEvent({
          menuId: VALID_UUID,
          eventType: "menu_view",
          sessionId: "A".repeat(101),
        }),
      ).rejects.toThrow();
    });

    it("should reject referrer exceeding 500 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.trackEvent({
          menuId: VALID_UUID,
          eventType: "menu_view",
          sessionId: "session-123",
          referrer: "https://example.com/" + "a".repeat(500),
        }),
      ).rejects.toThrow();
    });

    it("should accept event without optional referrer and eventData", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockExecuteRaw.mockResolvedValue(1 as never);

      await expect(
        caller.trackEvent({
          menuId: menu.id,
          eventType: "qr_scan",
          sessionId: "session-minimal",
        }),
      ).resolves.toEqual({ success: true });
    });
  });

  // =========================================================================
  // getDashboard (private procedure)
  // =========================================================================

  describe("getDashboard", () => {
    it("should return full dashboard analytics", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);

      // Total views
      mockQueryRaw
        .mockResolvedValueOnce([{ count: BigInt(150) }]) // views
        .mockResolvedValueOnce([{ count: BigInt(80) }])  // unique visitors
        .mockResolvedValueOnce([{ count: BigInt(12) }])  // orders
        .mockResolvedValueOnce([                          // viewsByDay
          { date: new Date("2025-03-14"), count: BigInt(75) },
          { date: new Date("2025-03-15"), count: BigInt(75) },
        ])
        .mockResolvedValueOnce([                          // topDishes
          { dish_name: "Lamb Tagine", clicks: BigInt(45), orders: BigInt(8) },
          { dish_name: "Couscous", clicks: BigInt(30), orders: BigInt(4) },
        ])
        .mockResolvedValueOnce([                          // topReferrers
          { referrer: "Direct", count: BigInt(60) },
          { referrer: "https://google.com", count: BigInt(40) },
        ])
        .mockResolvedValueOnce([                          // deviceBreakdown (SQL aggregated)
          { device_type: "mobile", count: BigInt(1) },
          { device_type: "desktop", count: BigInt(1) },
          { device_type: "tablet", count: BigInt(1) },
        ])
        .mockResolvedValueOnce([                          // peakHours
          { hour: 12, count: BigInt(30) },
          { hour: 19, count: BigInt(45) },
        ]);

      const result = await caller.getDashboard({
        menuId: menu.id,
        period: "7d",
      });

      expect(result.totalViews).toBe(150);
      expect(result.uniqueVisitors).toBe(80);
      expect(result.totalOrders).toBe(12);
      expect(result.conversionRate).toBe(8); // 12/150 * 100 = 8.00
      expect(result.viewsByDay).toHaveLength(2);
      expect(result.viewsByDay[0]!.date).toBe("2025-03-14");
      expect(result.viewsByDay[0]!.count).toBe(75);
      expect(result.topDishes).toHaveLength(2);
      expect(result.topDishes[0]!.dishName).toBe("Lamb Tagine");
      expect(result.topDishes[0]!.clicks).toBe(45);
      expect(result.topDishes[0]!.orders).toBe(8);
      expect(result.topReferrers).toHaveLength(2);
      expect(result.deviceBreakdown.mobile).toBe(1);
      expect(result.deviceBreakdown.desktop).toBe(1);
      expect(result.deviceBreakdown.tablet).toBe(1);
      expect(result.peakHours).toHaveLength(2);
      expect(result.peakHours[0]!.hour).toBe(12);
    });

    it("should return zeros when no analytics data", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw
        .mockResolvedValueOnce([{ count: BigInt(0) }])   // views
        .mockResolvedValueOnce([{ count: BigInt(0) }])   // unique visitors
        .mockResolvedValueOnce([{ count: BigInt(0) }])   // orders
        .mockResolvedValueOnce([])                        // viewsByDay
        .mockResolvedValueOnce([])                        // topDishes
        .mockResolvedValueOnce([])                        // topReferrers
        .mockResolvedValueOnce([])                        // deviceBreakdown (SQL aggregated)
        .mockResolvedValueOnce([]);                       // peakHours

      const result = await caller.getDashboard({
        menuId: menu.id,
        period: "today",
      });

      expect(result.totalViews).toBe(0);
      expect(result.uniqueVisitors).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.conversionRate).toBe(0);
      expect(result.viewsByDay).toEqual([]);
      expect(result.topDishes).toEqual([]);
      expect(result.topReferrers).toEqual([]);
      expect(result.deviceBreakdown).toEqual({ mobile: 0, desktop: 0, tablet: 0 });
      expect(result.peakHours).toEqual([]);
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getDashboard({ menuId: VALID_UUID, period: "7d" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when user does not own menu", async () => {
      const attacker = createUser();
      const menu = createMenu();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue({ userId: "different-owner" } as never);

      await expect(
        caller.getDashboard({ menuId: menu.id, period: "7d" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR on query failure", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockRejectedValue(new Error("Connection timeout"));

      await expect(
        caller.getDashboard({ menuId: menu.id, period: "7d" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load analytics dashboard data",
      });
    });

    it("should accept all valid period values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const periods = ["today", "7d", "30d", "90d", "all"] as const;

      for (const period of periods) {
        vi.clearAllMocks();
        mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
        // 8 queryRaw calls per getDashboard invocation
        for (let i = 0; i < 8; i++) {
          mockQueryRaw.mockResolvedValueOnce(
            i === 0 || i === 1 || i === 2
              ? [{ count: BigInt(0) }]
              : [],
          );
        }

        await expect(
          caller.getDashboard({ menuId: menu.id, period }),
        ).resolves.toBeDefined();
      }
    });

    it("should calculate conversion rate correctly", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw
        .mockResolvedValueOnce([{ count: BigInt(200) }])  // views
        .mockResolvedValueOnce([{ count: BigInt(100) }])  // unique visitors
        .mockResolvedValueOnce([{ count: BigInt(15) }])   // orders
        .mockResolvedValueOnce([])                         // viewsByDay
        .mockResolvedValueOnce([])                         // topDishes
        .mockResolvedValueOnce([])                         // topReferrers
        .mockResolvedValueOnce([])                         // deviceRows
        .mockResolvedValueOnce([]);                        // peakHours

      const result = await caller.getDashboard({
        menuId: menu.id,
        period: "30d",
      });

      // 15/200 * 100 = 7.50
      expect(result.conversionRate).toBe(7.5);
    });

    it("should return 0 conversion rate when no views", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw
        .mockResolvedValueOnce([{ count: BigInt(0) }])  // views = 0
        .mockResolvedValueOnce([{ count: BigInt(0) }])  // unique visitors
        .mockResolvedValueOnce([{ count: BigInt(5) }])  // orders (somehow)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await caller.getDashboard({
        menuId: menu.id,
        period: "7d",
      });

      expect(result.conversionRate).toBe(0);
    });
  });

  // =========================================================================
  // getConversionFunnel (private procedure)
  // =========================================================================

  describe("getConversionFunnel", () => {
    it("should return funnel steps with drop-off percentages", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);

      // Total event counts by type
      mockQueryRaw
        .mockResolvedValueOnce([
          { event_type: "menu_view", count: BigInt(1000) },
          { event_type: "dish_click", count: BigInt(400) },
          { event_type: "order_placed", count: BigInt(50) },
        ])
        // Unique session counts by type
        .mockResolvedValueOnce([
          { event_type: "menu_view", unique_sessions: BigInt(500) },
          { event_type: "dish_click", unique_sessions: BigInt(200) },
          { event_type: "order_placed", unique_sessions: BigInt(25) },
        ]);

      const result = await caller.getConversionFunnel({
        menuId: menu.id,
        period: "30d",
      });

      expect(result.steps).toHaveLength(3);

      // Step 1: Menu Views
      expect(result.steps[0]!.name).toBe("Menu Views");
      expect(result.steps[0]!.totalEvents).toBe(1000);
      expect(result.steps[0]!.uniqueSessions).toBe(500);
      expect(result.steps[0]!.dropOffPercent).toBe(0); // First step, no drop-off

      // Step 2: Dish Clicks
      expect(result.steps[1]!.name).toBe("Dish Clicks");
      expect(result.steps[1]!.totalEvents).toBe(400);
      expect(result.steps[1]!.uniqueSessions).toBe(200);
      // Drop-off from views: (1 - 200/500) * 100 = 60.00
      expect(result.steps[1]!.dropOffPercent).toBe(60);

      // Step 3: Orders
      expect(result.steps[2]!.name).toBe("Orders Placed");
      expect(result.steps[2]!.totalEvents).toBe(50);
      expect(result.steps[2]!.uniqueSessions).toBe(25);
      // Drop-off from clicks: (1 - 25/200) * 100 = 87.50
      expect(result.steps[2]!.dropOffPercent).toBe(87.5);

      // Overall: 25/500 * 100 = 5.00
      expect(result.overallConversionRate).toBe(5);
    });

    it("should return zero drop-offs when no data", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw
        .mockResolvedValueOnce([])  // No funnel rows
        .mockResolvedValueOnce([]); // No unique steps

      const result = await caller.getConversionFunnel({
        menuId: menu.id,
        period: "today",
      });

      expect(result.steps[0]!.totalEvents).toBe(0);
      expect(result.steps[0]!.uniqueSessions).toBe(0);
      expect(result.steps[1]!.dropOffPercent).toBe(0);
      expect(result.steps[2]!.dropOffPercent).toBe(0);
      expect(result.overallConversionRate).toBe(0);
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getConversionFunnel({ menuId: VALID_UUID, period: "7d" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when user does not own menu", async () => {
      const attacker = createUser();
      const menu = createMenu();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue({ userId: "different-owner" } as never);

      await expect(
        caller.getConversionFunnel({ menuId: menu.id, period: "7d" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR on query failure", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockRejectedValue(new Error("Query timeout"));

      await expect(
        caller.getConversionFunnel({ menuId: menu.id, period: "7d" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load conversion funnel data",
      });
    });
  });

  // =========================================================================
  // getMenuViewsOverTime (private procedure)
  // =========================================================================

  describe("getMenuViewsOverTime", () => {
    it("should return views aggregated by day", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockResolvedValue([
        { bucket: new Date("2025-03-13T00:00:00Z"), count: BigInt(42) },
        { bucket: new Date("2025-03-14T00:00:00Z"), count: BigInt(58) },
        { bucket: new Date("2025-03-15T00:00:00Z"), count: BigInt(33) },
      ]);

      const result = await caller.getMenuViewsOverTime({
        menuId: menu.id,
        period: "7d",
        granularity: "day",
      });

      expect(result).toHaveLength(3);
      expect(result[0]!.bucket).toBe("2025-03-13T00:00:00.000Z");
      expect(result[0]!.count).toBe(42);
      expect(result[1]!.count).toBe(58);
      expect(result[2]!.count).toBe(33);
    });

    it("should return empty array when no views", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockResolvedValue([]);

      const result = await caller.getMenuViewsOverTime({
        menuId: menu.id,
        period: "today",
        granularity: "hour",
      });

      expect(result).toEqual([]);
    });

    it("should accept all granularity values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const granularities = ["hour", "day", "week", "month"] as const;

      for (const granularity of granularities) {
        vi.clearAllMocks();
        mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
        mockQueryRaw.mockResolvedValue([]);

        await expect(
          caller.getMenuViewsOverTime({
            menuId: menu.id,
            period: "30d",
            granularity,
          }),
        ).resolves.toBeDefined();
      }
    });

    it("should throw FORBIDDEN when user does not own menu", async () => {
      const attacker = createUser();
      const menu = createMenu();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue({ userId: "different-owner" } as never);

      await expect(
        caller.getMenuViewsOverTime({
          menuId: menu.id,
          period: "7d",
          granularity: "day",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR on query failure", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockRejectedValue(new Error("Connection lost"));

      await expect(
        caller.getMenuViewsOverTime({
          menuId: menu.id,
          period: "7d",
          granularity: "day",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load menu views data",
      });
    });
  });

  // =========================================================================
  // getPopularDishes (private procedure)
  // =========================================================================

  describe("getPopularDishes", () => {
    it("should return popular dishes with clicks and orders", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockResolvedValue([
        { dish_name: "Lamb Tagine", clicks: BigInt(120), orders: BigInt(30) },
        { dish_name: "Couscous Royale", clicks: BigInt(85), orders: BigInt(20) },
        { dish_name: "Harira Soup", clicks: BigInt(60), orders: BigInt(15) },
      ]);

      const result = await caller.getPopularDishes({
        menuId: menu.id,
        period: "30d",
      });

      expect(result).toHaveLength(3);
      expect(result[0]!.dishName).toBe("Lamb Tagine");
      expect(result[0]!.clicks).toBe(120);
      expect(result[0]!.orders).toBe(30);
    });

    it("should return empty array when no dish clicks", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockResolvedValue([]);

      const result = await caller.getPopularDishes({
        menuId: menu.id,
        period: "today",
      });

      expect(result).toEqual([]);
    });

    it("should use default limit of 10", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockResolvedValue([]);

      await caller.getPopularDishes({
        menuId: menu.id,
        period: "7d",
      });

      // The queryRaw is called with a Prisma.sql template, just verify it's called
      expect(mockQueryRaw).toHaveBeenCalled();
    });

    it("should reject limit below 1", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getPopularDishes({
          menuId: VALID_UUID,
          period: "7d",
          limit: 0,
        }),
      ).rejects.toThrow();
    });

    it("should reject limit above 50", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getPopularDishes({
          menuId: VALID_UUID,
          period: "7d",
          limit: 51,
        }),
      ).rejects.toThrow();
    });

    it("should throw FORBIDDEN when user does not own menu", async () => {
      const attacker = createUser();
      const menu = createMenu();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue({ userId: "different-owner" } as never);

      await expect(
        caller.getPopularDishes({
          menuId: menu.id,
          period: "7d",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR on query failure", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockRejectedValue(new Error("Query failed"));

      await expect(
        caller.getPopularDishes({
          menuId: menu.id,
          period: "7d",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load popular dishes data",
      });
    });
  });

  // =========================================================================
  // getQRScanStats (private procedure)
  // =========================================================================

  describe("getQRScanStats", () => {
    it("should return QR scan statistics", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw
        .mockResolvedValueOnce([{ count: BigInt(250) }])    // totalScans
        .mockResolvedValueOnce([{ count: BigInt(180) }])    // uniqueScanners
        .mockResolvedValueOnce([                             // scansByDay
          { date: new Date("2025-03-14"), count: BigInt(120) },
          { date: new Date("2025-03-15"), count: BigInt(130) },
        ])
        .mockResolvedValueOnce([                             // scansByLocation
          { location: "Main Hall", table_number: "1", count: BigInt(50) },
          { location: "Terrace", table_number: "5", count: BigInt(30) },
        ]);

      const result = await caller.getQRScanStats({
        menuId: menu.id,
        period: "7d",
      });

      expect(result.totalScans).toBe(250);
      expect(result.uniqueScanners).toBe(180);
      expect(result.scansByDay).toHaveLength(2);
      expect(result.scansByDay[0]!.date).toBe("2025-03-14");
      expect(result.scansByDay[0]!.count).toBe(120);
      expect(result.scansByLocation).toHaveLength(2);
      expect(result.scansByLocation[0]!.location).toBe("Main Hall");
      expect(result.scansByLocation[0]!.tableNumber).toBe("1");
      expect(result.scansByLocation[0]!.count).toBe(50);
    });

    it("should return zeros and empty arrays when no QR scans", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw
        .mockResolvedValueOnce([{ count: BigInt(0) }])   // totalScans
        .mockResolvedValueOnce([{ count: BigInt(0) }])   // uniqueScanners
        .mockResolvedValueOnce([])                        // scansByDay
        .mockResolvedValueOnce([]);                       // scansByLocation

      const result = await caller.getQRScanStats({
        menuId: menu.id,
        period: "today",
      });

      expect(result.totalScans).toBe(0);
      expect(result.uniqueScanners).toBe(0);
      expect(result.scansByDay).toEqual([]);
      expect(result.scansByLocation).toEqual([]);
    });

    it("should handle empty queryRaw result for totalScans", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw
        .mockResolvedValueOnce([])   // totalScans empty array
        .mockResolvedValueOnce([])   // uniqueScanners empty array
        .mockResolvedValueOnce([])   // scansByDay
        .mockResolvedValueOnce([]);  // scansByLocation

      const result = await caller.getQRScanStats({
        menuId: menu.id,
        period: "7d",
      });

      expect(result.totalScans).toBe(0);
      expect(result.uniqueScanners).toBe(0);
    });

    it("should throw FORBIDDEN when user does not own menu", async () => {
      const attacker = createUser();
      const menu = createMenu();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue({ userId: "different-owner" } as never);

      await expect(
        caller.getQRScanStats({
          menuId: menu.id,
          period: "7d",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR on query failure", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ userId: owner.id } as never);
      mockQueryRaw.mockRejectedValue(new Error("DB error"));

      await expect(
        caller.getQRScanStats({
          menuId: menu.id,
          period: "7d",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load QR scan statistics",
      });
    });
  });

  // =========================================================================
  // getLocationComparison (private procedure)
  // =========================================================================

  describe("getLocationComparison", () => {
    it("should return comparison data for owned menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([
        { id: "menu-1", name: "Casablanca Branch" },
        { id: "menu-2", name: "Marrakech Branch" },
      ] as never);
      mockQueryRaw.mockResolvedValue([
        {
          location_id: "menu-1",
          total_events: BigInt(500),
          views: BigInt(300),
          clicks: BigInt(150),
          orders: BigInt(30),
        },
        {
          location_id: "menu-2",
          total_events: BigInt(300),
          views: BigInt(200),
          clicks: BigInt(80),
          orders: BigInt(10),
        },
      ]);

      const result = await caller.getLocationComparison({
        restaurantId: owner.id,
        period: "30d",
      });

      expect(result).toHaveLength(2);
      expect(result[0]!.menuId).toBe("menu-1");
      expect(result[0]!.menuName).toBe("Casablanca Branch");
      expect(result[0]!.views).toBe(300);
      expect(result[0]!.orders).toBe(30);
      // Conversion: 30/300 * 100 = 10.00
      expect(result[0]!.conversionRate).toBe(10);
    });

    it("should return empty array when user has no menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.getLocationComparison({
        restaurantId: owner.id,
        period: "7d",
      });

      expect(result).toEqual([]);
    });

    it("should throw FORBIDDEN when restaurantId does not match user", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);
      // Must be a valid UUID to pass Zod validation
      const differentUserId = "00000000-0000-4000-a000-999999999999";

      await expect(
        caller.getLocationComparison({
          restaurantId: differentUserId,
          period: "7d",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    });

    it("should calculate 0 conversion rate when no views", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([
        { id: "menu-1", name: "Empty Menu" },
      ] as never);
      mockQueryRaw.mockResolvedValue([
        {
          location_id: "menu-1",
          total_events: BigInt(0),
          views: BigInt(0),
          clicks: BigInt(0),
          orders: BigInt(0),
        },
      ]);

      const result = await caller.getLocationComparison({
        restaurantId: owner.id,
        period: "all",
      });

      expect(result[0]!.conversionRate).toBe(0);
    });
  });
});

// =========================================================================
// Shared helpers (unit tests)
// =========================================================================

describe("analytics shared helpers", () => {
  describe("getStartDate", () => {
    it("should return start of today for 'today'", () => {
      const result = getStartDate("today");
      const now = new Date();

      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(now.getFullYear());
      expect(result!.getMonth()).toBe(now.getMonth());
      expect(result!.getDate()).toBe(now.getDate());
      expect(result!.getHours()).toBe(0);
      expect(result!.getMinutes()).toBe(0);
      expect(result!.getSeconds()).toBe(0);
    });

    it("should return 7 days ago for '7d'", () => {
      const result = getStartDate("7d");
      const now = new Date();
      const expectedMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

      expect(result).not.toBeNull();
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(result!.getTime() - expectedMs)).toBeLessThan(1000);
    });

    it("should return 30 days ago for '30d'", () => {
      const result = getStartDate("30d");
      const now = new Date();
      const expectedMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;

      expect(result).not.toBeNull();
      expect(Math.abs(result!.getTime() - expectedMs)).toBeLessThan(1000);
    });

    it("should return 90 days ago for '90d'", () => {
      const result = getStartDate("90d");
      const now = new Date();
      const expectedMs = now.getTime() - 90 * 24 * 60 * 60 * 1000;

      expect(result).not.toBeNull();
      expect(Math.abs(result!.getTime() - expectedMs)).toBeLessThan(1000);
    });

    it("should return null for 'all'", () => {
      const result = getStartDate("all");

      expect(result).toBeNull();
    });
  });

  describe("hashIp", () => {
    it("should return a hex string", () => {
      const result = hashIp("192.168.1.1");

      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should return deterministic output for same input", () => {
      const first = hashIp("10.0.0.1");
      const second = hashIp("10.0.0.1");

      expect(first).toBe(second);
    });

    it("should return different hashes for different IPs", () => {
      const a = hashIp("192.168.1.1");
      const b = hashIp("192.168.1.2");

      expect(a).not.toBe(b);
    });

    it("should handle unknown IP", () => {
      const result = hashIp("unknown");

      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("classifyDevice", () => {
    it("should classify iPhone user-agent as mobile", () => {
      expect(
        classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"),
      ).toBe("mobile");
    });

    it("should classify Android mobile user-agent as mobile", () => {
      expect(
        classifyDevice("Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Mobile"),
      ).toBe("mobile");
    });

    it("should classify iPad user-agent as tablet", () => {
      expect(
        classifyDevice("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)"),
      ).toBe("tablet");
    });

    it("should classify Windows desktop user-agent as desktop", () => {
      expect(
        classifyDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
      ).toBe("desktop");
    });

    it("should classify null user-agent as desktop", () => {
      expect(classifyDevice(null)).toBe("desktop");
    });

    it("should classify empty string as desktop", () => {
      expect(classifyDevice("")).toBe("desktop");
    });

    it("should classify Silk browser as tablet", () => {
      expect(
        classifyDevice("Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Silk/93.1"),
      ).toBe("tablet");
    });

    it("should classify BlackBerry as mobile", () => {
      expect(
        classifyDevice("Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)"),
      ).toBe("mobile");
    });
  });
});
