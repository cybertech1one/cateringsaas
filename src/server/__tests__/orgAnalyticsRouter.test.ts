import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the orgAnalytics tRPC router.
 * Covers getRevenueOverview, getBookingFunnel, getRevenueByEventType,
 * getMonthlyTrend, getClientSources, getUpcomingPipeline, getDashboardSummary.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    events: {
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    quotes: {
      count: vi.fn(),
    },
    paymentMilestones: {
      count: vi.fn(),
    },
    clientProfiles: {
      count: vi.fn(),
    },
    reviews: {
      aggregate: vi.fn(),
    },
    conversations: {
      aggregate: vi.fn(),
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
import { orgAnalyticsRouter } from "../api/routers/orgAnalytics";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";

function createOrgCaller(role: string = "staff") {
  return orgAnalyticsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "test@example.com" } as never,
    orgId: ORG_ID,
    orgRole: role,
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

function createUnauthCaller() {
  return orgAnalyticsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("orgAnalyticsRouter", () => {
  const mockEvents = vi.mocked(db.events);
  const mockQuotes = vi.mocked(db.quotes);
  const mockPaymentMilestones = vi.mocked(db.paymentMilestones);
  const mockClientProfiles = vi.mocked(db.clientProfiles);
  const mockReviews = vi.mocked(db.reviews);
  const mockConversations = vi.mocked(db.conversations);
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
  // getRevenueOverview
  // =========================================================================

  describe("getRevenueOverview", () => {
    it("should return revenue comparison between current and previous month", async () => {
      mockEvents.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 500000 }, _count: { id: 5 } } as never)   // current
        .mockResolvedValueOnce({ _sum: { totalAmount: 400000 }, _count: { id: 4 } } as never)   // previous
        .mockResolvedValueOnce({ _sum: { totalAmount: 2000000 }, _count: { id: 20 } } as never); // all-time

      const caller = createOrgCaller();
      const result = await caller.getRevenueOverview({});

      expect(result.currentMonthRevenue).toBe(500000);
      expect(result.previousMonthRevenue).toBe(400000);
      expect(result.revenueGrowth).toBe(25); // ((500k - 400k) / 400k) * 100
      expect(result.totalAllTimeRevenue).toBe(2000000);
      expect(result.totalAllTimeEvents).toBe(20);
    });

    it("should return 0 growth when previous month is 0", async () => {
      mockEvents.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 100000 }, _count: { id: 1 } } as never)
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 }, _count: { id: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { totalAmount: 100000 }, _count: { id: 1 } } as never);

      const caller = createOrgCaller();
      const result = await caller.getRevenueOverview({});

      expect(result.revenueGrowth).toBe(0);
    });

    it("should handle null sums gracefully", async () => {
      mockEvents.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: null }, _count: { id: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { totalAmount: null }, _count: { id: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { totalAmount: null }, _count: { id: 0 } } as never);

      const caller = createOrgCaller();
      const result = await caller.getRevenueOverview({});

      expect(result.currentMonthRevenue).toBe(0);
      expect(result.totalAllTimeRevenue).toBe(0);
    });
  });

  // =========================================================================
  // getBookingFunnel
  // =========================================================================

  describe("getBookingFunnel", () => {
    it("should return funnel conversion metrics", async () => {
      mockEvents.count
        .mockResolvedValueOnce(100 as never) // inquiries
        .mockResolvedValueOnce(60 as never)  // quoted
        .mockResolvedValueOnce(40 as never)  // accepted
        .mockResolvedValueOnce(30 as never)  // confirmed
        .mockResolvedValueOnce(25 as never)  // completed
        .mockResolvedValueOnce(10 as never); // cancelled

      const caller = createOrgCaller();
      const result = await caller.getBookingFunnel({});

      expect(result.inquiries).toBe(100);
      expect(result.completed).toBe(25);
      expect(result.conversionRate).toBe(25); // 25/100
      expect(result.cancelled).toBe(10);
    });

    it("should return 0 conversion when no inquiries", async () => {
      mockEvents.count.mockResolvedValue(0 as never);

      const caller = createOrgCaller();
      const result = await caller.getBookingFunnel({});

      expect(result.conversionRate).toBe(0);
      expect(result.quoteToBookRate).toBe(0);
    });
  });

  // =========================================================================
  // getRevenueByEventType
  // =========================================================================

  describe("getRevenueByEventType", () => {
    it("should return revenue breakdown by event type", async () => {
      mockEvents.groupBy.mockResolvedValue([
        { eventType: "wedding", _sum: { totalAmount: 1000000 }, _count: { id: 10 }, _avg: { guestCount: 200 } },
        { eventType: "corporate", _sum: { totalAmount: 500000 }, _count: { id: 15 }, _avg: { guestCount: 50 } },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getRevenueByEventType({});

      expect(result).toHaveLength(2);
      expect(result[0]!.eventType).toBe("wedding");
      expect(result[0]!.revenue).toBe(1000000);
      expect(result[0]!.eventCount).toBe(10);
      expect(result[0]!.avgGuestCount).toBe(200);
    });

    it("should return empty when no completed events", async () => {
      mockEvents.groupBy.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.getRevenueByEventType({});

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getMonthlyTrend
  // =========================================================================

  describe("getMonthlyTrend", () => {
    it("should return 12 months of revenue data", async () => {
      // Mock 12 aggregate calls
      for (let i = 0; i < 12; i++) {
        mockEvents.aggregate.mockResolvedValueOnce({
          _sum: { totalAmount: (i + 1) * 10000 },
          _count: { id: i + 1 },
        } as never);
      }

      const caller = createOrgCaller();
      const result = await caller.getMonthlyTrend({});

      expect(result).toHaveLength(12);
      expect(result[0]).toHaveProperty("month");
      expect(result[0]).toHaveProperty("revenue");
      expect(result[0]).toHaveProperty("events");
    });
  });

  // =========================================================================
  // getClientSources
  // =========================================================================

  describe("getClientSources", () => {
    it("should return event counts grouped by source", async () => {
      mockEvents.groupBy.mockResolvedValue([
        { source: "direct", _count: { id: 30 }, _sum: { totalAmount: 1500000 } },
        { source: "marketplace", _count: { id: 15 }, _sum: { totalAmount: 750000 } },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getClientSources({});

      expect(result).toHaveLength(2);
      expect(result[0]!.source).toBe("direct");
      expect(result[0]!.eventCount).toBe(30);
    });
  });

  // =========================================================================
  // getUpcomingPipeline
  // =========================================================================

  describe("getUpcomingPipeline", () => {
    it("should return upcoming event counts and action items", async () => {
      mockEvents.count
        .mockResolvedValueOnce(3 as never)   // this week
        .mockResolvedValueOnce(8 as never)   // this month
        .mockResolvedValueOnce(15 as never); // next 3 months
      mockQuotes.count.mockResolvedValue(5 as never);
      mockPaymentMilestones.count.mockResolvedValue(2 as never);

      const caller = createOrgCaller();
      const result = await caller.getUpcomingPipeline({});

      expect(result.thisWeek).toBe(3);
      expect(result.thisMonth).toBe(8);
      expect(result.next3Months).toBe(15);
      expect(result.pendingQuotes).toBe(5);
      expect(result.overduePayments).toBe(2);
    });
  });

  // =========================================================================
  // getDashboardSummary
  // =========================================================================

  describe("getDashboardSummary", () => {
    it("should return top-level KPIs", async () => {
      mockEvents.aggregate.mockResolvedValue({ _sum: { totalAmount: 300000 } } as never);
      mockEvents.count
        .mockResolvedValueOnce(7 as never)  // active events
        .mockResolvedValueOnce(4 as never); // pending inquiries
      mockClientProfiles.count.mockResolvedValue(25 as never);
      mockReviews.aggregate.mockResolvedValue({ _avg: { ratingOverall: 4.5 } } as never);
      mockConversations.aggregate.mockResolvedValue({ _sum: { unreadOrg: 3 } } as never);

      const caller = createOrgCaller();
      const result = await caller.getDashboardSummary({});

      expect(result.monthRevenue).toBe(300000);
      expect(result.activeEvents).toBe(7);
      expect(result.totalClients).toBe(25);
      expect(result.avgRating).toBe(4.5);
      expect(result.pendingInquiries).toBe(4);
      expect(result.unreadMessages).toBe(3);
    });

    it("should handle null aggregates gracefully", async () => {
      mockEvents.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as never);
      mockEvents.count.mockResolvedValue(0 as never);
      mockClientProfiles.count.mockResolvedValue(0 as never);
      mockReviews.aggregate.mockResolvedValue({ _avg: { ratingOverall: null } } as never);
      mockConversations.aggregate.mockResolvedValue({ _sum: { unreadOrg: null } } as never);

      const caller = createOrgCaller();
      const result = await caller.getDashboardSummary({});

      expect(result.monthRevenue).toBe(0);
      expect(result.avgRating).toBe(0);
      expect(result.unreadMessages).toBe(0);
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.getDashboardSummary({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
