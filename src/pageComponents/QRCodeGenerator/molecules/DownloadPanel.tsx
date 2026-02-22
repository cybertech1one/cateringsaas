"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  FileImage,
  FileText,
  Copy,
  Check,
  Printer,
} from "lucide-react";
import { Button } from "~/components/ui/button";

interface DownloadPanelProps {
  onDownloadPNG: () => Promise<void>;
  onDownloadSVG: () => void;
  onDownloadPDF: () => Promise<void>;
  onCopyToClipboard: () => Promise<boolean>;
}

export function DownloadPanel({
  onDownloadPNG,
  onDownloadSVG,
  onDownloadPDF,
  onCopyToClipboard,
}: DownloadPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleCopy = async () => {
    const success = await onCopyToClipboard();

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (
    format: string,
    fn: () => void | Promise<void>,
  ) => {
    setDownloading(format);
    try {
      await fn();
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("qrGenerator.downloadDescription")}
      </p>

      <div className="flex flex-col gap-3">
        {/* PNG Download */}
        <Button
          variant="outline"
          className="flex w-full items-center justify-start gap-3 px-4 py-6"
          onClick={() => handleDownload("png", onDownloadPNG)}
          loading={downloading === "png"}
        >
          <FileImage className="h-5 w-5 text-blue-500" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-semibold">
              {t("qrGenerator.downloadPNG")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("qrGenerator.downloadPNGDesc")}
            </span>
          </div>
          <Download className="ml-auto h-4 w-4" />
        </Button>

        {/* SVG Download */}
        <Button
          variant="outline"
          className="flex w-full items-center justify-start gap-3 px-4 py-6"
          onClick={() => handleDownload("svg", onDownloadSVG)}
          loading={downloading === "svg"}
        >
          <FileText className="h-5 w-5 text-green-500" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-semibold">
              {t("qrGenerator.downloadSVG")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("qrGenerator.downloadSVGDesc")}
            </span>
          </div>
          <Download className="ml-auto h-4 w-4" />
        </Button>

        {/* PDF Download */}
        <Button
          variant="outline"
          className="flex w-full items-center justify-start gap-3 px-4 py-6"
          onClick={() => handleDownload("pdf", onDownloadPDF)}
          loading={downloading === "pdf"}
        >
          <Printer className="h-5 w-5 text-red-500" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-semibold">
              {t("qrGenerator.downloadPDF")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("qrGenerator.downloadPDFDesc")}
            </span>
          </div>
          <Download className="ml-auto h-4 w-4" />
        </Button>

        {/* Copy to Clipboard */}
        <Button
          variant="outline"
          className="flex w-full items-center justify-start gap-3 px-4 py-6"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5 text-purple-500" />
          )}
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-semibold">
              {copied
                ? t("qrGenerator.copiedToClipboard")
                : t("qrGenerator.copyToClipboard")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("qrGenerator.copyToClipboardDesc")}
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}
