-- Loyalty programs
CREATE TABLE public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stamps_required INT NOT NULL DEFAULT 10,
  reward_description TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'free_item', -- free_item, discount_percent, discount_amount
  reward_value INT, -- percent or cents depending on type
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#D4A853',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer loyalty cards (stamps earned)
CREATE TABLE public.loyalty_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  customer_identifier TEXT NOT NULL, -- phone number or email
  stamps_collected INT NOT NULL DEFAULT 0,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, customer_identifier)
);

-- Stamp history (audit trail)
CREATE TABLE public.loyalty_stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  stamped_by UUID REFERENCES public.profiles(id), -- staff who gave stamp
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_programs_menu_id ON public.loyalty_programs(menu_id);
CREATE INDEX idx_loyalty_cards_program_id ON public.loyalty_cards(program_id);
CREATE INDEX idx_loyalty_cards_customer ON public.loyalty_cards(customer_identifier);
CREATE INDEX idx_loyalty_stamps_card_id ON public.loyalty_stamps(card_id);
