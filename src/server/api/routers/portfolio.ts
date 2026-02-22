/**
 * Diyafa — Portfolio Router
 *
 * Manage caterer portfolio gallery:
 * - Upload and organize showcase images
 * - Link images to event types
 * - Featured image selection
 * - Reordering
 * - Public portfolio view for marketplace profiles
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

export const portfolioRouter = createTRPCRouter({
  /** Public: Get portfolio for a caterer */
  getPublicPortfolio: publicProcedure
    .input(
      z.object({
        orgSlug: z.string(),
        eventType: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.orgSlug, isActive: true },
        select: { id: true },
      });

      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      const where: Record<string, unknown> = { orgId: org.id };
      if (input.eventType) where.eventType = input.eventType;

      return ctx.db.portfolioImages.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        take: input.limit,
        select: {
          id: true,
          imageUrl: true,
          thumbnailUrl: true,
          caption: true,
          eventType: true,
          eventDate: true,
          isFeatured: true,
        },
      });
    }),

  /** Org: List all portfolio images */
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.eventType) where.eventType = input.eventType;

      return ctx.db.portfolioImages.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      });
    }),

  /** Add image to portfolio */
  add: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        imageUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        caption: z.string().max(500).optional(),
        eventType: z.string().optional(),
        eventDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;

      const lastImage = await ctx.db.portfolioImages.findFirst({
        where: { orgId: ctx.orgId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return ctx.db.portfolioImages.create({
        data: {
          ...data,
          orgId: ctx.orgId,
          sortOrder: (lastImage?.sortOrder ?? 0) + 1,
        },
      });
    }),

  /** Update image details */
  update: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        imageId: z.string().uuid(),
        caption: z.string().max(500).optional(),
        eventType: z.string().optional(),
        eventDate: z.date().optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db.portfolioImages.findFirst({
        where: { id: input.imageId, orgId: ctx.orgId },
      });

      if (!image) throw new TRPCError({ code: "NOT_FOUND" });

      const { orgId: _orgId, imageId, ...data } = input;

      return ctx.db.portfolioImages.update({
        where: { id: imageId },
        data,
      });
    }),

  /** Delete image */
  remove: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        imageId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db.portfolioImages.findFirst({
        where: { id: input.imageId, orgId: ctx.orgId },
      });

      if (!image) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.portfolioImages.delete({
        where: { id: input.imageId },
      });
    }),

  /** Reorder images */
  reorder: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        imageOrder: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.imageOrder.map((item) =>
          ctx.db.portfolioImages.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
      return { success: true };
    }),
});
