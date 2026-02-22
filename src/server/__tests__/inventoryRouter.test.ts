import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the inventory sub-router (menus.inventory).
 * Covers getInventoryStatus, updateStockLevel, bulkUpdateStock,
 * toggleTrackInventory, IDOR protection, and input validation.
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
  supabase: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    },
  })),
  storageBucketsNames: { menus: "menus" },
}));

vi.mock("~/server/supabase/storagePaths", () => ({
  generateBackgroundImagePath: vi.fn(() => "test/bg.png"),
  generateMenuImagePath: vi.fn(() => "test/menu.png"),
  generateDishImagePath: vi.fn(() => "test/dish.png"),
}));

vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    categories: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    dishes: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      aggregate: vi.fn(),
    },
    dishVariants: {
      create: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    dishesTranslation: {
      createMany: vi.fn(),
    },
    dishesTag: {
      create: vi.fn(),
    },
    variantTranslations: {
      createMany: vi.fn(),
    },
    categoriesTranslation: {
      createMany: vi.fn(),
    },
    menuLanguages: {
      createMany: vi.fn(),
    },
    subscriptions: {
      findFirst: vi.fn(),
    },
    reviews: {
      aggregate: vi.fn(),
    },
    menuSchedules: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { db } from "~/server/db";
import { menusRouter } from "../api/routers/menus";
import {
  createUser,
  createMenu,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID_1 = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";
const VALID_UUID_3 = "00000000-0000-4000-a000-000000000003";

function createPrivateCaller(userId: string) {
  return menusRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

function makeDishWithInventory(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID_1,
    menuId: VALID_UUID_2,
    categoryId: VALID_UUID_3,
    price: 2500,
    isSoldOut: false,
    trackInventory: false,
    stockQuantity: null,
    lowStockThreshold: 5,
    dishesTranslation: [
      { name: "Lamb Tagine", languageId: VALID_UUID_1 },
    ],
    categories: {
      id: VALID_UUID_3,
      categoriesTranslation: [
        { name: "Main Courses", languageId: VALID_UUID_1 },
      ],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("inventory router (menus.inventory)", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockDishes = vi.mocked(db.dishes);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // getInventoryStatus
  // =========================================================================

  describe("getInventoryStatus", () => {
    it("should return inventory status for all dishes in a menu", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);

      const dishes = [
        makeDishWithInventory({
          id: VALID_UUID_1,
          menuId: menu.id,
          trackInventory: true,
          stockQuantity: 10,
          lowStockThreshold: 5,
        }),
        makeDishWithInventory({
          id: VALID_UUID_2,
          menuId: menu.id,
          trackInventory: true,
          stockQuantity: 2,
          lowStockThreshold: 5,
        }),
        makeDishWithInventory({
          id: VALID_UUID_3,
          menuId: menu.id,
          trackInventory: false,
          stockQuantity: null,
          lowStockThreshold: 5,
        }),
      ];

      mockDishes.findMany.mockResolvedValue(dishes as never);

      const result = await caller.getInventoryStatus({ menuId: menu.id });

      expect(result).toHaveLength(3);
      // First dish: in stock
      expect(result[0]!.isLowStock).toBe(false);
      // Second dish: low stock (2 < 5)
      expect(result[1]!.isLowStock).toBe(true);
      // Third dish: not tracked
      expect(result[2]!.isLowStock).toBe(false);
    });

    it("should reject if user does not own the menu (IDOR)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getInventoryStatus({ menuId: VALID_UUID_1 }),
      ).rejects.toThrow("Not authorized");
    });

    it("should reject invalid menuId format", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.getInventoryStatus({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateStockLevel
  // =========================================================================

  describe("updateStockLevel", () => {
    it("should update stock quantity for a dish", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      const dish = makeDishWithInventory({ trackInventory: true, stockQuantity: 10 });

      mockDishes.findFirst.mockResolvedValue(dish as never);
      mockDishes.update.mockResolvedValue({ ...dish, stockQuantity: 25 } as never);

      const result = await caller.updateStockLevel({
        dishId: VALID_UUID_1,
        quantity: 25,
      });

      expect(mockDishes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stockQuantity: 25 }),
        }),
      );
      expect(result.stockQuantity).toBe(25);
    });

    it("should allow setting stock to null (unlimited)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      const dish = makeDishWithInventory({ trackInventory: true, stockQuantity: 10 });

      mockDishes.findFirst.mockResolvedValue(dish as never);
      mockDishes.update.mockResolvedValue({ ...dish, stockQuantity: null } as never);

      const result = await caller.updateStockLevel({
        dishId: VALID_UUID_1,
        quantity: null,
      });

      expect(result.stockQuantity).toBeNull();
    });

    it("should auto-set soldOut when stock reaches 0", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      const dish = makeDishWithInventory({ trackInventory: true, stockQuantity: 5 });

      mockDishes.findFirst.mockResolvedValue(dish as never);
      mockDishes.update.mockResolvedValue({ ...dish, stockQuantity: 0, isSoldOut: true } as never);

      await caller.updateStockLevel({
        dishId: VALID_UUID_1,
        quantity: 0,
      });

      expect(mockDishes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stockQuantity: 0,
            isSoldOut: true,
          }),
        }),
      );
    });

    it("should reject if user does not own the dish (IDOR)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDishes.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateStockLevel({ dishId: VALID_UUID_1, quantity: 10 }),
      ).rejects.toThrow("Not authorized");
    });

    it("should reject negative quantity", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.updateStockLevel({ dishId: VALID_UUID_1, quantity: -5 }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // bulkUpdateStock
  // =========================================================================

  describe("bulkUpdateStock", () => {
    it("should update multiple dishes at once", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      // Mock $transaction to resolve successfully
      (db.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: VALID_UUID_1, stockQuantity: 20 },
        { id: VALID_UUID_2, stockQuantity: 15 },
      ]);

      const result = await caller.bulkUpdateStock({
        menuId: menu.id,
        items: [
          { dishId: VALID_UUID_1, quantity: 20 },
          { dishId: VALID_UUID_2, quantity: 15 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.updated).toBe(2);
    });

    it("should reject if user does not own the menu (IDOR)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.bulkUpdateStock({
          menuId: VALID_UUID_1,
          items: [{ dishId: VALID_UUID_2, quantity: 10 }],
        }),
      ).rejects.toThrow("Not authorized");
    });

    it("should reject empty items array", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.bulkUpdateStock({
          menuId: VALID_UUID_1,
          items: [],
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // toggleTrackInventory
  // =========================================================================

  describe("toggleTrackInventory", () => {
    it("should enable inventory tracking for a dish", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      const dish = makeDishWithInventory({ trackInventory: false });

      mockDishes.findFirst.mockResolvedValue(dish as never);
      mockDishes.update.mockResolvedValue({ ...dish, trackInventory: true } as never);

      const result = await caller.toggleTrackInventory({
        dishId: VALID_UUID_1,
        enabled: true,
      });

      expect(result.trackInventory).toBe(true);
    });

    it("should disable inventory tracking for a dish", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      const dish = makeDishWithInventory({ trackInventory: true, stockQuantity: 10 });

      mockDishes.findFirst.mockResolvedValue(dish as never);
      mockDishes.update.mockResolvedValue({ ...dish, trackInventory: false } as never);

      const result = await caller.toggleTrackInventory({
        dishId: VALID_UUID_1,
        enabled: false,
      });

      expect(result.trackInventory).toBe(false);
    });

    it("should reject if user does not own the dish (IDOR)", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockDishes.findFirst.mockResolvedValue(null);

      await expect(
        caller.toggleTrackInventory({ dishId: VALID_UUID_1, enabled: true }),
      ).rejects.toThrow("Not authorized");
    });
  });
});
