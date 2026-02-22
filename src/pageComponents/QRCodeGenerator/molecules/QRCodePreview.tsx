"use client";

import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { type QRCustomizationOptions } from "../QRCodeGenerator.types";

interface QRCodePreviewProps {
  url: string;
  options: QRCustomizationOptions;
  size?: number;
}

export const QRCodePreview = forwardRef<SVGSVGElement, QRCodePreviewProps>(
  function QRCodePreview({ url, options, size = 256 }, ref) {
    const logoSize = Math.round(size * (options.logoSizePercent / 100));

    return (
      <QRCodeSVG
        ref={ref}
        value={url}
        size={size}
        level={options.errorCorrection}
        fgColor={options.fgColor}
        bgColor={options.bgColor}
        {...(options.includeLogo &&
          options.logoUrl && {
            imageSettings: {
              src: options.logoUrl,
              height: logoSize,
              width: logoSize,
              excavate: true,
            },
          })}
      />
    );
  },
);
