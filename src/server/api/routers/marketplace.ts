/**
 * Diyafa — Marketplace Router
 *
 * Public-facing marketplace for clients to discover caterers:
 * - Browse by city, cuisine, event type, budget, capacity
 * - Full-text search across caterer profiles
 * - Featured caterers for homepage
 * - City pages for SEO (e.g., "traiteur mariage casablanca")
 * - Event type pages (weddings, corporate, Ramadan)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const marketplaceRouter = createTRPCRouter({
  /** Browse caterers with comprehensive filters */
  browse: publicProcedure
    .input(
      z.object({
        city: z.string().optional(),
        type: z.string().optional(),
        cuisines: z.array(z.string()).optional(),
        eventType: z.string().optional(),
        priceRange: z.string().optional(),
        minGuests: z.number().int().positive().optional(),
        maxGuests: z.number().int().positive().optional(),
        isVerified: z.boolean().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["rating", "reviews", "price_asc", "price_desc", "newest", "featured"]).default("featured"),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { isActive: true };

      if (input.city) where.city = { equals: input.city, mode: "insensitive" };
      if (input.type) where.type = input.type;
      if (input.cuisines?.length) where.cuisines = { hasSome: input.cuisines };
      if (input.priceRange) where.priceRange = input.priceRange;
      if (input.isVerified) where.isVerified = true;
      if (input.minGuests) where.maxGuests = { gte: input.minGuests };
      if (input.maxGuests) where.minGuests = { lte: input.maxGuests };
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          { city: { contains: input.search, mode: "insensitive" } },
          { specialties: { hasSome: [input.search] } },
        ];
      }

      let orderBy: Record<string, string> | Record<string, string>[] = {};
      switch (input.sortBy) {
        case "featured": orderBy = [{ isFeatured: "desc" }, { rating: "desc" }]; break;
        case "rating": orderBy = { rating: "desc" }; break;
        case "reviews": orderBy = { reviewCount: "desc" }; break;
        case "newest": orderBy = { createdAt: "desc" }; break;
        default: orderBy = { rating: "desc" };
      }

      const caterers = await ctx.db.organizations.findMany({
        where,
        orderBy,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          description: true,
          logoUrl: true,
          coverImageUrl: true,
          city: true,
          cuisines: true,
          specialties: true,
          priceRange: true,
          minGuests: true,
          maxGuests: true,
          rating: true,
          reviewCount: true,
          isVerified: true,
          isFeatured: true,
        },
      });

      let nextCursor: string | undefined;
      if (caterers.length > input.limit) {
        const nextItem = caterers.pop();
        nextCursor = nextItem?.id;
      }

      return { caterers, nextCursor };
    }),

  /** Full-text search */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2).max(100),
        limit: z.number().int().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.organizations.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { description: { contains: input.query, mode: "insensitive" } },
            { city: { contains: input.query, mode: "insensitive" } },
            { cuisines: { hasSome: [input.query] } },
          ],
        },
        take: input.limit,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          logoUrl: true,
          city: true,
          rating: true,
          reviewCount: true,
          isVerified: true,
          priceRange: true,
        },
      });
    }),

  /** Get cities with caterer counts */
  getCities: publicProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db.organizations.groupBy({
      by: ["city"],
      where: { isActive: true },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
    });

    return cities
      .filter((c) => c.city)
      .map((c) => ({
        name: c.city as string,
        count: c._count.city,
        slug: (c.city as string).toLowerCase().replace(/\s+/g, "-"),
      }));
  }),

  /** Get available cuisines */
  getCuisines: publicProcedure.query(async ({ ctx }) => {
    const orgs = await ctx.db.organizations.findMany({
      where: { isActive: true },
      select: { cuisines: true },
    });

    const cuisineCount = new Map<string, number>();
    orgs.forEach((o) => {
      (o.cuisines as string[])?.forEach((c) => {
        cuisineCount.set(c, (cuisineCount.get(c) ?? 0) + 1);
      });
    });

    return Array.from(cuisineCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }),

  /** Get event types with descriptions */
  getEventTypes: publicProcedure.query(() => {
    return [
      { id: "wedding", name: "Wedding", nameAr: "حفل زفاف", nameFr: "Mariage", icon: "rings" },
      { id: "corporate", name: "Corporate Event", nameAr: "حدث مهني", nameFr: "Événement professionnel", icon: "briefcase" },
      { id: "ramadan_iftar", name: "Ramadan Iftar", nameAr: "إفطار رمضان", nameFr: "Iftar Ramadan", icon: "moon" },
      { id: "eid", name: "Eid Celebration", nameAr: "احتفال العيد", nameFr: "Fête de l'Aïd", icon: "star" },
      { id: "birthday", name: "Birthday Party", nameAr: "حفل عيد ميلاد", nameFr: "Anniversaire", icon: "cake" },
      { id: "conference", name: "Conference", nameAr: "مؤتمر", nameFr: "Conférence", icon: "mic" },
      { id: "engagement", name: "Engagement", nameAr: "خطوبة", nameFr: "Fiançailles", icon: "heart" },
      { id: "henna", name: "Henna Night", nameAr: "ليلة الحناء", nameFr: "Soirée henné", icon: "hand" },
      { id: "graduation", name: "Graduation", nameAr: "حفل تخرج", nameFr: "Remise de diplômes", icon: "graduation-cap" },
      { id: "funeral", name: "Memorial", nameAr: "عزاء", nameFr: "Funérailles", icon: "flower" },
      { id: "other", name: "Other Event", nameAr: "حدث آخر", nameFr: "Autre événement", icon: "calendar" },
    ];
  }),

  /** Get featured caterers for homepage */
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(8) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.organizations.findMany({
        where: { isActive: true, isFeatured: true },
        take: input.limit,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          description: true,
          logoUrl: true,
          coverImageUrl: true,
          city: true,
          cuisines: true,
          priceRange: true,
          rating: true,
          reviewCount: true,
          isVerified: true,
        },
      });
    }),

  /** Get contact info for a caterer (for WhatsApp inquiry button) */
  getContactInfo: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.slug, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          whatsappNumber: true,
          email: true,
        },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Caterer not found",
        });
      }

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        phone: org.phone,
        whatsappNumber: org.whatsappNumber,
        email: org.email,
      };
    }),

  /** Get homepage statistics */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [catererCount, cityCount, eventCount, reviewCount] = await Promise.all([
      ctx.db.organizations.count({ where: { isActive: true } }),
      ctx.db.organizations.groupBy({
        by: ["city"],
        where: { isActive: true },
      }),
      ctx.db.events.count({ where: { status: { notIn: ["cancelled", "inquiry"] } } }),
      ctx.db.reviews.count({ where: { isPublished: true } }),
    ]);

    return {
      catererCount,
      cityCount: cityCount.length,
      eventCount,
      reviewCount,
    };
  }),
});
