import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { logger } from "~/server/logger";
import { rateLimit } from "~/server/rateLimit";
import { eventTypeEnum, hashIp } from "./_shared";

export const trackingRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // trackEvent (public mutation)
  // -------------------------------------------------------------------------
  trackEvent: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        eventType: eventTypeEnum,
        eventData: z.record(z.unknown()).optional(),
        sessionId: z.string().max(100),
        referrer: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 100 events per minute per session
      const { success } = rateLimit({
        key: `analytics:${input.sessionId}`,
        limit: 100,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please slow down.",
        });
      }

      // Verify menu exists
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found",
        });
      }

      // Extract and hash IP from headers for privacy
      const forwarded = ctx.headers.get("x-forwarded-for");
      const rawIp = forwarded?.split(",")[0]?.trim() ?? "unknown";
      const ipHash = hashIp(rawIp);

      const userAgent = ctx.headers.get("user-agent") ?? null;
      const eventData = input.eventData ?? {};

      try {
        await ctx.db.$executeRaw`
          INSERT INTO public.analytics_events (
            id, menu_id, event_type, event_data,
            session_id, user_agent, ip_hash, referrer, created_at
          ) VALUES (
            gen_random_uuid(),
            ${input.menuId}::uuid,
            ${input.eventType},
            ${JSON.stringify(eventData)}::jsonb,
            ${input.sessionId},
            ${userAgent},
            ${ipHash},
            ${input.referrer ?? null},
            NOW()
          )
        `;
      } catch (error) {
        logger.error("Failed to track analytics event", error, "analytics");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record analytics event",
        });
      }

      return { success: true };
    }),
});
