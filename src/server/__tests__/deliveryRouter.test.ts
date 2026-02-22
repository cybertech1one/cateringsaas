import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the delivery tRPC router.
 * Covers all 10 endpoints: createDeliveryRequest, getDeliveryRequests,
 * getDeliveryRequest, assignDriver, updateDeliveryStatus, autoDispatch,
 * cancelDelivery, rateDriver, getActiveDeliveries, getDeliveryStats.
 *
 * Tests IDOR protection, state machine transitions, haversine distance
 * calculation, auto-dispatch scoring, rate limiting, and input validation.
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks (MUST come before imports)
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 4 })),
}));

vi.mock("~/server/db", () => ({
  db: {
    menus: { findFirst: vi.fn(), findUnique: vi.fn() },
    orders: { findFirst: vi.fn() },
    deliveryRequests: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    restaurantDrivers: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    drivers: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    driverEarnings: {
      create: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

vi.mock("~/server/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/server/security", () => ({
  hashIP: vi.fn(() => "hashed-ip"),
  sanitizeString: vi.fn((s: string) => s),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { deliveryRouter } from "../api/routers/delivery";
import {
  createUser,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return deliveryRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return deliveryRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";
const VALID_UUID_3 = "00000000-0000-4000-a000-000000000003";
const VALID_UUID_4 = "00000000-0000-4000-a000-000000000004";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deliveryRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockOrders = vi.mocked(db.orders);
  const mockDeliveryRequests = vi.mocked(db.deliveryRequests);
  const mockRestaurantDrivers = vi.mocked(db.restaurantDrivers);
  const mockDrivers = vi.mocked(db.drivers);
  const mockDriverEarnings = vi.mocked(db.driverEarnings);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 4 });
  });

  // =========================================================================
  // 1. createDeliveryRequest (private)
  // =========================================================================

  describe("createDeliveryRequest", () => {
    it("should create a delivery request with distance calculation", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        deliveryFee: 2000,
        restaurantLat: 33.5731,
        restaurantLng: -7.5898,
      } as never);

      mockOrders.findFirst.mockResolvedValue({
        id: VALID_UUID_2,
        status: "confirmed",
      } as never);

      mockDeliveryRequests.create.mockResolvedValue({
        id: VALID_UUID_3,
        status: "pending",
        estimatedDistance: 5.2,
        deliveryFee: 2000,
        driverEarning: 1600,
      } as never);

      const result = await caller.createDeliveryRequest({
        orderId: VALID_UUID_2,
        menuId: VALID_UUID,
        dropoffAddress: "123 Main St, Casablanca",
        dropoffLat: 33.5950,
        dropoffLng: -7.6187,
        priority: 5,
      });

      expect(result).toHaveProperty("id", VALID_UUID_3);
      expect(result).toHaveProperty("status", "pending");
      expect(mockDeliveryRequests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: VALID_UUID_2,
          menuId: VALID_UUID,
          status: "pending",
          dropoffAddress: "123 Main St, Casablanca",
          deliveryFee: 2000,
          driverEarning: 1600,
          priority: 5,
        }),
      });
    });

    it("should create delivery without coordinates (null distance)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        deliveryFee: 1500,
        restaurantLat: null,
        restaurantLng: null,
      } as never);

      mockOrders.findFirst.mockResolvedValue({
        id: VALID_UUID_2,
        status: "confirmed",
      } as never);

      mockDeliveryRequests.create.mockResolvedValue({
        id: VALID_UUID_3,
        status: "pending",
        estimatedDistance: null,
      } as never);

      const result = await caller.createDeliveryRequest({
        orderId: VALID_UUID_2,
        menuId: VALID_UUID,
        dropoffAddress: "456 Elm St",
      });

      expect(result).toHaveProperty("status", "pending");
      expect(mockDeliveryRequests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          estimatedDistance: null,
          estimatedDuration: null,
        }),
      });
    });

    it("should throw FORBIDDEN when menu does not belong to user", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.createDeliveryRequest({
          orderId: VALID_UUID_2,
          menuId: VALID_UUID,
          dropoffAddress: "123 Test St",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to create deliveries for this menu",
      });
    });

    it("should throw NOT_FOUND when order does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        deliveryFee: 1000,
        restaurantLat: null,
        restaurantLng: null,
      } as never);

      mockOrders.findFirst.mockResolvedValue(null);

      await expect(
        caller.createDeliveryRequest({
          orderId: VALID_UUID_2,
          menuId: VALID_UUID,
          dropoffAddress: "123 Test St",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Order not found for this menu",
      });
    });

    it("should calculate driver earning as 80% of delivery fee", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        deliveryFee: 2500,
        restaurantLat: null,
        restaurantLng: null,
      } as never);

      mockOrders.findFirst.mockResolvedValue({
        id: VALID_UUID_2,
        status: "confirmed",
      } as never);

      mockDeliveryRequests.create.mockResolvedValue({
        id: VALID_UUID_3,
      } as never);

      await caller.createDeliveryRequest({
        orderId: VALID_UUID_2,
        menuId: VALID_UUID,
        dropoffAddress: "Test",
      });

      expect(mockDeliveryRequests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deliveryFee: 2500,
          driverEarning: 2000, // Math.round(2500 * 0.8)
        }),
      });
    });
  });

  // =========================================================================
  // 2. getDeliveryRequests (private)
  // =========================================================================

  describe("getDeliveryRequests", () => {
    it("should return paginated deliveries for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);

      const deliveryData = [
        { id: VALID_UUID_2, status: "pending", orders: {}, driver: null },
        { id: VALID_UUID_3, status: "assigned", orders: {}, driver: {} },
      ];

      mockDeliveryRequests.findMany.mockResolvedValue(deliveryData as never);

      const result = await caller.getDeliveryRequests({
        menuId: VALID_UUID,
        limit: 50,
      });

      expect(result.deliveries).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should return nextCursor when more results exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);

      // Return limit+1 items to trigger cursor
      const items = Array.from({ length: 3 }, (_, i) => ({
        id: `00000000-0000-4000-a000-00000000000${i + 1}`,
        status: "pending",
      }));

      // The last item's id will become the cursor after pop()
      const expectedCursorId = items[2]!.id;

      mockDeliveryRequests.findMany.mockResolvedValue(items as never);

      const result = await caller.getDeliveryRequests({
        menuId: VALID_UUID,
        limit: 2,
      });

      expect(result.deliveries).toHaveLength(2);
      expect(result.nextCursor).toBe(expectedCursorId);
    });

    it("should filter by status when provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockDeliveryRequests.findMany.mockResolvedValue([] as never);

      await caller.getDeliveryRequests({
        menuId: VALID_UUID,
        status: "delivered",
      });

      expect(mockDeliveryRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: VALID_UUID,
            status: "delivered",
          }),
        }),
      );
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getDeliveryRequests({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  // =========================================================================
  // 3. getDeliveryRequest (private)
  // =========================================================================

  describe("getDeliveryRequest", () => {
    it("should return delivery when user is the menu owner", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menus: { userId: owner.id },
        assignedDriverId: null,
        orders: {},
        driver: null,
      } as never);

      mockDrivers.findFirst.mockResolvedValue(null);

      const result = await caller.getDeliveryRequest({
        deliveryId: VALID_UUID,
      });

      expect(result).toHaveProperty("id", VALID_UUID);
    });

    it("should return delivery when user is the assigned driver", async () => {
      const driverUser = createUser();
      const caller = createPrivateCaller(driverUser.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menus: { userId: "other-owner-id" },
        assignedDriverId: VALID_UUID_2,
        orders: {},
        driver: {},
      } as never);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID_2,
      } as never);

      const result = await caller.getDeliveryRequest({
        deliveryId: VALID_UUID,
      });

      expect(result).toHaveProperty("id", VALID_UUID);
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue(null);

      await expect(
        caller.getDeliveryRequest({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Delivery request not found",
      });
    });

    it("should throw FORBIDDEN when user is neither owner nor driver", async () => {
      const randomUser = createUser();
      const caller = createPrivateCaller(randomUser.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menus: { userId: "other-owner-id" },
        assignedDriverId: VALID_UUID_2,
        orders: {},
        driver: {},
      } as never);

      // User has no driver profile
      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.getDeliveryRequest({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to view this delivery",
      });
    });
  });

  // =========================================================================
  // 4. assignDriver (private)
  // =========================================================================

  describe("assignDriver", () => {
    it("should assign an approved active driver to a pending delivery", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        menus: { userId: owner.id },
      } as never);

      mockRestaurantDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID_3,
      } as never);

      mockDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID_4,
        fullName: "Ahmed Driver",
        isAvailable: true,
        status: "active",
      } as never);

      mockDeliveryRequests.update.mockResolvedValue({
        id: VALID_UUID,
        assignedDriverId: VALID_UUID_4,
        status: "assigned",
      } as never);

      const result = await caller.assignDriver({
        deliveryId: VALID_UUID,
        driverId: VALID_UUID_4,
      });

      expect(result).toHaveProperty("status", "assigned");
      expect(result).toHaveProperty("assignedDriverId", VALID_UUID_4);
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue(null);

      await expect(
        caller.assignDriver({
          deliveryId: VALID_UUID,
          driverId: VALID_UUID_2,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        menus: { userId: "other-user-id" },
      } as never);

      await expect(
        caller.assignDriver({
          deliveryId: VALID_UUID,
          driverId: VALID_UUID_3,
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw BAD_REQUEST when delivery is not pending", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "assigned",
        menus: { userId: owner.id },
      } as never);

      await expect(
        caller.assignDriver({
          deliveryId: VALID_UUID,
          driverId: VALID_UUID_3,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("assigned"),
      });
    });

    it("should throw BAD_REQUEST when driver is not approved for restaurant", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        menus: { userId: owner.id },
      } as never);

      mockRestaurantDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.assignDriver({
          deliveryId: VALID_UUID,
          driverId: VALID_UUID_3,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Driver is not approved for this restaurant",
      });
    });

    it("should throw BAD_REQUEST when driver is not active", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        menus: { userId: owner.id },
      } as never);

      mockRestaurantDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID_3,
      } as never);

      mockDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID_4,
        fullName: "Inactive Driver",
        isAvailable: true,
        status: "suspended",
      } as never);

      await expect(
        caller.assignDriver({
          deliveryId: VALID_UUID,
          driverId: VALID_UUID_4,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Driver is not active",
      });
    });
  });

  // =========================================================================
  // 5. updateDeliveryStatus (private)
  // =========================================================================

  describe("updateDeliveryStatus", () => {
    it("should transition pending -> assigned", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        menus: { userId: owner.id },
        assignedDriverId: null,
        pickedUpAt: null,
        driverEarning: 1600,
      } as never);

      mockDrivers.findFirst.mockResolvedValue(null);

      mockDeliveryRequests.update.mockResolvedValue({
        id: VALID_UUID,
        status: "assigned",
      } as never);

      const result = await caller.updateDeliveryStatus({
        deliveryId: VALID_UUID,
        status: "assigned",
      });

      expect(result).toHaveProperty("status", "assigned");
    });

    it("should transition picked_up -> in_transit", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "picked_up",
        menus: { userId: owner.id },
        assignedDriverId: VALID_UUID_2,
        pickedUpAt: new Date(),
        driverEarning: 1600,
      } as never);

      mockDrivers.findFirst.mockResolvedValue(null);

      mockDeliveryRequests.update.mockResolvedValue({
        id: VALID_UUID,
        status: "in_transit",
      } as never);

      const result = await caller.updateDeliveryStatus({
        deliveryId: VALID_UUID,
        status: "in_transit",
      });

      expect(result).toHaveProperty("status", "in_transit");
    });

    it("should create earnings record on delivered status using settlement engine", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "in_transit",
        menus: { userId: owner.id },
        assignedDriverId: VALID_UUID_2,
        menuId: VALID_UUID_3,
        pickedUpAt: new Date(Date.now() - 30 * 60000), // 30 min ago
        driverEarning: 1600,
        estimatedDistance: 3,
        tipAmount: 0,
      } as never);

      mockDrivers.findFirst.mockResolvedValue(null);

      mockDeliveryRequests.update.mockResolvedValue({
        id: VALID_UUID,
        status: "delivered",
      } as never);

      mockDriverEarnings.create.mockResolvedValue({} as never);
      mockDrivers.update.mockResolvedValue({} as never);

      const result = await caller.updateDeliveryStatus({
        deliveryId: VALID_UUID,
        status: "delivered",
      });

      expect(result).toHaveProperty("status", "delivered");

      // Settlement engine calculates driver pay: base 1000 + dist bonus (3km * 300 = 900) + peak/weather
      // Exact amount depends on time of day (peak hours), so we verify shape
      expect(mockDriverEarnings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          driverId: VALID_UUID_2,
          deliveryRequestId: VALID_UUID,
          type: "delivery_fee",
        }),
      });

      // Verify earnings amount is a reasonable number (>= minGuaranteedPay of 800)
      const earningsCall = mockDriverEarnings.create.mock.calls[0]?.[0] as {
        data: { amount: number };
      };
      expect(earningsCall.data.amount).toBeGreaterThanOrEqual(800);

      expect(mockDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_2 },
        data: expect.objectContaining({
          totalDeliveries: { increment: 1 },
        }),
      });

      // Also verify the delivery record itself was updated with calculated earning
      expect(mockDeliveryRequests.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_UUID },
          data: expect.objectContaining({ driverEarning: expect.any(Number) }),
        }),
      );
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateDeliveryStatus({
          deliveryId: VALID_UUID,
          status: "assigned",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw FORBIDDEN when user is neither owner nor driver", async () => {
      const randomUser = createUser();
      const caller = createPrivateCaller(randomUser.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        menus: { userId: "other-owner" },
        assignedDriverId: VALID_UUID_2,
        pickedUpAt: null,
        driverEarning: 0,
      } as never);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateDeliveryStatus({
          deliveryId: VALID_UUID,
          status: "assigned",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw BAD_REQUEST for invalid state transition (delivered -> pending)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "delivered",
        menus: { userId: owner.id },
        assignedDriverId: VALID_UUID_2,
        pickedUpAt: null,
        driverEarning: 0,
      } as never);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateDeliveryStatus({
          deliveryId: VALID_UUID,
          status: "pending",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("delivered"),
      });
    });

    it("should throw BAD_REQUEST for invalid transition (pending -> delivered)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        menus: { userId: owner.id },
        assignedDriverId: null,
        pickedUpAt: null,
        driverEarning: 0,
      } as never);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateDeliveryStatus({
          deliveryId: VALID_UUID,
          status: "delivered",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("pending"),
      });
    });

    it("should allow assigned driver to update status", async () => {
      const driverUser = createUser();
      const caller = createPrivateCaller(driverUser.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "assigned",
        menus: { userId: "some-owner" },
        assignedDriverId: VALID_UUID_2,
        pickedUpAt: null,
        driverEarning: 1600,
      } as never);

      // User has a driver profile that matches assignedDriverId
      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID_2,
      } as never);

      mockDeliveryRequests.update.mockResolvedValue({
        id: VALID_UUID,
        status: "picked_up",
      } as never);

      const result = await caller.updateDeliveryStatus({
        deliveryId: VALID_UUID,
        status: "picked_up",
      });

      expect(result).toHaveProperty("status", "picked_up");
    });
  });

  // =========================================================================
  // 6. autoDispatch (private)
  // =========================================================================

  describe("autoDispatch", () => {
    it("should auto-assign the highest-scoring driver", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        pickupLat: 33.5731,
        pickupLng: -7.5898,
        menus: {
          userId: owner.id,
          restaurantLat: 33.5731,
          restaurantLng: -7.5898,
        },
      } as never);

      // Two available, active drivers
      mockRestaurantDrivers.findMany.mockResolvedValue([
        {
          priority: 5,
          driver: {
            id: VALID_UUID_3,
            fullName: "Driver A",
            isAvailable: true,
            status: "active",
            rating: 4.8,
            currentLat: 33.574,
            currentLng: -7.590,
          },
        },
        {
          priority: 2,
          driver: {
            id: VALID_UUID_4,
            fullName: "Driver B",
            isAvailable: true,
            status: "active",
            rating: 3.5,
            currentLat: 33.580,
            currentLng: -7.600,
          },
        },
      ] as never);

      mockDeliveryRequests.update.mockResolvedValue({
        id: VALID_UUID,
        status: "assigned",
      } as never);

      const result = await caller.autoDispatch({
        deliveryId: VALID_UUID,
        maxDistanceKm: 10,
      });

      expect(result.assigned).toBe(true);
      expect(result.driver).not.toBeNull();
      // Driver A has priority=5 (*3=15) + rating=4.8 (*2=9.6) + high proximity
      // Driver B has priority=2 (*3=6) + rating=3.5 (*2=7) + lower proximity
      expect(result.driver!.id).toBe(VALID_UUID_3);
    });

    it("should return no-drivers-available when no candidates", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        pickupLat: 33.5731,
        pickupLng: -7.5898,
        menus: {
          userId: owner.id,
          restaurantLat: 33.5731,
          restaurantLng: -7.5898,
        },
      } as never);

      mockRestaurantDrivers.findMany.mockResolvedValue([] as never);

      const result = await caller.autoDispatch({
        deliveryId: VALID_UUID,
      });

      expect(result.assigned).toBe(false);
      expect(result.driver).toBeNull();
      expect(result.reason).toBe("No available drivers");
    });

    it("should filter out drivers beyond maxDistanceKm", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        pickupLat: 33.5731,
        pickupLng: -7.5898,
        menus: {
          userId: owner.id,
          restaurantLat: 33.5731,
          restaurantLng: -7.5898,
        },
      } as never);

      // Driver is very far away (different city)
      mockRestaurantDrivers.findMany.mockResolvedValue([
        {
          priority: 5,
          driver: {
            id: VALID_UUID_3,
            fullName: "Far Away Driver",
            isAvailable: true,
            status: "active",
            rating: 5.0,
            currentLat: 34.0209,
            currentLng: -6.8416, // Rabat (~90km from Casablanca)
          },
        },
      ] as never);

      const result = await caller.autoDispatch({
        deliveryId: VALID_UUID,
        maxDistanceKm: 5,
      });

      expect(result.assigned).toBe(false);
      expect(result.reason).toBe("No drivers within range");
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.autoDispatch({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: "Auto-dispatch rate limit exceeded",
      });
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue(null);

      await expect(
        caller.autoDispatch({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        menus: { userId: "other-owner", restaurantLat: 33.0, restaurantLng: -7.0 },
      } as never);

      await expect(
        caller.autoDispatch({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw BAD_REQUEST when delivery is not pending", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "assigned",
        menus: { userId: owner.id, restaurantLat: 33.0, restaurantLng: -7.0 },
      } as never);

      await expect(
        caller.autoDispatch({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("assigned"),
      });
    });

    it("should filter out unavailable drivers", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        menuId: VALID_UUID_2,
        status: "pending",
        pickupLat: 33.5731,
        pickupLng: -7.5898,
        menus: {
          userId: owner.id,
          restaurantLat: 33.5731,
          restaurantLng: -7.5898,
        },
      } as never);

      mockRestaurantDrivers.findMany.mockResolvedValue([
        {
          priority: 5,
          driver: {
            id: VALID_UUID_3,
            fullName: "Unavailable Driver",
            isAvailable: false,
            status: "active",
            rating: 5.0,
            currentLat: 33.574,
            currentLng: -7.590,
          },
        },
      ] as never);

      const result = await caller.autoDispatch({
        deliveryId: VALID_UUID,
      });

      expect(result.assigned).toBe(false);
      expect(result.reason).toBe("No available drivers");
    });
  });

  // =========================================================================
  // 7. cancelDelivery (private)
  // =========================================================================

  describe("cancelDelivery", () => {
    it("should cancel a pending delivery", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        notes: null,
        menus: { userId: owner.id },
      } as never);

      mockDeliveryRequests.update.mockResolvedValue({
        id: VALID_UUID,
        status: "cancelled",
      } as never);

      const result = await caller.cancelDelivery({
        deliveryId: VALID_UUID,
        reason: "Customer changed mind",
      });

      expect(result).toHaveProperty("status", "cancelled");
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue(null);

      await expect(
        caller.cancelDelivery({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw FORBIDDEN when user does not own menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        menus: { userId: "other-user" },
      } as never);

      await expect(
        caller.cancelDelivery({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw BAD_REQUEST when delivery is already delivered (terminal state)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "delivered",
        menus: { userId: owner.id },
      } as never);

      await expect(
        caller.cancelDelivery({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("delivered"),
      });
    });

    it("should throw BAD_REQUEST when delivery is already cancelled", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "cancelled",
        menus: { userId: owner.id },
      } as never);

      await expect(
        caller.cancelDelivery({ deliveryId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("cancelled"),
      });
    });
  });

  // =========================================================================
  // 8. rateDriver (public)
  // =========================================================================

  describe("rateDriver", () => {
    it("should rate a delivered order and update driver average", async () => {
      const caller = createPublicCaller();

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "delivered",
        assignedDriverId: VALID_UUID_2,
        rating: null,
      } as never);

      mockDeliveryRequests.update.mockResolvedValue({} as never);

      // All past ratings for the driver (including the new one)
      mockDeliveryRequests.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
      ] as never);

      mockDrivers.update.mockResolvedValue({} as never);

      const result = await caller.rateDriver({
        deliveryId: VALID_UUID,
        rating: 5,
        comment: "Great service!",
      });

      expect(result).toEqual({ success: true, rating: 5 });
      expect(mockDeliveryRequests.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          rating: 5,
          ratingComment: "Great service!",
        }),
      });
    });

    it("should throw TOO_MANY_REQUESTS when already rated (rate limit per delivery)", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.rateDriver({
          deliveryId: VALID_UUID,
          rating: 5,
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: "This delivery has already been rated",
      });
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      const caller = createPublicCaller();

      mockDeliveryRequests.findUnique.mockResolvedValue(null);

      await expect(
        caller.rateDriver({ deliveryId: VALID_UUID, rating: 4 }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw BAD_REQUEST when delivery is not delivered", async () => {
      const caller = createPublicCaller();

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "in_transit",
        assignedDriverId: VALID_UUID_2,
        rating: null,
      } as never);

      await expect(
        caller.rateDriver({ deliveryId: VALID_UUID, rating: 4 }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Can only rate delivered orders",
      });
    });

    it("should throw BAD_REQUEST when delivery already has a rating", async () => {
      const caller = createPublicCaller();

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "delivered",
        assignedDriverId: VALID_UUID_2,
        rating: 4,
      } as never);

      await expect(
        caller.rateDriver({ deliveryId: VALID_UUID, rating: 5 }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "This delivery has already been rated",
      });
    });

    it("should throw BAD_REQUEST when no driver assigned", async () => {
      const caller = createPublicCaller();

      mockDeliveryRequests.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "delivered",
        assignedDriverId: null,
        rating: null,
      } as never);

      await expect(
        caller.rateDriver({ deliveryId: VALID_UUID, rating: 5 }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "No driver assigned to this delivery",
      });
    });
  });

  // =========================================================================
  // 9. getActiveDeliveries (private)
  // =========================================================================

  describe("getActiveDeliveries", () => {
    it("should return active deliveries for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);

      const activeData = [
        { id: VALID_UUID_2, status: "pending" },
        { id: VALID_UUID_3, status: "in_transit" },
      ];

      mockDeliveryRequests.findMany.mockResolvedValue(activeData as never);

      const result = await caller.getActiveDeliveries({
        menuId: VALID_UUID,
      });

      expect(result).toHaveLength(2);
      expect(mockDeliveryRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: VALID_UUID,
            status: { in: ["pending", "assigned", "picked_up", "in_transit"] },
          }),
        }),
      );
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getActiveDeliveries({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // =========================================================================
  // 10. getDeliveryStats (private)
  // =========================================================================

  describe("getDeliveryStats", () => {
    it("should return aggregated delivery statistics", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);

      mockDeliveryRequests.count
        .mockResolvedValueOnce(100 as never) // total
        .mockResolvedValueOnce(80 as never)  // delivered
        .mockResolvedValueOnce(10 as never)  // cancelled
        .mockResolvedValueOnce(5 as never);  // failed

      mockDeliveryRequests.aggregate
        .mockResolvedValueOnce({
          _sum: { deliveryFee: 200000, driverEarning: 160000 },
        } as never)
        .mockResolvedValueOnce({
          _avg: { actualDuration: 28.5 },
        } as never);

      const result = await caller.getDeliveryStats({
        menuId: VALID_UUID,
      });

      expect(result.total).toBe(100);
      expect(result.delivered).toBe(80);
      expect(result.cancelled).toBe(10);
      expect(result.failed).toBe(5);
      expect(result.pending).toBe(5); // 100 - 80 - 10 - 5
      expect(result.successRate).toBe(80);
      expect(result.totalFees).toBe(200000);
      expect(result.totalDriverEarnings).toBe(160000);
      expect(result.avgDeliveryMinutes).toBe(29); // Math.round(28.5)
    });

    it("should return zero stats when no deliveries exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);

      mockDeliveryRequests.count.mockResolvedValue(0 as never);
      mockDeliveryRequests.aggregate.mockResolvedValue({
        _sum: { deliveryFee: null, driverEarning: null },
        _avg: { actualDuration: null },
      } as never);

      const result = await caller.getDeliveryStats({
        menuId: VALID_UUID,
      });

      expect(result.total).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.totalFees).toBe(0);
      expect(result.avgDeliveryMinutes).toBeNull();
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getDeliveryStats({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should pass date filters when provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockDeliveryRequests.count.mockResolvedValue(0 as never);
      mockDeliveryRequests.aggregate.mockResolvedValue({
        _sum: { deliveryFee: null, driverEarning: null },
        _avg: { actualDuration: null },
      } as never);

      await caller.getDeliveryStats({
        menuId: VALID_UUID,
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-31T23:59:59.000Z",
      });

      // Verify count was called with date filters
      expect(mockDeliveryRequests.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          menuId: VALID_UUID,
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      });
    });
  });
});
