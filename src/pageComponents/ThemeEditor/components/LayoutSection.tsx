"use client";

import { useTranslation } from "react-i18next";
import { LayoutGrid } from "lucide-react";
import { type LayoutStyle } from "~/lib/theme";
import {
  type ThemeSectionProps,
  SectionHeader,
  OptionCard,
  LayoutIcon,
  LAYOUT_KEYS,
} from "./shared";

export function LayoutSection({ theme, onUpdate }: ThemeSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeader icon={<LayoutGrid className="h-4 w-4" />}>
        {t("themeEditor.layout")}
      </SectionHeader>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            "classic",
            "modern",
            "grid",
            "magazine",
            "minimal",
            "elegant",
          ] as LayoutStyle[]
        ).map((layout) => (
          <OptionCard
            key={layout}
            value={layout}
            currentValue={theme.layoutStyle}
            onSelect={(v) => onUpdate("layoutStyle", v)}
            className="gap-1.5 py-3"
          >
            <LayoutIcon type={layout} />
            <span className="text-xs font-medium">
              {t(LAYOUT_KEYS[layout]!)}
            </span>
          </OptionCard>
        ))}
      </div>
    </section>
  );
}
