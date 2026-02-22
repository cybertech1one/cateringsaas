# Multi-Audience Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform FeastQR from a single landing page into a 3-audience platform with dedicated pages for consumers, restaurant owners, and delivery drivers.

**Architecture:** Three top-level pages with per-page color themes via CSS custom property overrides. Shared Navbar/Footer with audience-aware navigation. All i18n in EN/FR/AR.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, CSS custom properties, react-i18next, next/dynamic

---

### Task 1: Per-Page Color Theme System

**Files:**
- Modify: `src/styles/globals.css`

**Step 1: Add theme override classes**

```css
/* Per-audience page themes */
.theme-business {
  --primary: 228 55% 45%;
  --primary-foreground: 0 0% 100%;
  --accent: 152 40% 42%;
}

.theme-driver {
  --primary: 160 45% 42%;
  --primary-foreground: 0 0% 100%;
  --accent: 42 85% 52%;
}
```

**Step 2: Commit**

---

### Task 2: Consumer Landing Refactor (/)

**Files:**
- Modify: `src/pageComponents/LandingPage/LandingPage.page.tsx`
- Modify: `src/app/page.tsx` (update metadata to consumer-focused)
- Modify: `src/i18n/locales/en/common.ts`

Remove business-specific sections from the landing page. Keep:
- Hero (consumer food discovery focus)
- Stats bar
- Features (diner features only — browse, order, language)
- Taste of Morocco city cards
- Testimonials (diner testimonials)
- Explore directory teaser
- Final CTA (explore-focused)

Move to /for-restaurants:
- Owner features
- Pricing section
- Comparison table
- FAQ section
- How It Works (owner)

Add:
- Subtle cross-links: "Own a restaurant?" → /for-restaurants, "Want to deliver?" → /for-drivers

---

### Task 3: For Restaurants Page (/for-restaurants)

**Files:**
- Create: `src/app/for-restaurants/page.tsx`
- Create: `src/pageComponents/ForRestaurants/ForRestaurants.page.tsx`
- Create: `src/pageComponents/ForRestaurants/molecules/RestaurantHero.tsx`
- Create: `src/pageComponents/ForRestaurants/molecules/ProblemSection.tsx`
- Create: `src/pageComponents/ForRestaurants/molecules/DeliveryNetwork.tsx`
- Modify: `src/i18n/locales/en/common.ts`

Sections:
1. Hero: "Your Restaurant, Your Rules" — indigo theme, dashboard screenshot placeholder
2. Problem: "Why lose 30% to delivery platforms?"
3. Solution: Feature grid (QR menus, AI content, analytics, multi-language, delivery)
4. How It Works: Create → QR → Orders → Earn 100%
5. Delivery Network: "Your delivery, your way" — connect with local drivers
6. Pricing: Reuse PricingSection component
7. Comparison: Reuse ComparisonSection component
8. FAQ: Reuse FAQSection component
9. Testimonials: Owner quotes
10. CTA: "Create Your Free Menu"

---

### Task 4: For Drivers Page (/for-drivers)

**Files:**
- Create: `src/app/for-drivers/page.tsx`
- Create: `src/pageComponents/ForDrivers/ForDrivers.page.tsx`
- Create: `src/pageComponents/ForDrivers/molecules/DriverHero.tsx`
- Create: `src/pageComponents/ForDrivers/molecules/HowItsDifferent.tsx`
- Create: `src/pageComponents/ForDrivers/molecules/EarningsSection.tsx`
- Create: `src/pageComponents/ForDrivers/molecules/RequirementsSection.tsx`
- Create: `src/pageComponents/ForDrivers/molecules/CitiesSection.tsx`
- Modify: `src/i18n/locales/en/common.ts`

Sections:
1. Hero: "Deliver & Earn on Your Terms" — mint/teal theme, rider imagery placeholder
2. How It's Different: No algorithm boss, work directly with restaurants
3. How It Works: Sign Up → Connect → Deliver → Get Paid
4. Earnings: Stats-focused section
5. Benefits: Flexible hours, no commission, direct relationships
6. Requirements: What you need to start
7. Cities: Where we operate
8. CTA: "Start Delivering Today"

---

### Task 5: Audience-Aware Navbar + Footer

**Files:**
- Modify: `src/components/Navbar/Navbar.tsx`
- Modify: `src/pageComponents/LandingPage/molecules/Footer.tsx`
- Modify: `src/i18n/locales/en/common.ts`

Navbar logged-out items:
- Explore | For Restaurants | For Drivers | Login

Footer:
- Add "For Drivers" section
- Cross-link all 3 audiences

---

### Task 6: i18n — French + Arabic translations

**Files:**
- Modify: `src/i18n/locales/fr/common.ts`
- Modify: `src/i18n/locales/ar/common.ts`

Translate all new keys for:
- forRestaurants.* (hero, problem, solution, delivery, cta)
- forDrivers.* (hero, different, howItWorks, earnings, benefits, requirements, cities, cta)
- Updated navbar keys
- Updated footer keys

---

### Task 7: Build Verification + Dev Server Test

Run full SDLC checklist:
1. `pnpm check-types` — zero errors
2. `npx eslint src/ --max-warnings 0` — zero errors
3. `pnpm test` — all passing
4. `rm -rf .next && pnpm build` — all routes
5. `pnpm dev` — all new pages return 200
6. Verify key elements render in HTML
