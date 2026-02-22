-- Add WhatsApp number column to menus for direct ordering
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
