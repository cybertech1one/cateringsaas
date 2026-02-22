import { useServerTranslation } from "~/i18n";
import { Navbar } from "~/components/Navbar/Navbar";
import { Footer } from "~/pageComponents/LandingPage/molecules/Footer";
import { ScrollReveal } from "~/components/animations/ScrollReveal";
import { AnimatedCounter } from "~/components/animations/AnimatedCounter";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  MapPin,
  Banknote,
  CheckCircle2,
  Shield,
  Users,
  Clock,
  Ban,
  Store,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import type { MoroccoCity } from "~/data/moroccoCities";

interface CityDriverPageProps {
  city: MoroccoCity;
  neighborCities: MoroccoCity[];
}

export const CityDriverPage = async ({
  city,
  neighborCities,
}: CityDriverPageProps) => {
  const { t: _t } = await useServerTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  const minEarnings = parseInt(city.avgEarnings.split("-")[0] ?? "0");
  const maxEarnings = parseInt(city.avgEarnings.split("-")[1] ?? "0");

  const faqs = [
    {
      q: t("cityPages.driverFaq1Q", { city: city.name }),
      a: t("cityPages.driverFaq1A", {
        city: city.name,
        earnings: city.avgEarnings,
      }),
    },
    {
      q: t("cityPages.driverFaq2Q"),
      a: t("cityPages.driverFaq2A"),
    },
    {
      q: t("cityPages.driverFaq3Q"),
      a: t("cityPages.driverFaq3A"),
    },
  ];

  const benefits = [
    {
      icon: Ban,
      title: t("cityPages.benefitZeroFees"),
      description: t("cityPages.benefitZeroFeesDesc"),
    },
    {
      icon: Clock,
      title: t("cityPages.benefitFlexible"),
      description: t("cityPages.benefitFlexibleDesc"),
    },
    {
      icon: Users,
      title: t("cityPages.benefitDirect"),
      description: t("cityPages.benefitDirectDesc", { city: city.name }),
    },
    {
      icon: Store,
      title: t("cityPages.benefitRestaurants"),
      description: t("cityPages.benefitRestaurantsDesc", {
        count: city.restaurantCount,
        city: city.name,
      }),
    },
  ];

  return (
    <>
      <Navbar />
      <main id="main-content" className="overflow-hidden">
        {/* ============================================================ */}
        {/* HERO                                                         */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden hero-mesh">
          <div
            className="absolute inset-0 bg-grain pointer-events-none"
            aria-hidden="true"
          />
          <div className="hero-orb-1 -top-40 right-0" aria-hidden="true" />
          <div className="hero-orb-2 bottom-0 -left-40" aria-hidden="true" />
          <div className="hero-grid absolute inset-0" aria-hidden="true" />

          <div className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28 lg:px-8">
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="animate-fade-up mb-6 flex items-center gap-2 text-sm text-white/40"
              >
                <Link href="/" className="hover:text-white/60 transition-colors">
                  Home
                </Link>
                <ChevronRight className="h-3 w-3" />
                <Link
                  href="/for-drivers"
                  className="hover:text-white/60 transition-colors"
                >
                  {t("cityPages.forDriversBreadcrumb")}
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white/60">{city.name}</span>
              </nav>

              <div className="animate-fade-up animate-delay-50 mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-sm text-white/60">
                <MapPin className="h-3.5 w-3.5 text-gold" />
                {city.name}, Morocco
              </div>

              <h1 className="animate-fade-up animate-delay-100 font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl md:text-6xl">
                {t("cityPages.driversTitle", { city: city.name })}
              </h1>

              <p className="animate-fade-up animate-delay-200 mt-6 max-w-xl text-lg leading-relaxed text-white/45 sm:text-xl">
                {t("cityPages.driversDesc", {
                  city: city.name,
                  earnings: city.avgEarnings,
                })}
              </p>

              {/* CTA */}
              <div className="animate-fade-up animate-delay-300 mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-ember px-8 py-4 text-base font-semibold text-white shadow-lg shadow-ember/25 transition-all duration-200 hover:shadow-xl hover:shadow-ember/30"
                  aria-label={`Apply to deliver in ${city.name}`}
                >
                  <Bike className="h-4 w-4" />
                  {t("cityPages.applyInCity", { city: city.name })}
                </Link>
                <Link
                  href="#faq"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] px-8 py-4 text-base font-semibold text-white/80 transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
                >
                  {t("cityPages.faqTitle")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="animate-fade-up animate-delay-400 mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/25">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                  {t("cityPages.trustZeroFee")}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                  {t("cityPages.trustFlexHours")}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                  {t("cityPages.trustDirectPay")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STATS BAR                                                    */}
        {/* ============================================================ */}
        <section className="border-b border-border/40 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Bike className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={city.driverCount} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("cityPages.driversActive")}
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Store className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={city.restaurantCount} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("cityPages.restaurantsActive")}
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Banknote className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={minEarnings} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    MAD/day {t("cityPages.earnings")}
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Ban className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={0} suffix="%" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("cityPages.platformFee")}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* EARNINGS BREAKDOWN                                          */}
        {/* ============================================================ */}
        <section className="noise-overlay relative bg-background py-24 sm:py-32">
          <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("cityPages.earningsLabel")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("cityPages.earningsTitle", { city: city.name })}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  {t("cityPages.earningsSubtitle", {
                    city: city.name,
                    count: city.restaurantCount,
                  })}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Part-time card */}
                <div className="card-3d rounded-2xl border border-border/40 bg-card p-8 text-center transition-all duration-300 hover:shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("cityPages.partTime")}
                  </p>
                  <p className="mt-3 font-display text-4xl font-bold text-foreground">
                    {minEarnings}
                  </p>
                  <p className="text-sm text-muted-foreground">MAD/day</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("cityPages.partTimeDesc")}
                  </p>
                </div>

                {/* Full-time card -- highlighted */}
                <div className="card-3d border-gradient-spin rounded-2xl border border-emerald-500/30 bg-card p-8 text-center shadow-lg shadow-emerald-500/[0.06] transition-all duration-300 hover:shadow-xl">
                  <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
                    {t("cityPages.fullTime")}
                  </p>
                  <p className="mt-3 font-display text-4xl font-bold text-emerald-600">
                    {maxEarnings}
                  </p>
                  <p className="text-sm text-muted-foreground">MAD/day</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("cityPages.fullTimeDesc")}
                  </p>
                </div>

                {/* Peak hours card */}
                <div className="card-3d rounded-2xl border border-border/40 bg-card p-8 text-center transition-all duration-300 hover:shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("cityPages.peakHours")}
                  </p>
                  <p className="mt-3 font-display text-4xl font-bold text-foreground">
                    {Math.round(maxEarnings * 1.2)}
                  </p>
                  <p className="text-sm text-muted-foreground">MAD/day</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("cityPages.peakHoursDesc")}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="mx-auto mt-8 max-w-md text-center text-sm text-muted-foreground">
                {t("cityPages.earningsDisclaimer")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* BENEFITS                                                     */}
        {/* ============================================================ */}
        <section
          className="noise-overlay relative py-24 sm:py-32"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="geo-pattern absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("cityPages.whyDeliverLabel")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("cityPages.whyDeliverTitle", { city: city.name })}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {benefits.map((benefit, idx) => (
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

        {/* ============================================================ */}
        {/* HOW IT WORKS                                                 */}
        {/* ============================================================ */}
        <section className="bg-background py-24 sm:py-32">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-16 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("cityPages.howToStartLabel")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("cityPages.howToStartTitle", { city: city.name })}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="relative">
                <div
                  className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-border md:block"
                  aria-hidden="true"
                />
                <div className="grid gap-10 md:grid-cols-3">
                  {[
                    {
                      num: "01",
                      title: t("cityPages.step1Title"),
                      desc: t("cityPages.step1Desc"),
                    },
                    {
                      num: "02",
                      title: t("cityPages.step2Title"),
                      desc: t("cityPages.step2Desc", { city: city.name }),
                    },
                    {
                      num: "03",
                      title: t("cityPages.step3Title"),
                      desc: t("cityPages.step3Desc"),
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="hover-lift relative text-center">
                      <div className="ring-expand relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-ember/20 bg-background shadow-sm">
                        <span className="font-display text-2xl font-bold text-ember">
                          {step.num}
                        </span>
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FAQ                                                          */}
        {/* ============================================================ */}
        <section
          id="faq"
          className="zellige-divider relative py-24 sm:py-32"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="moroccan-geo absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <HelpCircle className="h-5 w-5 text-ember/70" />
                  <p className="text-sm font-semibold uppercase tracking-widest text-ember/70">
                    FAQ
                  </p>
                </div>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  {t("cityPages.faqTitle")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="card-3d rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:shadow-md"
                  >
                    <h3 className="text-base font-bold text-foreground">
                      {faq.q}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* NEARBY CITIES                                                */}
        {/* ============================================================ */}
        <section className="bg-background py-24 sm:py-32">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("cityPages.otherCitiesLabel")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  {t("cityPages.otherCitiesTitle")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {neighborCities.map((nc) => (
                  <Link
                    key={nc.slug}
                    href={`/for-drivers/${nc.slug}`}
                    className="card-3d group rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:border-ember/20 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                        <MapPin className="h-5 w-5 text-ember/50" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground group-hover:text-ember transition-colors">
                          {nc.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {nc.avgEarnings} MAD/day
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{nc.driverCount}+ {t("cityPages.driversActive").toLowerCase()}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-ember/50 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FINAL CTA                                                    */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden hero-mesh">
          <div
            className="absolute inset-0 bg-grain pointer-events-none"
            aria-hidden="true"
          />
          <div className="hero-orb-3 right-1/4 top-0" aria-hidden="true" />

          <ScrollReveal>
            <div className="container relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                {t("cityPages.ctaDriverTitle", { city: city.name })}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/40">
                {t("cityPages.ctaDriverSubtitle", {
                  city: city.name,
                  earnings: city.avgEarnings,
                })}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="glow-pulse-ember group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-10 py-4 text-lg font-semibold text-foreground shadow-lg shadow-white/10 transition-all duration-200 hover:shadow-xl hover:shadow-white/15"
                  aria-label={`Sign up to deliver in ${city.name}`}
                >
                  {t("cityPages.applyInCity", { city: city.name })}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/25">
                <Shield className="h-4 w-4" />
                {t("cityPages.ctaTrust")}
              </p>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </>
  );
};
