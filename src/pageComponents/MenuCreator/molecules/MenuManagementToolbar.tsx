"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Copy,
  Download,
  BarChart3,
} from "lucide-react";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { StatsContent } from "./StatsPanel/StatsPanel";
import { ShareMenu } from "./ShareMenu/ShareMenu";

interface MenuManagementToolbarProps {
  menuId: string;
  slug: string;
}

export function MenuManagementToolbar({
  menuId,
  slug,
}: MenuManagementToolbarProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [showStats, setShowStats] = useState(false);

  // --- Duplicate Menu ---
  const {
    mutateAsync: duplicateMenu,
    isLoading: isDuplicating,
  } = api.menus.duplicateMenu.useMutation();

  const handleDuplicate = useCallback(async () => {
    try {
      const newMenu = await duplicateMenu({ menuId });

      toast({
        title: t("menuManagement.duplicated"),
        description: t("menuManagement.duplicateDescription"),
      });
      router.push(`/menu/manage/${newMenu.slug}/restaurant`);
    } catch {
      toast({
        title: t("menuManagement.duplicateFailed"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    }
  }, [duplicateMenu, menuId, toast, t, router]);

  // --- Export Menu ---
  const {
    refetch: fetchExportData,
    isFetching: isExporting,
  } = api.menus.exportMenu.useQuery(
    { menuId },
    { enabled: false },
  );

  const handleExport = useCallback(async () => {
    try {
      const { data } = await fetchExportData();

      if (!data) {
        toast({
          title: t("toastCommon.errorTitle"),
          description: t("toastCommon.errorDescription"),
          variant: "destructive",
        });

        return;
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;

      anchor.download = `menu-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    }
  }, [fetchExportData, slug, toast, t]);

  // --- Menu Stats ---
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = api.menus.getMenuStats.useQuery(
    { menuId },
    { enabled: showStats },
  );

  const handleToggleStats = useCallback(() => {
    setShowStats((prev) => {
      const next = !prev;

      if (next) {
        void refetchStats();
      }

      return next;
    });
  }, [refetchStats]);

  // --- Format price from cents ---
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="w-full space-y-3">
      {/* Toolbar Row */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-4 py-3 backdrop-blur-sm">
        {/* Left: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            loading={isDuplicating}
            className="gap-2"
            aria-label={isDuplicating
              ? t("menuManagement.duplicating")
              : t("menuManagement.duplicate")}
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline" aria-hidden="true">
              {isDuplicating
                ? t("menuManagement.duplicating")
                : t("menuManagement.duplicate")}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            loading={isExporting}
            className="gap-2"
            aria-label={isExporting
              ? t("menuManagement.exporting")
              : t("menuManagement.export")}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline" aria-hidden="true">
              {isExporting
                ? t("menuManagement.exporting")
                : t("menuManagement.export")}
            </span>
          </Button>

          <Button
            variant={showStats ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleStats}
            className="gap-2"
            aria-label={t("menuManagement.stats")}
            aria-expanded={showStats}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline" aria-hidden="true">
              {t("menuManagement.stats")}
            </span>
          </Button>
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-border/50 md:block" />

        {/* Right: Share Actions */}
        <ShareMenu slug={slug} />
      </div>

      {/* Stats Panel (collapsible) */}
      {showStats && (
        <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <StatsContent
              isLoading={isStatsLoading}
              stats={stats}
              formatPrice={formatPrice}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
