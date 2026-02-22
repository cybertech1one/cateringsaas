import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the portfolio tRPC router.
 * Covers getPublicPortfolio, list, add, update, remove, reorder.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    organizations: {
      findUnique: vi.fn(),
    },
    portfolioImages: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
import { portfolioRouter } from "../api/routers/portfolio";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const IMAGE_ID = "00000000-0000-4000-a000-000000000300";

function createOrgCaller(role: string = "staff") {
  return portfolioRouter.createCaller({
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
  return portfolioRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("portfolioRouter", () => {
  const mockOrgs = vi.mocked(db.organizations);
  const mockImages = vi.mocked(db.portfolioImages);
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
  // getPublicPortfolio
  // =========================================================================

  describe("getPublicPortfolio", () => {
    it("should return portfolio images for an org slug", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      const images = [
        { id: IMAGE_ID, imageUrl: "https://example.com/img.jpg", caption: "Wedding setup", isFeatured: true },
      ];
      mockImages.findMany.mockResolvedValue(images as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicPortfolio({ orgSlug: "test-caterer" });

      expect(result).toHaveLength(1);
      expect(result[0]!.imageUrl).toBe("https://example.com/img.jpg");
    });

    it("should throw NOT_FOUND when org not found", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.getPublicPortfolio({ orgSlug: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should filter by event type", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID } as never);
      mockImages.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.getPublicPortfolio({ orgSlug: "test", eventType: "wedding" });

      expect(mockImages.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventType: "wedding" }),
        }),
      );
    });
  });

  // =========================================================================
  // list
  // =========================================================================

  describe("list", () => {
    it("should return all images for org", async () => {
      const images = [
        { id: IMAGE_ID, imageUrl: "https://example.com/img.jpg", orgId: ORG_ID },
      ];
      mockImages.findMany.mockResolvedValue(images as never);

      const caller = createOrgCaller();
      const result = await caller.list({});

      expect(result).toHaveLength(1);
      expect(mockImages.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: ORG_ID },
        }),
      );
    });

    it("should filter by event type", async () => {
      mockImages.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ eventType: "corporate" });

      expect(mockImages.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventType: "corporate" }),
        }),
      );
    });
  });

  // =========================================================================
  // add
  // =========================================================================

  describe("add", () => {
    it("should add image with auto-incremented sortOrder", async () => {
      mockImages.findFirst.mockResolvedValue({ sortOrder: 5 } as never);
      mockImages.create.mockResolvedValue({
        id: IMAGE_ID,
        imageUrl: "https://example.com/new.jpg",
        sortOrder: 6,
        orgId: ORG_ID,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.add({
        imageUrl: "https://example.com/new.jpg",
        caption: "Beautiful setup",
      });

      expect(result.sortOrder).toBe(6);
      expect(mockImages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            imageUrl: "https://example.com/new.jpg",
            sortOrder: 6,
          }),
        }),
      );
    });

    it("should start at sortOrder 1 when no existing images", async () => {
      mockImages.findFirst.mockResolvedValue(null as never);
      mockImages.create.mockResolvedValue({ id: IMAGE_ID, sortOrder: 1 } as never);

      const caller = createManagerCaller();
      await caller.add({ imageUrl: "https://example.com/first.jpg" });

      expect(mockImages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 1 }),
        }),
      );
    });

    it("should reject invalid URL", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.add({ imageUrl: "not-a-url" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe("update", () => {
    it("should update image details", async () => {
      mockImages.findFirst.mockResolvedValue({ id: IMAGE_ID, orgId: ORG_ID } as never);
      mockImages.update.mockResolvedValue({
        id: IMAGE_ID,
        caption: "Updated caption",
        isFeatured: true,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.update({
        imageId: IMAGE_ID,
        caption: "Updated caption",
        isFeatured: true,
      });

      expect(result.caption).toBe("Updated caption");
      expect(result.isFeatured).toBe(true);
    });

    it("should throw NOT_FOUND when image does not belong to org", async () => {
      mockImages.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.update({ imageId: IMAGE_ID, caption: "Updated" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // remove
  // =========================================================================

  describe("remove", () => {
    it("should delete an image", async () => {
      mockImages.findFirst.mockResolvedValue({ id: IMAGE_ID, orgId: ORG_ID } as never);
      mockImages.delete.mockResolvedValue({ id: IMAGE_ID } as never);

      const caller = createManagerCaller();
      await caller.remove({ imageId: IMAGE_ID });

      expect(mockImages.delete).toHaveBeenCalledWith({
        where: { id: IMAGE_ID },
      });
    });

    it("should throw NOT_FOUND when image does not belong to org", async () => {
      mockImages.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.remove({ imageId: IMAGE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // reorder
  // =========================================================================

  describe("reorder", () => {
    it("should update sort order for multiple images", async () => {
      mockImages.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.reorder({
        imageOrder: [
          { id: "00000000-0000-4000-a000-000000000501", sortOrder: 1 },
          { id: "00000000-0000-4000-a000-000000000502", sortOrder: 2 },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockImages.update).toHaveBeenCalledTimes(2);
    });
  });
});
