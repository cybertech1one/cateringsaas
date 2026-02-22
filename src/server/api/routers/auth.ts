import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { getServiceSupabase } from "~/server/supabase/supabaseClient";
import { logger } from "~/server/logger";
import { rateLimit } from "~/server/rateLimit";

export const authRouter = createTRPCRouter({
  getProfile: privateProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.profiles.findUnique({
      where: {
        id: ctx.user.id,
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    }

    return profile;
  }),

  deleteAccount: privateProcedure
    .input(
      z.object({
        confirmation: z.literal("DELETE MY ACCOUNT"),
      }),
    )
    .mutation(async ({ ctx }) => {
      const userId = ctx.user.id;

      // Rate limit: 2 attempts per hour per user
      const rl = rateLimit({
        key: `deleteAccount:${userId}`,
        limit: 2,
        windowMs: 60 * 60 * 1000,
      });

      if (!rl.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again later.",
        });
      }

      // Delete all user data in a transaction.
      // Subscriptions and appAuditLog do NOT cascade, so we handle
      // them explicitly before deleting the profile.
      await ctx.db.$transaction(async (tx) => {
        // Delete subscription (onDelete: NoAction on profiles FK)
        await tx.subscriptions.deleteMany({
          where: { profileId: userId },
        });

        // Delete audit log entries (onDelete: NoAction on profiles FK)
        await tx.appAuditLog.deleteMany({
          where: { userId },
        });

        // Delete org memberships
        await tx.orgMembers.deleteMany({
          where: { userId },
        });

        // Delete the profile
        await tx.profiles.delete({
          where: { id: userId },
        });
      });

      // Delete the Supabase auth user
      const { error } = await getServiceSupabase().auth.admin.deleteUser(
        userId,
      );

      if (error) {
        logger.error(
          `Failed to delete Supabase auth user ${userId}`,
          error,
          "auth",
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete authentication account",
        });
      }

      logger.info(`Account deleted for user ${userId}`, "auth");

      return { success: true };
    }),
});
