import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { resetRateLimits } from "~/server/rateLimit";

/**
 * Tests for the auth tRPC router.
 * Covers getProfile query and deleteAccount mutation.
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDeleteUser = vi.fn();

vi.mock("~/server/db", () => ({
  db: {
    profiles: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    subscriptions: {
      deleteMany: vi.fn(),
    },
    appAuditLog: {
      deleteMany: vi.fn(),
    },
    orgMembers: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock supabase client to prevent import errors
vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
  getServiceSupabase: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

// Mock logger to verify logging calls
vi.mock("~/server/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { db } from "~/server/db";
import { authRouter } from "../api/routers/auth";
import { createUser, resetFactoryCounter } from "~/__tests__/utils/factories";
import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Helper: create a tRPC caller with a mock context
// ---------------------------------------------------------------------------

function createMockCaller(userId: string, email = "test@example.com") {
  return authRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId, email } as never,
  });
}

function createUnauthCaller() {
  return authRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("authRouter", () => {
  const mockProfiles = vi.mocked(db.profiles);
  const mockTransaction = vi.mocked(db.$transaction);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    resetRateLimits();
  });

  // =========================================================================
  // getProfile
  // =========================================================================

  describe("getProfile", () => {
    it("should return user profile when it exists", async () => {
      const user = createUser();
      const caller = createMockCaller(user.id, user.email!);

      mockProfiles.findUnique.mockResolvedValue(user as never);

      const result = await caller.getProfile();

      expect(result).toEqual(user);
    });

    it("should query the database with the correct user id", async () => {
      const user = createUser();
      const caller = createMockCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue(user as never);

      await caller.getProfile();

      expect(mockProfiles.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
      });
    });

    it("should throw NOT_FOUND when profile does not exist", async () => {
      const userId = "00000000-0000-4000-a000-000000000099";
      const caller = createMockCaller(userId);

      mockProfiles.findUnique.mockResolvedValue(null as never);

      await expect(caller.getProfile()).rejects.toThrow(TRPCError);
      await expect(caller.getProfile()).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    });

    it("should return profile with all expected fields", async () => {
      const user = createUser({
        username: "test_chef",
        fullName: "Test Chef",
        email: "chef@example.com",
        aiProvider: "anthropic",
        aiModel: "claude-3-haiku",
        role: "admin",
      });
      const caller = createMockCaller(user.id, user.email!);

      mockProfiles.findUnique.mockResolvedValue(user as never);

      const result = await caller.getProfile();

      expect(result.username).toBe("test_chef");
      expect(result.fullName).toBe("Test Chef");
      expect(result.email).toBe("chef@example.com");
      expect(result.aiProvider).toBe("anthropic");
      expect(result.aiModel).toBe("claude-3-haiku");
      expect(result.role).toBe("admin");
    });

    it("should return profile with null optional fields", async () => {
      const user = createUser({
        username: null,
        fullName: null,
      });
      const caller = createMockCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue(user as never);

      const result = await caller.getProfile();

      expect(result.username).toBeNull();
      expect(result.fullName).toBeNull();
    });

    it("should call findUnique exactly once per request", async () => {
      const user = createUser();
      const caller = createMockCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue(user as never);

      await caller.getProfile();

      expect(mockProfiles.findUnique).toHaveBeenCalledTimes(1);
    });

    it("should propagate database errors", async () => {
      const caller = createMockCaller("00000000-0000-4000-a000-000000000001");

      mockProfiles.findUnique.mockRejectedValue(new Error("Connection refused") as never);

      await expect(caller.getProfile()).rejects.toThrow("Connection refused");
    });

    it("should use the authenticated user id, not any other id", async () => {
      const userA = createUser();
      const userB = createUser();
      const caller = createMockCaller(userA.id);

      mockProfiles.findUnique.mockResolvedValue(userA as never);

      await caller.getProfile();

      // Verify it queries with the caller's id, not userB's
      expect(mockProfiles.findUnique).toHaveBeenCalledWith({
        where: { id: userA.id },
      });
      expect(mockProfiles.findUnique).not.toHaveBeenCalledWith({
        where: { id: userB.id },
      });
    });

    it("should return updatedAt as a Date object", async () => {
      const user = createUser();
      const caller = createMockCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue(user as never);

      const result = await caller.getProfile();

      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle profiles with different roles", async () => {
      const roles = ["user", "admin", "super_admin"] as const;

      for (const role of roles) {
        vi.clearAllMocks();
        const user = createUser({ role });
        const caller = createMockCaller(user.id);

        mockProfiles.findUnique.mockResolvedValue(user as never);

        const result = await caller.getProfile();

        expect(result.role).toBe(role);
      }
    });

    it("should handle profiles with different AI providers", async () => {
      const providers = ["openai", "anthropic", "google"] as const;

      for (const provider of providers) {
        vi.clearAllMocks();
        const user = createUser({ aiProvider: provider });
        const caller = createMockCaller(user.id);

        mockProfiles.findUnique.mockResolvedValue(user as never);

        const result = await caller.getProfile();

        expect(result.aiProvider).toBe(provider);
      }
    });
  });

  // =========================================================================
  // Authentication enforcement
  // =========================================================================

  describe("authentication enforcement", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = createUnauthCaller();

      await expect(caller.getProfile()).rejects.toThrow(TRPCError);
      await expect(caller.getProfile()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should not query the database for unauthenticated requests", async () => {
      const caller = createUnauthCaller();

      try {
        await caller.getProfile();
      } catch {
        // Expected to throw
      }

      expect(mockProfiles.findUnique).not.toHaveBeenCalled();
    });

    it("should work with different authenticated user ids", async () => {
      const ids = [
        "00000000-0000-4000-a000-000000000001",
        "00000000-0000-4000-a000-000000000002",
        "00000000-0000-4000-a000-000000000003",
      ];

      for (const id of ids) {
        vi.clearAllMocks();
        const user = createUser({ id });
        const caller = createMockCaller(id);

        mockProfiles.findUnique.mockResolvedValue(user as never);

        const result = await caller.getProfile();

        expect(result.id).toBe(id);
        expect(mockProfiles.findUnique).toHaveBeenCalledWith({
          where: { id },
        });
      }
    });
  });

  // =========================================================================
  // deleteAccount
  // =========================================================================

  describe("deleteAccount", () => {
    const userId = "00000000-0000-4000-a000-000000000001";

    it("should reject unauthenticated requests", async () => {
      const caller = createUnauthCaller();

      await expect(
        caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" }),
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject incorrect confirmation text", async () => {
      const caller = createMockCaller(userId);

      await expect(
        caller.deleteAccount({ confirmation: "delete my account" } as never),
      ).rejects.toThrow();
    });

    it("should reject empty confirmation text", async () => {
      const caller = createMockCaller(userId);

      await expect(
        caller.deleteAccount({ confirmation: "" } as never),
      ).rejects.toThrow();
    });

    it("should execute a database transaction for deletion", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockResolvedValue(undefined as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should delete Supabase auth user after DB transaction", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockResolvedValue(undefined as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(mockDeleteUser).toHaveBeenCalledWith(userId);
    });

    it("should return success true on successful deletion", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockResolvedValue(undefined as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      const result = await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(result).toEqual({ success: true });
    });

    it("should log the account deletion", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockResolvedValue(undefined as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(userId),
        "auth",
      );
    });

    it("should throw INTERNAL_SERVER_ERROR when Supabase deletion fails", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockResolvedValue(undefined as never);
      mockDeleteUser.mockResolvedValue({
        data: null,
        error: { message: "User not found" },
      } as never);

      await expect(
        caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" }),
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" }),
      ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    });

    it("should log errors when Supabase deletion fails", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockResolvedValue(undefined as never);
      const supabaseError = { message: "Service unavailable" };

      mockDeleteUser.mockResolvedValue({
        data: null,
        error: supabaseError,
      } as never);

      try {
        await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });
      } catch {
        // Expected to throw
      }

      expect(logger.error).toHaveBeenCalled();
    });

    it("should propagate database transaction errors", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockRejectedValue(new Error("Transaction failed") as never);

      await expect(
        caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" }),
      ).rejects.toThrow();
    });

    it("should pass a callback function to $transaction", async () => {
      const caller = createMockCaller(userId);

      mockTransaction.mockResolvedValue(undefined as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      // Verify $transaction was called with a function
      expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should call transaction operations in correct order", async () => {
      const caller = createMockCaller(userId);
      const operationOrder: string[] = [];

      const mockTx = {
        orgMembers: {
          deleteMany: vi.fn(() => {
            operationOrder.push("orgMembers.deleteMany");

            return Promise.resolve({ count: 0 });
          }),
        },
        subscriptions: {
          deleteMany: vi.fn(() => {
            operationOrder.push("subscriptions.deleteMany");

            return Promise.resolve({ count: 0 });
          }),
        },
        appAuditLog: {
          deleteMany: vi.fn(() => {
            operationOrder.push("appAuditLog.deleteMany");

            return Promise.resolve({ count: 0 });
          }),
        },
        profiles: {
          delete: vi.fn(() => {
            operationOrder.push("profiles.delete");

            return Promise.resolve({});
          }),
        },
      };

      mockTransaction.mockImplementation((async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }) as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      // orgMembers delete should happen before profiles.delete
      const membersIdx = operationOrder.indexOf("orgMembers.deleteMany");
      const profileIdx = operationOrder.indexOf("profiles.delete");

      expect(membersIdx).toBeLessThan(profileIdx);

      // subscriptions delete should happen before profiles.delete
      const subIdx = operationOrder.indexOf("subscriptions.deleteMany");

      expect(subIdx).toBeLessThan(profileIdx);

      // appAuditLog delete should happen before profiles.delete
      const auditIdx = operationOrder.indexOf("appAuditLog.deleteMany");

      expect(auditIdx).toBeLessThan(profileIdx);
    });

    it("should delete org memberships before deleting profile", async () => {
      const caller = createMockCaller(userId);
      const mockTx = {
        orgMembers: {
          deleteMany: vi.fn().mockResolvedValue({ count: 3 } as never),
        },
        subscriptions: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        appAuditLog: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        profiles: {
          delete: vi.fn().mockResolvedValue({} as never),
        },
      };

      mockTransaction.mockImplementation((async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }) as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(mockTx.orgMembers.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it("should delete subscriptions for the user", async () => {
      const caller = createMockCaller(userId);
      const mockTx = {
        orgMembers: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        subscriptions: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 } as never),
        },
        appAuditLog: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        profiles: {
          delete: vi.fn().mockResolvedValue({} as never),
        },
      };

      mockTransaction.mockImplementation((async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }) as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(mockTx.subscriptions.deleteMany).toHaveBeenCalledWith({
        where: { profileId: userId },
      });
    });

    it("should delete audit log entries for the user", async () => {
      const caller = createMockCaller(userId);
      const mockTx = {
        orgMembers: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        subscriptions: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        appAuditLog: {
          deleteMany: vi.fn().mockResolvedValue({ count: 5 } as never),
        },
        profiles: {
          delete: vi.fn().mockResolvedValue({} as never),
        },
      };

      mockTransaction.mockImplementation((async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }) as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(mockTx.appAuditLog.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it("should delete the profile record (cascading menus, restaurants, etc.)", async () => {
      const caller = createMockCaller(userId);
      const mockTx = {
        orgMembers: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        subscriptions: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        appAuditLog: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 } as never),
        },
        profiles: {
          delete: vi.fn().mockResolvedValue({} as never),
        },
      };

      mockTransaction.mockImplementation((async (fn: (tx: unknown) => Promise<void>) => {
        await fn(mockTx);
      }) as never);
      mockDeleteUser.mockResolvedValue({ data: null, error: null } as never);

      await caller.deleteAccount({ confirmation: "DELETE MY ACCOUNT" });

      expect(mockTx.profiles.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
