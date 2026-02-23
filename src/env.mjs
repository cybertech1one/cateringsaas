import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** True only on actual deployed environments (Vercel/CI), not local `next build` */
const isDeployedProduction = !!process.env.VERCEL || !!process.env.CI;

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SUPABASE_SERVICE_KEY: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    // Legacy payment provider env vars (kept for webhook backward-compat)
    PAYMENT_PROVIDER_API_KEY: z.string().min(1).optional().default("placeholder")
      .refine(
        (val) => !isDeployedProduction || val !== "placeholder",
        "PAYMENT_PROVIDER_API_KEY must be set in production",
      ),
    PAYMENT_PROVIDER_SIGNATURE_SECRET: z.string().min(1).optional().default("placeholder")
      .refine(
        (val) => !isDeployedProduction || val !== "placeholder",
        "PAYMENT_PROVIDER_SIGNATURE_SECRET must be set in production",
      ),
    PAYMENT_PROVIDER_STORE_ID: z.string().min(1).optional().default("placeholder")
      .refine(
        (val) => !isDeployedProduction || val !== "placeholder",
        "PAYMENT_PROVIDER_STORE_ID must be set in production",
      ),
    PAYMENT_PROVIDER_SUBSCRIPTION_VARIANT_ID: z.string().min(1).optional().default("placeholder")
      .refine(
        (val) => !isDeployedProduction || val !== "placeholder",
        "PAYMENT_PROVIDER_SUBSCRIPTION_VARIANT_ID must be set in production",
      ),
    OPENAI_API_KEY: z.string().optional().default(""),
    ANTHROPIC_API_KEY: z.string().optional().default(""),
    GOOGLE_AI_API_KEY: z.string().optional().default(""),
    VAPID_PRIVATE_KEY: z.string().optional().default(""),
    SENTRY_DSN: z.string().url().optional().or(z.literal("")),
    CRM_ENCRYPTION_KEY: z.string().optional().default(""),
    // Email notifications (Resend)
    RESEND_API_KEY: z.string().optional().default(""),
    EMAIL_FROM_ADDRESS: z.string().optional().default("Diyafa <noreply@diyafa.ma>"),
    // WhatsApp Business Cloud API (Meta)
    WHATSAPP_API_TOKEN: z.string().optional().default(""),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
    WHATSAPP_VERIFY_TOKEN: z.string().optional().default(""),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
    NEXT_PUBLIC_UMAMI_URL: z.string().optional(),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional().default(""),
    NEXT_PUBLIC_APP_URL: z.string().url().optional().default("https://www.diyafa.ma"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_UMAMI_URL: process.env.NEXT_PUBLIC_UMAMI_URL,
    PAYMENT_PROVIDER_SIGNATURE_SECRET:
      process.env.LEMONS_SQUEEZY_SIGNATURE_SECRET ?? process.env.PAYMENT_PROVIDER_SIGNATURE_SECRET,
    PAYMENT_PROVIDER_API_KEY: process.env.LEMON_SQUEEZY_API_KEY ?? process.env.PAYMENT_PROVIDER_API_KEY,
    PAYMENT_PROVIDER_STORE_ID: process.env.LEMON_SQUEEZY_STORE_ID ?? process.env.PAYMENT_PROVIDER_STORE_ID,
    PAYMENT_PROVIDER_SUBSCRIPTION_VARIANT_ID:
      process.env.LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID ?? process.env.PAYMENT_PROVIDER_SUBSCRIPTION_VARIANT_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SENTRY_DSN: process.env.SENTRY_DSN ?? "",
    CRM_ENCRYPTION_KEY: process.env.CRM_ENCRYPTION_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
