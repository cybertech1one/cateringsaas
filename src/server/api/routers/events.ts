/**
 * Diyafa — Events Router
 *
 * The heart of the catering platform. Events represent bookings
 * that progress through a 12-state lifecycle:
 *
 * INQUIRY → QUOTE_SENT → QUOTE_REVISED → QUOTE_ACCEPTED →
 * DEPOSIT_PENDING → DEPOSIT_RECEIVED → CONFIRMED →
 * IN_PREPARATION → IN_EXECUTION → COMPLETED →
 * SETTLEMENT_PENDING → SETTLED
 *
 * Catering is NOT ordering — events are booked weeks/months ahead,
 * involve negotiations, custom menus, and milestone payments.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
  orgProcedure,
  orgManagerProcedure,
  orgAdminProcedure,
} from "~/server/api/trpc";

// ──────────────────────────────────────────────
// Event Status State Machine
// ──────────────────────────────────────────────

const EVENT_STATUSES = [
  "inquiry",
  "quote_sent",
  "quote_revised",
  "quote_accepted",
  "deposit_pending",
  "deposit_received",
  "confirmed",
  "in_preparation",
  "in_execution",
  "completed",
  "settlement_pending",
  "settled",
  "cancelled",
] as const;

type EventStatus = (typeof EVENT_STATUSES)[number];

/** Valid state transitions */
const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  inquiry: ["quote_sent", "cancelled"],
  quote_sent: ["quote_revised", "quote_accepted", "cancelled"],
  quote_revised: ["quote_sent", "quote_accepted", "cancelled"],
  quote_accepted: ["deposit_pending", "cancelled"],
  deposit_pending: ["deposit_received", "cancelled"],
  deposit_received: ["confirmed"],
  confirmed: ["in_preparation", "cancelled"],
  in_preparation: ["in_execution", "cancelled"],
  in_execution: ["completed"],
  completed: ["settlement_pending"],
  settlement_pending: ["settled"],
  settled: [],
  cancelled: [],
};

