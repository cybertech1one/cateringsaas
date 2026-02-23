/**
 * Diyafa — Quotes Router
 *
 * Professional quote management with versioning:
 * - Create quotes with line items (QuoteItems)
 * - Version control (each revision → superseded + new version)
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
import { rateLimit } from "~/server/rateLimit";
import {
  notifyQuoteSent,
  notifyQuoteAccepted,
} from "~/server/notifications/whatsappService";

const quoteItemInput = z.object({
  sectionName: z.string(),
  sectionOrder: z.number().int().default(0),
  itemName: z.string(),
  itemDescription: z.string().optional(),
  quantity: z.number().positive(),
  unitType: z.enum(["per_person", "per_unit", "flat"]).default("per_person"),
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  itemOrder: z.number().int().default(0),
});

export const quotesRouter = createTRPCRouter({
  /** List quotes for an event */
  listByEvent: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      eventId: z.string().uuid(),
    }))
    .query(({ ctx, input }) =>
      ctx.db.quotes.findMany({
        where: { eventId: input.eventId, orgId: ctx.orgId },
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          subtotal: true,
          tvaAmount: true,
          totalAmount: true,
          pricePerPerson: true,
          validUntil: true,
          sentAt: true,
          respondedAt: true,
          createdAt: true,
        },
      })
    ),

  /** List all quotes (paginated) */
  listAll: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const quotes = await ctx.db.quotes.findMany({
        where: { orgId: ctx.orgId },
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
              customerName: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (quotes.length > input.limit) {
        nextCursor = quotes.pop()?.id;
      }
      return { quotes, nextCursor };
    }),

  /** Get quote by ID with items */
  getById: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      quoteId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: {
          items: { orderBy: [{ sectionOrder: "asc" }, { itemOrder: "asc" }] },
          event: {
            select: {
              id: true,
              title: true,
              eventType: true,
              eventDate: true,
              guestCount: true,
              customerName: true,
              customerPhone: true,
              customerEmail: true,
              venueName: true,
            },
          },
        },
      });

      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      return quote;
    }),

  /** Create a new quote */
  create: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      eventId: z.string().uuid(),
      items: z.array(quoteItemInput).min(1),
      pricePerPerson: z.number().nonnegative().optional(),
      validUntil: z.date().optional(),
      notes: z.string().optional(),
      termsAndConditions: z.string().optional(),
      taxRate: z.number().min(0).max(100).default(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true, guestCount: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      // Next version number
      const latest = await ctx.db.quotes.findFirst({
        where: { eventId: input.eventId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });
      const versionNumber = (latest?.versionNumber ?? 0) + 1;

      // Calculate totals
      const subtotal = input.items.reduce((s, i) => s + i.subtotal, 0);
      const tvaAmount = Math.round(subtotal * (input.taxRate / 100));
      const totalAmount = subtotal + tvaAmount;
      const pricePerPerson = input.pricePerPerson ??
        (event.guestCount > 0 ? Math.round(totalAmount / event.guestCount) : null);
      const validUntil = input.validUntil ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return ctx.db.quotes.create({
        data: {
          eventId: input.eventId,
          orgId: ctx.orgId,
          versionNumber,
          subtotal,
          tvaRate: input.taxRate,
          tvaAmount,
          totalAmount,
          pricePerPerson,
          validUntil,
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
          status: "draft",
          items: {
            create: input.items.map((item) => ({
              sectionName: item.sectionName,
              sectionOrder: item.sectionOrder,
              itemName: item.itemName,
              itemDescription: item.itemDescription,
              quantity: item.quantity,
              unitType: item.unitType,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              itemOrder: item.itemOrder,
            })),
          },
        },
        include: { items: true },
      });
    }),

  /** Send quote to client */
  send: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      quoteId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: {
          event: {
            select: {
              id: true,
              status: true,
              title: true,
              guestCount: true,
              customerPhone: true,
            },
          },
        },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (quote.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft quotes can be sent" });
      }

      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: { status: "sent", sentAt: new Date() },
      });

      // Advance event to "quoted" if still in early stages
      if (["inquiry", "reviewed"].includes(String(quote.event.status))) {
        await ctx.db.events.update({
          where: { id: quote.event.id },
          data: { status: "quoted" },
        });
      }

      // Non-blocking WhatsApp notification to client
      if (quote.event.customerPhone) {
        const org = await ctx.db.organizations.findFirst({
          where: { id: ctx.orgId },
          select: { name: true },
        });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.diyafa.ma";
        notifyQuoteSent(quote.event.customerPhone, {
          orgName: org?.name ?? "Diyafa",
          totalAmount: Number(quote.totalAmount),
          guestCount: quote.event.guestCount,
          eventTitle: quote.event.title ?? "Evenement",
          quoteLink: `${appUrl}/quote/${quote.id}`,
        }).catch(() => {});
      }

      return { success: true };
    }),

  /** Create a revised version (supersedes the current one) */
  revise: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      quoteId: z.string().uuid(),
      items: z.array(quoteItemInput).min(1),
      pricePerPerson: z.number().nonnegative().optional(),
      validUntil: z.date().optional(),
      notes: z.string().optional(),
      termsAndConditions: z.string().optional(),
      taxRate: z.number().min(0).max(100).default(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: { event: { select: { id: true, guestCount: true } } },
      });
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });

      // Mark original as superseded
      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: { status: "superseded" },
      });

      // Next version
      const latest = await ctx.db.quotes.findFirst({
        where: { eventId: original.eventId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });
      const versionNumber = (latest?.versionNumber ?? 0) + 1;

      const subtotal = input.items.reduce((s, i) => s + i.subtotal, 0);
      const tvaAmount = Math.round(subtotal * (input.taxRate / 100));
      const totalAmount = subtotal + tvaAmount;
      const pricePerPerson = input.pricePerPerson ??
        (original.event.guestCount > 0 ? Math.round(totalAmount / original.event.guestCount) : null);
      const validUntil = input.validUntil ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return ctx.db.quotes.create({
        data: {
          eventId: original.eventId,
          orgId: ctx.orgId,
          versionNumber,
          subtotal,
          tvaRate: input.taxRate,
          tvaAmount,
          totalAmount,
          pricePerPerson,
          validUntil,
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
          status: "draft",
          items: {
            create: input.items.map((item) => ({
              sectionName: item.sectionName,
              sectionOrder: item.sectionOrder,
              itemName: item.itemName,
              itemDescription: item.itemDescription,
              quantity: item.quantity,
              unitType: item.unitType,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              itemOrder: item.itemOrder,
            })),
          },
        },
        include: { items: true },
      });
    }),

  /** Client accepts a quote (public) */
  accept: publicProcedure
    .input(z.object({
      quoteId: z.string().uuid(),
      clientPhone: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 10 attempts per phone per hour
      const rl = rateLimit({
        key: `quoteAccept:${input.clientPhone}`,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });
      if (!rl.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again later.",
        });
      }

      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              customerPhone: true,
              customerName: true,
              status: true,
            },
          },
        },
      });

      if (!quote || quote.event.customerPhone !== input.clientPhone) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (quote.status !== "sent") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This quote cannot be accepted" });
      }
      if (quote.validUntil && new Date() > quote.validUntil) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This quote has expired" });
      }

      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: { status: "accepted", respondedAt: new Date() },
      });

      await ctx.db.events.update({
        where: { id: quote.event.id },
        data: {
          status: "accepted",
          totalAmount: quote.totalAmount,
          balanceDue: quote.totalAmount,
        },
      });

      // Non-blocking WhatsApp notification to caterer
      try {
        const org = await ctx.db.organizations?.findFirst?.({
          where: { id: quote.orgId },
          select: { whatsappNumber: true, phone: true },
        });
        const orgWhatsApp = org?.whatsappNumber ?? org?.phone;
        if (orgWhatsApp) {
          notifyQuoteAccepted(orgWhatsApp, {
            customerName: quote.event.customerName ?? "Client",
            eventTitle: quote.event.title ?? "Evenement",
            totalAmount: Number(quote.totalAmount),
          }).catch(() => {});
        }
      } catch { /* notification failure should not block the mutation */ }

      return { success: true, message: "Quote accepted! Payment instructions will follow." };
    }),

  /** Client rejects a quote (public) */
  reject: publicProcedure
    .input(z.object({
      quoteId: z.string().uuid(),
      clientPhone: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 10 attempts per phone per hour
      const rl = rateLimit({
        key: `quoteReject:${input.clientPhone}`,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });
      if (!rl.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again later.",
        });
      }

      const quote = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId },
        include: { event: { select: { id: true, customerPhone: true } } },
      });

      if (!quote || quote.event.customerPhone !== input.clientPhone) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.quotes.update({
        where: { id: input.quoteId },
        data: { status: "rejected", respondedAt: new Date() },
      });

      return { success: true };
    }),

  /** Duplicate a quote as template for another event */
  duplicate: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      quoteId: z.string().uuid(),
      targetEventId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const source = await ctx.db.quotes.findFirst({
        where: { id: input.quoteId, orgId: ctx.orgId },
        include: { items: true },
      });
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });

      const latest = await ctx.db.quotes.findFirst({
        where: { eventId: input.targetEventId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      return ctx.db.quotes.create({
        data: {
          eventId: input.targetEventId,
          orgId: ctx.orgId,
          versionNumber: (latest?.versionNumber ?? 0) + 1,
          subtotal: source.subtotal,
          tvaRate: source.tvaRate,
          tvaAmount: source.tvaAmount,
          totalAmount: source.totalAmount,
          pricePerPerson: source.pricePerPerson,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          notes: source.notes,
          termsAndConditions: source.termsAndConditions,
          status: "draft",
          items: {
            create: source.items.map((item) => ({
              sectionName: item.sectionName,
              sectionOrder: item.sectionOrder,
              itemName: item.itemName,
              itemDescription: item.itemDescription,
              quantity: item.quantity,
              unitType: item.unitType,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              itemOrder: item.itemOrder,
            })),
          },
        },
        include: { items: true },
      });
    }),
});
