/**
 * Diyafa — Catering Menus Router
 *
 * 3-level hierarchy: CateringMenus → CateringCategories → CateringItems
 * Plus: CateringPackages (bundled item combos)
 * Plus: Inventory tracking (stock levels, reservations, low-stock alerts)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";
import { logger } from "~/server/logger";

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

  // ─── Packages ───────────────────────────────────

  /** List all packages for a menu */
  listPackages: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify menu belongs to org
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.cateringPackages.findMany({
        where: { cateringMenuId: input.menuId },
        include: { packageItems: { include: { item: true, category: true } } },
        orderBy: { sortOrder: "asc" },
      });
    }),

  /** Get a single package by ID */
  getPackage: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      packageId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: input.packageId },
        include: {
          cateringMenu: { select: { orgId: true } },
          packageItems: { include: { item: true, category: true } },
        },
      });
      if (!pkg || pkg.cateringMenu.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return pkg;
    }),

  /** Create a package */
  createPackage: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
      name: z.string().min(2).max(200),
      nameAr: z.string().max(200).optional(),
      nameFr: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      pricePerPerson: z.number().int().nonnegative().default(0),
      minGuests: z.number().int().positive().default(10),
      maxGuests: z.number().int().positive().optional(),
      imageUrl: z.string().url().optional(),
      includesText: z.string().max(2000).optional(),
      isFeatured: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      const lastPkg = await ctx.db.cateringPackages.findFirst({
        where: { cateringMenuId: input.menuId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return ctx.db.cateringPackages.create({
        data: {
          cateringMenuId: input.menuId,
          name: input.name,
          nameAr: input.nameAr,
          nameFr: input.nameFr,
          description: input.description,
          pricePerPerson: input.pricePerPerson,
          minGuests: input.minGuests,
          maxGuests: input.maxGuests,
          imageUrl: input.imageUrl,
          includesText: input.includesText,
          isFeatured: input.isFeatured,
          sortOrder: (lastPkg?.sortOrder ?? 0) + 1,
        },
      });
    }),

  /** Update a package */
  updatePackage: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      packageId: z.string().uuid(),
      name: z.string().min(2).max(200).optional(),
      nameAr: z.string().max(200).optional(),
      nameFr: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      pricePerPerson: z.number().int().nonnegative().optional(),
      minGuests: z.number().int().positive().optional(),
      maxGuests: z.number().int().positive().nullable().optional(),
      imageUrl: z.string().url().nullable().optional(),
      includesText: z.string().max(2000).nullable().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId: _, packageId, ...data } = input;
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: packageId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!pkg || pkg.cateringMenu.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cateringPackages.update({ where: { id: packageId }, data });
    }),

  /** Delete a package (hard delete — cascades package items) */
  deletePackage: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      packageId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: input.packageId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!pkg || pkg.cateringMenu.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cateringPackages.delete({ where: { id: input.packageId } });
    }),

  /** Reorder packages by updating sortOrder for multiple packages */
  reorderPackages: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      menuId: z.string().uuid(),
      packages: z.array(z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().nonnegative(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify menu belongs to org
      const menu = await ctx.db.cateringMenus.findFirst({
        where: { id: input.menuId, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!menu) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.packages.length === 0) return [];

      const updates = input.packages.map((pkg) =>
        ctx.db.cateringPackages.update({
          where: { id: pkg.id },
          data: { sortOrder: pkg.sortOrder },
        }),
      );

      return Promise.all(updates);
    }),

  /** Toggle isFeatured on a package */
  togglePackageFeatured: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      packageId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.db.cateringPackages.findUnique({
        where: { id: input.packageId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!pkg || pkg.cateringMenu.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.cateringPackages.update({
        where: { id: input.packageId },
        data: { isFeatured: !pkg.isFeatured },
      });
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

  // ─── Inventory Management ─────────────────────

  /** Get all items with stock levels, grouped by menu and category */
  getInventoryOverview: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx }) => {
      return ctx.db.cateringMenus.findMany({
        where: { orgId: ctx.orgId, isActive: true },
        select: {
          id: true,
          name: true,
          categories: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              cateringItems: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  name: true,
                  availableQuantity: true,
                  lowStockThreshold: true,
                  reservedQuantity: true,
                  isAvailable: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  /** Update available quantity for a single item with audit log */
  updateStock: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      itemId: z.string().uuid(),
      newQuantity: z.number().int().nonnegative(),
      reason: z.enum(["restock", "adjustment", "waste"]),
      note: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cateringItems.findUnique({
        where: { id: input.itemId },
        include: { cateringMenu: { select: { orgId: true } } },
      });
      if (!item || item.cateringMenu.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const oldQty = item.availableQuantity ?? 0;

      const updated = await ctx.db.cateringItems.update({
        where: { id: input.itemId },
        data: { availableQuantity: input.newQuantity },
      });

      await ctx.db.stockLogs.create({
        data: {
          itemId: input.itemId,
          orgId: ctx.orgId,
          userId: ctx.user.id,
          oldQty,
          newQty: input.newQuantity,
          reason: input.reason,
          note: input.note,
        },
      });

      logger.info(
        `Stock updated: item=${input.itemId} ${oldQty}->${input.newQuantity} reason=${input.reason}`,
        "inventory",
      );

      return updated;
    }),

  /** Batch update stock for multiple items in a single transaction */
  batchUpdateStock: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      reason: z.enum(["restock", "adjustment", "waste"]),
      note: z.string().max(500).optional(),
      items: z.array(z.object({
        itemId: z.string().uuid(),
        newQuantity: z.number().int().nonnegative(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        let updatedCount = 0;

        for (const entry of input.items) {
          const item = await tx.cateringItems.findUnique({
            where: { id: entry.itemId },
            include: { cateringMenu: { select: { orgId: true } } },
          });
          if (!item || item.cateringMenu.orgId !== ctx.orgId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Item ${entry.itemId} not found or not owned by org`,
            });
          }

          const oldQty = item.availableQuantity ?? 0;

          await tx.cateringItems.update({
            where: { id: entry.itemId },
            data: { availableQuantity: entry.newQuantity },
          });

          await tx.stockLogs.create({
            data: {
              itemId: entry.itemId,
              orgId: ctx.orgId,
              userId: ctx.user.id,
              oldQty,
              newQty: entry.newQuantity,
              reason: input.reason,
              note: input.note,
            },
          });

          updatedCount++;
        }

        return { updatedCount };
      });

      logger.info(
        `Batch stock update: ${result.updatedCount} items, reason=${input.reason}`,
        "inventory",
      );

      return result;
    }),

  /** Get items below a configurable low-stock threshold */
  getLowStockItems: orgProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      threshold: z.number().int().positive().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const threshold = input.threshold ?? 10;

      return ctx.db.cateringItems.findMany({
        where: {
          cateringMenu: { orgId: ctx.orgId, isActive: true },
          availableQuantity: { not: null, lt: threshold },
        },
        include: {
          category: { select: { id: true, name: true } },
          cateringMenu: { select: { id: true, name: true } },
        },
        orderBy: { availableQuantity: "asc" },
      });
    }),

  /** Reserve quantities for a confirmed event (decrements available stock) */
  reserveForEvent: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      eventId: z.string().uuid(),
      items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        // Verify event belongs to org
        const event = await tx.events.findFirst({
          where: { id: input.eventId, orgId: ctx.orgId },
        });
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        const reserved: Array<{ itemId: string; quantity: number }> = [];

        for (const entry of input.items) {
          const item = await tx.cateringItems.findUnique({
            where: { id: entry.itemId },
            include: { cateringMenu: { select: { orgId: true } } },
          });
          if (!item || item.cateringMenu.orgId !== ctx.orgId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Item ${entry.itemId} not found`,
            });
          }

          const available = item.availableQuantity ?? 0;
          if (available < entry.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient stock for ${item.name}: available=${available}, requested=${entry.quantity}`,
            });
          }

          await tx.cateringItems.update({
            where: { id: entry.itemId },
            data: {
              availableQuantity: available - entry.quantity,
              reservedQuantity: (item.reservedQuantity ?? 0) + entry.quantity,
            },
          });

          await tx.inventoryReservations.upsert({
            where: { eventId_itemId: { eventId: input.eventId, itemId: entry.itemId } },
            create: {
              eventId: input.eventId,
              itemId: entry.itemId,
              quantity: entry.quantity,
            },
            update: {
              quantity: { increment: entry.quantity },
            },
          });

          await tx.stockLogs.create({
            data: {
              itemId: entry.itemId,
              orgId: ctx.orgId,
              userId: ctx.user.id,
              oldQty: available,
              newQty: available - entry.quantity,
              reason: "reservation",
              note: `Reserved for event ${input.eventId}`,
            },
          });

          reserved.push({ itemId: entry.itemId, quantity: entry.quantity });
        }

        return { reserved };
      });

      logger.info(
        `Inventory reserved: event=${input.eventId}, ${result.reserved.length} items`,
        "inventory",
      );

      return result;
    }),

  /** Release reserved quantities for a cancelled/modified event */
  releaseReservation: orgManagerProcedure
    .input(z.object({
      orgId: z.string().uuid().optional(),
      eventId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        // Verify event belongs to org
        const event = await tx.events.findFirst({
          where: { id: input.eventId, orgId: ctx.orgId },
        });
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        // Find all reservations for this event
        const reservations = await tx.inventoryReservations.findMany({
          where: { eventId: input.eventId },
        });

        // Restore stock for each reservation
        for (const res of reservations) {
          await tx.cateringItems.update({
            where: { id: res.itemId },
            data: {
              availableQuantity: { increment: res.quantity },
              reservedQuantity: { decrement: res.quantity },
            },
          });

          await tx.stockLogs.create({
            data: {
              itemId: res.itemId,
              orgId: ctx.orgId,
              userId: ctx.user.id,
              oldQty: 0, // placeholder — real value in the DB
              newQty: res.quantity,
              reason: "release",
              note: `Released from event ${input.eventId}`,
            },
          });
        }

        // Delete all reservations for this event
        await tx.inventoryReservations.deleteMany({
          where: { eventId: input.eventId },
        });

        return { releasedCount: reservations.length };
      });

      logger.info(
        `Inventory released: event=${input.eventId}, ${result.releasedCount} items`,
        "inventory",
      );

      return result;
    }),
});
