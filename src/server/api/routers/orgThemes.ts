/**
 * Diyafa — Organization Themes Router
 *
 * Branding customization for caterer profiles:
 * - Color scheme (primary, secondary, background, surface, text, accent)
 * - Typography (heading font, body font)
 * - Layout style (elegant, modern, traditional, minimal)
 * - Card style and border radius
 * - Custom CSS
 * - Theme preview
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

export const orgThemesRouter = createTRPCRouter({
  /** Public: Get theme for a caterer profile */
  getPublicTheme: publicProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.orgSlug, isActive: true },
        select: { id: true },
      });

      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      const theme = await ctx.db.orgThemes.findUnique({
        where: { orgId: org.id },
      });

      // Return default theme if none set
      return theme ?? {
        primaryColor: "#B8860B",
        secondaryColor: "#8B6914",
        backgroundColor: "#FFFDF7",
        surfaceColor: "#FFFFFF",
        textColor: "#1A1A1A",
        accentColor: "#C2703E",
        headingFont: "Cormorant",
        bodyFont: "EB Garamond",
        layoutStyle: "elegant",
        cardStyle: "elevated",
        borderRadius: "medium",
        headerStyle: "banner",
        customCss: "",
      };
    }),

  /** Org: Get current theme */
  get: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      return ctx.db.orgThemes.findUnique({
        where: { orgId: ctx.orgId },
      });
    }),

  /** Org: Update or create theme */
  upsert: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        surfaceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        headingFont: z.string().max(100).optional(),
        bodyFont: z.string().max(100).optional(),
        layoutStyle: z.enum(["elegant", "modern", "traditional", "minimal", "bold"]).optional(),
        cardStyle: z.enum(["elevated", "flat", "bordered", "glass"]).optional(),
        borderRadius: z.enum(["none", "small", "medium", "large", "full"]).optional(),
        headerStyle: z.enum(["banner", "hero", "compact", "overlay"]).optional(),
        customCss: z.string().max(10000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;

      return ctx.db.orgThemes.upsert({
        where: { orgId: ctx.orgId },
        create: {
          orgId: ctx.orgId,
          ...data,
        },
        update: data,
      });
    }),

  /** Org: Reset theme to defaults */
  reset: orgManagerProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .mutation(async ({ ctx }) => {
      return ctx.db.orgThemes.upsert({
        where: { orgId: ctx.orgId },
        create: {
          orgId: ctx.orgId,
          primaryColor: "#B8860B",
          secondaryColor: "#8B6914",
          backgroundColor: "#FFFDF7",
          surfaceColor: "#FFFFFF",
          textColor: "#1A1A1A",
          accentColor: "#C2703E",
          headingFont: "Cormorant",
          bodyFont: "EB Garamond",
          layoutStyle: "elegant",
          cardStyle: "elevated",
          borderRadius: "medium",
          headerStyle: "banner",
          customCss: "",
        },
        update: {
          primaryColor: "#B8860B",
          secondaryColor: "#8B6914",
          backgroundColor: "#FFFDF7",
          surfaceColor: "#FFFFFF",
          textColor: "#1A1A1A",
          accentColor: "#C2703E",
          headingFont: "Cormorant",
          bodyFont: "EB Garamond",
          layoutStyle: "elegant",
          cardStyle: "elevated",
          borderRadius: "medium",
          headerStyle: "banner",
          customCss: "",
        },
      });
    }),

  /** Get available fonts */
  getAvailableFonts: publicProcedure.query(() => {
    return {
      heading: [
        { name: "Cormorant", category: "serif", label: "Cormorant — Elegant" },
        { name: "Playfair Display", category: "serif", label: "Playfair — Classic" },
        { name: "Amiri", category: "serif", label: "Amiri — Arabic Calligraphy" },
        { name: "Lora", category: "serif", label: "Lora — Contemporary" },
        { name: "Cinzel", category: "serif", label: "Cinzel — Royal" },
        { name: "Poppins", category: "sans-serif", label: "Poppins — Modern" },
        { name: "Montserrat", category: "sans-serif", label: "Montserrat — Clean" },
        { name: "Cairo", category: "sans-serif", label: "Cairo — Arabic Modern" },
      ],
      body: [
        { name: "EB Garamond", category: "serif", label: "EB Garamond — Readable" },
        { name: "Source Serif Pro", category: "serif", label: "Source Serif — Professional" },
        { name: "Noto Sans Arabic", category: "sans-serif", label: "Noto Sans Arabic" },
        { name: "Inter", category: "sans-serif", label: "Inter — Universal" },
        { name: "DM Sans", category: "sans-serif", label: "DM Sans — Modern" },
        { name: "Tajawal", category: "sans-serif", label: "Tajawal — Arabic Sans" },
      ],
    };
  }),

  /** Get theme presets */
  getPresets: publicProcedure.query(() => {
    return [
      {
        id: "royal-gold",
        name: "Royal Gold",
        nameAr: "ذهبي ملكي",
        nameFr: "Or Royal",
        colors: {
          primaryColor: "#B8860B",
          secondaryColor: "#8B6914",
          backgroundColor: "#FFFDF7",
          surfaceColor: "#FFFFFF",
          textColor: "#1A1A1A",
          accentColor: "#C2703E",
        },
      },
      {
        id: "moroccan-teal",
        name: "Moroccan Teal",
        nameAr: "أزرق مغربي",
        nameFr: "Bleu Marocain",
        colors: {
          primaryColor: "#006D6F",
          secondaryColor: "#004D4D",
          backgroundColor: "#F0FFFE",
          surfaceColor: "#FFFFFF",
          textColor: "#1A2B2B",
          accentColor: "#D4A259",
        },
      },
      {
        id: "rose-garden",
        name: "Rose Garden",
        nameAr: "حديقة الورود",
        nameFr: "Jardin de Roses",
        colors: {
          primaryColor: "#B76E79",
          secondaryColor: "#8E4953",
          backgroundColor: "#FFF5F5",
          surfaceColor: "#FFFFFF",
          textColor: "#2D1A1E",
          accentColor: "#D4A259",
        },
      },
      {
        id: "midnight-luxury",
        name: "Midnight Luxury",
        nameAr: "فخامة الليل",
        nameFr: "Luxe de Minuit",
        colors: {
          primaryColor: "#D4A259",
          secondaryColor: "#B8860B",
          backgroundColor: "#1A1A2E",
          surfaceColor: "#16213E",
          textColor: "#E8E8E8",
          accentColor: "#C2703E",
        },
      },
      {
        id: "olive-grove",
        name: "Olive Grove",
        nameAr: "بستان الزيتون",
        nameFr: "Oliveraie",
        colors: {
          primaryColor: "#556B2F",
          secondaryColor: "#3B4D1C",
          backgroundColor: "#FAFFF0",
          surfaceColor: "#FFFFFF",
          textColor: "#1A2010",
          accentColor: "#C2703E",
        },
      },
    ];
  }),
});
