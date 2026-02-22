-- Add user roles enum
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'manager', 'staff', 'user');

-- Add role to profiles
ALTER TABLE public.profiles
  ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';

-- Add currency to menus (default MAD for Morocco)
ALTER TABLE public.menus
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MAD';

-- Staff members table (per-restaurant staff management)
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'staff',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(menu_id, user_id)
);

-- Orders table for sales tracking
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  order_number SERIAL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  customer_name TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  table_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES public.dishes(id) ON DELETE SET NULL,
  dish_variant_id UUID REFERENCES public.dish_variants(id) ON DELETE SET NULL,
  dish_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL,
  total_price INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_staff_members_menu_id ON public.staff_members(menu_id);
CREATE INDEX idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX idx_orders_menu_id ON public.orders(menu_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_dish_id ON public.order_items(dish_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Update Arabic language flag to Morocco
UPDATE public.languages SET flag_url = 'https://flagsapi.com/MA/flat/64.png', iso_code = 'MA'
WHERE name = 'Arabic';
