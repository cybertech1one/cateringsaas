import { createTRPCRouter } from "~/server/api/trpc";
import { promotionsCrudRouter } from "./crud";
import { allergensRouter } from "./allergens";
import { favoritesRouter } from "./favorites";

/**
 * Merged promotions router.
 *
 * All sub-routers are merged into a single flat namespace so that
 * existing call-sites like `api.promotions.getPromotions` continue to work
 * without any changes.
 */
export const promotionsRouter = createTRPCRouter({
  // Promotions CRUD
  getPromotions: promotionsCrudRouter.getPromotions,
  createPromotion: promotionsCrudRouter.createPromotion,
  updatePromotion: promotionsCrudRouter.updatePromotion,
  deletePromotion: promotionsCrudRouter.deletePromotion,
  togglePromotion: promotionsCrudRouter.togglePromotion,
  getActivePromotions: promotionsCrudRouter.getActivePromotions,
  getActiveBySlug: promotionsCrudRouter.getActiveBySlug,

  // Allergens
  getAllergens: allergensRouter.getAllergens,
  createCustomAllergen: allergensRouter.createCustomAllergen,
  deleteCustomAllergen: allergensRouter.deleteCustomAllergen,
  setDishAllergens: allergensRouter.setDishAllergens,
  getDishAllergens: allergensRouter.getDishAllergens,
  getMenuAllergens: allergensRouter.getMenuAllergens,

  // Customer Favorites
  toggleFavorite: favoritesRouter.toggleFavorite,
  getFavorites: favoritesRouter.getFavorites,
  getPopularDishes: favoritesRouter.getPopularDishes,
});

// Re-export shared constants/types for any external consumers
export {
  promotionTypeEnum,
  allergenTypeEnum,
  dayOfWeekEnum,
  verifyRestaurantOwnership,
} from "./_shared";
