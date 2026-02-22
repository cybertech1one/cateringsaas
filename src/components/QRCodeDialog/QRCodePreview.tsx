"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

interface QRCodePreviewProps {
  slug: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  restaurantName?: string;
  logoUrl?: string;
  includeLogo?: boolean;
  className?: string;
}

export function QRCodePreview({
  slug,
  size = 200,
  fgColor = "#000000",
  bgColor = "#FFFFFF",
  restaurantName,
  logoUrl,
  includeLogo = false,
  className,
}: QRCodePreviewProps) {
  const { t } = useTranslation();

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${slug}`
      : `/menu/${slug}`;

  const imageSettings =
    includeLogo && logoUrl
      ? {
          src: logoUrl,
          height: Math.round(size * 0.2),
          width: Math.round(size * 0.2),
          excavate: true,
        }
      : undefined;

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ""}`}>
      {restaurantName && (
        <p className="text-sm font-semibold">{restaurantName}</p>
      )}
      <QRCodeSVG
        value={menuUrl}
        size={size}
        fgColor={fgColor}
        bgColor={bgColor}
        level="H"
        imageSettings={imageSettings}
      />
      <p className="text-xs text-muted-foreground">
        {t("qrCode.scanToView")}
      </p>
    </div>
  );
}
