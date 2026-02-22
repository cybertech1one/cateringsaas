/**
 * Barrel export for all test utilities.
 *
 * Usage:
 *   import { createMenu, renderWithProviders, mockFetch } from "~/__tests__/utils";
 */

export {
  createMenu,
  createDish,
  createCategory,
  createUser,
  createReview,
  createRestaurant,
  createLocation,
  createDishVariant,
  createOrder,
  createOrderItem,
  createMenuTheme,
  createPromotion,
  getCategoryName,
  getDishName,
  resetFactoryCounter,
} from "./factories";

export {
  renderWithProviders,
  testI18n,
  createTestQueryClient,
} from "./renderWithProviders";

export {
  waitForLoadingToFinish,
  mockFetch,
  createMockRouter,
  dateAgo,
  randomUuid,
} from "./helpers";
