"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { FileSpreadsheet, FileJson, Download } from "lucide-react";

type ExportFormat = "csv" | "json";

interface ExportMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  menuName?: string;
}

export function ExportMenuDialog({
  open,
  onOpenChange,
  menuId,
  menuName,
}: ExportMenuDialogProps) {
  const { t } = useTranslation();
  const [format, setFormat] = React.useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = React.useState(false);

  // Fetch menu data via cateringMenus.getById for export
  const menuQuery = api.cateringMenus.getById.useQuery(
    { menuId },
    { enabled: false },
  );

  const triggerDownload = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    setIsExporting(true);

    try {
      const result = await menuQuery.refetch();
      if (!result.data) return;

      const menuData = result.data;
      const slugPart = menuName
        ? menuName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)
        : (menuData.slug ?? "menu");
      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === "csv") {
        // Build CSV from menu categories and items
        const rows = ["Name,Category,Price,Description"];
        const categories = (menuData as unknown as { categories?: Array<{ name: string; cateringItems?: Array<{ name: string; pricePerPerson?: number; description?: string | null }> }> }).categories ?? [];
        for (const cat of categories) {
          for (const item of cat.cateringItems ?? []) {
            rows.push(
              [item.name, cat.name, item.pricePerPerson ?? 0, item.description ?? ""]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(","),
            );
          }
        }
        triggerDownload(
          rows.join("\n"),
          `${slugPart}-${timestamp}.csv`,
          "text/csv;charset=utf-8",
        );
      } else {
        triggerDownload(
          JSON.stringify(menuData, null, 2),
          `${slugPart}-${timestamp}.json`,
          "application/json;charset=utf-8",
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("export.title")}
          </DialogTitle>
          <DialogDescription>
            {menuName ?? t("export.title")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>{t("export.format")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  format === "csv"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <FileSpreadsheet
                  className={`h-8 w-8 ${
                    format === "csv" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    format === "csv" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t("export.csv")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  format === "json"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <FileJson
                  className={`h-8 w-8 ${
                    format === "json" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    format === "json" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t("export.json")}
                </span>
              </button>
            </div>
          </div>

          {/* Download Button */}
          <Button
            className="w-full"
            onClick={() => void handleDownload()}
            disabled={isExporting}
            loading={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? t("export.exporting") : t("export.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
