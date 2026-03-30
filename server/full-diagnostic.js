const http = require('http');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

const post = (path, data, token = null) => {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
        req.setTimeout(5000);
        req.write(payload);
        req.end();
    });
};

const get = (path, token = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {}
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
        req.setTimeout(5000);
        req.end();
    });
};

async function runDiagnostic() {
    console.log('--- Starting Full Flow Diagnostic ---');
    try {
        // 1. Health Check
        console.log('1. Health Check...');
        const health = await get('/api/health');
        console.log('Health Status:', health.status, health.data);

        // 2. Login (using a dummy account if possible, or just attempt)
        // Note: You'll need credentials. Let's try to register a temporary user if possible.
        // Or just use the email found in DB check: gagankumarreddy.b@gmail.com
        console.log('2. Attempting Login...');
        const login = await post('/api/auth/login', { 
            email: 'gagankumarreddy.b@gmail.com', 
            password: 'password123' // Adjust if you know the password, or skip to next
        });
        
        if (login.status !== 200) {
            console.warn('Login failed (status ' + login.status + '). Diagnostic limited.');
            return;
        }

        const token = login.data.token;
        console.log('Logged in successfully.');

        // 3. Get My Tasks
        console.log('3. Fetching My Tasks...');
        const myTasks = await get('/api/tasks/my', token);
        console.log('My Tasks Status:', myTasks.status);
        if (myTasks.data.success) {
            console.log('Fetched', myTasks.data.tasks.length, 'tasks.');
        } else {
            console.error('Failed to fetch my tasks:', myTasks.data);
        }

        // 4. Get Feed
        console.log('4. Fetching Feed...');
        const feed = await get('/api/tasks', token);
        console.log('Feed Status:', feed.status);
        if (feed.data.success) {
            console.log('Fetched', feed.data.tasks.length, 'feed tasks.');
        } else {
            console.error('Failed to fetch feed:', feed.data);
        }

    } catch (err) {
        console.error('❌ Diagnostic Error:', err.message);
    }
}

runDiagnostic();
