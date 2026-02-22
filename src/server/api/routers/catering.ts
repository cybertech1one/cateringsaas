/**
 * Catering Router - tRPC API for catering services management
 *
 * Handles CRUD operations for catering menus, packages, categories,
 * items, inquiries, and themes with proper validation, ownership
 * checks, rate limiting, and caching.
 *
 * 29 endpoints: 20 private (owner), 3 public (customer-facing), 6 mixed
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@prisma/client";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { cache, TTL } from "~/server/cache";
import { logger } from "~/server/logger";
import { rateLimit } from "~/server/rateLimit";
import { hashIP, sanitizeString } from "~/server/security";

// ── Constants ───────────────────────────────────────────────

const EVENT_TYPES = [
  "general",
  "wedding",
  "corporate",
  "birthday",
  "ramadan_iftar",
  "eid",
  "funeral",
  "graduation",
  "engagement",
] as const;

const INQUIRY_STATUSES = [
  "pending",
  "reviewed",
  "quoted",
  "confirmed",
  "deposit_paid",
  "completed",
  "cancelled",
] as const;

const LAYOUT_STYLES = [
  "classic",
  "modern",
  "elegant",
  "minimal",
  "festive",
] as const;

const CARD_STYLES = [
  "flat",
  "elevated",
  "bordered",
  "glass",
] as const;

const HEADER_STYLES = [
  "banner",
  "minimal",
  "centered",
  "overlay",
] as const;

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

const CACHE_PREFIX = "public:catering:";

// ── Helpers ─────────────────────────────────────────────────

/**
 * Generate a URL-friendly slug from the catering menu name and optional city.
 * Appends a 6-digit random suffix to ensure uniqueness.
 */
