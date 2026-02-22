"use client";

import React from "react";
import { useState } from "react";
import { PricingToggle } from "./PricingToggle";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";

export function PricingSection() {
  const [enabled, setEnabled] = useState(false);
  const { t } = useTranslation();
  const pricingOptions = [
    {
      price: t("landingPage.pricing.free.price"),
      yearlyPrice: t("landingPage.pricing.free.price"),
      name: t("landingPage.pricing.free.name"),
      description: t("landingPage.pricing.free.description"),
      features: [
        t("landingPage.pricing.free.feature1"),
        t("landingPage.pricing.free.feature2"),
        t("landingPage.pricing.free.feature3"),
        t("landingPage.pricing.free.feature4"),
      ],
      popular: false,
    },
    {
      price: "$6.99",
      yearlyPrice: "$59.99",
      name: t("landingPage.pricing.standard.name"),
      description: t("landingPage.pricing.standard.description"),
      features: [
        t("landingPage.pricing.standard.feature1"),
        t("landingPage.pricing.standard.feature2"),
        t("landingPage.pricing.standard.feature3"),
      ],
      popular: true,
    },
    {
      name: t("landingPage.pricing.enterprise.name"),
      price: t("landingPage.pricing.enterprise.price"),
      yearlyPrice: t("landingPage.pricing.enterprise.yearlyPrice"),
      description: t("landingPage.pricing.enterprise.description"),
      features: [
        t("landingPage.pricing.enterprise.feature1"),
        t("landingPage.pricing.enterprise.feature2"),
        t("landingPage.pricing.enterprise.feature3"),
      ],
      extraBenefits: t("landingPage.pricing.enterprise.extraBenefits"),
      popular: false,
    },
  ];

  return (
    <section className="section-padding bg-sand-section zellige-divider" id="pricing">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="font-sans text-3xl font-bold sm:text-4xl md:text-5xl">
            {t("pricing.title")} <span className="text-gradient">{t("pricing.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("pricing.subtitle")}
          </p>
          <div className="mt-8 flex justify-center">
            <PricingToggle enabled={enabled} setEnabled={setEnabled} />
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {pricingOptions.map((option) => (
            <div
              key={option.name}
              className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                option.popular
                  ? "border-primary bg-card shadow-glow scale-[1.02] arch-card-top"
                  : "border-border/50 bg-card hover:border-primary/30 hover:shadow-card"
              }`}
            >
              {option.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-5 py-1.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25">
                    <Sparkles className="h-3 w-3" />
                    {t("pricing.mostPopular")}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-sans text-xl font-semibold text-foreground">{option.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
              </div>

              <div className="mb-2">
                <span className="font-sans text-4xl font-bold text-foreground">
                  {enabled ? option.yearlyPrice : option.price}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {enabled ? t("pricing.perYear") : t("pricing.perMonth")}
                </span>
              </div>

              {option.popular && !enabled && (
                <p className="text-xs text-muted-foreground mb-1">
                  {t("pricing.madEquivalent")}
                </p>
              )}

              {option.popular && (
                <p className="text-xs text-sage mb-6">
                  {t("pricing.cancelAnytime")}
                </p>
              )}

              {!option.popular && <div className="mb-6" />}

              <div className="space-y-4 mb-8">
                {option.extraBenefits && (
                  <p className="text-sm text-muted-foreground">{option.extraBenefits}</p>
                )}
                {option.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sage/10">
                      <Check className="h-3 w-3 text-sage" />
                    </div>
                    <span className="text-sm text-foreground/90">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className={`group flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  option.popular
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                    : "border-2 border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {t("pricing.choosePlan")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
