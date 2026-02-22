import { createTRPCRouter } from "~/server/api/trpc";

// ── Foundation ────────────────────────────────────────────────────────
import { authRouter } from "./routers/auth";

// ── Diyafa Core Routers (org-scoped multi-tenant) ────────────────────
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
import { orgAnalyticsRouter } from "./routers/orgAnalytics";
import { portfolioRouter } from "./routers/portfolio";
import { calendarRouter } from "./routers/calendar";
import { orgThemesRouter } from "./routers/orgThemes";

/**
 * Diyafa — Primary Router
 *
 * 17 routers:
 * - 1 foundation (auth)
 * - 16 Diyafa org-scoped catering routers
 */
export const appRouter = createTRPCRouter({
  // ── Foundation ─────────────────────────────────────────────────────
  auth: authRouter,

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
  orgAnalytics: orgAnalyticsRouter,
  portfolio: portfolioRouter,
  calendar: calendarRouter,
  orgThemes: orgThemesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
