import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { checkIfSubscribed } from "~/shared/hooks/useUserSubscription";
import { cache, cacheKey, TTL } from "~/server/cache";
import { getFullMenu } from "./_shared";

export const publishingRouter = createTRPCRouter({
  getPublicMenuBySlug: publicProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const menu = await cache.getOrSet(
        cacheKey.publicMenu(input.slug),
        () => getFullMenu(input.slug, ctx.db),
        TTL.SHORT,
      );

      if (!menu || !menu.isPublished) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found",
        });
      }

      // Strip userId from public response (security: prevent user ID leakage)
      const { userId: _userId, ...publicMenu } = menu;

      return publicMenu;
    }),

  publishMenu: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.db.subscriptions.findFirst({
        where: {
          profileId: ctx.user.id,
        },
      });
      const isSubscriptionActive = checkIfSubscribed(subscription?.status);

      if (!isSubscriptionActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You need to subscribe to publish your menu",
        });
      }

      const result = await ctx.db.menus.update({
        where: {
          id: input.menuId,
          userId: ctx.user.id,
        },
        data: {
          isPublished: true,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  unpublishMenu: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.menus.update({
        where: {
          id: input.menuId,
          userId: ctx.user.id,
        },
        data: {
          isPublished: false,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),
});
