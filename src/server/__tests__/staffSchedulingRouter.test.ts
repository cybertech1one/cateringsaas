import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the staffScheduling tRPC router.
 * Covers assign, getByEvent, getByStaff, updateAssignment, checkIn, checkOut,
 * removeFromEvent, and checkAvailability.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    events: {
      findFirst: vi.fn(),
    },
    staffAssignments: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    orgMembers: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
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
import { staffSchedulingRouter } from "../api/routers/staffScheduling";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";
const STAFF_ID = "00000000-0000-4000-a000-000000000300";
const ASSIGNMENT_ID = "00000000-0000-4000-a000-000000000400";

function createOrgCaller(role: string = "staff") {
  return staffSchedulingRouter.createCaller({
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
  return staffSchedulingRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("staffSchedulingRouter", () => {
  const mockEvents = vi.mocked(db.events);
  const mockAssignments = vi.mocked(db.staffAssignments);
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
  // assignToEvent
  // =========================================================================

  describe("assignToEvent", () => {
    it("should assign staff to event", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, eventDate: new Date("2026-06-15") } as never);
      mockAssignments.findFirst.mockResolvedValue(null as never); // No conflict
      mockAssignments.create.mockResolvedValue({
        id: ASSIGNMENT_ID,
        eventId: EVENT_ID,
        staffId: STAFF_ID,
        roleAtEvent: "server",
        status: "assigned",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.assignToEvent({
        eventId: EVENT_ID,
        staffMemberId: STAFF_ID,
        roleAtEvent: "server",
      });

      expect(result.id).toBe(ASSIGNMENT_ID);
      expect(mockAssignments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId: EVENT_ID,
            staffId: STAFF_ID,
            roleAtEvent: "server",
            status: "assigned",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when event does not belong to org", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.assignToEvent({
          eventId: EVENT_ID,
          staffMemberId: STAFF_ID,
          roleAtEvent: "server",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should throw CONFLICT when staff is already assigned on the same date", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, eventDate: new Date("2026-06-15") } as never);
      mockAssignments.findFirst.mockResolvedValue({
        id: "other-assignment",
        event: { title: "Other Wedding" },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.assignToEvent({
          eventId: EVENT_ID,
          staffMemberId: STAFF_ID,
          roleAtEvent: "server",
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("should allow optional pay rate and notes", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, eventDate: new Date("2026-06-15") } as never);
      mockAssignments.findFirst.mockResolvedValue(null as never);
      mockAssignments.create.mockResolvedValue({ id: ASSIGNMENT_ID } as never);

      const caller = createManagerCaller();
      await caller.assignToEvent({
        eventId: EVENT_ID,
        staffMemberId: STAFF_ID,
        roleAtEvent: "head_chef",
        payRate: 50000,
        notes: "Lead chef for the event",
      });

      expect(mockAssignments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payRate: 50000,
            notes: "Lead chef for the event",
          }),
        }),
      );
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.assignToEvent({
          eventId: EVENT_ID,
          staffMemberId: STAFF_ID,
          roleAtEvent: "server",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  // =========================================================================
  // getByEvent
  // =========================================================================

  describe("getByEvent", () => {
    it("should return staff assignments for an event", async () => {
      const assignments = [
        { id: ASSIGNMENT_ID, eventId: EVENT_ID, roleAtEvent: "server", staff: { id: STAFF_ID, role: "server" } },
      ];
      mockAssignments.findMany.mockResolvedValue(assignments as never);

      const caller = createOrgCaller();
      const result = await caller.getByEvent({ eventId: EVENT_ID });

      expect(result).toHaveLength(1);
      expect(mockAssignments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventId: EVENT_ID }),
        }),
      );
    });

    it("should return empty array when no assignments", async () => {
      mockAssignments.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.getByEvent({ eventId: EVENT_ID });

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getByStaff
  // =========================================================================

  describe("getByStaff", () => {
    it("should return schedule for a staff member", async () => {
      const assignments = [
        { id: ASSIGNMENT_ID, staffId: STAFF_ID, event: { id: EVENT_ID, title: "Wedding" } },
      ];
      mockAssignments.findMany.mockResolvedValue(assignments as never);

      const caller = createOrgCaller();
      const result = await caller.getByStaff({ staffMemberId: STAFF_ID });

      expect(result).toHaveLength(1);
    });

    it("should filter by date range when provided", async () => {
      mockAssignments.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.getByStaff({
        staffMemberId: STAFF_ID,
        dateFrom: new Date("2026-03-01"),
        dateTo: new Date("2026-03-31"),
      });

      expect(mockAssignments.findMany).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // updateAssignment
  // =========================================================================

  describe("updateAssignment", () => {
    it("should update assignment status and details", async () => {
      mockAssignments.findFirst.mockResolvedValue({ id: ASSIGNMENT_ID } as never);
      mockAssignments.update.mockResolvedValue({
        id: ASSIGNMENT_ID,
        status: "confirmed",
        roleAtEvent: "head_chef",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.updateAssignment({
        assignmentId: ASSIGNMENT_ID,
        status: "confirmed",
        roleAtEvent: "head_chef",
      });

      expect(result.status).toBe("confirmed");
      expect(mockAssignments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ASSIGNMENT_ID },
        }),
      );
    });
  });

  // =========================================================================
  // checkIn
  // =========================================================================

  describe("checkIn", () => {
    it("should update status to checked_in", async () => {
      mockAssignments.findFirst.mockResolvedValue({ id: ASSIGNMENT_ID } as never);
      mockAssignments.update.mockResolvedValue({
        id: ASSIGNMENT_ID,
        status: "checked_in",
      } as never);

      const caller = createOrgCaller();
      const result = await caller.checkIn({ assignmentId: ASSIGNMENT_ID });

      expect(result.status).toBe("checked_in");
      expect(mockAssignments.update).toHaveBeenCalledWith({
        where: { id: ASSIGNMENT_ID },
        data: { status: "checked_in" },
      });
    });
  });

  // =========================================================================
  // checkOut
  // =========================================================================

  describe("checkOut", () => {
    it("should update status to checked_out", async () => {
      mockAssignments.findFirst.mockResolvedValue({ id: ASSIGNMENT_ID } as never);
      mockAssignments.update.mockResolvedValue({
        id: ASSIGNMENT_ID,
        status: "checked_out",
      } as never);

      const caller = createOrgCaller();
      const result = await caller.checkOut({ assignmentId: ASSIGNMENT_ID });

      expect(result.status).toBe("checked_out");
      expect(mockAssignments.update).toHaveBeenCalledWith({
        where: { id: ASSIGNMENT_ID },
        data: { status: "checked_out" },
      });
    });
  });

  // =========================================================================
  // removeFromEvent
  // =========================================================================

  describe("removeFromEvent", () => {
    it("should delete the assignment", async () => {
      mockAssignments.findFirst.mockResolvedValue({ id: ASSIGNMENT_ID } as never);
      mockAssignments.delete.mockResolvedValue({ id: ASSIGNMENT_ID } as never);

      const caller = createManagerCaller();
      await caller.removeFromEvent({ assignmentId: ASSIGNMENT_ID });

      expect(mockAssignments.delete).toHaveBeenCalledWith({
        where: { id: ASSIGNMENT_ID },
      });
    });
  });

  // =========================================================================
  // checkAvailability
  // =========================================================================

  describe("checkAvailability", () => {
    it("should return all staff with availability status", async () => {
      mockMembers.findMany.mockResolvedValue([
        { id: "member-1", role: "staff", userId: "user-1" },
        { id: "member-2", role: "staff", userId: "user-2" },
      ] as never);
      mockAssignments.findMany.mockResolvedValue([
        { orgMemberId: "member-1" },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.checkAvailability({ date: new Date("2026-06-15") });

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.id === "member-1")?.isAvailable).toBe(false);
      expect(result.find((s) => s.id === "member-2")?.isAvailable).toBe(true);
    });

    it("should return all as available when no assignments on date", async () => {
      mockMembers.findMany.mockResolvedValue([
        { id: "member-1", role: "staff", userId: "user-1" },
      ] as never);
      mockAssignments.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.checkAvailability({ date: new Date("2026-07-01") });

      expect(result).toHaveLength(1);
      expect(result[0]!.isAvailable).toBe(true);
    });

    it("should return empty when no staff exists", async () => {
      mockMembers.findMany.mockResolvedValue([] as never);
      mockAssignments.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.checkAvailability({ date: new Date("2026-07-01") });

      expect(result).toEqual([]);
    });
  });
});
