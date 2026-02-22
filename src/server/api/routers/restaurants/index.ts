import { createTRPCRouter } from "~/server/api/trpc";
import { restaurantCrudRouter } from "./crud";
import { locationsRouter } from "./locations";
import { queriesRouter } from "./queries";

/**
 * Merged restaurants router.
 *
 * All sub-routers are merged into a single flat namespace so that
 * existing call-sites like `api.restaurants.getRestaurants` continue
 * to work without any changes.
 */
export const restaurantsRouter = createTRPCRouter({
  // Restaurant CRUD
  getRestaurants: restaurantCrudRouter.getRestaurants,
  getRestaurant: restaurantCrudRouter.getRestaurant,
  createRestaurant: restaurantCrudRouter.createRestaurant,
  updateRestaurant: restaurantCrudRouter.updateRestaurant,
  deleteRestaurant: restaurantCrudRouter.deleteRestaurant,

  // Location CRUD
  getLocations: locationsRouter.getLocations,
  createLocation: locationsRouter.createLocation,
  updateLocation: locationsRouter.updateLocation,
  deleteLocation: locationsRouter.deleteLocation,

  // Operating Hours
  setOperatingHours: locationsRouter.setOperatingHours,
  getOperatingHours: locationsRouter.getOperatingHours,

  // Special Hours
  setSpecialHours: locationsRouter.setSpecialHours,

  // Table Zones
  getTableZones: locationsRouter.getTableZones,
  createTableZone: locationsRouter.createTableZone,
  updateTableZone: locationsRouter.updateTableZone,
  deleteTableZone: locationsRouter.deleteTableZone,

  // Menu <-> Location linking
  linkMenuToLocation: queriesRouter.linkMenuToLocation,

  // Public queries
  getPublicLocationInfo: queriesRouter.getPublicLocationInfo,
});
