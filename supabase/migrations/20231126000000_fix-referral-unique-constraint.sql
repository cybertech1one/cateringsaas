-- Fix: Replace single-column UNIQUE on referral_code with compound UNIQUE
-- on (referral_code, referred_email). This allows multiple referral tracking
-- rows to share the same referral code (one seed row per code + one row per
-- referred user), while preventing duplicate referrals for the same email
-- under the same code.

-- Drop the old single-column unique constraint
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_referral_code_key;

-- Add compound unique constraint (code + email)
-- The seed row has referred_email = '' so (code, '') is always unique.
-- Each tracking row has a real email so (code, email) prevents duplicates.
ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_referral_code_referred_email_key
  UNIQUE (referral_code, referred_email);
