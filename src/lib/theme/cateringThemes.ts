/**
 * Catering Theme Presets
 *
 * Separate from restaurant menu templates — these are designed
 * for event-focused catering pages (weddings, corporate, Ramadan,
 * birthdays, etc.) with elegant, upscale aesthetics.
 */

export type CateringLayoutStyle = "elegant" | "classic" | "modern" | "gallery";
export type CateringCardStyle = "elevated" | "flat" | "bordered" | "glass";
export type CateringBorderRadius = "none" | "small" | "medium" | "large";
export type CateringHeaderStyle = "banner" | "centered" | "overlay" | "split";

export interface CateringTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  layoutStyle: CateringLayoutStyle;
  cardStyle: CateringCardStyle;
  borderRadius: CateringBorderRadius;
  headerStyle: CateringHeaderStyle;
  customCss: string;
}

export const DEFAULT_CATERING_THEME: CateringTheme = {
  primaryColor: "#B8860B",
  secondaryColor: "#8B6914",
  backgroundColor: "#FFFDF7",
  surfaceColor: "#FFFFFF",
  textColor: "#1A1A1A",
  accentColor: "#C2703E",
  headingFont: "Cormorant",
  bodyFont: "EB Garamond",
  layoutStyle: "elegant",
  cardStyle: "elevated",
  borderRadius: "medium",
  headerStyle: "banner",
  customCss: "",
};

export type CateringTemplateCategory =
  | "all"
  | "wedding"
  | "corporate"
  | "ramadan"
  | "birthday"
  | "traditional"
  | "luxury";

export interface CateringThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  theme: CateringTheme;
  isPro: boolean;
  category: CateringTemplateCategory;
}

