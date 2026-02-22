# Modern Marrakech Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform all external-facing pages (Landing, Explore, Auth, Navbar, Footer) into a dual-audience experience with subtle Moroccan visual identity, CSS/SVG food art, and warm palette — making FeastQR competitive with top-tier food platforms.

**Architecture:** Modify existing components in-place. Add new CSS custom properties + utility classes for Moroccan visual elements (zellige patterns, arch shapes, 8-pointed stars). Create a new `MoroccanFoodArt` component for the hero CSS art. All decorative elements are pure CSS/SVG — no image assets. i18n translations updated for EN/FR/AR.

**Tech Stack:** Next.js 14, Tailwind CSS, CSS custom properties, inline SVG data URIs, lucide-react icons, i18next.

---

## Task 1: Design Tokens — New Colors + Moroccan CSS Patterns

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: Add new CSS custom properties to globals.css**

In `src/styles/globals.css` `:root` block, add after `--gold`:

```css
    --sand: 36 33% 96%;
    --sand-dark: 36 20% 90%;
    --indigo: 228 45% 20%;
    --mint: 160 40% 55%;
```

In `.dark` block, add corresponding dark mode values:

```css
    --sand: 228 16% 10%;
    --sand-dark: 228 14% 8%;
    --indigo: 228 50% 15%;
    --mint: 160 35% 45%;
```

**Step 2: Add Moroccan utility classes to globals.css**

Add to the `@layer utilities` section:

```css
  /* Zellige-inspired section divider */
  .zellige-divider {
    position: relative;
  }
  .zellige-divider::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0.06;
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='3' viewBox='0 0 40 3' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 1.5L10 0L20 1.5L30 3L40 1.5' stroke='%23D97706' stroke-width='0.5'/%3E%3C/svg%3E");
    background-repeat: repeat-x;
    background-size: 40px 3px;
    pointer-events: none;
  }

  /* 8-pointed star decorative element */
  .moroccan-star {
    display: inline-block;
    width: 1em;
    height: 1em;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z' fill='currentColor' opacity='0.15'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }

  /* Moorish arch card top border */
  .arch-top {
    border-radius: 1rem 1rem 50% 50% / 1rem 1rem 8% 8%;
  }

  /* Moroccan geometric pattern overlay — low opacity */
  .moroccan-geo {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' stroke='%23D97706' stroke-width='0.3' opacity='0.08'/%3E%3Cpath d='M30 10L50 30L30 50L10 30z' stroke='%23D97706' stroke-width='0.3' opacity='0.05'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 60px 60px;
  }

  /* Warm hero background — replacing dark hero-mesh */
  .hero-warm {
    background: linear-gradient(145deg, hsl(var(--sand)) 0%, hsl(0 0% 99%) 40%, hsl(var(--sand)) 100%);
  }

  /* Hero warm for dark mode */
  .dark .hero-warm {
    background: linear-gradient(145deg, hsl(228 22% 6%) 0%, hsl(228 18% 11%) 40%, hsl(228 15% 8%) 100%);
  }

  /* Sand section background */
  .bg-sand {
    background-color: hsl(var(--sand));
  }
```

Add new keyframe for gentle rotate animation:

```css
@keyframes gentleRotate {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(3deg); }
}
```

**Step 3: Add new Tailwind color tokens**

In `tailwind.config.ts`, add to `colors` in the `extend` block:

```ts
sand: {
  DEFAULT: "hsl(var(--sand))",
  dark: "hsl(var(--sand-dark))",
},
indigo: "hsl(var(--indigo))",
mint: "hsl(var(--mint))",
```

**Step 4: Verify — run type check**

Run: `pnpm check-types`
Expected: PASS (no new TS errors)

**Step 5: Commit**

```bash
git add src/styles/globals.css tailwind.config.ts
git commit -m "feat(design): add Moroccan design tokens — sand, mint, zellige, arch utilities"
```

---

## Task 2: Moroccan Food Art Component

**Files:**
- Create: `src/pageComponents/LandingPage/molecules/MoroccanFoodArt.tsx`

**Step 1: Create the CSS art component**

