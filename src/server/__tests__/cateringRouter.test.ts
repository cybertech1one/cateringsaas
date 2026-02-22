import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the catering tRPC router.
 * Covers catering menu CRUD, packages, categories, items, package items,
 * inquiries (public submit + owner management), theme upsert/reset,
 * public menu retrieval, directory listing, IDOR protection,
 * rate limiting, input validation, and edge cases.
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 4 })),
}));

vi.mock("~/server/db", () => ({
  db: {
    cateringMenus: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    cateringPackages: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      aggregate: vi.fn(),
    },
    cateringCategories: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      aggregate: vi.fn(),
    },
    cateringItems: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      aggregate: vi.fn(),
    },
    cateringPackageItems: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    cateringInquiries: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      deleteMany: vi.fn(),
    },
    cateringThemes: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

vi.mock("~/server/cache", () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
    getOrSet: vi.fn((_key: string, fn: () => unknown) => fn()),
  },
  TTL: { SHORT: 30000, MEDIUM: 300000, LONG: 1800000 },
}));

vi.mock("~/server/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("~/server/security", () => ({
  hashIP: vi.fn(() => "hashed-ip"),
  sanitizeString: vi.fn((s: string) => s),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { cateringRouter } from "../api/routers/catering";
import {
  createUser,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return cateringRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return cateringRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";
const VALID_UUID_3 = "00000000-0000-4000-a000-000000000003";
const VALID_UUID_4 = "00000000-0000-4000-a000-000000000004";

// Future date for inquiry tests
function futureDate(daysFromNow = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0]!;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cateringRouter", () => {
  const mockCateringMenus = vi.mocked(db.cateringMenus);
  const mockCateringPackages = vi.mocked(db.cateringPackages);
  const mockCateringCategories = vi.mocked(db.cateringCategories);
  const mockCateringItems = vi.mocked(db.cateringItems);
  const mockCateringPackageItems = vi.mocked(db.cateringPackageItems);
  const mockCateringInquiries = vi.mocked(db.cateringInquiries);
  const mockCateringThemes = vi.mocked(db.cateringThemes);
  const mockTransaction = vi.mocked(db.$transaction);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 4 });
    // Default $transaction implementation: executes the callback or array of promises
    mockTransaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: typeof db) => Promise<unknown>)(db as never);
      }
      return Promise.all(arg as Promise<unknown>[]);
    });
  });

  // =========================================================================
  // getMyMenus (private)
  // =========================================================================

  describe("getMyMenus", () => {
    it("should return user's catering menus with counts", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      const menuData = [
        {
          id: VALID_UUID,
          userId: owner.id,
          name: "Wedding Catering",
          slug: "wedding-catering-123456",
          isPublished: true,
          _count: { packages: 3, items: 12, inquiries: 5 },
        },
      ];

      mockCateringMenus.findMany.mockResolvedValue(menuData as never);

      const result = await caller.getMyMenus();

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Wedding Catering");
      expect(mockCateringMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: owner.id },
          orderBy: { updatedAt: "desc" },
        }),
      );
    });

    it("should return empty array when user has no catering menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findMany.mockResolvedValue([]);

      const result = await caller.getMyMenus();

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // createMenu (private)
  // =========================================================================

  describe("createMenu", () => {
    it("should create a catering menu with valid data", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.create.mockResolvedValue({
        id: VALID_UUID,
        userId: owner.id,
        name: "Ramadan Iftar Menu",
        slug: "ramadan-iftar-menu-catering-123456",
        eventType: "ramadan_iftar",
        isPublished: false,
        basePricePerPerson: 15000,
      } as never);

      const result = await caller.createMenu({
        name: "Ramadan Iftar Menu",
        basePricePerPerson: 15000,
        eventType: "ramadan_iftar",
        city: "Casablanca",
      });

      expect(result.name).toBe("Ramadan Iftar Menu");
      expect(result.isPublished).toBe(false);
      expect(mockCateringMenus.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: owner.id,
          name: "Ramadan Iftar Menu",
          eventType: "ramadan_iftar",
          basePricePerPerson: 15000,
          isPublished: false,
        }),
      });
    });

    it("should reject createMenu without a name", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createMenu({
          name: "",
          basePricePerPerson: 10000,
        }),
      ).rejects.toThrow();
    });

    it("should reject name exceeding 200 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createMenu({
          name: "A".repeat(201),
          basePricePerPerson: 10000,
        }),
      ).rejects.toThrow();
    });

    it("should use default values for optional fields", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.create.mockResolvedValue({
        id: VALID_UUID,
        eventType: "general",
        minGuests: 10,
        maxGuests: 500,
        leadTimeDays: 3,
        currency: "MAD",
      } as never);

      await caller.createMenu({
        name: "Basic Menu",
        basePricePerPerson: 5000,
      });

      expect(mockCateringMenus.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: "general",
          minGuests: 10,
          maxGuests: 500,
          leadTimeDays: 3,
          currency: "MAD",
        }),
      });
    });
  });

  // =========================================================================
  // updateMenu (private)
  // =========================================================================

  describe("updateMenu", () => {
    it("should update an owned catering menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      // verifyCateringMenuOwnership
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringMenus.update.mockResolvedValue({
        id: VALID_UUID,
        name: "Updated Name",
      } as never);

      const result = await caller.updateMenu({
        id: VALID_UUID,
        data: { name: "Updated Name" },
      });

      expect(result.name).toBe("Updated Name");
      expect(mockCateringMenus.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_UUID, userId: owner.id },
        select: { id: true },
      });
    });

    it("should throw NOT_FOUND when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockCateringMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateMenu({
          id: VALID_UUID,
          data: { name: "Hijacked Menu" },
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // deleteMenu (private)
  // =========================================================================

  describe("deleteMenu", () => {
    it("should delete an owned catering menu via transaction", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      // $transaction mock executes callback
      mockCateringPackageItems.deleteMany.mockResolvedValue({ count: 3 } as never);
      mockCateringPackages.deleteMany.mockResolvedValue({ count: 2 } as never);
      mockCateringItems.deleteMany.mockResolvedValue({ count: 8 } as never);
      mockCateringCategories.deleteMany.mockResolvedValue({ count: 3 } as never);
      mockCateringInquiries.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockCateringThemes.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockCateringMenus.delete.mockResolvedValue({ id: VALID_UUID } as never);

      const result = await caller.deleteMenu({ id: VALID_UUID });

      expect(result).toEqual({ success: true });
    });

    it("should throw NOT_FOUND when deleting non-owned menu", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockCateringMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.deleteMenu({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });

      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // togglePublish (private)
  // =========================================================================

  describe("togglePublish", () => {
    it("should publish a menu that has items and contactPhone", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: false,
        name: "Test Menu",
        contactPhone: "+212612345678",
        _count: { items: 5, packages: 2 },
      } as never);
      mockCateringMenus.update.mockResolvedValue({
        id: VALID_UUID,
        isPublished: true,
      } as never);

      const result = await caller.togglePublish({ id: VALID_UUID });

      expect(result.isPublished).toBe(true);
      expect(mockCateringMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        data: expect.objectContaining({
          isPublished: true,
        }),
      });
    });

    it("should throw BAD_REQUEST when publishing without items or packages", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: false,
        name: "Empty Menu",
        contactPhone: "+212612345678",
        _count: { items: 0, packages: 0 },
      } as never);

      await expect(
        caller.togglePublish({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("should throw BAD_REQUEST when publishing without contactPhone", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: false,
        name: "No Phone Menu",
        contactPhone: null,
        _count: { items: 3, packages: 1 },
      } as never);

      await expect(
        caller.togglePublish({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("should allow unpublishing without validation", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      // Menu is currently published
      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: true,
        name: "Published Menu",
        contactPhone: null,
        _count: { items: 0, packages: 0 },
      } as never);
      mockCateringMenus.update.mockResolvedValue({
        id: VALID_UUID,
        isPublished: false,
      } as never);

      const result = await caller.togglePublish({ id: VALID_UUID });

      expect(result.isPublished).toBe(false);
    });
  });

  // =========================================================================
  // getMenu (private)
  // =========================================================================

  describe("getMenu", () => {
    it("should return menu with all relations", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        name: "Full Menu",
        categories: [
          {
            id: VALID_UUID_2,
            name: "Appetizers",
            cateringItems: [{ id: VALID_UUID_3, name: "Briouats" }],
          },
        ],
        packages: [
          {
            id: VALID_UUID_4,
            name: "Gold Package",
            packageItems: [],
          },
        ],
        theme: null,
        _count: { inquiries: 2, items: 1, packages: 1 },
      } as never);

      const result = await caller.getMenu({ id: VALID_UUID });

      expect(result.name).toBe("Full Menu");
      expect(result.categories).toHaveLength(1);
      expect(result.packages).toHaveLength(1);
    });

    it("should throw NOT_FOUND when menu does not exist or not owned", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getMenu({ id: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Catering menu not found",
      });
    });

    it("should reject non-UUID input", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMenu({ id: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // createPackage (private)
  // =========================================================================

  describe("createPackage", () => {
    it("should create a package in an owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      // verifyCateringMenuOwnership
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackages.aggregate.mockResolvedValue({
        _max: { sortOrder: 2 },
      } as never);
      mockCateringPackages.create.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Silver Package",
        pricePerPerson: 20000,
        sortOrder: 3,
      } as never);

      const result = await caller.createPackage({
        cateringMenuId: VALID_UUID,
        name: "Silver Package",
        pricePerPerson: 20000,
      });

      expect(result.name).toBe("Silver Package");
      expect(result.sortOrder).toBe(3);
      expect(mockCateringPackages.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cateringMenuId: VALID_UUID,
          name: "Silver Package",
          pricePerPerson: 20000,
        }),
      });
    });

    it("should reject negative price", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPackage({
          cateringMenuId: VALID_UUID,
          name: "Bad Package",
          pricePerPerson: -500,
        }),
      ).rejects.toThrow();
    });

    it("should reject creating a package in non-owned menu", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockCateringMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.createPackage({
          cateringMenuId: VALID_UUID,
          name: "Stolen Package",
          pricePerPerson: 10000,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject empty package name", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createPackage({
          cateringMenuId: VALID_UUID,
          name: "",
          pricePerPerson: 10000,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updatePackage (private)
  // =========================================================================

  describe("updatePackage", () => {
    it("should update an owned package", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackages.update.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Updated Package",
        pricePerPerson: 25000,
      } as never);

      const result = await caller.updatePackage({
        id: VALID_UUID_2,
        data: { name: "Updated Package", pricePerPerson: 25000 },
      });

      expect(result.name).toBe("Updated Package");
    });

    it("should throw NOT_FOUND when package does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue(null);

      await expect(
        caller.updatePackage({
          id: VALID_UUID_2,
          data: { name: "Ghost Package" },
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Package not found",
      });
    });
  });

  // =========================================================================
  // deletePackage (private)
  // =========================================================================

  describe("deletePackage", () => {
    it("should delete a package and its package items", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackageItems.deleteMany.mockResolvedValue({ count: 3 } as never);
      mockCateringPackages.delete.mockResolvedValue({ id: VALID_UUID_2 } as never);

      const result = await caller.deletePackage({ id: VALID_UUID_2 });

      expect(result).toEqual({ success: true });
    });

    it("should throw NOT_FOUND when package does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue(null);

      await expect(
        caller.deletePackage({ id: VALID_UUID_2 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // reorderPackages (private)
  // =========================================================================

  describe("reorderPackages", () => {
    it("should update sort orders for packages", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackages.update
        .mockResolvedValueOnce({ id: VALID_UUID_2, sortOrder: 1 } as never)
        .mockResolvedValueOnce({ id: VALID_UUID_3, sortOrder: 2 } as never);

      const result = await caller.reorderPackages({
        cateringMenuId: VALID_UUID,
        orderedIds: [VALID_UUID_2, VALID_UUID_3],
      });

      expect(result).toEqual({ success: true });
    });

    it("should reject empty orderedIds array", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.reorderPackages({
          cateringMenuId: VALID_UUID,
          orderedIds: [],
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // createCategory (private)
  // =========================================================================

  describe("createCategory", () => {
    it("should create a category in an owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringCategories.aggregate.mockResolvedValue({
        _max: { sortOrder: 1 },
      } as never);
      mockCateringCategories.create.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Main Courses",
        sortOrder: 2,
      } as never);

      const result = await caller.createCategory({
        cateringMenuId: VALID_UUID,
        name: "Main Courses",
      });

      expect(result.name).toBe("Main Courses");
      expect(result.sortOrder).toBe(2);
    });

    it("should reject empty category name", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createCategory({
          cateringMenuId: VALID_UUID,
          name: "",
        }),
      ).rejects.toThrow();
    });

    it("should reject creating category in non-owned menu", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockCateringMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.createCategory({
          cateringMenuId: VALID_UUID,
          name: "Stolen Category",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // updateCategory (private)
  // =========================================================================

  describe("updateCategory", () => {
    it("should update a category", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringCategories.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringCategories.update.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Updated Category",
        isOptional: true,
      } as never);

      const result = await caller.updateCategory({
        id: VALID_UUID_2,
        data: { name: "Updated Category", isOptional: true },
      });

      expect(result.name).toBe("Updated Category");
      expect(result.isOptional).toBe(true);
    });

    it("should throw NOT_FOUND when category does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringCategories.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateCategory({
          id: VALID_UUID_2,
          data: { name: "Ghost" },
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // deleteCategory (private)
  // =========================================================================

  describe("deleteCategory", () => {
    it("should cascade-delete category, its items, and package item links", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringCategories.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackageItems.deleteMany.mockResolvedValue({ count: 2 } as never);
      mockCateringItems.deleteMany.mockResolvedValue({ count: 5 } as never);
      mockCateringCategories.delete.mockResolvedValue({ id: VALID_UUID_2 } as never);

      const result = await caller.deleteCategory({ id: VALID_UUID_2 });

      expect(result).toEqual({ success: true });
    });

    it("should throw NOT_FOUND when category does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringCategories.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteCategory({ id: VALID_UUID_2 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // reorderCategories (private)
  // =========================================================================

  describe("reorderCategories", () => {
    it("should update sort orders for categories", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringCategories.update
        .mockResolvedValueOnce({ id: VALID_UUID_2, sortOrder: 1 } as never)
        .mockResolvedValueOnce({ id: VALID_UUID_3, sortOrder: 2 } as never);

      const result = await caller.reorderCategories({
        cateringMenuId: VALID_UUID,
        orderedIds: [VALID_UUID_2, VALID_UUID_3],
      });

      expect(result).toEqual({ success: true });
    });
  });

  // =========================================================================
  // createItem (private)
  // =========================================================================

  describe("createItem", () => {
    it("should create an item with dietary flags", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringCategories.findFirst.mockResolvedValue({ id: VALID_UUID_2 } as never);
      mockCateringItems.aggregate.mockResolvedValue({
        _max: { sortOrder: 0 },
      } as never);
      mockCateringItems.create.mockResolvedValue({
        id: VALID_UUID_3,
        name: "Lamb Tagine",
        isHalal: true,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        pricePerPerson: 5000,
      } as never);

      const result = await caller.createItem({
        cateringMenuId: VALID_UUID,
        cateringCategoryId: VALID_UUID_2,
        name: "Lamb Tagine",
        pricePerPerson: 5000,
        isHalal: true,
        isGlutenFree: true,
      });

      expect(result.name).toBe("Lamb Tagine");
      expect(result.isHalal).toBe(true);
      expect(result.isGlutenFree).toBe(true);
    });

    it("should default isHalal to true", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringCategories.findFirst.mockResolvedValue({ id: VALID_UUID_2 } as never);
      mockCateringItems.aggregate.mockResolvedValue({
        _max: { sortOrder: 0 },
      } as never);
      mockCateringItems.create.mockResolvedValue({
        id: VALID_UUID_3,
        name: "Couscous",
        isHalal: true,
      } as never);

      await caller.createItem({
        cateringMenuId: VALID_UUID,
        cateringCategoryId: VALID_UUID_2,
        name: "Couscous",
      });

      expect(mockCateringItems.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isHalal: true,
        }),
      });
    });

    it("should reject creating item when category does not belong to menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringCategories.findFirst.mockResolvedValue(null);

      await expect(
        caller.createItem({
          cateringMenuId: VALID_UUID,
          cateringCategoryId: VALID_UUID_2,
          name: "Orphan Item",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Category does not belong to this catering menu",
      });
    });

    it("should reject empty item name", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.createItem({
          cateringMenuId: VALID_UUID,
          cateringCategoryId: VALID_UUID_2,
          name: "",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateItem (private)
  // =========================================================================

  describe("updateItem", () => {
    it("should update item details", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringItems.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringItems.update.mockResolvedValue({
        id: VALID_UUID_3,
        name: "Updated Tagine",
        pricePerPerson: 6000,
        isVegetarian: true,
      } as never);

      const result = await caller.updateItem({
        id: VALID_UUID_3,
        data: {
          name: "Updated Tagine",
          pricePerPerson: 6000,
          isVegetarian: true,
        },
      });

      expect(result.name).toBe("Updated Tagine");
      expect(result.isVegetarian).toBe(true);
    });

    it("should throw NOT_FOUND when item does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringItems.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateItem({
          id: VALID_UUID_3,
          data: { name: "Ghost Item" },
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // deleteItem (private)
  // =========================================================================

  describe("deleteItem", () => {
    it("should delete an item and its package item links", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringItems.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackageItems.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockCateringItems.delete.mockResolvedValue({ id: VALID_UUID_3 } as never);

      const result = await caller.deleteItem({ id: VALID_UUID_3 });

      expect(result).toEqual({ success: true });
    });

    it("should throw NOT_FOUND when item does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringItems.findUnique.mockResolvedValue(null);

      await expect(
        caller.deleteItem({ id: VALID_UUID_3 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // toggleItemAvailability (private)
  // =========================================================================

  describe("toggleItemAvailability", () => {
    it("should toggle item availability from true to false", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringItems.findUnique.mockResolvedValue({
        id: VALID_UUID_3,
        cateringMenuId: VALID_UUID,
        isAvailable: true,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringItems.update.mockResolvedValue({
        id: VALID_UUID_3,
        isAvailable: false,
      } as never);

      const result = await caller.toggleItemAvailability({ id: VALID_UUID_3 });

      expect(result.isAvailable).toBe(false);
      expect(mockCateringItems.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_3 },
        data: { isAvailable: false },
      });
    });

    it("should throw NOT_FOUND when item does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringItems.findUnique.mockResolvedValue(null);

      await expect(
        caller.toggleItemAvailability({ id: VALID_UUID_3 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // addItemToPackage (private)
  // =========================================================================

  describe("addItemToPackage", () => {
    it("should link an item to a package", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringItems.findFirst.mockResolvedValue({ id: VALID_UUID_3 } as never);
      mockCateringPackageItems.findFirst.mockResolvedValue(null);
      mockCateringPackageItems.create.mockResolvedValue({
        id: VALID_UUID_4,
        packageId: VALID_UUID_2,
        itemId: VALID_UUID_3,
        categoryId: VALID_UUID,
        isIncluded: true,
      } as never);

      const result = await caller.addItemToPackage({
        packageId: VALID_UUID_2,
        itemId: VALID_UUID_3,
        categoryId: VALID_UUID,
      });

      expect(result.packageId).toBe(VALID_UUID_2);
      expect(result.itemId).toBe(VALID_UUID_3);
    });

    it("should throw CONFLICT when item already exists in package (duplicate prevention)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringItems.findFirst.mockResolvedValue({ id: VALID_UUID_3 } as never);
      mockCateringPackageItems.findFirst.mockResolvedValue({
        id: "existing-link",
      } as never);

      await expect(
        caller.addItemToPackage({
          packageId: VALID_UUID_2,
          itemId: VALID_UUID_3,
          categoryId: VALID_UUID,
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Item is already linked to this package",
      });
    });

    it("should throw BAD_REQUEST when item does not belong to the same menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringItems.findFirst.mockResolvedValue(null); // Item not in this menu

      await expect(
        caller.addItemToPackage({
          packageId: VALID_UUID_2,
          itemId: VALID_UUID_3,
          categoryId: VALID_UUID,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Item does not belong to the same catering menu",
      });
    });
  });

  // =========================================================================
  // removeItemFromPackage (private)
  // =========================================================================

  describe("removeItemFromPackage", () => {
    it("should unlink an item from a package", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackageItems.findUnique.mockResolvedValue({
        id: VALID_UUID_4,
        package: { cateringMenuId: VALID_UUID },
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackageItems.delete.mockResolvedValue({ id: VALID_UUID_4 } as never);

      const result = await caller.removeItemFromPackage({ id: VALID_UUID_4 });

      expect(result).toEqual({ success: true });
    });

    it("should throw NOT_FOUND when package item link does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackageItems.findUnique.mockResolvedValue(null);

      await expect(
        caller.removeItemFromPackage({ id: VALID_UUID_4 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // updatePackageItemSelections (private)
  // =========================================================================

  describe("updatePackageItemSelections", () => {
    it("should update maxSelections for a category in a package", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringPackages.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringPackageItems.updateMany.mockResolvedValue({
        count: 3,
      } as never);

      const result = await caller.updatePackageItemSelections({
        packageId: VALID_UUID_2,
        categoryId: VALID_UUID_3,
        maxSelections: 5,
        isIncluded: true,
      });

      expect(result).toEqual({ updated: 3 });
      expect(mockCateringPackageItems.updateMany).toHaveBeenCalledWith({
        where: {
          packageId: VALID_UUID_2,
          categoryId: VALID_UUID_3,
        },
        data: expect.objectContaining({
          maxSelections: 5,
          isIncluded: true,
        }),
      });
    });
  });

  // =========================================================================
  // submitInquiry (public)
  // =========================================================================

  describe("submitInquiry", () => {
    it("should submit an inquiry without authentication", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: true,
        minGuests: 10,
        maxGuests: 500,
        leadTimeDays: 3,
      } as never);
      mockCateringInquiries.create.mockResolvedValue({
        id: VALID_UUID_2,
        status: "new",
        customerName: "Ahmed Tazi",
      } as never);

      const result = await caller.submitInquiry({
        cateringMenuId: VALID_UUID,
        customerName: "Ahmed Tazi",
        customerPhone: "+212612345678",
        eventType: "wedding",
        eventDate: futureDate(30),
        guestCount: 100,
      });

      expect(result.id).toBe(VALID_UUID_2);
      expect(result.status).toBe("new");
    });

    it("should reject inquiry when rate limited", async () => {
      const caller = createPublicCaller();

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.submitInquiry({
          cateringMenuId: VALID_UUID,
          customerName: "Spammer",
          customerPhone: "+212612345678",
          eventType: "general",
          eventDate: futureDate(30),
          guestCount: 50,
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      expect(mockCateringInquiries.create).not.toHaveBeenCalled();
    });

    it("should reject inquiry with event date too close (lead time)", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: true,
        minGuests: 10,
        maxGuests: 500,
        leadTimeDays: 7,
      } as never);

      // 3 days from now, but lead time is 7
      await expect(
        caller.submitInquiry({
          cateringMenuId: VALID_UUID,
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          eventType: "corporate",
          eventDate: futureDate(3),
          guestCount: 50,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("at least 7 days"),
      });
    });

    it("should reject inquiry when guest count is below minimum", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: true,
        minGuests: 20,
        maxGuests: 500,
        leadTimeDays: 3,
      } as never);

      await expect(
        caller.submitInquiry({
          cateringMenuId: VALID_UUID,
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          eventType: "birthday",
          eventDate: futureDate(30),
          guestCount: 5,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Minimum guest count is 20"),
      });
    });

    it("should reject inquiry when guest count exceeds maximum", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        isPublished: true,
        minGuests: 10,
        maxGuests: 200,
        leadTimeDays: 3,
      } as never);

      await expect(
        caller.submitInquiry({
          cateringMenuId: VALID_UUID,
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          eventType: "wedding",
          eventDate: futureDate(30),
          guestCount: 300,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Maximum guest count is 200"),
      });
    });

    it("should reject inquiry for unpublished menu", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.submitInquiry({
          cateringMenuId: VALID_UUID,
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          eventType: "general",
          eventDate: futureDate(30),
          guestCount: 50,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject inquiry with invalid phone format", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.submitInquiry({
          cateringMenuId: VALID_UUID,
          customerName: "Ahmed",
          customerPhone: "123",
          eventType: "general",
          eventDate: futureDate(30),
          guestCount: 50,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getInquiries (private)
  // =========================================================================

  describe("getInquiries", () => {
    it("should return owner's inquiries with pagination", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringInquiries.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          customerName: "Ahmed",
          status: "new",
          package: { id: VALID_UUID_3, name: "Gold Package", pricePerPerson: 20000 },
        },
      ] as never);

      const result = await caller.getInquiries({
        cateringMenuId: VALID_UUID,
      });

      expect(result).toHaveLength(1);
      expect(result[0]!.customerName).toBe("Ahmed");
    });

    it("should filter inquiries by status", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringInquiries.findMany.mockResolvedValue([] as never);

      await caller.getInquiries({
        cateringMenuId: VALID_UUID,
        status: "confirmed",
      });

      expect(mockCateringInquiries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "confirmed",
          }),
        }),
      );
    });
  });

  // =========================================================================
  // updateInquiryStatus (private)
  // =========================================================================

  describe("updateInquiryStatus", () => {
    it("should update inquiry status", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringInquiries.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
        status: "new",
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringInquiries.update.mockResolvedValue({
        id: VALID_UUID_2,
        status: "quoted",
        quotedTotal: 150000,
      } as never);

      const result = await caller.updateInquiryStatus({
        id: VALID_UUID_2,
        status: "quoted",
        quotedTotal: 150000,
      });

      expect(result.status).toBe("quoted");
      expect(result.quotedTotal).toBe(150000);
    });

    it("should set quotedTotal when quoting", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringInquiries.findUnique.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
        status: "contacted",
      } as never);
      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringInquiries.update.mockResolvedValue({
        id: VALID_UUID_2,
        status: "quoted",
        quotedTotal: 200000,
      } as never);

      const result = await caller.updateInquiryStatus({
        id: VALID_UUID_2,
        status: "quoted",
        quotedTotal: 200000,
        adminNotes: "Premium package with extras",
      });

      expect(result.quotedTotal).toBe(200000);
    });

    it("should throw NOT_FOUND when inquiry does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringInquiries.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateInquiryStatus({
          id: VALID_UUID_2,
          status: "confirmed",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Inquiry not found",
      });
    });
  });

  // =========================================================================
  // getInquiryStats (private)
  // =========================================================================

  describe("getInquiryStats", () => {
    it("should return aggregated stats for a specific menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringInquiries.groupBy.mockResolvedValue([
        { status: "new", _count: 5 },
        { status: "confirmed", _count: 3 },
        { status: "completed", _count: 2 },
      ] as never);
      mockCateringInquiries.findMany.mockResolvedValue([
        { id: "e1", customerName: "A", eventDate: new Date(), guestCount: 100, quotedTotal: 150000 },
      ] as never);
      mockCateringInquiries.aggregate.mockResolvedValue({
        _sum: { quotedTotal: 450000 },
        _count: 3,
      } as never);

      const result = await caller.getInquiryStats({
        cateringMenuId: VALID_UUID,
      });

      expect(result.totalInquiries).toBe(10);
      expect(result.byStatus).toEqual({
        new: 5,
        confirmed: 3,
        completed: 2,
      });
      expect(result.confirmedRevenue).toBe(450000);
    });

    it("should return zero stats when no inquiries exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringInquiries.groupBy.mockResolvedValue([] as never);
      mockCateringInquiries.findMany.mockResolvedValue([] as never);
      mockCateringInquiries.aggregate.mockResolvedValue({
        _sum: { quotedTotal: null },
        _count: 0,
      } as never);

      const result = await caller.getInquiryStats({
        cateringMenuId: VALID_UUID,
      });

      expect(result.totalInquiries).toBe(0);
      expect(result.confirmedRevenue).toBe(0);
    });
  });

  // =========================================================================
  // saveTheme (private)
  // =========================================================================

  describe("saveTheme", () => {
    it("should upsert a theme for a catering menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringThemes.upsert.mockResolvedValue({
        id: VALID_UUID_2,
        cateringMenuId: VALID_UUID,
        primaryColor: "#D4A574",
        secondaryColor: "#8B6914",
      } as never);

      const result = await caller.saveTheme({
        cateringMenuId: VALID_UUID,
        primaryColor: "#D4A574",
        secondaryColor: "#8B6914",
        backgroundColor: "#FFFBF5",
        surfaceColor: "#FFFFFF",
        textColor: "#1A1A1A",
        accentColor: "#C75B39",
        headingFont: "Playfair Display",
        bodyFont: "Source Sans 3",
        layoutStyle: "elegant",
        cardStyle: "elevated",
        headerStyle: "banner",
      });

      expect(result.primaryColor).toBe("#D4A574");
      expect(mockCateringThemes.upsert).toHaveBeenCalledWith({
        where: { cateringMenuId: VALID_UUID },
        create: expect.objectContaining({
          cateringMenuId: VALID_UUID,
          primaryColor: "#D4A574",
        }),
        update: expect.objectContaining({
          primaryColor: "#D4A574",
        }),
      });
    });

    it("should reject invalid hex color format", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.saveTheme({
          cateringMenuId: VALID_UUID,
          primaryColor: "not-a-color",
          secondaryColor: "#8B6914",
          backgroundColor: "#FFFBF5",
          surfaceColor: "#FFFFFF",
          textColor: "#1A1A1A",
          accentColor: "#C75B39",
          headingFont: "Playfair Display",
          bodyFont: "Source Sans 3",
          layoutStyle: "elegant",
          cardStyle: "flat",
          headerStyle: "banner",
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid layout style", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.saveTheme({
          cateringMenuId: VALID_UUID,
          primaryColor: "#D4A574",
          secondaryColor: "#8B6914",
          backgroundColor: "#FFFBF5",
          surfaceColor: "#FFFFFF",
          textColor: "#1A1A1A",
          accentColor: "#C75B39",
          headingFont: "Playfair Display",
          bodyFont: "Source Sans 3",
          layoutStyle: "invalid-style" as never,
          cardStyle: "flat",
          headerStyle: "banner",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // resetTheme (private)
  // =========================================================================

  describe("resetTheme", () => {
    it("should delete the theme for a catering menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCateringMenus.findFirst.mockResolvedValue({ id: VALID_UUID } as never);
      mockCateringThemes.deleteMany.mockResolvedValue({ count: 1 } as never);

      const result = await caller.resetTheme({
        cateringMenuId: VALID_UUID,
      });

      expect(result).toEqual({ success: true });
      expect(mockCateringThemes.deleteMany).toHaveBeenCalledWith({
        where: { cateringMenuId: VALID_UUID },
      });
    });
  });

  // =========================================================================
  // getPublicCateringMenu (public)
  // =========================================================================

  describe("getPublicCateringMenu", () => {
    it("should return a published catering menu by slug", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        name: "Wedding Feast",
        slug: "wedding-feast-catering-123456",
        isPublished: true,
        userId: "owner-id",
        categories: [],
        packages: [],
        theme: null,
      } as never);

      const result = await caller.getPublicCateringMenu({
        slug: "wedding-feast-catering-123456",
      });

      // userId should be stripped for security
      expect(result).not.toHaveProperty("userId");
      expect(result.name).toBe("Wedding Feast");
    });

    it("should throw NOT_FOUND for unpublished menu", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getPublicCateringMenu({ slug: "unpublished-menu" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should return menu with only available items", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findFirst.mockResolvedValue({
        id: VALID_UUID,
        name: "Menu with Items",
        slug: "menu-with-items-catering-123456",
        isPublished: true,
        userId: "owner-id",
        categories: [
          {
            id: VALID_UUID_2,
            name: "Appetizers",
            cateringItems: [
              { id: VALID_UUID_3, name: "Available Item", isAvailable: true },
              // Unavailable items should be filtered out by the query
            ],
          },
        ],
        packages: [],
        theme: null,
      } as never);

      const result = await caller.getPublicCateringMenu({
        slug: "menu-with-items-catering-123456",
      });

      expect(result.categories[0]!.cateringItems).toHaveLength(1);

      // Verify the query filters by isAvailable
      expect(mockCateringMenus.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: "menu-with-items-catering-123456", isPublished: true },
          include: expect.objectContaining({
            categories: expect.objectContaining({
              include: expect.objectContaining({
                cateringItems: expect.objectContaining({
                  where: { isAvailable: true },
                }),
              }),
            }),
          }),
        }),
      );
    });
  });

  // =========================================================================
  // getCateringDirectory (public)
  // =========================================================================

  describe("getCateringDirectory", () => {
    it("should list published catering menus with pagination", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findMany.mockResolvedValue([
        {
          id: VALID_UUID,
          name: "Wedding Feast",
          slug: "wedding-feast-123456",
          city: "Casablanca",
          basePricePerPerson: 15000,
        },
      ] as never);
      mockCateringMenus.count.mockResolvedValue(1);

      const result = await caller.getCateringDirectory({});

      expect(result.menus).toHaveLength(1);
      expect(result.pagination.totalCount).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should filter by city", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findMany.mockResolvedValue([] as never);
      mockCateringMenus.count.mockResolvedValue(0);

      await caller.getCateringDirectory({
        city: "Marrakech",
      });

      expect(mockCateringMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            city: expect.objectContaining({ contains: "Marrakech" }),
          }),
        }),
      );
    });

    it("should filter by event type", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findMany.mockResolvedValue([] as never);
      mockCateringMenus.count.mockResolvedValue(0);

      await caller.getCateringDirectory({
        eventType: "wedding",
      });

      expect(mockCateringMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            eventType: "wedding",
          }),
        }),
      );
    });

    it("should sort by price ascending", async () => {
      const caller = createPublicCaller();

      mockCateringMenus.findMany.mockResolvedValue([] as never);
      mockCateringMenus.count.mockResolvedValue(0);

      await caller.getCateringDirectory({
        sortBy: "price_asc",
      });

      expect(mockCateringMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ basePricePerPerson: "asc" }],
        }),
      );
    });
  });

  // =========================================================================
  // Auth guard: all private endpoints require authentication
  // =========================================================================

  describe("authentication", () => {
    it("should reject unauthenticated access to getMyMenus", async () => {
      const caller = createPublicCaller();

      await expect(caller.getMyMenus()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should reject unauthenticated access to createMenu", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.createMenu({
          name: "Test Menu",
          basePricePerPerson: 10000,
        }),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should reject unauthenticated access to updateInquiryStatus", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.updateInquiryStatus({
          id: VALID_UUID,
          status: "confirmed",
        }),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });

  // =========================================================================
  // Input validation
  // =========================================================================

  describe("input validation", () => {
    it("should reject non-UUID menuId in getMenu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMenu({ id: "not-a-uuid" }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID packageId in deletePackage", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.deletePackage({ id: "bad-id" }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID in addItemToPackage", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.addItemToPackage({
          packageId: "not-uuid",
          itemId: VALID_UUID,
          categoryId: VALID_UUID,
        }),
      ).rejects.toThrow();
    });

    it("should reject slug exceeding 300 characters in getPublicCateringMenu", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getPublicCateringMenu({ slug: "a".repeat(301) }),
      ).rejects.toThrow();
    });
  });
});
