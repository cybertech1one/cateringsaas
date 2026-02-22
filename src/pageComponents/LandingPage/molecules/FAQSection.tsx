"use client";

import { useTranslation } from "react-i18next";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const FAQ_COUNT = 10;

export function FAQSection() {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string) => string;

  const faqItems = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    question: t(`landing.faq.items.${i}.question`),
    answer: t(`landing.faq.items.${i}.answer`),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section id="faq" className="w-full py-16 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.faq.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        <Accordion.Root type="single" collapsible className="space-y-3">
          {faqItems.map((item, index) => (
            <Accordion.Item
              key={index}
              value={`faq-${index}`}
              className="rounded-lg border bg-card px-6 transition-colors data-[state=open]:border-primary/30"
            >
              <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left font-medium transition-all [&[data-state=open]>svg]:rotate-180">
                <span className="pr-4">{item.question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
              </Accordion.Trigger>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="pb-4 text-muted-foreground leading-relaxed">
                  {item.answer}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
