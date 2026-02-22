import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the orders tRPC router.
 * Covers public order creation, status transitions, IDOR protection,
 * cursor-based pagination, order stats calculation, input validation
 * (Moroccan phone regex, quantity limits, item constraints).
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
      update: vi.fn(),
    },
    dishes: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    dishVariants: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    orders: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    orderItems: {
      groupBy: vi.fn(),
    },
    pushSubscriptions: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const { db: mockDb } = await import("~/server/db");

      return cb(mockDb);
    }),
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { ordersRouter } from "../api/routers/orders";
import {
  createUser,
  createMenu,
  createOrder,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return ordersRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return ordersRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

function validOrderInput(menuId: string) {
  return {
    menuId,
    customerName: "Ahmed Tazi",
    customerPhone: "+212612345678",
    tableNumber: "12",
    items: [
      {
        dishId: "00000000-0000-4000-a000-000000000001",
        dishName: "Lamb Tagine",
        quantity: 2,
        unitPrice: 3500,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ordersRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockOrders = vi.mocked(db.orders);
  const mockOrderItems = vi.mocked(db.orderItems);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 29 });
  });

  // =========================================================================
  // createOrder (public procedure)
  // =========================================================================

  describe("createOrder", () => {
    it("should create order with valid input", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.create.mockResolvedValue({
        id: "new-order-id",
        menuId: menu.id,
        totalAmount: 7000,
        currency: "MAD",
        customerName: "Ahmed Tazi",
        orderItems: [
          { dishName: "Lamb Tagine", quantity: 2, unitPrice: 3500, totalPrice: 7000 },
        ],
      } as never);

      const result = await caller.createOrder(validOrderInput(menu.id));

      expect(result.totalAmount).toBe(7000);
      expect(mockOrders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          menuId: menu.id,
          totalAmount: 7000,
          currency: "MAD",
          customerName: "Ahmed Tazi",
          customerPhone: "+212612345678",
          tableNumber: "12",
          orderItems: {
            create: [
              expect.objectContaining({
                dishName: "Lamb Tagine",
                quantity: 2,
                unitPrice: 3500,
                totalPrice: 7000,
              }),
            ],
          },
        }),
        include: { orderItems: true },
      });
    });

    it("should calculate totalAmount correctly for multiple items", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.create.mockResolvedValue({
        id: "order-2",
        totalAmount: 17500,
        orderItems: [],
      } as never);

      const input = {
        menuId: menu.id,
        items: [
          { dishName: "Tagine", quantity: 2, unitPrice: 3500 },     // 7000
          { dishName: "Couscous", quantity: 1, unitPrice: 4500 },   // 4500
          { dishName: "Mint Tea", quantity: 3, unitPrice: 2000 },   // 6000
        ],
      };

      await caller.createOrder(input);

      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 17500, // 7000 + 4500 + 6000
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.createOrder(validOrderInput("00000000-0000-4000-a000-000000000099")),
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
        caller.createOrder(validOrderInput("00000000-0000-4000-a000-000000000001")),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.createOrder(validOrderInput("00000000-0000-4000-a000-000000000001")),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      expect(mockMenus.findFirst).not.toHaveBeenCalled();
    });

    // -- Input validation --

    it("should accept valid Moroccan phone +212 format", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.create.mockResolvedValue({ id: "o-1", orderItems: [] } as never);

      await expect(
        caller.createOrder({
          ...validOrderInput(menu.id),
          customerPhone: "+212612345678",
        }),
      ).resolves.toBeDefined();
    });

    it("should accept valid Moroccan phone 0 format", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.create.mockResolvedValue({ id: "o-2", orderItems: [] } as never);

      await expect(
        caller.createOrder({
          ...validOrderInput(menu.id),
          customerPhone: "0612345678",
        }),
      ).resolves.toBeDefined();
    });

    it("should accept empty string for phone (optional)", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.create.mockResolvedValue({ id: "o-3", orderItems: [] } as never);

      await expect(
        caller.createOrder({
          ...validOrderInput(menu.id),
          customerPhone: "",
        }),
      ).resolves.toBeDefined();
    });

    it("should reject invalid phone format", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          ...validOrderInput("00000000-0000-4000-a000-000000000001"),
          customerPhone: "+1234567890",
        }),
      ).rejects.toThrow();
    });

    it("should reject empty items array", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          menuId: "00000000-0000-4000-a000-000000000001",
          items: [],
        }),
      ).rejects.toThrow();
    });

    it("should reject items array exceeding 50", async () => {
      const caller = createPublicCaller();
      const tooManyItems = Array.from({ length: 51 }, (_, i) => ({
        dishName: `Dish ${i}`,
        quantity: 1,
        unitPrice: 1000,
      }));

      await expect(
        caller.createOrder({
          menuId: "00000000-0000-4000-a000-000000000001",
          items: tooManyItems,
        }),
      ).rejects.toThrow();
    });

    it("should reject quantity of 0", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          menuId: "00000000-0000-4000-a000-000000000001",
          items: [{ dishName: "Tagine", quantity: 0, unitPrice: 3500 }],
        }),
      ).rejects.toThrow();
    });

    it("should reject quantity exceeding 99", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          menuId: "00000000-0000-4000-a000-000000000001",
          items: [{ dishName: "Tagine", quantity: 100, unitPrice: 3500 }],
        }),
      ).rejects.toThrow();
    });

    it("should reject negative unitPrice", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          menuId: "00000000-0000-4000-a000-000000000001",
          items: [{ dishName: "Tagine", quantity: 1, unitPrice: -100 }],
        }),
      ).rejects.toThrow();
    });

    it("should reject empty dishName", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          menuId: "00000000-0000-4000-a000-000000000001",
          items: [{ dishName: "", quantity: 1, unitPrice: 1000 }],
        }),
      ).rejects.toThrow();
    });

    it("should reject dishName exceeding 200 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          menuId: "00000000-0000-4000-a000-000000000001",
          items: [{ dishName: "A".repeat(201), quantity: 1, unitPrice: 1000 }],
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID menuId", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createOrder({
          menuId: "not-a-uuid",
          items: [{ dishName: "Tagine", quantity: 1, unitPrice: 1000 }],
        }),
      ).rejects.toThrow();
    });

    it("should accept order without optional customerName", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.create.mockResolvedValue({ id: "o-4", orderItems: [] } as never);

      await expect(
        caller.createOrder({
          menuId: menu.id,
          items: [{ dishName: "Tagine", quantity: 1, unitPrice: 3500 }],
        }),
      ).resolves.toBeDefined();
    });
  });

  // =========================================================================
  // getOrdersByMenu
  // =========================================================================

  describe("getOrdersByMenu", () => {
    it("should return orders for owned menu", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const order = createOrder({ menuId: menu.id });

      mockMenus.findFirst.mockResolvedValue(menu);
      mockOrders.findMany.mockResolvedValue([order] as never);

      const result = await caller.getOrdersByMenu({ menuId: menu.id });

      expect(result.orders).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getOrdersByMenu({ menuId: "00000000-0000-4000-a000-000000000099" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should filter by status when provided", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockOrders.findMany.mockResolvedValue([]);

      await caller.getOrdersByMenu({ menuId: menu.id, status: "preparing" });

      expect(mockOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: menu.id,
            status: "preparing",
          }),
        }),
      );
    });

    it("should return nextCursor when more results exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      // Generate limit + 1 orders to trigger pagination
      const orders = Array.from({ length: 51 }, (_, i) =>
        createOrder({ id: `00000000-0000-4000-a000-${String(i).padStart(12, "0")}`, menuId: menu.id }),
      );

      mockMenus.findFirst.mockResolvedValue(menu);
      mockOrders.findMany.mockResolvedValue(orders as never);

      const result = await caller.getOrdersByMenu({ menuId: menu.id, limit: 50 });

      expect(result.orders).toHaveLength(50);
      expect(result.nextCursor).toBeDefined();
    });

    it("should return empty list for menu with no orders", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockOrders.findMany.mockResolvedValue([]);

      const result = await caller.getOrdersByMenu({ menuId: menu.id });

      expect(result.orders).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should accept all valid status values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockOrders.findMany.mockResolvedValue([]);

      const statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as const;

      for (const status of statuses) {
        await expect(
          caller.getOrdersByMenu({ menuId: menu.id, status }),
        ).resolves.toBeDefined();
      }
    });

    it("should reject invalid status value", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getOrdersByMenu({
          menuId: "00000000-0000-4000-a000-000000000001",
          status: "invalid" as never,
        }),
      ).rejects.toThrow();
    });

    it("should reject limit below 1", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getOrdersByMenu({
          menuId: "00000000-0000-4000-a000-000000000001",
          limit: 0,
        }),
      ).rejects.toThrow();
    });

    it("should reject limit above 100", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getOrdersByMenu({
          menuId: "00000000-0000-4000-a000-000000000001",
          limit: 101,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateOrderStatus
  // =========================================================================

  describe("updateOrderStatus", () => {
    it("should update order status to confirmed", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        status: "pending",
        menus: { userId: owner.id },
      } as never);
      mockOrders.update.mockResolvedValue({
        id: "order-1",
        status: "confirmed",
      } as never);

      const result = await caller.updateOrderStatus({
        orderId: "00000000-0000-4000-a000-000000000001",
        status: "confirmed",
      });

      expect(result.status).toBe("confirmed");
    });

    it("should set completedAt when status is completed", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        status: "ready",
        menus: { userId: owner.id },
      } as never);
      mockOrders.update.mockResolvedValue({
        id: "order-1",
        status: "completed",
        completedAt: new Date(),
      } as never);

      await caller.updateOrderStatus({
        orderId: "00000000-0000-4000-a000-000000000001",
        status: "completed",
      });

      expect(mockOrders.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: {
          status: "completed",
          updatedAt: expect.any(Date),
          completedAt: expect.any(Date),
        },
      });
    });

    it("should NOT set completedAt for non-completed statuses", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      const nonCompletedStatuses = ["confirmed", "preparing", "ready", "cancelled"] as const;

      for (const status of nonCompletedStatuses) {
        vi.clearAllMocks();
        mockOrders.findUnique.mockResolvedValue({
          id: "order-1",
          status: "pending",
          menus: { userId: owner.id },
        } as never);
        mockOrders.update.mockResolvedValue({
          id: "order-1",
          status,
        } as never);

        await caller.updateOrderStatus({
          orderId: "00000000-0000-4000-a000-000000000001",
          status,
        });

        const updateCall = mockOrders.update.mock.calls[0]![0] as { data: Record<string, unknown> };

        expect(updateCall.data).not.toHaveProperty("completedAt");
      }
    });

    it("should throw FORBIDDEN when order not found", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateOrderStatus({
          orderId: "00000000-0000-4000-a000-000000000099",
          status: "confirmed",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        menus: { userId: "different-owner" },
      } as never);

      await expect(
        caller.updateOrderStatus({
          orderId: "00000000-0000-4000-a000-000000000001",
          status: "confirmed",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to update this order",
      });
    });

    it("should reject 'pending' as target status (not in update enum)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateOrderStatus({
          orderId: "00000000-0000-4000-a000-000000000001",
          status: "pending" as never,
        }),
      ).rejects.toThrow();
    });

    it("should accept all valid update status values", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);
      const validStatuses = ["confirmed", "preparing", "ready", "completed", "cancelled"] as const;

      for (const status of validStatuses) {
        vi.clearAllMocks();
        mockOrders.findUnique.mockResolvedValue({
          id: "order-1",
          menus: { userId: owner.id },
        } as never);
        mockOrders.update.mockResolvedValue({
          id: "order-1",
          status,
        } as never);

        await expect(
          caller.updateOrderStatus({
            orderId: "00000000-0000-4000-a000-000000000001",
            status,
          }),
        ).resolves.toBeDefined();
      }
    });
  });

  // =========================================================================
  // getOrderStats
  // =========================================================================

  describe("getOrderStats", () => {
    it("should return order statistics for today", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id, currency: "MAD" });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.count
        .mockResolvedValueOnce(10)  // totalOrders
        .mockResolvedValueOnce(6)   // completedOrders
        .mockResolvedValueOnce(2)   // pendingOrders
        .mockResolvedValueOnce(1);  // cancelledOrders
      mockOrders.aggregate.mockResolvedValue({
        _sum: { totalAmount: 85000 },
      } as never);
      mockOrderItems.groupBy.mockResolvedValue([
        { dishName: "Tagine", _sum: { quantity: 15, totalPrice: 52500 } },
        { dishName: "Couscous", _sum: { quantity: 10, totalPrice: 32500 } },
      ] as never);

      const result = await caller.getOrderStats({ menuId: menu.id, period: "today" });

      expect(result.totalOrders).toBe(10);
      expect(result.completedOrders).toBe(6);
      expect(result.pendingOrders).toBe(2);
      expect(result.cancelledOrders).toBe(1);
      expect(result.totalRevenue).toBe(85000);
      expect(result.currency).toBe("MAD");
      expect(result.topDishes).toHaveLength(2);
      expect(result.topDishes[0]!.name).toBe("Tagine");
      expect(result.topDishes[0]!.quantity).toBe(15);
    });

    it("should default to today when period not specified", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.count.mockResolvedValue(0);
      mockOrders.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as never);
      mockOrderItems.groupBy.mockResolvedValue([]);

      const result = await caller.getOrderStats({ menuId: menu.id });

      expect(result.totalOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
    });

    it("should handle null totalAmount aggregate", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.count.mockResolvedValue(0);
      mockOrders.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
      } as never);
      mockOrderItems.groupBy.mockResolvedValue([]);

      const result = await caller.getOrderStats({ menuId: menu.id, period: "all" });

      expect(result.totalRevenue).toBe(0);
    });

    it("should handle null quantity and totalPrice in topDishes", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.count.mockResolvedValue(1);
      mockOrders.aggregate.mockResolvedValue({ _sum: { totalAmount: 3500 } } as never);
      mockOrderItems.groupBy.mockResolvedValue([
        { dishName: "Mystery Dish", _sum: { quantity: null, totalPrice: null } },
      ] as never);

      const result = await caller.getOrderStats({ menuId: menu.id, period: "all" });

      expect(result.topDishes[0]!.quantity).toBe(0);
      expect(result.topDishes[0]!.revenue).toBe(0);
    });

    it("should accept all valid period values", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);
      const periods = ["today", "week", "month", "all"] as const;

      for (const period of periods) {
        vi.clearAllMocks();
        mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
        mockOrders.count.mockResolvedValue(0);
        mockOrders.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as never);
        mockOrderItems.groupBy.mockResolvedValue([]);

        await expect(
          caller.getOrderStats({ menuId: menu.id, period }),
        ).resolves.toBeDefined();
      }
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getOrderStats({
          menuId: "00000000-0000-4000-a000-000000000099",
          period: "today",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should return empty topDishes when no completed orders", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id, currency: "MAD", enabledOrderTypes: ["dine_in", "pickup", "delivery"], deliveryFee: 0, minOrderAmount: 0 } as never);
      mockOrders.count.mockResolvedValue(0);
      mockOrders.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as never);
      mockOrderItems.groupBy.mockResolvedValue([]);

      const result = await caller.getOrderStats({ menuId: menu.id, period: "today" });

      expect(result.topDishes).toEqual([]);
    });
  });

  // =========================================================================
  // createOrder – order type validation
  // =========================================================================

  describe("createOrder – order types", () => {
    it("should reject order type not enabled for menu", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      // Menu only allows dine_in
      mockMenus.findFirst.mockResolvedValue({
        id: menu.id, currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0, minOrderAmount: 0,
      } as never);

      await expect(
        caller.createOrder({
          ...validOrderInput(menu.id),
          orderType: "delivery",
          deliveryAddress: "123 Rue Test",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("not available"),
      });
    });

    it("should reject delivery order without address", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id, currency: "MAD",
        enabledOrderTypes: ["dine_in", "pickup", "delivery"],
        deliveryFee: 1500, minOrderAmount: 0,
      } as never);

      await expect(
        caller.createOrder({
          ...validOrderInput(menu.id),
          orderType: "delivery",
          customerName: "Ahmed",
          customerPhone: "+212612345678",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Delivery address"),
      });
    });

    it("should reject pickup order without customer name", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id, currency: "MAD",
        enabledOrderTypes: ["dine_in", "pickup"],
        deliveryFee: 0, minOrderAmount: 0,
      } as never);

      await expect(
        caller.createOrder({
          menuId: menu.id,
          orderType: "pickup",
          customerPhone: "+212612345678",
          items: [{ dishName: "Tagine", quantity: 1, unitPrice: 3500 }],
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Customer name"),
      });
    });

    it("should reject pickup order without phone", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id, currency: "MAD",
        enabledOrderTypes: ["dine_in", "pickup"],
        deliveryFee: 0, minOrderAmount: 0,
      } as never);

      await expect(
        caller.createOrder({
          menuId: menu.id,
          orderType: "pickup",
          customerName: "Ahmed",
          items: [{ dishName: "Tagine", quantity: 1, unitPrice: 3500 }],
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Phone number"),
      });
    });

    it("should add delivery fee to total for delivery orders", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id, currency: "MAD",
        enabledOrderTypes: ["dine_in", "pickup", "delivery"],
        deliveryFee: 1500,
        minOrderAmount: 0,
      } as never);
      mockOrders.create.mockResolvedValue({
        id: "delivery-order",
        totalAmount: 8500,
        orderItems: [],
      } as never);

      await caller.createOrder({
        menuId: menu.id,
        orderType: "delivery",
        customerName: "Ahmed",
        customerPhone: "+212612345678",
        deliveryAddress: "45 Avenue Hassan II",
        items: [{ dishName: "Tagine", quantity: 2, unitPrice: 3500 }],
      });

      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 8500, // 7000 + 1500 delivery fee
            deliveryFee: 1500,
            orderType: "delivery",
          }),
        }),
      );
    });

    it("should NOT add delivery fee for dine-in orders", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id, currency: "MAD",
        enabledOrderTypes: ["dine_in", "pickup", "delivery"],
        deliveryFee: 1500,
        minOrderAmount: 0,
      } as never);
      mockOrders.create.mockResolvedValue({
        id: "dinein-order",
        totalAmount: 7000,
        orderItems: [],
      } as never);

      await caller.createOrder({
        ...validOrderInput(menu.id),
        orderType: "dine_in",
      });

      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 7000, // No delivery fee
            deliveryFee: 0,
            orderType: "dine_in",
          }),
        }),
      );
    });

    it("should reject order below minimum order amount", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id, currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0,
        minOrderAmount: 5000,
      } as never);

      await expect(
        caller.createOrder({
          menuId: menu.id,
          items: [{ dishName: "Tea", quantity: 1, unitPrice: 1000 }],
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Minimum order amount"),
      });
    });
  });

  // =========================================================================
  // getPublicOrderStatus
  // =========================================================================

  describe("getPublicOrderStatus", () => {
    it("should return order status with ETA", async () => {
      const menu = createMenu();
      const order = createOrder({ menuId: menu.id, status: "preparing" });
      const caller = createPublicCaller();

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        orderItems: [
          { dishName: "Tagine", quantity: 2, unitPrice: 3500, totalPrice: 7000, notes: null },
        ],
        menus: {
          name: "Riad Casablanca",
          slug: "riad-casablanca",
          logoImageUrl: null,
          contactNumber: "+212612345678",
          phone: null,
          whatsappNumber: "+212612345678",
          estimatedPrepTime: 20,
        },
      } as never);
      // 2 orders ahead in queue
      mockOrders.count.mockResolvedValue(2);

      const result = await caller.getPublicOrderStatus({ orderId: order.id });

      expect(result.status).toBe("preparing");
      expect(result.restaurantName).toBe("Riad Casablanca");
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe("Tagine");
      expect(result.ordersAhead).toBe(2);
      // ETA = max(5, ceil(2 * 20 / 3)) = max(5, 14) = 14
      expect(result.estimatedMinutes).toBe(14);
    });

    it("should enforce minimum 5 minutes ETA", async () => {
      const menu = createMenu();
      const order = createOrder({ menuId: menu.id });
      const caller = createPublicCaller();

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        orderItems: [],
        menus: {
          name: "Test",
          slug: "test",
          logoImageUrl: null,
          contactNumber: null,
          phone: null,
          whatsappNumber: null,
          estimatedPrepTime: 5,
        },
      } as never);
      // 0 orders ahead
      mockOrders.count.mockResolvedValue(0);

      const result = await caller.getPublicOrderStatus({ orderId: order.id });

      expect(result.estimatedMinutes).toBe(5);
    });

    it("should default to 15 minutes prep time when not set", async () => {
      const menu = createMenu();
      const order = createOrder({ menuId: menu.id });
      const caller = createPublicCaller();

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        orderItems: [],
        menus: {
          name: "Test",
          slug: "test",
          logoImageUrl: null,
          contactNumber: null,
          phone: null,
          whatsappNumber: null,
          estimatedPrepTime: null, // Not set
        },
      } as never);
      // 6 orders ahead: ceil(6 * 15 / 3) = ceil(30) = 30
      mockOrders.count.mockResolvedValue(6);

      const result = await caller.getPublicOrderStatus({ orderId: order.id });

      expect(result.estimatedMinutes).toBe(30);
    });

    it("should throw NOT_FOUND for non-existent order", async () => {
      const caller = createPublicCaller();

      mockOrders.findUnique.mockResolvedValue(null);

      await expect(
        caller.getPublicOrderStatus({ orderId: "00000000-0000-4000-a000-000000000099" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Order not found",
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.getPublicOrderStatus({ orderId: "00000000-0000-4000-a000-000000000001" }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });
    });

    it("should return delivery info for delivery orders", async () => {
      const menu = createMenu();
      const order = createOrder({
        menuId: menu.id,
        orderType: "delivery",
        deliveryAddress: "45 Avenue Hassan II",
        deliveryFee: 1500,
      });
      const caller = createPublicCaller();

      mockOrders.findUnique.mockResolvedValue({
        ...order,
        orderItems: [],
        menus: {
          name: "Test",
          slug: "test",
          logoImageUrl: null,
          contactNumber: null,
          phone: null,
          whatsappNumber: null,
          estimatedPrepTime: 15,
        },
      } as never);
      mockOrders.count.mockResolvedValue(0);

      const result = await caller.getPublicOrderStatus({ orderId: order.id });

      expect(result.orderType).toBe("delivery");
      expect(result.deliveryAddress).toBe("45 Avenue Hassan II");
      expect(result.deliveryFee).toBe(1500);
    });
  });

  // =========================================================================
  // getMenuOrderSettings
  // =========================================================================

  describe("getMenuOrderSettings", () => {
    it("should return order settings for owned menu", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        enabledOrderTypes: ["dine_in", "pickup"],
        deliveryFee: 1500,
        deliveryRadiusKm: 10,
        minOrderAmount: 3000,
        estimatedPrepTime: 20,
        currency: "MAD",
      } as never);

      const result = await caller.getMenuOrderSettings({ menuId: menu.id });

      expect(result.enabledOrderTypes).toEqual(["dine_in", "pickup"]);
      expect(result.deliveryFee).toBe(1500);
      expect(result.deliveryRadiusKm).toBe(10);
      expect(result.minOrderAmount).toBe(3000);
      expect(result.estimatedPrepTime).toBe(20);
      expect(result.currency).toBe("MAD");
    });

    it("should throw FORBIDDEN for non-owner", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getMenuOrderSettings({ menuId: "00000000-0000-4000-a000-000000000099" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  // =========================================================================
  // updateMenuOrderSettings
  // =========================================================================

  describe("updateMenuOrderSettings", () => {
    it("should update order settings successfully", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenus.update.mockResolvedValue({
        id: menu.id,
        enabledOrderTypes: ["dine_in", "delivery"],
        deliveryFee: 2000,
        deliveryRadiusKm: 15,
        minOrderAmount: 5000,
        estimatedPrepTime: 25,
      } as never);

      const result = await caller.updateMenuOrderSettings({
        menuId: menu.id,
        enabledOrderTypes: ["dine_in", "delivery"],
        deliveryFee: 2000,
        deliveryRadiusKm: 15,
        minOrderAmount: 5000,
        estimatedPrepTime: 25,
      });

      expect(result.enabledOrderTypes).toEqual(["dine_in", "delivery"]);
      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: menu.id },
        data: expect.objectContaining({
          enabledOrderTypes: ["dine_in", "delivery"],
          deliveryFee: 2000,
          deliveryRadiusKm: 15,
          minOrderAmount: 5000,
          estimatedPrepTime: 25,
        }),
      });
    });

    it("should throw FORBIDDEN for non-owner", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateMenuOrderSettings({
          menuId: "00000000-0000-4000-a000-000000000099",
          enabledOrderTypes: ["dine_in"],
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject empty enabledOrderTypes array", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateMenuOrderSettings({
          menuId: "00000000-0000-4000-a000-000000000001",
          enabledOrderTypes: [],
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid order type values", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateMenuOrderSettings({
          menuId: "00000000-0000-4000-a000-000000000001",
          enabledOrderTypes: ["invalid_type" as never],
        }),
      ).rejects.toThrow();
    });

    it("should reject negative delivery fee", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateMenuOrderSettings({
          menuId: "00000000-0000-4000-a000-000000000001",
          enabledOrderTypes: ["dine_in"],
          deliveryFee: -100,
        }),
      ).rejects.toThrow();
    });

    it("should reject prep time above 120 minutes", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateMenuOrderSettings({
          menuId: "00000000-0000-4000-a000-000000000001",
          enabledOrderTypes: ["dine_in"],
          estimatedPrepTime: 121,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateOrderStatus – timestamp tracking
  // =========================================================================

  describe("updateOrderStatus – timestamps", () => {
    it("should set confirmedAt when confirming order", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        status: "pending",
        menus: { userId: owner.id },
      } as never);
      mockOrders.update.mockResolvedValue({ id: "order-1", status: "confirmed" } as never);

      await caller.updateOrderStatus({
        orderId: "00000000-0000-4000-a000-000000000001",
        status: "confirmed",
      });

      expect(mockOrders.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: {
          status: "confirmed",
          updatedAt: expect.any(Date),
          confirmedAt: expect.any(Date),
        },
      });
    });

    it("should set preparingAt when starting preparation", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        status: "confirmed",
        menus: { userId: owner.id },
      } as never);
      mockOrders.update.mockResolvedValue({ id: "order-1", status: "preparing" } as never);

      await caller.updateOrderStatus({
        orderId: "00000000-0000-4000-a000-000000000001",
        status: "preparing",
      });

      expect(mockOrders.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: {
          status: "preparing",
          updatedAt: expect.any(Date),
          preparingAt: expect.any(Date),
        },
      });
    });

    it("should set readyAt when order is ready", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        status: "preparing",
        menus: { userId: owner.id },
      } as never);
      mockOrders.update.mockResolvedValue({ id: "order-1", status: "ready" } as never);

      await caller.updateOrderStatus({
        orderId: "00000000-0000-4000-a000-000000000001",
        status: "ready",
      });

      expect(mockOrders.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: {
          status: "ready",
          updatedAt: expect.any(Date),
          readyAt: expect.any(Date),
        },
      });
    });

    it("should NOT set any timestamp for cancelled status", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        status: "pending",
        menus: { userId: owner.id },
      } as never);
      mockOrders.update.mockResolvedValue({ id: "order-1", status: "cancelled" } as never);

      await caller.updateOrderStatus({
        orderId: "00000000-0000-4000-a000-000000000001",
        status: "cancelled",
      });

      expect(mockOrders.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: {
          status: "cancelled",
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  // =========================================================================
  // checkDeliveryAvailability (public procedure)
  // =========================================================================

  describe("checkDeliveryAvailability", () => {
    it("should return available when customer is within delivery radius", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      // Restaurant in Casablanca city center
      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        restaurantLat: 33.5731,
        restaurantLng: -7.5898,
        deliveryRadiusKm: 10,
        deliveryFee: 1500,
        enabledOrderTypes: ["dine_in", "delivery"],
        currency: "MAD",
      } as never);

      // Customer ~2km away
      const result = await caller.checkDeliveryAvailability({
        menuId: menu.id,
        customerLat: 33.5850,
        customerLng: -7.5800,
      });

      expect(result.available).toBe(true);
      expect(result.distanceKm).toBeLessThan(10);
      expect(result.deliveryFee).toBe(1500);
      expect(result.maxRadiusKm).toBe(10);
      expect(result.currency).toBe("MAD");
    });

    it("should return unavailable when customer is outside delivery radius", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      // Restaurant in Casablanca
      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        restaurantLat: 33.5731,
        restaurantLng: -7.5898,
        deliveryRadiusKm: 5,
        deliveryFee: 1500,
        enabledOrderTypes: ["delivery"],
        currency: "MAD",
      } as never);

      // Customer in Rabat (~90km away)
      const result = await caller.checkDeliveryAvailability({
        menuId: menu.id,
        customerLat: 34.0209,
        customerLng: -6.8416,
      });

      expect(result.available).toBe(false);
      expect(result.distanceKm).toBeGreaterThan(5);
    });

    it("should throw NOT_FOUND for unpublished menu", async () => {
      const menu = createMenu({ isPublished: false });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.checkDeliveryAvailability({
          menuId: menu.id,
          customerLat: 33.5731,
          customerLng: -7.5898,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw BAD_REQUEST when delivery is not enabled", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        restaurantLat: 33.5731,
        restaurantLng: -7.5898,
        deliveryRadiusKm: 5,
        deliveryFee: 0,
        enabledOrderTypes: ["dine_in", "pickup"],
        currency: "MAD",
      } as never);

      await expect(
        caller.checkDeliveryAvailability({
          menuId: menu.id,
          customerLat: 33.5731,
          customerLng: -7.5898,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("not available"),
      });
    });

    it("should throw BAD_REQUEST when restaurant coordinates are not set", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        restaurantLat: null,
        restaurantLng: null,
        deliveryRadiusKm: 5,
        deliveryFee: 0,
        enabledOrderTypes: ["delivery"],
        currency: "MAD",
      } as never);

      await expect(
        caller.checkDeliveryAvailability({
          menuId: menu.id,
          customerLat: 33.5731,
          customerLng: -7.5898,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("coordinates"),
      });
    });

    it("should enforce rate limiting", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.checkDeliveryAvailability({
          menuId: menu.id,
          customerLat: 33.5731,
          customerLng: -7.5898,
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });
    });

    it("should default to 5km radius when deliveryRadiusKm is null", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        restaurantLat: 33.5731,
        restaurantLng: -7.5898,
        deliveryRadiusKm: null,
        deliveryFee: 0,
        enabledOrderTypes: ["delivery"],
        currency: "MAD",
      } as never);

      const result = await caller.checkDeliveryAvailability({
        menuId: menu.id,
        customerLat: 33.5731,
        customerLng: -7.5898,
      });

      expect(result.maxRadiusKm).toBe(5);
      expect(result.available).toBe(true);
      expect(result.distanceKm).toBe(0);
    });

    it("should round distance to one decimal place", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        restaurantLat: 33.5731,
        restaurantLng: -7.5898,
        deliveryRadiusKm: 50,
        deliveryFee: 0,
        enabledOrderTypes: ["delivery"],
        currency: "MAD",
      } as never);

      const result = await caller.checkDeliveryAvailability({
        menuId: menu.id,
        customerLat: 33.60,
        customerLng: -7.55,
      });

      // Distance should be rounded to 1 decimal
      expect(result.distanceKm.toString()).toMatch(/^\d+(\.\d)?$/);
    });
  });

  // =========================================================================
  // createOrder – price validation security
  // =========================================================================

  describe("price validation security", () => {
    it("should accept order with correct prices from database", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const dishId = "00000000-0000-4000-a000-000000000001";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0,
        minOrderAmount: 0,
      } as never);

      // Mock dishes.findMany to return DB price (server-side validation)
      const mockDishes = vi.mocked(db.dishes);

      mockDishes.findMany.mockResolvedValue([
        { id: dishId, price: 3500 },
      ] as never);

      mockOrders.create.mockResolvedValue({
        id: "order-1",
        totalAmount: 7000,
        orderItems: [{ dishName: "Tagine", quantity: 2, unitPrice: 3500, totalPrice: 7000 }],
      } as never);

      const result = await caller.createOrder({
        menuId: menu.id,
        items: [
          {
            dishId,
            dishName: "Tagine",
            quantity: 2,
            unitPrice: 3500, // Correct price
          },
        ],
      });

      expect(result.totalAmount).toBe(7000);
      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 7000,
            orderItems: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  dishName: "Tagine",
                  quantity: 2,
                  unitPrice: 3500,
                  totalPrice: 7000,
                }),
              ]),
            },
          }),
        }),
      );
    });

    it("should override manipulated lower unitPrice with DB price", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const dishId = "00000000-0000-4000-a000-000000000001";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0,
        minOrderAmount: 0,
      } as never);

      const mockDishes = vi.mocked(db.dishes);

      // Server DB has price of 3500
      mockDishes.findMany.mockResolvedValue([
        { id: dishId, price: 3500 },
      ] as never);

      mockOrders.create.mockResolvedValue({
        id: "order-2",
        totalAmount: 7000,
        orderItems: [],
      } as never);

      await caller.createOrder({
        menuId: menu.id,
        items: [
          {
            dishId,
            dishName: "Tagine",
            quantity: 2,
            unitPrice: 100, // Manipulated (client sent 100, but DB says 3500)
          },
        ],
      });

      // Verify the server used DB price 3500, not client price 100
      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 7000, // 3500 * 2 = 7000, NOT 100 * 2 = 200
            orderItems: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  unitPrice: 3500, // Server override
                  totalPrice: 7000,
                }),
              ]),
            },
          }),
        }),
      );
    });

    it("should override manipulated zero unitPrice with DB price", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const dishId = "00000000-0000-4000-a000-000000000001";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0,
        minOrderAmount: 0,
      } as never);

      const mockDishes = vi.mocked(db.dishes);

      // Server DB has price of 4500
      mockDishes.findMany.mockResolvedValue([
        { id: dishId, price: 4500 },
      ] as never);

      mockOrders.create.mockResolvedValue({
        id: "order-3",
        totalAmount: 13500,
        orderItems: [],
      } as never);

      await caller.createOrder({
        menuId: menu.id,
        items: [
          {
            dishId,
            dishName: "Couscous",
            quantity: 3,
            unitPrice: 0, // Manipulated to zero
          },
        ],
      });

      // Verify the server used DB price 4500, not zero
      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 13500, // 4500 * 3 = 13500
            orderItems: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  unitPrice: 4500,
                  totalPrice: 13500,
                }),
              ]),
            },
          }),
        }),
      );
    });

    it("should validate variant prices when dishVariantId is present", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const dishId = "00000000-0000-4000-a000-000000000001";
      const variantId = "00000000-0000-4000-a000-000000000002";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0,
        minOrderAmount: 0,
      } as never);

      const mockDishes = vi.mocked(db.dishes);
      const mockDishVariants = vi.mocked(db.dishVariants);

      // Mock base dish price
      mockDishes.findMany.mockResolvedValue([
        { id: dishId, price: 3500 },
      ] as never);

      // Mock variant price (server says 4000)
      mockDishVariants.findMany.mockResolvedValue([
        { id: variantId, price: 4000 },
      ] as never);

      mockOrders.create.mockResolvedValue({
        id: "order-4",
        totalAmount: 8000,
        orderItems: [],
      } as never);

      await caller.createOrder({
        menuId: menu.id,
        items: [
          {
            dishId,
            dishVariantId: variantId,
            dishName: "Tagine - Large",
            quantity: 2,
            unitPrice: 1000, // Manipulated (client sent 1000, DB variant says 4000)
          },
        ],
      });

      // Verify the server used variant price 4000
      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 8000, // 4000 * 2
            orderItems: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  unitPrice: 4000, // Variant price override
                  totalPrice: 8000,
                }),
              ]),
            },
          }),
        }),
      );
    });

    it("should use client price for manual items without dishId", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0,
        minOrderAmount: 0,
      } as never);

      const mockDishes = vi.mocked(db.dishes);

      // No dishes to validate
      mockDishes.findMany.mockResolvedValue([]);

      mockOrders.create.mockResolvedValue({
        id: "order-5",
        totalAmount: 2500,
        orderItems: [],
      } as never);

      await caller.createOrder({
        menuId: menu.id,
        items: [
          {
            // No dishId - manual/custom item
            dishName: "Special Request",
            quantity: 1,
            unitPrice: 2500, // Client-provided price (can't validate)
          },
        ],
      });

      // Verify client price is used for manual items
      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 2500,
            orderItems: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  dishName: "Special Request",
                  unitPrice: 2500,
                  totalPrice: 2500,
                }),
              ]),
            },
          }),
        }),
      );
    });

    it("should recalculate total using server-validated prices", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const dishId1 = "00000000-0000-4000-a000-000000000001";
      const dishId2 = "00000000-0000-4000-a000-000000000002";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        enabledOrderTypes: ["dine_in"],
        deliveryFee: 0,
        minOrderAmount: 0,
      } as never);

      const mockDishes = vi.mocked(db.dishes);

      // Server DB prices
      mockDishes.findMany.mockResolvedValue([
        { id: dishId1, price: 3500 }, // Real price: 3500
        { id: dishId2, price: 4500 }, // Real price: 4500
      ] as never);

      mockOrders.create.mockResolvedValue({
        id: "order-6",
        totalAmount: 19500,
        orderItems: [],
      } as never);

      await caller.createOrder({
        menuId: menu.id,
        items: [
          {
            dishId: dishId1,
            dishName: "Tagine",
            quantity: 2,
            unitPrice: 100, // Manipulated (client sent 100)
          },
          {
            dishId: dishId2,
            dishName: "Couscous",
            quantity: 3,
            unitPrice: 500, // Manipulated (client sent 500)
          },
        ],
      });

      // Verify total recalculated with server prices
      // Item 1: 3500 * 2 = 7000
      // Item 2: 4500 * 3 = 13500
      // Total: 7000 + 13500 = 20500
      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 20500, // NOT (100*2 + 500*3 = 1700)
          }),
        }),
      );
    });

    it("should recalculate total including delivery fee with validated prices", async () => {
      const menu = createMenu({ isPublished: true });
      const caller = createPublicCaller();
      const dishId = "00000000-0000-4000-a000-000000000001";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        enabledOrderTypes: ["dine_in", "delivery"],
        deliveryFee: 1500, // Delivery fee
        minOrderAmount: 0,
      } as never);

      const mockDishes = vi.mocked(db.dishes);

      // Server DB price
      mockDishes.findMany.mockResolvedValue([
        { id: dishId, price: 5000 },
      ] as never);

      mockOrders.create.mockResolvedValue({
        id: "order-7",
        totalAmount: 11500,
        orderItems: [],
      } as never);

      await caller.createOrder({
        menuId: menu.id,
        orderType: "delivery",
        customerName: "Ahmed",
        customerPhone: "+212612345678",
        deliveryAddress: "123 Rue Test",
        items: [
          {
            dishId,
            dishName: "Premium Dish",
            quantity: 2,
            unitPrice: 1000, // Manipulated
          },
        ],
      });

      // Verify total = (validated price * quantity) + delivery fee
      // Items: 5000 * 2 = 10000
      // Delivery: 1500
      // Total: 11500
      expect(mockOrders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 11500,
            deliveryFee: 1500,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // getPendingOrderCount (private procedure)
  // =========================================================================

  describe("getPendingOrderCount", () => {
    it("should return the count of pending/confirmed/preparing orders", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.count.mockResolvedValue(5);

      const result = await caller.getPendingOrderCount();

      expect(result.count).toBe(5);
      expect(mockOrders.count).toHaveBeenCalledWith({
        where: {
          status: { in: ["pending", "confirmed", "preparing"] },
          menus: { userId: owner.id },
        },
      });
    });

    it("should return 0 when no pending orders exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockOrders.count.mockResolvedValue(0);

      const result = await caller.getPendingOrderCount();

      expect(result.count).toBe(0);
    });

    it("should only count orders for menus owned by the authenticated user (IDOR protection)", async () => {
      const ownerA = createUser();
      const ownerB = createUser();
      const callerA = createPrivateCaller(ownerA.id);
      const callerB = createPrivateCaller(ownerB.id);

      // Owner A has 3 pending orders
      mockOrders.count.mockResolvedValue(3);
      const resultA = await callerA.getPendingOrderCount();

      expect(resultA.count).toBe(3);
      expect(mockOrders.count).toHaveBeenCalledWith({
        where: {
          status: { in: ["pending", "confirmed", "preparing"] },
          menus: { userId: ownerA.id },
        },
      });

      // Owner B has 7 pending orders
      mockOrders.count.mockResolvedValue(7);
      const resultB = await callerB.getPendingOrderCount();

      expect(resultB.count).toBe(7);
      expect(mockOrders.count).toHaveBeenCalledWith({
        where: {
          status: { in: ["pending", "confirmed", "preparing"] },
          menus: { userId: ownerB.id },
        },
      });
    });

    it("should not count completed or cancelled orders", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      // The count query filters by status IN ('pending','confirmed','preparing')
      // so completed/cancelled/ready are excluded by design
      mockOrders.count.mockResolvedValue(2);

      const result = await caller.getPendingOrderCount();

      expect(result.count).toBe(2);
      // Verify the status filter includes only active statuses
      expect(mockOrders.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["pending", "confirmed", "preparing"] },
          }),
        }),
      );
    });
  });
});
