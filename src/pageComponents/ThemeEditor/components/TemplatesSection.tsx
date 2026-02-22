"use client";

import { useTranslation } from "react-i18next";
import { cn } from "~/utils/cn";
import { type MenuTheme } from "~/lib/theme";

interface TemplateData {
  id: string;
  name: string;
  description: string;
  preview: string;
  theme: MenuTheme;
}

export interface TemplatesSectionProps {
  templates: TemplateData[] | undefined;
  menuId: string;
  isApplying: boolean;
  onApplyTemplate: (menuId: string, templateId: string) => void;
}

export function TemplatesSection({
  templates,
  menuId,
  isApplying,
  onApplyTemplate,
}: TemplatesSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("themeEditor.templatesDescription")}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {templates?.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() =>
              menuId && onApplyTemplate(menuId, tpl.id)
            }
            disabled={isApplying}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all",
              "border-border/40 bg-card/70 hover:border-border hover:bg-card hover:shadow-sm",
            )}
          >
            {/* Color swatch row with gradient preview */}
            <div className="flex w-full items-center gap-2">
              <div
                className="h-8 w-full rounded-md border border-border/20"
                style={{
                  background:
                    tpl.preview ||
                    `linear-gradient(135deg, ${tpl.theme.backgroundColor} 0%, ${tpl.theme.primaryColor} 100%)`,
                }}
              />
            </div>
            <div className="flex gap-1">
              {[
                tpl.theme.primaryColor,
                tpl.theme.secondaryColor,
                tpl.theme.backgroundColor,
                tpl.theme.accentColor,
              ].map((color, idx) => (
                <span
                  key={idx}
                  className="h-3.5 w-3.5 rounded-full border border-border/30 shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {tpl.name}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {tpl.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
