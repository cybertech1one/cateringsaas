import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the events tRPC router.
 * Covers event CRUD, status transitions, calendar, stats, and public inquiry endpoints.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    events: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    organizations: {
      findFirst: vi.fn(),
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
import { eventsRouter } from "../api/routers/events";
import { createOrder, resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";

function createOrgCaller(role: string = "staff") {
  return eventsRouter.createCaller({
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
  return eventsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

function createUnauthCaller() {
  return eventsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("eventsRouter", () => {
  const mockEvents = vi.mocked(db.events);
  const mockOrgs = vi.mocked(db.organizations);
  const mockMembers = vi.mocked(db.orgMembers);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    // Default org membership for org-scoped procedures
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
    it("should return paginated events scoped to org", async () => {
      const event = createOrder({ orgId: ORG_ID });
      mockEvents.findMany.mockResolvedValue([event] as never);

      const caller = createOrgCaller();
      const result = await caller.list({});

      expect(result.events).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should handle cursor pagination", async () => {
      const events = Array.from({ length: 3 }, () => createOrder({ orgId: ORG_ID }));
      mockEvents.findMany.mockResolvedValue(events as never);

      const caller = createOrgCaller();
      const result = await caller.list({ limit: 2 });

      expect(result.nextCursor).toBeDefined();
      expect(result.events).toHaveLength(2);
    });

    it("should filter by status", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ status: ["inquiry", "confirmed"] });

      expect(mockEvents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: ORG_ID,
            status: { in: ["inquiry", "confirmed"] },
          }),
        }),
      );
    });

    it("should filter by event type", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ eventType: "wedding" });

      expect(mockEvents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventType: "wedding" }),
        }),
      );
    });
  });

  // =========================================================================
  // getById
  // =========================================================================

  describe("getById", () => {
    it("should return event with includes", async () => {
      const event = createOrder({ id: EVENT_ID, orgId: ORG_ID });
      mockEvents.findFirst.mockResolvedValue({ ...event, quotes: [], paymentSchedules: [], staffAssignments: [], prepTasks: [] } as never);

      const caller = createOrgCaller();
      const result = await caller.getById({ eventId: EVENT_ID });

      expect(result.id).toBe(EVENT_ID);
    });

    it("should throw NOT_FOUND when event does not exist", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.getById({ eventId: EVENT_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject invalid UUID for eventId", async () => {
      const caller = createOrgCaller();
      await expect(
        caller.getById({ eventId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // create (orgManagerProcedure)
  // =========================================================================

  describe("create", () => {
    it("should create an event with status inquiry", async () => {
      const event = createOrder({ orgId: ORG_ID });
      mockEvents.create.mockResolvedValue(event as never);

      const caller = createManagerCaller();
      const result = await caller.create({
        title: "Wedding Reception",
        eventType: "wedding",
        eventDate: new Date("2026-06-15"),
        guestCount: 150,
        customerName: "Ahmed Tazi",
        customerPhone: "+212612345678",
      });

      expect(mockEvents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            status: "inquiry",
            totalAmount: 0,
            depositAmount: 0,
            balanceDue: 0,
          }),
        }),
      );
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.create({
          title: "Test",
          eventType: "wedding",
          eventDate: new Date(),
          guestCount: 10,
          customerName: "Test",
          customerPhone: "12345678",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject title shorter than 2 chars", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({
          title: "A",
          eventType: "wedding",
          eventDate: new Date(),
          guestCount: 10,
          customerName: "Test User",
          customerPhone: "12345678",
        }),
      ).rejects.toThrow();
    });

    it("should reject negative guest count", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({
          title: "Test Event",
          eventType: "wedding",
          eventDate: new Date(),
          guestCount: -5,
          customerName: "Test User",
          customerPhone: "12345678",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe("update", () => {
    it("should update event details", async () => {
      const event = createOrder({ id: EVENT_ID, orgId: ORG_ID, totalAmount: 50000, depositAmount: 10000 });
      mockEvents.findFirst.mockResolvedValue(event as never);
      mockEvents.update.mockResolvedValue({ ...event, title: "Updated" } as never);

      const caller = createManagerCaller();
      const result = await caller.update({ eventId: EVENT_ID, title: "Updated" });

      expect(mockEvents.update).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND for non-existent event", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.update({ eventId: EVENT_ID, title: "Updated" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should recalculate balanceDue when amounts change", async () => {
      const event = createOrder({ id: EVENT_ID, orgId: ORG_ID, totalAmount: 50000, depositAmount: 10000 });
      mockEvents.findFirst.mockResolvedValue(event as never);
      mockEvents.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      await caller.update({ eventId: EVENT_ID, totalAmount: 80000 });

      expect(mockEvents.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            balanceDue: 80000 - 10000, // new total - existing deposit
          }),
        }),
      );
    });
  });

  // =========================================================================
  // updateStatus (state machine)
  // =========================================================================

  describe("updateStatus", () => {
    it("should allow valid transition inquiry -> reviewed", async () => {
      mockEvents.findFirst
        .mockResolvedValueOnce({ id: EVENT_ID, status: "inquiry", title: "Test" } as never);
      mockEvents.update.mockResolvedValue({ id: EVENT_ID, status: "reviewed" } as never);

      const caller = createManagerCaller();
      const result = await caller.updateStatus({
        eventId: EVENT_ID,
        newStatus: "reviewed",
      });

      expect(mockEvents.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "reviewed" }),
        }),
      );
    });

    it("should reject invalid transition inquiry -> confirmed", async () => {
      mockEvents.findFirst
        .mockResolvedValueOnce({ id: EVENT_ID, status: "inquiry", title: "Test" } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateStatus({ eventId: EVENT_ID, newStatus: "confirmed" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("should require reason for cancellation", async () => {
      mockEvents.findFirst
        .mockResolvedValueOnce({ id: EVENT_ID, status: "inquiry", title: "Test" } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateStatus({ eventId: EVENT_ID, newStatus: "cancelled" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("should allow cancellation with reason", async () => {
      mockEvents.findFirst
        .mockResolvedValueOnce({ id: EVENT_ID, status: "inquiry", title: "Test" } as never)
        .mockResolvedValueOnce({ internalNotes: null } as never);
      mockEvents.update.mockResolvedValue({ id: EVENT_ID, status: "cancelled" } as never);

      const caller = createManagerCaller();
      await caller.updateStatus({
        eventId: EVENT_ID,
        newStatus: "cancelled",
        reason: "Client changed mind",
      });

      expect(mockEvents.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "cancelled",
            internalNotes: expect.stringContaining("Client changed mind"),
          }),
        }),
      );
    });

    it("should throw NOT_FOUND for non-existent event", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateStatus({ eventId: EVENT_ID, newStatus: "reviewed" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject transition from terminal state", async () => {
      mockEvents.findFirst
        .mockResolvedValueOnce({ id: EVENT_ID, status: "settled", title: "Test" } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateStatus({ eventId: EVENT_ID, newStatus: "completed" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  // =========================================================================
  // getCalendar
  // =========================================================================

  describe("getCalendar", () => {
    it("should return events in date range excluding cancelled/settled", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.getCalendar({
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-31"),
      });

      expect(mockEvents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: ORG_ID,
            eventDate: {
              gte: new Date("2026-03-01"),
              lte: new Date("2026-03-31"),
            },
            status: { notIn: ["cancelled", "settled"] },
          }),
        }),
      );
    });
  });

  // =========================================================================
  // getUpcoming
  // =========================================================================

  describe("getUpcoming", () => {
    it("should return events in the next 7 days excluding cancelled/settled/inquiry", async () => {
      const upcomingEvents = [
        { id: "e1", title: "Corporate Lunch", status: "confirmed", eventDate: new Date() },
        { id: "e2", title: "Wedding", status: "prep", eventDate: new Date() },
      ];
      mockEvents.findMany.mockResolvedValue(upcomingEvents as never);

      const caller = createOrgCaller();
      const result = await caller.getUpcoming({});

      expect(result).toHaveLength(2);
      expect(mockEvents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: ORG_ID,
            status: { notIn: ["cancelled", "settled", "inquiry"] },
          }),
          take: 10,
          orderBy: { eventDate: "asc" },
        }),
      );
    });

    it("should return empty array when no upcoming events", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.getUpcoming({});

      expect(result).toEqual([]);
    });

    it("should limit results to 10 events", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.getUpcoming({});

      expect(mockEvents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  // =========================================================================
  // checkAvailability
  // =========================================================================

  describe("checkAvailability", () => {
    it("should return isAvailable=true when no events on date", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.checkAvailability({ date: new Date("2026-07-01") });

      expect(result.isAvailable).toBe(true);
      expect(result.eventCount).toBe(0);
    });

    it("should return isAvailable=false when events exist on date", async () => {
      mockEvents.findMany.mockResolvedValue([{ id: "some-event" }] as never);

      const caller = createOrgCaller();
      const result = await caller.checkAvailability({ date: new Date("2026-07-01") });

      expect(result.isAvailable).toBe(false);
      expect(result.eventCount).toBe(1);
    });
  });

  // =========================================================================
  // getStats
  // =========================================================================

  describe("getStats", () => {
    it("should return event statistics", async () => {
      mockEvents.count
        .mockResolvedValueOnce(50 as never)  // total
        .mockResolvedValueOnce(12 as never)  // active
        .mockResolvedValueOnce(8 as never)   // this month
        .mockResolvedValueOnce(5 as never);  // pending inquiries

      const caller = createOrgCaller();
      const result = await caller.getStats({});

      expect(result).toEqual({
        totalEvents: 50,
        activeEvents: 12,
        thisMonthEvents: 8,
        pendingInquiries: 5,
      });
    });
  });

  // =========================================================================
  // submitInquiry (public)
  // =========================================================================

  describe("submitInquiry", () => {
    it("should create an inquiry event and return eventId", async () => {
      mockOrgs.findFirst.mockResolvedValue({ id: ORG_ID, name: "Test Caterer" } as never);
      mockEvents.create.mockResolvedValue({ id: EVENT_ID } as never);

      const caller = createPublicCaller();
      const result = await caller.submitInquiry({
        orgId: ORG_ID,
        eventType: "wedding",
        eventDate: new Date("2026-09-01"),
        guestCount: 200,
        customerName: "Fatima Zahra",
        customerPhone: "+212612345678",
      });

      expect(result.eventId).toBe(EVENT_ID);
      expect(result.message).toContain("Inquiry submitted");
    });

    it("should throw NOT_FOUND when org is not active", async () => {
      mockOrgs.findFirst.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.submitInquiry({
          orgId: ORG_ID,
          eventType: "wedding",
          eventDate: new Date("2026-09-01"),
          guestCount: 200,
          customerName: "Test",
          customerPhone: "+212612345678",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // getClientEvent (public)
  // =========================================================================

  describe("getClientEvent", () => {
    it("should return event for matching ID and phone", async () => {
      const event = createOrder({ id: EVENT_ID, customerPhone: "+212612345678" });
      mockEvents.findFirst.mockResolvedValue(event as never);

      const caller = createPublicCaller();
      const result = await caller.getClientEvent({
        eventId: EVENT_ID,
        phone: "+212612345678",
      });

      expect(result.id).toBe(EVENT_ID);
    });

    it("should throw NOT_FOUND when phone does not match", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.getClientEvent({ eventId: EVENT_ID, phone: "+212600000000" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
