"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

type CellValue =
  | { type: "check" }
  | { type: "cross" }
  | { type: "text"; value: string };

interface ComparisonRow {
  label: string;
  Diyafa: CellValue;
  glovo: CellValue;
  donema: CellValue;
  paper: CellValue;
}

function CellDisplay({ cell }: { cell: CellValue }) {
  if (cell.type === "check") {
    return <CheckCircle2 className="h-5 w-5 text-sage mx-auto" />;
  }

  if (cell.type === "cross") {
    return <XCircle className="h-5 w-5 text-destructive/60 mx-auto" />;
  }

  return (
    <span className="text-sm text-muted-foreground">{cell.value}</span>
  );
}

function MobileCard({
  row,
  competitors,
}: {
  row: ComparisonRow;
  competitors: { key: string; label: string; value: CellValue }[];
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <h4 className="font-semibold text-foreground mb-3">{row.label}</h4>
      <div className="grid grid-cols-2 gap-3">
        {competitors.map((comp) => (
          <div
            key={comp.key}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              comp.key === "Diyafa"
                ? "bg-primary/5 border border-primary/20"
                : "bg-muted/30"
            }`}
          >
            {comp.value.type === "check" && (
              <CheckCircle2 className="h-4 w-4 text-sage flex-shrink-0" />
            )}
            {comp.value.type === "cross" && (
              <XCircle className="h-4 w-4 text-destructive/60 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <span className="block text-xs text-muted-foreground">
                {comp.label}
              </span>
              {comp.value.type === "text" && (
                <span
                  className={`block text-xs font-medium ${
                    comp.key === "Diyafa"
                      ? "text-primary"
                      : "text-foreground/70"
                  }`}
                >
                  {comp.value.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonSection() {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string) => string;

  const rows: ComparisonRow[] = [
    {
      label: t("landing.comparison.commission"),
      Diyafa: { type: "text", value: "0%" },
      glovo: { type: "text", value: t("landing.comparison.upTo30") },
      donema: { type: "text", value: "15-25%" },
      paper: { type: "text", value: "N/A" },
    },
    {
      label: t("landing.comparison.setupTime"),
      Diyafa: { type: "text", value: t("landing.comparison.minutes") },
      glovo: { type: "text", value: t("landing.comparison.weeks") },
      donema: { type: "text", value: t("landing.comparison.days") },
      paper: { type: "text", value: t("landing.comparison.printShop") },
    },
    {
      label: t("landing.comparison.ownCustomers"),
      Diyafa: { type: "check" },
      glovo: { type: "cross" },
      donema: { type: "cross" },
      paper: { type: "cross" },
    },
    {
      label: t("landing.comparison.languages"),
      Diyafa: { type: "text", value: t("landing.comparison.enFrAr") },
      glovo: { type: "text", value: t("landing.comparison.limited") },
      donema: { type: "text", value: t("landing.comparison.limited") },
      paper: { type: "text", value: t("landing.comparison.limited") },
    },
    {
      label: t("landing.comparison.qrMenus"),
      Diyafa: { type: "check" },
      glovo: { type: "cross" },
      donema: { type: "cross" },
      paper: { type: "cross" },
    },
    {
      label: t("landing.comparison.analytics"),
      Diyafa: {
        type: "text",
        value: t("landing.comparison.fullDashboard"),
      },
      glovo: { type: "text", value: t("landing.comparison.basic") },
      donema: { type: "text", value: t("landing.comparison.basic") },
      paper: { type: "text", value: t("landing.comparison.none") },
    },
    {
      label: t("landing.comparison.onlineOrdering"),
      Diyafa: { type: "check" },
      glovo: { type: "check" },
      donema: { type: "check" },
      paper: { type: "cross" },
    },
    {
      label: t("landing.comparison.customBranding"),
      Diyafa: { type: "check" },
      glovo: { type: "cross" },
      donema: { type: "text", value: t("landing.comparison.limited") },
      paper: { type: "check" },
    },
    {
      label: t("landing.comparison.monthlyCost"),
      Diyafa: {
        type: "text",
        value: t("landing.comparison.freeToStart"),
      },
      glovo: {
        type: "text",
        value: t("landing.comparison.commissionBased"),
      },
      donema: {
        type: "text",
        value: t("landing.comparison.subscription"),
      },
      paper: {
        type: "text",
        value: t("landing.comparison.reprintCosts"),
      },
    },
  ];

  const competitorKeys = [
    { key: "Diyafa", label: t("landing.comparison.Diyafa") },
    { key: "glovo", label: t("landing.comparison.glovo") },
    { key: "donema", label: t("landing.comparison.donema") },
    { key: "paper", label: t("landing.comparison.paperMenus") },
  ] as const;

  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-sans text-3xl font-bold sm:text-4xl md:text-5xl">
            {t("landing.comparison.title")}{" "}
            <span className="text-gradient">
              {t("landing.comparison.titleHighlight")}
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.comparison.subtitle")}
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-6 py-5 text-left text-sm font-medium text-muted-foreground w-1/5">
                    {t("landing.comparison.feature")}
                  </th>
                  <th className="px-6 py-5 text-center w-1/5">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-base font-bold text-gradient">
                        {t("landing.comparison.Diyafa")}
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center text-sm font-medium text-muted-foreground w-1/5">
                    {t("landing.comparison.glovo")}
                  </th>
                  <th className="px-6 py-5 text-center text-sm font-medium text-muted-foreground w-1/5">
                    {t("landing.comparison.donema")}
                  </th>
                  <th className="px-6 py-5 text-center text-sm font-medium text-muted-foreground w-1/5">
                    {t("landing.comparison.paperMenus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${
                      idx === rows.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-6 py-4 text-center bg-primary/[0.02]">
                      <CellDisplay cell={row.Diyafa} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CellDisplay cell={row.glovo} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CellDisplay cell={row.donema} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CellDisplay cell={row.paper} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {rows.map((row, idx) => (
            <MobileCard
              key={idx}
              row={row}
              competitors={competitorKeys.map((comp) => ({
                key: comp.key,
                label: comp.label,
                value: row[comp.key as keyof ComparisonRow] as CellValue,
              }))}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
          >
            {t("landing.comparison.cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
