import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the cateringMenus tRPC router.
 * Covers menu CRUD, categories, items, duplicate, and public endpoints.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    cateringMenus: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cateringCategories: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cateringItems: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cateringPackages: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organizations: {
      findUnique: vi.fn(),
    },
    orgMembers: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
  getServiceSupabase: vi.fn(),
}));

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { db } from "~/server/db";
import { cateringMenusRouter } from "../api/routers/cateringMenus";
import { createMenu, createCategory, createDish, createDishVariant, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const MENU_ID = "00000000-0000-4000-a000-000000000700";
const CATEGORY_ID = "00000000-0000-4000-a000-000000000701";
const ITEM_ID = "00000000-0000-4000-a000-000000000702";
const PACKAGE_ID = "00000000-0000-4000-a000-000000000800";
const OTHER_ORG_ID = "00000000-0000-4000-a000-000000000999";

function createOrgCaller(role: string = "staff") {
  return cateringMenusRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "test@example.com" } as never,
    orgId: ORG_ID,
    orgRole: role,
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

function createManagerCaller() {
  return createOrgCaller("manager");
}

function createPublicCaller() {
  return cateringMenusRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

function createUnauthCaller() {
  return cateringMenusRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cateringMenusRouter", () => {
  const mockMenus = vi.mocked(db.cateringMenus);
  const mockCategories = vi.mocked(db.cateringCategories);
  const mockItems = vi.mocked(db.cateringItems);
  const mockPackages = vi.mocked(db.cateringPackages);
  const mockOrgs = vi.mocked(db.organizations);
  const mockMembers = vi.mocked(db.orgMembers);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockMembers.findFirst.mockResolvedValue({
      id: MEMBER_ID,
      orgId: ORG_ID,
      role: "manager",
      permissions: null,
    } as never);
  });

  // =========================================================================
  // getPublicMenus
  // =========================================================================

  describe("getPublicMenus", () => {
    it("should return published menus for a caterer slug", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      const menu = createMenu({ orgId: ORG_ID, isPublished: true });
      mockMenus.findMany.mockResolvedValue([menu] as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicMenus({ orgSlug: "my-caterer" });

      expect(result).toHaveLength(1);
      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: ORG_ID, isPublished: true, isActive: true },
        }),
      );
    });

    it("should throw NOT_FOUND when org slug not found", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.getPublicMenus({ orgSlug: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should not require authentication", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicMenus({ orgSlug: "test" });

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // list
  // =========================================================================

  describe("list", () => {
    it("should return org menus with counts", async () => {
      const menu = createMenu({ orgId: ORG_ID });
      mockMenus.findMany.mockResolvedValue([menu] as never);

      const caller = createOrgCaller();
      const result = await caller.list({});

      expect(result).toHaveLength(1);
      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: ORG_ID }),
        }),
      );
    });

    it("should filter by menuType", async () => {
      mockMenus.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ menuType: "per_head" });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ menuType: "per_head" }),
        }),
      );
    });

    it("should filter by isActive", async () => {
      mockMenus.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ isActive: true });

      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  // =========================================================================
  // getById
  // =========================================================================

  describe("getById", () => {
    it("should return menu with categories, items, and packages", async () => {
      const menu = createMenu({ id: MENU_ID, orgId: ORG_ID });
      mockMenus.findFirst.mockResolvedValue({
        ...menu,
        categories: [],
        packages: [],
      } as never);

      const caller = createOrgCaller();
      const result = await caller.getById({ menuId: MENU_ID });

      expect(result.id).toBe(MENU_ID);
    });

    it("should throw NOT_FOUND when menu does not exist or belongs to other org", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.getById({ menuId: MENU_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject invalid UUID", async () => {
      const caller = createOrgCaller();
      await expect(
        caller.getById({ menuId: "bad-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // create
  // =========================================================================

  describe("create", () => {
    it("should create menu with generated slug and defaults", async () => {
      const menu = createMenu({ orgId: ORG_ID });
      mockMenus.create.mockResolvedValue(menu as never);

      const caller = createManagerCaller();
      const result = await caller.create({
        name: "Wedding Feast Menu",
        menuType: "per_head",
      });

      expect(mockMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            name: "Wedding Feast Menu",
            isActive: true,
            isFeatured: false,
            isPublished: false,
          }),
        }),
      );
    });

    it("should reject name shorter than 2 characters", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({ name: "A" }),
      ).rejects.toThrow();
    });

    it("should accept all menu types", async () => {
      const types = ["per_head", "per_dish", "package", "custom"] as const;
      for (const menuType of types) {
        vi.clearAllMocks();
        mockMembers.findFirst.mockResolvedValue({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "manager",
          permissions: null,
        } as never);
        mockMenus.create.mockResolvedValue(createMenu() as never);

        const caller = createManagerCaller();
        await caller.create({ name: "Test Menu", menuType });
        expect(mockMenus.create).toHaveBeenCalled();
      }
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe("update", () => {
    it("should update menu fields", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID, orgId: ORG_ID } as never);
      mockMenus.update.mockResolvedValue({ id: MENU_ID, name: "Updated" } as never);

      const caller = createManagerCaller();
      await caller.update({ menuId: MENU_ID, name: "Updated" });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: MENU_ID },
        data: { name: "Updated" },
      });
    });

    it("should throw NOT_FOUND when menu does not belong to org", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.update({ menuId: MENU_ID, name: "Test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should allow toggling isPublished", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID, orgId: ORG_ID } as never);
      mockMenus.update.mockResolvedValue({ id: MENU_ID, isPublished: true } as never);

      const caller = createManagerCaller();
      await caller.update({ menuId: MENU_ID, isPublished: true });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: MENU_ID },
        data: expect.objectContaining({ isPublished: true }),
      });
    });
  });

  // =========================================================================
  // delete (soft)
  // =========================================================================

  describe("delete", () => {
    it("should soft-delete by setting isActive false", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID, orgId: ORG_ID } as never);
      mockMenus.update.mockResolvedValue({ id: MENU_ID, isActive: false } as never);

      const caller = createManagerCaller();
      await caller.delete({ menuId: MENU_ID });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: MENU_ID },
        data: { isActive: false },
      });
    });

    it("should throw NOT_FOUND for non-existent menu", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.delete({ menuId: MENU_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // addCategory
  // =========================================================================

  describe("addCategory", () => {
    it("should add category to menu with auto-incremented sortOrder", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID, orgId: ORG_ID } as never);
      mockCategories.findFirst.mockResolvedValue({ sortOrder: 3 } as never); // last category
      const cat = createCategory({ cateringMenuId: MENU_ID });
      mockCategories.create.mockResolvedValue(cat as never);

      const caller = createManagerCaller();
      await caller.addCategory({
        menuId: MENU_ID,
        name: "Desserts",
      });

      expect(mockCategories.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cateringMenuId: MENU_ID,
            name: "Desserts",
            sortOrder: 4,
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when menu does not belong to org", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.addCategory({ menuId: MENU_ID, name: "Test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should accept multi-language names", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID, orgId: ORG_ID } as never);
      mockCategories.findFirst.mockResolvedValue(null as never);
      mockCategories.create.mockResolvedValue(createCategory() as never);

      const caller = createManagerCaller();
      await caller.addCategory({
        menuId: MENU_ID,
        name: "Appetizers",
        nameAr: "المقبلات",
        nameFr: "Entr\u00e9es",
      });

      expect(mockCategories.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nameAr: "المقبلات",
            nameFr: "Entr\u00e9es",
          }),
        }),
      );
    });
  });

  // =========================================================================
  // updateCategory
  // =========================================================================

  describe("updateCategory", () => {
    it("should update category by verifying ownership via menu", async () => {
      mockCategories.findUnique.mockResolvedValue({
        id: CATEGORY_ID,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockCategories.update.mockResolvedValue({ id: CATEGORY_ID, name: "Updated" } as never);

      const caller = createManagerCaller();
      await caller.updateCategory({ categoryId: CATEGORY_ID, name: "Updated" });

      expect(mockCategories.update).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when category belongs to different org", async () => {
      mockCategories.findUnique.mockResolvedValue({
        id: CATEGORY_ID,
        cateringMenu: { orgId: "other-org" },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateCategory({ categoryId: CATEGORY_ID, name: "Test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // deleteCategory
  // =========================================================================

  describe("deleteCategory", () => {
    it("should delete category when owned by org", async () => {
      mockCategories.findUnique.mockResolvedValue({
        id: CATEGORY_ID,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockCategories.delete.mockResolvedValue({ id: CATEGORY_ID } as never);

      const caller = createManagerCaller();
      await caller.deleteCategory({ categoryId: CATEGORY_ID });

      expect(mockCategories.delete).toHaveBeenCalledWith({ where: { id: CATEGORY_ID } });
    });

    it("should throw NOT_FOUND for non-existent category", async () => {
      mockCategories.findUnique.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.deleteCategory({ categoryId: CATEGORY_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // addItem
  // =========================================================================

  describe("addItem", () => {
    it("should add item to category with auto sortOrder", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID, orgId: ORG_ID } as never);
      mockItems.findFirst.mockResolvedValue({ sortOrder: 5 } as never);
      const item = createDish({ cateringMenuId: MENU_ID, cateringCategoryId: CATEGORY_ID });
      mockItems.create.mockResolvedValue(item as never);

      const caller = createManagerCaller();
      await caller.addItem({
        menuId: MENU_ID,
        categoryId: CATEGORY_ID,
        name: "Lamb Tagine",
        pricePerPerson: 120,
      });

      expect(mockItems.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cateringMenuId: MENU_ID,
            cateringCategoryId: CATEGORY_ID,
            name: "Lamb Tagine",
            pricePerPerson: 120,
            sortOrder: 6,
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when menu does not belong to org", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.addItem({
          menuId: MENU_ID,
          categoryId: CATEGORY_ID,
          name: "Test Item",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should accept dietary flags", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID, orgId: ORG_ID } as never);
      mockItems.findFirst.mockResolvedValue(null as never);
      mockItems.create.mockResolvedValue(createDish() as never);

      const caller = createManagerCaller();
      await caller.addItem({
        menuId: MENU_ID,
        categoryId: CATEGORY_ID,
        name: "Veggie Couscous",
        isVegetarian: true,
        isGlutenFree: true,
        allergens: ["nuts"],
      });

      expect(mockItems.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVegetarian: true,
            isGlutenFree: true,
            allergens: ["nuts"],
          }),
        }),
      );
    });
  });

  // =========================================================================
  // updateItem
  // =========================================================================

  describe("updateItem", () => {
    it("should update item by verifying ownership via menu", async () => {
      mockItems.findUnique.mockResolvedValue({
        id: ITEM_ID,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockItems.update.mockResolvedValue({ id: ITEM_ID, name: "Updated" } as never);

      const caller = createManagerCaller();
      await caller.updateItem({ itemId: ITEM_ID, name: "Updated" });

      expect(mockItems.update).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
        data: { name: "Updated" },
      });
    });

    it("should throw NOT_FOUND when item belongs to different org", async () => {
      mockItems.findUnique.mockResolvedValue({
        id: ITEM_ID,
        cateringMenu: { orgId: "other-org" },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateItem({ itemId: ITEM_ID, name: "Test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // deleteItem
  // =========================================================================

  describe("deleteItem", () => {
    it("should delete item when owned by org", async () => {
      mockItems.findUnique.mockResolvedValue({
        id: ITEM_ID,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockItems.delete.mockResolvedValue({ id: ITEM_ID } as never);

      const caller = createManagerCaller();
      await caller.deleteItem({ itemId: ITEM_ID });

      expect(mockItems.delete).toHaveBeenCalledWith({ where: { id: ITEM_ID } });
    });

    it("should throw NOT_FOUND for non-existent item", async () => {
      mockItems.findUnique.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.deleteItem({ itemId: ITEM_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // duplicate
  // =========================================================================

  describe("duplicate", () => {
    it("should duplicate menu with categories", async () => {
      const sourceMenu = {
        id: MENU_ID,
        orgId: ORG_ID,
        description: "Original description",
        menuType: "per_head",
        eventType: "wedding",
        minGuests: 10,
        maxGuests: 200,
        basePricePerPerson: 15000,
        cuisineType: "Moroccan",
        dietaryTags: ["halal"],
        photos: [],
        categories: [
          {
            name: "Main Course",
            nameAr: null,
            nameFr: null,
            description: null,
            sortOrder: 0,
            isOptional: false,
            maxSelections: null,
            cateringItems: [{ name: "Tagine" }],
          },
        ],
      };
      mockMenus.findFirst.mockResolvedValue(sourceMenu as never);
      const duplicated = createMenu({ name: "Wedding Menu Copy" });
      mockMenus.create.mockResolvedValue(duplicated as never);

      const caller = createManagerCaller();
      await caller.duplicate({ menuId: MENU_ID, newName: "Wedding Menu Copy" });

      expect(mockMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            name: "Wedding Menu Copy",
            isActive: true,
            isFeatured: false,
            isPublished: false,
            categories: {
              create: expect.arrayContaining([
                expect.objectContaining({ name: "Main Course" }),
              ]),
            },
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when source menu does not exist", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.duplicate({ menuId: MENU_ID, newName: "Copy" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject short name for duplicate", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.duplicate({ menuId: MENU_ID, newName: "A" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // listPackages
  // =========================================================================

  describe("listPackages", () => {
    it("should list all packages for a menu owned by org", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID } as never);
      const pkg = createDishVariant({ cateringMenuId: MENU_ID });
      mockPackages.findMany.mockResolvedValue([pkg] as never);

      const caller = createOrgCaller();
      const result = await caller.listPackages({ menuId: MENU_ID });

      expect(result).toHaveLength(1);
      expect(mockPackages.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cateringMenuId: MENU_ID },
          orderBy: { sortOrder: "asc" },
        }),
      );
    });

    it("should throw NOT_FOUND when menu does not belong to org", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.listPackages({ menuId: MENU_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should return empty array when no packages exist", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID } as never);
      mockPackages.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.listPackages({ menuId: MENU_ID });

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getPackage
  // =========================================================================

  describe("getPackage", () => {
    it("should return a single package with items", async () => {
      const pkg = createDishVariant({ id: PACKAGE_ID, cateringMenuId: MENU_ID });
      mockPackages.findUnique.mockResolvedValue({
        ...pkg,
        cateringMenu: { orgId: ORG_ID },
        packageItems: [],
      } as never);

      const caller = createOrgCaller();
      const result = await caller.getPackage({ packageId: PACKAGE_ID });

      expect(result.id).toBe(PACKAGE_ID);
    });

    it("should throw NOT_FOUND when package belongs to another org (IDOR)", async () => {
      const pkg = createDishVariant({ id: PACKAGE_ID });
      mockPackages.findUnique.mockResolvedValue({
        ...pkg,
        cateringMenu: { orgId: OTHER_ORG_ID },
        packageItems: [],
      } as never);

      const caller = createOrgCaller();
      await expect(
        caller.getPackage({ packageId: PACKAGE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw NOT_FOUND when package does not exist", async () => {
      mockPackages.findUnique.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.getPackage({ packageId: PACKAGE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // createPackage
  // =========================================================================

  describe("createPackage", () => {
    it("should create package with auto-incremented sortOrder", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID } as never);
      mockPackages.findFirst.mockResolvedValue({ sortOrder: 2 } as never);
      const pkg = createDishVariant({ cateringMenuId: MENU_ID });
      mockPackages.create.mockResolvedValue(pkg as never);

      const caller = createManagerCaller();
      await caller.createPackage({
        menuId: MENU_ID,
        name: "Gold Wedding Package",
        pricePerPerson: 4500,
        minGuests: 20,
      });

      expect(mockPackages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cateringMenuId: MENU_ID,
            name: "Gold Wedding Package",
            pricePerPerson: 4500,
            minGuests: 20,
            sortOrder: 3,
          }),
        }),
      );
    });

    it("should set sortOrder to 1 when no packages exist yet", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID } as never);
      mockPackages.findFirst.mockResolvedValue(null as never);
      mockPackages.create.mockResolvedValue(createDishVariant() as never);

      const caller = createManagerCaller();
      await caller.createPackage({
        menuId: MENU_ID,
        name: "Silver Package",
      });

      expect(mockPackages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 1 }),
        }),
      );
    });

    it("should throw NOT_FOUND when menu does not belong to org (IDOR)", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.createPackage({ menuId: MENU_ID, name: "Test Package" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject name shorter than 2 characters", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.createPackage({ menuId: MENU_ID, name: "A" }),
      ).rejects.toThrow();
    });

    it("should accept multi-language names", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID } as never);
      mockPackages.findFirst.mockResolvedValue(null as never);
      mockPackages.create.mockResolvedValue(createDishVariant() as never);

      const caller = createManagerCaller();
      await caller.createPackage({
        menuId: MENU_ID,
        name: "Premium Package",
        nameAr: "\u0628\u0627\u0642\u0629 \u0645\u0645\u064a\u0632\u0629",
        nameFr: "Forfait Premium",
      });

      expect(mockPackages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nameAr: "\u0628\u0627\u0642\u0629 \u0645\u0645\u064a\u0632\u0629",
            nameFr: "Forfait Premium",
          }),
        }),
      );
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.createPackage({ menuId: MENU_ID, name: "Test" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  // =========================================================================
  // updatePackage
  // =========================================================================

  describe("updatePackage", () => {
    it("should update package fields", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockPackages.update.mockResolvedValue({
        id: PACKAGE_ID,
        name: "Updated Package",
      } as never);

      const caller = createManagerCaller();
      await caller.updatePackage({
        packageId: PACKAGE_ID,
        name: "Updated Package",
        pricePerPerson: 6000,
      });

      expect(mockPackages.update).toHaveBeenCalledWith({
        where: { id: PACKAGE_ID },
        data: expect.objectContaining({
          name: "Updated Package",
          pricePerPerson: 6000,
        }),
      });
    });

    it("should throw NOT_FOUND when package belongs to another org (IDOR)", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        cateringMenu: { orgId: OTHER_ORG_ID },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updatePackage({ packageId: PACKAGE_ID, name: "Hacked" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw NOT_FOUND when package does not exist", async () => {
      mockPackages.findUnique.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.updatePackage({ packageId: PACKAGE_ID, name: "Test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should allow setting maxGuests to null", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockPackages.update.mockResolvedValue({ id: PACKAGE_ID } as never);

      const caller = createManagerCaller();
      await caller.updatePackage({
        packageId: PACKAGE_ID,
        maxGuests: null,
      });

      expect(mockPackages.update).toHaveBeenCalledWith({
        where: { id: PACKAGE_ID },
        data: expect.objectContaining({ maxGuests: null }),
      });
    });
  });

  // =========================================================================
  // deletePackage
  // =========================================================================

  describe("deletePackage", () => {
    it("should hard-delete package when owned by org", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockPackages.delete.mockResolvedValue({ id: PACKAGE_ID } as never);

      const caller = createManagerCaller();
      await caller.deletePackage({ packageId: PACKAGE_ID });

      expect(mockPackages.delete).toHaveBeenCalledWith({
        where: { id: PACKAGE_ID },
      });
    });

    it("should throw NOT_FOUND when package belongs to another org (IDOR)", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        cateringMenu: { orgId: OTHER_ORG_ID },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.deletePackage({ packageId: PACKAGE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw NOT_FOUND when package does not exist", async () => {
      mockPackages.findUnique.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.deletePackage({ packageId: PACKAGE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // reorderPackages
  // =========================================================================

  describe("reorderPackages", () => {
    it("should update sortOrder for multiple packages", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID } as never);
      const pkg1 = createDishVariant({ id: PACKAGE_ID, sortOrder: 1 });
      const pkg2Id = "00000000-0000-4000-a000-000000000801";
      const pkg2 = createDishVariant({ id: pkg2Id, sortOrder: 0 });
      mockPackages.update
        .mockResolvedValueOnce({ ...pkg1, sortOrder: 0 } as never)
        .mockResolvedValueOnce({ ...pkg2, sortOrder: 1 } as never);

      const caller = createManagerCaller();
      const result = await caller.reorderPackages({
        menuId: MENU_ID,
        packages: [
          { id: PACKAGE_ID, sortOrder: 0 },
          { id: pkg2Id, sortOrder: 1 },
        ],
      });

      expect(result).toHaveLength(2);
      expect(mockPackages.update).toHaveBeenCalledTimes(2);
    });

    it("should return empty array when packages list is empty", async () => {
      mockMenus.findFirst.mockResolvedValue({ id: MENU_ID } as never);

      const caller = createManagerCaller();
      const result = await caller.reorderPackages({
        menuId: MENU_ID,
        packages: [],
      });

      expect(result).toEqual([]);
      expect(mockPackages.update).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when menu does not belong to org", async () => {
      mockMenus.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.reorderPackages({
          menuId: MENU_ID,
          packages: [{ id: PACKAGE_ID, sortOrder: 0 }],
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // togglePackageFeatured
  // =========================================================================

  describe("togglePackageFeatured", () => {
    it("should toggle isFeatured from false to true", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        isFeatured: false,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockPackages.update.mockResolvedValue({
        id: PACKAGE_ID,
        isFeatured: true,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.togglePackageFeatured({ packageId: PACKAGE_ID });

      expect(result.isFeatured).toBe(true);
      expect(mockPackages.update).toHaveBeenCalledWith({
        where: { id: PACKAGE_ID },
        data: { isFeatured: true },
      });
    });

    it("should toggle isFeatured from true to false", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        isFeatured: true,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockPackages.update.mockResolvedValue({
        id: PACKAGE_ID,
        isFeatured: false,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.togglePackageFeatured({ packageId: PACKAGE_ID });

      expect(result.isFeatured).toBe(false);
      expect(mockPackages.update).toHaveBeenCalledWith({
        where: { id: PACKAGE_ID },
        data: { isFeatured: false },
      });
    });

    it("should throw NOT_FOUND when package belongs to another org (IDOR)", async () => {
      mockPackages.findUnique.mockResolvedValue({
        id: PACKAGE_ID,
        isFeatured: false,
        cateringMenu: { orgId: OTHER_ORG_ID },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.togglePackageFeatured({ packageId: PACKAGE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw NOT_FOUND when package does not exist", async () => {
      mockPackages.findUnique.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.togglePackageFeatured({ packageId: PACKAGE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // Authentication
  // =========================================================================

  describe("authentication", () => {
    it("should allow public access to getPublicMenus", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicMenus({ orgSlug: "test" });
      expect(result).toEqual([]);
    });

    it("should reject unauthenticated access to list", async () => {
      const caller = createUnauthCaller();
      await expect(caller.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject unauthenticated access to create", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.create({ name: "Test Menu" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject unauthenticated access to addItem", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.addItem({
          menuId: MENU_ID,
          categoryId: CATEGORY_ID,
          name: "Test",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
