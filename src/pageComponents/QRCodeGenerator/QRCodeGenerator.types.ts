export type QRModuleStyle = "square" | "rounded" | "dots";

export type QRErrorCorrection = "L" | "M" | "Q" | "H";

export type QRFrameTemplate =
  | "none"
  | "simple"
  | "tableTent"
  | "businessCard"
  | "sticker";

export interface QRCustomizationOptions {
  fgColor: string;
  bgColor: string;
  moduleStyle: QRModuleStyle;
  errorCorrection: QRErrorCorrection;
  includeLogo: boolean;
  logoUrl: string | null;
  logoSizePercent: number;
  frameTemplate: QRFrameTemplate;
}

export const DEFAULT_QR_OPTIONS: QRCustomizationOptions = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  moduleStyle: "square",
  errorCorrection: "M",
  includeLogo: false,
  logoUrl: null,
  logoSizePercent: 20,
  frameTemplate: "none",
};
