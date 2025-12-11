-- Migration: Create Privacy Policy and Terms & Conditions Tables
-- Created: 2025-01-01
-- Description: Creates tables for managing privacy policy and terms & conditions content

-- Create privacy_policy table
CREATE TABLE IF NOT EXISTS privacy_policy (
  id TEXT PRIMARY KEY DEFAULT 'main',
  title TEXT NOT NULL DEFAULT 'Privacy Policy',
  content TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT 'privacy@mimecode.com',
  contact_website TEXT NOT NULL DEFAULT 'www.mimecode.com',
  last_updated TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create terms_and_conditions table
CREATE TABLE IF NOT EXISTS terms_and_conditions (
  id TEXT PRIMARY KEY DEFAULT 'main',
  title TEXT NOT NULL DEFAULT 'Terms and Conditions',
  content TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT 'legal@mimecode.com',
  contact_website TEXT NOT NULL DEFAULT 'www.mimecode.com',
  last_updated TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_privacy_policy_id ON privacy_policy(id);
CREATE INDEX IF NOT EXISTS idx_terms_and_conditions_id ON terms_and_conditions(id);

-- Enable Row Level Security (RLS)
ALTER TABLE privacy_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON privacy_policy;
DROP POLICY IF EXISTS "Allow public read access" ON terms_and_conditions;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON privacy_policy
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON terms_and_conditions
  FOR SELECT
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE privacy_policy IS 'Stores privacy policy content managed from admin panel';
COMMENT ON TABLE terms_and_conditions IS 'Stores terms and conditions content managed from admin panel';

