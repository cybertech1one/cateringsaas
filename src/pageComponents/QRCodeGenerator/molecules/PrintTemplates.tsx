"use client";

import { useTranslation } from "react-i18next";
import { type QRCustomizationOptions, type QRFrameTemplate } from "../QRCodeGenerator.types";
import { QRCodePreview } from "./QRCodePreview";
import { cn } from "~/utils/cn";

interface TemplateCardProps {
  template: QRFrameTemplate;
  isSelected: boolean;
  onSelect: () => void;
  label: string;
  description: string;
}

function TemplateCard({
  isSelected,
  onSelect,
  label,
  description,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors hover:border-primary/50",
        isSelected ? "border-primary bg-primary/5" : "border-muted",
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

interface TemplatesPanelProps {
  options: QRCustomizationOptions;
  onChange: (options: QRCustomizationOptions) => void;
}

export function TemplatesPanel({ options, onChange }: TemplatesPanelProps) {
  const { t } = useTranslation();

  const templates: {
    id: QRFrameTemplate;
    label: string;
    description: string;
  }[] = [
    {
      id: "none",
      label: t("qrGenerator.templateNone"),
      description: t("qrGenerator.templateNoneDesc"),
    },
    {
      id: "simple",
      label: t("qrGenerator.templateSimple"),
      description: t("qrGenerator.templateSimpleDesc"),
    },
    {
      id: "tableTent",
      label: t("qrGenerator.templateTableTent"),
      description: t("qrGenerator.templateTableTentDesc"),
    },
    {
      id: "businessCard",
      label: t("qrGenerator.templateBusinessCard"),
      description: t("qrGenerator.templateBusinessCardDesc"),
    },
    {
      id: "sticker",
      label: t("qrGenerator.templateSticker"),
      description: t("qrGenerator.templateStickerDesc"),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("qrGenerator.templateDescription")}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((tmpl) => (
          <TemplateCard
            key={tmpl.id}
            template={tmpl.id}
            isSelected={options.frameTemplate === tmpl.id}
            onSelect={() => onChange({ ...options, frameTemplate: tmpl.id })}
            label={tmpl.label}
            description={tmpl.description}
          />
        ))}
      </div>
    </div>
  );
}

// --- Print Template Renderers ---

interface PrintTemplateProps {
  url: string;
  options: QRCustomizationOptions;
  restaurantName: string;
}

export function SimpleFrameTemplate({
  url,
  options,
  restaurantName,
}: PrintTemplateProps) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl border-4 p-8"
      style={{ borderColor: options.fgColor, backgroundColor: options.bgColor }}
    >
      <h2
        className="text-2xl font-bold"
        style={{ color: options.fgColor }}
      >
        {restaurantName}
      </h2>
      <QRCodePreview url={url} options={options} size={200} />
      <p className="text-sm font-medium" style={{ color: options.fgColor }}>
        Scan to view our menu
      </p>
    </div>
  );
}

export function TableTentTemplate({
  url,
  options,
  restaurantName,
}: PrintTemplateProps) {
  return (
    <div
      className="flex w-[280px] flex-col items-center rounded-2xl border-2 shadow-lg"
      style={{ borderColor: options.fgColor, backgroundColor: options.bgColor }}
    >
      {/* Top fold section */}
      <div className="flex w-full flex-col items-center gap-2 border-b border-dashed px-6 py-6" style={{ borderColor: options.fgColor }}>
        <h2
          className="text-center text-xl font-extrabold uppercase tracking-widest"
          style={{ color: options.fgColor }}
        >
          {restaurantName}
        </h2>
        <div className="h-0.5 w-12" style={{ backgroundColor: options.fgColor }} />
      </div>
      {/* QR section */}
      <div className="flex flex-col items-center gap-4 px-6 py-6">
        <QRCodePreview url={url} options={options} size={180} />
        <div className="text-center">
          <p
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: options.fgColor }}
          >
            Scan for Menu
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: options.fgColor, opacity: 0.7 }}
          >
            Point your camera at the QR code
          </p>
        </div>
      </div>
    </div>
  );
}

export function BusinessCardTemplate({
  url,
  options,
  restaurantName,
}: PrintTemplateProps) {
  return (
    <div
      className="flex w-[320px] items-center gap-4 rounded-lg border p-4"
      style={{ borderColor: options.fgColor, backgroundColor: options.bgColor }}
    >
      <QRCodePreview url={url} options={options} size={100} />
      <div className="flex flex-col gap-1">
        <h3
          className="text-base font-bold"
          style={{ color: options.fgColor }}
        >
          {restaurantName}
        </h3>
        <p
          className="text-xs"
          style={{ color: options.fgColor, opacity: 0.6 }}
        >
          Scan QR for our full menu
        </p>
      </div>
    </div>
  );
}

export function StickerTemplate({
  url,
  options,
  restaurantName,
}: PrintTemplateProps) {
  return (
    <div
      className="flex h-[240px] w-[240px] flex-col items-center justify-center gap-3 rounded-full border-4"
      style={{ borderColor: options.fgColor, backgroundColor: options.bgColor }}
    >
      <p
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: options.fgColor }}
      >
        {restaurantName}
      </p>
      <QRCodePreview url={url} options={options} size={120} />
      <p
        className="text-[10px] uppercase tracking-wide"
        style={{ color: options.fgColor, opacity: 0.7 }}
      >
        Scan Me
      </p>
    </div>
  );
}

export function TemplatePreview({ url, options, restaurantName }: PrintTemplateProps) {
  switch (options.frameTemplate) {
    case "simple":
      return (
        <SimpleFrameTemplate
          url={url}
          options={options}
          restaurantName={restaurantName}
        />
      );
    case "tableTent":
      return (
        <TableTentTemplate
          url={url}
          options={options}
          restaurantName={restaurantName}
        />
      );
    case "businessCard":
      return (
        <BusinessCardTemplate
          url={url}
          options={options}
          restaurantName={restaurantName}
        />
      );
    case "sticker":
      return (
        <StickerTemplate
          url={url}
          options={options}
          restaurantName={restaurantName}
        />
      );
    case "none":
    default:
      return null;
  }
}
