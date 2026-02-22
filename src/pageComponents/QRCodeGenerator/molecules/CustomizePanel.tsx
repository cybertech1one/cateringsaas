"use client";

import { useTranslation } from "react-i18next";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
  type QRCustomizationOptions,
  type QRModuleStyle,
  type QRErrorCorrection,
} from "../QRCodeGenerator.types";

interface CustomizePanelProps {
  options: QRCustomizationOptions;
  onChange: (options: QRCustomizationOptions) => void;
  menuLogoUrl: string | null;
}

export function CustomizePanel({
  options,
  onChange,
  menuLogoUrl,
}: CustomizePanelProps) {
  const { t } = useTranslation();

  const update = (partial: Partial<QRCustomizationOptions>) => {
    onChange({ ...options, ...partial });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Colors */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          {t("qrGenerator.colors")}
        </legend>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="qr-fg-color">{t("qrGenerator.foregroundColor")}</Label>
            <div className="flex items-center gap-2">
              <input
                id="qr-fg-color"
                type="color"
                value={options.fgColor}
                onChange={(e) => update({ fgColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent"
              />
              <span className="w-16 text-xs text-muted-foreground">
                {options.fgColor}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="qr-bg-color">{t("qrGenerator.backgroundColor")}</Label>
            <div className="flex items-center gap-2">
              <input
                id="qr-bg-color"
                type="color"
                value={options.bgColor}
                onChange={(e) => update({ bgColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent"
              />
              <span className="w-16 text-xs text-muted-foreground">
                {options.bgColor}
              </span>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Module Style */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          {t("qrGenerator.style")}
        </legend>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Label>{t("qrGenerator.moduleStyle")}</Label>
            <Select
              value={options.moduleStyle}
              onValueChange={(val) =>
                update({ moduleStyle: val as QRModuleStyle })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">
                  {t("qrGenerator.styleSquare")}
                </SelectItem>
                <SelectItem value="rounded">
                  {t("qrGenerator.styleRounded")}
                </SelectItem>
                <SelectItem value="dots">
                  {t("qrGenerator.styleDots")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* Logo */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          {t("qrGenerator.logo")}
        </legend>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Label>{t("qrGenerator.includeLogo")}</Label>
            <Switch
              checked={options.includeLogo}
              onCheckedChange={(checked) =>
                update({
                  includeLogo: checked,
                  logoUrl: checked ? (menuLogoUrl ?? options.logoUrl) : options.logoUrl,
                  errorCorrection: checked ? "H" : options.errorCorrection,
                })
              }
              disabled={!menuLogoUrl}
            />
          </div>
          {!menuLogoUrl && (
            <p className="text-xs text-muted-foreground">
              {t("qrGenerator.noLogoAvailable")}
            </p>
          )}
          {options.includeLogo && menuLogoUrl && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{t("qrGenerator.logoSize")}</Label>
                <span className="text-sm text-muted-foreground">
                  {options.logoSizePercent}%
                </span>
              </div>
              <Slider
                value={[options.logoSizePercent]}
                onValueChange={([val]) =>
                  update({ logoSizePercent: val ?? 20 })
                }
                min={10}
                max={30}
                step={1}
              />
            </div>
          )}
        </div>
      </fieldset>

      {/* Error Correction */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          {t("qrGenerator.errorCorrection")}
        </legend>
        <div className="flex items-center justify-between gap-3">
          <Label>{t("qrGenerator.level")}</Label>
          <Select
            value={options.errorCorrection}
            onValueChange={(val) =>
              update({ errorCorrection: val as QRErrorCorrection })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">
                {t("qrGenerator.ecLow")} (7%)
              </SelectItem>
              <SelectItem value="M">
                {t("qrGenerator.ecMedium")} (15%)
              </SelectItem>
              <SelectItem value="Q">
                {t("qrGenerator.ecQuartile")} (25%)
              </SelectItem>
              <SelectItem value="H">
                {t("qrGenerator.ecHigh")} (30%)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("qrGenerator.errorCorrectionHint")}
        </p>
      </fieldset>
    </div>
  );
}
