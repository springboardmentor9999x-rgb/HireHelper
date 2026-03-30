const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';
const EMAIL = 'gagankumarreddy.b@gmail.com';
const PASSWORD = 'password123'; // Assuming this is the test password

async function diagnose() {
    console.log('--- Starting API Diagnostics ---');
    try {
        console.log('1. Testing Health Check...');
        const health = await axios.get(`${API_BASE}/health`);
        console.log('✅ Health status:', health.data);

        console.log('2. Trying to Login...');
        let token;
        try {
            const login = await axios.post(`${API_BASE}/auth/login`, {
                email: EMAIL,
                password: PASSWORD
            });
            token = login.data.token;
            console.log('✅ Login successful');
        } catch (loginErr) {
            console.warn('⚠️ Login failed (check if email/pass matches):', loginErr.response?.data || loginErr.message);
            // If login fails, we can't test tasks, but let's try to get a list of users to find a valid one
            return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('3. Fetching My Tasks...');
        const startMy = Date.now();
        const myTasks = await axios.get(`${API_BASE}/tasks/my`, config);
        console.log(`✅ My Tasks fetched in ${Date.now() - startMy}ms:`, myTasks.data.tasks.length, 'tasks');

        console.log('4. Fetching Feed...');
        const startFeed = Date.now();
        const feed = await axios.get(`${API_BASE}/tasks`, config);
        console.log(`✅ Feed fetched in ${Date.now() - startFeed}ms:`, feed.data.tasks.length, 'tasks');

    } catch (err) {
        if (err.code === 'ECONNABORTED' || !err.response) {
            console.error('❌ Request HANGED or failed to connect:', err.message);
        } else {
            console.error('❌ API Error:', err.response.status, err.response.data);
        }
    }
}

diagnose();
