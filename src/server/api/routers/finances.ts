/**
 * Diyafa — Finances Router
 *
 * Financial management for catering businesses:
 * - Milestone payments (deposit → progress → final)
 * - COD tracking (critical for Morocco: 74% cash)
 * - Invoice generation (TVA 20% compliant)
 * - Revenue reporting & analytics
 * - Bank transfer confirmation workflow
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  orgProcedure,
  orgManagerProcedure,
  orgAdminProcedure,
} from "~/server/api/trpc";

// ──────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────

const milestoneTypeEnum = z.enum(["deposit", "progress", "final", "full"]);
const paymentMethodEnum = z.enum(["cod", "bank_transfer", "cmi", "check", "mobile_wallet"]);
const milestoneStatusEnum = z.enum(["pending", "paid", "overdue", "cancelled"]);
const invoiceStatusEnum = z.enum(["draft", "sent", "paid", "overdue", "cancelled"]);

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────

export const financesRouter = createTRPCRouter({
  // ─── Payment Milestones ─────────────────────

  /** Create payment milestone for an event */
  createMilestone: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        milestoneType: milestoneTypeEnum,
        amount: z.number().positive(),
        percentage: z.number().min(0).max(100).optional(),
        dueDate: z.date(),
        paymentMethod: paymentMethodEnum.optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      return ctx.db.paymentMilestones.create({
        data: {
          eventId: input.eventId,
          orgId: ctx.orgId,
          milestoneType: input.milestoneType,
          amount: input.amount,
          percentage: input.percentage,
          dueDate: input.dueDate,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          status: "pending",
        },
      });
    }),

  /** Create standard payment schedule (30/50/20) */
  createStandardSchedule: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        totalAmount: z.number().positive(),
        eventDate: z.date(),
        schedule: z.enum(["30_50_20", "50_50", "100_upfront"]).default("30_50_20"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const milestones: Array<{
        milestoneType: string;
        amount: number;
        percentage: number;
        dueDate: Date;
      }> = [];

      const now = new Date();
      const eventDate = input.eventDate;
      const midDate = new Date((now.getTime() + eventDate.getTime()) / 2);

      switch (input.schedule) {
        case "30_50_20":
          milestones.push(
            { milestoneType: "deposit", amount: input.totalAmount * 0.3, percentage: 30, dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
            { milestoneType: "progress", amount: input.totalAmount * 0.5, percentage: 50, dueDate: midDate },
            { milestoneType: "final", amount: input.totalAmount * 0.2, percentage: 20, dueDate: eventDate }
          );
          break;
        case "50_50":
          milestones.push(
            { milestoneType: "deposit", amount: input.totalAmount * 0.5, percentage: 50, dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
            { milestoneType: "final", amount: input.totalAmount * 0.5, percentage: 50, dueDate: eventDate }
          );
          break;
        case "100_upfront":
          milestones.push(
            { milestoneType: "full", amount: input.totalAmount, percentage: 100, dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }
          );
          break;
      }

      const created = await Promise.all(
        milestones.map((m) =>
          ctx.db.paymentMilestones.create({
            data: {
              eventId: input.eventId,
              orgId: ctx.orgId,
              ...m,
              status: "pending",
            },
          })
        )
      );

      return created;
    }),

  /** Get milestones for an event */
  getMilestonesByEvent: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.paymentMilestones.findMany({
        where: { eventId: input.eventId, orgId: ctx.orgId },
        orderBy: { dueDate: "asc" },
      });
    }),

  /** Mark a milestone as paid (COD/transfer confirmation) */
  markAsPaid: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        milestoneId: z.string().uuid(),
        paymentMethod: paymentMethodEnum,
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const milestone = await ctx.db.paymentMilestones.findFirst({
        where: { id: input.milestoneId, orgId: ctx.orgId },
        include: { event: { select: { id: true, depositAmount: true, totalAmount: true } } },
      });

      if (!milestone) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (milestone.status === "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already paid" });
      }

      // Mark milestone as paid
      const updated = await ctx.db.paymentMilestones.update({
        where: { id: input.milestoneId },
        data: {
          status: "paid",
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          paidAt: new Date(),
          confirmedBy: ctx.user.id,
        },
      });

      // Update event deposit amount
      const allPaid = await ctx.db.paymentMilestones.aggregate({
        where: {
          eventId: milestone.eventId,
          orgId: ctx.orgId,
          status: "paid",
        },
        _sum: { amount: true },
      });

      const totalPaid = Number(allPaid._sum.amount ?? 0);
      const totalAmount = Number(milestone.event.totalAmount);

      await ctx.db.events.update({
        where: { id: milestone.eventId },
        data: {
          depositAmount: totalPaid,
          balanceDue: totalAmount - totalPaid,
        },
      });

      // If deposit milestone was paid, advance event status
      if (milestone.milestoneType === "deposit") {
        const event = await ctx.db.events.findUnique({
          where: { id: milestone.eventId },
          select: { status: true },
        });

        if (event?.status === "deposit_pending") {
          await ctx.db.events.update({
            where: { id: milestone.eventId },
            data: { status: "deposit_received" },
          });
        }
      }

      return updated;
    }),

  // ─── Invoices ───────────────────────────────

  /** Create invoice for an event */
  createInvoice: orgManagerProcedure
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Auto-generate invoice number: DYF-2026-0001
      const year = new Date().getFullYear();
      const count = await ctx.db.invoices.count({
        where: { orgId: ctx.orgId },
      });
      const invoiceNumber = `DYF-${year}-${String(count + 1).padStart(4, "0")}`;

      const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * (input.taxRate / 100);
      const total = subtotal + taxAmount;

      return ctx.db.invoices.create({
        data: {
          eventId: input.eventId,
          orgId: ctx.orgId,
          invoiceNumber,
          items: input.items,
          subtotal,
          taxAmount,
          total,
          notes: input.notes,
          dueDate: input.dueDate,
          issuedAt: new Date(),
          status: "draft",
        },
      });
    }),

  /** List invoices */
  listInvoices: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        status: z.array(invoiceStatusEnum).optional(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.status && input.status.length > 0) {
        where.status = { in: input.status };
      }

      const invoices = await ctx.db.invoices.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          event: {
            select: {
              id: true,
              title: true,
              clientName: true,
              eventDate: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (invoices.length > input.limit) {
        const nextItem = invoices.pop();
        nextCursor = nextItem?.id;
      }

      return { invoices, nextCursor };
    }),

  /** Send invoice (email + WhatsApp) */
  sendInvoice: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        invoiceId: z.string().uuid(),
        sendVia: z.enum(["whatsapp", "email", "both"]).default("both"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoices.findFirst({
        where: { id: input.invoiceId, orgId: ctx.orgId },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.invoices.update({
        where: { id: input.invoiceId },
        data: { status: "sent" },
      });

      // TODO: Send via WhatsApp/email

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

      const [thisMonthRevenue, lastMonthRevenue, yearRevenue, pendingPayments, overduePayments] =
        await Promise.all([
          ctx.db.paymentMilestones.aggregate({
            where: { orgId: ctx.orgId, status: "paid", paidAt: { gte: thisMonth } },
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: { orgId: ctx.orgId, status: "paid", paidAt: { gte: lastMonth, lt: thisMonth } },
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: { orgId: ctx.orgId, status: "paid", paidAt: { gte: thisYear } },
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: { orgId: ctx.orgId, status: "pending" },
            _sum: { amount: true },
          }),
          ctx.db.paymentMilestones.aggregate({
            where: { orgId: ctx.orgId, status: "overdue" },
            _sum: { amount: true },
          }),
        ]);

      const thisMonthTotal = Number(thisMonthRevenue._sum.amount ?? 0);
      const lastMonthTotal = Number(lastMonthRevenue._sum.amount ?? 0);
      const growthRate = lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

      return {
        thisMonthRevenue: thisMonthTotal,
        lastMonthRevenue: lastMonthTotal,
        yearRevenue: Number(yearRevenue._sum.amount ?? 0),
        pendingPayments: Number(pendingPayments._sum.amount ?? 0),
        overduePayments: Number(overduePayments._sum.amount ?? 0),
        monthOverMonthGrowth: Math.round(growthRate * 10) / 10,
      };
    }),

  /** Monthly revenue chart data */
  getMonthlyRevenue: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        months: z.number().int().min(1).max(24).default(12),
      })
    )
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
            where: { orgId: ctx.orgId, status: "paid", paidAt: { gte: start, lt: end } },
            _sum: { amount: true },
          }),
          ctx.db.events.count({
            where: { orgId: ctx.orgId, eventDate: { gte: start, lt: end } },
          }),
        ]);

        results.push({
          month: start.toISOString().slice(0, 7), // "2026-02"
          revenue: Number(revenue._sum.amount ?? 0),
          eventCount,
        });
      }

      return results;
    }),
});
