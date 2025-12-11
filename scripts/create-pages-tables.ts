/**
 * Migration Script: Create Privacy Policy and Terms & Conditions Tables
 * 
 * This script creates the privacy_policy and terms_and_conditions tables in Supabase.
 * 
 * Usage:
 * npm run migrate:create-pages-tables
 * or
 * npx tsx scripts/create-pages-tables.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
const envPath = resolve(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.error(`   Expected at: ${envPath}`);
  process.exit(1);
}

const dotenvResult = config({ path: envPath });

if (dotenvResult.error) {
  console.error('❌ Error loading .env.local:', dotenvResult.error);
  process.exit(1);
}

console.log('✅ Loaded .env.local file\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// SQL to create tables
const createTablesSQL = `
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

-- Enable Row Level Security
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
`;

async function createTables() {
  console.log('🚀 Creating Privacy Policy and Terms & Conditions tables...\n');
  console.log('='.repeat(60));

  try {
    // Execute SQL using Supabase RPC
    // Note: Supabase REST API doesn't support DDL directly
    // We need to use the PostgREST API or execute via SQL editor
    // For now, we'll check if tables exist and provide instructions
    
    console.log('⚠️  Supabase REST API does not support DDL operations (CREATE TABLE).');
    console.log('   You need to run the SQL in Supabase SQL Editor.\n');
    console.log('📋 SQL to execute:\n');
    console.log(createTablesSQL);
    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Click "New query"');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run" or press Ctrl+Enter\n');

    // Try to verify tables exist after user runs SQL
    console.log('⏳ Checking if tables exist...\n');
    
    const { data: privacyData, error: privacyError } = await supabase
      .from('privacy_policy')
      .select('id')
      .limit(1);

    const { data: termsData, error: termsError } = await supabase
      .from('terms_and_conditions')
      .select('id')
      .limit(1);

    if (!privacyError && !termsError) {
      console.log('✅ Both tables exist and are ready!');
      return { success: true };
    }

    if (privacyError && privacyError.code === '42P01') {
      console.log('❌ privacy_policy table does not exist yet');
    } else if (!privacyError) {
      console.log('✅ privacy_policy table exists');
    }

    if (termsError && termsError.code === '42P01') {
      console.log('❌ terms_and_conditions table does not exist yet');
    } else if (!termsError) {
      console.log('✅ terms_and_conditions table exists');
    }

    console.log('\n💡 After running the SQL in Supabase, run this script again to verify.');
    return { success: false, needsSQL: true };

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run migration
createTables()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Migration complete!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Please run the SQL in Supabase SQL Editor first.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

