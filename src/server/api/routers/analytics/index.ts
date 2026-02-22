import { createTRPCRouter } from "~/server/api/trpc";
import { menuAnalyticsRouter } from "./menu-analytics";
import { overviewRouter } from "./overview";
import { revenueRouter } from "./revenue";
import { trackingRouter } from "./tracking";

/**
 * Merged analytics router.
 *
 * All sub-routers are merged into a single flat namespace so that
 * existing call-sites like `api.analytics.trackEvent` continue to work
 * without any changes.
 */
export const analyticsRouter = createTRPCRouter({
  // Tracking (public)
  trackEvent: trackingRouter.trackEvent,

  // Overview / Dashboard
  getDashboard: overviewRouter.getDashboard,
  getConversionFunnel: overviewRouter.getConversionFunnel,
  getSuccessKPIs: overviewRouter.getSuccessKPIs,

  // Menu-specific analytics
  getMenuViewsOverTime: menuAnalyticsRouter.getMenuViewsOverTime,
  getPopularDishes: menuAnalyticsRouter.getPopularDishes,
  getQRScanStats: menuAnalyticsRouter.getQRScanStats,

  // Revenue / Location comparison
  getLocationComparison: revenueRouter.getLocationComparison,

  // Revenue analytics (from actual order data)
  getRevenueOverview: revenueRouter.getRevenueOverview,
  getRevenueByDay: revenueRouter.getRevenueByDay,
  getRevenueByOrderType: revenueRouter.getRevenueByOrderType,
  getTopSellingDishes: revenueRouter.getTopSellingDishes,
  getPeakRevenueHours: revenueRouter.getPeakRevenueHours,
});
