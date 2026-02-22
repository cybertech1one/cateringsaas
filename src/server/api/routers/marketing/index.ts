import { createTRPCRouter } from "~/server/api/trpc";
import { marketingOverviewRouter } from "./overview";

/**
 * Marketing router.
 *
 * Provides marketing-specific endpoints such as overview stats,
 * share tracking, and subscriber management.
 */
export const marketingRouter = createTRPCRouter({
  getMarketingOverview: marketingOverviewRouter.getMarketingOverview,
  getShareAnalytics: marketingOverviewRouter.getShareAnalytics,
  getSubscribers: marketingOverviewRouter.getSubscribers,
  getCustomerContacts: marketingOverviewRouter.getCustomerContacts,
  exportCustomerCSV: marketingOverviewRouter.exportCustomerCSV,
});
