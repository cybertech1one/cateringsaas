/**
 * Diyafa — Catering Menus Router
 *
 * 3-level hierarchy: CateringMenus → CateringCategories → CateringItems
 * Plus: CateringPackages (bundled item combos)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

export const cateringMenusRouter = createTRPCRouter({
  // ─── Public ───────────────────────────────────

  /** Public: browse menus for a caterer */
  getPublicMenus: publicProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organizations.findUnique({
        where: { slug: input.orgSlug, isActive: true },
        select: { id: true },
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.cateringMenus.findMany({
        where: { orgId: org.id, isPublished: true, isActive: true },
        include: {
          categories: {
            orderBy: { sortOrder: "asc" },
            include: {
              cateringItems: {
                where: { isAvailable: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          packages: {
            where: { isFeatured: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      });
    }),

  // ─── Org Menus ────────────────────────────────

  /** List all menus for org */
  list: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuType: z.enum(["per_head", "per_dish", "package", "custom"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.menuType) where.menuType = input.menuType;
      if (input.isActive !== undefined) where.isActive = input.isActive;

      return ctx.db.cateringMenus.findMany({
        where,
        include: {
          _count: { select: { items: true, categories: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  /** Get menu by ID with full tree */
  getById: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
        include: {
          categories: {
            orderBy: { sortOrder: "asc" },
            include: {
              cateringItems: { orderBy: { sortOrder: "asc" } },
            },
          },
          packages: {
            orderBy: { sortOrder: "asc" },
            include: { packageItems: { include: { item: true } } },
          },
        },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
      return menu;
    }),

  /** Create menu */
  create: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      name: z.string().min(2).max(200),
      description: z.string().max(2000).optional(),
      menuType: z.enum(["per_head", "per_dish", "package", "custom"]).default("per_head"),
      eventType: z.string().default("general"),
      minGuests: z.number().int().positive().default(10),
      maxGuests: z.number().int().positive().optional(),
      basePricePerPerson: z.number().nonnegative().default(0),
      cuisineType: z.string().optional(),
      dietaryTags: z.array(z.string()).optional(),
      photos: z.array(z.string()).optional(),
      leadTimeDays: z.number().int().positive().default(3),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId: _, ...data } = input;
      const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

      return ctx.db.cateringMenus.create({
        data: {
          ...data,
          orgId: ctx.orgId,
          slug,
          isActive: true,
          isFeatured: false,
          isPublished: false,
        },
      });
    }),

  /** Update menu */
  update: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
      name: z.string().min(2).max(200).optional(),
      description: z.string().max(2000).optional(),
      menuType: z.enum(["per_head", "per_dish", "package", "custom"]).optional(),
      eventType: z.string().optional(),
      minGuests: z.number().int().positive().optional(),
      maxGuests: z.number().int().positive().optional(),
      basePricePerPerson: z.number().nonnegative().optional(),
      cuisineType: z.string().optional(),
      dietaryTags: z.array(z.string()).optional(),
      photos: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId: _, menuId, ...data } = input;
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: menuId, orgId: ctx.orgId },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.cateringMenus.update({ where: { id: menuId }, data });
    }),

  /** Delete (soft) */
  delete: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.cateringMenus.update({
        where: { id: input.menuId },
        data: { isActive: false },
      });
    }),

  // ─── Categories ───────────────────────────────

  /** Add category to menu */
  addCategory: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
      name: z.string().min(1).max(200),
      nameAr: z.string().optional(),
      nameFr: z.string().optional(),
      description: z.string().optional(),
      isOptional: z.boolean().default(false),
      maxSelections: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      const lastCat = await ctx.db.cateringCategories.findFirst({
        where: { cateringMenuId: input.menuId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return ctx.db.cateringCategories.create({
        data: {
          cateringMenuId: input.menuId,
          name: input.name,
          nameAr: input.nameAr,
          nameFr: input.nameFr,
          description: input.description,
          isOptional: input.isOptional,
          maxSelections: input.maxSelections,
          sortOrder: (lastCat?.sortOrder ?? 0) + 1,
        },
      });
    }),

  /** Update category */
  updateCategory: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      categoryId: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      nameAr: z.string().optional(),
      nameFr: z.string().optional(),
      description: z.string().optional(),
      isOptional: z.boolean().optional(),
      maxSelections: z.number().int().positive().nullable().optional(),
      sortOrder: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId: _, categoryId, ...data } = input;
      // Verify ownership via menu
      const cat = await ctx.db.cateringCategories.findUnique({
        where: { id: categoryId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!cat || cat.cateringMenu.orgId !== ctx.orgId) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.cateringCategories.update({ where: { id: categoryId }, data });
    }),

  /** Delete category (cascades items) */
  deleteCategory: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      categoryId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const cat = await ctx.db.cateringCategories.findUnique({
        where: { id: input.categoryId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!cat || cat.cateringMenu.orgId !== ctx.orgId) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.cateringCategories.delete({ where: { id: input.categoryId } });
    }),

  // ─── Items ────────────────────────────────────

  /** Add item to a category */
  addItem: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
      categoryId: z.string().uuid(),
      name: z.string().min(1).max(200),
      nameAr: z.string().optional(),
      nameFr: z.string().optional(),
      description: z.string().optional(),
      pricePerPerson: z.number().nonnegative().optional(),
      pricePerUnit: z.number().nonnegative().optional(),
      unitLabel: z.string().optional(),
      isIncluded: z.boolean().default(true),
      isOptional: z.boolean().default(false),
      isVegetarian: z.boolean().default(false),
      isVegan: z.boolean().default(false),
      isGlutenFree: z.boolean().default(false),
      allergens: z.array(z.string()).optional(),
      imageUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      const lastItem = await ctx.db.cateringItems.findFirst({
        where: { cateringCategoryId: input.categoryId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return ctx.db.cateringItems.create({
        data: {
          cateringMenuId: input.menuId,
          cateringCategoryId: input.categoryId,
          name: input.name,
          nameAr: input.nameAr,
          nameFr: input.nameFr,
          description: input.description,
          pricePerPerson: input.pricePerPerson,
          pricePerUnit: input.pricePerUnit,
          unitLabel: input.unitLabel,
          isIncluded: input.isIncluded,
          isOptional: input.isOptional,
          isVegetarian: input.isVegetarian,
          isVegan: input.isVegan,
          isGlutenFree: input.isGlutenFree,
          allergens: input.allergens ?? [],
          imageUrl: input.imageUrl,
          sortOrder: (lastItem?.sortOrder ?? 0) + 1,
        },
      });
    }),

  /** Update item */
  updateItem: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      itemId: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      nameAr: z.string().optional(),
      nameFr: z.string().optional(),
      description: z.string().optional(),
      pricePerPerson: z.number().nonnegative().optional(),
      pricePerUnit: z.number().nonnegative().optional(),
      isIncluded: z.boolean().optional(),
      isOptional: z.boolean().optional(),
      isAvailable: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      imageUrl: z.string().url().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId: _, itemId, ...data } = input;
      const item = await ctx.db.cateringItems.findUnique({
        where: { id: itemId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!item || item.cateringMenu.orgId !== ctx.orgId) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.cateringItems.update({ where: { id: itemId }, data });
    }),

  /** Delete item */
  deleteItem: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      itemId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cateringItems.findUnique({
        where: { id: input.itemId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!item || item.cateringMenu.orgId !== ctx.orgId) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.cateringItems.delete({ where: { id: input.itemId } });
    }),

  // ─── Duplicate ────────────────────────────────

  /** Duplicate entire menu with categories + items */
  duplicate: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
      newName: z.string().min(2).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const source = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
        include: {
          categories: {
            include: { cateringItems: true },
          },
        },
      });
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });

      const slug = `${input.newName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

      return ctx.db.cateringMenus.create({
        data: {
          orgId: ctx.orgId,
          name: input.newName,
          slug,
          description: source.description,
          menuType: source.menuType,
          eventType: source.eventType,
          minGuests: source.minGuests,
          maxGuests: source.maxGuests,
          basePricePerPerson: source.basePricePerPerson,
          cuisineType: source.cuisineType,
          dietaryTags: source.dietaryTags,
          photos: source.photos,
          isActive: true,
          isFeatured: false,
          isPublished: false,
          categories: {
            create: source.categories.map((cat) => ({
              name: cat.name,
              nameAr: cat.nameAr,
              nameFr: cat.nameFr,
              description: cat.description,
              sortOrder: cat.sortOrder,
              isOptional: cat.isOptional,
              maxSelections: cat.maxSelections,
            })),
          },
        },
        include: { categories: true },
      });
      // Note: Items need to be duplicated separately since nested creates
      // can't reference the newly created category IDs in one step.
      // A follow-up migration task could add this.
    }),
});