function generateCateringSlug(name: string, city?: string | null): string {
  const base = [name, city].filter(Boolean).join(" ");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${slug}-catering-${suffix}`;
}

/**
 * Verify that a catering menu belongs to the authenticated user.
 * Throws NOT_FOUND if the menu does not exist or is not owned.
 */
async function verifyCateringMenuOwnership(
  db: PrismaClient,
  menuId: string,
  userId: string,
) {
  const menu = await db.cateringMenus.findFirst({
    where: { id: menuId, userId },
    select: { id: true },
  });

  if (!menu) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Catering menu not found",
    });
  }

  return menu;
}

// ── Zod Schemas ─────────────────────────────────────────────

const serviceOptionsSchema = z
  .object({
    servesBuffet: z.boolean().optional(),
    servesPlated: z.boolean().optional(),
    servesCocktail: z.boolean().optional(),
    servesBoxed: z.boolean().optional(),
    providesStaff: z.boolean().optional(),
    providesEquipment: z.boolean().optional(),
    providesDecoration: z.boolean().optional(),
    deliveryIncluded: z.boolean().optional(),
    setupIncluded: z.boolean().optional(),
    cleanupIncluded: z.boolean().optional(),
  })
  .optional();

const cateringMenuInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventType: z.enum(EVENT_TYPES).default("general"),
  minGuests: z.number().int().positive().max(10000).default(10),
  maxGuests: z.number().int().positive().max(10000).default(500),
  basePricePerPerson: z.number().int().nonnegative().max(1000000),
  currency: z.string().min(2).max(10).default("MAD"),
  city: z.string().max(100).optional(),
  serviceArea: z.string().max(500).optional(),
  leadTimeDays: z.number().int().nonnegative().max(365).default(3),
  contactPhone: z
    .string()
    .max(20)
    .regex(/^(\+212|0)[0-9]{9}$/, "Invalid Moroccan phone number")
    .optional()
    .or(z.literal("")),
  contactEmail: z.string().email().max(200).optional().or(z.literal("")),
  whatsappNumber: z
    .string()
    .max(20)
    .regex(/^(\+212|0)[0-9]{9}$/, "Invalid Moroccan phone number")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  coverImageUrl: z.string().url().max(500).optional().or(z.literal("")),
  serviceOptions: serviceOptionsSchema,
  metaTitle: z.string().max(120).optional(),
  metaDescription: z.string().max(300).optional(),
  menuId: z.string().uuid().optional(),
});

const packageInput = z.object({
  cateringMenuId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  pricePerPerson: z.number().int().nonnegative().max(1000000),
  minGuests: z.number().int().positive().max(10000).optional(),
  maxGuests: z.number().int().positive().max(10000).optional(),
  isFeatured: z.boolean().default(false),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
  includesText: z.string().max(2000).optional(),
});

const categoryInput = z.object({
  cateringMenuId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  isOptional: z.boolean().default(false),
});

const itemInput = z.object({
  cateringCategoryId: z.string().uuid(),
  cateringMenuId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  pricePerPerson: z.number().int().nonnegative().max(1000000).optional().nullable(),
  pricePerUnit: z.number().int().nonnegative().max(1000000).optional().nullable(),
  unitLabel: z.string().max(50).optional(),
  minQuantity: z.number().int().nonnegative().max(10000).default(0),
  servesCount: z.number().int().positive().max(10000).optional().nullable(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isHalal: z.boolean().default(true),
  isGlutenFree: z.boolean().default(false),
  allergens: z.array(z.string().max(50)).max(20).default([]),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
});

const themeInput = z.object({
  cateringMenuId: z.string().uuid(),
  primaryColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  secondaryColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  backgroundColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  surfaceColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  textColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  accentColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  headingFont: z.string().min(1).max(100),
  bodyFont: z.string().min(1).max(100),
  layoutStyle: z.enum(LAYOUT_STYLES),
  cardStyle: z.enum(CARD_STYLES),
  borderRadius: z.string().max(20).default("md"),
  headerStyle: z.enum(HEADER_STYLES),
  customCss: z.string().max(5000).optional(),
});

const inquiryInput = z.object({
  cateringMenuId: z.string().uuid(),
  packageId: z.string().uuid().optional(),
  customerName: z.string().min(1).max(200),
  customerPhone: z
    .string()
    .min(1)
    .max(20)
    .regex(/^(\+212|0)[0-9]{9}$/, "Invalid Moroccan phone number"),
  customerEmail: z.string().email().max(200).optional().or(z.literal("")),
  eventType: z.enum(EVENT_TYPES),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  eventTime: z.string().max(10).optional(),
  guestCount: z.number().int().positive().max(10000),
  venueAddress: z.string().max(500).optional(),
  venueCity: z.string().max(100).optional(),
  selectedItems: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.number().int().positive().max(10000).optional(),
      }),
    )
    .optional(),
  specialRequests: z.string().max(2000).optional(),
  dietaryNotes: z.string().max(1000).optional(),
  estimatedTotal: z.number().int().nonnegative().optional(),
});

// ── Router ──────────────────────────────────────────────────

export const cateringRouter = createTRPCRouter({
  // ════════════════════════════════════════════════════════════
  // CATERING MENU CRUD (private)
  // ════════════════════════════════════════════════════════════

  /**
   * 1. getMyMenus - List all catering menus for the authenticated user.
   * Includes counts for packages, items, and inquiries.
   */
  getMyMenus: privateProcedure.query(async ({ ctx }) => {
    const menus = await ctx.db.cateringMenus.findMany({
      where: { userId: ctx.user.id },
      include: {
        _count: {
          select: {
            packages: true,
            items: true,
            inquiries: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return menus;
  }),

  /**
   * 2. getMenu - Get a single catering menu by ID with all relations.
   * Owner only. Returns categories, items, packages (with package items), and theme.
   */
  getMenu: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          categories: {
            include: {
              cateringItems: {
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          packages: {
            include: {
              packageItems: {
                include: {
                  item: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          theme: true,
          _count: {
            select: {
              inquiries: true,
              items: true,
              packages: true,
            },
          },
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Catering menu not found",
        });
      }

      return menu;
    }),

  /**
   * 3. createMenu - Create a new catering menu.
   * Generates a slug from name + city. Optionally links to an existing regular menu.
   */
  createMenu: privateProcedure
    .input(cateringMenuInput)
    .mutation(async ({ ctx, input }) => {
      const slug = generateCateringSlug(input.name, input.city);

      const menu = await ctx.db.cateringMenus.create({
        data: {
          userId: ctx.user.id,
          menuId: input.menuId ?? null,
          name: sanitizeString(input.name),
          slug,
          description: input.description
            ? sanitizeString(input.description)
            : null,
          eventType: input.eventType,
          minGuests: input.minGuests,
          maxGuests: input.maxGuests,
          basePricePerPerson: input.basePricePerPerson,
          currency: input.currency,
          city: input.city ? sanitizeString(input.city) : null,
          serviceArea: input.serviceArea
            ? sanitizeString(input.serviceArea)
            : null,
          leadTimeDays: input.leadTimeDays,
          contactPhone: input.contactPhone || null,
          contactEmail: input.contactEmail || null,
          whatsappNumber: input.whatsappNumber || null,
          logoUrl: input.logoUrl || null,
          coverImageUrl: input.coverImageUrl || null,
          serviceOptions: input.serviceOptions ?? {},
          metaTitle: input.metaTitle
            ? sanitizeString(input.metaTitle)
            : null,
          metaDescription: input.metaDescription
            ? sanitizeString(input.metaDescription)
            : null,
          isPublished: false,
          isFeatured: false,
        },
      });

      logger.info(
        `Catering menu created: ${menu.id} (${menu.name})`,
        "catering",
      );

      return menu;
    }),

  /**
   * 4. updateMenu - Update catering menu details.
   * Owner only. Does not regenerate slug.
   */
  updateMenu: privateProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: cateringMenuInput.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(ctx.db, input.id, ctx.user.id);

      const data: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.data.name !== undefined)
        data.name = sanitizeString(input.data.name);
      if (input.data.description !== undefined)
        data.description = input.data.description
          ? sanitizeString(input.data.description)
          : null;
      if (input.data.eventType !== undefined)
        data.eventType = input.data.eventType;
      if (input.data.minGuests !== undefined)
        data.minGuests = input.data.minGuests;
      if (input.data.maxGuests !== undefined)
        data.maxGuests = input.data.maxGuests;
      if (input.data.basePricePerPerson !== undefined)
        data.basePricePerPerson = input.data.basePricePerPerson;
      if (input.data.currency !== undefined)
        data.currency = input.data.currency;
      if (input.data.city !== undefined)
        data.city = input.data.city ? sanitizeString(input.data.city) : null;
      if (input.data.serviceArea !== undefined)
        data.serviceArea = input.data.serviceArea
          ? sanitizeString(input.data.serviceArea)
          : null;
      if (input.data.leadTimeDays !== undefined)
        data.leadTimeDays = input.data.leadTimeDays;
      if (input.data.contactPhone !== undefined)
        data.contactPhone = input.data.contactPhone || null;
      if (input.data.contactEmail !== undefined)
        data.contactEmail = input.data.contactEmail || null;
      if (input.data.whatsappNumber !== undefined)
        data.whatsappNumber = input.data.whatsappNumber || null;
      if (input.data.logoUrl !== undefined)
        data.logoUrl = input.data.logoUrl || null;
      if (input.data.coverImageUrl !== undefined)
        data.coverImageUrl = input.data.coverImageUrl || null;
      if (input.data.serviceOptions !== undefined)
        data.serviceOptions = input.data.serviceOptions;
      if (input.data.metaTitle !== undefined)
        data.metaTitle = input.data.metaTitle
          ? sanitizeString(input.data.metaTitle)
          : null;
      if (input.data.metaDescription !== undefined)
        data.metaDescription = input.data.metaDescription
          ? sanitizeString(input.data.metaDescription)
          : null;
      if (input.data.menuId !== undefined)
        data.menuId = input.data.menuId ?? null;

      const updated = await ctx.db.cateringMenus.update({
        where: { id: input.id },
        data,
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering menu updated: ${updated.id}`,
        "catering",
      );

      return updated;
    }),

  /**
   * 5. deleteMenu - Delete a catering menu with all related data.
   * Owner only. Cascade deletes categories, items, packages, inquiries, theme.
   */
  deleteMenu: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(ctx.db, input.id, ctx.user.id);

      // Delete in order to respect foreign key constraints
      await ctx.db.$transaction(async (tx) => {
        // 1. Delete package items (depends on packages and items)
        await tx.cateringPackageItems.deleteMany({
          where: {
            package: { cateringMenuId: input.id },
          },
        });

        // 2. Delete packages
        await tx.cateringPackages.deleteMany({
          where: { cateringMenuId: input.id },
        });

        // 3. Delete items
        await tx.cateringItems.deleteMany({
          where: { cateringMenuId: input.id },
        });

        // 4. Delete categories
        await tx.cateringCategories.deleteMany({
          where: { cateringMenuId: input.id },
        });

        // 5. Delete inquiries
        await tx.cateringInquiries.deleteMany({
          where: { cateringMenuId: input.id },
        });

        // 6. Delete theme
        await tx.cateringThemes.deleteMany({
          where: { cateringMenuId: input.id },
        });

        // 7. Delete the menu itself
        await tx.cateringMenus.delete({
          where: { id: input.id },
        });
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering menu deleted: ${input.id}`,
        "catering",
      );

      return { success: true };
    }),

  /**
   * 6. togglePublish - Publish or unpublish a catering menu.
   * Owner only. Validates minimum requirements before publishing.
   */
  togglePublish: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: {
          id: true,
          isPublished: true,
          name: true,
          contactPhone: true,
          _count: {
            select: {
              items: true,
              packages: true,
            },
          },
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Catering menu not found",
        });
      }

      // Validate before publishing
      if (!menu.isPublished) {
        if (menu._count.items === 0 && menu._count.packages === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot publish a catering menu without items or packages. Add at least one item or package first.",
          });
        }

        if (!menu.contactPhone) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "A contact phone number is required before publishing.",
          });
        }
      }

      const updated = await ctx.db.cateringMenus.update({
        where: { id: input.id },
        data: {
          isPublished: !menu.isPublished,
          updatedAt: new Date(),
        },
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering menu ${updated.isPublished ? "published" : "unpublished"}: ${updated.id}`,
        "catering",
      );

      return updated;
    }),

  // ════════════════════════════════════════════════════════════
  // PACKAGES CRUD (private)
  // ════════════════════════════════════════════════════════════

  /**
   * 7. createPackage - Create a package within a catering menu.
   * Auto-assigns sortOrder based on existing package count.
   */
  createPackage: privateProcedure
    .input(packageInput)
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(
        ctx.db,
        input.cateringMenuId,
        ctx.user.id,
      );

      // Determine next sort order
      const maxSortOrder = await ctx.db.cateringPackages.aggregate({
        where: { cateringMenuId: input.cateringMenuId },
        _max: { sortOrder: true },
      });

      const pkg = await ctx.db.cateringPackages.create({
        data: {
          cateringMenuId: input.cateringMenuId,
          name: sanitizeString(input.name),
          description: input.description
            ? sanitizeString(input.description)
            : null,
          pricePerPerson: input.pricePerPerson,
          minGuests: input.minGuests ?? undefined,
          maxGuests: input.maxGuests ?? undefined,
          isFeatured: input.isFeatured,
          sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
          imageUrl: input.imageUrl || null,
          includesText: input.includesText
            ? sanitizeString(input.includesText)
            : null,
        },
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering package created: ${pkg.id} in menu ${input.cateringMenuId}`,
        "catering",
      );

      return pkg;
    }),

  /**
   * 8. updatePackage - Update package details.
   * Owner only via menu ownership check.
   */
  updatePackage: privateProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: packageInput.omit({ cateringMenuId: true }).partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: input.id },
        select: { id: true, cateringMenuId: true },
      });

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        pkg.cateringMenuId,
        ctx.user.id,
      );

      const data: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.data.name !== undefined)
        data.name = sanitizeString(input.data.name);
      if (input.data.description !== undefined)
        data.description = input.data.description
          ? sanitizeString(input.data.description)
          : null;
      if (input.data.pricePerPerson !== undefined)
        data.pricePerPerson = input.data.pricePerPerson;
      if (input.data.minGuests !== undefined)
        data.minGuests = input.data.minGuests ?? null;
      if (input.data.maxGuests !== undefined)
        data.maxGuests = input.data.maxGuests ?? null;
      if (input.data.isFeatured !== undefined)
        data.isFeatured = input.data.isFeatured;
      if (input.data.imageUrl !== undefined)
        data.imageUrl = input.data.imageUrl || null;
      if (input.data.includesText !== undefined)
        data.includesText = input.data.includesText
          ? sanitizeString(input.data.includesText)
          : null;

      const updated = await ctx.db.cateringPackages.update({
        where: { id: input.id },
        data,
      });

      cache.invalidate(CACHE_PREFIX);

      return updated;
    }),

  /**
   * 9. deletePackage - Delete a package and its linked package items.
   */
  deletePackage: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: input.id },
        select: { id: true, cateringMenuId: true },
      });

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        pkg.cateringMenuId,
        ctx.user.id,
      );

      await ctx.db.$transaction(async (tx) => {
        await tx.cateringPackageItems.deleteMany({
          where: { packageId: input.id },
        });
        await tx.cateringPackages.delete({
          where: { id: input.id },
        });
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering package deleted: ${input.id}`,
        "catering",
      );

      return { success: true };
    }),

  /**
   * 10. reorderPackages - Bulk update sortOrder for packages.
   */
  reorderPackages: privateProcedure
    .input(
      z.object({
        cateringMenuId: z.string().uuid(),
        orderedIds: z.array(z.string().uuid()).min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(
        ctx.db,
        input.cateringMenuId,
        ctx.user.id,
      );

      await ctx.db.$transaction(
        input.orderedIds.map((id, index) =>
          ctx.db.cateringPackages.update({
            where: { id },
            data: { sortOrder: index + 1 },
          }),
        ),
      );

      cache.invalidate(CACHE_PREFIX);

      return { success: true };
    }),

  // ════════════════════════════════════════════════════════════
  // CATEGORIES CRUD (private)
  // ════════════════════════════════════════════════════════════

  /**
   * 11. createCategory - Create a category within a catering menu.
   * Auto-assigns sortOrder.
   */
  createCategory: privateProcedure
    .input(categoryInput)
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(
        ctx.db,
        input.cateringMenuId,
        ctx.user.id,
      );

      const maxSortOrder = await ctx.db.cateringCategories.aggregate({
        where: { cateringMenuId: input.cateringMenuId },
        _max: { sortOrder: true },
      });

      const category = await ctx.db.cateringCategories.create({
        data: {
          cateringMenuId: input.cateringMenuId,
          name: sanitizeString(input.name),
          description: input.description
            ? sanitizeString(input.description)
            : null,
          sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
          isOptional: input.isOptional,
        },
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering category created: ${category.id} in menu ${input.cateringMenuId}`,
        "catering",
      );

      return category;
    }),

  /**
   * 12. updateCategory - Update a category.
   */
  updateCategory: privateProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().min(1).max(200).optional(),
          description: z.string().max(1000).optional().nullable(),
          isOptional: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.cateringCategories.findUnique({
        where: { id: input.id },
        select: { id: true, cateringMenuId: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        category.cateringMenuId,
        ctx.user.id,
      );

      const data: Record<string, unknown> = {};

      if (input.data.name !== undefined)
        data.name = sanitizeString(input.data.name);
      if (input.data.description !== undefined)
        data.description = input.data.description
          ? sanitizeString(input.data.description)
          : null;
      if (input.data.isOptional !== undefined)
        data.isOptional = input.data.isOptional;

      const updated = await ctx.db.cateringCategories.update({
        where: { id: input.id },
        data,
      });

      cache.invalidate(CACHE_PREFIX);

      return updated;
    }),

  /**
   * 13. deleteCategory - Delete a category and cascade-delete its items.
   */
  deleteCategory: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.cateringCategories.findUnique({
        where: { id: input.id },
        select: { id: true, cateringMenuId: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        category.cateringMenuId,
        ctx.user.id,
      );

      await ctx.db.$transaction(async (tx) => {
        // Delete package items referencing items in this category
        await tx.cateringPackageItems.deleteMany({
          where: { categoryId: input.id },
        });

        // Delete items in this category
        await tx.cateringItems.deleteMany({
          where: { cateringCategoryId: input.id },
        });

        // Delete the category
        await tx.cateringCategories.delete({
          where: { id: input.id },
        });
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering category deleted: ${input.id}`,
        "catering",
      );

      return { success: true };
    }),

  /**
   * 14. reorderCategories - Bulk update sortOrder for categories.
   */
  reorderCategories: privateProcedure
    .input(
      z.object({
        cateringMenuId: z.string().uuid(),
        orderedIds: z.array(z.string().uuid()).min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(
        ctx.db,
        input.cateringMenuId,
        ctx.user.id,
      );

      await ctx.db.$transaction(
        input.orderedIds.map((id, index) =>
          ctx.db.cateringCategories.update({
            where: { id },
            data: { sortOrder: index + 1 },
          }),
        ),
      );

      cache.invalidate(CACHE_PREFIX);

      return { success: true };
    }),

  // ════════════════════════════════════════════════════════════
  // ITEMS CRUD (private)
  // ════════════════════════════════════════════════════════════

  /**
   * 15. createItem - Create an item within a category.
   * Auto-assigns sortOrder.
   */
  createItem: privateProcedure
    .input(itemInput)
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(
        ctx.db,
        input.cateringMenuId,
        ctx.user.id,
      );

      // Verify category belongs to the menu
      const category = await ctx.db.cateringCategories.findFirst({
        where: {
          id: input.cateringCategoryId,
          cateringMenuId: input.cateringMenuId,
        },
        select: { id: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Category does not belong to this catering menu",
        });
      }

      const maxSortOrder = await ctx.db.cateringItems.aggregate({
        where: { cateringCategoryId: input.cateringCategoryId },
        _max: { sortOrder: true },
      });

      const item = await ctx.db.cateringItems.create({
        data: {
          cateringCategoryId: input.cateringCategoryId,
          cateringMenuId: input.cateringMenuId,
          name: sanitizeString(input.name),
          description: input.description
            ? sanitizeString(input.description)
            : null,
          pricePerPerson: input.pricePerPerson ?? null,
          pricePerUnit: input.pricePerUnit ?? null,
          unitLabel: input.unitLabel ?? null,
          minQuantity: input.minQuantity,
          servesCount: input.servesCount ?? null,
          isVegetarian: input.isVegetarian,
          isVegan: input.isVegan,
          isHalal: input.isHalal,
          isGlutenFree: input.isGlutenFree,
          allergens: input.allergens,
          imageUrl: input.imageUrl || null,
          sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
          isAvailable: input.isAvailable,
        },
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering item created: ${item.id} in category ${input.cateringCategoryId}`,
        "catering",
      );

      return item;
    }),

  /**
   * 16. updateItem - Update item details including dietary flags.
   */
  updateItem: privateProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: itemInput
          .omit({ cateringCategoryId: true, cateringMenuId: true })
          .partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cateringItems.findUnique({
        where: { id: input.id },
        select: { id: true, cateringMenuId: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        item.cateringMenuId,
        ctx.user.id,
      );

      const data: Record<string, unknown> = {};

      if (input.data.name !== undefined)
        data.name = sanitizeString(input.data.name);
      if (input.data.description !== undefined)
        data.description = input.data.description
          ? sanitizeString(input.data.description)
          : null;
      if (input.data.pricePerPerson !== undefined)
        data.pricePerPerson = input.data.pricePerPerson ?? null;
      if (input.data.pricePerUnit !== undefined)
        data.pricePerUnit = input.data.pricePerUnit ?? null;
      if (input.data.unitLabel !== undefined)
        data.unitLabel = input.data.unitLabel ?? null;
      if (input.data.minQuantity !== undefined)
        data.minQuantity = input.data.minQuantity;
      if (input.data.servesCount !== undefined)
        data.servesCount = input.data.servesCount ?? null;
      if (input.data.isVegetarian !== undefined)
        data.isVegetarian = input.data.isVegetarian;
      if (input.data.isVegan !== undefined)
        data.isVegan = input.data.isVegan;
      if (input.data.isHalal !== undefined)
        data.isHalal = input.data.isHalal;
      if (input.data.isGlutenFree !== undefined)
        data.isGlutenFree = input.data.isGlutenFree;
      if (input.data.allergens !== undefined)
        data.allergens = input.data.allergens;
      if (input.data.imageUrl !== undefined)
        data.imageUrl = input.data.imageUrl || null;
      if (input.data.isAvailable !== undefined)
        data.isAvailable = input.data.isAvailable;

      const updated = await ctx.db.cateringItems.update({
        where: { id: input.id },
        data,
      });

      cache.invalidate(CACHE_PREFIX);

      return updated;
    }),

  /**
   * 17. deleteItem - Delete an item and its package item links.
   */
  deleteItem: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cateringItems.findUnique({
        where: { id: input.id },
        select: { id: true, cateringMenuId: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        item.cateringMenuId,
        ctx.user.id,
      );

      await ctx.db.$transaction(async (tx) => {
        // Remove from all packages first
        await tx.cateringPackageItems.deleteMany({
          where: { itemId: input.id },
        });

        await tx.cateringItems.delete({
          where: { id: input.id },
        });
      });

      cache.invalidate(CACHE_PREFIX);

      logger.info(
        `Catering item deleted: ${input.id}`,
        "catering",
      );

      return { success: true };
    }),

  /**
   * 18. toggleItemAvailability - Toggle an item's availability.
   */
  toggleItemAvailability: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cateringItems.findUnique({
        where: { id: input.id },
        select: { id: true, cateringMenuId: true, isAvailable: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        item.cateringMenuId,
        ctx.user.id,
      );

      const updated = await ctx.db.cateringItems.update({
        where: { id: input.id },
        data: { isAvailable: !item.isAvailable },
      });

      cache.invalidate(CACHE_PREFIX);

      return updated;
    }),

  // ════════════════════════════════════════════════════════════
  // PACKAGE ITEMS (private)
  // ════════════════════════════════════════════════════════════

  /**
   * 19. addItemToPackage - Link an item to a package.
   */
  addItemToPackage: privateProcedure
    .input(
      z.object({
        packageId: z.string().uuid(),
        itemId: z.string().uuid(),
        categoryId: z.string().uuid(),
        isIncluded: z.boolean().default(true),
        maxSelections: z.number().int().positive().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify package exists and get its menu
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: input.packageId },
        select: { id: true, cateringMenuId: true },
      });

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        pkg.cateringMenuId,
        ctx.user.id,
      );

      // Verify item belongs to the same menu
      const item = await ctx.db.cateringItems.findFirst({
        where: {
          id: input.itemId,
          cateringMenuId: pkg.cateringMenuId,
        },
        select: { id: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Item does not belong to the same catering menu",
        });
      }

      // Check for duplicate
      const existing = await ctx.db.cateringPackageItems.findFirst({
        where: {
          packageId: input.packageId,
          itemId: input.itemId,
        },
        select: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Item is already linked to this package",
        });
      }

      const packageItem = await ctx.db.cateringPackageItems.create({
        data: {
          packageId: input.packageId,
          itemId: input.itemId,
          categoryId: input.categoryId,
          isIncluded: input.isIncluded,
          maxSelections: input.maxSelections ?? null,
        },
      });

      cache.invalidate(CACHE_PREFIX);

      return packageItem;
    }),

  /**
   * 20. removeItemFromPackage - Unlink an item from a package.
   */
  removeItemFromPackage: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const packageItem = await ctx.db.cateringPackageItems.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          package: {
            select: { cateringMenuId: true },
          },
        },
      });

      if (!packageItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package item link not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        packageItem.package.cateringMenuId,
        ctx.user.id,
      );

      await ctx.db.cateringPackageItems.delete({
        where: { id: input.id },
      });

      cache.invalidate(CACHE_PREFIX);

      return { success: true };
    }),

  /**
   * 21. updatePackageItemSelections - Update maxSelections for a category in a package.
   * Updates all package items matching the package + category combination.
   */
  updatePackageItemSelections: privateProcedure
    .input(
      z.object({
        packageId: z.string().uuid(),
        categoryId: z.string().uuid(),
        maxSelections: z.number().int().positive().max(100).nullable(),
        isIncluded: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: input.packageId },
        select: { id: true, cateringMenuId: true },
      });

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        pkg.cateringMenuId,
        ctx.user.id,
      );

      const data: Record<string, unknown> = {
        maxSelections: input.maxSelections,
      };

      if (input.isIncluded !== undefined) {
        data.isIncluded = input.isIncluded;
      }

      const result = await ctx.db.cateringPackageItems.updateMany({
        where: {
          packageId: input.packageId,
          categoryId: input.categoryId,
        },
        data,
      });

      cache.invalidate(CACHE_PREFIX);

      return { updated: result.count };
    }),

  // ════════════════════════════════════════════════════════════
  // INQUIRIES (mixed: public + private)
  // ════════════════════════════════════════════════════════════

  /**
   * 22. submitInquiry - Customer submits a catering inquiry/booking request.
   * Public endpoint with rate limiting.
   */
  submitInquiry: publicProcedure
    .input(inquiryInput)
    .mutation(async ({ ctx, input }) => {
      // Rate limit by IP
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `catering-inquiry:${ipHash}:${input.cateringMenuId}`,
        limit: 5,
        windowMs: 60 * 60 * 1000, // 5 inquiries per hour per IP per menu
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Too many inquiry submissions. Please try again later.",
        });
      }

      // Verify the catering menu is published
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.cateringMenuId, isPublished: true },
        select: {
          id: true,
          minGuests: true,
          maxGuests: true,
          leadTimeDays: true,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Catering menu not found or not published",
        });
      }

      // Validate guest count is within range
      if (input.guestCount < menu.minGuests) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimum guest count is ${menu.minGuests}`,
        });
      }

      if (menu.maxGuests != null && input.guestCount > menu.maxGuests) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum guest count is ${menu.maxGuests}`,
        });
      }

      // Validate lead time
      const eventDate = new Date(input.eventDate);
      const now = new Date();
      const daysDiff = Math.ceil(
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff < menu.leadTimeDays) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Events must be booked at least ${menu.leadTimeDays} days in advance`,
        });
      }

      // Validate package belongs to menu if provided
      if (input.packageId) {
        const pkg = await ctx.db.cateringPackages.findFirst({
          where: {
            id: input.packageId,
            cateringMenuId: input.cateringMenuId,
          },
          select: { id: true },
        });

        if (!pkg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected package does not belong to this catering menu",
          });
        }
      }

      const inquiry = await ctx.db.cateringInquiries.create({
        data: {
          cateringMenuId: input.cateringMenuId,
          packageId: input.packageId ?? null,
          customerName: sanitizeString(input.customerName),
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || null,
          eventType: input.eventType,
          eventDate,
          eventTime: input.eventTime ?? null,
          guestCount: input.guestCount,
          venueAddress: input.venueAddress
            ? sanitizeString(input.venueAddress)
            : null,
          venueCity: input.venueCity
            ? sanitizeString(input.venueCity)
            : null,
          selectedItems: input.selectedItems ?? [],
          specialRequests: input.specialRequests
            ? sanitizeString(input.specialRequests)
            : null,
          dietaryNotes: input.dietaryNotes
            ? sanitizeString(input.dietaryNotes)
            : null,
          estimatedTotal: input.estimatedTotal ?? null,
          status: "pending",
        },
      });

      logger.info(
        `Catering inquiry submitted: ${inquiry.id} for menu ${input.cateringMenuId} (${input.eventType}, ${input.guestCount} guests)`,
        "catering",
      );

      return {
        id: inquiry.id,
        status: inquiry.status,
        message:
          "Your catering inquiry has been submitted. We will contact you shortly.",
      };
    }),

  /**
   * 23. getInquiries - List inquiries for owner's catering menus.
   * Supports cursor-based pagination and status filtering.
   */
  getInquiries: privateProcedure
    .input(
      z.object({
        cateringMenuId: z.string().uuid().optional(),
        status: z.enum(INQUIRY_STATUSES).optional(),
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.cateringMenuId) {
        await verifyCateringMenuOwnership(
          ctx.db,
          input.cateringMenuId,
          ctx.user.id,
        );
      }

      const menuFilter = input.cateringMenuId
        ? { cateringMenuId: input.cateringMenuId }
        : { cateringMenu: { userId: ctx.user.id } };

      const inquiries = await ctx.db.cateringInquiries.findMany({
        where: {
          ...menuFilter,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          package: {
            select: { id: true, name: true, pricePerPerson: true },
          },
          cateringMenu: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      });

      let nextCursor: string | undefined;

      if (inquiries.length > input.limit) {
        const nextItem = inquiries.pop();
        nextCursor = nextItem?.id;
      }

      return inquiries;
    }),

  /**
   * 24. updateInquiryStatus - Update inquiry status, quoted total, and admin notes.
   * Owner only.
   */
  updateInquiryStatus: privateProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(INQUIRY_STATUSES),
        quotedTotal: z.number().int().nonnegative().optional(),
        depositAmount: z.number().int().nonnegative().optional(),
        adminNotes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.cateringInquiries.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          cateringMenuId: true,
          status: true,
        },
      });

      if (!inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });
      }

      await verifyCateringMenuOwnership(
        ctx.db,
        inquiry.cateringMenuId,
        ctx.user.id,
      );

      const updated = await ctx.db.cateringInquiries.update({
        where: { id: input.id },
        data: {
          status: input.status,
          quotedTotal: input.quotedTotal ?? undefined,
          depositAmount: input.depositAmount ?? undefined,
          adminNotes: input.adminNotes
            ? sanitizeString(input.adminNotes)
            : undefined,
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Catering inquiry ${input.id} status updated: ${inquiry.status} -> ${input.status}`,
        "catering",
      );

      return updated;
    }),

  /**
   * 25. getInquiryStats - Aggregated stats for inquiries: counts by status, upcoming events.
   * Returns stats across all of the user's catering menus.
   */
  getInquiryStats: privateProcedure
    .input(
      z.object({
        cateringMenuId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // If a specific menu is provided, verify ownership
      if (input.cateringMenuId) {
        await verifyCateringMenuOwnership(
          ctx.db,
          input.cateringMenuId,
          ctx.user.id,
        );
      }

      // Get all catering menu IDs for this user
      const menuFilter = input.cateringMenuId
        ? { cateringMenuId: input.cateringMenuId }
        : {
            cateringMenu: { userId: ctx.user.id },
          };

      // Count by status
      const statusCounts = await ctx.db.cateringInquiries.groupBy({
        by: ["status"],
        where: menuFilter,
        _count: true,
      });

      const statusMap: Record<string, number> = {};
      for (const item of statusCounts) {
        statusMap[item.status] = item._count;
      }

      // Upcoming events (next 30 days, confirmed status)
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      const upcomingEvents = await ctx.db.cateringInquiries.findMany({
        where: {
          ...menuFilter,
          status: "confirmed",
          eventDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        select: {
          id: true,
          customerName: true,
          eventType: true,
          eventDate: true,
          guestCount: true,
          quotedTotal: true,
          cateringMenu: {
            select: { id: true, name: true },
          },
        },
        orderBy: { eventDate: "asc" },
        take: 10,
      });

      // Total estimated revenue from confirmed inquiries
      const revenueResult = await ctx.db.cateringInquiries.aggregate({
        where: {
          ...menuFilter,
          status: "confirmed",
          quotedTotal: { not: null },
        },
        _sum: { quotedTotal: true, guestCount: true },
        _count: true,
      });

      const totalInquiries = Object.values(statusMap).reduce(
        (sum, count) => sum + count,
        0,
      );

      return {
        byStatus: statusMap,
        totalInquiries,
        upcomingEvents,
        confirmedBookings: statusMap["confirmed"] ?? 0,
        totalRevenue: revenueResult._sum.quotedTotal ?? 0,
        avgGuestCount:
          revenueResult._count > 0
            ? Math.round(
                (revenueResult._sum.guestCount ?? 0) / revenueResult._count,
              )
            : 0,
        confirmedRevenue: revenueResult._sum.quotedTotal ?? 0,
        confirmedCount: revenueResult._count,
      };
    }),

  // ════════════════════════════════════════════════════════════
  // THEME (private)
  // ════════════════════════════════════════════════════════════

  /**
   * 26. saveTheme - Upsert catering theme for a menu.
   */
  saveTheme: privateProcedure
    .input(themeInput)
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(
        ctx.db,
        input.cateringMenuId,
        ctx.user.id,
      );

      const { cateringMenuId, ...themeData } = input;

      const theme = await ctx.db.cateringThemes.upsert({
        where: { cateringMenuId },
        create: { cateringMenuId, ...themeData },
        update: { ...themeData, updatedAt: new Date() },
      });

      cache.invalidate(CACHE_PREFIX);

      return theme;
    }),

  /**
   * 27. resetTheme - Delete catering theme (reverts to defaults).
   */
  resetTheme: privateProcedure
    .input(z.object({ cateringMenuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyCateringMenuOwnership(
        ctx.db,
        input.cateringMenuId,
        ctx.user.id,
      );

      await ctx.db.cateringThemes.deleteMany({
        where: { cateringMenuId: input.cateringMenuId },
      });

      cache.invalidate(CACHE_PREFIX);

      return { success: true };
    }),

  // ════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ════════════════════════════════════════════════════════════

  /**
   * 28. getPublicCateringMenu - Get a published catering menu by slug.
   * Returns full menu with packages, categories, items, and theme.
   * Cached with 30s TTL for performance.
   */
  getPublicCateringMenu: publicProcedure
    .input(z.object({ slug: z.string().max(300) }))
    .query(async ({ ctx, input }) => {
      const cacheKey = `${CACHE_PREFIX}menu:${input.slug}`;

      return cache.getOrSet(
        cacheKey,
        async () => {
          const menu = await ctx.db.cateringMenus.findFirst({
            where: { slug: input.slug, isPublished: true },
            include: {
              categories: {
                include: {
                  cateringItems: {
                    where: { isAvailable: true },
                    orderBy: { sortOrder: "asc" },
                  },
                },
                orderBy: { sortOrder: "asc" },
              },
              packages: {
                include: {
                  packageItems: {
                    where: { isIncluded: true },
                    include: {
                      item: {
                        select: {
                          id: true,
                          name: true,
                          description: true,
                          isVegetarian: true,
                          isVegan: true,
                          isHalal: true,
                          isGlutenFree: true,
                          allergens: true,
                          imageUrl: true,
                        },
                      },
                      category: {
                        select: { id: true, name: true },
                      },
                    },
                  },
                },
                orderBy: { sortOrder: "asc" },
              },
              theme: true,
            },
          });

          if (!menu) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Catering menu not found",
            });
          }

          // Strip userId from public response for security
          const { userId: _userId, ...publicMenu } = menu;
          return publicMenu;
        },
        TTL.SHORT,
      );
    }),

  /**
   * 29. getCateringDirectory - List published catering menus for the explore page.
   * Supports filtering by city and event type. Paginated.
   */
  getCateringDirectory: publicProcedure
    .input(
      z.object({
        city: z.string().max(100).optional(),
        eventType: z.enum(EVENT_TYPES).optional(),
        sortBy: z
          .enum(["newest", "price_asc", "price_desc", "featured"])
          .default("featured"),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        isPublished: true,
        ...(input.city
          ? { city: { contains: input.city, mode: "insensitive" as const } }
          : {}),
        ...(input.eventType ? { eventType: input.eventType } : {}),
      };

      type CateringOrderBy = Record<string, "asc" | "desc">;
      let orderBy: CateringOrderBy[];

      switch (input.sortBy) {
        case "newest":
          orderBy = [{ createdAt: "desc" }];
          break;
        case "price_asc":
          orderBy = [{ basePricePerPerson: "asc" }];
          break;
        case "price_desc":
          orderBy = [{ basePricePerPerson: "desc" }];
          break;
        case "featured":
        default:
          orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
          break;
      }

      const skip = (input.page - 1) * input.limit;

      const [menus, totalCount] = await Promise.all([
        ctx.db.cateringMenus.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            eventType: true,
            minGuests: true,
            maxGuests: true,
            basePricePerPerson: true,
            currency: true,
            city: true,
            serviceArea: true,
            isFeatured: true,
            logoUrl: true,
            coverImageUrl: true,
            serviceOptions: true,
            createdAt: true,
            _count: {
              select: {
                packages: true,
                items: true,
              },
            },
          },
          orderBy,
          take: input.limit,
          skip,
        }),
        ctx.db.cateringMenus.count({ where }),
      ]);

      return {
        menus,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / input.limit),
          hasMore: skip + menus.length < totalCount,
        },
      };
    }),
});
