"use client";

import * as React from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { Copy, FileImage, FileCode, QrCode } from "lucide-react";
import {
  QRCustomizationControls,
  QR_SIZE_PRESETS,
  type QRSizePreset,
} from "./QRCustomizationControls";
import { useQRDownload } from "./useQRDownload";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  restaurantName?: string;
  logoUrl?: string;
}

export function QRCodeDialog({
  open,
  onOpenChange,
  slug,
  restaurantName,
  logoUrl,
}: QRCodeDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [sizePreset, setSizePreset] = React.useState<QRSizePreset>("medium");
  const [fgColor, setFgColor] = React.useState("#000000");
  const [bgColor, setBgColor] = React.useState("#FFFFFF");
  const [includeLogo, setIncludeLogo] = React.useState(false);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<HTMLDivElement>(null);

  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${slug}`
      : `/menu/${slug}`;

  const previewSize = 200;
  const downloadSize = QR_SIZE_PRESETS[sizePreset];

  const { handleDownloadPng, handleDownloadSvg } = useQRDownload({
    slug,
    downloadSize,
    canvasRef: canvasRef as React.RefObject<HTMLDivElement>,
    svgRef: svgRef as React.RefObject<HTMLDivElement>,
  });

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast({ title: t("qrCode.urlCopied") });
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");

      textArea.value = menuUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({ title: t("qrCode.urlCopied") });
    }
  };

  const imageSettings =
    includeLogo && logoUrl
      ? {
          src: logoUrl,
          height: Math.round(previewSize * 0.2),
          width: Math.round(previewSize * 0.2),
          excavate: true,
        }
      : undefined;

  const canvasImageSettings =
    includeLogo && logoUrl
      ? {
          src: logoUrl,
          height: Math.round(downloadSize * 0.2),
          width: Math.round(downloadSize * 0.2),
          excavate: true,
        }
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t("qrCode.title")}
          </DialogTitle>
          <DialogDescription>{t("qrCode.scanToView")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Preview */}
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-6">
            {restaurantName && (
              <p className="text-sm font-semibold text-gray-700">
                {restaurantName}
              </p>
            )}
            <div ref={svgRef} role="img" aria-label={t("qrCode.title")}>
              <QRCodeSVG
                value={menuUrl}
                size={previewSize}
                fgColor={fgColor}
                bgColor={bgColor}
                level="H"
                imageSettings={imageSettings}
              />
            </div>
            <p className="text-xs text-gray-500">{t("qrCode.scanToView")}</p>
          </div>

          {/* Hidden high-res canvas for PNG download */}
          <div ref={canvasRef} className="hidden">
            <QRCodeCanvas
              value={menuUrl}
              size={downloadSize}
              fgColor={fgColor}
              bgColor={bgColor}
              level="H"
              imageSettings={canvasImageSettings}
            />
          </div>

          {/* URL Display + Copy */}
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <p className="flex-1 truncate text-sm text-muted-foreground">
              {menuUrl}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleCopyUrl()}
              className="shrink-0"
              aria-label={t("qrCode.urlCopied")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Customization Options */}
          <QRCustomizationControls
            sizePreset={sizePreset}
            onSizePresetChange={setSizePreset}
            fgColor={fgColor}
            onFgColorChange={setFgColor}
            bgColor={bgColor}
            onBgColorChange={setBgColor}
            logoUrl={logoUrl}
            includeLogo={includeLogo}
            onIncludeLogoChange={setIncludeLogo}
          />

          {/* Download Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleDownloadPng}
              variant="default"
            >
              <FileImage className="mr-2 h-4 w-4" />
              {t("qrCode.downloadPng")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownloadSvg}
              variant="outline"
            >
              <FileCode className="mr-2 h-4 w-4" />
              {t("qrCode.downloadSvg")}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t("qrCode.printReady")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export QRCodePreview from its new file for backward compatibility
export { QRCodePreview } from "./QRCodePreview";
