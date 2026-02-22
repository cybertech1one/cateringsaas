import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the staff tRPC router.
 * Covers IDOR protection, role validation, invite logic, duplicate detection,
 * toggle active state, and input validation (UUID format, email format, role enum).
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock rateLimit to always allow by default (individual tests can override)
vi.mock("~/server/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 9 })),
}));

// Mock the db module with a full Prisma-like interface for the staff router
vi.mock("~/server/db", () => ({
  db: {
    menus: {
      findFirst: vi.fn(),
    },
    profiles: {
      findUnique: vi.fn(),
    },
    staffMembers: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock supabase client to prevent import errors
vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

import { db } from "~/server/db";
import { rateLimit } from "~/server/rateLimit";
import { staffRouter } from "../api/routers/staff";
import {
  createUser,
  createMenu,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helper: create a tRPC caller with a mock context
// ---------------------------------------------------------------------------

function createMockCaller(userId: string) {
  const caller = staffRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });

  return caller;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("staffRouter", () => {
  const mockMenus = vi.mocked(db.menus);
  const mockProfiles = vi.mocked(db.profiles);
  const mockStaffMembers = vi.mocked(db.staffMembers);
  const mockRateLimit = vi.mocked(rateLimit);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockRateLimit.mockReturnValue({ success: true, remaining: 9 });
  });

  // =========================================================================
  // getStaffByMenu
  // =========================================================================

  describe("getStaffByMenu", () => {
    it("should return staff list when user owns the menu", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createMockCaller(user.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockStaffMembers.findMany.mockResolvedValue([
        {
          id: "staff-1",
          menuId: menu.id,
          userId: "other-user",
          role: "staff",
          isActive: true,
          user: { id: "other-user", email: "staff@example.com", fullName: "Staff Person" },
          inviter: { id: user.id, email: user.email, fullName: user.fullName },
        },
      ] as never);

      const result = await caller.getStaffByMenu({ menuId: menu.id });

      expect(result).toHaveLength(1);
      expect(mockMenus.findFirst).toHaveBeenCalledWith({
        where: { id: menu.id, userId: user.id },
        select: { id: true },
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.getStaffByMenu({ menuId: "00000000-0000-4000-a000-000000000099" }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.getStaffByMenu({ menuId: "00000000-0000-4000-a000-000000000099" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should return empty array when no staff members exist", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createMockCaller(user.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockStaffMembers.findMany.mockResolvedValue([]);

      const result = await caller.getStaffByMenu({ menuId: menu.id });

      expect(result).toEqual([]);
    });

    it("should reject non-UUID menuId", async () => {
      const user = createUser();
      const caller = createMockCaller(user.id);

      await expect(
        caller.getStaffByMenu({ menuId: "not-a-uuid" }),
      ).rejects.toThrow();
    });

    it("should reject empty menuId", async () => {
      const user = createUser();
      const caller = createMockCaller(user.id);

      await expect(
        caller.getStaffByMenu({ menuId: "" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // inviteStaff
  // =========================================================================

  describe("inviteStaff", () => {
    it("should successfully invite a staff member", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const targetUser = createUser({ email: "new-staff@example.com" });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockProfiles.findUnique.mockResolvedValue(targetUser);
      mockStaffMembers.findUnique.mockResolvedValue(null); // Not already a member
      mockStaffMembers.create.mockResolvedValue({
        id: "new-staff-member-id",
        menuId: menu.id,
        userId: targetUser.id,
        role: "staff",
        invitedBy: owner.id,
        user: { id: targetUser.id, email: targetUser.email, fullName: targetUser.fullName },
      } as never);

      const result = await caller.inviteStaff({
        menuId: menu.id,
        email: "new-staff@example.com",
        role: "staff",
      });

      expect(result.userId).toBe(targetUser.id);
      expect(mockStaffMembers.create).toHaveBeenCalledWith({
        data: {
          menuId: menu.id,
          userId: targetUser.id,
          role: "staff",
          invitedBy: owner.id,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });
    });

    it("should accept manager role", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const targetUser = createUser({ email: "manager@example.com" });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockProfiles.findUnique.mockResolvedValue(targetUser);
      mockStaffMembers.findUnique.mockResolvedValue(null);
      mockStaffMembers.create.mockResolvedValue({
        id: "manager-staff-id",
        menuId: menu.id,
        userId: targetUser.id,
        role: "manager",
        invitedBy: owner.id,
        user: { id: targetUser.id, email: targetUser.email, fullName: targetUser.fullName },
      } as never);

      const result = await caller.inviteStaff({
        menuId: menu.id,
        email: "manager@example.com",
        role: "manager",
      });

      expect(result.role).toBe("manager");
    });

    it("should throw FORBIDDEN when user does not own the menu", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockMenus.findFirst.mockResolvedValue(null);

      await expect(
        caller.inviteStaff({
          menuId: "00000000-0000-4000-a000-000000000099",
          email: "target@example.com",
          role: "staff",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to manage staff for this menu",
      });
    });

    it("should throw NOT_FOUND when target email does not exist", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockProfiles.findUnique.mockResolvedValue(null);

      await expect(
        caller.inviteStaff({
          menuId: menu.id,
          email: "nonexistent@example.com",
          role: "staff",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "No user found with that email",
      });
    });

    it("should throw CONFLICT when user is already a staff member", async () => {
      const owner = createUser();
      const menu = createMenu({ userId: owner.id });
      const targetUser = createUser({ email: "existing-staff@example.com" });
      const caller = createMockCaller(owner.id);

      mockMenus.findFirst.mockResolvedValue(menu);
      mockProfiles.findUnique.mockResolvedValue(targetUser);
      mockStaffMembers.findUnique.mockResolvedValue({
        id: "existing-record",
        menuId: menu.id,
        userId: targetUser.id,
        role: "staff",
      } as never); // Already exists

      await expect(
        caller.inviteStaff({
          menuId: menu.id,
          email: "existing-staff@example.com",
          role: "staff",
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "User is already a staff member of this menu",
      });
    });

    it("should throw TOO_MANY_REQUESTS when rate limited", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      await expect(
        caller.inviteStaff({
          menuId: "00000000-0000-4000-a000-000000000099",
          email: "test@example.com",
          role: "staff",
        }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      // Should not have attempted DB lookup
      expect(mockMenus.findFirst).not.toHaveBeenCalled();
    });

    it("should reject invalid email format", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.inviteStaff({
          menuId: "00000000-0000-4000-a000-000000000099",
          email: "not-an-email",
          role: "staff",
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid role value", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.inviteStaff({
          menuId: "00000000-0000-4000-a000-000000000099",
          email: "test@example.com",
          role: "admin" as never, // Not a valid enum value for invite
        }),
      ).rejects.toThrow();
    });

    it("should reject non-UUID menuId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.inviteStaff({
          menuId: "invalid-uuid",
          email: "test@example.com",
          role: "staff",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateStaffRole
  // =========================================================================

  describe("updateStaffRole", () => {
    it("should update role from staff to manager", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-member-1",
        role: "staff",
        menus: { userId: owner.id },
      } as never);
      mockStaffMembers.update.mockResolvedValue({
        id: "staff-member-1",
        role: "manager",
      } as never);

      const result = await caller.updateStaffRole({
        staffMemberId: "00000000-0000-4000-a000-000000000001",
        role: "manager",
      });

      expect(result.role).toBe("manager");
      expect(mockStaffMembers.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: { role: "manager", updatedAt: expect.any(Date) },
      });
    });

    it("should update role from manager to staff", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-member-1",
        role: "manager",
        menus: { userId: owner.id },
      } as never);
      mockStaffMembers.update.mockResolvedValue({
        id: "staff-member-1",
        role: "staff",
      } as never);

      const result = await caller.updateStaffRole({
        staffMemberId: "00000000-0000-4000-a000-000000000001",
        role: "staff",
      });

      expect(result.role).toBe("staff");
    });

    it("should throw FORBIDDEN when staff member not found", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateStaffRole({
          staffMemberId: "00000000-0000-4000-a000-000000000099",
          role: "manager",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-member-1",
        menus: { userId: "different-owner-id" }, // Not the attacker
      } as never);

      await expect(
        caller.updateStaffRole({
          staffMemberId: "00000000-0000-4000-a000-000000000001",
          role: "manager",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to update this staff member",
      });
    });

    it("should reject non-UUID staffMemberId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.updateStaffRole({
          staffMemberId: "bad-id",
          role: "manager",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // removeStaff
  // =========================================================================

  describe("removeStaff", () => {
    it("should delete staff member when owner requests removal", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-to-remove",
        menus: { userId: owner.id },
      } as never);
      mockStaffMembers.delete.mockResolvedValue({
        id: "staff-to-remove",
      } as never);

      const result = await caller.removeStaff({
        staffMemberId: "00000000-0000-4000-a000-000000000001",
      });

      expect(result.id).toBe("staff-to-remove");
      expect(mockStaffMembers.delete).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
      });
    });

    it("should throw FORBIDDEN when staff member not found", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue(null);

      await expect(
        caller.removeStaff({
          staffMemberId: "00000000-0000-4000-a000-000000000099",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-member-1",
        menus: { userId: "the-real-owner" },
      } as never);

      await expect(
        caller.removeStaff({
          staffMemberId: "00000000-0000-4000-a000-000000000001",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to remove this staff member",
      });

      expect(mockStaffMembers.delete).not.toHaveBeenCalled();
    });

    it("should reject non-UUID staffMemberId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.removeStaff({ staffMemberId: "xyz" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // toggleStaffActive
  // =========================================================================

  describe("toggleStaffActive", () => {
    it("should toggle isActive from true to false", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-1",
        isActive: true,
        menus: { userId: owner.id },
      } as never);
      mockStaffMembers.update.mockResolvedValue({
        id: "staff-1",
        isActive: false,
      } as never);

      const result = await caller.toggleStaffActive({
        staffMemberId: "00000000-0000-4000-a000-000000000001",
      });

      expect(result.isActive).toBe(false);
      expect(mockStaffMembers.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: { isActive: false, updatedAt: expect.any(Date) },
      });
    });

    it("should toggle isActive from false to true", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-1",
        isActive: false,
        menus: { userId: owner.id },
      } as never);
      mockStaffMembers.update.mockResolvedValue({
        id: "staff-1",
        isActive: true,
      } as never);

      const result = await caller.toggleStaffActive({
        staffMemberId: "00000000-0000-4000-a000-000000000001",
      });

      expect(result.isActive).toBe(true);
      expect(mockStaffMembers.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-a000-000000000001" },
        data: { isActive: true, updatedAt: expect.any(Date) },
      });
    });

    it("should throw FORBIDDEN when user does not own the menu (IDOR protection)", async () => {
      const attacker = createUser();
      const caller = createMockCaller(attacker.id);

      mockStaffMembers.findUnique.mockResolvedValue({
        id: "staff-1",
        isActive: true,
        menus: { userId: "legitimate-owner" },
      } as never);

      await expect(
        caller.toggleStaffActive({
          staffMemberId: "00000000-0000-4000-a000-000000000001",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to modify this staff member",
      });

      expect(mockStaffMembers.update).not.toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when staff member not found", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      mockStaffMembers.findUnique.mockResolvedValue(null);

      await expect(
        caller.toggleStaffActive({
          staffMemberId: "00000000-0000-4000-a000-000000000099",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should reject non-UUID staffMemberId", async () => {
      const owner = createUser();
      const caller = createMockCaller(owner.id);

      await expect(
        caller.toggleStaffActive({ staffMemberId: "not-uuid" }),
      ).rejects.toThrow();
    });
  });
});
