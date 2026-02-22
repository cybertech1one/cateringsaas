/**
 * Menu Theme Design System
 *
 * Complete type definitions for the menu customization engine.
 * These types map 1:1 with the menu_themes DB table and drive
 * the CSS variable system + live preview.
 */

// ── Enums ───────────────────────────────────────────────────

export type FontSize = "small" | "medium" | "large";
export type LayoutStyle = "classic" | "modern" | "grid" | "magazine" | "minimal" | "elegant";
export type CardStyle = "flat" | "elevated" | "bordered" | "glass";
export type BorderRadius = "none" | "small" | "medium" | "large" | "full";
export type Spacing = "compact" | "comfortable" | "spacious";
export type ImageStyle = "rounded" | "square" | "circle";
export type HeaderStyle = "banner" | "minimal" | "centered" | "overlay";

// ── Theme Shape ─────────────────────────────────────────────

export interface MenuTheme {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;

  // Typography
  headingFont: string;
  bodyFont: string;
  fontSize: FontSize;

  // Layout
  layoutStyle: LayoutStyle;

  // Card
  cardStyle: CardStyle;
  borderRadius: BorderRadius;

  // Spacing
  spacing: Spacing;

  // Images
  showImages: boolean;
  imageStyle: ImageStyle;

  // Display toggles
  showPrices: boolean;
  showNutrition: boolean;
  showCategoryNav: boolean;
  showCategoryDividers: boolean;

  // Header
  headerStyle: HeaderStyle;

  // Advanced
  customCss: string;
}

// ── Default Theme ───────────────────────────────────────────

export const DEFAULT_THEME: MenuTheme = {
  primaryColor: "#E8453C",
  secondaryColor: "#059669",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F5F5F0",
  textColor: "#1A1B1E",
  accentColor: "#E8453C",
  headingFont: "Plus Jakarta Sans",
  bodyFont: "Outfit",
  fontSize: "medium",
  layoutStyle: "classic",
  cardStyle: "elevated",
  borderRadius: "large",
  spacing: "comfortable",
  showImages: true,
  imageStyle: "rounded",
  showPrices: true,
  showNutrition: true,
  showCategoryNav: true,
  showCategoryDividers: false,
  headerStyle: "banner",
  customCss: "",
};

// ── Template Presets ────────────────────────────────────────

