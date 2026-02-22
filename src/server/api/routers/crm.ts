import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { TwentyClient } from "~/server/crm/twenty";
import {
  syncCustomersToTwenty,
  syncOrdersToTwenty,
} from "~/server/crm/sync";
import { logger } from "~/server/logger";
import { encrypt, decryptIfEncrypted } from "~/server/encryption";
import { rateLimit } from "~/server/rateLimit";

export const crmRouter = createTRPCRouter({
  // Get CRM config status
  getConfig: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const profile = await ctx.db.profiles.findUnique({
      where: { id: userId },
      select: {
        crmApiKey: true,
        crmWorkspaceUrl: true,
        crmAutoSync: true,
        crmLastSyncedAt: true,
      },
    });

    return {
      isConfigured: !!(profile?.crmApiKey && profile?.crmWorkspaceUrl),
      workspaceUrl: profile?.crmWorkspaceUrl ?? null,
      autoSync: profile?.crmAutoSync ?? false,
      lastSyncedAt: profile?.crmLastSyncedAt?.toISOString() ?? null,
      hasApiKey: !!profile?.crmApiKey,
    };
  }),

  // Save CRM configuration
  saveConfig: privateProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        workspaceUrl: z.string().url(),
        autoSync: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Rate limit: 5 config saves per hour per user
      const rl = rateLimit({
        key: `crmConfig:${userId}`,
        limit: 5,
        windowMs: 60 * 60 * 1000,
      });

      if (!rl.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again later.",
        });
      }

      // Test connection first
      const client = new TwentyClient({
        apiKey: input.apiKey,
        workspaceUrl: input.workspaceUrl,
      });
      const connected = await client.testConnection();

      if (!connected) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not connect to Twenty CRM. Please check your API key and workspace URL.",
        });
      }

      await ctx.db.profiles.update({
        where: { id: userId },
        data: {
          crmApiKey: encrypt(input.apiKey),
          crmWorkspaceUrl: input.workspaceUrl,
          crmAutoSync: input.autoSync,
        },
      });

      logger.info("CRM configuration saved", "crm");

      return { success: true };
    }),

  // Remove CRM configuration
  removeConfig: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    await ctx.db.profiles.update({
      where: { id: userId },
      data: {
        crmApiKey: null,
        crmWorkspaceUrl: null,
        crmAutoSync: false,
        crmLastSyncedAt: null,
      },
    });

    return { success: true };
  }),

  // Sync customers to CRM
  syncCustomers: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Rate limit: 3 syncs per hour per user
    const rl = rateLimit({ key: `crmSync:${userId}`, limit: 3, windowMs: 60 * 60 * 1000 });

    if (!rl.success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Sync rate limit reached. Try again later." });
    }

    const profile = await ctx.db.profiles.findUnique({
      where: { id: userId },
      select: { crmApiKey: true, crmWorkspaceUrl: true },
    });

    if (!profile?.crmApiKey || !profile?.crmWorkspaceUrl) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "CRM not configured",
      });
    }

    // Get all orders from user's menus
    const menus = await ctx.db.menus.findMany({
      where: { userId },
      select: { id: true },
    });
    const menuIds = menus.map((m) => m.id);

    if (menuIds.length === 0) {
      return { synced: 0, failed: 0, errors: [] };
    }

    const rawOrders = await ctx.db.orders.findMany({
      where: { menuId: { in: menuIds }, status: { not: "cancelled" }, customerPhone: { not: null } },
      select: {
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        orderNumber: true,
      },
    });

    const orders = rawOrders
      .filter((o): o is typeof o & { customerPhone: string } => !!o.customerPhone);

    const apiKey = decryptIfEncrypted(profile.crmApiKey);

    const result = await syncCustomersToTwenty(
      { apiKey, workspaceUrl: profile.crmWorkspaceUrl },
      orders,
    );

    // Update last synced timestamp
    await ctx.db.profiles.update({
      where: { id: userId },
      data: { crmLastSyncedAt: new Date() },
    });

    return result;
  }),

  // Sync orders to CRM
  syncOrders: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Rate limit: 3 syncs per hour per user (shared with syncCustomers)
    const rl = rateLimit({ key: `crmSync:${userId}`, limit: 3, windowMs: 60 * 60 * 1000 });

    if (!rl.success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Sync rate limit reached. Try again later." });
    }

    const profile = await ctx.db.profiles.findUnique({
      where: { id: userId },
      select: { crmApiKey: true, crmWorkspaceUrl: true },
    });

    if (!profile?.crmApiKey || !profile?.crmWorkspaceUrl) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "CRM not configured",
      });
    }

    const menus = await ctx.db.menus.findMany({
      where: { userId },
      select: { id: true },
    });
    const menuIds = menus.map((m) => m.id);

    if (menuIds.length === 0) {
      return { synced: 0, failed: 0, errors: [] };
    }

    const rawOrders = await ctx.db.orders.findMany({
      where: { menuId: { in: menuIds }, customerPhone: { not: null } },
      select: {
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        orderNumber: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500, // limit to recent 500 orders
    });

    const orders = rawOrders
      .filter((o): o is typeof o & { customerPhone: string } => !!o.customerPhone);

    const apiKey = decryptIfEncrypted(profile.crmApiKey);

    const result = await syncOrdersToTwenty(
      { apiKey, workspaceUrl: profile.crmWorkspaceUrl },
      orders,
    );

    await ctx.db.profiles.update({
      where: { id: userId },
      data: { crmLastSyncedAt: new Date() },
    });

    return result;
  }),

  // Test CRM connection
  testConnection: privateProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        workspaceUrl: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      const client = new TwentyClient({
        apiKey: input.apiKey,
        workspaceUrl: input.workspaceUrl,
      });
      const connected = await client.testConnection();

      return { connected };
    }),
});