export const CATERING_THEME_TEMPLATES: CateringThemeTemplate[] = [
  // ── FREE Templates (4) ──────────────────────────────────────

  {
    id: "catering-gold-classic",
    name: "Gold Classic",
    description: "Warm gold on cream. Timeless elegance for any event.",
    preview: "linear-gradient(135deg, #FFFDF7 0%, #B8860B 100%)",
    isPro: false,
    category: "wedding",
    theme: { ...DEFAULT_CATERING_THEME },
  },
  {
    id: "catering-midnight-gala",
    name: "Midnight Gala",
    description: "Dark sophistication. Perfect for formal corporate events.",
    preview: "linear-gradient(135deg, #0F0F1A 0%, #6366F1 100%)",
    isPro: false,
    category: "corporate",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#6366F1",
      secondaryColor: "#4F46E5",
      backgroundColor: "#0F0F1A",
      surfaceColor: "#1A1A2E",
      textColor: "#E8E8F0",
      accentColor: "#F59E0B",
      headingFont: "DM Sans",
      bodyFont: "Inter",
      layoutStyle: "modern",
      cardStyle: "glass",
      borderRadius: "medium",
      headerStyle: "overlay",
    },
  },
  {
    id: "catering-garden-party",
    name: "Garden Party",
    description: "Fresh greens and florals. Light and inviting for outdoor events.",
    preview: "linear-gradient(135deg, #F0FDF4 0%, #22C55E 100%)",
    isPro: false,
    category: "birthday",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#22C55E",
      secondaryColor: "#16A34A",
      backgroundColor: "#F0FDF4",
      surfaceColor: "#FFFFFF",
      textColor: "#14532D",
      accentColor: "#F472B6",
      headingFont: "Playfair Display",
      bodyFont: "Nunito",
      layoutStyle: "gallery",
      cardStyle: "bordered",
      borderRadius: "large",
      headerStyle: "centered",
    },
  },
  {
    id: "catering-royal-riad",
    name: "Royal Riad",
    description: "Moroccan-inspired luxury. Rich tones for traditional celebrations.",
    preview: "linear-gradient(135deg, #FFF8F0 0%, #C2703E 100%)",
    isPro: false,
    category: "traditional",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#C2703E",
      secondaryColor: "#8B4513",
      backgroundColor: "#FFF8F0",
      surfaceColor: "#FFF1E6",
      textColor: "#3D2B1F",
      accentColor: "#B8860B",
      headingFont: "Cormorant",
      bodyFont: "Lora",
      layoutStyle: "classic",
      cardStyle: "elevated",
      borderRadius: "medium",
      headerStyle: "banner",
    },
  },

  // ── PRO Templates (12) ──────────────────────────────────────

  // --- WEDDING ---
  {
    id: "catering-blush-romance",
    name: "Blush Romance",
    description: "Soft pink and rose gold. Dreamy and romantic for weddings.",
    preview: "linear-gradient(135deg, #FFF5F7 0%, #E11D48 100%)",
    isPro: true,
    category: "wedding",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#E11D48",
      secondaryColor: "#BE123C",
      backgroundColor: "#FFF5F7",
      surfaceColor: "#FFFFFF",
      textColor: "#4C0519",
      accentColor: "#D4A574",
      headingFont: "Cormorant Garamond",
      bodyFont: "Raleway",
      layoutStyle: "elegant",
      cardStyle: "flat",
      borderRadius: "small",
      headerStyle: "centered",
    },
  },
  {
    id: "catering-ivory-pearl",
    name: "Ivory & Pearl",
    description: "Pure white elegance. Minimal and refined for luxury weddings.",
    preview: "linear-gradient(135deg, #FEFDFB 0%, #D1C4B2 100%)",
    isPro: true,
    category: "wedding",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#78716C",
      secondaryColor: "#57534E",
      backgroundColor: "#FEFDFB",
      surfaceColor: "#FFFFFF",
      textColor: "#292524",
      accentColor: "#B8860B",
      headingFont: "Cormorant",
      bodyFont: "EB Garamond",
      layoutStyle: "elegant",
      cardStyle: "flat",
      borderRadius: "none",
      headerStyle: "split",
    },
  },

  // --- CORPORATE ---
  {
    id: "catering-executive-navy",
    name: "Executive Navy",
    description: "Professional navy and silver. Commanding presence for business events.",
    preview: "linear-gradient(135deg, #F8FAFC 0%, #1E3A5F 100%)",
    isPro: true,
    category: "corporate",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#1E3A5F",
      secondaryColor: "#1E40AF",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      textColor: "#0F172A",
      accentColor: "#3B82F6",
      headingFont: "DM Sans",
      bodyFont: "Inter",
      layoutStyle: "modern",
      cardStyle: "bordered",
      borderRadius: "small",
      headerStyle: "banner",
    },
  },
  {
    id: "catering-silicon-minimal",
    name: "Silicon Minimal",
    description: "Clean tech aesthetic. Perfect for startup launch events.",
    preview: "linear-gradient(135deg, #FFFFFF 0%, #6B7280 100%)",
    isPro: true,
    category: "corporate",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#111827",
      secondaryColor: "#6B7280",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#F9FAFB",
      textColor: "#111827",
      accentColor: "#8B5CF6",
      headingFont: "Outfit",
      bodyFont: "Outfit",
      layoutStyle: "modern",
      cardStyle: "flat",
      borderRadius: "medium",
      headerStyle: "centered",
    },
  },

  // --- RAMADAN ---
  {
    id: "catering-ramadan-crescent",
    name: "Crescent Moon",
    description: "Deep purple and gold. Spiritual elegance for Ramadan iftar.",
    preview: "linear-gradient(135deg, #1E1033 0%, #F59E0B 100%)",
    isPro: true,
    category: "ramadan",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#F59E0B",
      secondaryColor: "#D97706",
      backgroundColor: "#1E1033",
      surfaceColor: "#2D1B4E",
      textColor: "#F5F3FF",
      accentColor: "#A855F7",
      headingFont: "Playfair Display",
      bodyFont: "Lora",
      layoutStyle: "elegant",
      cardStyle: "glass",
      borderRadius: "medium",
      headerStyle: "overlay",
    },
  },
  {
    id: "catering-ramadan-emerald",
    name: "Emerald Iftar",
    description: "Deep green and gold. Traditional Islamic colors for Ramadan gatherings.",
    preview: "linear-gradient(135deg, #052E16 0%, #B8860B 100%)",
    isPro: true,
    category: "ramadan",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#B8860B",
      secondaryColor: "#8B6914",
      backgroundColor: "#052E16",
      surfaceColor: "#14532D",
      textColor: "#ECFDF5",
      accentColor: "#22C55E",
      headingFont: "Cormorant",
      bodyFont: "EB Garamond",
      layoutStyle: "classic",
      cardStyle: "glass",
      borderRadius: "small",
      headerStyle: "banner",
    },
  },

  // --- BIRTHDAY ---
  {
    id: "catering-confetti-pop",
    name: "Confetti Pop",
    description: "Vibrant and fun. Colorful energy for birthday celebrations.",
    preview: "linear-gradient(135deg, #FEF9C3 0%, #F472B6 50%, #818CF8 100%)",
    isPro: true,
    category: "birthday",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#F472B6",
      secondaryColor: "#818CF8",
      backgroundColor: "#FEF9C3",
      surfaceColor: "#FFFFFF",
      textColor: "#1E1B4B",
      accentColor: "#FB923C",
      headingFont: "Montserrat",
      bodyFont: "Poppins",
      layoutStyle: "gallery",
      cardStyle: "elevated",
      borderRadius: "large",
      headerStyle: "centered",
    },
  },
  {
    id: "catering-elegant-milestone",
    name: "Elegant Milestone",
    description: "Sophisticated dark theme. For milestone birthdays and anniversaries.",
    preview: "linear-gradient(135deg, #0A0A0A 0%, #C9A84C 100%)",
    isPro: true,
    category: "birthday",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#C9A84C",
      secondaryColor: "#B8962E",
      backgroundColor: "#0A0A0A",
      surfaceColor: "#171717",
      textColor: "#FAFAFA",
      accentColor: "#E07A5F",
      headingFont: "Cormorant Garamond",
      bodyFont: "Raleway",
      layoutStyle: "elegant",
      cardStyle: "glass",
      borderRadius: "none",
      headerStyle: "overlay",
    },
  },

  // --- TRADITIONAL MOROCCAN ---
  {
    id: "catering-diffa-royale",
    name: "Diffa Royale",
    description: "Jewel-toned opulence. For grand Moroccan diffa celebrations.",
    preview: "linear-gradient(135deg, #0F172A 0%, #0D9488 50%, #C2703E 100%)",
    isPro: true,
    category: "traditional",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#0D9488",
      secondaryColor: "#C2703E",
      backgroundColor: "#0F172A",
      surfaceColor: "#1E293B",
      textColor: "#F0FDFA",
      accentColor: "#F59E0B",
      headingFont: "Playfair Display",
      bodyFont: "Lora",
      layoutStyle: "elegant",
      cardStyle: "glass",
      borderRadius: "medium",
      headerStyle: "overlay",
    },
  },
  {
    id: "catering-medina-feast",
    name: "Medina Feast",
    description: "Blue and terracotta. Authentic Moroccan palette for festive gatherings.",
    preview: "linear-gradient(135deg, #EFF6FF 0%, #1D4ED8 100%)",
    isPro: true,
    category: "traditional",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#1D4ED8",
      secondaryColor: "#1E40AF",
      backgroundColor: "#EFF6FF",
      surfaceColor: "#FFFFFF",
      textColor: "#1E3A5F",
      accentColor: "#C2703E",
      headingFont: "Cormorant",
      bodyFont: "Lato",
      layoutStyle: "classic",
      cardStyle: "elevated",
      borderRadius: "medium",
      headerStyle: "banner",
    },
  },

  // --- LUXURY ---
  {
    id: "catering-black-diamond",
    name: "Black Diamond",
    description: "Pure black luxury. Ultra-exclusive for VIP events.",
    preview: "linear-gradient(135deg, #0A0A0A 0%, #525252 100%)",
    isPro: true,
    category: "luxury",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#FAFAFA",
      secondaryColor: "#A3A3A3",
      backgroundColor: "#0A0A0A",
      surfaceColor: "#171717",
      textColor: "#FAFAFA",
      accentColor: "#C9A84C",
      headingFont: "Cormorant Garamond",
      bodyFont: "Raleway",
      layoutStyle: "elegant",
      cardStyle: "glass",
      borderRadius: "none",
      headerStyle: "overlay",
    },
  },
  {
    id: "catering-champagne-soiree",
    name: "Champagne Soir\u00e9e",
    description: "Sparkling champagne tones. Effervescent luxury for galas.",
    preview: "linear-gradient(135deg, #FFFDF7 0%, #D4A574 50%, #B8860B 100%)",
    isPro: true,
    category: "luxury",
    theme: {
      ...DEFAULT_CATERING_THEME,
      primaryColor: "#B8860B",
      secondaryColor: "#8B6914",
      backgroundColor: "#FFFDF7",
      surfaceColor: "#FFFEF5",
      textColor: "#1A1A1A",
      accentColor: "#7C2D12",
      headingFont: "Cormorant",
      bodyFont: "EB Garamond",
      layoutStyle: "classic",
      cardStyle: "flat",
      borderRadius: "small",
      headerStyle: "split",
    },
  },
];
