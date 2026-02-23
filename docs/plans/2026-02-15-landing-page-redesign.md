# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Diyafa landing page into a world-class "Digital Riad" design with animated hero mockup, asymmetric bento features, and warm luxury aesthetic.

**Architecture:** Server component page (`LandingPage.page.tsx`) with one new client component (`HeroMockup.tsx`) for CSS-animated interactive preview. All other sections are server-rendered. Existing molecule components (FAQ, Pricing, Comparison, Footer) unchanged.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, lucide-react icons, pure CSS keyframe animations (no JS animation libraries).

---

## Current State

The prior session already completed most of the work:
- `globals.css` — new CSS utilities added (hero-mesh, geo-pattern, gradient-border, card-glow)
- `tailwind.config.ts` — new keyframes added (scale-in, slide-up, draw-line)
- `PricingSection.tsx` — text contrast fixed (text-muted-foreground/70 -> text-muted-foreground)
- `LandingPage.page.tsx` — fully rewritten with 2-col hero, bento grid, editorial testimonials, phone mockup, etc.

**What remains:** The hero section uses a static screenshot. The approved design calls for an **animated CSS mockup** showing a menu being built. This is the key differentiator.

---

### Task 1: Create the Animated Hero Mockup Component

**Files:**
- Create: `src/pageComponents/LandingPage/molecules/HeroMockup.tsx`

**Step 1: Create the HeroMockup client component**

This is a `"use client"` component that renders a stylized mini-dashboard inside a macOS device frame. It uses pure CSS keyframes to animate:

1. A restaurant header appearing (fade-in)
2. Three dish cards sliding in from the right (staggered, 0.5s apart)
3. A star rating appearing on the second card
4. A QR code icon fading in at bottom-right
5. A "Published!" badge pulsing in the top-right
6. The animation loops every 10s

