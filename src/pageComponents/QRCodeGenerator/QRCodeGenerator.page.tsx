"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  type QRCustomizationOptions,
  DEFAULT_QR_OPTIONS,
} from "./QRCodeGenerator.types";
import { QRCodePreview } from "./molecules/QRCodePreview";
import { CustomizePanel } from "./molecules/CustomizePanel";
import { TemplatesPanel, TemplatePreview } from "./molecules/PrintTemplates";
import { DownloadPanel } from "./molecules/DownloadPanel";
import { useQRCodeDownload } from "./hooks/useQRCodeDownload";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { MessageSquare, QrCode } from "lucide-react";

type QRMode = "menu" | "feedback";

interface QRCodeGeneratorPageProps {
  slug: string;
}

export function QRCodeGeneratorPage({ slug }: QRCodeGeneratorPageProps) {
  const { t } = useTranslation();
  const { data: menuData } = api.menus.getMenuBySlug.useQuery({ slug });

  const [options, setOptions] = useState<QRCustomizationOptions>({
    ...DEFAULT_QR_OPTIONS,
  });
  const [qrMode, setQrMode] = useState<QRMode>("menu");

  const qrRef = useRef<SVGSVGElement | null>(null);

  const baseUrl = getBaseUrl();
  const menuUrl = `${baseUrl}/menu/${slug}`;
  const feedbackUrl = `${baseUrl}/feedback/${slug}`;
  const activeUrl = qrMode === "menu" ? menuUrl : feedbackUrl;
  const restaurantName = menuData?.name ?? "";
  const menuLogoUrl = menuData?.logoImageUrl ?? null;

  // When menu data loads and has a logo, update the logo URL in options
  const logoUrlRef = useRef<string | null>(null);

  if (menuLogoUrl && logoUrlRef.current !== menuLogoUrl) {
    logoUrlRef.current = menuLogoUrl;
    if (options.logoUrl === null) {
      setOptions((prev) => ({ ...prev, logoUrl: menuLogoUrl }));
    }
  }

  const { downloadPNG, downloadSVG, downloadPDF, copyToClipboard } =
    useQRCodeDownload(qrRef, options, restaurantName);

  return (
    <div className="flex w-full flex-col gap-6 px-4 pb-8 md:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {t("qrGenerator.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("qrGenerator.subtitle")}
        </p>
      </div>

      {/* QR Mode Toggle: Menu vs Feedback */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {t("qrGenerator.qrModeDescription")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setQrMode("menu")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              qrMode === "menu"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <QrCode className="h-4 w-4" />
            {t("qrGenerator.menuQrToggle")}
          </button>
          <button
            type="button"
            onClick={() => setQrMode("feedback")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              qrMode === "feedback"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {t("qrGenerator.feedbackQrToggle")}
          </button>
        </div>
      </div>

      {/* Feedback QR info banner */}
      {qrMode === "feedback" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h3 className="font-display text-sm font-semibold">
              {t("feedbackQr.title")}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("feedbackQr.description")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left: Options Panel */}
        <div className="w-full lg:w-[400px] lg:shrink-0">
          <Tabs defaultValue="customize" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customize">
                {t("qrGenerator.tabCustomize")}
              </TabsTrigger>
              <TabsTrigger value="templates">
                {t("qrGenerator.tabTemplates")}
              </TabsTrigger>
              <TabsTrigger value="download">
                {t("qrGenerator.tabDownload")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customize" className="mt-4">
              <CustomizePanel
                options={options}
                onChange={setOptions}
                menuLogoUrl={menuLogoUrl}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <TemplatesPanel options={options} onChange={setOptions} />
            </TabsContent>

            <TabsContent value="download" className="mt-4">
              <DownloadPanel
                onDownloadPNG={downloadPNG}
                onDownloadSVG={downloadSVG}
                onDownloadPDF={downloadPDF}
                onCopyToClipboard={copyToClipboard}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Preview */}
        <div className="flex flex-1 flex-col items-center gap-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("qrGenerator.livePreview")}
              </h2>

              {options.frameTemplate === "none" ? (
                <div
                  className="rounded-lg p-6"
                  style={{ backgroundColor: options.bgColor }}
                >
                  <QRCodePreview
                    ref={qrRef}
                    url={activeUrl}
                    options={options}
                    size={256}
                  />
                </div>
              ) : (
                <TemplatePreview
                  url={activeUrl}
                  options={options}
                  restaurantName={restaurantName}
                />
              )}

              {/* Hidden SVG ref for downloads when using template view */}
              {options.frameTemplate !== "none" && (
                <div className="hidden">
                  <QRCodePreview
                    ref={qrRef}
                    url={activeUrl}
                    options={options}
                    size={256}
                  />
                </div>
              )}

              <p className="max-w-[300px] truncate text-center text-xs text-muted-foreground">
                {activeUrl}
              </p>
            </div>
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>
              {t("qrGenerator.errorCorrectionLabel")}: {options.errorCorrection}
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span>
              {t("qrGenerator.moduleStyleLabel")}: {t(`qrGenerator.style${options.moduleStyle.charAt(0).toUpperCase() + options.moduleStyle.slice(1)}` as "qrGenerator.styleSquare")}
            </span>
            {options.includeLogo && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span>
                  {t("qrGenerator.logoLabel")}: {options.logoSizePercent}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
