import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the menus tRPC router (merged from sub-modules).
 * Covers CRUD operations, publishing/unpublishing, slug generation,
 * menu management (duplicate, stats), categories, dishes, export,
 * schedules, IDOR protection, and input validation.
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
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const { db: mockDb } = await import("~/server/db");

      return cb(mockDb);
    }),
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

function createPublicCaller() {
  return menusRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function validMenuInput(overrides?: Record<string, unknown>) {
  return {
    name: "Riad Casablanca",
    city: "Casablanca",
    address: "12 Rue Mohammed V",
    contactPhoneNumber: "+212612345678",
    ...overrides,
  };
}

/** Minimal full menu shape returned by getFullMenu. */
function fullMenuResult(userId: string, slug: string, overrides?: Record<string, unknown>) {
  return {
    id: VALID_UUID_1,
    name: "Riad Casablanca",
    slug,
    address: "12 Rue Mohammed V",
    city: "Casablanca",
    contactNumber: "+212612345678",
    whatsappNumber: null,
    backgroundImageUrl: null,
    logoImageUrl: null,
    currency: "MAD",
    userId,
    isPublished: true,
    facebookUrl: null,
    googleReviewUrl: null,
    instagramUrl: null,
    dishes: [],
    categories: [],
    menuLanguages: [],
    cuisineType: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("menusRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockCategories = vi.mocked(db.categories);
  const mockDishes = vi.mocked(db.dishes);
  const mockDishVariants = vi.mocked(db.dishVariants);
  const mockSubscriptions = vi.mocked(db.subscriptions);
  const mockReviews = vi.mocked(db.reviews);
  const mockMenuSchedules = vi.mocked(db.menuSchedules);
  const mockMenuLanguages = vi.mocked(db.menuLanguages);
  const mockTransaction = vi.mocked(db.$transaction);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // getMenus (CRUD)
  // =========================================================================

  describe("getMenus", () => {
    it("should return all menus for the authenticated user", async () => {
      const owner = createUser();
      const menu1 = createMenu({ userId: owner.id });
      const menu2 = createMenu({ userId: owner.id });
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([menu1, menu2] as never);

      const result = await caller.getMenus();

      expect(result).toHaveLength(2);
      expect(mockMenus.findMany).toHaveBeenCalledWith({
        where: { userId: owner.id },
        include: { _count: { select: { dishes: true } } },
      });
    });

    it("should return empty array when user has no menus", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      const result = await caller.getMenus();

      expect(result).toEqual([]);
    });

    it("should only return menus belonging to the calling user (IDOR)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findMany.mockResolvedValue([]);

      await caller.getMenus();

      expect(mockMenus.findMany).toHaveBeenCalledWith({
        where: { userId: owner.id },
        include: { _count: { select: { dishes: true } } },
      });
    });
  });

  // =========================================================================
  // upsertMenu (CRUD)
  // =========================================================================

  describe("upsertMenu", () => {
    it("should create a new menu when no id is provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);
      const newMenu = createMenu({ userId: owner.id });

      mockMenus.upsert.mockResolvedValue(newMenu as never);

      const result = await caller.upsertMenu(validMenuInput());

      expect(result).toEqual(newMenu);
      expect(mockMenus.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "00000000-0000-0000-0000-000000000000",
            userId: owner.id,
          }),
          create: expect.objectContaining({
            name: "Riad Casablanca",
            city: "Casablanca",
            address: "12 Rue Mohammed V",
            userId: owner.id,
            isPublished: false,
          }),
        }),
      );
    });

    it("should update an existing menu when id is provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);
      const existingMenu = createMenu({ userId: owner.id });

      mockMenus.upsert.mockResolvedValue(existingMenu as never);

      await caller.upsertMenu(validMenuInput({ id: existingMenu.id }));

      expect(mockMenus.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: existingMenu.id,
            userId: owner.id,
          }),
          update: expect.objectContaining({
            name: "Riad Casablanca",
            city: "Casablanca",
          }),
        }),
      );
    });

    it("should generate a slug from name and city", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);
      const newMenu = createMenu({ userId: owner.id });

      mockMenus.upsert.mockResolvedValue(newMenu as never);

      await caller.upsertMenu(validMenuInput());

      const call = mockMenus.upsert.mock.calls[0]![0] as { create: { slug: string } };

      expect(call.create.slug).toMatch(/riad-casablanca-casablanca-\d{1,6}/);
    });

    it("should connect default menu language on create", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.upsert.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.upsertMenu(validMenuInput());

      const call = mockMenus.upsert.mock.calls[0]![0] as {
        create: { menuLanguages: { create: { isDefault: boolean; languages: { connect: { name: string } } } } };
      };

      expect(call.create.menuLanguages.create.isDefault).toBe(true);
      expect(call.create.menuLanguages.create.languages.connect.name).toBe("French");
    });

    it("should handle whatsappNumber on create", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.upsert.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.upsertMenu(validMenuInput({ whatsappNumber: "+212612345678" }));

      const call = mockMenus.upsert.mock.calls[0]![0] as { create: { whatsappNumber: string | null } };

      expect(call.create.whatsappNumber).toBe("+212612345678");
    });

    it("should set whatsappNumber to null when not provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.upsert.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.upsertMenu(validMenuInput());

      const call = mockMenus.upsert.mock.calls[0]![0] as { create: { whatsappNumber: string | null } };

      expect(call.create.whatsappNumber).toBeNull();
    });

    it("should reject empty name", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertMenu(validMenuInput({ name: "" })),
      ).rejects.toThrow();
    });

    it("should reject name exceeding 200 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertMenu(validMenuInput({ name: "A".repeat(201) })),
      ).rejects.toThrow();
    });

    it("should reject empty city", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertMenu(validMenuInput({ city: "" })),
      ).rejects.toThrow();
    });

    it("should reject empty address", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertMenu(validMenuInput({ address: "" })),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateMenuSocials (CRUD)
  // =========================================================================

  describe("updateMenuSocials", () => {
    it("should update social media URLs", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.updateMenuSocials({
        menuId: VALID_UUID_1,
        facebookUrl: "https://facebook.com/riad",
        instagramUrl: "https://instagram.com/riad",
        googleReviewUrl: "https://g.page/riad",
      });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: {
          facebookUrl: "https://facebook.com/riad",
          instagramUrl: "https://instagram.com/riad",
          googleReviewUrl: "https://g.page/riad",
        },
      });
    });

    it("should set null when social URLs are empty strings", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.updateMenuSocials({
        menuId: VALID_UUID_1,
        facebookUrl: "",
        instagramUrl: "",
        googleReviewUrl: "",
      });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: {
          facebookUrl: null,
          instagramUrl: null,
          googleReviewUrl: null,
        },
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateMenuSocials({
          menuId: "not-a-uuid",
          facebookUrl: "",
          instagramUrl: "",
          googleReviewUrl: "",
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid URL format", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateMenuSocials({
          menuId: VALID_UUID_1,
          facebookUrl: "not-a-url",
          instagramUrl: "",
          googleReviewUrl: "",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateMenuBackgroundImg (CRUD)
  // =========================================================================

  describe("updateMenuBackgroundImg", () => {
    it("should update background image URL", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.updateMenuBackgroundImg({
        menuId: VALID_UUID_1,
        backgroundImgUrl: "https://example.com/bg.png",
      });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: { backgroundImageUrl: "https://example.com/bg.png" },
      });
    });

    it("should clear background image and remove from storage when null", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.updateMenuBackgroundImg({
        menuId: VALID_UUID_1,
        backgroundImgUrl: null,
      });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: { backgroundImageUrl: null },
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateMenuBackgroundImg({
          menuId: "not-a-uuid",
          backgroundImgUrl: null,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateMenuLogoImg (CRUD)
  // =========================================================================

  describe("updateMenuLogoImg", () => {
    it("should update logo image URL", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.updateMenuLogoImg({
        menuId: VALID_UUID_1,
        logoImgUrl: "https://example.com/logo.png",
      });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: { logoImageUrl: "https://example.com/logo.png" },
      });
    });

    it("should clear logo image when null", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.updateMenuLogoImg({
        menuId: VALID_UUID_1,
        logoImgUrl: null,
      });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: { logoImageUrl: null },
      });
    });
  });

  // =========================================================================
  // getMenuBySlug (CRUD - private)
  // =========================================================================

  describe("getMenuBySlug", () => {
    it("should return full menu when user owns it", async () => {
      const owner = createUser();
      const slug = "riad-casablanca-casa-123456";
      const caller = createPrivateCaller(owner.id);
      const menuData = fullMenuResult(owner.id, slug);

      mockMenus.findFirst.mockResolvedValue(menuData as never);

      const result = await caller.getMenuBySlug({ slug });

      expect(result.slug).toBe(slug);
      expect(result.userId).toBe(owner.id);
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getMenuBySlug({ slug: "nonexistent-slug" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR)", async () => {
      const attacker = createUser();
      const realOwner = createUser();
      const caller = createPrivateCaller(attacker.id);
      const menuData = fullMenuResult(realOwner.id, "some-slug-123");

      mockMenus.findFirst.mockResolvedValue(menuData as never);

      await expect(
        caller.getMenuBySlug({ slug: "some-slug-123" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    });

    it("should reject slug exceeding 200 characters", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMenuBySlug({ slug: "a".repeat(201) }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // deleteMenu (CRUD)
  // =========================================================================

  describe("deleteMenu", () => {
    it("should delete menu belonging to the user", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);
      const menu = createMenu({ userId: owner.id });

      mockMenus.delete.mockResolvedValue(menu as never);

      const result = await caller.deleteMenu({ menuId: menu.id });

      expect(result).toEqual(menu);
      expect(mockMenus.delete).toHaveBeenCalledWith({
        where: { id: menu.id, userId: owner.id },
      });
    });

    it("should enforce userId in the where clause (IDOR)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      mockMenus.delete.mockResolvedValue({} as never);

      await caller.deleteMenu({ menuId: VALID_UUID_1 });

      expect(mockMenus.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: attacker.id },
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.deleteMenu({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getPublicMenuBySlug (Publishing - public)
  // =========================================================================

  describe("getPublicMenuBySlug", () => {
    it("should return menu data for a valid slug (no auth required)", async () => {
      const caller = createPublicCaller();
      const slug = "riad-casablanca-casa-123456";
      const menuData = fullMenuResult("some-user-id", slug);

      mockMenus.findFirst.mockResolvedValue(menuData as never);

      const result = await caller.getPublicMenuBySlug({ slug });

      expect(result.slug).toBe(slug);
    });

    it("should throw NOT_FOUND when slug does not exist", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getPublicMenuBySlug({ slug: "nonexistent" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should reject slug exceeding 200 characters", async () => {
      const caller = createPublicCaller();

      await expect(
        caller.getPublicMenuBySlug({ slug: "a".repeat(201) }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // publishMenu (Publishing)
  // =========================================================================

  describe("publishMenu", () => {
    it("should publish menu when user has active subscription", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockSubscriptions.findFirst.mockResolvedValue({ status: "active" } as never);
      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id, isPublished: true }) as never);

      const result = await caller.publishMenu({ menuId: VALID_UUID_1 });

      expect(result.isPublished).toBe(true);
      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: { isPublished: true },
      });
    });

    it("should publish menu when subscription is on_trial", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockSubscriptions.findFirst.mockResolvedValue({ status: "on_trial" } as never);
      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id, isPublished: true }) as never);

      await expect(
        caller.publishMenu({ menuId: VALID_UUID_1 }),
      ).resolves.toBeDefined();
    });

    it("should publish menu when subscription is cancelled (still active)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockSubscriptions.findFirst.mockResolvedValue({ status: "cancelled" } as never);
      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id, isPublished: true }) as never);

      await expect(
        caller.publishMenu({ menuId: VALID_UUID_1 }),
      ).resolves.toBeDefined();
    });

    it("should publish menu when subscription is past_due (still active)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockSubscriptions.findFirst.mockResolvedValue({ status: "past_due" } as never);
      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id, isPublished: true }) as never);

      await expect(
        caller.publishMenu({ menuId: VALID_UUID_1 }),
      ).resolves.toBeDefined();
    });

    it("should throw NOT_FOUND when user has no subscription", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockSubscriptions.findFirst.mockResolvedValue(null);

      await expect(
        caller.publishMenu({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "You need to subscribe to publish your menu",
      });
    });

    it("should throw NOT_FOUND when subscription status is expired", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockSubscriptions.findFirst.mockResolvedValue({ status: "expired" } as never);

      await expect(
        caller.publishMenu({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.publishMenu({ menuId: "bad-id" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // unpublishMenu (Publishing)
  // =========================================================================

  describe("unpublishMenu", () => {
    it("should unpublish menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(
        createMenu({ userId: owner.id, isPublished: false }) as never,
      );

      const result = await caller.unpublishMenu({ menuId: VALID_UUID_1 });

      expect(result.isPublished).toBe(false);
      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: { isPublished: false },
      });
    });

    it("should enforce userId in the where clause (IDOR)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.update.mockResolvedValue(createMenu({ userId: owner.id }) as never);

      await caller.unpublishMenu({ menuId: VALID_UUID_1 });

      expect(mockMenus.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        data: { isPublished: false },
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.unpublishMenu({ menuId: "invalid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // duplicateMenu (Management)
  // =========================================================================

  describe("duplicateMenu", () => {
    it("should duplicate a menu with all related data", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      const originalMenu = {
        id: VALID_UUID_1,
        name: "Riad Casablanca",
        slug: "riad-casablanca-casa-123456",
        city: "Casablanca",
        address: "12 Rue Mohammed V",
        currency: "MAD",
        contactNumber: "+212612345678",
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        backgroundImageUrl: null,
        logoImageUrl: null,
        restaurantId: null,
        locationId: null,
        categories: [],
        menuLanguages: [],
      };

      const newMenu = {
        id: VALID_UUID_2,
        name: "Riad Casablanca (Copy)",
        slug: "riad-casablanca-copy-casa-789012",
        isPublished: false,
      };

      mockMenus.findFirst.mockResolvedValue(originalMenu as never);
      mockMenus.create.mockResolvedValue(newMenu as never);

      const result = await caller.duplicateMenu({ menuId: VALID_UUID_1 });

      expect(result.name).toBe("Riad Casablanca (Copy)");
      expect(result.isPublished).toBe(false);
      expect(mockMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Riad Casablanca (Copy)",
            isPublished: false,
            userId: owner.id,
          }),
        }),
      );
    });

    it("should clone menu languages", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      const originalMenu = {
        id: VALID_UUID_1,
        name: "Test Menu",
        city: "Rabat",
        address: "1 Avenue",
        currency: "MAD",
        contactNumber: null,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        backgroundImageUrl: null,
        logoImageUrl: null,
        restaurantId: null,
        locationId: null,
        categories: [],
        menuLanguages: [
          { menuId: VALID_UUID_1, languageId: "lang-1", isDefault: true },
          { menuId: VALID_UUID_1, languageId: "lang-2", isDefault: false },
        ],
      };

      const newMenu = { id: VALID_UUID_2, name: "Test Menu (Copy)" };

      mockMenus.findFirst.mockResolvedValue(originalMenu as never);
      mockMenus.create.mockResolvedValue(newMenu as never);
      mockMenuLanguages.createMany.mockResolvedValue({ count: 2 } as never);

      await caller.duplicateMenu({ menuId: VALID_UUID_1 });

      expect(mockMenuLanguages.createMany).toHaveBeenCalledWith({
        data: [
          { menuId: VALID_UUID_2, languageId: "lang-1", isDefault: true },
          { menuId: VALID_UUID_2, languageId: "lang-2", isDefault: false },
        ],
      });
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.duplicateMenu({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should throw NOT_FOUND when user does not own the menu (IDOR)", async () => {
      const attacker = createUser();
      const caller = createPrivateCaller(attacker.id);

      // findFirst with userId check returns null for non-owner
      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.duplicateMenu({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.duplicateMenu({ menuId: "invalid" }),
      ).rejects.toThrow();
    });

    it("should clone deeply nested categories with dishes, translations, variants, and tags", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      const mockDishesTag = vi.mocked(db.dishesTag);
      const mockDishesTranslation = vi.mocked(db.dishesTranslation);
      const mockCategoriesTranslation = vi.mocked(db.categoriesTranslation);
      const mockVariantTranslations = vi.mocked(db.variantTranslations);

      const originalMenu = {
        id: VALID_UUID_1,
        name: "Full Moroccan Bistro",
        slug: "full-moroccan-bistro-casa-123",
        city: "Casablanca",
        address: "12 Rue Mohammed V",
        currency: "MAD",
        contactNumber: "+212612345678",
        facebookUrl: "https://facebook.com/bistro",
        instagramUrl: "https://instagram.com/bistro",
        googleReviewUrl: "https://g.page/bistro",
        backgroundImageUrl: "https://example.com/bg.jpg",
        logoImageUrl: "https://example.com/logo.png",
        restaurantId: VALID_UUID_3,
        locationId: null,
        menuLanguages: [
          { menuId: VALID_UUID_1, languageId: "lang-fr", isDefault: true },
          { menuId: VALID_UUID_1, languageId: "lang-ar", isDefault: false },
        ],
        categories: [
          {
            sortOrder: 0,
            icon: "utensils",
            description: "Starters",
            categoriesTranslation: [
              { languageId: "lang-fr", name: "Entrees" },
              { languageId: "lang-ar", name: "مقبلات" },
            ],
            dishes: [
              {
                price: 3500,
                pictureUrl: "https://example.com/zaalouk.jpg",
                carbohydrates: 30,
                fats: 8,
                protein: 5,
                calories: 200,
                weight: 250,
                isFeatured: true,
                sortOrder: 0,
                prepTimeMinutes: 15,
                dishesTranslation: [
                  { languageId: "lang-fr", name: "Zaalouk", description: "Salade d'aubergines" },
                  { languageId: "lang-ar", name: "زعلوك", description: "سلطة باذنجان" },
                ],
                dishVariants: [
                  {
                    price: 5000,
                    variantTranslations: [
                      { languageId: "lang-fr", name: "Grande portion", description: "Double" },
                    ],
                  },
                  {
                    price: 2500,
                    variantTranslations: [
                      { languageId: "lang-fr", name: "Petite portion", description: null },
                    ],
                  },
                ],
                dishesTag: [
                  { tagName: "vegetarian" },
                  { tagName: "gluten-free" },
                ],
              },
            ],
          },
          {
            sortOrder: 1,
            icon: "flame",
            description: "Main courses",
            categoriesTranslation: [
              { languageId: "lang-fr", name: "Plats principaux" },
            ],
            dishes: [
              {
                price: 7500,
                pictureUrl: null,
                carbohydrates: 60,
                fats: 20,
                protein: 35,
                calories: 550,
                weight: 400,
                isFeatured: false,
                sortOrder: 0,
                prepTimeMinutes: 45,
                dishesTranslation: [
                  { languageId: "lang-fr", name: "Tagine d'agneau", description: "Avec citrons confits" },
                ],
                dishVariants: [],
                dishesTag: [{ tagName: "signature" }],
              },
            ],
          },
        ],
      };

      const newMenuId = VALID_UUID_2;
      const newCatId1 = "00000000-0000-4000-a000-000000000010";
      const newCatId2 = "00000000-0000-4000-a000-000000000011";
      const newDishId1 = "00000000-0000-4000-a000-000000000020";
      const newDishId2 = "00000000-0000-4000-a000-000000000021";
      const newVariantId1 = "00000000-0000-4000-a000-000000000030";
      const newVariantId2 = "00000000-0000-4000-a000-000000000031";

      mockMenus.findFirst.mockResolvedValue(originalMenu as never);
      mockMenus.create.mockResolvedValue({ id: newMenuId, name: "Full Moroccan Bistro (Copy)" } as never);
      mockMenuLanguages.createMany.mockResolvedValue({ count: 2 } as never);

      // First category create, then second
      mockCategories.create
        .mockResolvedValueOnce({ id: newCatId1 } as never)
        .mockResolvedValueOnce({ id: newCatId2 } as never);

      mockCategoriesTranslation.createMany.mockResolvedValue({ count: 2 } as never);

      // First dish create (in cat1), then second (in cat2)
      mockDishes.create
        .mockResolvedValueOnce({ id: newDishId1 } as never)
        .mockResolvedValueOnce({ id: newDishId2 } as never);

      mockDishesTranslation.createMany.mockResolvedValue({ count: 2 } as never);

      // Two variants for dish 1
      mockDishVariants.create
        .mockResolvedValueOnce({ id: newVariantId1 } as never)
        .mockResolvedValueOnce({ id: newVariantId2 } as never);

      mockVariantTranslations.createMany.mockResolvedValue({ count: 1 } as never);

      // Tags
      mockDishesTag.create.mockResolvedValue({} as never);

      const result = await caller.duplicateMenu({ menuId: VALID_UUID_1 });

      expect(result.name).toBe("Full Moroccan Bistro (Copy)");

      // Menu created with correct fields
      expect(mockMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Full Moroccan Bistro (Copy)",
            isPublished: false,
            userId: owner.id,
            city: "Casablanca",
            currency: "MAD",
            facebookUrl: "https://facebook.com/bistro",
            instagramUrl: "https://instagram.com/bistro",
            restaurantId: VALID_UUID_3,
          }),
        }),
      );

      // Languages cloned
      expect(mockMenuLanguages.createMany).toHaveBeenCalledWith({
        data: [
          { menuId: newMenuId, languageId: "lang-fr", isDefault: true },
          { menuId: newMenuId, languageId: "lang-ar", isDefault: false },
        ],
      });

      // 2 categories created
      expect(mockCategories.create).toHaveBeenCalledTimes(2);
      expect(mockCategories.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            menuId: newMenuId,
            sortOrder: 0,
            icon: "utensils",
          }),
        }),
      );

      // Category translations cloned
      expect(mockCategoriesTranslation.createMany).toHaveBeenCalledWith({
        data: [
          { categoryId: newCatId1, languageId: "lang-fr", name: "Entrees" },
          { categoryId: newCatId1, languageId: "lang-ar", name: "مقبلات" },
        ],
      });

      // 2 dishes created
      expect(mockDishes.create).toHaveBeenCalledTimes(2);

      // First dish should NOT be sold out (always reset to false)
      expect(mockDishes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            menuId: newMenuId,
            categoryId: newCatId1,
            price: 3500,
            isSoldOut: false,
            isFeatured: true,
          }),
        }),
      );

      // Dish translations cloned
      expect(mockDishesTranslation.createMany).toHaveBeenCalled();

      // 2 variants for first dish
      expect(mockDishVariants.create).toHaveBeenCalledTimes(2);
      expect(mockDishVariants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dishId: newDishId1,
            price: 5000,
          }),
        }),
      );

      // Variant translations cloned
      expect(mockVariantTranslations.createMany).toHaveBeenCalled();

      // Tags cloned (2 tags for dish1 + 1 tag for dish2 = 3 calls)
      expect(mockDishesTag.create).toHaveBeenCalledTimes(3);
      expect(mockDishesTag.create).toHaveBeenCalledWith({
        data: { dishId: newDishId1, tagName: "vegetarian" },
      });
      expect(mockDishesTag.create).toHaveBeenCalledWith({
        data: { dishId: newDishId1, tagName: "gluten-free" },
      });
      expect(mockDishesTag.create).toHaveBeenCalledWith({
        data: { dishId: newDishId2, tagName: "signature" },
      });
    });

    it("should skip menuLanguages.createMany when original has no languages", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID_1,
        name: "No Lang Menu",
        city: "Fes",
        address: "1 Rue",
        currency: "MAD",
        contactNumber: null,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        backgroundImageUrl: null,
        logoImageUrl: null,
        restaurantId: null,
        locationId: null,
        categories: [],
        menuLanguages: [],
      } as never);

      mockMenus.create.mockResolvedValue({ id: VALID_UUID_2, name: "No Lang Menu (Copy)" } as never);

      await caller.duplicateMenu({ menuId: VALID_UUID_1 });

      expect(mockMenuLanguages.createMany).not.toHaveBeenCalled();
    });

    it("should wrap duplicate in a transaction", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID_1,
        name: "Tx Menu",
        city: "Rabat",
        address: "1 Ave",
        currency: "MAD",
        contactNumber: null,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        backgroundImageUrl: null,
        logoImageUrl: null,
        restaurantId: null,
        locationId: null,
        categories: [],
        menuLanguages: [],
      } as never);

      mockMenus.create.mockResolvedValue({ id: VALID_UUID_2, name: "Tx Menu (Copy)" } as never);

      await caller.duplicateMenu({ menuId: VALID_UUID_1 });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // getMenuStats (Management)
  // =========================================================================

  describe("getMenuStats", () => {
    it("should return menu statistics", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID_1,
        name: "Test Menu",
        slug: "test-menu-123",
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: "MAD",
        _count: { categories: 5, dishes: 20, menuLanguages: 2, orders: 100, reviews: 15 },
      } as never);

      mockDishes.aggregate.mockResolvedValue({
        _avg: { price: 3500 },
        _min: { price: 1000 },
        _max: { price: 8000 },
      } as never);

      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: 4.2 },
        _count: { rating: 12 },
      } as never);

      const result = await caller.getMenuStats({ menuId: VALID_UUID_1 });

      expect(result._count.dishes).toBe(20);
      expect(result._count.categories).toBe(5);
      expect(result.pricing.average).toBe(3500);
      expect(result.pricing.min).toBe(1000);
      expect(result.pricing.max).toBe(8000);
      expect(result.reviews.averageRating).toBe(4.2);
      expect(result.reviews.count).toBe(12);
    });

    it("should handle menu with no dishes (null aggregates)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID_1,
        name: "Empty Menu",
        slug: "empty-123",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: "MAD",
        _count: { categories: 0, dishes: 0, menuLanguages: 1, orders: 0, reviews: 0 },
      } as never);

      mockDishes.aggregate.mockResolvedValue({
        _avg: { price: null },
        _min: { price: null },
        _max: { price: null },
      } as never);

      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as never);

      const result = await caller.getMenuStats({ menuId: VALID_UUID_1 });

      expect(result.pricing.average).toBe(0);
      expect(result.pricing.min).toBe(0);
      expect(result.pricing.max).toBe(0);
      expect(result.reviews.averageRating).toBe(0);
      expect(result.reviews.count).toBe(0);
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getMenuStats({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getMenuStats({ menuId: "bad" }),
      ).rejects.toThrow();
    });

    it("should enforce userId in findFirst query (IDOR)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID_1,
        name: "Menu",
        slug: "menu-123",
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: "MAD",
        _count: { categories: 0, dishes: 0, menuLanguages: 0, orders: 0, reviews: 0 },
      } as never);

      mockDishes.aggregate.mockResolvedValue({
        _avg: { price: null },
        _min: { price: null },
        _max: { price: null },
      } as never);

      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as never);

      await caller.getMenuStats({ menuId: VALID_UUID_1 });

      expect(mockMenus.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        select: expect.objectContaining({
          id: true,
          name: true,
          slug: true,
          isPublished: true,
        }),
      });
    });

    it("should return all expected top-level fields", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);
      const now = new Date();

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID_1,
        name: "Riad Casablanca",
        slug: "riad-casa-123",
        isPublished: true,
        createdAt: now,
        updatedAt: now,
        currency: "USD",
        _count: { categories: 3, dishes: 12, menuLanguages: 2, orders: 50, reviews: 8 },
      } as never);

      mockDishes.aggregate.mockResolvedValue({
        _avg: { price: 2500 },
        _min: { price: 500 },
        _max: { price: 9900 },
      } as never);

      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: 3.8 },
        _count: { rating: 6 },
      } as never);

      const result = await caller.getMenuStats({ menuId: VALID_UUID_1 });

      expect(result.id).toBe(VALID_UUID_1);
      expect(result.name).toBe("Riad Casablanca");
      expect(result.slug).toBe("riad-casa-123");
      expect(result.isPublished).toBe(true);
      expect(result.currency).toBe("USD");
      expect(result._count.menuLanguages).toBe(2);
      expect(result._count.orders).toBe(50);
      expect(result._count.reviews).toBe(8);
    });

    it("should aggregate dish prices for the correct menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Menu",
        slug: "m-123",
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: "MAD",
        _count: { categories: 1, dishes: 5, menuLanguages: 1, orders: 0, reviews: 0 },
      } as never);

      mockDishes.aggregate.mockResolvedValue({
        _avg: { price: 2000 },
        _min: { price: 1000 },
        _max: { price: 3000 },
      } as never);

      mockReviews.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      } as never);

      await caller.getMenuStats({ menuId: VALID_UUID_2 });

      expect(mockDishes.aggregate).toHaveBeenCalledWith({
        where: { menuId: VALID_UUID_2 },
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
      });

      expect(mockReviews.aggregate).toHaveBeenCalledWith({
        where: { menuId: VALID_UUID_2, status: "approved" },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });
  });

  // =========================================================================
  // Categories
  // =========================================================================

  describe("getDishesByCategory", () => {
    it("should return categories with dishes for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCategories.findMany.mockResolvedValue([
        {
          id: VALID_UUID_1,
          dishes: [
            { id: VALID_UUID_2, dishesTranslation: [], price: 3500, categories: {}, pictureUrl: null },
          ],
        },
      ] as never);

      const result = await caller.getDishesByCategory({ slug: "test-menu" });

      expect(result).toHaveLength(1);
      expect(result[0]!.dishes).toHaveLength(1);
    });

    it("should filter by userId (IDOR)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCategories.findMany.mockResolvedValue([]);

      await caller.getDishesByCategory({ slug: "test-menu" });

      expect(mockCategories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            menus: {
              slug: "test-menu",
              userId: owner.id,
            },
          },
        }),
      );
    });
  });

  describe("upsertCategory", () => {
    it("should create a new category", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCategories.upsert.mockResolvedValue({ id: VALID_UUID_1, menuId: VALID_UUID_2 } as never);

      await caller.upsertCategory({
        menuId: VALID_UUID_2,
        translatedCategoriesData: [
          { languageId: "lang-1", name: "Appetizers" },
        ],
      });

      expect(mockCategories.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "00000000-0000-0000-0000-000000000000",
            menus: { userId: owner.id },
          }),
          create: expect.objectContaining({
            menuId: VALID_UUID_2,
          }),
        }),
      );
    });

    it("should update an existing category when id is provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCategories.upsert.mockResolvedValue({ id: VALID_UUID_1 } as never);

      await caller.upsertCategory({
        id: VALID_UUID_1,
        menuId: VALID_UUID_2,
        translatedCategoriesData: [
          { languageId: "lang-1", name: "Updated Name" },
        ],
      });

      expect(mockCategories.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: VALID_UUID_1,
          }),
        }),
      );
    });
  });

  describe("getCategoriesBySlug", () => {
    it("should return categories for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCategories.findMany.mockResolvedValue([
        { id: VALID_UUID_1, categoriesTranslation: [{ name: "Appetizers", languageId: "lang-1" }] },
      ] as never);

      const result = await caller.getCategoriesBySlug({ menuSlug: "test-menu" });

      expect(result).toHaveLength(1);
      expect(mockCategories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { menus: { slug: "test-menu", userId: owner.id } },
        }),
      );
    });
  });

  describe("deleteCategory", () => {
    it("should delete a category with IDOR protection", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockCategories.delete.mockResolvedValue({ id: VALID_UUID_1 } as never);

      await caller.deleteCategory({ categoryId: VALID_UUID_1 });

      expect(mockCategories.delete).toHaveBeenCalledWith({
        where: {
          id: VALID_UUID_1,
          menus: { userId: owner.id },
        },
      });
    });

    it("should reject non-UUID categoryId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.deleteCategory({ categoryId: "bad" }),
      ).rejects.toThrow();
    });
  });

  describe("reorderCategories", () => {
    it("should reorder categories via transaction", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockTransaction.mockResolvedValueOnce(undefined as never);

      const result = await caller.reorderCategories({
        menuId: VALID_UUID_1,
        categories: [
          { id: VALID_UUID_2, sortOrder: 0 },
          { id: VALID_UUID_3, sortOrder: 1 },
        ],
      });

      expect(result).toEqual({ success: true });
      expect(mockMenus.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        select: { id: true },
      });
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.reorderCategories({
          menuId: VALID_UUID_1,
          categories: [{ id: VALID_UUID_2, sortOrder: 0 }],
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject negative sortOrder", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.reorderCategories({
          menuId: VALID_UUID_1,
          categories: [{ id: VALID_UUID_2, sortOrder: -1 }],
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // Dishes
  // =========================================================================

  describe("upsertDish", () => {
    it("should create a new dish", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.upsert.mockResolvedValue({ id: VALID_UUID_1, price: 3500 } as never);

      await caller.upsertDish({
        menuId: VALID_UUID_1,
        translatedDishData: [
          { languageId: "lang-1", name: "Lamb Tagine", description: "Slow-cooked lamb" },
        ],
        price: 35,
        tags: [],
      });

      expect(mockDishes.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menus: { userId: owner.id, id: VALID_UUID_1 },
          }),
          create: expect.objectContaining({
            price: 3500, // 35 * 100
            menuId: VALID_UUID_1,
          }),
        }),
      );
    });

    it("should multiply price by 100 for storage", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.upsert.mockResolvedValue({ id: VALID_UUID_1, price: 1999 } as never);

      await caller.upsertDish({
        menuId: VALID_UUID_1,
        translatedDishData: [{ languageId: "l1", name: "Test" }],
        price: 19.99,
        tags: [],
      });

      const call = mockDishes.upsert.mock.calls[0]![0] as { create: { price: number }; update: { price: number } };

      expect(call.create.price).toBeCloseTo(1999);
      expect(call.update.price).toBeCloseTo(1999);
    });

    it("should reject negative price", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertDish({
          menuId: VALID_UUID_1,
          translatedDishData: [{ languageId: "l1", name: "Test" }],
          price: -5,
          tags: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("updateDishImageUrl", () => {
    it("should update dish image URL", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1 } as never);

      await caller.updateDishImageUrl({
        dishId: VALID_UUID_1,
        imageUrl: "https://example.com/dish.png",
      });

      expect(mockDishes.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, menus: { userId: owner.id } },
        data: { pictureUrl: "https://example.com/dish.png" },
      });
    });

    it("should clear dish image when null", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1 } as never);

      await caller.updateDishImageUrl({
        dishId: VALID_UUID_1,
        imageUrl: null,
      });

      expect(mockDishes.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, menus: { userId: owner.id } },
        data: { pictureUrl: null },
      });
    });
  });

  describe("deleteDish", () => {
    it("should delete dish with IDOR protection", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.delete.mockResolvedValue({ id: VALID_UUID_1 } as never);

      await caller.deleteDish({ dishId: VALID_UUID_1 });

      expect(mockDishes.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, menus: { userId: owner.id } },
      });
    });

    it("should reject non-UUID dishId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.deleteDish({ dishId: "bad" }),
      ).rejects.toThrow();
    });
  });

  describe("deleteVariant", () => {
    it("should delete variant with IDOR protection", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishVariants.delete.mockResolvedValue({ id: VALID_UUID_1 } as never);

      await caller.deleteVariant({ variantId: VALID_UUID_1 });

      expect(mockDishVariants.delete).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, dishes: { menus: { userId: owner.id } } },
      });
    });
  });

  describe("reorderDishes", () => {
    it("should reorder dishes via transaction", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.update.mockResolvedValue({} as never);

      const result = await caller.reorderDishes({
        menuId: VALID_UUID_1,
        dishes: [
          { id: VALID_UUID_2, sortOrder: 0 },
          { id: VALID_UUID_3, sortOrder: 1 },
        ],
      });

      expect(result).toEqual({ success: true });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.reorderDishes({
          menuId: VALID_UUID_1,
          dishes: [{ id: VALID_UUID_2, sortOrder: 0 }],
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("bulkToggleSoldOut", () => {
    it("should mark multiple dishes as sold out", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.updateMany.mockResolvedValue({ count: 2 } as never);

      const result = await caller.bulkToggleSoldOut({
        menuId: VALID_UUID_1,
        dishIds: [VALID_UUID_2, VALID_UUID_3],
        isSoldOut: true,
      });

      expect(result).toEqual({ success: true, updated: 2 });
      expect(mockDishes.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [VALID_UUID_2, VALID_UUID_3] },
          menuId: VALID_UUID_1,
        },
        data: { isSoldOut: true },
      });
    });

    it("should mark dishes as available (not sold out)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.updateMany.mockResolvedValue({ count: 1 } as never);

      const result = await caller.bulkToggleSoldOut({
        menuId: VALID_UUID_1,
        dishIds: [VALID_UUID_2],
        isSoldOut: false,
      });

      expect(result).toEqual({ success: true, updated: 1 });
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.bulkToggleSoldOut({
          menuId: VALID_UUID_1,
          dishIds: [VALID_UUID_2],
          isSoldOut: true,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // Export
  // =========================================================================

  describe("exportMenu", () => {
    it("should return export structure for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        name: "Test",
        city: "Casablanca",
        address: "1 Rue",
        currency: "MAD",
        contactNumber: null,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        categories: [],
        menuLanguages: [],
        menuThemes: null,
      } as never);

      const result = await caller.exportMenu({ menuId: VALID_UUID_1 });

      expect(result.exportVersion).toBe("1.0");
      expect(result.exportedAt).toBeDefined();
      expect(result.menu.name).toBe("Test");
      expect(result.categories).toEqual([]);
      expect(result.languages).toEqual([]);
      expect(result.theme).toBeNull();
    });

    it("should throw NOT_FOUND for non-owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.exportMenu({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.exportMenu({ menuId: "not-uuid" }),
      ).rejects.toThrow();
    });

    it("should export full menu with categories, dishes, translations, variants, allergens, and languages", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        name: "Riad Casablanca",
        city: "Casablanca",
        address: "12 Rue Mohammed V",
        currency: "MAD",
        contactNumber: "+212612345678",
        facebookUrl: "https://facebook.com/riad",
        instagramUrl: "https://instagram.com/riad",
        googleReviewUrl: "https://g.page/riad",
        menuLanguages: [
          { languages: { name: "French", isoCode: "fr" }, isDefault: true },
          { languages: { name: "Arabic", isoCode: "ar" }, isDefault: false },
        ],
        menuThemes: {
          primaryColor: "#D4A574",
          secondaryColor: "#8B6914",
          backgroundColor: "#FFFBF5",
          surfaceColor: "#FFFFFF",
          textColor: "#1A1A1A",
          accentColor: "#C75B39",
          headingFont: "Playfair Display",
          bodyFont: "Source Sans 3",
          fontSize: "medium",
          layoutStyle: "classic",
          cardStyle: "flat",
          borderRadius: "medium",
          spacing: "comfortable",
        },
        categories: [
          {
            sortOrder: 0,
            icon: "utensils",
            description: "Starters",
            categoriesTranslation: [
              { languageId: "lang-fr", name: "Entrees" },
            ],
            dishes: [
              {
                price: 3500,
                carbohydrates: 30,
                fats: 8,
                protein: 5,
                calories: 200,
                weight: 250,
                isFeatured: true,
                prepTimeMinutes: 15,
                dishesTag: [{ tagName: "vegetarian" }],
                dishAllergens: [
                  { allergen: { name: "Sesame", type: "food" }, severity: "mild" },
                ],
                dishesTranslation: [
                  { languageId: "lang-fr", name: "Zaalouk", description: "Salade d'aubergines" },
                ],
                dishVariants: [
                  {
                    price: 5000,
                    variantTranslations: [
                      { languageId: "lang-fr", name: "Grande", description: "Double portion" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as never);

      const result = await caller.exportMenu({ menuId: VALID_UUID_1 });

      // Languages
      expect(result.languages).toHaveLength(2);
      expect(result.languages[0]).toEqual({ name: "French", isoCode: "fr", isDefault: true });
      expect(result.languages[1]).toEqual({ name: "Arabic", isoCode: "ar", isDefault: false });

      // Theme
      expect(result.theme).not.toBeNull();
      expect(result.theme!.primaryColor).toBe("#D4A574");
      expect(result.theme!.layoutStyle).toBe("classic");

      // Categories
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0]!.sortOrder).toBe(0);
      expect(result.categories[0]!.icon).toBe("utensils");
      expect(result.categories[0]!.translations[0]!.name).toBe("Entrees");

      // Dishes
      const dish = result.categories[0]!.dishes[0]!;

      expect(dish.price).toBe(3500);
      expect(dish.isFeatured).toBe(true);
      expect(dish.tags).toEqual(["vegetarian"]);
      expect(dish.allergens).toEqual([{ name: "Sesame", type: "food", severity: "mild" }]);
      expect(dish.translations[0]!.name).toBe("Zaalouk");

      // Variants
      expect(dish.variants).toHaveLength(1);
      expect(dish.variants[0]!.price).toBe(5000);
      expect(dish.variants[0]!.translations[0]!.name).toBe("Grande");
    });

    it("should enforce userId in findFirst query (IDOR)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        name: "X",
        city: "Y",
        address: "Z",
        currency: "MAD",
        contactNumber: null,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        categories: [],
        menuLanguages: [],
        menuThemes: null,
      } as never);

      await caller.exportMenu({ menuId: VALID_UUID_1 });

      expect(mockMenus.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_UUID_1, userId: owner.id },
        }),
      );
    });

    it("should produce ISO date string in exportedAt", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        name: "Test",
        city: "Rabat",
        address: "1 Rue",
        currency: "MAD",
        contactNumber: null,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        categories: [],
        menuLanguages: [],
        menuThemes: null,
      } as never);

      const result = await caller.exportMenu({ menuId: VALID_UUID_1 });

      // Should be a valid ISO 8601 date
      const parsed = new Date(result.exportedAt);

      expect(parsed.getTime()).not.toBeNaN();
    });
  });

  describe("exportMenuCSV", () => {
    it("should return CSV string with header", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        currency: "MAD",
        categories: [
          {
            categoriesTranslation: [{ name: "Appetizers" }],
            dishes: [
              {
                price: 3500,
                dishesTranslation: [{ name: "Zaalouk", description: "Eggplant dip" }],
                dishesTag: [{ tagName: "vegetarian" }],
                dishAllergens: [],
              },
            ],
          },
        ],
        dishes: [],
      } as never);

      const result = await caller.exportMenuCSV({ menuId: VALID_UUID_1 });

      expect(result).toContain("Category,Dish Name,Description,Price,Currency,Tags,Allergens");
      expect(result).toContain("Appetizers");
      expect(result).toContain("Zaalouk");
      expect(result).toContain("35.00");
      expect(result).toContain("MAD");
    });

    it("should throw NOT_FOUND for non-owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.exportMenuCSV({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.exportMenuCSV({ menuId: "bad-id" }),
      ).rejects.toThrow();
    });

    it("should include multiple categories and dishes in CSV output", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        currency: "USD",
        categories: [
          {
            categoriesTranslation: [{ name: "Appetizers" }],
            dishes: [
              {
                price: 1200,
                dishesTranslation: [{ name: "Hummus", description: "Chickpea dip" }],
                dishesTag: [],
                dishAllergens: [],
              },
              {
                price: 1500,
                dishesTranslation: [{ name: "Falafel", description: "Fried chickpea balls" }],
                dishesTag: [{ tagName: "vegetarian" }, { tagName: "vegan" }],
                dishAllergens: [],
              },
            ],
          },
          {
            categoriesTranslation: [{ name: "Main Courses" }],
            dishes: [
              {
                price: 7500,
                dishesTranslation: [{ name: "Lamb Tagine", description: "Slow-cooked lamb" }],
                dishesTag: [{ tagName: "signature" }],
                dishAllergens: [],
              },
            ],
          },
        ],
        dishes: [],
      } as never);

      const result = await caller.exportMenuCSV({ menuId: VALID_UUID_1 });
      const lines = result.split("\n");

      // Header + 3 dish rows
      expect(lines).toHaveLength(4);
      expect(lines[1]).toContain("Appetizers");
      expect(lines[1]).toContain("Hummus");
      expect(lines[1]).toContain("12.00");
      expect(lines[2]).toContain("Falafel");
      expect(lines[2]).toContain("vegetarian; vegan");
      expect(lines[3]).toContain("Main Courses");
      expect(lines[3]).toContain("Lamb Tagine");
      expect(lines[3]).toContain("75.00");
      expect(lines[3]).toContain("USD");
    });

    it("should label uncategorized dishes as 'Uncategorized'", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        currency: "MAD",
        categories: [],
        dishes: [
          {
            price: 2000,
            dishesTranslation: [{ name: "Loose Dish", description: "No category" }],
            dishesTag: [],
            dishAllergens: [],
          },
        ],
      } as never);

      const result = await caller.exportMenuCSV({ menuId: VALID_UUID_1 });
      const lines = result.split("\n");

      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain("Uncategorized");
      expect(lines[1]).toContain("Loose Dish");
      expect(lines[1]).toContain("20.00");
    });

    it("should escape CSV values containing commas and quotes", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        currency: "MAD",
        categories: [
          {
            categoriesTranslation: [{ name: "Grilled, Smoked & More" }],
            dishes: [
              {
                price: 4500,
                dishesTranslation: [
                  { name: 'Lamb "Special"', description: 'Contains "premium" lamb, slow-cooked' },
                ],
                dishesTag: [],
                dishAllergens: [],
              },
            ],
          },
        ],
        dishes: [],
      } as never);

      const result = await caller.exportMenuCSV({ menuId: VALID_UUID_1 });

      // Commas in category name should be quoted
      expect(result).toContain('"Grilled, Smoked & More"');
      // Quotes in dish name should be doubled and wrapped
      expect(result).toContain('"Lamb ""Special"""');
    });

    it("should include allergens with severity in CSV output", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        currency: "MAD",
        categories: [
          {
            categoriesTranslation: [{ name: "Starters" }],
            dishes: [
              {
                price: 3000,
                dishesTranslation: [{ name: "Nut Salad", description: "Mixed nuts" }],
                dishesTag: [],
                dishAllergens: [
                  { allergen: { name: "Peanuts", type: "food" }, severity: "severe" },
                  { allergen: { name: "Tree Nuts", type: "food" }, severity: "moderate" },
                ],
              },
            ],
          },
        ],
        dishes: [],
      } as never);

      const result = await caller.exportMenuCSV({ menuId: VALID_UUID_1 });

      expect(result).toContain("Peanuts (severe)");
      expect(result).toContain("Tree Nuts (moderate)");
    });

    it("should handle empty menu with no categories or dishes", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        currency: "MAD",
        categories: [],
        dishes: [],
      } as never);

      const result = await caller.exportMenuCSV({ menuId: VALID_UUID_1 });
      const lines = result.split("\n");

      // Only header row
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe("Category,Dish Name,Description,Price,Currency,Tags,Allergens");
    });

    it("should enforce userId in findFirst query (IDOR)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        currency: "MAD",
        categories: [],
        dishes: [],
      } as never);

      await caller.exportMenuCSV({ menuId: VALID_UUID_1 });

      expect(mockMenus.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_UUID_1, userId: owner.id },
        }),
      );
    });
  });

  describe("exportMenuJSON", () => {
    it("should return full JSON export structure", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        name: "Test",
        slug: "test-123",
        city: "Rabat",
        address: "2 Ave",
        currency: "MAD",
        contactNumber: null,
        isPublished: true,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        backgroundImageUrl: null,
        logoImageUrl: null,
        categories: [],
        menuLanguages: [],
        menuThemes: null,
      } as never);

      const result = await caller.exportMenuJSON({ menuId: VALID_UUID_1 });

      expect(result.exportVersion).toBe("1.0");
      expect(result.menu.slug).toBe("test-123");
      expect(result.menu.isPublished).toBe(true);
    });

    it("should throw NOT_FOUND for non-owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.exportMenuJSON({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.exportMenuJSON({ menuId: "bad" }),
      ).rejects.toThrow();
    });

    it("should include full dish details with sortOrder, isSoldOut, variants, allergens", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        name: "Detailed Menu",
        slug: "detailed-menu-123",
        city: "Marrakech",
        address: "1 Place Jemaa",
        currency: "MAD",
        contactNumber: "+212600000000",
        isPublished: false,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        backgroundImageUrl: "https://example.com/bg.png",
        logoImageUrl: "https://example.com/logo.png",
        menuLanguages: [
          { languages: { name: "English", isoCode: "en" }, isDefault: true },
        ],
        menuThemes: {
          primaryColor: "#000000",
          secondaryColor: "#111111",
          backgroundColor: "#FFFFFF",
          surfaceColor: "#FAFAFA",
          textColor: "#333333",
          accentColor: "#FF0000",
          headingFont: "Arial",
          bodyFont: "Helvetica",
          fontSize: "large",
          layoutStyle: "modern",
          cardStyle: "elevated",
          borderRadius: "large",
          spacing: "compact",
        },
        categories: [
          {
            sortOrder: 0,
            icon: null,
            description: null,
            categoriesTranslation: [
              { languageId: "lang-en", name: "Mains" },
            ],
            dishes: [
              {
                price: 9900,
                carbohydrates: 50,
                fats: 25,
                protein: 40,
                calories: 600,
                weight: 500,
                isSoldOut: true,
                isFeatured: false,
                sortOrder: 2,
                prepTimeMinutes: 30,
                dishesTag: [{ tagName: "spicy" }],
                dishAllergens: [
                  { allergen: { name: "Gluten", type: "food" }, severity: "moderate" },
                ],
                dishesTranslation: [
                  { languageId: "lang-en", name: "Couscous Royale", description: "Traditional dish" },
                ],
                dishVariants: [
                  {
                    price: 12000,
                    variantTranslations: [
                      { languageId: "lang-en", name: "Family Size", description: "Serves 4" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as never);

      const result = await caller.exportMenuJSON({ menuId: VALID_UUID_1 });

      // Menu fields
      expect(result.menu.name).toBe("Detailed Menu");
      expect(result.menu.isPublished).toBe(false);
      expect(result.menu.backgroundImageUrl).toBe("https://example.com/bg.png");
      expect(result.menu.logoImageUrl).toBe("https://example.com/logo.png");

      // Languages
      expect(result.languages).toHaveLength(1);
      expect(result.languages[0]).toEqual({ name: "English", isoCode: "en", isDefault: true });

      // Theme
      expect(result.theme).not.toBeNull();
      expect(result.theme!.layoutStyle).toBe("modern");
      expect(result.theme!.cardStyle).toBe("elevated");

      // Dish details specific to JSON export (not in basic export)
      const dish = result.categories[0]!.dishes[0]!;

      expect(dish.isSoldOut).toBe(true);
      expect(dish.sortOrder).toBe(2);
      expect(dish.tags).toEqual(["spicy"]);
      expect(dish.allergens).toEqual([{ name: "Gluten", type: "food", severity: "moderate" }]);
      expect(dish.variants).toHaveLength(1);
      expect(dish.variants[0]!.price).toBe(12000);
      expect(dish.variants[0]!.translations[0]!.name).toBe("Family Size");
    });

    it("should enforce userId in findFirst query (IDOR)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({
        name: "X",
        slug: "x",
        city: "Y",
        address: "Z",
        currency: "MAD",
        contactNumber: null,
        isPublished: false,
        facebookUrl: null,
        instagramUrl: null,
        googleReviewUrl: null,
        backgroundImageUrl: null,
        logoImageUrl: null,
        categories: [],
        menuLanguages: [],
        menuThemes: null,
      } as never);

      await caller.exportMenuJSON({ menuId: VALID_UUID_1 });

      expect(mockMenus.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VALID_UUID_1, userId: owner.id },
        }),
      );
    });
  });

  // =========================================================================
  // Schedules
  // =========================================================================

  describe("getSchedules", () => {
    it("should return schedules for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockMenuSchedules.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          menuId: VALID_UUID_1,
          categoryId: null,
          category: null,
          name: "Lunch",
          scheduleType: "lunch",
          startTime: new Date(1970, 0, 1, 12, 0),
          endTime: new Date(1970, 0, 1, 14, 0),
          days: ["monday", "tuesday"],
          isRecurring: true,
          startDate: null,
          endDate: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never);

      const result = await caller.getSchedules({ menuId: VALID_UUID_1 });

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Lunch");
      expect(result[0]!.startTime).toBe("12:00");
      expect(result[0]!.endTime).toBe("14:00");
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getSchedules({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("upsertSchedule", () => {
    it("should create a new schedule", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockMenuSchedules.create.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Dinner",
      } as never);

      const result = await caller.upsertSchedule({
        menuId: VALID_UUID_1,
        categoryId: null,
        name: "Dinner",
        scheduleType: "dinner",
        startTime: "18:00",
        endTime: "22:00",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        isRecurring: true,
        startDate: null,
        endDate: null,
      });

      expect(result.name).toBe("Dinner");
      expect(mockMenuSchedules.create).toHaveBeenCalled();
    });

    it("should update existing schedule when id provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockMenuSchedules.findFirst.mockResolvedValue({ id: VALID_UUID_2 } as never);
      mockMenuSchedules.update.mockResolvedValue({
        id: VALID_UUID_2,
        name: "Updated Dinner",
      } as never);

      const result = await caller.upsertSchedule({
        id: VALID_UUID_2,
        menuId: VALID_UUID_1,
        categoryId: null,
        name: "Updated Dinner",
        scheduleType: "dinner",
        startTime: "19:00",
        endTime: "23:00",
        days: ["friday", "saturday"],
        isRecurring: true,
        startDate: null,
        endDate: null,
      });

      expect(result.name).toBe("Updated Dinner");
      expect(mockMenuSchedules.update).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when schedule id does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockMenuSchedules.findFirst.mockResolvedValue(null);

      await expect(
        caller.upsertSchedule({
          id: VALID_UUID_2,
          menuId: VALID_UUID_1,
          categoryId: null,
          name: "Ghost Schedule",
          scheduleType: "lunch",
          startTime: "12:00",
          endTime: "14:00",
          days: ["monday"],
          isRecurring: true,
          startDate: null,
          endDate: null,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    });

    it("should throw BAD_REQUEST when category does not belong to menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockCategories.findFirst.mockResolvedValue(null);

      await expect(
        caller.upsertSchedule({
          menuId: VALID_UUID_1,
          categoryId: VALID_UUID_3,
          name: "Invalid Category Schedule",
          scheduleType: "lunch",
          startTime: "12:00",
          endTime: "14:00",
          days: ["monday"],
          isRecurring: true,
          startDate: null,
          endDate: null,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Category does not belong to this menu",
      });
    });

    it("should reject invalid time format", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertSchedule({
          menuId: VALID_UUID_1,
          categoryId: null,
          name: "Bad Time",
          scheduleType: "lunch",
          startTime: "noon",
          endTime: "14:00",
          days: ["monday"],
          isRecurring: true,
          startDate: null,
          endDate: null,
        }),
      ).rejects.toThrow();
    });

    it("should reject empty days array", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertSchedule({
          menuId: VALID_UUID_1,
          categoryId: null,
          name: "No Days",
          scheduleType: "lunch",
          startTime: "12:00",
          endTime: "14:00",
          days: [],
          isRecurring: true,
          startDate: null,
          endDate: null,
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid schedule type", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.upsertSchedule({
          menuId: VALID_UUID_1,
          categoryId: null,
          name: "Bad Type",
          scheduleType: "invalid_type" as never,
          startTime: "12:00",
          endTime: "14:00",
          days: ["monday"],
          isRecurring: true,
          startDate: null,
          endDate: null,
        }),
      ).rejects.toThrow();
    });
  });

  describe("deleteSchedule", () => {
    it("should delete a schedule with menu ownership check", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockMenuSchedules.findFirst.mockResolvedValue({ id: VALID_UUID_2 } as never);
      mockMenuSchedules.delete.mockResolvedValue({} as never);

      const result = await caller.deleteSchedule({
        scheduleId: VALID_UUID_2,
        menuId: VALID_UUID_1,
      });

      expect(result).toEqual({ success: true });
    });

    it("should throw NOT_FOUND when menu does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.deleteSchedule({
          scheduleId: VALID_UUID_2,
          menuId: VALID_UUID_1,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found",
      });
    });

    it("should throw NOT_FOUND when schedule does not exist", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockMenuSchedules.findFirst.mockResolvedValue(null);

      await expect(
        caller.deleteSchedule({
          scheduleId: VALID_UUID_2,
          menuId: VALID_UUID_1,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    });
  });

  describe("getActiveSchedules (public)", () => {
    it("should return hidden category IDs for unpublished schedules", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockMenuSchedules.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          categoryId: VALID_UUID_3,
          name: "Lunch",
          scheduleType: "lunch",
          startTime: new Date(1970, 0, 1, 12, 0),
          endTime: new Date(1970, 0, 1, 14, 0),
          days: [], // no days match = not active
          isRecurring: true,
          startDate: null,
          endDate: null,
          isActive: true,
        },
      ] as never);

      const result = await caller.getActiveSchedules({ slug: "test-menu" });

      expect(result.scheduledCategories).toHaveLength(1);
      expect(result.scheduledCategories[0]!.categoryId).toBe(VALID_UUID_3);
    });

    it("should return empty when menu not found (not published)", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null);

      const result = await caller.getActiveSchedules({ slug: "nonexistent" });

      expect(result.hiddenCategoryIds).toEqual([]);
      expect(result.scheduledCategories).toEqual([]);
    });
  });

  // =========================================================================
  // upsertDishVariant
  // =========================================================================

  describe("upsertDishVariant", () => {
    it("should create a new variant", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishVariants.upsert.mockResolvedValue({ id: VALID_UUID_1, price: 4500 } as never);

      await caller.upsertDishVariant({
        dishId: VALID_UUID_2,
        translatedVariant: [
          { languageId: "lang-1", name: "Large", description: "Extra portion" },
        ],
        price: 45,
      });

      expect(mockDishVariants.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dishes: { menus: { userId: owner.id } },
          }),
          create: expect.objectContaining({
            dishId: VALID_UUID_2,
            price: 4500, // 45 * 100
          }),
        }),
      );
    });

    it("should set price to null when not provided", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishVariants.upsert.mockResolvedValue({ id: VALID_UUID_1, price: null } as never);

      await caller.upsertDishVariant({
        dishId: VALID_UUID_2,
        translatedVariant: [
          { languageId: "lang-1", name: "Small" },
        ],
      });

      const call = mockDishVariants.upsert.mock.calls[0]![0] as { create: { price: number | null } };

      expect(call.create.price).toBeNull();
    });
  });

  // =========================================================================
  // Inventory
  // =========================================================================

  describe("getInventoryStatus", () => {
    it("should return dishes with isLowStock flag for owned menu", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          menuId: VALID_UUID_1,
          categoryId: null,
          price: 3500,
          isSoldOut: false,
          trackInventory: true,
          stockQuantity: 3,
          lowStockThreshold: 5,
          dishesTranslation: [{ name: "Zaalouk", languageId: "lang-1" }],
          categories: null,
        },
        {
          id: VALID_UUID_3,
          menuId: VALID_UUID_1,
          categoryId: null,
          price: 7500,
          isSoldOut: false,
          trackInventory: true,
          stockQuantity: 50,
          lowStockThreshold: 5,
          dishesTranslation: [{ name: "Tagine", languageId: "lang-1" }],
          categories: null,
        },
      ] as never);

      const result = await caller.getInventoryStatus({ menuId: VALID_UUID_1 });

      expect(result).toHaveLength(2);
      // First dish: stock (3) <= threshold (5) => low stock
      expect(result[0]!.isLowStock).toBe(true);
      // Second dish: stock (50) > threshold (5) => not low stock
      expect(result[1]!.isLowStock).toBe(false);
    });

    it("should mark isLowStock false when inventory tracking is disabled", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          menuId: VALID_UUID_1,
          categoryId: null,
          price: 3500,
          isSoldOut: false,
          trackInventory: false,
          stockQuantity: 1,
          lowStockThreshold: 10,
          dishesTranslation: [],
          categories: null,
        },
      ] as never);

      const result = await caller.getInventoryStatus({ menuId: VALID_UUID_1 });

      expect(result[0]!.isLowStock).toBe(false);
    });

    it("should mark isLowStock false when stockQuantity is 0 (sold out, not low)", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.findMany.mockResolvedValue([
        {
          id: VALID_UUID_2,
          menuId: VALID_UUID_1,
          categoryId: null,
          price: 3500,
          isSoldOut: true,
          trackInventory: true,
          stockQuantity: 0,
          lowStockThreshold: 5,
          dishesTranslation: [],
          categories: null,
        },
      ] as never);

      const result = await caller.getInventoryStatus({ menuId: VALID_UUID_1 });

      // 0 is not > 0, so isLowStock should be false (it's sold out, not low)
      expect(result[0]!.isLowStock).toBe(false);
    });

    it("should throw FORBIDDEN when menu does not belong to user", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getInventoryStatus({ menuId: VALID_UUID_1 }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.getInventoryStatus({ menuId: "bad" }),
      ).rejects.toThrow();
    });
  });

  describe("updateStockLevel", () => {
    it("should update stock quantity for owned dish", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue({ id: VALID_UUID_1, menuId: VALID_UUID_2 } as never);
      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1, stockQuantity: 25 } as never);

      const result = await caller.updateStockLevel({
        dishId: VALID_UUID_1,
        quantity: 25,
      });

      expect(result.stockQuantity).toBe(25);
      expect(mockDishes.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1 },
        data: { stockQuantity: 25, isSoldOut: false },
      });
    });

    it("should auto-mark dish as sold out when quantity is 0", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue({ id: VALID_UUID_1, menuId: VALID_UUID_2 } as never);
      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1, stockQuantity: 0, isSoldOut: true } as never);

      await caller.updateStockLevel({
        dishId: VALID_UUID_1,
        quantity: 0,
      });

      expect(mockDishes.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1 },
        data: { stockQuantity: 0, isSoldOut: true },
      });
    });

    it("should set unlimited stock when quantity is null", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue({ id: VALID_UUID_1, menuId: VALID_UUID_2 } as never);
      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1, stockQuantity: null } as never);

      await caller.updateStockLevel({
        dishId: VALID_UUID_1,
        quantity: null,
      });

      expect(mockDishes.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1 },
        data: { stockQuantity: null },
      });
    });

    it("should throw FORBIDDEN when dish does not belong to user", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue(null);

      await expect(
        caller.updateStockLevel({ dishId: VALID_UUID_1, quantity: 10 }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject negative quantity", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateStockLevel({ dishId: VALID_UUID_1, quantity: -5 }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID dishId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.updateStockLevel({ dishId: "bad", quantity: 10 }),
      ).rejects.toThrow();
    });
  });

  describe("toggleTrackInventory", () => {
    it("should enable inventory tracking for owned dish", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1, trackInventory: true } as never);

      const result = await caller.toggleTrackInventory({
        dishId: VALID_UUID_1,
        enabled: true,
      });

      expect(result.trackInventory).toBe(true);
      expect(mockDishes.update).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1 },
        data: { trackInventory: true },
      });
    });

    it("should disable inventory tracking", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1, trackInventory: false } as never);

      const result = await caller.toggleTrackInventory({
        dishId: VALID_UUID_1,
        enabled: false,
      });

      expect(result.trackInventory).toBe(false);
    });

    it("should throw FORBIDDEN when dish does not belong to user", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue(null);

      await expect(
        caller.toggleTrackInventory({ dishId: VALID_UUID_1, enabled: true }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should verify dish ownership through menu userId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockDishes.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockDishes.update.mockResolvedValue({ id: VALID_UUID_1 } as never);

      await caller.toggleTrackInventory({
        dishId: VALID_UUID_1,
        enabled: true,
      });

      expect(mockDishes.findFirst).toHaveBeenCalledWith({
        where: {
          id: VALID_UUID_1,
          menus: { userId: owner.id },
        },
        select: { id: true },
      });
    });

    it("should reject non-UUID dishId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.toggleTrackInventory({ dishId: "bad", enabled: true }),
      ).rejects.toThrow();
    });
  });

  describe("bulkUpdateStock", () => {
    it("should update stock for multiple dishes in a transaction", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockTransaction.mockResolvedValueOnce(undefined as never);

      const result = await caller.bulkUpdateStock({
        menuId: VALID_UUID_1,
        items: [
          { dishId: VALID_UUID_2, quantity: 20 },
          { dishId: VALID_UUID_3, quantity: 0 },
        ],
      });

      expect(result).toEqual({ success: true, updated: 2 });
    });

    it("should throw FORBIDDEN when menu does not belong to user", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.bulkUpdateStock({
          menuId: VALID_UUID_1,
          items: [{ dishId: VALID_UUID_2, quantity: 10 }],
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject empty items array", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.bulkUpdateStock({
          menuId: VALID_UUID_1,
          items: [],
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      await expect(
        caller.bulkUpdateStock({
          menuId: "bad",
          items: [{ dishId: VALID_UUID_2, quantity: 5 }],
        }),
      ).rejects.toThrow();
    });

    it("should verify menu ownership with userId", async () => {
      const owner = createUser();
      const caller = createPrivateCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue({ id: VALID_UUID_1 } as never);
      mockTransaction.mockResolvedValueOnce(undefined as never);

      await caller.bulkUpdateStock({
        menuId: VALID_UUID_1,
        items: [{ dishId: VALID_UUID_2, quantity: 10 }],
      });

      expect(mockMenus.findFirst).toHaveBeenCalledWith({
        where: { id: VALID_UUID_1, userId: owner.id },
        select: { id: true },
      });
    });
  });
});
