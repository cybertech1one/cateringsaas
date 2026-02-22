# Diyafa - Morocco's Premier Catering SaaS Platform

## What is Diyafa?
Diyafa (ضيافة — "grand hospitality feast" in Darija) is an open-source SaaS platform for the Moroccan catering industry. It connects caterers, restaurants, hotels, venues, and event planners with clients who need catering services for weddings, corporate events, Ramadan iftars, and celebrations.

**Brand**: Diyafa & Catering Services
**Market**: Morocco-first, MENA expansion
**Model**: Phased Hybrid (SaaS tools for providers + marketplace for discovery)

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: tRPC, Prisma ORM, Supabase (Auth, Storage, Postgres, Realtime)
- **Payments**: CMI Gateway (Morocco), COD tracking, Bank transfers
- **AI**: OpenAI, Anthropic, Google Gemini (multi-provider)
- **i18n**: i18next (English, French, Arabic with RTL + auto-detect)
- **Communication**: WhatsApp Business API, Email, SMS, Push notifications
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm 8.8.0

## Constitutional Principles (IMMUTABLE)
1. **Catering is NOT ordering** — Inquiry → Quote → Negotiate → Confirm → Execute → Settle
2. **COD-first, digital-second** — 74% of Morocco is cash. Every flow has a COD path
3. **WhatsApp-native** — Morocco's #1 business channel. First-class, not fallback
4. **Arabic RTL as first-class** — Not an afterthought. RTL from day one
5. **Offline-resilient** — Caterers work in venues with poor connectivity
6. **Multi-tenant isolation** — Strict RLS on every table. No cross-tenant leakage
7. **Organization-first** — Org accounts with role hierarchy (super_admin > admin > manager > staff)

## Architecture Overview

### User Roles & Hierarchy
```
Platform Level:
  └── Super Admin (Diyafa platform team)
        └── Platform analytics, all org management, feature flags

Organization Level (each caterer/venue/hotel is an "org"):
  └── Org Owner (business owner)
        └── Admin (full org access)
              └── Manager (team/event management)
                    └── Staff (assigned tasks only)

Client Level:
  └── Registered Client (book events, track orders, leave reviews)
  └── Guest Client (browse, request quotes via WhatsApp)
```

### Core Modules — Provider Tools (Caterers, Restaurants, Hotels, Venues)
```
Provider Dashboard:
├── Dashboard & Analytics (revenue, bookings, trends, KPIs)
├── Event Management (lifecycle, calendar, assignments, timelines)
├── Quote Builder (pricing, packages, negotiations, versioning)
├── Catering Menu Builder (packages, per-head, tiers, dietary)
├── Booking Management (confirmations, deposits, milestones)
├── CRM & Customer Management (contacts, history, segments, notes)
├── Staff Scheduling & Assignment (availability, roles, payroll tracking)
├── Equipment & Inventory Tracking (allocation per event, condition, returns)
├── Kitchen Prep & Timeline Planning (prep schedules, checklists, assignments)
├── Financial Management (invoicing, payments, TVA, P&L reports)
├── Marketing Tools (campaigns, WhatsApp broadcast, promotions, SEO)
├── Portfolio & Gallery Management (photos, videos, past events showcase)
├── Reviews & Reputation Management (respond, analytics, Google integration)
├── Notification Center (WhatsApp, email, push, SMS)
├── Reports & Export (PDF invoices, CSV data, financial reports)
└── Settings & Organization Management (team, billing, preferences)
```

### Core Modules — Client-Facing
```
Client Experience:
├── Marketplace (search, browse, filter caterers by city/cuisine/budget/event)
├── Caterer Profile Pages (portfolio, reviews, packages, availability)
├── Quote Request Flow (event details → receive quotes → compare → accept)
├── Event Booking & Tracking (real-time status, timeline, milestones)
├── Payment Portal (COD confirmation, bank transfer, CMI gateway)
├── Review & Rating System (multi-dimensional: food, service, value, presentation)
├── WhatsApp Integration (natural conversation with caterers)
└── Language Auto-Detect (EN/FR/AR based on browser + location)
```

### Core Modules — Platform Admin
```
Super Admin:
├── Super Admin Dashboard (platform-wide analytics, GMV, take rate)
├── Organization Management (approve, suspend, feature flags)
├── Platform Analytics (growth, retention, marketplace health)
├── Content Moderation (reviews, photos, listings)
├── Feature Flags & A/B Testing
├── System Health Monitoring
└── Financial Settlement (commission tracking, payouts)
```