This component renders abstract representations of Moroccan food (tagine, mint tea, couscous) using CSS shapes, gradients, and borders. No images needed.

```tsx
"use client";

export const MoroccanFoodArt = () => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square" aria-hidden="true">
      {/* Background geometric pattern */}
      <div className="absolute inset-0 moroccan-geo rounded-full opacity-30" />

      {/* Tagine pot — center piece */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-48 h-48 sm:w-56 sm:h-56">
        {/* Tagine lid (conical) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-24 sm:w-24 sm:h-28"
          style={{
            background: "linear-gradient(180deg, hsl(var(--terracotta)) 0%, hsl(var(--ember)) 100%)",
            clipPath: "polygon(50% 0%, 85% 100%, 15% 100%)",
            filter: "drop-shadow(0 4px 12px hsla(var(--terracotta), 0.3))",
          }}
        />
        {/* Tagine knob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gold shadow-md" />
        {/* Tagine base */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-16 sm:w-48 sm:h-20 rounded-b-full"
          style={{
            background: "linear-gradient(180deg, hsl(var(--ember-light)) 0%, hsl(var(--terracotta)) 100%)",
            boxShadow: "0 8px 32px -8px hsla(var(--terracotta), 0.4)",
          }}
        />
        {/* Steam wisps */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-1 h-8 rounded-full bg-gradient-to-t from-muted-foreground/10 to-transparent animate-float" />
          <div className="w-1 h-6 rounded-full bg-gradient-to-t from-muted-foreground/10 to-transparent animate-float" style={{ animationDelay: "0.5s" }} />
          <div className="w-1 h-7 rounded-full bg-gradient-to-t from-muted-foreground/10 to-transparent animate-float" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      {/* Mint tea glass — bottom left */}
      <div className="absolute bottom-[10%] left-[8%] w-20 h-28 sm:w-24 sm:h-32 animate-float" style={{ animationDelay: "0.8s" }}>
        {/* Glass body */}
        <div
          className="w-full h-full rounded-b-lg"
          style={{
            background: "linear-gradient(180deg, transparent 0%, hsla(var(--mint), 0.2) 30%, hsla(var(--mint), 0.35) 100%)",
            border: "2px solid hsla(var(--gold), 0.4)",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
          }}
        />
        {/* Gold rim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold/60 rounded-full" />
        {/* Mint leaf */}
        <div
          className="absolute -top-3 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-tl-full rounded-br-full"
          style={{ background: "linear-gradient(135deg, hsl(var(--sage)) 0%, hsl(var(--mint)) 100%)" }}
        />
      </div>

      {/* Couscous bowl — bottom right */}
      <div className="absolute bottom-[8%] right-[8%] w-28 h-16 sm:w-32 sm:h-20 animate-float" style={{ animationDelay: "1.5s" }}>
        {/* Bowl */}
        <div
          className="w-full h-full rounded-b-full"
          style={{
            background: "linear-gradient(180deg, hsl(var(--gold)) 0%, hsl(42 70% 45%) 100%)",
            boxShadow: "0 6px 24px -6px hsla(var(--gold), 0.3)",
          }}
        />
        {/* Couscous mound */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 sm:w-24 sm:h-10 rounded-t-full"
          style={{
            background: "radial-gradient(ellipse at bottom, hsl(42 60% 65%) 0%, hsl(42 50% 75%) 100%)",
          }}
        />
      </div>

      {/* Decorative 8-pointed star — top right */}
      <svg className="absolute top-[5%] right-[5%] w-12 h-12 sm:w-16 sm:h-16 text-gold/20 animate-[gentleRotate_8s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>

      {/* Small star — bottom center */}
      <svg className="absolute bottom-[30%] left-[45%] w-6 h-6 text-primary/15 animate-[gentleRotate_6s_ease-in-out_infinite_reverse]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
      </svg>

      {/* Warm glow behind the scene */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/[0.06] blur-3xl" />
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add src/pageComponents/LandingPage/molecules/MoroccanFoodArt.tsx
git commit -m "feat(landing): add MoroccanFoodArt CSS art component — tagine, tea, couscous"
```

---

## Task 3: Landing Page Hero — Dual-Audience Warm Redesign