export type TemplateCategory =
  | "all"
  | "restaurant"
  | "cafe"
  | "fine-dining"
  | "fast-food"
  | "bakery"
  | "bar"
  | "asian"
  | "moroccan";

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // CSS gradient or emoji for preview card
  theme: MenuTheme;
  isPro: boolean;
  category: TemplateCategory;
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  // ── FREE Templates (6) ────────────────────────────────────
  {
    id: "classic",
    name: "Neo Gastro",
    description: "Modern, app-like design. Clean and appetizing.",
    preview: "linear-gradient(135deg, #FFFFFF 0%, #E8453C 100%)",
    isPro: false,
    category: "restaurant",
    theme: { ...DEFAULT_THEME },
  },
  {
    id: "modern",
    name: "Modern Bistro",
    description: "Clean lines, bold typography, contemporary feel.",
    preview: "linear-gradient(135deg, #0F172A 0%, #3B82F6 100%)",
    isPro: false,
    category: "restaurant",
    theme: {
      ...DEFAULT_THEME,
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      backgroundColor: "#0F172A",
      surfaceColor: "#1E293B",
      textColor: "#F8FAFC",
      accentColor: "#F59E0B",
      headingFont: "DM Sans",
      bodyFont: "Inter",
      layoutStyle: "modern",
      cardStyle: "glass",
      borderRadius: "large",
    },
  },
  {
    id: "grid",
    name: "Photo Grid",
    description: "Image-forward grid layout. Let your food photography shine.",
    preview: "linear-gradient(135deg, #FEF3C7 0%, #F97316 100%)",
    isPro: false,
    category: "restaurant",
    theme: {
      ...DEFAULT_THEME,
      primaryColor: "#F97316",
      secondaryColor: "#EA580C",
      backgroundColor: "#FFF7ED",
      surfaceColor: "#FFFFFF",
      textColor: "#1C1917",
      accentColor: "#16A34A",
      headingFont: "Montserrat",
      bodyFont: "Lato",
      layoutStyle: "grid",
      cardStyle: "elevated",
      borderRadius: "large",
      imageStyle: "square",
    },
  },
  {
    id: "magazine",
    name: "Editorial Magazine",
    description: "Asymmetric, editorial layout with dramatic typography.",
    preview: "linear-gradient(135deg, #FAFAF9 0%, #78716C 100%)",
    isPro: false,
    category: "fine-dining",
    theme: {
      ...DEFAULT_THEME,
      primaryColor: "#292524",
      secondaryColor: "#78716C",
      backgroundColor: "#FAFAF9",
      surfaceColor: "#FFFFFF",
      textColor: "#1C1917",
      accentColor: "#DC2626",
      headingFont: "Cormorant Garamond",
      bodyFont: "Libre Franklin",
      layoutStyle: "magazine",
      cardStyle: "flat",
      borderRadius: "none",
      spacing: "spacious",
      headerStyle: "overlay",
    },
  },
  {
    id: "minimal",
    name: "Pure Minimal",
    description: "Ultra-clean, whitespace-driven design. Less is more.",
    preview: "linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%)",
    isPro: false,
    category: "cafe",
    theme: {
      ...DEFAULT_THEME,
      primaryColor: "#111827",
      secondaryColor: "#6B7280",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#F9FAFB",
      textColor: "#111827",
      accentColor: "#111827",
      headingFont: "Outfit",
      bodyFont: "Outfit",
      layoutStyle: "minimal",
      cardStyle: "flat",
      borderRadius: "small",
      spacing: "spacious",
      showNutrition: false,
      showCategoryDividers: false,
      headerStyle: "minimal",
    },
  },
  {
    id: "elegant",
    name: "Luxury Dining",
    description: "Dark, opulent design for upscale fine dining restaurants.",
    preview: "linear-gradient(135deg, #1A1A2E 0%, #C9A84C 100%)",
    isPro: false,
    category: "fine-dining",
    theme: {
      ...DEFAULT_THEME,
      primaryColor: "#C9A84C",
      secondaryColor: "#B8962E",
      backgroundColor: "#1A1A2E",
      surfaceColor: "#16213E",
      textColor: "#E8E8E8",
      accentColor: "#E07A5F",
      headingFont: "Cormorant",
      bodyFont: "Raleway",
      layoutStyle: "elegant",
      cardStyle: "glass",
      borderRadius: "small",
      spacing: "spacious",
      imageStyle: "rounded",
      headerStyle: "overlay",
    },
  },

  // ── PRO Templates (24) ────────────────────────────────────

  // --- RESTAURANT ---
  {
    id: "terracotta",
    name: "Terracotta Riad",
    description: "Warm Moroccan-inspired palette. Earthy tones and elegance.",
    preview: "linear-gradient(135deg, #FFF8F0 0%, #C2703E 100%)",
    isPro: true,
    category: "moroccan",
    theme: { ...DEFAULT_THEME, primaryColor: "#C2703E", secondaryColor: "#8B4513", backgroundColor: "#FFF8F0", surfaceColor: "#FFF1E6", textColor: "#3D2B1F", accentColor: "#D4A574", headingFont: "Playfair Display", bodyFont: "Lato", layoutStyle: "classic", cardStyle: "elevated", borderRadius: "medium", headerStyle: "banner" },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Cool coastal vibes. Perfect for seafood restaurants.",
    preview: "linear-gradient(135deg, #F0F9FF 0%, #0EA5E9 100%)",
    isPro: true,
    category: "restaurant",
    theme: { ...DEFAULT_THEME, primaryColor: "#0EA5E9", secondaryColor: "#0284C7", backgroundColor: "#F0F9FF", surfaceColor: "#FFFFFF", textColor: "#0C4A6E", accentColor: "#F97316", headingFont: "Montserrat", bodyFont: "Source Sans 3", layoutStyle: "modern", cardStyle: "elevated", borderRadius: "large", headerStyle: "banner" },
  },
  {
    id: "ember-grill",
    name: "Ember Grill",
    description: "Bold and smoky. Built for BBQ and grill houses.",
    preview: "linear-gradient(135deg, #1C1917 0%, #DC2626 100%)",
    isPro: true,
    category: "restaurant",
    theme: { ...DEFAULT_THEME, primaryColor: "#DC2626", secondaryColor: "#991B1B", backgroundColor: "#1C1917", surfaceColor: "#292524", textColor: "#FEF2F2", accentColor: "#F59E0B", headingFont: "DM Sans", bodyFont: "Inter", layoutStyle: "modern", cardStyle: "glass", borderRadius: "medium", headerStyle: "overlay" },
  },
  {
    id: "garden-fresh",
    name: "Garden Fresh",
    description: "Bright and organic. Ideal for salad bars and healthy eats.",
    preview: "linear-gradient(135deg, #F0FDF4 0%, #22C55E 100%)",
    isPro: true,
    category: "restaurant",
    theme: { ...DEFAULT_THEME, primaryColor: "#22C55E", secondaryColor: "#16A34A", backgroundColor: "#F0FDF4", surfaceColor: "#FFFFFF", textColor: "#14532D", accentColor: "#A3E635", headingFont: "Nunito", bodyFont: "Nunito", layoutStyle: "grid", cardStyle: "bordered", borderRadius: "large", imageStyle: "circle" },
  },
  {
    id: "sunset-terrace",
    name: "Sunset Terrace",
    description: "Warm gradients and soft tones. Rooftop dining vibes.",
    preview: "linear-gradient(135deg, #FFF7ED 0%, #F472B6 50%, #818CF8 100%)",
    isPro: true,
    category: "restaurant",
    theme: { ...DEFAULT_THEME, primaryColor: "#F472B6", secondaryColor: "#818CF8", backgroundColor: "#FFF7ED", surfaceColor: "#FFFFFF", textColor: "#1E1B4B", accentColor: "#F97316", headingFont: "Josefin Sans", bodyFont: "Outfit", layoutStyle: "magazine", cardStyle: "elevated", borderRadius: "full", spacing: "spacious" },
  },

  // --- CAFE & BAKERY ---
  {
    id: "latte-art",
    name: "Latte Art",
    description: "Cozy coffeehouse aesthetic. Cream tones and warm browns.",
    preview: "linear-gradient(135deg, #FDF8F0 0%, #92400E 100%)",
    isPro: true,
    category: "cafe",
    theme: { ...DEFAULT_THEME, primaryColor: "#92400E", secondaryColor: "#78350F", backgroundColor: "#FDF8F0", surfaceColor: "#FFFBF5", textColor: "#451A03", accentColor: "#D97706", headingFont: "Playfair Display", bodyFont: "Libre Franklin", layoutStyle: "classic", cardStyle: "flat", borderRadius: "medium", spacing: "comfortable" },
  },
  {
    id: "matcha-zen",
    name: "Matcha Zen",
    description: "Japanese-inspired tea house. Calm and minimalist.",
    preview: "linear-gradient(135deg, #FAFDF7 0%, #65A30D 100%)",
    isPro: true,
    category: "cafe",
    theme: { ...DEFAULT_THEME, primaryColor: "#65A30D", secondaryColor: "#4D7C0F", backgroundColor: "#FAFDF7", surfaceColor: "#FFFFFF", textColor: "#1A2E05", accentColor: "#CA8A04", headingFont: "Outfit", bodyFont: "Outfit", layoutStyle: "minimal", cardStyle: "flat", borderRadius: "small", spacing: "spacious", headerStyle: "minimal" },
  },
  {
    id: "pastry-shop",
    name: "Pastry Boutique",
    description: "Soft pinks and cream. Sweet and delicate for patisseries.",
    preview: "linear-gradient(135deg, #FFF1F2 0%, #E11D48 100%)",
    isPro: true,
    category: "bakery",
    theme: { ...DEFAULT_THEME, primaryColor: "#E11D48", secondaryColor: "#BE123C", backgroundColor: "#FFF1F2", surfaceColor: "#FFFFFF", textColor: "#4C0519", accentColor: "#F59E0B", headingFont: "Dancing Script", bodyFont: "Raleway", layoutStyle: "grid", cardStyle: "elevated", borderRadius: "full", imageStyle: "circle" },
  },
  {
    id: "artisan-bread",
    name: "Artisan Bread",
    description: "Rustic and warm. Crafted for bakeries and boulangeries.",
    preview: "linear-gradient(135deg, #FFFBEB 0%, #B45309 100%)",
    isPro: true,
    category: "bakery",
    theme: { ...DEFAULT_THEME, primaryColor: "#B45309", secondaryColor: "#92400E", backgroundColor: "#FFFBEB", surfaceColor: "#FEF3C7", textColor: "#451A03", accentColor: "#059669", headingFont: "Lora", bodyFont: "Source Sans 3", layoutStyle: "classic", cardStyle: "bordered", borderRadius: "medium" },
  },

  // --- FAST FOOD ---
  {
    id: "neon-burger",
    name: "Neon Burger",
    description: "High-energy neon on dark. Perfect for burger joints.",
    preview: "linear-gradient(135deg, #18181B 0%, #FACC15 100%)",
    isPro: true,
    category: "fast-food",
    theme: { ...DEFAULT_THEME, primaryColor: "#FACC15", secondaryColor: "#EAB308", backgroundColor: "#18181B", surfaceColor: "#27272A", textColor: "#FAFAFA", accentColor: "#EF4444", headingFont: "DM Sans", bodyFont: "Inter", layoutStyle: "grid", cardStyle: "glass", borderRadius: "large", imageStyle: "square", headerStyle: "overlay" },
  },
  {
    id: "street-eats",
    name: "Street Eats",
    description: "Vibrant and bold. For food trucks and street food stalls.",
    preview: "linear-gradient(135deg, #FEF9C3 0%, #EA580C 100%)",
    isPro: true,
    category: "fast-food",
    theme: { ...DEFAULT_THEME, primaryColor: "#EA580C", secondaryColor: "#C2410C", backgroundColor: "#FEF9C3", surfaceColor: "#FFFFFF", textColor: "#1C1917", accentColor: "#7C3AED", headingFont: "Montserrat", bodyFont: "Poppins", layoutStyle: "modern", cardStyle: "elevated", borderRadius: "large", spacing: "compact" },
  },
  {
    id: "pizza-night",
    name: "Pizza Night",
    description: "Italian flag colors, bold and appetizing for pizzerias.",
    preview: "linear-gradient(135deg, #FEF2F2 0%, #16A34A 50%, #DC2626 100%)",
    isPro: true,
    category: "fast-food",
    theme: { ...DEFAULT_THEME, primaryColor: "#DC2626", secondaryColor: "#16A34A", backgroundColor: "#FEF2F2", surfaceColor: "#FFFFFF", textColor: "#1C1917", accentColor: "#F59E0B", headingFont: "Montserrat", bodyFont: "Lato", layoutStyle: "grid", cardStyle: "elevated", borderRadius: "medium", imageStyle: "rounded" },
  },

  // --- FINE DINING ---
  {
    id: "noir-prestige",
    name: "Noir Prestige",
    description: "Pure black luxury. Dramatic and exclusive.",
    preview: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
    isPro: true,
    category: "fine-dining",
    theme: { ...DEFAULT_THEME, primaryColor: "#FAFAFA", secondaryColor: "#A3A3A3", backgroundColor: "#0A0A0A", surfaceColor: "#171717", textColor: "#FAFAFA", accentColor: "#C9A84C", headingFont: "Cormorant Garamond", bodyFont: "Raleway", layoutStyle: "elegant", cardStyle: "glass", borderRadius: "none", spacing: "spacious", headerStyle: "overlay", showImages: false },
  },
  {
    id: "champagne-gold",
    name: "Champagne & Gold",
    description: "Sparkling gold on cream. Celebrate in style.",
    preview: "linear-gradient(135deg, #FFFDF7 0%, #B8860B 100%)",
    isPro: true,
    category: "fine-dining",
    theme: { ...DEFAULT_THEME, primaryColor: "#B8860B", secondaryColor: "#8B6914", backgroundColor: "#FFFDF7", surfaceColor: "#FFFEF5", textColor: "#1A1A1A", accentColor: "#7C2D12", headingFont: "Cormorant", bodyFont: "EB Garamond", layoutStyle: "magazine", cardStyle: "flat", borderRadius: "small", spacing: "spacious", headerStyle: "centered" },
  },
  {
    id: "velvet-lounge",
    name: "Velvet Lounge",
    description: "Deep purple and soft gold. Intimate cocktail bar vibes.",
    preview: "linear-gradient(135deg, #1E1033 0%, #A855F7 100%)",
    isPro: true,
    category: "bar",
    theme: { ...DEFAULT_THEME, primaryColor: "#A855F7", secondaryColor: "#7C3AED", backgroundColor: "#1E1033", surfaceColor: "#2D1B4E", textColor: "#F5F3FF", accentColor: "#F59E0B", headingFont: "Josefin Sans", bodyFont: "Outfit", layoutStyle: "elegant", cardStyle: "glass", borderRadius: "large", headerStyle: "overlay" },
  },

  // --- BAR ---
  {
    id: "craft-brew",
    name: "Craft Brewery",
    description: "Amber tones and hops. For craft beer bars and pubs.",
    preview: "linear-gradient(135deg, #1C1917 0%, #D97706 100%)",
    isPro: true,
    category: "bar",
    theme: { ...DEFAULT_THEME, primaryColor: "#D97706", secondaryColor: "#B45309", backgroundColor: "#1C1917", surfaceColor: "#292524", textColor: "#FEF3C7", accentColor: "#22C55E", headingFont: "DM Sans", bodyFont: "Inter", layoutStyle: "modern", cardStyle: "bordered", borderRadius: "medium", headerStyle: "banner" },
  },
  {
    id: "tiki-tropical",
    name: "Tiki Tropical",
    description: "Vibrant island colors. For juice bars and tropical drinks.",
    preview: "linear-gradient(135deg, #ECFDF5 0%, #F472B6 50%, #FB923C 100%)",
    isPro: true,
    category: "bar",
    theme: { ...DEFAULT_THEME, primaryColor: "#FB923C", secondaryColor: "#F472B6", backgroundColor: "#ECFDF5", surfaceColor: "#FFFFFF", textColor: "#064E3B", accentColor: "#06B6D4", headingFont: "Montserrat", bodyFont: "Nunito", layoutStyle: "grid", cardStyle: "elevated", borderRadius: "full", imageStyle: "circle", spacing: "compact" },
  },

  // --- ASIAN ---
  {
    id: "sakura",
    name: "Sakura Blossom",
    description: "Soft cherry blossom pink. Elegant Japanese aesthetic.",
    preview: "linear-gradient(135deg, #FFF5F7 0%, #EC4899 100%)",
    isPro: true,
    category: "asian",
    theme: { ...DEFAULT_THEME, primaryColor: "#EC4899", secondaryColor: "#DB2777", backgroundColor: "#FFF5F7", surfaceColor: "#FFFFFF", textColor: "#1F2937", accentColor: "#059669", headingFont: "Outfit", bodyFont: "Outfit", layoutStyle: "minimal", cardStyle: "flat", borderRadius: "medium", spacing: "spacious", headerStyle: "centered" },
  },
  {
    id: "dragon-wok",
    name: "Dragon Wok",
    description: "Bold red and black. Fiery Chinese restaurant energy.",
    preview: "linear-gradient(135deg, #1A1A1A 0%, #B91C1C 100%)",
    isPro: true,
    category: "asian",
    theme: { ...DEFAULT_THEME, primaryColor: "#B91C1C", secondaryColor: "#991B1B", backgroundColor: "#1A1A1A", surfaceColor: "#262626", textColor: "#FEF2F2", accentColor: "#EAB308", headingFont: "DM Sans", bodyFont: "Inter", layoutStyle: "modern", cardStyle: "glass", borderRadius: "small", headerStyle: "overlay" },
  },
  {
    id: "thai-spice",
    name: "Thai Spice",
    description: "Golden yellows and warm tones. Fragrant and inviting.",
    preview: "linear-gradient(135deg, #FFFBEB 0%, #F59E0B 100%)",
    isPro: true,
    category: "asian",
    theme: { ...DEFAULT_THEME, primaryColor: "#F59E0B", secondaryColor: "#D97706", backgroundColor: "#FFFBEB", surfaceColor: "#FFFFFF", textColor: "#451A03", accentColor: "#DC2626", headingFont: "Montserrat", bodyFont: "Poppins", layoutStyle: "grid", cardStyle: "elevated", borderRadius: "large", imageStyle: "rounded" },
  },

  // --- MOROCCAN ---
  {
    id: "medina-blue",
    name: "Medina Blue",
    description: "Chefchaouen-inspired blues. Traditional Moroccan charm.",
    preview: "linear-gradient(135deg, #EFF6FF 0%, #1D4ED8 100%)",
    isPro: true,
    category: "moroccan",
    theme: { ...DEFAULT_THEME, primaryColor: "#1D4ED8", secondaryColor: "#1E40AF", backgroundColor: "#EFF6FF", surfaceColor: "#FFFFFF", textColor: "#1E3A5F", accentColor: "#C2703E", headingFont: "Playfair Display", bodyFont: "Lato", layoutStyle: "classic", cardStyle: "elevated", borderRadius: "medium", headerStyle: "banner" },
  },
  {
    id: "zellige-mosaic",
    name: "Zellige Mosaic",
    description: "Rich jewel tones. Inspired by Moroccan tilework patterns.",
    preview: "linear-gradient(135deg, #0F172A 0%, #0D9488 50%, #C2703E 100%)",
    isPro: true,
    category: "moroccan",
    theme: { ...DEFAULT_THEME, primaryColor: "#0D9488", secondaryColor: "#C2703E", backgroundColor: "#0F172A", surfaceColor: "#1E293B", textColor: "#F0FDFA", accentColor: "#F59E0B", headingFont: "Cormorant", bodyFont: "Raleway", layoutStyle: "elegant", cardStyle: "glass", borderRadius: "medium", headerStyle: "overlay", spacing: "comfortable" },
  },
  {
    id: "sahara-sand",
    name: "Sahara Sand",
    description: "Desert-inspired warmth. Sandy tones and golden accents.",
    preview: "linear-gradient(135deg, #FEF7EE 0%, #D4A574 100%)",
    isPro: true,
    category: "moroccan",
    theme: { ...DEFAULT_THEME, primaryColor: "#D4A574", secondaryColor: "#B8860B", backgroundColor: "#FEF7EE", surfaceColor: "#FFFBF5", textColor: "#3D2B1F", accentColor: "#C2703E", headingFont: "Lora", bodyFont: "Source Sans 3", layoutStyle: "magazine", cardStyle: "flat", borderRadius: "small", spacing: "spacious", headerStyle: "centered" },
  },
  {
    id: "mint-tea",
    name: "Mint Tea Garden",
    description: "Fresh green and gold. The essence of Moroccan hospitality.",
    preview: "linear-gradient(135deg, #F0FDF4 0%, #15803D 100%)",
    isPro: true,
    category: "moroccan",
    theme: { ...DEFAULT_THEME, primaryColor: "#15803D", secondaryColor: "#166534", backgroundColor: "#F0FDF4", surfaceColor: "#FFFFFF", textColor: "#14532D", accentColor: "#B8860B", headingFont: "Playfair Display", bodyFont: "Nunito", layoutStyle: "classic", cardStyle: "bordered", borderRadius: "medium", headerStyle: "banner" },
  },
];

