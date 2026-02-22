"use client";

import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { RotateCcw, Save } from "lucide-react";

export interface ThemeActionsProps {
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  isResetting: boolean;
  hasUnsavedChanges: boolean;
}

export function ThemeActions({
  onSave,
  onReset,
  isSaving,
  isResetting,
  hasUnsavedChanges,
}: ThemeActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 bg-card/95 px-6 py-4 backdrop-blur-sm">
      <div className="flex gap-3">
        <Button
          className="flex-1 rounded-full shadow-sm"
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? t("themeEditor.saving") : t("themeEditor.save")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={isResetting}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("themeEditor.reset")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("themeEditor.reset")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("themeEditor.resetConfirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("themeEditor.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onReset}>
                {t("themeEditor.reset")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
