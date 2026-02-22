import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { LemonsqueezyClient } from "lemonsqueezy.ts";
import { env } from "~/env.mjs";
import { TRPCError } from "@trpc/server";
import { checkIfSubscribed } from "~/shared/hooks/useUserSubscription";
import { TIER_LIMITS } from "~/constants/tiers";
import { z } from "zod";
import { logger } from "~/server/logger";
import { getAppUrl } from "~/utils/getBaseUrl";
import { rateLimit } from "~/server/rateLimit";

const client = new LemonsqueezyClient(env.LEMON_SQUEEZY_API_KEY);

const createPremiumCheckoutSchema = z.object({
  language: z.enum(["en", "fr", "ar"]),
});

const dashboardUrl = `${getAppUrl()}/dashboard`;

const checkoutTranslations: Record<"en" | "fr" | "ar", LemonsqueezyProductOptions> = {
  en: {
    description: "Display QR menus to your clients.",
    name: "FeastQR Menu",
    receipt_button_text: "Go to FeastQR",
    receipt_link_url: dashboardUrl,
    receipt_thank_you_note: "Thank you for your purchase!",
    redirect_url: dashboardUrl,
  },
  fr: {
    description: "Affichez vos menus QR pour vos clients.",
    name: "FeastQR Menu",
    receipt_button_text: "Aller sur FeastQR",
    receipt_link_url: dashboardUrl,
    receipt_thank_you_note: "Merci pour votre achat !",
    redirect_url: dashboardUrl,
  },
  ar: {
    description: "اعرض قوائم QR لعملائك.",
    name: "FeastQR Menu",
    receipt_button_text: "الذهاب إلى FeastQR",
    receipt_link_url: dashboardUrl,
    receipt_thank_you_note: "شكراً لشرائك!",
    redirect_url: dashboardUrl,
  },
};

export const paymentsRouter = createTRPCRouter({
  createPremiumCheckout: privateProcedure
    .input(createPremiumCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 5 checkout attempts per hour per user
      const rl = rateLimit({
        key: `checkout:${ctx.user.id}`,
        limit: 5,
        windowMs: 60 * 60 * 1000,
      });

      if (!rl.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many checkout attempts. Please try again later.",
        });
      }

      const language = input.language;
      const translations = checkoutTranslations[language];

      try {
        // LemonSqueezy SDK types are incomplete for createCheckout options
        const newCheckout = await client.createCheckout({
          checkout_data: {
            custom: { userId: ctx.user.id },
            name: ctx.user.email || "",
            email: ctx.user.email || "",
          },
          checkout_options: { embed: true },
          store: env.LEMON_SQUEEZY_STORE_ID,
          variant: env.LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID,
          product_options: translations,
        } as unknown as Parameters<typeof client.createCheckout>[0]);

        return newCheckout.data.attributes.url;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("LemonSqueezy checkout creation failed", error, "payments");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session. Please try again later.",
        });
      }
    }),
  cancelSubscription: privateProcedure.mutation(async ({ ctx }) => {
    const subscription = await ctx.db.subscriptions.findFirst({
      where: {
        profileId: ctx.user.id,
      },
    });

    if (!subscription || subscription.status !== "active") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Subscription not found or not active",
      });
    }

    try {
      const updateResult = await client.updateSubscription({
        id: subscription.lemonSqueezyId,
        cancelled: true,
      } as Parameters<typeof client.updateSubscription>[0]);

      const didCancelSuccessfully =
        updateResult.data.attributes.cancelled === true;

      if (!didCancelSuccessfully) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel subscription",
        });
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      logger.error("LemonSqueezy subscription cancellation failed", error, "payments");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription. Please try again later.",
      });
    }
  }),
  getSubscriptionInfo: privateProcedure.query(async ({ ctx }) => {
    return ctx.db.subscriptions.findFirst({
      where: {
        profileId: ctx.user.id,
      },
      select: {
        endsAt: true,
        renewsAt: true,
        status: true,
        updatePaymentUrl: true,
      },
    });
  }),
  getTierUsage: privateProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.subscriptions.findFirst({
      where: { profileId: ctx.user.id },
      select: { status: true, endsAt: true },
    });

    const isDev = process.env.NODE_ENV === "development";
    const validStatuses = ["active", "cancelled", "on_trial", "past_due"];
    const hasValidSub =
      subscription &&
      validStatuses.includes(subscription.status) &&
      (!subscription.endsAt || subscription.endsAt >= new Date());

    const isSubscribed = isDev || !!hasValidSub;
    const tier = isSubscribed ? "pro" : "free";
    const limits = isSubscribed ? TIER_LIMITS.pro : TIER_LIMITS.free;

    // Count current usage
    const menuCount = await ctx.db.menus.count({
      where: { userId: ctx.user.id },
    });

    // For dishes and categories, get the max across all menus
    const menus = await ctx.db.menus.findMany({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            dishes: true,
            categories: true,
          },
        },
      },
    });

    return {
      tier,
      limits: {
        maxMenus: limits.maxMenus,
        maxDishesPerMenu: limits.maxDishesPerMenu,
        maxCategories: limits.maxCategories,
      },
      usage: {
        menus: menuCount,
        menuDetails: menus.map((m) => ({
          id: m.id,
          name: m.name,
          dishes: m._count.dishes,
          categories: m._count.categories,
        })),
      },
    };
  }),

  getCustomerPortalUrl: privateProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.subscriptions.findFirst({
      where: {
        profileId: ctx.user.id,
      },
    });

    const isSubscribed = checkIfSubscribed(subscription?.status);

    if (!subscription || !isSubscribed) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Subscription not found or not active",
      });
    }

    try {
      const subscriptionResult = await client.retrieveSubscription({
        id: subscription.lemonSqueezyId,
      });

      const attrs = subscriptionResult.data.attributes as unknown as {
        urls: { customer_portal: string };
      };
      const portalUrl = attrs.urls.customer_portal;

      if (!portalUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Customer portal URL not available",
        });
      }

      return portalUrl;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      logger.error("LemonSqueezy portal URL retrieval failed", error, "payments");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve customer portal URL. Please try again later.",
      });
    }
  }),
});

interface LemonsqueezyProductOptions {
  /**
   * A custom description for the product
   */
  description: string;
  /**
   * An array of variant IDs to enable for this checkout. If this is empty, all variants will be enabled
   */
  enabled_variants?: Array<string>;
  /**
   * An array of image URLs to use as the product's media
   */
  media?: Array<string>;
  /**
   * A custom name for the product
   */
  name: string;
  /**
   * A custom text to use for the order receipt email button
   */
  receipt_button_text: string;
  /**
   * A custom URL to use for the order receipt email button
   */
  receipt_link_url: string;
  /**
   * A custom thank you note to use for the order receipt email
   */
  receipt_thank_you_note: string;
  /**
   * A custom URL to redirect to after a successful purchase
   */
  redirect_url: string;
}
