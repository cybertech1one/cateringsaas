/**
 * Diyafa — Event Timeline Router
 *
 * Event preparation and execution planning:
 * - Prep task management (shopping, cooking, assembly, packing)
 * - Delivery logistics planning
 * - Setup and teardown coordination
 * - Task dependencies and assignment
 * - Timeline templates for common event types
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import {
  createTRPCRouter,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

const taskCategoryEnum = z.enum([
  "shopping",
  "prep",
  "cooking",
  "assembly",
  "packing",
  "transport",
  "setup",
  "service",
  "teardown",
  "cleanup",
]);

const taskStatusEnum = z.enum(["pending", "in_progress", "completed", "skipped"]);

export const timelineRouter = createTRPCRouter({
  /** Get all tasks for an event */
  getByEvent: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.prepTasks.findMany({
        where: { eventId: input.eventId },
        orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
      });
    }),

  /** Create a prep task */
  createTask: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        name: z.string().min(1).max(200),
        category: taskCategoryEnum,
        assignedTo: z.array(z.string()).optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        durationMinutes: z.number().int().positive().optional(),
        dependsOn: z.array(z.string().uuid()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const { orgId: _orgId, ...data } = input;

      // Get next sort order
      const lastTask = await ctx.db.prepTasks.findFirst({
        where: { eventId: input.eventId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return ctx.db.prepTasks.create({
        data: {
          ...data,
          sortOrder: (lastTask?.sortOrder ?? 0) + 1,
          status: "pending",
        },
      });
    }),

  /** Update a task */
  updateTask: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        taskId: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        category: taskCategoryEnum.optional(),
        assignedTo: z.array(z.string()).optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        durationMinutes: z.number().int().positive().optional(),
        dependsOn: z.array(z.string().uuid()).optional(),
        status: taskStatusEnum.optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, taskId, ...data } = input;

      // Verify task belongs to this org via event
      const task = await ctx.db.prepTasks.findFirst({
        where: { id: taskId, event: { orgId: ctx.orgId } },
        select: { id: true },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.prepTasks.update({
        where: { id: taskId },
        data,
      });
    }),

  /** Update task status (used by staff on mobile) */
  updateStatus: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        taskId: z.string().uuid(),
        status: taskStatusEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task belongs to this org via event
      const task = await ctx.db.prepTasks.findFirst({
        where: { id: input.taskId, event: { orgId: ctx.orgId } },
        select: { id: true },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.prepTasks.update({
        where: { id: input.taskId },
        data: {
          status: input.status,
          ...(input.status === "completed" ? { endTime: new Date() } : {}),
        },
      });
    }),

  /** Delete a task */
  deleteTask: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        taskId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task belongs to this org via event
      const task = await ctx.db.prepTasks.findFirst({
        where: { id: input.taskId, event: { orgId: ctx.orgId } },
        select: { id: true },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.prepTasks.delete({
        where: { id: input.taskId },
      });
    }),

  /** Bulk create tasks from a template */
  applyTemplate: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        template: z.enum(["wedding", "corporate", "ramadan_iftar", "birthday", "basic"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true, eventDate: true },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      // Template definitions
      const templates: Record<string, Array<{ name: string; category: string; durationMinutes: number }>> = {
        wedding: [
          { name: "Confirm final guest count", category: "prep", durationMinutes: 30 },
          { name: "Order ingredients (bulk)", category: "shopping", durationMinutes: 120 },
          { name: "Purchase fresh produce", category: "shopping", durationMinutes: 90 },
          { name: "Prepare marinades & sauces", category: "prep", durationMinutes: 180 },
          { name: "Cook main courses", category: "cooking", durationMinutes: 240 },
          { name: "Prepare appetizers & salads", category: "cooking", durationMinutes: 120 },
          { name: "Prepare desserts", category: "cooking", durationMinutes: 180 },
          { name: "Assembly & plating prep", category: "assembly", durationMinutes: 90 },
          { name: "Pack equipment & food", category: "packing", durationMinutes: 60 },
          { name: "Load vehicles", category: "transport", durationMinutes: 45 },
          { name: "Transport to venue", category: "transport", durationMinutes: 60 },
          { name: "Venue setup & decoration", category: "setup", durationMinutes: 120 },
          { name: "Final food preparation", category: "service", durationMinutes: 60 },
          { name: "Service", category: "service", durationMinutes: 240 },
          { name: "Teardown & pack", category: "teardown", durationMinutes: 90 },
          { name: "Cleanup & inventory check", category: "cleanup", durationMinutes: 60 },
        ],
        corporate: [
          { name: "Confirm menu with client", category: "prep", durationMinutes: 30 },
          { name: "Order ingredients", category: "shopping", durationMinutes: 90 },
          { name: "Prepare all dishes", category: "cooking", durationMinutes: 180 },
          { name: "Pack for transport", category: "packing", durationMinutes: 45 },
          { name: "Transport to venue", category: "transport", durationMinutes: 45 },
          { name: "Setup buffet/stations", category: "setup", durationMinutes: 60 },
          { name: "Service", category: "service", durationMinutes: 120 },
          { name: "Cleanup & return", category: "cleanup", durationMinutes: 60 },
        ],
        ramadan_iftar: [
          { name: "Source fresh dates & milk", category: "shopping", durationMinutes: 60 },
          { name: "Order main ingredients", category: "shopping", durationMinutes: 90 },
          { name: "Prepare harira & soups", category: "cooking", durationMinutes: 120 },
          { name: "Prepare main dishes", category: "cooking", durationMinutes: 180 },
          { name: "Prepare pastries & chebakia", category: "cooking", durationMinutes: 120 },
          { name: "Pack & load", category: "packing", durationMinutes: 45 },
          { name: "Setup before Maghrib", category: "setup", durationMinutes: 90 },
          { name: "Iftar service", category: "service", durationMinutes: 120 },
          { name: "Cleanup", category: "cleanup", durationMinutes: 45 },
        ],
        birthday: [
          { name: "Confirm cake & menu", category: "prep", durationMinutes: 30 },
          { name: "Shopping", category: "shopping", durationMinutes: 60 },
          { name: "Prepare food", category: "cooking", durationMinutes: 120 },
          { name: "Prepare cake/desserts", category: "cooking", durationMinutes: 90 },
          { name: "Pack & deliver", category: "transport", durationMinutes: 45 },
          { name: "Setup", category: "setup", durationMinutes: 45 },
          { name: "Service", category: "service", durationMinutes: 120 },
          { name: "Cleanup", category: "cleanup", durationMinutes: 30 },
        ],
        basic: [
          { name: "Order ingredients", category: "shopping", durationMinutes: 60 },
          { name: "Prepare food", category: "cooking", durationMinutes: 120 },
          { name: "Pack for transport", category: "packing", durationMinutes: 30 },
          { name: "Deliver & setup", category: "setup", durationMinutes: 45 },
          { name: "Service", category: "service", durationMinutes: 120 },
          { name: "Cleanup", category: "cleanup", durationMinutes: 30 },
        ],
      };

      const templateTasks = templates[input.template] ?? templates.basic!;

      await ctx.db.prepTasks.createMany({
        data: templateTasks!.map((task, index) => ({
          eventId: input.eventId,
          name: task.name,
          category: task.category,
          durationMinutes: task.durationMinutes,
          sortOrder: index + 1,
          status: "pending",
        })),
      });

      return { count: templateTasks!.length };
    }),

  /** Reorder tasks */
  reorder: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        taskOrder: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event belongs to this org
      const event = await ctx.db.events.findFirst({
        where: { id: input.eventId, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify all tasks belong to this event
      const taskIds = input.taskOrder.map((item) => item.id);
      const ownedTasks = await ctx.db.prepTasks.findMany({
        where: { id: { in: taskIds }, eventId: input.eventId },
        select: { id: true },
      });
      if (ownedTasks.length !== taskIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more tasks not found",
        });
      }

      await Promise.all(
        input.taskOrder.map((item) =>
          ctx.db.prepTasks.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
      return { success: true };
    }),

  /** Get delivery plan for an event */
  getDeliveryPlan: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.deliveryPlans.findUnique({
        where: { eventId: input.eventId },
      });
    }),

  /** Create or update delivery plan */
  upsertDeliveryPlan: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        venueLat: z.number().optional(),
        venueLng: z.number().optional(),
        vehicleType: z.string().optional(),
        driverName: z.string().optional(),
        driverPhone: z.string().optional(),
        loadingStartTime: z.date().optional(),
        departureTime: z.date().optional(),
        estimatedArrival: z.date().optional(),
        setupStartTime: z.date().optional(),
        serviceStartTime: z.date().optional(),
        serviceEndTime: z.date().optional(),
        teardownEndTime: z.date().optional(),
        returnTime: z.date().optional(),
        foodManifest: z.array(z.record(z.unknown())).optional(),
        equipmentManifest: z.array(z.record(z.unknown())).optional(),
        loadingChecklist: z.array(z.record(z.unknown())).optional(),
        setupChecklist: z.array(z.record(z.unknown())).optional(),
        teardownChecklist: z.array(z.record(z.unknown())).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, eventId, foodManifest, equipmentManifest, loadingChecklist, setupChecklist, teardownChecklist, ...rest } = input;

      const data = {
        ...rest,
        ...(foodManifest !== undefined ? { foodManifest: foodManifest as unknown as Prisma.InputJsonValue } : {}),
        ...(equipmentManifest !== undefined ? { equipmentManifest: equipmentManifest as unknown as Prisma.InputJsonValue } : {}),
        ...(loadingChecklist !== undefined ? { loadingChecklist: loadingChecklist as unknown as Prisma.InputJsonValue } : {}),
        ...(setupChecklist !== undefined ? { setupChecklist: setupChecklist as unknown as Prisma.InputJsonValue } : {}),
        ...(teardownChecklist !== undefined ? { teardownChecklist: teardownChecklist as unknown as Prisma.InputJsonValue } : {}),
      };

      return ctx.db.deliveryPlans.upsert({
        where: { eventId },
        create: { eventId, ...data },
        update: data,
      });
    }),

  /** Get task progress summary */
  getProgress: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.prepTasks.findMany({
        where: { eventId: input.eventId },
        select: { status: true, category: true },
      });

      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "completed").length;
      const inProgress = tasks.filter((t) => t.status === "in_progress").length;
      const pending = tasks.filter((t) => t.status === "pending").length;

      // Group by category
      const byCategory: Record<string, { total: number; completed: number }> = {};
      tasks.forEach((t) => {
        if (!byCategory[t.category]) {
          byCategory[t.category] = { total: 0, completed: 0 };
        }
        const cat = byCategory[t.category]!;
        cat.total++;
        if (t.status === "completed") cat.completed++;
      });

      return {
        total,
        completed,
        inProgress,
        pending,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        byCategory,
      };
    }),
});
