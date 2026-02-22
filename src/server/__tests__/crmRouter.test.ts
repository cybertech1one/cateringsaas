import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "~/server/rateLimit";

/**
 * Tests for the CRM tRPC router.
 * Covers Twenty CRM integration: config management (get/save/remove),
 * customer sync, order sync (with 500-record limit), connection testing,
 * PRECONDITION_FAILED guard when CRM is not configured, and input validation.
 *
 * Uses a mocked Prisma client to avoid database dependency.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("~/server/db", () => ({
  db: {
    profiles: { findUnique: vi.fn(), update: vi.fn() },
    menus: { findMany: vi.fn() },
    orders: { findMany: vi.fn() },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

vi.mock("~/server/crm/twenty", () => ({
  TwentyClient: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.testConnection = vi.fn().mockResolvedValue(true);
  }),
}));

vi.mock("~/server/crm/sync", () => ({
  syncCustomersToTwenty: vi
    .fn()
    .mockResolvedValue({ synced: 3, failed: 0, errors: [] }),
  syncOrdersToTwenty: vi
    .fn()
    .mockResolvedValue({ synced: 5, failed: 0, errors: [] }),
}));

vi.mock("~/server/encryption", () => ({
  encrypt: vi.fn((value: string) => `encrypted:${value}`),
  decrypt: vi.fn((value: string) => value.replace("encrypted:", "")),
  isEncrypted: vi.fn((value: string) => value.startsWith("encrypted:")),
  decryptIfEncrypted: vi.fn((value: string) =>
    value.startsWith("encrypted:") ? value.replace("encrypted:", "") : value,
  ),
}));

import { db } from "~/server/db";
import { crmRouter } from "../api/routers/crm";
import { TwentyClient } from "~/server/crm/twenty";
import {
  syncCustomersToTwenty,
  syncOrdersToTwenty,
} from "~/server/crm/sync";
import { logger } from "~/server/logger";
import { encrypt, decryptIfEncrypted } from "~/server/encryption";
import {
  createUser,
  createMenu,
  resetFactoryCounter,
} from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPrivateCaller(userId: string) {
  return crmRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId } as never,
  });
}

const WORKSPACE_URL = "https://crm.example.com";
const API_KEY = "twenty-api-key-abc123";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("crmRouter", () => {
  const mockProfiles = vi.mocked(db.profiles);
  const mockMenus = vi.mocked(db.menus);
  const mockOrders = vi.mocked(db.orders);
  const mockTwentyClient = vi.mocked(TwentyClient);
  const mockSyncCustomers = vi.mocked(syncCustomersToTwenty);
  const mockSyncOrders = vi.mocked(syncOrdersToTwenty);
  const mockLogger = vi.mocked(logger);
  const mockEncrypt = vi.mocked(encrypt);
  const mockDecryptIfEncrypted = vi.mocked(decryptIfEncrypted);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    resetRateLimits();

    // Default: TwentyClient constructor returns a client whose testConnection resolves true
    mockTwentyClient.mockImplementation(function (this: Record<string, unknown>) {
      this.testConnection = vi.fn().mockResolvedValue(true);
    } as never);

    // Default sync results
    mockSyncCustomers.mockResolvedValue({ synced: 3, failed: 0, errors: [] });
    mockSyncOrders.mockResolvedValue({ synced: 5, failed: 0, errors: [] });
  });

  // =========================================================================
  // getConfig
  // =========================================================================

  describe("getConfig", () => {
    it("returns fully configured status when CRM fields are populated", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);
      const lastSync = new Date("2025-03-10T08:00:00Z");

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
        crmAutoSync: true,
        crmLastSyncedAt: lastSync,
      } as never);

      const result = await caller.getConfig();

      expect(result).toEqual({
        isConfigured: true,
        workspaceUrl: WORKSPACE_URL,
        autoSync: true,
        lastSyncedAt: lastSync.toISOString(),
        hasApiKey: true,
      });
    });

    it("returns unconfigured status when no CRM fields are set", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: null,
        crmWorkspaceUrl: null,
        crmAutoSync: false,
        crmLastSyncedAt: null,
      } as never);

      const result = await caller.getConfig();

      expect(result).toEqual({
        isConfigured: false,
        workspaceUrl: null,
        autoSync: false,
        lastSyncedAt: null,
        hasApiKey: false,
      });
    });

    it("returns isConfigured false when API key is set but workspace URL is missing", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: null,
        crmAutoSync: false,
        crmLastSyncedAt: null,
      } as never);

      const result = await caller.getConfig();

      expect(result.isConfigured).toBe(false);
      expect(result.hasApiKey).toBe(true);
      expect(result.workspaceUrl).toBeNull();
    });

    it("returns isConfigured false when workspace URL is set but API key is missing", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: null,
        crmWorkspaceUrl: WORKSPACE_URL,
        crmAutoSync: false,
        crmLastSyncedAt: null,
      } as never);

      const result = await caller.getConfig();

      expect(result.isConfigured).toBe(false);
      expect(result.hasApiKey).toBe(false);
      expect(result.workspaceUrl).toBe(WORKSPACE_URL);
    });

    it("handles missing profile (null) gracefully", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue(null as never);

      const result = await caller.getConfig();

      expect(result).toEqual({
        isConfigured: false,
        workspaceUrl: null,
        autoSync: false,
        lastSyncedAt: null,
        hasApiKey: false,
      });
    });

    it("queries the correct user ID", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue(null as never);

      await caller.getConfig();

      expect(mockProfiles.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
        select: {
          crmApiKey: true,
          crmWorkspaceUrl: true,
          crmAutoSync: true,
          crmLastSyncedAt: true,
        },
      });
    });
  });

  // =========================================================================
  // saveConfig
  // =========================================================================

  describe("saveConfig", () => {
    it("saves config with encrypted API key after successful connection test", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.update.mockResolvedValue(user as never);

      const result = await caller.saveConfig({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
        autoSync: true,
      });

      expect(result).toEqual({ success: true });
      expect(mockEncrypt).toHaveBeenCalledWith(API_KEY);
      expect(mockProfiles.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          crmApiKey: `encrypted:${API_KEY}`,
          crmWorkspaceUrl: WORKSPACE_URL,
          crmAutoSync: true,
        },
      });
    });

    it("constructs TwentyClient with provided credentials", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.update.mockResolvedValue(user as never);

      await caller.saveConfig({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
        autoSync: false,
      });

      expect(mockTwentyClient).toHaveBeenCalledWith({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
      });
    });

    it("throws BAD_REQUEST when connection test fails", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockTwentyClient.mockImplementation(function (this: Record<string, unknown>) {
        this.testConnection = vi.fn().mockResolvedValue(false);
      } as never);

      await expect(
        caller.saveConfig({
          apiKey: "bad-key",
          workspaceUrl: WORKSPACE_URL,
          autoSync: false,
        }),
      ).rejects.toThrow(
        "Could not connect to Twenty CRM. Please check your API key and workspace URL.",
      );
    });

    it("does not update profile when connection test fails", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockTwentyClient.mockImplementation(function (this: Record<string, unknown>) {
        this.testConnection = vi.fn().mockResolvedValue(false);
      } as never);

      await expect(
        caller.saveConfig({
          apiKey: "bad-key",
          workspaceUrl: WORKSPACE_URL,
          autoSync: false,
        }),
      ).rejects.toThrow();

      expect(mockProfiles.update).not.toHaveBeenCalled();
    });

    it("defaults autoSync to false when not provided", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.update.mockResolvedValue(user as never);

      await caller.saveConfig({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
      });

      expect(mockProfiles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            crmAutoSync: false,
          }),
        }),
      );
    });

    it("logs success message after saving config", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.update.mockResolvedValue(user as never);

      await caller.saveConfig({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
        autoSync: false,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "CRM configuration saved",
        "crm",
      );
    });

    it("rejects empty API key", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.saveConfig({
          apiKey: "",
          workspaceUrl: WORKSPACE_URL,
          autoSync: false,
        }),
      ).rejects.toThrow();
    });

    it("rejects invalid workspace URL", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.saveConfig({
          apiKey: API_KEY,
          workspaceUrl: "not-a-valid-url",
          autoSync: false,
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // removeConfig
  // =========================================================================

  describe("removeConfig", () => {
    it("clears all CRM fields", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.update.mockResolvedValue(user as never);

      const result = await caller.removeConfig();

      expect(result).toEqual({ success: true });
      expect(mockProfiles.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          crmApiKey: null,
          crmWorkspaceUrl: null,
          crmAutoSync: false,
          crmLastSyncedAt: null,
        },
      });
    });

    it("uses the authenticated user's ID", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.update.mockResolvedValue(user as never);

      await caller.removeConfig();

      expect(mockProfiles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: user.id },
        }),
      );
    });
  });

  // =========================================================================
  // syncCustomers
  // =========================================================================

  describe("syncCustomers", () => {
    it("syncs customers successfully with decrypted API key", async () => {
      const user = createUser({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      });
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);
      const encryptedKey = `encrypted:${API_KEY}`;

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: encryptedKey,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          totalAmount: 5000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1001,
        },
        {
          customerName: "Sara",
          customerPhone: "+212698765432",
          totalAmount: 3500,
          status: "pending",
          createdAt: new Date(),
          orderNumber: 1002,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      const result = await caller.syncCustomers();

      expect(result).toEqual({ synced: 3, failed: 0, errors: [] });
      expect(mockDecryptIfEncrypted).toHaveBeenCalledWith(encryptedKey);
      expect(mockSyncCustomers).toHaveBeenCalledWith(
        { apiKey: API_KEY, workspaceUrl: WORKSPACE_URL },
        expect.arrayContaining([
          expect.objectContaining({ customerPhone: "+212612345678" }),
          expect.objectContaining({ customerPhone: "+212698765432" }),
        ]),
      );
    });

    it("returns synced:0 when user has no menus", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      const result = await caller.syncCustomers();

      expect(result).toEqual({ synced: 0, failed: 0, errors: [] });
      expect(mockSyncCustomers).not.toHaveBeenCalled();
    });

    it("throws PRECONDITION_FAILED when CRM is not configured", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: null,
        crmWorkspaceUrl: null,
      } as never);

      await expect(caller.syncCustomers()).rejects.toThrow(
        "CRM not configured",
      );
    });

    it("throws PRECONDITION_FAILED when only API key is set", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: null,
      } as never);

      await expect(caller.syncCustomers()).rejects.toThrow(
        "CRM not configured",
      );
    });

    it("throws PRECONDITION_FAILED when only workspace URL is set", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: null,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);

      await expect(caller.syncCustomers()).rejects.toThrow(
        "CRM not configured",
      );
    });

    it("filters out orders with null customerPhone", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          totalAmount: 5000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1001,
        },
        {
          customerName: "Anonymous",
          customerPhone: null,
          totalAmount: 2000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1002,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncCustomers();

      // Only the order with a phone should be passed to sync
      expect(mockSyncCustomers).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ customerPhone: "+212612345678" }),
        ]),
      );
      const passedOrders = mockSyncCustomers.mock.calls[0]![1];

      expect(passedOrders).toHaveLength(1);
    });

    it("queries orders excluding cancelled status", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncCustomers();

      expect(mockOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: "cancelled" },
          }),
        }),
      );
    });

    it("updates lastSyncedAt after successful sync", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          totalAmount: 5000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1001,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncCustomers();

      expect(mockProfiles.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { crmLastSyncedAt: expect.any(Date) },
      });
    });

    it("queries only menus belonging to the user", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.syncCustomers();

      expect(mockMenus.findMany).toHaveBeenCalledWith({
        where: { userId: user.id },
        select: { id: true },
      });
    });

    it("passes all menu IDs in the orders query", async () => {
      const user = createUser();
      const menu1 = createMenu({ userId: user.id });
      const menu2 = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([
        { id: menu1.id },
        { id: menu2.id },
      ] as never);
      mockOrders.findMany.mockResolvedValue([] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncCustomers();

      expect(mockOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuId: { in: [menu1.id, menu2.id] },
          }),
        }),
      );
    });

    it("handles plaintext keys via decryptIfEncrypted (backwards compatibility)", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);
      const plaintextKey = "plain-text-legacy-key";

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: plaintextKey,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          totalAmount: 5000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1001,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncCustomers();

      expect(mockDecryptIfEncrypted).toHaveBeenCalledWith(plaintextKey);
      // decryptIfEncrypted returns plaintext as-is when not encrypted
      expect(mockSyncCustomers).toHaveBeenCalledWith(
        { apiKey: plaintextKey, workspaceUrl: WORKSPACE_URL },
        expect.anything(),
      );
    });
  });

  // =========================================================================
  // syncOrders
  // =========================================================================

  describe("syncOrders", () => {
    it("syncs orders successfully with decrypted API key", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);
      const encryptedKey = `encrypted:${API_KEY}`;

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: encryptedKey,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          totalAmount: 8500,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1001,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      const result = await caller.syncOrders();

      expect(result).toEqual({ synced: 5, failed: 0, errors: [] });
      expect(mockDecryptIfEncrypted).toHaveBeenCalledWith(encryptedKey);
      expect(mockSyncOrders).toHaveBeenCalledWith(
        { apiKey: API_KEY, workspaceUrl: WORKSPACE_URL },
        expect.arrayContaining([
          expect.objectContaining({ customerPhone: "+212612345678" }),
        ]),
      );
    });

    it("returns synced:0 when user has no menus", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      const result = await caller.syncOrders();

      expect(result).toEqual({ synced: 0, failed: 0, errors: [] });
      expect(mockSyncOrders).not.toHaveBeenCalled();
    });

    it("throws PRECONDITION_FAILED when CRM is not configured", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: null,
        crmWorkspaceUrl: null,
      } as never);

      await expect(caller.syncOrders()).rejects.toThrow("CRM not configured");
    });

    it("limits query to 500 most recent orders", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncOrders();

      expect(mockOrders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
      );
    });

    it("filters out orders with null customerPhone", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Ahmed",
          customerPhone: "+212612345678",
          totalAmount: 5000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1001,
        },
        {
          customerName: null,
          customerPhone: null,
          totalAmount: 1000,
          status: "pending",
          createdAt: new Date(),
          orderNumber: 1002,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncOrders();

      const passedOrders = mockSyncOrders.mock.calls[0]![1];

      expect(passedOrders).toHaveLength(1);
      expect(passedOrders[0]!.customerPhone).toBe("+212612345678");
    });

    it("does not exclude cancelled orders (unlike syncCustomers)", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncOrders();

      // syncOrders does NOT have status: { not: "cancelled" } in its where clause
      const callArgs = mockOrders.findMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };

      expect(callArgs.where).not.toHaveProperty("status");
    });

    it("updates lastSyncedAt after successful sync", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Sara",
          customerPhone: "+212698765432",
          totalAmount: 3000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1003,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncOrders();

      expect(mockProfiles.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { crmLastSyncedAt: expect.any(Date) },
      });
    });

    it("queries menus for the authenticated user only", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: API_KEY,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      await caller.syncOrders();

      expect(mockMenus.findMany).toHaveBeenCalledWith({
        where: { userId: user.id },
        select: { id: true },
      });
    });

    it("handles plaintext keys via decryptIfEncrypted (backwards compatibility)", async () => {
      const user = createUser();
      const menu = createMenu({ userId: user.id });
      const caller = createPrivateCaller(user.id);
      const plaintextKey = "plain-text-legacy-key";

      mockProfiles.findUnique.mockResolvedValue({
        crmApiKey: plaintextKey,
        crmWorkspaceUrl: WORKSPACE_URL,
      } as never);
      mockMenus.findMany.mockResolvedValue([{ id: menu.id }] as never);
      mockOrders.findMany.mockResolvedValue([
        {
          customerName: "Sara",
          customerPhone: "+212698765432",
          totalAmount: 3000,
          status: "completed",
          createdAt: new Date(),
          orderNumber: 1003,
        },
      ] as never);
      mockProfiles.update.mockResolvedValue(user as never);

      await caller.syncOrders();

      expect(mockDecryptIfEncrypted).toHaveBeenCalledWith(plaintextKey);
      expect(mockSyncOrders).toHaveBeenCalledWith(
        { apiKey: plaintextKey, workspaceUrl: WORKSPACE_URL },
        expect.anything(),
      );
    });
  });

  // =========================================================================
  // testConnection
  // =========================================================================

  describe("testConnection", () => {
    it("returns connected:true on successful connection", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      const result = await caller.testConnection({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
      });

      expect(result).toEqual({ connected: true });
    });

    it("returns connected:false when connection fails", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      mockTwentyClient.mockImplementation(function (this: Record<string, unknown>) {
        this.testConnection = vi.fn().mockResolvedValue(false);
      } as never);

      const result = await caller.testConnection({
        apiKey: "invalid-key",
        workspaceUrl: WORKSPACE_URL,
      });

      expect(result).toEqual({ connected: false });
    });

    it("constructs TwentyClient with input credentials", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await caller.testConnection({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
      });

      expect(mockTwentyClient).toHaveBeenCalledWith({
        apiKey: API_KEY,
        workspaceUrl: WORKSPACE_URL,
      });
    });

    it("rejects empty API key", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.testConnection({
          apiKey: "",
          workspaceUrl: WORKSPACE_URL,
        }),
      ).rejects.toThrow();
    });

    it("rejects invalid workspace URL", async () => {
      const user = createUser();
      const caller = createPrivateCaller(user.id);

      await expect(
        caller.testConnection({
          apiKey: API_KEY,
          workspaceUrl: "not-a-url",
        }),
      ).rejects.toThrow();
    });
  });
});
