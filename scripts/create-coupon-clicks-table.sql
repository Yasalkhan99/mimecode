-- Create coupon_clicks table for tracking coupon/deal usage
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS coupon_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id TEXT,
  coupon_code TEXT,
  coupon_type TEXT, -- 'code' or 'deal'
  store_name TEXT,
  store_id TEXT,
  
  -- User Info
  ip_address TEXT,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  
  -- Device Info
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  
  -- Referrer
  referrer TEXT,
  page_url TEXT,
  
  -- Timestamps
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coupon_clicks_clicked_at ON coupon_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupon_clicks_coupon_id ON coupon_clicks(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_clicks_store_name ON coupon_clicks(store_name);
CREATE INDEX IF NOT EXISTS idx_coupon_clicks_country ON coupon_clicks(country);
CREATE INDEX IF NOT EXISTS idx_coupon_clicks_ip ON coupon_clicks(ip_address);

-- Enable Row Level Security (optional - for public access)
ALTER TABLE coupon_clicks ENABLE ROW LEVEL SECURITY;

-- Allow insert from anyone (for tracking)
CREATE POLICY "Allow insert for tracking" ON coupon_clicks
  FOR INSERT WITH CHECK (true);

-- Allow select only for authenticated users (admin)
CREATE POLICY "Allow select for admin" ON coupon_clicks
  FOR SELECT USING (true);

-- Grant permissions
GRANT INSERT ON coupon_clicks TO anon;
GRANT SELECT ON coupon_clicks TO authenticated;

