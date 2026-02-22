"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Eye,
  Code,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { type ImageStyle, type HeaderStyle } from "~/lib/theme";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  type ThemeSectionProps,
  SectionHeader,
  SectionDivider,
  OptionCard,
  ToggleRow,
  ImageStylePreview,
  HeaderStylePreview,
  IMAGE_KEYS,
  HEADER_KEYS,
} from "./shared";

export function DisplaySection({ theme, onUpdate }: ThemeSectionProps) {
  const { t } = useTranslation();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <>
      <section>
        <SectionHeader icon={<Eye className="h-4 w-4" />}>
          {t("themeEditor.display")}
        </SectionHeader>
        <div className="space-y-1">
          <ToggleRow
            label={t("themeEditor.showImages")}
            checked={theme.showImages}
            onCheckedChange={(v) => onUpdate("showImages", v)}
          />
          <ToggleRow
            label={t("themeEditor.showPrices")}
            checked={theme.showPrices}
            onCheckedChange={(v) => onUpdate("showPrices", v)}
          />
          <ToggleRow
            label={t("themeEditor.showNutrition")}
            checked={theme.showNutrition}
            onCheckedChange={(v) => onUpdate("showNutrition", v)}
          />
          <ToggleRow
            label={t("themeEditor.showCategoryNav")}
            checked={theme.showCategoryNav}
            onCheckedChange={(v) => onUpdate("showCategoryNav", v)}
          />
          <ToggleRow
            label={t("themeEditor.showCategoryDividers")}
            checked={theme.showCategoryDividers}
            onCheckedChange={(v) => onUpdate("showCategoryDividers", v)}
          />
        </div>

        {/* Image style (shown only when showImages is on) */}
        {theme.showImages && (
          <div className="mt-4">
            <Label className="mb-2 block text-sm">
              {t("themeEditor.imageStyle")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["rounded", "square", "circle"] as ImageStyle[]).map((is) => (
                <OptionCard
                  key={is}
                  value={is}
                  currentValue={theme.imageStyle}
                  onSelect={(v) => onUpdate("imageStyle", v)}
                  className="py-2.5"
                >
                  <ImageStylePreview style={is} />
                  <span className="mt-1.5 text-[10px] font-medium">
                    {t(IMAGE_KEYS[is]!)}
                  </span>
                </OptionCard>
              ))}
            </div>
          </div>
        )}

        {/* Header style */}
        <div className="mt-4">
          <Label className="mb-2 block text-sm">
            {t("themeEditor.headerStyle")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              ["banner", "minimal", "centered", "overlay"] as HeaderStyle[]
            ).map((hs) => (
              <OptionCard
                key={hs}
                value={hs}
                currentValue={theme.headerStyle}
                onSelect={(v) => onUpdate("headerStyle", v)}
                className="py-2.5"
              >
                <HeaderStylePreview style={hs} />
                <span className="mt-1.5 text-[10px] font-medium">
                  {t(HEADER_KEYS[hs]!)}
                </span>
              </OptionCard>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Advanced / Custom CSS */}
      <section>
        <button
          type="button"
          onClick={() => setAdvancedOpen((p) => !p)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-2 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary/70" />
            <span className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("themeEditor.advanced")}
            </span>
          </div>
          {advancedOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {advancedOpen && (
          <div className="mt-3 space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                {t("themeEditor.customCssWarning")}
              </p>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">
                {t("themeEditor.customCss")}
              </Label>
              <Textarea
                value={theme.customCss}
                onChange={(e) => onUpdate("customCss", e.target.value)}
                rows={6}
                spellCheck={false}
                className="resize-y font-mono text-xs leading-relaxed"
                placeholder=".menu-themed { /* your styles */ }"
              />
            </div>
          </div>
        )}
      </section>

      <div className="h-24" />
    </>
  );
}
