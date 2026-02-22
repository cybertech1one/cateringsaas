import { useServerTranslation } from "~/i18n";
import { Navbar } from "~/components/Navbar/Navbar";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Footer } from "./molecules/Footer";
import { HeroMockup } from "./molecules/HeroMockup";
import { PricingSection } from "./molecules/PricingSection";
import { ComparisonSection } from "./molecules/ComparisonSection";
import { FAQSection } from "./molecules/FAQSection";
import { getAppUrl } from "~/utils/getBaseUrl";
import { ScrollReveal } from "~/components/animations/ScrollReveal";
import { AnimatedCounter } from "~/components/animations/AnimatedCounter";
import { Marquee } from "~/components/animations/Marquee";

import {
  Sparkles,
  ArrowRight,
  Shield,
  Star,
  MapPin,
  MousePointerClick,
  Languages,
  Utensils,
  Search,
  QrCode,
  Smartphone,
  Palette,
  BarChart3,
  CheckCircle2,
  ShoppingBag,
  ChefHat,
} from "lucide-react";

const HeroIllustration = dynamic(
  () =>
    import("./molecules/HeroIllustration").then((m) => ({
      default: m.HeroIllustration,
    })),
  { ssr: false },
);

const appUrl = getAppUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "FeastQR",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Digital menu builder for restaurants with QR code generation, multi-language support, and AI-powered content tools.",
      url: appUrl,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier available",
      },
      featureList: [
        "Digital menu creation",
        "QR code generation",
        "Multi-language support",
        "AI-powered descriptions",
        "Theme customization",
        "Analytics dashboard",
      ],
    },
    {
      "@type": "Organization",
      name: "FeastQR",
      url: appUrl,
      logo: `${appUrl}/images/logo.png`,
      sameAs: [],
    },
  ],
};

