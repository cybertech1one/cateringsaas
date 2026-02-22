"use client";

import { useTranslation } from "react-i18next";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";

export const QR_SIZE_PRESETS = {
  small: 128,
  medium: 256,
  large: 512,
  extraLarge: 1024,
} as const;

export type QRSizePreset = keyof typeof QR_SIZE_PRESETS;

export const SIZE_PRESET_KEYS: QRSizePreset[] = [
  "small",
  "medium",
  "large",
  "extraLarge",
];

interface QRCustomizationControlsProps {
  sizePreset: QRSizePreset;
  onSizePresetChange: (preset: QRSizePreset) => void;
  fgColor: string;
  onFgColorChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  logoUrl?: string;
  includeLogo: boolean;
  onIncludeLogoChange: (include: boolean) => void;
}

export function QRCustomizationControls({
  sizePreset,
  onSizePresetChange,
  fgColor,
  onFgColorChange,
  bgColor,
  onBgColorChange,
  logoUrl,
  includeLogo,
  onIncludeLogoChange,
}: QRCustomizationControlsProps) {
  const { t } = useTranslation();

  const downloadSize = QR_SIZE_PRESETS[sizePreset];

  const sizePresetLabels: Record<QRSizePreset, string> = {
    small: t("qrCode.small"),
    medium: t("qrCode.medium"),
    large: t("qrCode.large"),
    extraLarge: t("qrCode.extraLarge"),
  };

  const sliderValue = SIZE_PRESET_KEYS.indexOf(sizePreset);

  return (
    <div className="space-y-4">
      {/* Size Preset */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("qrCode.size")}</Label>
          <span className="text-xs text-muted-foreground">
            {sizePresetLabels[sizePreset]} ({downloadSize}px)
          </span>
        </div>
        <Slider
          value={[sliderValue]}
          min={0}
          max={3}
          step={1}
          onValueChange={([val]) => {
            const preset =
              val !== undefined ? SIZE_PRESET_KEYS[val] : undefined;

            if (preset) {
              onSizePresetChange(preset);
            }
          }}
        />
      </div>

      {/* Color Pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="qr-fg-color">{t("qrCode.color")}</Label>
          <div className="flex items-center gap-2">
            <input
              id="qr-fg-color"
              type="color"
              value={fgColor}
              onChange={(e) => onFgColorChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <span className="text-xs text-muted-foreground">
              {fgColor}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="qr-bg-color">
            {t("qrCode.backgroundColor")}
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="qr-bg-color"
              type="color"
              value={bgColor}
              onChange={(e) => onBgColorChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <span className="text-xs text-muted-foreground">
              {bgColor}
            </span>
          </div>
        </div>
      </div>

      {/* Logo Toggle */}
      {logoUrl && (
        <div className="flex items-center justify-between">
          <Label htmlFor="qr-include-logo">
            {t("qrCode.includeLogo")}
          </Label>
          <Switch
            id="qr-include-logo"
            checked={includeLogo}
            onCheckedChange={onIncludeLogoChange}
          />
        </div>
      )}
    </div>
  );
}
