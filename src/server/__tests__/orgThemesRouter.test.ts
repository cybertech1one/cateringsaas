import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the orgThemes tRPC router.
 * Covers getPublicTheme, get, upsert, reset, getAvailableFonts, getPresets.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    organizations: {
      findUnique: vi.fn(),
    },
    orgThemes: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
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
import { orgThemesRouter } from "../api/routers/orgThemes";
import { createMenuTheme, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";

function createOrgCaller(role: string = "staff") {
  return orgThemesRouter.createCaller({
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
  return orgThemesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("orgThemesRouter", () => {
  const mockOrgs = vi.mocked(db.organizations);
  const mockThemes = vi.mocked(db.orgThemes);
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
  // getPublicTheme
  // =========================================================================

  describe("getPublicTheme", () => {
    it("should return theme for an org slug", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      const theme = createMenuTheme({ orgId: ORG_ID });
      mockThemes.findUnique.mockResolvedValue(theme as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicTheme({ orgSlug: "test-caterer" });

      expect(result.primaryColor).toBe("#B8860B");
      expect(result.headingFont).toBe("Cormorant");
    });

    it("should return default theme when none is set", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      mockThemes.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicTheme({ orgSlug: "test-caterer" });

      expect(result.primaryColor).toBe("#B8860B");
      expect(result.layoutStyle).toBe("elegant");
      expect(result.bodyFont).toBe("EB Garamond");
    });

    it("should throw NOT_FOUND when org not found", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.getPublicTheme({ orgSlug: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // get
  // =========================================================================

  describe("get", () => {
    it("should return current theme for org", async () => {
      const theme = createMenuTheme({ orgId: ORG_ID });
      mockThemes.findUnique.mockResolvedValue(theme as never);

      const caller = createOrgCaller();
      const result = await caller.get({});

      expect(result!.orgId).toBe(ORG_ID);
      expect(mockThemes.findUnique).toHaveBeenCalledWith({
        where: { orgId: ORG_ID },
      });
    });

    it("should return null when no theme exists", async () => {
      mockThemes.findUnique.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      const result = await caller.get({});

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // upsert
  // =========================================================================

  describe("upsert", () => {
    it("should create or update theme with provided values", async () => {
      const theme = createMenuTheme({ orgId: ORG_ID, primaryColor: "#006D6F" });
      mockThemes.upsert.mockResolvedValue(theme as never);

      const caller = createManagerCaller();
      const result = await caller.upsert({
        primaryColor: "#006D6F",
        headingFont: "Playfair Display",
        layoutStyle: "modern",
      });

      expect(result.primaryColor).toBe("#006D6F");
      expect(mockThemes.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: ORG_ID },
          create: expect.objectContaining({
            orgId: ORG_ID,
            primaryColor: "#006D6F",
            headingFont: "Playfair Display",
            layoutStyle: "modern",
          }),
          update: expect.objectContaining({
            primaryColor: "#006D6F",
            headingFont: "Playfair Display",
            layoutStyle: "modern",
          }),
        }),
      );
    });

    it("should reject invalid hex color", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.upsert({ primaryColor: "not-a-color" }),
      ).rejects.toThrow();
    });

    it("should reject invalid layout style", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.upsert({ layoutStyle: "invalid" as never }),
      ).rejects.toThrow();
    });

    it("should accept valid hex colors", async () => {
      mockThemes.upsert.mockResolvedValue(createMenuTheme() as never);

      const caller = createManagerCaller();
      await caller.upsert({
        primaryColor: "#FF5733",
        secondaryColor: "#AABBCC",
        accentColor: "#123456",
      });

      expect(mockThemes.upsert).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // reset
  // =========================================================================

  describe("reset", () => {
    it("should reset theme to default values", async () => {
      mockThemes.upsert.mockResolvedValue(
        createMenuTheme({ orgId: ORG_ID }) as never,
      );

      const caller = createManagerCaller();
      const result = await caller.reset({});

      expect(mockThemes.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: ORG_ID },
          create: expect.objectContaining({
            primaryColor: "#B8860B",
            layoutStyle: "elegant",
            headingFont: "Cormorant",
            bodyFont: "EB Garamond",
          }),
          update: expect.objectContaining({
            primaryColor: "#B8860B",
            layoutStyle: "elegant",
          }),
        }),
      );
    });
  });

  // =========================================================================
  // getAvailableFonts
  // =========================================================================

  describe("getAvailableFonts", () => {
    it("should return heading and body font options", async () => {
      const caller = createPublicCaller();
      const result = await caller.getAvailableFonts();

      expect(result.heading.length).toBeGreaterThan(0);
      expect(result.body.length).toBeGreaterThan(0);
      expect(result.heading[0]).toHaveProperty("name");
      expect(result.heading[0]).toHaveProperty("category");
      expect(result.heading[0]).toHaveProperty("label");
    });

    it("should include Arabic font options", async () => {
      const caller = createPublicCaller();
      const result = await caller.getAvailableFonts();

      const arabicHeading = result.heading.find((f) => f.name === "Cairo");
      const arabicBody = result.body.find((f) => f.name === "Noto Sans Arabic");
      expect(arabicHeading).toBeDefined();
      expect(arabicBody).toBeDefined();
    });
  });

  // =========================================================================
  // getPresets
  // =========================================================================

  describe("getPresets", () => {
    it("should return theme presets with translations", async () => {
      const caller = createPublicCaller();
      const result = await caller.getPresets();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("nameAr");
      expect(result[0]).toHaveProperty("nameFr");
      expect(result[0]).toHaveProperty("colors");
      expect(result[0]!.colors).toHaveProperty("primaryColor");
    });

    it("should include Royal Gold preset", async () => {
      const caller = createPublicCaller();
      const result = await caller.getPresets();

      const royalGold = result.find((p) => p.id === "royal-gold");
      expect(royalGold).toBeDefined();
      expect(royalGold!.colors.primaryColor).toBe("#B8860B");
    });

    it("should include Moroccan Teal preset", async () => {
      const caller = createPublicCaller();
      const result = await caller.getPresets();

      const teal = result.find((p) => p.id === "moroccan-teal");
      expect(teal).toBeDefined();
      expect(teal!.colors.primaryColor).toBe("#006D6F");
    });
  });
});
