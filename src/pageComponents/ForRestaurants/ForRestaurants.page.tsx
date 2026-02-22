import { Navbar } from "~/components/Navbar/Navbar";
import { Footer } from "~/pageComponents/LandingPage/molecules/Footer";
import { useServerTranslation } from "~/i18n";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ScrollReveal } from "~/components/animations/ScrollReveal";
import { AnimatedCounter } from "~/components/animations/AnimatedCounter";
import { Marquee } from "~/components/animations/Marquee";
import {
  QrCode,
  Sparkles,
  BarChart3,
  Languages,
  ShoppingBag,
  Truck,
  ArrowRight,
  Shield,
  ChefHat,
  DollarSign,
  Users,
  Zap,
  Ban,
  Palette,
  Utensils,
  CheckCircle2,
} from "lucide-react";

const PricingSection = dynamic(
  () =>
    import("~/pageComponents/LandingPage/molecules/PricingSection").then(
      (m) => ({ default: m.PricingSection }),
    ),
  { loading: () => <div className="py-24" /> },
);

const ComparisonSection = dynamic(
  () =>
    import("~/pageComponents/LandingPage/molecules/ComparisonSection").then(
      (m) => ({ default: m.ComparisonSection }),
    ),
  { loading: () => <div className="py-24" /> },
);

const FAQSection = dynamic(
  () =>
    import("~/pageComponents/LandingPage/molecules/FAQSection").then((m) => ({
      default: m.FAQSection,
    })),
  { loading: () => <div className="py-24" /> },
);

/* ────────────────────────────────────────────────────────────── */
/* Page Component                                                */
/* ────────────────────────────────────────────────────────────── */