### Event Lifecycle (12 States)
```
INQUIRY → QUOTE_SENT → QUOTE_REVISED → QUOTE_ACCEPTED →
DEPOSIT_PENDING → DEPOSIT_RECEIVED → CONFIRMED →
IN_PREPARATION → IN_EXECUTION → COMPLETED →
SETTLEMENT_PENDING → SETTLED
```

## Quick Start
```bash
# Prerequisites: Node.js, pnpm, Docker
pnpm install
npx supabase start          # Starts local Supabase (Docker required)
pnpm dev                    # http://localhost:3000
```

## Environment
- `.env` configured for local Supabase (127.0.0.1:34321/34322)
- CMI payment gateway (production only)
- WhatsApp Business API keys (optional for dev)
- AI API keys optional (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY)

## Key Directories
```
src/app/                           # Next.js App Router pages
src/server/api/routers/            # tRPC routers
src/server/api/trpc.ts             # tRPC context, middleware, procedures
src/server/ai/                     # AI provider abstraction layer
src/server/db.ts                   # Prisma client singleton
src/server/supabase/               # Supabase client + storage
src/providers/                     # React context providers
src/pageComponents/                # Page-level components
src/components/ui/                 # shadcn/ui components
src/components/                    # Shared components
src/hooks/                         # Custom hooks
src/utils/                         # Utilities
src/shared/                        # Shared types, hooks, schemas
src/i18n/                          # i18n config + translations (en, fr, ar)
src/__tests__/                     # Test utilities and factories
prisma/schema.prisma               # Database schema
supabase/migrations/               # SQL migrations
supabase/seed.sql                  # Seed data
```

## Key Commands
```bash
pnpm build              # Production build
pnpm check-types        # TypeScript type checking
pnpm lint               # ESLint
pnpm test               # Run Vitest test suite
pnpm test:watch         # Run Vitest in watch mode
pnpm dev                # Dev server
npx supabase start      # Start local Supabase
npx supabase db reset   # Reset DB + apply migrations + seed
npx prisma db pull      # Pull schema from DB
npx prisma generate     # Generate Prisma client
```

## Database
- **Local Supabase**: postgresql://postgres:postgres@127.0.0.1:34322/postgres
- **Studio**: http://127.0.0.1:34323
- **Multi-tenant**: Organization-based RLS on all tables
- **Payment milestones**: Deposit/milestone/settlement tracking

## i18n Architecture
- English is the type source (NO type annotation on en/common.ts)
- French/Arabic import Resources type for validation
- RTL: isRtlLanguage() helper, dir attribute on <html>, Noto Sans Arabic
- Auto-detect: Browser language detection with localStorage override
- Translation files: src/i18n/locales/{en,fr,ar}/common.ts

## Security
- Row-Level Security (RLS) on ALL tables
- Organization-scoped data isolation
- Role-based access control (RBAC) with org hierarchy
- Security headers (CSP, HSTS, X-Frame-Options)
- IDOR protection, UUID validation, rate limiting
- Webhook signature verification
- IP hashing with daily rotation

## Testing
- Vitest + RTL + jsdom
- All routers must have comprehensive test coverage
- Test factories in src/__tests__/utils/factories.ts

## Common Issues (inherited from FeastQR base)
- NEVER run `pnpm install --force` - corrupts native module DLLs on Windows
- Always `rm -rf .next` before build if seeing module errors
- en/common.ts must NOT have type annotations (it's the type source)
- tRPC uses `api.useContext()` NOT `api.useUtils()` (older version)
- `"use client"` and `export const dynamic` CANNOT coexist
- @anthropic-ai/sdk pinned to v0.39.0 (Windows/pnpm compatibility)
- react-query v4 uses `cacheTime` not `gcTime`
- Hooks must NEVER be after early returns (rules-of-hooks)
- After adding Prisma models, MUST run `npx prisma generate`

## Progress Tracking
See `docs/progress/` for sprint-by-sprint progress documentation.

## Origin
Forked from FeastQR (restaurant menu SaaS) and rebuilt for the catering domain.
Separate codebase, separate database, separate deployment. No shared dependencies.