```tsx
// src/pageComponents/LandingPage/molecules/HeroMockup.tsx
"use client";

import { QrCode, Star, Check, ImageIcon } from "lucide-react";

export function HeroMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-elevated">
      {/* Browser chrome bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-card border-b border-border/30" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        <div className="ml-3 flex-1 h-6 rounded-md bg-muted/50 max-w-[200px]" />
      </div>

      {/* Dashboard mockup content */}
      <div className="relative bg-background p-4 sm:p-6 min-h-[280px] sm:min-h-[340px] overflow-hidden">
        {/* Sidebar hint */}
        <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-14 bg-card border-r border-border/30 flex flex-col items-center gap-3 pt-4" aria-hidden="true">
          <div className="h-6 w-6 rounded bg-primary/10" />
          <div className="h-6 w-6 rounded bg-muted/30" />
          <div className="h-6 w-6 rounded bg-muted/30" />
        </div>

        {/* Main content area */}
        <div className="ml-12 sm:ml-16">
          {/* Restaurant header — fades in */}
          <div className="mockup-fade-in mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">R</span>
              </div>
              <div>
                <div className="h-4 w-32 rounded bg-foreground/80 mb-1" />
                <div className="h-2.5 w-20 rounded bg-muted-foreground/30" />
              </div>
            </div>
          </div>

          {/* Dish cards — slide in staggered */}
          <div className="space-y-2.5">
            {/* Card 1 */}
            <div className="mockup-slide-in-1 flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-primary/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-3.5 w-28 rounded bg-foreground/70 mb-1.5" />
                <div className="h-2.5 w-full max-w-[140px] rounded bg-muted-foreground/20" />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="h-3.5 w-12 rounded bg-primary/60" />
              </div>
            </div>

            {/* Card 2 — with star rating */}
            <div className="mockup-slide-in-2 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.02] p-3 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-terracotta/10 to-gold/10 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-terracotta/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-3.5 w-24 rounded bg-foreground/70 mb-1.5" />
                <div className="mockup-stars flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-gold text-gold" />
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="h-3.5 w-14 rounded bg-primary/60" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="mockup-slide-in-3 flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-sage/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-sage/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-3.5 w-20 rounded bg-foreground/70 mb-1.5" />
                <div className="h-2.5 w-full max-w-[120px] rounded bg-muted-foreground/20" />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="h-3.5 w-10 rounded bg-primary/60" />
              </div>
            </div>
          </div>

          {/* QR code icon — fades in after cards */}
          <div className="mockup-qr-appear absolute bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-xl border border-border/40 bg-card shadow-soft flex items-center justify-center">
            <QrCode className="h-7 w-7 text-primary" />
          </div>

          {/* Published badge — pulses */}
          <div className="mockup-published absolute top-4 right-4 sm:top-6 sm:right-16 inline-flex items-center gap-1.5 rounded-full bg-sage/10 border border-sage/20 px-3 py-1">
            <Check className="h-3.5 w-3.5 text-sage" />
            <span className="text-xs font-semibold text-sage">Published</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add HeroMockup CSS animations to globals.css**

Append these animation classes to the `@layer utilities` section in `src/styles/globals.css`:

```css
/* Hero mockup animations — loop every 10s */
.mockup-fade-in {
  animation: fadeUp 0.6s ease-out 0.3s both;
}
.mockup-slide-in-1 {
  animation: mockupSlideIn 0.5s ease-out 0.8s both;
}
.mockup-slide-in-2 {
  animation: mockupSlideIn 0.5s ease-out 1.3s both;
}
.mockup-slide-in-3 {
  animation: mockupSlideIn 0.5s ease-out 1.8s both;
}
.mockup-stars {
  animation: fadeUp 0.4s ease-out 2.0s both;
}
.mockup-qr-appear {
  animation: scaleIn 0.4s ease-out 2.4s both;
}
.mockup-published {
  animation: mockupPublished 2s ease-in-out 2.8s both;
}
```

And add these keyframes below the existing ones:

```css
@keyframes mockupSlideIn {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes mockupPublished {
  0% { opacity: 0; transform: scale(0.8); }
  20% { opacity: 1; transform: scale(1.05); }
  40% { opacity: 1; transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}
```

**Step 3: Verify CSS parses correctly**

Run: `pnpm check-types`
Expected: zero errors

---

### Task 2: Wire HeroMockup into LandingPage Hero Section

**Files:**
- Modify: `src/pageComponents/LandingPage/LandingPage.page.tsx` (lines 266-300)

**Step 1: Replace the static hero image with the animated mockup**

At the top of the file, replace the `heroImage` static import with the HeroMockup dynamic import:

Remove: `import heroImage from "~/assets/hero.png";`

Add:
```tsx
const HeroMockup = dynamic(
  () => import("./molecules/HeroMockup").then((m) => ({ default: m.HeroMockup })),
  {
    loading: () => (
      <div className="rounded-2xl border border-border/40 bg-card shadow-elevated overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 bg-card border-b border-border/30">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="bg-background min-h-[340px] animate-pulse" />
      </div>
    ),
    ssr: false,
  },
);
```

Then replace the entire `{/* Right Column — Hero Image with Device Frame */}` block (lines ~266-300) with:

```tsx
{/* Right Column — Animated Mockup */}
<div className="animate-fade-up animate-delay-300 relative">
  <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-primary/10 via-gold/5 to-terracotta/5 blur-3xl" />
  <div className="absolute -top-4 -left-4 h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-float hidden md:flex z-20" aria-hidden="true">
    <QrCode className="h-7 w-7 text-primary" />
  </div>
  <div className="absolute -bottom-3 -right-3 h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center animate-float hidden md:flex z-20" style={{ animationDelay: "1.5s" }} aria-hidden="true">
    <BarChart3 className="h-6 w-6 text-gold" />
  </div>
  <div className="absolute top-1/3 -right-6 h-10 w-10 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center animate-float hidden lg:flex z-20" style={{ animationDelay: "0.8s" }} aria-hidden="true">
    <Globe className="h-5 w-5 text-sage" />
  </div>
  <div className="relative z-10">
    <HeroMockup />
  </div>
</div>
```

**Step 2: Verify build**

Run: `pnpm check-types && SKIP_ENV_VALIDATION=1 npx next lint`
Expected: zero errors, zero warnings

**Step 3: Commit**

```bash
git add src/pageComponents/LandingPage/molecules/HeroMockup.tsx \
        src/pageComponents/LandingPage/LandingPage.page.tsx \
        src/styles/globals.css
git commit -m "feat: add animated hero mockup to landing page"
```

---

### Task 3: Full Verification & Final Commit

**Files:**
- All modified files from Tasks 1-2

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: 1777+ tests pass, 60 files

**Step 2: Production build**

Run: `rm -rf .next && pnpm build`
Expected: 45 routes pass, zero errors

**Step 3: Visual check**

Open `http://localhost:3000` in browser and verify:
- Hero: two-column layout, animated mockup on right with cards sliding in
- Social proof bar visible below hero
- Bento grid features with hover glow effects
- Phone mockup in dark section
- Editorial testimonials with large quotes
- All existing sections still present

**Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete Digital Riad landing page redesign

- Animated hero mockup (pure CSS, menu cards + QR + published badge)
- Asymmetric bento grid features with card-glow hover effects
- Editorial testimonial cards with gradient borders
- Phone mockup with notch and frame in dark section
- New CSS utilities: hero-mesh, geo-pattern, gradient-border, card-glow
- Text contrast fix in PricingSection (WCAG AA)
- Gradient mesh background + geometric dot pattern
- Warm luxury palette (terracotta, gold, sage, cream)"
```

---

## Summary

| Task | What | Effort |
|------|------|--------|
| 1 | Create HeroMockup.tsx + CSS animations | 15 min |
| 2 | Wire HeroMockup into hero, remove static image | 5 min |
| 3 | Full verification + commit | 5 min |

Total: ~25 minutes. All CSS utilities, Tailwind config, bento grid, testimonials, phone mockup, and PricingSection fix are already done from the prior session.
