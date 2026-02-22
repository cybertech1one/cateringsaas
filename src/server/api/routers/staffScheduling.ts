/**
 * Diyafa — Staff Scheduling Router
 *
 * Manage staff assignments for catering events:
 * - Assign staff with roles (chef, server, coordinator, etc.)
 * - Track availability and prevent double-booking
 * - Check-in/check-out at events
 * - Calendar view of staff schedules
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

const eventRoleEnum = z.enum([
  "head_chef",
  "sous_chef",
  "cook",
  "server",
  "bartender",
  "setup_crew",
  "coordinator",
  "driver",
  "cleanup",
  "photographer",
  "dj",
  "other",
]);

const assignmentStatusEnum = z.enum([
  "assigned",
  "confirmed",
  "checked_in",
  "checked_out",
  "no_show",
]);

export const staffSchedulingRouter = createTRPCRouter({
  /** Assign staff to event */
  assignToEvent: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        staffMemberId: z.string().uuid(),
        roleAtEvent: eventRoleEnum,
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        payRate: z.number().nonnegative().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;

      // Verify event belongs to org
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true, eventDate: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      // Check for conflicts on same date
      const conflict = await ctx.db.staffAssignments.findFirst({
        where: {
          staffId: input.staffMemberId,
          status: { notIn: ["no_show"] },
          event: { eventDate: event.eventDate },
          NOT: { eventId: input.eventId },
        },
        include: { event: { select: { title: true } } },
      });

      if (conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Staff member already assigned to "${conflict.event?.title}" on this date`,
        });
      }

      return ctx.db.staffAssignments.create({
        data: {
          eventId: input.eventId,
          staffId: input.staffMemberId,
          roleAtEvent: input.roleAtEvent,
          shiftStart: input.startTime ? new Date(`1970-01-01T${input.startTime}`) : undefined,
          shiftEnd: input.endTime ? new Date(`1970-01-01T${input.endTime}`) : undefined,
          payRate: input.payRate,
          notes: input.notes,
          status: "assigned",
        },
      });
    }),

  /** Get staff assignments for an event */
  getByEvent: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.staffAssignments.findMany({
        where: {
          eventId: input.eventId,
          event: { orgId: ctx.orgId },
        },
        include: {
          staff: {
            select: { id: true, role: true },
          },
        },
        orderBy: { roleAtEvent: "asc" },
      });
    }),

  /** Get schedule for a specific staff member */
  getByStaff: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        staffMemberId: z.string().uuid(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        staffId: input.staffMemberId,
        event: { orgId: ctx.orgId },
      };

      if (input.dateFrom || input.dateTo) {
        where.event = {
          eventDate: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          },
        };
      }

      return ctx.db.staffAssignments.findMany({
        where,
        include: {
          event: {
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
            },
          },
        },
        orderBy: { event: { eventDate: "asc" } },
      });
    }),

  /** Update assignment status or details */
  updateAssignment: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        assignmentId: z.string().uuid(),
        roleAtEvent: eventRoleEnum.optional(),
        status: assignmentStatusEnum.optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        payRate: z.number().nonnegative().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.staffAssignments.update({
        where: { id: input.assignmentId },
        data: {
          roleAtEvent: input.roleAtEvent,
          status: input.status,
          shiftStart: input.startTime ? new Date(`1970-01-01T${input.startTime}`) : undefined,
          shiftEnd: input.endTime ? new Date(`1970-01-01T${input.endTime}`) : undefined,
          payRate: input.payRate,
          notes: input.notes,
        },
      });
    }),

  /** Staff check-in */
  checkIn: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        assignmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.staffAssignments.update({
        where: { id: input.assignmentId },
        data: {
          status: "checked_in",
        },
      });
    }),

  /** Staff check-out */
  checkOut: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        assignmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.staffAssignments.update({
        where: { id: input.assignmentId },
        data: {
          status: "checked_out",
        },
      });
    }),

  /** Remove staff from event */
  removeFromEvent: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        assignmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.staffAssignments.delete({
        where: { id: input.assignmentId },
      });
    }),

  /** Check staff availability for a date */
  checkAvailability: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const allStaff = await ctx.db.orgMembers.findMany({
        where: { orgId: ctx.orgId, isActive: true },
        select: { id: true, role: true, userId: true },
      });

      const busyStaff = await ctx.db.staffAssignments.findMany({
        where: {
          event: { orgId: ctx.orgId, eventDate: input.date },
          status: { notIn: ["no_show"] },
        },
        select: { orgMemberId: true },
      });

      const busyIds = new Set(busyStaff.map((s) => s.orgMemberId).filter(Boolean));

      return allStaff.map((s) => ({
        ...s,
        isAvailable: !busyIds.has(s.id),
      }));
    }),
});
