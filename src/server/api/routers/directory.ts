import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";
import { hashIP } from "~/server/security";

// ── Select fields for menu listings (avoid returning full objects) ──

const menuListingSelect = {
  id: true,
  name: true,
  slug: true,
  address: true,
  city: true,
  logoImageUrl: true,
  backgroundImageUrl: true,
  currency: true,
  priceRange: true,
  rating: true,
  reviewCount: true,
  viewCount: true,
  isFeatured: true,
  createdAt: true,
  directoryCity: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  cuisineType: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
  },
} as const;

// ── Router ──────────────────────────────────────────────────

export const directoryRouter = createTRPCRouter({
  /**
   * getCities - List all cities with published restaurant counts.
   * Ordered by population descending. Includes region name.
   */
  getCities: publicProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db.city.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        imageUrl: true,
        latitude: true,
        longitude: true,
        population: true,
        isFeatured: true,
        region: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            menus: {
              where: { isPublished: true },
            },
          },
        },
      },
      orderBy: { population: "desc" },
    });

    return cities;
  }),

  /**
   * getFeaturedCities - Featured cities for the homepage.
   * Returns cities where is_featured = true, limited to 8.
   */
  getFeaturedCities: publicProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db.city.findMany({
      where: { isFeatured: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        imageUrl: true,
        population: true,
        region: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            menus: {
              where: { isPublished: true },
            },
          },
        },
      },
      orderBy: { population: "desc" },
      take: 8,
    });

    return cities;
  }),

  /**
   * getCityBySlug - Single city details with region and cuisine type breakdown.
   */
  getCityBySlug: publicProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const city = await ctx.db.city.findUnique({
        where: { slug: input.slug },
        select: {
          id: true,
          name: true,
          nameAr: true,
          nameFr: true,
          slug: true,
          description: true,
          descriptionAr: true,
          descriptionFr: true,
          imageUrl: true,
          latitude: true,
          longitude: true,
          population: true,
          isFeatured: true,
          region: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              nameFr: true,
              slug: true,
            },
          },
          _count: {
            select: {
              menus: {
                where: { isPublished: true },
              },
            },
          },
        },
      });

      if (!city) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "City not found",
        });
      }

      // Get cuisine type counts for this city's published menus
      const cuisineTypeCounts = await ctx.db.menus.groupBy({
        by: ["cuisineTypeId"],
        where: {
          cityId: city.id,
          isPublished: true,
          cuisineTypeId: { not: null },
        },
        _count: { id: true },
      });

      // Fetch the cuisine type details for those that have menus
      const cuisineTypeIds = cuisineTypeCounts
        .map((c) => c.cuisineTypeId)
        .filter((id): id is string => id !== null);

      const cuisineTypes =
        cuisineTypeIds.length > 0
          ? await ctx.db.cuisineType.findMany({
              where: { id: { in: cuisineTypeIds } },
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            })
          : [];

      // Merge counts with cuisine type details
      const cuisineTypesWithCounts = cuisineTypes.map((ct) => ({
        ...ct,
        menuCount:
          cuisineTypeCounts.find((c) => c.cuisineTypeId === ct.id)?._count.id ??
          0,
      }));

      return {
        ...city,
        cuisineTypes: cuisineTypesWithCounts,
      };
    }),

  /**
   * getRestaurantsByCity - Paginated, filterable restaurants in a city.
   * Only returns published menus.
   */
  getRestaurantsByCity: publicProcedure
    .input(
      z.object({
        citySlug: z.string().max(200),
        cuisineSlug: z.string().max(200).optional(),
        priceRange: z.number().min(1).max(4).optional(),
        sortBy: z
          .enum(["popular", "rating", "newest", "name"])
          .default("popular"),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Resolve city slug to ID
      const city = await ctx.db.city.findUnique({
        where: { slug: input.citySlug },
        select: { id: true, name: true, slug: true },
      });

      if (!city) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "City not found",
        });
      }


      // Resolve cuisine slug to ID if provided
      let cuisineTypeId: string | undefined;

      if (input.cuisineSlug) {
        const cuisineType = await ctx.db.cuisineType.findUnique({
          where: { slug: input.cuisineSlug },
          select: { id: true },
        });

        if (!cuisineType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cuisine type not found",
          });
        }

        cuisineTypeId = cuisineType.id;
      }

      // Build where clause
      const where = {
        isPublished: true,
        cityId: city.id,
        ...(cuisineTypeId ? { cuisineTypeId } : {}),
        ...(input.priceRange ? { priceRange: input.priceRange } : {}),
      };


      // Build orderBy based on sortBy
      type MenuOrderBy = Record<string, "asc" | "desc">;

      let orderBy: MenuOrderBy;

      switch (input.sortBy) {
        case "popular":
          orderBy = { viewCount: "desc" };
          break;
        case "rating":
          orderBy = { rating: "desc" };
          break;
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
        case "name":
          orderBy = { name: "asc" };
          break;
        default:
          orderBy = { viewCount: "desc" };
      }

      const skip = (input.page - 1) * input.limit;

      const [restaurants, totalCount] = await Promise.all([
        ctx.db.menus.findMany({
          where,
          select: menuListingSelect,
          orderBy,
          take: input.limit,
          skip,
        }),
        ctx.db.menus.count({ where }),
      ]);

      return {
        restaurants,
        city,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / input.limit),
          hasMore: skip + restaurants.length < totalCount,
        },
      };
    }),

  /**
   * getCuisineTypes - All cuisine categories ordered by sort_order.
   */
  getCuisineTypes: publicProcedure.query(async ({ ctx }) => {
    const cuisineTypes = await ctx.db.cuisineType.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        icon: true,
        description: true,
        sortOrder: true,
        _count: {
          select: {
            menus: {
              where: { isPublished: true },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return cuisineTypes;
  }),

  /**
   * getFeaturedRestaurants - Featured published menus for the homepage.
   * Ordered by view count descending.
   */
  getFeaturedRestaurants: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      const restaurants = await ctx.db.menus.findMany({
        where: {
          isPublished: true,
          isFeatured: true,
        },
        select: menuListingSelect,
        orderBy: { viewCount: "desc" },
        take: input.limit,
      });

      return restaurants;
    }),

  /**
   * searchRestaurants - Full text search across menu name, address, city name.
   * Case-insensitive LIKE matching, only published menus.
   */
  searchRestaurants: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `search-restaurants:${ipHash}`,
        limit: 30,
        windowMs: 60 * 1000, // 30 searches per minute per IP
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many search requests. Please try again shortly.",
        });
      }

      const searchTerm = input.query;

      const restaurants = await ctx.db.menus.findMany({
        where: {
          isPublished: true,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { address: { contains: searchTerm, mode: "insensitive" } },
            { city: { contains: searchTerm, mode: "insensitive" } },
            {
              directoryCity: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
            {
              cuisineType: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
          ],
        },
        select: menuListingSelect,
        orderBy: { viewCount: "desc" },
        take: input.limit,
      });

      return restaurants;
    }),

  /**
   * getRegions - All regions with city counts, ordered alphabetically.
   */
  getRegions: publicProcedure.query(async ({ ctx }) => {
    const regions = await ctx.db.region.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        _count: {
          select: {
            cities: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return regions;
  }),

  /**
   * getRegionsWithCities - All regions with their cities and published menu counts.
   * Used by the Explore page "All Regions" section.
   */
  getRegionsWithCities: publicProcedure.query(async ({ ctx }) => {
    const regions = await ctx.db.region.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameFr: true,
        slug: true,
        cities: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                menus: { where: { isPublished: true } },
              },
            },
          },
          orderBy: { population: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return regions;
  }),

  /**
   * incrementViewCount - Track restaurant page views.
   * Rate-limited per IP per menu to prevent view count inflation.
   */
  incrementViewCount: publicProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);

      const { success } = rateLimit({
        key: `view-count:${ipHash}:${input.menuId}`,
        limit: 3,
        windowMs: 60 * 60 * 1000, // 1 hour per IP per menu
      });

      if (!success) {
        // Silently succeed without incrementing to avoid exposing rate limit
        return { success: true };
      }

      // Verify the menu exists and is published
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, isPublished: true },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found",
        });
      }

      await ctx.db.menus.update({
        where: { id: input.menuId },
        data: {
          viewCount: { increment: 1 },
        },
      });

      return { success: true };
    }),

  /**
   * getTrendingRestaurants - Recently most-viewed published menus.
   * Optionally filtered by city.
   */
  getTrendingRestaurants: publicProcedure
    .input(
      z.object({
        citySlug: z.string().max(200).optional(),
        limit: z.number().min(1).max(10).default(6),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Resolve city slug to ID if provided
      let cityId: string | undefined;

      if (input.citySlug) {
        const city = await ctx.db.city.findUnique({
          where: { slug: input.citySlug },
          select: { id: true },
        });

        if (!city) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "City not found",
          });
        }

        cityId = city.id;
      }

      const restaurants = await ctx.db.menus.findMany({
        where: {
          isPublished: true,
          viewCount: { gt: 0 },
          ...(cityId ? { cityId } : {}),
        },
        select: menuListingSelect,
        orderBy: [{ viewCount: "desc" }, { rating: "desc" }],
        take: input.limit,
      });

      return restaurants;
    }),
});
