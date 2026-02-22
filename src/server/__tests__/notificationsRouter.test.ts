import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the notifications tRPC router.
 * Covers getNotifications (pagination, order/review merging, sorting),
 * getUnreadCount (pending orders + reviews), markAsRead (order confirm,
 * review approve, IDOR protection), markAllAsRead (bulk status update),
 * and edge cases (no menus, empty results).
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findMany: vi.fn(),
    },
    orders: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    reviews: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { notificationsRouter } from "../api/routers/notifications";
import {
  createMenu,
  createOrder,
  createReview,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPrivateCaller(userId: string) {
  return notificationsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const USER_ID = "00000000-0000-4000-a000-000000000099";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("notificationsRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockOrders = vi.mocked(db.orders);
  const mockReviews = vi.mocked(db.reviews);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // getNotifications
  // =========================================================================

  describe("getNotifications", () => {
    it("should return empty notifications when user has no menus", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications).toEqual([]);
      expect(mockOrders.findMany).not.toHaveBeenCalled();
      expect(mockReviews.findMany).not.toHaveBeenCalled();
    });

    it("should merge orders and reviews into notifications", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);
      const now = new Date();

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const order = createOrder({
        menuId: menu.id,
        status: "pending",
        createdAt: new Date(now.getTime() - 1000),
      });
      const review = createReview({
        menuId: menu.id,
        status: "pending",
        rating: 5,
        comment: "Amazing food!",
        createdAt: now,
      });

      mockOrders.findMany.mockResolvedValue([order] as never);
      mockReviews.findMany.mockResolvedValue([review] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications).toHaveLength(2);

      // Review is more recent, should be first
      expect(result.notifications[0]!.type).toBe("review");
      expect(result.notifications[1]!.type).toBe("order");
    });

    it("should format order notifications correctly", async () => {
      const menu = createMenu({ userId: USER_ID, name: "Riad Casablanca" });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const order = createOrder({
        menuId: menu.id,
        orderNumber: 42,
        totalAmount: 8500,
        currency: "MAD",
        customerName: "Ahmed Tazi",
        status: "pending",
      });

      mockOrders.findMany.mockResolvedValue([order] as never);
      mockReviews.findMany.mockResolvedValue([] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications).toHaveLength(1);
      const notif = result.notifications[0]!;

      expect(notif.id).toBe(`order-${order.id}`);
      expect(notif.type).toBe("order");
      expect(notif.title).toBe("Order #42");
      expect(notif.description).toBe("Ahmed Tazi - 85.00 MAD");
      expect(notif.menuName).toBe("Riad Casablanca");
      expect(notif.isRead).toBe(false); // pending = unread
      expect(notif.link).toBe("/dashboard/orders");
    });

    it("should format review notifications correctly", async () => {
      const menu = createMenu({ userId: USER_ID, name: "Atlas Grill" });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const review = createReview({
        menuId: menu.id,
        rating: 4,
        comment: "Great tagine, will come back!",
        status: "approved",
      });

      mockOrders.findMany.mockResolvedValue([] as never);
      mockReviews.findMany.mockResolvedValue([review] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications).toHaveLength(1);
      const notif = result.notifications[0]!;

      expect(notif.id).toBe(`review-${review.id}`);
      expect(notif.type).toBe("review");
      expect(notif.title).toBe("\u2605\u2605\u2605\u2605 Review");
      expect(notif.description).toBe("Great tagine, will come back!");
      expect(notif.menuName).toBe("Atlas Grill");
      expect(notif.isRead).toBe(true); // approved = read
      expect(notif.link).toBe("/dashboard/reviews");
    });

    it("should mark pending orders as unread and confirmed as read", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const pendingOrder = createOrder({ menuId: menu.id, status: "pending" });
      const confirmedOrder = createOrder({ menuId: menu.id, status: "confirmed" });

      mockOrders.findMany.mockResolvedValue([pendingOrder, confirmedOrder] as never);
      mockReviews.findMany.mockResolvedValue([] as never);

      const result = await caller.getNotifications({ limit: 20 });

      const pending = result.notifications.find((n) => n.id === `order-${pendingOrder.id}`);
      const confirmed = result.notifications.find((n) => n.id === `order-${confirmedOrder.id}`);

      expect(pending!.isRead).toBe(false);
      expect(confirmed!.isRead).toBe(true);
    });

    it("should respect the limit parameter", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      // Generate more notifications than limit
      const orders = Array.from({ length: 5 }, (_, i) =>
        createOrder({
          menuId: menu.id,
          createdAt: new Date(Date.now() - i * 1000),
        }),
      );
      const reviews = Array.from({ length: 5 }, (_, i) =>
        createReview({
          menuId: menu.id,
          createdAt: new Date(Date.now() - i * 500),
        }),
      );

      mockOrders.findMany.mockResolvedValue(orders as never);
      mockReviews.findMany.mockResolvedValue(reviews as never);

      const result = await caller.getNotifications({ limit: 3 });

      expect(result.notifications.length).toBeLessThanOrEqual(3);
    });

    it("should sort notifications by createdAt descending", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const oldest = createOrder({
        menuId: menu.id,
        createdAt: new Date("2025-01-01T10:00:00Z"),
      });
      const middle = createReview({
        menuId: menu.id,
        createdAt: new Date("2025-01-01T12:00:00Z"),
      });
      const newest = createOrder({
        menuId: menu.id,
        createdAt: new Date("2025-01-01T14:00:00Z"),
      });

      mockOrders.findMany.mockResolvedValue([oldest, newest] as never);
      mockReviews.findMany.mockResolvedValue([middle] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications[0]!.createdAt.getTime()).toBeGreaterThanOrEqual(
        result.notifications[1]!.createdAt.getTime(),
      );
      expect(result.notifications[1]!.createdAt.getTime()).toBeGreaterThanOrEqual(
        result.notifications[2]!.createdAt.getTime(),
      );
    });

    it("should use 'Customer' as fallback when customerName is null on order", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const order = createOrder({
        menuId: menu.id,
        customerName: null,
        totalAmount: 5000,
        currency: "MAD",
      });

      mockOrders.findMany.mockResolvedValue([order] as never);
      mockReviews.findMany.mockResolvedValue([] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications[0]!.description).toContain("Customer");
    });

    it("should truncate long review comments to 80 chars", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const longComment = "A".repeat(200);
      const review = createReview({
        menuId: menu.id,
        comment: longComment,
      });

      mockOrders.findMany.mockResolvedValue([] as never);
      mockReviews.findMany.mockResolvedValue([review] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications[0]!.description.length).toBeLessThanOrEqual(80);
    });

    it("should reject limit below 1", async () => {
      const caller = createPrivateCaller(USER_ID);

      await expect(
        caller.getNotifications({ limit: 0 }),
      ).rejects.toThrow();
    });

    it("should reject limit above 50", async () => {
      const caller = createPrivateCaller(USER_ID);

      await expect(
        caller.getNotifications({ limit: 51 }),
      ).rejects.toThrow();
    });

    it("should handle order amount formatting correctly", async () => {
      const menu = createMenu({ userId: USER_ID, name: "Test Menu" });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const order = createOrder({
        menuId: menu.id,
        totalAmount: 12345, // 123.45 MAD
        currency: "MAD",
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      });

      mockOrders.findMany.mockResolvedValue([order] as never);
      mockReviews.findMany.mockResolvedValue([] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications[0]!.description).toContain("123.45 MAD");
    });

    it("should use fallback when review has no comment and no customer name", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      const review = createReview({
        menuId: menu.id,
        customerName: null,
        rating: 3,
        comment: null,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      });

      mockOrders.findMany.mockResolvedValue([] as never);
      mockReviews.findMany.mockResolvedValue([review] as never);

      const result = await caller.getNotifications({ limit: 20 });

      expect(result.notifications[0]!.description).toContain("Anonymous left a 3-star review");
    });

    it("should render correct number of stars in review title", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu.id, name: menu.name },
      ] as never);

      // Create reviews with different ratings
      // Note: Reviews are sorted by createdAt desc, so 5-star (oldest) comes last
      const reviews = [
        createReview({
          menuId: menu.id,
          rating: 5,
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
        }),
        createReview({
          menuId: menu.id,
          rating: 4,
          createdAt: new Date(Date.now() - 4 * 60 * 1000),
        }),
        createReview({
          menuId: menu.id,
          rating: 3,
          createdAt: new Date(Date.now() - 3 * 60 * 1000),
        }),
        createReview({
          menuId: menu.id,
          rating: 2,
          createdAt: new Date(Date.now() - 2 * 60 * 1000),
        }),
        createReview({
          menuId: menu.id,
          rating: 1,
          createdAt: new Date(Date.now() - 1 * 60 * 1000),
        }),
      ];

      mockOrders.findMany.mockResolvedValue([] as never);
      mockReviews.findMany.mockResolvedValue(reviews as never);

      const result = await caller.getNotifications({ limit: 20 });

      // Results are sorted by createdAt desc, so 1-star (newest) comes first
      expect(result.notifications[0]!.title).toBe("\u2605 Review");
      expect(result.notifications[1]!.title).toBe("\u2605\u2605 Review");
      expect(result.notifications[2]!.title).toBe("\u2605\u2605\u2605 Review");
      expect(result.notifications[3]!.title).toBe("\u2605\u2605\u2605\u2605 Review");
      expect(result.notifications[4]!.title).toBe("\u2605\u2605\u2605\u2605\u2605 Review");
    });
  });

  // =========================================================================
  // getUnreadCount
  // =========================================================================

  describe("getUnreadCount", () => {
    it("should return 0 when user has no menus", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([] as never);

      const result = await caller.getUnreadCount();

      expect(result.count).toBe(0);
    });

    it("should sum pending orders and pending reviews", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.count.mockResolvedValue(3 as never);
      mockReviews.count.mockResolvedValue(2 as never);

      const result = await caller.getUnreadCount();

      expect(result.count).toBe(5);
    });

    it("should return 0 when no pending orders or reviews exist", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.count.mockResolvedValue(0 as never);
      mockReviews.count.mockResolvedValue(0 as never);

      const result = await caller.getUnreadCount();

      expect(result.count).toBe(0);
    });

    it("should query only menus belonging to the user", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.getUnreadCount();

      expect(mockMenus.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        select: { id: true },
      });
    });

    it("should only count notifications from the last 24 hours", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.count.mockResolvedValue(0 as never);
      mockReviews.count.mockResolvedValue(0 as never);

      await caller.getUnreadCount();

      const ordersCall = mockOrders.count.mock.calls[0]![0];
      const reviewsCall = mockReviews.count.mock.calls[0]![0];

      // Verify the createdAt filter is set
      const ordersDate = (ordersCall?.where?.createdAt as { gte?: Date })?.gte;
      const reviewsDate = (reviewsCall?.where?.createdAt as { gte?: Date })?.gte;

      expect(ordersDate).toBeInstanceOf(Date);
      expect(reviewsDate).toBeInstanceOf(Date);

      // Verify it's roughly 24 hours ago (allow 1 second variance)
      const expectedTime = Date.now() - 24 * 60 * 60 * 1000;
      const actualTime = ordersDate?.getTime() ?? 0;

      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
    });
  });

  // =========================================================================
  // markAsRead
  // =========================================================================

  describe("markAsRead", () => {
    it("should confirm a pending order when notification is order type", async () => {
      const menu = createMenu({ userId: USER_ID });
      const order = createOrder({ menuId: menu.id, status: "pending" });
      const caller = createPrivateCaller(USER_ID);

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        menus: { userId: USER_ID },
      } as never);
      mockOrders.update.mockResolvedValue({ ...order, status: "confirmed" } as never);

      const result = await caller.markAsRead({
        notificationId: `order-${order.id}`,
      });

      expect(result.success).toBe(true);
      expect(mockOrders.update).toHaveBeenCalledWith({
        where: { id: order.id },
        data: expect.objectContaining({ status: "confirmed" }),
      });
    });

    it("should approve a pending review when notification is review type", async () => {
      const menu = createMenu({ userId: USER_ID });
      const review = createReview({ menuId: menu.id, status: "pending" });
      const caller = createPrivateCaller(USER_ID);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: USER_ID },
      } as never);
      mockReviews.update.mockResolvedValue({ ...review, status: "approved" } as never);

      const result = await caller.markAsRead({
        notificationId: `review-${review.id}`,
      });

      expect(result.success).toBe(true);
      expect(mockReviews.update).toHaveBeenCalledWith({
        where: { id: review.id },
        data: expect.objectContaining({ status: "approved" }),
      });
    });

    it("should not update order if user does not own the menu (IDOR)", async () => {
      const order = createOrder({ status: "pending" });
      const caller = createPrivateCaller(USER_ID);

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        menus: { userId: "other-user-id" },
      } as never);

      const result = await caller.markAsRead({
        notificationId: `order-${order.id}`,
      });

      expect(result.success).toBe(true);
      expect(mockOrders.update).not.toHaveBeenCalled();
    });

    it("should not update review if user does not own the menu (IDOR)", async () => {
      const review = createReview({ status: "pending" });
      const caller = createPrivateCaller(USER_ID);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: "other-user-id" },
      } as never);

      const result = await caller.markAsRead({
        notificationId: `review-${review.id}`,
      });

      expect(result.success).toBe(true);
      expect(mockReviews.update).not.toHaveBeenCalled();
    });

    it("should not update order that is already confirmed", async () => {
      const order = createOrder({ status: "confirmed" });
      const caller = createPrivateCaller(USER_ID);

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        menus: { userId: USER_ID },
      } as never);

      const result = await caller.markAsRead({
        notificationId: `order-${order.id}`,
      });

      expect(result.success).toBe(true);
      expect(mockOrders.update).not.toHaveBeenCalled();
    });

    it("should succeed silently for unknown notification ID prefix", async () => {
      const caller = createPrivateCaller(USER_ID);

      const result = await caller.markAsRead({
        notificationId: "unknown-123",
      });

      expect(result.success).toBe(true);
      expect(mockOrders.findUnique).not.toHaveBeenCalled();
      expect(mockReviews.findUnique).not.toHaveBeenCalled();
    });

    it("should succeed silently when order is not found", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockOrders.findUnique.mockResolvedValue(null as never);

      const result = await caller.markAsRead({
        notificationId: "order-nonexistent",
      });

      expect(result.success).toBe(true);
      expect(mockOrders.update).not.toHaveBeenCalled();
    });

    it("should succeed silently when review is not found", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockReviews.findUnique.mockResolvedValue(null as never);

      const result = await caller.markAsRead({
        notificationId: "review-nonexistent",
      });

      expect(result.success).toBe(true);
      expect(mockReviews.update).not.toHaveBeenCalled();
    });

    it("should reject notificationId exceeding 200 characters", async () => {
      const caller = createPrivateCaller(USER_ID);

      await expect(
        caller.markAsRead({
          notificationId: "order-" + "a".repeat(200),
        }),
      ).rejects.toThrow();
    });

    it("should update order with current timestamp", async () => {
      const menu = createMenu({ userId: USER_ID });
      const order = createOrder({ menuId: menu.id, status: "pending" });
      const caller = createPrivateCaller(USER_ID);

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        menus: { userId: USER_ID },
      } as never);
      mockOrders.update.mockResolvedValue({ ...order, status: "confirmed" } as never);

      await caller.markAsRead({
        notificationId: `order-${order.id}`,
      });

      expect(mockOrders.update).toHaveBeenCalledWith({
        where: { id: order.id },
        data: {
          status: "confirmed",
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should update review with current timestamp", async () => {
      const menu = createMenu({ userId: USER_ID });
      const review = createReview({ menuId: menu.id, status: "pending" });
      const caller = createPrivateCaller(USER_ID);

      mockReviews.findUnique.mockResolvedValue({
        ...review,
        menu: { userId: USER_ID },
      } as never);
      mockReviews.update.mockResolvedValue({ ...review, status: "approved" } as never);

      await caller.markAsRead({
        notificationId: `review-${review.id}`,
      });

      expect(mockReviews.update).toHaveBeenCalledWith({
        where: { id: review.id },
        data: {
          status: "approved",
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  // =========================================================================
  // markAllAsRead
  // =========================================================================

  describe("markAllAsRead", () => {
    it("should update all pending orders and reviews for user menus", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.updateMany.mockResolvedValue({ count: 3 } as never);
      mockReviews.updateMany.mockResolvedValue({ count: 2 } as never);

      const result = await caller.markAllAsRead();

      expect(result.success).toBe(true);
      expect(mockOrders.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: { in: [menu.id] },
            status: "pending",
          }),
          data: expect.objectContaining({ status: "confirmed" }),
        }),
      );
      expect(mockReviews.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: { in: [menu.id] },
            status: "pending",
          }),
          data: expect.objectContaining({ status: "approved" }),
        }),
      );
    });

    it("should return success when user has no menus", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([] as never);

      const result = await caller.markAllAsRead();

      expect(result.success).toBe(true);
      expect(mockOrders.updateMany).not.toHaveBeenCalled();
      expect(mockReviews.updateMany).not.toHaveBeenCalled();
    });

    it("should include all user menu IDs in the query", async () => {
      const menu1 = createMenu({ userId: USER_ID });
      const menu2 = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([
        { id: menu1.id },
        { id: menu2.id },
      ] as never);
      mockOrders.updateMany.mockResolvedValue({ count: 0 } as never);
      mockReviews.updateMany.mockResolvedValue({ count: 0 } as never);

      await caller.markAllAsRead();

      expect(mockOrders.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: { in: [menu1.id, menu2.id] },
          }),
        }),
      );
    });

    it("should only update notifications from the last 24 hours", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.updateMany.mockResolvedValue({ count: 0 } as never);
      mockReviews.updateMany.mockResolvedValue({ count: 0 } as never);

      await caller.markAllAsRead();

      const ordersCall = mockOrders.updateMany.mock.calls[0]![0];
      const reviewsCall = mockReviews.updateMany.mock.calls[0]![0];

      // Verify the createdAt filter is set
      const ordersDate = (ordersCall?.where?.createdAt as { gte?: Date })?.gte;
      const reviewsDate = (reviewsCall?.where?.createdAt as { gte?: Date })?.gte;

      expect(ordersDate).toBeInstanceOf(Date);
      expect(reviewsDate).toBeInstanceOf(Date);

      // Verify it's roughly 24 hours ago
      const expectedTime = Date.now() - 24 * 60 * 60 * 1000;
      const actualTime = ordersDate?.getTime() ?? 0;

      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
    });

    it("should update orders and reviews with current timestamp", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.updateMany.mockResolvedValue({ count: 5 } as never);
      mockReviews.updateMany.mockResolvedValue({ count: 3 } as never);

      await caller.markAllAsRead();

      expect(mockOrders.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: "confirmed",
            updatedAt: expect.any(Date),
          },
        }),
      );

      expect(mockReviews.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: "approved",
            updatedAt: expect.any(Date),
          },
        }),
      );
    });
  });
});
