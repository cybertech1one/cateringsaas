# Diyafa Route Architecture

## Route Mapping: FeastQR → Diyafa

### Public Pages (Keep & Rebrand)
| FeastQR Route | Diyafa Route | Status |
|---------------|-------------|--------|
| `/` (Landing) | `/` (Landing - catering focused) | Rebrand |
| `/login` | `/login` | Keep |
| `/register` | `/register` | Keep |
| `/reset-password` | `/reset-password` | Keep |
| `/explore` | `/explore` (Browse caterers) | Rebrand |
| `/explore/[city]` | `/explore/[city]` (City caterers) | Rebrand |
| `/privacy-policy` | `/privacy-policy` | Keep |
| `/terms-of-service` | `/terms-of-service` | Keep |
| `/refund-policy` | `/refund-policy` | Keep |

### New Public Pages
| Route | Purpose |
|-------|---------|
| `/caterer/[slug]` | Public caterer profile (portfolio, menus, reviews) |
| `/caterer/[slug]/menus` | Caterer's catering menus |
| `/caterer/[slug]/gallery` | Photo gallery of past events |
| `/caterer/[slug]/reviews` | Reviews page |
| `/request-quote` | Quote request flow (multi-step form) |
| `/request-quote/[eventId]` | Track quote status |
| `/event/[eventId]` | Client event tracking (status, timeline, payments) |
| `/event/[eventId]/invoice` | View/download invoice |
| `/for-caterers` | Landing page for caterers (sign up CTA) |
| `/for-venues` | Landing page for venues |
| `/for-corporates` | Landing page for corporate clients |
| `/blog` | Content marketing (SEO) |
| `/blog/[slug]` | Blog post |

### Provider Dashboard (Authenticated - Org Members)
| Route | Purpose | Priority |
|-------|---------|----------|
| `/dashboard` | Overview (KPIs, upcoming events, revenue) | P0 |
| `/dashboard/events` | Event management (list, filter, search) | P0 |
| `/dashboard/events/[eventId]` | Event detail (lifecycle, timeline, staff) | P0 |
| `/dashboard/events/calendar` | Calendar view of all events | P0 |
| `/dashboard/quotes` | Quote management (draft, sent, accepted) | P0 |
| `/dashboard/quotes/[quoteId]` | Quote builder/editor | P0 |
| `/dashboard/menus` | Catering menu management | P0 |
| `/dashboard/menus/[menuId]` | Menu editor | P0 |
| `/dashboard/clients` | CRM - Client management | P1 |
| `/dashboard/clients/[clientId]` | Client detail (history, notes, preferences) | P1 |
| `/dashboard/staff` | Staff management | P1 |
| `/dashboard/staff/schedule` | Staff scheduling calendar | P1 |
| `/dashboard/equipment` | Equipment inventory | P1 |
| `/dashboard/finances` | Financial overview (revenue, expenses, P&L) | P1 |
| `/dashboard/finances/invoices` | Invoice management | P1 |
| `/dashboard/finances/payments` | Payment milestone tracking | P1 |
| `/dashboard/marketing` | Marketing tools & campaigns | P2 |
| `/dashboard/marketing/portfolio` | Portfolio/gallery management | P2 |
| `/dashboard/marketing/promotions` | Promotional offers | P2 |
| `/dashboard/reviews` | Review management & responses | P2 |
| `/dashboard/analytics` | Detailed analytics & reports | P2 |
| `/dashboard/settings` | Org settings, team, billing | P0 |
| `/dashboard/settings/team` | Team/member management | P0 |
| `/dashboard/settings/billing` | Subscription & billing | P1 |
| `/dashboard/settings/integrations` | WhatsApp, CMI, etc. | P2 |

### Super Admin (Platform Level)
| Route | Purpose |
|-------|---------|
| `/admin` | Platform dashboard (GMV, orgs, users) |
| `/admin/organizations` | Manage all organizations |
| `/admin/organizations/[orgId]` | Org detail & moderation |
| `/admin/users` | User management |
| `/admin/analytics` | Platform-wide analytics |
| `/admin/moderation` | Content moderation (reviews, photos) |
| `/admin/settings` | Platform settings, feature flags |

### Routes to REMOVE (FeastQR-specific)
| Route | Reason |
|-------|--------|
| `/menu/create` | Replace with catering menu builder |
| `/menu/manage/[slug]/*` | Replace with dashboard/menus |
| `/menu/[slug]` | Replace with caterer profiles |
| `/menu/[slug]/preview` | Not needed |
| `/generation/qr-menu-pdf` | QR codes not core to catering |
| `/feedback/[slug]` | Replace with review system |
| `/r/[slug]` | Referral redirect - repurpose |
| `/order/[orderId]` | Replace with event tracking |
| `/order/history` | Replace with client event history |
| `/for-drivers/*` | Not needed for catering |
| `/dashboard/kitchen` | KDS not core to catering platform |
| `/dashboard/loyalty` | Replace with CRM |
| `/dashboard/delivery/*` | Not needed (catering logistics different) |
| `/dashboard/driver` | Not needed |
| `/dashboard/affiliates` | Phase 2 |

## Implementation Priority

### Phase 1 (Sprint 1): Foundation Routes
1. `/` — Rebranded landing page
2. `/login`, `/register`, `/reset-password` — Auth (keep)
3. `/dashboard` — Provider overview
4. `/dashboard/events` — Event list + detail
5. `/dashboard/menus` — Catering menu builder
6. `/dashboard/settings` — Org settings + team
7. `/explore` — Browse caterers

### Phase 2 (Sprint 2): Core Operations
8. `/dashboard/quotes` — Quote builder
9. `/dashboard/clients` — CRM
10. `/dashboard/staff` — Staff management
11. `/dashboard/finances` — Financial tools
12. `/caterer/[slug]` — Public caterer profiles

### Phase 3 (Sprint 3): Growth Features
13. `/dashboard/marketing` — Marketing tools
14. `/dashboard/analytics` — Analytics
15. `/dashboard/equipment` — Equipment tracking
16. `/request-quote` — Client quote flow
17. `/event/[eventId]` — Client event tracking

### Phase 4 (Sprint 4): Platform
18. `/admin/*` — Super admin panel
19. `/for-caterers`, `/for-venues`, `/for-corporates` — Landing pages
20. `/blog/*` — Content marketing
