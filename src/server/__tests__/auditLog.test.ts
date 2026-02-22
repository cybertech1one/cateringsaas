import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for audit logging functionality.
 * Tests the auditLog function and validates action/entity constants.
 */

// Mock the db module
vi.mock("~/server/db", () => ({
  db: {
    appAuditLog: {
      create: vi.fn(),
    },
  },
}));

import { db } from "~/server/db";
import { AuditAction, AuditEntity, auditLog } from "../auditLog";

describe("auditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("auditLog function", () => {
    it("should create audit log entry with all fields", async () => {
      const mockCreate = vi.mocked(db.appAuditLog.create);

      mockCreate.mockResolvedValue({} as never);

      await auditLog({
        userId: "user-123",
        action: "create",
        entityType: "menu",
        entityId: "menu-456",
        oldData: { name: "Old Name" },
        newData: { name: "New Name" },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          action: "create",
          entityType: "menu",
          entityId: "menu-456",
          oldData: { name: "Old Name" },
          newData: { name: "New Name" },
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
        },
      });
    });

    it("should handle optional fields with defaults", async () => {
      const mockCreate = vi.mocked(db.appAuditLog.create);

      mockCreate.mockResolvedValue({} as never);

      await auditLog({
        action: "delete",
        entityType: "dish",
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: null,
          action: "delete",
          entityType: "dish",
          entityId: null,
          oldData: undefined,
          newData: undefined,
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it("should not throw when database create fails", async () => {
      const mockCreate = vi.mocked(db.appAuditLog.create);

      mockCreate.mockRejectedValue(new Error("Database error"));

      // Audit logging silently catches errors to never block main operations
      await expect(
        auditLog({
          action: "update",
          entityType: "category",
        }),
      ).resolves.not.toThrow();
    });

    it("should handle missing userId gracefully", async () => {
      const mockCreate = vi.mocked(db.appAuditLog.create);

      mockCreate.mockResolvedValue({} as never);

      await auditLog({
        action: "publish",
        entityType: "menu",
        entityId: "menu-789",
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          action: "publish",
          entityType: "menu",
          entityId: "menu-789",
        }),
      });
    });

    it("should handle complex data objects", async () => {
      const mockCreate = vi.mocked(db.appAuditLog.create);

      mockCreate.mockResolvedValue({} as never);

      const oldData = {
        menu: { id: "123", name: "Old", items: [1, 2, 3] },
        settings: { published: false },
      };

      const newData = {
        menu: { id: "123", name: "New", items: [1, 2, 3, 4] },
        settings: { published: true },
      };

      await auditLog({
        userId: "user-456",
        action: "update",
        entityType: "menu",
        oldData,
        newData,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          oldData,
          newData,
        }),
      });
    });

    it("should handle null and undefined values for optional fields", async () => {
      const mockCreate = vi.mocked(db.appAuditLog.create);

      mockCreate.mockResolvedValue({} as never);

      await auditLog({
        userId: undefined,
        action: "login",
        entityType: "profile",
        entityId: undefined,
        oldData: null,
        newData: null,
        ipAddress: undefined,
        userAgent: undefined,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: null,
          action: "login",
          entityType: "profile",
          entityId: null,
          oldData: undefined,
          newData: undefined,
          ipAddress: null,
          userAgent: null,
        },
      });
    });
  });

  describe("AuditAction constants", () => {
    it("should have CREATE action", () => {
      expect(AuditAction.CREATE).toBe("create");
    });

    it("should have UPDATE action", () => {
      expect(AuditAction.UPDATE).toBe("update");
    });

    it("should have DELETE action", () => {
      expect(AuditAction.DELETE).toBe("delete");
    });

    it("should have PUBLISH action", () => {
      expect(AuditAction.PUBLISH).toBe("publish");
    });

    it("should have UNPUBLISH action", () => {
      expect(AuditAction.UNPUBLISH).toBe("unpublish");
    });

    it("should have LOGIN action", () => {
      expect(AuditAction.LOGIN).toBe("login");
    });

    it("should have INVITE action", () => {
      expect(AuditAction.INVITE).toBe("invite");
    });

    it("should have ROLE_CHANGE action", () => {
      expect(AuditAction.ROLE_CHANGE).toBe("role_change");
    });

    it("should have SETTINGS_UPDATE action", () => {
      expect(AuditAction.SETTINGS_UPDATE).toBe("settings_update");
    });

    it("should have AI_GENERATE action", () => {
      expect(AuditAction.AI_GENERATE).toBe("ai_generate");
    });

    it("should have REVIEW_MODERATE action", () => {
      expect(AuditAction.REVIEW_MODERATE).toBe("review_moderate");
    });

    it("should have PROMOTION_CREATE action", () => {
      expect(AuditAction.PROMOTION_CREATE).toBe("promotion_create");
    });

    it("should have MENU_LINK action", () => {
      expect(AuditAction.MENU_LINK).toBe("menu_link");
    });
  });

  describe("AuditEntity constants", () => {
    it("should have MENU entity", () => {
      expect(AuditEntity.MENU).toBe("menu");
    });

    it("should have DISH entity", () => {
      expect(AuditEntity.DISH).toBe("dish");
    });

    it("should have CATEGORY entity", () => {
      expect(AuditEntity.CATEGORY).toBe("category");
    });

    it("should have RESTAURANT entity", () => {
      expect(AuditEntity.RESTAURANT).toBe("restaurant");
    });

    it("should have LOCATION entity", () => {
      expect(AuditEntity.LOCATION).toBe("location");
    });

    it("should have STAFF entity", () => {
      expect(AuditEntity.STAFF).toBe("staff");
    });

    it("should have ORDER entity", () => {
      expect(AuditEntity.ORDER).toBe("order");
    });

    it("should have REVIEW entity", () => {
      expect(AuditEntity.REVIEW).toBe("review");
    });

    it("should have PROMOTION entity", () => {
      expect(AuditEntity.PROMOTION).toBe("promotion");
    });

    it("should have THEME entity", () => {
      expect(AuditEntity.THEME).toBe("theme");
    });

    it("should have PROFILE entity", () => {
      expect(AuditEntity.PROFILE).toBe("profile");
    });

    it("should have TABLE_ZONE entity", () => {
      expect(AuditEntity.TABLE_ZONE).toBe("table_zone");
    });

    it("should have AI_USAGE entity", () => {
      expect(AuditEntity.AI_USAGE).toBe("ai_usage");
    });
  });
});
