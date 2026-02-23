/**
 * Diyafa — Event Reviews Router
 *
 * Multi-dimensional review system for completed events:
 * - 7 rating dimensions (food, service, punctuality, value, presentation, communication, overall)
 * - Public review submission with optional photo upload
 * - Org response to reviews
 * - Review moderation (pending → published/rejected)
 * - Featured reviews for profile showcase
 * - Verified reviews (linked to real events)
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

export const eventReviewsRouter = createTRPCRouter({
  /** Public: Get published reviews for an org */
  getPublicReviews: publicProcedure
    .input(
      z.object({
        orgSlug: z.string(),
        eventType: z.string().optional(),
        minRating: z.number().int().min(1).max(5).optional(),
        sortBy: z.enum(["newest", "highest", "lowest"]).default("newest"),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.orgSlug, isActive: true },
        select: { id: true },
      });

      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      const where: Record<string, unknown> = {
        orgId: org.id,
        status: "approved",
        isPublished: true,
      };

      if (input.eventType) where.eventType = input.eventType;
      if (input.minRating) where.ratingOverall = { gte: input.minRating };

      let orderBy: Record<string, string> = {};
      switch (input.sortBy) {
        case "highest": orderBy = { ratingOverall: "desc" }; break;
        case "lowest": orderBy = { ratingOverall: "asc" }; break;
        default: orderBy = { createdAt: "desc" }; break;
      }

      const reviews = await ctx.db.reviews.findMany({
        where,
        orderBy,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          reviewerName: true,
          eventType: true,
          guestCount: true,
          eventDate: true,
          ratingOverall: true,
          ratingFoodQuality: true,
          ratingPresentation: true,
          ratingServiceStaff: true,
          ratingPunctuality: true,
          ratingValueForMoney: true,
          ratingCommunication: true,
          comment: true,
          photos: true,
          response: true,
          respondedAt: true,
          isVerified: true,
          isFeatured: true,
          createdAt: true,
        },
      });

      let nextCursor: string | undefined;
      if (reviews.length > input.limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem?.id;
      }

      return { reviews, nextCursor };
    }),

  /** Public: Submit a review */
  submitReview: publicProcedure
    .input(
      z.object({
        orgId: z.string().uuid(),
        eventId: z.string().uuid().optional(),
        reviewerName: z.string().min(2).max(200),
        reviewerPhone: z.string().optional(),
        eventType: z.string().optional(),
        guestCount: z.number().int().positive().optional(),
        eventDate: z.date().optional(),
        ratingOverall: z.number().int().min(1).max(5),
        ratingFoodQuality: z.number().int().min(1).max(5).optional(),
        ratingPresentation: z.number().int().min(1).max(5).optional(),
        ratingServiceStaff: z.number().int().min(1).max(5).optional(),
        ratingPunctuality: z.number().int().min(1).max(5).optional(),
        ratingValueForMoney: z.number().int().min(1).max(5).optional(),
        ratingCommunication: z.number().int().min(1).max(5).optional(),
        comment: z.string().max(2000).optional(),
        photos: z.array(z.string().url()).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 3 reviews per org per hour (per reviewer phone or name)
      const rlKey = input.reviewerPhone
        ? `review:${input.orgId}:${input.reviewerPhone}`
        : `review:${input.orgId}:${input.reviewerName}`;
      const rl = rateLimit({
        key: rlKey,
        limit: 3,
        windowMs: 60 * 60 * 1000,
      });
      if (!rl.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many review submissions. Please try again later.",
        });
      }

      // Check if event-linked review is verified (the event actually happened)
      let isVerified = false;
      if (input.eventId) {
        const event = await ctx.db.events.findFirst({
          where: {
            id: input.eventId,
            orgId: input.orgId,
            status: { in: ["completed", "settled"] },
          },
        });
        if (event) isVerified = true;
      }

      return ctx.db.reviews.create({
        data: {
          orgId: input.orgId,
          eventId: input.eventId,
          reviewerName: input.reviewerName,
          reviewerPhone: input.reviewerPhone,
          eventType: input.eventType,
          guestCount: input.guestCount,
          eventDate: input.eventDate,
          ratingOverall: input.ratingOverall,
          ratingFoodQuality: input.ratingFoodQuality,
          ratingPresentation: input.ratingPresentation,
          ratingServiceStaff: input.ratingServiceStaff,
          ratingPunctuality: input.ratingPunctuality,
          ratingValueForMoney: input.ratingValueForMoney,
          ratingCommunication: input.ratingCommunication,
          comment: input.comment,
          photos: input.photos ?? [],
          isVerified,
          status: "pending",
          isPublished: false,
        },
      });
    }),

  /** Org: List all reviews (including pending) */
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        minRating: z.number().int().min(1).max(5).optional(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.status) where.status = input.status;
      if (input.minRating) where.ratingOverall = { gte: input.minRating };

      const reviews = await ctx.db.reviews.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (reviews.length > input.limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem?.id;
      }

      return { reviews, nextCursor };
    }),

  /** Org: Respond to a review */
  respond: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        reviewId: z.string().uuid(),
        response: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.reviews.findFirst({
        where: { id: input.reviewId, orgId: ctx.orgId },
      });

      if (!review) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.reviews.update({
        where: { id: input.reviewId },
        data: {
          response: input.response,
          respondedAt: new Date(),
        },
      });
    }),

  /** Org: Moderate a review (approve/reject) */
  moderate: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        reviewId: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.reviews.findFirst({
        where: { id: input.reviewId, orgId: ctx.orgId },
      });

      if (!review) throw new TRPCError({ code: "NOT_FOUND" });

      const isPublished = input.status === "approved";

      // Update review status
      await ctx.db.reviews.update({
        where: { id: input.reviewId },
        data: { status: input.status, isPublished },
      });

      // If approving, update org's aggregate rating
      if (isPublished) {
        const stats = await ctx.db.reviews.aggregate({
          where: { orgId: ctx.orgId, isPublished: true },
          _avg: { ratingOverall: true },
          _count: { ratingOverall: true },
        });

        await ctx.db.organizations.update({
          where: { id: ctx.orgId },
          data: {
            rating: stats._avg.ratingOverall ?? 0,
            reviewCount: stats._count.ratingOverall,
          },
        });
      }

      return { success: true };
    }),

  /** Org: Toggle featured status */
  toggleFeatured: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        reviewId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.reviews.findFirst({
        where: { id: input.reviewId, orgId: ctx.orgId },
      });

      if (!review) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.reviews.update({
        where: { id: input.reviewId },
        data: { isFeatured: !review.isFeatured },
      });
    }),

  /** Org: Get review stats/summary */
  getStats: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const [overall, pending, breakdown] = await Promise.all([
        ctx.db.reviews.aggregate({
          where: { orgId: ctx.orgId, isPublished: true },
          _avg: {
            ratingOverall: true,
            ratingFoodQuality: true,
            ratingPresentation: true,
            ratingServiceStaff: true,
            ratingPunctuality: true,
            ratingValueForMoney: true,
            ratingCommunication: true,
          },
          _count: { ratingOverall: true },
        }),
        ctx.db.reviews.count({
          where: { orgId: ctx.orgId, status: "pending" },
        }),
        // Rating distribution
        Promise.all(
          [1, 2, 3, 4, 5].map((rating) =>
            ctx.db.reviews.count({
              where: { orgId: ctx.orgId, isPublished: true, ratingOverall: rating },
            })
          )
        ),
      ]);

      return {
        averageRating: overall._avg.ratingOverall ?? 0,
        totalReviews: overall._count.ratingOverall,
        pendingCount: pending,
        dimensions: {
          foodQuality: overall._avg.ratingFoodQuality ?? 0,
          presentation: overall._avg.ratingPresentation ?? 0,
          serviceStaff: overall._avg.ratingServiceStaff ?? 0,
          punctuality: overall._avg.ratingPunctuality ?? 0,
          valueForMoney: overall._avg.ratingValueForMoney ?? 0,
          communication: overall._avg.ratingCommunication ?? 0,
        },
        distribution: {
          1: breakdown[0],
          2: breakdown[1],
          3: breakdown[2],
          4: breakdown[3],
          5: breakdown[4],
        },
      };
    }),

  /** Public: Get aggregate stats for an org (for profile page) */
  getPublicStats: publicProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.orgSlug, isActive: true },
        select: { id: true, rating: true, reviewCount: true },
      });

      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      const stats = await ctx.db.reviews.aggregate({
        where: { orgId: org.id, isPublished: true },
        _avg: {
          ratingOverall: true,
          ratingFoodQuality: true,
          ratingPresentation: true,
          ratingServiceStaff: true,
          ratingPunctuality: true,
          ratingValueForMoney: true,
          ratingCommunication: true,
        },
        _count: { ratingOverall: true },
      });

      return {
        rating: Number(org.rating) || 0,
        reviewCount: org.reviewCount,
        dimensions: {
          foodQuality: stats._avg.ratingFoodQuality ?? 0,
          presentation: stats._avg.ratingPresentation ?? 0,
          serviceStaff: stats._avg.ratingServiceStaff ?? 0,
          punctuality: stats._avg.ratingPunctuality ?? 0,
          valueForMoney: stats._avg.ratingValueForMoney ?? 0,
          communication: stats._avg.ratingCommunication ?? 0,
        },
      };
    }),
});
