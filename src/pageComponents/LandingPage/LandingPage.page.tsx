import { useServerTranslation } from "~/i18n";
import { Navbar } from "~/components/Navbar/Navbar";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Footer } from "./molecules/Footer";
import { PricingSection } from "./molecules/PricingSection";
import { ComparisonSection } from "./molecules/ComparisonSection";
import { FAQSection } from "./molecules/FAQSection";
import { getAppUrl } from "~/utils/getBaseUrl";
import { ScrollReveal } from "~/components/animations/ScrollReveal";
import { AnimatedCounter } from "~/components/animations/AnimatedCounter";

import {
  ArrowRight,
  Shield,
  Star,
  MapPin,
  Languages,
  Utensils,
  CalendarDays,
  FileText,
  DollarSign,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Camera,
} from "lucide-react";

const HeroIllustration = dynamic(
  () =>
    import("./molecules/HeroIllustration").then((m) => ({
      default: m.HeroIllustration,
    })),
  { ssr: false },
);

const appUrl = getAppUrl();

export const LandingPage = async () => {
  const { t: _t } = await useServerTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* ================================================================
            HERO -- Full-viewport, centered editorial with Arabic calligraphy
        ================================================================ */}
        <section className="relative min-h-screen overflow-hidden hero-moroccan">
          {/* Zellige lattice pattern overlay */}
          <div
            className="zellige-lattice absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />
          {/* Warm ambient glows */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-ember/[0.04] blur-[160px]"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-gold/[0.06] blur-[120px]"
            aria-hidden="true"
          />

          <div className="container relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6 lg:px-8">
            {/* Signature Arabic calligraphy */}
            <div className="animate-fade-up">
              <span
                className="font-calligraphy block text-[5.5rem] leading-none tracking-wide text-ember/[0.12] sm:text-[8rem] md:text-[10rem] lg:text-[12rem]"
                aria-hidden="true"
              >
                ضيافة
              </span>
            </div>

            {/* English headline -- overlaps slightly with the calligraphy */}
            <div className="animate-fade-up animate-delay-100 -mt-8 sm:-mt-12 md:-mt-16">
              <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                {t("landing.hero.title")}{" "}
                <span className="text-gradient">
                  {t("landing.hero.titleHighlight")}
                </span>
              </h1>
            </div>

            {/* Subline */}
            <p className="animate-fade-up animate-delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("landing.hero.subtitle")}
            </p>

            {/* Single prominent CTA */}
            <div className="animate-fade-up animate-delay-300 mt-10">
              <Link
                href="/register"
                className="group moroccan-shimmer inline-flex items-center justify-center gap-3 rounded-2xl bg-ember px-10 py-4.5 text-lg font-semibold text-white shadow-lg shadow-ember/20 transition-all duration-300 hover:shadow-xl hover:shadow-ember/30 hover:-translate-y-0.5"
              >
                <ChefHat className="h-5 w-5" />
                {t("landing.hero.ctaExplore")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-up animate-delay-400 mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                {t("landing.hero.trustFreeToStart")}
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                {t("landing.hero.trustSetupTime")}
              </span>
              <span className="hidden items-center gap-2 text-sm text-muted-foreground/60 sm:flex">
                <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                {t("landing.hero.trustMultiLanguage")}
              </span>
            </div>

            {/* Cross-audience strip -- simplified */}
            <div className="animate-fade-up animate-delay-500 mt-16 flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
              <Link
                href="/register"
                className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-ember"
              >
                <ChefHat className="h-4 w-4 text-ember/40 transition-colors group-hover:text-ember" />
                <span>{t("landing.hero.ownerStrip")}</span>
                <span className="font-semibold text-ember">
                  {t("landing.hero.ownerCta")}
                </span>
              </Link>
              <span className="hidden h-4 w-px bg-border/50 sm:block" aria-hidden="true" />
              <Link
                href="/explore"
                className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-sage"
              >
                <CalendarDays className="h-4 w-4 text-sage/40 transition-colors group-hover:text-sage" />
                <span>{t("landing.hero.driverStrip")}</span>
                <span className="font-semibold text-sage">
                  {t("landing.hero.driverCta")}
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================
            STATS -- Animated counters with Moroccan accent
        ================================================================ */}
        <section className="relative border-b border-border/30">
          <div className="gold-separator" aria-hidden="true" />
          <div className="container mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {[
                  { target: 200, suffix: "+", label: "Caterers", icon: ChefHat },
                  { target: 12, suffix: "", label: "Cities", icon: MapPin },
                  { target: 5, suffix: "K+", label: "Events Managed", icon: CalendarDays },
                  { target: 3, suffix: "", label: "Languages", icon: Languages },
                ].map((stat, idx) => (
                  <div key={idx} className="group text-center">
                    <p className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                      <AnimatedCounter
                        target={stat.target}
                        suffix={stat.suffix}
                        duration={2000}
                      />
                    </p>
                    <p className="mt-2 text-sm font-medium text-muted-foreground/60">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
          <div className="gold-separator" aria-hidden="true" />
        </section>

        {/* ================================================================
            FEATURES -- Editorial alternating sections, not bento grid
        ================================================================ */}
        <section id="features" className="relative bg-riad-cream">
          <div className="container mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            {/* Section header */}
            <ScrollReveal>
              <div className="mb-20 text-center">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-ember/60">
                  {t("landing.features.title")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("landing.features.description")}
                </h2>
              </div>
            </ScrollReveal>

            {/* Feature 1: Event Management -- Image left, copy right */}
            <div className="mb-24">
              <ScrollReveal>
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  <div className="moroccan-shimmer relative overflow-hidden rounded-2xl">
                    <div className="aspect-[4/3] bg-gradient-to-br from-ember/[0.06] via-gold/[0.04] to-sand/[0.08] p-8 sm:p-12">
                      {/* Stylized event pipeline illustration */}
                      <div className="space-y-4">
                        {["Wedding", "Corporate", "Ramadan", "Birthday"].map(
                          (type, i) => (
                            <div
                              key={type}
                              className="flex items-center gap-4 rounded-xl border border-border/30 bg-background/80 px-5 py-3.5 shadow-sm backdrop-blur-sm"
                              style={{ marginLeft: `${i * 12}px` }}
                            >
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                  i === 0
                                    ? "bg-ember/10"
                                    : i === 1
                                      ? "bg-sage/10"
                                      : i === 2
                                        ? "bg-gold/10"
                                        : "bg-ember/10"
                                }`}
                              >
                                <CalendarDays
                                  className={`h-4.5 w-4.5 ${
                                    i === 0
                                      ? "text-ember"
                                      : i === 1
                                        ? "text-sage"
                                        : i === 2
                                          ? "text-gold"
                                          : "text-ember"
                                  }`}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                  {type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {i === 0
                                    ? "200 guests"
                                    : i === 1
                                      ? "80 guests"
                                      : i === 2
                                        ? "150 guests"
                                        : "60 guests"}
                                </p>
                              </div>
                              <span className="rounded-full bg-sage/10 px-2.5 py-1 text-[10px] font-semibold text-sage">
                                {i === 0
                                  ? "Confirmed"
                                  : i === 1
                                    ? "Quoted"
                                    : i === 2
                                      ? "Inquiry"
                                      : "Draft"}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                      <CalendarDays className="h-6 w-6 text-ember" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                      {t("landing.features.eventManagementTitle")}
                    </h3>
                    <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                      {t("landing.features.eventManagementDesc")}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="gold-separator mx-auto mb-24 max-w-md" aria-hidden="true" />

            {/* Feature 2: Quote Builder -- Copy left, image right */}
            <div className="mb-24">
              <ScrollReveal>
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  <div className="order-2 lg:order-1">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sage/[0.08]">
                      <FileText className="h-6 w-6 text-sage" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                      {t("landing.features.quoteBuilderTitle")}
                    </h3>
                    <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                      {t("landing.features.quoteBuilderDesc")}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {["Per Head", "Per Dish", "Package"].map((mode) => (
                        <span
                          key={mode}
                          className="rounded-full border border-sage/20 bg-sage/[0.04] px-4 py-1.5 text-xs font-semibold text-sage/70"
                        >
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="moroccan-shimmer order-1 overflow-hidden rounded-2xl lg:order-2">
                    <div className="aspect-[4/3] bg-gradient-to-br from-sage/[0.06] via-background to-sage/[0.04] p-8 sm:p-12">
                      {/* Stylized quote document */}
                      <div className="rounded-xl border border-border/40 bg-background/90 p-6 shadow-sm backdrop-blur-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              DEVIS / QUOTE
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              #DYF-2026-042
                            </p>
                          </div>
                          <span className="rounded-full bg-sage/10 px-3 py-1 text-[10px] font-bold text-sage">
                            TVA 20%
                          </span>
                        </div>
                        <div className="space-y-2.5 border-t border-border/30 pt-4">
                          {[
                            { item: "Appetizers (x200)", price: "8,000" },
                            { item: "Main Course (x200)", price: "16,000" },
                            { item: "Pastilla Dessert (x200)", price: "6,000" },
                            { item: "Service Staff (x8)", price: "4,000" },
                          ].map((line) => (
                            <div
                              key={line.item}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {line.item}
                              </span>
                              <span className="font-semibold text-foreground">
                                {line.price} MAD
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3">
                          <span className="text-sm font-bold text-foreground">
                            Total TTC
                          </span>
                          <span className="text-lg font-bold text-ember">
                            40,800 MAD
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="gold-separator mx-auto mb-24 max-w-md" aria-hidden="true" />

            {/* Feature 3: Menu Management -- Image left, copy right */}
            <div className="mb-24">
              <ScrollReveal>
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  <div className="moroccan-shimmer overflow-hidden rounded-2xl">
                    <div className="aspect-[4/3] bg-gradient-to-br from-gold/[0.06] via-background to-ember/[0.04] p-8 sm:p-12">
                      {/* Menu categories visualization */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "Appetizers", count: "12 items", color: "ember" },
                          { name: "Tagines", count: "8 items", color: "gold" },
                          { name: "Couscous", count: "5 items", color: "sage" },
                          { name: "Pastries", count: "15 items", color: "ember" },
                        ].map((cat) => (
                          <div
                            key={cat.name}
                            className="rounded-xl border border-border/30 bg-background/80 p-4 backdrop-blur-sm"
                          >
                            <div
                              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-${cat.color}/[0.08]`}
                            >
                              <Utensils
                                className={`h-4 w-4 text-${cat.color}`}
                              />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {cat.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cat.count}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                      <Utensils className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                      {t("landing.features.menuManagementTitle")}
                    </h3>
                    <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                      {t("landing.features.menuManagementDesc")}
                    </p>
                    <div className="mt-6 flex flex-col gap-2.5">
                      {[
                        "Per-head pricing",
                        "Package deals",
                        "Dietary options",
                        "Multi-language (EN/FR/AR)",
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
              </ScrollReveal>
            </div>

            <div className="gold-separator mx-auto mb-24 max-w-md" aria-hidden="true" />

            {/* Features 4-6: Three cards in a row */}
            <ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Financial Tracking */}
                <div className="moroccan-shimmer group rounded-2xl border border-border/40 bg-background/80 p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <DollarSign className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                    {t("landing.features.financialTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.financialDesc")}
                  </p>
                  <div className="mt-5 flex items-center gap-2">
                    {["COD", "Milestones", "Invoices"].map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-background px-2.5 py-1 text-xs font-bold text-foreground/50 shadow-sm ring-1 ring-border/50"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Staff & Equipment */}
                <div className="moroccan-shimmer group rounded-2xl border border-border/40 bg-background/80 p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                    <Users className="h-6 w-6 text-ember" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                    {t("landing.features.staffEquipmentTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.staffEquipmentDesc")}
                  </p>
                </div>

                {/* Client Hub */}
                <div className="moroccan-shimmer group rounded-2xl border border-border/40 bg-background/80 p-8 transition-all duration-300 hover:border-sage/20 hover:shadow-lg">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sage/[0.08]">
                    <MessageSquare className="h-6 w-6 text-sage" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                    {t("landing.features.clientHubTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.clientHubDesc")}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Additional feature cards row */}
            <ScrollReveal delay={100}>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* Analytics */}
                <div className="moroccan-shimmer group rounded-2xl border border-border/40 bg-background/80 p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <BarChart3 className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                    {t("landing.features.analyticsTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.analyticsDesc")}
                  </p>
                </div>

                {/* Portfolio */}
                <div className="moroccan-shimmer group rounded-2xl border border-border/40 bg-background/80 p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                    <Camera className="h-6 w-6 text-ember" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                    {t("landing.features.portfolioTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("landing.features.portfolioDesc")}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("landing.features.ownerCtaText")}{" "}
                  <Link
                    href="#pricing"
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

        {/* ================================================================
            CITIES -- Caterers across Morocco with Moorish arch decoration
        ================================================================ */}
        <section className="relative bg-background px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div
            className="moroccan-geo absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="moroccan-arch mb-16 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-ember/60">
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

            {/* Bento city grid */}
            <ScrollReveal delay={100}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Casablanca -- featured, spans 2 cols */}
                <Link
                  href="/explore/casablanca"
                  className="zellige-hover-border group relative overflow-hidden rounded-2xl lg:col-span-2 lg:row-span-2"
                >
                  <div className="relative flex aspect-[16/10] items-end p-6 transition-all duration-300 lg:aspect-auto lg:h-full lg:min-h-[320px]">
                    <Image
                      src="/images/landing/restaurant-interior.jpg"
                      alt="Casablanca caterers"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="relative z-10">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
                        60+ caterers
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
                    count: "45+",
                    image: "/images/landing/tagine.jpg",
                    alt: "Marrakech caterers",
                  },
                  {
                    name: "Rabat",
                    slug: "rabat",
                    count: "30+",
                    image: "/images/landing/moroccan-food.jpg",
                    alt: "Rabat caterers",
                  },
                  {
                    name: "Fes",
                    slug: "fes",
                    count: "25+",
                    image: "/images/landing/couscous.jpg",
                    alt: "Fes caterers",
                  },
                  {
                    name: "Tangier",
                    slug: "tangier",
                    count: "20+",
                    image: "/images/landing/food-plating.jpg",
                    alt: "Tangier caterers",
                  },
                ].map((city) => (
                  <Link
                    key={city.slug}
                    href={`/explore/${city.slug}`}
                    className="zellige-hover-border group relative overflow-hidden rounded-2xl"
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
                          {city.count} caterers
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

        {/* ================================================================
            HOW IT WORKS -- Arabic numerals, editorial layout
        ================================================================ */}
        <section className="relative overflow-hidden bg-riad-cream px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div
            className="zellige-lattice absolute inset-0 pointer-events-none opacity-50"
            aria-hidden="true"
          />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="mb-20 text-center">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-ember/60">
                  {t("landing.howItWorks.title")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("landing.howItWorks.description")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="grid gap-0 md:grid-cols-3">
                {[
                  {
                    arabicNum: "\u0661",
                    icon: ChefHat,
                    iconColor: "text-ember",
                    title: t("landing.howItWorks.step1Title"),
                    desc: t("landing.howItWorks.step1Description"),
                  },
                  {
                    arabicNum: "\u0662",
                    icon: CalendarDays,
                    iconColor: "text-gold",
                    title: t("landing.howItWorks.step2Title"),
                    desc: t("landing.howItWorks.step2Description"),
                  },
                  {
                    arabicNum: "\u0663",
                    icon: CheckCircle2,
                    iconColor: "text-sage",
                    title: t("landing.howItWorks.step3Title"),
                    desc: t("landing.howItWorks.step3Description"),
                  },
                ].map((step, idx) => (
                  <div key={idx} className="relative px-6 py-8 text-center md:px-10">
                    {/* Zellige divider between steps on desktop */}
                    {idx < 2 && (
                      <div
                        className="zellige-border-dense absolute right-0 top-1/4 hidden h-1/2 w-px md:block"
                        aria-hidden="true"
                      />
                    )}

                    {/* Large Arabic numeral */}
                    <span
                      className="font-calligraphy block text-6xl leading-none text-ember/[0.15] sm:text-7xl"
                      aria-hidden="true"
                    >
                      {step.arabicNum}
                    </span>

                    <div className="mx-auto mt-4 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/40 bg-background shadow-sm">
                      <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                    </div>

                    <h3 className="mb-3 font-display text-lg font-bold text-foreground sm:text-xl">
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

        {/* ================================================================
            TESTIMONIALS -- Large serif quotes with zellige pattern
        ================================================================ */}
        <section className="relative overflow-hidden bg-background px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div
            className="zellige-star-cross absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />
          <div className="container relative z-10 mx-auto max-w-5xl">
            <ScrollReveal>
              <div className="mb-16 text-center">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-ember/60">
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

            {/* Featured testimonial -- large, serif, italic */}
            <ScrollReveal>
              <div className="mb-10 rounded-2xl border border-border/30 bg-card p-10 sm:p-14">
                <div className="mb-6 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                  ))}
                </div>
                <blockquote className="font-display text-xl italic leading-relaxed text-foreground sm:text-2xl md:text-3xl">
                  &ldquo;{t("landing.testimonials.review1Quote")}&rdquo;
                </blockquote>
                <div className="mt-10 flex items-center gap-4 border-t border-border/30 pt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ember/20 to-gold/20">
                    <span className="text-base font-bold text-ember">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {t("landing.testimonials.review1Name")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("landing.testimonials.review1Role")},{" "}
                      {t("landing.testimonials.review1Restaurant")}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Two smaller testimonials */}
            <ScrollReveal delay={100}>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/30 bg-card p-8 sm:p-10">
                  <div className="mb-5 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gold text-gold"
                      />
                    ))}
                  </div>
                  <blockquote className="font-display text-base italic leading-relaxed text-foreground sm:text-lg">
                    &ldquo;{t("landing.testimonials.review2Quote")}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3 border-t border-border/30 pt-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/10">
                      <span className="text-xs font-bold text-sage">K</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t("landing.testimonials.review2Name")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("landing.testimonials.review2Restaurant")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/30 bg-card p-8 sm:p-10">
                  <div className="mb-5 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gold text-gold"
                      />
                    ))}
                  </div>
                  <blockquote className="font-display text-base italic leading-relaxed text-foreground sm:text-lg">
                    &ldquo;{t("landing.testimonials.review3Quote")}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3 border-t border-border/30 pt-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10">
                      <span className="text-xs font-bold text-gold">Y</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t("landing.testimonials.review3Name")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("landing.testimonials.review3Restaurant")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ================================================================
            COMPARISON TABLE
        ================================================================ */}
        <ComparisonSection />

        {/* ================================================================
            PRICING
        ================================================================ */}
        <PricingSection />

        {/* ================================================================
            FAQ
        ================================================================ */}
        <FAQSection />

        {/* ================================================================
            CTA -- Dark closing with Arabic calligraphy and zellige
        ================================================================ */}
        <section className="relative overflow-hidden hero-mesh">
          {/* Zellige pattern overlay on dark section */}
          <div
            className="zellige-star-cross absolute inset-0 pointer-events-none opacity-50"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-grain pointer-events-none"
            aria-hidden="true"
          />

          <div className="container relative z-10 mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
            <ScrollReveal>
              {/* Decorative Arabic calligraphy */}
              <span
                className="font-calligraphy mb-4 block text-5xl leading-none text-white/[0.06] sm:text-7xl"
                aria-hidden="true"
              >
                ضيافة
              </span>

              <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                {t("landing.cta.title")}
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/40">
                {t("landing.cta.description")}
              </p>

              <div className="mt-12">
                <Link
                  href="/register"
                  className="group moroccan-shimmer inline-flex items-center justify-center gap-3 rounded-2xl bg-ember px-10 py-4.5 text-lg font-semibold text-white shadow-lg shadow-ember/25 transition-all duration-300 hover:shadow-xl hover:shadow-ember/30 hover:-translate-y-0.5"
                >
                  <ChefHat className="h-5 w-5" />
                  {t("landing.cta.buttonExplore")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <p className="mt-8 flex items-center justify-center gap-2 text-sm text-white/25">
                <Shield className="h-4 w-4" />
                {t("landing.cta.trustNote")}
              </p>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/20">
                <Link
                  href="/for-restaurants"
                  className="transition-colors hover:text-white/50"
                >
                  {t("navbar.forRestaurants")}
                </Link>
                <span>&middot;</span>
                <Link
                  href="/explore"
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