export const ForRestaurantsPage = async () => {
  const { t: _t } = await useServerTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  /* ────────────────────────────────────────────────────────────── */
  /* Feature data                                                  */
  /* ────────────────────────────────────────────────────────────── */

  const features = [
    {
      icon: QrCode,
      title: t("forRestaurants.features.qrTitle"),
      description: t("forRestaurants.features.qrDesc"),
    },
    {
      icon: Sparkles,
      title: t("forRestaurants.features.aiTitle"),
      description: t("forRestaurants.features.aiDesc"),
    },
    {
      icon: BarChart3,
      title: t("forRestaurants.features.analyticsTitle"),
      description: t("forRestaurants.features.analyticsDesc"),
    },
    {
      icon: Languages,
      title: t("forRestaurants.features.languagesTitle"),
      description: t("forRestaurants.features.languagesDesc"),
    },
    {
      icon: ShoppingBag,
      title: t("forRestaurants.features.orderingTitle"),
      description: t("forRestaurants.features.orderingDesc"),
    },
    {
      icon: Truck,
      title: t("forRestaurants.features.deliveryTitle"),
      description: t("forRestaurants.features.deliveryDesc"),
    },
  ];

  /* ────────────────────────────────────────────────────────────── */
  /* How it works steps                                            */
  /* ────────────────────────────────────────────────────────────── */

  const howItWorksSteps = [
    {
      num: 1,
      title: t("forRestaurants.howItWorks.step1Title"),
      description: t("forRestaurants.howItWorks.step1Desc"),
    },
    {
      num: 2,
      title: t("forRestaurants.howItWorks.step2Title"),
      description: t("forRestaurants.howItWorks.step2Desc"),
    },
    {
      num: 3,
      title: t("forRestaurants.howItWorks.step3Title"),
      description: t("forRestaurants.howItWorks.step3Desc"),
    },
    {
      num: 4,
      title: t("forRestaurants.howItWorks.step4Title"),
      description: t("forRestaurants.howItWorks.step4Desc"),
    },
  ];

  /* ────────────────────────────────────────────────────────────── */
  /* Pain points                                                   */
  /* ────────────────────────────────────────────────────────────── */

  const painPoints = [
    {
      icon: DollarSign,
      title: t("forRestaurants.problem.pain1Title"),
      description: t("forRestaurants.problem.pain1Desc"),
    },
    {
      icon: Users,
      title: t("forRestaurants.problem.pain2Title"),
      description: t("forRestaurants.problem.pain2Desc"),
    },
    {
      icon: Ban,
      title: t("forRestaurants.problem.pain3Title"),
      description: t("forRestaurants.problem.pain3Desc"),
    },
  ];

  /* ────────────────────────────────────────────────────────────── */
  /* Marquee trust items                                           */
  /* ────────────────────────────────────────────────────────────── */

  const marqueeItems = [
    "Zero Commission",
    "30+ Templates",
    "AI-Powered",
    "Multi-Language",
    "QR Codes",
    "Real-time Analytics",
    "Online Ordering",
    "Delivery Platform",
    "Loyalty System",
    "Kitchen Display",
  ];

  return (
    <div>
      <Navbar />
      <main id="main-content" className="overflow-hidden">
        {/* ============================================================ */}
        {/* HERO -- Vibrant warm gradient with dashboard mockup           */}
        {/* ============================================================ */}
        <section className="relative flex min-h-[85vh] items-center overflow-hidden hero-vibrant">
          <div className="hero-bg-pattern absolute inset-0" aria-hidden="true" />
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-ember/[0.06] blur-[100px]" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gold/[0.08] blur-[80px]" aria-hidden="true" />
          <div className="absolute top-1/3 left-1/2 h-[300px] w-[300px] rounded-full bg-sage/[0.04] blur-[100px]" aria-hidden="true" />

          <div className="container relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left -- Copy */}
              <div className="max-w-2xl">
                {/* Badge -- pill style */}
                <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-ember/20 bg-ember/[0.06] px-4 py-1.5 text-sm font-medium text-ember">
                  <Zap className="h-3.5 w-3.5" />
                  {t("forRestaurants.hero.badge")}
                </div>

                <h1 className="animate-fade-up animate-delay-100 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-[4.25rem]">
                  {t("forRestaurants.hero.title")}{" "}
                  <span className="text-gradient">{t("forRestaurants.hero.titleHighlight")}</span>
                </h1>

                <p className="animate-fade-up animate-delay-200 mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {t("forRestaurants.hero.subtitle")}
                </p>

                {/* CTA Buttons */}
                <div className="animate-fade-up animate-delay-300 mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/register"
                    aria-label="Create your free menu - sign up"
                    className="group hero-cta-primary inline-flex items-center justify-center gap-2.5 rounded-2xl bg-ember px-8 py-4 text-base font-semibold text-white shadow-lg shadow-ember/20 transition-all duration-300 hover:shadow-xl hover:shadow-ember/30 hover:-translate-y-0.5"
                  >
                    {t("forRestaurants.hero.ctaPrimary")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="#pricing"
                    aria-label="See pricing plans"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground/10 px-8 py-4 text-base font-semibold text-foreground transition-all duration-300 hover:border-ember/30 hover:bg-ember/[0.04]"
                  >
                    {t("forRestaurants.hero.ctaSecondary")}
                  </Link>
                </div>

                {/* Trust row */}
                <div className="animate-fade-up animate-delay-400 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("forRestaurants.hero.trustZeroCommission")}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("forRestaurants.hero.trustSetup")}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("forRestaurants.hero.trustLanguages")}
                  </span>
                </div>
              </div>

              {/* Right -- Dashboard mockup */}
              <div className="animate-fade-up animate-delay-200 relative hidden items-center justify-center lg:flex">
                <div className="relative w-full max-w-md">
                  {/* Ambient glow */}
                  <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-ember/8 via-transparent to-gold/8 blur-2xl" aria-hidden="true" />
                  {/* Mockup container */}
                  <div className="relative space-y-4 rounded-2xl border border-border/50 bg-background p-6 shadow-2xl shadow-black/5">
                    {/* Header bar */}
                    <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember/10">
                        <ChefHat className="h-4 w-4 text-ember" />
                      </div>
                      <div>
                        <div className="h-3 w-24 rounded-full bg-foreground/10" />
                        <div className="mt-1.5 h-2 w-16 rounded-full bg-foreground/5" />
                      </div>
                      <div className="ml-auto flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
                        <div className="h-2 w-2 rounded-full bg-amber-400/60" />
                        <div className="h-2 w-2 rounded-full bg-rose-400/60" />
                      </div>
                    </div>

                    {/* Menu item rows */}
                    {[
                      {
                        name: "Lamb Tagine",
                        price: "85 MAD",
                        rating: "4.9",
                        color: "bg-amber-500/15",
                        stars: 5,
                      },
                      {
                        name: "Royal Couscous",
                        price: "70 MAD",
                        rating: "4.7",
                        color: "bg-emerald-500/15",
                        stars: 4,
                      },
                      {
                        name: "Chicken Pastilla",
                        price: "55 MAD",
                        rating: "5.0",
                        color: "bg-rose-500/15",
                        stars: 5,
                      },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="rounded-xl border border-border/50 bg-muted/30 p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${item.color}`}
                          >
                            <div className="h-6 w-6 rounded-lg bg-foreground/10" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-foreground/80">
                                {item.name}
                              </span>
                              <span className="text-sm font-bold text-foreground/70">
                                {item.price}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {Array.from({ length: item.stars }).map(
                                (_, i) => (
                                  <div
                                    key={i}
                                    className="h-2 w-2 rounded-full bg-amber-400"
                                  />
                                ),
                              )}
                              {item.stars < 5 && (
                                <div className="h-2 w-2 rounded-full bg-foreground/10" />
                              )}
                              <span className="ml-1 text-xs text-muted-foreground">
                                {item.rating}
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-3/4 rounded-full bg-foreground/[0.04]" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Bottom stats */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <div className="text-center">
                        <p className="text-xs text-white/30">Orders</p>
                        <p className="text-sm font-bold text-white/70">247</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/30">Revenue</p>
                        <p className="text-sm font-bold text-emerald-400/80">
                          18,450 MAD
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/30">Rating</p>
                        <p className="text-sm font-bold text-amber-400/80">
                          4.8
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STATS BAR -- with AnimatedCounters                          */}
        {/* ============================================================ */}
        <section className="border-b border-border/40 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {/* Restaurants */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Utensils className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={500} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Restaurants
                  </p>
                </div>
                {/* Commission */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <DollarSign className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={0} suffix="%" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Commission
                  </p>
                </div>
                {/* Templates */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Palette className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={30} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Templates
                  </p>
                </div>
                {/* Languages */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Languages className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={3} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Languages
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* TRUST MARQUEE -- between Stats and Problem                   */}
        {/* ============================================================ */}
        <section className="border-b border-border/40 bg-background/50 py-4">
          <Marquee speed={35} pauseOnHover>
            {marqueeItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 whitespace-nowrap px-4 text-sm font-medium tracking-wide text-muted-foreground/50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-ember/30" />
                {item}
              </span>
            ))}
          </Marquee>
        </section>

        {/* ============================================================ */}
        {/* PROBLEM -- cards with hover effects + zellige divider        */}
        {/* ============================================================ */}
        <section className="zellige-divider noise-overlay bg-background px-4 py-16 sm:px-6 sm:py-20 md:py-28 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <ScrollReveal>
              <div className="mb-14">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("forRestaurants.problem.label")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("forRestaurants.problem.title")}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {t("forRestaurants.problem.subtitle")}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-3">
              {painPoints.map((point, idx) => (
                <ScrollReveal key={idx} delay={idx * 120}>
                  <div
                    className="card-3d group relative overflow-hidden rounded-2xl border border-destructive/10 bg-card p-8 transition-all duration-300 hover:border-destructive/20 hover:shadow-lg"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/[0.08]">
                      <point.icon className="h-6 w-6 text-destructive/70" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">
                      {point.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {point.description}
                    </p>
                    {/* Decorative number */}
                    <div className="absolute -bottom-4 -right-2 font-display text-8xl font-bold text-destructive/[0.04]">
                      {idx + 1}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Problem visual */}
            <ScrollReveal delay={200}>
              <div className="mt-10 relative overflow-hidden rounded-2xl h-48 sm:h-64">
                <Image
                  src="/images/landing/restaurant-interior.jpg"
                  alt="Restaurant interior"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1024px"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES -- Bento grid with mixed sizes                      */}
        {/* ============================================================ */}
        <section
          id="features"
          className="px-4 py-16 sm:px-6 sm:py-20 md:py-28 lg:px-8"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="mb-14">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("forRestaurants.features.label")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("forRestaurants.features.title")}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {t("forRestaurants.features.subtitle")}
                </p>
              </div>
            </ScrollReveal>

            {/* Row 1: QR Menus (2-col, large) + AI Content Engine (1-col) */}
            <ScrollReveal delay={100}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="card-3d arch-card-top group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04] md:col-span-2 sm:p-10 card-glow">
                  <div className="relative z-10">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                      <QrCode className="h-6 w-6 text-ember" />
                    </div>
                    <h3 className="mb-2.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                      {features[0]!.title}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {features[0]!.description}
                    </p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 h-40 w-60 opacity-[0.12] transition-opacity group-hover:opacity-[0.2] overflow-hidden rounded-xl sm:h-48 sm:w-72">
                    <Image
                      src="/images/landing/qr-scanning.jpg"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="288px"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <Sparkles className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[1]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[1]!.description}
                  </p>
                  {/* AI feature checklist */}
                  <div className="mt-5 flex flex-col gap-2">
                    {["Auto descriptions", "Menu translation", "Photo to menu"].map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-gold/50" />
                        <span className="text-muted-foreground">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Row 2: Multi-Language (1-col with language badges) + Online Ordering (2-col, large) */}
            <ScrollReveal delay={200}>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <Languages className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[3]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[3]!.description}
                  </p>
                  {/* Language badges */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["English", "Fran\u00e7ais", "\u0627\u0644\u0639\u0631\u0628\u064a\u0629"].map((lang) => (
                      <span
                        key={lang}
                        className="rounded-full bg-gold/[0.06] px-3 py-1 text-xs font-medium text-gold/70"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-3d border-gradient-spin group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-sand/30 p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04] md:col-span-2 sm:p-10 card-glow">
                  <div className="relative z-10">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                      <ShoppingBag className="h-6 w-6 text-ember" />
                    </div>
                    <h3 className="mb-2.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                      {features[4]!.title}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {features[4]!.description}
                    </p>
                    {/* Order type badges */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Dine-in", "Pickup", "Delivery"].map((mode) => (
                        <span
                          key={mode}
                          className="rounded-full bg-ember/[0.06] px-3 py-1 text-xs font-medium text-ember/70"
                        >
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 h-40 w-60 opacity-[0.12] transition-opacity group-hover:opacity-[0.2] overflow-hidden rounded-xl sm:h-48 sm:w-72">
                    <Image
                      src="/images/landing/phone-ordering.jpg"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="288px"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Row 3: Analytics + Delivery */}
            <ScrollReveal delay={300}>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-sage/20 hover:shadow-lg hover:shadow-sage/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sage/[0.08]">
                    <BarChart3 className="h-6 w-6 text-sage" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[2]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[2]!.description}
                  </p>
                  <div className="absolute -bottom-4 -right-2 opacity-[0.04] transition-opacity group-hover:opacity-[0.07]">
                    <BarChart3 className="h-40 w-40 rotate-6" />
                  </div>
                </div>

                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                    <Truck className="h-6 w-6 text-ember" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[5]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[5]!.description}
                  </p>
                  <div className="absolute -bottom-4 -right-2 opacity-[0.04] transition-opacity group-hover:opacity-[0.07]">
                    <Truck className="h-40 w-40 -rotate-6" />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* HOW IT WORKS -- connecting line + hover-lift cards            */}
        {/* ============================================================ */}
        <section className="noise-overlay bg-background px-4 py-16 sm:px-6 sm:py-20 md:py-28 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="mb-14">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("forRestaurants.howItWorks.label")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("forRestaurants.howItWorks.title")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="mb-10 flex justify-center">
                <div className="relative overflow-hidden rounded-2xl h-48 w-full max-w-2xl sm:h-56">
                  <Image
                    src="/images/landing/food-plating.jpg"
                    alt="Beautifully plated dish"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 672px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="relative">
                {/* Connecting line (desktop only) */}
                <div
                  className="absolute left-0 right-0 top-8 hidden h-px lg:block"
                  aria-hidden="true"
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-ember/20 to-transparent" />
                </div>

                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                  {howItWorksSteps.map((step) => (
                    <div key={step.num} className="relative hover-lift">
                      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        {/* Number circle with ring-expand */}
                        <div className="ring-expand relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ember/[0.08] text-xl font-bold text-ember">
                          {step.num}
                        </div>

                        <h3 className="text-lg font-bold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* DELIVERY NETWORK -- enhanced cards + moroccan-geo            */}
        {/* ============================================================ */}
        <section
          className="relative px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="moroccan-geo absolute inset-0" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-5">
              {/* Left -- copy */}
              <ScrollReveal direction="left" className="lg:col-span-2">
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                    {t("forRestaurants.delivery.label")}
                  </p>
                  <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    {t("forRestaurants.delivery.title")}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t("forRestaurants.delivery.subtitle")}
                  </p>
                  <div className="mt-6 relative overflow-hidden rounded-2xl h-40 sm:h-52 hidden lg:block">
                    <Image
                      src="/images/landing/delivery-driver.jpg"
                      alt="Delivery driver"
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                </div>
              </ScrollReveal>

              {/* Right -- 3 stacked items */}
              <ScrollReveal direction="right" className="lg:col-span-3">
                <div className="space-y-4">
                  {[
                    {
                      icon: Users,
                      title: t("forRestaurants.delivery.card1Title"),
                      description: t("forRestaurants.delivery.card1Desc"),
                    },
                    {
                      icon: DollarSign,
                      title: t("forRestaurants.delivery.card2Title"),
                      description: t("forRestaurants.delivery.card2Desc"),
                    },
                    {
                      icon: Shield,
                      title: t("forRestaurants.delivery.card3Title"),
                      description: t("forRestaurants.delivery.card3Desc"),
                    },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      className="card-3d hover-lift flex items-start gap-5 rounded-2xl border border-border/40 bg-background p-6 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04]"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ember/[0.08]">
                        <card.icon className="h-5 w-5 text-ember" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {card.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* PRICING                                                      */}
        {/* ============================================================ */}
        <div id="pricing">
          <PricingSection />
        </div>

        {/* ============================================================ */}
        {/* COMPARISON                                                   */}
        {/* ============================================================ */}
        <ComparisonSection />

        {/* ============================================================ */}
        {/* FAQ                                                          */}
        {/* ============================================================ */}
        <FAQSection />

        {/* ============================================================ */}
        {/* FINAL CTA -- Warm gradient                                   */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ember/[0.04] via-background to-gold/[0.04]">
          <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-ember/[0.06] blur-[100px]" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-gold/[0.06] blur-[80px]" aria-hidden="true" />

          <ScrollReveal>
            <div className="container relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                {t("forRestaurants.cta.title")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("forRestaurants.cta.subtitle")}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  aria-label="Create your free menu - sign up now"
                  className="group hero-cta-primary inline-flex items-center justify-center gap-2.5 rounded-2xl bg-ember px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-ember/20 transition-all duration-300 hover:shadow-xl hover:shadow-ember/30 hover:-translate-y-0.5"
                >
                  {t("forRestaurants.cta.button")}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
                <Shield className="h-4 w-4" />
                {t("forRestaurants.cta.trust")}
              </p>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </div>
  );
};