**Files:**
- Modify: `src/pageComponents/LandingPage/LandingPage.page.tsx`
- Modify: `src/i18n/locales/en/common.ts`
- Modify: `src/i18n/locales/fr/common.ts`
- Modify: `src/i18n/locales/ar/common.ts`

**Step 1: Add new i18n keys to English**

In `src/i18n/locales/en/common.ts`, inside the `landing` object, update these:

```ts
hero: {
  badge: "Discover Morocco's Food Scene",
  title: "Taste the Best of",
  titleHighlight: "Morocco",
  subtitle: "Browse menus, discover restaurants, and order food from the finest eateries across Morocco's cities.",
  ctaExplore: "Explore Restaurants",
  ctaBrowse: "Browse Menus",
  ownerStrip: "Own a restaurant?",
  ownerCtaCreate: "Create your free menu",
  trustFreeToStart: "Free to start",
  trustSetupTime: "Setup in 2 minutes",
  trustMultiLanguage: "EN / FR / AR",
  valuePropFree: "500+ Restaurants",
  valuePropNoCommission: "12 Cities",
  valuePropMultiLang: "50,000+ Dishes",
  openSourceTrust: "Open-source and free to start -- no credit card required",
  trustSSL: "256-bit SSL Encryption",
  trustDataOwnership: "100% Data Ownership",
},
```

Add corresponding French and Arabic translations (use existing pattern from the other translation files).

**Step 2: Rewrite the hero section in LandingPage.page.tsx**

Replace the entire HERO section (from `{/* HERO */}` comment to `{/* Bottom gradient fade */}` div) with the new warm dual-audience hero:

- Use `hero-warm` background class instead of `hero-mesh`
- Replace `hero-grid` with `moroccan-geo` at low opacity
- Left side: diner-focused copy with new i18n keys
- Right side: `MoroccanFoodArt` component (lazy loaded)
- Below hero grid: Owner CTA strip — subtle bar with "Own a restaurant? Create your free menu" link
- Text colors change from `text-white` to `text-foreground` (warm light background)
- Orb colors change to use sand/primary tones instead of dark mode orbs

**Step 3: Rewrite the social proof bar**

Update stats to diner-focused metrics:
- "500+ Restaurants" with Utensils icon
- "12 Cities" with MapPin icon
- "50,000+ Dishes" with ChefHat icon
- "3 Languages" with Languages icon

**Step 4: Run type check**

