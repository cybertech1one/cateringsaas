"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Icons } from "~/components/Icons";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { Copy, Download, ExternalLink, FileDown, Paintbrush, QrCode } from "lucide-react";

// Lazy-load dialog components - they include heavy dependencies (qrcode.react)
// and are only rendered when user explicitly opens them from the dropdown menu
const QRCodeDialog = dynamic(
  () => import("~/components/QRCodeDialog/QRCodeDialog").then((mod) => ({ default: mod.QRCodeDialog })),
  { ssr: false },
);
const ExportMenuDialog = dynamic(
  () => import("~/components/ExportMenu/ExportMenuDialog").then((mod) => ({ default: mod.ExportMenuDialog })),
  { ssr: false },
);

interface MenuOperationProps {
  menuId: string;
  slug?: string;
}

export function MenuOperations({ menuId, slug }: MenuOperationProps) {
  const [showDeleteAlert, setShowDeleteAlert] = React.useState<boolean>(false);
  const [showQRDialog, setShowQRDialog] = React.useState<boolean>(false);
  const [showExportDialog, setShowExportDialog] = React.useState<boolean>(false);
  const { mutateAsync, isLoading } = api.menus.deleteMenu.useMutation();
  const duplicateMenu = api.menus.duplicateMenu.useMutation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const utils = api.useContext();

  const handleDeleteMenu = async () => {
    try {
      await mutateAsync({ menuId });
      setShowDeleteAlert(false);
      toast({
        title: t("menuOperations.menuDeleted"),
        description: t("menuOperations.menuDeletedDescription"),
      });
      void utils.menus.getMenus.invalidate();
    } catch {
      toast({
        title: t("toast.error"),
        description: t("toast.errorDescription"),
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async () => {
    try {
      const result = await duplicateMenu.mutateAsync({ menuId });

      toast({
        title: t("menuManagement.duplicated"),
        description: t("menuManagement.duplicateDescription"),
      });
      void utils.menus.getMenus.invalidate();
      router.push(`/menu/manage/${result.slug}/restaurant`);
    } catch {
      toast({
        title: t("menuManagement.duplicateFailed"),
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = () => {
    if (slug) {
      void navigator.clipboard.writeText(
        `${window.location.origin}/menu/${slug}`,
      );
      toast({
        title: t("menuManagement.urlCopied"),
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted">
          <Icons.ellipsis className="h-4 w-4" />
          <span className="sr-only">{t("menuOperations.open")}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {slug && (
            <DropdownMenuItem >
              <Link href={`/menu/manage/${slug}/restaurant`} className="flex w-full items-center gap-2">
                <Icons.edit className="h-3.5 w-3.5" />
                {t("menuOperations.editMenu")}
              </Link>
            </DropdownMenuItem>
          )}
          {slug && (
            <DropdownMenuItem >
              <Link href={`/menu/manage/${slug}/design`} className="flex w-full items-center gap-2">
                <Paintbrush className="h-3.5 w-3.5" />
                {t("sidebar.design")}
              </Link>
            </DropdownMenuItem>
          )}
          {slug && (
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2"
              onSelect={handleCopyUrl}
            >
              <Copy className="h-3.5 w-3.5" />
              {t("menuManagement.copyUrl")}
            </DropdownMenuItem>
          )}
          {slug && (
            <DropdownMenuItem >
              <Link href={`/menu/${slug}`} target="_blank" className="flex w-full items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                {t("dashboard.viewPublicMenu")}
              </Link>
            </DropdownMenuItem>
          )}
          {slug && (
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2"
              onSelect={() => setShowQRDialog(true)}
            >
              <QrCode className="h-3.5 w-3.5" />
              {t("menuManagement.downloadQr")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            onSelect={() => setShowExportDialog(true)}
          >
            <FileDown className="h-3.5 w-3.5" />
            {t("menuManagement.export")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            onSelect={() => void handleDuplicate()}
            disabled={duplicateMenu.isLoading}
          >
            <Download className="h-3.5 w-3.5" />
            {duplicateMenu.isLoading
              ? t("menuManagement.duplicating")
              : t("menuManagement.duplicate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
            onSelect={() => setShowDeleteAlert(true)}
          >
            <Icons.trash className="h-3.5 w-3.5" />
            {t("menuOperations.deleteMenu")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {slug && (
        <QRCodeDialog
          open={showQRDialog}
          onOpenChange={setShowQRDialog}
          slug={slug}
        />
      )}
      <ExportMenuDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        menuId={menuId}
      />
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("menuOperations.areYouSureYouWantToDeleteThisMenu")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("menuOperations.itCannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("menuOperations.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteMenu()}
              className="bg-red-600 focus:ring-red-600"
            >
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.trash className="mr-2 h-4 w-4" />
              )}
              <span>{t("menuOperations.delete")}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