export const LandingPage = async () => {
  const { t: _t } = await useServerTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main-content">
        {/* ═══════════════════════════════════════════════════════════
            HERO -- Warm vibrant split layout with SVG illustration
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden hero-vibrant">
          {/* Decorative background elements */}
          <div className="hero-bg-pattern absolute inset-0" aria-hidden="true" />
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-ember/[0.06] blur-[100px]" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gold/[0.08] blur-[80px]" aria-hidden="true" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-sage/[0.04] blur-[120px]" aria-hidden="true" />

          <div className="container relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20 md:pt-28 md:pb-24 lg:pt-32 lg:pb-28 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left -- Copy */}
              <div className="max-w-xl">
                <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-ember/20 bg-ember/[0.06] px-4 py-1.5 text-sm font-medium text-ember">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("landing.hero.badge")}
                </div>

                <h1 className="animate-fade-up animate-delay-100 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                  {t("landing.hero.title")}{" "}
                  <span className="text-gradient">
                    {t("landing.hero.titleHighlight")}
                  </span>
                </h1>

                <p className="animate-fade-up animate-delay-200 mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {t("landing.hero.subtitle")}
                </p>

                <div className="animate-fade-up animate-delay-300 mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/explore"
                    className="group hero-cta-primary inline-flex items-center justify-center gap-2.5 rounded-2xl bg-ember px-8 py-4 text-base font-semibold text-white shadow-lg shadow-ember/20 transition-all duration-300 hover:shadow-xl hover:shadow-ember/30 hover:-translate-y-0.5"
                  >
                    <Search className="h-4.5 w-4.5" />
                    {t("landing.hero.ctaExplore")}
                  </Link>
                  <Link
                    href="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground/10 px-8 py-4 text-base font-semibold text-foreground transition-all duration-300 hover:border-ember/30 hover:bg-ember/[0.04]"
                  >
                    {t("landing.hero.ctaBrowse")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                <div className="animate-fade-up animate-delay-400 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("landing.hero.trustFreeToStart")}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("landing.hero.trustSetupTime")}
                  </span>
                  <span className="hidden items-center gap-2 text-sm font-medium text-foreground/50 sm:flex">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("landing.hero.trustMultiLanguage")}
                  </span>
                </div>
              </div>

              {/* Right -- SVG Illustration + Dashboard mockup */}
              <div className="animate-fade-up animate-delay-200 relative">
                <div className="hidden lg:block">
                  <HeroIllustration />
                </div>
                {/* Mobile: show compact dashboard mockup */}
                <div className="mx-auto max-w-sm lg:hidden">
                  <HeroMockup />
                </div>
              </div>
            </div>

            {/* Cross-audience strip */}
            <div className="animate-fade-up animate-delay-500 mt-14 flex flex-col gap-4 rounded-2xl border border-border/40 bg-background/60 px-6 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-10 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember/[0.08]">
                  <Utensils className="h-4 w-4 text-ember" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {t("landing.hero.ownerStrip")}
                </span>
                <Link
                  href="/for-restaurants"
                  className="group text-sm font-semibold text-ember transition-colors hover:text-ember/80"
                >
                  {t("landing.hero.ownerCta")}
                  <ArrowRight className="ml-1 inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="hidden h-6 w-px bg-border/50 sm:block" />
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/[0.08]">
                  <ShoppingBag className="h-4 w-4 text-sage" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {t("landing.hero.driverStrip")}
                </span>
                <Link
                  href="/for-drivers"
                  className="group text-sm font-semibold text-sage transition-colors hover:text-sage/80"
                >
                  {t("landing.hero.driverCta")}
                  <ArrowRight className="ml-1 inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            STATS -- Big numbers with animated counters
        ═══════════════════════════════════════════════════════════ */}
        <section className="border-b border-border/40 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {[
                  {
                    target: 500,
                    suffix: "+",
                    label: "Restaurants",
                    icon: Utensils,
                  },
                  { target: 12, suffix: "", label: "Cities", icon: MapPin },
                  {
                    target: 50,
                    suffix: "K+",
                    label: "Dishes",
                    icon: Search,
                  },
                  {
                    target: 3,
                    suffix: "",
                    label: "Languages",
                    icon: Languages,
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="group text-center rounded-xl p-4 transition-all duration-300 hover:stat-shimmer"
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06] transition-colors duration-300 group-hover:bg-ember/[0.12]">
                      <stat.icon className="h-5 w-5 text-ember/50 transition-colors duration-300 group-hover:text-ember/80" />
                    </div>
                    <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                      <AnimatedCounter
                        target={stat.target}
                        suffix={stat.suffix}
                        duration={2000}
                      />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TRUST MARQUEE -- Repeating trust badges
        ═══════════════════════════════════════════════════════════ */}
        <div className="border-b border-border/30 bg-background/50 py-3">
          <Marquee speed={35} pauseOnHover className="select-none">
            <span className="text-sm font-medium text-muted-foreground/50">
              500+ Restaurants
            </span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span className="text-sm font-medium text-muted-foreground/50">
              50,000+ Menus Served
            </span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span className="text-sm font-medium text-muted-foreground/50">
              12 Cities
            </span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span className="text-sm font-medium text-muted-foreground/50">
              4.8 Average Rating
            </span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span className="text-sm font-medium text-muted-foreground/50">
              Zero Commission
            </span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span className="text-sm font-medium text-muted-foreground/50">
              AI-Powered
            </span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span className="text-sm font-medium text-muted-foreground/50">
              Multi-Language
            </span>
            <span className="text-muted-foreground/20">&bull;</span>
          </Marquee>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FEATURES -- Bento grid with visual elements
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="noise-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("landing.features.title")}
                </p>
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("landing.features.description")}
                </h2>
              </div>
            </ScrollReveal>

            {/* Row 1: Large (2-col) + Small (1-col) */}
            <ScrollReveal>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:glow-ember md:col-span-2 sm:p-10">
                  <div className="relative z-10">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                      <Search className="h-6 w-6 text-ember" />
                    </div>
                    <h3 className="mb-2.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                      {t("landing.features.dinerBrowseTitle")}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {t("landing.features.dinerBrowseDesc")}
                    </p>
                  </div>
                  {/* Decorative restaurant image */}
                  <div className="absolute -bottom-2 -right-2 h-40 w-60 opacity-[0.15] transition-opacity group-hover:opacity-[0.25] overflow-hidden rounded-xl sm:h-48 sm:w-72">
                    <Image
                      src="/images/landing/restaurant-ambiance.jpg"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="288px"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-sage/20 hover:shadow-lg hover:shadow-sage/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sage/[0.08]">
                    <MousePointerClick className="h-6 w-6 text-sage" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {t("landing.features.dinerOrderTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.dinerOrderDesc")}
                  </p>
                  {/* Mini order type badges */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["Dine-in", "Pickup", "Delivery"].map((mode) => (
                      <span
                        key={mode}
                        className="rounded-full bg-sage/[0.06] px-3 py-1 text-xs font-medium text-sage/70"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Row 2: Small (1-col) + Large (2-col) */}
            <ScrollReveal delay={100}>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <Languages className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {t("landing.features.dinerLanguageTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.dinerLanguageDesc")}
                  </p>
                  {/* Language flags */}
                  <div className="mt-5 flex items-center gap-3">
                    <span className="rounded-md bg-background px-2.5 py-1 text-xs font-bold text-foreground/60 shadow-sm ring-1 ring-border/50">
                      EN
                    </span>
                    <span className="rounded-md bg-background px-2.5 py-1 text-xs font-bold text-foreground/60 shadow-sm ring-1 ring-border/50">
                      FR
                    </span>
                    <span className="rounded-md bg-background px-2.5 py-1 text-xs font-bold text-foreground/60 shadow-sm ring-1 ring-border/50">
                      AR
                    </span>
                    <span className="text-xs text-muted-foreground/50">
                      + RTL
                    </span>
                  </div>
                </div>

                <div className="card-3d arch-card-top group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-sand/30 p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:glow-ember md:col-span-2 sm:p-10">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
                    <div className="flex-1">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                        <Sparkles className="h-6 w-6 text-ember" />
                      </div>
                      <h3 className="mb-2.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                        {t("landing.features.aiTitle")}
                      </h3>
                      <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {t("landing.features.aiDescription")}
                      </p>
                    </div>
                    {/* AI feature checklist */}
                    <div className="flex flex-col gap-2.5 rounded-xl bg-background/60 p-4 ring-1 ring-border/30">
                      {[
                        "Auto descriptions",
                        "Menu translation",
                        "Photo to menu",
                        "Nutrition estimates",
                      ].map((feat) => (
                        <div
                          key={feat}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-sage/60" />
                          <span className="text-muted-foreground">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Row 3: Three equal cards -- QR, Themes, Analytics */}
            <ScrollReveal delay={200}>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="card-3d group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                    <QrCode className="h-6 w-6 text-ember" />
                  </div>
                  <h3 className="mb-2.5 font-display text-lg font-bold text-foreground">
                    {t("landing.features.ownerQrTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.ownerQrDesc")}
                  </p>
                </div>

                <div className="card-3d group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <Palette className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-2.5 font-display text-lg font-bold text-foreground">
                    30+ Templates
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Choose from 30 professionally designed menu themes. Customize
                    colors, fonts, and layouts to match your brand perfectly.
                  </p>
                </div>

                <div className="card-3d group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-sage/20 hover:shadow-lg hover:shadow-sage/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sage/[0.08]">
                    <BarChart3 className="h-6 w-6 text-sage" />
                  </div>
                  <h3 className="mb-2.5 font-display text-lg font-bold text-foreground">
                    {t("landing.features.ownerAnalyticsTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.ownerAnalyticsDesc")}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("landing.features.ownerCtaText")}{" "}
                  <Link
                    href="/for-restaurants"
                    className="font-semibold text-ember hover:underline"
                  >
                    {t("landing.features.ownerCtaLink")}
                    <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PHONE MOCKUP -- What customers see when they scan
        ═══════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden zellige-divider"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="geo-pattern absolute inset-0" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Left -- Copy */}
              <ScrollReveal direction="left">
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                    {t("landing.mobile.label")}
                  </p>
                  <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                    {t("landing.mobile.title")}{" "}
                    <span className="text-ember">
                      {t("landing.mobile.titleLine2")}
                    </span>
                  </h2>
                  <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t("landing.mobile.description")}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/50 bg-background p-5 transition-colors hover:border-ember/20">
                      <QrCode className="mb-3 h-6 w-6 text-ember" />
                      <p className="font-semibold text-foreground">
                        {t("landing.mobile.scanAndView")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("landing.mobile.instantLoading")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background p-5 transition-colors hover:border-sage/20">
                      <Smartphone className="mb-3 h-6 w-6 text-sage" />
                      <p className="font-semibold text-foreground">
                        Mobile-First
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Optimized for all screens
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right -- Phone mockup */}
              <ScrollReveal direction="right">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Phone frame */}
                    <div className="w-[280px] overflow-hidden rounded-[2.5rem] border-[6px] border-espresso bg-background shadow-2xl sm:w-[300px]">
                      {/* Notch */}
                      <div className="relative z-20 mx-auto -mt-[1px] h-7 w-[120px] rounded-b-2xl bg-espresso" />

                      {/* Screen */}
                      <div className="relative bg-background pt-2">
                        {/* Status bar */}
                        <div className="flex items-center justify-between px-6 py-1 text-[10px] font-medium text-muted-foreground/50">
                          <span>9:41</span>
                          <div className="flex items-center gap-1">
                            <div className="h-2.5 w-5 rounded-sm border border-muted-foreground/20">
                              <div className="h-full w-3/4 rounded-sm bg-sage" />
                            </div>
                          </div>
                        </div>

                        {/* Restaurant header */}
                        <div className="px-4 pb-3 pt-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-ember/20 to-gold/20">
                              <Utensils className="h-5 w-5 text-ember" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Riad Al Baraka</p>
                              <div className="mt-0.5 flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3 fill-gold text-gold"
                                  />
                                ))}
                                <span className="ml-1 text-[10px] text-muted-foreground">
                                  4.8
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Category tabs */}
                        <div className="flex gap-2 px-4 pb-3">
                          <span className="rounded-full bg-ember px-3.5 py-1.5 text-[11px] font-semibold text-white">
                            All
                          </span>
                          <span className="rounded-full bg-muted px-3.5 py-1.5 text-[11px] text-muted-foreground">
                            Tagines
                          </span>
                          <span className="rounded-full bg-muted px-3.5 py-1.5 text-[11px] text-muted-foreground">
                            Grills
                          </span>
                          <span className="rounded-full bg-muted px-3.5 py-1.5 text-[11px] text-muted-foreground">
                            Salads
                          </span>
                        </div>

                        {/* Dish cards */}
                        <div className="space-y-3 px-4 pb-4">
                          <div className="overflow-hidden rounded-xl border border-border/50">
                            <div className="relative h-28 bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300">
                              <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-ember shadow-sm">
                                85 MAD
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="text-[13px] font-bold">
                                Lamb Tagine with Prunes
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Slow-cooked with almonds &amp; cinnamon
                              </p>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-xl border border-border/50">
                            <div className="relative h-28 bg-gradient-to-br from-emerald-200 via-teal-200 to-emerald-300">
                              <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-ember shadow-sm">
                                65 MAD
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="text-[13px] font-bold">
                                Couscous Royal
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Seven vegetables &amp; tender chicken
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Cart button */}
                        <div className="px-4 pb-6">
                          <div className="flex items-center justify-center gap-2 rounded-full bg-ember py-3 text-[13px] font-semibold text-white shadow-md shadow-ember/25">
                            <ShoppingBag className="h-4 w-4" />
                            View Cart &middot; 150 MAD
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating QR badge */}
                    <div
                      className="absolute -left-10 top-1/4 hidden animate-float rounded-2xl border border-border bg-background p-3.5 shadow-elevated sm:block"
                      aria-hidden="true"
                    >
                      <QrCode className="h-9 w-9 text-ember" />
                      <p className="mt-1.5 text-center text-[10px] font-bold">
                        Scan Me
                      </p>
                    </div>

                    {/* Floating order notification */}
                    <div
                      className="absolute -right-6 bottom-1/4 hidden animate-float rounded-xl border border-border bg-background px-3.5 py-2.5 shadow-elevated sm:block"
                      style={{ animationDelay: "1.5s" }}
                      aria-hidden="true"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sage/10">
                          <CheckCircle2 className="h-4 w-4 text-sage" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold">Order Placed!</p>
                          <p className="text-[10px] text-muted-foreground">
                            Table 5 &middot; 2 items
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CITIES -- Explore Morocco
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative bg-background px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="moroccan-geo absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("landing.tasteOfMorocco.badge")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("landing.tasteOfMorocco.title")}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  {t("landing.tasteOfMorocco.subtitle")}
                </p>
              </div>
            </ScrollReveal>

            {/* Bento city grid -- Casablanca large, rest smaller */}
            <ScrollReveal delay={100}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Casablanca -- spans 2 cols on lg */}
                <Link
                  href="/explore/casablanca"
                  className="card-3d group relative overflow-hidden rounded-2xl lg:col-span-2 lg:row-span-2"
                >
                  <div className="relative flex aspect-[16/10] items-end p-6 transition-all duration-300 lg:aspect-auto lg:h-full lg:min-h-[320px]">
                    <Image
                      src="/images/landing/restaurant-interior.jpg"
                      alt="Casablanca restaurants"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="relative z-10">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
                        120+ restaurants
                      </p>
                      <h3 className="font-display text-3xl font-bold text-white drop-shadow-sm sm:text-4xl">
                        Casablanca
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                        <MapPin className="h-3.5 w-3.5" />
                        {t("landing.tasteOfMorocco.exploreLabel")}
                      </p>
                    </div>
                  </div>
                </Link>

                {[
                  {
                    name: "Marrakech",
                    slug: "marrakech",
                    count: "85+",
                    image: "/images/landing/tagine.jpg",
                    alt: "Marrakech restaurants",
                  },
                  {
                    name: "Rabat",
                    slug: "rabat",
                    count: "60+",
                    image: "/images/landing/moroccan-food.jpg",
                    alt: "Rabat restaurants",
                  },
                  {
                    name: "Fes",
                    slug: "fes",
                    count: "45+",
                    image: "/images/landing/couscous.jpg",
                    alt: "Fes restaurants",
                  },
                  {
                    name: "Tangier",
                    slug: "tangier",
                    count: "40+",
                    image: "/images/landing/food-plating.jpg",
                    alt: "Tangier restaurants",
                  },
                ].map((city) => (
                  <Link
                    key={city.slug}
                    href={`/explore/${city.slug}`}
                    className="card-3d group relative overflow-hidden rounded-2xl"
                  >
                    <div className="relative flex aspect-[16/10] items-end p-5 transition-all duration-300">
                      <Image
                        src={city.image}
                        alt={city.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="256px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="relative z-10">
                        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                          {city.count} restaurants
                        </p>
                        <h3 className="font-display text-xl font-bold text-white drop-shadow-sm sm:text-2xl">
                          {city.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-10 text-center">
                <Link
                  href="/explore"
                  className="group inline-flex items-center gap-2 text-base font-semibold text-foreground transition-colors hover:text-ember"
                >
                  {t("landing.tasteOfMorocco.viewAll")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            HOW IT WORKS -- 3 steps
        ═══════════════════════════════════════════════════════════ */}
        <section
          className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="noise-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-5xl">
            <ScrollReveal>
              <div className="mb-16 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("landing.howItWorks.title")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("landing.howItWorks.description")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
                {/* Connecting line */}
                <div
                  className="absolute left-[16.67%] right-[16.67%] top-[3.25rem] hidden h-px bg-border md:block"
                  aria-hidden="true"
                />

                {[
                  {
                    num: "01",
                    icon: ChefHat,
                    color: "text-ember bg-ember/[0.08]",
                    title: t("landing.howItWorks.step1Title"),
                    desc: t("landing.howItWorks.step1Description"),
                  },
                  {
                    num: "02",
                    icon: QrCode,
                    color: "text-gold bg-gold/[0.08]",
                    title: t("landing.howItWorks.step2Title"),
                    desc: t("landing.howItWorks.step2Description"),
                  },
                  {
                    num: "03",
                    icon: MousePointerClick,
                    color: "text-sage bg-sage/[0.08]",
                    title: t("landing.howItWorks.step3Title"),
                    desc: t("landing.howItWorks.step3Description"),
                  },
                ].map((step, idx) => (
                  <div key={idx} className="text-center">
                    <div className="ring-expand relative z-10 mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                      <step.icon
                        className={`h-7 w-7 ${step.color.split(" ")[0]}`}
                      />
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="mb-2 font-display text-lg font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TESTIMONIALS -- Asymmetric cards
        ═══════════════════════════════════════════════════════════ */}
        <section className="bg-background px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("landing.testimonials.title")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("landing.testimonials.titleHighlight")}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  {t("landing.testimonials.description")}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="mb-10 relative overflow-hidden rounded-2xl h-40 sm:h-48">
                <Image
                  src="/images/landing/restaurant-owner.jpg"
                  alt="Happy restaurant owner"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1152px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid gap-5 md:grid-cols-5">
                {/* Featured testimonial -- large */}
                <div className="border-gradient-spin rounded-2xl bg-card p-8 sm:p-10 md:col-span-3">
                  <div className="mb-6 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <blockquote className="font-display text-xl leading-relaxed text-foreground sm:text-2xl">
                    &ldquo;{t("landing.testimonials.review1Quote")}&rdquo;
                  </blockquote>
                  <div className="mt-8 flex items-center gap-3 border-t border-border/40 pt-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-ember/20 to-gold/20">
                      <span className="text-sm font-bold text-ember">S</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t("landing.testimonials.review1Name")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("landing.testimonials.review1Role")},{" "}
                        {t("landing.testimonials.review1Restaurant")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Side testimonials */}
                <div className="flex flex-col gap-5 md:col-span-2">
                  <div className="flex-1 rounded-2xl border border-border/40 bg-card p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-gold text-gold"
                        />
                      ))}
                    </div>
                    <blockquote className="text-sm leading-relaxed text-foreground">
                      &ldquo;{t("landing.testimonials.review2Quote")}&rdquo;
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/10">
                        <span className="text-xs font-bold text-sage">K</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {t("landing.testimonials.review2Name")}
                        </span>{" "}
                        &middot; {t("landing.testimonials.review2Restaurant")}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 rounded-2xl border border-border/40 bg-card p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-gold text-gold"
                        />
                      ))}
                    </div>
                    <blockquote className="text-sm leading-relaxed text-foreground">
                      &ldquo;{t("landing.testimonials.review3Quote")}&rdquo;
                    </blockquote>
                    <div className="mt-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                        <span className="text-xs font-bold text-gold">Y</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {t("landing.testimonials.review3Name")}
                        </span>{" "}
                        &middot; {t("landing.testimonials.review3Restaurant")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            COMPARISON TABLE
        ═══════════════════════════════════════════════════════════ */}
        <ComparisonSection />

        {/* ═══════════════════════════════════════════════════════════
            PRICING
        ═══════════════════════════════════════════════════════════ */}
        <PricingSection />

        {/* ═══════════════════════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════════════════════ */}
        <FAQSection />

        {/* ═══════════════════════════════════════════════════════════
            CTA -- Dark closing
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden hero-mesh">
          <div
            className="absolute inset-0 bg-grain pointer-events-none"
            aria-hidden="true"
          />
          <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
            <Image
              src="/images/landing/fine-dining.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              aria-hidden="true"
            />
          </div>
          <div className="hero-orb-3 right-1/4 top-0" aria-hidden="true" />

          <div className="container relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
            <ScrollReveal>
              <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                {t("landing.cta.title")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/40">
                {t("landing.cta.description")}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/explore"
                  className="glow-pulse-ember group inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Search className="h-5 w-5" />
                  {t("landing.cta.buttonExplore")}
                </Link>
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white/80 transition-all duration-200 hover:bg-white/5 hover:text-white"
                >
                  {t("landing.cta.buttonCreate")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/25">
                <Shield className="h-4 w-4" />
                {t("landing.cta.trustNote")}
              </p>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/20">
                <Link
                  href="/for-restaurants"
                  className="transition-colors hover:text-white/50"
                >
                  {t("navbar.forRestaurants")}
                </Link>
                <span>&middot;</span>
                <Link
                  href="/for-drivers"
                  className="transition-colors hover:text-white/50"
                >
                  {t("navbar.forDrivers")}
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