Run: `pnpm check-types`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pageComponents/LandingPage/LandingPage.page.tsx src/i18n/locales/en/common.ts src/i18n/locales/fr/common.ts src/i18n/locales/ar/common.ts
git commit -m "feat(landing): dual-audience warm hero with Moroccan food art + diner-first stats"
```

---

## Task 4: Landing Page Features — Arch Cards + Dual-Audience

**Files:**
- Modify: `src/pageComponents/LandingPage/LandingPage.page.tsx`
- Modify: `src/i18n/locales/en/common.ts` (+ fr, ar)

**Step 1: Add new i18n keys for dual-audience features**

Add to `landing.features`:

```ts
features: {
  title: "Why FeastQR?",
  description: "For diners and restaurant owners alike",
  // Diner features
  dinerBrowse: "Browse Menus Anywhere",
  dinerBrowseDesc: "Discover restaurants, browse menus, and explore dishes from your phone. No app download needed.",
  dinerOrder: "Order with Ease",
  dinerOrderDesc: "Dine-in, pickup, or delivery. Place your order directly from the digital menu in seconds.",
  dinerLanguage: "Your Language, Your Way",
  dinerLanguageDesc: "Menus in English, French, and Arabic with full RTL support. Every dish, in your language.",
  // Owner features
  ownerQr: "QR Codes That Impress",
  ownerQrDesc: "Generate branded QR codes in 5 templates. Download as PNG, SVG, or print-ready PDF.",
  ownerAi: "AI-Powered Content",
  ownerAiDesc: "Auto-generate dish descriptions, translate menus, and estimate nutrition with built-in AI.",
  ownerAnalytics: "Know Your Business",
  ownerAnalyticsDesc: "Track orders, revenue, popular dishes, and customer behavior with real-time analytics.",
},
```

**Step 2: Update the features section**

Rewrite the features array to have 6 cards (3 diner + 3 owner). Add subtle Moroccan arch-top styling via `overflow-hidden` + a top gradient stripe using Moroccan colors. Use an `<svg>` zellige divider between the diner and owner card groups.

Update section badge text: "Why FeastQR?"
Update section heading: "For diners and restaurant owners alike"

**Step 3: Commit**

```bash
git add src/pageComponents/LandingPage/LandingPage.page.tsx src/i18n/locales/en/common.ts src/i18n/locales/fr/common.ts src/i18n/locales/ar/common.ts
git commit -m "feat(landing): dual-audience feature cards with arch-top Moroccan styling"
```

---

## Task 5: Landing Page — "Taste of Morocco" Section (Replaces Showcase)

**Files:**
- Modify: `src/pageComponents/LandingPage/LandingPage.page.tsx`
- Modify: `src/i18n/locales/en/common.ts` (+ fr, ar)

**Step 1: Add i18n keys**

```ts
tasteOfMorocco: {
  title: "Taste of Morocco",
  subtitle: "Explore restaurants across Morocco's vibrant cities",
  casablanca: "Casablanca",
  marrakech: "Marrakech",
  rabat: "Rabat",
  fes: "Fes",
  tangier: "Tangier",
  agadir: "Agadir",
  viewAll: "Explore All Cities",
},
```

**Step 2: Replace the desktop showcase and mobile showcase sections**

Remove the static Image showcase sections. Replace with a "Taste of Morocco" interactive city grid:
- 6 city cards using CSS gradient backgrounds (unique warm gradient per city)
- Each card links to `/explore/{citySlug}`
- Cards have Moroccan arch-top shape via clip-path
- Cuisine tags underneath each city
- "Explore All Cities" CTA linking to `/explore`
- Zellige divider at section top
- Sand background

**Step 3: Commit**

```bash
git add src/pageComponents/LandingPage/LandingPage.page.tsx src/i18n/locales/en/common.ts src/i18n/locales/fr/common.ts src/i18n/locales/ar/common.ts
git commit -m "feat(landing): 'Taste of Morocco' city showcase replacing static screenshots"
```

---

## Task 6: Landing Page — Testimonials + Pricing + CTA Moroccan Polish

**Files:**
- Modify: `src/pageComponents/LandingPage/LandingPage.page.tsx`
- Modify: `src/pageComponents/LandingPage/molecules/PricingSection.tsx`

**Step 1: Update testimonials section**

- Add `zellige-divider` class to the section wrapper
- Add a subtle `moroccan-geo` overlay at 3% opacity behind the cards
- Testimonial cards get a top gradient stripe (2px) in ember → gold
- Keep all existing functionality and i18n keys

**Step 2: Update pricing section**

- Add `zellige-divider` class at section top
- Popular plan card gets a subtle arch-shaped top decoration (CSS `border-radius` trick with a colored header bar)
- Add `bg-sand` to the section background
- Keep all pricing functionality identical

**Step 3: Update final CTA section**

- Add `moroccan-geo` pattern overlay at low opacity
- Change heading copy to be dual-audience: "Ready to explore — or create your menu?"
- Add two CTAs: "Explore Restaurants" (outline) + "Create Your Menu" (primary)
- Update i18n keys accordingly

**Step 4: Commit**

```bash
git add src/pageComponents/LandingPage/LandingPage.page.tsx src/pageComponents/LandingPage/molecules/PricingSection.tsx src/i18n/locales/en/common.ts src/i18n/locales/fr/common.ts src/i18n/locales/ar/common.ts
git commit -m "feat(landing): Moroccan polish on testimonials, pricing arch-tops, dual CTA"
```

---

## Task 7: Footer Redesign — Zellige Border + Richer Content

**Files:**
- Modify: `src/pageComponents/LandingPage/molecules/Footer.tsx`
- Modify: `src/i18n/locales/en/common.ts` (+ fr, ar)

**Step 1: Add new i18n keys**

```ts
footer: {
  // ... existing keys ...
  popularCities: "Popular Cities",
  casablanca: "Casablanca",
  marrakech: "Marrakech",
  rabat: "Rabat",
  fes: "Fes",
  explore: "Explore",
  tagline: "Morocco's Digital Menu Platform",
},
```

**Step 2: Redesign footer**

- Add `zellige-divider` class to footer element (decorative top border)
- Change background to `bg-sand`
- Add a "Popular Cities" column with links to `/explore/{city}`
- Add "Explore" link to the Product column
- Add tagline below logo: "Morocco's Digital Menu Platform"
- Add subtle 8-pointed star SVG decoration near the logo

**Step 3: Commit**

```bash
git add src/pageComponents/LandingPage/molecules/Footer.tsx src/i18n/locales/en/common.ts src/i18n/locales/fr/common.ts src/i18n/locales/ar/common.ts
git commit -m "feat(footer): zellige border, sand bg, Popular Cities column"
```

---

## Task 8: Navbar — Dual-Audience Navigation

**Files:**
- Modify: `src/components/Navbar/Navbar.tsx`

**Step 1: Update navbar items for logged-out users**

Change the navbar items array. When not logged in, show:
- Home
- Explore (with MapPin icon, slightly more prominent)
- For Restaurants (links to `/#features`)

