# Diyafa — Morocco's Premier Catering SaaS Platform

> **Diyafa** (ضيافة) means "grand hospitality feast" in Moroccan Darija. We're building the platform that will digitize and transform Morocco's $2.9B catering industry.

## The Problem

Morocco's catering industry — weddings, corporate events, Ramadan iftars, celebrations — is a **$2.1-2.9B market** operating almost entirely through WhatsApp messages, phone calls, and verbal agreements. There is **zero** digital infrastructure for:

- Discovering and comparing caterers
- Requesting and managing quotes
- Tracking event bookings and deposits
- Managing staff, equipment, and logistics
- Building and showcasing catering menus
- Processing milestone payments

## The Solution

**Diyafa** is a full-stack catering SaaS platform that provides:

### For Caterers, Restaurants, Hotels & Venues
- **Event Management** — Full lifecycle from inquiry to settlement
- **Quote Builder** — Professional quotes with packages, per-head pricing, custom options
- **CRM** — Customer relationship management with booking history
- **Menu Builder** — Catering-specific menus (packages, tiers, dietary options)
- **Staff Scheduling** — Assign teams to events with availability tracking
- **Equipment Tracking** — Manage inventory of chafing dishes, linens, tables
- **Financial Tools** — Invoicing, milestone payments, TVA compliance
- **Marketing** — WhatsApp campaigns, promotions, portfolio showcase
- **Analytics** — Revenue, bookings, seasonal trends, customer insights
- **Kitchen Prep** — Timeline planning, prep checklists, assignment management
- **Portfolio** — Showcase past events with photos and videos
- **Reputation** — Review management and response tools

### For Clients
- **Marketplace** — Search caterers by city, cuisine, event type, budget
- **Quote Requests** — Submit event details, receive professional quotes
- **Booking Tracking** — Real-time status, payment milestones, event timeline
- **Reviews** — Rate and review past events (food, service, value, presentation)
- **WhatsApp Integration** — Communicate naturally with caterers

### Platform
- **Multi-tenant** — Each organization is fully isolated with RLS
- **Multi-language** — English, French, Arabic (RTL) with auto-detection
- **Role-based** — Super admin, org owner, admin, manager, staff
- **AI-powered** — Menu suggestions, quote generation, demand forecasting

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui |
| Backend | tRPC, Prisma ORM |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth |
| Payments | CMI Gateway (Morocco), COD, Bank Transfer |
| AI | OpenAI, Anthropic, Google Gemini |
| i18n | English, French, Arabic (RTL) with auto-detect |
| Communication | WhatsApp Business API, Email, Push, SMS |
| Testing | Vitest + React Testing Library |

## Quick Start

```bash
# Clone
git clone https://github.com/cybertech1one/cateringsaas.git
cd cateringsaas

# Install
pnpm install

# Start local Supabase (requires Docker)
npx supabase start

# Start dev server
pnpm dev
```

## Market Opportunity

| Metric | Value |
|--------|-------|
| Morocco catering TAM | $2.1-2.9B |
| Moroccan weddings/year | 200,000-250,000 |
| Average wedding catering spend | MAD 30,000-150,000 |
| Digital competition in Morocco | **Zero** |
| Internet penetration | 92.2% |
| FIFA 2030 World Cup | Co-hosted by Morocco |

## Languages

- English
- Francais
- العربية (RTL)

## License

Open Source — MIT License

---

**Diyafa** — Every event deserves a feast. كل مناسبة تستاهل ضيافة.
