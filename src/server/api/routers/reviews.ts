import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@prisma/client";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import { hashIP, sanitizeString } from "~/server/security";

// ── Helper: Verify menu ownership ───────────────────────────

async function verifyMenuOwnership(
  db: PrismaClient,
  menuId: string,
  userId: string,
) {
  const menu = await db.menus.findFirst({
    where: { id: menuId, userId },
    select: { id: true },
  });

  if (!menu) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Menu not found or you don't have permission",
    });
  }

  return menu;
}

// ── Helper: Verify review ownership via menu ────────────────

async function verifyReviewOwnership(
  db: PrismaClient,
  reviewId: string,
  userId: string,
) {
  const review = await db.reviews.findUnique({
    where: { id: reviewId },
    include: { menu: { select: { userId: true } } },
  });

  if (!review) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review not found",
    });
  }

  if (review.menu.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not authorized to manage this review",
    });
  }

  return review;
}

// ── Router ──────────────────────────────────────────────────

export const reviewsRouter = createTRPCRouter({
  /**
   * PUBLIC: Customer submits a review for a published menu.
   * Rate limited to 5 per hour per IP-based key.
   */
  submitReview: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        customerName: z.string().max(100).optional(),
        customerEmail: z.string().email().max(200).optional(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `submit-review:${ipHash}:${input.menuId}`,
        limit: 5,
        windowMs: 60 * 60 * 1000, // 1 hour
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many reviews submitted. Please try again later.",
        });
      }

      // Verify menu exists and is published
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, isPublished: true },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found or not published",
        });
      }

      return ctx.db.reviews.create({
        data: {
          menuId: input.menuId,
          customerName: input.customerName ? sanitizeString(input.customerName) : null,
          customerEmail: input.customerEmail ?? null,
          rating: input.rating,
          comment: input.comment ? sanitizeString(input.comment) : null,
          status: "pending",
        },
      });
    }),

  /**
   * PUBLIC: Get approved reviews for a published menu.
   * Returns reviews along with aggregate stats.
   */
  getPublicReviews: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [reviews, totalCount, aggregation] = await Promise.all([
        ctx.db.reviews.findMany({
          where: {
            menuId: input.menuId,
            status: "approved",
          },
          select: {
            id: true,
            customerName: true,
            rating: true,
            comment: true,
            response: true,
            respondedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.reviews.count({
          where: {
            menuId: input.menuId,
            status: "approved",
          },
        }),
        ctx.db.reviews.aggregate({
          where: {
            menuId: input.menuId,
            status: "approved",
          },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      return {
        reviews,
        totalCount,
        averageRating: aggregation._avg.rating ?? 0,
        reviewCount: aggregation._count.rating,
      };
    }),

  /**
   * PRIVATE: Owner gets ALL reviews for their menu (including pending/rejected).
   * IDOR check: verifies menu belongs to the authenticated user.
   */
  getMenuReviews: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const where = {
        menuId: input.menuId,
        ...(input.status ? { status: input.status } : {}),
      };

      const [reviews, totalCount] = await Promise.all([
        ctx.db.reviews.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.reviews.count({ where }),
      ]);

      return { reviews, totalCount };
    }),

  /**
   * PRIVATE: Approve or reject a review.
   * IDOR check via menu ownership.
   */
  moderateReview: privateProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyReviewOwnership(ctx.db, input.reviewId, ctx.user.id);

      return ctx.db.reviews.update({
        where: { id: input.reviewId },
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
      });
    }),

  /**
   * PRIVATE: Owner responds to a review.
   * IDOR check via menu ownership. Sets respondedAt timestamp.
   */
  respondToReview: privateProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        response: z.string().max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyReviewOwnership(ctx.db, input.reviewId, ctx.user.id);

      return ctx.db.reviews.update({
        where: { id: input.reviewId },
        data: {
          response: sanitizeString(input.response),
          respondedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  /**
   * PRIVATE: Delete a review.
   * IDOR check via menu ownership.
   */
  deleteReview: privateProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyReviewOwnership(ctx.db, input.reviewId, ctx.user.id);

      return ctx.db.reviews.delete({
        where: { id: input.reviewId },
      });
    }),

  /**
   * PRIVATE: Get reputation stats for the Google Review Pump dashboard.
   * Returns total reviews, avg rating, rating distribution, google redirect proxy
   * (count of 4-5 star reviews), and response rate.
   * IDOR check via menu ownership.
   */
  getReputationStats: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const [aggregation, ratingGroups, respondedCount] = await Promise.all([
        // Overall stats (all reviews, not just approved)
        ctx.db.reviews.aggregate({
          where: { menuId: input.menuId },
          _avg: { rating: true },
          _count: { rating: true },
        }),

        // Rating distribution (all reviews)
        ctx.db.reviews.groupBy({
          by: ["rating"],
          where: { menuId: input.menuId },
          _count: { rating: true },
          orderBy: { rating: "asc" },
        }),

        // Response rate: count reviews that have a response
        ctx.db.reviews.count({
          where: {
            menuId: input.menuId,
            response: { not: null },
          },
        }),
      ]);

      // Build rating distribution (1-5 stars, fill zeros)
      const ratingDistribution: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      for (const group of ratingGroups) {
        ratingDistribution[group.rating] = group._count.rating;
      }

      // Google redirects proxy: count of 4-5 star reviews (happy customers)
      const googleRedirects =
        (ratingDistribution[4] ?? 0) + (ratingDistribution[5] ?? 0);

      const totalReviews = aggregation._count.rating;
      const responseRate =
        totalReviews > 0
          ? Math.round((respondedCount / totalReviews) * 100)
          : 0;

      return {
        totalReviews,
        avgRating: aggregation._avg.rating ?? 0,
        ratingDistribution,
        googleRedirects,
        responseRate,
      };
    }),

  /**
   * PRIVATE: Get review statistics for a menu.
   * Returns average rating, total count, rating distribution, and recent trend.
   * IDOR check via menu ownership.
   */
  getReviewStats: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const thirtyDaysAgo = new Date();

      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [aggregation, ratingGroups, recentAggregation] = await Promise.all([
        // Overall stats (approved reviews only)
        ctx.db.reviews.aggregate({
          where: {
            menuId: input.menuId,
            status: "approved",
          },
          _avg: { rating: true },
          _count: { rating: true },
        }),

        // Rating distribution (approved reviews only)
        ctx.db.reviews.groupBy({
          by: ["rating"],
          where: {
            menuId: input.menuId,
            status: "approved",
          },
          _count: { rating: true },
          orderBy: { rating: "asc" },
        }),

        // Recent trend: average rating over last 30 days (approved)
        ctx.db.reviews.aggregate({
          where: {
            menuId: input.menuId,
            status: "approved",
            createdAt: { gte: thirtyDaysAgo },
          },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      // Build rating distribution (1-5 stars, fill zeros)
      const ratingDistribution: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      for (const group of ratingGroups) {
        ratingDistribution[group.rating] = group._count.rating;
      }

      return {
        averageRating: aggregation._avg.rating ?? 0,
        totalReviews: aggregation._count.rating,
        ratingDistribution,
        recentTrend: {
          averageRating: recentAggregation._avg.rating ?? 0,
          reviewCount: recentAggregation._count.rating,
          periodDays: 30,
        },
      };
    }),
});