When logged in, keep existing nav items (Dashboard, Restaurants, Analytics).

Remove the conditional that shows dashboard-related items to non-logged-in users.

**Step 2: Commit**

```bash
git add src/components/Navbar/Navbar.tsx
git commit -m "feat(navbar): dual-audience nav — Explore prominent, 'For Restaurants' for visitors"
```

---

## Task 9: Explore Page — Warm Moroccan Hero + Premium Cards

**Files:**
- Modify: `src/pageComponents/Explore/Explore.page.tsx`
- Modify: `src/pageComponents/Explore/molecules/RestaurantCard.tsx`
- Modify: `src/i18n/locales/en/common.ts` (+ fr, ar)

**Step 1: Update Explore hero section**

- Change hero background from `bg-muted/40` to warm gradient using sand tones
- Add `moroccan-geo` pattern overlay at low opacity
- Give the search bar a subtle arch-frame styling (softer rounded corners, warm shadow)
- Add a decorative 8-pointed star SVG near the title

**Step 2: Upgrade city cards in FeaturedCitiesSection**

- Replace generic `gradients` array with warm Moroccan-inspired gradients:
  - Casablanca: amber → terracotta
  - Marrakech: ember → gold
  - Rabat: sage → mint
  - etc.
- Add hover zoom effect on cards (already present but enhance with glow)

**Step 3: Upgrade cuisine chips in CuisineSection**

- Colored icon backgrounds per cuisine type (not just primary)
- Slight arch-shape on the chip using `rounded-t-xl`

**Step 4: Add rank styling to TrendingSection**

- Rank 1: gold badge with crown icon
- Rank 2: silver badge
- Rank 3: bronze badge
- 4+: numbered badge

**Step 5: Upgrade CTA banner**

- Add `moroccan-geo` overlay
- Use warm copy: "List your restaurant — reach food lovers across Morocco"

**Step 6: Commit**

```bash
git add src/pageComponents/Explore/Explore.page.tsx src/pageComponents/Explore/molecules/RestaurantCard.tsx src/i18n/locales/en/common.ts src/i18n/locales/fr/common.ts src/i18n/locales/ar/common.ts
git commit -m "feat(explore): Moroccan warm hero, premium city cards, rank badges"
```

---

## Task 10: Auth Pages — Moroccan Visual Panels

**Files:**
- Modify: `src/pageComponents/Login/Login.page.tsx`
- Modify: `src/pageComponents/Register/Register.page.tsx`
- Modify: `src/pageComponents/ResetPasswordPage/ResetPassword.page.tsx`

**Step 1: Create a shared AuthVisualPanel component**

Create `src/components/AuthVisualPanel.tsx`:

