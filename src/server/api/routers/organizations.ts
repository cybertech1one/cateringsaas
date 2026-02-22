/**
 * Diyafa — Organizations Router
 *
 * The core multi-tenant router. Every caterer, restaurant, hotel,
 * venue, or event planner is an "Organization" in Diyafa.
 *
 * Public endpoints: browse, search, getPublicProfile
 * Org-scoped: CRUD, member management, settings
 * Admin: verification, suspension
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
  orgProcedure,
  orgAdminProcedure,
  orgOwnerProcedure,
  superAdminProcedure,
} from "~/server/api/trpc";

// ──────────────────────────────────────────────
// Shared Schemas
// ──────────────────────────────────────────────

const orgTypeEnum = z.enum([
  "caterer",
  "restaurant",
  "hotel",
  "venue",
  "event_planner",
]);

const priceRangeEnum = z.enum(["budget", "mid", "premium", "luxury"]);

const subscriptionTierEnum = z.enum(["free", "pro", "enterprise"]);

const orgRoleEnum = z.enum([
  "org_owner",
  "admin",
  "manager",
  "staff",
]);

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────

export const organizationsRouter = createTRPCRouter({
  // ─── Public Endpoints ───────────────────────

  /** Browse organizations (marketplace) */
  browse: publicProcedure
    .input(
      z.object({
        city: z.string().optional(),
        type: orgTypeEnum.optional(),
        cuisines: z.array(z.string()).optional(),
        priceRange: priceRangeEnum.optional(),
        minGuests: z.number().int().positive().optional(),
        eventType: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["rating", "reviews", "name", "newest"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        isActive: true,
      };

      if (input.city) {
        where.city = { equals: input.city, mode: "insensitive" };
      }
      if (input.type) {
        where.type = input.type;
      }
      if (input.cuisines && input.cuisines.length > 0) {
        where.cuisines = { hasSome: input.cuisines };
      }
      if (input.priceRange) {
        where.priceRange = input.priceRange;
      }
      if (input.minGuests) {
        where.maxGuests = { gte: input.minGuests };
      }
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          { specialties: { hasSome: [input.search] } },
        ];
      }

      const orderBy: Record<string, string> = {};
      switch (input.sortBy) {
        case "rating":
          orderBy.rating = "desc";
          break;
        case "reviews":
          orderBy.reviewCount = "desc";
          break;
        case "name":
          orderBy.name = "asc";
          break;
        case "newest":
          orderBy.createdAt = "desc";
          break;
        default:
          orderBy.rating = "desc";
      }

      const organizations = await ctx.db.organizations.findMany({
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
      if (organizations.length > input.limit) {
        const nextItem = organizations.pop();
        nextCursor = nextItem?.id;
      }

      return {
        organizations,
        nextCursor,
      };
    }),

  /** Get public caterer profile */
  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.slug, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          description: true,
          bio: true,
          logoUrl: true,
          coverImageUrl: true,
          city: true,
          address: true,
          phone: true,
          email: true,
          whatsappNumber: true,
          website: true,
          instagram: true,
          facebook: true,
          cuisines: true,
          specialties: true,
          minGuests: true,
          maxGuests: true,
          priceRange: true,
          rating: true,
          reviewCount: true,
          isVerified: true,
          createdAt: true,
        },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Caterer not found",
        });
      }

      return org;
    }),

  /** Search organizations */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
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
          ],
        },
        take: input.limit,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          logoUrl: true,
          city: true,
          rating: true,
          isVerified: true,
        },
      });
    }),

  /** Get featured organizations for homepage */
  getFeatured: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.organizations.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: 12,
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

  /** Get available cities for marketplace filters */
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
        city: c.city as string,
        count: c._count.city,
      }));
  }),

  // ─── Authenticated Endpoints ────────────────

  /** Create a new organization (onboarding) */
  create: privateProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        type: orgTypeEnum,
        city: z.string().min(2).max(100),
        phone: z.string().optional(),
        whatsappNumber: z.string().optional(),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate slug from name
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (await ctx.db.organizations.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create org + make creator the owner
      const org = await ctx.db.organizations.create({
        data: {
          name: input.name,
          slug,
          type: input.type,
          city: input.city,
          phone: input.phone,
          whatsappNumber: input.whatsappNumber,
          description: input.description,
          subscriptionTier: "free",
          isActive: true,
          members: {
            create: {
              userId: ctx.user.id,
              role: "org_owner",
              isActive: true,
            },
          },
        },
      });

      return org;
    }),

  // ─── Org-Scoped Endpoints ───────────────────

  /** Get current user's organization */
  getMine: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.organizations.findUnique({
      where: { id: ctx.orgId },
      include: {
        _count: {
          select: {
            members: { where: { isActive: true } },
          },
        },
      },
    });
  }),

  /** Update organization details */
  update: orgAdminProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(2000).optional(),
        bio: z.string().max(5000).optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        whatsappNumber: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        cuisines: z.array(z.string()).optional(),
        specialties: z.array(z.string()).optional(),
        minGuests: z.number().int().positive().optional(),
        maxGuests: z.number().int().positive().optional(),
        priceRange: priceRangeEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;
      return ctx.db.organizations.update({
        where: { id: ctx.orgId },
        data,
      });
    }),

  /** Update organization settings (JSON blob) */
  updateSettings: orgAdminProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        settings: z.record(z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.organizations.findUnique({
        where: { id: ctx.orgId },
        select: { settings: true },
      });

      const mergedSettings = {
        ...(current?.settings as Record<string, unknown> || {}),
        ...input.settings,
      };

      return ctx.db.organizations.update({
        where: { id: ctx.orgId },
        data: { settings: mergedSettings as unknown as Prisma.InputJsonValue },
      });
    }),

  // ─── Member Management ──────────────────────

  /** List org members */
  getMembers: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      return ctx.db.orgMembers.findMany({
        where: { orgId: ctx.orgId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  /** Invite a new member */
  inviteMember: orgAdminProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        email: z.string().email(),
        role: orgRoleEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const user = await ctx.db.profiles.findFirst({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found. They must register first.",
        });
      }

      // Check if already a member
      const existing = await ctx.db.orgMembers.findFirst({
        where: { orgId: ctx.orgId, userId: user.id },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this organization",
        });
      }

      return ctx.db.orgMembers.create({
        data: {
          orgId: ctx.orgId,
          userId: user.id,
          role: input.role,
          isActive: true,
          invitedBy: ctx.user.id,
          invitedAt: new Date(),
        },
      });
    }),

  /** Update member role */
  updateMemberRole: orgOwnerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        memberId: z.string().uuid(),
        role: orgRoleEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.orgMembers.findFirst({
        where: { id: input.memberId, orgId: ctx.orgId },
      });

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Cannot change own role
      if (member.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change your own role",
        });
      }

      return ctx.db.orgMembers.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });
    }),

  /** Remove a member */
  removeMember: orgAdminProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        memberId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.orgMembers.findFirst({
        where: { id: input.memberId, orgId: ctx.orgId },
      });

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Cannot remove self or owner
      if (member.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove yourself",
        });
      }

      if (member.role === "org_owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove the organization owner",
        });
      }

      return ctx.db.orgMembers.update({
        where: { id: input.memberId },
        data: { isActive: false },
      });
    }),

  // ─── Super Admin Endpoints ──────────────────

  /** Verify an organization (platform admin) */
  verify: superAdminProcedure
    .input(
      z.object({
        orgId: z.string().uuid(),
        verified: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organizations.update({
        where: { id: input.orgId },
        data: { isVerified: input.verified },
      });
    }),

  /** Feature an organization (platform admin) */
  setFeatured: superAdminProcedure
    .input(
      z.object({
        orgId: z.string().uuid(),
        featured: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organizations.update({
        where: { id: input.orgId },
        data: { isFeatured: input.featured },
      });
    }),

  /** Suspend/activate organization (platform admin) */
  setActive: superAdminProcedure
    .input(
      z.object({
        orgId: z.string().uuid(),
        active: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organizations.update({
        where: { id: input.orgId },
        data: { isActive: input.active },
      });
    }),
});
