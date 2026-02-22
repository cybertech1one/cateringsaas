import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the kitchen tRPC router.
 * Covers the Kitchen Display System (KDS) endpoints: order grouping by status,
 * status updates with completedAt handling, order count aggregation,
 * kitchen station CRUD, dish-to-station assignment, station-filtered orders,
 * IDOR protection, and input validation.
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findFirst: vi.fn(),
    },
    orders: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    kitchenStations: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dishes: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { kitchenRouter } from "../api/routers/kitchen";
import {
  createUser,
  createMenu,
  createOrder,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockCaller(userId: string) {
  return kitchenRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

function buildOrderWithStatus(status: string, id?: string) {
  return {
    ...createOrder({ status }),
    id: id ?? `order-${status}-${Math.random().toString(36).slice(2, 8)}`,
    orderItems: [],
  };
}

function createStationData(overrides?: Record<string, unknown>) {
  return {
    id: "00000000-0000-4000-a000-000000000050",
    menuId: "00000000-0000-4000-a000-000000000002",
    name: "Grill Station",
    color: "#EF4444",
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("kitchenRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockOrders = vi.mocked(db.orders);
  const mockStations = vi.mocked(db.kitchenStations);
  const mockDishes = vi.mocked(db.dishes);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // getKitchenOrders
  // =========================================================================

  describe("getKitchenOrders", () => {
    it("should return orders grouped by status", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);

      const allOrders = [
        buildOrderWithStatus("pending", "o-pending-1"),
        buildOrderWithStatus("pending", "o-pending-2"),
        buildOrderWithStatus("confirmed", "o-confirmed-1"),
        buildOrderWithStatus("preparing", "o-preparing-1"),
        buildOrderWithStatus("ready", "o-ready-1"),
        buildOrderWithStatus("completed", "o-completed-1"),
        buildOrderWithStatus("cancelled", "o-cancelled-1"),
      ];

      mockOrders.findMany.mockResolvedValue(allOrders as never);

      const result = await caller.getKitchenOrders({ menuId: menu.id });

      expect(result.orders.pending).toHaveLength(2);
      expect(result.orders.confirmed).toHaveLength(1);
      expect(result.orders.preparing).toHaveLength(1);
      expect(result.orders.ready).toHaveLength(1);
      expect(result.orders.completed).toHaveLength(1);
      expect(result.orders.cancelled).toHaveLength(1);
      expect(result.currency).toBe("MAD");
      expect(result.menuName).toBe(menu.name);
    });

    it("should limit completed orders to last 10", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);

      // Create 15 completed orders
      const completedOrders = Array.from({ length: 15 }, (_, i) =>
        buildOrderWithStatus("completed", `o-completed-${i}`),
      );

      mockOrders.findMany.mockResolvedValue(completedOrders as never);

      const result = await caller.getKitchenOrders({ menuId: menu.id });

      // Only last 10 completed should be returned (via .slice(-10))
      expect(result.orders.completed).toHaveLength(10);
      // Verify it keeps the LAST 10, not the first 10
      expect(result.orders.completed[0]!.id).toBe("o-completed-5");
      expect(result.orders.completed[9]!.id).toBe("o-completed-14");
    });

    it("should return empty groups when no orders exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);
      mockOrders.findMany.mockResolvedValue([]);

      const result = await caller.getKitchenOrders({ menuId: menu.id });

      expect(result.orders.pending).toEqual([]);
      expect(result.orders.confirmed).toEqual([]);
      expect(result.orders.preparing).toEqual([]);
      expect(result.orders.ready).toEqual([]);
      expect(result.orders.completed).toEqual([]);
      expect(result.orders.cancelled).toEqual([]);
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getKitchenOrders({
          menuId: "00000000-0000-4000-a000-000000000099",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to view kitchen orders for this menu",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.getKitchenOrders({ menuId: "invalid" }),
      ).rejects.toThrow();
    });

    it("should query orders from last 24 hours only", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);
      mockOrders.findMany.mockResolvedValue([]);

      await caller.getKitchenOrders({ menuId: menu.id });

      expect(mockOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: menu.id,
            createdAt: {
              gte: expect.any(Date),
            },
          }),
          orderBy: { createdAt: "asc" },
        }),
      );

      // Verify the date is approximately 24 hours ago
      const callArgs = mockOrders.findMany.mock.calls[0]![0] as {
        where: { createdAt: { gte: Date } };
      };
      const filterDate = callArgs.where.createdAt.gte;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      const expectedDate = new Date(Date.now() - twentyFourHoursMs);

      // Allow 2 seconds tolerance for test execution time
      expect(Math.abs(filterDate.getTime() - expectedDate.getTime())).toBeLessThan(2000);
    });

    it("should include orderItems with dish pictures and station IDs", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);
      mockOrders.findMany.mockResolvedValue([]);

      await caller.getKitchenOrders({ menuId: menu.id });

      expect(mockOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            orderItems: {
              include: {
                dishes: { select: { pictureUrl: true, kitchenStationId: true } },
              },
            },
          },
        }),
      );
    });
  });

  // =========================================================================
  // updateOrderStatus
  // =========================================================================

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

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

    it("should set completedAt when status transitions to completed", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

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
      const caller = createMockCaller(owner.id);

      const statuses = ["pending", "confirmed", "preparing", "ready", "cancelled"] as const;

      for (const status of statuses) {
        vi.clearAllMocks();
        mockOrders.findUnique.mockResolvedValue({
          id: "order-1",
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
      const caller = createMockCaller(owner.id);

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
      const caller = createMockCaller(attacker.id);

      mockOrders.findUnique.mockResolvedValue({
        id: "order-1",
        menus: { userId: "real-owner-id" },
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

      expect(mockOrders.update).not.toHaveBeenCalled();
    });

    it("should accept all valid status values in the kitchen enum", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as const;

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

    it("should reject invalid status value", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.updateOrderStatus({
          orderId: "00000000-0000-4000-a000-000000000001",
          status: "served" as never,
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID orderId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.updateOrderStatus({
          orderId: "not-uuid",
          status: "confirmed",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getOrderCounts
  // =========================================================================

  describe("getOrderCounts", () => {
    it("should return aggregated counts by status", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockOrders.count
        .mockResolvedValueOnce(3)  // pending
        .mockResolvedValueOnce(2)  // confirmed
        .mockResolvedValueOnce(5)  // preparing
        .mockResolvedValueOnce(4)  // ready
        .mockResolvedValueOnce(10); // completed

      const result = await caller.getOrderCounts({ menuId: menu.id });

      expect(result.pending).toBe(5);     // pending(3) + confirmed(2) = 5 ("New Orders")
      expect(result.preparing).toBe(5);
      expect(result.ready).toBe(4);
      expect(result.completed).toBe(10);
    });

    it("should combine pending and confirmed into 'New Orders' count", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockOrders.count
        .mockResolvedValueOnce(7)   // pending
        .mockResolvedValueOnce(3)   // confirmed
        .mockResolvedValueOnce(0)   // preparing
        .mockResolvedValueOnce(0)   // ready
        .mockResolvedValueOnce(0);  // completed

      const result = await caller.getOrderCounts({ menuId: menu.id });

      // pending column = pending + confirmed
      expect(result.pending).toBe(10);
    });

    it("should return all zeros when no orders exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockOrders.count.mockResolvedValue(0);

      const result = await caller.getOrderCounts({ menuId: menu.id });

      expect(result.pending).toBe(0);     // 0 + 0
      expect(result.preparing).toBe(0);
      expect(result.ready).toBe(0);
      expect(result.completed).toBe(0);
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getOrderCounts({
          menuId: "00000000-0000-4000-a000-000000000099",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized",
      });
    });

    it("should query orders from last 24 hours only", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockOrders.count.mockResolvedValue(0);

      await caller.getOrderCounts({ menuId: menu.id });

      // All 5 count calls should have createdAt gte filter
      expect(mockOrders.count).toHaveBeenCalledTimes(5);

      for (const call of mockOrders.count.mock.calls) {
        const args = call[0] as { where: { createdAt: { gte: Date } } };

        expect(args.where.createdAt.gte).toBeInstanceOf(Date);

        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        const expectedDate = new Date(Date.now() - twentyFourHoursMs);

        expect(
          Math.abs(args.where.createdAt.gte.getTime() - expectedDate.getTime()),
        ).toBeLessThan(2000);
      }
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.getOrderCounts({ menuId: "bad-uuid" }),
      ).rejects.toThrow();
    });

    it("should reject empty menuId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.getOrderCounts({ menuId: "" }),
      ).rejects.toThrow();
    });

    it("should include correct status filters in each count query", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockOrders.count.mockResolvedValue(0);

      await caller.getOrderCounts({ menuId: menu.id });

      const countCalls = mockOrders.count.mock.calls;

      // Verify each count query targets the correct status
      expect((countCalls[0]![0] as { where: { status: string } }).where.status).toBe("pending");
      expect((countCalls[1]![0] as { where: { status: string } }).where.status).toBe("confirmed");
      expect((countCalls[2]![0] as { where: { status: string } }).where.status).toBe("preparing");
      expect((countCalls[3]![0] as { where: { status: string } }).where.status).toBe("ready");
      expect((countCalls[4]![0] as { where: { status: string } }).where.status).toBe("completed");
    });
  });

  // =========================================================================
  // getStations
  // =========================================================================

  describe("getStations", () => {
    it("should return stations with dish counts for an owned menu", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockStations.findMany.mockResolvedValue([
        {
          ...createStationData({ menuId: menu.id, name: "Grill" }),
          _count: { dishes: 5 },
        },
        {
          ...createStationData({
            id: "00000000-0000-4000-a000-000000000051",
            menuId: menu.id,
            name: "Bar",
            color: "#3B82F6",
            sortOrder: 1,
          }),
          _count: { dishes: 3 },
        },
      ] as never);

      const result = await caller.getStations({ menuId: menu.id });

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("Grill");
      expect(result[0]!.dishCount).toBe(5);
      expect(result[1]!.name).toBe("Bar");
      expect(result[1]!.dishCount).toBe(3);
    });

    it("should return empty array when no stations exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockStations.findMany.mockResolvedValue([]);

      const result = await caller.getStations({ menuId: menu.id });

      expect(result).toEqual([]);
    });

    it("should throw FORBIDDEN for non-owned menu (IDOR)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getStations({
          menuId: "00000000-0000-4000-a000-000000000099",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to view stations for this menu",
      });
    });

    it("should order stations by sortOrder ascending", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockStations.findMany.mockResolvedValue([] as never);

      await caller.getStations({ menuId: menu.id });

      expect(mockStations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sortOrder: "asc" },
        }),
      );
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.getStations({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // createStation
  // =========================================================================

  describe("createStation", () => {
    it("should create a station with auto-incremented sort order", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockStations.findFirst.mockResolvedValue({ sortOrder: 2 } as never);
      mockStations.create.mockResolvedValue(
        createStationData({
          menuId: menu.id,
          name: "Cold Prep",
          color: "#10B981",
          sortOrder: 3,
        }) as never,
      );

      const result = await caller.createStation({
        menuId: menu.id,
        name: "Cold Prep",
        color: "#10B981",
      });

      expect(result.name).toBe("Cold Prep");
      expect(mockStations.create).toHaveBeenCalledWith({
        data: {
          menuId: menu.id,
          name: "Cold Prep",
          color: "#10B981",
          sortOrder: 3,
        },
      });
    });

    it("should start sort order at 0 when no stations exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockStations.findFirst.mockResolvedValue(null);
      mockStations.create.mockResolvedValue(
        createStationData({ menuId: menu.id, sortOrder: 0 }) as never,
      );

      await caller.createStation({
        menuId: menu.id,
        name: "Grill",
        color: "#EF4444",
      });

      expect(mockStations.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 0 }),
      });
    });

    it("should throw FORBIDDEN for non-owned menu (IDOR)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.createStation({
          menuId: "00000000-0000-4000-a000-000000000099",
          name: "Bar",
          color: "#3B82F6",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to create stations for this menu",
      });
    });

    it("should reject empty station name", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.createStation({
          menuId: "00000000-0000-4000-a000-000000000001",
          name: "",
          color: "#3B82F6",
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid hex color", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.createStation({
          menuId: "00000000-0000-4000-a000-000000000001",
          name: "Grill",
          color: "not-a-color",
        }),
      ).rejects.toThrow();
    });

    it("should reject color without # prefix", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.createStation({
          menuId: "00000000-0000-4000-a000-000000000001",
          name: "Grill",
          color: "FF0000",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateStation
  // =========================================================================

  describe("updateStation", () => {
    it("should update station name and color", async () => {
      const owner = createUser();
      const stationId = "00000000-0000-4000-a000-000000000050";
      const caller = createMockCaller(owner.id);

      mockStations.findUnique.mockResolvedValue({
        ...createStationData({ id: stationId }),
        menus: { userId: owner.id },
      } as never);
      mockStations.update.mockResolvedValue(
        createStationData({ id: stationId, name: "Hot Grill", color: "#F59E0B" }) as never,
      );

      const result = await caller.updateStation({
        stationId,
        name: "Hot Grill",
        color: "#F59E0B",
      });

      expect(result.name).toBe("Hot Grill");
      expect(mockStations.update).toHaveBeenCalledWith({
        where: { id: stationId },
        data: expect.objectContaining({
          name: "Hot Grill",
          color: "#F59E0B",
          updatedAt: expect.any(Date),
        }),
      });
    });

    it("should allow partial updates (only name)", async () => {
      const owner = createUser();
      const stationId = "00000000-0000-4000-a000-000000000050";
      const caller = createMockCaller(owner.id);

      mockStations.findUnique.mockResolvedValue({
        ...createStationData({ id: stationId }),
        menus: { userId: owner.id },
      } as never);
      mockStations.update.mockResolvedValue(
        createStationData({ id: stationId, name: "Renamed" }) as never,
      );

      await caller.updateStation({
        stationId,
        name: "Renamed",
      });

      const updateArgs = mockStations.update.mock.calls[0]![0] as { data: Record<string, unknown> };

      expect(updateArgs.data).toHaveProperty("name", "Renamed");
      expect(updateArgs.data).not.toHaveProperty("color");
      expect(updateArgs.data).not.toHaveProperty("sortOrder");
    });

    it("should throw FORBIDDEN for station not owned by user (IDOR)", async () => {
      const attacker = createUser();
      const stationId = "00000000-0000-4000-a000-000000000050";
      const caller = createMockCaller(attacker.id);

      mockStations.findUnique.mockResolvedValue({
        ...createStationData({ id: stationId }),
        menus: { userId: "real-owner-id" },
      } as never);

      await expect(
        caller.updateStation({
          stationId,
          name: "Hacked Station",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to update this station",
      });

      expect(mockStations.update).not.toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when station does not exist", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStations.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateStation({
          stationId: "00000000-0000-4000-a000-000000000099",
          name: "Ghost",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID stationId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.updateStation({
          stationId: "not-a-uuid",
          name: "Test",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // deleteStation
  // =========================================================================

  describe("deleteStation", () => {
    it("should unassign dishes then delete the station", async () => {
      const owner = createUser();
      const stationId = "00000000-0000-4000-a000-000000000050";
      const caller = createMockCaller(owner.id);

      mockStations.findUnique.mockResolvedValue({
        ...createStationData({ id: stationId }),
        menus: { userId: owner.id },
      } as never);
      mockDishes.updateMany.mockResolvedValue({ count: 3 } as never);
      mockStations.delete.mockResolvedValue(
        createStationData({ id: stationId }) as never,
      );

      await caller.deleteStation({ stationId });

      // Verify dishes are unassigned first
      expect(mockDishes.updateMany).toHaveBeenCalledWith({
        where: { kitchenStationId: stationId },
        data: { kitchenStationId: null },
      });

      // Then station is deleted
      expect(mockStations.delete).toHaveBeenCalledWith({
        where: { id: stationId },
      });
    });

    it("should throw FORBIDDEN for station not owned by user (IDOR)", async () => {
      const attacker = createUser();
      const stationId = "00000000-0000-4000-a000-000000000050";
      const caller = createMockCaller(attacker.id);

      mockStations.findUnique.mockResolvedValue({
        ...createStationData({ id: stationId }),
        menus: { userId: "real-owner-id" },
      } as never);

      await expect(
        caller.deleteStation({ stationId }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to delete this station",
      });

      expect(mockDishes.updateMany).not.toHaveBeenCalled();
      expect(mockStations.delete).not.toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when station does not exist", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStations.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteStation({
          stationId: "00000000-0000-4000-a000-000000000099",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID stationId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.deleteStation({ stationId: "bad" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // assignDishToStation
  // =========================================================================

  describe("assignDishToStation", () => {
    it("should assign a dish to a station", async () => {
      const owner = createUser();
      const dishId = "00000000-0000-4000-a000-000000000060";
      const stationId = "00000000-0000-4000-a000-000000000050";
      const menuId = "00000000-0000-4000-a000-000000000002";
      const caller = createMockCaller(owner.id);

      mockDishes.findUnique.mockResolvedValue({
        id: dishId,
        menuId,
        menus: { userId: owner.id },
      } as never);
      mockStations.findFirst.mockResolvedValue(
        createStationData({ id: stationId, menuId }) as never,
      );
      mockDishes.update.mockResolvedValue({
        id: dishId,
        kitchenStationId: stationId,
      } as never);

      const result = await caller.assignDishToStation({
        dishId,
        stationId,
      });

      expect(result.kitchenStationId).toBe(stationId);
      expect(mockDishes.update).toHaveBeenCalledWith({
        where: { id: dishId },
        data: { kitchenStationId: stationId },
      });
    });

    it("should unassign a dish (set stationId to null)", async () => {
      const owner = createUser();
      const dishId = "00000000-0000-4000-a000-000000000060";
      const caller = createMockCaller(owner.id);

      mockDishes.findUnique.mockResolvedValue({
        id: dishId,
        menuId: "00000000-0000-4000-a000-000000000002",
        menus: { userId: owner.id },
      } as never);
      mockDishes.update.mockResolvedValue({
        id: dishId,
        kitchenStationId: null,
      } as never);

      const result = await caller.assignDishToStation({
        dishId,
        stationId: null,
      });

      expect(result.kitchenStationId).toBeNull();
      // Should NOT check station existence when unassigning
      expect(mockStations.findFirst).not.toHaveBeenCalled();
    });

    it("should throw FORBIDDEN for dish not owned by user (IDOR)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockDishes.findUnique.mockResolvedValue({
        id: "dish-1",
        menuId: "menu-1",
        menus: { userId: "real-owner-id" },
      } as never);

      await expect(
        caller.assignDishToStation({
          dishId: "00000000-0000-4000-a000-000000000060",
          stationId: "00000000-0000-4000-a000-000000000050",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to update this dish",
      });

      expect(mockDishes.update).not.toHaveBeenCalled();
    });

    it("should throw BAD_REQUEST when station does not belong to the same menu", async () => {
      const owner = createUser();
      const dishId = "00000000-0000-4000-a000-000000000060";
      const stationId = "00000000-0000-4000-a000-000000000050";
      const caller = createMockCaller(owner.id);

      mockDishes.findUnique.mockResolvedValue({
        id: dishId,
        menuId: "menu-A",
        menus: { userId: owner.id },
      } as never);
      // Station not found for this menu
      mockStations.findFirst.mockResolvedValue(null);

      await expect(
        caller.assignDishToStation({ dishId, stationId }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Station not found or does not belong to this menu",
      });

      expect(mockDishes.update).not.toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when dish does not exist", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockDishes.findUnique.mockResolvedValue(null);

      await expect(
        caller.assignDishToStation({
          dishId: "00000000-0000-4000-a000-000000000099",
          stationId: "00000000-0000-4000-a000-000000000050",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID dishId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.assignDishToStation({
          dishId: "bad",
          stationId: "00000000-0000-4000-a000-000000000050",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getKitchenOrdersByStation
  // =========================================================================

  describe("getKitchenOrdersByStation", () => {
    it("should return all orders when stationId is null", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);

      const orders = [
        {
          ...buildOrderWithStatus("pending", "o-1"),
          orderItems: [
            { id: "item-1", dishes: { pictureUrl: null, kitchenStationId: "station-grill" } },
          ],
        },
        {
          ...buildOrderWithStatus("preparing", "o-2"),
          orderItems: [
            { id: "item-2", dishes: { pictureUrl: null, kitchenStationId: "station-bar" } },
          ],
        },
      ];

      mockOrders.findMany.mockResolvedValue(orders as never);

      const result = await caller.getKitchenOrdersByStation({
        menuId: menu.id,
        stationId: null,
      });

      expect(result.orders.pending).toHaveLength(1);
      expect(result.orders.preparing).toHaveLength(1);
    });

    it("should filter orders by station when stationId is provided", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);
      const grillStationId = "00000000-0000-4000-a000-000000000050";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);

      // DB-level filtering: mock returns only orders/items matching the station
      const orders = [
        {
          ...buildOrderWithStatus("pending", "o-1"),
          orderItems: [
            { id: "item-1", dishes: { pictureUrl: null, kitchenStationId: grillStationId } },
          ],
        },
      ];

      mockOrders.findMany.mockResolvedValue(orders as never);

      const result = await caller.getKitchenOrdersByStation({
        menuId: menu.id,
        stationId: grillStationId,
      });

      // Verify findMany was called with station filter in where clause
      expect(mockOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderItems: expect.objectContaining({
              some: expect.objectContaining({
                dishes: { kitchenStationId: grillStationId },
              }),
            }),
          }),
        }),
      );

      expect(result.orders.pending).toHaveLength(1);
      expect(result.orders.pending[0]!.id).toBe("o-1");
      expect(result.orders.pending[0]!.orderItems).toHaveLength(1);
      expect(result.orders.pending[0]!.orderItems[0]!.id).toBe("item-1");
    });

    it("should exclude orders with no matching station items", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);
      const grillStationId = "00000000-0000-4000-a000-000000000050";

      mockMenus.findFirst.mockResolvedValue({
        id: menu.id,
        currency: "MAD",
        name: menu.name,
      } as never);

      // DB-level filtering: when no orders match station, empty array returned
      mockOrders.findMany.mockResolvedValue([] as never);

      const result = await caller.getKitchenOrdersByStation({
        menuId: menu.id,
        stationId: grillStationId,
      });

      expect(result.orders.preparing).toHaveLength(0);
    });

    it("should throw FORBIDDEN for non-owned menu (IDOR)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getKitchenOrdersByStation({
          menuId: "00000000-0000-4000-a000-000000000099",
          stationId: null,
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.getKitchenOrdersByStation({ menuId: "invalid" }),
      ).rejects.toThrow();
    });
  });
});
