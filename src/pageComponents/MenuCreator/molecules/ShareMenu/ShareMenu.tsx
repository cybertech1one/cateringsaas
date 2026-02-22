"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Copy,
  Share2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { getBaseUrl } from "~/utils/getBaseUrl";

interface ShareMenuProps {
  slug: string;
}

export function ShareMenu({ slug }: ShareMenuProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const publicUrl = `${getBaseUrl()}/menu/${slug}`;

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);

      toast({
        title: t("menuManagement.urlCopied"),
      });
    } catch {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    }
  }, [publicUrl, toast, t]);

  return (
    <div className="ml-auto flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" aria-label={t("menuManagement.shareMenu")}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline" aria-hidden="true">
              {t("menuManagement.shareMenu")}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={handleCopyUrl}
            className="cursor-pointer gap-2"
          >
            <Copy className="h-4 w-4" />
            {t("menuManagement.copyUrl")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => window.open(publicUrl, "_blank")}
            className="cursor-pointer gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t("dashboard.viewPublicMenu")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
