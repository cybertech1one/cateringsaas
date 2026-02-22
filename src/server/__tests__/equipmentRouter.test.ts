import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the equipment tRPC router.
 * Covers list, create, update, allocateToEvent, returnFromEvent, getByEvent, and getLowStock.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    equipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    equipmentAllocations: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
import { equipmentRouter } from "../api/routers/equipment";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";
const EQUIPMENT_ID = "00000000-0000-4000-a000-000000000300";
const ALLOCATION_ID = "00000000-0000-4000-a000-000000000400";

function createOrgCaller(role: string = "staff") {
  return equipmentRouter.createCaller({
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
  return equipmentRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("equipmentRouter", () => {
  const mockEquipment = vi.mocked(db.equipment);
  const mockAllocations = vi.mocked(db.equipmentAllocations);
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
  // list
  // =========================================================================

  describe("list", () => {
    it("should return all equipment for org", async () => {
      const equipment = [
        { id: EQUIPMENT_ID, name: "Chafing Dish", category: "chafing_dish", quantityTotal: 20, quantityAvailable: 15, orgId: ORG_ID },
      ];
      mockEquipment.findMany.mockResolvedValue(equipment as never);

      const caller = createOrgCaller();
      const result = await caller.list({});

      expect(result).toHaveLength(1);
      expect(mockEquipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: ORG_ID },
        }),
      );
    });

    it("should filter by category", async () => {
      mockEquipment.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ category: "plates" });

      expect(mockEquipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "plates" }),
        }),
      );
    });

    it("should filter low stock only when requested", async () => {
      const equipment = [
        { id: "eq1", name: "Plates", quantityTotal: 100, quantityAvailable: 5 },  // Low stock (5 < 20%)
        { id: "eq2", name: "Glasses", quantityTotal: 50, quantityAvailable: 40 },  // Not low
      ];
      mockEquipment.findMany.mockResolvedValue(equipment as never);

      const caller = createOrgCaller();
      const result = await caller.list({ lowStockOnly: true });

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Plates");
    });

    it("should return all when lowStockOnly is false", async () => {
      const equipment = [
        { id: "eq1", name: "Plates", quantityTotal: 100, quantityAvailable: 5 },
        { id: "eq2", name: "Glasses", quantityTotal: 50, quantityAvailable: 40 },
      ];
      mockEquipment.findMany.mockResolvedValue(equipment as never);

      const caller = createOrgCaller();
      const result = await caller.list({});

      expect(result).toHaveLength(2);
    });
  });

  // =========================================================================
  // create
  // =========================================================================

  describe("create", () => {
    it("should create equipment with quantityAvailable = quantityTotal", async () => {
      mockEquipment.create.mockResolvedValue({
        id: EQUIPMENT_ID,
        name: "Chafing Dish",
        category: "chafing_dish",
        quantityTotal: 20,
        quantityAvailable: 20,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.create({
        name: "Chafing Dish",
        category: "chafing_dish",
        quantityTotal: 20,
      });

      expect(result.id).toBe(EQUIPMENT_ID);
      expect(mockEquipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Chafing Dish",
            category: "chafing_dish",
            quantityTotal: 20,
            quantityAvailable: 20,
            orgId: ORG_ID,
          }),
        }),
      );
    });

    it("should reject empty name", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({ name: "", category: "plates", quantityTotal: 10 }),
      ).rejects.toThrow();
    });

    it("should reject non-positive quantity", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({ name: "Plates", category: "plates", quantityTotal: 0 }),
      ).rejects.toThrow();
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.create({ name: "Plates", category: "plates", quantityTotal: 10 }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe("update", () => {
    it("should update equipment details", async () => {
      mockEquipment.update.mockResolvedValue({
        id: EQUIPMENT_ID,
        name: "Updated Chafing Dish",
        condition: "fair",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.update({
        equipmentId: EQUIPMENT_ID,
        name: "Updated Chafing Dish",
        condition: "fair",
      });

      expect(result.name).toBe("Updated Chafing Dish");
      expect(mockEquipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EQUIPMENT_ID },
        }),
      );
    });
  });

  // =========================================================================
  // allocateToEvent
  // =========================================================================

  describe("allocateToEvent", () => {
    it("should allocate equipment to event and decrease available count", async () => {
      mockEquipment.findFirst.mockResolvedValue({
        id: EQUIPMENT_ID,
        orgId: ORG_ID,
        quantityAvailable: 10,
      } as never);
      mockEquipment.update.mockResolvedValue({} as never);
      mockAllocations.create.mockResolvedValue({
        id: ALLOCATION_ID,
        equipmentId: EQUIPMENT_ID,
        eventId: EVENT_ID,
        quantityAllocated: 5,
        status: "reserved",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.allocateToEvent({
        eventId: EVENT_ID,
        equipmentId: EQUIPMENT_ID,
        quantityAllocated: 5,
      });

      expect(result.status).toBe("reserved");
      expect(mockEquipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityAvailable: 5 },
        }),
      );
    });

    it("should throw NOT_FOUND when equipment does not belong to org", async () => {
      mockEquipment.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.allocateToEvent({
          eventId: EVENT_ID,
          equipmentId: EQUIPMENT_ID,
          quantityAllocated: 5,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw BAD_REQUEST when insufficient stock", async () => {
      mockEquipment.findFirst.mockResolvedValue({
        id: EQUIPMENT_ID,
        orgId: ORG_ID,
        quantityAvailable: 3,
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.allocateToEvent({
          eventId: EVENT_ID,
          equipmentId: EQUIPMENT_ID,
          quantityAllocated: 10,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  // =========================================================================
  // returnFromEvent
  // =========================================================================

  describe("returnFromEvent", () => {
    it("should return equipment and increase available count", async () => {
      mockAllocations.findFirst.mockResolvedValue({
        id: ALLOCATION_ID,
        equipmentId: EQUIPMENT_ID,
        quantityAllocated: 5,
      } as never);
      mockEquipment.update.mockResolvedValue({} as never);
      mockAllocations.update.mockResolvedValue({
        id: ALLOCATION_ID,
        status: "returned",
        quantityReturned: 5,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.returnFromEvent({
        allocationId: ALLOCATION_ID,
        quantityReturned: 5,
      });

      expect(result.status).toBe("returned");
      expect(mockEquipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityAvailable: { increment: 5 } },
        }),
      );
    });

    it("should set status to damaged when quantityDamaged > 0", async () => {
      mockAllocations.findFirst.mockResolvedValue({
        id: ALLOCATION_ID,
        equipmentId: EQUIPMENT_ID,
      } as never);
      mockEquipment.update.mockResolvedValue({} as never);
      mockAllocations.update.mockResolvedValue({ id: ALLOCATION_ID, status: "damaged" } as never);

      const caller = createManagerCaller();
      const result = await caller.returnFromEvent({
        allocationId: ALLOCATION_ID,
        quantityReturned: 3,
        quantityDamaged: 2,
        notes: "Broken handles",
      });

      expect(mockAllocations.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "damaged" }),
        }),
      );
    });

    it("should throw NOT_FOUND when allocation does not exist", async () => {
      mockAllocations.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.returnFromEvent({
          allocationId: ALLOCATION_ID,
          quantityReturned: 5,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // getByEvent
  // =========================================================================

  describe("getByEvent", () => {
    it("should return allocations for an event with equipment details", async () => {
      const allocations = [
        {
          id: ALLOCATION_ID,
          equipmentId: EQUIPMENT_ID,
          eventId: EVENT_ID,
          equipment: { id: EQUIPMENT_ID, name: "Chafing Dish", category: "chafing_dish" },
        },
      ];
      mockAllocations.findMany.mockResolvedValue(allocations as never);

      const caller = createOrgCaller();
      const result = await caller.getByEvent({ eventId: EVENT_ID });

      expect(result).toHaveLength(1);
      expect(result[0]!.equipment.name).toBe("Chafing Dish");
    });
  });

  // =========================================================================
  // getLowStock
  // =========================================================================

  describe("getLowStock", () => {
    it("should return only low stock items with percentage", async () => {
      const equipment = [
        { id: "eq1", name: "Plates", quantityTotal: 100, quantityAvailable: 10 },   // 10% — low
        { id: "eq2", name: "Glasses", quantityTotal: 50, quantityAvailable: 40 },    // 80% — not low
        { id: "eq3", name: "Cutlery", quantityTotal: 200, quantityAvailable: 20 },   // 10% — low
      ];
      mockEquipment.findMany.mockResolvedValue(equipment as never);

      const caller = createOrgCaller();
      const result = await caller.getLowStock({});

      expect(result).toHaveLength(2);
      expect(result[0]!.availablePercentage).toBe(10);
    });

    it("should return empty when all stock is adequate", async () => {
      const equipment = [
        { id: "eq1", name: "Plates", quantityTotal: 100, quantityAvailable: 80 },
      ];
      mockEquipment.findMany.mockResolvedValue(equipment as never);

      const caller = createOrgCaller();
      const result = await caller.getLowStock({});

      expect(result).toEqual([]);
    });
  });
});
