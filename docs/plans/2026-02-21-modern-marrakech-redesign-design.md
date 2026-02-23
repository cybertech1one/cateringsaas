# Modern Marrakech - External Pages Redesign

**Date**: 2026-02-21
**Status**: Approved
**Branch**: feat/sprint3-customer-facing-redesign

## Vision

Transform Diyafa's external-facing pages from a generic SaaS template into a distinctive, dual-audience experience that blends modern web design with subtle Moroccan visual identity. Attract both diners (exploring restaurants) and restaurant owners (building menus).

## Design Decisions

- **Audience**: Dual — diners first, restaurant owners second
- **Moroccan identity**: Subtle accents (zellige dividers, arch shapes, 8-pointed stars) not full immersive
- **Imagery**: CSS/SVG art + gradients (no stock photos, fast loading, unique identity)
- **Scope**: All external pages — Landing, Explore, Login, Register, Reset Password, Footer, Navbar

## Color Palette (Additions to Existing)

Existing tokens remain (ember, terracotta, gold, sage, cream, espresso). New additions:

```css
--sand: 36 33% 96%;       /* Warm section backgrounds */
--sand-dark: 36 20% 90%;  /* Slightly deeper sand */
--indigo: 228 45% 20%;    /* Deep dark sections */
--mint: 160 40% 55%;      /* Fresh accent (Moroccan tea) */
```

## Moroccan Visual Elements

1. **Zellige SVG dividers**: Geometric tile pattern as section separators, 2-3% opacity
2. **Moorish arch shapes**: CSS border-radius trick for card tops, hero frames
3. **8-pointed star**: SVG decorative element near section headers
4. **Geometric dot patterns**: Replace plain grid overlay in hero sections

## Pages

### 1. Landing Page

**Hero (Dual-Audience)**:
- Warm light background (replacing dark hero-mesh)
- Left: "Taste the Best of Morocco" headline, diner-focused subtitle, dual CTAs (Explore + Browse Menus)
- Right: CSS art panel — tagine, mint tea, couscous made of gradients + shapes
- Below: Subtle owner CTA strip — "Own a restaurant? Create your free menu"
- Geometric pattern background at low opacity

**Social Proof Bar**:
- Reframe as diner metrics: "500+ restaurants", "12 cities", "50,000+ dishes"
- Keep clean stat row design with colored icons

**Features Section**:
- Reframe as "Why Diyafa?" for both audiences
- Cards with arch-top borders (subtle CSS border-radius)
- 3 diner cards + 3 owner cards

**"Taste of Morocco" Section** (replaces showcase):
- City showcase cards with gradient overlays
- Cuisine type chips
- Links to /explore

**Testimonials**:
- Arch-framed cards
- Background pattern accent
- Keep existing 3-card grid

**Pricing**:
- Arch-top card borders
- Subtle geometric background pattern
- Keep functionality identical

**Directory CTA**:
- Upgrade to immersive city preview
- Warm gradient background

**Final CTA**:
- Keep dark section but add geometric SVG pattern overlay
- Warmer, more inviting copy

### 2. Explore Page

- Hero: Full-width warm gradient, prominent search with arch-frame styling
- City cards: Premium hover effects, gradient overlays
- Cuisine chips: Colored icon backgrounds, better spacing
- Trending: Gold/silver/bronze rank styling
- CTA banner: CSS food art accent

### 3. Auth Pages (Login, Register, Reset Password)

- Keep split layout
- Right panel: CSS art food scene (tagine steam, geometric patterns) replacing gradient orbs
- Form side: More breathing room, cleaner spacing
- Arch frame on visual panel

### 4. Navbar

- Keep glass morphism blur
- Make "Explore" more prominent
- Logged-out nav: Explore | For Restaurants | Login
- Subtle geometric accent

### 5. Footer

- Zellige SVG pattern border at top
- Richer content: Popular Cities links, social links area
- Warm background tone (sand)

## Typography

No changes — Playfair Display (headings) + DM Sans (body) + Noto Sans Arabic (RTL) are already elegant.

## Animation

- Floating food art elements (reuse existing float keyframe)
- Fade-up on scroll (existing)
- Subtle parallax on hero geometric patterns
- Hover lift on cards (existing)

## Technical Notes

- All Moroccan elements are CSS/SVG — no image assets needed
- New CSS custom properties for sand, indigo, mint colors
- SVG patterns inlined as data URIs in CSS (same approach as existing bg-grain)
- Responsive: all elements work mobile-first
- i18n: all new copy needs EN/FR/AR translations
- Performance: no external resources, all CSS-based
