import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "./routers/auth";
import { menusRouter } from "./routers/menus";
import { languagesRouter } from "./routers/languages";
import { paymentsRouter } from "./routers/payments";
import { aiRouter } from "./routers/ai";
import { staffRouter } from "./routers/staff";
import { ordersRouter } from "./routers/orders";
import { themeRouter } from "./routers/theme";
import { restaurantsRouter } from "./routers/restaurants";
import { reviewsRouter } from "./routers/reviews";
import { analyticsRouter } from "./routers/analytics";
import { promotionsRouter } from "./routers/promotions";
import { notificationsRouter } from "./routers/notifications";
import { marketingRouter } from "./routers/marketing";
import { directoryRouter } from "./routers/directory";
import { kitchenRouter } from "./routers/kitchen";
import { loyaltyRouter } from "./routers/loyalty";
import { affiliatesRouter } from "./routers/affiliates";
import { crmRouter } from "./routers/crm";
import { deliveryRouter } from "./routers/delivery";
import { driversRouter } from "./routers/drivers";
import { cateringRouter } from "./routers/catering";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  menus: menusRouter,
  auth: authRouter,
  languages: languagesRouter,
  payments: paymentsRouter,
  ai: aiRouter,
  staff: staffRouter,
  orders: ordersRouter,
  theme: themeRouter,
  restaurants: restaurantsRouter,
  reviews: reviewsRouter,
  analytics: analyticsRouter,
  promotions: promotionsRouter,
  notifications: notificationsRouter,
  marketing: marketingRouter,
  directory: directoryRouter,
  kitchen: kitchenRouter,
  loyalty: loyaltyRouter,
  affiliates: affiliatesRouter,
  crm: crmRouter,
  delivery: deliveryRouter,
  drivers: driversRouter,
  catering: cateringRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
