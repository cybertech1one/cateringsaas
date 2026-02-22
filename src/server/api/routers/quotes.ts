/**
 * Diyafa — Quotes Router
 *
 * Professional quote management with versioning.
 * Quotes are the backbone of catering negotiations:
 * - Create quotes from templates or scratch
 * - Version control (each revision is a new version)
 * - Send via WhatsApp or email
 * - Client acceptance/rejection flow
 * - Auto-calculate totals with TVA (20%)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

// ──────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────

const quoteStatusEnum = z.enum([
  "draft",
  "sent",
  "revised",
  "accepted",
  "rejected",
  "expired",
]);

const quoteItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(["appetizer", "main", "dessert", "drink", "extra", "setup", "staff", "equipment", "delivery"]),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
  isIncluded: z.boolean().default(true),
  notes: z.string().optional(),
});

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────

export const quotesRouter = createTRPCRouter({
  /** List quotes for an event */
  listByEvent: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.quotes.findMany({
        where: { eventId: input.eventId, orgId: ctx.orgId },
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          subtotal: true,
          taxAmount: true,
          total: true,
          perHeadPrice: true,
          validUntil: true,
          sentAt: true,
          acceptedAt: true,
          createdAt: true,
        },
      });
    }),

  /** List all quotes with filters */
  listAll: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        status: z.array(quoteStatusEnum).optional(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.status && input.status.length > 0) {
        where.status = { in: input.status };
      }

      const quotes = await ctx.db.quotes.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventType: true,
              eventDate: true,
              guestCount: true,
              clientName: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (quotes.length > input.limit) {
        const nextItem = quotes.pop();
        nextCursor = nextItem?.id;
      }

      return { quotes, nextCursor };
    }),

  /** Get quote by ID */
  getById: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        quoteId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventType: true,
              eventDate: true,
              guestCount: true,
              clientName: true,
              clientPhone: true,
              clientEmail: true,
              venueName: true,
            },
          },
        },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      return quote;
    }),

  /** Create a new quote */
  create: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        items: z.array(quoteItemSchema),
        perHeadPrice: z.number().nonnegative().optional(),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
        termsAndConditions: z.string().optional(),
        includeTax: z.boolean().default(true),
        taxRate: z.number().min(0).max(100).default(20), // TVA 20% Morocco
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event belongs to org
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true, guestCount: true },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Get next version number
      const latestQuote = await ctx.db.quotes.findFirst({
        where: { eventId: input.eventId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      const versionNumber = (latestQuote?.versionNumber ?? 0) + 1;

      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = input.includeTax ? subtotal * (input.taxRate / 100) : 0;
      const total = subtotal + taxAmount;

      // Calculate per-head if not provided
      const perHeadPrice =
        input.perHeadPrice ?? (event.guestCount > 0 ? total / event.guestCount : 0);

      // Default valid for 7 days
      const validUntil = input.validUntil ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return ctx.db.quotes.create({
        data: {
          eventId: input.eventId,
          orgId: ctx.orgId,
          versionNumber,
          items: input.items,
          subtotal,
          taxAmount,
          total,
          perHeadPrice,
          validUntil,
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
          status: "draft",
        },
      });
    }),

  /** Update a draft quote */
  update: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        quoteId: z.string().uuid(),
        items: z.array(quoteItemSchema).optional(),
        perHeadPrice: z.number().nonnegative().optional(),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
        termsAndConditions: z.string().optional(),
        taxRate: z.number().min(0).max(100).default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: { event: { select: { guestCount: true } } },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (quote.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only edit draft quotes. Create a new version to revise.",
        });
      }

      const items = input.items ?? (quote.items as z.infer<typeof quoteItemSchema>[]);
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * (input.taxRate / 100);
      const total = subtotal + taxAmount;

      return ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: {
          items: input.items ?? undefined,
          subtotal,
          taxAmount,
          total,
          perHeadPrice: input.perHeadPrice,
          validUntil: input.validUntil,
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
        },
      });
    }),

  /** Send quote to client (marks as sent, triggers notification) */
  send: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        quoteId: z.string().uuid(),
        sendVia: z.enum(["whatsapp", "email", "both"]).default("both"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: {
          event: {
            select: {
              id: true,
              status: true,
              clientName: true,
              clientPhone: true,
              clientEmail: true,
            },
          },
        },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!["draft", "revised"].includes(quote.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quote has already been sent",
        });
      }

      // Update quote status
      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: {
          status: "sent",
          sentAt: new Date(),
        },
      });

      // Update event status if still in inquiry
      if (quote.event.status === "inquiry" || quote.event.status === "quote_revised") {
        await ctx.db.events.update({
          where: { id: quote.event.id },
          data: { status: "quote_sent" },
        });
      }

      // TODO: Send WhatsApp message with quote summary
      // TODO: Send email with quote PDF attachment

      return { success: true, sentVia: input.sendVia };
    }),

  /** Create a revised version of a sent quote */
  revise: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        quoteId: z.string().uuid(),
        items: z.array(quoteItemSchema),
        perHeadPrice: z.number().nonnegative().optional(),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
        termsAndConditions: z.string().optional(),
        taxRate: z.number().min(0).max(100).default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const originalQuote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: { event: { select: { id: true, guestCount: true } } },
      });

      if (!originalQuote) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Mark original as revised
      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: { status: "revised" },
      });

      // Get next version number
      const latestQuote = await ctx.db.quotes.findFirst({
        where: { eventId: originalQuote.eventId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      const versionNumber = (latestQuote?.versionNumber ?? 0) + 1;

      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * (input.taxRate / 100);
      const total = subtotal + taxAmount;
      const perHeadPrice = input.perHeadPrice ??
        (originalQuote.event.guestCount > 0
          ? total / originalQuote.event.guestCount
          : 0);

      const validUntil = input.validUntil ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create new version
      const newQuote = await ctx.db.quotes.create({
        data: {
          eventId: originalQuote.eventId,
          orgId: ctx.orgId,
          versionNumber,
          items: input.items,
          subtotal,
          taxAmount,
          total,
          perHeadPrice,
          validUntil,
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
          status: "draft",
        },
      });

      // Update event status
      await ctx.db.events.update({
        where: { id: originalQuote.eventId },
        data: { status: "quote_revised" },
      });

      return newQuote;
    }),

  /** Client accepts a quote */
  accept: publicProcedure
    .input(
      z.object({
        quoteId: z.string().uuid(),
        clientPhone: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId },
        include: {
          event: {
            select: {
              id: true,
              clientPhone: true,
              status: true,
            },
          },
        },
      });

      if (!quote || quote.event.clientPhone !== input.clientPhone) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (quote.status !== "sent") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This quote cannot be accepted (it may have been revised or already accepted)",
        });
      }

      // Check if expired
      if (quote.validUntil && new Date() > quote.validUntil) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This quote has expired. Please contact the caterer for a new quote.",
        });
      }

      // Accept quote
      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      });

      // Update event with financials and advance status
      await ctx.db.events.update({
        where: { id: quote.event.id },
        data: {
          status: "deposit_pending",
          totalAmount: quote.total,
          balanceDue: quote.total,
        },
      });

      // TODO: Send WhatsApp notification to org about acceptance
      // TODO: Send payment instructions to client

      return { success: true, message: "Quote accepted! You will receive payment instructions shortly." };
    }),

  /** Client rejects a quote */
  reject: publicProcedure
    .input(
      z.object({
        quoteId: z.string().uuid(),
        clientPhone: z.string().min(8),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId },
        include: {
          event: { select: { id: true, clientPhone: true } },
        },
      });

      if (!quote || quote.event.clientPhone !== input.clientPhone) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: { status: "rejected" },
      });

      return { success: true };
    }),

  /** Duplicate a quote as a template */
  duplicate: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        quoteId: z.string().uuid(),
        targetEventId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sourceQuote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
      });

      if (!sourceQuote) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get next version for target event
      const latestQuote = await ctx.db.quotes.findFirst({
        where: { eventId: input.targetEventId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      return ctx.db.quotes.create({
        data: {
          eventId: input.targetEventId,
          orgId: ctx.orgId,
          versionNumber: (latestQuote?.versionNumber ?? 0) + 1,
          items: sourceQuote.items,
          subtotal: sourceQuote.subtotal,
          taxAmount: sourceQuote.taxAmount,
          total: sourceQuote.total,
          perHeadPrice: sourceQuote.perHeadPrice,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          notes: sourceQuote.notes,
          termsAndConditions: sourceQuote.termsAndConditions,
          status: "draft",
        },
      });
    }),
});
