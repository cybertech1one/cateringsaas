import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the calendar tRPC router.
 * Covers checkPublicAvailability, getMonthCalendar, blockDate, unblockDate,
 * blockDateRange, getBlockedDates, checkAvailability.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    organizations: {
      findUnique: vi.fn(),
    },
    events: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    blockedDates: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
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
import { calendarRouter } from "../api/routers/calendar";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const BLOCKED_DATE_ID = "00000000-0000-4000-a000-000000000300";

function createOrgCaller(role: string = "staff") {
  return calendarRouter.createCaller({
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
  return calendarRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calendarRouter", () => {
  const mockOrgs = vi.mocked(db.organizations);
  const mockEvents = vi.mocked(db.events);
  const mockBlockedDates = vi.mocked(db.blockedDates);
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
  // checkPublicAvailability
  // =========================================================================

  describe("checkPublicAvailability", () => {
    it("should return available when date is free", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID, minGuests: 10, maxGuests: 500 } as never);
      mockBlockedDates.findFirst.mockResolvedValue(null as never);
      mockEvents.count.mockResolvedValue(0 as never);

      const caller = createPublicCaller();
      const result = await caller.checkPublicAvailability({
        orgSlug: "test-caterer",
        date: new Date("2026-07-01"),
      });

      expect(result.available).toBe(true);
    });

    it("should return unavailable when date is blocked", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID, minGuests: 10, maxGuests: 500 } as never);
      mockBlockedDates.findFirst.mockResolvedValue({ id: BLOCKED_DATE_ID } as never);

      const caller = createPublicCaller();
      const result = await caller.checkPublicAvailability({
        orgSlug: "test-caterer",
        date: new Date("2026-07-01"),
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Date is blocked");
    });

    it("should return unavailable when guest count exceeds max", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID, minGuests: 10, maxGuests: 200 } as never);
      mockBlockedDates.findFirst.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      const result = await caller.checkPublicAvailability({
        orgSlug: "test-caterer",
        date: new Date("2026-07-01"),
        guestCount: 300,
      });

      expect(result.available).toBe(false);
      expect(result.reason).toContain("Maximum capacity");
    });

    it("should return unavailable when guest count below min", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID, minGuests: 50, maxGuests: 500 } as never);
      mockBlockedDates.findFirst.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      const result = await caller.checkPublicAvailability({
        orgSlug: "test-caterer",
        date: new Date("2026-07-01"),
        guestCount: 5,
      });

      expect(result.available).toBe(false);
      expect(result.reason).toContain("Minimum guests");
    });

    it("should return unavailable when fully booked", async () => {
      mockOrgs.findUnique.mockResolvedValue({ id: ORG_ID, minGuests: 10, maxGuests: 500 } as never);
      mockBlockedDates.findFirst.mockResolvedValue(null as never);
      mockEvents.count.mockResolvedValue(3 as never); // max 3 per day

      const caller = createPublicCaller();
      const result = await caller.checkPublicAvailability({
        orgSlug: "test-caterer",
        date: new Date("2026-07-01"),
      });

      expect(result.available).toBe(false);
      expect(result.reason).toContain("Fully booked");
    });

    it("should throw NOT_FOUND when org slug is invalid", async () => {
      mockOrgs.findUnique.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.checkPublicAvailability({ orgSlug: "nonexistent", date: new Date() }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // getMonthCalendar
  // =========================================================================

  describe("getMonthCalendar", () => {
    it("should return events and blocked dates for a month", async () => {
      const events = [
        { id: "event-1", title: "Wedding", eventDate: new Date("2026-06-15") },
      ];
      const blocked = [
        { id: BLOCKED_DATE_ID, date: new Date("2026-06-20"), reason: "Vacation" },
      ];
      mockEvents.findMany.mockResolvedValue(events as never);
      mockBlockedDates.findMany.mockResolvedValue(blocked as never);

      const caller = createOrgCaller();
      const result = await caller.getMonthCalendar({ year: 2026, month: 6 });

      expect(result.events).toHaveLength(1);
      expect(result.blockedDates).toHaveLength(1);
    });

    it("should return empty arrays for an empty month", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);
      mockBlockedDates.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.getMonthCalendar({ year: 2026, month: 1 });

      expect(result.events).toEqual([]);
      expect(result.blockedDates).toEqual([]);
    });
  });

  // =========================================================================
  // blockDate
  // =========================================================================

  describe("blockDate", () => {
    it("should block a date", async () => {
      mockBlockedDates.findFirst.mockResolvedValue(null as never); // not already blocked
      mockBlockedDates.create.mockResolvedValue({
        id: BLOCKED_DATE_ID,
        date: new Date("2026-08-01"),
        reason: "Holiday",
        orgId: ORG_ID,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.blockDate({
        date: new Date("2026-08-01"),
        reason: "Holiday",
      });

      expect(result.id).toBe(BLOCKED_DATE_ID);
      expect(mockBlockedDates.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            reason: "Holiday",
          }),
        }),
      );
    });

    it("should throw CONFLICT when date is already blocked", async () => {
      mockBlockedDates.findFirst.mockResolvedValue({ id: "existing" } as never);

      const caller = createManagerCaller();
      await expect(
        caller.blockDate({ date: new Date("2026-08-01") }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  // =========================================================================
  // unblockDate
  // =========================================================================

  describe("unblockDate", () => {
    it("should unblock a date", async () => {
      mockBlockedDates.findFirst.mockResolvedValue({ id: BLOCKED_DATE_ID, orgId: ORG_ID } as never);
      mockBlockedDates.delete.mockResolvedValue({ id: BLOCKED_DATE_ID } as never);

      const caller = createManagerCaller();
      await caller.unblockDate({ blockedDateId: BLOCKED_DATE_ID });

      expect(mockBlockedDates.delete).toHaveBeenCalledWith({
        where: { id: BLOCKED_DATE_ID },
      });
    });

    it("should throw NOT_FOUND when blocked date does not belong to org", async () => {
      mockBlockedDates.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.unblockDate({ blockedDateId: BLOCKED_DATE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // blockDateRange
  // =========================================================================

  describe("blockDateRange", () => {
    it("should block a range of dates, skipping already blocked", async () => {
      mockBlockedDates.findMany.mockResolvedValue([
        { date: new Date("2026-08-02") },
      ] as never);
      mockBlockedDates.createMany.mockResolvedValue({ count: 2 } as never);

      const caller = createManagerCaller();
      const result = await caller.blockDateRange({
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-03"),
        reason: "Vacation",
      });

      expect(result.blockedCount).toBe(2);
      expect(result.skippedCount).toBe(1);
    });

    it("should throw BAD_REQUEST when range exceeds 90 days", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.blockDateRange({
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-06-01"), // >90 days
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  // =========================================================================
  // getBlockedDates
  // =========================================================================

  describe("getBlockedDates", () => {
    it("should return all blocked dates for org", async () => {
      const dates = [
        { id: BLOCKED_DATE_ID, date: new Date("2026-08-01"), reason: "Holiday" },
      ];
      mockBlockedDates.findMany.mockResolvedValue(dates as never);

      const caller = createOrgCaller();
      const result = await caller.getBlockedDates({});

      expect(result).toHaveLength(1);
    });

    it("should filter by year when provided", async () => {
      mockBlockedDates.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.getBlockedDates({ year: 2026 });

      expect(mockBlockedDates.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date(2026, 0, 1),
              lte: new Date(2026, 11, 31),
            },
          }),
        }),
      );
    });
  });

  // =========================================================================
  // checkAvailability
  // =========================================================================

  describe("checkAvailability", () => {
    it("should return a map of busy dates with event counts and blocked status", async () => {
      mockEvents.findMany.mockResolvedValue([
        { eventDate: new Date("2026-06-15"), status: "confirmed" },
        { eventDate: new Date("2026-06-15"), status: "confirmed" },
        { eventDate: new Date("2026-06-20"), status: "prep" },
      ] as never);
      mockBlockedDates.findMany.mockResolvedValue([
        { date: new Date("2026-06-20"), reason: "Holiday" },
        { date: new Date("2026-06-25"), reason: "Maintenance" },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.checkAvailability({
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-30"),
      });

      expect(result["2026-06-15"]!.eventCount).toBe(2);
      expect(result["2026-06-15"]!.isBlocked).toBe(false);
      expect(result["2026-06-20"]!.eventCount).toBe(1);
      expect(result["2026-06-20"]!.isBlocked).toBe(true);
      expect(result["2026-06-25"]!.isBlocked).toBe(true);
    });

    it("should return empty object when no events or blocks", async () => {
      mockEvents.findMany.mockResolvedValue([] as never);
      mockBlockedDates.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.checkAvailability({
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-31"),
      });

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
