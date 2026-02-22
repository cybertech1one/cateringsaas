"use client";

import { useTranslation } from "react-i18next";
import { Type } from "lucide-react";
import { type FontSize } from "~/lib/theme";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "~/components/ui/select";
import { cn } from "~/utils/cn";
import {
  type ThemeSectionProps,
  SectionHeader,
  FONT_SIZE_KEYS,
  FONT_CATEGORY_KEYS,
} from "./shared";

export interface TypographySectionProps extends ThemeSectionProps {
  fontGroups: Record<string, string[]>;
}

export function TypographySection({
  theme,
  onUpdate,
  fontGroups,
}: TypographySectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeader icon={<Type className="h-4 w-4" />}>
        {t("themeEditor.typography")}
      </SectionHeader>
      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 block text-sm">
            {t("themeEditor.headingFont")}
          </Label>
          <Select
            value={theme.headingFont}
            onValueChange={(v) => onUpdate("headingFont", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(fontGroups).map(([category, fonts]) => (
                <SelectGroup key={category}>
                  <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(
                      FONT_CATEGORY_KEYS[
                        category as keyof typeof FONT_CATEGORY_KEYS
                      ],
                    )}
                  </SelectLabel>
                  {fonts.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-sm">
            {t("themeEditor.bodyFont")}
          </Label>
          <Select
            value={theme.bodyFont}
            onValueChange={(v) => onUpdate("bodyFont", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(fontGroups).map(([category, fonts]) => (
                <SelectGroup key={category}>
                  <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(
                      FONT_CATEGORY_KEYS[
                        category as keyof typeof FONT_CATEGORY_KEYS
                      ],
                    )}
                  </SelectLabel>
                  {fonts.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm">
            {t("themeEditor.fontSize")}
          </Label>
          <div className="flex gap-2">
            {(["small", "medium", "large"] as FontSize[]).map((size) => (
              <label
                key={size}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                  theme.fontSize === size
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-border",
                )}
              >
                <input
                  type="radio"
                  name="fontSize"
                  value={size}
                  checked={theme.fontSize === size}
                  onChange={() => onUpdate("fontSize", size)}
                  className="sr-only"
                />
                {t(FONT_SIZE_KEYS[size]!)}
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
