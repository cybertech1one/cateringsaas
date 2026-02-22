import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { rateLimit } from "~/server/rateLimit";
import { getProvider } from "~/server/ai/registry";

// ── Constants ───────────────────────────────────────────────

export const VALID_ALLERGENS = [
  "gluten", "dairy", "eggs", "fish", "shellfish", "tree_nuts",
  "peanuts", "soy", "sesame", "celery", "mustard", "lupin",
  "mollusks", "sulfites",
] as const;

// ── Helpers ─────────────────────────────────────────────────

export async function getUserAIConfig(db: PrismaClient, userId: string) {
  const profile = await db.profiles.findUnique({
    where: { id: userId },
    select: { aiProvider: true, aiModel: true },
  });

  return {
    provider: profile?.aiProvider ?? "openai",
    model: profile?.aiModel ?? "gpt-4o-mini",
  };
}

export async function logAIUsage(
  db: PrismaClient,
  userId: string,
  provider: string,
  model: string,
  feature: string,
  tokensUsed: number,
) {
  await db.aiUsage.create({
    data: { userId, provider, model, feature, tokensUsed },
  });
}

export function enforceRateLimit(userId: string, feature: string, limit: number) {
  const result = rateLimit({
    key: `ai:${feature}:${userId}`,
    limit,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `AI rate limit exceeded for ${feature}. Try again later.`,
    });
  }
}

export async function verifyMenuOwnership(db: PrismaClient, menuId: string, userId: string) {
  const menu = await db.menus.findUnique({
    where: { id: menuId },
    select: { userId: true },
  });

  if (!menu) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Menu not found.",
    });
  }

  if (menu.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this menu.",
    });
  }
}

export function getProviderOrThrow(providerName: string) {
  const provider = getProvider(providerName);

  if (!provider) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "AI provider not configured. Please set an API key.",
    });
  }

  return provider;
}
