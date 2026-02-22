/**
 * Diyafa — Catering Menus Router
 *
 * Catering menus are fundamentally different from restaurant menus:
 * - Pricing: per-head, per-dish, package, or custom
 * - Guest ranges: min 20, max 1000+ guests
 * - Tiers: standard, premium, luxury
 * - Menu customization per event
 * - Dietary management at scale
 * - Seasonal menus (Ramadan, summer, etc.)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

// ──────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────

const menuTypeEnum = z.enum(["per_head", "per_dish", "package", "custom"]);

const menuItemCategoryEnum = z.enum([
  "appetizer",
  "salad",
  "soup",
  "main",
  "side",
  "dessert",
  "drink",
  "bread",
  "extra",
  "setup",
]);

const dietaryTagEnum = z.enum([
  "halal",
  "vegetarian",
  "vegan",
  "gluten_free",
  "nut_free",
  "dairy_free",
  "seafood_free",
  "spicy",
  "mild",
]);

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────

export const cateringMenusRouter = createTRPCRouter({
  // ─── Public Endpoints ───────────────────────

  /** Get public menus for a caterer profile */
  getPublicMenus: publicProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.orgSlug, isActive: true },
        select: { id: true },
      });

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.cateringMenus.findMany({
        where: { orgId: org.id, isActive: true },
        include: {
          items: {
            where: { isActive: true },
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          },
        },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      });
    }),

  // ─── Org-Scoped Endpoints ───────────────────

  /** List all menus for org */
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        type: menuTypeEnum.optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.type) where.type = input.type;
      if (input.isActive !== undefined) where.isActive = input.isActive;

      return ctx.db.cateringMenus.findMany({
        where,
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { sortOrder: "asc" },
      });
    }),

  /** Get menu by ID with all items */
  getById: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        menuId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
        include: {
          items: {
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          },
        },
      });

      if (!menu) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return menu;
    }),

  /** Create a new catering menu */
  create: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        name: z.string().min(2).max(200),
        nameAr: z.string().optional(),
        nameFr: z.string().optional(),
        description: z.string().max(2000).optional(),
        descriptionAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        type: menuTypeEnum,
        minGuests: z.number().int().positive().optional(),
        maxGuests: z.number().int().positive().optional(),
        basePricePerHead: z.number().nonnegative().optional(),
        tier: z.enum(["standard", "premium", "luxury"]).optional(),
        cuisineType: z.string().optional(),
        dietaryTags: z.array(dietaryTagEnum).optional(),
        season: z.enum(["all_year", "summer", "winter", "ramadan", "wedding_season"]).optional(),
        photos: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, ...data } = input;

      // Get next sort order
      const lastMenu = await ctx.db.cateringMenus.findFirst({
        where: { orgId: ctx.orgId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return ctx.db.cateringMenus.create({
        data: {
          ...data,
          orgId: ctx.orgId,
          sortOrder: (lastMenu?.sortOrder ?? 0) + 1,
          isActive: true,
          isFeatured: false,
        },
      });
    }),

  /** Update menu */
  update: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        menuId: z.string().uuid(),
        name: z.string().min(2).max(200).optional(),
        nameAr: z.string().optional(),
        nameFr: z.string().optional(),
        description: z.string().max(2000).optional(),
        descriptionAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        type: menuTypeEnum.optional(),
        minGuests: z.number().int().positive().optional(),
        maxGuests: z.number().int().positive().optional(),
        basePricePerHead: z.number().nonnegative().optional(),
        tier: z.enum(["standard", "premium", "luxury"]).optional(),
        cuisineType: z.string().optional(),
        dietaryTags: z.array(dietaryTagEnum).optional(),
        season: z.enum(["all_year", "summer", "winter", "ramadan", "wedding_season"]).optional(),
        photos: z.array(z.string().url()).optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, menuId, ...data } = input;

      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: menuId, orgId: ctx.orgId },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.cateringMenus.update({
        where: { id: menuId },
        data,
      });
    }),

  /** Delete menu */
  delete: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        menuId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      // Soft delete by deactivating
      return ctx.db.cateringMenus.update({
        where: { id: input.menuId },
        data: { isActive: false },
      });
    }),

  /** Duplicate a menu */
  duplicate: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        menuId: z.string().uuid(),
        newName: z.string().min(2).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sourceMenu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
        include: { items: true },
      });

      if (!sourceMenu) throw new TRPCError({ code: "NOT_FOUND" });

      const newMenu = await ctx.db.cateringMenus.create({
        data: {
          orgId: ctx.orgId,
          name: input.newName,
          description: sourceMenu.description,
          type: sourceMenu.type,
          minGuests: sourceMenu.minGuests,
          maxGuests: sourceMenu.maxGuests,
          basePricePerHead: sourceMenu.basePricePerHead,
          tier: sourceMenu.tier,
          cuisineType: sourceMenu.cuisineType,
          dietaryTags: sourceMenu.dietaryTags,
          season: sourceMenu.season,
          photos: sourceMenu.photos,
          sortOrder: sourceMenu.sortOrder + 1,
          isActive: true,
          isFeatured: false,
          items: {
            create: sourceMenu.items.map((item) => ({
              name: item.name,
              description: item.description,
              category: item.category,
              price: item.price,
              isIncluded: item.isIncluded,
              isOptional: item.isOptional,
              dietaryInfo: item.dietaryInfo,
              allergens: item.allergens,
              photoUrl: item.photoUrl,
              sortOrder: item.sortOrder,
              isActive: true,
            })),
          },
        },
      });

      return newMenu;
    }),

  // ─── Menu Items ─────────────────────────────

  /** Add item to menu */
  addItem: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        menuId: z.string().uuid(),
        name: z.string().min(1).max(200),
        nameAr: z.string().optional(),
        nameFr: z.string().optional(),
        description: z.string().max(500).optional(),
        descriptionAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        category: menuItemCategoryEnum,
        price: z.number().nonnegative().default(0),
        isIncluded: z.boolean().default(true),
        isOptional: z.boolean().default(false),
        dietaryInfo: z.array(dietaryTagEnum).optional(),
        allergens: z.array(z.string()).optional(),
        photoUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      const { orgId: _orgId, ...data } = input;

      const lastItem = await ctx.db.cateringMenuItems.findFirst({
        where: { menuId: input.menuId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return ctx.db.cateringMenuItems.create({
        data: {
          ...data,
          sortOrder: (lastItem?.sortOrder ?? 0) + 1,
          isActive: true,
        },
      });
    }),

  /** Update menu item */
  updateItem: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        itemId: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        nameAr: z.string().optional(),
        nameFr: z.string().optional(),
        description: z.string().max(500).optional(),
        descriptionAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        category: menuItemCategoryEnum.optional(),
        price: z.number().nonnegative().optional(),
        isIncluded: z.boolean().optional(),
        isOptional: z.boolean().optional(),
        dietaryInfo: z.array(dietaryTagEnum).optional(),
        allergens: z.array(z.string()).optional(),
        photoUrl: z.string().url().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orgId: _orgId, itemId, ...data } = input;

      return ctx.db.cateringMenuItems.update({
        where: { id: itemId },
        data,
      });
    }),

  /** Remove item from menu */
  removeItem: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        itemId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cateringMenuItems.update({
        where: { id: input.itemId },
        data: { isActive: false },
      });
    }),

  /** Reorder items */
  reorderItems: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        menuId: z.string().uuid(),
        itemOrder: z.array(z.object({
          id: z.string().uuid(),
          sortOrder: z.number().int(),
        })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.itemOrder.map((item) =>
          ctx.db.cateringMenuItems.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
      return { success: true };
    }),
});