function canTransition(from: EventStatus, to: EventStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ──────────────────────────────────────────────
// Shared Schemas
// ──────────────────────────────────────────────

const eventStatusEnum = z.enum(EVENT_STATUSES);

const eventTypeEnum = z.enum([
  "wedding",
  "corporate",
  "ramadan_iftar",
  "eid",
  "birthday",
  "conference",
  "funeral",
  "engagement",
  "henna",
  "graduation",
  "national_holiday",
  "baby_shower",
  "other",
]);

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────

export const eventsRouter = createTRPCRouter({
  // ─── Org-Scoped Endpoints ───────────────────

  /** List events with filters */
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        status: z.array(eventStatusEnum).optional(),
        eventType: eventTypeEnum.optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["date", "status", "amount", "created"]).default("date"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        orgId: ctx.orgId,
      };

      if (input.status && input.status.length > 0) {
        where.status = { in: input.status };
      }
      if (input.eventType) {
        where.eventType = input.eventType;
      }
      if (input.dateFrom || input.dateTo) {
        where.eventDate = {};
        if (input.dateFrom) (where.eventDate as Record<string, Date>).gte = input.dateFrom;
        if (input.dateTo) (where.eventDate as Record<string, Date>).lte = input.dateTo;
      }
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { venueName: { contains: input.search, mode: "insensitive" } },
          { clientName: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const orderBy: Record<string, string> = {};
      switch (input.sortBy) {
        case "date": orderBy.eventDate = input.sortOrder; break;
        case "status": orderBy.status = input.sortOrder; break;
        case "amount": orderBy.totalAmount = input.sortOrder; break;
        case "created": orderBy.createdAt = input.sortOrder; break;
      }

      const events = await ctx.db.events.findMany({
        where,
        orderBy,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          title: true,
          eventType: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          venueName: true,
          guestCount: true,
          status: true,
          totalAmount: true,
          depositAmount: true,
          balanceDue: true,
          clientName: true,
          clientPhone: true,
          createdAt: true,
        },
      });

      let nextCursor: string | undefined;
      if (events.length > input.limit) {
        const nextItem = events.pop();
        nextCursor = nextItem?.id;
      }

      return { events, nextCursor };
    }),

  /** Get event by ID with full details */
  getById: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        include: {
          quotes: {
            orderBy: { versionNumber: "desc" },
          },
          paymentMilestones: {
            orderBy: { dueDate: "asc" },
          },
          staffAssignments: {
            include: {
              staffMember: {
                select: { id: true, role: true },
              },
            },
          },
          timeline: {
            orderBy: { scheduledTime: "asc" },
          },
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      return event;
    }),

  /** Create a new event (from inquiry or direct booking) */
  create: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        title: z.string().min(2).max(200),
        eventType: eventTypeEnum,
        eventDate: z.date(),
        eventEndDate: z.date().optional(),
        startTime: z.string().optional(), // "HH:mm" format
        endTime: z.string().optional(),
        venueName: z.string().optional(),
        venueAddress: z.string().optional(),
        venueLatitude: z.number().optional(),
        venueLongitude: z.number().optional(),
        guestCount: z.number().int().positive(),
        dietaryRequirements: z.array(z.string()).optional(),
        clientName: z.string().min(2).max(100),
        clientPhone: z.string().optional(),
        clientEmail: z.string().email().optional(),
        clientWhatsapp: z.string().optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
        specialRequests: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;

      return ctx.db.events.create({
        data: {
          ...data,
          orgId: ctx.orgId,
          status: "inquiry",
          totalAmount: 0,
          depositAmount: 0,
          balanceDue: 0,
        },
      });
    }),

  /** Update event details */
  update: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        title: z.string().min(2).max(200).optional(),
        eventType: eventTypeEnum.optional(),
        eventDate: z.date().optional(),
        eventEndDate: z.date().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        venueName: z.string().optional(),
        venueAddress: z.string().optional(),
        venueLatitude: z.number().optional(),
        venueLongitude: z.number().optional(),
        guestCount: z.number().int().positive().optional(),
        confirmedGuestCount: z.number().int().positive().optional(),
        dietaryRequirements: z.array(z.string()).optional(),
        clientName: z.string().optional(),
        clientPhone: z.string().optional(),
        clientEmail: z.string().email().optional(),
        clientWhatsapp: z.string().optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
        specialRequests: z.string().optional(),
        totalAmount: z.number().nonnegative().optional(),
        depositAmount: z.number().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, eventId, ...data } = input;

      const event = await ctx.db.events.findFirst({
        where: { id: eventId, orgId: ctx.orgId },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Calculate balance due if amounts changed
      const totalAmount = data.totalAmount ?? event.totalAmount;
      const depositAmount = data.depositAmount ?? event.depositAmount;

      return ctx.db.events.update({
        where: { id: eventId },
        data: {
          ...data,
          balanceDue: Number(totalAmount) - Number(depositAmount),
        },
      });
    }),

  /** Transition event status (state machine enforced) */
  updateStatus: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        newStatus: eventStatusEnum,
        reason: z.string().optional(), // Required for cancellation
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true, status: true, title: true },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const currentStatus = event.status as EventStatus;
      const newStatus = input.newStatus;

      if (!canTransition(currentStatus, newStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from "${currentStatus}" to "${newStatus}". Valid transitions: ${VALID_TRANSITIONS[currentStatus]?.join(", ") || "none"}`,
        });
      }

      if (newStatus === "cancelled" && !input.reason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancellation reason is required",
        });
      }

      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      if (newStatus === "cancelled") {
        updateData.cancellationReason = input.reason;
        updateData.cancelledAt = new Date();
      }

      return ctx.db.events.update({
        where: { id: input.eventId },
        data: updateData,
      });
    }),

  // ─── Calendar ───────────────────────────────

  /** Get calendar events for a date range */
  getCalendar: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.events.findMany({
        where: {
          orgId: ctx.orgId,
          eventDate: {
            gte: input.startDate,
            lte: input.endDate,
          },
          status: {
            notIn: ["cancelled", "settled"],
          },
        },
        select: {
          id: true,
          title: true,
          eventType: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          venueName: true,
          guestCount: true,
          status: true,
          totalAmount: true,
          clientName: true,
        },
        orderBy: { eventDate: "asc" },
      });
    }),

  /** Get upcoming events (next 7 days) */
  getUpcoming: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      return ctx.db.events.findMany({
        where: {
          orgId: ctx.orgId,
          eventDate: { gte: now, lte: nextWeek },
          status: { notIn: ["cancelled", "settled", "inquiry"] },
        },
        select: {
          id: true,
          title: true,
          eventType: true,
          eventDate: true,
          startTime: true,
          venueName: true,
          guestCount: true,
          status: true,
          clientName: true,
          clientPhone: true,
        },
        orderBy: { eventDate: "asc" },
        take: 10,
      });
    }),

  /** Check date availability */
  checkAvailability: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const existingEvents = await ctx.db.events.findMany({
        where: {
          orgId: ctx.orgId,
          eventDate: input.date,
          status: { notIn: ["cancelled", "settled", "inquiry"] },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          guestCount: true,
        },
      });

      return {
        date: input.date,
        eventCount: existingEvents.length,
        events: existingEvents,
        isAvailable: existingEvents.length === 0,
      };
    }),

  // ─── Dashboard Statistics ───────────────────

  /** Get event statistics for dashboard */
  getStats: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [totalEvents, activeEvents, thisMonthEvents, pendingInquiries] =
        await Promise.all([
          ctx.db.events.count({ where: { orgId: ctx.orgId } }),
          ctx.db.events.count({
            where: {
              orgId: ctx.orgId,
              status: {
                in: [
                  "confirmed",
                  "in_preparation",
                  "in_execution",
                  "deposit_received",
                ],
              },
            },
          }),
          ctx.db.events.count({
            where: {
              orgId: ctx.orgId,
              eventDate: { gte: thisMonth, lt: nextMonth },
            },
          }),
          ctx.db.events.count({
            where: { orgId: ctx.orgId, status: "inquiry" },
          }),
        ]);

      return {
        totalEvents,
        activeEvents,
        thisMonthEvents,
        pendingInquiries,
      };
    }),

  // ─── Public Client Endpoints ────────────────

  /** Submit an inquiry (public, for clients) */
  submitInquiry: publicProcedure
    .input(
      z.object({
        orgId: z.string().uuid(),
        eventType: eventTypeEnum,
        eventDate: z.date(),
        guestCount: z.number().int().positive(),
        clientName: z.string().min(2).max(100),
        clientPhone: z.string().min(8).max(20),
        clientEmail: z.string().email().optional(),
        clientWhatsapp: z.string().optional(),
        venueName: z.string().optional(),
        venueCity: z.string().optional(),
        dietaryRequirements: z.array(z.string()).optional(),
        notes: z.string().max(2000).optional(),
        preferredLanguage: z.enum(["en", "fr", "ar"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify org exists and is active
      const org = await ctx.db.organizations.findFirst({
        where: { id: input.orgId, isActive: true },
        select: { id: true, name: true },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Caterer not found",
        });
      }

      const title = `${input.eventType.replace(/_/g, " ")} - ${input.clientName}`;

      const event = await ctx.db.events.create({
        data: {
          orgId: input.orgId,
          title,
          eventType: input.eventType,
          eventDate: input.eventDate,
          guestCount: input.guestCount,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail,
          clientWhatsapp: input.clientWhatsapp,
          venueName: input.venueName,
          notes: input.notes,
          dietaryRequirements: input.dietaryRequirements,
          status: "inquiry",
          totalAmount: 0,
          depositAmount: 0,
          balanceDue: 0,
        },
      });

      // TODO: Send WhatsApp notification to org
      // TODO: Send email confirmation to client

      return {
        eventId: event.id,
        message: "Inquiry submitted successfully. The caterer will contact you shortly.",
      };
    }),

  /** Get event status (for client tracking) */
  getClientEvent: publicProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        phone: z.string().min(8),
      })
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: {
          id: input.eventId,
          clientPhone: input.phone,
        },
        select: {
          id: true,
          title: true,
          eventType: true,
          eventDate: true,
          startTime: true,
          venueName: true,
          guestCount: true,
          status: true,
          totalAmount: true,
          depositAmount: true,
          balanceDue: true,
          createdAt: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found. Please check your event ID and phone number.",
        });
      }

      return event;
    }),
});
