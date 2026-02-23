import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for inventory management endpoints in the cateringMenus router.
 * Covers stock overview, updates, batch updates, low-stock alerts,
 * reservation/release flows, and IDOR protection.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    cateringMenus: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cateringCategories: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cateringItems: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    cateringPackages: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organizations: {
      findUnique: vi.fn(),
    },
    orgMembers: {
      findFirst: vi.fn(),
    },
    events: {
      findFirst: vi.fn(),
    },
    inventoryReservations: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    stockLogs: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
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
import { cateringMenusRouter } from "../api/routers/cateringMenus";
import { createDish, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const MENU_ID = "00000000-0000-4000-a000-000000000700";
const CATEGORY_ID = "00000000-0000-4000-a000-000000000701";
const ITEM_ID = "00000000-0000-4000-a000-000000000702";
const ITEM_ID_2 = "00000000-0000-4000-a000-000000000703";
const EVENT_ID = "00000000-0000-4000-a000-000000000900";
const OTHER_ORG_ID = "00000000-0000-4000-a000-000000000999";

function createOrgCaller(role: string = "staff") {
  return cateringMenusRouter.createCaller({
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

function createUnauthCaller() {
  return cateringMenusRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxCallback = (tx: any) => Promise<any>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cateringMenusRouter - inventory endpoints", () => {
  const mockItems = vi.mocked(db.cateringItems);
  const mockMenus = vi.mocked(db.cateringMenus);
  const mockMembers = vi.mocked(db.orgMembers);
  const mockStockLogs = vi.mocked(db.stockLogs);
  const mockTransaction = vi.mocked(db.$transaction);

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
  // getInventoryOverview
  // =========================================================================

  describe("getInventoryOverview", () => {
    it("should return all items with stock levels grouped by category", async () => {
      const item1 = createDish({
        id: ITEM_ID,
        cateringMenuId: MENU_ID,
        cateringCategoryId: CATEGORY_ID,
        availableQuantity: 50,
        lowStockThreshold: 10,
        reservedQuantity: 5,
      });
      const item2 = createDish({
        id: ITEM_ID_2,
        cateringMenuId: MENU_ID,
        cateringCategoryId: CATEGORY_ID,
        availableQuantity: 3,
        lowStockThreshold: 10,
        reservedQuantity: 0,
      });

      mockMenus.findMany.mockResolvedValue([
        {
          id: MENU_ID,
          name: "Wedding Menu",
          categories: [
            {
              id: CATEGORY_ID,
              name: "Appetizers",
              cateringItems: [item1, item2],
            },
          ],
        },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getInventoryOverview({});

      expect(result).toHaveLength(1); // 1 menu
      const firstMenu = result[0]!;
      expect(firstMenu.categories[0]!.cateringItems).toHaveLength(2);
      expect(mockMenus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: ORG_ID }),
        }),
      );
    });

    it("should be accessible by staff role (orgProcedure)", async () => {
      mockMembers.findFirst.mockResolvedValue({
        id: MEMBER_ID,
        orgId: ORG_ID,
        role: "staff",
        permissions: null,
      } as never);
      mockMenus.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller("staff");
      const result = await caller.getInventoryOverview({});
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // updateStock
  // =========================================================================

  describe("updateStock", () => {
    it("should update the available quantity and log the change", async () => {
      const item = createDish({
        id: ITEM_ID,
        cateringMenuId: MENU_ID,
        availableQuantity: 20,
      });
      mockItems.findUnique.mockResolvedValue({
        ...item,
        cateringMenu: { orgId: ORG_ID },
      } as never);
      mockItems.update.mockResolvedValue({ ...item, availableQuantity: 50 } as never);
      mockStockLogs.create.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      await caller.updateStock({
        itemId: ITEM_ID,
        newQuantity: 50,
        reason: "restock",
      });

      expect(mockItems.update).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
        data: { availableQuantity: 50 },
      });
      expect(mockStockLogs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          itemId: ITEM_ID,
          orgId: ORG_ID,
          userId: USER_ID,
          oldQty: 20,
          newQty: 50,
          reason: "restock",
        }),
      });
    });

    it("should throw NOT_FOUND when item belongs to different org (IDOR)", async () => {
      mockItems.findUnique.mockResolvedValue({
        id: ITEM_ID,
        cateringMenu: { orgId: OTHER_ORG_ID },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateStock({ itemId: ITEM_ID, newQuantity: 10, reason: "restock" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject negative quantities", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.updateStock({ itemId: ITEM_ID, newQuantity: -5, reason: "restock" }),
      ).rejects.toThrow();
    });

    it("should only accept valid reason values", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.updateStock({ itemId: ITEM_ID, newQuantity: 10, reason: "invalid" as never }),
      ).rejects.toThrow();
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.updateStock({ itemId: ITEM_ID, newQuantity: 10, reason: "restock" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  // =========================================================================
  // batchUpdateStock
  // =========================================================================

  describe("batchUpdateStock", () => {
    it("should update multiple items in a transaction", async () => {
      const item1 = createDish({ id: ITEM_ID, cateringMenuId: MENU_ID, availableQuantity: 10 });
      const item2 = createDish({ id: ITEM_ID_2, cateringMenuId: MENU_ID, availableQuantity: 20 });

      // Mock transaction to execute the callback
      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          cateringItems: {
            findUnique: vi.fn()
              .mockResolvedValueOnce({ ...item1, cateringMenu: { orgId: ORG_ID } })
              .mockResolvedValueOnce({ ...item2, cateringMenu: { orgId: ORG_ID } }),
            update: vi.fn().mockResolvedValue({}),
          },
          stockLogs: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      const result = await caller.batchUpdateStock({
        reason: "restock",
        items: [
          { itemId: ITEM_ID, newQuantity: 100 },
          { itemId: ITEM_ID_2, newQuantity: 200 },
        ],
      });

      expect(mockTransaction).toHaveBeenCalled();
      expect(result.updatedCount).toBe(2);
    });

    it("should reject empty items array", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.batchUpdateStock({ reason: "restock", items: [] }),
      ).rejects.toThrow();
    });

    it("should throw NOT_FOUND if any item belongs to different org", async () => {
      const item1 = createDish({ id: ITEM_ID, cateringMenuId: MENU_ID, availableQuantity: 10 });

      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          cateringItems: {
            findUnique: vi.fn()
              .mockResolvedValueOnce({ ...item1, cateringMenu: { orgId: OTHER_ORG_ID } }),
            update: vi.fn(),
          },
          stockLogs: {
            create: vi.fn(),
          },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      await expect(
        caller.batchUpdateStock({
          reason: "adjustment",
          items: [{ itemId: ITEM_ID, newQuantity: 50 }],
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // getLowStockItems
  // =========================================================================

  describe("getLowStockItems", () => {
    it("should return items below the default threshold (10)", async () => {
      const lowItem = createDish({
        id: ITEM_ID,
        availableQuantity: 3,
        lowStockThreshold: 10,
      });
      mockItems.findMany.mockResolvedValue([lowItem] as never);

      const caller = createOrgCaller();
      const result = await caller.getLowStockItems({});

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(ITEM_ID);
    });

    it("should accept a custom threshold parameter", async () => {
      mockItems.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.getLowStockItems({ threshold: 25 });

      expect(mockItems.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availableQuantity: { not: null, lt: 25 },
          }),
        }),
      );
    });

    it("should only return items with tracked inventory (availableQuantity != null)", async () => {
      mockItems.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.getLowStockItems({});

      expect(mockItems.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availableQuantity: expect.objectContaining({ not: null }),
          }),
        }),
      );
    });
  });

  // =========================================================================
  // reserveForEvent
  // =========================================================================

  describe("reserveForEvent", () => {
    it("should reserve quantities and decrement available stock", async () => {
      const event = { id: EVENT_ID, orgId: ORG_ID, status: "confirmed" };
      const item = createDish({
        id: ITEM_ID,
        cateringMenuId: MENU_ID,
        availableQuantity: 100,
        reservedQuantity: 0,
      });

      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          events: {
            findFirst: vi.fn().mockResolvedValue(event),
          },
          cateringItems: {
            findUnique: vi.fn().mockResolvedValue({
              ...item,
              cateringMenu: { orgId: ORG_ID },
            }),
            update: vi.fn().mockResolvedValue({
              ...item,
              availableQuantity: 80,
              reservedQuantity: 20,
            }),
          },
          inventoryReservations: {
            upsert: vi.fn().mockResolvedValue({}),
          },
          stockLogs: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      const result = await caller.reserveForEvent({
        eventId: EVENT_ID,
        items: [{ itemId: ITEM_ID, quantity: 20 }],
      });

      expect(mockTransaction).toHaveBeenCalled();
      expect(result.reserved).toHaveLength(1);
    });

    it("should throw BAD_REQUEST when insufficient stock", async () => {
      const event = { id: EVENT_ID, orgId: ORG_ID, status: "confirmed" };
      const item = createDish({
        id: ITEM_ID,
        cateringMenuId: MENU_ID,
        availableQuantity: 5,
        reservedQuantity: 0,
      });

      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          events: {
            findFirst: vi.fn().mockResolvedValue(event),
          },
          cateringItems: {
            findUnique: vi.fn().mockResolvedValue({
              ...item,
              cateringMenu: { orgId: ORG_ID },
            }),
            update: vi.fn(),
          },
          inventoryReservations: {
            upsert: vi.fn(),
          },
          stockLogs: {
            create: vi.fn(),
          },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      await expect(
        caller.reserveForEvent({
          eventId: EVENT_ID,
          items: [{ itemId: ITEM_ID, quantity: 50 }],
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("should throw NOT_FOUND when event belongs to different org", async () => {
      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          events: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          cateringItems: { findUnique: vi.fn(), update: vi.fn() },
          inventoryReservations: { upsert: vi.fn() },
          stockLogs: { create: vi.fn() },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      await expect(
        caller.reserveForEvent({
          eventId: EVENT_ID,
          items: [{ itemId: ITEM_ID, quantity: 10 }],
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // releaseReservation
  // =========================================================================

  describe("releaseReservation", () => {
    it("should release reserved quantities and restore stock", async () => {
      const event = { id: EVENT_ID, orgId: ORG_ID };
      const reservations = [
        { id: "r1", eventId: EVENT_ID, itemId: ITEM_ID, quantity: 20 },
        { id: "r2", eventId: EVENT_ID, itemId: ITEM_ID_2, quantity: 15 },
      ];

      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          events: {
            findFirst: vi.fn().mockResolvedValue(event),
          },
          inventoryReservations: {
            findMany: vi.fn().mockResolvedValue(reservations),
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          cateringItems: {
            update: vi.fn().mockResolvedValue({}),
          },
          stockLogs: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      const result = await caller.releaseReservation({ eventId: EVENT_ID });

      expect(mockTransaction).toHaveBeenCalled();
      expect(result.releasedCount).toBe(2);
    });

    it("should throw NOT_FOUND when event belongs to different org", async () => {
      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          events: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          inventoryReservations: { findMany: vi.fn(), deleteMany: vi.fn() },
          cateringItems: { update: vi.fn() },
          stockLogs: { create: vi.fn() },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      await expect(
        caller.releaseReservation({ eventId: EVENT_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should handle event with no existing reservations gracefully", async () => {
      const event = { id: EVENT_ID, orgId: ORG_ID };

      mockTransaction.mockImplementation(async (cb: TxCallback) => {
        const txMock = {
          events: {
            findFirst: vi.fn().mockResolvedValue(event),
          },
          inventoryReservations: {
            findMany: vi.fn().mockResolvedValue([]),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          cateringItems: { update: vi.fn() },
          stockLogs: { create: vi.fn() },
        };
        return cb(txMock);
      });

      const caller = createManagerCaller();
      const result = await caller.releaseReservation({ eventId: EVENT_ID });
      expect(result.releasedCount).toBe(0);
    });
  });
});
