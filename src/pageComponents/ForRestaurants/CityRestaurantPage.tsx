import { useServerTranslation } from "~/i18n";
import { Navbar } from "~/components/Navbar/Navbar";
import { Footer } from "~/pageComponents/LandingPage/molecules/Footer";
import { ScrollReveal } from "~/components/animations/ScrollReveal";
import { AnimatedCounter } from "~/components/animations/AnimatedCounter";
import Link from "next/link";
import {
  ArrowRight,
  QrCode,
  Sparkles,
  Languages,
  ShoppingBag,
  Truck,
  BarChart3,
  MapPin,
  CheckCircle2,
  Shield,
  Store,
  ChevronRight,
  HelpCircle,
  Utensils,
  Palette,
  Ban,
} from "lucide-react";
import type { MoroccoCity } from "~/data/moroccoCities";

interface CityRestaurantPageProps {
  city: MoroccoCity;
  neighborCities: MoroccoCity[];
}

export const CityRestaurantPage = async ({
  city,
  neighborCities,
}: CityRestaurantPageProps) => {
  const { t: _t } = await useServerTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  const features = [
    {
      icon: QrCode,
      title: t("cityPages.featureQrTitle"),
      description: t("cityPages.featureQrDesc"),
    },
    {
      icon: Sparkles,
      title: t("cityPages.featureAiTitle"),
      description: t("cityPages.featureAiDesc"),
    },
    {
      icon: Languages,
      title: t("cityPages.featureLanguagesTitle"),
      description: t("cityPages.featureLanguagesDesc"),
    },
    {
      icon: ShoppingBag,
      title: t("cityPages.featureOrderingTitle"),
      description: t("cityPages.featureOrderingDesc"),
    },
    {
      icon: Truck,
      title: t("cityPages.featureDeliveryTitle"),
      description: t("cityPages.featureDeliveryDesc", { city: city.name }),
    },
    {
      icon: BarChart3,
      title: t("cityPages.featureAnalyticsTitle"),
      description: t("cityPages.featureAnalyticsDesc"),
    },
  ];

  const faqs = [
    {
      q: t("cityPages.restaurantFaq1Q", { city: city.name }),
      a: t("cityPages.restaurantFaq1A"),
    },
    {
      q: t("cityPages.restaurantFaq2Q"),
      a: t("cityPages.restaurantFaq2A"),
    },
    {
      q: t("cityPages.restaurantFaq3Q"),
      a: t("cityPages.restaurantFaq3A"),
    },
  ];

  return (
    <>
      <Navbar />
      <main id="main-content" className="overflow-hidden">
        {/* ============================================================ */}
        {/* HERO                                                         */}
        {/* ============================================================ */}
        <section className="relative flex min-h-[80vh] items-center overflow-hidden hero-mesh">
          <div
            className="absolute inset-0 bg-grain pointer-events-none"
            aria-hidden="true"
          />
          <div className="hero-orb-1 -top-40 right-0" aria-hidden="true" />
          <div className="hero-orb-2 bottom-0 -left-40" aria-hidden="true" />
          <div className="hero-grid absolute inset-0" aria-hidden="true" />

          <div className="container relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
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
                  href="/for-restaurants"
                  className="hover:text-white/60 transition-colors"
                >
                  {t("cityPages.forRestaurantsBreadcrumb")}
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white/60">{city.name}</span>
              </nav>

              <div className="animate-fade-up animate-delay-50 mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-sm text-white/60">
                <Store className="h-3.5 w-3.5 text-gold" />
                {city.restaurantCount}+ {t("cityPages.restaurantsIn")} {city.name}
              </div>

              <h1 className="animate-fade-up animate-delay-100 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
                {t("cityPages.restaurantsTitle", { city: city.name })}
              </h1>

              <p className="animate-fade-up animate-delay-200 mt-6 max-w-lg text-lg leading-relaxed text-white/50 sm:text-xl">
                {t("cityPages.restaurantsDesc", {
                  count: city.restaurantCount,
                  city: city.name,
                })}
              </p>

              {/* CTA */}
              <div className="animate-fade-up animate-delay-300 mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-ember px-8 py-4 text-base font-semibold text-white shadow-lg shadow-ember/25 transition-all duration-200 hover:bg-ember-light hover:shadow-xl hover:shadow-ember/30"
                  aria-label={`Join FeastQR in ${city.name}`}
                >
                  {t("cityPages.joinInCity", { city: city.name })}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/[0.08] hover:text-white"
                >
                  {t("cityPages.seeFeatures")}
                </Link>
              </div>

              {/* Trust row */}
              <div className="animate-fade-up animate-delay-400 mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/30">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                  {t("cityPages.trustZeroCommission")}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                  {t("cityPages.trustFreeStart")}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage/60" />
                  {t("cityPages.trustTrilingualMenus")}
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
                    <Utensils className="h-5 w-5 text-ember/50" />
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
                    <Ban className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={0} suffix="%" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("cityPages.commission")}
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Palette className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={30} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("cityPages.templates")}
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/[0.06]">
                    <Languages className="h-5 w-5 text-ember/50" />
                  </div>
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    <AnimatedCounter target={3} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("cityPages.languages")}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* POPULAR CUISINES IN CITY                                     */}
        {/* ============================================================ */}
        <section className="bg-background py-20 sm:py-24">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-10 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("cityPages.cuisinesLabel")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  {t("cityPages.cuisinesTitle", { city: city.name })}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  {t("cityPages.cuisinesSubtitle", { city: city.name })}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="flex flex-wrap justify-center gap-3">
                {city.cuisines.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="rounded-full border border-border/60 bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-ember/30 hover:bg-ember/[0.04]"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="mx-auto mt-8 max-w-2xl text-center text-base text-muted-foreground leading-relaxed">
                {city.description}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES                                                     */}
        {/* ============================================================ */}
        <section
          id="features"
          className="px-4 py-16 sm:px-6 sm:py-20 md:py-28 lg:px-8"
          style={{ background: "hsl(36 33% 97%)" }}
        >
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal>
              <div className="mb-14 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember/70">
                  {t("cityPages.featuresLabel")}
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("cityPages.featuresTitle", { city: city.name })}
                </h2>
              </div>
            </ScrollReveal>

            {/* Bento grid layout like parent page */}
            <ScrollReveal delay={100}>
              <div className="grid gap-4 md:grid-cols-3">
                {/* QR Menus -- 2-col large */}
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
                </div>

                {/* AI Content -- 1-col */}
                <div className="card-3d group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <Sparkles className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[1]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[1]!.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Row 2: Multi-Language + Ordering */}
            <ScrollReveal delay={200}>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="card-3d group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/[0.08]">
                    <Languages className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[2]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[2]!.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["English", "Fran\u00e7ais", "\u0627\u0644\u0639\u0631\u0628\u064a\u0629"].map(
                      (lang) => (
                        <span
                          key={lang}
                          className="rounded-full bg-gold/[0.06] px-3 py-1 text-xs font-medium text-gold/70"
                        >
                          {lang}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="card-3d border-gradient-spin group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-sand/30 p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04] md:col-span-2 sm:p-10 card-glow">
                  <div className="relative z-10">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                      <ShoppingBag className="h-6 w-6 text-ember" />
                    </div>
                    <h3 className="mb-2.5 font-display text-xl font-bold text-foreground sm:text-2xl">
                      {features[3]!.title}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {features[3]!.description}
                    </p>
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
                </div>
              </div>
            </ScrollReveal>

            {/* Row 3: Delivery + Analytics */}
            <ScrollReveal delay={300}>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="card-3d group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ember/[0.08]">
                    <Truck className="h-6 w-6 text-ember" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[4]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[4]!.description}
                  </p>
                </div>

                <div className="card-3d group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-sage/20 hover:shadow-lg hover:shadow-sage/[0.04]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sage/[0.08]">
                    <BarChart3 className="h-6 w-6 text-sage" />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">
                    {features[5]!.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {features[5]!.description}
                  </p>
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
                  {t("cityPages.otherCitiesRestaurantsTitle")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {neighborCities.map((nc) => (
                  <Link
                    key={nc.slug}
                    href={`/for-restaurants/${nc.slug}`}
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
                          {nc.restaurantCount}+ {t("cityPages.restaurantsActive").toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{nc.cuisines.slice(0, 2).join(", ")}</span>
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
          <div className="hero-orb-3 top-0 right-0" aria-hidden="true" />

          <ScrollReveal>
            <div className="container relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                {t("cityPages.ctaRestaurantTitle", { city: city.name })}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/40">
                {t("cityPages.ctaRestaurantSubtitle", {
                  city: city.name,
                  count: city.restaurantCount,
                })}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="glow-pulse-ember group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-10 py-4 text-lg font-semibold text-foreground shadow-lg transition-all duration-200 hover:bg-white/90 hover:shadow-xl"
                  aria-label={`Create your free menu in ${city.name}`}
                >
                  {t("cityPages.joinInCity", { city: city.name })}
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
