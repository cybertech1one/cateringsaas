import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import { hashIP } from "~/server/security";
import { logger } from "~/server/logger";
import crypto from "crypto";

/**
 * Generates a unique referral code: 8 alphanumeric characters, uppercase.
 * Format: FQ-XXXXXXXX (FQ = Diyafa prefix for brand recognition)
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I,O,0,1 to avoid confusion
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }

  return `FQ-${code}`;
}

/** Default reward amount in cents (e.g. 500 = 5.00 MAD) */
const DEFAULT_REWARD_AMOUNT = 500;

export const affiliatesRouter = createTRPCRouter({
  // ── Get or generate the current user's referral code ─────────
  getMyReferralCode: privateProcedure.query(async ({ ctx }) => {
    // Check if user already has a referral code
    const existing = await ctx.db.referrals.findFirst({
      where: { referrerId: ctx.user.id },
      select: { referralCode: true },
    });

    if (existing) {
      return { referralCode: existing.referralCode };
    }

    // Generate a new unique referral code
    let referralCode = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      // Check collision using the compound unique (code + empty email for seed records)
      const conflict = await ctx.db.referrals.findUnique({
        where: {
          referralCode_referredEmail: {
            referralCode,
            referredEmail: "",
          },
        },
        select: { id: true },
      });

      if (!conflict) break;

      referralCode = generateReferralCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      logger.error(
        "Failed to generate unique referral code after max attempts",
        undefined,
        "affiliates",
      );

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate referral code. Please try again.",
      });
    }

    // Create the first referral record as a "seed" with the user's code
    // This establishes the user's referral code in the system
    await ctx.db.referrals.create({
      data: {
        referrerId: ctx.user.id,
        referredEmail: "",
        referralCode,
        status: "pending",
        rewardAmount: 0,
      },
    });

    return { referralCode };
  }),

  // ── List all referrals for the current user ──────────────────
  getMyReferrals: privateProcedure.query(async ({ ctx }) => {
    const referrals = await ctx.db.referrals.findMany({
      where: {
        referrerId: ctx.user.id,
        referredEmail: { not: "" }, // Exclude the seed record
      },
      select: {
        id: true,
        referredEmail: true,
        referralCode: true,
        status: true,
        rewardAmount: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return referrals;
  }),

  // ── Get aggregated referral stats ────────────────────────────
  getReferralStats: privateProcedure.query(async ({ ctx }) => {
    const referrals = await ctx.db.referrals.findMany({
      where: {
        referrerId: ctx.user.id,
        referredEmail: { not: "" },
      },
      select: {
        status: true,
        rewardAmount: true,
      },
    });

    const totalReferred = referrals.length;
    const completed = referrals.filter(
      (r) => r.status === "completed" || r.status === "rewarded",
    ).length;
    const totalRewards = referrals
      .filter((r) => r.status === "rewarded")
      .reduce((sum, r) => sum + r.rewardAmount, 0);
    const pending = referrals.filter((r) => r.status === "pending").length;

    return {
      totalReferred,
      completed,
      pending,
      totalRewards,
    };
  }),

  // ── Submit a referral (public - when someone signs up with a code) ──
  submitReferral: publicProcedure
    .input(
      z.object({
        referralCode: z.string().min(1).max(20),
        referredEmail: z.string().email().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limit by IP to prevent one user from exhausting the limit for all
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `referral-submit:${ipHash}:${input.referredEmail}`,
        limit: 5,
        windowMs: 60 * 60 * 1000, // 1 hour window
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many referral submissions. Please try again later.",
        });
      }

      // Find the referrer by their code (seed record has referredEmail = "")
      const existingReferral = await ctx.db.referrals.findUnique({
        where: {
          referralCode_referredEmail: {
            referralCode: input.referralCode,
            referredEmail: "",
          },
        },
        select: { referrerId: true, referralCode: true },
      });

      if (!existingReferral) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid referral code",
        });
      }

      // Check if this email has already been referred with this code
      const alreadyReferred = await ctx.db.referrals.findFirst({
        where: {
          referralCode: input.referralCode,
          referredEmail: input.referredEmail.toLowerCase().trim(),
        },
        select: { id: true, referredEmail: true },
      });

      if (alreadyReferred && alreadyReferred.referredEmail !== "") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email has already been referred with this code",
        });
      }

      // Create the referral record
      const referral = await ctx.db.referrals.create({
        data: {
          referrerId: existingReferral.referrerId,
          referredEmail: input.referredEmail.toLowerCase().trim(),
          referralCode: input.referralCode,
          status: "pending",
          rewardAmount: DEFAULT_REWARD_AMOUNT,
        },
      });

      return {
        id: referral.id,
        status: referral.status,
      };
    }),
});
