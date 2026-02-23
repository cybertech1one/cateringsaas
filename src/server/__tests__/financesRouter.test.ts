import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the finances tRPC router.
 * Covers payment schedules, milestones, invoices, and revenue reporting.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    events: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    paymentSchedules: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    paymentMilestones: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    invoices: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
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
import { financesRouter } from "../api/routers/finances";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";
const SCHEDULE_ID = "00000000-0000-4000-a000-000000000400";
const MILESTONE_ID = "00000000-0000-4000-a000-000000000401";
const INVOICE_ID = "00000000-0000-4000-a000-000000000500";

function createOrgCaller(role: string = "staff") {
  return financesRouter.createCaller({
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
  return financesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("financesRouter", () => {
  const mockEvents = vi.mocked(db.events);
  const mockSchedules = vi.mocked(db.paymentSchedules);
  const mockMilestones = vi.mocked(db.paymentMilestones);
  const mockInvoices = vi.mocked(db.invoices);
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
  // createSchedule
  // =========================================================================

  describe("createSchedule", () => {
    it("should create 30/50/20 payment schedule with 3 milestones", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, orgId: ORG_ID } as never);
      mockSchedules.create.mockResolvedValue({ id: SCHEDULE_ID } as never);
      mockMilestones.createMany.mockResolvedValue({ count: 3 } as never);
      mockSchedules.findUnique.mockResolvedValue({
        id: SCHEDULE_ID,
        milestones: [
          { label: "Deposit (30%)", amount: 30000 },
          { label: "Progress (50%)", amount: 50000 },
          { label: "Final (20%)", amount: 20000 },
        ],
      } as never);

      const caller = createManagerCaller();
      const result = await caller.createSchedule({
        eventId: EVENT_ID,
        totalAmount: 100000,
        eventDate: new Date("2026-06-15"),
        template: "30_50_20",
      });

      expect(mockMilestones.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ percentage: 30, amount: 30000, milestoneType: "deposit" }),
          expect.objectContaining({ percentage: 50, amount: 50000, milestoneType: "progress" }),
          expect.objectContaining({ percentage: 20, amount: 20000, milestoneType: "final" }),
        ]),
      });
    });

    it("should create 50/50 schedule with 2 milestones", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, orgId: ORG_ID } as never);
      mockSchedules.create.mockResolvedValue({ id: SCHEDULE_ID } as never);
      mockMilestones.createMany.mockResolvedValue({ count: 2 } as never);
      mockSchedules.findUnique.mockResolvedValue({ id: SCHEDULE_ID, milestones: [] } as never);

      const caller = createManagerCaller();
      await caller.createSchedule({
        eventId: EVENT_ID,
        totalAmount: 80000,
        eventDate: new Date("2026-06-15"),
        template: "50_50",
      });

      expect(mockMilestones.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ percentage: 50, milestoneType: "deposit" }),
          expect.objectContaining({ percentage: 50, milestoneType: "final" }),
        ]),
      });
    });

    it("should create 100_upfront schedule with 1 milestone", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, orgId: ORG_ID } as never);
      mockSchedules.create.mockResolvedValue({ id: SCHEDULE_ID } as never);
      mockMilestones.createMany.mockResolvedValue({ count: 1 } as never);
      mockSchedules.findUnique.mockResolvedValue({ id: SCHEDULE_ID, milestones: [] } as never);

      const caller = createManagerCaller();
      await caller.createSchedule({
        eventId: EVENT_ID,
        totalAmount: 50000,
        eventDate: new Date("2026-06-15"),
        template: "100_upfront",
      });

      expect(mockMilestones.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            percentage: 100,
            amount: 50000,
            milestoneType: "full",
          }),
        ],
      });
    });

    it("should throw NOT_FOUND when event does not exist", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.createSchedule({
          eventId: EVENT_ID,
          totalAmount: 100000,
          eventDate: new Date("2026-06-15"),
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject non-positive total amount", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.createSchedule({
          eventId: EVENT_ID,
          totalAmount: 0,
          eventDate: new Date("2026-06-15"),
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // getMilestonesByEvent
  // =========================================================================

  describe("getMilestonesByEvent", () => {
    it("should return schedules with milestones for an event", async () => {
      const schedules = [
        { id: SCHEDULE_ID, milestones: [{ label: "Deposit" }] },
      ];
      mockSchedules.findMany.mockResolvedValue(schedules as never);

      const caller = createOrgCaller();
      const result = await caller.getMilestonesByEvent({ eventId: EVENT_ID });

      expect(result).toHaveLength(1);
      expect(mockSchedules.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: EVENT_ID, orgId: ORG_ID },
        }),
      );
    });
  });

  // =========================================================================
  // markAsPaid
  // =========================================================================

  describe("markAsPaid", () => {
    it("should mark milestone as paid and recalculate event totals", async () => {
      mockMilestones.findUnique.mockResolvedValue({
        id: MILESTONE_ID,
        status: "pending",
        amount: 30000,
        milestoneType: "deposit",
        schedule: { orgId: ORG_ID, eventId: EVENT_ID, totalAmount: 100000 },
      } as never);
      mockMilestones.update.mockResolvedValue({ id: MILESTONE_ID, status: "paid" } as never);
      mockMilestones.aggregate.mockResolvedValue({ _sum: { amount: 30000 } } as never);
      mockEvents.update.mockResolvedValue({} as never);
      mockEvents.findUnique.mockResolvedValue({ status: "accepted" } as never);

      const caller = createManagerCaller();
      const result = await caller.markAsPaid({
        milestoneId: MILESTONE_ID,
        paymentMethod: "cod",
      });

      expect(mockMilestones.update).toHaveBeenCalledWith({
        where: { id: MILESTONE_ID },
        data: expect.objectContaining({
          status: "paid",
          paymentMethod: "cod",
          confirmedBy: USER_ID,
        }),
      });

      // Recalculate event totals
      expect(mockEvents.update).toHaveBeenCalledWith({
        where: { id: EVENT_ID },
        data: { depositAmount: 30000, balanceDue: 70000 },
      });
    });

    it("should advance event to deposit_paid when deposit milestone is paid", async () => {
      mockMilestones.findUnique.mockResolvedValue({
        id: MILESTONE_ID,
        status: "pending",
        amount: 30000,
        milestoneType: "deposit",
        schedule: { orgId: ORG_ID, eventId: EVENT_ID, totalAmount: 100000 },
      } as never);
      mockMilestones.update.mockResolvedValue({} as never);
      mockMilestones.aggregate.mockResolvedValue({ _sum: { amount: 30000 } } as never);
      mockEvents.update.mockResolvedValue({} as never);
      mockEvents.findUnique.mockResolvedValue({ status: "accepted" } as never);

      const caller = createManagerCaller();
      await caller.markAsPaid({
        milestoneId: MILESTONE_ID,
        paymentMethod: "bank_transfer",
      });

      // Should be called twice: once for totals, once for status advance
      expect(mockEvents.update).toHaveBeenCalledTimes(2);
      expect(mockEvents.update).toHaveBeenCalledWith({
        where: { id: EVENT_ID },
        data: { status: "deposit_paid" },
      });
    });

    it("should throw NOT_FOUND when milestone does not belong to org", async () => {
      mockMilestones.findUnique.mockResolvedValue({
        id: MILESTONE_ID,
        status: "pending",
        schedule: { orgId: "other-org-id", eventId: EVENT_ID, totalAmount: 100000 },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.markAsPaid({ milestoneId: MILESTONE_ID, paymentMethod: "cod" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject already paid milestone", async () => {
      mockMilestones.findUnique.mockResolvedValue({
        id: MILESTONE_ID,
        status: "paid",
        schedule: { orgId: ORG_ID, eventId: EVENT_ID, totalAmount: 100000 },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.markAsPaid({ milestoneId: MILESTONE_ID, paymentMethod: "cod" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("should support all Morocco payment methods", async () => {
      const methods = ["cod", "bank_transfer", "cmi", "check", "mobile_money", "cash"] as const;

      for (const method of methods) {
        vi.clearAllMocks();
        mockMembers.findFirst.mockResolvedValue({
          id: MEMBER_ID,
          orgId: ORG_ID,
          role: "manager",
          permissions: null,
        } as never);
        mockMilestones.findUnique.mockResolvedValue({
          id: MILESTONE_ID,
          status: "pending",
          amount: 10000,
          milestoneType: "progress",
          schedule: { orgId: ORG_ID, eventId: EVENT_ID, totalAmount: 100000 },
        } as never);
        mockMilestones.update.mockResolvedValue({} as never);
        mockMilestones.aggregate.mockResolvedValue({ _sum: { amount: 10000 } } as never);
        mockEvents.update.mockResolvedValue({} as never);

        const caller = createManagerCaller();
        await caller.markAsPaid({ milestoneId: MILESTONE_ID, paymentMethod: method });

        expect(mockMilestones.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ paymentMethod: method }),
          }),
        );
      }
    });
  });

  // =========================================================================
  // createInvoice
  // =========================================================================

  describe("createInvoice", () => {
    it("should create invoice with TVA and line items", async () => {
      const event = {
        id: EVENT_ID,
        orgId: ORG_ID,
        customerName: "Ahmed Tazi",
        customerPhone: "+212612345678",
        customerEmail: null,
      };
      mockEvents.findFirst.mockResolvedValue(event as never);
      mockInvoices.count.mockResolvedValue(5 as never);
      mockInvoices.create.mockResolvedValue({ id: INVOICE_ID } as never);

      const caller = createManagerCaller();
      await caller.createInvoice({
        eventId: EVENT_ID,
        items: [
          { description: "Main Course", quantity: 150, unitPrice: 100, total: 15000 },
          { description: "Dessert", quantity: 150, unitPrice: 30, total: 4500 },
        ],
        dueDate: new Date("2026-06-01"),
      });

      const subtotal = 15000 + 4500; // 19500
      const taxAmount = Math.round(19500 * 0.2); // 3900
      const total = 19500 + 3900; // 23400

      expect(mockInvoices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            eventId: EVENT_ID,
            invoiceNumber: "DYF-2026-0006", // count 5 + 1, padded
            clientName: "Ahmed Tazi",
            subtotal: 19500,
            tvaAmount: 3900,
            totalAmount: 23400,
            amountDue: 23400,
            status: "draft",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when event does not exist", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.createInvoice({
          eventId: EVENT_ID,
          items: [{ description: "Test", quantity: 1, unitPrice: 100, total: 100 }],
          dueDate: new Date("2026-06-01"),
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // listInvoices
  // =========================================================================

  describe("listInvoices", () => {
    it("should return paginated invoices", async () => {
      mockInvoices.findMany.mockResolvedValue([
        { id: INVOICE_ID, invoiceNumber: "DYF-2026-0001" },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.listInvoices({});

      expect(result.invoices).toHaveLength(1);
    });

    it("should handle cursor pagination", async () => {
      const invoices = Array.from({ length: 3 }, (_, i) => ({ id: `inv-${i}` }));
      mockInvoices.findMany.mockResolvedValue(invoices as never);

      const caller = createOrgCaller();
      const result = await caller.listInvoices({ limit: 2 });

      expect(result.invoices).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });
  });

  // =========================================================================
  // sendInvoice
  // =========================================================================

  describe("sendInvoice", () => {
    it("should mark invoice as sent", async () => {
      mockInvoices.findFirst.mockResolvedValue({ id: INVOICE_ID, orgId: ORG_ID } as never);
      mockInvoices.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.sendInvoice({ invoiceId: INVOICE_ID });

      expect(result.success).toBe(true);
      expect(mockInvoices.update).toHaveBeenCalledWith({
        where: { id: INVOICE_ID },
        data: { status: "sent" },
      });
    });

    it("should throw NOT_FOUND when invoice does not exist", async () => {
      mockInvoices.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.sendInvoice({ invoiceId: INVOICE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // getRevenueOverview
  // =========================================================================

  describe("getRevenueOverview", () => {
    it("should return revenue metrics", async () => {
      mockMilestones.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 50000 } } as never)  // this month
        .mockResolvedValueOnce({ _sum: { amount: 40000 } } as never)  // last month
        .mockResolvedValueOnce({ _sum: { amount: 300000 } } as never) // year total
        .mockResolvedValueOnce({ _sum: { amount: 20000 } } as never)  // pending
        .mockResolvedValueOnce({ _sum: { amount: 5000 } } as never);  // overdue

      const caller = createOrgCaller();
      const result = await caller.getRevenueOverview({});

      expect(result.totalRevenue).toBe(300000);
      expect(result.monthRevenue).toBe(50000);
      expect(result.lastMonthRevenue).toBe(40000);
      expect(result.pendingAmount).toBe(20000);
      expect(result.overdueAmount).toBe(5000);
      // Growth: (50000 - 40000) / 40000 * 100 = 25%
      expect(result.monthOverMonthGrowth).toBe(25);
    });

    it("should handle zero last month revenue (no division by zero)", async () => {
      mockMilestones.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } } as never)  // this month
        .mockResolvedValueOnce({ _sum: { amount: null } } as never)   // last month (null)
        .mockResolvedValueOnce({ _sum: { amount: 10000 } } as never)  // year
        .mockResolvedValueOnce({ _sum: { amount: 0 } } as never)      // pending
        .mockResolvedValueOnce({ _sum: { amount: 0 } } as never);     // overdue

      const caller = createOrgCaller();
      const result = await caller.getRevenueOverview({});

      expect(result.monthOverMonthGrowth).toBe(0);
    });
  });

  // =========================================================================
  // getMonthlyRevenue
  // =========================================================================

  describe("getMonthlyRevenue", () => {
    it("should return monthly revenue and event counts", async () => {
      mockMilestones.aggregate.mockResolvedValue({ _sum: { amount: 25000 } } as never);
      mockEvents.count.mockResolvedValue(3 as never);

      const caller = createOrgCaller();
      const result = await caller.getMonthlyRevenue({ months: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]!.revenue).toBe(25000);
      expect(result[0]!.eventCount).toBe(3);
    });
  });

  // =========================================================================
  // listAllMilestones
  // =========================================================================

  describe("listAllMilestones", () => {
    it("should return paginated milestones with event info", async () => {
      const milestones = [
        {
          id: MILESTONE_ID,
          label: "Deposit (30%)",
          amount: 30000,
          status: "pending",
          dueDate: new Date("2026-06-01"),
          schedule: {
            id: SCHEDULE_ID,
            totalAmount: 100000,
            event: {
              id: EVENT_ID,
              title: "Wedding Reception",
              customerName: "Ahmed Tazi",
              eventDate: new Date("2026-06-15"),
            },
          },
        },
      ];
      mockMilestones.findMany.mockResolvedValue(milestones as never);

      const caller = createOrgCaller();
      const result = await caller.listAllMilestones({});

      expect(result.milestones).toHaveLength(1);
      expect(result.milestones[0]!.schedule.event.title).toBe("Wedding Reception");
      expect(result.nextCursor).toBeUndefined();
    });

    it("should filter by status", async () => {
      mockMilestones.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.listAllMilestones({ status: "paid" });

      expect(mockMilestones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schedule: { orgId: ORG_ID },
            status: "paid",
          }),
        }),
      );
    });

    it("should handle cursor pagination", async () => {
      const milestones = Array.from({ length: 3 }, (_, i) => ({
        id: `m-${i}`,
        label: `Milestone ${i}`,
        schedule: {
          id: SCHEDULE_ID,
          totalAmount: 100000,
          event: { id: EVENT_ID, title: "Test", customerName: "Test", eventDate: new Date() },
        },
      }));
      mockMilestones.findMany.mockResolvedValue(milestones as never);

      const caller = createOrgCaller();
      const result = await caller.listAllMilestones({ limit: 2 });

      expect(result.milestones).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });

    it("should return empty list when no milestones exist", async () => {
      mockMilestones.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.listAllMilestones({});

      expect(result.milestones).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should order by dueDate ascending", async () => {
      mockMilestones.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.listAllMilestones({});

      expect(mockMilestones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dueDate: "asc" },
        }),
      );
    });
  });

  // =========================================================================
  // getPaymentMethodBreakdown
  // =========================================================================

  describe("getPaymentMethodBreakdown", () => {
    it("should return breakdown by payment method with percentages", async () => {
      mockMilestones.findMany.mockResolvedValue([
        { paymentMethod: "cod", amount: 60000 },
        { paymentMethod: "cod", amount: 20000 },
        { paymentMethod: "bank_transfer", amount: 15000 },
        { paymentMethod: "cmi", amount: 5000 },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getPaymentMethodBreakdown({});

      expect(result.total).toBe(100000);
      expect(result.breakdown.cod).toBe(80000);
      expect(result.breakdown.bank_transfer).toBe(15000);
      expect(result.breakdown.cmi).toBe(5000);

      // Methods sorted by amount descending
      expect(result.methods[0]!.method).toBe("cod");
      expect(result.methods[0]!.amount).toBe(80000);
      expect(result.methods[0]!.percentage).toBe(80);

      expect(result.methods[1]!.method).toBe("bank_transfer");
      expect(result.methods[1]!.percentage).toBe(15);

      expect(result.methods[2]!.method).toBe("cmi");
      expect(result.methods[2]!.percentage).toBe(5);
    });

    it("should return empty breakdown when no paid milestones", async () => {
      mockMilestones.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.getPaymentMethodBreakdown({});

      expect(result.total).toBe(0);
      expect(result.methods).toHaveLength(0);
      expect(Object.keys(result.breakdown)).toHaveLength(0);
    });

    it("should only include paid milestones with non-null paymentMethod", async () => {
      mockMilestones.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.getPaymentMethodBreakdown({});

      expect(mockMilestones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "paid",
            paymentMethod: { not: null },
          }),
        }),
      );
    });

    it("should handle single payment method", async () => {
      mockMilestones.findMany.mockResolvedValue([
        { paymentMethod: "cash", amount: 50000 },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getPaymentMethodBreakdown({});

      expect(result.methods).toHaveLength(1);
      expect(result.methods[0]!.percentage).toBe(100);
    });
  });

  // =========================================================================
  // Authentication
  // =========================================================================

  describe("authentication", () => {
    it("should reject unauthenticated access to createSchedule", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.createSchedule({
          eventId: EVENT_ID,
          totalAmount: 100000,
          eventDate: new Date(),
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject unauthenticated access to markAsPaid", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.markAsPaid({ milestoneId: MILESTONE_ID, paymentMethod: "cod" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject unauthenticated access to getRevenueOverview", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.getRevenueOverview({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
