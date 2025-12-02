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

-- Enable Row Level Security (RLS) - Allow public read, admin write
ALTER TABLE privacy_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access" ON privacy_policy
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON terms_and_conditions
  FOR SELECT
  USING (true);

