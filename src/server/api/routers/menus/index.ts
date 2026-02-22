import { createTRPCRouter } from "~/server/api/trpc";
import { categoriesRouter } from "./categories";
import { menuCrudRouter } from "./crud";
import { dishesRouter } from "./dishes";
import { exportRouter } from "./export";
import { inventoryRouter } from "./inventory";
import { managementRouter } from "./management";
import { publishingRouter } from "./publishing";
import { schedulesRouter } from "./schedules";

/**
 * Merged menus router.
 *
 * All sub-routers are merged into a single flat namespace so that
 * existing call-sites like `api.menus.getMenus` continue to work
 * without any changes.
 */
export const menusRouter = createTRPCRouter({
  // Menu CRUD
  getMenus: menuCrudRouter.getMenus,
  upsertMenu: menuCrudRouter.upsertMenu,
  updateMenuSocials: menuCrudRouter.updateMenuSocials,
  updateMenuBackgroundImg: menuCrudRouter.updateMenuBackgroundImg,
  updateMenuLogoImg: menuCrudRouter.updateMenuLogoImg,
  getMenuBySlug: menuCrudRouter.getMenuBySlug,
  deleteMenu: menuCrudRouter.deleteMenu,

  // Dishes
  upsertDish: dishesRouter.upsertDish,
  updateDishImageUrl: dishesRouter.updateDishImageUrl,
  upsertDishVariant: dishesRouter.upsertDishVariant,
  deleteDish: dishesRouter.deleteDish,
  deleteVariant: dishesRouter.deleteVariant,
  reorderDishes: dishesRouter.reorderDishes,
  bulkToggleSoldOut: dishesRouter.bulkToggleSoldOut,

  // Categories
  getDishesByCategory: categoriesRouter.getDishesByCategory,
  upsertCategory: categoriesRouter.upsertCategory,
  getCategoriesBySlug: categoriesRouter.getCategoriesBySlug,
  deleteCategory: categoriesRouter.deleteCategory,
  reorderCategories: categoriesRouter.reorderCategories,

  // Publishing
  getPublicMenuBySlug: publishingRouter.getPublicMenuBySlug,
  publishMenu: publishingRouter.publishMenu,
  unpublishMenu: publishingRouter.unpublishMenu,

  // Management (duplicate, stats)
  duplicateMenu: managementRouter.duplicateMenu,
  getMenuStats: managementRouter.getMenuStats,

  // Export (JSON, CSV)
  exportMenu: exportRouter.exportMenu,
  exportMenuCSV: exportRouter.exportMenuCSV,
  exportMenuJSON: exportRouter.exportMenuJSON,

  // Schedules
  getSchedules: schedulesRouter.getSchedules,
  upsertSchedule: schedulesRouter.upsertSchedule,
  deleteSchedule: schedulesRouter.deleteSchedule,
  getActiveSchedules: schedulesRouter.getActiveSchedules,

  // Inventory
  getInventoryStatus: inventoryRouter.getInventoryStatus,
  updateStockLevel: inventoryRouter.updateStockLevel,
  bulkUpdateStock: inventoryRouter.bulkUpdateStock,
  toggleTrackInventory: inventoryRouter.toggleTrackInventory,
});

// Re-export shared constants for any external consumers
export { DEFAULT_MENU_LANGUAGE_NAME } from "./_shared";
