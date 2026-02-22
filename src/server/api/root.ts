import { createTRPCRouter } from "~/server/api/trpc";

// ── Legacy FeastQR Routers (retained for compatibility) ──────────────
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

// ── Diyafa Core Routers (new org-scoped multi-tenant) ────────────────
import { organizationsRouter } from "./routers/organizations";
import { eventsRouter } from "./routers/events";
import { quotesRouter } from "./routers/quotes";
import { financesRouter } from "./routers/finances";
import { clientsRouter } from "./routers/clients";
import { cateringMenusRouter } from "./routers/cateringMenus";
import { staffSchedulingRouter } from "./routers/staffScheduling";
import { equipmentRouter } from "./routers/equipment";
import { marketplaceRouter } from "./routers/marketplace";
import { messagesRouter } from "./routers/messages";
import { eventReviewsRouter } from "./routers/eventReviews";
import { timelineRouter } from "./routers/timeline";

/**
 * Diyafa — Primary Router
 *
 * 31 routers total:
 * - 19 legacy FeastQR routers (retained, gradually evolving)
 * - 12 new Diyafa org-scoped routers
 */
export const appRouter = createTRPCRouter({
  // ── Legacy (FeastQR) ─────────────────────────────────────────────
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

  // ── Diyafa Core ──────────────────────────────────────────────────
  organizations: organizationsRouter,
  events: eventsRouter,
  quotes: quotesRouter,
  finances: financesRouter,
  clients: clientsRouter,
  cateringMenus: cateringMenusRouter,
  staffScheduling: staffSchedulingRouter,
  equipment: equipmentRouter,
  marketplace: marketplaceRouter,
  messages: messagesRouter,
  eventReviews: eventReviewsRouter,
  timeline: timelineRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
