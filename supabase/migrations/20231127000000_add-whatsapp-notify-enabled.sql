-- Add WhatsApp notification toggle for restaurant owners
ALTER TABLE menus ADD COLUMN IF NOT EXISTS whatsapp_notify_enabled BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS policy for the new column (covered by existing menus policies)
COMMENT ON COLUMN menus.whatsapp_notify_enabled IS 'When enabled, order creation returns a WhatsApp notification URL for the restaurant owner';
