/**
 * Diyafa — Equipment Router
 *
 * Track catering equipment inventory and event allocations:
 * - Chafing dishes, plates, linens, tables, chairs
 * - Per-event allocation and return tracking
 * - Low stock alerts
 * - Condition tracking (new, good, damaged)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

const equipmentCategoryEnum = z.enum([
  "chafing_dish",
  "plates",
  "glasses",
  "cutlery",
  "linens",
  "tables",
  "chairs",
  "serving_trays",
  "cooking_equipment",
  "decoration",
  "transport",
  "other",
]);

const conditionEnum = z.enum(["new_condition", "good", "fair", "needs_repair", "retired"]);

const allocationStatusEnum = z.enum([
  "reserved",
  "picked_up",
  "in_use",
  "returned",
  "damaged",
]);

export const equipmentRouter = createTRPCRouter({
  /** List all equipment */
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        category: equipmentCategoryEnum.optional(),
        lowStockOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.category) where.category = input.category;

      const equipment = await ctx.db.equipment.findMany({
        where,
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      if (input.lowStockOnly) {
        return equipment.filter(
          (e) => e.quantityAvailable < Math.ceil(e.quantityTotal * 0.2)
        );
      }

      return equipment;
    }),

  /** Create equipment item */
  create: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        name: z.string().min(1).max(200),
        category: equipmentCategoryEnum,
        quantityTotal: z.number().int().positive(),
        condition: conditionEnum.default("good"),
        costPerUnit: z.number().nonnegative().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;

      return ctx.db.equipment.create({
        data: {
          ...data,
          orgId: ctx.orgId,
          quantityAvailable: input.quantityTotal,
        },
      });
    }),

  /** Update equipment */
  update: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        equipmentId: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        category: equipmentCategoryEnum.optional(),
        quantityTotal: z.number().int().positive().optional(),
        condition: conditionEnum.optional(),
        costPerUnit: z.number().nonnegative().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, equipmentId, ...data } = input;

      // Verify equipment belongs to this org
      const existing = await ctx.db.equipment.findFirst({
        where: { id: equipmentId, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.equipment.update({
        where: { id: equipmentId },
        data,
      });
    }),

  /** Allocate equipment to event */
  allocateToEvent: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
        equipmentId: z.string().uuid(),
        quantityAllocated: z.number().int().positive(),
        pickupDate: z.date().optional(),
        returnDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const equipment = await ctx.db.equipment.findFirst({
        where: { id: input.equipmentId, orgId: ctx.orgId },
      });

      if (!equipment) throw new TRPCError({ code: "NOT_FOUND" });

      if (equipment.quantityAvailable < input.quantityAllocated) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${equipment.quantityAvailable} units available (requested ${input.quantityAllocated})`,
        });
      }

      // Decrease available quantity
      await ctx.db.equipment.update({
        where: { id: input.equipmentId },
        data: {
          quantityAvailable: equipment.quantityAvailable - input.quantityAllocated,
        },
      });

      return ctx.db.equipmentAllocations.create({
        data: {
          eventId: input.eventId,
          equipmentId: input.equipmentId,
          quantityAllocated: input.quantityAllocated,
          pickupDate: input.pickupDate,
          returnDate: input.returnDate,
          status: "reserved",
        },
      });
    }),

  /** Return equipment from event */
  returnFromEvent: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        allocationId: z.string().uuid(),
        quantityReturned: z.number().int().nonnegative(),
        quantityDamaged: z.number().int().nonnegative().default(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allocation = await ctx.db.equipmentAllocations.findFirst({
        where: {
          id: input.allocationId,
          equipment: { orgId: ctx.orgId },
        },
      });

      if (!allocation) throw new TRPCError({ code: "NOT_FOUND" });

      const status = input.quantityDamaged > 0 ? "damaged" : "returned";

      // Increase available quantity by returned amount
      await ctx.db.equipment.update({
        where: { id: allocation.equipmentId },
        data: {
          quantityAvailable: {
            increment: input.quantityReturned,
          },
        },
      });

      return ctx.db.equipmentAllocations.update({
        where: { id: input.allocationId },
        data: {
          quantityReturned: input.quantityReturned,
          status,
          returnedAt: new Date(),
          damageNotes: input.notes,
        },
      });
    }),

  /** Get equipment allocations for an event */
  getByEvent: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.equipmentAllocations.findMany({
        where: {
          eventId: input.eventId,
          equipment: { orgId: ctx.orgId },
        },
        include: {
          equipment: {
            select: { id: true, name: true, category: true },
          },
        },
      });
    }),

  /** Get low stock alerts */
  getLowStock: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const equipment = await ctx.db.equipment.findMany({
        where: { orgId: ctx.orgId },
      });

      return equipment
        .filter((e) => e.quantityAvailable < Math.ceil(e.quantityTotal * 0.2))
        .map((e) => ({
          ...e,
          availablePercentage: Math.round(
            (e.quantityAvailable / e.quantityTotal) * 100
          ),
        }));
    }),
});
