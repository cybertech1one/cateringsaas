/**
 * Theme Router - tRPC API for menu theme management
 *
 * SDLC: API Framework Layer
 * Handles CRUD operations for menu themes with proper validation,
 * ownership checks, and rate limiting.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@prisma/client";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import {
  FONT_SIZES,
  LAYOUT_STYLES,
  CARD_STYLES,
  BORDER_RADII,
  SPACINGS,
  IMAGE_STYLES,
  HEADER_STYLES,
  DEFAULT_THEME,
  THEME_TEMPLATES,
  FONT_LIBRARY,
} from "~/lib/theme";
import { cache } from "~/server/cache";

// ── Validation Schema ───────────────────────────────────────

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

const themeInputSchema = z.object({
  menuId: z.string().uuid(),
  primaryColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  secondaryColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  backgroundColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  surfaceColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  textColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  accentColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  headingFont: z.string().min(1).max(100),
  bodyFont: z.string().min(1).max(100),
  fontSize: z.enum(FONT_SIZES as unknown as [string, ...string[]]),
  layoutStyle: z.enum(LAYOUT_STYLES as unknown as [string, ...string[]]),
  cardStyle: z.enum(CARD_STYLES as unknown as [string, ...string[]]),
  borderRadius: z.enum(BORDER_RADII as unknown as [string, ...string[]]),
  spacing: z.enum(SPACINGS as unknown as [string, ...string[]]),
  showImages: z.boolean(),
  imageStyle: z.enum(IMAGE_STYLES as unknown as [string, ...string[]]),
  showPrices: z.boolean(),
  showNutrition: z.boolean(),
  showCategoryNav: z.boolean(),
  showCategoryDividers: z.boolean(),
  headerStyle: z.enum(HEADER_STYLES as unknown as [string, ...string[]]),
  customCss: z.string().max(5000).optional().default(""),
});

// ── Helper: Verify menu ownership ───────────────────────────

async function verifyMenuOwnership(
  db: PrismaClient,
  menuId: string,
  userId: string,
) {
  const menu = await db.menus.findFirst({
    where: { id: menuId, userId },
    select: { id: true },
  });

  if (!menu) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Menu not found or you don't have permission",
    });
  }

  return menu;
}

// ── Router ──────────────────────────────────────────────────

export const themeRouter = createTRPCRouter({
  /**
   * GET theme for a menu (owner only)
   */
  getTheme: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const theme = await ctx.db.menuThemes.findUnique({
        where: { menuId: input.menuId },
      });

      return theme ?? DEFAULT_THEME;
    }),

  /**
   * GET theme for public menu view (no auth required)
   */
  getPublicTheme: publicProcedure
    .input(z.object({ menuSlug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { slug: input.menuSlug, isPublished: true },
        select: { id: true },
      });

      if (!menu) {
        return DEFAULT_THEME;
      }

      const theme = await ctx.db.menuThemes.findUnique({
        where: { menuId: menu.id },
      });

      if (!theme) {
        return DEFAULT_THEME;
      }

      // Return only the design tokens, not the DB metadata
      return {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        backgroundColor: theme.backgroundColor,
        surfaceColor: theme.surfaceColor,
        textColor: theme.textColor,
        accentColor: theme.accentColor,
        headingFont: theme.headingFont,
        bodyFont: theme.bodyFont,
        fontSize: theme.fontSize,
        layoutStyle: theme.layoutStyle,
        cardStyle: theme.cardStyle,
        borderRadius: theme.borderRadius,
        spacing: theme.spacing,
        showImages: theme.showImages,
        imageStyle: theme.imageStyle,
        showPrices: theme.showPrices,
        showNutrition: theme.showNutrition,
        showCategoryNav: theme.showCategoryNav,
        showCategoryDividers: theme.showCategoryDividers,
        headerStyle: theme.headerStyle,
        customCss: theme.customCss ?? "",
      };
    }),

  /**
   * SAVE/UPDATE theme (upsert)
   */
  saveTheme: privateProcedure
    .input(themeInputSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const { menuId, ...themeData } = input;

      const theme = await ctx.db.menuThemes.upsert({
        where: { menuId },
        create: { menuId, ...themeData },
        update: { ...themeData, updatedAt: new Date() },
      });

      cache.invalidate("public:menu:");

      return theme;
    }),

  /**
   * RESET theme to defaults
   */
  resetTheme: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      // Delete existing theme - the viewer will use DEFAULT_THEME
      await ctx.db.menuThemes.deleteMany({
        where: { menuId: input.menuId },
      });

      cache.invalidate("public:menu:");

      return DEFAULT_THEME;
    }),

  /**
   * Apply a template preset
   */
  applyTemplate: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        templateId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMenuOwnership(ctx.db, input.menuId, ctx.user.id);

      const template = THEME_TEMPLATES.find((t) => t.id === input.templateId);

      if (!template) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Template not found",
        });
      }

      const themeData = { ...template.theme };

      const theme = await ctx.db.menuThemes.upsert({
        where: { menuId: input.menuId },
        create: { menuId: input.menuId, ...themeData },
        update: { ...themeData, updatedAt: new Date() },
      });

      cache.invalidate("public:menu:");

      return theme;
    }),

  /**
   * GET available templates (no auth)
   */
  getTemplates: publicProcedure.query(() => {
    return THEME_TEMPLATES.map(({ id, name, description, preview, theme, isPro, category }) => ({
      id,
      name,
      description,
      preview,
      theme,
      isPro,
      category,
    }));
  }),

  /**
   * GET available fonts (no auth)
   */
  getFonts: publicProcedure.query(() => {
    return FONT_LIBRARY;
  }),
});
