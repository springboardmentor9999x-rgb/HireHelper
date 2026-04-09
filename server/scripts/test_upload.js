require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || ''
);

async function testUpload() {
    console.log('🧪 Testing Supabase upload...');
    try {
        const dummyBuffer = Buffer.from('test string');
        const fileName = `test_${Date.now()}.txt`;
        const filePath = `test/${fileName}`;

        const { data, error } = await supabase.storage
            .from('profile')
            .upload(filePath, dummyBuffer, {
                contentType: 'text/plain',
                upsert: true
            });

        if (error) {
            console.error('❌ Upload Failed:', {
                message: error.message,
                name: error.name,
                status: error.status,
                cause: error.cause
            });
            
            if (error.message.includes('new row violates row-level security policy')) {
                console.log('\n💡 RECOMMENDATION: You need to add a storage policy in your Supabase Dashboard.');
                console.log('1. Go to Storage -> Buckets -> profile');
                console.log('2. Click on "Policies"');
                console.log('3. Add a policy for "INSERT" that allows anonymous or authenticated access.');
            }
        } else {
            console.log('✅ Upload Successful!', data);
            
            // Try to delete it now to clean up
            await supabase.storage.from('profile').remove([filePath]);
            console.log('🗑️ Test file removed.');
        }
    } catch (err) {
        console.error('💥 Unexpected Error:', err.message);
    }
}

testUpload();
