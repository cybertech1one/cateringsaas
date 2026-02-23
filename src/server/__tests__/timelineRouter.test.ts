import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the timeline tRPC router.
 * Covers getByEvent, createTask, updateTask, updateStatus, deleteTask,
 * applyTemplate, reorder, getDeliveryPlan, upsertDeliveryPlan, getProgress.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    events: {
      findFirst: vi.fn(),
    },
    prepTasks: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    deliveryPlans: {
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
import { timelineRouter } from "../api/routers/timeline";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";
const TASK_ID = "00000000-0000-4000-a000-000000000300";

function createOrgCaller(role: string = "staff") {
  return timelineRouter.createCaller({
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
  return timelineRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("timelineRouter", () => {
  const mockEvents = vi.mocked(db.events);
  const mockTasks = vi.mocked(db.prepTasks);
  const mockDeliveryPlans = vi.mocked(db.deliveryPlans);
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
  // getByEvent
  // =========================================================================

  describe("getByEvent", () => {
    it("should return all tasks for an event", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID } as never);
      const tasks = [
        { id: TASK_ID, name: "Order ingredients", category: "shopping", status: "pending", sortOrder: 1 },
      ];
      mockTasks.findMany.mockResolvedValue(tasks as never);

      const caller = createOrgCaller();
      const result = await caller.getByEvent({ eventId: EVENT_ID });

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Order ingredients");
    });

    it("should throw NOT_FOUND when event does not belong to org", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.getByEvent({ eventId: EVENT_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // createTask
  // =========================================================================

  describe("createTask", () => {
    it("should create a task with auto-incremented sortOrder", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID } as never);
      mockTasks.findFirst.mockResolvedValue({ sortOrder: 5 } as never); // last task
      mockTasks.create.mockResolvedValue({
        id: TASK_ID,
        name: "Buy groceries",
        category: "shopping",
        sortOrder: 6,
        status: "pending",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.createTask({
        eventId: EVENT_ID,
        name: "Buy groceries",
        category: "shopping",
      });

      expect(result.sortOrder).toBe(6);
      expect(mockTasks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sortOrder: 6,
            status: "pending",
          }),
        }),
      );
    });

    it("should start at sortOrder 1 when no existing tasks", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID } as never);
      mockTasks.findFirst.mockResolvedValue(null as never);
      mockTasks.create.mockResolvedValue({ id: TASK_ID, sortOrder: 1 } as never);

      const caller = createManagerCaller();
      await caller.createTask({
        eventId: EVENT_ID,
        name: "First task",
        category: "prep",
      });

      expect(mockTasks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 1 }),
        }),
      );
    });

    it("should throw NOT_FOUND when event does not belong to org", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.createTask({ eventId: EVENT_ID, name: "Task", category: "prep" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject empty task name", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.createTask({ eventId: EVENT_ID, name: "", category: "prep" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateTask
  // =========================================================================

  describe("updateTask", () => {
    it("should update task details", async () => {
      mockTasks.findFirst.mockResolvedValue({ id: TASK_ID } as never);
      mockTasks.update.mockResolvedValue({
        id: TASK_ID,
        name: "Updated task",
        category: "cooking",
        status: "in_progress",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.updateTask({
        taskId: TASK_ID,
        name: "Updated task",
        category: "cooking",
        status: "in_progress",
      });

      expect(result.name).toBe("Updated task");
      expect(mockTasks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TASK_ID },
        }),
      );
    });
  });

  // =========================================================================
  // updateStatus
  // =========================================================================

  describe("updateStatus", () => {
    it("should update task status to completed with endTime", async () => {
      mockTasks.findFirst.mockResolvedValue({ id: TASK_ID } as never);
      mockTasks.update.mockResolvedValue({ id: TASK_ID, status: "completed" } as never);

      const caller = createOrgCaller();
      const result = await caller.updateStatus({ taskId: TASK_ID, status: "completed" });

      expect(result.status).toBe("completed");
      expect(mockTasks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "completed",
            endTime: expect.any(Date),
          }),
        }),
      );
    });

    it("should update status to in_progress without endTime", async () => {
      mockTasks.findFirst.mockResolvedValue({ id: TASK_ID } as never);
      mockTasks.update.mockResolvedValue({ id: TASK_ID, status: "in_progress" } as never);

      const caller = createOrgCaller();
      await caller.updateStatus({ taskId: TASK_ID, status: "in_progress" });

      expect(mockTasks.update).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        data: { status: "in_progress" },
      });
    });
  });

  // =========================================================================
  // deleteTask
  // =========================================================================

  describe("deleteTask", () => {
    it("should delete a task", async () => {
      mockTasks.findFirst.mockResolvedValue({ id: TASK_ID } as never);
      mockTasks.delete.mockResolvedValue({ id: TASK_ID } as never);

      const caller = createManagerCaller();
      await caller.deleteTask({ taskId: TASK_ID });

      expect(mockTasks.delete).toHaveBeenCalledWith({ where: { id: TASK_ID } });
    });
  });

  // =========================================================================
  // applyTemplate
  // =========================================================================

  describe("applyTemplate", () => {
    it("should create tasks from wedding template", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, eventDate: new Date() } as never);
      mockTasks.createMany.mockResolvedValue({ count: 16 } as never);

      const caller = createManagerCaller();
      const result = await caller.applyTemplate({ eventId: EVENT_ID, template: "wedding" });

      expect(result.count).toBe(16);
      expect(mockTasks.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ name: expect.any(String), category: expect.any(String) }),
          ]),
        }),
      );
    });

    it("should create tasks from basic template", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, eventDate: new Date() } as never);
      mockTasks.createMany.mockResolvedValue({ count: 6 } as never);

      const caller = createManagerCaller();
      const result = await caller.applyTemplate({ eventId: EVENT_ID, template: "basic" });

      expect(result.count).toBe(6);
    });

    it("should throw NOT_FOUND when event does not belong to org", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.applyTemplate({ eventId: EVENT_ID, template: "wedding" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.applyTemplate({ eventId: EVENT_ID, template: "basic" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  // =========================================================================
  // reorder
  // =========================================================================

  describe("reorder", () => {
    it("should update sort order for multiple tasks", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID } as never);
      mockTasks.findMany.mockResolvedValue([
        { id: "00000000-0000-4000-a000-000000000501" },
        { id: "00000000-0000-4000-a000-000000000502" },
        { id: "00000000-0000-4000-a000-000000000503" },
      ] as never);
      mockTasks.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.reorder({
        eventId: EVENT_ID,
        taskOrder: [
          { id: "00000000-0000-4000-a000-000000000501", sortOrder: 1 },
          { id: "00000000-0000-4000-a000-000000000502", sortOrder: 2 },
          { id: "00000000-0000-4000-a000-000000000503", sortOrder: 3 },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockTasks.update).toHaveBeenCalledTimes(3);
    });
  });

  // =========================================================================
  // getDeliveryPlan
  // =========================================================================

  describe("getDeliveryPlan", () => {
    it("should return delivery plan for an event", async () => {
      mockDeliveryPlans.findUnique.mockResolvedValue({
        id: "plan-1",
        eventId: EVENT_ID,
        driverName: "Khalid",
        vehicleType: "van",
      } as never);

      const caller = createOrgCaller();
      const result = await caller.getDeliveryPlan({ eventId: EVENT_ID });

      expect(result!.driverName).toBe("Khalid");
    });

    it("should return null when no delivery plan exists", async () => {
      mockDeliveryPlans.findUnique.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      const result = await caller.getDeliveryPlan({ eventId: EVENT_ID });

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // upsertDeliveryPlan
  // =========================================================================

  describe("upsertDeliveryPlan", () => {
    it("should create a new delivery plan", async () => {
      const plan = {
        id: "plan-1",
        eventId: EVENT_ID,
        driverName: "Khalid",
        driverPhone: "+212612345678",
        vehicleType: "van",
      };
      mockDeliveryPlans.upsert.mockResolvedValue(plan as never);

      const caller = createManagerCaller();
      const result = await caller.upsertDeliveryPlan({
        eventId: EVENT_ID,
        driverName: "Khalid",
        driverPhone: "+212612345678",
        vehicleType: "van",
      });

      expect(result.driverName).toBe("Khalid");
      expect(mockDeliveryPlans.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: EVENT_ID },
          create: expect.objectContaining({
            eventId: EVENT_ID,
            driverName: "Khalid",
            vehicleType: "van",
          }),
          update: expect.objectContaining({
            driverName: "Khalid",
            vehicleType: "van",
          }),
        }),
      );
    });

    it("should update an existing delivery plan", async () => {
      const updatedPlan = {
        id: "plan-1",
        eventId: EVENT_ID,
        driverName: "Hassan",
        vehicleType: "truck",
      };
      mockDeliveryPlans.upsert.mockResolvedValue(updatedPlan as never);

      const caller = createManagerCaller();
      const result = await caller.upsertDeliveryPlan({
        eventId: EVENT_ID,
        driverName: "Hassan",
        vehicleType: "truck",
      });

      expect(result.driverName).toBe("Hassan");
    });

    it("should handle timing fields", async () => {
      const departure = new Date("2026-06-15T08:00:00Z");
      const arrival = new Date("2026-06-15T09:30:00Z");
      const serviceStart = new Date("2026-06-15T10:00:00Z");
      const serviceEnd = new Date("2026-06-15T14:00:00Z");

      mockDeliveryPlans.upsert.mockResolvedValue({
        id: "plan-1",
        eventId: EVENT_ID,
        departureTime: departure,
        estimatedArrival: arrival,
        serviceStartTime: serviceStart,
        serviceEndTime: serviceEnd,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.upsertDeliveryPlan({
        eventId: EVENT_ID,
        departureTime: departure,
        estimatedArrival: arrival,
        serviceStartTime: serviceStart,
        serviceEndTime: serviceEnd,
      });

      expect(mockDeliveryPlans.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            departureTime: departure,
            estimatedArrival: arrival,
          }),
        }),
      );
    });

    it("should handle JSON manifests and checklists", async () => {
      const foodManifest = [{ item: "Couscous", quantity: 50 }];
      const equipmentManifest = [{ item: "Chafing dish", quantity: 10 }];
      const setupChecklist = [{ task: "Set up tables", done: false }];

      mockDeliveryPlans.upsert.mockResolvedValue({ id: "plan-1", eventId: EVENT_ID } as never);

      const caller = createManagerCaller();
      await caller.upsertDeliveryPlan({
        eventId: EVENT_ID,
        foodManifest,
        equipmentManifest,
        setupChecklist,
      });

      expect(mockDeliveryPlans.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            eventId: EVENT_ID,
            foodManifest,
            equipmentManifest,
            setupChecklist,
          }),
        }),
      );
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.upsertDeliveryPlan({ eventId: EVENT_ID, driverName: "Test" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should include notes in the delivery plan", async () => {
      mockDeliveryPlans.upsert.mockResolvedValue({ id: "plan-1", eventId: EVENT_ID } as never);

      const caller = createManagerCaller();
      await caller.upsertDeliveryPlan({
        eventId: EVENT_ID,
        notes: "Use back entrance for loading",
      });

      expect(mockDeliveryPlans.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ notes: "Use back entrance for loading" }),
          update: expect.objectContaining({ notes: "Use back entrance for loading" }),
        }),
      );
    });
  });

  // =========================================================================
  // getProgress
  // =========================================================================

  describe("getProgress", () => {
    it("should return task progress summary by category", async () => {
      const tasks = [
        { status: "completed", category: "shopping" },
        { status: "completed", category: "shopping" },
        { status: "in_progress", category: "cooking" },
        { status: "pending", category: "cooking" },
        { status: "pending", category: "setup" },
      ];
      mockTasks.findMany.mockResolvedValue(tasks as never);

      const caller = createOrgCaller();
      const result = await caller.getProgress({ eventId: EVENT_ID });

      expect(result.total).toBe(5);
      expect(result.completed).toBe(2);
      expect(result.inProgress).toBe(1);
      expect(result.pending).toBe(2);
      expect(result.percentage).toBe(40);
      expect(result.byCategory.shopping).toEqual({ total: 2, completed: 2 });
      expect(result.byCategory.cooking).toEqual({ total: 2, completed: 0 });
    });

    it("should return 0% when no tasks exist", async () => {
      mockTasks.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.getProgress({ eventId: EVENT_ID });

      expect(result.total).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });
});
