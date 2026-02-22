import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the languages tRPC router.
 * Covers getLanguages (public), changeMenuLanguages (private, with transaction),
 * and changeDefaultLanguage (private).
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock transaction helper - will be used to verify transaction operations
const mockTransactionPrisma = {
  menuLanguages: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  dishesTranslation: {
    deleteMany: vi.fn(),
  },
  categoriesTranslation: {
    deleteMany: vi.fn(),
  },
};

vi.mock("~/server/db", () => ({
  db: {
    languages: {
      findMany: vi.fn(),
    },
    menuLanguages: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock supabase client to prevent import errors
vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { languagesRouter } from "../api/routers/languages";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_UUID_1 = "00000000-0000-4000-a000-000000000001";
const VALID_UUID_2 = "00000000-0000-4000-a000-000000000002";
const VALID_UUID_3 = "00000000-0000-4000-a000-000000000003";
const VALID_MENU_ID = "00000000-0000-4000-a000-000000000010";
const TEST_USER_ID = "00000000-0000-4000-a000-000000000099";

// ---------------------------------------------------------------------------
// Helper: create a tRPC caller with a mock context
// ---------------------------------------------------------------------------

function createMockCaller(userId: string) {
  return languagesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

function createPublicCaller() {
  return languagesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("languagesRouter", () => {
  const mockLanguages = vi.mocked(db.languages);
  const mockMenuLanguages = vi.mocked(db.menuLanguages);
  const mockTransaction = vi.mocked(db.$transaction);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();

    // Default $transaction implementation that executes the callback with mock prisma
    mockTransaction.mockImplementation(async (callback: unknown) => {
      return (callback as (prisma: typeof mockTransactionPrisma) => Promise<unknown>)(mockTransactionPrisma);
    });
  });

  // =========================================================================
  // getLanguages
  // =========================================================================

  describe("getLanguages", () => {
    it("should return all available languages", async () => {
      const caller = createPublicCaller();
      const languages = [
        { id: VALID_UUID_1, name: "English", code: "en", nativeName: "English" },
        { id: VALID_UUID_2, name: "French", code: "fr", nativeName: "Francais" },
        { id: VALID_UUID_3, name: "Arabic", code: "ar", nativeName: "العربية" },
      ];

      mockLanguages.findMany.mockResolvedValue(languages as never);

      const result = await caller.getLanguages();

      expect(result).toEqual(languages);
      expect(result).toHaveLength(3);
    });

    it("should return empty array when no languages exist", async () => {
      const caller = createPublicCaller();

      mockLanguages.findMany.mockResolvedValue([] as never);

      const result = await caller.getLanguages();

      expect(result).toEqual([]);
    });

    it("should be accessible without authentication (public procedure)", async () => {
      const caller = createPublicCaller();

      mockLanguages.findMany.mockResolvedValue([] as never);

      // Should not throw UNAUTHORIZED
      await expect(caller.getLanguages()).resolves.toBeDefined();
    });

    it("should call findMany with no filters", async () => {
      const caller = createPublicCaller();

      mockLanguages.findMany.mockResolvedValue([] as never);

      await caller.getLanguages();

      expect(mockLanguages.findMany).toHaveBeenCalledWith();
    });

    it("should propagate database errors", async () => {
      const caller = createPublicCaller();

      mockLanguages.findMany.mockRejectedValue(new Error("DB timeout") as never);

      await expect(caller.getLanguages()).rejects.toThrow("DB timeout");
    });
  });

  // =========================================================================
  // changeMenuLanguages
  // =========================================================================

  describe("changeMenuLanguages", () => {
    it("should add new languages to a menu", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      // Existing: UUID_1. Adding: UUID_2
      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
      ] as never);

      mockTransactionPrisma.menuLanguages.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.menuLanguages.createMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.dishesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.categoriesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);

      const result = await caller.changeMenuLanguages({
        menuId: VALID_MENU_ID,
        languages: [VALID_UUID_1, VALID_UUID_2],
      });

      expect(result).toBe(true);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should remove languages from a menu", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      // Existing: UUID_1, UUID_2. Keeping: UUID_1 only (removing UUID_2)
      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_2, isDefault: false },
      ] as never);

      mockTransactionPrisma.menuLanguages.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.menuLanguages.createMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.dishesTranslation.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.categoriesTranslation.deleteMany.mockResolvedValue({ count: 1 } as never);

      const result = await caller.changeMenuLanguages({
        menuId: VALID_MENU_ID,
        languages: [VALID_UUID_1],
      });

      expect(result).toBe(true);
    });

    it("should throw BAD_REQUEST when trying to remove all languages", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      // Existing: UUID_1. Trying to set empty array.
      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
      ] as never);

      await expect(
        caller.changeMenuLanguages({
          menuId: VALID_MENU_ID,
          languages: [],
        }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.changeMenuLanguages({
          menuId: VALID_MENU_ID,
          languages: [],
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "You cannot delete all languages from menu",
      });
    });

    it("should set new default language when current default is removed", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      // Existing: UUID_1 (default), UUID_2. Removing UUID_1 (the default).
      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_2, isDefault: false },
      ] as never);

      mockTransactionPrisma.menuLanguages.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.menuLanguages.createMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.dishesTranslation.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.categoriesTranslation.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.menuLanguages.update.mockResolvedValue({} as never);

      const result = await caller.changeMenuLanguages({
        menuId: VALID_MENU_ID,
        languages: [VALID_UUID_2],
      });

      expect(result).toBe(true);
      // Should have set the remaining language as default
      expect(mockTransactionPrisma.menuLanguages.update).toHaveBeenCalledWith({
        where: {
          menus: { userId: TEST_USER_ID },
          menuId_languageId: {
            languageId: VALID_UUID_2,
            menuId: VALID_MENU_ID,
          },
        },
        data: { isDefault: true },
      });
    });

    it("should not change default when current default is kept", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      // Existing: UUID_1 (default), UUID_2. Keeping both (no changes).
      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_2, isDefault: false },
      ] as never);

      mockTransactionPrisma.menuLanguages.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.menuLanguages.createMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.dishesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.categoriesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);

      await caller.changeMenuLanguages({
        menuId: VALID_MENU_ID,
        languages: [VALID_UUID_1, VALID_UUID_2],
      });

      // Should NOT have called update to set a new default
      expect(mockTransactionPrisma.menuLanguages.update).not.toHaveBeenCalled();
    });

    it("should delete dish and category translations for removed languages", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_2, isDefault: false },
      ] as never);

      mockTransactionPrisma.menuLanguages.deleteMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.menuLanguages.createMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.dishesTranslation.deleteMany.mockResolvedValue({ count: 3 } as never);
      mockTransactionPrisma.categoriesTranslation.deleteMany.mockResolvedValue({ count: 2 } as never);

      await caller.changeMenuLanguages({
        menuId: VALID_MENU_ID,
        languages: [VALID_UUID_1],
      });

      expect(mockTransactionPrisma.dishesTranslation.deleteMany).toHaveBeenCalledWith({
        where: {
          dishes: { menuId: VALID_MENU_ID },
          languageId: { in: [VALID_UUID_2] },
        },
      });
      expect(mockTransactionPrisma.categoriesTranslation.deleteMany).toHaveBeenCalledWith({
        where: {
          categories: { menuId: VALID_MENU_ID },
          languageId: { in: [VALID_UUID_2] },
        },
      });
    });

    it("should reject non-UUID menuId", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      await expect(
        caller.changeMenuLanguages({
          menuId: "not-a-uuid",
          languages: [VALID_UUID_1],
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID language ids", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      await expect(
        caller.changeMenuLanguages({
          menuId: VALID_MENU_ID,
          languages: ["not-a-uuid"],
        }),
      ).rejects.toThrow();
    });

    it("should reject unauthenticated requests", async () => {
      const caller = createPublicCaller();

      await expect(
        (caller as ReturnType<typeof createMockCaller>).changeMenuLanguages({
          menuId: VALID_MENU_ID,
          languages: [VALID_UUID_1],
        }),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should handle menu with no existing languages (empty findMany result)", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      // No existing languages, adding one
      mockMenuLanguages.findMany.mockResolvedValue([] as never);

      mockTransactionPrisma.menuLanguages.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.menuLanguages.createMany.mockResolvedValue({ count: 1 } as never);
      mockTransactionPrisma.dishesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.categoriesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.menuLanguages.update.mockResolvedValue({} as never);

      const result = await caller.changeMenuLanguages({
        menuId: VALID_MENU_ID,
        languages: [VALID_UUID_1],
      });

      expect(result).toBe(true);
    });

    it("should query menuLanguages scoped to the authenticated user", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
      ] as never);

      mockTransactionPrisma.menuLanguages.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.menuLanguages.createMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.dishesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);
      mockTransactionPrisma.categoriesTranslation.deleteMany.mockResolvedValue({ count: 0 } as never);

      await caller.changeMenuLanguages({
        menuId: VALID_MENU_ID,
        languages: [VALID_UUID_1],
      });

      expect(mockMenuLanguages.findMany).toHaveBeenCalledWith({
        where: {
          menus: {
            id: VALID_MENU_ID,
            userId: TEST_USER_ID,
          },
        },
      });
    });
  });

  // =========================================================================
  // changeDefaultLanguage
  // =========================================================================

  describe("changeDefaultLanguage", () => {
    it("should change the default language successfully", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_2, isDefault: false },
      ] as never);
      mockMenuLanguages.updateMany.mockResolvedValue({ count: 2 } as never);
      mockMenuLanguages.update.mockResolvedValue({} as never);

      const result = await caller.changeDefaultLanguage({
        menuId: VALID_MENU_ID,
        languageId: VALID_UUID_2,
      });

      expect(result).toBe(true);
    });

    it("should first set all languages to non-default then set the target", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_2, isDefault: false },
      ] as never);
      mockMenuLanguages.updateMany.mockResolvedValue({ count: 2 } as never);
      mockMenuLanguages.update.mockResolvedValue({} as never);

      await caller.changeDefaultLanguage({
        menuId: VALID_MENU_ID,
        languageId: VALID_UUID_2,
      });

      // Step 1: set all to false
      expect(mockMenuLanguages.updateMany).toHaveBeenCalledWith({
        where: {
          menus: {
            id: VALID_MENU_ID,
            userId: TEST_USER_ID,
          },
        },
        data: { isDefault: false },
      });

      // Step 2: set target to true
      expect(mockMenuLanguages.update).toHaveBeenCalledWith({
        where: {
          menus: { userId: TEST_USER_ID },
          menuId_languageId: {
            languageId: VALID_UUID_2,
            menuId: VALID_MENU_ID,
          },
        },
        data: { isDefault: true },
      });
    });

    it("should throw NOT_FOUND when menu has no languages", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockMenuLanguages.findMany.mockResolvedValue([] as never);

      await expect(
        caller.changeDefaultLanguage({
          menuId: VALID_MENU_ID,
          languageId: VALID_UUID_1,
        }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.changeDefaultLanguage({
          menuId: VALID_MENU_ID,
          languageId: VALID_UUID_1,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found or has no languages",
      });
    });

    it("should throw BAD_REQUEST when language is not assigned to the menu", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
      ] as never);

      await expect(
        caller.changeDefaultLanguage({
          menuId: VALID_MENU_ID,
          languageId: VALID_UUID_2, // Not in the menu's languages
        }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.changeDefaultLanguage({
          menuId: VALID_MENU_ID,
          languageId: VALID_UUID_2,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Language is not assigned to this menu",
      });
    });

    it("should reject non-UUID menuId", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      await expect(
        caller.changeDefaultLanguage({
          menuId: "bad-id",
          languageId: VALID_UUID_1,
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID languageId", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      await expect(
        caller.changeDefaultLanguage({
          menuId: VALID_MENU_ID,
          languageId: "bad-id",
        }),
      ).rejects.toThrow();
    });

    it("should reject unauthenticated requests", async () => {
      const caller = createPublicCaller();

      await expect(
        (caller as ReturnType<typeof createMockCaller>).changeDefaultLanguage({
          menuId: VALID_MENU_ID,
          languageId: VALID_UUID_1,
        }),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should query menuLanguages scoped to the authenticated user", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
      ] as never);
      mockMenuLanguages.updateMany.mockResolvedValue({ count: 1 } as never);
      mockMenuLanguages.update.mockResolvedValue({} as never);

      await caller.changeDefaultLanguage({
        menuId: VALID_MENU_ID,
        languageId: VALID_UUID_1,
      });

      expect(mockMenuLanguages.findMany).toHaveBeenCalledWith({
        where: {
          menus: {
            id: VALID_MENU_ID,
            userId: TEST_USER_ID,
          },
        },
      });
    });

    it("should not update database if language validation fails", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      // Menu has UUID_1 only; trying to set UUID_2 as default
      mockMenuLanguages.findMany.mockResolvedValue([
        { menuId: VALID_MENU_ID, languageId: VALID_UUID_1, isDefault: true },
      ] as never);

      try {
        await caller.changeDefaultLanguage({
          menuId: VALID_MENU_ID,
          languageId: VALID_UUID_2,
        });
      } catch {
        // Expected
      }

      expect(mockMenuLanguages.updateMany).not.toHaveBeenCalled();
      expect(mockMenuLanguages.update).not.toHaveBeenCalled();
    });
  });
});
