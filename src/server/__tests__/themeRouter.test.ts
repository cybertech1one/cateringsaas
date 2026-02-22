import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the theme tRPC router.
 * Covers getTheme (private), getPublicTheme (public), saveTheme (upsert),
 * resetTheme (delete + return default), applyTemplate, getTemplates,
 * getFonts, ownership verification, and input validation.
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
    menuThemes: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { themeRouter } from "../api/routers/theme";
import { DEFAULT_THEME, THEME_TEMPLATES, FONT_LIBRARY } from "~/lib/theme";
import {
  createMenu,
  createMenuTheme,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPublicCaller() {
  return themeRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null as never,
  });
}

function createPrivateCaller(userId: string) {
  return themeRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const VALID_UUID = "00000000-0000-4000-a000-000000000001";
const USER_ID = "00000000-0000-4000-a000-000000000099";

function validThemeInput(menuId: string) {
  return {
    menuId,
    primaryColor: "#D4A574",
    secondaryColor: "#8B6914",
    backgroundColor: "#FFFBF5",
    surfaceColor: "#FFFFFF",
    textColor: "#1A1A1A",
    accentColor: "#C75B39",
    headingFont: "Playfair Display",
    bodyFont: "Source Sans 3",
    fontSize: "medium" as const,
    layoutStyle: "classic" as const,
    cardStyle: "flat" as const,
    borderRadius: "medium" as const,
    spacing: "comfortable" as const,
    showImages: true,
    imageStyle: "rounded" as const,
    showPrices: true,
    showNutrition: true,
    showCategoryNav: true,
    showCategoryDividers: true,
    headerStyle: "banner" as const,
    customCss: "",
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("themeRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockMenuThemes = vi.mocked(db.menuThemes);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // getTheme (private procedure)
  // =========================================================================

  describe("getTheme", () => {
    it("should return the saved theme for an owned menu", async () => {
      const menu = createMenu({ userId: USER_ID });
      const theme = createMenuTheme({ menuId: menu.id });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenuThemes.findUnique.mockResolvedValue(theme as never);

      const result = await caller.getTheme({ menuId: menu.id });

      expect(result).toEqual(theme);
      expect(mockMenus.findFirst).toHaveBeenCalledWith({
        where: { id: menu.id, userId: USER_ID },
        select: { id: true },
      });
    });

    it("should return DEFAULT_THEME when no theme is saved", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenuThemes.findUnique.mockResolvedValue(null as never);

      const result = await caller.getTheme({ menuId: menu.id });

      expect(result).toEqual(DEFAULT_THEME);
    });

    it("should throw NOT_FOUND when menu does not belong to user", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue(null as never);

      await expect(
        caller.getTheme({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Menu not found or you don't have permission",
      });
    });

    it("should reject invalid UUID for menuId", async () => {
      const caller = createPrivateCaller(USER_ID);

      await expect(
        caller.getTheme({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getPublicTheme (public procedure)
  // =========================================================================

  describe("getPublicTheme", () => {
    it("should return theme tokens for a published menu", async () => {
      const theme = createMenuTheme();
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: "menu-1" } as never);
      mockMenuThemes.findUnique.mockResolvedValue(theme as never);

      const result = await caller.getPublicTheme({ menuSlug: "my-restaurant" });

      // Should return design tokens only, not DB metadata
      expect(result).toEqual({
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        backgroundColor: theme.backgroundColor,
        surfaceColor: theme.surfaceColor,
        textColor: theme.textColor,
        accentColor: theme.accentColor,
        headingFont: theme.headingFont,
        bodyFont: theme.bodyFont,
        fontSize: theme.fontSize,
        layoutStyle: theme.layoutStyle,
        cardStyle: theme.cardStyle,
        borderRadius: theme.borderRadius,
        spacing: theme.spacing,
        showImages: theme.showImages,
        imageStyle: theme.imageStyle,
        showPrices: theme.showPrices,
        showNutrition: theme.showNutrition,
        showCategoryNav: theme.showCategoryNav,
        showCategoryDividers: theme.showCategoryDividers,
        headerStyle: theme.headerStyle,
        customCss: theme.customCss ?? "",
      });
    });

    it("should return DEFAULT_THEME when menu is not published", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue(null as never);

      const result = await caller.getPublicTheme({ menuSlug: "unpublished" });

      expect(result).toEqual(DEFAULT_THEME);
    });

    it("should return DEFAULT_THEME when no theme exists for published menu", async () => {
      const caller = createPublicCaller();

      mockMenus.findFirst.mockResolvedValue({ id: "menu-1" } as never);
      mockMenuThemes.findUnique.mockResolvedValue(null as never);

      const result = await caller.getPublicTheme({ menuSlug: "my-restaurant" });

      expect(result).toEqual(DEFAULT_THEME);
    });

    it("should reject slugs longer than 200 characters", async () => {
      const caller = createPublicCaller();
      const longSlug = "a".repeat(201);

      await expect(
        caller.getPublicTheme({ menuSlug: longSlug }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // saveTheme (private procedure - upsert)
  // =========================================================================

  describe("saveTheme", () => {
    it("should upsert theme with valid input", async () => {
      const menu = createMenu({ userId: USER_ID });
      const savedTheme = createMenuTheme({ menuId: menu.id });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenuThemes.upsert.mockResolvedValue(savedTheme as never);

      const input = validThemeInput(menu.id);
      const result = await caller.saveTheme(input);

      expect(result).toEqual(savedTheme);
      expect(mockMenuThemes.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { menuId: menu.id },
          create: expect.objectContaining({ menuId: menu.id }),
          update: expect.objectContaining({ primaryColor: "#D4A574" }),
        }),
      );
    });

    it("should throw NOT_FOUND when menu does not belong to user", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue(null as never);

      await expect(
        caller.saveTheme(validThemeInput(VALID_UUID)),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject invalid hex color", async () => {
      const caller = createPrivateCaller(USER_ID);
      const input = { ...validThemeInput(VALID_UUID), primaryColor: "red" };

      await expect(caller.saveTheme(input)).rejects.toThrow();
    });

    it("should reject empty heading font", async () => {
      const caller = createPrivateCaller(USER_ID);
      const input = { ...validThemeInput(VALID_UUID), headingFont: "" };

      await expect(caller.saveTheme(input)).rejects.toThrow();
    });

    it("should reject invalid fontSize value", async () => {
      const caller = createPrivateCaller(USER_ID);
      const input = { ...validThemeInput(VALID_UUID), fontSize: "gigantic" as never };

      await expect(caller.saveTheme(input)).rejects.toThrow();
    });

    it("should reject invalid layoutStyle value", async () => {
      const caller = createPrivateCaller(USER_ID);
      const input = { ...validThemeInput(VALID_UUID), layoutStyle: "chaotic" as never };

      await expect(caller.saveTheme(input)).rejects.toThrow();
    });

    it("should accept customCss up to 5000 characters", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);
      const savedTheme = createMenuTheme({ menuId: menu.id });

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenuThemes.upsert.mockResolvedValue(savedTheme as never);

      const input = { ...validThemeInput(menu.id), customCss: "a".repeat(5000) };
      const result = await caller.saveTheme(input);

      expect(result).toBeDefined();
    });

    it("should reject customCss over 5000 characters", async () => {
      const caller = createPrivateCaller(USER_ID);
      const input = { ...validThemeInput(VALID_UUID), customCss: "a".repeat(5001) };

      await expect(caller.saveTheme(input)).rejects.toThrow();
    });
  });

  // =========================================================================
  // resetTheme (private procedure)
  // =========================================================================

  describe("resetTheme", () => {
    it("should delete existing theme and return DEFAULT_THEME", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenuThemes.deleteMany.mockResolvedValue({ count: 1 } as never);

      const result = await caller.resetTheme({ menuId: menu.id });

      expect(result).toEqual(DEFAULT_THEME);
      expect(mockMenuThemes.deleteMany).toHaveBeenCalledWith({
        where: { menuId: menu.id },
      });
    });

    it("should throw NOT_FOUND when menu does not belong to user", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue(null as never);

      await expect(
        caller.resetTheme({ menuId: VALID_UUID }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  // =========================================================================
  // applyTemplate (private procedure)
  // =========================================================================

  describe("applyTemplate", () => {
    it("should apply a valid template", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);
      const upsertedTheme = createMenuTheme({ menuId: menu.id });

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
      mockMenuThemes.upsert.mockResolvedValue(upsertedTheme as never);

      const result = await caller.applyTemplate({
        menuId: menu.id,
        templateId: "classic",
      });

      expect(result).toEqual(upsertedTheme);
      expect(mockMenuThemes.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { menuId: menu.id },
        }),
      );
    });

    it("should throw BAD_REQUEST for unknown template ID", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);

      await expect(
        caller.applyTemplate({ menuId: menu.id, templateId: "nonexistent" }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Template not found",
      });
    });

    it("should throw NOT_FOUND when menu does not belong to user", async () => {
      const caller = createPrivateCaller(USER_ID);

      mockMenus.findFirst.mockResolvedValue(null as never);

      await expect(
        caller.applyTemplate({ menuId: VALID_UUID, templateId: "classic" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should reject empty templateId", async () => {
      const caller = createPrivateCaller(USER_ID);

      await expect(
        caller.applyTemplate({ menuId: VALID_UUID, templateId: "" }),
      ).rejects.toThrow();
    });

    it("should apply each template from THEME_TEMPLATES", async () => {
      const menu = createMenu({ userId: USER_ID });
      const caller = createPrivateCaller(USER_ID);

      for (const template of THEME_TEMPLATES) {
        vi.clearAllMocks();
        const themed = createMenuTheme({ menuId: menu.id });

        mockMenus.findFirst.mockResolvedValue({ id: menu.id } as never);
        mockMenuThemes.upsert.mockResolvedValue(themed as never);

        const result = await caller.applyTemplate({
          menuId: menu.id,
          templateId: template.id,
        });

        expect(result).toBeDefined();
        expect(mockMenuThemes.upsert).toHaveBeenCalledTimes(1);
      }
    });
  });

  // =========================================================================
  // getTemplates (public procedure)
  // =========================================================================

  describe("getTemplates", () => {
    it("should return all theme templates", async () => {
      const caller = createPublicCaller();

      const result = await caller.getTemplates();

      expect(result).toHaveLength(THEME_TEMPLATES.length);
      for (const template of result) {
        expect(template).toHaveProperty("id");
        expect(template).toHaveProperty("name");
        expect(template).toHaveProperty("description");
        expect(template).toHaveProperty("preview");
        expect(template).toHaveProperty("theme");
      }
    });

    it("should include the classic template", async () => {
      const caller = createPublicCaller();

      const result = await caller.getTemplates();
      const classic = result.find((t) => t.id === "classic");

      expect(classic).toBeDefined();
      expect(classic!.name).toBe("Neo Gastro");
    });
  });

  // =========================================================================
  // getFonts (public procedure)
  // =========================================================================

  describe("getFonts", () => {
    it("should return the font library", async () => {
      const caller = createPublicCaller();

      const result = await caller.getFonts();

      expect(result).toEqual(FONT_LIBRARY);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include fonts from all categories", async () => {
      const caller = createPublicCaller();

      const result = await caller.getFonts();
      const categories = new Set(result.map((f) => f.category));

      expect(categories.has("serif")).toBe(true);
      expect(categories.has("sans-serif")).toBe(true);
      expect(categories.has("display")).toBe(true);
      expect(categories.has("handwriting")).toBe(true);
    });
  });
});
