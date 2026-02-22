/**
 * Diyafa — Finances Router
 *
 * Financial management for catering businesses:
 * - Payment schedules & milestones (deposit → progress → final)
 * - COD tracking (critical for Morocco: 74% cash)
 * - Invoice generation (TVA 20% compliant)
 * - Revenue reporting & analytics
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────

export const financesRouter = createTRPCRouter({
  // ─── Payment Schedules & Milestones ──────────

  /** Create standard payment schedule (30/50/20) for an event */
  createSchedule: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        totalAmount: z.number().positive(),
        eventDate: z.date(),
        template: z.enum(["30_50_20", "50_50", "100_upfront"]).default("30_50_20"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      // Create the schedule
      const schedule = await ctx.db.paymentSchedules.create({
        data: {
          eventId: input.eventId,
          orgId: ctx.orgId,
          templateName: input.template,
          totalAmount: input.totalAmount,
        },
      });

      // Build milestones
      const now = new Date();
      const eventDate = input.eventDate;
      const midDate = new Date((now.getTime() + eventDate.getTime()) / 2);
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      type MilestoneData = {
        scheduleId: string;
        label: string;
        milestoneType: "deposit" | "progress" | "final" | "full";
        percentage: number;
        amount: number;
        dueDate: Date;
        status: "pending";
      };

      const milestones: MilestoneData[] = [];

      switch (input.template) {
        case "30_50_20":
          milestones.push(
            { scheduleId: schedule.id, label: "Deposit (30%)", milestoneType: "deposit", percentage: 30, amount: Math.round(input.totalAmount * 0.3), dueDate: threeDaysLater, status: "pending" },
            { scheduleId: schedule.id, label: "Progress (50%)", milestoneType: "progress", percentage: 50, amount: Math.round(input.totalAmount * 0.5), dueDate: midDate, status: "pending" },
            { scheduleId: schedule.id, label: "Final (20%)", milestoneType: "final", percentage: 20, amount: Math.round(input.totalAmount * 0.2), dueDate: eventDate, status: "pending" },
          );
          break;
        case "50_50":
          milestones.push(
            { scheduleId: schedule.id, label: "Deposit (50%)", milestoneType: "deposit", percentage: 50, amount: Math.round(input.totalAmount * 0.5), dueDate: threeDaysLater, status: "pending" },
            { scheduleId: schedule.id, label: "Final (50%)", milestoneType: "final", percentage: 50, amount: Math.round(input.totalAmount * 0.5), dueDate: eventDate, status: "pending" },
          );
          break;
        case "100_upfront":
          milestones.push(
            { scheduleId: schedule.id, label: "Full Payment", milestoneType: "full", percentage: 100, amount: input.totalAmount, dueDate: threeDaysLater, status: "pending" },
          );
          break;
      }

      await ctx.db.paymentMilestones.createMany({ data: milestones });

      return ctx.db.paymentSchedules.findUnique({
        where: { id: schedule.id },
        include: { milestones: { orderBy: { dueDate: "asc" } } },
      });
    }),

  /** Get milestones for an event */
  getMilestonesByEvent: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      eventId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const schedules = await ctx.db.paymentSchedules.findMany({
        where: { eventId: input.eventId, orgId: ctx.orgId },
        include: { milestones: { orderBy: { dueDate: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      return schedules;
    }),

  /** Mark a milestone as paid */
  markAsPaid: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      milestoneId: z.string().uuid(),
      paymentMethod: z.enum(["cod", "bank_transfer", "cmi", "check", "mobile_money", "cash"]),
      paymentReference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const milestone = await ctx.db.paymentMilestones.findUnique({
        where: { id: input.milestoneId },
        include: { schedule: { select: { orgId: true, eventId: true, totalAmount: true } } },
      });

      if (!milestone || milestone.schedule.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (milestone.status === "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already paid" });
      }

      const updated = await ctx.db.paymentMilestones.update({
        where: { id: input.milestoneId },
        data: {
          status: "paid",
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
          notes: input.notes,
          paidAt: new Date(),
          confirmedBy: ctx.user.id,
        },
      });

      // Recalculate event totals
      const allPaid = await ctx.db.paymentMilestones.aggregate({
        where: {
          schedule: { eventId: milestone.schedule.eventId, orgId: ctx.orgId },
          status: "paid",
        },
        _sum: { amount: true },
      });

      const totalPaid = Number(allPaid._sum?.amount ?? 0);
      const totalAmount = milestone.schedule.totalAmount;

      await ctx.db.events.update({
        where: { id: milestone.schedule.eventId },
        data: {
          depositAmount: totalPaid,
          balanceDue: totalAmount - totalPaid,
        },
      });

      // If deposit milestone, advance event to deposit_paid → confirmed
      if (milestone.milestoneType === "deposit") {
        const event = await ctx.db.events.findUnique({
          where: { id: milestone.schedule.eventId },
          select: { status: true },
        });
        if (event && String(event.status) === "accepted") {
          await ctx.db.events.update({
            where: { id: milestone.schedule.eventId },
            data: { status: "deposit_paid" },
          });
        }
      }

      return updated;
    }),

  // ─── Invoices ───────────────────────────────

  /** Create invoice for an event */
  createInvoice: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      eventId: z.string().uuid(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        total: z.number().nonnegative(),
      })),
      notes: z.string().optional(),
      dueDate: z.date(),
      taxRate: z.number().min(0).max(100).default(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const year = new Date().getFullYear();
      const count = await ctx.db.invoices.count({ where: { orgId: ctx.orgId } });
      const invoiceNumber = `DYF-${year}-${String(count + 1).padStart(4, "0")}`;

      const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = Math.round(subtotal * (input.taxRate / 100));
      const total = subtotal + taxAmount;

      return ctx.db.invoices.create({
        data: {
          eventId: input.eventId,
          orgId: ctx.orgId,
          invoiceNumber,
          clientName: event.customerName,
          clientPhone: event.customerPhone,
          clientEmail: event.customerEmail,
          subtotal,
          tvaAmount: taxAmount,
          totalAmount: total,
          amountDue: total,
          notes: input.notes,
          dueDate: input.dueDate,
          issuedAt: new Date(),
          status: "draft",
          lineItems: {
            create: input.items.map((item, idx) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              sortOrder: idx,
            })),
          },
        },
        include: { lineItems: true },
      });
    }),

  /** List invoices */
  listInvoices: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const invoices = await ctx.db.invoices.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { issuedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          event: {
            select: {
              id: true,
              title: true,
              customerName: true,
              eventDate: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (invoices.length > input.limit) {
        const last = invoices.pop();
        nextCursor = last?.id;
      }

      return { invoices, nextCursor };
    }),

  /** Send invoice */
  sendInvoice: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      invoiceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoices.findFirst({
        where: { id: input.invoiceId, orgId: ctx.orgId },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.invoices.update({
        where: { id: input.invoiceId },
        data: { status: "sent" },
      });

      return { success: true };
    }),

  // ─── Revenue Reports ────────────────────────

  /** Revenue overview dashboard */
  getRevenueOverview: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisYear = new Date(now.getFullYear(), 0, 1);

      const milestoneWhere = (extra: Record<string, unknown>) => ({
        schedule: { orgId: ctx.orgId },
        ...extra,
      });

      const [thisMonthRev, lastMonthRev, yearRev, pending, overdue] =
        await Promise.all([
          ctx.db.paymentMilestones.aggregate({
            where: milestoneWhere({ status: "paid", paidAt: { gte: thisMonth } }),
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: milestoneWhere({ status: "paid", paidAt: { gte: lastMonth, lt: thisMonth } }),
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: milestoneWhere({ status: "paid", paidAt: { gte: thisYear } }),
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: milestoneWhere({ status: "pending" }),
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: milestoneWhere({ status: "overdue" }),
            _sum: { amount: true },
          }),
        ]);

      const thisMonthTotal = Number(thisMonthRev._sum?.amount ?? 0);
      const lastMonthTotal = Number(lastMonthRev._sum?.amount ?? 0);
      const growthRate = lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

      return {
        totalRevenue: Number(yearRev._sum?.amount ?? 0),
        monthRevenue: thisMonthTotal,
        lastMonthRevenue: lastMonthTotal,
        pendingAmount: Number(pending._sum?.amount ?? 0),
        overdueAmount: Number(overdue._sum?.amount ?? 0),
        monthOverMonthGrowth: Math.round(growthRate * 10) / 10,
      };
    }),

  /** Monthly revenue chart data */
  getMonthlyRevenue: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      months: z.number().int().min(1).max(24).default(12),
    }))
    .query(async ({ ctx, input }) => {
      const results: Array<{ month: string; revenue: number; eventCount: number }> = [];

      for (let i = input.months - 1; i >= 0; i--) {
        const start = new Date();
        start.setMonth(start.getMonth() - i, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const [revenue, eventCount] = await Promise.all([
          ctx.db.paymentMilestones.aggregate({
            where: {
              schedule: { orgId: ctx.orgId },
              status: "paid",
              paidAt: { gte: start, lt: end },
            },
            _sum: { amount: true },
          }),
          ctx.db.events.count({
            where: { orgId: ctx.orgId, eventDate: { gte: start, lt: end } },
          }),
        ]);

        results.push({
          month: start.toISOString().slice(0, 7),
          revenue: Number(revenue._sum?.amount ?? 0),
          eventCount,
        });
      }

      return results;
    }),
});
