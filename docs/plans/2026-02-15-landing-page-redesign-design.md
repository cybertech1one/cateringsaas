# Landing Page Redesign — "Digital Riad" Design

## Context
FeastQR's landing page needs to compete with top-tier funded SaaS products. Current page is functional but not memorable.

## Design Direction
**"Digital Riad"** — Warm luxury with Moroccan-inspired palette meets modern SaaS polish. Animated hero mockup is the differentiator.

## User Requirements
- Target: Top-tier funded startup quality (no specific competitor to copy)
- Tone: Warm luxury — terracotta, gold, cream palette with modern SaaS polish
- Primary CTA: Sign up free (/register)
- Hero visual: Animated CSS mockup showing menu creation flow

## 2026 SaaS Trends Applied
1. Story-driven hero with animation (animated mockup)
2. Micro-animations with purpose (card-glow, hover lifts)
3. Playful typography + bold color system (Playfair Display + gradient text)
4. Modular layout system (bento grid)
5. Real product contexts (actual dashboard-like mockup)

## Section Design

### 1. Hero — Animated Menu Builder Mockup
- **Layout**: Two-column split (60/40). Left = copy + CTA. Right = animated CSS mockup.
- **Left**: Pill badge (shimmer) > H1 with gradient text > subtitle > 2 CTAs > trust row
- **Right**: macOS device frame containing animated mini-dashboard:
  - Menu card slides in from right
  - Stars animate (review rating)
  - QR code fades in
  - "Published!" badge pulses
  - Loops every ~8s, pure CSS keyframes
- **Background**: Gradient mesh (radial gradients), geo dot pattern, grain texture
- **Height**: min-h-[90vh]

### 2. Social Proof Bar
- Thin border-y strip with 4 stats: Free Forever, Zero Commission, 3 Languages, SSL Encrypted
- Icons + labels in a 4-column grid

### 3. Features — Asymmetric Bento Grid
- Pill badge header + gradient underline
- 3-column grid, first card spans 2 cols + 2 rows
- 6 feature cards with: gradient accent hover, card-glow effect, icon containers, -translate-y-1 lift
- Colors: primary, terracotta, sage, gold, espresso per card

### 4. How It Works — 3 Steps
- Pill badge header
- 3-column grid with oversized step numbers (6xl, 10% opacity)
- Icon circles with color-coded borders
- Gradient connecting line on desktop

### 5. Desktop Showcase
- Side-by-side: screenshot left, copy right
- Image: blur glow, scale-on-hover, border frame
- Pill badge + CTA button

### 6. Mobile Showcase (Dark Section)
- bg-espresso with gradient orbs
- Phone mockup: rounded frame, notch, border
- Feature pills (rounded-full, bg-white/5)
- Gradient text on headline line 2

### 7. Testimonials — Editorial Cards
- 3 cards: large decorative quote (6% opacity), stars, bold quote text, border-top author section
- gradient-border avatar, card-glow hover

### 8-10. Pricing / Comparison / FAQ
- Keep existing molecules unchanged
- Fix: PricingSection text-muted-foreground/70 -> text-muted-foreground

### 11. Explore Directory
- Pill badge header, city cards with card-glow, larger gradient icon containers

### 12. Final CTA
- Gradient card, dot-grid pattern, large background blurs, strong CTA

## New CSS Utilities
- `hero-mesh` — multi-radial gradient mesh
- `geo-pattern` — geometric dot grid overlay
- `gradient-border` — mask-composite gradient border
- `card-glow` — blurred glow on hover
- `stat-shimmer` — stats shimmer
- `animate-delay-600/700`
- Keyframes: scaleIn, slideInLeft, drawLine

## Files to Modify
- `src/pageComponents/LandingPage/LandingPage.page.tsx` — main rewrite
- `src/pageComponents/LandingPage/molecules/HeroMockup.tsx` — NEW animated mockup component
- `src/pageComponents/LandingPage/molecules/PricingSection.tsx` — text contrast fix
- `src/styles/globals.css` — new CSS utilities
- `tailwind.config.ts` — new keyframes/animations

## Constraints
- Keep ALL existing i18n keys (don't break translations)
- Keep existing molecules (FAQ, Pricing, Comparison, Footer)
- Pure CSS animations (no JS animation libraries)
- Must work with RTL (Arabic)
- Must maintain existing Tailwind color system
