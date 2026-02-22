"use client";

import { useTranslation } from "react-i18next";
import { Square } from "lucide-react";
import {
  type CardStyle,
  type BorderRadius,
  type Spacing,
} from "~/lib/theme";
import { Label } from "~/components/ui/label";
import {
  type ThemeSectionProps,
  SectionHeader,
  OptionCard,
  CardStylePreview,
  BorderRadiusPreview,
  SpacingPreview,
  CARD_KEYS,
  RADIUS_KEYS,
  SPACING_KEYS,
} from "./shared";

export function SpacingSection({ theme, onUpdate }: ThemeSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeader icon={<Square className="h-4 w-4" />}>
        {t("themeEditor.cardAndSpacing")}
      </SectionHeader>
      <div className="space-y-4">
        {/* Card style */}
        <div>
          <Label className="mb-2 block text-sm">
            {t("themeEditor.cardStyle")}
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {(["flat", "elevated", "bordered", "glass"] as CardStyle[]).map(
              (cs) => (
                <OptionCard
                  key={cs}
                  value={cs}
                  currentValue={theme.cardStyle}
                  onSelect={(v) => onUpdate("cardStyle", v)}
                  className="py-2.5"
                >
                  <CardStylePreview style={cs} />
                  <span className="mt-1.5 text-[10px] font-medium">
                    {t(CARD_KEYS[cs]!)}
                  </span>
                </OptionCard>
              ),
            )}
          </div>
        </div>

        {/* Border radius */}
        <div>
          <Label className="mb-2 block text-sm">
            {t("themeEditor.borderRadius")}
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {(
              ["none", "small", "medium", "large", "full"] as BorderRadius[]
            ).map((br) => (
              <OptionCard
                key={br}
                value={br}
                currentValue={theme.borderRadius}
                onSelect={(v) => onUpdate("borderRadius", v)}
                className="py-2.5"
              >
                <BorderRadiusPreview radius={br} />
                <span className="mt-1 text-[10px] font-medium">
                  {t(RADIUS_KEYS[br]!)}
                </span>
              </OptionCard>
            ))}
          </div>
        </div>

        {/* Spacing */}
        <div>
          <Label className="mb-2 block text-sm">
            {t("themeEditor.spacing")}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {(["compact", "comfortable", "spacious"] as Spacing[]).map(
              (sp) => (
                <OptionCard
                  key={sp}
                  value={sp}
                  currentValue={theme.spacing}
                  onSelect={(v) => onUpdate("spacing", v)}
                  className="py-2.5"
                >
                  <SpacingPreview spacing={sp} />
                  <span className="mt-1.5 text-[10px] font-medium">
                    {t(SPACING_KEYS[sp]!)}
                  </span>
                </OptionCard>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
