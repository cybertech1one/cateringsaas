import {
  type MenuTheme,
  type FontSize,
  type LayoutStyle,
  type CardStyle,
  type BorderRadius,
  type Spacing,
  type ImageStyle,
  type HeaderStyle,
} from "~/lib/theme";

// ── Dirty check helper ──────────────────────────────────────

export function themesAreEqual(a: MenuTheme, b: MenuTheme): boolean {
  return (
    a.primaryColor === b.primaryColor &&
    a.secondaryColor === b.secondaryColor &&
    a.backgroundColor === b.backgroundColor &&
    a.surfaceColor === b.surfaceColor &&
    a.textColor === b.textColor &&
    a.accentColor === b.accentColor &&
    a.headingFont === b.headingFont &&
    a.bodyFont === b.bodyFont &&
    a.fontSize === b.fontSize &&
    a.layoutStyle === b.layoutStyle &&
    a.cardStyle === b.cardStyle &&
    a.borderRadius === b.borderRadius &&
    a.spacing === b.spacing &&
    a.showImages === b.showImages &&
    a.imageStyle === b.imageStyle &&
    a.showPrices === b.showPrices &&
    a.showNutrition === b.showNutrition &&
    a.showCategoryNav === b.showCategoryNav &&
    a.showCategoryDividers === b.showCategoryDividers &&
    a.headerStyle === b.headerStyle &&
    a.customCss === b.customCss
  );
}

// ── Server theme to local theme mapper ──────────────────────

export interface ServerThemeData {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  fontSize: string;
  layoutStyle: string;
  cardStyle: string;
  borderRadius: string;
  spacing: string;
  showImages: boolean;
  imageStyle: string;
  showPrices: boolean;
  showNutrition: boolean;
  showCategoryNav: boolean;
  showCategoryDividers: boolean;
  headerStyle: string;
  customCss?: string | null;
}

export function mapServerThemeToLocal(
  serverTheme: ServerThemeData,
): MenuTheme {
  return {
    primaryColor: serverTheme.primaryColor,
    secondaryColor: serverTheme.secondaryColor,
    backgroundColor: serverTheme.backgroundColor,
    surfaceColor: serverTheme.surfaceColor,
    textColor: serverTheme.textColor,
    accentColor: serverTheme.accentColor,
    headingFont: serverTheme.headingFont,
    bodyFont: serverTheme.bodyFont,
    fontSize: serverTheme.fontSize as FontSize,
    layoutStyle: serverTheme.layoutStyle as LayoutStyle,
    cardStyle: serverTheme.cardStyle as CardStyle,
    borderRadius: serverTheme.borderRadius as BorderRadius,
    spacing: serverTheme.spacing as Spacing,
    showImages: serverTheme.showImages,
    imageStyle: serverTheme.imageStyle as ImageStyle,
    showPrices: serverTheme.showPrices,
    showNutrition: serverTheme.showNutrition,
    showCategoryNav: serverTheme.showCategoryNav,
    showCategoryDividers: serverTheme.showCategoryDividers,
    headerStyle: serverTheme.headerStyle as HeaderStyle,
    customCss: serverTheme.customCss ?? "",
  };
}
