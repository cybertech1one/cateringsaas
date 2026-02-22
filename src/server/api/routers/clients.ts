/**
 * Diyafa — Clients CRM Router
 *
 * Customer relationship management for catering businesses:
 * - Client profiles with contact info and preferences
 * - Event history tracking
 * - Tags and segments (VIP, corporate, repeat)
 * - Notes and communication log
 * - WhatsApp integration for follow-ups
 * - CSV export for marketing
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  orgProcedure,
  orgManagerProcedure,
  orgAdminProcedure,
} from "~/server/api/trpc";

export const clientsRouter = createTRPCRouter({
  /** List all clients with search and filters */
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        city: z.string().optional(),
        sortBy: z.enum(["name", "events", "lastEvent", "created"]).default("name"),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search } },
          { email: { contains: input.search, mode: "insensitive" } },
          { company: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.tags && input.tags.length > 0) {
        where.tags = { hasSome: input.tags };
      }
      if (input.city) {
        where.city = { equals: input.city, mode: "insensitive" };
      }

      const orderBy: Record<string, string> = {};
      switch (input.sortBy) {
        case "name": orderBy.name = "asc"; break;
        case "events": orderBy.eventCount = "desc"; break;
        case "lastEvent": orderBy.lastEventDate = "desc"; break;
        case "created": orderBy.createdAt = "desc"; break;
      }

      const clients = await ctx.db.clientProfiles.findMany({
        where,
        orderBy,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (clients.length > input.limit) {
        const nextItem = clients.pop();
        nextCursor = nextItem?.id;
      }

      return { clients, nextCursor };
    }),

  /** Get client by ID with event history */
  getById: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        clientId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const client = await ctx.db.clientProfiles.findFirst({
        where: { id: input.clientId, orgId: ctx.orgId },
      });

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get event history
      const events = await ctx.db.events.findMany({
        where: {
          orgId: ctx.orgId,
          OR: [
            { clientPhone: client.phone },
            { clientEmail: client.email },
          ],
        },
        orderBy: { eventDate: "desc" },
        select: {
          id: true,
          title: true,
          eventType: true,
          eventDate: true,
          guestCount: true,
          status: true,
          totalAmount: true,
        },
      });

      return { ...client, events };
    }),

  /** Create client profile */
  create: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        name: z.string().min(2).max(100),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        whatsapp: z.string().optional(),
        company: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        preferredLanguage: z.enum(["en", "fr", "ar"]).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        source: z.enum(["walk_in", "whatsapp", "website", "referral", "social_media", "other"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;

      return ctx.db.clientProfiles.create({
        data: {
          ...data,
          orgId: ctx.orgId,
          eventCount: 0,
        },
      });
    }),

  /** Update client profile */
  update: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        clientId: z.string().uuid(),
        name: z.string().min(2).max(100).optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        whatsapp: z.string().optional(),
        company: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        preferredLanguage: z.enum(["en", "fr", "ar"]).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, clientId, ...data } = input;

      const client = await ctx.db.clientProfiles.findFirst({
        where: { id: clientId, orgId: ctx.orgId },
      });

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.clientProfiles.update({
        where: { id: clientId },
        data,
      });
    }),

  /** Add note to client */
  addNote: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        clientId: z.string().uuid(),
        note: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.db.clientProfiles.findFirst({
        where: { id: input.clientId, orgId: ctx.orgId },
        select: { notes: true },
      });

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const timestamp = new Date().toISOString().slice(0, 16);
      const updatedNotes = client.notes
        ? `${client.notes}\n\n[${timestamp}] ${input.note}`
        : `[${timestamp}] ${input.note}`;

      return ctx.db.clientProfiles.update({
        where: { id: input.clientId },
        data: { notes: updatedNotes },
      });
    }),

  /** Add/remove tags */
  updateTags: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        clientId: z.string().uuid(),
        tags: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.clientProfiles.update({
        where: { id: input.clientId },
        data: { tags: input.tags },
      });
    }),

  /** Get all unique tags for autocomplete */
  getTags: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const clients = await ctx.db.clientProfiles.findMany({
        where: { orgId: ctx.orgId },
        select: { tags: true },
      });

      const allTags = new Set<string>();
      clients.forEach((c) => {
        (c.tags as string[])?.forEach((t) => allTags.add(t));
      });

      return Array.from(allTags).sort();
    }),

  /** Get client segments (grouped by tags) */
  getSegments: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const [total, vip, corporate, repeat, newClients] = await Promise.all([
        ctx.db.clientProfiles.count({ where: { orgId: ctx.orgId } }),
        ctx.db.clientProfiles.count({
          where: { orgId: ctx.orgId, tags: { has: "vip" } },
        }),
        ctx.db.clientProfiles.count({
          where: { orgId: ctx.orgId, tags: { has: "corporate" } },
        }),
        ctx.db.clientProfiles.count({
          where: { orgId: ctx.orgId, eventCount: { gte: 2 } },
        }),
        ctx.db.clientProfiles.count({
          where: { orgId: ctx.orgId, eventCount: { lte: 1 } },
        }),
      ]);

      return { total, vip, corporate, repeat, newClients };
    }),

  /** Export clients as CSV data */
  exportCSV: orgAdminProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const clients = await ctx.db.clientProfiles.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { name: "asc" },
      });

      const headers = ["Name", "Phone", "Email", "WhatsApp", "Company", "City", "Tags", "Events", "Notes"];
      const rows = clients.map((c) => [
        c.name,
        c.phone ?? "",
        c.email ?? "",
        c.whatsapp ?? "",
        c.company ?? "",
        c.city ?? "",
        (c.tags as string[])?.join("; ") ?? "",
        String(c.eventCount ?? 0),
        (c.notes ?? "").replace(/\n/g, " "),
      ]);

      return { headers, rows, count: clients.length };
    }),
});
