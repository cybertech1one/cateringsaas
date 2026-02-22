import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import { hashIP } from "~/server/security";
import {
  createPromotionInput,
  updatePromotionInput,
  verifyRestaurantOwnership,
} from "./_shared";

export const promotionsCrudRouter = createTRPCRouter({
  /**
   * Get active promotions for a menu by its slug (public, customer-facing).
   * Resolves the menu from the slug, then returns active promotions
   * within the current date/time range.
   * Rate limited to 60 requests per minute per slug.
   */
  getActiveBySlug: publicProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `active-promos-slug:${ipHash}:${input.slug}`,
        limit: 60,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      // Resolve menu from slug
      const menu = await ctx.db.menus.findFirst({
        where: { slug: input.slug, isPublished: true },
        select: { id: true },
      });

      if (!menu) {
        return [];
      }

      const now = new Date();
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ] as const;
      const currentDay = dayNames[now.getDay()]!;
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      const promotions = await ctx.db.promotions.findMany({
        where: {
          menuId: menu.id,
          isActive: true,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        select: {
          id: true,
          title: true,
          description: true,
          promotionType: true,
          discountPercent: true,
          discountAmount: true,
          imageUrl: true,
          applicableDays: true,
          startTime: true,
          endTime: true,
          endDate: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Filter by applicable days and time range in application code
      return promotions.filter((promo) => {
        if (
          promo.applicableDays.length > 0 &&
          !promo.applicableDays.includes(currentDay)
        ) {
          return false;
        }

        if (promo.startTime && promo.endTime) {
          const promoStart = promo.startTime.toISOString().substring(11, 16);
          const promoEnd = promo.endTime.toISOString().substring(11, 16);

          if (currentTime < promoStart || currentTime > promoEnd) {
            return false;
          }
        }

        return true;
      });
    }),

  /**
   * Get all promotions for a restaurant (owner only).
   * IDOR: verifies the restaurantId (menuId) belongs to the authenticated user.
   */
  getPromotions: privateProcedure
    .input(z.object({ restaurantId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyRestaurantOwnership(ctx.db, input.restaurantId, ctx.user.id);

      return ctx.db.promotions.findMany({
        where: { restaurantId: input.restaurantId },
        orderBy: { createdAt: "desc" },
      });
    }),

  /**
   * Create a new promotion. Rate limited to 20 per hour per user.
   * IDOR: verifies the restaurantId belongs to the authenticated user.
   */
  createPromotion: privateProcedure
    .input(createPromotionInput)
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `create-promotion:${ctx.user.id}`,
        limit: 20,
        windowMs: 60 * 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many promotions created. Please try again later.",
        });
      }

      await verifyRestaurantOwnership(ctx.db, input.restaurantId, ctx.user.id);

      return ctx.db.promotions.create({
        data: {
          restaurantId: input.restaurantId,
          title: input.title,
          description: input.description ?? null,
          promotionType: input.promotionType,
          discountPercent: input.discountPercent ?? null,
          discountAmount: input.discountAmount ?? null,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          isActive: input.isActive,
          applicableDays: input.applicableDays,
          startTime: input.startTime ?? null,
          endTime: input.endTime ?? null,
          menuId: input.menuId ?? null,
          dishId: input.dishId ?? null,
          categoryId: input.categoryId ?? null,
          imageUrl: input.imageUrl ?? null,
        },
      });
    }),

  /**
   * Update an existing promotion.
   * IDOR: fetches the promotion first, then verifies the restaurant belongs to the user.
   */
  updatePromotion: privateProcedure
    .input(updatePromotionInput)
    .mutation(async ({ ctx, input }) => {
      const promotion = await ctx.db.promotions.findUnique({
        where: { id: input.id },
        select: { restaurantId: true },
      });

      if (!promotion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promotion not found",
        });
      }

      await verifyRestaurantOwnership(
        ctx.db,
        promotion.restaurantId,
        ctx.user.id,
      );

      const { id, ...updateData } = input;

      // Build the update object, only including fields that were provided
      const data: Record<string, unknown> = {};

      if (updateData.title !== undefined) data.title = updateData.title;
      if (updateData.description !== undefined)
        data.description = updateData.description;
      if (updateData.promotionType !== undefined)
        data.promotionType = updateData.promotionType;
      if (updateData.discountPercent !== undefined)
        data.discountPercent = updateData.discountPercent;
      if (updateData.discountAmount !== undefined)
        data.discountAmount = updateData.discountAmount;
      if (updateData.startDate !== undefined)
        data.startDate = updateData.startDate;
      if (updateData.endDate !== undefined) data.endDate = updateData.endDate;
      if (updateData.isActive !== undefined)
        data.isActive = updateData.isActive;
      if (updateData.applicableDays !== undefined)
        data.applicableDays = updateData.applicableDays;
      if (updateData.startTime !== undefined)
        data.startTime = updateData.startTime;
      if (updateData.endTime !== undefined) data.endTime = updateData.endTime;
      if (updateData.menuId !== undefined) data.menuId = updateData.menuId;
      if (updateData.dishId !== undefined) data.dishId = updateData.dishId;
      if (updateData.categoryId !== undefined)
        data.categoryId = updateData.categoryId;
      if (updateData.imageUrl !== undefined)
        data.imageUrl = updateData.imageUrl;

      data.updatedAt = new Date();

      return ctx.db.promotions.update({
        where: { id },
        data,
      });
    }),

  /**
   * Delete a promotion.
   * IDOR: verifies ownership through restaurant -> user chain.
   */
  deletePromotion: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const promotion = await ctx.db.promotions.findUnique({
        where: { id: input.id },
        select: { restaurantId: true },
      });

      if (!promotion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promotion not found",
        });
      }

      await verifyRestaurantOwnership(
        ctx.db,
        promotion.restaurantId,
        ctx.user.id,
      );

      return ctx.db.promotions.delete({
        where: { id: input.id },
      });
    }),

  /**
   * Toggle a promotion's active status.
   * IDOR: verifies ownership through restaurant -> user chain.
   */
  togglePromotion: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const promotion = await ctx.db.promotions.findUnique({
        where: { id: input.id },
        select: { restaurantId: true, isActive: true },
      });

      if (!promotion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promotion not found",
        });
      }

      await verifyRestaurantOwnership(
        ctx.db,
        promotion.restaurantId,
        ctx.user.id,
      );

      return ctx.db.promotions.update({
        where: { id: input.id },
        data: {
          isActive: !promotion.isActive,
          updatedAt: new Date(),
        },
      });
    }),

  /**
   * Get active promotions for a menu (public, customer-facing).
   * Only returns promotions that are active and within the current date/time range.
   */
  getActivePromotions: publicProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ] as const;
      const currentDay = dayNames[now.getDay()]!;
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      const promotions = await ctx.db.promotions.findMany({
        where: {
          menuId: input.menuId,
          isActive: true,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        orderBy: { createdAt: "desc" },
      });

      // Filter by applicable days and time range in application code
      // since Prisma doesn't support array-contains and time comparisons natively
      return promotions.filter((promo) => {
        // Check applicable days (empty array means all days)
        if (
          promo.applicableDays.length > 0 &&
          !promo.applicableDays.includes(currentDay)
        ) {
          return false;
        }

        // Check time range if both startTime and endTime are set
        if (promo.startTime && promo.endTime) {
          const promoStart = promo.startTime.toISOString().substring(11, 16);
          const promoEnd = promo.endTime.toISOString().substring(11, 16);

          if (currentTime < promoStart || currentTime > promoEnd) {
            return false;
          }
        }

        return true;
      });
    }),
});
