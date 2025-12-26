const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function listBuckets() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Supabase credentials missing');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log('Available buckets:');
    data.forEach(bucket => {
        console.log(`- ${bucket.name} (Public: ${bucket.public})`);
    });
}

listBuckets();
