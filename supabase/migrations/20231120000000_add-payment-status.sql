-- Add payment tracking fields to orders for COD (Cash on Delivery) flow
-- 84% of Moroccan consumers prefer cash, so this is the primary payment method.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_note TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
