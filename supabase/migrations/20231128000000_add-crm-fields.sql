-- Add CRM integration fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crm_api_key TEXT,
  ADD COLUMN IF NOT EXISTS crm_workspace_url TEXT,
  ADD COLUMN IF NOT EXISTS crm_auto_sync BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS crm_last_synced_at TIMESTAMPTZ;
