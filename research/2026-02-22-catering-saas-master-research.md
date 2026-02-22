# Catering SaaS Platform — Master Research Report

**Date:** February 22, 2026
**Status:** Research Complete — Ready for Decision
**Research Agents:** 4 parallel agents, 76+ web sources, 6 hours of analysis

---

## EXECUTIVE SUMMARY

### The Opportunity in One Sentence
**Morocco has a $2.1-2.9B catering market with ZERO digital platforms, 200K+ weddings/year, a 2030 FIFA World Cup catalyst, and 92% internet penetration — this is a once-in-a-decade first-mover opportunity.**

### Key Numbers at a Glance

| Metric | Value |
|--------|-------|
| Global catering services market (2025) | $129.77B |
| Global catering software market (2025) | $1.12-2.0B (growing 12-15% CAGR) |
| Morocco hospitality market (2026) | $10.79B |
| Morocco catering TAM estimate | $2.1-2.9B |
| Moroccan weddings per year | 200,000-250,000 |
| Average wedding catering spend | MAD 30,000-150,000 |
| Wedding catering segment alone | $1.5-1.9B |
| Digital competition in Morocco | **ZERO** |
| Internet penetration | 92.2% (#1 in Africa) |
| WhatsApp users | ~30M+ (near-universal) |
| FIFA 2030 World Cup investment | $5-6B |

---

## 1. WHY THIS WILL WORK — The 7 Unfair Advantages

### 1. Zero Competition
There is NO catering SaaS, marketplace, or booking platform in Morocco. Period. The entire market runs on WhatsApp messages, phone calls, verbal agreements, and cash. This is like launching Uber in a city with no ride-hailing apps.

### 2. Massive TAM
$2.1-2.9B total addressable market. Wedding catering alone is $1.5-1.9B. Add corporate events, Ramadan iftars, Eid celebrations, tourist events, and conferences.

### 3. FIFA 2030 World Cup
Morocco is co-hosting the 2030 FIFA World Cup. $5-6B in infrastructure investment, 100,000+ new hotel beds, 26M tourist target. The catering infrastructure needed is enormous. Being the established platform by 2028-2029 = monopoly position.

### 4. Young, Digital Population
42.4% of Morocco's population is under 25. 92.2% internet penetration. 85%+ of e-commerce via mobile. The generation now planning their weddings and corporate events expects digital booking.

### 5. FeastQR's Battle-Tested Stack
We already have: auth, i18n (Arabic RTL!), AI multi-provider, WhatsApp integration, COD payments, order tracking, theme engine, security, PWA, 1894 passing tests. Competitors would need 12-18 months to match this foundation.

### 6. 83% Informal Sector
83% of Moroccan businesses are informal (World Bank). A platform becomes a de facto trust signal and quality guarantee — the "verified caterer" badge that both clients and caterers need.

### 7. Payment Modernization Wave
CMI monopoly ended May 2025. 200M+ card transactions in 2024. Digital Morocco 2030 government initiative. The infrastructure is finally ready for a digital catering platform.

---

## 2. COMPETITIVE LANDSCAPE

### Global Players (None in Morocco)

| Player | Model | Revenue | Key Weakness |
|--------|-------|---------|-------------|
| **ezCater** | Marketplace | $181.5M, $2.5B GMV | 18% commission, caterers hate fees |
| **Caterease** | SaaS | $57-450/mo | Founded 1986, crashes constantly, no Arabic |
| **CaterTrax** | SaaS | 20K users | Dated UI, opaque pricing, institutional only |
| **Total Party Planner** | SaaS | $65-199/mo | Small team, US-only |
| **Tripleseat** | SaaS | Events focus | No catering ops, no MENA |
| **RSVPify** | SaaS | $19-99/mo per event | Event management only, no food operations |

### Morocco Specifically
- **Glovo**: 58% delivery market share — but only individual meals, NO catering
- **Jumia Food**: 41% share — same, no catering
- **Traditional caterers**: Operate via WhatsApp + word of mouth exclusively
- **No local competitor exists**

---

## 3. RECOMMENDED NAME: DIFAYA

After generating 48 Moroccan-inspired names across 4 categories, the **Top 5 recommendations**:

### #1: DIFAYA ⭐ (Top Pick)
- **Meaning**: Darija for "grand hospitality feast" — literally what catering IS
- **Why**: 3 syllables, flows in Arabic/French/English, no competing brands, domain likely available
- **Tagline**: "Every event deserves a Difaya"
- **Domain**: difaya.com / difaya.ma

### #2: AZETTA
- **Meaning**: Amazigh for "network/weaving" — perfect tech metaphor for marketplace
- **Why**: Honors Amazigh heritage, unique, beautiful, uncontested

### #3: SINIA
- **Meaning**: The iconic large round Moroccan serving tray
- **Why**: Instantly recognizable, makes a great logo, 5 letters, food-related

### #4: TAYEBLY
- **Meaning**: Tayeb (delicious/good) + modern -ly suffix
- **Why**: Sounds natural in English, deeply Moroccan, SaaS-style naming

### #5: BSSAHA
- **Meaning**: Darija for "bon appetit" — said millions of times daily
- **Why**: Instant emotional recognition, great brand storytelling, viral potential

### Other Strong Options
- **Walima** (wedding feast), **Safra** (table spread/journey), **Agraw** (Amazigh: gathering)
- **Zelligo** (zellige + go), **Soukeat** (souk + eat), **Zwina** (beautiful)

---

## 4. ARCHITECTURE OVERVIEW

### Core Principle: Catering is NOT Ordering

| Restaurant Ordering | Catering |
|-------------------|----------|
| Real-time (order now, eat in 30 min) | Advance booking (days/weeks/months) |
| 1-5 items per order | 50-1,000+ guests |
| Fixed menu, fixed price | Custom menus, negotiated quotes |
| Single payment | Milestone payments (30/50/20 deposits) |
| Delivery by rider | Van/truck + setup crew + equipment |
| Cart → Checkout | Inquiry → Quote → Negotiate → Confirm → Execute |

### Platform Model: Phased Hybrid
- **Phase 1 (Months 1-6)**: SaaS tool for caterers (profiles, calendar, quotes, bookings)
- **Phase 2 (Months 6-12)**: Add marketplace discovery (clients find caterers)
- **Phase 3 (Year 2)**: Full platform with payments, logistics, AI

### Event Lifecycle State Machine (12 States)
```
INQUIRY → QUOTE_SENT → QUOTE_REVISED → QUOTE_ACCEPTED →
DEPOSIT_PENDING → DEPOSIT_RECEIVED → CONFIRMED →
IN_PREPARATION → IN_EXECUTION → COMPLETED →
SETTLEMENT_PENDING → SETTLED
```

### Database: 19 New Tables + 7 Evolved from FeastQR
- Quotes (versioned), Payment milestones, Equipment inventory
- Staff scheduling, Real-time messaging, Multi-dimensional reviews
- TVA-compliant invoicing, Delivery logistics, Prep timelines

### FeastQR Reuse Assessment
- **11 modules reuse directly**: Auth, i18n, theme, UI components, security, cache, logger, PWA, AI providers, notifications, cookie consent
- **8 modules evolve**: Menus → catering menus, orders → event bookings, payments → milestones, etc.
- **10 modules build new**: Quote builder, event lifecycle, equipment tracking, staff scheduling, etc.
- **8 modules remove**: QR codes, KDS, cart ordering, loyalty stamps, delivery zones, driver management

### Tech Stack (Same as FeastQR)
- Next.js 14 + tRPC + Prisma + Supabase + Tailwind + shadcn/ui
- WhatsApp Business API (360dialog or MessageBird)
- CMI payment gateway (Morocco's standard)
- AI: OpenAI + Anthropic + Gemini (already built)

---

## 5. REVENUE MODEL: Hybrid (Recommended for Morocco)

### Pricing Tiers

| Tier | Monthly (MAD) | Commission | Target |
|------|--------------|------------|--------|
| **Free** | 0 MAD | 10% per booking | Small/home caterers, onboarding |
| **Pro** | 199-299 MAD (~$20-30) | 5% per booking | Professional caterers |
| **Enterprise** | 799-999 MAD (~$80-100) | 3% per booking | Hotels, large venues, chains |

### Revenue Projections (Conservative)

| Milestone | Timeline | Revenue |
|-----------|----------|---------|
| 100 caterers, 500 bookings/mo | Month 6 | ~MAD 50K/mo |
| 500 caterers, 2,000 bookings/mo | Month 12 | ~MAD 200K/mo |
| 2,000 caterers, 10,000 bookings/mo | Month 24 | ~MAD 1M/mo |

---

## 6. GO-TO-MARKET STRATEGY

### Phase 1: Casablanca Launch (Months 1-3)
- Target: 50-100 caterers (top "traiteur" on Instagram/Google)
- Lead with: Free tier + WhatsApp integration + portfolio builder
- USP: "Get discovered by corporate clients"

### Phase 2: Expand to Marrakech + Rabat (Months 3-6)
- Marrakech: Destination weddings, tourist events
- Rabat: Corporate/government events
- Add: Quote builder, payment milestones

### Phase 3: National + Marketplace (Months 6-12)
- Client-facing marketplace (search, browse, book)
- Corporate catering partnerships
- Tangier, Fes, Agadir expansion

### Phase 4: FIFA Prep + Regional (Year 2)
- Scale for 2030 World Cup catering demand
- Expand to Tunisia, Algeria (similar markets)
- AI-powered quote generation + demand forecasting

---

## 7. IMPLEMENTATION ROADMAP (16 Weeks to MVP)

| Phase | Weeks | Focus | Deliverables |
|-------|-------|-------|-------------|
| **1: Foundation** | 1-4 | Fork, strip, rebuild core | Caterer profiles, onboarding, calendar |
| **2: Booking** | 5-8 | Event lifecycle | Quote builder, booking flow, WhatsApp |
| **3: Operations** | 9-12 | Tools for caterers | Menu builder, staff scheduling, equipment |
| **4: Payments** | 13-16 | Financial system | CMI integration, milestones, invoicing |

### Post-MVP
- Client marketplace portal
- AI features (menu suggestions, pricing, proposals)
- Mobile app (React Native)
- Analytics dashboard
- Multi-vendor events

---

## 8. RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Low SaaS adoption in Morocco | High | Free tier, WhatsApp-native UX, in-person onboarding |
| Cash-dominant market | Medium | COD tracking built in, deposit confirmations via WhatsApp |
| Informal caterers resist formalization | Medium | Position as "get more clients" not "digitize your business" |
| Copycat from Glovo/large player | Low-Medium | First-mover advantage, deep local features, community |
| Payment gateway complexity (CMI) | Medium | Start with bank transfer + COD, add CMI in Phase 4 |
| Seasonal revenue volatility | Medium | Corporate catering for steady base, Ramadan specials |

---

## 9. NEXT STEPS — Decision Points

### Decisions Needed From You:

1. **Name**: Difaya? Azetta? Sinia? Or another from the 48 options?

2. **Scope**: Full marketplace + SaaS? Or SaaS-only first?

3. **Timeline**: Start building now? Or more research first?

4. **Repo Setup**: Clone FeastQR into new folder `cateringsaas/`? Or new GitHub repo?

5. **Database**: Separate Supabase project? Or shared local dev?

6. **Priority Feature**: Quote builder? Caterer profiles? Event calendar? WhatsApp booking?

---

## RESEARCH FILES

All detailed research is saved in:
- `research/2026-02-22-global-catering-saas-market-research.md` — Global market, competitors, features
- `research/2026-02-22-morocco-catering-market-intelligence.md` — Morocco-specific market intelligence
- `docs/plans/2026-02-22-catering-saas-platform-architecture.md` — Full technical architecture (2,323 lines)
- This file: `research/2026-02-22-catering-saas-master-research.md` — Synthesis

---

*Research conducted by 4 parallel AI agents: ResearchAnalyst (Global Markets), ResearchAnalyst (Morocco Markets), Intern (Brand Naming), Architect (Technical Architecture)*
