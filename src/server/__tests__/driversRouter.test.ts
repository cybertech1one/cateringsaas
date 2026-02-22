import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the drivers tRPC router.
 * Covers all 15 endpoints: register, getProfile, updateProfile, updateLocation,
 * toggleAvailability, getAvailability, setAvailability, applyToRestaurant,
 * getMyRestaurants, getMyDeliveries, getEarnings, getDriversForRestaurant,
 * approveDriver, rejectDriver, setDriverPriority.
 *
 * Tests IDOR protection, status-based access control, rate limiting,
 * duplicate phone checks, pagination cursors, and input validation.
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
    drivers: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    restaurantDrivers: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    driverAvailability: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    driverEarnings: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    driverDocuments: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    deliveryRequests: {
      findMany: vi.fn(),
    },
    menus: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    profiles: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
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
import { driversRouter } from "../api/routers/drivers";
import {
  createUser,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return driversRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return driversRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

function createAdminCaller(userId: string) {
  return driversRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
    userRole: "admin",
  } as never);
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";
const VALID_UUID_3 = "00000000-0000-4000-a000-000000000003";
const _VALID_UUID_4 = "00000000-0000-4000-a000-000000000004";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("driversRouter", () => {
  const mockDrivers = vi.mocked(db.drivers);
  const mockRestaurantDrivers = vi.mocked(db.restaurantDrivers);
  const mockDriverAvailability = vi.mocked(db.driverAvailability);
  const mockDriverEarnings = vi.mocked(db.driverEarnings);
  const mockDeliveryRequests = vi.mocked(db.deliveryRequests);
  const mockDriverDocuments = vi.mocked(db.driverDocuments);
  const mockMenus = vi.mocked(db.menus);
  const mockProfiles = vi.mocked(db.profiles);
  const mockTransaction = vi.mocked(db.$transaction);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 4 });
    mockTransaction.mockImplementation(async (fn) => {
      return (fn as (...args: unknown[]) => unknown)({
        driverAvailability: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
      });
    });
  });

  // =========================================================================
  // 1. register (public)
  // =========================================================================

  describe("register", () => {
    it("should register a new driver with valid input", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue(null); // No duplicate phone
      mockDrivers.create.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Ahmed Driver",
        status: "pending",
      } as never);

      const result = await caller.register({
        fullName: "Ahmed Driver",
        phone: "+212612345678",
        city: "Casablanca",
        vehicleType: "motorcycle",
      });

      expect(result).toEqual({
        id: VALID_UUID,
        fullName: "Ahmed Driver",
        status: "pending",
      });
      expect(mockDrivers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fullName: "Ahmed Driver",
          phone: "+212612345678",
          city: "Casablanca",
          vehicleType: "motorcycle",
          status: "pending",
          isAvailable: false,
          rating: 5.0,
          totalDeliveries: 0,
          totalEarnings: 0,
        }),
      });
    });

    it("should register with optional fields (email, license, ID)", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue(null);
      mockDrivers.create.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Fatima Zahra",
        status: "pending",
      } as never);

      const result = await caller.register({
        fullName: "Fatima Zahra",
        phone: "+212699887766",
        email: "Fatima@Example.COM",
        city: "Marrakech",
        vehicleType: "bicycle",
        licenseNumber: "LIC-12345",
        idNumber: "ID-67890",
      });

      expect(result.status).toBe("pending");
      expect(mockDrivers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "fatima@example.com",
          licenseNumber: "LIC-12345",
          idNumber: "ID-67890",
        }),
      });
    });

    it("should throw BAD_REQUEST when phone number already exists", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      await expect(
        caller.register({
          fullName: "Duplicate Driver",
          phone: "+212612345678",
          city: "Rabat",
          vehicleType: "car",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "A driver with this phone number already exists",
      });

      expect(mockDrivers.create).not.toHaveBeenCalled();
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.register({
          fullName: "Rate Limited",
          phone: "+212611111111",
          city: "Fes",
          vehicleType: "on_foot",
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: "Too many registration attempts. Please try again later.",
      });

      expect(mockDrivers.findFirst).not.toHaveBeenCalled();
      expect(mockDrivers.create).not.toHaveBeenCalled();
    });

    it("should reject input with name too short", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.register({
          fullName: "A",
          phone: "+212612345678",
          city: "Casablanca",
          vehicleType: "motorcycle",
        }),
      ).rejects.toThrow();
    });

    it("should reject input with invalid vehicle type", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.register({
          fullName: "Test Driver",
          phone: "+212612345678",
          city: "Casablanca",
          vehicleType: "helicopter" as never,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 2. getProfile (private)
  // =========================================================================

  describe("getProfile", () => {
    it("should return driver profile for authenticated user", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      const profileData = {
        id: VALID_UUID,
        userId: user.id,
        fullName: "Ahmed Driver",
        phone: "+212612345678",
        email: null,
        city: "Casablanca",
        vehicleType: "motorcycle",
        licenseNumber: null,
        idNumber: null,
        profilePhotoUrl: null,
        status: "active",
        rating: 4.8,
        totalDeliveries: 42,
        totalEarnings: 84000,
        isAvailable: true,
        currentLat: 33.5731,
        currentLng: -7.5898,
        lastLocationUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDrivers.findFirst.mockResolvedValue(profileData as never);

      const result = await caller.getProfile();

      expect(result).toEqual(profileData);
      expect(mockDrivers.findFirst).toHaveBeenCalledWith({
        where: { userId: user.id },
        select: expect.objectContaining({
          id: true,
          fullName: true,
          status: true,
          rating: true,
        }),
      });
    });

    it("should throw NOT_FOUND when user has no driver profile", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(caller.getProfile()).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found. Please register first.",
      });
    });
  });

  // =========================================================================
  // 3. updateProfile (private)
  // =========================================================================

  describe("updateProfile", () => {
    it("should update driver profile fields", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Updated Name",
        city: "Marrakech",
      } as never);

      const result = await caller.updateProfile({
        fullName: "Updated Name",
        city: "Marrakech",
        vehicleType: "car",
      });

      expect(result).toHaveProperty("fullName", "Updated Name");
      expect(mockDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          fullName: "Updated Name",
          city: "Marrakech",
          vehicleType: "car",
        }),
      });
    });

    it("should normalize email to lowercase", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      await caller.updateProfile({
        email: "Ahmed@Example.COM",
      });

      expect(mockDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          email: "ahmed@example.com",
        }),
      });
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateProfile({ fullName: "New Name" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });

    it("should only update provided fields", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      await caller.updateProfile({
        phone: "+212699999999",
      });

      const updateCall = mockDrivers.update.mock.calls[0]![0];
      const data = updateCall.data as Record<string, unknown>;

      expect(data.phone).toBe("+212699999999");
      expect(data.fullName).toBeUndefined();
      expect(data.city).toBeUndefined();
      expect(data.vehicleType).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. updateLocation (private)
  // =========================================================================

  describe("updateLocation", () => {
    it("should update driver location coordinates", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const mockDate = new Date("2026-02-21T10:00:00Z");

      mockDrivers.update.mockResolvedValue({
        currentLat: 33.5731,
        currentLng: -7.5898,
        lastLocationUpdate: mockDate,
      } as never);

      const result = await caller.updateLocation({
        lat: 33.5731,
        lng: -7.5898,
      });

      expect(result).toHaveProperty("currentLat", 33.5731);
      expect(result).toHaveProperty("currentLng", -7.5898);
      expect(result).toHaveProperty("lastLocationUpdate");
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.updateLocation({ lat: 33.0, lng: -7.0 }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: "Location update rate limit exceeded",
      });

      expect(mockDrivers.findFirst).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateLocation({ lat: 33.0, lng: -7.0 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });

    it("should reject invalid coordinates", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.updateLocation({ lat: 200, lng: -7.0 }),
      ).rejects.toThrow();

      await expect(
        caller.updateLocation({ lat: 33.0, lng: -200 }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 5. toggleAvailability (private)
  // =========================================================================

  describe("toggleAvailability", () => {
    it("should toggle availability from false to true for active driver", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isAvailable: false,
        status: "active",
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        isAvailable: true,
      } as never);

      const result = await caller.toggleAvailability();

      expect(result).toEqual({ isAvailable: true });
      expect(mockDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          isAvailable: true,
        }),
      });
    });

    it("should toggle availability from true to false for active driver", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isAvailable: true,
        status: "active",
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        isAvailable: false,
      } as never);

      const result = await caller.toggleAvailability();

      expect(result).toEqual({ isAvailable: false });
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(caller.toggleAvailability()).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });

    it("should throw BAD_REQUEST when driver is not active (pending)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isAvailable: false,
        status: "pending",
      } as never);

      await expect(caller.toggleAvailability()).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Only active drivers can toggle availability",
      });
    });

    it("should throw BAD_REQUEST when driver is suspended", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isAvailable: false,
        status: "suspended",
      } as never);

      await expect(caller.toggleAvailability()).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Only active drivers can toggle availability",
      });
    });
  });

  // =========================================================================
  // 6. getAvailability (private)
  // =========================================================================

  describe("getAvailability", () => {
    it("should return availability schedule for driver", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const scheduleData = [
        { id: VALID_UUID_2, dayOfWeek: "monday", startTime: "08:00", endTime: "17:00", isActive: true },
        { id: VALID_UUID_3, dayOfWeek: "tuesday", startTime: "08:00", endTime: "17:00", isActive: true },
      ];

      mockDriverAvailability.findMany.mockResolvedValue(scheduleData as never);

      const result = await caller.getAvailability();

      expect(result).toHaveLength(2);
      expect(mockDriverAvailability.findMany).toHaveBeenCalledWith({
        where: { driverId: VALID_UUID },
        select: expect.objectContaining({
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true,
        }),
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    });

    it("should return empty array when no availability set", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockDriverAvailability.findMany.mockResolvedValue([] as never);

      const result = await caller.getAvailability();

      expect(result).toEqual([]);
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(caller.getAvailability()).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });
  });

  // =========================================================================
  // 7. setAvailability (private)
  // =========================================================================

  describe("setAvailability", () => {
    it("should replace availability windows in a transaction", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const result = await caller.setAvailability({
        windows: [
          { dayOfWeek: "monday", startTime: "08:00", endTime: "17:00" },
          { dayOfWeek: "friday", startTime: "10:00", endTime: "22:00" },
        ],
      });

      expect(result).toEqual({ success: true, windowCount: 2 });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should handle empty windows array (clear all availability)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const result = await caller.setAvailability({
        windows: [],
      });

      expect(result).toEqual({ success: true, windowCount: 0 });
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.setAvailability({
          windows: [
            { dayOfWeek: "monday", startTime: "08:00", endTime: "17:00" },
          ],
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });

    it("should reject invalid time format", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.setAvailability({
          windows: [
            { dayOfWeek: "monday", startTime: "8am", endTime: "5pm" },
          ],
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid day of week", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.setAvailability({
          windows: [
            { dayOfWeek: "funday" as never, startTime: "08:00", endTime: "17:00" },
          ],
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 8. applyToRestaurant (private)
  // =========================================================================

  describe("applyToRestaurant", () => {
    it("should create an application to a restaurant", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        status: "active",
      } as never);

      mockMenus.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Riad Casablanca",
      } as never);

      mockRestaurantDrivers.findUnique.mockResolvedValue(null); // No existing application

      mockRestaurantDrivers.create.mockResolvedValue({
        id: VALID_UUID_3,
        status: "pending",
      } as never);

      const result = await caller.applyToRestaurant({
        menuId: VALID_UUID_2,
        notes: "I have 3 years delivery experience",
      });

      expect(result).toEqual({
        id: VALID_UUID_3,
        status: "pending",
        menuName: "Riad Casablanca",
      });
      expect(mockRestaurantDrivers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          menuId: VALID_UUID_2,
          driverId: VALID_UUID,
          status: "pending",
          notes: "I have 3 years delivery experience",
        }),
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.applyToRestaurant({ menuId: VALID_UUID_2 }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: "Too many applications. Please try again later.",
      });
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.applyToRestaurant({ menuId: VALID_UUID_2 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found. Please register first.",
      });
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        status: "active",
      } as never);

      mockMenus.findUnique.mockResolvedValue(null);

      await expect(
        caller.applyToRestaurant({ menuId: VALID_UUID_2 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Restaurant menu not found",
      });
    });

    it("should throw BAD_REQUEST when already applied to restaurant", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        status: "active",
      } as never);

      mockMenus.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Riad Casablanca",
      } as never);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        status: "pending",
      } as never);

      await expect(
        caller.applyToRestaurant({ menuId: VALID_UUID_2 }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("already applied"),
      });

      expect(mockRestaurantDrivers.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 9. getMyRestaurants (private)
  // =========================================================================

  describe("getMyRestaurants", () => {
    it("should return driver's restaurant applications", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const restaurantData = [
        {
          id: VALID_UUID_2,
          status: "approved",
          priority: 5,
          appliedAt: new Date(),
          approvedAt: new Date(),
          notes: null,
          menus: {
            id: VALID_UUID_3,
            name: "Atlas Grill",
            city: "Casablanca",
            address: "12 Rue Mohammed V",
            logoImageUrl: null,
          },
        },
      ];

      mockRestaurantDrivers.findMany.mockResolvedValue(restaurantData as never);

      const result = await caller.getMyRestaurants();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("status", "approved");
    });

    it("should return empty array when driver has no applications", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockRestaurantDrivers.findMany.mockResolvedValue([] as never);

      const result = await caller.getMyRestaurants();

      expect(result).toEqual([]);
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(caller.getMyRestaurants()).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });
  });

  // =========================================================================
  // 10. getMyDeliveries (private)
  // =========================================================================

  describe("getMyDeliveries", () => {
    it("should return paginated deliveries for driver", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const deliveryData = [
        { id: VALID_UUID_2, status: "delivered", orders: {}, menus: {} },
        { id: VALID_UUID_3, status: "in_transit", orders: {}, menus: {} },
      ];

      mockDeliveryRequests.findMany.mockResolvedValue(deliveryData as never);

      const result = await caller.getMyDeliveries({});

      expect(result.deliveries).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should return nextCursor when more results exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      // Return limit+1 items
      const items = Array.from({ length: 3 }, (_, i) => ({
        id: `00000000-0000-4000-a000-00000000000${i + 1}`,
        status: "delivered",
      }));

      const expectedCursorId = items[2]!.id;

      mockDeliveryRequests.findMany.mockResolvedValue(items as never);

      const result = await caller.getMyDeliveries({ limit: 2 });

      expect(result.deliveries).toHaveLength(2);
      expect(result.nextCursor).toBe(expectedCursorId);
    });

    it("should filter by status when provided", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockDeliveryRequests.findMany.mockResolvedValue([] as never);

      await caller.getMyDeliveries({ status: "delivered" });

      expect(mockDeliveryRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedDriverId: VALID_UUID,
            status: "delivered",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(caller.getMyDeliveries({})).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });
  });

  // =========================================================================
  // 11. getEarnings (private)
  // =========================================================================

  describe("getEarnings", () => {
    it("should return paginated earnings with totals", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        totalEarnings: 50000,
      } as never);

      const earningsData = [
        { id: VALID_UUID_2, amount: 1600, type: "delivery_fee", description: "Delivery #abc", createdAt: new Date(), deliveryRequestId: VALID_UUID_3 },
      ];

      mockDriverEarnings.findMany.mockResolvedValue(earningsData as never);
      mockDriverEarnings.aggregate.mockResolvedValue({
        _sum: { amount: 1600 },
        _count: 1,
      } as never);

      const result = await caller.getEarnings({});

      expect(result.earnings).toHaveLength(1);
      expect(result.totalAmount).toBe(1600);
      expect(result.totalCount).toBe(1);
      expect(result.lifetimeEarnings).toBe(50000);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should return nextCursor when more results exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        totalEarnings: 50000,
      } as never);

      const items = Array.from({ length: 3 }, (_, i) => ({
        id: `00000000-0000-4000-a000-00000000000${i + 1}`,
        amount: 1600,
        type: "delivery_fee",
        description: `Delivery #${i}`,
        createdAt: new Date(),
        deliveryRequestId: VALID_UUID_3,
      }));

      const expectedCursorId = items[2]!.id;

      mockDriverEarnings.findMany.mockResolvedValue(items as never);
      mockDriverEarnings.aggregate.mockResolvedValue({
        _sum: { amount: 4800 },
        _count: 3,
      } as never);

      const result = await caller.getEarnings({ limit: 2 });

      expect(result.earnings).toHaveLength(2);
      expect(result.nextCursor).toBe(expectedCursorId);
    });

    it("should return zero totals when no earnings exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        totalEarnings: 0,
      } as never);

      mockDriverEarnings.findMany.mockResolvedValue([] as never);
      mockDriverEarnings.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: 0,
      } as never);

      const result = await caller.getEarnings({});

      expect(result.earnings).toEqual([]);
      expect(result.totalAmount).toBe(0);
      expect(result.totalCount).toBe(0);
      expect(result.lifetimeEarnings).toBe(0);
    });

    it("should pass date filters when provided", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        totalEarnings: 50000,
      } as never);

      mockDriverEarnings.findMany.mockResolvedValue([] as never);
      mockDriverEarnings.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: 0,
      } as never);

      await caller.getEarnings({
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-31T23:59:59.000Z",
      });

      expect(mockDriverEarnings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            driverId: VALID_UUID,
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(caller.getEarnings({})).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    });
  });

  // =========================================================================
  // 12. getDriversForRestaurant (private, owner)
  // =========================================================================

  describe("getDriversForRestaurant", () => {
    it("should return drivers for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const driversData = [
        {
          id: VALID_UUID_2,
          status: "approved",
          driver: {
            id: VALID_UUID_3,
            fullName: "Ahmed Driver",
            phone: "+212612345678",
            email: null,
            city: "Casablanca",
            vehicleType: "motorcycle",
            rating: 4.8,
            totalDeliveries: 42,
            isAvailable: true,
            status: "active",
            profilePhotoUrl: null,
          },
        },
      ];

      mockRestaurantDrivers.findMany.mockResolvedValue(driversData as never);

      const result = await caller.getDriversForRestaurant({
        menuId: VALID_UUID,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("driver");
    });

    it("should filter by status when provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockRestaurantDrivers.findMany.mockResolvedValue([] as never);

      await caller.getDriversForRestaurant({
        menuId: VALID_UUID,
        status: "pending",
      });

      expect(mockRestaurantDrivers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: VALID_UUID,
            status: "pending",
          }),
        }),
      );
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getDriversForRestaurant({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to view drivers for this menu",
      });
    });
  });

  // =========================================================================
  // 13. approveDriver (private, owner)
  // =========================================================================

  describe("approveDriver", () => {
    it("should approve a pending driver application", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        driverId: VALID_UUID_2,
        menuId: VALID_UUID_3,
        menus: { userId: owner.id },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      mockRestaurantDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        status: "approved",
        approvedAt: new Date(),
      } as never);

      const result = await caller.approveDriver({
        restaurantDriverId: VALID_UUID,
      });

      expect(result).toHaveProperty("status", "approved");
      expect(mockRestaurantDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          status: "approved",
          approvedAt: expect.any(Date),
        }),
      });
    });

    it("should throw NOT_FOUND when application does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue(null);

      await expect(
        caller.approveDriver({ restaurantDriverId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver application not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        menus: { userId: "other-user-id" },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      await expect(
        caller.approveDriver({ restaurantDriverId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to approve drivers for this restaurant",
      });
    });

    it("should throw BAD_REQUEST when application is not pending (already approved)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "approved",
        menus: { userId: owner.id },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      await expect(
        caller.approveDriver({ restaurantDriverId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("approved"),
      });
    });

    it("should throw BAD_REQUEST when application is already rejected", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "rejected",
        menus: { userId: owner.id },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      await expect(
        caller.approveDriver({ restaurantDriverId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("rejected"),
      });
    });
  });

  // =========================================================================
  // 14. rejectDriver (private, owner)
  // =========================================================================

  describe("rejectDriver", () => {
    it("should reject a pending driver application", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        driverId: VALID_UUID_2,
        menuId: VALID_UUID_3,
        notes: null,
        menus: { userId: owner.id },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      mockRestaurantDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        status: "rejected",
        notes: "Insufficient experience",
      } as never);

      const result = await caller.rejectDriver({
        restaurantDriverId: VALID_UUID,
        reason: "Insufficient experience",
      });

      expect(result).toHaveProperty("status", "rejected");
      expect(mockRestaurantDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          status: "rejected",
          notes: "Insufficient experience",
        }),
      });
    });

    it("should reject without reason (preserve existing notes)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        driverId: VALID_UUID_2,
        menuId: VALID_UUID_3,
        notes: "Original application notes",
        menus: { userId: owner.id },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      mockRestaurantDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        status: "rejected",
        notes: "Original application notes",
      } as never);

      const result = await caller.rejectDriver({
        restaurantDriverId: VALID_UUID,
      });

      expect(result).toHaveProperty("status", "rejected");
      expect(mockRestaurantDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          status: "rejected",
          notes: "Original application notes",
        }),
      });
    });

    it("should throw NOT_FOUND when application does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue(null);

      await expect(
        caller.rejectDriver({ restaurantDriverId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver application not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        menus: { userId: "other-user-id" },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      await expect(
        caller.rejectDriver({ restaurantDriverId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to reject drivers for this restaurant",
      });
    });

    it("should throw BAD_REQUEST when application is not pending", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "approved",
        menus: { userId: owner.id },
        driver: { fullName: "Ahmed Driver" },
      } as never);

      await expect(
        caller.rejectDriver({ restaurantDriverId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("approved"),
      });
    });
  });

  // =========================================================================
  // 15. setDriverPriority (private, owner)
  // =========================================================================

  describe("setDriverPriority", () => {
    it("should set priority for an approved driver", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "approved",
        driverId: VALID_UUID_2,
        menuId: VALID_UUID_3,
        menus: { userId: owner.id },
      } as never);

      mockRestaurantDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        priority: 10,
      } as never);

      const result = await caller.setDriverPriority({
        restaurantDriverId: VALID_UUID,
        priority: 10,
      });

      expect(result).toHaveProperty("priority", 10);
      expect(mockRestaurantDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: { priority: 10 },
      });
    });

    it("should throw NOT_FOUND when restaurant-driver link does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue(null);

      await expect(
        caller.setDriverPriority({
          restaurantDriverId: VALID_UUID,
          priority: 5,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Restaurant-driver link not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "approved",
        menus: { userId: "other-user-id" },
      } as never);

      await expect(
        caller.setDriverPriority({
          restaurantDriverId: VALID_UUID,
          priority: 5,
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to set driver priority for this restaurant",
      });
    });

    it("should throw BAD_REQUEST when driver is not approved (pending)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "pending",
        menus: { userId: owner.id },
      } as never);

      await expect(
        caller.setDriverPriority({
          restaurantDriverId: VALID_UUID,
          priority: 5,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Can only set priority for approved drivers",
      });
    });

    it("should throw BAD_REQUEST when driver is rejected", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockRestaurantDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        status: "rejected",
        menus: { userId: owner.id },
      } as never);

      await expect(
        caller.setDriverPriority({
          restaurantDriverId: VALID_UUID,
          priority: 5,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Can only set priority for approved drivers",
      });
    });

    it("should reject priority out of range", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.setDriverPriority({
          restaurantDriverId: VALID_UUID,
          priority: 101,
        }),
      ).rejects.toThrow();

      await expect(
        caller.setDriverPriority({
          restaurantDriverId: VALID_UUID,
          priority: -1,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 16. checkPhoneAvailable (public)
  // =========================================================================

  describe("checkPhoneAvailable", () => {
    it("should return available=true when phone is not registered", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue(null);

      const result = await caller.checkPhoneAvailable({
        phone: "+212612345678",
      });

      expect(result).toEqual({ available: true });
    });

    it("should return available=false when phone is already registered", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      const result = await caller.checkPhoneAvailable({
        phone: "+212612345678",
      });

      expect(result).toEqual({ available: false });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.checkPhoneAvailable({ phone: "+212612345678" }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });
    });

    it("should reject phone number that is too short", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.checkPhoneAvailable({ phone: "123" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 17. uploadDocument (private)
  // =========================================================================

  describe("uploadDocument", () => {
    it("should create a new document record", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockDriverDocuments.findFirst.mockResolvedValue(null);

      mockDriverDocuments.create.mockResolvedValue({
        id: VALID_UUID_2,
        driverId: VALID_UUID,
        documentType: "cnie_front",
        documentUrl: "https://example.com/doc.jpg",
        status: "pending",
      } as never);

      const result = await caller.uploadDocument({
        documentType: "cnie_front",
        documentUrl: "https://example.com/doc.jpg",
      });

      expect(result).toHaveProperty("id", VALID_UUID_2);
      expect(result).toHaveProperty("documentType", "cnie_front");
      expect(result).toHaveProperty("status", "pending");
      expect(mockDriverDocuments.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          driverId: VALID_UUID,
          documentType: "cnie_front",
          documentUrl: "https://example.com/doc.jpg",
          status: "pending",
        }),
      });
    });

    it("should update existing document of same type (upsert)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
      } as never);

      mockDriverDocuments.findFirst.mockResolvedValue({
        id: VALID_UUID_2,
      } as never);

      mockDriverDocuments.update.mockResolvedValue({
        id: VALID_UUID_2,
        documentType: "cnie_front",
        documentUrl: "https://example.com/new-doc.jpg",
        status: "pending",
      } as never);

      const result = await caller.uploadDocument({
        documentType: "cnie_front",
        documentUrl: "https://example.com/new-doc.jpg",
      });

      expect(result).toHaveProperty("id", VALID_UUID_2);
      expect(mockDriverDocuments.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_2 },
        data: expect.objectContaining({
          documentUrl: "https://example.com/new-doc.jpg",
          status: "pending",
        }),
      });
      expect(mockDriverDocuments.create).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when driver profile does not exist", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDrivers.findFirst.mockResolvedValue(null);

      await expect(
        caller.uploadDocument({
          documentType: "cnie_front",
          documentUrl: "https://example.com/doc.jpg",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver profile not found. Please register first.",
      });
    });

    it("should reject invalid document type", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.uploadDocument({
          documentType: "invalid_type" as never,
          documentUrl: "https://example.com/doc.jpg",
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid URL", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.uploadDocument({
          documentType: "cnie_front",
          documentUrl: "not-a-url",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 18. getApplicationStatus (public)
  // =========================================================================

  describe("getApplicationStatus", () => {
    it("should return application status when found by phone", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Ahmed Driver",
        status: "pending",
        backgroundCheckStatus: "pending",
        onboardingStep: 3,
        createdAt: new Date("2026-02-20"),
        documents: [
          {
            documentType: "cnie_front",
            status: "approved",
            reviewerNotes: null,
          },
        ],
      } as never);

      const result = await caller.getApplicationStatus({
        phone: "+212612345678",
      });

      expect(result.found).toBe(true);

      if (result.found) {
        expect(result.fullName).toBe("Ahmed Driver");
        expect(result.status).toBe("pending");
        expect(result.documents).toHaveLength(1);
      }
    });

    it("should return found=false when no driver found", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue(null);

      const result = await caller.getApplicationStatus({
        phone: "+212699999999",
      });

      expect(result.found).toBe(false);
    });

    it("should return application status when found by email", async () => {
      const caller = createPublicCaller();

      mockDrivers.findFirst.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Fatima Driver",
        status: "active",
        backgroundCheckStatus: "approved",
        onboardingStep: 6,
        createdAt: new Date("2026-02-15"),
        documents: [],
      } as never);

      const result = await caller.getApplicationStatus({
        email: "fatima@example.com",
      });

      expect(result.found).toBe(true);

      if (result.found) {
        expect(result.fullName).toBe("Fatima Driver");
        expect(result.status).toBe("active");
      }
    });

    it("should throw BAD_REQUEST when neither phone nor email provided", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getApplicationStatus({}),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Please provide a phone number or email address",
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.getApplicationStatus({ phone: "+212612345678" }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });
    });
  });

  // =========================================================================
  // 19. updateDriverStatus (admin only)
  // =========================================================================

  describe("updateDriverStatus", () => {
    it("should approve a pending driver (set to active)", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      mockDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Ahmed Driver",
        status: "pending",
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Ahmed Driver",
        status: "active",
      } as never);

      const result = await caller.updateDriverStatus({
        driverId: VALID_UUID,
        status: "active",
      });

      expect(result).toEqual({
        id: VALID_UUID,
        fullName: "Ahmed Driver",
        status: "active",
      });

      expect(mockDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          status: "active",
          onboardingCompletedAt: expect.any(Date),
          backgroundCheckStatus: "approved",
        }),
      });
    });

    it("should reject a driver (set to rejected)", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      mockDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Rejected Driver",
        status: "pending",
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Rejected Driver",
        status: "rejected",
      } as never);

      const result = await caller.updateDriverStatus({
        driverId: VALID_UUID,
        status: "rejected",
        reason: "Insufficient documents",
      });

      expect(result).toEqual({
        id: VALID_UUID,
        fullName: "Rejected Driver",
        status: "rejected",
      });

      expect(mockDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          status: "rejected",
          backgroundCheckStatus: "rejected",
          isAvailable: false,
        }),
      });
    });

    it("should suspend a driver", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      mockDrivers.findUnique.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Suspended Driver",
        status: "active",
      } as never);

      mockDrivers.update.mockResolvedValue({
        id: VALID_UUID,
        fullName: "Suspended Driver",
        status: "suspended",
      } as never);

      const result = await caller.updateDriverStatus({
        driverId: VALID_UUID,
        status: "suspended",
      });

      expect(result.status).toBe("suspended");

      expect(mockDrivers.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          status: "suspended",
          isAvailable: false,
        }),
      });
    });

    it("should throw NOT_FOUND when driver does not exist", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      mockDrivers.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateDriverStatus({
          driverId: VALID_UUID,
          status: "active",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Driver not found",
      });
    });

    it("should reject invalid status values", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      await expect(
        caller.updateDriverStatus({
          driverId: VALID_UUID,
          status: "invalid_status" as never,
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID driver IDs", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      await expect(
        caller.updateDriverStatus({
          driverId: "not-a-uuid",
          status: "active",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 20. getDriverApplications (admin only)
  // =========================================================================

  describe("getDriverApplications", () => {
    it("should return paginated driver applications with counts", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      const driversData = [
        {
          id: VALID_UUID,
          fullName: "Ahmed Driver",
          phone: "+212612345678",
          email: null,
          city: "Casablanca",
          vehicleType: "motorcycle",
          status: "pending",
          createdAt: new Date(),
          documents: [],
        },
        {
          id: VALID_UUID_2,
          fullName: "Fatima Driver",
          phone: "+212699887766",
          email: "fatima@example.com",
          city: "Marrakech",
          vehicleType: "bicycle",
          status: "pending",
          createdAt: new Date(),
          documents: [],
        },
      ];

      mockDrivers.findMany.mockResolvedValue(driversData as never);
      mockDrivers.count
        .mockResolvedValueOnce(5 as never)  // pending
        .mockResolvedValueOnce(10 as never) // active
        .mockResolvedValueOnce(3 as never)  // rejected
        .mockResolvedValueOnce(18 as never); // total

      const result = await caller.getDriverApplications({
        status: "pending",
      });

      expect(result.drivers).toHaveLength(2);
      expect(result.counts).toEqual({
        pending: 5,
        active: 10,
        rejected: 3,
        total: 18,
      });
      expect(result.nextCursor).toBeUndefined();
    });

    it("should return nextCursor when more results exist", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      // Return limit+1 items
      const items = Array.from({ length: 3 }, (_, i) => ({
        id: `00000000-0000-4000-a000-00000000000${i + 1}`,
        fullName: `Driver ${i}`,
        status: "pending",
        createdAt: new Date(),
        documents: [],
      }));

      const expectedCursorId = items[2]!.id;

      mockDrivers.findMany.mockResolvedValue(items as never);
      mockDrivers.count.mockResolvedValue(5 as never);

      const result = await caller.getDriverApplications({
        limit: 2,
      });

      expect(result.drivers).toHaveLength(2);
      expect(result.nextCursor).toBe(expectedCursorId);
    });

    it("should filter by city when provided", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      mockDrivers.findMany.mockResolvedValue([] as never);
      mockDrivers.count.mockResolvedValue(0 as never);

      await caller.getDriverApplications({
        city: "Casablanca",
        status: "active",
      });

      expect(mockDrivers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
            city: "Casablanca",
          }),
        }),
      );
    });

    it("should return all drivers when no status filter", async () => {
      const admin = createUser();
      const caller = createAdminCaller(admin.id);

      mockProfiles.findUnique.mockResolvedValue({
        role: "admin",
      } as never);

      mockDrivers.findMany.mockResolvedValue([] as never);
      mockDrivers.count.mockResolvedValue(0 as never);

      await caller.getDriverApplications({});

      expect(mockDrivers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });
});
