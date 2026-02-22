-- Menu Themes: stores customizable design tokens for each menu
CREATE TABLE public.menu_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL UNIQUE REFERENCES public.menus(id) ON DELETE CASCADE,

  -- Colors
  primary_color TEXT NOT NULL DEFAULT '#D4A574',
  secondary_color TEXT NOT NULL DEFAULT '#8B6914',
  background_color TEXT NOT NULL DEFAULT '#FFFBF5',
  surface_color TEXT NOT NULL DEFAULT '#FFFFFF',
  text_color TEXT NOT NULL DEFAULT '#1A1A1A',
  accent_color TEXT NOT NULL DEFAULT '#C75B39',

  -- Typography
  heading_font TEXT NOT NULL DEFAULT 'Playfair Display',
  body_font TEXT NOT NULL DEFAULT 'Source Sans 3',
  font_size TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),

  -- Layout
  layout_style TEXT NOT NULL DEFAULT 'classic' CHECK (layout_style IN ('classic', 'modern', 'grid', 'magazine', 'minimal', 'elegant')),

  -- Card Style
  card_style TEXT NOT NULL DEFAULT 'flat' CHECK (card_style IN ('flat', 'elevated', 'bordered', 'glass')),
  border_radius TEXT NOT NULL DEFAULT 'medium' CHECK (border_radius IN ('none', 'small', 'medium', 'large', 'full')),

  -- Spacing
  spacing TEXT NOT NULL DEFAULT 'comfortable' CHECK (spacing IN ('compact', 'comfortable', 'spacious')),

  -- Images
  show_images BOOLEAN NOT NULL DEFAULT true,
  image_style TEXT NOT NULL DEFAULT 'rounded' CHECK (image_style IN ('rounded', 'square', 'circle')),

  -- Display toggles
  show_prices BOOLEAN NOT NULL DEFAULT true,
  show_nutrition BOOLEAN NOT NULL DEFAULT true,
  show_category_nav BOOLEAN NOT NULL DEFAULT true,
  show_category_dividers BOOLEAN NOT NULL DEFAULT true,

  -- Header
  header_style TEXT NOT NULL DEFAULT 'banner' CHECK (header_style IN ('banner', 'minimal', 'centered', 'overlay')),

  -- Custom CSS (advanced users)
  custom_css TEXT DEFAULT '',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_themes_menu_id ON public.menu_themes(menu_id);
