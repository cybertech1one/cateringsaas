import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import { hashIP } from "~/server/security";

export const loyaltyRouter = createTRPCRouter({
  // ── Owner: Get loyalty programs for their menus ──────────
  getPrograms: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view loyalty programs for this menu",
        });
      }

      return ctx.db.loyaltyProgram.findMany({
        where: { menuId: input.menuId },
        include: {
          _count: {
            select: { cards: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ── Owner: Create a loyalty program ──────────────────────
  createProgram: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        name: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        stampsRequired: z.number().int().min(2).max(50).default(10),
        rewardDescription: z.string().min(1).max(200),
        rewardType: z
          .enum(["free_item", "discount_percent", "discount_amount"])
          .default("free_item"),
        rewardValue: z.number().int().nonnegative().optional(),
        icon: z.string().max(10).default("\u2B50"),
        color: z.string().max(20).default("#D4A853"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to create programs for this menu",
        });
      }

      return ctx.db.loyaltyProgram.create({
        data: {
          menuId: input.menuId,
          name: input.name,
          description: input.description ?? null,
          stampsRequired: input.stampsRequired,
          rewardDescription: input.rewardDescription,
          rewardType: input.rewardType,
          rewardValue: input.rewardValue ?? null,
          icon: input.icon,
          color: input.color,
        },
      });
    }),

  // ── Owner: Update a loyalty program ──────────────────────
  updateProgram: privateProcedure
    .input(
      z.object({
        programId: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(500).optional(),
        stampsRequired: z.number().int().min(2).max(50).optional(),
        rewardDescription: z.string().min(1).max(200).optional(),
        rewardType: z
          .enum(["free_item", "discount_percent", "discount_amount"])
          .optional(),
        rewardValue: z.number().int().nonnegative().nullable().optional(),
        isActive: z.boolean().optional(),
        icon: z.string().max(10).optional(),
        color: z.string().max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.loyaltyProgram.findUnique({
        where: { id: input.programId },
        include: { menu: { select: { userId: true } } },
      });

      if (!program || program.menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this program",
        });
      }

      const { programId, ...data } = input;

      return ctx.db.loyaltyProgram.update({
        where: { id: programId },
        data,
      });
    }),

  // ── Owner: Delete a loyalty program ──────────────────────
  deleteProgram: privateProcedure
    .input(z.object({ programId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.loyaltyProgram.findUnique({
        where: { id: input.programId },
        include: { menu: { select: { userId: true } } },
      });

      if (!program || program.menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this program",
        });
      }

      return ctx.db.loyaltyProgram.delete({
        where: { id: input.programId },
      });
    }),

  // ── Public: Get customer loyalty card ────────────────────
  getCard: publicProcedure
    .input(
      z.object({
        programId: z.string().uuid(),
        customerIdentifier: z.string().min(1).max(200),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `loyalty-check:${ipHash}:${input.customerIdentifier}`,
        limit: 30,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      const card = await ctx.db.loyaltyCard.findUnique({
        where: {
          programId_customerIdentifier: {
            programId: input.programId,
            customerIdentifier: input.customerIdentifier.toLowerCase().trim(),
          },
        },
        include: {
          program: {
            select: {
              name: true,
              stampsRequired: true,
              rewardDescription: true,
              rewardType: true,
              rewardValue: true,
              icon: true,
              color: true,
              isActive: true,
            },
          },
        },
      });

      return card;
    }),

  // ── Public: Get active programs for a menu slug ──────────
  getPublicPrograms: publicProcedure
    .input(z.object({ menuSlug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findUnique({
        where: { slug: input.menuSlug },
        select: { id: true, isPublished: true },
      });

      if (!menu || !menu.isPublished) {
        return [];
      }

      return ctx.db.loyaltyProgram.findMany({
        where: { menuId: menu.id, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          stampsRequired: true,
          rewardDescription: true,
          rewardType: true,
          rewardValue: true,
          icon: true,
          color: true,
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // ── Owner/Staff: Add stamp to a customer card ────────────
  addStamp: privateProcedure
    .input(
      z.object({
        programId: z.string().uuid(),
        customerIdentifier: z.string().min(1).max(200),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the program exists and user owns the menu
      const program = await ctx.db.loyaltyProgram.findUnique({
        where: { id: input.programId },
        include: { menu: { select: { userId: true } } },
      });

      if (!program || program.menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to add stamps for this program",
        });
      }

      if (!program.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This loyalty program is not active",
        });
      }

      const normalizedIdentifier = input.customerIdentifier
        .toLowerCase()
        .trim();

      // Upsert card - create if doesn't exist
      const card = await ctx.db.loyaltyCard.upsert({
        where: {
          programId_customerIdentifier: {
            programId: input.programId,
            customerIdentifier: normalizedIdentifier,
          },
        },
        create: {
          programId: input.programId,
          customerIdentifier: normalizedIdentifier,
          stampsCollected: 1,
        },
        update: {
          stampsCollected: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Create stamp audit record
      await ctx.db.loyaltyStamp.create({
        data: {
          cardId: card.id,
          stampedBy: ctx.user.id,
          notes: input.notes ?? null,
        },
      });

      return {
        cardId: card.id,
        stampsCollected: card.stampsCollected,
        stampsRequired: program.stampsRequired,
        customerIdentifier: normalizedIdentifier,
      };
    }),

  // ── Owner: Redeem a customer's reward ────────────────────
  redeemReward: privateProcedure
    .input(z.object({ cardId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const card = await ctx.db.loyaltyCard.findUnique({
        where: { id: input.cardId },
        include: {
          program: {
            include: { menu: { select: { userId: true } } },
          },
        },
      });

      if (!card || card.program.menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to redeem this card",
        });
      }

      if (card.isRedeemed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This card has already been redeemed",
        });
      }

      if (card.stampsCollected < card.program.stampsRequired) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough stamps to redeem",
        });
      }

      return ctx.db.loyaltyCard.update({
        where: { id: input.cardId },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
        },
      });
    }),

  // ── Owner: Get program stats ─────────────────────────────
  getProgramStats: privateProcedure
    .input(z.object({ programId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const program = await ctx.db.loyaltyProgram.findUnique({
        where: { id: input.programId },
        include: { menu: { select: { userId: true } } },
      });

      if (!program || program.menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view stats for this program",
        });
      }

      const [totalCards, activeCards, redemptions, totalStamps] =
        await Promise.all([
          ctx.db.loyaltyCard.count({
            where: { programId: input.programId },
          }),
          ctx.db.loyaltyCard.count({
            where: { programId: input.programId, isRedeemed: false },
          }),
          ctx.db.loyaltyCard.count({
            where: { programId: input.programId, isRedeemed: true },
          }),
          ctx.db.loyaltyStamp.count({
            where: { card: { programId: input.programId } },
          }),
        ]);

      return {
        totalCards,
        activeCards,
        redemptions,
        totalStamps,
      };
    }),

  // ── Public: Get customer loyalty progress for a menu ─────
  getCustomerLoyalty: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        phone: z.string().min(1).max(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `customer-loyalty:${ipHash}:${input.phone}`,
        limit: 20,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      const normalizedPhone = input.phone.toLowerCase().trim();

      // Find all active programs for this menu
      const programs = await ctx.db.loyaltyProgram.findMany({
        where: { menuId: input.menuId, isActive: true },
        select: {
          id: true,
          name: true,
          stampsRequired: true,
          rewardDescription: true,
          rewardType: true,
          rewardValue: true,
          icon: true,
          color: true,
        },
        orderBy: { createdAt: "asc" },
      });

      if (programs.length === 0) {
        return [];
      }

      // Find cards for this customer across all active programs
      const cards = await ctx.db.loyaltyCard.findMany({
        where: {
          programId: { in: programs.map((p) => p.id) },
          customerIdentifier: normalizedPhone,
        },
        select: {
          id: true,
          programId: true,
          stampsCollected: true,
          isRedeemed: true,
          redeemedAt: true,
        },
      });

      const cardByProgram = new Map(
        cards.map((card) => [card.programId, card]),
      );

      return programs.map((program) => {
        const card = cardByProgram.get(program.id);
        const stampsCollected = card?.stampsCollected ?? 0;
        const isRedeemable =
          stampsCollected >= program.stampsRequired &&
          !(card?.isRedeemed ?? false);

        return {
          programId: program.id,
          programName: program.name,
          stampsRequired: program.stampsRequired,
          stampsCollected,
          isRedeemable,
          isRedeemed: card?.isRedeemed ?? false,
          rewardDescription: program.rewardDescription,
          rewardType: program.rewardType,
          rewardValue: program.rewardValue,
          icon: program.icon,
          color: program.color,
        };
      });
    }),

  // ── Owner: Get cards for a program ───────────────────────
  getCards: privateProcedure
    .input(
      z.object({
        programId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const program = await ctx.db.loyaltyProgram.findUnique({
        where: { id: input.programId },
        include: { menu: { select: { userId: true } } },
      });

      if (!program || program.menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view cards for this program",
        });
      }

      const cards = await ctx.db.loyaltyCard.findMany({
        where: { programId: input.programId },
        orderBy: { updatedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      });

      let nextCursor: string | undefined;

      if (cards.length > input.limit) {
        const nextItem = cards.pop();

        nextCursor = nextItem?.id;
      }

      return { cards, nextCursor };
    }),
});