This replaces the identical right-panel code in all 3 auth pages. It shows:
- Moroccan geometric pattern background instead of plain gradient orbs
- CSS tagine art with steam (simplified version of MoroccanFoodArt)
- 8-pointed star decorative SVGs
- Arch-framed content area
- Feature pills (QR Menus, Multi-Language, AI-Powered)
- Unique title/description per page (passed as props)

**Step 2: Update Login.page.tsx**

- Replace right panel with `<AuthVisualPanel title={...} description={...} icon={ChefHat} />`
- Add warm mobile background with `moroccan-geo` pattern
- More breathing room on form side

**Step 3: Update Register.page.tsx**

- Same treatment — use `<AuthVisualPanel title={...} description={...} icon={Sparkles} />`

**Step 4: Update ResetPassword.page.tsx**

- Same treatment — use `<AuthVisualPanel title={...} description={...} icon={KeyRound} />`

**Step 5: Run type check**

Run: `pnpm check-types`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/AuthVisualPanel.tsx src/pageComponents/Login/Login.page.tsx src/pageComponents/Register/Register.page.tsx src/pageComponents/ResetPasswordPage/ResetPassword.page.tsx
git commit -m "feat(auth): shared AuthVisualPanel with Moroccan art + geometric patterns"
```

---

## Task 11: i18n — Complete French and Arabic Translations

**Files:**
- Modify: `src/i18n/locales/fr/common.ts`
- Modify: `src/i18n/locales/ar/common.ts`

**Step 1: Add all new French translations**

Translate all new keys added in Tasks 3-9:
- `landing.hero.*` (updated diner-focused keys)
- `landing.features.*` (dual-audience feature keys)
- `landing.tasteOfMorocco.*`
- `landing.cta.*` (dual-audience CTA)
- `footer.*` (new keys)
- `explore.*` (updated keys)

**Step 2: Add all new Arabic translations**

Same keys translated to Arabic. Ensure RTL-appropriate text.

**Step 3: Run type check**

Run: `pnpm check-types`
Expected: PASS (French and Arabic files validated by Resources type)

**Step 4: Commit**

```bash
git add src/i18n/locales/fr/common.ts src/i18n/locales/ar/common.ts
git commit -m "feat(i18n): complete FR + AR translations for Modern Marrakech redesign"
```

---

## Task 12: Build Verification + Test Fixes

**Files:**
- Possibly modify test files if snapshots break
- Possibly modify any component with type errors

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass. Fix any failures from changed component props/structure.

**Step 2: Run production build**

Run: `rm -rf .next && pnpm build`
Expected: 45 routes, zero errors.

**Step 3: Run ESLint**

Run: `pnpm lint`
Expected: Zero errors, zero warnings.

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve test + build issues from Modern Marrakech redesign"
```

---

## Summary of Files Modified

| File | Action |
|------|--------|
| `src/styles/globals.css` | Add tokens + Moroccan CSS utilities |
| `tailwind.config.ts` | Add sand/indigo/mint colors |
| `src/pageComponents/LandingPage/molecules/MoroccanFoodArt.tsx` | NEW — CSS food art |
| `src/pageComponents/LandingPage/LandingPage.page.tsx` | Major rewrite — all sections |
| `src/pageComponents/LandingPage/molecules/PricingSection.tsx` | Arch-top + sand bg |
| `src/pageComponents/LandingPage/molecules/Footer.tsx` | Zellige border + new columns |
| `src/components/Navbar/Navbar.tsx` | Dual-audience nav items |
| `src/pageComponents/Explore/Explore.page.tsx` | Warm hero + premium cards |
| `src/pageComponents/Explore/molecules/RestaurantCard.tsx` | Rank badge styling |
| `src/components/AuthVisualPanel.tsx` | NEW — shared auth visual panel |
| `src/pageComponents/Login/Login.page.tsx` | Moroccan visual panel |
| `src/pageComponents/Register/Register.page.tsx` | Moroccan visual panel |
| `src/pageComponents/ResetPasswordPage/ResetPassword.page.tsx` | Moroccan visual panel |
| `src/i18n/locales/en/common.ts` | New + updated translation keys |
| `src/i18n/locales/fr/common.ts` | French translations |
| `src/i18n/locales/ar/common.ts` | Arabic translations |