// ── Font Library ────────────────────────────────────────────

export interface FontOption {
  family: string;
  category: "serif" | "sans-serif" | "display" | "handwriting";
  weights: number[];
}

export const FONT_LIBRARY: FontOption[] = [
  // Serif
  { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Cormorant Garamond", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "Cormorant", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { family: "Merriweather", category: "serif", weights: [300, 400, 700, 900] },
  { family: "Crimson Text", category: "serif", weights: [400, 600, 700] },
  { family: "EB Garamond", category: "serif", weights: [400, 500, 600, 700, 800] },

  // Sans-serif
  { family: "Plus Jakarta Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  { family: "DM Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
  { family: "Source Sans 3", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Inter", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Montserrat", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Lato", category: "sans-serif", weights: [300, 400, 700, 900] },
  { family: "Raleway", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Outfit", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Libre Franklin", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Nunito", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Poppins", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Rubik", category: "sans-serif", weights: [300, 400, 500, 600, 700] },

  // Display
  { family: "Abril Fatface", category: "display", weights: [400] },
  { family: "Josefin Sans", category: "display", weights: [300, 400, 500, 600, 700] },

  // Handwriting
  { family: "Dancing Script", category: "handwriting", weights: [400, 500, 600, 700] },
  { family: "Great Vibes", category: "handwriting", weights: [400] },
];

// ── Validation Constants ────────────────────────────────────

export const FONT_SIZES: FontSize[] = ["small", "medium", "large"];
export const LAYOUT_STYLES: LayoutStyle[] = ["classic", "modern", "grid", "magazine", "minimal", "elegant"];
export const CARD_STYLES: CardStyle[] = ["flat", "elevated", "bordered", "glass"];
export const BORDER_RADII: BorderRadius[] = ["none", "small", "medium", "large", "full"];
export const SPACINGS: Spacing[] = ["compact", "comfortable", "spacious"];
export const IMAGE_STYLES: ImageStyle[] = ["rounded", "square", "circle"];
export const HEADER_STYLES: HeaderStyle[] = ["banner", "minimal", "centered", "overlay"];
