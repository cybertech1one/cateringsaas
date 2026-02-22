import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import {
  getAvailableProviders,
  isValidProviderModel,
} from "~/server/ai/registry";
import { getUserAIConfig } from "./_shared";

export const aiSettingsRouter = createTRPCRouter({
  getAvailableProviders: privateProcedure.query(() => {

    return getAvailableProviders();
  }),

  getAISettings: privateProcedure.query(async ({ ctx }) => {
    const config = await getUserAIConfig(ctx.db, ctx.user.id);

    return config;
  }),

  updateAISettings: privateProcedure
    .input(
      z.object({
        provider: z.string().min(1).max(50),
        model: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isValidProviderModel(input.provider, input.model)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid provider/model combination or provider not configured.",
        });
      }

      await ctx.db.profiles.update({
        where: { id: ctx.user.id },
        data: { aiProvider: input.provider, aiModel: input.model },
      });

      return { success: true as const };
    }),
});
