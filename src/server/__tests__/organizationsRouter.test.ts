import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the organizations tRPC router.
 * Covers public browse/search, org CRUD, member management, and super admin ops.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    organizations: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    orgMembers: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    profiles: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
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
import { organizationsRouter } from "../api/routers/organizations";
import { createRestaurant, createUser, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";

function createOrgCaller(role: string = "staff") {
  return organizationsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "test@example.com" } as never,
    orgId: ORG_ID,
    orgRole: role,
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

function createPrivateCaller(userId = USER_ID) {
  return organizationsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId, email: "test@example.com" } as never,
  });
}

function createPublicCaller() {
  return organizationsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

function createSuperAdminCaller() {
  return organizationsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "admin@example.com" } as never,
    orgId: ORG_ID,
    orgRole: "super_admin",
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("organizationsRouter", () => {
  const mockOrgs = vi.mocked(db.organizations);
  const mockMembers = vi.mocked(db.orgMembers);
  const mockProfiles = vi.mocked(db.profiles);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
  });

  // =========================================================================
  // browse (public)
  // =========================================================================

  describe("browse", () => {
    it("should return paginated organizations", async () => {
      const org = createRestaurant({ isActive: true });
      mockOrgs.findMany.mockResolvedValue([org] as never);

      const caller = createPublicCaller();
      const result = await caller.browse({ limit: 20 });

      expect(result.organizations).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should handle cursor-based pagination", async () => {
      const orgs = Array.from({ length: 3 }, () => createRestaurant());
      mockOrgs.findMany.mockResolvedValue(orgs as never);

      const caller = createPublicCaller();
      const result = await caller.browse({ limit: 2 });

      // 3 returned > limit 2, so nextCursor should be set
      expect(result.nextCursor).toBeDefined();
      expect(result.organizations).toHaveLength(2);
    });

    it("should filter by city", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ city: "Casablanca" });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { equals: "Casablanca", mode: "insensitive" },
          }),
        }),
      );
    });

    it("should filter by type", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ type: "caterer" });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "caterer" }),
        }),
      );
    });

    it("should apply search filter on name and description", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);

      const caller = createPublicCaller();
      await caller.browse({ search: "Moroccan" });

      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.anything() }),
            ]),
          }),
        }),
      );
    });
  });

  // =========================================================================
  // getPublicProfile
  // =========================================================================

  describe("getPublicProfile", () => {
    it("should return org by slug", async () => {
      const org = createRestaurant({ slug: "my-caterer" });
      mockOrgs.findUnique.mockResolvedValue(org as never);

      const caller = createPublicCaller();
      const result = await caller.getPublicProfile({ slug: "my-caterer" });

      expect(result.slug).toBe("my-caterer");
    });

    it("should throw NOT_FOUND when slug not found", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.getPublicProfile({ slug: "nonexistent" }),
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.getPublicProfile({ slug: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // search (public)
  // =========================================================================

  describe("search", () => {
    it("should search organizations by query", async () => {
      const org = createRestaurant({ name: "Diyafa Royale" });
      mockOrgs.findMany.mockResolvedValue([org] as never);

      const caller = createPublicCaller();
      const result = await caller.search({ query: "Diyafa" });

      expect(result).toHaveLength(1);
      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("should reject empty search query", async () => {
      const caller = createPublicCaller();
      await expect(caller.search({ query: "" })).rejects.toThrow();
    });
  });

  // =========================================================================
  // getFeatured (public)
  // =========================================================================

  describe("getFeatured", () => {
    it("should return featured active organizations", async () => {
      const orgs = [createRestaurant({ isFeatured: true })];
      mockOrgs.findMany.mockResolvedValue(orgs as never);

      const caller = createPublicCaller();
      const result = await caller.getFeatured();

      expect(result).toHaveLength(1);
      expect(mockOrgs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, isFeatured: true },
        }),
      );
    });
  });

  // =========================================================================
  // getCities (public)
  // =========================================================================

  describe("getCities", () => {
    it("should return city counts", async () => {
      mockOrgs.groupBy.mockResolvedValue([
        { city: "Casablanca", _count: { city: 5 } },
        { city: "Marrakech", _count: { city: 3 } },
      ] as never);

      const caller = createPublicCaller();
      const result = await caller.getCities();

      expect(result).toEqual([
        { city: "Casablanca", count: 5 },
        { city: "Marrakech", count: 3 },
      ]);
    });

    it("should filter out null cities", async () => {
      mockOrgs.groupBy.mockResolvedValue([
        { city: null, _count: { city: 2 } },
        { city: "Fes", _count: { city: 1 } },
      ] as never);

      const caller = createPublicCaller();
      const result = await caller.getCities();

      expect(result).toHaveLength(1);
      expect(result[0]!.city).toBe("Fes");
    });
  });

  // =========================================================================
  // create (privateProcedure)
  // =========================================================================

  describe("create", () => {
    it("should create organization and make creator the owner", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never); // slug available
      const org = createRestaurant();
      mockOrgs.create.mockResolvedValue(org as never);

      const caller = createPrivateCaller();
      const result = await caller.create({
        name: "New Caterer",
        type: "caterer",
        city: "Casablanca",
      });

      expect(result.id).toBe(org.id);
      expect(mockOrgs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "New Caterer",
            type: "caterer",
            city: "Casablanca",
            subscriptionTier: "free",
            isActive: true,
            members: {
              create: expect.objectContaining({
                userId: USER_ID,
                role: "org_owner",
              }),
            },
          }),
        }),
      );
    });

    it("should reject unauthenticated user", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.create({ name: "Test", type: "caterer", city: "Rabat" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should generate unique slug when collision occurs", async () => {
      // First call returns existing slug, second returns null (available)
      mockOrgs.findUnique
        .mockResolvedValueOnce({ id: "existing" } as never) // "new-caterer" taken
        .mockResolvedValueOnce(null as never); // "new-caterer-1" available
      mockOrgs.create.mockResolvedValue(createRestaurant() as never);

      const caller = createPrivateCaller();
      await caller.create({ name: "New Caterer", type: "caterer", city: "Fes" });

      expect(mockOrgs.findUnique).toHaveBeenCalledTimes(2);
    });

    it("should reject name shorter than 2 characters", async () => {
      const caller = createPrivateCaller();
      await expect(
        caller.create({ name: "A", type: "caterer", city: "Rabat" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getMine (orgProcedure)
  // =========================================================================

  describe("getMine", () => {
    it("should return current user org", async () => {
      const org = createRestaurant({ id: ORG_ID });
      mockOrgs.findUnique.mockResolvedValue(org as never);
      // Org middleware mock: findFirst returns membership
      mockMembers.findFirst.mockResolvedValue({
        id: MEMBER_ID,
        orgId: ORG_ID,
        role: "staff",
        permissions: null,
      } as never);

      const caller = createOrgCaller();
      const result = await caller.getMine();

      expect(mockOrgs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ORG_ID } }),
      );
    });
  });

  // =========================================================================
  // inviteMember (orgAdminProcedure)
  // =========================================================================

  describe("inviteMember", () => {
    it("should invite an existing user to the org", async () => {
      const invitee = createUser({ email: "new@example.com" });
      mockProfiles.findFirst.mockResolvedValue(invitee as never);
      // Middleware: 1) default org lookup, 2) membership verify; then procedure: 3) already-member check
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce(null as never); // procedure: not already a member
      const created = { id: "00000000-0000-4000-a000-000000000080", orgId: ORG_ID, userId: invitee.id, role: "staff" };
      mockMembers.create.mockResolvedValue(created as never);

      const caller = createOrgCaller("admin");
      const result = await caller.inviteMember({
        email: "new@example.com",
        role: "staff",
      });

      expect(result).toEqual(created);
    });

    it("should throw NOT_FOUND if invitee email not registered", async () => {
      mockProfiles.findFirst.mockResolvedValue(null as never);
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never); // middleware: verify membership

      const caller = createOrgCaller("admin");
      await expect(
        caller.inviteMember({ email: "ghost@example.com", role: "staff" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw CONFLICT if user is already a member", async () => {
      const invitee = createUser();
      mockProfiles.findFirst.mockResolvedValue(invitee as never);
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce({ id: "existing" } as never); // procedure: already member

      const caller = createOrgCaller("admin");
      await expect(
        caller.inviteMember({ email: invitee.email!, role: "staff" }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  // =========================================================================
  // updateMemberRole (orgOwnerProcedure)
  // =========================================================================

  describe("updateMemberRole", () => {
    const MEMBER_2_ID = "00000000-0000-4000-a000-000000000060";

    it("should update member role", async () => {
      const otherId = "00000000-0000-4000-a000-000000000099";
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "org_owner",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "org_owner",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce({
          id: MEMBER_2_ID,
          orgId: ORG_ID,
          userId: otherId,
          role: "staff",
        } as never); // procedure: target member
      mockMembers.update.mockResolvedValue({ id: MEMBER_2_ID, role: "manager" } as never);

      const caller = createOrgCaller("org_owner");
      const result = await caller.updateMemberRole({
        memberId: MEMBER_2_ID,
        role: "manager",
      });

      expect(result.role).toBe("manager");
    });

    it("should throw FORBIDDEN when changing own role", async () => {
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "org_owner",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "org_owner",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          userId: USER_ID,
          role: "org_owner",
        } as never); // procedure: target is self

      const caller = createOrgCaller("org_owner");
      await expect(
        caller.updateMemberRole({ memberId: MEMBER_ID, role: "admin" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw NOT_FOUND when member does not exist", async () => {
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "org_owner",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "org_owner",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce(null as never); // procedure: target not found

      const caller = createOrgCaller("org_owner");
      await expect(
        caller.updateMemberRole({
          memberId: "00000000-0000-4000-a000-000000000999",
          role: "staff",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // removeMember (orgAdminProcedure)
  // =========================================================================

  describe("removeMember", () => {
    const TARGET_MEMBER_ID = "00000000-0000-4000-a000-000000000070";
    const OWNER_MEMBER_ID = "00000000-0000-4000-a000-000000000071";
    const SELF_MEMBER_ID = "00000000-0000-4000-a000-000000000072";

    it("should soft-remove a member by setting isActive false", async () => {
      const otherId = "00000000-0000-4000-a000-000000000088";
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce({
          id: TARGET_MEMBER_ID,
          orgId: ORG_ID,
          userId: otherId,
          role: "staff",
        } as never); // procedure: find target member
      mockMembers.update.mockResolvedValue({ id: TARGET_MEMBER_ID, isActive: false } as never);

      const caller = createOrgCaller("admin");
      await caller.removeMember({ memberId: TARGET_MEMBER_ID });

      expect(mockMembers.update).toHaveBeenCalledWith({
        where: { id: TARGET_MEMBER_ID },
        data: { isActive: false },
      });
    });

    it("should not allow removing the org owner", async () => {
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce({
          id: OWNER_MEMBER_ID,
          orgId: ORG_ID,
          userId: "00000000-0000-4000-a000-000000000089",
          role: "org_owner",
        } as never); // procedure: target is org_owner

      const caller = createOrgCaller("admin");
      await expect(
        caller.removeMember({ memberId: OWNER_MEMBER_ID }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should not allow removing self", async () => {
      mockMembers.findFirst
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: default org
        .mockResolvedValueOnce({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "admin",
          permissions: null,
        } as never) // middleware: verify membership
        .mockResolvedValueOnce({
          id: SELF_MEMBER_ID,
          orgId: ORG_ID,
          userId: USER_ID,
          role: "admin",
        } as never); // procedure: target is self

      const caller = createOrgCaller("admin");
      await expect(
        caller.removeMember({ memberId: SELF_MEMBER_ID }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // =========================================================================
  // verify / setFeatured / setActive (superAdminProcedure)
  // =========================================================================

  describe("super admin operations", () => {
    it("verify should update isVerified", async () => {
      // super admin middleware checks profile role
      mockProfiles.findUnique.mockResolvedValue({ role: "super_admin" } as never);
      mockOrgs.update.mockResolvedValue(createRestaurant({ isVerified: true }) as never);

      const caller = createSuperAdminCaller();
      const result = await caller.verify({ orgId: ORG_ID, verified: true });

      expect(mockOrgs.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { isVerified: true },
      });
    });

    it("setFeatured should update isFeatured", async () => {
      mockProfiles.findUnique.mockResolvedValue({ role: "super_admin" } as never);
      mockOrgs.update.mockResolvedValue(createRestaurant({ isFeatured: true }) as never);

      const caller = createSuperAdminCaller();
      await caller.setFeatured({ orgId: ORG_ID, featured: true });

      expect(mockOrgs.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { isFeatured: true },
      });
    });

    it("setActive should update isActive", async () => {
      mockProfiles.findUnique.mockResolvedValue({ role: "super_admin" } as never);
      mockOrgs.update.mockResolvedValue(createRestaurant({ isActive: false }) as never);

      const caller = createSuperAdminCaller();
      await caller.setActive({ orgId: ORG_ID, active: false });

      expect(mockOrgs.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { isActive: false },
      });
    });

    it("verify should reject non-super-admin users", async () => {
      mockProfiles.findUnique.mockResolvedValue({ role: "user" } as never);

      const caller = organizationsRouter.createCaller({
        headers: new Headers(),
        db: db as never,
        user: { id: USER_ID, email: "user@example.com" } as never,
      });

      await expect(
        caller.verify({ orgId: ORG_ID, verified: true }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // =========================================================================
  // Authentication enforcement
  // =========================================================================

  describe("authentication enforcement", () => {
    it("should allow unauthenticated access to browse", async () => {
      mockOrgs.findMany.mockResolvedValue([] as never);
      const caller = createPublicCaller();
      const result = await caller.browse({});
      expect(result.organizations).toEqual([]);
    });

    it("should reject unauthenticated access to create", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.create({ name: "Test", type: "caterer", city: "Rabat" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
