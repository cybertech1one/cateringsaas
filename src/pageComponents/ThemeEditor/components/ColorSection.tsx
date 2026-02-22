"use client";

import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";
import {
  type ThemeSectionProps,
  SectionHeader,
  ColorPickerField,
} from "./shared";

export function ColorSection({ theme, onUpdate }: ThemeSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeader icon={<Palette className="h-4 w-4" />}>
        {t("themeEditor.colors")}
      </SectionHeader>
      <div className="space-y-3">
        <ColorPickerField
          label={t("themeEditor.primaryColor")}
          value={theme.primaryColor}
          onChange={(v) => onUpdate("primaryColor", v)}
        />
        <ColorPickerField
          label={t("themeEditor.secondaryColor")}
          value={theme.secondaryColor}
          onChange={(v) => onUpdate("secondaryColor", v)}
        />
        <ColorPickerField
          label={t("themeEditor.backgroundColor")}
          value={theme.backgroundColor}
          onChange={(v) => onUpdate("backgroundColor", v)}
        />
        <ColorPickerField
          label={t("themeEditor.surfaceColor")}
          value={theme.surfaceColor}
          onChange={(v) => onUpdate("surfaceColor", v)}
        />
        <ColorPickerField
          label={t("themeEditor.textColor")}
          value={theme.textColor}
          onChange={(v) => onUpdate("textColor", v)}
        />
        <ColorPickerField
          label={t("themeEditor.accentColor")}
          value={theme.accentColor}
          onChange={(v) => onUpdate("accentColor", v)}
        />
      </div>
    </section>
  );
}
