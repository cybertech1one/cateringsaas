import { type DishLayoutProps } from "../../types";
import { ClassicLayout } from "./ClassicLayout";
import { ModernLayout } from "./ModernLayout";
import { GridLayout } from "./GridLayout";
import { MagazineLayout } from "./MagazineLayout";
import { MinimalLayout } from "./MinimalLayout";
import { ElegantLayout } from "./ElegantLayout";

// ── Dishes Layout Switch ────────────────────────────────────

export function DishesLayout({
  dishes,
  theme,
  languageId,
  menuName,
  menuSlug,
  currency,
  isPreview,
  onDishClick,
}: DishLayoutProps) {
  const layoutProps = { dishes, theme, languageId, menuName, menuSlug, currency, isPreview, onDishClick };

  switch (theme.layoutStyle) {
    case "classic":
      return <ClassicLayout {...layoutProps} />;
    case "modern":
      return <ModernLayout {...layoutProps} />;
    case "grid":
      return <GridLayout {...layoutProps} />;
    case "magazine":
      return <MagazineLayout {...layoutProps} />;
    case "minimal":
      return <MinimalLayout {...layoutProps} />;
    case "elegant":
      return <ElegantLayout {...layoutProps} />;
    default:
      return <ClassicLayout {...layoutProps} />;
  }
}
