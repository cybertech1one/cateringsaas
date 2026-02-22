-- ============================================================
-- Migration: Extend Menu Schedules for Per-Category Scheduling
-- Adds: category_id, name, is_recurring, start_date, end_date
-- ============================================================

-- Add new columns to menu_schedules
ALTER TABLE public.menu_schedules
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Index for category-level schedule lookups
CREATE INDEX IF NOT EXISTS idx_menu_schedules_category_id ON public.menu_schedules(category_id);

-- Index for date-range queries on one-time schedules
CREATE INDEX IF NOT EXISTS idx_menu_schedules_dates ON public.menu_schedules(start_date, end_date);

-- Index for active schedule filtering
CREATE INDEX IF NOT EXISTS idx_menu_schedules_is_active ON public.menu_schedules(is_active);
