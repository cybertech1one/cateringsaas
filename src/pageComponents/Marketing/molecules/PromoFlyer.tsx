"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Printer, QrCode } from "lucide-react";
import { cn } from "~/utils/cn";

// ---------------------------------------------------------------------------
// Template types
// ---------------------------------------------------------------------------

type FlyerTemplate = "simple" | "modern" | "elegant";

const TEMPLATES: { value: FlyerTemplate; labelKey: string }[] = [
  { value: "simple", labelKey: "marketing.flyer.templateSimple" },
  { value: "modern", labelKey: "marketing.flyer.templateModern" },
  { value: "elegant", labelKey: "marketing.flyer.templateElegant" },
];

// ---------------------------------------------------------------------------
// Flyer Preview
// ---------------------------------------------------------------------------

function FlyerPreview({
  template,
  restaurantName,
  promoText,
  scanLabel,
}: {
  template: FlyerTemplate;
  restaurantName: string;
  promoText: string;
  scanLabel: string;
}) {
  if (template === "simple") {
    return (
      <div className="flex h-[500px] w-[360px] flex-col items-center justify-between border-2 border-border bg-white p-8 text-center text-black">
        <h2 className="text-2xl font-bold">{restaurantName || "..."}</h2>
        <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <QrCode className="mx-auto h-16 w-16 text-gray-400" />
            <p className="mt-2 text-xs text-gray-400">{scanLabel}</p>
          </div>
        </div>
        <p className="max-w-[280px] text-sm text-gray-600">
          {promoText || "..."}
        </p>
      </div>
    );
  }

  if (template === "modern") {
    return (
      <div className="flex h-[500px] w-[360px] flex-col items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-8 text-center text-white shadow-lg">
        <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">
          {restaurantName || "..."}
        </h2>
        <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white/95 shadow-md">
          <div className="text-center">
            <QrCode className="mx-auto h-16 w-16 text-primary" />
            <p className="mt-2 text-xs font-medium text-primary/70">
              {scanLabel}
            </p>
          </div>
        </div>
        <p className="max-w-[280px] text-sm font-medium text-white/90">
          {promoText || "..."}
        </p>
      </div>
    );
  }

  // Elegant
  return (
    <div className="flex h-[500px] w-[360px] flex-col items-center justify-between border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-8 text-center text-gray-900">
      <div>
        <div className="mx-auto mb-2 h-px w-20 bg-amber-400" />
        <h2 className="font-serif text-2xl font-bold italic tracking-wide">
          {restaurantName || "..."}
        </h2>
        <div className="mx-auto mt-2 h-px w-20 bg-amber-400" />
      </div>
      <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-amber-200 bg-white shadow-sm">
        <div className="text-center">
          <QrCode className="mx-auto h-16 w-16 text-amber-700" />
          <p className="mt-2 text-xs text-amber-600">{scanLabel}</p>
        </div>
      </div>
      <p className="max-w-[280px] font-serif text-sm italic text-gray-600">
        {promoText || "..."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PromoFlyer() {
  const { t } = useTranslation();
  const [template, setTemplate] = useState<FlyerTemplate>("modern");
  const [restaurantName, setRestaurantName] = useState("");
  const [promoText, setPromoText] = useState("");
  const flyerRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    // Open a new window with just the flyer for printing
    const flyerEl = flyerRef.current;

    if (!flyerEl) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");

    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Promotional Flyer</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: white;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${flyerEl.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to render, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controls */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            {t("marketing.flyer.title")}
          </CardTitle>
          <CardDescription>
            {t("marketing.flyer.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Restaurant Name */}
          <div>
            <label
              htmlFor="flyer-restaurant"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("marketing.flyer.restaurantName")}
            </label>
            <Input
              id="flyer-restaurant"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder={t("marketing.flyer.restaurantName")}
            />
          </div>

          {/* Promotional Text */}
          <div>
            <label
              htmlFor="flyer-promo"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("marketing.flyer.promoText")}
            </label>
            <Textarea
              id="flyer-promo"
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder={t("marketing.flyer.promoPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Template selection */}
          <div>
            <p className="mb-2 text-sm font-medium">
              {t("marketing.flyer.template")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.value}
                  onClick={() => setTemplate(tmpl.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200",
                    template === tmpl.value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30",
                  )}
                >
                  {t(tmpl.labelKey as never)}
                </button>
              ))}
            </div>
          </div>

          {/* Print button */}
          <Button onClick={handlePrint} className="w-full gap-2">
            <Printer className="h-4 w-4" />
            {t("marketing.flyer.printFlyer")}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="flex items-start justify-center">
        <div className="overflow-hidden rounded-xl shadow-lg" ref={flyerRef}>
          <FlyerPreview
            template={template}
            restaurantName={restaurantName}
            promoText={promoText}
            scanLabel={t("marketing.flyer.scanToOrder")}
          />
        </div>
      </div>
    </div>
  );
}
