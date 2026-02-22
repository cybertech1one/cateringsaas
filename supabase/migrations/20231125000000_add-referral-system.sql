-- Add referral status enum
DO $$ BEGIN
  CREATE TYPE public.referral_status AS ENUM ('pending', 'completed', 'rewarded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  status public.referral_status NOT NULL DEFAULT 'pending',
  reward_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ(6)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON public.referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own referrals
CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert own referrals"
  ON public.referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update own referrals"
  ON public.referrals
  FOR UPDATE
  USING (auth.uid() = referrer_id);

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access to referrals"
  ON public.referrals
  FOR ALL
  USING (auth.role() = 'service_role');
