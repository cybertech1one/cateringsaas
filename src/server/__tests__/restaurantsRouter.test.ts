import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the restaurants tRPC router (CRUD, locations, operating hours,
 * special hours, table zones, menu-location linking, public queries).
 *
 * Covers IDOR protection, rate limiting, input validation, and edge cases.
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 9 })),
}));

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("~/server/db", () => ({
  db: {
    restaurants: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    locations: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    menus: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    operatingHours: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    specialHours: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    tableZones: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { restaurantCrudRouter } from "../api/routers/restaurants/crud";
import { locationsRouter } from "../api/routers/restaurants/locations";
import { queriesRouter } from "../api/routers/restaurants/queries";
import {
  createUser,
  createRestaurant,
  createLocation,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPrivateCrudCaller(userId: string) {
  return restaurantCrudRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

function createPrivateLocationCaller(userId: string) {
  return locationsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

function createPublicQueriesCaller() {
  return queriesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateQueriesCaller(userId: string) {
  return queriesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";
const VALID_UUID_3 = "00000000-0000-4000-a000-000000000003";

function fullWeekHours() {
  const days = [
    "monday", "tuesday", "wednesday", "thursday",
    "friday", "saturday", "sunday",
  ] as const;

  return days.map((d) => ({
    dayOfWeek: d,
    openTime: "09:00",
    closeTime: "22:00",
    isClosed: false,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("restaurantCrudRouter", () => {
  const mockRestaurants = vi.mocked(db.restaurants);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 9 });
  });

  // =========================================================================
  // getRestaurants
  // =========================================================================

  describe("getRestaurants", () => {
    it("should return all restaurants for the current user", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);
      const restaurant = createRestaurant({ userId: owner.id });

      mockRestaurants.findMany.mockResolvedValue([
        { ...restaurant, _count: { locations: 2 } },
      ] as never);

      const result = await caller.getRestaurants();

      expect(result).toHaveLength(1);
      expect(mockRestaurants.findMany).toHaveBeenCalledWith({
        where: { userId: owner.id },
        include: { _count: { select: { locations: true } } },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when user has no restaurants", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.findMany.mockResolvedValue([]);

      const result = await caller.getRestaurants();

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getRestaurant
  // =========================================================================

  describe("getRestaurant", () => {
    it("should return a restaurant with locations for the owner", async () => {
      const owner = createUser();
      const restaurant = createRestaurant({ userId: owner.id });
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({
        ...restaurant,
        locations: [],
      } as never);

      const result = await caller.getRestaurant({ id: restaurant.id });

      expect(result.id).toBe(restaurant.id);
      expect(mockRestaurants.findUnique).toHaveBeenCalledWith({
        where: { id: restaurant.id },
        include: { locations: { orderBy: { createdAt: "desc" } } },
      });
    });

    it("should throw NOT_FOUND when restaurant does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue(null);

      await expect(
        caller.getRestaurant({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Restaurant not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the restaurant (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const restaurant = createRestaurant({ userId: owner.id });
      const caller = createPrivateCrudCaller(attacker.id);

      mockRestaurants.findUnique.mockResolvedValue({
        ...restaurant,
        locations: [],
      } as never);

      await expect(
        caller.getRestaurant({ id: restaurant.id }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    });

    it("should reject non-UUID id", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      await expect(
        caller.getRestaurant({ id: "bad-id" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // createRestaurant
  // =========================================================================

  describe("createRestaurant", () => {
    it("should create a restaurant with valid input", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.create.mockResolvedValue({
        id: VALID_UUID,
        userId: owner.id,
        name: "Atlas Grill House",
        description: null,
        logoUrl: null,
        website: null,
        cuisineType: "Moroccan",
        isChain: false,
      } as never);

      const result = await caller.createRestaurant({
        name: "Atlas Grill House",
        cuisineType: "Moroccan",
      });

      expect(result.name).toBe("Atlas Grill House");
      expect(mockRestaurants.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: owner.id,
          name: "Atlas Grill House",
          cuisineType: "Moroccan",
        }),
      });
    });

    it("should create restaurant with all optional fields", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.create.mockResolvedValue({ id: VALID_UUID } as never);

      await caller.createRestaurant({
        name: "Le Petit Marrakech",
        description: "Authentic Moroccan cuisine",
        logoUrl: "https://example.com/logo.png",
        website: "https://example.com",
        cuisineType: "Moroccan",
        isChain: true,
      });

      expect(mockRestaurants.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Le Petit Marrakech",
          description: "Authentic Moroccan cuisine",
          logoUrl: "https://example.com/logo.png",
          website: "https://example.com",
          cuisineType: "Moroccan",
          isChain: true,
        }),
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.createRestaurant({ name: "Spam Restaurant" }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      expect(mockRestaurants.create).not.toHaveBeenCalled();
    });

    it("should reject empty name", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      await expect(
        caller.createRestaurant({ name: "" }),
      ).rejects.toThrow();
    });

    it("should reject name exceeding 200 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      await expect(
        caller.createRestaurant({ name: "R".repeat(201) }),
      ).rejects.toThrow();
    });

    it("should reject invalid URL for website", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      await expect(
        caller.createRestaurant({ name: "Test", website: "not-a-url" }),
      ).rejects.toThrow();
    });

    it("should reject invalid URL for logoUrl", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      await expect(
        caller.createRestaurant({ name: "Test", logoUrl: "not-a-url" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateRestaurant
  // =========================================================================

  describe("updateRestaurant", () => {
    it("should update restaurant fields when owner", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockRestaurants.update.mockResolvedValue({
        id: VALID_UUID,
        name: "Updated Name",
      } as never);

      const result = await caller.updateRestaurant({
        id: VALID_UUID,
        name: "Updated Name",
      });

      expect(result.name).toBe("Updated Name");
    });

    it("should throw NOT_FOUND when restaurant does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateRestaurant({ id: VALID_UUID, name: "Ghost" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Restaurant not found",
      });
    });

    it("should throw FORBIDDEN when non-owner attempts update (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateCrudCaller(attacker.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);

      await expect(
        caller.updateRestaurant({ id: VALID_UUID, name: "Hijacked" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied",
      });

      expect(mockRestaurants.update).not.toHaveBeenCalled();
    });

    it("should reject non-UUID id", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      await expect(
        caller.updateRestaurant({ id: "bad", name: "Test" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // deleteRestaurant
  // =========================================================================

  describe("deleteRestaurant", () => {
    it("should delete restaurant when owner", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockRestaurants.delete.mockResolvedValue({ id: VALID_UUID } as never);

      const result = await caller.deleteRestaurant({ id: VALID_UUID });

      expect(result.id).toBe(VALID_UUID);
      expect(mockRestaurants.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
      });
    });

    it("should throw NOT_FOUND when restaurant does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteRestaurant({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when non-owner attempts delete (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateCrudCaller(attacker.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);

      await expect(
        caller.deleteRestaurant({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      expect(mockRestaurants.delete).not.toHaveBeenCalled();
    });

    it("should reject non-UUID id", async () => {
      const owner = createUser();
      const caller = createPrivateCrudCaller(owner.id);

      await expect(
        caller.deleteRestaurant({ id: "not-uuid" }),
      ).rejects.toThrow();
    });
  });
});

// ===========================================================================
// Locations router
// ===========================================================================

describe("locationsRouter", () => {
  const mockRestaurants = vi.mocked(db.restaurants);
  const mockLocations = vi.mocked(db.locations);
  const mockOperatingHours = vi.mocked(db.operatingHours);
  const mockSpecialHours = vi.mocked(db.specialHours);
  const mockTableZones = vi.mocked(db.tableZones);
  const mockTransaction = vi.mocked(db.$transaction);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 9 });
  });

  // =========================================================================
  // getLocations
  // =========================================================================

  describe("getLocations", () => {
    it("should return locations for owned restaurant", async () => {
      const owner = createUser();
      const restaurant = createRestaurant({ userId: owner.id });
      const caller = createPrivateLocationCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockLocations.findMany.mockResolvedValue([
        createLocation({ restaurantId: restaurant.id }),
      ] as never);

      const result = await caller.getLocations({ restaurantId: restaurant.id });

      expect(result).toHaveLength(1);
    });

    it("should throw NOT_FOUND when restaurant does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue(null);

      await expect(
        caller.getLocations({ restaurantId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when non-owner queries locations (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateLocationCaller(attacker.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);

      await expect(
        caller.getLocations({ restaurantId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  // =========================================================================
  // createLocation
  // =========================================================================

  describe("createLocation", () => {
    it("should create a location with required fields", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockLocations.create.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Downtown Branch",
        city: "Casablanca",
      } as never);

      const result = await caller.createLocation({
        restaurantId: VALID_UUID,
        name: "Downtown Branch",
        address: "12 Rue Mohammed V",
        city: "Casablanca",
        country: "Morocco",
      });

      expect(result.name).toBe("Downtown Branch");
    });

    it("should throw FORBIDDEN when non-owner attempts to create", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateLocationCaller(attacker.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);

      await expect(
        caller.createLocation({
          restaurantId: VALID_UUID,
          name: "Rogue Branch",
          address: "1 Hack St",
          city: "Nowhere",
          country: "XX",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject empty name", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.createLocation({
          restaurantId: VALID_UUID,
          name: "",
          address: "1 Test St",
          city: "Test",
          country: "Test",
        }),
      ).rejects.toThrow();
    });

    it("should reject latitude out of range", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.createLocation({
          restaurantId: VALID_UUID,
          name: "Bad Coords",
          address: "1 Test St",
          city: "Test",
          country: "Test",
          latitude: 91, // Invalid
        }),
      ).rejects.toThrow();
    });

    it("should reject longitude out of range", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.createLocation({
          restaurantId: VALID_UUID,
          name: "Bad Coords",
          address: "1 Test St",
          city: "Test",
          country: "Test",
          longitude: -181, // Invalid
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateLocation
  // =========================================================================

  describe("updateLocation", () => {
    it("should update location when owner", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockLocations.update.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Updated Branch",
      } as never);

      const result = await caller.updateLocation({
        id: VALID_UUID_2,
        name: "Updated Branch",
      });

      expect(result.name).toBe("Updated Branch");
    });

    it("should throw NOT_FOUND when location does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateLocation({ id: VALID_UUID, name: "Ghost" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when non-owner attempts update (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateLocationCaller(attacker.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);

      await expect(
        caller.updateLocation({ id: VALID_UUID_2, name: "Hijacked" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  // =========================================================================
  // deleteLocation
  // =========================================================================

  describe("deleteLocation", () => {
    it("should delete location when owner", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockLocations.delete.mockResolvedValue({ id: VALID_UUID_2 } as never);

      const result = await caller.deleteLocation({ id: VALID_UUID_2 });

      expect(result.id).toBe(VALID_UUID_2);
    });

    it("should throw NOT_FOUND when location does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteLocation({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject non-UUID id", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.deleteLocation({ id: "bad" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // setOperatingHours
  // =========================================================================

  describe("setOperatingHours", () => {
    it("should set operating hours for all 7 days via transaction", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);

      const txMock = {
        operatingHours: {
          deleteMany: vi.fn().mockResolvedValue({ count: 7 }),
          createMany: vi.fn().mockResolvedValue({ count: 7 }),
        },
      };

      mockTransaction.mockImplementation((async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn(txMock);
      }) as never);

      await caller.setOperatingHours({
        locationId: VALID_UUID_2,
        hours: fullWeekHours(),
      });

      expect(txMock.operatingHours.deleteMany).toHaveBeenCalled();
      expect(txMock.operatingHours.createMany).toHaveBeenCalled();
    });

    it("should reject fewer than 7 days", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.setOperatingHours({
          locationId: VALID_UUID_2,
          hours: fullWeekHours().slice(0, 5),
        }),
      ).rejects.toThrow();
    });

    it("should reject more than 7 days", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.setOperatingHours({
          locationId: VALID_UUID_2,
          hours: [...fullWeekHours(), {
            dayOfWeek: "monday" as const,
            openTime: "10:00",
            closeTime: "20:00",
            isClosed: false,
          }],
        }),
      ).rejects.toThrow();
    });

    it("should throw BAD_REQUEST when duplicate days provided", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);

      const hours = fullWeekHours();

      // Replace sunday with a duplicate monday
      hours[6] = { dayOfWeek: "monday", openTime: "09:00", closeTime: "22:00", isClosed: false };

      await expect(
        caller.setOperatingHours({
          locationId: VALID_UUID_2,
          hours,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Must provide exactly one entry for each day of the week",
      });
    });
  });

  // =========================================================================
  // getOperatingHours
  // =========================================================================

  describe("getOperatingHours", () => {
    it("should return operating hours for owned location", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockOperatingHours.findMany.mockResolvedValue([
        { dayOfWeek: "monday", openTime: new Date(), closeTime: new Date(), isClosed: false },
      ] as never);

      const result = await caller.getOperatingHours({ locationId: VALID_UUID_2 });

      expect(result).toHaveLength(1);
    });

    it("should throw FORBIDDEN when non-owner queries hours (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateLocationCaller(attacker.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);

      await expect(
        caller.getOperatingHours({ locationId: VALID_UUID_2 }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  // =========================================================================
  // setSpecialHours
  // =========================================================================

  describe("setSpecialHours", () => {
    it("should create new special hours entry", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockSpecialHours.create.mockResolvedValue({
        id: VALID_UUID_3,
        locationId: VALID_UUID_2,
        date: new Date("2025-12-25"),
        isClosed: true,
        reason: "Christmas Day",
      } as never);

      const result = await caller.setSpecialHours({
        locationId: VALID_UUID_2,
        date: "2025-12-25",
        isClosed: true,
        reason: "Christmas Day",
      });

      expect(result.reason).toBe("Christmas Day");
    });

    it("should update existing special hours entry", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockSpecialHours.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        locationId: VALID_UUID_2,
      } as never);
      mockSpecialHours.update.mockResolvedValue({
        id: VALID_UUID_3,
        isClosed: false,
        openTime: new Date("1970-01-01T10:00:00Z"),
        closeTime: new Date("1970-01-01T16:00:00Z"),
      } as never);

      const result = await caller.setSpecialHours({
        id: VALID_UUID_3,
        locationId: VALID_UUID_2,
        date: "2025-12-25",
        isClosed: false,
        openTime: "10:00",
        closeTime: "16:00",
      });

      expect(result.isClosed).toBe(false);
    });

    it("should throw NOT_FOUND when updating non-existent special hours", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockSpecialHours.findUnique.mockResolvedValue(null);

      await expect(
        caller.setSpecialHours({
          id: VALID_UUID_3,
          locationId: VALID_UUID_2,
          date: "2025-12-25",
          isClosed: true,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Special hours entry not found for this location",
      });
    });

    it("should throw NOT_FOUND when special hours belong to different location", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockSpecialHours.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        locationId: "00000000-0000-4000-a000-000000000099", // Different location
      } as never);

      await expect(
        caller.setSpecialHours({
          id: VALID_UUID_3,
          locationId: VALID_UUID_2,
          date: "2025-12-25",
          isClosed: true,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // Table Zones
  // =========================================================================

  describe("getTableZones", () => {
    it("should return table zones for owned location", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockTableZones.findMany.mockResolvedValue([
        { id: VALID_UUID_3, tableNumber: "T1", zoneName: "Terrace" },
      ] as never);

      const result = await caller.getTableZones({ locationId: VALID_UUID_2 });

      expect(result).toHaveLength(1);
    });
  });

  describe("createTableZone", () => {
    it("should create a table zone with valid input", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockTableZones.create.mockResolvedValue({
        id: VALID_UUID_3,
        tableNumber: "T5",
        zoneName: "Indoor",
        capacity: 4,
      } as never);

      const result = await caller.createTableZone({
        locationId: VALID_UUID_2,
        tableNumber: "T5",
        zoneName: "Indoor",
        capacity: 4,
      });

      expect(result.tableNumber).toBe("T5");
    });

    it("should reject empty tableNumber", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.createTableZone({
          locationId: VALID_UUID_2,
          tableNumber: "",
        }),
      ).rejects.toThrow();
    });

    it("should reject capacity below 1", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      await expect(
        caller.createTableZone({
          locationId: VALID_UUID_2,
          tableNumber: "T1",
          capacity: 0,
        }),
      ).rejects.toThrow();
    });
  });

  describe("updateTableZone", () => {
    it("should update table zone when owner", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockTableZones.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        locationId: VALID_UUID_2,
        location: { restaurant: { userId: owner.id } },
      } as never);
      mockTableZones.update.mockResolvedValue({
        id: VALID_UUID_3,
        zoneName: "Patio",
      } as never);

      const result = await caller.updateTableZone({
        id: VALID_UUID_3,
        zoneName: "Patio",
      });

      expect(result.zoneName).toBe("Patio");
    });

    it("should throw NOT_FOUND when table zone does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockTableZones.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateTableZone({ id: VALID_UUID, zoneName: "Ghost" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Table zone not found",
      });
    });

    it("should throw FORBIDDEN when non-owner attempts update (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateLocationCaller(attacker.id);

      mockTableZones.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        locationId: VALID_UUID_2,
        location: { restaurant: { userId: owner.id } },
      } as never);

      await expect(
        caller.updateTableZone({ id: VALID_UUID_3, zoneName: "Hijacked" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("deleteTableZone", () => {
    it("should delete table zone when owner", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockTableZones.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        location: { restaurant: { userId: owner.id } },
      } as never);
      mockTableZones.delete.mockResolvedValue({ id: VALID_UUID_3 } as never);

      const result = await caller.deleteTableZone({ id: VALID_UUID_3 });

      expect(result.id).toBe(VALID_UUID_3);
    });

    it("should throw NOT_FOUND when table zone does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateLocationCaller(owner.id);

      mockTableZones.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteTableZone({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw FORBIDDEN when non-owner attempts delete (IDOR)", async () => {
      const attacker = createUser();
      const owner = createUser();
      const caller = createPrivateLocationCaller(attacker.id);

      mockTableZones.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        location: { restaurant: { userId: owner.id } },
      } as never);

      await expect(
        caller.deleteTableZone({ id: VALID_UUID_3 }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      expect(mockTableZones.delete).not.toHaveBeenCalled();
    });
  });
});

// ===========================================================================
// Queries router (linkMenuToLocation + getPublicLocationInfo)
// ===========================================================================

describe("queriesRouter", () => {
  const mockRestaurants = vi.mocked(db.restaurants);
  const mockLocations = vi.mocked(db.locations);
  const mockMenus = vi.mocked(db.menus);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // linkMenuToLocation
  // =========================================================================

  describe("linkMenuToLocation", () => {
    it("should link menu to location when all ownership checks pass", async () => {
      const owner = createUser();
      const caller = createPrivateQueriesCaller(owner.id);

      // verifyRestaurantOwner
      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      // verifyLocationOwner
      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      // Menu ownership
      mockMenus.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockMenus.update.mockResolvedValue({ id: VALID_UUID_2 } as never);

      const result = await caller.linkMenuToLocation({
        menuId: VALID_UUID_2,
        restaurantId: VALID_UUID,
        locationId: VALID_UUID_3,
      });

      expect(result.id).toBe(VALID_UUID_2);
      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_2 },
        data: {
          restaurantId: VALID_UUID,
          locationId: VALID_UUID_3,
        },
      });
    });

    it("should throw BAD_REQUEST when location does not belong to restaurant", async () => {
      const owner = createUser();
      const caller = createPrivateQueriesCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        restaurantId: "00000000-0000-4000-a000-000000000099", // Different restaurant
        restaurant: { userId: owner.id },
      } as never);

      await expect(
        caller.linkMenuToLocation({
          menuId: VALID_UUID_2,
          restaurantId: VALID_UUID,
          locationId: VALID_UUID_3,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Location does not belong to the specified restaurant",
      });
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateQueriesCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockMenus.findUnique.mockResolvedValue(null);

      await expect(
        caller.linkMenuToLocation({
          menuId: VALID_UUID_2,
          restaurantId: VALID_UUID,
          locationId: VALID_UUID_3,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const owner = createUser();
      const otherUser = createUser();
      const caller = createPrivateQueriesCaller(owner.id);

      mockRestaurants.findUnique.mockResolvedValue({ userId: owner.id } as never);
      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        restaurantId: VALID_UUID,
        restaurant: { userId: owner.id },
      } as never);
      mockMenus.findUnique.mockResolvedValue({ userId: otherUser.id } as never);

      await expect(
        caller.linkMenuToLocation({
          menuId: VALID_UUID_2,
          restaurantId: VALID_UUID,
          locationId: VALID_UUID_3,
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateQueriesCaller(owner.id);

      await expect(
        caller.linkMenuToLocation({
          menuId: "bad",
          restaurantId: VALID_UUID,
          locationId: VALID_UUID_3,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getPublicLocationInfo
  // =========================================================================

  describe("getPublicLocationInfo", () => {
    it("should return public location info with hours and restaurant data", async () => {
      const caller = createPublicQueriesCaller();

      mockLocations.findUnique.mockResolvedValue({
        id: VALID_UUID,
        name: "Main Branch",
        address: "12 Rue Mohammed V",
        city: "Casablanca",
        state: null,
        country: "Morocco",
        postalCode: "20000",
        latitude: null,
        longitude: null,
        phone: "+212522123456",
        email: "contact@example.com",
        timezone: "Africa/Casablanca",
        operatingHours: [],
        specialHours: [],
        restaurant: {
          name: "Riad Casablanca",
          logoUrl: null,
          cuisineType: "Moroccan",
        },
      } as never);

      const result = await caller.getPublicLocationInfo({ locationId: VALID_UUID });

      expect(result.name).toBe("Main Branch");
      expect(result.restaurant.name).toBe("Riad Casablanca");
    });

    it("should throw NOT_FOUND when location does not exist", async () => {
      const caller = createPublicQueriesCaller();

      mockLocations.findUnique.mockResolvedValue(null);

      await expect(
        caller.getPublicLocationInfo({ locationId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Location not found",
      });
    });

    it("should reject non-UUID locationId", async () => {
      const caller = createPublicQueriesCaller();

      await expect(
        caller.getPublicLocationInfo({ locationId: "not-uuid" }),
      ).rejects.toThrow();
    });
  });
});
