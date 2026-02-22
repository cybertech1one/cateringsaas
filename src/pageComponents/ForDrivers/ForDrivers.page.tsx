import { useServerTranslation } from "~/i18n";
import { Navbar } from "~/components/Navbar/Navbar";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Footer } from "~/pageComponents/LandingPage/molecules/Footer";
import { ScrollReveal } from "~/components/animations/ScrollReveal";
import { AnimatedCounter } from "~/components/animations/AnimatedCounter";
import { Marquee } from "~/components/animations/Marquee";

import {
  ArrowRight,
  Shield,
  Clock,
  Ban,
  Users,
  Wallet,
  TrendingUp,
  Store,
  UserPlus,
  Banknote,
  Bike,
  MapPin,
  CheckCircle2,
  HeartHandshake,
  XCircle,
} from "lucide-react";

const DriverRegistrationForm = dynamic(
  () =>
    import("./molecules/DriverRegistrationForm").then((m) => ({
      default: m.DriverRegistrationForm,
    })),
  {
    loading: () => (
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    ),
    ssr: false,
  },
);

export const ForDriversPage = async () => {
  const { t: _t } = await useServerTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  const comparisonTraditional = [
    { text: t("forDrivers.comparison.traditional1") },
    { text: t("forDrivers.comparison.traditional2") },
    { text: t("forDrivers.comparison.traditional3") },
    { text: t("forDrivers.comparison.traditional4") },
    { text: t("forDrivers.comparison.traditional5") },
  ];

  const comparisonDiyafa = [
    { text: t("forDrivers.comparison.Diyafa1") },
    { text: t("forDrivers.comparison.Diyafa2") },
    { text: t("forDrivers.comparison.Diyafa3") },
    { text: t("forDrivers.comparison.Diyafa4") },
    { text: t("forDrivers.comparison.Diyafa5") },
  ];

  const howItWorksSteps = [
    {
      num: "01",
      icon: UserPlus,
      title: t("forDrivers.howItWorks.step1Title"),
      description: t("forDrivers.howItWorks.step1Desc"),
    },
    {
      num: "02",
      icon: HeartHandshake,
      title: t("forDrivers.howItWorks.step2Title"),
      description: t("forDrivers.howItWorks.step2Desc"),
    },
    {
      num: "03",
      icon: Banknote,
      title: t("forDrivers.howItWorks.step3Title"),
      description: t("forDrivers.howItWorks.step3Desc"),
    },
  ];

  const earningsCities = [
    {
      city: t("forDrivers.earnings.casablanca"),
      range: t("forDrivers.earnings.casablancaRange"),
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      city: t("forDrivers.earnings.marrakech"),
      range: t("forDrivers.earnings.marrakechRange"),
      gradient: "from-teal-500 to-cyan-600",
    },
    {
      city: t("forDrivers.earnings.rabat"),
      range: t("forDrivers.earnings.rabatRange"),
      gradient: "from-cyan-500 to-blue-500",
    },
  ];

  const benefits = [
    {
      icon: Ban,
      title: t("forDrivers.benefits.zeroFeesTitle"),
      description: t("forDrivers.benefits.zeroFeesDesc"),
    },
    {
      icon: Clock,
      title: t("forDrivers.benefits.flexibleTitle"),
      description: t("forDrivers.benefits.flexibleDesc"),
    },
    {
      icon: Users,
      title: t("forDrivers.benefits.relationshipsTitle"),
      description: t("forDrivers.benefits.relationshipsDesc"),
    },
    {
      icon: Store,
      title: t("forDrivers.benefits.multipleTitle"),
      description: t("forDrivers.benefits.multipleDesc"),
    },
    {
      icon: Wallet,
      title: t("forDrivers.benefits.paymentsTitle"),
      description: t("forDrivers.benefits.paymentsDesc"),
    },
    {
      icon: TrendingUp,
      title: t("forDrivers.benefits.growingTitle"),
      description: t("forDrivers.benefits.growingDesc"),
    },
  ];

  const requirements = [
    t("forDrivers.requirements.req1"),
    t("forDrivers.requirements.req2"),
    t("forDrivers.requirements.req3"),
    t("forDrivers.requirements.req4"),
    t("forDrivers.requirements.req5"),
  ];

  const earningsCityImages = [
    "/images/landing/restaurant-ambiance.jpg",
    "/images/landing/moroccan-food.jpg",
    "/images/landing/tagine.jpg",
  ];

  const operatingCityImages = [
    "/images/landing/restaurant-interior.jpg",
    "/images/landing/restaurant-ambiance.jpg",
    "/images/landing/fine-dining.jpg",
    "/images/landing/restaurant-kitchen.jpg",
  ];

  const operatingCities = [
    { name: t("forDrivers.form.cities.casablanca"), restaurants: "120+", gradient: "from-emerald-500 to-teal-600" },
    { name: t("forDrivers.form.cities.marrakech"), restaurants: "85+", gradient: "from-teal-500 to-emerald-600" },
    { name: t("forDrivers.form.cities.rabat"), restaurants: "60+", gradient: "from-cyan-500 to-teal-600" },
    { name: t("forDrivers.form.cities.fes"), restaurants: "40+", gradient: "from-teal-600 to-cyan-500" },
  ];

  const marqueeItems = [
    t("forDrivers.marquee.zeroFees"),
    t("forDrivers.marquee.keepTips"),
    t("forDrivers.marquee.flexibleSchedule"),
    t("forDrivers.marquee.dailyPayouts"),
    t("forDrivers.marquee.fourCities"),
    t("forDrivers.marquee.fiveHundredPlus"),
  ];

  return (
    <>
      <Navbar />
      <main id="main-content" className="overflow-hidden">
        {/* ================================================================ */}
        {/* HERO -- Vibrant warm gradient with phone mockup                  */}
        {/* ================================================================ */}
        <section className="relative overflow-hidden hero-vibrant">
          <div className="hero-bg-pattern absolute inset-0" aria-hidden="true" />
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-sage/[0.06] blur-[100px]" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-ember/[0.05] blur-[80px]" aria-hidden="true" />

          <div className="container relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20 md:pt-28 md:pb-24 lg:pt-32 lg:pb-28 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Left -- Copy */}
              <div className="max-w-xl">
                <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-sage/20 bg-sage/[0.06] px-4 py-1.5 text-sm font-medium text-sage">
                  <Bike className="h-3.5 w-3.5" />
                  {t("forDrivers.hero.badge")}
                </div>

                <h1 className="animate-fade-up animate-delay-100 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4rem]">
                  {t("forDrivers.hero.title")}{" "}
                  <span className="text-gradient">{t("forDrivers.hero.titleHighlight")}</span>
                </h1>

                <p className="animate-fade-up animate-delay-200 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {t("forDrivers.hero.subtitle")}
                </p>

                {/* CTA buttons */}
                <div className="animate-fade-up animate-delay-300 mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="#apply"
                    className="group hero-cta-primary inline-flex items-center justify-center gap-2.5 rounded-2xl bg-ember px-8 py-4 text-base font-semibold text-white shadow-lg shadow-ember/20 transition-all duration-300 hover:shadow-xl hover:shadow-ember/30 hover:-translate-y-0.5"
                    aria-label={t("forDrivers.hero.ctaPrimary")}
                  >
                    <Bike className="h-4 w-4" />
                    {t("forDrivers.hero.ctaPrimary")}
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="group inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground/10 px-8 py-4 text-base font-semibold text-foreground transition-all duration-300 hover:border-sage/30 hover:bg-sage/[0.04]"
                    aria-label={t("forDrivers.hero.ctaSecondary")}
                  >
                    {t("forDrivers.hero.ctaSecondary")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="animate-fade-up animate-delay-400 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("forDrivers.hero.trustFee")}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("forDrivers.hero.trustHours")}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground/50">
                    <CheckCircle2 className="h-4 w-4 text-sage" />
                    {t("forDrivers.hero.trustPay")}
                  </span>
                </div>
              </div>

              {/* Right -- Phone mockup (desktop only) */}
              <div className="animate-fade-up animate-delay-200 hidden lg:block">
                <div className="relative mx-auto w-[280px]">
                  {/* Ambient glow */}
                  <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-sage/10 via-transparent to-ember/10 blur-2xl" aria-hidden="true" />
                  {/* Phone frame */}
                  <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/10 bg-background shadow-2xl shadow-black/10">
                    {/* Notch */}
                    <div className="mx-auto h-6 w-28 rounded-b-2xl bg-foreground/10" />
                    {/* Screen content */}
                    <div className="p-5 pt-3">
                      {/* Status: Available */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-sage" />
                          <span className="text-xs font-semibold text-foreground/70">{t("forDrivers.mockup.available")}</span>
                        </div>
                        <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{t("forDrivers.form.cities.casablanca")}</div>
                      </div>

                      {/* Earnings card */}
                      <div className="mb-4 rounded-xl border border-sage/20 bg-sage/[0.04] p-4">
                        <p className="text-xs text-muted-foreground">{t("forDrivers.mockup.todaysEarnings")}</p>
                        <p className="mt-1 font-display text-2xl font-bold text-sage">420 MAD</p>
                        <div className="mt-2 flex gap-3 text-xs text-muted-foreground/60">
                          <span>6 {t("forDrivers.mockup.orders")}</span>
                          <span>&middot;</span>
                          <span>4.2 {t("forDrivers.mockup.hrs")}</span>
                        </div>
                      </div>

                      {/* Order cards */}
                      <div className="space-y-3">
                        <div className="rounded-xl border border-sage/20 bg-sage/[0.06] p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground/70">{t("forDrivers.mockup.newOrder")}</span>
                            <span className="text-xs font-bold text-sage">35 MAD</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>Cafe Atlas &rarr; Maarif</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/60">
                            <span>2.1 km</span>
                            <span>&middot;</span>
                            <span>~8 min</span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground/60">{t("forDrivers.mockup.completed")}</span>
                            <span className="text-xs font-bold text-foreground/50">45 MAD</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/60">
                            <MapPin className="h-3 w-3" />
                            <span>Riad Salam &rarr; Gauthier</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badge -- Live */}
                  <div className="absolute -right-4 top-20 animate-float rounded-xl border border-sage/20 bg-background px-3 py-2 shadow-lg shadow-sage/10">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />
                      <span className="text-xs font-semibold text-foreground/70">Live</span>
                    </div>
                  </div>

                  {/* Floating earnings badge */}
                  <div
                    className="absolute -left-8 bottom-28 animate-float rounded-xl border border-sage/20 bg-background px-3 py-2 shadow-lg shadow-sage/10"
                    style={{ animationDelay: "1.5s" }}
                  >
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3.5 w-3.5 text-sage" />
                      <span className="text-xs font-semibold text-foreground/70">+35 MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* STATS BAR                                                       */}
        {/* ================================================================ */}
        <section className="border-b border-border/40 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {/* Drivers */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Bike className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={300} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("forDrivers.stats.drivers")}</p>
                </div>

                {/* Platform Fee */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Ban className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={0} suffix="%" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("forDrivers.stats.platformFee")}</p>
                </div>

                {/* Cities */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <MapPin className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={4} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("forDrivers.stats.cities")}</p>
                </div>

                {/* MAD/day */}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Banknote className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={500} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("forDrivers.stats.madPerDay")}</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ================================================================ */}
        {/* TRUST MARQUEE                                                    */}
        {/* ================================================================ */}
        <div className="border-b border-border/40 bg-background/50 py-3">
          <Marquee speed={30} className="opacity-60">
            {marqueeItems.map((item, idx) => (
              <span key={idx} className="flex items-center gap-8 text-sm font-medium text-muted-foreground/50">
                <span>{item}</span>
                <span className="text-border/60" aria-hidden="true">&bull;</span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* ================================================================ */}
        {/* COMPARISON                                                       */}
        {/* ================================================================ */}
        <section className="noise-overlay relative bg-background py-24 sm:py-32">
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-16 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("forDrivers.comparison.label")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("forDrivers.comparison.title")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="mb-10 relative overflow-hidden rounded-2xl h-48 sm:h-56">
                <Image
                  src="/images/landing/delivery-driver.jpg"
                  alt="Independent delivery driver"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1152px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 z-10">
                  <p className="text-sm font-semibold text-white drop-shadow-md">{t("forDrivers.mockup.imageOverlay")}</p>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Traditional Platforms */}
              <ScrollReveal direction="left" delay={200}>
                <div className="card-3d group relative overflow-hidden rounded-2xl border border-destructive/20 bg-background p-8 transition-all duration-300 hover:shadow-lg hover:shadow-destructive/[0.04]">
                  <div className="geo-pattern absolute inset-0 opacity-[0.02]" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
                        <XCircle className="h-5 w-5 text-destructive/70" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {t("forDrivers.comparison.traditionalTitle")}
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {comparisonTraditional.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 transition-all duration-200 hover:translate-x-1">
                          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive/60" />
                          <span className="text-sm leading-relaxed text-muted-foreground">
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

              {/* Diyafa Network */}
              <ScrollReveal direction="right" delay={200}>
                <div className="card-3d border-gradient-spin group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-background p-8 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/[0.06]">
                  <div className="geo-pattern absolute inset-0 opacity-[0.02]" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {t("forDrivers.comparison.DiyafaTitle")}
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {comparisonDiyafa.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 transition-all duration-200 hover:translate-x-1">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                          <span className="text-sm leading-relaxed text-muted-foreground">
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* HOW IT WORKS                                                     */}
        {/* ================================================================ */}
        <section
          id="how-it-works"
          className="zellige-divider relative py-24 sm:py-32"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="moroccan-geo absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-16 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("forDrivers.howItWorks.label")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("forDrivers.howItWorks.title")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="relative">
                {/* Horizontal connecting line -- desktop */}
                <div
                  className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-border md:block"
                  aria-hidden="true"
                />

                <div className="grid gap-10 md:grid-cols-3">
                  {howItWorksSteps.map((step, idx) => (
                    <div key={idx} className="hover-lift relative text-center">
                      {/* Numbered circle with ring-expand */}
                      <div className="ring-expand relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-ember/20 bg-background shadow-sm">
                        <span className="font-display text-2xl font-bold text-ember">
                          {step.num}
                        </span>
                      </div>

                      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-ember/15 bg-ember/[0.06]">
                        <step.icon className="h-5 w-5 text-ember" />
                      </div>

                      <h3 className="mb-2 text-lg font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ================================================================ */}
        {/* EARNINGS                                                         */}
        {/* ================================================================ */}
        <section className="bg-background py-24 sm:py-32">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("forDrivers.earnings.label")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("forDrivers.earnings.title")}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  {t("forDrivers.earnings.subtitle")}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid gap-4 sm:grid-cols-3">
                {earningsCities.map((ec, idx) => (
                  <div
                    key={idx}
                    className="card-3d group relative overflow-hidden rounded-2xl border border-border/40 transition-all duration-300 hover:shadow-xl hover:glow-gold"
                  >
                    <div className="relative flex aspect-[16/10] w-full flex-col items-center justify-center p-6">
                      <Image
                        src={earningsCityImages[idx] ?? "/images/landing/tagine.jpg"}
                        alt={ec.city}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 384px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
                      <div className="relative z-10 text-center">
                        <div className="mb-2 flex items-center justify-center gap-1.5">
                          <MapPin className="h-4 w-4 text-white/80" />
                          <h3 className="font-display text-xl font-bold text-white drop-shadow-sm sm:text-2xl">
                            {ec.city}
                          </h3>
                        </div>
                        <p className="text-2xl font-extrabold text-white drop-shadow-md sm:text-3xl">
                          {ec.range}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="mx-auto mt-8 max-w-md text-center text-sm text-muted-foreground">
                {t("forDrivers.earnings.disclaimer")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ================================================================ */}
        {/* BENEFITS -- Bento grid                                           */}
        {/* ================================================================ */}
        <section
          className="noise-overlay relative py-24 sm:py-32"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="geo-pattern absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("forDrivers.benefits.label")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("forDrivers.benefits.title")}
                </h2>
              </div>
            </ScrollReveal>

            {/* Row 1: Large (2-col) + Small (1-col) */}
            <ScrollReveal delay={100}>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Zero Platform Fees -- hero benefit, 2-col */}
                <div className="card-3d arch-card-top border-gradient-spin group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-sage/20 hover:shadow-lg hover:shadow-sage/[0.04] md:col-span-2 sm:p-10 card-glow">
                  <div className="relative z-10">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/[0.08]">
                      <Ban className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="mb-2.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                      {benefits[0]!.title}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {benefits[0]!.description}
                    </p>
                  </div>
                  {/* Decorative large icon */}
                  <div className="absolute -bottom-6 -right-6 opacity-[0.04] transition-opacity group-hover:opacity-[0.07]">
                    <Ban className="h-48 w-48 rotate-12" />
                  </div>
                  <div className="absolute bottom-0 right-0 h-32 w-48 opacity-[0.1] overflow-hidden rounded-tl-2xl transition-opacity group-hover:opacity-[0.18]">
                    <Image
                      src="/images/landing/couscous.jpg"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="192px"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Flexible Schedule -- 1-col */}
                <div className="card-3d group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04] card-glow">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <Clock className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {benefits[1]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {benefits[1]!.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Row 2: 4 equal-ish cards */}
            <ScrollReveal delay={200}>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {benefits.slice(2).map((benefit, idx) => (
                  <div
                    key={idx}
                    className="card-3d group rounded-2xl border border-border/50 bg-card p-7 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04] card-glow"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ember/[0.06]">
                      <benefit.icon className="h-5 w-5 text-ember" />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ================================================================ */}
        {/* REQUIREMENTS + CITIES                                            */}
        {/* ================================================================ */}
        <section className="noise-overlay relative bg-background py-24 sm:py-32">
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-12">
              {/* Requirements */}
              <ScrollReveal direction="left">
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                    {t("forDrivers.requirements.label")}
                  </p>
                  <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    {t("forDrivers.requirements.title")}
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    {t("forDrivers.requirements.subtitle")}
                  </p>

                  <div className="card-3d mt-8 rounded-2xl border border-border/40 bg-card p-8 shadow-sm">
                    <ul className="space-y-5">
                      {requirements.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-4 transition-all duration-200 hover:translate-x-1">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-base font-medium text-foreground">
                            {req}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

              {/* Cities */}
              <ScrollReveal direction="right">
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                    {t("forDrivers.coverage.label")}
                  </p>
                  <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    {t("forDrivers.coverage.title")}
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    {t("forDrivers.coverage.subtitle")}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {operatingCities.map((city, idx) => (
                      <div
                        key={idx}
                        className="card-3d group relative overflow-hidden rounded-2xl border border-border/40 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center p-5">
                          <Image
                            src={operatingCityImages[idx] ?? "/images/landing/restaurant-kitchen.jpg"}
                            alt={city.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 280px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/5" />
                          <div className="relative z-10 text-center">
                            <h3 className="font-display text-lg font-bold text-white drop-shadow-sm sm:text-xl">
                              {city.name}
                            </h3>
                            <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-white/80">
                              <Store className="h-3.5 w-3.5" />
                              <span>{city.restaurants} {t("forDrivers.coverage.restaurants")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 text-sm text-muted-foreground">
                    {t("forDrivers.coverage.moreCities")}{" "}
                    <a
                      href="https://wa.me/212600000000?text=I%20want%20Diyafa%20in%20my%20city"
                      className="font-medium text-ember hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("forDrivers.coverage.letUsKnow")}
                    >
                      {t("forDrivers.coverage.letUsKnow")}
                    </a>
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* REGISTRATION FORM                                                */}
        {/* ================================================================ */}
        <section
          id="apply"
          className="relative overflow-hidden py-24 sm:py-32"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="geo-pattern absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl rounded-2xl border border-border/50 bg-card/80 p-8 shadow-lg backdrop-blur-sm sm:p-12">
                <DriverRegistrationForm />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FINAL CTA -- hero-mesh with orbs                                 */}
        {/* ================================================================ */}
        <section className="relative overflow-hidden hero-mesh">
          <div className="absolute inset-0 bg-grain pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
            <Image
              src="/images/landing/restaurant-kitchen.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              aria-hidden="true"
            />
          </div>
          <div className="hero-orb-3 right-1/4 top-0" aria-hidden="true" />

          <ScrollReveal>
            <div className="container relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                {t("forDrivers.cta.title")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/40">
                {t("forDrivers.cta.subtitle")}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="#apply"
                  className="glow-pulse-ember group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-10 py-4 text-lg font-semibold text-foreground shadow-lg shadow-white/10 transition-all duration-200 hover:shadow-xl hover:shadow-white/15"
                  aria-label={t("forDrivers.cta.button")}
                >
                  {t("forDrivers.cta.button")}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="https://wa.me/212600000000?text=Hi%20Diyafa%2C%20I%20have%20questions%20about%20driving"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={t("forDrivers.cta.whatsapp")}
                >
                  {t("forDrivers.cta.whatsapp")}
                </a>
              </div>

              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/25">
                <Shield className="h-4 w-4" />
                {t("forDrivers.cta.trust")}
              </p>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </>
  );
};
