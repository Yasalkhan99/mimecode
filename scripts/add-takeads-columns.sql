-- Add Takeads-specific columns to Supabase tables
-- Run this in Supabase SQL Editor if you want to store additional Takeads data

-- ============================================
-- STORES TABLE - Additional Takeads columns
-- ============================================

-- Currency and location info
ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency_code TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS country_codes TEXT[];
ALTER TABLE stores ADD COLUMN IF NOT EXISTS domains TEXT[];

-- Commission and payment info
ALTER TABLE stores ADD COLUMN IF NOT EXISTS average_commission NUMERIC;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_models TEXT[];
ALTER TABLE stores ADD COLUMN IF NOT EXISTS deeplink_allowed BOOLEAN;

-- ============================================
-- COUPONS TABLE - Additional Takeads columns
-- ============================================

-- Language and location info
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS language_codes TEXT[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS country_codes TEXT[];

-- Date fields (if not already using Coupon Expiry)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Note: Most columns already exist from previous migrations
-- This file adds only the Takeads-specific additional fields

