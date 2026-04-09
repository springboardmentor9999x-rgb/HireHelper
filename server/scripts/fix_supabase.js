require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || ''
);

async function fixSupabase() {
    console.log('🔍 Checking Supabase storage...');
    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) throw listError;

        const bucketName = 'profiles';
        const profilesBucket = buckets.find(b => b.name === bucketName);

        if (!profilesBucket) {
            console.log(`📁 Bucket "${bucketName}" not found. Creating...`);
            const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
                fileSizeLimit: 5242880 // 5MB
            });
            if (createError) throw createError;
            console.log('✅ Bucket created successfully.');
        } else {
            console.log(`✅ Bucket "${bucketName}" already exists.`);
            if (!profilesBucket.public) {
                console.log('🔓 Bucket is private. Updating to public...');
                const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
                    public: true
                });
                if (updateError) throw updateError;
                console.log('✅ Bucket updated to public.');
            }
        }

        // Check if policies are set (Supabase Storage requires policies for uploads even if public for reads)
        // Since we can't easily check policies via JS client in all cases, we'll assume the user
        // needs to set up a 'Public Insert/Select' policy in the Supabase Dashboard if this still fails.
        // However, usually creating a public bucket via API might handle some defaults depending on version.
        
        console.log('🚀 Supabase Storage should be ready!');
    } catch (err) {
        console.error('❌ Error fixing Supabase:', err.message);
    }
}

fixSupabase();
